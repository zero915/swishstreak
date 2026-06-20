const LOW_STREAK = ['Nice!', 'Swish!', 'Clean!', 'Got it!'] as const;
const MID_STREAK = ['Swish!', 'Money!', 'Smooth!', 'Buckets!'] as const;
const HIGH_STREAK = ['On fire!', 'Heating up!', 'Unstoppable!', 'Too easy!'] as const;
const ELITE_STREAK = ['LEGEND!', 'ON FIRE!', 'UNREAL!', 'SHEESH!'] as const;

export function pickCelebrationMessage(streakAfterMake: number, clean: boolean): string {
  if (clean && streakAfterMake <= 2) {
    return Math.random() > 0.5 ? 'Perfect!' : 'Swish!';
  }
  if (streakAfterMake >= 8) {
    return ELITE_STREAK[Math.floor(Math.random() * ELITE_STREAK.length)];
  }
  if (streakAfterMake >= 4) {
    return HIGH_STREAK[Math.floor(Math.random() * HIGH_STREAK.length)];
  }
  if (streakAfterMake >= 2) {
    return MID_STREAK[Math.floor(Math.random() * MID_STREAK.length)];
  }
  return LOW_STREAK[Math.floor(Math.random() * LOW_STREAK.length)];
}
