# SwishStreak: Firebase → Cloudflare migration plan (Option A, phased)

You picked Option A (port to Cloudflare, then delete Firebase). After reading the whole
SwishStreak backend, this is bigger than "delete `functions/`" — it has hard dependencies
that must be done in order. Each phase below is independently verifiable; do **not** delete
anything until its replacement is verified locally.

> Why phased and not done in one shot: I can't execute anything against your machine from
> here (the sandbox can't run `npm`/`wrangler`/`expo` on the WSL mount), so untested code
> can't be trusted. Each phase ends with a check **you** run. Tell me to start a phase and
> I'll write that phase's code; you verify; we move on.

## What SwishStreak uses Firebase for (full inventory)

| Area | Where | Replaces with |
| --- | --- | --- |
| Auth (identity) | `config/firebase.ts`, `authService`, `AuthContext` | **Keep** — server already verifies Firebase ID tokens (free) |
| User profile, XP/levels, friends (invite code), location, campaign progress | `userService.ts` (Firestore `users/`) | New D1 tables + API routes |
| Leaderboards: arcade all-time/weekly/country/region + campaign | `leaderboardService.ts` (Firestore `leaderboards/`) | D1 `scores`/`player_game_stats` + new routes |
| Coins (global wallet) | Firestore `users.totalCoins` | ✅ `totalCoins` in the profile JSON on Cloudflare (Phase 1) |
| Versus (PvP) matchmaking + rounds | `functions/` callables + `versusService` | D1 + routes + **Cron Trigger** (polling, not realtime) |
| Tournaments (brackets, bots, pot) | `functions/` callables + `tournamentService` | D1 + routes + Cron Trigger |
| Scheduled forfeit of stale rounds | `functions/` `onSchedule` | Cloudflare **Cron Trigger** |
| Realtime updates | Firestore `onSnapshot` | **Polling** (Workers can't push) |

## Phases (do in order)

### Phase 0 — Foundation (partly done)
- ✅ `gameServerClient.ts` added (env URL + Firebase-token auth header).
- ✅ Server local-dev auth bypass for testing.
- **You verify:** server runs locally, `gameServerClient` can hit `/api/players/sync`.

### Phase 1 — Identity, profile & coin wallet on Cloudflare  ✅ DONE (verify locally)
**Coin-wallet decision (revised):** the wallet is the `totalCoins` field inside the stored
profile JSON — *not* a separate `player_game_stats` row. This keeps the client's `PlayerData`
model intact (it reads `profile.totalCoins` everywhere) and lets later phases debit/credit
betting atomically on the profile row. Supersedes the earlier `player_game_stats` suggestion.

What was built:
- `game-platform-server/migrations/0005_app_profiles.sql` — generic `app_profiles(uid, game_id,
  profile_json, invite_code, display_name)` JSON store.
- `game-platform-server/src/platform/profiles.ts` — routes mounted at `/api/profiles/:gameId`:
  `GET/PUT/PATCH /me`, `GET /user/:uid`, `GET /by-invite/:code`, `POST /batch`, `POST /friends`.
  The server always stamps the authoritative `uid` from the verified token.
- `SwishStreak/src/services/gameServerClient.ts` — profile methods added.
- `SwishStreak/src/services/userService.ts` — rewired off Firestore to the API; **all public
  function signatures unchanged**, so the rest of the app is untouched. Firebase Auth stays.

**You verify (locally):**
1. Server: `npm run db:migrate:local` (applies 0005), `npm run dev`, `npm run typecheck`.
2. Profile round-trip with the dev bypass:
   ```bash
   curl -X PUT localhost:8787/api/profiles/swish-streak/me \
     -H "Authorization: Bearer dev:alice" -H "Content-Type: application/json" \
     -d '{"displayName":"Alice","inviteCode":"ABC123","friendIds":[],"totalCoins":50,"totalXP":0,"playerLevel":1,"shopState":{"owned":[],"equipped":{"ball":"","backboard":"","background":""}},"campaignProgress":{},"arcadeBest":{"score":0,"streak":0,"shotsMade":0}}'
   curl localhost:8787/api/profiles/swish-streak/me -H "Authorization: Bearer dev:alice"
   curl localhost:8787/api/profiles/swish-streak/by-invite/ABC123 -H "Authorization: Bearer dev:alice"
   curl -X PATCH localhost:8787/api/profiles/swish-streak/me \
     -H "Authorization: Bearer dev:alice" -H "Content-Type: application/json" -d '{"totalCoins":120}'
   ```
3. In the app (with `EXPO_PUBLIC_API_URL` + server running): sign in → profile is created in D1,
   coins/XP/progress save and reload correctly, add-friend-by-code works.

Note: leaderboards + versus + tournaments still use Firebase until Phases 2–4 — that's
expected; the app keeps working in this hybrid state.

### Phase 2 — Leaderboards on Cloudflare
- Map arcade/campaign + regional/weekly onto `scores` + `player_game_stats` (the generic
  leaderboard routes already exist: `/leaderboard/{global,weekly,regional,friends}`).
- Port `calculateArcadeScore`/star logic into the swish-streak engine's scoring so
  `/game/submit` accepts arcade runs. (Also resolve the screen-size normalization gap noted
  in the server README so shots validate.)
- Rewire `leaderboardService.ts`.
- **You verify:** a run submits, appears on global/weekly/regional boards.

### Phase 3 — Versus (PvP) on Cloudflare
- New D1 tables: `versus_queue`, `versus_matches` (JSON columns mirroring the current docs).
- New routes under `/api/versus/*`: join/leave queue, submit round, get match.
- Replace `setTimeout` bot pairing + the scheduled forfeit with a **Cron Trigger**
  (`wrangler.toml [triggers] crons = ["*/5 * * * *"]` + a `scheduled()` handler that pairs
  waiting players with bots after a delay and forfeits expired rounds).
- Rewire `versusService.ts`; replace `onSnapshot` with polling (e.g. refetch match every 3s
  while a round is open).
- **You verify:** queue → match (vs bot), best-of-3 resolves, pot pays out.

### Phase 4 — Tournaments on Cloudflare
- New D1 table `tournaments`; routes `/api/tournaments/*` (join, get, open).
- Bracket advance + lock-after-timeout handled by the same Cron handler.
- Rewire `tournamentService.ts` (polling instead of `onSnapshot`).
- **You verify:** join → bracket fills with bots → advances → winner gets pot.

### Phase 5 — Delete Firebase backend
Only after Phases 1–4 are verified:
- Delete `functions/`, `firebase.json`, `firestore.rules`.
- Drop `firebase-tools` (devDep) and `firebase-admin`; keep `firebase` (Auth) and `firebase`
  Auth config.
- Remove Firestore reads/writes from all services.
- **You verify:** full app works end-to-end with Firebase Functions/Firestore gone.

## Recommendation
Start with **Phase 1** — it's the dependency root and the smallest verifiable unit. Say
"do Phase 1" and I'll write the migration + routes + `userService` rewiring; you run the
Phase 1 check; then we proceed. This keeps every step testable instead of a big-bang rewrite
neither of us can verify.
