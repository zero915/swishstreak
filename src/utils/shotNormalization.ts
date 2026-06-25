/**
 * Anti-cheat shot normalization.
 *
 * The server's swish-streak replay engine simulates every shot against a FIXED
 * reference resolution (CANONICAL 390×844) — it can't trust a client-reported
 * screen size, or a bigger fake screen would mean an easier, oversized rim.
 *
 * So before a shot is added to the move list that gets submitted to
 * `POST /api/games/swish-streak/game/submit`, the client must convert its real
 * on-screen swipe into that same canonical space. This module is that conversion.
 *
 * Keep CANONICAL_* identical to game-platform-server/src/games/swish-streak/constants.ts.
 */
export const CANONICAL_SCREEN_WIDTH = 390;
export const CANONICAL_SCREEN_HEIGHT = 844;

export interface RawSwipe {
  dx: number;
  dy: number;
  velocityX?: number;
  velocityY?: number;
}

/** The exact move shape the server's swish-streak engine expects for an arcade shot. */
export interface ShotMove {
  type: 'shot';
  dx: number;
  dy: number;
  velocityX?: number;
  velocityY?: number;
  tMs: number;
}

/**
 * Scale a real-device swipe into the canonical reference frame. A swipe spanning
 * X% of the real screen maps to X% of the canonical screen, so the same gesture
 * produces the same shot regardless of device size.
 *
 * @param tMs milliseconds since the session started (NOT wall-clock) — the engine
 *            uses this for deterministic hoop-position lookup.
 */
export function normalizeShot(swipe: RawSwipe, screenWidth: number, screenHeight: number, tMs: number): ShotMove {
  const fx = CANONICAL_SCREEN_WIDTH / screenWidth;
  const fy = CANONICAL_SCREEN_HEIGHT / screenHeight;
  return {
    type: 'shot',
    dx: swipe.dx * fx,
    dy: swipe.dy * fy,
    velocityX: swipe.velocityX !== undefined ? swipe.velocityX * fx : undefined,
    velocityY: swipe.velocityY !== undefined ? swipe.velocityY * fy : undefined,
    tMs,
  };
}

/**
 * Accumulates the normalized shot list for one ranked run, in submit order.
 * Usage:
 *   const run = new RankedRun();              // at /game/start
 *   run.recordShot(swipe, width, height);     // on each shot
 *   await submitGame({ sessionId, moves: run.moves, claimedScore });
 */
export class RankedRun {
  readonly startedAt = Date.now();
  readonly moves: ShotMove[] = [];

  recordShot(swipe: RawSwipe, screenWidth: number, screenHeight: number): void {
    this.moves.push(normalizeShot(swipe, screenWidth, screenHeight, Date.now() - this.startedAt));
  }
}
