import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { FACEBOOK_APP_ID, GOOGLE_WEB_CLIENT_ID } from '../config/firebase';
import { canUseFacebookAuth, canUseGoogleAuth } from '../services/authService';
import { colors, spacing, touchTarget, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

interface SignInPromptProps {
  /** What the user gets by signing in, e.g. "join playoff brackets". */
  message: string;
}

/**
 * Reusable "sign in to unlock this" block with real Google/Facebook buttons.
 * Since guests are signed in anonymously (continueAsGuest), this links the
 * anonymous account to a real provider so progress carries over.
 */
export function SignInPrompt({ message }: SignInPromptProps) {
  const { linkGoogleAccount, linkFacebookAccount } = useAuth();
  const [linking, setLinking] = useState(false);

  const [gReq, gRes, gPrompt] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_WEB_CLIENT_ID,
  });
  const [fReq, fRes, fPrompt] = Facebook.useAuthRequest({ clientId: FACEBOOK_APP_ID });

  useEffect(() => {
    const idToken = gRes?.type === 'success' ? gRes.authentication?.idToken : undefined;
    if (!idToken) return;
    setLinking(true);
    linkGoogleAccount(idToken)
      .then(() => Alert.alert('Signed in', 'Your progress is now saved to your Google account.'))
      .catch((e) => Alert.alert('Sign-in failed', e instanceof Error ? e.message : String(e)))
      .finally(() => setLinking(false));
  }, [gRes, linkGoogleAccount]);

  useEffect(() => {
    const accessToken = fRes?.type === 'success' ? fRes.authentication?.accessToken : undefined;
    if (!accessToken) return;
    setLinking(true);
    linkFacebookAccount(accessToken)
      .then(() => Alert.alert('Signed in', 'Your progress is now saved to your Facebook account.'))
      .catch((e) => Alert.alert('Sign-in failed', e instanceof Error ? e.message : String(e)))
      .finally(() => setLinking(false));
  }, [fRes, linkFacebookAccount]);

  const hasGoogle = canUseGoogleAuth();
  const hasFacebook = canUseFacebookAuth();

  return (
    <View style={styles.card}>
      <Text style={styles.message}>Sign in to {message}</Text>
      {linking ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
      ) : (
        <View style={styles.buttonRow}>
          {hasGoogle && (
            <Pressable style={styles.button} disabled={!gReq} onPress={() => gPrompt()}>
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </Pressable>
          )}
          {hasFacebook && (
            <Pressable style={[styles.button, styles.facebookButton]} disabled={!fReq} onPress={() => fPrompt()}>
              <Text style={styles.buttonText}>Sign in with Facebook</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  buttonRow: {
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookButton: {
    backgroundColor: '#3F51B5',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
