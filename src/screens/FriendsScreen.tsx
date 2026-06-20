import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FriendCard } from '../components/FriendCard';
import { colors, spacing, touchTarget, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { usePlayerData } from '../context/PlayerDataContext';
import { useFriends } from '../hooks/useFriends';
import { acceptInviteCode, shareInvite } from '../services/friendsService';
import { getFurthestLevel, getTotalStars } from '../constants/campaignLevels';

export function FriendsScreen() {
  const { isGuest, user, profile } = useAuth();
  const { data } = usePlayerData();
  const { friends, loading, refresh, inviteCode } = useFriends();
  const [codeInput, setCodeInput] = useState('');
  const [accepting, setAccepting] = useState(false);

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.prompt}>Sign in to invite friends and compare stats.</Text>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    if (!inviteCode || !profile) return;
    await shareInvite(inviteCode, profile.displayName);
  };

  const handleAccept = async () => {
    if (!user || !codeInput.trim()) return;
    setAccepting(true);
    try {
      const result = await acceptInviteCode(user.uid, codeInput.trim());
      Alert.alert(result.success ? 'Success' : 'Error', result.message);
      if (result.success) {
        setCodeInput('');
        refresh();
      }
    } finally {
      setAccepting(false);
    }
  };

  const myStats = {
    level: data.playerLevel,
    furthest: getFurthestLevel(data.campaignProgress),
    stars: getTotalStars(data.campaignProgress),
    arcadeBest: data.arcadeBest.score,
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Friends</Text>

      <View style={styles.myStats}>
        <Text style={styles.statsTitle}>Your Stats</Text>
        <Text style={styles.statsText}>
          Lv {myStats.level} · Campaign Lv {myStats.furthest} · {myStats.stars}★ · Best {myStats.arcadeBest}
        </Text>
      </View>

      <Pressable style={styles.inviteButton} onPress={handleShare}>
        <Text style={styles.inviteText}>Invite Friends {inviteCode ? `(Code: ${inviteCode})` : ''}</Text>
      </Pressable>

      <View style={styles.acceptRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter invite code"
          value={codeInput}
          onChangeText={setCodeInput}
          autoCapitalize="characters"
          maxLength={6}
        />
        <Pressable
          style={[styles.acceptButton, accepting && styles.disabled]}
          onPress={handleAccept}
          disabled={accepting}
        >
          <Text style={styles.acceptText}>{accepting ? '...' : 'Add'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView style={styles.list}>
          {friends.length === 0 ? (
            <Text style={styles.empty}>No friends yet. Share your invite code!</Text>
          ) : (
            friends.map((friend) => <FriendCard key={friend.uid} friend={friend} />)
          )}
        </ScrollView>
      )}
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
  prompt: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  myStats: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  statsTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statsText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inviteButton: {
    backgroundColor: colors.primary,
    minHeight: touchTarget.minHeight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  inviteText: {
    color: '#fff',
    fontWeight: '700',
  },
  acceptRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.minHeight,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  acceptButton: {
    backgroundColor: colors.secondary,
    minWidth: 72,
    minHeight: touchTarget.minHeight,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    color: '#fff',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  list: {
    flex: 1,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
