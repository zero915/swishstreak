import { useCallback, useReducer } from 'react';
import {
  BASE_COIN_VALUE,
  LEVEL_UP_SHOT_INTERVAL,
  MAX_MISSES,
  MAX_MULTIPLIER,
} from '../constants/gameConfig';
import { getCampaignLevel } from '../constants/campaignLevels';
import { GameMode, GameSessionState } from '../types';
import { calculateArcadeScore } from '../utils/trajectory';
import { calculateStars } from '../utils/xp';

type Action =
  | { type: 'MAKE'; coinsMultiplier: number }
  | { type: 'MISS' }
  | { type: 'RESET'; mode: GameMode; campaignLevelId?: number };

function createInitialState(mode: GameMode, campaignLevelId?: number): GameSessionState {
  return {
    mode,
    streak: 0,
    misses: 0,
    level: 1,
    shotsMade: 0,
    makesThisLevel: 0,
    coinsEarnedThisRun: 0,
    bestStreakThisRun: 0,
    maxStreakThisRun: 0,
    totalMissesThisRun: 0,
    isRunOver: false,
    isLevelComplete: false,
    isLevelFailed: false,
    campaignLevelId,
  };
}

function reducer(state: GameSessionState, action: Action): GameSessionState {
  switch (action.type) {
    case 'RESET':
      return createInitialState(action.mode, action.campaignLevelId);

    case 'MAKE': {
      const streak = state.streak + 1;
      const multiplier = Math.min(streak, MAX_MULTIPLIER);
      const coins = BASE_COIN_VALUE * multiplier;
      const shotsMade = state.shotsMade + 1;
      const makesThisLevel = state.makesThisLevel + 1;
      let level = state.level;
      if (state.mode === 'arcade' && makesThisLevel % LEVEL_UP_SHOT_INTERVAL === 0) {
        level += 1;
      }

      const next: GameSessionState = {
        ...state,
        streak,
        shotsMade,
        makesThisLevel,
        level,
        coinsEarnedThisRun: state.coinsEarnedThisRun + coins,
        bestStreakThisRun: Math.max(state.bestStreakThisRun, streak),
        maxStreakThisRun: Math.max(state.maxStreakThisRun, streak),
      };

      if (state.mode === 'campaign' && state.campaignLevelId) {
        const def = getCampaignLevel(state.campaignLevelId);
        if (def && makesThisLevel >= def.targetMakes) {
          next.isLevelComplete = true;
        }
      }

      return next;
    }

    case 'MISS': {
      const misses = state.misses + 1;
      const totalMissesThisRun = state.totalMissesThisRun + 1;
      const next: GameSessionState = {
        ...state,
        streak: 0,
        misses,
        totalMissesThisRun,
      };

      if (state.mode === 'arcade' && misses >= MAX_MISSES) {
        next.isRunOver = true;
      }

      if (state.mode === 'campaign' && state.campaignLevelId) {
        const def = getCampaignLevel(state.campaignLevelId);
        if (def && misses >= def.maxMisses) {
          next.isLevelFailed = true;
        }
      }

      return next;
    }

    default:
      return state;
  }
}

export function useGameSession(mode: GameMode, campaignLevelId?: number) {
  const [state, dispatch] = useReducer(
    reducer,
    { mode, campaignLevelId },
    ({ mode, campaignLevelId: id }) => createInitialState(mode, id)
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', mode, campaignLevelId });
  }, [mode, campaignLevelId]);

  const recordMake = useCallback(() => {
    dispatch({ type: 'MAKE', coinsMultiplier: Math.min(state.streak + 1, MAX_MULTIPLIER) });
  }, [state.streak]);

  const recordMiss = useCallback(() => {
    dispatch({ type: 'MISS' });
  }, []);

  const getMultiplier = useCallback(() => Math.min(Math.max(state.streak, 1), MAX_MULTIPLIER), [state.streak]);

  const getRunSummary = useCallback(
    () => ({
      shotsMade: state.shotsMade,
      bestStreak: state.bestStreakThisRun,
      coinsEarned: state.coinsEarnedThisRun,
      score: calculateArcadeScore(state.shotsMade, state.bestStreakThisRun, state.coinsEarnedThisRun),
    }),
    [state.shotsMade, state.bestStreakThisRun, state.coinsEarnedThisRun]
  );

  const getLevelResult = useCallback(() => {
    const passed = state.isLevelComplete;
    const stars = calculateStars(passed, state.maxStreakThisRun, state.totalMissesThisRun);
    return {
      levelId: state.campaignLevelId ?? 0,
      stars,
      coinsEarned: passed ? state.coinsEarnedThisRun : 0,
      xpEarned: 0,
      passed,
    };
  }, [state]);

  return {
    state,
    reset,
    recordMake,
    recordMiss,
    getMultiplier,
    getRunSummary,
    getLevelResult,
  };
}
