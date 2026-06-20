import { BALL_RADIUS } from '../constants/gameConfig';
import { BallPosition, HoopBounds } from '../types';
import { getHoopGeometry } from './hoopGeometry';

export function getHoopBounds(
  hoopCenterX: number,
  hoopCenterY: number,
  rimWidth: number
): HoopBounds {
  const geo = getHoopGeometry(hoopCenterX, hoopCenterY, rimWidth);
  return {
    x: geo.rimCenterX - geo.rimWidth / 2,
    y: geo.rimCenterY,
    width: geo.rimWidth,
    height: geo.rimHeight,
    rimInnerWidth: geo.rimInnerRight - geo.rimInnerLeft,
  };
}

export function checkMake(
  ball: BallPosition,
  ballVy: number,
  hoop: HoopBounds,
  previousBall?: BallPosition
): boolean {
  if (ballVy <= 0) return false;

  const ballTop = ball.y - BALL_RADIUS;
  const ballBottom = ball.y + BALL_RADIUS;
  const rimTop = hoop.y - hoop.height / 2;
  const rimBottom = hoop.y + hoop.height / 2;

  const crossedRim =
    previousBall &&
    previousBall.y + BALL_RADIUS <= rimTop &&
    ballBottom >= rimTop;

  const insideRim =
    ballTop <= rimBottom &&
    ballBottom >= rimTop &&
    ball.x >= hoop.x + (hoop.width - hoop.rimInnerWidth) / 2 &&
    ball.x <= hoop.x + (hoop.width + hoop.rimInnerWidth) / 2;

  return !!(crossedRim || insideRim);
}

export function isBallOffScreen(ball: BallPosition, screenWidth: number, screenHeight: number): boolean {
  return (
    ball.y - BALL_RADIUS > screenHeight ||
    ball.x + BALL_RADIUS < 0 ||
    ball.x - BALL_RADIUS > screenWidth
  );
}

export function isNearHoop(ball: BallPosition, hoop: HoopBounds): boolean {
  const hoopCenterX = hoop.x + hoop.width / 2;
  return Math.abs(ball.x - hoopCenterX) < hoop.width && Math.abs(ball.y - hoop.y) < 100;
}
