---
name: swishstreak-physics
description: Tune Swish Streak shot physics, scoring detection, and sweet-spot power curve. Use when fixing makes/misses, rim bounce, swipe feel, or overshoot behavior.
---

# Swish Streak — Physics

## Files

| File | Role |
|------|------|
| `src/utils/ballPhysics.ts` | Substep sim, `tryScore`, rim collision |
| `src/utils/trajectory.ts` | Flick → `vx`/`vy`, `getPeakRiseFactor` |
| `src/utils/hoopGeometry.ts` | Rim hitbox (must match scoring) |
| `src/constants/gameConfig.ts` | GRAVITY, VELOCITY_SCALE, hoop offset |

## Workflow

1. Reproduce: center shot, soft, hard, angled — note visual vs registered result.
2. Check physics rim Y uses `getPhysicsRimCenterY(hoopY)` in Ball (not raw `hoopY`).
3. Adjust sweet spot in `getPeakRiseFactor()` before tightening `tryScore`.
4. If descent scores fail: verify `crossedLipDown` uses `segmentCrosses(prevBallTop, ballTop, lip)`.
5. Run quick sim with `npx tsx -e "..."` importing utils (see README).

## Sweet spot tuning

- Intensity = `min(flickMag * VELOCITY_SCALE / 520, 1)`
- Flat band `0.35–0.68` → factor `1.08` for reliable mid swishes
- Hard tail `>= 0.70` → factor `1.12+` for overshoot misses

## Do not

- Score on loose padding without checking visual rim alignment.
- Scale both `vx` and `vy` when hitting MAX_SPEED — trim horizontal first.
