---
name: swishstreak-expo-dev
description: Run and debug Swish Streak on Expo Go SDK 56, including WSL tunnel dev on handheld Android devices.
---

# Swish Streak — Expo dev

## Start

```bash
npm install
npm run start:tunnel    # physical device via tunnel
# or
npm run start:debug     # Metro UI visible
```

Clear cache after asset or native dep changes:

```bash
npx expo start -c --tunnel
```

## Device requirements

- **Expo Go** must match **SDK 56** (same as `package.json` expo version).
- Handheld Android (Odin, GPD): tunnel mode avoids LAN issues from WSL.

## Common issues

| Symptom | Fix |
|---------|-----|
| Reanimated/worklets error | Ensure `react-native-worklets@0.8.3` installed; babel preset includes reanimated plugin |
| Stale assets | `-c` clear cache |
| Cannot connect | Use `--tunnel`; check Expo Go version |
| Firebase auth fails | Fill `.env` from `.env.example` |

## Scripts (package.json)

- `start` — headless Expo (`EXPO_UNSTABLE_HEADLESS=1`)
- `android` / `ios` / `web` — platform shortcuts

## Do not

- Upgrade Expo SDK without reading v56 migration docs and user approval.
- Commit `.env`.
