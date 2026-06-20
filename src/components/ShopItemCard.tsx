import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ShopItem } from '../types';
import { colors, spacing, touchTarget, typography } from '../constants/theme';

interface ShopItemCardProps {
  item: ShopItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onEquip: () => void;
}

export function ShopItemCard({ item, owned, equipped, canAfford, onBuy, onEquip }: ShopItemCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.swatch, { backgroundColor: item.color }]} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.cost}>{item.cost === 0 ? 'Free' : `${item.cost} coins`}</Text>
      </View>
      {equipped ? (
        <Text style={styles.equipped}>Equipped</Text>
      ) : owned ? (
        <Pressable style={styles.button} onPress={onEquip}>
          <Text style={styles.buttonText}>Equip</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.button, !canAfford && styles.buttonDisabled]}
          onPress={onBuy}
          disabled={!canAfford}
        >
          <Text style={styles.buttonText}>Buy</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#333',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  cost: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.primary,
    minHeight: touchTarget.minHeight,
    minWidth: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  equipped: {
    color: colors.success,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'center',
  },
});
