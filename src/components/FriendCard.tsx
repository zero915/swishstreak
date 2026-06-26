import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { colors, spacing, typography } from '../constants/theme';
import { FriendProfile } from '../types';

interface FriendCardProps {
  friend: FriendProfile;
  myStats: {
    level: number;
    furthest: number;
    stars: number;
    arcadeBest: number;
  };
}

function CompareBar({
  label,
  mine,
  theirs,
  higherIsBetter = true,
}: {
  label: string;
  mine: number;
  theirs: number;
  higherIsBetter?: boolean;
}) {
  const max = Math.max(mine, theirs, 1);
  const mineWidth = `${(mine / max) * 100}%`;
  const theirsWidth = `${(theirs / max) * 100}%`;
  const winning = higherIsBetter ? mine >= theirs : mine <= theirs;

  return (
    <View style={styles.compareBlock}>
      <Text style={styles.compareLabel}>{label}</Text>
      <View style={styles.barRow}>
        <Text style={styles.barSide}>You {mine}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, styles.barYou, { width: mineWidth as `${number}%` }]} />
        </View>
      </View>
      <View style={styles.barRow}>
        <Text style={styles.barSide}>{winning ? '↓' : '↑'} {theirs}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, styles.barThem, { width: theirsWidth as `${number}%` }]} />
        </View>
      </View>
    </View>
  );
}

export function FriendCard({ friend, myStats }: FriendCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Avatar displayName={friend.displayName} photoURL={friend.photoURL} size={44} backgroundColor={colors.secondary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{friend.displayName}</Text>
          <Text style={styles.stats}>
            Lv {friend.playerLevel} · Level {friend.furthestLevel} · {friend.totalStars}★ · Best{' '}
            {friend.arcadeBest.score}
          </Text>
        </View>
      </View>
      <CompareBar label="Arcade" mine={myStats.arcadeBest} theirs={friend.arcadeBest.score} />
      <CompareBar label="Stars" mine={myStats.stars} theirs={friend.totalStars} />
      <CompareBar label="Campaign" mine={myStats.furthest} theirs={friend.furthestLevel} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarWrap: {
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  stats: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  compareBlock: {
    marginTop: spacing.xs,
  },
  compareLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  barSide: {
    width: 56,
    ...typography.caption,
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#EEE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barYou: {
    backgroundColor: colors.primary,
  },
  barThem: {
    backgroundColor: colors.secondary,
  },
});
