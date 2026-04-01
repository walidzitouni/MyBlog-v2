---
title: "We Go Gym"
slug: patriotctf-2025-we-go-gym
excerpt: "Network Forensics - TTL Covert Channel Data Exfiltration"
coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800"
coverImageAlt: "We Go Gym - PatriotCTF 2025 CTF writeup"
categories:
  - PatriotCTF 2025
  - Forensics
  - Network
  - Covert Channels
date: 2025-01-15
showToc: true
---

> Our gym IT staff noticed some weird traffic going through on our local network. Do you think you can investigate and find out what information was sent?

## Initial Analysis

We are provided with a PCAP file (`wegogym.pcap`). Opening the file in Wireshark or analyzing it with Scapy reveals a mix of TCP traffic, specifically HTTP requests.

A quick look at the HTTP traffic shows two distinct patterns:

- **Noise Traffic:** Multiple requests for files like `noise16.txt`, `noise40.txt`, etc. The User-Agent for these is a standard Mozilla Linux string.
- **Suspicious Traffic:** Repeated requests for the root path `/` sent to sequential ports (`40000`, `40001`, `40002`...). The User-Agent for these requests is simply `CURL`.

The prompt mentions "User-Age," which is a pun on **User-Agent** and **Age** (Time). In networking, the only field related to "Time" or "Age" at the IP layer is **TTL (Time To Live)**.

## The Anomaly

Filtering for the suspicious `CURL` packets reveals that the **IP TTL** values are erratic.

- Normal traffic usually has a constant TTL (e.g., 64, 128) that decrements by 1 per hop.
- In this capture, the TTLs for the `CURL` packets jump wildly (e.g., 80, 67, 84, 70...).

This confirms the existence of a **Covert Channel**: The attacker is manually setting the TTL field of each packet to an ASCII value to hide data.

## Solution Strategy

1. **Filter:** Isolate packets that have the `User-Agent: CURL`.
2. **Extract:** Read the IP TTL value from these packets.
3. **Decode:** Convert the integer TTL values to ASCII characters (`chr(ttl)`).
4. **Assemble:** Join the characters to reveal the flag.

## Python Solution Script

This script uses `scapy` to parse the PCAP, filter for the specific User-Agent, and decode the TTLs.

```python
from scapy.all import rdpcap, IP, TCP, Raw

def solve_wegogym(pcap_file):
    print(f"[*] Analyzing {pcap_file}...")
    try:
        packets = rdpcap(pcap_file)
    except Exception as e:
        print(f"[!] Error reading pcap: {e}")
        return

    # Sort packets by time to ensure the flag is in order
    packets.sort(key=lambda x: x.time)

    flag_chars = []

    for p in packets:
        # We need IP (for TTL), TCP (for ports), and Raw (for HTTP payload)
        if p.haslayer(IP) and p.haslayer(TCP) and p.haslayer(Raw):
            try:
                payload = p[Raw].load.decode('utf-8', errors='ignore')

                # Filter for the suspicious "CURL" User-Agent
                if "User-Agent: CURL" in payload:
                    ttl_val = p[IP].ttl
                    char = chr(ttl_val)
                    flag_chars.append(char)
            except Exception as e:
                pass

    flag = "".join(flag_chars)
    print(f"\n[+] Flag Found: {flag}")

if __name__ == "__main__":
    solve_wegogym("wegogym.pcap")
```

### Execution Output

```
[*] Analyzing wegogym.pcap...

[+] Flag Found: PCTF{t1m3_t0_g37_5w01}
```

## Flag

```
PCTF{t1m3_t0_g37_5w01}
```

## Lessons Learned

- TTL fields can be used as covert channels to exfiltrate data
- Always look for anomalies in packet headers, not just payloads
- Scapy is an excellent tool for packet analysis and extraction
- Challenge names and descriptions often contain hints about the solution
