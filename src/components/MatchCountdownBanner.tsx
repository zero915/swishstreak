import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../constants/theme';
import { useActiveMatch, useDeadlineLabel } from '../context/ActiveMatchContext';
import { RootStackParamList } from '../types';

export function MatchCountdownBanner() {
  const { deadline } = useActiveMatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { text, urgent } = useDeadlineLabel(deadline?.roundDeadline ?? new Date(0).toISOString());

  if (!deadline) return null;

  const handlePress = () => {
    if (deadline.kind === 'tournament') {
      navigation.navigate('Tournament');
    } else {
      navigation.navigate('Versus');
    }
  };

  return (
    <Pressable
      style={[styles.banner, urgent && styles.urgent]}
      onPress={handlePress}
      accessibilityRole="button"
    >
      <Text style={styles.text}>
        {deadline.label} — {text} left
      </Text>
      <Text style={styles.cta}>Tap to play your round</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  urgent: {
    backgroundColor: '#C62828',
  },
  text: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
  },
  cta: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
});
