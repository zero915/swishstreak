import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShopItemCard } from '../components/ShopItemCard';
import { getItemsByCategory } from '../constants/shopCatalog';
import { colors, spacing, typography } from '../constants/theme';
import { usePlayerData } from '../context/PlayerDataContext';
import { ShopCategory } from '../types';

const CATEGORIES: { key: ShopCategory; label: string }[] = [
  { key: 'balls', label: 'Balls' },
  { key: 'backboards', label: 'Backboards' },
  { key: 'backgrounds', label: 'Backgrounds' },
];

export function ShopScreen() {
  const { data, buyItem, equipItem } = usePlayerData();
  const [category, setCategory] = useState<ShopCategory>('balls');
  const items = getItemsByCategory(category);
  const equipKey = category === 'balls' ? 'ball' : category === 'backboards' ? 'backboard' : 'background';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Shop</Text>
      <Text style={styles.balance}>Balance: 🪙 {data.totalCoins}</Text>

      <View style={styles.tabs}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={[styles.tab, category === cat.key && styles.tabActive]}
            onPress={() => setCategory(cat.key)}
          >
            <Text style={[styles.tabText, category === cat.key && styles.tabTextActive]}>{cat.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.list}>
        {items.map((item) => (
          <ShopItemCard
            key={item.id}
            item={item}
            owned={data.shopState.owned.includes(item.id)}
            equipped={data.shopState.equipped[equipKey] === item.id}
            canAfford={data.totalCoins >= item.cost}
            onBuy={() => buyItem(item.id)}
            onEquip={() => equipItem(item.id, category)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  balance: {
    ...typography.body,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontWeight: '600',
    color: colors.text,
  },
  tabTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
});
