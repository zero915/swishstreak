import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LevelNode } from '../components/LevelNode';
import { CAMPAIGN_LEVELS, isLevelUnlocked } from '../constants/campaignLevels';
import { colors, spacing, typography } from '../constants/theme';
import { usePlayerData } from '../context/PlayerDataContext';
import { MainTabParamList, RootStackParamList } from '../types';

type MapNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Map'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function LevelMapScreen() {
  const navigation = useNavigation<MapNavigation>();
  const { data } = usePlayerData();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Campaign</Text>
      <Text style={styles.subtitle}>Complete levels to unlock the path</Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        {CAMPAIGN_LEVELS.map((level) => {
          const progress = data.campaignProgress[level.id];
          const unlocked = isLevelUnlocked(level.id, data.campaignProgress);
          return (
            <LevelNode
              key={level.id}
              levelId={level.id}
              stars={progress?.stars ?? 0}
              unlocked={unlocked}
              onPress={() =>
                navigation.navigate('Game', { mode: 'campaign', campaignLevelId: level.id })
              }
            />
          );
        })}
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
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
});
