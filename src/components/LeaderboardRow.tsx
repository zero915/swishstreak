import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { LeaderboardEntry } from '../types';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser?: boolean;
  scoreDelta?: number;
}

export function LeaderboardRow({ entry, rank, isCurrentUser, scoreDelta }: LeaderboardRowProps) {
  return (
    <View style={[styles.row, isCurrentUser && styles.highlight]}>
      <Text style={styles.rank}>#{rank}</Text>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{entry.displayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{entry.displayName}</Text>
        <Text style={styles.level}>
          Lv {entry.playerLevel}
          {scoreDelta !== undefined ? ` · ${scoreDelta} behind #1` : ''}
        </Text>
      </View>
      <Text style={styles.score}>
        {entry.totalStars !== undefined ? `${entry.totalStars}★` : entry.score}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  highlight: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  rank: {
    ...typography.body,
    fontWeight: '700',
    width: 36,
    color: colors.textSecondary,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  level: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  score: {
    ...typography.heading,
    color: colors.primary,
  },
});
