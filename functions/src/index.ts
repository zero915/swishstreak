import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

admin.initializeApp();
const db = admin.firestore();

const ROUND_MS = 24 * 60 * 60 * 1000;
const VERSUS_BETS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const TOURNAMENT_ENTRY = 10;
const TOURNAMENT_MIN = 8;
const TOURNAMENT_MAX = 16;

const BOT_PROFILES = [
  { uid: 'bot_swish_sam', displayName: 'Swish Sam' },
  { uid: 'bot_hoop_hero', displayName: 'Hoop Hero' },
  { uid: 'bot_rim_rock', displayName: 'Rim Rock' },
  { uid: 'bot_net_ninja', displayName: 'Net Ninja' },
  { uid: 'bot_arcade_ace', displayName: 'Arcade Ace' },
  { uid: 'bot_streak_stan', displayName: 'Streak Stan' },
  { uid: 'bot_dunk_dana', displayName: 'Dunk Dana' },
  { uid: 'bot_court_king', displayName: 'Court King' },
];

type PlayerSlot = {
  uid: string;
  displayName: string;
  isBot: boolean;
  rounds: { score: number; submittedAt: string }[];
};

function deadlineFromNow(): string {
  return new Date(Date.now() + ROUND_MS).toISOString();
}

function pickBot(): { uid: string; displayName: string } {
  return BOT_PROFILES[Math.floor(Math.random() * BOT_PROFILES.length)];
}

function botScore(playerLevel: number): number {
  return 80 + playerLevel * 12 + Math.floor(Math.random() * 120);
}

function emptySlot(uid: string, displayName: string, isBot: boolean): PlayerSlot {
  return { uid, displayName, isBot, rounds: [] };
}

async function deductCoins(uid: string, amount: number): Promise<void> {
  const userRef = db.doc(`users/${uid}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpsError('not-found', 'User not found');
    const coins = snap.data()?.totalCoins ?? 0;
    if (coins < amount) throw new HttpsError('failed-precondition', 'Not enough coins');
    tx.update(userRef, { totalCoins: coins - amount });
  });
}

async function creditCoins(uid: string, amount: number): Promise<void> {
  if (uid.startsWith('bot_')) return;
  const userRef = db.doc(`users/${uid}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) return;
    const coins = snap.data()?.totalCoins ?? 0;
    tx.update(userRef, { totalCoins: coins + amount });
  });
}

function shareFriendIds(a: string[], b: string[]): boolean {
  const setB = new Set(b);
  return a.some((id) => setB.has(id));
}

async function tryPairQueue(uid: string, betAmount: number): Promise<string | null> {
  const queueSnap = await db.collection('versus_queue').where('betAmount', '==', betAmount).get();
  const myDoc = await db.doc(`users/${uid}`).get();
  const myFriends: string[] = myDoc.data()?.friendIds ?? [];

  let candidate: QueryDocumentSnapshot | null = null;
  for (const docSnap of queueSnap.docs) {
    if (docSnap.id === uid) continue;
    const otherUid = docSnap.id;
    const otherUser = await db.doc(`users/${otherUid}`).get();
    const otherFriends: string[] = otherUser.data()?.friendIds ?? [];
    if (shareFriendIds(myFriends, otherFriends) || myFriends.includes(otherUid)) {
      candidate = docSnap;
      break;
    }
    if (!candidate) candidate = docSnap;
  }

  if (!candidate) return null;

  const otherUid = candidate.id;
  const [userA, userB] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.doc(`users/${otherUid}`).get(),
  ]);
  if (!userA.exists || !userB.exists) return null;

  const matchRef = db.collection('versus_matches').doc();
  await db.runTransaction(async (tx) => {
    tx.set(matchRef, {
      betAmount,
      status: 'active',
      playerA: emptySlot(uid, userA.data()?.displayName ?? 'Player', false),
      playerB: emptySlot(otherUid, userB.data()?.displayName ?? 'Player', false),
      currentRound: 1,
      roundWins: { a: 0, b: 0 },
      roundDeadline: deadlineFromNow(),
      createdAt: new Date().toISOString(),
    });
    tx.delete(db.doc(`versus_queue/${uid}`));
    tx.delete(db.doc(`versus_queue/${otherUid}`));
    tx.update(db.doc(`users/${uid}`), { activeVersusMatchId: matchRef.id, activeTournamentId: null });
    tx.update(db.doc(`users/${otherUid}`), { activeVersusMatchId: matchRef.id, activeTournamentId: null });
  });

  return matchRef.id;
}

async function pairWithBot(uid: string, betAmount: number): Promise<string> {
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) throw new HttpsError('not-found', 'User not found');
  const bot = pickBot();
  const playerLevel = userSnap.data()?.playerLevel ?? 1;
  const matchRef = db.collection('versus_matches').doc();

  await db.runTransaction(async (tx) => {
    tx.set(matchRef, {
      betAmount,
      status: 'active',
      playerA: emptySlot(uid, userSnap.data()?.displayName ?? 'Player', false),
      playerB: emptySlot(bot.uid, bot.displayName, true),
      currentRound: 1,
      roundWins: { a: 0, b: 0 },
      roundDeadline: deadlineFromNow(),
      createdAt: new Date().toISOString(),
    });
    tx.delete(db.doc(`versus_queue/${uid}`));
    tx.update(db.doc(`users/${uid}`), { activeVersusMatchId: matchRef.id });
  });

  setTimeout(() => {
    void autoBotRound(matchRef.id, playerLevel);
  }, 4000);

  return matchRef.id;
}

async function autoBotRound(matchId: string, playerLevel: number): Promise<void> {
  const snap = await db.doc(`versus_matches/${matchId}`).get();
  if (!snap.exists) return;
  const match = snap.data()!;
  if (match.status !== 'active') return;
  if (!match.playerA.isBot && !match.playerB.isBot) return;
  const botSide: 'A' | 'B' = match.playerA.isBot ? 'A' : 'B';
  const slot = botSide === 'A' ? match.playerA : match.playerB;
  if (slot.rounds.length >= match.currentRound) return;
  await finishRoundSubmission(matchId, botSide, botScore(playerLevel), true);
}

async function finishRoundSubmission(
  matchId: string,
  side: 'A' | 'B',
  score: number,
  isBot = false
): Promise<{ completed: boolean }> {
  const matchRef = db.doc(`versus_matches/${matchId}`);
  const snap = await matchRef.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Match not found');
  const match = snap.data()!;

  if (match.status !== 'active') return { completed: true };
  if (!isBot && new Date(match.roundDeadline).getTime() < Date.now()) {
    throw new HttpsError('deadline-exceeded', 'Round deadline passed');
  }

  const key = side === 'A' ? 'playerA' : 'playerB';
  const otherKey = side === 'A' ? 'playerB' : 'playerA';
  const slot: PlayerSlot = match[key];
  const other: PlayerSlot = match[otherKey];

  if (slot.rounds.length >= match.currentRound) {
    throw new HttpsError('already-exists', 'Round already submitted');
  }

  const updatedSlot: PlayerSlot = {
    ...slot,
    rounds: [...slot.rounds, { score, submittedAt: new Date().toISOString() }],
  };

  let updatedOther = other;
  if (other.rounds.length < match.currentRound && other.isBot) {
    updatedOther = {
      ...other,
      rounds: [...other.rounds, { score: botScore(5), submittedAt: new Date().toISOString() }],
    };
  }

  if (updatedOther.rounds.length < match.currentRound && !updatedOther.isBot) {
    await matchRef.update({ [key]: updatedSlot });
    return { completed: false };
  }

  const myScore = updatedSlot.rounds[match.currentRound - 1].score;
  const otherScore = updatedOther.rounds[match.currentRound - 1].score;
  let wins = { ...match.roundWins };
  if (myScore > otherScore) {
    wins = side === 'A' ? { a: wins.a + 1, b: wins.b } : { a: wins.a, b: wins.b + 1 };
  } else if (myScore < otherScore) {
    wins = side === 'A' ? { a: wins.a, b: wins.b + 1 } : { a: wins.a + 1, b: wins.b };
  }

  const matchOver = wins.a >= 2 || wins.b >= 2 || match.currentRound >= 3;
  if (!matchOver) {
    await matchRef.update({
      [key]: updatedSlot,
      [otherKey]: updatedOther,
      roundWins: wins,
      currentRound: match.currentRound + 1,
      roundDeadline: deadlineFromNow(),
    });
    return { completed: false };
  }

  const winnerSide: 'A' | 'B' = wins.a >= wins.b ? 'A' : 'B';
  const winnerUid = winnerSide === 'A' ? updatedSlot.uid : updatedOther.uid;

  await matchRef.update({
    [key]: updatedSlot,
    [otherKey]: updatedOther,
    roundWins: wins,
    status: 'completed',
    winnerId: winnerUid,
  });

  if (!match.tournamentId && match.betAmount > 0) {
    await creditCoins(winnerUid, match.betAmount * 2);
  }

  await db.doc(`users/${match.playerA.uid}`).set({ activeVersusMatchId: null }, { merge: true });
  await db.doc(`users/${match.playerB.uid}`).set({ activeVersusMatchId: null }, { merge: true });

  if (match.tournamentId) {
    await advanceTournamentMatch(match.tournamentId, matchId, winnerUid);
  }

  return { completed: true };
}

async function advanceTournamentMatch(
  tournamentId: string,
  matchId: string,
  winnerUid: string
): Promise<void> {
  const tRef = db.doc(`tournaments/${tournamentId}`);
  const tSnap = await tRef.get();
  if (!tSnap.exists) return;
  const tournament = tSnap.data()!;
  const bracket = [...tournament.bracket];
  const idx = bracket.findIndex((b) => b.matchId === matchId);
  if (idx < 0) return;
  bracket[idx] = { ...bracket[idx], winnerId: winnerUid };
  await tRef.update({ bracket });

  const round = bracket[idx].round;
  const roundMatches = bracket.filter((b) => b.round === round);
  if (!roundMatches.every((b) => b.winnerId)) return;

  const winners: string[] = roundMatches.map((b) => b.winnerId as string);
  if (winners.length === 1) {
    await tRef.update({ status: 'completed', winnerId: winners[0] });
    await creditCoins(winners[0], tournament.pot);
    for (const pid of tournament.playerIds) {
      if (!pid.startsWith('bot_')) {
        await db.doc(`users/${pid}`).set({ activeTournamentId: null, activeVersusMatchId: null }, { merge: true });
      }
    }
    return;
  }

  const nextRound = round + 1;
  const newBracket = [...bracket];
  for (let i = 0; i < winners.length; i += 2) {
    const aUid = winners[i];
    const bUid = winners[i + 1];
    const matchRef = db.collection('versus_matches').doc();
    await matchRef.set({
      betAmount: 0,
      status: 'active',
      tournamentId,
      bracketRound: nextRound,
      playerA: emptySlot(aUid, aUid.startsWith('bot_') ? 'Bot' : 'Player', aUid.startsWith('bot_')),
      playerB: emptySlot(bUid, bUid.startsWith('bot_') ? 'Bot' : 'Player', bUid.startsWith('bot_')),
      currentRound: 1,
      roundWins: { a: 0, b: 0 },
      roundDeadline: deadlineFromNow(),
      createdAt: new Date().toISOString(),
    });
    newBracket.push({
      matchId: matchRef.id,
      round: nextRound,
      slot: i / 2,
      playerAUid: aUid,
      playerBUid: bUid,
    });
    if (!aUid.startsWith('bot_')) {
      await db.doc(`users/${aUid}`).set({ activeVersusMatchId: matchRef.id, activeTournamentId: tournamentId }, { merge: true });
    }
    if (!bUid.startsWith('bot_')) {
      await db.doc(`users/${bUid}`).set({ activeVersusMatchId: matchRef.id, activeTournamentId: tournamentId }, { merge: true });
    }
  }

  await tRef.update({
    bracket: newBracket,
    currentRound: nextRound,
    roundDeadline: deadlineFromNow(),
  });
}

async function lockTournament(tournamentId: string): Promise<void> {
  const tRef = db.doc(`tournaments/${tournamentId}`);
  const snap = await tRef.get();
  if (!snap.exists) return;
  const tournament = snap.data()!;
  if (tournament.status !== 'filling') return;

  let playerIds: string[] = [...tournament.playerIds];
  while (playerIds.length < TOURNAMENT_MIN) {
    const bot = pickBot();
    if (!playerIds.includes(bot.uid)) playerIds.push(bot.uid);
  }

  let bracketSize = TOURNAMENT_MIN;
  while (bracketSize < playerIds.length && bracketSize < TOURNAMENT_MAX) bracketSize *= 2;
  while (playerIds.length < bracketSize) {
    const bot = pickBot();
    if (!playerIds.includes(bot.uid)) playerIds.push(bot.uid);
  }
  playerIds = playerIds.slice(0, bracketSize);

  const bracket: {
    matchId: string;
    round: number;
    slot: number;
    playerAUid?: string;
    playerBUid?: string;
  }[] = [];

  for (let i = 0; i < playerIds.length; i += 2) {
    const aUid = playerIds[i];
    const bUid = playerIds[i + 1];
    const matchRef = db.collection('versus_matches').doc();
    await matchRef.set({
      betAmount: 0,
      status: 'active',
      tournamentId,
      bracketRound: 1,
      playerA: emptySlot(aUid, aUid.startsWith('bot_') ? 'Bot' : 'Player', aUid.startsWith('bot_')),
      playerB: emptySlot(bUid, bUid.startsWith('bot_') ? 'Bot' : 'Player', bUid.startsWith('bot_')),
      currentRound: 1,
      roundWins: { a: 0, b: 0 },
      roundDeadline: deadlineFromNow(),
      createdAt: new Date().toISOString(),
    });
    bracket.push({ matchId: matchRef.id, round: 1, slot: i / 2, playerAUid: aUid, playerBUid: bUid });
    if (!aUid.startsWith('bot_')) {
      await db.doc(`users/${aUid}`).set({ activeVersusMatchId: matchRef.id, activeTournamentId: tournamentId }, { merge: true });
    }
    if (!bUid.startsWith('bot_')) {
      await db.doc(`users/${bUid}`).set({ activeVersusMatchId: matchRef.id, activeTournamentId: tournamentId }, { merge: true });
    }
  }

  await tRef.update({
    status: 'active',
    playerIds,
    pot: playerIds.filter((id) => !id.startsWith('bot_')).length * TOURNAMENT_ENTRY,
    bracket,
    currentRound: 1,
    roundDeadline: deadlineFromNow(),
  });
}

export const joinVersusQueue = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');
  const betAmount = request.data?.betAmount;
  if (!VERSUS_BETS.includes(betAmount)) throw new HttpsError('invalid-argument', 'Invalid bet');

  await deductCoins(uid, betAmount);
  await db.doc(`versus_queue/${uid}`).set({ betAmount, joinedAt: new Date().toISOString() });

  const matchId = await tryPairQueue(uid, betAmount);
  if (matchId) return { matchId, queued: false };

  setTimeout(() => {
    void db.doc(`versus_queue/${uid}`).get().then((q) => {
      if (q.exists) void pairWithBot(uid, betAmount);
    });
  }, 30000);

  return { queued: true };
});

export const leaveVersusQueue = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');
  const qSnap = await db.doc(`versus_queue/${uid}`).get();
  if (qSnap.exists) {
    const bet = qSnap.data()?.betAmount ?? 0;
    await db.doc(`versus_queue/${uid}`).delete();
    await creditCoins(uid, bet);
  }
  return { ok: true };
});

export const submitVersusRound = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');
  const { matchId, score } = request.data ?? {};
  if (!matchId || typeof score !== 'number') throw new HttpsError('invalid-argument', 'Invalid payload');

  const matchSnap = await db.doc(`versus_matches/${matchId}`).get();
  if (!matchSnap.exists) throw new HttpsError('not-found', 'Match not found');
  const match = matchSnap.data()!;
  const side = match.playerA.uid === uid ? 'A' : match.playerB.uid === uid ? 'B' : null;
  if (!side) throw new HttpsError('permission-denied', 'Not in this match');

  const userSnap = await db.doc(`users/${uid}`).get();
  const best = userSnap.data()?.arcadeBest?.score ?? 0;
  const capped = Math.min(score, Math.max(best * 1.15, 50));

  return finishRoundSubmission(matchId, side, capped);
});

export const joinTournament = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');

  await deductCoins(uid, TOURNAMENT_ENTRY);

  const open = await db.collection('tournaments').where('status', '==', 'filling').limit(1).get();
  let tournamentId: string;

  if (open.empty) {
    const ref = db.collection('tournaments').doc();
    await ref.set({
      status: 'filling',
      entryFee: TOURNAMENT_ENTRY,
      minPlayers: TOURNAMENT_MIN,
      maxPlayers: TOURNAMENT_MAX,
      playerIds: [uid],
      pot: TOURNAMENT_ENTRY,
      bracket: [],
      currentRound: 0,
      roundDeadline: deadlineFromNow(),
      createdAt: new Date().toISOString(),
    });
    tournamentId = ref.id;
  } else {
    tournamentId = open.docs[0].id;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(db.doc(`tournaments/${tournamentId}`));
      const data = snap.data()!;
      const ids = [...data.playerIds];
      if (!ids.includes(uid)) ids.push(uid);
      tx.update(db.doc(`tournaments/${tournamentId}`), { playerIds: ids, pot: ids.length * TOURNAMENT_ENTRY });
    });
  }

  await db.doc(`users/${uid}`).set({ activeTournamentId: tournamentId }, { merge: true });

  const updated = await db.doc(`tournaments/${tournamentId}`).get();
  if ((updated.data()?.playerIds?.length ?? 0) >= TOURNAMENT_MIN) {
    await lockTournament(tournamentId);
  } else {
    setTimeout(() => {
      void db.doc(`tournaments/${tournamentId}`).get().then((t) => {
        if (t.exists && t.data()?.status === 'filling') void lockTournament(tournamentId);
      });
    }, 120000);
  }

  return { tournamentId };
});

export const forfeitExpiredRounds = onSchedule('every 60 minutes', async () => {
  const now = Date.now();
  const active = await db.collection('versus_matches').where('status', '==', 'active').get();

  for (const docSnap of active.docs) {
    const match = docSnap.data();
    if (new Date(match.roundDeadline).getTime() > now) continue;

    const aDone = match.playerA.rounds.length >= match.currentRound;
    const bDone = match.playerB.rounds.length >= match.currentRound;
    if (aDone && bDone) continue;

    const winnerSide: 'A' | 'B' = aDone ? 'A' : bDone ? 'B' : Math.random() > 0.5 ? 'A' : 'B';
    const loserSide: 'A' | 'B' = winnerSide === 'A' ? 'B' : 'A';

    try {
      if (!aDone && loserSide === 'A') await finishRoundSubmission(docSnap.id, 'A', 0, true);
      if (!bDone && loserSide === 'B') await finishRoundSubmission(docSnap.id, 'B', 0, true);
      if (!aDone && winnerSide === 'A') await finishRoundSubmission(docSnap.id, 'A', 1, true);
      if (!bDone && winnerSide === 'B') await finishRoundSubmission(docSnap.id, 'B', 1, true);
    } catch {
      // skip
    }
  }
});
