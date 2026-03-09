# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static HTML/CSS/JS website for MDDN242 Project 1. No build step, bundler, or package manager — open `index.html` directly in a browser or serve with any static file server (e.g. `npx serve .` or VS Code Live Server).

## File Overview

- `index.html` — single page; links to `styles (3).css` and `script (3).js` (note the spaces in filenames)
- `styles (3).css` — all styling; heavy use of CSS custom properties (`--var`) for the brick background system
- `script (3).js` — two self-contained IIFEs: mouse glow + orb animation, and draggable-nav with gravity physics

## Architecture

**Background system (CSS-only, no canvas)**
The body background is 9 stacked layers (mouse glow → 3 colour orbs → mortar texture → brick texture → horizontal mortar lines → vertical mortar lines → brick base). Each layer has a matching entry in `background-size`, `background-position`, and `background-blend-mode`. Tweakable knobs are CSS variables in `:root` (brick size, mortar thickness, colours, pixel scale).

**JS animation loop**
A single `requestAnimationFrame` loop in the first IIFE drives both the mouse-glow intensity decay and the orb positions. It writes directly to CSS custom properties on `:root` (`--mouse-x`, `--mouse-y`, `--orb1-pos-x`, etc.), which the CSS layers pick up automatically.

**Draggable nav physics**
The second IIFE makes `#draggableNav` draggable via pointer/mouse/touch events. On release it simulates gravity (`0.003 px/ms²`) until the element hits the viewport bottom, plays a bounce animation, then resets to its original position. Respects `prefers-reduced-motion` (skips animation, snaps back immediately).

**Pixel art assets**
- `brick textuer-1.png` — brick texture tile (multiplied over brick colour)
- `mortar_tile.png` — mortar texture tile (multiplied over mortar lines)
- `image-1.png.png` — pixel-art pipe sprite, rendered via `body::before` as a fixed left-column overlay (`--pipe-col-w: 120px`, repeats vertically)
- `image-rendering: pixelated` is set globally to keep pixel art crisp
