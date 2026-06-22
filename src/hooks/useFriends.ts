import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFriendProfiles } from '../services/userService';
import { FriendProfile } from '../types';
import { getFurthestLevel, getTotalStars } from '../constants/campaignLevels';

export function useFriends() {
  const { profile, user, isGuest } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (isGuest || !user || !profile) {
      setFriends([]);
      return;
    }
    setLoading(true);
    try {
      const profiles = await getFriendProfiles(profile.friendIds ?? []);
      setFriends(
        profiles.map((p) => ({
          uid: p.uid,
          displayName: p.displayName,
          photoURL: p.photoURL,
          playerLevel: p.playerLevel,
          inviteCode: p.inviteCode,
          furthestLevel: getFurthestLevel(p.campaignProgress),
          arcadeBest: p.arcadeBest,
          totalStars: getTotalStars(p.campaignProgress),
          campaignProgress: p.campaignProgress,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [isGuest, user, profile]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { friends, loading, refresh, inviteCode: profile?.inviteCode };
}
