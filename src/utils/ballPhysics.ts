import {
  GRAVITY,
  RIM_BOUNCE_RESTITUTION,
  PHYSICS_SUBSTEP,
  MAX_PHYSICS_SUBSTEPS,
} from '../constants/gameConfig';
import { BallPosition } from '../types';
import { HoopGeometry } from './hoopGeometry';
import { getBallPerspectiveScale } from './trajectory';

export interface BallPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  scored: boolean;
  /** Smallest y reached this shot — highest point on screen (for overshoot detection). */
  peakY: number;
}

export type PhysicsEvent =
  | { type: 'rim_bounce' }
  | { type: 'score' };

function effectiveBallRadius(ballRadius: number, y: number, launchY: number, hoopY: number): number {
  const span = launchY - hoopY;
  if (span <= 0) return ballRadius;
  const depthT = Math.max(0, Math.min(1, (y - hoopY) / span));
  return ballRadius * getBallPerspectiveScale(depthT);
}

function segmentCrosses(prev: number, cur: number, plane: number): boolean {
  return (prev <= plane && cur >= plane) || (prev >= plane && cur <= plane);
}

/**
 * Score when the ball passes through the rim opening (upward or downward).
 * Uses perspective-scaled radius so detection matches what you see on screen.
 */
function tryScore(
  geo: HoopGeometry,
  ballRadius: number,
  x: number,
  y: number,
  vy: number,
  prevY: number,
  launchY: number,
  hoopY: number,
  peakY: number
): boolean {
  const radius = effectiveBallRadius(ballRadius, y, launchY, hoopY);
  const prevRadius = effectiveBallRadius(ballRadius, prevY, launchY, hoopY);

  const ballTop = y - radius;
  const ballBottom = y + radius;
  const prevBallTop = prevY - prevRadius;
  const prevBallBottom = prevY + prevRadius;

  const innerHalf = (geo.rimInnerRight - geo.rimInnerLeft) / 2;
  const centerDist = Math.abs(x - geo.rimCenterX);
  const centered = centerDist <= innerHalf * 0.42;

  const hMargin = radius * (centered ? 0.22 : 0.12);
  const fitsOpening =
    x - radius >= geo.rimInnerLeft - hMargin &&
    x + radius <= geo.rimInnerRight + hMargin;

  if (!fitsOpening) return false;

  const overlapsOpening =
    ballTop <= geo.rimBottom + 6 &&
    ballBottom >= geo.rimTop - 6;

  if (!overlapsOpening) return false;

  const lip = geo.rimTop;
  const lipTol = centered ? 10 : 6;

  const crossedLipUp =
    segmentCrosses(prevBallBottom, ballBottom, lip) ||
    (prevBallBottom <= lip + lipTol && ballBottom >= lip - lipTol);

  const crossedLipDown =
    segmentCrosses(prevBallTop, ballTop, lip) ||
    (prevBallTop <= lip + lipTol && ballTop >= lip - lipTol);

  if (vy < 0) {
    if (!crossedLipUp) return false;
    if (!centered) {
      const projectedPeak = y - (vy * vy) / (2 * GRAVITY);
      if (projectedPeak < geo.rimTop - radius * 2.4) {
        return false;
      }
    }
    return true;
  }

  if (vy > 0) {
    if (!crossedLipDown) return false;
    if (!centered && peakY < geo.rimTop - radius * 2.4) {
      return false;
    }
    return true;
  }

  return segmentCrosses(prevY, y, lip) && centered;
}

function resolveCircleCircle(
  px: number,
  py: number,
  vx: number,
  vy: number,
  radius: number,
  cx: number,
  cy: number,
  cr: number,
  restitution: number
): { x: number; y: number; vx: number; vy: number; hit: boolean } {
  const dx = px - cx;
  const dy = py - cy;
  const minDist = radius + cr;
  const distSq = dx * dx + dy * dy;

  if (distSq >= minDist * minDist) {
    return { x: px, y: py, vx, vy, hit: false };
  }

  const dist = Math.sqrt(distSq) || 0.001;
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist + 0.5;
  const vDotN = vx * nx + vy * ny;

  if (vDotN >= 0) return { x: px, y: py, vx, vy, hit: false };

  const nvx = vx - (1 + restitution) * vDotN * nx;
  const nvy = vy - (1 + restitution) * vDotN * ny;

  return {
    x: px + nx * overlap,
    y: py + ny * overlap,
    vx: nvx,
    vy: nvy,
    hit: true,
  };
}

function stepOnce(
  state: BallPhysicsState,
  prevY: number,
  geo: HoopGeometry,
  ballRadius: number,
  launchY: number,
  hoopY: number,
  dt: number,
  wind: number
): { state: BallPhysicsState; events: PhysicsEvent[] } {
  const events: PhysicsEvent[] = [];
  let { x, y, vx, vy, rotation, scored, peakY } = state;

  vx += wind * dt;
  vy += GRAVITY * dt;
  x += vx * dt;
  y += vy * dt;
  peakY = Math.min(peakY, y);

  const radius = effectiveBallRadius(ballRadius, y, launchY, hoopY);
  rotation += (vx / radius) * dt * 0.7;

  if (!scored && tryScore(geo, ballRadius, x, y, vy, prevY, launchY, hoopY, peakY)) {
    scored = true;
    events.push({ type: 'score' });
  }

  if (!scored) {
    const tubeR = geo.rimTubeRadius * 0.85;
    const inOpening =
      x > geo.rimInnerLeft - radius * 0.05 &&
      x < geo.rimInnerRight + radius * 0.05 &&
      y > geo.rimTop - radius * 0.5 &&
      y < geo.rimBottom + radius * 0.35;

    if (!inOpening) {
      if (x < geo.rimInnerLeft) {
        const hit = resolveCircleCircle(
          x, y, vx, vy, radius,
          geo.leftRimX, geo.rimCenterY, tubeR,
          RIM_BOUNCE_RESTITUTION
        );
        if (hit.hit) {
          x = hit.x; y = hit.y; vx = hit.vx; vy = hit.vy;
          events.push({ type: 'rim_bounce' });
        }
      } else if (x > geo.rimInnerRight) {
        const hit = resolveCircleCircle(
          x, y, vx, vy, radius,
          geo.rightRimX, geo.rimCenterY, tubeR,
          RIM_BOUNCE_RESTITUTION
        );
        if (hit.hit) {
          x = hit.x; y = hit.y; vx = hit.vx; vy = hit.vy;
          events.push({ type: 'rim_bounce' });
        }
      }
    }
  }

  return {
    state: { x, y, vx, vy, rotation, scored, peakY },
    events,
  };
}

export function stepBallPhysics(
  state: BallPhysicsState,
  frameDt: number,
  geo: HoopGeometry,
  ballRadius: number,
  launchY: number,
  hoopY: number,
  wind: number
): { state: BallPhysicsState; events: PhysicsEvent[] } {
  const allEvents: PhysicsEvent[] = [];
  let current = state;
  let remaining = Math.min(frameDt, 0.05);
  let substeps = 0;

  while (remaining > 0 && substeps < MAX_PHYSICS_SUBSTEPS) {
    const dt = Math.min(PHYSICS_SUBSTEP, remaining);
    const prevY = current.y;
    const result = stepOnce(current, prevY, geo, ballRadius, launchY, hoopY, dt, wind);
    current = result.state;
    allEvents.push(...result.events);
    remaining -= dt;
    substeps += 1;
  }

  return { state: current, events: allEvents };
}

export function isBallOffScreen(
  ball: BallPosition,
  ballRadius: number,
  screenWidth: number,
  screenHeight: number
): boolean {
  return (
    ball.y - ballRadius > screenHeight + 40 ||
    ball.x + ballRadius < -60 ||
    ball.x - ballRadius > screenWidth + 60
  );
}

export function createBallState(x: number, y: number, vx: number, vy: number): BallPhysicsState {
  return { x, y, vx, vy, rotation: 0, scored: false, peakY: y };
}
