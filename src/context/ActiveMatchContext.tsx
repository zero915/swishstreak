import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { ActiveMatchDeadline } from '../types';
import { getOpponentName, subscribeVersusMatch } from '../services/versusService';
import { subscribeTournament } from '../services/tournamentService';

interface ActiveMatchContextValue {
  deadline: ActiveMatchDeadline | null;
  refreshAuthProfile: () => void;
}

const ActiveMatchContext = createContext<ActiveMatchContextValue | null>(null);

export function ActiveMatchProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, refreshProfile, isGuest } = useAuth();
  const [deadline, setDeadline] = useState<ActiveMatchDeadline | null>(null);

  const refreshAuthProfile = useCallback(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (isGuest || !user || !profile?.activeVersusMatchId) {
      if (!profile?.activeTournamentId) setDeadline(null);
      return;
    }

    const unsub = subscribeVersusMatch(profile.activeVersusMatchId, (match) => {
      if (!match) {
        setDeadline(null);
        return;
      }
      if (match.status !== 'active') {
        setDeadline(null);
        refreshAuthProfile();
        return;
      }
      setDeadline({
        kind: match.tournamentId ? 'tournament' : 'versus',
        matchId: match.id,
        tournamentId: match.tournamentId,
        opponentName: getOpponentName(match, user.uid),
        currentRound: match.currentRound,
        roundDeadline: match.roundDeadline,
        label: `Round ${match.currentRound} vs ${getOpponentName(match, user.uid)}`,
      });
    });

    return unsub;
  }, [isGuest, user, profile?.activeVersusMatchId, profile?.activeTournamentId, refreshAuthProfile]);

  useEffect(() => {
    if (!profile?.activeTournamentId || profile?.activeVersusMatchId) return;

    const unsub = subscribeTournament(profile.activeTournamentId, (t) => {
      if (!t) {
        setDeadline(null);
        return;
      }
      if (t.status === 'filling') {
        setDeadline({
          kind: 'tournament',
          matchId: '',
          tournamentId: t.id,
          opponentName: 'Bracket',
          currentRound: 0,
          roundDeadline: t.roundDeadline,
          label: `Tournament filling ${t.playerIds?.length ?? 0}/8+`,
        });
      }
    });

    return unsub;
  }, [profile?.activeTournamentId, profile?.activeVersusMatchId]);

  const value = useMemo(() => ({ deadline, refreshAuthProfile }), [deadline, refreshAuthProfile]);

  return <ActiveMatchContext.Provider value={value}>{children}</ActiveMatchContext.Provider>;
}

export function useActiveMatch() {
  const ctx = useContext(ActiveMatchContext);
  if (!ctx) throw new Error('useActiveMatch must be used within ActiveMatchProvider');
  return ctx;
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function useDeadlineLabel(deadlineIso: string): { text: string; urgent: boolean } {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const left = new Date(deadlineIso).getTime() - now;
  return { text: formatTimeLeft(left), urgent: left > 0 && left < 2 * 3600000 };
}
