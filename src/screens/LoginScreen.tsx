import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { colors, spacing, touchTarget, typography } from '../constants/theme';
import { FACEBOOK_APP_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, isFirebaseConfigured } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_REDIRECT_URI, canUseFacebookAuth, canUseGoogleAuth } from '../services/authService';

export function LoginScreen() {
  const { signInGoogle, signInFacebook, continueAsGuest, isFirebaseReady, isLoading, user } = useAuth();
  const [busy, setBusy] = useState(false);

  const [googleRequest, googleResponse, promptGoogle] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: GOOGLE_REDIRECT_URI,
  });

  const [fbRequest, fbResponse, promptFacebook] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        setBusy(true);
        signInGoogle(idToken)
          .catch((e) => Alert.alert('Login Failed', e.message))
          .finally(() => setBusy(false));
      }
    }
  }, [googleResponse, signInGoogle]);

  useEffect(() => {
    if (fbResponse?.type === 'success') {
      const accessToken = fbResponse.authentication?.accessToken;
      if (accessToken) {
        setBusy(true);
        signInFacebook(accessToken)
          .catch((e) => Alert.alert('Login Failed', e.message))
          .finally(() => setBusy(false));
      }
    }
  }, [fbResponse, signInFacebook]);

  if (isLoading || user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.signingIn}>Signing you in…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Swish Streak</Text>
      <Text style={styles.subtitle}>Swipe. Shoot. Streak.</Text>

      <View style={styles.buttons}>
        {isFirebaseReady && (
          <>
            {canUseGoogleAuth() && (
              <Pressable
                style={[styles.button, styles.googleButton]}
                onPress={() => promptGoogle()}
                disabled={!googleRequest || busy}
              >
                <Text style={styles.buttonText}>Continue with Google</Text>
              </Pressable>
            )}

            {canUseFacebookAuth() && (
              <Pressable
                style={[styles.button, styles.facebookButton]}
                onPress={() => promptFacebook()}
                disabled={!fbRequest || busy}
              >
                <Text style={styles.buttonText}>Continue with Facebook</Text>
              </Pressable>
            )}
          </>
        )}
        {!isFirebaseConfigured && (
          <Text style={styles.configNote}>
            Firebase not configured. Add keys to .env to enable login.
          </Text>
        )}

        <Pressable
          style={styles.guestLink}
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await continueAsGuest();
            } catch (e) {
              Alert.alert(
                'Guest play unavailable',
                'Enable Anonymous sign-in in Firebase Console → Authentication → Sign-in method, then try again.\n\n' +
                  (e instanceof Error ? e.message : String(e))
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <Text style={styles.guestText}>Play as Guest</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  signingIn: {
    ...typography.body,
    color: colors.textSecondary,
  },
  title: {
    ...typography.title,
    fontSize: 36,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl * 2,
  },
  buttons: {
    gap: spacing.md,
  },
  button: {
    minHeight: touchTarget.minHeight + 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  configNote: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  guestLink: {
    minHeight: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  guestText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});
