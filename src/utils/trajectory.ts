import {
  FLICK_THRESHOLD,
  GRAVITY,
  MAX_SPEED,
  MIN_SWIPE_DISTANCE,
  POV_MAX_AIM_OFFSET,
  POV_MIN_SHOT_POWER,
  SWIPE_SCALE,
  VELOCITY_SCALE,
} from '../constants/gameConfig';
import { LaunchVelocity, SwipeVector } from '../types';

export interface SwipeInput extends SwipeVector {
  velocityX?: number;
  velocityY?: number;
}

export interface PovShotInput extends SwipeVector {
  launchX: number;
  launchY: number;
  hoopX: number;
  hoopY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Peak rise as fraction of launch→hoop distance.
 * Sweet band ~0.28–0.68 peaks through the rim; softer falls short, harder sails over.
 */
function getPeakRiseFactor(intensity: number): number {
  const t = clamp(intensity, 0, 1);

  if (t < 0.22) {
    return 0.36 + t * 0.55;
  }
  if (t >= 0.70) {
    return 1.12 + (t - 0.70) * 1.35;
  }
  if (t >= 0.35 && t <= 0.68) {
    return 1.08;
  }
  if (t < 0.35) {
    const u = (t - 0.22) / 0.13;
    return 0.48 + u * 0.6;
  }
  const u = (t - 0.68) / 0.02;
  return 1.08 + u * 0.04;
}

/**
 * FRVR-style shot: mid flick arcs through the hoop; extremes miss high or short.
 */
export function computePovShotVelocity(input: PovShotInput): LaunchVelocity {
  const {
    launchX,
    launchY,
    hoopX,
    hoopY,
    dx,
    dy,
    velocityX = 0,
    velocityY = 0,
  } = input;

  const flickMag = Math.hypot(velocityX, velocityY);
  const swipeMag = Math.hypot(dx, dy);

  const flickUp = flickMag > FLICK_THRESHOLD && velocityY < 0;
  const swipeUp = swipeMag >= MIN_SWIPE_DISTANCE && dy < 0;

  if (!flickUp && !swipeUp) {
    return { vx: 0, vy: 0 };
  }

  const flickPower = flickUp ? Math.min(flickMag * VELOCITY_SCALE / 520, 1) : 0;
  const swipePower = swipeUp ? Math.min(swipeMag * SWIPE_SCALE / 720, 1) : 0;
  const intensity = clamp(
    flickUp ? flickPower : swipePower * 0.75,
    0,
    1
  );

  if (intensity < POV_MIN_SHOT_POWER) {
    return { vx: 0, vy: 0 };
  }

  const rise = Math.max(launchY - hoopY, 80);
  const peakRise = rise * getPeakRiseFactor(intensity);
  const vy = -Math.sqrt(2 * GRAVITY * peakRise);

  const swipeAim = swipeMag >= MIN_SWIPE_DISTANCE ? (dx / swipeMag) * POV_MAX_AIM_OFFSET : 0;
  const flickAim = flickUp ? (velocityX / flickMag) * POV_MAX_AIM_OFFSET * 0.9 : 0;
  const aimOffset = swipeAim * 0.65 + flickAim * 0.55;
  const aimRatio = clamp(aimOffset / POV_MAX_AIM_OFFSET, -1, 1);

  let vx = aimRatio * Math.abs(vy) * 0.42;

  const centerPull = clamp((hoopX - launchX) / Math.max(launchY - hoopY, 120), -0.08, 0.08);
  vx += centerPull * Math.abs(vy) * 0.05;

  vx = clamp(vx, -Math.abs(vy) * 0.75, Math.abs(vy) * 0.75);

  const speed = Math.hypot(vx, vy);
  if (speed > MAX_SPEED) {
    const maxVx = Math.sqrt(Math.max(0, MAX_SPEED * MAX_SPEED - vy * vy));
    vx = clamp(vx, -maxVx, maxVx);
  }

  return { vx, vy };
}

export function getBallDepthT(ballY: number, launchY: number, hoopY: number): number {
  const span = launchY - hoopY;
  if (span <= 0) return 1;
  return clamp((ballY - hoopY) / span, 0, 1);
}

export function getBallPerspectiveScale(depthT: number): number {
  return 0.78 + depthT * 0.24;
}

export function getGroundShadowScale(depthT: number): number {
  return 0.18 + depthT * 0.82;
}

export function calculateArcadeScore(shotsMade: number, bestStreak: number, coinsEarned: number): number {
  return shotsMade * 10 + bestStreak * 25 + coinsEarned;
}
