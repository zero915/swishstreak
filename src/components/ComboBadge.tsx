import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface ComboBadgeProps {
  x: number;
  y: number;
  multiplier: number;
  streak: number;
}

export function ComboBadge({ x, y, multiplier, streak }: ComboBadgeProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const prevMultiplier = useRef(multiplier);

  useEffect(() => {
    if (multiplier > prevMultiplier.current) {
      scale.value = withSequence(
        withSpring(1.28, { damping: 6, stiffness: 420 }),
        withSpring(1, { damping: 10, stiffness: 280 })
      );
    } else if (multiplier < prevMultiplier.current) {
      scale.value = withSequence(
        withTiming(0.82, { duration: 120 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
      opacity.value = withSequence(
        withTiming(0.45, { duration: 100 }),
        withTiming(1, { duration: 180 })
      );
    }
    prevMultiplier.current = multiplier;
  }, [multiplier, scale, opacity]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const hot = streak >= 3;

  return (
    <Animated.View
      style={[styles.wrap, { left: x - 36, top: y }, badgeStyle]}
      pointerEvents="none"
    >
      <View style={[styles.badge, hot && styles.badgeHot]}>
        <Text style={[styles.label, hot && styles.labelHot]}>x{multiplier}</Text>
      </View>
      {streak >= 2 && (
        <Text style={styles.streakHint}>{streak} streak</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 45,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    minWidth: 52,
    alignItems: 'center',
  },
  badgeHot: {
    backgroundColor: 'rgba(255,107,53,0.85)',
    borderColor: '#FFD54F',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  labelHot: {
    color: '#FFFDE7',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  streakHint: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
