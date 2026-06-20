import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { pickCelebrationMessage } from '../utils/celebrationMessages';

export interface CelebrationMeta {
  points: number;
  clean: boolean;
  streakAfterMake: number;
}

interface MakeCelebrationProps {
  x: number;
  y: number;
  visible: boolean;
  meta?: CelebrationMeta;
  onPopIn?: () => void;
  onDone?: () => void;
}

function StarBurst({ index, active }: { index: number; active: boolean }) {
  const progress = useSharedValue(0);
  const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
  const distance = 32 + (index % 3) * 14;

  useEffect(() => {
    if (active) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
    }
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.95,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value - 20 * progress.value },
      { scale: 0.5 + (1 - progress.value) * 0.7 },
      { rotate: `${progress.value * 70}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.star, style]}>
      <Text style={styles.starGlyph}>✦</Text>
    </Animated.View>
  );
}

function FloatingPoints({ points, active }: { points: number; active: boolean }) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    if (!active) return;
    y.value = 0;
    opacity.value = 0;
    scale.value = 0.3;
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(420, withTiming(0, { duration: 220 }))
    );
    scale.value = withSequence(
      withSpring(1.1, { damping: 7, stiffness: 260 }),
      withTiming(1, { duration: 80 })
    );
    y.value = withTiming(-56, { duration: 720, easing: Easing.out(Easing.cubic) });
  }, [active, points, y, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }, { scale: scale.value }],
  }));

  if (!active) return null;

  return (
    <Animated.Text style={[styles.pointsText, style]}>+{points}</Animated.Text>
  );
}

export function MakeCelebration({ x, y, visible, meta, onPopIn, onDone }: MakeCelebrationProps) {
  const calloutScale = useSharedValue(0.3);
  const calloutOpacity = useSharedValue(0);
  const calloutRotate = useSharedValue(-6);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);

  const message = useMemo(
    () =>
      meta
        ? pickCelebrationMessage(meta.streakAfterMake, meta.clean)
        : 'Swish!',
    [meta?.streakAfterMake, meta?.clean, visible]
  );
  const points = meta?.points ?? 10;

  useEffect(() => {
    if (!visible) return;

    calloutScale.value = 0.3;
    calloutOpacity.value = 0;
    calloutRotate.value = -7;
    ringScale.value = 0.5;
    ringOpacity.value = 0;

    calloutScale.value = withSequence(
      withSpring(1.14, { damping: 8, stiffness: 320, mass: 0.7 }),
      withTiming(1, { duration: 120 }),
      withDelay(400, withTiming(0.88, { duration: 220, easing: Easing.in(Easing.quad) }))
    );
    calloutOpacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withDelay(520, withTiming(0, { duration: 220 }))
    );
    calloutRotate.value = withSequence(
      withTiming(5, { duration: 140 }),
      withTiming(-3, { duration: 110 }),
      withTiming(0, { duration: 150 })
    );

    ringScale.value = withTiming(2.2, { duration: 480, easing: Easing.out(Easing.cubic) });
    ringOpacity.value = withSequence(
      withTiming(0.85, { duration: 90 }),
      withDelay(280, withTiming(0, { duration: 260 }))
    );

    const popTimer = setTimeout(() => onPopIn?.(), 60);
    const doneTimer = setTimeout(() => onDone?.(), 780);
    return () => {
      clearTimeout(popTimer);
      clearTimeout(doneTimer);
    };
  }, [visible, x, y, calloutScale, calloutOpacity, calloutRotate, ringScale, ringOpacity, onPopIn, onDone]);

  const calloutStyle = useAnimatedStyle(() => ({
    opacity: calloutOpacity.value,
    transform: [
      { scale: calloutScale.value },
      { rotate: `${calloutRotate.value}deg` },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={[styles.container, { left: x - 100, top: y - 70 }]} pointerEvents="none">
      <Animated.View style={[styles.ringBurst, ringStyle]} />
      {Array.from({ length: 8 }).map((_, i) => (
        <StarBurst key={i} index={i} active={visible} />
      ))}
      <FloatingPoints points={points} active={visible} />
      <Animated.View style={[styles.calloutWrap, calloutStyle]}>
        <LinearGradient
          colors={['#5CE1FF', '#7B61FF', '#B24BF3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.calloutGradient}
        >
          <Text style={styles.calloutText}>{message}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 200,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  calloutWrap: {
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 10,
  },
  calloutGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    minWidth: 120,
    alignItems: 'center',
  },
  calloutText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  pointsText: {
    position: 'absolute',
    top: 72,
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 4,
  },
  ringBurst: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#FFEB3B',
    backgroundColor: 'rgba(255, 235, 59, 0.22)',
  },
  star: {
    position: 'absolute',
    zIndex: 2,
  },
  starGlyph: {
    fontSize: 20,
    color: '#FFEB3B',
  },
});
