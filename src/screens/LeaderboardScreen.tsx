import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { colors, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { requestAndSaveUserLocation } from '../services/geoService';

type Tab = 'arcade' | 'campaign' | 'friends' | 'local';
type Period = 'alltime' | 'weekly';

export function LeaderboardScreen() {
  const { isGuest, user, profile, setProfile } = useAuth();
  const { arcadeAllTime, arcadeWeekly, arcadeLocal, campaign, loading, refresh } = useLeaderboard();
  const [tab, setTab] = useState<Tab>('arcade');
  const [period, setPeriod] = useState<Period>('alltime');
  const [geoBusy, setGeoBusy] = useState(false);

  useEffect(() => {
    if (isGuest || !user || profile?.location) return;
    (async () => {
      setGeoBusy(true);
      try {
        const location = await requestAndSaveUserLocation(user.uid);
        if (location && profile) {
          setProfile({ ...profile, location });
          refresh();
        }
      } finally {
        setGeoBusy(false);
      }
    })();
  }, [isGuest, user, profile, setProfile, refresh]);

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
      : tab === 'local'
        ? arcadeLocal
        : tab === 'friends'
          ? (period === 'weekly' ? arcadeWeekly : arcadeAllTime).filter(
              (e) => profile?.friendIds.includes(e.uid) || e.uid === user?.uid
            )
          : period === 'weekly'
            ? arcadeWeekly
            : arcadeAllTime;

  const topScore = entries[0]?.score ?? 0;
  const myEntry = entries.find((e) => e.uid === user?.uid);
  const myScore = myEntry?.score ?? profile?.arcadeBest.score ?? 0;
  const showDelta = tab !== 'campaign' && myEntry && topScore > 0;

  const handleEnableLocal = async () => {
    if (!user || !profile) return;
    setGeoBusy(true);
    try {
      const location = await requestAndSaveUserLocation(user.uid);
      if (location) {
        setProfile({ ...profile, location });
        refresh();
      }
    } finally {
      setGeoBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Leaderboards</Text>

      {showDelta && (
        <Text style={styles.delta}>
          You: {myScore} · {topScore - myScore === 0 ? 'You are #1!' : `${topScore - myScore} behind #1`}
        </Text>
      )}

      <View style={styles.tabs}>
        {(['arcade', 'local', 'friends', 'campaign'] as Tab[]).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'local' ? 'Local' : t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab !== 'campaign' && tab !== 'local' && (
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

      {tab === 'local' && !profile?.location && (
        <Pressable style={styles.geoButton} onPress={handleEnableLocal} disabled={geoBusy}>
          <Text style={styles.geoText}>{geoBusy ? 'Loading…' : 'Enable location for local ranks'}</Text>
        </Pressable>
      )}

      {tab === 'local' && profile?.location && (
        <Text style={styles.localHint}>
          {profile.location.region
            ? `${profile.location.region}, ${profile.location.countryCode}`
            : profile.location.countryCode}
        </Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView style={styles.list}>
          {entries.length === 0 ? (
            <Text style={styles.empty}>
              {tab === 'local'
                ? 'No local scores yet. Play arcade to represent your area!'
                : 'No scores yet. Play a run to get on the board!'}
            </Text>
          ) : (
            entries.map((entry, index) => (
              <LeaderboardRow
                key={entry.uid}
                entry={entry}
                rank={index + 1}
                isCurrentUser={entry.uid === user?.uid}
                scoreDelta={entry.uid === user?.uid && topScore > entry.score ? topScore - entry.score : undefined}
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
    marginBottom: spacing.sm,
  },
  delta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  prompt: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    flexGrow: 1,
    minWidth: '22%',
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
    fontSize: 12,
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
  geoButton: {
    backgroundColor: colors.secondary,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  geoText: {
    color: '#fff',
    fontWeight: '700',
  },
  localHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
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
