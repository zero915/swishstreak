import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  User,
  linkWithCredential,
  signInAnonymously,
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

// Link a real provider onto the current (anonymous) user so progress is kept.
export async function linkGoogle(idToken: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) throw new Error('Not signed in');
  const result = await linkWithCredential(auth.currentUser, GoogleAuthProvider.credential(idToken));
  return result.user;
}

export async function linkFacebook(accessToken: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) throw new Error('Not signed in');
  const result = await linkWithCredential(auth.currentUser, FacebookAuthProvider.credential(accessToken));
  return result.user;
}

export async function signInAsGuest(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured');
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) await firebaseSignOut(auth);
}

/** Anonymous auth only needs Firebase config (no Google/Facebook client IDs). */
export function canUseAnonymousAuth(): boolean {
  return isFirebaseConfigured;
}

export function canUseGoogleAuth(): boolean {
  return isFirebaseConfigured && !!GOOGLE_WEB_CLIENT_ID;
}

export function canUseFacebookAuth(): boolean {
  return isFirebaseConfigured && !!FACEBOOK_APP_ID;
}

export function canUseSocialAuth(): boolean {
  return canUseGoogleAuth() || canUseFacebookAuth();
}
