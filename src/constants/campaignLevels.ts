import { CampaignLevelDef } from '../types';

export interface CampaignZone {
  id: number;
  name: string;
  color: string;
  secondaryColor: string;
}

export const CAMPAIGN_ZONES: CampaignZone[] = [
  { id: 0, name: 'Rookie Court', color: '#4CAF50', secondaryColor: '#81C784' },
  { id: 1, name: 'Sunset Strip', color: '#FF8A65', secondaryColor: '#FFCC80' },
  { id: 2, name: 'Twilight Heights', color: '#5C6BC0', secondaryColor: '#3949AB' },
  { id: 3, name: 'Arena Lights', color: '#FFB74D', secondaryColor: '#FFE082' },
];

export function getCampaignZone(levelId: number): CampaignZone {
  const zoneIndex = Math.floor((levelId - 1) / 10) % CAMPAIGN_ZONES.length;
  return CAMPAIGN_ZONES[zoneIndex];
}

function buildLevel(id: number): CampaignLevelDef {
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

export function getCampaignLevel(id: number): CampaignLevelDef | undefined {
  if (id < 1) return undefined;
  return buildLevel(id);
}

export function isLevelUnlocked(levelId: number, progress: Record<number, { stars: number }>): boolean {
  if (levelId === 1) return true;
  return !!progress[levelId - 1]?.stars;
}

export function getTotalStars(progress: Record<number, { stars: number }>): number {
  return Object.values(progress).reduce((sum, p) => sum + (p.stars || 0), 0);
}

/** Highest level id the player has completed with at least one star. */
export function getFurthestLevel(progress: Record<number, { stars: number }>): number {
  const completed = Object.entries(progress)
    .filter(([, p]) => p.stars > 0)
    .map(([id]) => Number(id));
  return completed.length > 0 ? Math.max(...completed) : 0;
}

/** Next playable level on the campaign map. */
export function getFurthestUnlockedLevel(progress: Record<number, { stars: number }>): number {
  const furthest = getFurthestLevel(progress);
  return furthest > 0 ? furthest + 1 : 1;
}

/** Zigzag horizontal offset for map node layout (0 = center). */
export function getLevelNodeOffset(levelId: number): number {
  const pattern = [0, -72, 0, 72];
  return pattern[(levelId - 1) % pattern.length];
}

export const MAP_NODE_SIZE = 68;
export const MAP_NODE_VERTICAL_GAP = 88;
