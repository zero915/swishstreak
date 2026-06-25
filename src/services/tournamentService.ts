import { Tournament } from '../types';
import * as api from './gameServerClient';

/**
 * Phase 4 of FIREBASE_MIGRATION.md: tournaments now run on game-platform-server
 * (Cloudflare) instead of Firebase Functions + Firestore. Realtime onSnapshot is
 * replaced by polling. Public function signatures are unchanged so the tournament
 * screens don't need edits.
 */

export async function joinTournament(): Promise<{ tournamentId: string }> {
  return api.tournamentJoin();
}

export async function getTournament(tournamentId: string): Promise<Tournament | null> {
  return api.tournamentGet(tournamentId);
}

export async function getOpenTournament(): Promise<Tournament | null> {
  return api.tournamentOpen();
}

/** Polling stand-in for the old Firestore onSnapshot. Returns an unsubscribe fn. */
export function subscribeTournament(
  tournamentId: string,
  onUpdate: (tournament: Tournament | null) => void
): () => void {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const t = await api.tournamentGet(tournamentId);
      if (active) onUpdate(t);
    } catch {
      // transient — next tick retries
    }
  };
  void poll();
  const interval = setInterval(poll, 3000);
  return () => {
    active = false;
    clearInterval(interval);
  };
}
