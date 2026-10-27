---
name: juniper-3d-scroll-scenes
description: Use when building or fixing a scroll-driven 3D landing page (three.js / WebGL) for Juniper or another Eucalyptus brand, such as a Wealthsimple-style Rube Goldberg page where an object (a pill, a coin) travels through a machine as the user scrolls. Covers art direction, scene and camera setup, geometry recipes, believable physics, mobile, reduced motion, testing and the Spain compliance limits on pill imagery.
---

# Juniper 3D scroll scenes

A playbook for one kind of page: a single 3D world that plays out as the reader scrolls. The camera moves from scene to scene, an object travels a continuous course through each scene, and short copy sits on the other half of the screen. It was built and debugged on the Juniper Spain pill launch page (October 2026). A working reference implementation is in `assets/`.

The standard every scene is held to: **it should look like a studio render, and nothing should move in a way that a real object couldn't.**

## When to use it

- Someone asks for a "Wealthsimple-style", "Rube Goldberg", "3D scroll story" or "machine" landing page
- An existing 3D page looks flat, cheap, jagged or physically wrong and needs fixing
- Not for static 3D renders in ads or for a product carousel. Use a design tool or photography for those.

## Before building

1. **Check the audience and the compliance rules first.** In Spain, a page showing a tablet with the words "comprimido", "dosis" or "sin agujas" is patient communication. It cannot go to public or paid traffic unless Legal approves. See `references/compliance-es.md`. Settle this before designing anything, because it decides whether the object may look like medication at all.
2. **Get the reference moving.** A still screenshot is not enough. Ask for a screen recording or a flow video, and pull one frame per second with `ffmpeg -i ref.mp4 -vf fps=1 f_%02d.jpg`. The 2017 Wealthsimple flow video showed the real direction: a seamless studio floor, a camera about 40° above it, and objects sitting on or cut into the floor. Earlier versions guessed wrong (flat line art, then a machine mounted on a wall).
3. **Pull the brand from the live site.** Take fonts, colours and photography from the market's real site (an export of the saved page works). Never substitute a fallback font silently.

## How to build it

Read these in order. Each one is short.

1. `references/art-direction.md`: the look. Floor, palette, materials, light, the hero object.
2. `references/scene-architecture.md`: how scroll drives the camera and the object, how the course is laid out, how text and 3D share the screen.
3. `references/geometry-recipes.md`: code patterns for the tablet, the chute, channels carved into the floor, pits and props.
4. `references/physics.md`: the motion rules that stop it looking fake.
5. `references/sharp-edges.md`: bugs we hit and how they were fixed. Read this before debugging anything.
6. `references/validation.md`: how to test it headless, and the checklist to pass before handing over.

## Working files

| File | What it is |
|---|---|
| `assets/pill-machine-scene.js` | The full scene from the Spain pill page: lighting, materials, tablet, continuous chute, carved channel, pit landing, props, triggers, camera, overlays, reduced motion |
| `assets/page-template.html` | The page shell: sticky copy sections, canvas, overlay layer, brand CSS. Placeholders for fonts, images, logo and bundle |
| `scripts/build_page.py` | Inlines fonts, images, logo and the esbuild bundle into one self-contained HTML file |
| `scripts/scroll-shots.js` | Playwright script that screenshots the page at chosen scroll positions (desktop or mobile) |

Build with:

```bash
npm i three esbuild
npx esbuild assets/pill-machine-scene.js --bundle --minify --format=iife --target=es2020 --outfile=bundle.js
python3 scripts/build_page.py --template assets/page-template.html --bundle bundle.js \
  --assets <webp folder> --fonts <woff2 folder> --logo <wordmark.svg> --out page.html
```

## Non-negotiables

- **One continuous path.** Build the whole course as a single plan of control points, smooth it, resample it evenly, then sweep geometry along it. Separate pieces joined end to end always show kinks and overlaps.
- **Physically believable motion.** Gravity is the only thing that moves the object, except where a part visibly acts on it. See `references/physics.md`.
- **Text never overlaps the machine.** The object moves across the half of the screen opposite the copy. On mobile, the copy sits on a frosted card.
- **Brand locks hold.** Brand fonts, brand colours, one CTA label used word for word, sentence case, no exclamation marks, copy in the market's language.
- **Reduced motion gives a static page.** The camera cuts between scenes, every part shows its finished state, and all copy still reads.
- **Test with real screenshots** at 1440 and 375 before every handover, using snap mode. Don't judge from the code.

## Credits

This is original work from the Juniper Spain pill launch concept. The directory entry for a "3d-modeling" skill in the upstream registry covers desktop modelling tools (topology, UVs, Blender, Maya) and is not used here. Most copies of it carry an unknown licence.
