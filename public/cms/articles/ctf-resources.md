---
title: "CTF & Security Resources"
slug: ctf-resources
excerpt: "A curated collection of tools, platforms, and resources for CTF competitions and security research — covering Web, Crypto, Forensics, OSINT, RE, and more."
categories:
  - Resources
  - CTF
date: 2026-04-01
showToc: true
---

## Practice Platforms

| Platform | Description |
|----------|-------------|
| [HackTheBox](https://hackthebox.com) | Machines, challenges, and competitive CTFs |
| [TryHackMe](https://tryhackme.com) | Guided learning paths and rooms |
| [CTFtime](https://ctftime.org) | CTF event calendar and team rankings |
| [PicoCTF](https://picoctf.org) | Beginner-friendly CTF platform |
| [CryptoHack](https://cryptohack.org) | Cryptography challenges |
| [PortSwigger Web Academy](https://portswigger.net/web-security) | Web security labs |

---

## Web Exploitation

### Tools

- **Burp Suite** — Web application testing proxy
- **FFUF / Feroxbuster** — Directory and endpoint fuzzing
- **SQLMap** — Automated SQL injection
- **Nikto** — Web server scanner
- **WFuzz** — Web fuzzer

### Key Topics

- XSS (Stored, Reflected, DOM-based)
- SQL Injection
- Server-Side Template Injection (SSTI)
- HTTP Request Smuggling
- SSRF / XXE
- JWT Attacks (alg:none, RS256 confusion, secret brute-force)
- OAuth misconfigurations
- Prototype Pollution

---

## Cryptography

### Tools

- **SageMath** — Mathematical toolkit for crypto
- **CyberChef** — Encoding/decoding/operations
- **RsaCtfTool** — RSA attack automation
- **Hashcat / John the Ripper** — Password/hash cracking
- **XorTool** — XOR key recovery

### Key Topics

- RSA (weak primes, small e, Coppersmith, Wiener's attack)
- AES modes (ECB oracle, CBC padding oracle, GCM nonce reuse)
- Elliptic Curve Cryptography
- Hash length extension attacks
- Custom cipher analysis

---

## Forensics & Steganography

### Tools

- **Wireshark** — Network traffic analysis
- **Volatility** — Memory forensics
- **Binwalk** — Firmware/file analysis
- **Steghide / zsteg / stegsolve** — Image steganography
- **Foremost / Autopsy** — File carving
- **ExifTool** — Metadata extraction

---

## OSINT

### Tools

- **theHarvester** — Email and domain enumeration
- **Shodan** — Internet-connected device search
- **Maltego** — Link analysis
- **SpiderFoot** — Automated OSINT
- **OSINT Framework** — [osintframework.com](https://osintframework.com)

---

## Reverse Engineering

### Tools

- **Ghidra** — NSA's free decompiler
- **IDA Pro / IDA Free** — Industry-standard disassembler
- **Radare2 / Cutter** — Open-source RE framework
- **GDB + pwndbg / peda** — Debugging with enhanced UI
- **Binary Ninja** — Modern RE platform

---

## Binary Exploitation (Pwn)

### Tools

- **pwntools** — CTF exploit development library
- **ROPgadget / ropper** — ROP chain building
- **checksec** — Binary security checks
- **one_gadget** — libc one-shot RCE finder

### Key Topics

- Buffer overflows
- Format string attacks
- ROP chains
- Heap exploitation (tcache poisoning, fast bin attacks)

---

## Learning Resources

- [CTF 101](https://ctf101.org) — Introductory guide
- [LiveOverflow YouTube](https://youtube.com/@LiveOverflow) — CTF and security content
- [ippsec YouTube](https://youtube.com/@ippsec) — HackTheBox video walkthroughs
- [0xdf hacks stuff](https://0xdf.gitlab.io) — Detailed HTB writeups
- [Trail of Bits Blog](https://blog.trailofbits.com) — Security research
- [Project Zero](https://googleprojectzero.blogspot.com) — Google's vulnerability research

---

## My CTF Team

- 🇲🇦 **[CYBERdUNE](https://cyberdune.tech)** — #1 Morocco, #7 worldwide
- 🦈 **US Sharkbait**
