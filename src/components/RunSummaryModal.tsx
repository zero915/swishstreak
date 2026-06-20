import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, touchTarget, typography } from '../constants/theme';
import { RunSummary } from '../types';

interface RunSummaryModalProps {
  visible: boolean;
  summary: RunSummary;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function RunSummaryModal({ visible, summary, onPlayAgain, onHome }: RunSummaryModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Run Summary</Text>
          <Text style={styles.stat}>Shots Made: {summary.shotsMade}</Text>
          <Text style={styles.stat}>Best Streak: {summary.bestStreak}</Text>
          <Text style={styles.stat}>Coins Earned: {summary.coinsEarned}</Text>
          <Text style={styles.score}>Score: {summary.score}</Text>
          <Pressable style={styles.button} onPress={onPlayAgain}>
            <Text style={styles.buttonText}>Play Again</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={onHome}>
            <Text style={styles.secondaryText}>Home</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stat: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  score: {
    ...typography.heading,
    color: colors.primary,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    minHeight: touchTarget.minHeight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
});
