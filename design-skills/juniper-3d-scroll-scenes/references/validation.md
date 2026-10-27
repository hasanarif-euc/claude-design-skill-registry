# Validation

Judge the page from screenshots, not from the code. Every handover passes all of the checks below.

## Headless setup

Playwright's Chromium renders WebGL through SwiftShader. Launch it with:

```js
chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
```

Load the page with `#snap` so scroll easing is skipped and every frame renders straight away. SwiftShader runs at a few frames a second, so wait about 1.5 s after each scroll before you take the shot.

## 1. Scroll screenshots (desktop and mobile)

```bash
# arguments: absolute page path, output prefix, width (1440 or 375), positions in scene units
SNAP=1 node scripts/scroll-shots.js "$PWD/page.html" "$PWD/shots/desk" 1440 0,0.15,0.65,1.15,1.65,2.15,2.65,3.15,3.65,4.15,4.65,5.15
SNAP=1 node scripts/scroll-shots.js "$PWD/page.html" "$PWD/shots/mob" 375 0,0.15,1.15,2.15,3.15,4.15,5.15
```

Take one shot at the hold of every scene (`k + 0.15`) and one mid-travel (`k + 0.65`). The script also prints page errors and warnings. Then look at every image and check:

- The chute is smooth, with no kinks, gaps or overlapping pieces
- The object is on the chute (not sunk into it or floating above it) and faces the camera during holds
- The copy never overlaps the mechanism, the chute or the overlays
- On mobile, the mechanism sits in the lower half and the copy card is readable
- The last scene shows the object resting in the pit with the CTA visible

## 2. Motion

Record a pass through the whole page and watch it at normal speed. The rules in `physics.md` are easier to break than to spot in stills.

```bash
# 150 frames, then join them
ffmpeg -framerate 30 -i frames/f_%03d.png -pix_fmt yuv420p -vf "scale=1440:-2" preview.mp4
```

Scroll back up through the page too. Every trigger should reverse.

## 3. Reduced motion

Open the page with `reducedMotion: 'reduce'` and scroll to the middle of a scene. Expected: no easing, the camera on that scene, the object at the end of its action, every trigger on, and no page errors.

## 4. Rubric audit (run in the page at 1440 and 375)

| Check | Pass |
|---|---|
| CTA labels | One label, used word for word on every CTA |
| Text contrast | At least 4.5:1 for body text (the Spain page reached 5.51 or more) |
| Fonts | Brand families only, with no silent fallback (check `document.fonts`) |
| Sideways scroll | `document.documentElement.scrollWidth <= innerWidth` |
| Tap targets | Every link and button at least 44 × 44 px |
| Console | No errors and no three.js warnings |

## 5. Restricted-term scan (Spain)

Search the built HTML for the words in `compliance-es.md` before it goes anywhere:

```bash
grep -oiE "semaglutid|tirzepatid|wegovy|mounjaro|ozempic|orforglipr|glp-?1|inyecci|pluma|receta|recetad|p[ií]ldora para adelgazar|medicamento para (adelgazar|perder peso)|apetito|hambre|a domicilio|garantizad" page.html | sort | uniq -c
```

On a patient-comms page some of these may be allowed. List each hit and its context for Legal rather than deciding yourself.

## 6. Production gaps to flag

Not covered by these checks, so say so at handover:

- Performance on low-end Android
- A fallback for browsers without WebGL (the copy should still read)
- Bundle size (about 850 KB inlined with three.js)
