import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ball } from '../components/Ball';
import { ComboBadge } from '../components/ComboBadge';
import { CourtBackground } from '../components/CourtBackground';
import { GameHUD } from '../components/GameHUD';
import { Hoop } from '../components/Hoop';
import { LaunchPad } from '../components/LaunchPad';
import { LevelResultModal } from '../components/LevelResultModal';
import { MakeCelebration } from '../components/MakeCelebration';
import type { CelebrationMeta } from '../components/MakeCelebration';
import { RunSummaryModal } from '../components/RunSummaryModal';
import { getCampaignLevel } from '../constants/campaignLevels';
import {
  MAX_MULTIPLIER,
  PERFECT_WINDOW_DURATION_MS,
  PERFECT_WINDOW_INTERVAL_MAX_MS,
  PERFECT_WINDOW_INTERVAL_MIN_MS,
} from '../constants/gameConfig';
import { usePlayerData } from '../context/PlayerDataContext';
import { useAuth } from '../context/AuthContext';
import { shareArcadeScore } from '../services/friendsService';
import { submitVersusRound } from '../services/versusService';
import { useGameSession } from '../hooks/useGameSession';
import { RootStackParamList } from '../types';
import { getArcadeDifficulty, getCampaignDifficulty, getHoopDriftX, getHoopY } from '../utils/difficulty';
import { getGameSizing } from '../utils/gameSizing';
import { getHoopGeometry } from '../utils/hoopGeometry';
import { getHoopOffsetX } from '../utils/hoopMovement';
import { getPhysicsRimCenterY } from '../utils/hoopSpriteLayout';
import { HoopStateRef } from '../utils/hoopSnapshot';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export function GameScreen({ route, navigation }: Props) {
  const { mode, campaignLevelId, versusMatchId } = route.params;
  const { isGuest, profile, refreshProfile } = useAuth();
  const { width, height } = useWindowDimensions();
  const { data, recordMake, recordArcadeRunEnd, recordCampaignLevelEnd, addCoins } = usePlayerData();
  const { state, reset, recordMake: sessionMake, recordMiss, getMultiplier, getRunSummary, getLevelResult } =
    useGameSession(mode, campaignLevelId);

  const [layout, setLayout] = useState({ width, height });
  const [showSummary, setShowSummary] = useState(false);
  const [showLevelResult, setShowLevelResult] = useState(false);
  const [hoopTick, setHoopTick] = useState(0);
  const [perfectWindowActive, setPerfectWindowActive] = useState(false);
  const [celebration, setCelebration] = useState<{
    x: number;
    y: number;
    meta: CelebrationMeta;
  } | null>(null);
  const [hoopCelebrating, setHoopCelebrating] = useState(false);
  const [rimPulse, setRimPulse] = useState(false);
  const pendingMakeRef = useRef<{ points: number; streakAfterMake: number } | null>(null);
  const startTimeRef = useRef(Date.now());
  const levelResultRef = useRef(getLevelResult());
  const hoopStateRef = useRef<HoopStateRef>({ x: width / 2, vx: 0 });

  const campaignDef = campaignLevelId ? getCampaignLevel(campaignLevelId) : undefined;

  const difficulty = useMemo(() => {
    if (mode === 'campaign' && campaignDef) {
      return getCampaignDifficulty(campaignDef);
    }
    return getArcadeDifficulty(state.level);
  }, [mode, campaignDef, state.level]);

  const launchX = layout.width / 2;
  const launchY = layout.height - Math.max(130, layout.height * 0.14);
  const hoopY = getHoopY(layout.height, difficulty.distance);
  const sizing = useMemo(
    () => getGameSizing(layout.width, difficulty.rimScale),
    [layout.width, difficulty.rimScale]
  );
  const { rimWidth, ballRadius, touchTargetSize } = sizing;

  const elapsedMs = Date.now() - startTimeRef.current;
  const hoopOffsetX =
    mode === 'arcade'
      ? getHoopOffsetX(state.shotsMade, elapsedMs)
      : difficulty.drift
        ? getHoopDriftX(elapsedMs)
        : 0;
  const hoopX = layout.width / 2 + hoopOffsetX;
  void hoopTick;

  const getHoopXRef = useRef(() => hoopX);
  getHoopXRef.current = () => {
    const elapsed = Date.now() - startTimeRef.current;
    const offset =
      mode === 'arcade'
        ? getHoopOffsetX(state.shotsMade, elapsed)
        : difficulty.drift
          ? getHoopDriftX(elapsed)
          : 0;
    return layout.width / 2 + offset;
  };

  hoopStateRef.current = { x: hoopX, vx: hoopStateRef.current.vx };

  const hoopLayout = useMemo(
    () => getHoopGeometry(hoopX, getPhysicsRimCenterY(hoopY), rimWidth),
    [hoopX, hoopY, rimWidth]
  );

  const celebrationAnchor = useMemo(
    () => ({
      x: hoopLayout.rimCenterX,
      y: hoopLayout.backboardTop + (hoopLayout.backboardBottom - hoopLayout.backboardTop) * 0.38,
    }),
    [hoopLayout]
  );

  const comboBadgeAnchor = useMemo(
    () => ({
      x: hoopLayout.rimCenterX + rimWidth * 0.58,
      y: hoopLayout.rimCenterY - rimWidth * 0.22,
    }),
    [hoopLayout, rimWidth]
  );

  useEffect(() => {
    if (mode !== 'arcade' && !(mode === 'campaign' && difficulty.drift)) return;
    const interval = setInterval(() => {
      setHoopTick((t) => t + 1);
    }, 16);
    return () => clearInterval(interval);
  }, [mode, difficulty.drift, state.shotsMade]);

  useEffect(() => {
    if (!difficulty.perfectWindow) return;
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleWindow = () => {
      const delay =
        PERFECT_WINDOW_INTERVAL_MIN_MS +
        Math.random() * (PERFECT_WINDOW_INTERVAL_MAX_MS - PERFECT_WINDOW_INTERVAL_MIN_MS);
      timeout = setTimeout(() => {
        setPerfectWindowActive(true);
        setTimeout(() => {
          setPerfectWindowActive(false);
          scheduleWindow();
        }, PERFECT_WINDOW_DURATION_MS);
      }, delay);
    };
    scheduleWindow();
    return () => clearTimeout(timeout);
  }, [difficulty.perfectWindow]);

  useEffect(() => {
    if (state.isRunOver) {
      setShowSummary(true);
    }
  }, [state.isRunOver]);

  useEffect(() => {
    if (state.isLevelComplete || state.isLevelFailed) {
      levelResultRef.current = getLevelResult();
      setShowLevelResult(true);
    }
  }, [state.isLevelComplete, state.isLevelFailed, getLevelResult]);

  const applyMake = useCallback(() => {
    const pending = pendingMakeRef.current;
    if (!pending) return;
    pendingMakeRef.current = null;
    sessionMake();
    recordMake(mode);
    addCoins(pending.points);
  }, [sessionMake, recordMake, mode, addCoins]);

  const handleCelebrate = useCallback(
    (x: number, y: number, meta: { clean: boolean }) => {
      const streakAfterMake = state.streak + 1;
      const points = 10 * Math.min(streakAfterMake, MAX_MULTIPLIER);
      pendingMakeRef.current = { points, streakAfterMake };
      setCelebration({
        x: celebrationAnchor.x,
        y: celebrationAnchor.y,
        meta: { points, clean: meta.clean, streakAfterMake },
      });
      setHoopCelebrating(true);
    },
    [state.streak, celebrationAnchor]
  );

  const handleCelebrationPopIn = useCallback(() => {
    try {
      const streakAfterMake = pendingMakeRef.current?.streakAfterMake ?? state.streak + 1;
      if (streakAfterMake >= 5 && streakAfterMake % 5 === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      // Haptics unavailable on some devices
    }
    applyMake();
  }, [applyMake, state.streak]);

  const handleCelebrationDone = useCallback(() => {
    setCelebration(null);
    setHoopCelebrating(false);
  }, []);

  const handleRimHit = useCallback(() => {
    setRimPulse(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics unavailable on some devices
    }
    setTimeout(() => setRimPulse(false), 240);
  }, []);

  const handleMiss = useCallback(() => {
    recordMiss();
  }, [recordMiss]);

  const handleShotStart = useCallback(() => {
    // Non-blocking — next shot allowed while celebration / return anim plays
  }, []);

  const handlePlayAgain = useCallback(() => {
    setShowSummary(false);
    reset();
  }, [reset]);

  const handleRunHome = useCallback(async () => {
    const summary = getRunSummary();
    if (versusMatchId) {
      try {
        await submitVersusRound(versusMatchId, summary.score);
        await refreshProfile();
      } catch {
        // Match may have ended
      }
    } else {
      await recordArcadeRunEnd(summary);
    }
    navigation.goBack();
  }, [getRunSummary, recordArcadeRunEnd, navigation, versusMatchId, refreshProfile]);

  const handleSummaryClose = useCallback(async () => {
    const summary = getRunSummary();
    if (versusMatchId) {
      try {
        await submitVersusRound(versusMatchId, summary.score);
        await refreshProfile();
      } catch {
        // ignore
      }
    } else {
      await recordArcadeRunEnd(summary);
    }
    setShowSummary(false);
  }, [getRunSummary, recordArcadeRunEnd, versusMatchId, refreshProfile]);

  const handleShareScore = useCallback(async () => {
    const summary = getRunSummary();
    if (!profile) return;
    await shareArcadeScore(profile.displayName, summary.score, summary.bestStreak, profile.inviteCode);
  }, [getRunSummary, profile]);

  const handleLevelContinue = useCallback(async () => {
    const result = levelResultRef.current;
    if (result.passed) {
      await recordCampaignLevelEnd(result);
    }
    setShowLevelResult(false);
    navigation.goBack();
  }, [recordCampaignLevelEnd, navigation]);

  const handleLevelRetry = useCallback(() => {
    setShowLevelResult(false);
    reset();
  }, [reset]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setLayout({ width: w, height: h });
  };

  const runBlocked = state.isRunOver || state.isLevelComplete || state.isLevelFailed;

  return (
    <View style={styles.container} onLayout={onLayout}>
      <CourtBackground
        backgroundId={data.shopState.equipped.background}
        courtWidth={layout.width}
        courtHeight={layout.height}
      />
      <GameHUD
        coins={data.totalCoins}
        streak={state.streak}
        misses={state.misses}
        maxMisses={campaignDef?.maxMisses ?? 3}
        level={state.level}
        mode={mode}
        objective={campaignDef ? `Level ${campaignDef.id}` : undefined}
        makesProgress={
          campaignDef
            ? { current: state.makesThisLevel, target: campaignDef.targetMakes }
            : undefined
        }
        onBack={() => navigation.goBack()}
      />

      <Hoop
        x={hoopX}
        y={hoopY}
        rimWidth={rimWidth}
        backboardId={data.shopState.equipped.backboard}
        showPerfectWindow={perfectWindowActive}
        celebrating={hoopCelebrating}
        rimPulse={rimPulse}
      >
        <Ball
          launchX={launchX}
          launchY={launchY}
          hoopX={hoopX}
          hoopY={hoopY}
          getHoopX={() => getHoopXRef.current()}
          hoopStateRef={hoopStateRef}
          rimWidth={rimWidth}
          ballRadius={ballRadius}
          touchTargetSize={touchTargetSize}
          wind={difficulty.wind}
          rimDifficulty={difficulty.rimDifficulty}
          assistFactor={difficulty.assistFactor}
          ballId={data.shopState.equipped.ball}
          disabled={runBlocked}
          screenWidth={layout.width}
          screenHeight={layout.height}
          onMiss={handleMiss}
          onShotStart={handleShotStart}
          onCelebrate={handleCelebrate}
          onRimHit={handleRimHit}
        />
      </Hoop>

      <ComboBadge
        x={comboBadgeAnchor.x}
        y={comboBadgeAnchor.y}
        multiplier={getMultiplier()}
        streak={state.streak}
      />

      <MakeCelebration
        x={celebration?.x ?? celebrationAnchor.x}
        y={celebration?.y ?? celebrationAnchor.y}
        visible={celebration !== null}
        meta={celebration?.meta}
        onPopIn={handleCelebrationPopIn}
        onDone={handleCelebrationDone}
      />

      <LaunchPad x={launchX} y={launchY} size={touchTargetSize + 16} />

      <View style={styles.hintBox}>
        <Text style={styles.hint}>Flick up to shoot — swipe left/right to aim</Text>
      </View>

      <RunSummaryModal
        visible={showSummary}
        summary={getRunSummary()}
        onShare={!isGuest && profile && !versusMatchId ? handleShareScore : undefined}
        onPlayAgain={() => {
          handleSummaryClose();
          handlePlayAgain();
        }}
        onHome={handleRunHome}
      />

      <LevelResultModal
        visible={showLevelResult}
        result={levelResultRef.current}
        onContinue={handleLevelContinue}
        onRetry={handleLevelRetry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hintBox: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  hint: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
