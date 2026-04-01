---
title: "Mandatory RSA"
slug: qnqsec-2025-mandatory-rsa
excerpt: "RSA with small private exponent - Wiener's Attack"
coverImage: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800"
coverImageAlt: "Mandatory RSA - QnQSec CTF 2025 writeup"
categories:
  - QnQSec CTF 2025
  - Crypto
  - RSA
  - Wiener's Attack
date: 2025-01-12
showToc: true
---

## Challenge Description

We are given RSA parameters: `n` (a large modulus), `e` (a large public exponent), and `c` (the ciphertext).

The hint explicitly references *"Size of the D"*, which points to a **small private exponent attack** (Wiener's attack).

## Analysis

- In RSA, the private exponent d satisfies: ed = 1 (mod phi(n))
- Normally, d is large, but if d < (1/3)n^0.25, Wiener's attack can recover it efficiently.
- The attack uses continued fractions of e/n to find convergents that approximate k/d.
- Once d is recovered, decryption is straightforward: m = c^d mod n

## Exploit Steps

1. Parse the given n, e, c
2. Run **Wiener's attack** to recover d
3. Decrypt the ciphertext: m = c^d mod n
4. Convert the integer m back into bytes to reveal the flag

## Solver Script

```python
import math

n = 30610867131545893573245403370929044810375908252345734515216335567761070674235240557970829245356614030481955825874376565524126172250295479286829004996105122106474627414932278394880727207687247106535964451736524423676062227917939094755601312619938974463767105253817030590414646900543888347805544511989816392901347341338737906837896070023751031260815782973250734600300683094949304509692321753534435264794596296780586539085130232106649876660029506699244567866816756904364396378546670735017278059889632347338673055259053699246622809620909022329749464060132071464884484682112534813343645706384624586841979729464134335809829
e = 13118943056376811531390887158969590633018246393862457649378429529040458860386531667701783962295691727349409639660447099510339788107269491122926716426902195188489126034970976454948883089008820188515413336458510467289740954821973897752400562551402417627328759394493013110177705814518809291916661933709921311243284600780240090861401353930215487292827235572235250164436683130292475464090785626013810206032736933354696930489144983575446495078404329829091193678240029445525658582548485531996972340914370823232033916046942293331266006647674886928834212203547468218609381456317192256524737280398698305720035095438106008915543
c = 18491889164810617543569456750416875989184817880137548014973592642069416208831086398288449741333647958301433206462225905089767171227296166302076329585813204145393998300807912284373441125769784091235480355305999860836226228064817001671079683866140595167104080925862489688205706558563994071054217252661751197090938128540101902284587959897970686920835999487758527543265902558413502613239565915919268373782402562042295965144636399280059309987259722405692758942811072888497222424752062745376152606372092707679048892146955016482797824514120865462676167840311292744307891590740707933408465096337716317714272609074408402855672

def is_perfect_square(x):
    r = int(math.isqrt(x))
    return r*r == x, r

def continued_fraction(a, b):
    q = []
    while b:
        q.append(a // b)
        a, b = b, a % b
    return q

def convergents_from_cf(cf):
    num1, num2 = 1, cf[0]
    den1, den2 = 0, 1
    yield (cf[0], 1)
    for k in cf[1:]:
        num = k*num2 + num1
        den = k*den2 + den1
        yield (num, den)
        num1, num2 = num2, num
        den1, den2 = den2, den

def wiener_attack(e, n):
    cf = continued_fraction(e, n)
    for (k, d) in convergents_from_cf(cf):
        if k == 0:
            continue
        phi_num = e*d - 1
        if phi_num % k != 0:
            continue
        phi = phi_num // k
        s = n - phi + 1
        D = s*s - 4*n
        is_sq, r = is_perfect_square(D)
        if not is_sq:
            continue
        p = (s + r) // 2
        q = (s - r) // 2
        if p*q == n and p > 1 and q > 1:
            return d, p, q
    return None

res = wiener_attack(e, n)
if not res:
    print("Wiener attack failed.")
else:
    d, p, q = res
    print("Recovered d:", d)
    m = pow(c, d, n)
    flag = m.to_bytes((m.bit_length() + 7)//8, 'big')
    print("Flag:", flag)
```

## Output

```
Recovered d: 7
Flag: b'QnQSec{I_l0v3_Wi3n3r5_@nD_i_l0v3_Nut5!!!!}'
```

## Flag

```
QnQSec{I_l0v3_Wi3n3r5_@nD_i_l0v3_Nut5!!!!}
```
