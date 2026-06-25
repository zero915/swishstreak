# SwishStreak anti-cheat (shot replay)

## Where scores come from today
- **Arcade**: the client computes the score and posts it to `/api/boards/swish-streak`
  (`leaderboardService.submitArcadeScore`). Trusted-client — cheatable.
- **Versus rounds**: client sends a score, server caps it at `max(arcadeBest*1.15, 50)`.

The server already ships a deterministic **replay engine** (`src/games/swish-streak/`) that can
recompute the authoritative score from a seed + the shot move-list via
`POST /api/games/swish-streak/game/submit`. The missing client piece was **screen-size
normalization** — now provided.

## Delivered: `src/utils/shotNormalization.ts`
- `normalizeShot(swipe, screenWidth, screenHeight, tMs)` converts a real-device swipe into the
  server's canonical **390×844** frame (so a bigger screen can't fake an easier rim).
- `RankedRun` accumulates the normalized `{type:'shot', dx, dy, velocityX, velocityY, tMs}`
  list in submit order.

## Integration (in `useGameSession` / `GameScreen`)
1. On run start: `const { sessionId } = await startGame('arcade')` and `const run = new RankedRun()`.
2. On each shot, with the **same swipe vector the Ball uses** and the real layout size:
   `run.recordShot({ dx, dy, velocityX, velocityY }, layout.width, layout.height)`.
3. On run end: `const res = await submitGame({ sessionId, moves: run.moves, claimedScore })`
   and use `res.score` (server's authoritative value) for the leaderboard.

## ⚠️ Verify engine parity BEFORE enforcing
The server README flags the swish-streak engine port as **not yet verified** against the real
client. Switching the leaderboard to the replayed score without checking will reject legit runs.
Known gaps:
- **Campaign mode unsupported** — arcade shots only.
- **Hoop-velocity approximation** during fast oscillation (levels with `shotsMade >= 9`).
- General float bit-for-bit risk between client and server simulation.

## Recommended rollout — shadow mode
1. Keep submitting the casual board score (current behavior) so play isn't affected.
2. **Also** record a `RankedRun` and submit it; log when `res.score !== claimedScore`.
3. Run the server's `npm test` and add a few identical seed/input-log cases (real client output
   vs. engine output) per Section 8 of the server build doc.
4. Once the mismatch rate is ~0, flip the leaderboard to use the **server-validated** score and
   drop the trusted-client path.
