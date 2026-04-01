---
title: "Addition"
slug: amateurctf-2025-addition
excerpt: "RSA with e=3 and additive relation - Franklin-Reiter related-message attack"
coverImage: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800"
coverImageAlt: "Addition - AmateursCTF 2025 CTF writeup"
categories:
  - AmateursCTF 2025
  - Crypto
  - RSA
  - Franklin-Reiter
date: 2025-01-22
showToc: true
---

> it does addition

**330 pts / 17 solves**

## Challenge Overview

The server provides RSA with e=3 and an additive relation between encryptions:

- The secret flag is encoded as an integer F
- The server computes: c_s = (F + s)^3 mod n
- We control s

This matches the **Franklin-Reiter related-message attack** on RSA with e=3.

## Crypto Background: Franklin-Reiter (e = 3)

For two related plaintexts:

- C1 = M^3 mod n
- C2 = (M + S)^3 mod n

With known S, there's a closed-form solution:

```
M = S * (2C1 + C2 - S^3) * (C2 - C1 + 2S^3)^-1 (mod n)
```

## Attack Plan

1. Query with s=0 - candidates for C1
2. Query with s=1 - candidates for C2
3. Brute-force all (c1, c2) pairs
4. For each candidate m, check if pow(m, 3, n) == c1
5. If valid, extract the flag from m

## Exploit Script

```python
from pwn import *
from Crypto.Util.number import inverse, long_to_bytes
import ast

def solve_franklin_reiter(c1, c2, s, n):
    try:
        num = s * (2 * c1 + c2 - s**3)
        den = c2 - c1 + 2 * s**3
        den_inv = inverse(den, n)
        return (num * den_inv) % n
    except ValueError:
        return None

r = remote('amt.rs', 42963)
line = r.recvline().decode().strip()
n, e = ast.literal_eval(line.split('=')[1].strip())

c_zeroes, c_ones = [], []
for _ in range(400):
    r.sendlineafter(b'scramble the flag: ', b'0')
    r.recvline()
    c_zeroes.append(int(r.recvline().decode().split('=')[1]))

    r.sendlineafter(b'scramble the flag: ', b'1')
    r.recvline()
    c_ones.append(int(r.recvline().decode().split('=')[1]))

r.close()

for c1 in c_zeroes:
    for c2 in c_ones:
        m = solve_franklin_reiter(c1, c2, 1, n)
        if m and pow(m, 3, n) == c1:
            flag_long = m >> 256
            print(long_to_bytes(flag_long, 72).rstrip(b'\x00').decode())
            exit()
```

## Flag

```
amateursCTF{1_h0p3_you_didnT_qU3ry_Th3_s3RVer_100k_tim3s_1b9490c255fe83}
```
