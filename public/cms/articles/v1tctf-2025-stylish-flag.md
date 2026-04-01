---
title: "Stylish Flag"
slug: v1tctf-2025-stylish-flag
excerpt: "CSS Pixel Art flag hidden in box-shadow styling"
coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800"
coverImageAlt: "Stylish Flag - V1t CTF 2025 writeup"
categories:
  - V1t CTF 2025
  - Web
  - CSS
date: 2025-01-10
---

## Challenge Overview

The page loads a nearly empty HTML with just a single `div.flag`:

```html
<link rel="stylesheet" href="csss.css">
<div class="flag"></div>
```

The CSS paints "pixels" by using a huge `box-shadow` list on an 8x8 base square:

```css
.flag {
  width: 8px;
  height: 8px;
  background: #0f0;
  box-shadow:
    264px 0px #0f0,
    1200px 0px #0f0,
    0px 8px #0f0,
    32px 8px #0f0,
    ... many more offsets ...
    1200px 64px #0f0;
}
```

Each `xpx ypx #0f0` entry draws another 8x8 green square at that offset. Together they form pixel art that encodes the flag.

## Solution

### Step-by-Step

1. Open the page and launch your browser's DevTools (F12).
2. In the Elements panel, select the `<div class="flag">`.
3. In the Styles panel, add a scaling rule to make the pixel art readable:

```css
.flag {
  transform: scale(6);
  transform-origin: top left;
}
```

4. If the background makes it hard to read, also add:

```css
body { background: #000 !important; }
```

5. Once scaled, the pixel grid clearly renders text - read off the CTF flag.

### Why This Works

- The `box-shadow` list is a classic CSS "pixel art" trick: one base element plus many shadows to draw pixels.
- All offsets are multiples of 8px in both x and y, creating a grid of 8x8 pixels.
- Scaling the element makes the rendered text legible without changing the page semantics.

## Flag

```
v1t{CSS_P1X3L_ART}
```
