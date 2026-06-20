import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  User,
  signInWithCredential,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { FACEBOOK_APP_ID, GOOGLE_WEB_CLIENT_ID, getFirebaseAuth, isFirebaseConfigured } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  return Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_WEB_CLIENT_ID,
  });
}

export function useFacebookAuth() {
  return Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
  });
}

export async function signInWithGoogle(idToken: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured');
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function signInWithFacebook(accessToken: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured');
  const credential = FacebookAuthProvider.credential(accessToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) await firebaseSignOut(auth);
}

export function canUseSocialAuth(): boolean {
  return isFirebaseConfigured;
}
