import { getTotalStars, getFurthestLevel } from '../constants/campaignLevels';
import { CampaignProgress, LeaderboardEntry, PlayerData, UserProfile } from '../types';
import { calculateArcadeScore } from '../utils/trajectory';
import * as api from './gameServerClient';

/**
 * Phase 2 of FIREBASE_MIGRATION.md: leaderboards now live in game-platform-server
 * (Cloudflare D1) instead of Firestore. Scores are still client-computed and
 * submitted (same trust model as before). Friend-only views filter the top results
 * client-side, exactly as the Firestore version did.
 */

export async function submitArcadeScore(
  profile: UserProfile,
  shotsMade: number,
  bestStreak: number,
  coinsEarned: number
): Promise<void> {
  const score = calculateArcadeScore(shotsMade, bestStreak, coinsEarned);
  if (score <= profile.arcadeBest.score) return;

  await api.submitBoardEntry({
    board: 'arcade',
    score,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    playerLevel: profile.playerLevel,
    streak: bestStreak,
    countryCode: profile.location?.countryCode,
    region: profile.location?.region,
  });
}

export async function submitCampaignScore(
  profile: UserProfile,
  campaignProgress: CampaignProgress
): Promise<void> {
  const totalStars = getTotalStars(campaignProgress);
  await api.submitBoardEntry({
    board: 'campaign',
    score: totalStars,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    playerLevel: profile.playerLevel,
    totalStars,
    furthestLevel: getFurthestLevel(campaignProgress),
  });
}

export async function fetchArcadeLeaderboard(
  weekly = false,
  friendIds?: string[]
): Promise<LeaderboardEntry[]> {
  let entries = await api.fetchBoard({ board: 'arcade', scope: weekly ? 'weekly' : 'global', limit: 50 });
  if (friendIds && friendIds.length > 0) {
    const allowed = new Set(friendIds);
    entries = entries.filter((e) => allowed.has(e.uid));
  }
  return entries;
}

export async function fetchCampaignLeaderboard(friendIds?: string[]): Promise<LeaderboardEntry[]> {
  let entries = await api.fetchBoard({ board: 'campaign', scope: 'global', limit: 50 });
  if (friendIds && friendIds.length > 0) {
    const allowed = new Set(friendIds);
    entries = entries.filter((e) => allowed.has(e.uid));
  }
  return entries;
}

/**
 * Regional arcade board. Signature changed from the old `(boardId, weekly)` —
 * which was buried-bug-prone (the board-id strings written and read never matched)
 * — to structured country/region. Only caller is `useLeaderboard`.
 */
export async function fetchRegionalArcadeLeaderboard(
  countryCode: string | undefined,
  region?: string,
  _weekly = false
): Promise<LeaderboardEntry[]> {
  if (!countryCode) return [];
  return api.fetchBoard({ board: 'arcade', scope: 'regional', country: countryCode, region, limit: 50 });
}

export async function updateLeaderboardsAfterRun(
  uid: string,
  profile: UserProfile,
  playerData: PlayerData,
  runStats: { shotsMade: number; bestStreak: number; coinsEarned: number }
): Promise<void> {
  await submitArcadeScore(profile, runStats.shotsMade, runStats.bestStreak, runStats.coinsEarned);
  await submitCampaignScore({ ...profile, ...playerData }, playerData.campaignProgress);
}
