import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchArcadeLeaderboard,
  fetchCampaignLeaderboard,
  fetchRegionalArcadeLeaderboard,
} from '../services/leaderboardService';
import { LeaderboardEntry } from '../types';

export function useLeaderboard() {
  const { profile, isGuest } = useAuth();
  const [arcadeAllTime, setArcadeAllTime] = useState<LeaderboardEntry[]>([]);
  const [arcadeWeekly, setArcadeWeekly] = useState<LeaderboardEntry[]>([]);
  const [arcadeLocal, setArcadeLocal] = useState<LeaderboardEntry[]>([]);
  const [campaign, setCampaign] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(
    async (friendsOnly = false) => {
      if (isGuest) return;
      setLoading(true);
      try {
        const friendIds = friendsOnly ? profile?.friendIds : undefined;
        const loc = profile?.location;
        const [allTime, weekly, camp, local] = await Promise.all([
          fetchArcadeLeaderboard(false, friendIds),
          fetchArcadeLeaderboard(true, friendIds),
          fetchCampaignLeaderboard(friendIds),
          loc?.countryCode
            ? fetchRegionalArcadeLeaderboard(loc.countryCode, loc.region, false)
            : Promise.resolve<LeaderboardEntry[]>([]),
        ]);
        setArcadeAllTime(allTime);
        setArcadeWeekly(weekly);
        setCampaign(camp);
        setArcadeLocal(local);
      } finally {
        setLoading(false);
      }
    },
    [isGuest, profile?.friendIds, profile?.location]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { arcadeAllTime, arcadeWeekly, arcadeLocal, campaign, loading, refresh };
}
