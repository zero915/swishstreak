import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../constants/theme';

interface LevelNodeProps {
  levelId: number;
  stars: number;
  unlocked: boolean;
  completed: boolean;
  zoneColor: string;
  offsetX: number;
  onPress: () => void;
}

export function LevelNode({
  levelId,
  stars,
  unlocked,
  completed,
  zoneColor,
  offsetX,
  onPress,
}: LevelNodeProps) {
  return (
    <View style={[styles.row, { marginLeft: offsetX }]}>
      <Pressable
        style={[
          styles.node,
          { borderColor: zoneColor },
          completed && styles.completed,
          !unlocked && styles.locked,
        ]}
        onPress={onPress}
        disabled={!unlocked}
      >
        {!unlocked && <View style={[styles.lockedGlow, { borderColor: zoneColor }]} />}
        {completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓</Text>
          </View>
        )}
        <View style={[styles.starRing, stars > 0 && { borderColor: colors.accent }]}>
          <Text style={styles.levelNumber}>{levelId}</Text>
        </View>
        {stars > 0 && <Text style={styles.stars}>{'★'.repeat(Math.min(stars, 3))}</Text>}
        {!unlocked && <Text style={styles.lock}>🔒</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'center',
    marginVertical: 10,
  },
  node: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  completed: {
    backgroundColor: '#2E7D32',
  },
  locked: {
    backgroundColor: '#757575',
    opacity: 0.85,
  },
  lockedGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 34,
    borderWidth: 2,
    opacity: 0.45,
  },
  completedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  completedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  starRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    ...typography.heading,
    color: '#fff',
    fontSize: 20,
  },
  stars: {
    fontSize: 9,
    color: colors.accent,
    position: 'absolute',
    bottom: 4,
    fontWeight: '700',
  },
  lock: {
    fontSize: 18,
    position: 'absolute',
  },
});
