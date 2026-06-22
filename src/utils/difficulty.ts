import { BASE_HOOP_Y_OFFSET, BASE_RIM_WIDTH, HOOP_DRIFT_AMPLITUDE, HOOP_DRIFT_PERIOD_MS, RIM_SCREEN_RATIO } from '../constants/gameConfig';
import { CampaignLevelDef, DifficultyParams } from '../types';

export function getArcadeDifficulty(level: number): DifficultyParams {
  if (level <= 5) {
    return {
      distance: BASE_HOOP_Y_OFFSET,
      rimScale: 1.0,
      wind: 0,
      drift: false,
      perfectWindow: false,
      rimDifficulty: 0.2,
      assistFactor: 1.1,
    };
  }

  if (level <= 15) {
    const progress = (level - 5) / 10;
    return {
      distance: BASE_HOOP_Y_OFFSET + progress * 0.15,
      rimScale: 0.9,
      wind: 0,
      drift: false,
      perfectWindow: false,
      rimDifficulty: 0.35 + progress * 0.2,
      assistFactor: 1.0,
    };
  }

  return {
    distance: BASE_HOOP_Y_OFFSET + 0.15,
    rimScale: 0.82,
    wind: level % 2 === 0 ? 15 : -15,
    drift: false,
    perfectWindow: true,
    rimDifficulty: 0.65,
    assistFactor: 0.85,
  };
}

export function getCampaignDifficulty(level: CampaignLevelDef): DifficultyParams {
  const tier = Math.min(1, (level.id - 1) / 30);
  return {
    distance: level.hoopDistance,
    rimScale: level.rimScale,
    wind: level.wind,
    drift: level.drift,
    perfectWindow: level.id >= 16,
    rimDifficulty: 0.25 + tier * 0.45,
    assistFactor: Math.max(0.75, 1.05 - tier * 0.25),
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
  return Math.sin((elapsedMs / HOOP_DRIFT_PERIOD_MS) * Math.PI * 2) * HOOP_DRIFT_AMPLITUDE;
}
