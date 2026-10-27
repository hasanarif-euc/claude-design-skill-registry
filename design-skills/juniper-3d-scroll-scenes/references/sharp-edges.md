# Sharp edges

Bugs we actually hit on the Spain pill page, and what fixed them. Check this list before you start debugging.

## Rendering

| Symptom | Cause | Fix |
|---|---|---|
| The tablet looks see-through; you can see its far side | Lathe points ran top to bottom, so the faces point inwards | List lathe points bottom to top. Don't reach for `DoubleSide` to hide it |
| Console warning, and shadows look wrong | `PCFSoftShadowMap` was removed in three r0.186 | Use `PCFShadowMap` with `shadow.radius = 3` |
| Headless screenshots time out | `VSMShadowMap` is too slow under SwiftShader | Stay on PCF |
| Evergreen goes muddy and lime goes pale | ACES tone mapping desaturates brand colours | `NeutralToneMapping` |
| Shadows go blurry or vanish in later scenes | The shadow camera stays at the origin while the view moves 100+ units away | Move the light and `light.target` with the camera target every frame |
| A hard line where the floor meets the sky | Fog colour doesn't match the floor | Use the same hex for fog, floor and clear colour |
| The tablet looks like a marshmallow | One material, with sheen, over the whole tablet | Three materials: chalky face, lilac-grey band, bright thin rim (see `art-direction.md`) |

## Geometry and layout

| Symptom | Cause | Fix |
|---|---|---|
| Chute edges look jagged at the start of each scene | Separate curves joined end to end, and a heading taken over ±2 samples | One plan for the whole course, 8 smoothing passes, resample, ±6-sample heading |
| The chute's inside edge folds over itself | The turn radius is smaller than half the chute width | Widen the turn or narrow the chute |
| A trench looks stuck on, and the tablet hops between pieces | A separate trench mesh sits beside the chute | Dip the chute itself below the floor and cut the floor hole along its edges |
| Posts span the hero or float in the wrong place | Prop coordinates mixed scene-local and world space | Build every prop in a group per scene and convert with one helper (`g.Y()` in the reference scene) |
| Copy sits under the canvas | `position` plus `z-index` on scene sections creates a stacking context | Keep sections unpositioned. Only the FAQ and footer get `z-index: 2` and their own background |
| The connector chute runs through the copy on left-side scenes | The S-bend bulges too far across | Tighten the bulge and narrow the left copy column (about 430px) |
| On mobile the machine sits behind the headline | Desktop framing reused on a tall screen | Pull back about 2×, push the mechanism into the lower half, put the copy on a frosted card |

## Motion

| Symptom | Cause | Fix |
|---|---|---|
| The tablet hops up onto the first chute | The start platform was lower than the chute | Start on a level platform (the lime puck) at exactly chute height |
| The tablet hovers, then sinks into the pit | The settle was a slow vertical descent | Parabolic fall, land on the edge, tip over (see `physics.md`) |
| The last ribbon doubles back into the pit | The course ended past the pit and turned back | End the course at the pit edge and let the fall do the rest |
| The camera and the object drift apart during travel | They use different easing curves | One `smoothstep` drives both |
| Triggers stay on after scrolling back up | A one-way flag | Drive each trigger from arc length so it eases back to 0 |

## Tooling

| Symptom | Cause | Fix |
|---|---|---|
| Screenshots show the scene before it has caught up with the scroll | Scroll easing plus slow SwiftShader frames | Load with `#snap`: no easing, render immediately |
| The web reader fails for every site | The session's fetch proxy blocks it | Ask for a saved page export or a screen recording. Don't route around the block |
| `git status` or `find` times out in the registry repo | Over 300,000 files under `skills/` | Use `git ls-files <path>` or `git ls-tree` with a path, and never scan `skills/` |
| `git commit` leaves `.lock` files in a connected folder | The device shell can't delete files until deletion is approved | Ask for delete permission on that folder, or run git on the Mac |
| `git push` fails from the device shell | The token lives in the macOS Keychain, which the Linux VM can't read | Push from Terminal on the Mac |
