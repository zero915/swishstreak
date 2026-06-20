import {
  BALL_DIAMETER_RATIO,
  MAX_BALL_RADIUS,
  MIN_BALL_RADIUS,
  RIM_INNER_FRACTION,
  RIM_INNER_TO_BALL_DIAMETER,
} from '../constants/gameConfig';

export interface GameSizing {
  ballRadius: number;
  ballDiameter: number;
  rimWidth: number;
  rimInnerWidth: number;
  touchTargetSize: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * FRVR-style proportions: ball and rim scale together so the opening
 * is only slightly wider than the ball — rim bounces and aim matter.
 */
export function getGameSizing(screenWidth: number, rimScale: number): GameSizing {
  const ballDiameter = clamp(
    screenWidth * BALL_DIAMETER_RATIO,
    MIN_BALL_RADIUS * 2,
    MAX_BALL_RADIUS * 2
  );
  const ballRadius = ballDiameter / 2;
  const rimInnerWidth = ballDiameter * RIM_INNER_TO_BALL_DIAMETER * rimScale;
  const rimWidth = rimInnerWidth / RIM_INNER_FRACTION;
  const touchTargetSize = Math.max(96, ballDiameter * 1.3);

  return {
    ballRadius,
    ballDiameter,
    rimWidth,
    rimInnerWidth,
    touchTargetSize,
  };
}
