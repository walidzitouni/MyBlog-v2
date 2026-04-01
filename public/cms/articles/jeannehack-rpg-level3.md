---
title: "Jeanne Hack RPG - Level III"
slug: jeannehack-rpg-level3
excerpt: "Reverse engineering a dungeon crawler game plugin to extract flag from state machine table"
coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800"
coverImageAlt: "Jeanne Hack RPG Level III - CTF writeup"
categories:
  - Reverse Engineering
  - Binary Analysis
  - CTF
  - Jeanne Hack
date: 2025-02-02
showToc: true
---

## Challenge Information

| Field | Value |
|-------|-------|
| **Name** | Jeanne Hack RPG - Level III |
| **Category** | Reverse Engineering |
| **Difficulty** | Hard |
| **Points** | 472 |
| **Author** | Fenrisfulsur |
| **Flag Format** | `JDHACK{....}` |

## Challenge Description

> *With a newfound prize in hand, your adventure takes you to the dark depths of the forest. Darkness looms ahead, stirring both excitement and dread...*
>
> *What mysteries await within?*

## Files Provided

- `level_3.so` - ELF 64-bit shared object

## Initial Analysis

Let's start by examining the binary:

```bash
$ file level_3.so
level_3.so: ELF 64-bit LSB shared object, x86-64, version 1 (GNU/Linux),
dynamically linked, BuildID[sha1]=c20c54fd1ff081e2a626038086a02e4625820e7f, stripped

$ sha256sum level_3.so
ab03d0f836daba5961c29f768d09e4b8d589d31042d72191bc9dddc3546e5c02  level_3.so
```

The binary is a stripped 64-bit shared object, which means no debug symbols are available. This is part of a larger RPG game framework where each level is loaded as a plugin.

### Exported Symbols

```bash
$ nm -D level_3.so | grep -E "^[0-9a-f]+ T"
000000000001c087 T enter_level
000000000001c0dc T leave_level
```

The shared object exports two key functions:
- `enter_level` at `0x1c087` - Entry point when the level loads
- `leave_level` at `0x1c0dc` - Called when exiting the level

### External Dependencies

The binary uses several game framework functions:
- `choices_add`, `choices_dispose`, `create_choices` - Dialog/menu system
- `d4`, `d10`, `d20` - Dice roll functions (typical RPG mechanics)
- `fadein_image`, `fadeout_image`, `get_image` - Graphics functions

## Understanding the Game Mechanics

By analyzing strings in the binary, we can understand the game structure:

```bash
$ strings level_3.so | grep -i "room\|dungeon\|weird"
```

Key findings:
- **Game Type**: Dungeon crawler with maze navigation
- **Structure**: 10x10 grid dungeon with multiple depth levels (max 13)
- **Starting Position**: Coordinates (3, 3)
- **Directions**: North, East, South, West (Forward, Backward, Left, Right)
- **Enemies**: Skeleton, Strong Goblin, Fierce Orc
- **Special Room**: "Weird Room" - a secret location

### Interesting Strings

```
What a weird room! You wonder how you ended up here!
Weird Room
You realize this is the entrance to the dungeon.
Push the door open and enter the dungeon.
While walking inside the dungeon you encounter a
Search the room for loot
```

The mention of a "Weird Room" is suspicious - this appears to be where the flag might be hidden.

## Static Analysis

### Key Function Offsets

| Offset | Description |
|--------|-------------|
| `0x1c087` | `enter_level` - Main entry point |
| `0x10390` | Dungeon initialization routine |
| `0x10530` | Navigation/game loop handler |
| `0x13c98` | Secret room handler ("Weird Room") |
| `0x25820` | State machine table (contains flag) |

### The State Machine Table

While analyzing the `.rodata` section, I discovered a state machine table at offset `0x25820`. This table contains function pointers and state values used by the game logic.

Let's examine the hex dump:

```bash
$ xxd -s 0x25820 -l 256 level_3.so
00025820: 91f4 0000 0000 0000 0400 0000 0000 0000  ................
00025830: 5bf6 0000 0000 0000 0000 0000 0000 0000  [...............
...
00025900: 5bf6 0000 0000 0000 4a00 0000 0000 0000  [.......J.......
```

Notice the `4a` at offset `0x25908` - that's `'J'` in ASCII!

## Finding the Flag

### Pattern Discovery

After analyzing the state machine table more carefully, I noticed that printable ASCII characters appear at regular intervals:

- Every **25th entry** (each entry is 8 bytes) contains one character of the flag
- Starting at entry 29 with `'J'`
- Ending at entry 829 with `'}'`

### Flag Extraction

The flag characters are embedded in the state machine table at predictable offsets:

| Entry Index | Offset | Character |
|-------------|--------|-----------|
| 29 | 0x25908 | J |
| 54 | 0x259d0 | D |
| 79 | 0x25a98 | H |
| 104 | 0x25b60 | A |
| 129 | 0x25c28 | C |
| 154 | 0x25cf0 | K |
| 179 | 0x25db8 | { |
| 204 | 0x25e80 | y |
| 229 | 0x25f48 | O |
| 254 | 0x26010 | U |
| ... | ... | ... |
| 829 | 0x27208 | } |

## Solution

### Extraction Script

```python
#!/usr/bin/env python3
"""
Jeanne Hack RPG Level III - Flag Extractor
Extracts flag from state machine table in level_3.so
"""

def extract_flag(filename):
    with open(filename, 'rb') as f:
        data = f.read()

    # State machine table offset
    base_offset = 0x25820

    # Flag characters are embedded every 25 entries (8 bytes each)
    flag_chars = []

    for i in range(870):
        addr = base_offset + i * 8
        value = int.from_bytes(data[addr:addr+8], 'little')

        # Filter for printable ASCII (excluding common state values)
        if 32 <= value <= 126:
            flag_chars.append(chr(value))

    return ''.join(flag_chars)

if __name__ == '__main__':
    flag = extract_flag('level_3.so')
    print(f'Flag: {flag}')
```

### Running the Script

```bash
$ python3 solve.py
Flag: JDHACK{yOU_fOunD_ThE_$eCR3t_R0om}
```

## Alternative Approach: Playing the Game

If you manage to navigate to the "Weird Room" during gameplay, the flag would be revealed through the game's dialog system. The secret room check is at offset `0x13c98`, which displays:

```
What a weird room! You wonder how you ended up here!
```

However, finding this room through normal gameplay would require:
1. Understanding the dungeon generation algorithm (seeded by FNV-1a hash of player name)
2. Navigating through the procedurally generated maze
3. Reaching the specific coordinates that trigger the secret room

## Flag

```
JDHACK{yOU_fOunD_ThE_$eCR3t_R0om}
```

## Lessons Learned

1. **State machines in games often hide secrets** - The flag was embedded within the game's state transition table, not in obvious string locations.

2. **Pattern recognition is key** - The regular interval (every 25 entries) was the crucial insight needed to extract the complete flag.

3. **Stripped binaries require patience** - Without symbols, understanding the code flow requires careful analysis of cross-references and string usage.

4. **Sometimes static analysis beats dynamic** - While playing the game could theoretically reveal the flag, extracting it directly from the binary was more efficient.

## Tools Used

- `file`, `strings`, `nm`, `readelf` - Initial binary analysis
- `xxd` - Hex dump examination
- Python - Flag extraction script
- Ghidra/radare2 - Disassembly and reverse engineering

---

*Writeup by daryx*
