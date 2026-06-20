# Swish Streak

FRVR-style swipe-to-shoot basketball built with **Expo SDK 56** and **React Native**. Flick up to shoot, swipe left/right to aim, build streaks, and unlock shop cosmetics.

## Requirements

- **Node.js** 20.x (LTS recommended)
- **npm** 9+
- **Expo Go** app matching **SDK 56** on your test device
- Optional: Android SDK / Xcode for native builds

## Quick start

```bash
npm install
cp .env.example .env   # fill Firebase / OAuth keys if using auth & cloud features
npm run start:tunnel   # best for physical devices (Odin, GPD, phones)
```

Other scripts:

| Command | Description |
|---------|-------------|
| `npm start` | Local dev server (headless) |
| `npm run start:debug` | Dev server with full Metro UI |
| `npm run android` | Open on Android emulator/device |
| `npm run ios` | Open on iOS simulator/device |
| `npm run web` | Run in browser (limited; game is touch-first) |

Scan the QR code with Expo Go, or press `a` / `i` in the terminal for Android / iOS.

## Project structure

```
src/
├── components/     # Ball, Hoop, GameHUD, celebrations, shop UI
├── constants/      # gameConfig, shopCatalog, campaignLevels, theme
├── context/        # Auth + player progress (AsyncStorage)
├── hooks/          # useGameSession, leaderboard, friends
├── navigation/     # Stack + deep linking
├── screens/        # Home, Game, Shop, Campaign, Social
├── services/       # Firebase auth, leaderboard, friends
├── types/          # Shared TypeScript types
└── utils/
    ├── ballPhysics.ts      # Scoring, rim bounce, substep simulation
    ├── trajectory.ts       # Swipe → launch velocity, sweet-spot power
    ├── hoopGeometry.ts     # Physics rim hitbox (shared with scoring)
    ├── hoopSpriteLayout.ts # Visual-only hoop/net layout + RIM_VISUAL_DROP
    ├── gameSizing.ts       # Ball/rim proportions vs screen width
    └── difficulty.ts       # Arcade/campaign hoop distance & drift
assets/images/      # ball, hoop, background, FX sprites
```

## Game architecture (high level)

### Shot flow

1. **Gesture** — `Ball.tsx` pan gesture → `computePovShotVelocity()` in `trajectory.ts`
2. **Physics loop** — `stepBallPhysics()` at 120 Hz substeps; rim collisions & score detection
3. **Score** — `tryScore()` when ball crosses rim lip inside inner opening
4. **Celebration** — `MakeCelebration` + haptics on pop-in; ball drops **behind net** layer then returns

### Visual vs physics hoop

- **Physics rim** uses `getPhysicsRimCenterY(hoopY)` = `hoopY + RIM_VISUAL_DROP` (22px) so scoring matches the sprite lip.
- **Hoop render** splits into back layer (backboard + rim) and front layer (net). Ball sits between them; `behindNet` z-index toggles on swish.
- Do **not** move physics without matching visuals — prefer `BASE_HOOP_Y_OFFSET` and `hoopSpriteLayout.ts` together.

### Sweet-spot shooting

Mid flick = swish; too soft = short; too hard = overshoot. Tuned in `getPeakRiseFactor()` (`trajectory.ts`).

## Configuration

| Constant | File | Purpose |
|----------|------|---------|
| `BASE_HOOP_Y_OFFSET` | `gameConfig.ts` | Rim center height (fraction of screen) |
| `RIM_VISUAL_DROP` | `hoopSpriteLayout.ts` | Sprite rim offset; also applied to physics |
| `BALL_DIAMETER_RATIO` | `gameConfig.ts` | Ball size vs screen width |
| `RIM_INNER_TO_BALL_DIAMETER` | `gameConfig.ts` | Opening tightness (~1.22 = FRVR-style) |

## Assets

Sprites live under `assets/images/`:

- `background/bg_default.png`
- `hoop/backboard_classic.png`, `hoop/rim_net_classic.png`
- `ball/ball_classic.png`
- `fx/sparkle.png`, `fx/combo_badge.png` (optional FX)

Shop items reference these via `src/constants/gameAssets.ts` and `shopCatalog.ts`.

## Firebase (optional)

Copy `.env.example` → `.env` and set `EXPO_PUBLIC_FIREBASE_*` keys. Without Firebase, guest progress still works via AsyncStorage (`PlayerDataContext`).

Features using Firebase when configured:

- Google / Facebook sign-in
- Leaderboards & friends

## Key dependencies (pinned)

- `expo` ~56.0.12
- `react-native` 0.85.3
- `react-native-reanimated` 4.3.1
- `react-native-gesture-handler` ~2.31.1
- `react-native-worklets` 0.8.3

Always consult [Expo SDK 56 docs](https://docs.expo.dev/versions/v56.0.0/) before upgrading.

## Testing on handheld Android

Recommended for Ayn Odin / GPD-style devices:

```bash
npx expo start -c --tunnel
```

Use `-c` after changing assets or native-related config. If shots feel off, calibrate `VELOCITY_SCALE` and sweet-spot band in `trajectory.ts` — device flick speeds vary.

## AI / Cursor agents

See **[AGENTS.md](./AGENTS.md)** for agent roles, rules, and project skills when using Cursor.

- Rules: `.cursor/rules/`
- Skills: `.cursor/skills/`

## License

Private project.
