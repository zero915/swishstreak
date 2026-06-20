import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../constants/theme';
import { xpForNextLevel } from '../utils/xp';

interface PlayerLevelBarProps {
  level: number;
  totalXP: number;
}

export function PlayerLevelBar({ level, totalXP }: PlayerLevelBarProps) {
  const { current, needed, progress } = xpForNextLevel(totalXP);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.levelText}>Lv {level}</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
      </View>
      <Text style={styles.xpText}>
        {current}/{needed} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  barContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  xpText: {
    ...typography.caption,
    color: colors.textSecondary,
    minWidth: 70,
  },
});
