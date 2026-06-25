import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SignInPrompt } from '../components/SignInPrompt';
import { colors, spacing, touchTarget, typography } from '../constants/theme';
import { VERSUS_BET_OPTIONS } from '../constants/gameConfig';
import { useAuth } from '../context/AuthContext';
import { usePlayerData } from '../context/PlayerDataContext';
import { useDeadlineLabel } from '../context/ActiveMatchContext';
import {
  canPlayVersusRound,
  getMySlot,
  getOpponentName,
  getTheirSlot,
  joinVersusQueue,
  leaveVersusQueue,
  subscribeVersusMatch,
} from '../services/versusService';
import { RootStackParamList, VersusMatch } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Versus'>;

export function VersusScreen({ navigation }: Props) {
  const { user, profile, isGuest, refreshProfile } = useAuth();
  const { data } = usePlayerData();
  const [selectedBet, setSelectedBet] = useState<number>(10);
  const [busy, setBusy] = useState(false);
  const [queued, setQueued] = useState(false);
  const [match, setMatch] = useState<VersusMatch | null>(null);

  useEffect(() => {
    if (!profile?.activeVersusMatchId) {
      setMatch(null);
      return;
    }
    return subscribeVersusMatch(profile.activeVersusMatchId, setMatch);
  }, [profile?.activeVersusMatchId]);

  const deadline = useDeadlineLabel(match?.roundDeadline ?? new Date(0).toISOString());

  const handleJoin = async () => {
    if (!user) return;
    if (data.totalCoins < selectedBet) {
      Alert.alert('Not enough coins', `You need ${selectedBet} coins to play.`);
      return;
    }
    setBusy(true);
    try {
      const result = await joinVersusQueue(selectedBet);
      setQueued(result.queued);
      await refreshProfile();
      if (result.matchId) {
        Alert.alert('Match found!', 'Your 1v1 has started.');
      } else {
        Alert.alert('Searching…', 'Looking for an opponent. A bot joins after 30s if needed.');
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not join queue');
    } finally {
      setBusy(false);
    }
  };

  const handleLeaveQueue = async () => {
    setBusy(true);
    try {
      await leaveVersusQueue();
      setQueued(false);
      await refreshProfile();
    } finally {
      setBusy(false);
    }
  };

  const handlePlayRound = useCallback(() => {
    if (!match || !user) return;
    navigation.navigate('Game', { mode: 'arcade', versusMatchId: match.id });
  }, [match, navigation, user]);

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>1v1 Versus</Text>
        <SignInPrompt message="bet coins and play friends or rivals online." />
      </SafeAreaView>
    );
  }

  const canPlay = match && user && canPlayVersusRound(match, user.uid);
  const mySlot = match && user ? getMySlot(match, user.uid) : null;
  const theirSlot = match && user ? getTheirSlot(match, user.uid) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>1v1 Versus</Text>
        <Text style={styles.subtitle}>Best of 3 arcade rounds · 24h per round</Text>
        <Text style={styles.coins}>Your coins: {data.totalCoins}</Text>

        {match?.status === 'active' && user && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Active match vs {getOpponentName(match, user.uid)}</Text>
            <Text style={styles.cardText}>
              Round {match.currentRound} · Series{' '}
              {match.playerA.uid === user.uid
                ? `${match.roundWins.a}-${match.roundWins.b}`
                : `${match.roundWins.b}-${match.roundWins.a}`}
            </Text>
            <Text style={[styles.deadline, deadline.urgent && styles.urgent]}>
              {deadline.text} remaining
            </Text>
            {mySlot && theirSlot && (
              <Text style={styles.cardText}>
                Your scores: {mySlot.rounds.map((r) => r.score).join(', ') || '—'} · Theirs:{' '}
                {theirSlot.rounds.map((r) => r.score).join(', ') || '—'}
              </Text>
            )}
            {canPlay ? (
              <Pressable style={styles.primaryButton} onPress={handlePlayRound}>
                <Text style={styles.primaryText}>Play Round {match.currentRound}</Text>
              </Pressable>
            ) : (
              <Text style={styles.waiting}>Waiting for opponent or round result…</Text>
            )}
          </View>
        )}

        {match?.status === 'completed' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {match.winnerId === user?.uid ? 'You won!' : 'Match over'}
            </Text>
            <Text style={styles.cardText}>Bet: {match.betAmount} coins</Text>
          </View>
        )}

        {!match && (
          <>
            <Text style={styles.section}>Select bet (winner gets 2×)</Text>
            <View style={styles.betRow}>
              {VERSUS_BET_OPTIONS.map((bet) => (
                <Pressable
                  key={bet}
                  style={[styles.betChip, selectedBet === bet && styles.betChipActive]}
                  onPress={() => setSelectedBet(bet)}
                >
                  <Text style={selectedBet === bet ? styles.betTextActive : styles.betText}>{bet}</Text>
                </Pressable>
              ))}
            </View>

            {queued ? (
              <Pressable style={styles.secondaryButton} onPress={handleLeaveQueue} disabled={busy}>
                <Text style={styles.secondaryText}>{busy ? '…' : 'Leave queue (refund)'}</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.primaryButton} onPress={handleJoin} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Find opponent ({selectedBet} coins)</Text>
                )}
              </Pressable>
            )}
          </>
        )}

        <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  prompt: { ...typography.body, color: colors.textSecondary, marginTop: spacing.lg },
  coins: { ...typography.body, fontWeight: '700', marginBottom: spacing.md },
  section: { fontWeight: '700', marginBottom: spacing.sm, color: colors.text },
  betRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  betChip: {
    minWidth: 52,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  betChipActive: { backgroundColor: colors.primary },
  betText: { fontWeight: '700', color: colors.text },
  betTextActive: { fontWeight: '700', color: '#fff' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cardTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
  cardText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  deadline: { ...typography.body, fontWeight: '700', color: colors.secondary, marginTop: spacing.sm },
  urgent: { color: '#C62828' },
  waiting: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  primaryButton: {
    backgroundColor: colors.primary,
    minHeight: touchTarget.minHeight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    minHeight: touchTarget.minHeight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.primary, fontWeight: '700' },
  backLink: { marginTop: spacing.xl, alignItems: 'center' },
  backText: { color: colors.primary, fontWeight: '700' },
});
