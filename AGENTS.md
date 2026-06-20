# Swish Streak — Agent Guide

Instructions for AI agents (Cursor, Codex, etc.) working on this codebase.

## Before any code change

1. Read [Expo SDK 56 docs](https://docs.expo.dev/versions/v56.0.0/) — APIs differ from older SDKs.
2. Prefer **minimal diffs**; match existing TypeScript, Reanimated, and gesture-handler patterns.
3. **Never commit** `.env` or secrets.
4. Physics and visuals must stay aligned — see [Hoop & physics agent](#hoop--physics-agent).

## Repository map

| Area | Paths | Owner agent |
|------|-------|-------------|
| Shot physics & scoring | `src/utils/ballPhysics.ts`, `trajectory.ts` | Physics agent |
| Hoop layout | `hoopGeometry.ts`, `hoopSpriteLayout.ts`, `Hoop.tsx` | Hoop agent |
| Game loop & UI | `Ball.tsx`, `GameScreen.tsx`, `GameHUD.tsx` | Gameplay UI agent |
| Progression & modes | `useGameSession.ts`, `difficulty.ts`, `campaignLevels.ts` | Game design agent |
| Firebase & social | `src/services/*`, `src/context/*`, `config/firebase.ts` | Backend agent |
| Expo / run / deps | `package.json`, `app.json`, `babel.config.js` | Build agent |

## Agents

### Physics agent

**When:** Swipe feel, makes/misses, rim bounce, overshoot/sweet-spot, scoring false positives/negatives.

**Read first:**
- `src/utils/ballPhysics.ts` — `tryScore()`, substep loop, `peakY` overshoot guards
- `src/utils/trajectory.ts` — `getPeakRiseFactor()`, intensity from flick velocity
- `src/constants/gameConfig.ts` — gravity, velocity scale, hoop offset

**Rules:**
- Score detection uses **perspective-scaled** ball radius at rim depth.
- Ascending and descending lip crossing use **segment intersection**, not single-frame checks.
- Centered shots get wider opening tolerance; overshoot guards apply mainly off-center or extreme arcs.
- After changing `RIM_VISUAL_DROP` or `BASE_HOOP_Y_OFFSET`, verify center swishes on 400×800 and 1080×1920 (script or device).

**Skill:** `.cursor/skills/swishstreak-physics/SKILL.md`

---

### Hoop & physics agent

**When:** Rim/net sprite alignment, ball behind net, backboard scale, z-index layering.

**Read first:**
- `src/utils/hoopSpriteLayout.ts` — `RIM_VISUAL_DROP`, `getRimNetClipHeights()`, `getPhysicsRimCenterY()`
- `src/components/Hoop.tsx` — back layer vs net layer; `children` slot for Ball
- `src/components/Ball.tsx` — `behindNet`, score exit through net

**Rules:**
- Net overlay screen Y = `containerTop + netFrontOffsetY` (never use container-relative Y as screen Y).
- `getPhysicsRimCenterY(hoopY)` must match visual rim lip for scoring and trajectory.
- Ball: z-index 13 in front of net while approaching; z-index 8 behind net after rim crossing on score.

**Skill:** `.cursor/skills/swishstreak-hoop-visuals/SKILL.md`

---

### Gameplay UI agent

**When:** HUD, celebrations, combo badge, screens, navigation, safe areas, overlaps.

**Read first:**
- `src/screens/GameScreen.tsx` — render order: background → HUD → Hoop (with Ball) → overlays
- `src/components/GameHUD.tsx` — compact safe-area bar; back integrated
- `src/components/MakeCelebration.tsx`, `ComboBadge.tsx`

**Rules:**
- HUD uses `useSafeAreaInsets()`; z-index 30; do not add a second floating back button.
- Hoop wraps Ball as child for correct net layering.
- Keep touch targets ≥ 48dp; game remains playable during celebration (non-blocking shots).

**Skill:** `.cursor/skills/swishstreak-gameplay/SKILL.md`

---

### Game design agent

**When:** Arcade difficulty curves, campaign levels, streak multipliers, shop balance.

**Read first:**
- `src/hooks/useGameSession.ts`
- `src/utils/difficulty.ts`
- `src/constants/campaignLevels.ts`, `gameConfig.ts`

**Rules:**
- Difficulty params: `distance` (hoop Y fraction), `rimScale`, `wind`, `drift`, `perfectWindow`.
- Streak multiplier capped by `MAX_MULTIPLIER` in `gameConfig.ts`.

**Skill:** `.cursor/skills/swishstreak-gameplay/SKILL.md` (difficulty & session sections)

---

### Backend agent

**When:** Auth, Firestore leaderboard, friends, guest merge, env config.

**Read first:**
- `src/config/firebase.ts`
- `src/services/authService.ts`, `leaderboardService.ts`, `friendsService.ts`
- `src/utils/mergeProgress.ts`
- `.env.example`

**Rules:**
- All public keys use `EXPO_PUBLIC_` prefix.
- Guest progress in AsyncStorage must remain playable without Firebase.

**Skill:** `.cursor/skills/swishstreak-firebase/SKILL.md`

---

### Build agent

**When:** Expo start issues, dependency bumps, Android/iOS config, tunnel dev on handhelds.

**Read first:**
- `package.json` scripts
- `app.json`
- README.md — Quick start

**Rules:**
- Do not bump Expo SDK without explicit user request and full doc review.
- Reanimated 4.x + worklets 0.8.x must stay compatible (see `package.json`).
- Prefer `npm run start:tunnel` for WSL → handheld testing.

**Skill:** `.cursor/skills/swishstreak-expo-dev/SKILL.md`

---

## Cursor rules (auto-loaded)

| Rule file | Scope |
|-----------|--------|
| `.cursor/rules/swishstreak-project.mdc` | Always apply |
| `.cursor/rules/expo-sdk56.mdc` | Always apply |
| `.cursor/rules/game-physics.mdc` | Physics utils |
| `.cursor/rules/hoop-visual-layering.mdc` | Hoop/Ball components |
| `.cursor/rules/react-native-ui.mdc` | All TSX |

## Cursor skills (project)

| Skill | Use when |
|-------|----------|
| `.cursor/skills/swishstreak-physics/` | Shot feel, scoring, rim bounce |
| `.cursor/skills/swishstreak-hoop-visuals/` | Rim/net alignment, ball depth |
| `.cursor/skills/swishstreak-gameplay/` | HUD, session, difficulty, GameScreen |
| `.cursor/skills/swishstreak-firebase/` | Auth, leaderboard, friends |
| `.cursor/skills/swishstreak-expo-dev/` | Expo Go, tunnel, deps |

## Common pitfalls (from production debugging)

1. **Net floating on backboard** — net layer missing `containerTop` offset.
2. **Visual make, no score** — physics rim not using `getPhysicsRimCenterY()`.
3. **Hard swipes always miss / always make** — sweet-spot curve or overshoot guards out of balance.
4. **HUD overlaps backboard** — reduce backboard scale or lower hoop; use compact HUD only.
5. **PovShotInput type** — extend `PovShotInput` in `trajectory.ts` if adding `velocityX`/`velocityY` to the type (used by `Ball.tsx`).

## Verification checklist

After physics or hoop changes:

- [ ] Center mid-flick swishes on phone aspect ratio
- [ ] Soft flick airballs short; hard flick overshoots
- [ ] Angled shot can rim-bounce visibly
- [ ] On score, ball passes behind net then returns
- [ ] HUD readable; no overlap with back button

After UI changes:

- [ ] Safe area respected on notched devices
- [ ] Expo Go 56 loads without reanimated/worklet errors
