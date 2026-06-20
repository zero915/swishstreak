import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchArcadeLeaderboard, fetchCampaignLeaderboard } from '../services/leaderboardService';
import { LeaderboardEntry } from '../types';

export function useLeaderboard() {
  const { profile, isGuest } = useAuth();
  const [arcadeAllTime, setArcadeAllTime] = useState<LeaderboardEntry[]>([]);
  const [arcadeWeekly, setArcadeWeekly] = useState<LeaderboardEntry[]>([]);
  const [campaign, setCampaign] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(
    async (friendsOnly = false) => {
      if (isGuest) return;
      setLoading(true);
      try {
        const friendIds = friendsOnly ? profile?.friendIds : undefined;
        const [allTime, weekly, camp] = await Promise.all([
          fetchArcadeLeaderboard(false, friendIds),
          fetchArcadeLeaderboard(true, friendIds),
          fetchCampaignLeaderboard(friendIds),
        ]);
        setArcadeAllTime(allTime);
        setArcadeWeekly(weekly);
        setCampaign(camp);
      } finally {
        setLoading(false);
      }
    },
    [isGuest, profile?.friendIds]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { arcadeAllTime, arcadeWeekly, campaign, loading, refresh };
}
