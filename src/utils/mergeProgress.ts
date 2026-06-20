import { DEFAULT_SHOP_STATE } from '../constants/gameConfig';
import { getTotalStars } from '../constants/campaignLevels';
import { CampaignProgress, PlayerData, ShopState } from '../types';
import { xpToLevel } from './xp';

function mergeShopState(local: ShopState, remote: ShopState): ShopState {
  const owned = Array.from(new Set([...local.owned, ...remote.owned]));
  return {
    owned,
    equipped: {
      ball: owned.includes(remote.equipped.ball) ? remote.equipped.ball : local.equipped.ball,
      backboard: owned.includes(remote.equipped.backboard)
        ? remote.equipped.backboard
        : local.equipped.backboard,
      background: owned.includes(remote.equipped.background)
        ? remote.equipped.background
        : local.equipped.background,
    },
  };
}

function mergeCampaignProgress(
  local: CampaignProgress,
  remote: CampaignProgress
): CampaignProgress {
  const merged: CampaignProgress = { ...remote };
  for (const [levelId, localProgress] of Object.entries(local)) {
    const id = Number(levelId);
    const remoteProgress = remote[id];
    if (!remoteProgress || localProgress.stars > remoteProgress.stars) {
      merged[id] = localProgress;
    }
  }
  return merged;
}

export function mergePlayerData(local: PlayerData, remote: PlayerData): PlayerData {
  const totalCoins = Math.max(local.totalCoins, remote.totalCoins);
  const totalXP = Math.max(local.totalXP, remote.totalXP);
  const campaignProgress = mergeCampaignProgress(local.campaignProgress, remote.campaignProgress);
  const arcadeBest =
    local.arcadeBest.score >= remote.arcadeBest.score ? local.arcadeBest : remote.arcadeBest;

  return {
    totalCoins,
    totalXP,
    playerLevel: xpToLevel(totalXP),
    shopState: mergeShopState(local.shopState ?? DEFAULT_SHOP_STATE, remote.shopState ?? DEFAULT_SHOP_STATE),
    campaignProgress,
    arcadeBest,
    dailyBonusLastClaim: local.dailyBonusLastClaim ?? remote.dailyBonusLastClaim,
  };
}

export function getCampaignStats(progress: CampaignProgress) {
  return {
    totalStars: getTotalStars(progress),
    furthestLevel: Object.entries(progress)
      .filter(([, p]) => p.stars > 0)
      .map(([id]) => Number(id))
      .reduce((max, id) => Math.max(max, id), 0),
  };
}
