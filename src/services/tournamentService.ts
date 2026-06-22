import { collection, doc, getDoc, onSnapshot, query, where, getDocs, limit } from 'firebase/firestore';
import { getFirestoreDb } from '../config/firebase';
import { callFunction } from './functionsClient';
import { Tournament } from '../types';

export async function joinTournament(): Promise<{ tournamentId: string }> {
  return callFunction<Record<string, never>, { tournamentId: string }>('joinTournament', {});
}

export async function getTournament(tournamentId: string): Promise<Tournament | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'tournaments', tournamentId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Tournament;
}

export async function getOpenTournament(): Promise<Tournament | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const q = query(
    collection(db, 'tournaments'),
    where('status', '==', 'filling'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Tournament;
}

export function subscribeTournament(
  tournamentId: string,
  onUpdate: (tournament: Tournament | null) => void
): () => void {
  const db = getFirestoreDb();
  if (!db) return () => {};
  return onSnapshot(doc(db, 'tournaments', tournamentId), (snap) => {
    if (!snap.exists()) {
      onUpdate(null);
      return;
    }
    onUpdate({ id: snap.id, ...snap.data() } as Tournament);
  });
}
