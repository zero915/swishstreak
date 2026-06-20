import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  MAX_FLIGHT_TIME,
  MIN_MISS_SETTLE_MS,
  SCORE_EXIT_MS,
} from '../constants/gameConfig';
import { getShopItem } from '../constants/shopCatalog';
import {
  BallPhysicsState,
  createBallState,
  isBallOffScreen,
  stepBallPhysics,
} from '../utils/ballPhysics';
import { getHoopGeometry } from '../utils/hoopGeometry';
import { getPhysicsRimCenterY } from '../utils/hoopSpriteLayout';
import {
  computePovShotVelocity,
  getBallDepthT,
  getBallPerspectiveScale,
} from '../utils/trajectory';

type BallPhase = 'idle' | 'flying' | 'scoreExit';

interface BallProps {
  launchX: number;
  launchY: number;
  hoopX: number;
  hoopY: number;
  rimWidth: number;
  ballRadius: number;
  touchTargetSize: number;
  wind: number;
  ballId: string;
  disabled: boolean;
  screenWidth: number;
  screenHeight: number;
  onMiss: () => void;
  onShotStart: () => void;
  onCelebrate: (x: number, y: number, meta: { clean: boolean }) => void;
  onRimHit?: () => void;
}

function BallGraphic({
  size,
  radius,
  color,
  imageSource,
}: {
  size: number;
  radius: number;
  color: string;
  imageSource?: ImageSourcePropType;
}) {
  if (imageSource) {
    return (
      <Image
        source={imageSource}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }

  return (
    <LinearGradient
      colors={['#FFB74D', color, '#E65100']}
      style={[styles.ball, { width: size, height: size, borderRadius: radius }]}
    >
      <View style={styles.ballHighlight} />
      <View style={[styles.ballLine, styles.ballLineH]} />
      <View style={[styles.ballLine, styles.ballLineV]} />
    </LinearGradient>
  );
}

export function Ball({
  launchX,
  launchY,
  hoopX,
  hoopY,
  rimWidth,
  ballRadius,
  touchTargetSize,
  wind,
  ballId,
  disabled,
  screenWidth,
  screenHeight,
  onMiss,
  onShotStart,
  onCelebrate,
  onRimHit,
}: BallProps) {
  const physicsHoopY = getPhysicsRimCenterY(hoopY);
  const ball = getShopItem(ballId);
  const ballColor = ball?.color ?? '#FF6B35';
  const ballImage = ball?.imageSource;
  const ballX = useSharedValue(launchX);
  const ballY = useSharedValue(launchY);
  const ballRotation = useSharedValue(0);
  const ballScale = useSharedValue(getBallPerspectiveScale(1));
  const ballSquash = useSharedValue(1);
  const trailOpacity = useSharedValue(0);
  const behindNet = useSharedValue(0);

  const propsRef = useRef({
    launchX,
    launchY,
    hoopX,
    hoopY,
    rimWidth,
    ballRadius,
    wind,
    screenWidth,
    screenHeight,
  });
  propsRef.current = {
    launchX,
    launchY,
    hoopX,
    hoopY,
    rimWidth,
    ballRadius,
    wind,
    screenWidth,
    screenHeight,
  };

  const phaseRef = useRef<BallPhase>('idle');
  const rafRef = useRef<number | null>(null);
  const physicsRef = useRef<BallPhysicsState | null>(null);
  const flightTimeRef = useRef(0);
  const scoreTimeRef = useRef<number | null>(null);
  const missOffScreenAtRef = useRef<number | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rimHitCooldownRef = useRef(0);
  const rimHitsThisShotRef = useRef(0);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const triggerSquash = useCallback(() => {
    ballSquash.value = withSequence(
      withTiming(0.82, { duration: 60 }),
      withTiming(1.08, { duration: 80 }),
      withTiming(1, { duration: 100 })
    );
  }, [ballSquash]);

  const updatePerspective = useCallback(
    (y: number) => {
      const depthT = getBallDepthT(y, launchY, physicsHoopY);
      ballScale.value = getBallPerspectiveScale(depthT);
    },
    [ballScale, launchY, physicsHoopY]
  );

  const resetBallVisual = useCallback(() => {
    ballX.value = launchX;
    ballY.value = launchY;
    ballRotation.value = 0;
    ballScale.value = getBallPerspectiveScale(1);
    ballSquash.value = 1;
    trailOpacity.value = 0;
    behindNet.value = 0;
  }, [ballX, ballY, ballRotation, ballScale, ballSquash, trailOpacity, behindNet, launchX, launchY]);

  const runScoreExit = useCallback(
    (hx: number, netBottom: number, fromX: number, fromY: number) => {
      phaseRef.current = 'scoreExit';
      stopRaf();
      physicsRef.current = null;
      scoreTimeRef.current = null;
      behindNet.value = 1;

      ballX.value = fromX;
      ballY.value = fromY;

      trailOpacity.value = withSequence(
        withTiming(1, { duration: 60 }),
        withDelay(320, withTiming(0, { duration: 220 }))
      );

      ballY.value = withSequence(
        withTiming(netBottom - 6, { duration: 200, easing: Easing.in(Easing.quad) }),
        withDelay(100, withTiming(launchY, { duration: 360, easing: Easing.inOut(Easing.quad) }))
      );
      ballX.value = withSequence(
        withTiming(hx, { duration: 200 }),
        withDelay(100, withTiming(launchX, { duration: 360 }))
      );
      ballScale.value = withTiming(getBallPerspectiveScale(1), { duration: 380 });
      ballRotation.value = withTiming(ballRotation.value + Math.PI * 0.5, { duration: SCORE_EXIT_MS });

      clearExitTimer();
      exitTimerRef.current = setTimeout(() => {
        if (phaseRef.current === 'scoreExit') {
          phaseRef.current = 'idle';
          behindNet.value = 0;
          resetBallVisual();
        }
      }, SCORE_EXIT_MS);
    },
    [
      ballX,
      ballY,
      ballScale,
      ballRotation,
      trailOpacity,
      behindNet,
      launchX,
      launchY,
      clearExitTimer,
      stopRaf,
      resetBallVisual,
    ]
  );

  useEffect(() => {
    if (phaseRef.current === 'idle') {
      resetBallVisual();
    }
  }, [launchX, launchY, resetBallVisual]);

  useEffect(
    () => () => {
      stopRaf();
      clearExitTimer();
    },
    [stopRaf, clearExitTimer]
  );

  const finishMiss = useCallback(() => {
    phaseRef.current = 'idle';
    physicsRef.current = null;
    missOffScreenAtRef.current = null;
    stopRaf();
    onMiss();
    setTimeout(resetBallVisual, 80);
  }, [onMiss, resetBallVisual, stopRaf]);

  const beginScoreExit = useCallback(
    (hx: number, netBottom: number, fromX: number, fromY: number) => {
      runScoreExit(hx, netBottom, fromX, fromY);
    },
    [runScoreExit]
  );

  const startShot = useCallback(
    (dx: number, dy: number, velocityX: number, velocityY: number) => {
      if (disabled) return;
      if (phaseRef.current === 'flying') return;

      if (phaseRef.current === 'scoreExit') {
        clearExitTimer();
        trailOpacity.value = 0;
        behindNet.value = 0;
      }

      behindNet.value = 0;

      const { launchX: x0, launchY: y0, hoopX: hx, hoopY: hy } = propsRef.current;
      const physicsHoopY = getPhysicsRimCenterY(hy);
      const velocity = computePovShotVelocity({
        launchX: x0,
        launchY: y0,
        hoopX: hx,
        hoopY: physicsHoopY,
        dx,
        dy,
        velocityX,
        velocityY,
      });
      if (velocity.vy >= 0) return;

      onShotStart();
      phaseRef.current = 'flying';
      flightTimeRef.current = 0;
      scoreTimeRef.current = null;
      missOffScreenAtRef.current = null;
      rimHitCooldownRef.current = 0;
      rimHitsThisShotRef.current = 0;

      ballX.value = x0;
      ballY.value = y0;
      ballRotation.value = 0;
      ballScale.value = getBallPerspectiveScale(1);
      trailOpacity.value = 0;

      physicsRef.current = createBallState(x0, y0, velocity.vx, velocity.vy);

      let lastTime = performance.now();

      const tick = (now: number) => {
        if (phaseRef.current !== 'flying' || !physicsRef.current) return;

        const frameDt = Math.min((now - lastTime) / 1000, 0.032);
        lastTime = now;
        flightTimeRef.current += frameDt;

        const physicsHoopY = getPhysicsRimCenterY(propsRef.current.hoopY);
        const geo = getHoopGeometry(
          propsRef.current.hoopX,
          physicsHoopY,
          propsRef.current.rimWidth
        );

        const { state, events } = stepBallPhysics(
          physicsRef.current,
          frameDt,
          geo,
          propsRef.current.ballRadius,
          propsRef.current.launchY,
          physicsHoopY,
          propsRef.current.wind
        );
        physicsRef.current = state;

        ballX.value = state.x;
        ballY.value = state.y;
        ballRotation.value = state.rotation;
        updatePerspective(state.y);

        if (state.scored && state.y > geo.rimTop - propsRef.current.ballRadius * 0.15) {
          behindNet.value = 1;
        } else if (!state.scored) {
          behindNet.value = 0;
        }

        for (const event of events) {
          if (event.type === 'score') {
            onCelebrate(geo.rimCenterX, geo.backboardTop + 28, {
              clean: rimHitsThisShotRef.current === 0,
            });
            scoreTimeRef.current = now;
          } else if (event.type === 'rim_bounce') {
            rimHitsThisShotRef.current += 1;
            if (now - rimHitCooldownRef.current > 120) {
              rimHitCooldownRef.current = now;
              triggerSquash();
              onRimHit?.();
            }
          }
        }

        if (state.scored && scoreTimeRef.current !== null) {
          const passedRim = state.y > geo.rimTop + propsRef.current.ballRadius * 0.12;
          const elapsed = now - scoreTimeRef.current;
          if (passedRim || elapsed >= 420) {
            beginScoreExit(geo.rimCenterX, geo.netBottom, state.x, state.y);
            return;
          }
        } else if (
          isBallOffScreen(
            state,
            propsRef.current.ballRadius,
            propsRef.current.screenWidth,
            propsRef.current.screenHeight
          )
        ) {
          if (missOffScreenAtRef.current === null) {
            missOffScreenAtRef.current = now;
          } else if (now - missOffScreenAtRef.current >= MIN_MISS_SETTLE_MS) {
            finishMiss();
            return;
          }
        } else {
          missOffScreenAtRef.current = null;
        }

        if (flightTimeRef.current > MAX_FLIGHT_TIME) {
          finishMiss();
          return;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [
      disabled,
      onShotStart,
      ballX,
      ballY,
      ballRotation,
      ballScale,
      trailOpacity,
      updatePerspective,
      beginScoreExit,
      finishMiss,
      onCelebrate,
      onRimHit,
      triggerSquash,
      clearExitTimer,
    ]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .minDistance(0)
        .activeOffsetY(-3)
        .failOffsetX([-140, 140])
        .onEnd((event) => {
          runOnJS(startShot)(
            event.translationX,
            event.translationY,
            event.velocityX,
            event.velocityY
          );
        }),
    [disabled, startShot]
  );

  const size = ballRadius * 2;

  const ballLayerStyle = useAnimatedStyle(() => ({
    zIndex: behindNet.value > 0.5 ? 8 : 13,
    elevation: behindNet.value > 0.5 ? 8 : 13,
  }), []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ballX.value - touchTargetSize / 2 },
      { translateY: ballY.value - touchTargetSize / 2 },
      { scaleX: ballScale.value * ballSquash.value },
      { scaleY: ballScale.value * (2 - ballSquash.value) },
      { rotate: `${ballRotation.value}rad` },
    ],
  }), [touchTargetSize]);

  const ghost1Style = useAnimatedStyle(() => ({
    opacity: trailOpacity.value * 0.42,
    transform: [
      { translateX: ballX.value - touchTargetSize / 2 },
      { translateY: ballY.value - touchTargetSize / 2 + 16 },
      { scaleX: ballScale.value * 0.94 },
      { scaleY: ballScale.value * 0.94 },
      { rotate: `${ballRotation.value}rad` },
    ],
  }), [touchTargetSize]);

  const ghost2Style = useAnimatedStyle(() => ({
    opacity: trailOpacity.value * 0.28,
    transform: [
      { translateX: ballX.value - touchTargetSize / 2 },
      { translateY: ballY.value - touchTargetSize / 2 + 28 },
      { scaleX: ballScale.value * 0.9 },
      { scaleY: ballScale.value * 0.9 },
      { rotate: `${ballRotation.value}rad` },
    ],
  }), [touchTargetSize]);

  const ghost3Style = useAnimatedStyle(() => ({
    opacity: trailOpacity.value * 0.16,
    transform: [
      { translateX: ballX.value - touchTargetSize / 2 },
      { translateY: ballY.value - touchTargetSize / 2 + 40 },
      { scaleX: ballScale.value * 0.86 },
      { scaleY: ballScale.value * 0.86 },
      { rotate: `${ballRotation.value}rad` },
    ],
  }), [touchTargetSize]);

  const courtShadowStyle = useAnimatedStyle(() => {
    'worklet';
    const rimY = physicsHoopY;
    const span = launchY - rimY;
    const depthT = span <= 0 ? 1 : Math.max(0, Math.min(1, (ballY.value - rimY) / span));
    const shadowScale = 0.22 + depthT * 0.78;
    const shadowSize = ballRadius * 2 * shadowScale;
    return {
      opacity: 0.1 + depthT * 0.42,
      width: shadowSize,
      height: shadowSize * 0.28,
      transform: [
        { translateX: ballX.value - shadowSize / 2 },
        { translateY: launchY + 10 },
      ],
    };
  }, [ballRadius, launchY, physicsHoopY]);

  return (
    <Animated.View style={[styles.ballLayer, ballLayerStyle]} pointerEvents="box-none">
      <Animated.View style={[styles.courtShadow, courtShadowStyle]} pointerEvents="none" />
      <Animated.View style={[styles.trailLayer, ghost3Style]} pointerEvents="none">
        <BallGraphic size={size} radius={ballRadius} color={ballColor} imageSource={ballImage} />
      </Animated.View>
      <Animated.View style={[styles.trailLayer, ghost2Style]} pointerEvents="none">
        <BallGraphic size={size} radius={ballRadius} color={ballColor} imageSource={ballImage} />
      </Animated.View>
      <Animated.View style={[styles.trailLayer, ghost1Style]} pointerEvents="none">
        <BallGraphic size={size} radius={ballRadius} color={ballColor} imageSource={ballImage} />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.touchArea, animatedStyle, { width: touchTargetSize, height: touchTargetSize }]}>
          <BallGraphic size={size} radius={ballRadius} color={ballColor} imageSource={ballImage} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ballLayer: {
    ...StyleSheet.absoluteFill,
  },
  courtShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    zIndex: 5,
  },
  trailLayer: {
    position: 'absolute',
    zIndex: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchArea: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 7,
  },
  ball: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  ballHighlight: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: '35%',
    height: '30%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  ballLine: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  ballLineH: {
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    marginTop: -1,
  },
  ballLineV: {
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
  },
});
