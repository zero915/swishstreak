const XP_THRESHOLDS = [0, 100, 250, 500, 850, 1300, 1900, 2600, 3400, 4300, 5300];

export function xpToLevel(totalXP: number): number {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (totalXP >= XP_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

export function xpForNextLevel(totalXP: number): { current: number; needed: number; progress: number } {
  const level = xpToLevel(totalXP);
  const currentThreshold = XP_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = XP_THRESHOLDS[level] ?? currentThreshold + 1000;
  const current = totalXP - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  return {
    current,
    needed,
    progress: needed > 0 ? current / needed : 1,
  };
}

export function calculateMakeXP(): number {
  return 5;
}

export function calculateArcadeRunXP(bestStreak: number): number {
  return 20 + bestStreak * 2;
}

export function calculateCampaignXP(stars: number): number {
  return 30 + stars * 10;
}

export function calculateStars(
  passed: boolean,
  maxStreak: number,
  totalMisses: number
): number {
  if (!passed) return 0;
  let stars = 1;
  if (maxStreak >= 3) stars = 2;
  if (totalMisses === 0) stars = 3;
  return stars;
}
