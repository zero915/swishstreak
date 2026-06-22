import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getBackboardTheme, isPremiumBackboard } from '../constants/backboardThemes';
import { ShopItem } from '../types';
import { BackboardFace } from './BackboardFace';
import { colors, spacing, touchTarget, typography } from '../constants/theme';

interface ShopItemCardProps {
  item: ShopItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onEquip: () => void;
}

function ItemPreview({ item }: { item: ShopItem }) {
  if (item.category === 'balls' && item.imageSource) {
    return (
      <Image source={item.imageSource} style={styles.ballPreview} resizeMode="contain" />
    );
  }

  if (item.category === 'backboards') {
    const theme = getBackboardTheme(item.id);
    if (theme) {
      return (
        <View style={styles.boardPreviewWrap}>
          <BackboardFace width={52} height={38} theme={theme} animateEffects={false} />
          {isPremiumBackboard(item.id) && (
            <View style={styles.fxBadge}>
              <Text style={styles.fxBadgeText}>FX</Text>
            </View>
          )}
        </View>
      );
    }
    if (item.backboardImage) {
      return (
        <Image source={item.backboardImage} style={styles.boardImagePreview} resizeMode="contain" />
      );
    }
  }

  if (item.category === 'backgrounds' && item.imageSource) {
    return (
      <Image source={item.imageSource} style={styles.bgPreview} resizeMode="cover" />
    );
  }

  return <View style={[styles.swatch, { backgroundColor: item.color }]} />;
}

export function ShopItemCard({ item, owned, equipped, canAfford, onBuy, onEquip }: ShopItemCardProps) {
  const premium = item.category === 'backboards' && isPremiumBackboard(item.id);

  return (
    <View style={styles.card}>
      <ItemPreview item={item} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.cost}>
          {item.cost === 0 ? 'Free' : `${item.cost} coins`}
          {premium ? ' · Premium FX' : item.category === 'backboards' ? ' · Color' : ''}
        </Text>
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
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#333',
  },
  ballPreview: {
    width: 52,
    height: 52,
    backgroundColor: 'transparent',
  },
  boardPreviewWrap: {
    width: 52,
    height: 40,
    overflow: 'hidden',
    borderRadius: 6,
  },
  boardImagePreview: {
    width: 52,
    height: 40,
    borderRadius: 6,
  },
  bgPreview: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  fxBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255,107,53,0.92)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  fxBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
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
