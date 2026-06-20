import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PLAYER_DATA, STORAGE_KEYS } from '../constants/gameConfig';
import { PlayerData } from '../types';

export async function getJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadGuestProgress(): Promise<PlayerData> {
  return getJson<PlayerData>(STORAGE_KEYS.guestProgress, DEFAULT_PLAYER_DATA);
}

export async function saveGuestProgress(data: PlayerData): Promise<void> {
  await setJson(STORAGE_KEYS.guestProgress, data);
}

export async function getHasSeenLogin(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.hasSeenLogin);
  return val === 'true';
}

export async function setHasSeenLogin(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.hasSeenLogin, 'true');
}

export async function getIsGuest(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.isGuest);
  return val !== 'false';
}

export async function setIsGuest(isGuest: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.isGuest, isGuest ? 'true' : 'false');
}

export async function loadDailyBonusTimestamp(): Promise<string | undefined> {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.dailyBonus);
  return val ?? undefined;
}

export async function saveDailyBonusTimestamp(iso: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.dailyBonus, iso);
}
