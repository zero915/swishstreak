---
name: swishstreak-firebase
description: Configure and extend Swish Streak Firebase auth, leaderboard, and friends features. Use when working with login, Firestore, env vars, or guest vs signed-in progress merge.
---

# Swish Streak — Firebase & backend

## Setup

1. Copy `.env.example` → `.env`
2. Set all `EXPO_PUBLIC_FIREBASE_*` and OAuth client IDs
3. Never commit `.env`

## Files

| File | Role |
|------|------|
| `src/config/firebase.ts` | Firebase init |
| `src/services/authService.ts` | Google/Facebook/guest |
| `src/services/leaderboardService.ts` | Arcade scores |
| `src/services/friendsService.ts` | Friends list |
| `src/context/AuthContext.tsx` | Auth state |
| `src/context/PlayerDataContext.tsx` | Coins, XP, shop, progress |
| `src/utils/mergeProgress.ts` | Guest ↔ account merge |

## Rules

- Guest mode must work with AsyncStorage only (`DEFAULT_PLAYER_DATA`, `STORAGE_KEYS` in `gameConfig.ts`).
- Public env vars only — no secret keys in client bundle.
- Leaderboard updates via `leaderboardService`; use `gh` for GitHub if CI-related (not Firebase).

## Testing without Firebase

Run app without `.env` — guest progress and arcade still playable; social/leaderboard degraded gracefully.
