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


##16/03/2026
PAIN

additions of buttons in places 

##17/03/2026
moved to claud ai, much better
chaged brightness of page and made light better

##19/03/2026
made an attempt to make the wbesite uniform across screens, first and second attemps have failed moveing to third

###23/03/2026
changinout  the wihite button for a flickering lamp anf fixing lighting issuse around that. i also changes the red button for te start pfa poster
### 24/03/2026
Claud ran out part way through twice but replaced all place holders and arranged all images in theri final positions.

### From the Editor
Project Title
Replace this with your project name.

MDDN242 2026 — The Allyway Its an allyway where the graphiti on the walls or the wanted poster are

AI & Prompting Process
How did you use AI tools in this project? This section is important. We want to see how you worked with AI, not just that you did.

Tools used
-I used Claude for most of the project, though I started with Copilot in the beginning, but found it wasn't very good -Grammarly for spelling and grammar

How you used them
I copied and pasted text from the AI into my documents.

What you used AI for
I mainly use AI for all the programming, fixing simple things like locations, when able, and generating placeholder images for a few visuals that I later replaced.

What worked
Sending files after explaining what I wanted and being very clear that I wanted the AI to wait for instructions. This mainly worked with Claud, as the copilot sucks.

Example prompt that worked well:
First batch will only be images, including a screenshot of the current page with arrows point on were I want the components to go. The please confirem you understand what the images mean. The rest of the images are components required for the website.
Respons:
Got it! Here's my understanding of the screenshot and assets:
What didn't work
Copilot was just worse; it's just a "yes man" instead of an actually useful tool. What did you prompt that gave poor results? How did you adjust?

Design Intent
What were you trying to achieve? I wanted to make a Dark allyway, playing around with lighting on the website.

The goal
A pixel art styeld website, with aboiuonce and depth so i realy feals like your pointing alight down a digital allyway, where things interact with the light.

Why this direction
I like how brick looks, especial in pixel art form. My prjecst are litiraly plasterd on the wall makeing it my website rather than somthing AI came up with.

Who is this for
Friends and fanliy to see some of my wokr and how ists going.

What I Tried That Didn't Work
Dead ends and failed experiments are part of the process. Don't skip this section.

Attempt 1: Getting the light ot follow the mouse
What I tried: To get Copilot to create the code for me

Why it didn't work: I was unable to get Copilot to do what I asked and got carried away with belittling it instead of looking for a solution.

What I learned: the takeaway That I shouldn't use Copilot for Programing

Attempt 2: Getting the light ot follow the mouse V2
What I tried: Went to Phoebe with the problem

Why it didn't work: I did work, I gave permission to put my work through their Caud premium, and it was able to fix the problem.

What I learned: I learned that I was using the wrong program, Claud is much better than Copilot

Design Decisions
The key choices you made and why.

Colour
I chose Dark, grimy colours that one would find in a brick alleyway

Typography
I wanted something that looked like it was hastily done

Layout & structure
I had two main components that where there purly as visuals with no actual function that I used to define the environment, those being the bin on the right and the pipes going down the left.

Interaction & motion
There's a spider the user can grab and drag about, drop, and it'll pop right back into place.

Other decisions
Above the bin, I added a light on the fritz. This is because between the two is my info page. This draws people to it.
