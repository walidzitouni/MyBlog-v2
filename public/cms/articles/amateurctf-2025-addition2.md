---
title: "Addition 2"
slug: amateurctf-2025-addition2
excerpt: "RSA Linearization Attack using Continued Fractions"
coverImage: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800"
coverImageAlt: "Addition 2 - AmateursCTF 2025 CTF writeup"
categories:
  - AmateursCTF 2025
  - Crypto
  - RSA
  - Continued Fractions
date: 2025-01-22
showToc: true
---

**330 pts**

## Challenge Setup

- **Flag Setup:** The flag is left-shifted by 256 bits (F)
- **Modulus:** Standard 2048-bit RSA modulus N
- **Encryption:** m = F + r (where r is random 256-bit), returns c = (F + r)^3 mod N

## Vulnerability Analysis

Key observation about sizes:

- Flag (F) is ~2^832
- Random padding (r) is small: 2^256
- Modulus (N) is 2^2048
- Exponent e = 3

With scramble=0: C = (F + r)^3 mod N

Since (F+r)^3 ~ 2^2496 and r is very small compared to F, the integer quotient k (how many times it wraps around N) remains **constant** for all messages!

## Linearization Attack

Taking two ciphertexts C1 and C2 with random nonces r1 and r2:

```
DC = C1 - C2 = (F+r1)^3 - (F+r2)^3 ~ 3F^2(r1 - r2)
```

The difference between ciphertexts is **linearly proportional** to the difference between nonces!

## Attack Strategy

1. **Collect Samples:** Request 3 ciphertexts with scramble=0
2. **Calculate Differences:**
   - D1 = C1 - C2 ~ 3F^2(r1 - r2)
   - D2 = C2 - C3 ~ 3F^2(r2 - r3)
3. **Eliminate Unknown:** D1/D2 ~ (r1 - r2)/(r2 - r3)
4. **Recover Nonces:** Use **Continued Fractions** on D1/D2 to find integer nonce differences
5. **Solve for Flag:** Slope = D1/Dr ~ 3F^2, then F ~ sqrt(Slope/3)

## Solution Script

```python
from pwn import *
from Crypto.Util.number import long_to_bytes
import math

def get_rational_approximation(num, den):
    convergents = []
    x_num, x_den = abs(num), abs(den)
    p_2, q_2 = 0, 1
    p_1, q_1 = 1, 0

    while x_den != 0:
        a = x_num // x_den
        p = a * p_1 + p_2
        q = a * q_1 + q_2
        if q.bit_length() > 265:
            break
        convergents.append((p, q))
        x_num, x_den = x_den, x_num % x_den
        p_2, q_2 = p_1, q_1
        p_1, q_1 = p, q
    return convergents[-1] if convergents else (0, 1)

r = remote('amt.rs', 45157)
# Parse n,e and collect 3 samples...
# ... (connection code)

diffs = [ciphertexts[i+1] - ciphertexts[i] for i in range(2)]
dr1, dr2 = get_rational_approximation(diffs[0], diffs[1])
slope = abs(diffs[0]) // abs(dr1)
F = math.isqrt(slope // 3)
flag_int = F >> 256
print(long_to_bytes(flag_int).decode())
```

## Flag

```
amateursCTF{n0_th3_fl4g_1s_n0T_th3_Same_1f_y0U_w3r3_w0ndeRing_533e72a10}
```
