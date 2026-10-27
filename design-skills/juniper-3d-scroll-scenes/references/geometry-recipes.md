# Geometry recipes

Every recipe below has working code in `assets/pill-machine-scene.js`. World units: tablet radius = 1.

## Tablet (three lathes and two rim rings)

- Profile parameters: radius 1, half the band height `PH = 0.3`, corner radius `PC = 0.09`, dome height `PD = 0.13`. Half the total thickness `PT = PH + PD`.
- Build **three separate lathes** so each part gets its own material: the top dome cap, the bottom dome cap, and the side band (corner arc, straight wall, corner arc).
- Dome: `y = ±(PH + PD * (1 - (x / F)²))` for x from 0 to `F = 1 - PC`.
- Rotate each lathe with `rotateX(π/2)` so the axis runs along z (the face points at the camera when the tablet stands upright).
- Rim: a thin `TorusGeometry(F + 0.012, 0.014)` at `z = ±(PH + 0.004)`.
- **Point order matters.** Lathe points run from the bottom to the top. If the order is reversed, the faces point inwards: you see the inside, and the far side shows through.

## Continuous chute (the swept ribbon)

1. Plan control points for the whole course, including the y height (raised on the hero dish, 0.3 on the floor).
2. `CatmullRomCurve3(points, false, 'centripetal')`, then `getSpacedPoints` at about 0.05 spacing.
3. **Smooth:** 8 passes of a 9-sample moving average (keep the ends fixed), then resample evenly again. This removes the kinks where control points change direction.
4. For each sample, take a horizontal direction over ±6 samples. The side vector is `(-d.z, 0, d.x)`.
5. Top surface: a strip between the left and right edges (evergreen, double-sided). Side walls: a strip from the top down by the chute's thickness, with laminate UVs set from world height (`v = y / 1.1`) so the stripes stay level. Add end caps.
6. The tablet's centre sits at `point + up normal × radius`, where `up normal = side × tangent` in 3D, so it doesn't sink on slopes.

Width 1.3 and thickness 0.3 suit a tablet of radius 1. The chute's curves must turn wider than half its width, or the inside edge folds over itself.

## Channel carved into the floor (no separate trench)

- Push part of the chute below the floor: `y = 0.3 - DIP × smoothstep(0, 0.3, u) × smoothstep(1, 0.7, u)` along that run. The slopes stay under about 40°.
- Side walls in that section run from the **floor (y = 0)** down to below the chute top, so the cut wall shows the laminate like a sliced plywood edge.
- Cut the floor: build it as a `THREE.Shape` with holes, using the shape's coordinates as (x, −z) and then `rotateX(−π/2)`. The hole outline is the chute's left edge (forward) plus its right edge (backward), over the samples where `y < 0`, plus one sample either side.
- Because the hole follows the chute edges exactly, the transition is seamless: the chute sinks to floor level, then into the cut.

## Pit

- Floor hole: a circular `absarc` hole in the floor shape.
- Wall: an open `CylinderGeometry` with `side: BackSide` (lilac). Add a thin band at the top using the laminate material, also BackSide.
- Floor: a `CircleGeometry` with a material that lights up, plus a `PointLight` inside that brightens when the object lands.

## Props

- Rounded boxes: `RoundedBoxGeometry(w, h, d, 4, r)` for cards, dominoes and pillars.
- **Pivots for toppling:** put a group at the bottom front edge and offset the child, then rotate the group (dominoes fall about 0.98 rad onto the next one, and the last falls flat).
- **Rising from the floor:** start the group below the floor (`y = -(h + 0.3)`). The opaque floor hides it, so it seems to come up through a slot.
- **Flip cards:** two thin boxes back to back (porcelain front, lime back). Rotate the y-axis by π and lift slightly at the halfway point.
- **Arch:** `TorusGeometry(R, tube, 28, 128, Math.PI)`, a half ring standing on the floor, with lilac foot discs. Its plane is perpendicular to the direction of travel, turned about 0.4 rad towards the camera.
