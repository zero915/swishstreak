import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../constants/theme';

interface LevelNodeProps {
  levelId: number;
  stars: number;
  unlocked: boolean;
  onPress: () => void;
}

export function LevelNode({ levelId, stars, unlocked, onPress }: LevelNodeProps) {
  return (
    <Pressable
      style={[styles.node, !unlocked && styles.locked, levelId % 2 === 0 && styles.offsetRight]}
      onPress={onPress}
      disabled={!unlocked}
    >
      <Text style={styles.levelNumber}>{levelId}</Text>
      {stars > 0 && (
        <Text style={styles.stars}>{'★'.repeat(stars)}</Text>
      )}
      {!unlocked && <Text style={styles.lock}>🔒</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  node: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  offsetRight: {
    alignSelf: 'flex-end',
    marginRight: 60,
  },
  locked: {
    backgroundColor: '#9E9E9E',
  },
  levelNumber: {
    ...typography.heading,
    color: '#fff',
  },
  stars: {
    fontSize: 10,
    color: colors.accent,
    position: 'absolute',
    bottom: 2,
  },
  lock: {
    fontSize: 16,
    position: 'absolute',
  },
});
