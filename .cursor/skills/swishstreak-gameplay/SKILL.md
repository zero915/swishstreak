---
name: swishstreak-gameplay
description: Work on Swish Streak game session, HUD, celebrations, difficulty, and GameScreen layout. Use when changing streaks, misses, arcade levels, UI overlaps, or celebration flow.
---

# Swish Streak — Gameplay & UI

## Core files

| File | Role |
|------|------|
| `src/screens/GameScreen.tsx` | Main loop wiring, render order |
| `src/components/GameHUD.tsx` | Safe-area HUD, back, coins, streak |
| `src/hooks/useGameSession.ts` | Streak, misses, level, run state |
| `src/utils/difficulty.ts` | Hoop distance, drift, wind, rim scale |
| `src/components/MakeCelebration.tsx` | Score pop-in, haptics sync |

## Render order

```
CourtBackground → GameHUD → Hoop (Ball inside) → ComboBadge → MakeCelebration → LaunchPad
```

## Session rules

- `recordMake` / `recordMiss` via hooks; coins applied on celebration pop-in (`handleCelebrationPopIn`).
- Next shot allowed during `scoreExit` phase (non-blocking).
- `runBlocked` when run over or level complete/failed.

## HUD

- Single panel with `useSafeAreaInsets()` — no duplicate back button.
- z-index 30 above hoop.

## Difficulty

- `getArcadeDifficulty(level)` — distance, rimScale, drift, wind, perfect window.
- `getHoopY(screenHeight, distance)` = `screenHeight * distance`.
