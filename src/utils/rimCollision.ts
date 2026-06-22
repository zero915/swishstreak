import {
  RIM_RESTITUTION_MAX,
  RIM_RESTITUTION_MIN,
  RIM_ROLL_SPEED_THRESHOLD,
  RIM_STUCK_SPEED,
  RIM_STUCK_SUBSTEPS,
} from '../constants/gameConfig';
import { ballFitsRimOpening, ballSticksOutOfRim } from './scoringCylinder';
import { HoopGeometry } from './hoopGeometry';

export type RimZone = 'front' | 'back' | 'side';

export interface RimCollisionState {
  rimStuckSubsteps: number;
}

export interface RimCollisionResult {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rimContactCount: number;
  rimStuckSubsteps: number;
  hit: boolean;
  zone?: RimZone;
}

function resolveCircleCircle(
  px: number,
  py: number,
  relVx: number,
  relVy: number,
  radius: number,
  cx: number,
  cy: number,
  cr: number,
  restitution: number,
  hoopVx: number,
  hoopVy: number
): { x: number; y: number; vx: number; vy: number; hit: boolean; nx: number; ny: number } {
  const dx = px - cx;
  const dy = py - cy;
  const minDist = radius + cr;
  const distSq = dx * dx + dy * dy;

  if (distSq >= minDist * minDist) {
    return { x: px, y: py, vx: relVx + hoopVx, vy: relVy + hoopVy, hit: false, nx: 0, ny: 0 };
  }

  const dist = Math.sqrt(distSq) || 0.001;
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist + 0.5;
  const vDotN = relVx * nx + relVy * ny;

  if (vDotN >= 0) {
    return { x: px, y: py, vx: relVx + hoopVx, vy: relVy + hoopVy, hit: false, nx, ny };
  }

  const preSpeed = Math.hypot(relVx, relVy);
  let nrelVx = relVx - (1 + restitution) * vDotN * nx;
  let nrelVy = relVy - (1 + restitution) * vDotN * ny;
  const postSpeed = Math.hypot(nrelVx, nrelVy);
  if (postSpeed > preSpeed && preSpeed > 0) {
    const scale = preSpeed / postSpeed;
    nrelVx *= scale;
    nrelVy *= scale;
  }

  return {
    x: px + nx * overlap,
    y: py + ny * overlap,
    vx: nrelVx + hoopVx,
    vy: nrelVy + hoopVy,
    hit: true,
    nx,
    ny,
  };
}

function getRimRestitution(rimDifficulty = 0): number {
  const t = Math.max(0, Math.min(1, rimDifficulty));
  return RIM_RESTITUTION_MAX + (RIM_RESTITUTION_MIN - RIM_RESTITUTION_MAX) * t;
}

export function resolveRimCollisions(
  x: number,
  y: number,
  vx: number,
  vy: number,
  radius: number,
  geo: HoopGeometry,
  hoopVx: number,
  hoopVy: number,
  rimContactCount: number,
  collisionState: RimCollisionState,
  rimDifficulty = 0
): RimCollisionResult {
  const restitution = getRimRestitution(rimDifficulty);
  const relVx = vx - hoopVx;
  const relVy = vy - hoopVy;
  const relSpeed = Math.hypot(relVx, relVy);
  const tubeR = geo.rimTubeRadius * 0.85;

  const fitsOpening = ballFitsRimOpening(geo, x, radius, 0);
  const sticksOut = ballSticksOutOfRim(geo, x, radius);

  const inOpeningVertical =
    y > geo.rimTop - radius * 0.5 &&
    y < geo.rimBottom + radius * 0.35;

  const descendingThroughOpening = fitsOpening && inOpeningVertical && vy > 0;

  let rimStuckSubsteps = collisionState.rimStuckSubsteps;
  let hit = false;
  let zone: RimZone | undefined;

  const tryHit = (
    cx: number,
    cy: number,
    cr: number,
    hitZone: RimZone,
    rollBiasX = 0
  ): void => {
    const curRelVx = vx - hoopVx;
    const curRelVy = vy - hoopVy;
    const result = resolveCircleCircle(x, y, curRelVx, curRelVy, radius, cx, cy, cr, restitution, hoopVx, hoopVy);
    if (!result.hit) return;

    x = result.x;
    y = result.y;
    vx = result.vx;
    vy = result.vy;
    hit = true;
    zone = hitZone;
    rimContactCount += 1;

    const newRelVx = vx - hoopVx;
    const newRelVy = vy - hoopVy;
    const speed = Math.hypot(newRelVx, newRelVy);

    if (hitZone === 'side' && speed < RIM_ROLL_SPEED_THRESHOLD) {
      const tangentX = -result.ny;
      const tangentY = result.nx;
      const rollDir = Math.sign(tangentX * newRelVx + tangentY * newRelVy) || 1;
      vx = hoopVx + tangentX * speed * 0.55 * rollDir + rollBiasX * 0.5;
      vy = hoopVy + tangentY * speed * 0.3 * rollDir;
    } else if (hitZone === 'front' && speed < RIM_ROLL_SPEED_THRESHOLD) {
      vx = hoopVx + (geo.rimCenterX - x) * 0.08;
      vy = Math.min(vy, hoopVy + speed * 0.2);
    }

    rimStuckSubsteps = 0;
  };

  if (!fitsOpening) {
    if (x - radius < geo.rimInnerLeft) {
      tryHit(geo.leftRimX, geo.rimCenterY, tubeR, 'side', 12);
    } else if (x + radius > geo.rimInnerRight) {
      tryHit(geo.rightRimX, geo.rimCenterY, tubeR, 'side', -12);
    }
  }

  if (!descendingThroughOpening && !hit) {
    if (y + radius > geo.rimTop - 4 && y - radius < geo.rimTop + tubeR * 0.85) {
      if (ballSticksOutOfRim(geo, x, radius)) {
        tryHit(geo.rimCenterX, geo.rimTop, tubeR * 0.85, 'front');
      }
    }

    if (y - radius < geo.rimBottom + 4 && y + radius > geo.rimBottom - tubeR * 0.8) {
      if (ballSticksOutOfRim(geo, x, radius)) {
        tryHit(geo.rimCenterX, geo.rimBottom, tubeR * 0.8, 'back');
      }
    }
  }

  if (hit) {
    rimStuckSubsteps = 0;
  } else if (fitsOpening && inOpeningVertical && relSpeed < RIM_STUCK_SPEED && !descendingThroughOpening) {
    rimStuckSubsteps += 1;
    if (rimStuckSubsteps >= RIM_STUCK_SUBSTEPS) {
      x += x < geo.rimCenterX ? -2 : 2;
      vy += 18;
      rimStuckSubsteps = 0;
    }
  } else {
    rimStuckSubsteps = 0;
  }

  return { x, y, vx, vy, rimContactCount, rimStuckSubsteps, hit, zone };
}
