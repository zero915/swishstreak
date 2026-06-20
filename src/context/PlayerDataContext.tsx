import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_PLAYER_DATA, DAILY_BONUS_COINS, DAILY_BONUS_COOLDOWN_MS, DAILY_BONUS_XP } from '../constants/gameConfig';
import { SHOP_CATALOG } from '../constants/shopCatalog';
import { useAuth } from '../context/AuthContext';
import { saveUserProgress } from '../services/userService';
import { updateLeaderboardsAfterRun } from '../services/leaderboardService';
import { CampaignLevelProgress, GameMode, LevelResult, PlayerData, RunSummary, ShopCategory } from '../types';
import { loadDailyBonusTimestamp, loadGuestProgress, saveDailyBonusTimestamp, saveGuestProgress } from '../utils/storage';
import { calculateArcadeRunXP, calculateCampaignXP, calculateMakeXP, xpToLevel } from '../utils/xp';

interface PlayerDataContextValue {
  data: PlayerData;
  isReady: boolean;
  addCoins: (amount: number) => void;
  addXP: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  buyItem: (itemId: string) => boolean;
  equipItem: (itemId: string, category: ShopCategory) => void;
  claimDailyBonus: () => Promise<boolean>;
  dailyBonusAvailable: boolean;
  dailyBonusTimeLeft: number;
  recordMake: (mode: GameMode) => void;
  recordArcadeRunEnd: (summary: RunSummary) => Promise<void>;
  recordCampaignLevelEnd: (result: LevelResult) => Promise<void>;
  refresh: () => Promise<void>;
}

const PlayerDataContext = createContext<PlayerDataContextValue | null>(null);

export function PlayerDataProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isGuest, setProfile } = useAuth();
  const [data, setData] = useState<PlayerData>(DEFAULT_PLAYER_DATA);
  const [isReady, setIsReady] = useState(false);
  const [dailyBonusTimeLeft, setDailyBonusTimeLeft] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (next: PlayerData) => {
      if (isGuest || !user) {
        await saveGuestProgress(next);
      } else {
        await saveUserProgress(user.uid, next);
        if (profile) {
          setProfile({ ...profile, ...next, playerLevel: xpToLevel(next.totalXP) });
        }
      }
    },
    [isGuest, user, profile, setProfile]
  );

  const scheduleSave = useCallback(
    (next: PlayerData) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(next), 500);
    },
    [persist]
  );

  const updateData = useCallback(
    (updater: (prev: PlayerData) => PlayerData) => {
      setData((prev) => {
        const next = updater(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const refresh = useCallback(async () => {
    if (profile && !isGuest) {
      setData({
        totalCoins: profile.totalCoins,
        totalXP: profile.totalXP,
        playerLevel: profile.playerLevel,
        shopState: profile.shopState,
        campaignProgress: profile.campaignProgress,
        arcadeBest: profile.arcadeBest,
        dailyBonusLastClaim: profile.dailyBonusLastClaim,
      });
    } else {
      const local = await loadGuestProgress();
      setData(local);
    }
    setIsReady(true);
  }, [profile, isGuest]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const updateCooldown = async () => {
      const last = data.dailyBonusLastClaim ?? (await loadDailyBonusTimestamp());
      if (!last) {
        setDailyBonusTimeLeft(0);
        return;
      }
      const elapsed = Date.now() - new Date(last).getTime();
      setDailyBonusTimeLeft(Math.max(0, DAILY_BONUS_COOLDOWN_MS - elapsed));
    };
    updateCooldown();
    const interval = setInterval(updateCooldown, 60000);
    return () => clearInterval(interval);
  }, [data.dailyBonusLastClaim]);

  const addCoins = useCallback(
    (amount: number) => {
      updateData((prev) => ({ ...prev, totalCoins: prev.totalCoins + amount }));
    },
    [updateData]
  );

  const addXP = useCallback(
    (amount: number) => {
      updateData((prev) => {
        const totalXP = prev.totalXP + amount;
        return { ...prev, totalXP, playerLevel: xpToLevel(totalXP) };
      });
    },
    [updateData]
  );

  const spendCoins = useCallback(
    (amount: number) => {
      let success = false;
      updateData((prev) => {
        if (prev.totalCoins < amount) return prev;
        success = true;
        return { ...prev, totalCoins: prev.totalCoins - amount };
      });
      return success;
    },
    [updateData]
  );

  const buyItem = useCallback(
    (itemId: string) => {
      const item = SHOP_CATALOG.find((i) => i.id === itemId);
      if (!item) return false;
      let success = false;
      updateData((prev) => {
        if (prev.shopState.owned.includes(itemId)) return prev;
        if (prev.totalCoins < item.cost) return prev;
        success = true;
        return {
          ...prev,
          totalCoins: prev.totalCoins - item.cost,
          shopState: {
            ...prev.shopState,
            owned: [...prev.shopState.owned, itemId],
          },
        };
      });
      return success;
    },
    [updateData]
  );

  const equipItem = useCallback(
    (itemId: string, category: ShopCategory) => {
      updateData((prev) => {
        if (!prev.shopState.owned.includes(itemId)) return prev;
        return {
          ...prev,
          shopState: {
            ...prev.shopState,
            equipped: { ...prev.shopState.equipped, [category === 'balls' ? 'ball' : category === 'backboards' ? 'backboard' : 'background']: itemId },
          },
        };
      });
    },
    [updateData]
  );

  const claimDailyBonus = useCallback(async () => {
    if (dailyBonusTimeLeft > 0) return false;
    const now = new Date().toISOString();
    updateData((prev) => ({
      ...prev,
      totalCoins: prev.totalCoins + DAILY_BONUS_COINS,
      totalXP: prev.totalXP + DAILY_BONUS_XP,
      playerLevel: xpToLevel(prev.totalXP + DAILY_BONUS_XP),
      dailyBonusLastClaim: now,
    }));
    await saveDailyBonusTimestamp(now);
    setDailyBonusTimeLeft(DAILY_BONUS_COOLDOWN_MS);
    return true;
  }, [dailyBonusTimeLeft, updateData]);

  const recordMake = useCallback(
    (_mode: GameMode) => {
      addXP(calculateMakeXP());
    },
    [addXP]
  );

  const recordArcadeRunEnd = useCallback(
    async (summary: RunSummary) => {
      const xpGain = calculateArcadeRunXP(summary.bestStreak);
      let nextData: PlayerData | null = null;
      updateData((prev) => {
        const score = summary.score;
        const arcadeBest =
          score > prev.arcadeBest.score
            ? { score, streak: summary.bestStreak, shotsMade: summary.shotsMade, updatedAt: new Date().toISOString() }
            : prev.arcadeBest;
        const totalXP = prev.totalXP + xpGain;
        nextData = {
          ...prev,
          totalXP,
          playerLevel: xpToLevel(totalXP),
          arcadeBest,
        };
        return nextData;
      });

      if (user && profile && nextData) {
        await updateLeaderboardsAfterRun(user.uid, profile, nextData, {
          shotsMade: summary.shotsMade,
          bestStreak: summary.bestStreak,
          coinsEarned: summary.coinsEarned,
        });
      }
    },
    [updateData, user, profile]
  );

  const recordCampaignLevelEnd = useCallback(
    async (result: LevelResult) => {
      if (!result.passed) return;
      const xpGain = calculateCampaignXP(result.stars);
      let nextData: PlayerData | null = null;
      updateData((prev) => {
        const existing = prev.campaignProgress[result.levelId];
        const progress: CampaignLevelProgress = {
          stars: Math.max(existing?.stars ?? 0, result.stars),
          bestScore: Math.max(existing?.bestScore ?? 0, result.stars),
          completedAt: new Date().toISOString(),
        };
        const totalXP = prev.totalXP + xpGain;
        nextData = {
          ...prev,
          totalXP,
          playerLevel: xpToLevel(totalXP),
          campaignProgress: { ...prev.campaignProgress, [result.levelId]: progress },
        };
        return nextData;
      });

      if (user && profile && nextData) {
        await updateLeaderboardsAfterRun(user.uid, profile, nextData, {
          shotsMade: 0,
          bestStreak: 0,
          coinsEarned: result.coinsEarned,
        });
      }
    },
    [updateData, user, profile]
  );

  const value = useMemo(
    () => ({
      data,
      isReady,
      addCoins,
      addXP,
      spendCoins,
      buyItem,
      equipItem,
      claimDailyBonus,
      dailyBonusAvailable: dailyBonusTimeLeft <= 0,
      dailyBonusTimeLeft,
      recordMake,
      recordArcadeRunEnd,
      recordCampaignLevelEnd,
      refresh,
    }),
    [
      data,
      isReady,
      addCoins,
      addXP,
      spendCoins,
      buyItem,
      equipItem,
      claimDailyBonus,
      dailyBonusTimeLeft,
      recordMake,
      recordArcadeRunEnd,
      recordCampaignLevelEnd,
      refresh,
    ]
  );

  return <PlayerDataContext.Provider value={value}>{children}</PlayerDataContext.Provider>;
}

export function usePlayerData() {
  const ctx = useContext(PlayerDataContext);
  if (!ctx) throw new Error('usePlayerData must be used within PlayerDataProvider');
  return ctx;
}
