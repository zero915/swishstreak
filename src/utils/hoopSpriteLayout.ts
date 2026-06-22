import { getHoopMetrics } from './hoopGeometry';

/** Native aspect ratio of assets/images/hoop/backboard_classic.png */
const BACKBOARD_ASPECT = 571 / 776;

/** Fraction from top of rim_net_classic.png to the rim lip ellipse. */
export const RIM_NET_LIP_RATIO = 0.14;

/** Extra visual drop so sprite rim lip aligns with physics rim lip. */
export const RIM_VISUAL_DROP = 10;

/** Screen Y of the rim center used for ball physics / trajectory (matches sprite lip). */
export function getPhysicsRimCenterY(rimCenterY: number): number {
  return rimCenterY + RIM_VISUAL_DROP;
}

export interface HoopSpriteLayout {
  boardVisualWidth: number;
  boardVisualHeight: number;
  boardTop: number;
  rimNetTop: number;
  rimNetWidth: number;
  rimNetHeight: number;
  containerWidth: number;
}

/**
 * Visual-only layout for sprite hoop — physics rim center/lip stay in hoopGeometry.
 */
export function getHoopSpriteLayout(rimWidth: number): HoopSpriteLayout {
  const m = getHoopMetrics(rimWidth);
  const boardScale = 1.28;
  const boardVisualWidth = m.boardWidth * boardScale;
  const boardVisualHeight = boardVisualWidth * BACKBOARD_ASPECT;

  const rimLipY = m.rimCenterOffsetY - m.rimHeight / 2;
  const boardBottom = rimLipY + RIM_VISUAL_DROP + 4;
  const boardTop = boardBottom - boardVisualHeight;

  const rimNetWidth = rimWidth * 1.04;
  const rimNetHeight = m.rimHeight + m.netHeight + 10;
  const rimNetTop = rimLipY - rimNetHeight * RIM_NET_LIP_RATIO + RIM_VISUAL_DROP;

  return {
    boardVisualWidth,
    boardVisualHeight,
    boardTop,
    rimNetTop,
    rimNetWidth,
    rimNetHeight,
    containerWidth: Math.max(m.boardWidth, boardVisualWidth),
  };
}

/** Clip split for rendering ball between rim sprite and net overlay. */
export function getRimNetClipHeights(rimWidth: number): {
  rimBackClipH: number;
  /** Offset from hoop container top to net overlay. */
  netFrontOffsetY: number;
  netFrontHeight: number;
} {
  const m = getHoopMetrics(rimWidth);
  const sprite = getHoopSpriteLayout(rimWidth);
  const lipY = sprite.rimNetHeight * RIM_NET_LIP_RATIO;
  const rimBackClipH = lipY + m.rimHeight * 0.52;
  const netOverlap = 2;
  return {
    rimBackClipH,
    netFrontOffsetY: sprite.rimNetTop + rimBackClipH - netOverlap,
    netFrontHeight: sprite.rimNetHeight - rimBackClipH + netOverlap,
  };
}
