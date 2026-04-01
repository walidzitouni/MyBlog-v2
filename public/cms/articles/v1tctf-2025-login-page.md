---
title: "Login Page"
slug: v1tctf-2025-login-page
excerpt: "Client-side SHA-256 hash cracking authentication bypass"
coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800"
coverImageAlt: "Login Page - V1t CTF 2025 writeup"
categories:
  - V1t CTF 2025
  - Web
  - Crypto
  - Hash Cracking
date: 2025-01-10
---

## Challenge Description

We're given an HTML login page with client-side JavaScript authentication using SHA-256 hashes.

## Source Code Analysis

Looking at the HTML source, we find the authentication logic:

```html
<script>
    async function toHex(buffer) {
      const bytes = new Uint8Array(buffer);
      let hex = '';
      for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
      }
      return hex;
    }

    async function sha256Hex(str) {
      const enc = new TextEncoder();
      const data = enc.encode(str);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return toHex(digest);
    }

    (async () => {
      // Target hashes
      const ajnsdjkamsf = 'ba773c013e5c07e8831bdb2f1cee06f349ea1da550ef4766f5e7f7ec842d836e';
      const lanfffiewnu = '48d2a5bbcf422ccd1b69e2a82fb90bafb52384953e77e304bef856084be052b6';

      const username = prompt('Enter username:');
      const password = prompt('Enter password:');

      const uHash = await sha256Hex(username);
      const pHash = await sha256Hex(password);

      if (timingSafeEqualHex(uHash, ajnsdjkamsf) &&
          timingSafeEqualHex(pHash, lanfffiewnu)) {
        alert(username+ '{'+password+'}');
      } else {
        alert('Invalid credentials');
      }
    })();
</script>
```

## Solution

The authentication compares SHA-256 hashes of the username and password against hardcoded values. We need to crack these hashes:

- Username hash: `ba773c013e5c07e8831bdb2f1cee06f349ea1da550ef4766f5e7f7ec842d836e`
- Password hash: `48d2a5bbcf422ccd1b69e2a82fb90bafb52384953e77e304bef856084be052b6`

### Using CrackStation

Running these hashes through [CrackStation](https://crackstation.net) or hashcat:

- `ba773c01...` -> **v1t**
- `48d2a5bb...` -> **p4ssw0rd**

## Flag

The flag format is `username{password}`:

```
v1t{p4ssw0rd}
```

## Lessons Learned

- Never do authentication client-side with hardcoded hashes
- Common passwords are easily cracked via rainbow tables
- CrackStation and similar services can quickly reverse weak hashes
