import { VersusMatch } from '../types';
import * as api from './gameServerClient';

/**
 * Phase 3 of FIREBASE_MIGRATION.md: versus now runs on game-platform-server
 * (Cloudflare) instead of Firebase Functions + Firestore. Realtime onSnapshot is
 * replaced by polling. Public function signatures are unchanged so the versus
 * screens don't need edits.
 */

export async function joinVersusQueue(betAmount: number): Promise<{ matchId?: string; queued: boolean }> {
  return api.versusJoin(betAmount);
}

export async function leaveVersusQueue(): Promise<void> {
  await api.versusLeave();
}

export async function submitVersusRound(matchId: string, score: number): Promise<{ completed: boolean }> {
  return api.versusSubmitRound(matchId, score);
}

export async function getVersusMatch(matchId: string): Promise<VersusMatch | null> {
  return api.versusGetMatch(matchId);
}

/** Polling stand-in for the old Firestore onSnapshot. Returns an unsubscribe fn. */
export function subscribeVersusMatch(
  matchId: string,
  onUpdate: (match: VersusMatch | null) => void
): () => void {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const match = await api.versusGetMatch(matchId);
      if (active) onUpdate(match);
    } catch {
      // transient network error — next tick retries
    }
  };
  void poll();
  const interval = setInterval(poll, 3000);
  return () => {
    active = false;
    clearInterval(interval);
  };
}

// ── pure helpers (unchanged) ──
export function getOpponentName(match: VersusMatch, myUid: string): string {
  if (match.playerA.uid === myUid) return match.playerB.displayName;
  return match.playerA.displayName;
}

export function getMySlot(match: VersusMatch, myUid: string) {
  return match.playerA.uid === myUid ? match.playerA : match.playerB;
}

export function getTheirSlot(match: VersusMatch, myUid: string) {
  return match.playerA.uid === myUid ? match.playerB : match.playerA;
}

export function hasSubmittedThisRound(match: VersusMatch, myUid: string): boolean {
  const slot = getMySlot(match, myUid);
  return slot.rounds.length >= match.currentRound;
}

export function canPlayVersusRound(match: VersusMatch, myUid: string): boolean {
  if (match.status !== 'active') return false;
  if (new Date(match.roundDeadline).getTime() < Date.now()) return false;
  return !hasSubmittedThisRound(match, myUid);
}
