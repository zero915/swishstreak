import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, typography } from '../constants/theme';

interface GameHUDProps {
  coins: number;
  streak: number;
  misses: number;
  maxMisses: number;
  level: number;
  mode: 'arcade' | 'campaign';
  objective?: string;
  makesProgress?: { current: number; target: number };
  onBack: () => void;
}

export function GameHUD({
  coins,
  streak,
  misses,
  maxMisses,
  level,
  mode,
  objective,
  makesProgress,
  onBack,
}: GameHUDProps) {
  const insets = useSafeAreaInsets();
  const coinsScale = useSharedValue(1);
  const prevCoins = useRef(coins);

  useEffect(() => {
    if (coins > prevCoins.current) {
      coinsScale.value = withSequence(
        withSpring(1.22, { damping: 6, stiffness: 380 }),
        withSpring(1, { damping: 10, stiffness: 260 })
      );
    }
    prevCoins.current = coins;
  }, [coins, coinsScale]);

  const coinsAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinsScale.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xs }]}>
      <View style={styles.panel}>
        <View style={styles.topRow}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.coinsChip}>
            <Text style={styles.chipLabel}>COINS</Text>
            <Animated.Text style={[styles.coins, coinsAnimStyle]}>🪙 {coins}</Animated.Text>
          </View>

          <View style={styles.levelChip}>
            <Text style={styles.chipLabel}>{mode === 'arcade' ? 'RUN LEVEL' : 'CAMPAIGN'}</Text>
            <Text style={styles.level} numberOfLines={1}>
              {mode === 'arcade' ? level : objective}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.streakChip}>
            <Text style={styles.streakText}>🔥 {streak}</Text>
          </View>
          <View style={styles.misses}>
            {Array.from({ length: maxMisses }).map((_, i) => (
              <View key={i} style={[styles.missDot, i < misses && styles.missDotFilled]} />
            ))}
          </View>
        </View>

        {makesProgress && (
          <Text style={styles.progress}>
            Makes {makesProgress.current} / {makesProgress.target}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 30,
    elevation: 30,
  },
  panel: {
    backgroundColor: 'rgba(8, 18, 40, 0.82)',
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    minHeight: 44,
    minWidth: 72,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
  },
  backText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  coinsChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 0,
  },
  levelChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  chipLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.7,
    marginBottom: 1,
  },
  coins: {
    ...typography.heading,
    color: colors.accent,
    fontSize: 18,
  },
  level: {
    ...typography.body,
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  streakChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  streakText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },
  misses: {
    flexDirection: 'row',
    gap: 8,
  },
  missDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  missDotFilled: {
    backgroundColor: colors.error,
  },
  progress: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 13,
    marginTop: spacing.xs,
  },
});
