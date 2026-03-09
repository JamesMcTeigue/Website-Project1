# Website-Project1
built with AI assist

## Changelog

### 5/03/2026
Making new pixel textures using pixel art program, using AI to help resize the image so it fits.

### 10/03/2026
Restructured into a full alley scene layout. Summary of changes:

**Scene floor**
A fixed dark strip (`#scene-floor`) sits at the bottom of the viewport in front of the brick wall, creating the illusion of depth — wall behind, floor in front. Height and colour are controlled by `--floor-height` and `--floor-color` in the CSS knobs section.

**Props / bins**
Objects on the floor (bins etc.) live inside `#scene-floor` in the HTML as `<img class="scene-prop">`. They use `position: absolute; bottom: 0` so they sit on the floor line and extend upward into the wall behind them. To add more props, duplicate the `<img>` tag and give it a unique `id` with a `left` or `right` position.

**Full-page mouse light overlay**
A `#mouse-light-overlay` div sits over everything (including the pipe and floor) and uses `mix-blend-mode: screen` to brighten whatever the cursor is pointed at — bricks, pipe, floor, bins. The spotlight colour, size, and intensity are controlled by `--light-color`, `--light-radius`, and `--light-intensity` in the CSS knobs.

The overlay is driven by `--mouse-x`, `--mouse-y`, and `--mouse-brightness-amount` — CSS variables that the JavaScript animation loop updates every frame. No extra JS was needed.

**Pipe**
The left-side pipe renders via `body::before` using `Pipe.png`. Replace the file and adjust `--pipe-col-w` / `--pipe-native-h` in the CSS knobs to swap in a new sprite.

## How to run
No build step needed — open `index.html` directly in a browser, or use any static file server (e.g. VS Code Live Server).
