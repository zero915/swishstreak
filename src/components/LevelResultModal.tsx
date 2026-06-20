import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, touchTarget, typography } from '../constants/theme';
import { LevelResult } from '../types';

interface LevelResultModalProps {
  visible: boolean;
  result: LevelResult;
  onContinue: () => void;
  onRetry: () => void;
}

export function LevelResultModal({ visible, result, onContinue, onRetry }: LevelResultModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{result.passed ? 'Level Complete!' : 'Level Failed'}</Text>
          {result.passed && (
            <>
              <Text style={styles.stars}>{'★'.repeat(result.stars)}{'☆'.repeat(3 - result.stars)}</Text>
              <Text style={styles.stat}>Coins: +{result.coinsEarned}</Text>
            </>
          )}
          <Pressable style={styles.button} onPress={result.passed ? onContinue : onRetry}>
            <Text style={styles.buttonText}>{result.passed ? 'Continue' : 'Retry'}</Text>
          </Pressable>
          {result.passed && (
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={onContinue}>
              <Text style={styles.secondaryText}>Back to Map</Text>
            </Pressable>
          )}
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
    alignItems: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
  },
  stars: {
    fontSize: 36,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  stat: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    minHeight: touchTarget.minHeight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    width: '100%',
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
