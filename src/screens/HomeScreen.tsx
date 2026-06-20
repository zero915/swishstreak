import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlayerLevelBar } from '../components/PlayerLevelBar';
import { DAILY_BONUS_COINS } from '../constants/gameConfig';
import { colors, spacing, touchTarget, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { usePlayerData } from '../context/PlayerDataContext';
import { MainTabParamList, RootStackParamList } from '../types';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigation>();
  const { data, claimDailyBonus, dailyBonusAvailable, dailyBonusTimeLeft } = usePlayerData();
  const { isGuest, profile, signOut } = useAuth();

  const hoursLeft = Math.floor(dailyBonusTimeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((dailyBonusTimeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Swish Streak</Text>
        <Text style={styles.coins}>🪙 {data.totalCoins}</Text>
      </View>

      <PlayerLevelBar level={data.playerLevel} totalXP={data.totalXP} />

      {!isGuest && profile && (
        <Text style={styles.welcome}>Welcome, {profile.displayName}!</Text>
      )}
      {isGuest && <Text style={styles.guestNote}>Playing as Guest — sign in to compete online</Text>}

      <View style={styles.buttons}>
        <Pressable
          style={styles.playButton}
          onPress={() => navigation.navigate('Game', { mode: 'arcade' })}
        >
          <Text style={styles.playText}>🏀 Play Arcade</Text>
          <Text style={styles.playSubtext}>Endless run — 3 misses ends it</Text>
        </Pressable>

        <Pressable
          style={[styles.playButton, styles.campaignButton]}
          onPress={() => navigation.navigate('Map')}
        >
          <Text style={styles.playText}>🗺️ Campaign Map</Text>
          <Text style={styles.playSubtext}>30 levels with stars to earn</Text>
        </Pressable>

        <Pressable
          style={[styles.dailyButton, !dailyBonusAvailable && styles.dailyDisabled]}
          onPress={() => claimDailyBonus()}
          disabled={!dailyBonusAvailable}
        >
          <Text style={styles.dailyText}>
            {dailyBonusAvailable
              ? `Claim Daily Bonus (+${DAILY_BONUS_COINS} coins)`
              : `Next bonus in ${hoursLeft}h ${minutesLeft}m`}
          </Text>
        </Pressable>

        {!isGuest && (
          <Pressable style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.stats}>
        <Text style={styles.statLabel}>Best Arcade Score</Text>
        <Text style={styles.statValue}>{data.arcadeBest.score}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  coins: {
    ...typography.heading,
    color: colors.accent,
  },
  welcome: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  guestNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  buttons: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  playButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    minHeight: touchTarget.minHeight * 2,
    justifyContent: 'center',
  },
  campaignButton: {
    backgroundColor: colors.secondary,
  },
  playText: {
    ...typography.heading,
    color: '#fff',
  },
  playSubtext: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  dailyButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    minHeight: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  dailyDisabled: {
    opacity: 0.6,
  },
  dailyText: {
    fontWeight: '700',
    color: colors.text,
  },
  signOutButton: {
    minHeight: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: colors.error,
    fontWeight: '600',
  },
  stats: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.heading,
    color: colors.primary,
  },
});
