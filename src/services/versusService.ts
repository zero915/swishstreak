import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getFirestoreDb } from '../config/firebase';
import { callFunction } from './functionsClient';
import { VersusMatch } from '../types';

export async function joinVersusQueue(betAmount: number): Promise<{ matchId?: string; queued: boolean }> {
  return callFunction<{ betAmount: number }, { matchId?: string; queued: boolean }>('joinVersusQueue', {
    betAmount,
  });
}

export async function leaveVersusQueue(): Promise<void> {
  await callFunction<Record<string, never>, { ok: boolean }>('leaveVersusQueue', {});
}

export async function submitVersusRound(matchId: string, score: number): Promise<{ completed: boolean }> {
  return callFunction<{ matchId: string; score: number }, { completed: boolean }>('submitVersusRound', {
    matchId,
    score,
  });
}

export async function getVersusMatch(matchId: string): Promise<VersusMatch | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'versus_matches', matchId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as VersusMatch;
}

export function subscribeVersusMatch(
  matchId: string,
  onUpdate: (match: VersusMatch | null) => void
): () => void {
  const db = getFirestoreDb();
  if (!db) return () => {};
  return onSnapshot(doc(db, 'versus_matches', matchId), (snap) => {
    if (!snap.exists()) {
      onUpdate(null);
      return;
    }
    onUpdate({ id: snap.id, ...snap.data() } as VersusMatch);
  });
}

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
