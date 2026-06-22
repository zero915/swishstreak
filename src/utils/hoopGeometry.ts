/** Shared hoop layout — must match Hoop.tsx exactly. */
import { INNER_TARGET_BOTTOM_FRACTION, RIM_INNER_FRACTION } from '../constants/gameConfig';

export interface HoopMetrics {
  boardWidth: number;
  boardHeight: number;
  rimHeight: number;
  rimBorder: number;
  netHeight: number;
  /** Distance from container top to rim center. */
  rimCenterOffsetY: number;
}

export interface HoopGeometry {
  rimCenterX: number;
  rimCenterY: number;
  rimWidth: number;
  rimHeight: number;
  rimTubeRadius: number;
  rimInnerLeft: number;
  rimInnerRight: number;
  rimTop: number;
  rimBottom: number;
  leftRimX: number;
  rightRimX: number;
  backboardLeft: number;
  backboardRight: number;
  backboardTop: number;
  backboardBottom: number;
  netBottom: number;
  containerTop: number;
}

export function getHoopMetrics(rimWidth: number): HoopMetrics {
  const boardWidth = rimWidth * 1.55;
  const boardHeight = Math.max(72, rimWidth * 0.55);
  const rimHeight = Math.max(22, rimWidth * 0.15);
  const rimBorder = Math.max(4, rimWidth * 0.03);
  const netHeight = Math.max(48, rimWidth * 0.38);
  // Rim lip aligns with bottom of inner target square on backboard face.
  const rimCenterOffsetY = boardHeight * INNER_TARGET_BOTTOM_FRACTION + rimHeight / 2;

  return {
    boardWidth,
    boardHeight,
    rimHeight,
    rimBorder,
    netHeight,
    rimCenterOffsetY,
  };
}

export function getContainerTop(rimCenterY: number, rimWidth: number): number {
  const { rimCenterOffsetY } = getHoopMetrics(rimWidth);
  return rimCenterY - rimCenterOffsetY;
}

export function getHoopGeometry(rimCenterX: number, rimCenterY: number, rimWidth: number): HoopGeometry {
  const m = getHoopMetrics(rimWidth);
  const rimInnerWidth = rimWidth * RIM_INNER_FRACTION;
  const containerTop = rimCenterY - m.rimCenterOffsetY;
  const boardTop = containerTop;
  const rimTop = rimCenterY - m.rimHeight / 2;
  const rimTubeRadius = Math.max(10, m.rimHeight * 0.45);

  return {
    rimCenterX,
    rimCenterY,
    rimWidth,
    rimHeight: m.rimHeight,
    rimTubeRadius,
    rimInnerLeft: rimCenterX - rimInnerWidth / 2,
    rimInnerRight: rimCenterX + rimInnerWidth / 2,
    rimTop,
    rimBottom: rimCenterY + m.rimHeight / 2,
    leftRimX: rimCenterX - rimWidth / 2 + rimTubeRadius,
    rightRimX: rimCenterX + rimWidth / 2 - rimTubeRadius,
    backboardLeft: rimCenterX - m.boardWidth / 2,
    backboardRight: rimCenterX + m.boardWidth / 2,
    backboardTop: boardTop,
    backboardBottom: boardTop + m.boardHeight,
    netBottom: rimCenterY + m.netHeight + m.rimHeight * 0.5,
    containerTop,
  };
}
