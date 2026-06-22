import { BACKBOARD_RESTITUTION } from '../constants/gameConfig';
import { HoopGeometry } from './hoopGeometry';

export interface BackboardCollisionResult {
  x: number;
  y: number;
  vx: number;
  vy: number;
  touchedBackboard: boolean;
  hit: boolean;
}

/** True when the ball is in the vertical drop channel below the rim lip. */
function isInRimDropChannel(x: number, y: number, radius: number, geo: HoopGeometry): boolean {
  const inOpeningX =
    x + radius > geo.rimInnerLeft &&
    x - radius < geo.rimInnerRight;
  const belowRimLip = y > geo.rimTop - radius * 0.35;
  const aboveNet = y < geo.netBottom + radius;
  return inOpeningX && belowRimLip && aboveNet;
}

export function resolveBackboardCollision(
  x: number,
  y: number,
  vx: number,
  vy: number,
  radius: number,
  geo: HoopGeometry,
  hoopVx: number,
  hoopVy: number,
  touchedBackboard: boolean
): BackboardCollisionResult {
  const relVx = vx - hoopVx;
  const relVy = vy - hoopVy;

  if (relVy <= 0 || isInRimDropChannel(x, y, radius, geo)) {
    return { x, y, vx, vy, touchedBackboard, hit: false };
  }

  const overlapsBoard =
    x + radius > geo.backboardLeft &&
    x - radius < geo.backboardRight &&
    y + radius > geo.backboardTop &&
    y - radius < geo.backboardBottom;

  if (!overlapsBoard) {
    return { x, y, vx, vy, touchedBackboard, hit: false };
  }

  // Front face of the backboard (toward the player) — only above the rim lip.
  const faceY = geo.backboardBottom;
  if (y + radius <= faceY || y > geo.rimTop + radius * 0.5) {
    return { x, y, vx, vy, touchedBackboard, hit: false };
  }

  const penetration = y + radius - faceY;
  const newY = y - penetration - 0.5;
  let nrelVy = -relVy * BACKBOARD_RESTITUTION;
  const preSpeed = Math.hypot(relVx, relVy);
  const postSpeed = Math.hypot(relVx, nrelVy);
  if (postSpeed > preSpeed && preSpeed > 0) {
    const scale = preSpeed / postSpeed;
    nrelVy *= scale;
  }

  return {
    x,
    y: newY,
    vx: relVx + hoopVx,
    vy: nrelVy + hoopVy,
    touchedBackboard: true,
    hit: true,
  };
}
