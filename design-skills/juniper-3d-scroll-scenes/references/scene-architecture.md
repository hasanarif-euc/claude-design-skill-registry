# Scene architecture

## Page structure

```
<canvas id="gl">  fixed, full viewport, z-index 0, opaque (it draws the floor)
<div class="vig"> fixed vignette, z-index 1
<div id="ov">     fixed overlay layer for projected HTML labels, z-index 3
<main id="machine">
  <section class="scene" data-side="right|left">   height 150vh
    <div class="stick">  position: sticky; top 0; height 100vh   <- copy pinned while the scene plays
  ...one section per scene, hero first, CTA scene last
</main>
<section class="faq"> and <footer>  position: relative; z-index 2; own background (covers the canvas)
```

- `data-side` says which half the **mechanism** appears on. The copy goes on the other half.
- Don't put `position` plus `z-index` on scene sections. That creates a stacking context, and the copy ends up underneath the canvas.

## Scroll to scene mapping

- `f = (scrollY - machineTop) / sectionHeight`. The scene is `k = floor(f)` and the progress through it is `t = f - k`.
- **First third of each section (hold):** the copy is pinned, the camera holds on scene k, and the object plays scene k's action (from `win[k][0]` to `win[k][1]` along the course).
- **Remaining two-thirds (travel):** the copy scrolls away, the camera eases to scene k+1, and the object travels the connector to the start of scene k+1's action. Use **the same easing** for the camera and the object so the object stays in frame.
- Ease the displayed `f` towards the target (factor 0.12 per frame) for smoothness. Skip the easing in test mode (`#snap`) and with reduced motion.
- Render on demand: run requestAnimationFrame only while something is still moving.

## Course layout (a switchback)

- Scenes sit about 22 units apart in depth (z). In every scene the object rolls **left to right**, facing the camera, across about 7 units of width. That way it reads like text and you see its face, not its thin edge.
- Between scenes the chute U-turns and sweeps back across the gap in a smooth S. The gap is mostly off-screen during holds, so the chute never runs through the copy.
- Props sit **behind** the chute (about 2 to 2.5 units further back in z), so the object passes in front of them.
- Action windows come from the course: `win[k] = [arc length at run start, arc length at run end]`.

## Camera framing

- For each scene, store a camera key: a target on the floor, a distance and a pitch. Shift the target sideways by about 20% of the visible width so the mechanism lands on its side of the screen.
- **Mobile:** pull back (distance about 2×), centre the mechanism horizontally, and shift the target so the mechanism sits in the lower half. Give the copy a frosted cream card, since the chute will pass behind it.
- Hero: closer than the other scenes, so the hero object reads as the subject.

## Triggers and state

- A trigger is `{s, v, set, el, cls}`: when the object's arc length passes `s`, `v` eases from 0 to 1 and `set(v)` drives the 3D state (rotation, colour, height). The HTML element `el` gets a class (`on`, or `done` for the step number).
- Scrolling back reverses every trigger. Test both directions.
- Projected overlays: each frame, `vector.project(camera)` gives screen x and y. Hide an overlay when it is behind the camera or well off-screen.

## Reduced motion

- With `prefers-reduced-motion`: no easing, the camera cuts to each scene during its hold, the object sits at the end of each action, and every trigger is fully on. The page is still readable and nothing animates on its own.
