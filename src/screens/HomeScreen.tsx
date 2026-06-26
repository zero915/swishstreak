import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlayerLevelBar } from '../components/PlayerLevelBar';
import { SignInPrompt } from '../components/SignInPrompt';
import { DAILY_BONUS_COINS, TOURNAMENT_ENTRY_FEE } from '../constants/gameConfig';
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
  const { isGuest, isAnonymous, profile, signOut, continueAsGuest } = useAuth();
  const [enablingOnline, setEnablingOnline] = useState(false);

  const hoursLeft = Math.floor(dailyBonusTimeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((dailyBonusTimeLeft % (1000 * 60 * 60)) / (1000 * 60));

  const enableOnlinePlay = async () => {
    setEnablingOnline(true);
    try {
      await continueAsGuest();
    } catch (e) {
      Alert.alert(
        'Online play unavailable',
        'Enable Anonymous sign-in in Firebase Console → Authentication → Sign-in method, then try again.\n\n' +
          (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setEnablingOnline(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.appTitle}>Swish Streak</Text>

        {/* Account / progress card */}
        <View style={styles.accountCard}>
          <View style={styles.accountRow}>
            <View style={styles.accountInfo}>
              {!isGuest && profile ? (
                <Text style={styles.welcome}>Welcome, {profile.displayName}</Text>
              ) : (
                <Text style={styles.welcome}>Playing as Guest</Text>
              )}
              <Text style={styles.coins}>🪙 {data.totalCoins} coins</Text>
            </View>
            {!isGuest && (
              <Pressable style={styles.signOutButton} onPress={signOut} hitSlop={8}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            )}
          </View>
          <PlayerLevelBar level={data.playerLevel} totalXP={data.totalXP} />
          {isGuest && !isAnonymous && (
            <Pressable style={styles.enableOnline} onPress={enableOnlinePlay} disabled={enablingOnline}>
              {enablingOnline ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.enableOnlineText}>Play anonymously online (1v1 & tournaments)</Text>
              )}
            </Pressable>
          )}
          {(isGuest || isAnonymous) && (
            <SignInPrompt message="save your progress and unlock 1v1, tournaments, and friends." />
          )}
        </View>

        {/* Primary CTA */}
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Game', { mode: 'arcade' })}
        >
          <Text style={styles.primaryText}>🏀 Play Arcade</Text>
          <Text style={styles.primarySubtext}>Endless run — 3 misses ends it</Text>
        </Pressable>

        {/* Secondary modes */}
        <View style={styles.modeGrid}>
          <Pressable
            style={[styles.modeTile, styles.versusTile]}
            onPress={() => navigation.navigate('Versus')}
          >
            <Text style={styles.modeEmoji}>⚔️</Text>
            <Text style={styles.modeTitle}>1v1 Online</Text>
            <Text style={styles.modeSubtitle}>Bet 10–100 coins</Text>
          </Pressable>

          <Pressable
            style={[styles.modeTile, styles.tournamentTile]}
            onPress={() => navigation.navigate('Tournament')}
          >
            <Text style={styles.modeEmoji}>🏆</Text>
            <Text style={styles.modeTitle}>Tournament</Text>
            <Text style={styles.modeSubtitle}>{TOURNAMENT_ENTRY_FEE} coins to join</Text>
          </Pressable>

          <Pressable
            style={[styles.modeTile, styles.campaignTile]}
            onPress={() => navigation.navigate('Map')}
          >
            <Text style={styles.modeEmoji}>🗺️</Text>
            <Text style={styles.modeTitle}>Campaign Map</Text>
            <Text style={styles.modeSubtitle}>Stars to earn</Text>
          </Pressable>
        </View>

        {/* Daily bonus + stats */}
        <View style={styles.bottomCard}>
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

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Best Arcade Score</Text>
            <Text style={styles.statValue}>{data.arcadeBest.score}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  appTitle: {
    ...typography.title,
    color: colors.text,
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accountInfo: {
    gap: spacing.xs,
  },
  enableOnline: {
    backgroundColor: colors.background,
    borderRadius: 10,
    minHeight: touchTarget.minHeight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableOnlineText: {
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  welcome: {
    ...typography.heading,
    color: colors.text,
  },
  coins: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '700',
  },
  signOutButton: {
    minHeight: touchTarget.minHeight,
    minWidth: touchTarget.minWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: spacing.lg,
    minHeight: touchTarget.minHeight * 2,
    justifyContent: 'center',
  },
  primaryText: {
    ...typography.title,
    color: '#fff',
  },
  primarySubtext: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xs,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeTile: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.sm,
    minHeight: touchTarget.minHeight * 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  versusTile: {
    backgroundColor: '#5C6BC0',
  },
  tournamentTile: {
    backgroundColor: '#8E24AA',
  },
  campaignTile: {
    backgroundColor: colors.secondary,
  },
  modeEmoji: {
    fontSize: 22,
  },
  modeTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  modeSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    textAlign: 'center',
  },
  bottomCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
