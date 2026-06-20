import { CampaignLevelDef } from '../types';

function buildLevel(id: number): CampaignLevelDef {
  const tier = Math.floor((id - 1) / 10);
  const targetMakes = Math.min(3 + Math.floor(id / 3), 10);
  const hoopDistance = 0.35 + (id - 1) * 0.008;
  const rimScale = Math.max(0.75, 1.0 - (id - 1) * 0.008);
  const wind = id >= 16 ? (id % 2 === 0 ? 12 : -12) : 0;
  const drift = id >= 6;

  return {
    id,
    objective: 'make_n',
    targetMakes,
    maxMisses: 3,
    hoopDistance: Math.min(hoopDistance, 0.65),
    rimScale,
    wind,
    drift,
  };
}

export const CAMPAIGN_LEVELS: CampaignLevelDef[] = Array.from({ length: 30 }, (_, i) =>
  buildLevel(i + 1)
);

export function getCampaignLevel(id: number): CampaignLevelDef | undefined {
  return CAMPAIGN_LEVELS.find((level) => level.id === id);
}

export function isLevelUnlocked(levelId: number, progress: Record<number, { stars: number }>): boolean {
  if (levelId === 1) return true;
  return !!progress[levelId - 1]?.stars;
}

export function getTotalStars(progress: Record<number, { stars: number }>): number {
  return Object.values(progress).reduce((sum, p) => sum + (p.stars || 0), 0);
}

export function getFurthestLevel(progress: Record<number, { stars: number }>): number {
  const completed = Object.entries(progress)
    .filter(([, p]) => p.stars > 0)
    .map(([id]) => Number(id));
  return completed.length > 0 ? Math.max(...completed) : 0;
}
