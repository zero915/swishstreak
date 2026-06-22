import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BackboardEffect, BackboardTheme } from '../types';

interface BackboardFaceProps {
  width: number;
  height: number;
  theme: BackboardTheme;
  style?: ViewStyle;
  animateEffects?: boolean;
}

function StarsEffect({ animate }: { animate: boolean }) {
  const pulse = useSharedValue(0.4);
  useEffect(() => {
    if (!animate) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [animate, pulse]);

  const twinkle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const stars = [
    { top: '12%', left: '18%', size: 4 },
    { top: '22%', left: '72%', size: 5 },
    { top: '38%', left: '45%', size: 3 },
    { top: '55%', left: '15%', size: 4 },
    { top: '48%', left: '82%', size: 3 },
    { top: '68%', left: '58%', size: 5 },
    { top: '78%', left: '28%', size: 3 },
  ];

  return (
    <Animated.View style={[StyleSheet.absoluteFill, twinkle]} pointerEvents="none">
      {stars.map((s, i) => (
        <View
          key={i}
          style={[
            styles.star,
            {
              top: s.top as `${number}%`,
              left: s.left as `${number}%`,
              width: s.size,
              height: s.size,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

function BlizzardEffect({ animate }: { animate: boolean }) {
  const drift = useSharedValue(0);
  useEffect(() => {
    if (!animate) return;
    drift.value = withRepeat(withTiming(14, { duration: 2200, easing: Easing.linear }), -1, false);
  }, [animate, drift]);

  const snowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drift.value }],
  }));

  const flakes = Array.from({ length: 18 }).map((_, i) => ({
    left: `${(i * 17 + 8) % 92}%`,
    top: `${(i * 13) % 88}%`,
    size: 2 + (i % 3),
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, snowStyle]} pointerEvents="none">
      {flakes.map((f, i) => (
        <View
          key={i}
          style={[
            styles.snowflake,
            {
              left: f.left as `${number}%`,
              top: f.top as `${number}%`,
              width: f.size,
              height: f.size,
              borderRadius: f.size / 2,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

function FireEffect({ animate }: { animate: boolean }) {
  const flicker = useSharedValue(0);
  useEffect(() => {
    if (!animate) return;
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 180 }),
        withTiming(0.55, { duration: 220 }),
        withTiming(0.85, { duration: 160 })
      ),
      -1,
      false
    );
  }, [animate, flicker]);

  const flameStyle = useAnimatedStyle(() => ({ opacity: 0.5 + flicker.value * 0.5 }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.fireWrap, flameStyle]} pointerEvents="none">
      <LinearGradient
        colors={['transparent', 'rgba(255,235,59,0.35)', 'rgba(255,87,34,0.55)']}
        style={StyleSheet.absoluteFill}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.flame,
            {
              left: `${12 + i * 16}%`,
              height: 18 + (i % 3) * 8,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

function CracksEffect() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.crack, { top: '18%', left: '35%', width: '42%', transform: [{ rotate: '-28deg' }] }]} />
      <View style={[styles.crack, { top: '42%', left: '12%', width: '55%', transform: [{ rotate: '12deg' }] }]} />
      <View style={[styles.crack, { top: '58%', left: '48%', width: '38%', transform: [{ rotate: '-45deg' }] }]} />
      <View style={[styles.crackThin, { top: '30%', left: '62%', height: '38%', transform: [{ rotate: '8deg' }] }]} />
    </View>
  );
}

function BonesEffect() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.bone, { top: '28%', left: '38%', transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.bone, { top: '28%', left: '38%', transform: [{ rotate: '-45deg' }] }]} />
      <View style={[styles.boneKnob, { top: '24%', left: '46%' }]} />
      <View style={[styles.boneKnob, { top: '52%', left: '46%' }]} />
    </View>
  );
}

function CloudsEffect() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.cloud, { top: '14%', left: '10%', width: '38%' }]} />
      <View style={[styles.cloud, { top: '62%', left: '48%', width: '42%' }]} />
      <View style={[styles.cloudSmall, { top: '38%', left: '68%' }]} />
    </View>
  );
}

function BackboardEffectLayer({
  effect,
  animate,
}: {
  effect: BackboardEffect;
  animate: boolean;
}) {
  switch (effect) {
    case 'stars':
      return <StarsEffect animate={animate} />;
    case 'blizzard':
      return <BlizzardEffect animate={animate} />;
    case 'fire':
      return <FireEffect animate={animate} />;
    case 'cracks':
      return <CracksEffect />;
    case 'bones':
      return <BonesEffect />;
    case 'clouds':
      return <CloudsEffect />;
    default:
      return null;
  }
}

/** Shared backboard template — gradient face, frame, target square, optional FX overlay. */
export function BackboardFace({
  width,
  height,
  theme,
  style,
  animateEffects = true,
}: BackboardFaceProps) {
  const radius = Math.max(6, width * 0.02);

  return (
    <View style={[{ width, height }, style]}>
      <LinearGradient
        colors={theme.gradient}
        style={[styles.board, { width, height, borderRadius: radius, borderColor: theme.frameColor }]}
      >
        <View
          style={[
            styles.boardFrame,
            { borderColor: `${theme.frameColor}88`, borderRadius: radius - 2 },
          ]}
        />
        <View
          style={[
            styles.boardTarget,
            {
              borderColor: theme.targetBorder,
              backgroundColor: theme.targetFill,
            },
          ]}
        />
        {theme.effect ? (
          <BackboardEffectLayer effect={theme.effect} animate={animateEffects} />
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 6,
  },
  boardFrame: {
    position: 'absolute',
    top: 7,
    left: 7,
    right: 7,
    bottom: 7,
    borderWidth: 2,
  },
  boardTarget: {
    width: '40%',
    height: '36%',
    borderRadius: 3,
    borderWidth: 3,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    shadowColor: '#FFEB3B',
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  snowflake: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  fireWrap: {
    justifyContent: 'flex-end',
  },
  flame: {
    position: 'absolute',
    bottom: 0,
    width: '14%',
    backgroundColor: 'rgba(255,193,7,0.75)',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  crack: {
    position: 'absolute',
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 1,
  },
  crackThin: {
    position: 'absolute',
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 1,
  },
  bone: {
    position: 'absolute',
    width: '28%',
    height: 7,
    backgroundColor: 'rgba(245,245,245,0.85)',
    borderRadius: 4,
  },
  boneKnob: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(245,245,245,0.9)',
  },
  cloud: {
    position: 'absolute',
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 999,
  },
  cloudSmall: {
    position: 'absolute',
    width: 28,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 999,
  },
});
