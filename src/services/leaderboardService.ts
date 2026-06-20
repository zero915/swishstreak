import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { getTotalStars, getFurthestLevel } from '../constants/campaignLevels';
import { getFirestoreDb } from '../config/firebase';
import { CampaignProgress, LeaderboardEntry, PlayerData, UserProfile } from '../types';
import { calculateArcadeScore } from '../utils/trajectory';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function submitArcadeScore(
  profile: UserProfile,
  shotsMade: number,
  bestStreak: number,
  coinsEarned: number
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;

  const score = calculateArcadeScore(shotsMade, bestStreak, coinsEarned);
  if (score <= profile.arcadeBest.score) return;

  const entry = {
    displayName: profile.displayName,
    photoURL: profile.photoURL ?? null,
    playerLevel: profile.playerLevel,
    score,
    streak: bestStreak,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'leaderboards', 'arcade_alltime', 'entries', profile.uid), entry);
  await setDoc(doc(db, 'leaderboards', 'arcade_weekly', 'entries', profile.uid), entry);
}

export async function submitCampaignScore(profile: UserProfile, campaignProgress: CampaignProgress): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;

  const entry = {
    displayName: profile.displayName,
    photoURL: profile.photoURL ?? null,
    playerLevel: profile.playerLevel,
    score: getTotalStars(campaignProgress),
    totalStars: getTotalStars(campaignProgress),
    furthestLevel: getFurthestLevel(campaignProgress),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'leaderboards', 'campaign', 'entries', profile.uid), entry);
}

export async function fetchArcadeLeaderboard(
  weekly = false,
  friendIds?: string[]
): Promise<LeaderboardEntry[]> {
  const db = getFirestoreDb();
  if (!db) return [];

  const boardId = weekly ? 'arcade_weekly' : 'arcade_alltime';
  const colRef = collection(db, 'leaderboards', boardId, 'entries');
  const snap = await getDocs(query(colRef, orderBy('score', 'desc'), limit(50)));

  let entries: LeaderboardEntry[] = snap.docs.map((d) => ({
    uid: d.id,
    ...d.data(),
  })) as LeaderboardEntry[];

  if (weekly) {
    const cutoff = Date.now() - WEEK_MS;
    entries = entries.filter((e) => e.updatedAt && new Date(e.updatedAt).getTime() >= cutoff);
  }

  if (friendIds && friendIds.length > 0) {
    const allowed = new Set(friendIds);
    entries = entries.filter((e) => allowed.has(e.uid));
  }

  return entries;
}

export async function fetchCampaignLeaderboard(friendIds?: string[]): Promise<LeaderboardEntry[]> {
  const db = getFirestoreDb();
  if (!db) return [];

  const colRef = collection(db, 'leaderboards', 'campaign', 'entries');
  const snap = await getDocs(query(colRef, orderBy('totalStars', 'desc'), limit(50)));

  let entries: LeaderboardEntry[] = snap.docs.map((d) => ({
    uid: d.id,
    ...d.data(),
  })) as LeaderboardEntry[];

  if (friendIds && friendIds.length > 0) {
    const allowed = new Set(friendIds);
    entries = entries.filter((e) => allowed.has(e.uid));
  }

  return entries;
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
