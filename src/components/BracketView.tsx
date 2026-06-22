import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { TournamentBracketMatch } from '../types';

interface BracketViewProps {
  bracket: TournamentBracketMatch[];
}

export function BracketView({ bracket }: BracketViewProps) {
  const rounds = [...new Set(bracket.map((b) => b.round))].sort((a, b) => a - b);

  return (
    <View style={styles.wrap}>
      {rounds.map((round) => (
        <View key={round} style={styles.round}>
          <Text style={styles.roundTitle}>Round {round}</Text>
          {bracket
            .filter((b) => b.round === round)
            .map((m) => (
              <View key={m.matchId} style={styles.match}>
                <Text style={styles.matchText}>
                  {shortId(m.playerAUid)} vs {shortId(m.playerBUid)}
                  {m.winnerId ? ` → ${shortId(m.winnerId)}` : ''}
                </Text>
              </View>
            ))}
        </View>
      ))}
    </View>
  );
}

function shortId(uid?: string): string {
  if (!uid) return '?';
  if (uid.startsWith('bot_')) return uid.replace('bot_', '').replace(/_/g, ' ');
  return uid.slice(0, 6);
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  round: { marginBottom: spacing.sm },
  roundTitle: { ...typography.caption, fontWeight: '700', color: colors.text },
  match: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: 4,
  },
  matchText: { ...typography.caption, color: colors.textSecondary },
});
