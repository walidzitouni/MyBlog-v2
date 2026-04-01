---
title: "Lost Some Binary"
slug: v1tctf-2025-lost-some-binary
excerpt: "LSB Steganography in binary data"
coverImage: "https://images.unsplash.com/photo-1562813733-b31f71025d54?w=800"
coverImageAlt: "Lost Some Binary - V1t CTF 2025 writeup"
categories:
  - V1t CTF 2025
  - Crypto
  - LSB
  - Steganography
date: 2025-01-10
showToc: true
---

## Challenge

A long sequence of 8-bit binary bytes is given:

```
01001000 01101001 01101001 01101001 00100000 01101101 01100001 01101110 ...
```

When converted directly to ASCII (byte -> char), it prints a readable message:

```
Hiii man,how r u ?Is it :))))Rawr-^^[] LSB{><}!LSBLSB---v1t {135900_13370}
```

Key hints inside:

- `LSB{><}!` and repeated `LSB` strongly suggest Least Significant Bit steganography.
- The `v1t {135900_13370}` at the end looks decoy-ish, nudging you away from the plain ASCII.

## Solution

Interpret each 8-bit byte, take its least significant bit (rightmost bit), concatenate all LSBs into a bitstring, then re-slice into 8-bit groups and convert back to ASCII.

### Python Extractor

```python
#!/usr/bin/env python3
binary_data = """01001000 01101001 01101001 01101001 00100000 01101101 01100001 01101110 00101100 01101000 01101111 01110111 00100000 01110010 00100000 01110101 00100000 00111111 01001001 01110011 00100000 01101001 01110100 00100000 00111010 00101001 00101001 00101001 00101001 01010010 01100001 01110111 01110010 00101101 01011110 01011110 01011011 01011101 00100000 00100000 01001100 01010011 01000010 01111011 00111110 00111100 01111101 00100001 01001100 01010011 01000010 01111110 01111110 01001100 01010011 01000010 01111110 01111110 00101101 00101101 00101101 01110110 00110001 01110100 00100000 00100000 01111011 00110001 00110011 00110101 00111001 00110000 00110000 01011111 00110001 00110011 00110011 00110111 00110000 01111101"""

# Split into bytes and take the last bit of each byte
bytes_list = binary_data.split()
lsb_bits = ''.join(b[-1] for b in bytes_list)

# Group into 8 and convert to characters
chars = [chr(int(lsb_bits[i:i+8], 2)) for i in range(0, len(lsb_bits), 8)]
flag = ''.join(chars)

print(flag)   # v1t{LSB:>}
```

### Why it Works

- Each original 8-bit chunk encodes one visible ASCII character (the decoy message).
- The author hid an additional message in the LSB of each byte.
- Collecting those LSBs builds a secondary binary message that decodes to the actual flag.

## Flag

```
v1t{LSB:>}
```
