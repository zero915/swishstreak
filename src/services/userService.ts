import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { DEFAULT_PLAYER_DATA } from '../constants/gameConfig';
import { getFirestoreDb } from '../config/firebase';
import { PlayerData, UserProfile } from '../types';
import { mergePlayerData } from '../utils/mergeProgress';
import { xpToLevel } from '../utils/xp';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

export async function createOrUpdateUserProfile(
  user: User,
  provider: 'google' | 'facebook',
  localData?: PlayerData
): Promise<UserProfile> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is not configured');

  const existing = await getUserProfile(user.uid);
  if (existing) {
    if (localData) {
      const merged = mergePlayerData(localData, existing);
      await updateDoc(doc(db, 'users', user.uid), {
        ...merged,
        displayName: user.displayName ?? existing.displayName,
        photoURL: user.photoURL ?? existing.photoURL,
        playerLevel: xpToLevel(merged.totalXP),
      });
      return { ...existing, ...merged };
    }
    return existing;
  }

  const base = localData ? mergePlayerData(localData, DEFAULT_PLAYER_DATA) : DEFAULT_PLAYER_DATA;
  const profile: Omit<UserProfile, 'uid'> = {
    displayName: user.displayName ?? 'Player',
    photoURL: user.photoURL ?? undefined,
    provider,
    inviteCode: generateInviteCode(),
    friendIds: [],
    ...base,
    playerLevel: xpToLevel(base.totalXP),
  };

  await setDoc(doc(db, 'users', user.uid), profile);
  return { uid: user.uid, ...profile };
}

export async function saveUserProgress(uid: string, data: Partial<PlayerData>): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const payload = { ...data };
  if (data.totalXP !== undefined) {
    payload.playerLevel = xpToLevel(data.totalXP);
  }
  await updateDoc(doc(db, 'users', uid), payload);
}

export async function findUserByInviteCode(code: string): Promise<UserProfile | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const q = query(collection(db, 'users'), where('inviteCode', '==', code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
}

export async function addFriend(uid: string, friendUid: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;

  const userRef = doc(db, 'users', uid);
  const friendRef = doc(db, 'users', friendUid);
  const [userSnap, friendSnap] = await Promise.all([getDoc(userRef), getDoc(friendRef)]);
  if (!userSnap.exists() || !friendSnap.exists()) return;

  const userFriends: string[] = userSnap.data().friendIds ?? [];
  const friendFriends: string[] = friendSnap.data().friendIds ?? [];

  if (!userFriends.includes(friendUid)) {
    await updateDoc(userRef, { friendIds: [...userFriends, friendUid] });
  }
  if (!friendFriends.includes(uid)) {
    await updateDoc(friendRef, { friendIds: [...friendFriends, uid] });
  }
}

export async function getFriendProfiles(friendIds: string[]): Promise<UserProfile[]> {
  const db = getFirestoreDb();
  if (!db || friendIds.length === 0) return [];
  const profiles = await Promise.all(friendIds.map((id) => getUserProfile(id)));
  return profiles.filter((p): p is UserProfile => p !== null);
}
