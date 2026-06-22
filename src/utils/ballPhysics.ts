import {
  GRAVITY,
  MAX_PHYSICS_SUBSTEPS,
  PHYSICS_SUBSTEP,
  SCORED_NET_DRAG,
} from '../constants/gameConfig';
import { BallPosition } from '../types';
import { resolveBackboardCollision } from './backboardCollision';
import { HoopGeometry } from './hoopGeometry';
import { resolveRimCollisions } from './rimCollision';
import {
  applyScoreAssist,
  ballFitsRimOpening,
  ballSignificantlySticksOut,
  getAssistStrength,
  getScoringCylinder,
  isBallCenterInRimOpening,
  isInScoringCylinder,
  isSwishLane,
  tryScoreOnDescent,
} from './scoringCylinder';
import { getBallPerspectiveScale } from './trajectory';
import { offsetHoopSnapshot } from './hoopSnapshot';

export type ShotPhase = 'ascending' | 'descending';

export interface BallPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  scored: boolean;
  phase: ShotPhase;
  rimContactCount: number;
  touchedBackboard: boolean;
  inScoreFunnel: boolean;
  rimStuckSubsteps: number;
  peakY: number;
}

export interface HoopSnapshot {
  geo: HoopGeometry;
  vx: number;
  vy: number;
}

export interface PhysicsTuning {
  wind: number;
  rimDifficulty?: number;
  assistFactor?: number;
}

export type PhysicsEvent =
  | { type: 'rim_bounce'; zone: 'front' | 'back' | 'side' }
  | { type: 'backboard_bounce' }
  | { type: 'score'; clean: boolean };

export function effectiveBallRadius(
  ballRadius: number,
  y: number,
  launchY: number,
  hoopY: number
): number {
  const span = launchY - hoopY;
  if (span <= 0) return ballRadius;
  const depthT = Math.max(0, Math.min(1, (y - hoopY) / span));
  return ballRadius * getBallPerspectiveScale(depthT);
}

function stepOnce(
  state: BallPhysicsState,
  prevY: number,
  snapshot: HoopSnapshot,
  ballRadius: number,
  launchY: number,
  hoopY: number,
  dt: number,
  tuning: PhysicsTuning
): { state: BallPhysicsState; events: PhysicsEvent[] } {
  const events: PhysicsEvent[] = [];
  const geo = snapshot.geo;
  const { vx: hoopVx, vy: hoopVy } = snapshot;

  let {
    x,
    y,
    vx,
    vy,
    rotation,
    scored,
    phase,
    rimContactCount,
    touchedBackboard,
    inScoreFunnel,
    rimStuckSubsteps,
    peakY,
  } = state;

  vx += tuning.wind * dt;
  vy += GRAVITY * dt;
  x += vx * dt;
  y += vy * dt;
  peakY = Math.min(peakY, y);

  if (phase === 'ascending' && vy > 0) {
    phase = 'descending';
  }

  const radius = effectiveBallRadius(ballRadius, y, launchY, hoopY);
  rotation += (vx / radius) * dt * 0.7;

  const buildScoreInput = () => ({
    geo,
    cylinder: getScoringCylinder(geo),
    ballRadius,
    x,
    y,
    vy,
    prevY,
    launchY,
    hoopY,
    peakY,
    rimContactCount,
    touchedBackboard,
    inScoreFunnel,
  });

  if (phase === 'descending') {
    const cylinder = getScoringCylinder(geo);
    const centerDist = Math.abs(x - geo.rimCenterX);
    const strictFit = ballFitsRimOpening(geo, x, radius, 2);
    const centerInOpening = isBallCenterInRimOpening(geo, x, 0.1);
    const inHoopZone =
      y >= geo.rimTop - radius * 1.5 && y <= geo.netBottom + radius * 0.6;
    const rollingIn =
      rimContactCount > 0 &&
      centerInOpening &&
      centerDist <= cylinder.innerRadius * 0.85 &&
      vy > 0 &&
      y >= geo.rimTop - radius * 0.35;
    const swishLane = isSwishLane(geo, x, y, vy, radius, rimContactCount);

    if (!scored && (swishLane || (inHoopZone && (strictFit || (rimContactCount > 0 && centerInOpening))))) {
      inScoreFunnel = true;
    }

    if (!scored && rimContactCount > 0 && centerInOpening && vy > 0) {
      inScoreFunnel = true;
    }

    const nearRim = y >= geo.rimTop - radius * 1.4;
    const assistStrength = nearRim
      ? getAssistStrength(centerDist, cylinder.innerRadius, tuning.assistFactor ?? 1)
      : 0;

    if (!scored && nearRim && strictFit && isInScoringCylinder(cylinder, x, y)) {
      inScoreFunnel = true;
      const assisted = applyScoreAssist(x, vx, geo.rimCenterX, assistStrength, dt);
      x = assisted.x;
      vx = assisted.vx;
    }

    if (!scored && nearRim && rimContactCount > 0 && centerInOpening) {
      inScoreFunnel = true;
      const rollStrength = Math.max(assistStrength, 0.3);
      const assisted = applyScoreAssist(x, vx, geo.rimCenterX, rollStrength, dt);
      x = assisted.x;
      vx = assisted.vx;
    }

    if (
      !scored &&
      vy > 0 &&
      y >= geo.rimTop - radius * 0.6 &&
      (swishLane || strictFit || (rimContactCount > 0 && centerInOpening))
    ) {
      if (tryScoreOnDescent(buildScoreInput())) {
        scored = true;
        events.push({ type: 'score', clean: rimContactCount === 0 });
      }
    }

    if (!scored) {
      const boardHit = resolveBackboardCollision(
        x,
        y,
        vx,
        vy,
        radius,
        geo,
        hoopVx,
        hoopVy,
        touchedBackboard
      );
      if (boardHit.hit) {
        x = boardHit.x;
        y = boardHit.y;
        vx = boardHit.vx;
        vy = boardHit.vy;
        touchedBackboard = boardHit.touchedBackboard;
        events.push({ type: 'backboard_bounce' });
      }
    }

    const significantlyWide = ballSignificantlySticksOut(geo, x, radius, 0.1);
    if (!scored && !rollingIn && !swishLane && (!inScoreFunnel || significantlyWide)) {
      const rimResult = resolveRimCollisions(
        x,
        y,
        vx,
        vy,
        radius,
        geo,
        hoopVx,
        hoopVy,
        rimContactCount,
        { rimStuckSubsteps },
        tuning.rimDifficulty ?? 0
      );
      if (rimResult.hit && rimResult.zone) {
        x = rimResult.x;
        y = rimResult.y;
        vx = rimResult.vx;
        vy = rimResult.vy;
        rimContactCount = rimResult.rimContactCount;
        rimStuckSubsteps = rimResult.rimStuckSubsteps;
        events.push({ type: 'rim_bounce', zone: rimResult.zone });
        if (strictFit || isBallCenterInRimOpening(geo, x, 0.12)) {
          inScoreFunnel = true;
        }
      } else {
        rimStuckSubsteps = rimResult.rimStuckSubsteps;
      }
    }

    if (!scored && tryScoreOnDescent(buildScoreInput())) {
      scored = true;
      events.push({ type: 'score', clean: rimContactCount === 0 });
    }
  }

  if (scored) {
    vy += SCORED_NET_DRAG * dt;
    const cylinder = getScoringCylinder(geo);
    const centerDist = Math.abs(x - geo.rimCenterX);
    const assistStrength = getAssistStrength(
      centerDist,
      cylinder.innerRadius,
      tuning.assistFactor ?? 1
    );
    const assisted = applyScoreAssist(x, vx, geo.rimCenterX, assistStrength * 0.6, dt);
    x = assisted.x;
    vx = assisted.vx;
  }

  return {
    state: {
      x,
      y,
      vx,
      vy,
      rotation,
      scored,
      phase,
      rimContactCount,
      touchedBackboard,
      inScoreFunnel,
      rimStuckSubsteps,
      peakY,
    },
    events,
  };
}

export function stepBallPhysics(
  state: BallPhysicsState,
  frameDt: number,
  baseSnapshot: HoopSnapshot,
  ballRadius: number,
  launchY: number,
  hoopY: number,
  tuning: PhysicsTuning,
  physicsRimCenterY?: number,
  rimWidth?: number
): { state: BallPhysicsState; events: PhysicsEvent[] } {
  const allEvents: PhysicsEvent[] = [];
  let current = state;
  let remaining = Math.min(frameDt, 0.05);
  let substeps = 0;
  const rimCenterY = physicsRimCenterY ?? hoopY;
  const rimW = rimWidth ?? baseSnapshot.geo.rimWidth;

  while (remaining > 0 && substeps < MAX_PHYSICS_SUBSTEPS) {
    const dt = Math.min(PHYSICS_SUBSTEP, remaining);
    const prevY = current.y;
    const snapshot =
      substeps === 0
        ? baseSnapshot
        : offsetHoopSnapshot(baseSnapshot, baseSnapshot.vx * dt * substeps, rimCenterY, rimW);
    const result = stepOnce(current, prevY, snapshot, ballRadius, launchY, hoopY, dt, tuning);
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
  return {
    x,
    y,
    vx,
    vy,
    rotation: 0,
    scored: false,
    phase: 'ascending',
    rimContactCount: 0,
    touchedBackboard: false,
    inScoreFunnel: false,
    rimStuckSubsteps: 0,
    peakY: y,
  };
}
