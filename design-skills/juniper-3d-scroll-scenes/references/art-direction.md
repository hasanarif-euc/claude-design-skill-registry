# Art direction

## The world

- **One seamless studio floor.** It's off-white or cream (`#F7F6F0`), and fog in the same colour fades the far edges, so there is no horizon line. A faint CSS vignette over the canvas (evergreen at about 7% at the edges) gives it the falloff of a studio light.
- **The camera looks down at about 40°** (46° on mobile) through a long lens (30° vertical field of view). It never orbits. It glides from scene to scene.
- **Objects sit on the floor or are cut into it.** Dishes, pits and channels cut into the floor read better than objects floating in space.
- **One idea per scene.** One mechanism, one state change and one line of copy for each scene.

## Palette (Juniper)

| Role | Colour |
|---|---|
| Floor | `#F7F6F0` |
| Chute top, main accents | Evergreen `#133F26`, matte (roughness about 0.58) |
| Chute edges | Laminated stripes of cream `#F3EEDC`, sage `#D0D8BC` and lime `#DFF49F`, like plywood, from a canvas texture |
| Dish, pit | Lilac `#D9CDE5` (outside) and `#CDBFDC` (inside) |
| Lit state | Lime `#DFF49F` with a low emissive glow (0.3 to 0.6) |
| Porcelain props (dominoes, pillars, cards) | `#FCFBF6`, clearcoat 0.55 |

Stick to these. A cheap 3D page is usually too many colours, glossy everything, or a busy background.

## The hero object: a tablet

What makes a tablet read as real (matched to a reference render of two tablets on lilac):

- **Thick, not a coin.** Total thickness is about 43% of the diameter, with **straight sides** and **gently domed faces**.
- **Three materials, not one:**
  - Face: matte chalky white (`#FDFDFE`, roughness 0.92, with a fine noise bump map for grain)
  - Side band: cool lilac-grey (`#C9C5EC`, roughness 0.9, same grain)
  - Rim: a very thin bright ring where face meets edge (white, emissive 0.35). This is what makes it look crisp.
- **No score line** unless the brief asks for one. It reads as "generic pill" and gets noisy at small sizes.
- **Unbranded.** No embossing, no maker's mark (see `compliance-es.md`).
- One material across the whole tablet, especially with sheen, makes it look like a marshmallow.

## Light

- Hemisphere light (white sky, warm off-white ground, 1.05) plus one warm key light from upper left (1.85) with soft shadows (PCF, 2048 map, radius 3).
- A room environment map at low intensity (0.35) adds reflections on porcelain and glass.
- `NeutralToneMapping` keeps brand colours true. ACES desaturates evergreen and lime.
- The shadow camera follows the view target, so shadows stay sharp wherever the camera goes.

## Copy and type

- Brand display face for headings (Nib Pro for Juniper) and brand sans for body (Atlas Grotesk). Sentence case. No exclamation marks.
- Copy sits on the half of the screen opposite the scene's mechanism, about 470px wide. The hero headline gets about 600px.
- Small HTML overlays, projected from 3D positions, carry labels the 3D can't: ticks, a doctor card, day letters, chat bubbles. Keep them glassy and small.
