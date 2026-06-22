import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CampaignMapPath } from '../components/CampaignMapPath';
import { CampaignZoneHeader } from '../components/CampaignZoneHeader';
import { LevelNode } from '../components/LevelNode';
import {
  getCampaignZone,
  getFurthestUnlockedLevel,
  getLevelNodeOffset,
  isLevelUnlocked,
  MAP_NODE_VERTICAL_GAP,
} from '../constants/campaignLevels';
import { colors, spacing, typography } from '../constants/theme';
import { usePlayerData } from '../context/PlayerDataContext';
import { useFriends } from '../hooks/useFriends';
import { MainTabParamList, RootStackParamList } from '../types';

type MapNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Map'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type MapRow =
  | { type: 'zone'; key: string; levelStart: number }
  | { type: 'level'; key: string; levelId: number };

const VISIBLE_BUFFER = 5;
const EXTEND_COUNT = 10;

export function LevelMapScreen() {
  const navigation = useNavigation<MapNavigation>();
  const { data } = usePlayerData();
  const { friends } = useFriends();
  const { width } = useWindowDimensions();
  const furthestUnlocked = getFurthestUnlockedLevel(data.campaignProgress);
  const [visibleEnd, setVisibleEnd] = useState(furthestUnlocked + VISIBLE_BUFFER);
  const [showFriends, setShowFriends] = useState(false);

  const friendsOnLevel = useCallback(
    (levelId: number) =>
      friends.filter((f) => (f.campaignProgress[levelId]?.stars ?? 0) > 0),
    [friends]
  );

  const rows = useMemo(() => {
    const end = Math.max(visibleEnd, furthestUnlocked + VISIBLE_BUFFER);
    const items: MapRow[] = [];
    for (let id = 1; id <= end; id += 1) {
      if (id === 1 || (id - 1) % 10 === 0) {
        items.push({ type: 'zone', key: `zone-${id}`, levelStart: id });
      }
      items.push({ type: 'level', key: `level-${id}`, levelId: id });
    }
    return items;
  }, [visibleEnd, furthestUnlocked]);

  const mapContentHeight = useMemo(() => {
    const levelCount = rows.filter((r) => r.type === 'level').length;
    return levelCount * MAP_NODE_VERTICAL_GAP + 120;
  }, [rows]);

  const extendVisible = useCallback(() => {
    setVisibleEnd((prev) => prev + EXTEND_COUNT);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: MapRow }) => {
      if (item.type === 'zone') {
        const zone = getCampaignZone(item.levelStart);
        return <CampaignZoneHeader zone={zone} levelStart={item.levelStart} />;
      }

      const progress = data.campaignProgress[item.levelId];
      const unlocked = isLevelUnlocked(item.levelId, data.campaignProgress);
      const zone = getCampaignZone(item.levelId);
      const stars = progress?.stars ?? 0;
      const levelFriends = showFriends ? friendsOnLevel(item.levelId) : [];

      return (
        <View>
          <LevelNode
            levelId={item.levelId}
            stars={stars}
            unlocked={unlocked}
            completed={stars > 0}
            zoneColor={zone.color}
            offsetX={getLevelNodeOffset(item.levelId)}
            onPress={() =>
              navigation.navigate('Game', { mode: 'campaign', campaignLevelId: item.levelId })
            }
          />
          {levelFriends.length > 0 && (
            <View style={[styles.friendRow, { marginLeft: getLevelNodeOffset(item.levelId) + spacing.lg }]}>
              {levelFriends.slice(0, 4).map((f) => (
                <View key={f.uid} style={styles.friendChip}>
                  <Text style={styles.friendChipText}>
                    {f.displayName.charAt(0)}·{f.campaignProgress[item.levelId]?.stars ?? 0}★
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
    [data.campaignProgress, navigation, showFriends, friendsOnLevel]
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#FFF8E1', '#E3F2FD']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Text style={styles.title}>Campaign</Text>
      <View style={styles.headerRow}>
        <Text style={styles.subtitle}>Endless path — beat levels to unlock the next</Text>
        <Pressable
          style={[styles.friendToggle, showFriends && styles.friendToggleOn]}
          onPress={() => setShowFriends((v) => !v)}
        >
          <Text style={showFriends ? styles.friendToggleTextOn : styles.friendToggleText}>Friends</Text>
        </Pressable>
      </View>

      <View style={styles.mapWrap}>
        <View style={[styles.pathLayer, { height: mapContentHeight, width }]}>
          {Array.from({ length: Math.max(0, rows.filter((r) => r.type === 'level').length - 1) }).map(
            (_, i) => {
              const fromLevel = i + 1;
              const zone = getCampaignZone(fromLevel);
              return (
                <CampaignMapPath
                  key={`path-${fromLevel}`}
                  fromLevel={fromLevel}
                  toLevel={fromLevel + 1}
                  mapWidth={width - spacing.lg * 2}
                  color={zone.secondaryColor}
                />
              );
            }
          )}
        </View>

        <FlatList
          data={rows}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.scroll}
          onEndReached={extendVisible}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  friendToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  friendToggleOn: {
    backgroundColor: colors.secondary,
  },
  friendToggleText: {
    fontWeight: '700',
    color: colors.text,
  },
  friendToggleTextOn: {
    fontWeight: '700',
    color: '#fff',
  },
  friendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: -8,
    marginBottom: spacing.sm,
  },
  friendChip: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  friendChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
  },
  pathLayer: {
    position: 'absolute',
    left: spacing.lg,
    top: 0,
    pointerEvents: 'none',
  },
  scroll: {
    paddingBottom: spacing.xl * 2,
    paddingTop: spacing.sm,
  },
});
