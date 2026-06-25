import { useEffect, useState } from 'react';
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
import { BracketView } from '../components/BracketView';
import { SignInPrompt } from '../components/SignInPrompt';
import { colors, spacing, touchTarget, typography } from '../constants/theme';
import { TOURNAMENT_ENTRY_FEE, TOURNAMENT_MAX_PLAYERS, TOURNAMENT_MIN_PLAYERS } from '../constants/gameConfig';
import { useAuth } from '../context/AuthContext';
import { usePlayerData } from '../context/PlayerDataContext';
import { useDeadlineLabel } from '../context/ActiveMatchContext';
import { getOpenTournament, joinTournament, subscribeTournament } from '../services/tournamentService';
import { RootStackParamList, Tournament } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Tournament'>;

export function TournamentScreen({ navigation }: Props) {
  const { isGuest, profile, refreshProfile } = useAuth();
  const { data } = usePlayerData();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile?.activeTournamentId) {
      return subscribeTournament(profile.activeTournamentId, setTournament);
    }
    void getOpenTournament().then(setTournament);
    return undefined;
  }, [profile?.activeTournamentId]);

  const deadline = useDeadlineLabel(tournament?.roundDeadline ?? new Date(0).toISOString());

  const handleJoin = async () => {
    if (data.totalCoins < TOURNAMENT_ENTRY_FEE) {
      Alert.alert('Not enough coins', `Entry is ${TOURNAMENT_ENTRY_FEE} coins.`);
      return;
    }
    setBusy(true);
    try {
      const { tournamentId } = await joinTournament();
      await refreshProfile();
      subscribeTournament(tournamentId, setTournament);
      Alert.alert('Joined!', 'Tournament starts at 8 players (bots fill empty slots).');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not join');
    } finally {
      setBusy(false);
    }
  };

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Tournament</Text>
        <SignInPrompt message="join playoff brackets." />
      </SafeAreaView>
    );
  }

  const playerCount = tournament?.playerIds?.length ?? 0;
  const joined = tournament?.playerIds?.includes(profile?.uid ?? '');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Tournament</Text>
        <Text style={styles.subtitle}>
          {TOURNAMENT_MIN_PLAYERS}–{TOURNAMENT_MAX_PLAYERS} players · Best of 3 · Winner takes all
        </Text>

        {tournament && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {tournament.status === 'filling'
                ? `Filling ${playerCount}/${TOURNAMENT_MIN_PLAYERS}+`
                : tournament.status === 'completed'
                  ? 'Completed'
                  : `Round ${tournament.currentRound}`}
            </Text>
            <Text style={styles.cardText}>Pot: {tournament.pot} coins · Entry: {TOURNAMENT_ENTRY_FEE}</Text>
            <Text style={[styles.deadline, deadline.urgent && styles.urgent]}>{deadline.text} left</Text>
            {tournament.bracket.length > 0 && <BracketView bracket={tournament.bracket} />}
          </View>
        )}

        {(!joined || tournament?.status === 'filling') && tournament?.status !== 'completed' && (
          <Pressable style={styles.primaryButton} onPress={handleJoin} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Join ({TOURNAMENT_ENTRY_FEE} coins)</Text>
            )}
          </Pressable>
        )}

        {profile?.activeVersusMatchId && tournament?.status === 'active' && (
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Versus')}>
            <Text style={styles.primaryText}>Play your bracket match</Text>
          </Pressable>
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
  primaryButton: {
    backgroundColor: colors.secondary,
    minHeight: touchTarget.minHeight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  backLink: { marginTop: spacing.lg, alignItems: 'center' },
  backText: { color: colors.primary, fontWeight: '700' },
});
