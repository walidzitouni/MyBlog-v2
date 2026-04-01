---
title: "Shredder"
slug: buckeyectf-2025-shredder
excerpt: "Reconstructing a shredded PNG file using CRC validation and DFS"
coverImage: "https://images.unsplash.com/photo-1562813733-b31f71025d54?w=800"
coverImageAlt: "Shredder - BuckeyeCTF 2025 CTF writeup"
categories:
  - BuckeyeCTF 2025
  - Forensics
  - PNG
  - File Recovery
date: 2025-01-18
showToc: true
---

> Always remember to shred your documents before throwing them out! In case you don't have a document shredder, you can use mine! I even attached an example shredded document to show that it's impossible to recover the original!

**379 pts / 55 solves**

## Initial Analysis

We were given a C source file `shredder.c` and a shredded file `document.png.shredded`.

Reading the C code revealed the shredding algorithm:

1. Reads an input file (the original PNG)
2. Divides it into N equal chunks
3. Randomly shuffles these chunks using `rand()`
4. Writes them sequentially into a new file (`*.shredded`)

The file still contains all the original data, just in the wrong order!

## Solution Strategy

PNG files have a strict internal structure with CRCs that can be validated. The plan:

1. Try every reasonable number of chunks (from 2 to 50)
2. Split the shredded file evenly
3. Identify the chunk that starts with the PNG header
4. Recursively build possible orders using DFS
5. Validate each combination using PNG CRCs to prune incorrect paths
6. Stop once a valid PNG ending in IEND is found

## Reconstructor Script

```python
#!/usr/bin/env python3
import sys
import zlib

PNG_SIG = b'\x89PNG\r\n\x1a\n'
MAX_N = 50

def parse_png_chunks(bs):
    pos = 8  # after signature
    while pos + 8 <= len(bs):
        length = int.from_bytes(bs[pos:pos+4], 'big')
        ctype = bs[pos+4:pos+8]
        total = 4 + 4 + length + 4
        if pos + total > len(bs):
            raise ValueError("truncated chunk")
        data = bs[pos+8:pos+8+length]
        crc_read = int.from_bytes(bs[pos+8+length:pos+8+length+4], 'big')
        crc_calc = zlib.crc32(ctype + data) & 0xffffffff
        if crc_calc != crc_read:
            raise ValueError("CRC mismatch")
        pos += total
        if ctype == b'IEND':
            return True
    raise ValueError("no IEND found")

def check_partial_png(bs):
    if not bs.startswith(PNG_SIG):
        return False
    pos = 8
    while True:
        if pos + 8 > len(bs):
            return True
        length = int.from_bytes(bs[pos:pos+4], 'big')
        ctype = bs[pos+4:pos+8]
        total = 4 + 4 + length + 4
        if pos + total > len(bs):
            return True
        data = bs[pos+8:pos+8+length]
        crc_read = int.from_bytes(bs[pos+8+length:pos+8+length+4], 'big')
        crc_calc = zlib.crc32(ctype + data) & 0xffffffff
        if crc_calc != crc_read:
            return False
        pos += total
        if ctype == b'IEND':
            return pos == len(bs)

def dfs(chunks, used, order, n):
    if len(order) == n:
        candidate = b''.join(chunks[i] for i in order)
        try:
            parse_png_chunks(candidate)
            return candidate
        except:
            return None

    prefix = b''.join(chunks[i] for i in order)
    if not check_partial_png(prefix):
        return None

    for i in range(n):
        if used[i]:
            continue
        used[i] = True
        order.append(i)
        result = dfs(chunks, used, order, n)
        if result:
            return result
        order.pop()
        used[i] = False
    return None

def main():
    fname = sys.argv[1]
    data = open(fname, 'rb').read()
    fsize = len(data)
    print(f"File size: {fsize} bytes")

    for n in range(2, MAX_N+1):
        if fsize % n != 0:
            continue
        chunk_size = fsize // n
        chunks = [data[i*chunk_size:(i+1)*chunk_size] for i in range(n)]
        start_candidates = [i for i, c in enumerate(chunks) if c.startswith(PNG_SIG)]
        for start in start_candidates:
            used = [False]*n
            used[start] = True
            order = [start]
            print(f"Trying n={n}, start={start}...")
            result = dfs(chunks, used, order, n)
            if result:
                with open("recovered.png", "wb") as f:
                    f.write(result)
                print("SUCCESS: Reconstructed image saved as recovered.png")
                return
    print("Failed to reconstruct")

if __name__ == '__main__':
    main()
```

## Result

```
$ python3 recover_png.py document.png.shredded
SUCCESS: recovered PNG written to recovered.png
```

Opening the recovered image revealed the Ohio flag with the flag text printed across it.

## Flag

```
bctf{TODO_shr3d_th1s_1MM3D1AT3LY}
```
