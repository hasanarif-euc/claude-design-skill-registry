# Physics: making it believable

Scroll sets the pace, but every path has to be one a real object could take. People notice wrong motion straight away, even when they can't say what's wrong.

## Rules

1. **Never climb a step.** The object leaves one surface at the same height it lands on the next, or lower. On the Spain page the start became a lime puck exactly level with the chute, so the tablet no longer hopped up onto it.
2. **Roll the right way.** The roll angle equals the distance travelled divided by the radius, around the axle, which is horizontal and perpendicular to the direction of travel. No roll while falling straight down, and the roll freezes on landing.
3. **Fall in a parabola.** Off an edge, horizontal speed is constant and the drop grows with time squared (`y = y0 - (y0 - yLand) × t²`). Nothing goes upwards on the way off an edge.
4. **Climb only on momentum.** A dip down and back up (the carved channel) works. A climb from flat ground doesn't.
5. **Land, then settle.** A disc lands on its edge, then tips over around the contact point and rocks to rest:
   - tip angle `φ(t) = (π/2)(t / 0.5)²` for t < 0.5
   - then a decaying rock: `π/2 - 0.2·e^(-7(t-0.5))·|sin(16(t-0.5))|`
   - centre height `R·cos φ + PT·sin φ`, centre shifted sideways by `R·sin φ`
   - orientation: rotate the upright pose around the direction of travel by `-φ`
   Never float the object down or spin it in mid-air.
6. **Cause and effect.** A part reacts when the object reaches it. Chains (dominoes) can carry on by themselves once started. If you need strict realism, add a small lever the object knocks to start the chain.
7. **Keep sizes consistent.** Chute width 1.3 and depth 0.3 against a tablet of radius 1 and thickness 0.86. A pit about 4.6 wide and 1.4 deep. A domino 2.1 tall.

## Common errors and fixes

| What it looks like | Cause | Fix |
|---|---|---|
| The object sinks into the chute on slopes | Its centre offset is vertical, not along the surface normal | Offset by `normal × R`, where `normal = side × tangent` |
| The object turns sharply at corners | Its heading is taken over ±2 samples | Use ±6 samples |
| The object hovers, then drops slowly into the pit | The settle path was a slow descent | Parabolic fall to an edge landing, then tip over |
| It looks like the object pops out of the floor | It climbs from flat ground | Use a dip and climb back out, or a ramp down |
