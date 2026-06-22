import {
  ASSIST_GAIN,
  ASSIST_MAX_CORRECTION_PER_FRAME,
  NEAR_MISS_RADIUS_FACTOR,
  SCORE_CYLINDER_BOTTOM_MARGIN,
  SCORE_CYLINDER_RADIUS_FACTOR,
  SCORE_CYLINDER_TOP_MARGIN,
} from '../constants/gameConfig';
import { HoopGeometry } from './hoopGeometry';

export interface ScoringCylinder {
  centerX: number;
  top: number;
  bottom: number;
  radius: number;
  innerRadius: number;
}

export function getScoringCylinder(geo: HoopGeometry): ScoringCylinder {
  const innerRadius = (geo.rimInnerRight - geo.rimInnerLeft) / 2;
  return {
    centerX: geo.rimCenterX,
    top: geo.rimTop - SCORE_CYLINDER_TOP_MARGIN,
    bottom: geo.netBottom + SCORE_CYLINDER_BOTTOM_MARGIN,
    radius: innerRadius * SCORE_CYLINDER_RADIUS_FACTOR,
    innerRadius,
  };
}

export function isInScoringCylinder(cylinder: ScoringCylinder, x: number, y: number): boolean {
  if (y < cylinder.top || y > cylinder.bottom) return false;
  return Math.abs(x - cylinder.centerX) <= cylinder.radius;
}

/** Ball center inside the rim opening (does not imply the full ball fits). */
export function isBallCenterInRimOpening(geo: HoopGeometry, x: number, margin = 0.05): boolean {
  const innerHalf = (geo.rimInnerRight - geo.rimInnerLeft) / 2;
  return Math.abs(x - geo.rimCenterX) <= innerHalf * (1 + margin);
}

/** True when the ball's horizontal span fits inside the rim inner edges. */
export function ballFitsRimOpening(
  geo: HoopGeometry,
  x: number,
  radius: number,
  slack = 0
): boolean {
  return (
    x - radius >= geo.rimInnerLeft + slack &&
    x + radius <= geo.rimInnerRight - slack
  );
}

export function ballStickOutAmount(
  geo: HoopGeometry,
  x: number,
  radius: number
): { left: number; right: number } {
  return {
    left: Math.max(0, geo.rimInnerLeft - (x - radius)),
    right: Math.max(0, x + radius - geo.rimInnerRight),
  };
}

/** Wide enough that the ball cannot realistically drop through. */
export function ballSignificantlySticksOut(
  geo: HoopGeometry,
  x: number,
  radius: number,
  marginFactor = 0.1
): boolean {
  const { left, right } = ballStickOutAmount(geo, x, radius);
  const margin = radius * marginFactor;
  return left > margin || right > margin;
}

/** Ball overlaps the opening horizontally but is too wide to pass through. */
export function ballSticksOutOfRim(geo: HoopGeometry, x: number, radius: number): boolean {
  const overlapsOpening =
    x + radius > geo.rimInnerLeft && x - radius < geo.rimInnerRight;
  return overlapsOpening && !ballFitsRimOpening(geo, x, radius, 0);
}

/** Centered descent through the rim column — skip rim blocks and allow the make. */
export function isSwishLane(
  geo: HoopGeometry,
  x: number,
  y: number,
  vy: number,
  radius: number,
  rimContactCount = 0
): boolean {
  if (vy <= 0) return false;

  const innerHalf = (geo.rimInnerRight - geo.rimInnerLeft) / 2;
  const centerDist = Math.abs(x - geo.rimCenterX);
  const centered =
    centerDist <= innerHalf * (rimContactCount > 0 ? 0.58 : 0.38);
  const inRimColumn =
    y >= geo.rimTop - radius * 0.9 && y <= geo.netBottom + radius * 0.45;

  if (!centered || !inRimColumn) return false;

  if (rimContactCount > 0) {
    return ballFitsRimOpening(geo, x, radius, -radius * 0.14);
  }

  return ballFitsRimOpening(geo, x, radius, 2);
}

/** 0–1 strength for assist / near-miss magnetism. */
export function getAssistStrength(
  centerDist: number,
  innerRadius: number,
  assistFactor = 1
): number {
  const inCylinder = centerDist <= innerRadius * SCORE_CYLINDER_RADIUS_FACTOR;
  if (inCylinder) {
    const t = 1 - centerDist / (innerRadius * SCORE_CYLINDER_RADIUS_FACTOR);
    return Math.min(1, t * 0.85 * assistFactor);
  }

  const nearMissBand = innerRadius * (1 + NEAR_MISS_RADIUS_FACTOR);
  if (centerDist <= nearMissBand) {
    const t =
      1 -
      (centerDist - innerRadius * SCORE_CYLINDER_RADIUS_FACTOR) /
        (nearMissBand - innerRadius * SCORE_CYLINDER_RADIUS_FACTOR);
    return Math.max(0, t * 0.35 * assistFactor);
  }

  return 0;
}

export function applyScoreAssist(
  x: number,
  vx: number,
  targetX: number,
  strength: number,
  dt: number
): { x: number; vx: number } {
  if (strength <= 0) return { x, vx };

  const maxDelta = ASSIST_MAX_CORRECTION_PER_FRAME * strength * dt * 60;
  const desiredDelta = (targetX - x) * ASSIST_GAIN * strength * dt;
  const delta = Math.max(-maxDelta, Math.min(maxDelta, desiredDelta));
  return { x: x + delta, vx };
}

function segmentCrosses(prev: number, cur: number, plane: number): boolean {
  return (prev <= plane && cur >= plane) || (prev >= plane && cur <= plane);
}

export interface TryScoreInput {
  geo: HoopGeometry;
  cylinder: ScoringCylinder;
  ballRadius: number;
  x: number;
  y: number;
  vy: number;
  prevY: number;
  launchY: number;
  hoopY: number;
  peakY: number;
  rimContactCount: number;
  touchedBackboard: boolean;
  inScoreFunnel: boolean;
}

export function tryScoreOnDescent(input: TryScoreInput): boolean {
  const {
    geo,
    cylinder,
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
  } = input;

  if (vy <= 0) return false;

  const span = launchY - hoopY;
  const depthT = span <= 0 ? 1 : Math.max(0, Math.min(1, (y - hoopY) / span));
  const radius = ballRadius * (0.78 + depthT * 0.24);
  const prevDepthT = span <= 0 ? 1 : Math.max(0, Math.min(1, (prevY - hoopY) / span));
  const prevRadius = ballRadius * (0.78 + prevDepthT * 0.24);

  const ballTop = y - radius;
  const prevBallTop = prevY - prevRadius;
  const lip = geo.rimTop;
  const centerDist = Math.abs(x - geo.rimCenterX);
  const innerHalf = cylinder.innerRadius;
  const centerInOpening = isBallCenterInRimOpening(geo, x, 0.08);
  const strictFit = ballFitsRimOpening(geo, x, radius, 2);
  const swishLane = isSwishLane(geo, x, y, vy, radius, rimContactCount);
  const rimRollIn =
    rimContactCount > 0 &&
    centerInOpening &&
    centerDist <= innerHalf * 0.78 &&
    y >= lip - radius * 0.45;

  const inCylinder = isInScoringCylinder(cylinder, x, y);
  const inMakeZone = inCylinder || inScoreFunnel || centerInOpening;
  if (!inMakeZone) return false;

  const lipTol = strictFit || rimRollIn || swishLane ? 14 : 8;

  const crossedLipDown =
    segmentCrosses(prevBallTop, ballTop, lip) ||
    (prevBallTop <= lip + lipTol && ballTop >= lip - lipTol) ||
    ((strictFit || rimRollIn || swishLane) && y >= lip - radius * 0.25);

  if (!crossedLipDown) return false;

  if (swishLane) return true;

  if (touchedBackboard && (inScoreFunnel || centerInOpening) && (strictFit || rimRollIn)) {
    return true;
  }

  // Rimmed roll-in: bounced in the ring and crept toward center — allow slight edge overlap.
  if (rimRollIn && (inScoreFunnel || centerDist <= innerHalf * 0.72)) {
    const rollFit = ballFitsRimOpening(geo, x, radius, -radius * 0.14);
    return rollFit || centerDist <= innerHalf * 0.6;
  }

  // Clean swish — full ball width must clear the ring.
  if (!strictFit) return false;

  if (!centerInOpening && !inScoreFunnel && peakY < geo.rimTop - radius * 2.2) {
    return false;
  }

  return inScoreFunnel || centerDist <= innerHalf * 0.65;
}
