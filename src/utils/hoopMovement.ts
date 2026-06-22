import {
  HOOP_HOLD_OFFSET,
  HOOP_MOVE_THRESHOLDS,
  HOOP_OSCILLATE_AMPLITUDE,
  HOOP_OSCILLATE_BASE_MS,
  HOOP_OSCILLATE_SPEED_STEP_MS,
  HOOP_RANDOM_AMPLITUDE,
  HOOP_RANDOM_MOVE_MS,
  HOOP_RANDOM_PAUSE_MS_MAX,
  HOOP_RANDOM_PAUSE_MS_MIN,
} from '../constants/gameConfig';

function hash01(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function smoothstep(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

function getOscillatePeriod(shotsMade: number): number {
  let period = HOOP_OSCILLATE_BASE_MS;
  if (shotsMade >= HOOP_MOVE_THRESHOLDS.speedTier3) {
    period -= HOOP_OSCILLATE_SPEED_STEP_MS * 3;
  } else if (shotsMade >= HOOP_MOVE_THRESHOLDS.speedTier2) {
    period -= HOOP_OSCILLATE_SPEED_STEP_MS * 2;
  } else if (shotsMade >= HOOP_MOVE_THRESHOLDS.speedTier1) {
    period -= HOOP_OSCILLATE_SPEED_STEP_MS;
  }
  return period;
}

function getRandomOffset(elapsedMs: number, shotsMade: number): number {
  const avgPause = (HOOP_RANDOM_PAUSE_MS_MIN + HOOP_RANDOM_PAUSE_MS_MAX) / 2;
  const cycleMs = HOOP_RANDOM_MOVE_MS + avgPause;
  const cycleIndex = Math.floor(elapsedMs / cycleMs);
  const within = elapsedMs % cycleMs;

  const targetX = (hash01(cycleIndex + shotsMade * 0.31) * 2 - 1) * HOOP_RANDOM_AMPLITUDE;
  const prevTarget =
    cycleIndex > 0
      ? (hash01(cycleIndex - 1 + shotsMade * 0.31) * 2 - 1) * HOOP_RANDOM_AMPLITUDE
      : 0;

  const pauseMs =
    HOOP_RANDOM_PAUSE_MS_MIN +
    hash01(cycleIndex + 17) * (HOOP_RANDOM_PAUSE_MS_MAX - HOOP_RANDOM_PAUSE_MS_MIN);

  if (within < pauseMs) {
    return prevTarget;
  }

  const moveT = smoothstep((within - pauseMs) / HOOP_RANDOM_MOVE_MS);
  return prevTarget + (targetX - prevTarget) * moveT;
}

/** Arcade-only horizontal hoop offset driven by makes in the current run. */
export function getHoopOffsetX(shotsMade: number, elapsedMs: number): number {
  if (shotsMade < HOOP_MOVE_THRESHOLDS.holdLeft) {
    return 0;
  }
  if (shotsMade < HOOP_MOVE_THRESHOLDS.holdRight) {
    return -HOOP_HOLD_OFFSET;
  }
  if (shotsMade < HOOP_MOVE_THRESHOLDS.oscillate) {
    return HOOP_HOLD_OFFSET;
  }

  if (shotsMade >= HOOP_MOVE_THRESHOLDS.random) {
    return getRandomOffset(elapsedMs, shotsMade);
  }

  const period = getOscillatePeriod(shotsMade);
  return Math.sin((elapsedMs / period) * Math.PI * 2) * HOOP_OSCILLATE_AMPLITUDE;
}
