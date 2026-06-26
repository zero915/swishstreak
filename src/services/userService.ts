import { User } from 'firebase/auth';
import { DEFAULT_PLAYER_DATA } from '../constants/gameConfig';
import { getFirebaseAuth } from '../config/firebase';
import { PlayerData, UserLocation, UserProfile } from '../types';
import { mergePlayerData } from '../utils/mergeProgress';
import { generateRandomUsername } from '../utils/randomUsername';
import { xpToLevel } from '../utils/xp';
import * as api from './gameServerClient';

/**
 * Phase 1 of FIREBASE_MIGRATION.md: profiles now live in game-platform-server
 * (Cloudflare D1) instead of Firestore. Firebase Auth is still the identity layer.
 * Public function signatures are unchanged so the rest of the app is untouched.
 */

function signedIn(): boolean {
  return !!getFirebaseAuth()?.currentUser || !!process.env.EXPO_PUBLIC_DEV_UID;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!signedIn()) return null;
  return api.fetchProfile(uid);
}

export async function createOrUpdateUserProfile(
  user: User,
  provider: 'google' | 'facebook',
  localData?: PlayerData
): Promise<UserProfile> {
  if (!signedIn()) throw new Error('Not signed in');

  const existing = await api.fetchMyProfile();
  if (existing) {
    if (localData) {
      const merged = mergePlayerData(localData, existing);
      const updated: UserProfile = {
        ...existing,
        ...merged,
        // Keep the player's chosen/randomly-assigned name — never overwrite it with
        // the social provider's real name on subsequent logins.
        displayName: existing.displayName,
        photoURL: user.photoURL ?? existing.photoURL,
        playerLevel: xpToLevel(merged.totalXP),
      };
      await api.putMyProfile(updated);
      return updated;
    }
    return existing;
  }

  const base = localData ? mergePlayerData(localData, DEFAULT_PLAYER_DATA) : DEFAULT_PLAYER_DATA;
  const facebookId =
    provider === 'facebook'
      ? user.providerData.find((p) => p.providerId === 'facebook.com')?.uid
      : undefined;
  const profile: UserProfile = {
    uid: user.uid,
    // Assign a random handle rather than the social provider's real name —
    // the player can rename themselves later via setDisplayName().
    displayName: generateRandomUsername(),
    photoURL: user.photoURL ?? undefined,
    provider,
    facebookId,
    inviteCode: generateInviteCode(),
    friendIds: [],
    ...base,
    playerLevel: xpToLevel(base.totalXP),
  };

  await api.putMyProfile(profile);
  return profile;
}

export async function setDisplayName(displayName: string): Promise<void> {
  if (!signedIn()) return;
  const trimmed = displayName.trim();
  if (!trimmed) return;
  await api.patchMyProfile({ displayName: trimmed });
}

export async function saveUserProgress(uid: string, data: Partial<PlayerData>): Promise<void> {
  if (!signedIn()) return;
  const payload: Record<string, unknown> = { ...data };
  if (data.totalXP !== undefined) {
    payload.playerLevel = xpToLevel(data.totalXP);
  }
  await api.patchMyProfile(payload);
}

export async function updateUserLocation(uid: string, location: UserLocation): Promise<void> {
  if (!signedIn()) return;
  await api.patchMyProfile({ location });
}

export async function updateUserActiveMatches(
  uid: string,
  fields: { activeVersusMatchId?: string | null; activeTournamentId?: string | null }
): Promise<void> {
  if (!signedIn()) return;
  await api.patchMyProfile(fields);
}

export async function findUserByInviteCode(code: string): Promise<UserProfile | null> {
  if (!signedIn()) return null;
  return api.fetchProfileByInvite(code.toUpperCase());
}

export async function addFriend(uid: string, friendUid: string): Promise<void> {
  if (!signedIn()) return;
  await api.addFriendRemote(friendUid);
}

export async function getFriendProfiles(friendIds: string[]): Promise<UserProfile[]> {
  if (!signedIn() || friendIds.length === 0) return [];
  return api.fetchProfilesBatch(friendIds);
}
