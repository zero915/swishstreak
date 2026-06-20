---
name: swishstreak-hoop-visuals
description: Fix Swish Streak hoop, rim, and net visual alignment, layering, and ball-behind-net swish effect. Use when net/rim/backboard look misaligned or ball renders in wrong depth order.
---

# Swish Streak — Hoop visuals

## Layer stack (screen order)

1. `Hoop` back layer — backboard + rim (clipped sprite top)
2. `Ball` — between layers (`GameScreen` nests Ball inside `<Hoop>`)
3. `Hoop` net layer — net strings only (clipped sprite bottom)

## Key APIs

```typescript
import { getPhysicsRimCenterY, RIM_VISUAL_DROP, getRimNetClipHeights } from '../utils/hoopSpriteLayout';
```

- `RIM_VISUAL_DROP` (22): shifts sprite rim down; **same value applied to physics** via `getPhysicsRimCenterY`.
- `getRimNetClipHeights(rimWidth)`: `rimBackClipH`, `netFrontOffsetY`, `netFrontHeight`.

## Net placement fix pattern

Net layer absolute position:

```typescript
top: containerTop + rimClip.netFrontOffsetY,
left: x - rimNetWidth / 2,
```

Sprite net image inside clip:

```typescript
marginTop: -rimClip.rimBackClipH + 2,
```

## Ball depth

- `behindNet` shared value in `Ball.tsx`
- z-index 13 approaching; 8 after score crosses rim
- Score exit animates to `geo.netBottom` then back to launch

## Backboard size

`boardScale` in `getHoopSpriteLayout()` — lower if HUD/backboard overlap (currently ~1.28).
