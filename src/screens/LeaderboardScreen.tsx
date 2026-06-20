import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { colors, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLeaderboard } from '../hooks/useLeaderboard';

type Tab = 'arcade' | 'campaign' | 'friends';
type Period = 'alltime' | 'weekly';

export function LeaderboardScreen() {
  const { isGuest, user, profile } = useAuth();
  const { arcadeAllTime, arcadeWeekly, campaign, loading, refresh } = useLeaderboard();
  const [tab, setTab] = useState<Tab>('arcade');
  const [period, setPeriod] = useState<Period>('alltime');

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Leaderboards</Text>
        <Text style={styles.prompt}>Sign in to compare scores with friends and players worldwide.</Text>
      </SafeAreaView>
    );
  }

  const entries =
    tab === 'campaign'
      ? campaign
      : tab === 'friends'
        ? (period === 'weekly' ? arcadeWeekly : arcadeAllTime).filter(
            (e) => profile?.friendIds.includes(e.uid) || e.uid === user?.uid
          )
        : period === 'weekly'
          ? arcadeWeekly
          : arcadeAllTime;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Leaderboards</Text>

      <View style={styles.tabs}>
        {(['arcade', 'campaign', 'friends'] as Tab[]).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab !== 'campaign' && (
        <View style={styles.periodRow}>
          {(['alltime', 'weekly'] as Period[]).map((p) => (
            <Pressable
              key={p}
              style={[styles.periodTab, period === p && styles.periodActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={period === p ? styles.periodTextActive : styles.periodText}>
                {p === 'alltime' ? 'All Time' : 'This Week'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView style={styles.list}>
          {entries.length === 0 ? (
            <Text style={styles.empty}>No scores yet. Play a run to get on the board!</Text>
          ) : (
            entries.map((entry, index) => (
              <LeaderboardRow
                key={entry.uid}
                entry={entry}
                rank={index + 1}
                isCurrentUser={entry.uid === user?.uid}
              />
            ))
          )}
        </ScrollView>
      )}

      <Pressable style={styles.refresh} onPress={() => refresh(tab === 'friends')}>
        <Text style={styles.refreshText}>Refresh</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
  },
  prompt: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontWeight: '600',
    color: colors.text,
    fontSize: 13,
  },
  tabTextActive: {
    color: '#fff',
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  periodTab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodActive: {
    backgroundColor: colors.secondary,
  },
  periodText: {
    color: colors.text,
    fontWeight: '600',
  },
  periodTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  refresh: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    color: colors.primary,
    fontWeight: '700',
  },
});
