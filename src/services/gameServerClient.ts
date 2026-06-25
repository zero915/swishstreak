/**
 * Client for the Cloudflare game-platform-server (Hono + D1).
 *
 * Base URL resolution (set EXPO_PUBLIC_API_URL in .env or app config):
 *   - production: your Workers URL, e.g. https://game-platform-server.<sub>.workers.dev
 *   - Android emulator -> host: http://10.0.2.2:8787   (default below)
 *   - physical device over LAN: http://<your-machine-ip>:8787
 *
 * Auth: sends the Firebase ID token as `Authorization: Bearer <token>`, which the
 * server verifies. For local testing without Firebase, set EXPO_PUBLIC_DEV_UID and
 * run the server with AUTH_DEV_BYPASS=true — the client then sends `Bearer dev:<uid>`.
 */
import { getFirebaseAuth } from '../config/firebase';
import type { LeaderboardEntry, Tournament, UserProfile, VersusMatch } from '../types';

const GAME_ID = 'swish-streak';
const PROFILE_BASE = `/api/profiles/${GAME_ID}`;
const BOARDS_BASE = `/api/boards/${GAME_ID}`;
const VERSUS_BASE = `/api/versus/${GAME_ID}`;
const TOURNAMENT_BASE = `/api/tournaments/${GAME_ID}`;

export function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8787';
}

async function getAuthToken(): Promise<string> {
  const devUid = process.env.EXPO_PUBLIC_DEV_UID;
  if (devUid) return `dev:${devUid}`; // matches server AUTH_DEV_BYPASS

  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) throw new Error('Not signed in');
  return user.getIdToken();
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ── Player ──
export function syncPlayer(input: { displayName?: string; photoUrl?: string; country?: string; region?: string }) {
  return request<{ player: unknown }>('/api/players/sync', { method: 'POST', body: JSON.stringify(input) });
}
export function getMe() {
  return request<{ player: unknown; friends: unknown[] }>('/api/players/me');
}
export function getMyGameState() {
  return request(`/api/players/me/games/${GAME_ID}`);
}

// ── Game session / anti-cheat replay ──
export function startGame(mode?: string) {
  return request<{ sessionId: string; seed: number; mode: string; resumed?: boolean }>(
    `/api/games/${GAME_ID}/game/start`,
    { method: 'POST', body: JSON.stringify({ mode }) }
  );
}
export function submitGame(input: { sessionId: string; moves: unknown[]; claimedScore: number }) {
  return request<{ accepted: boolean; score: number; coinsEarned: number; grantedAchievements: unknown[] }>(
    `/api/games/${GAME_ID}/game/submit`,
    { method: 'POST', body: JSON.stringify(input) }
  );
}

// ── Leaderboards ──
export function getGlobalLeaderboard() {
  return request<{ leaderboard: unknown[] }>(`/api/games/${GAME_ID}/leaderboard/global`);
}
export function getFriendsLeaderboard() {
  return request<{ leaderboard: unknown[] }>(`/api/games/${GAME_ID}/leaderboard/friends`);
}
export function getWeeklyLeaderboard() {
  return request<{ leaderboard: unknown[] }>(`/api/games/${GAME_ID}/leaderboard/weekly`);
}

// ── Profiles (Phase 1: replaces Firestore `users/`) ──
export async function fetchMyProfile(): Promise<UserProfile | null> {
  const r = await request<{ profile: UserProfile | null }>(`${PROFILE_BASE}/me`);
  return r.profile;
}
export async function putMyProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const r = await request<{ profile: UserProfile }>(`${PROFILE_BASE}/me`, { method: 'PUT', body: JSON.stringify(profile) });
  return r.profile;
}
export async function patchMyProfile(patch: Record<string, unknown>): Promise<UserProfile> {
  const r = await request<{ profile: UserProfile }>(`${PROFILE_BASE}/me`, { method: 'PATCH', body: JSON.stringify(patch) });
  return r.profile;
}
export async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const r = await request<{ profile: UserProfile | null }>(`${PROFILE_BASE}/user/${encodeURIComponent(uid)}`);
  return r.profile;
}
export async function fetchProfileByInvite(code: string): Promise<UserProfile | null> {
  const r = await request<{ profile: UserProfile | null }>(`${PROFILE_BASE}/by-invite/${encodeURIComponent(code)}`);
  return r.profile;
}
export async function fetchProfilesBatch(uids: string[]): Promise<UserProfile[]> {
  const r = await request<{ profiles: UserProfile[] }>(`${PROFILE_BASE}/batch`, { method: 'POST', body: JSON.stringify({ uids }) });
  return r.profiles;
}
export async function addFriendRemote(friendUid: string): Promise<{ ok: boolean; friendIds: string[] }> {
  return request<{ ok: boolean; friendIds: string[] }>(`${PROFILE_BASE}/friends`, { method: 'POST', body: JSON.stringify({ friendUid }) });
}

// ── Leaderboards (Phase 2: replaces Firestore `leaderboards/`) ──
export interface BoardEntryInput {
  board: string;
  score: number;
  displayName?: string;
  photoURL?: string;
  playerLevel?: number;
  streak?: number;
  totalStars?: number;
  furthestLevel?: number;
  countryCode?: string;
  region?: string;
}
export function submitBoardEntry(entry: BoardEntryInput): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`${BOARDS_BASE}/submit`, { method: 'POST', body: JSON.stringify(entry) });
}
export async function fetchBoard(params: {
  board: string;
  scope?: 'global' | 'weekly' | 'regional';
  country?: string;
  region?: string;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  const q = new URLSearchParams();
  q.set('board', params.board);
  if (params.scope) q.set('scope', params.scope);
  if (params.country) q.set('country', params.country);
  if (params.region) q.set('region', params.region);
  if (params.limit) q.set('limit', String(params.limit));
  const r = await request<{ leaderboard: LeaderboardEntry[] }>(`${BOARDS_BASE}?${q.toString()}`);
  return r.leaderboard;
}

// ── Versus / PvP (Phase 3: replaces Firebase Functions + Firestore) ──
export function versusJoin(betAmount: number): Promise<{ matchId?: string; queued: boolean }> {
  return request<{ matchId?: string; queued: boolean }>(`${VERSUS_BASE}/queue/join`, { method: 'POST', body: JSON.stringify({ betAmount }) });
}
export function versusLeave(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`${VERSUS_BASE}/queue/leave`, { method: 'POST', body: '{}' });
}
export function versusSubmitRound(matchId: string, score: number): Promise<{ completed: boolean }> {
  return request<{ completed: boolean }>(`${VERSUS_BASE}/round/submit`, { method: 'POST', body: JSON.stringify({ matchId, score }) });
}
export async function versusGetMatch(matchId: string): Promise<VersusMatch | null> {
  const r = await request<{ match: VersusMatch | null }>(`${VERSUS_BASE}/match/${encodeURIComponent(matchId)}`);
  return r.match;
}
export async function versusActiveMatchId(): Promise<string | null> {
  const r = await request<{ matchId: string | null }>(`${VERSUS_BASE}/me/active`);
  return r.matchId;
}

// ── Tournaments (Phase 4) ──
export function tournamentJoin(): Promise<{ tournamentId: string }> {
  return request<{ tournamentId: string }>(`${TOURNAMENT_BASE}/join`, { method: 'POST', body: '{}' });
}
export async function tournamentGet(id: string): Promise<Tournament | null> {
  const r = await request<{ tournament: Tournament | null }>(`${TOURNAMENT_BASE}/${encodeURIComponent(id)}`);
  return r.tournament;
}
export async function tournamentOpen(): Promise<Tournament | null> {
  const r = await request<{ tournament: Tournament | null }>(`${TOURNAMENT_BASE}/open`);
  return r.tournament;
}
export async function tournamentActiveId(): Promise<string | null> {
  const r = await request<{ tournamentId: string | null }>(`${TOURNAMENT_BASE}/me/active`);
  return r.tournamentId;
}
