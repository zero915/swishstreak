import { BASE_HOOP_Y_OFFSET, BASE_RIM_WIDTH, RIM_SCREEN_RATIO } from '../constants/gameConfig';
import { CampaignLevelDef, DifficultyParams } from '../types';

export function getArcadeDifficulty(level: number): DifficultyParams {
  if (level <= 5) {
    return {
      distance: BASE_HOOP_Y_OFFSET,
      rimScale: 1.0,
      wind: 0,
      drift: false,
      perfectWindow: false,
    };
  }

  if (level <= 15) {
    const progress = (level - 5) / 10;
    return {
      distance: BASE_HOOP_Y_OFFSET + progress * 0.15,
      rimScale: 0.9,
      wind: 0,
      drift: true,
      perfectWindow: false,
    };
  }

  return {
    distance: BASE_HOOP_Y_OFFSET + 0.15,
    rimScale: 0.82,
    wind: level % 2 === 0 ? 15 : -15,
    drift: true,
    perfectWindow: true,
  };
}

export function getCampaignDifficulty(level: CampaignLevelDef): DifficultyParams {
  return {
    distance: level.hoopDistance,
    rimScale: level.rimScale,
    wind: level.wind,
    drift: level.drift,
    perfectWindow: level.id >= 16,
  };
}

export function getRimWidth(rimScale: number, screenWidth: number): number {
  const base = Math.max(BASE_RIM_WIDTH, screenWidth * RIM_SCREEN_RATIO);
  return base * rimScale;
}

export function getHoopY(screenHeight: number, distance: number): number {
  return screenHeight * distance;
}

export function getHoopDriftX(elapsedMs: number): number {
  return Math.sin((elapsedMs / 3000) * Math.PI * 2) * 40;
}
