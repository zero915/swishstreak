import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  canUseSocialAuth,
  linkFacebook,
  linkGoogle,
  signInAsGuest,
  signInWithFacebook,
  signInWithGoogle,
  signOut as authSignOut,
} from '../services/authService';
import { createOrUpdateUserProfile } from '../services/userService';
import { getFirebaseAuth, isFirebaseConfigured } from '../config/firebase';
import { UserProfile } from '../types';
import { getHasSeenLogin, getIsGuest, loadGuestProgress, setHasSeenLogin, setIsGuest } from '../utils/storage';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isGuest: boolean;
  isAnonymous: boolean;
  isLoading: boolean;
  hasSeenLogin: boolean;
  isFirebaseReady: boolean;
  signInGoogle: (idToken: string) => Promise<void>;
  signInFacebook: (accessToken: string) => Promise<void>;
  linkGoogleAccount: (idToken: string) => Promise<void>;
  linkFacebookAccount: (accessToken: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGuest, setGuestFlag] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenLogin, setHasSeenLoginFlag] = useState(false);

  const refreshProfile = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) return;
    const localData = await loadGuestProgress();
    const userProfile = await createOrUpdateUserProfile(auth.currentUser, 'google', localData);
    setProfile(userProfile);
  }, []);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const [seen, guest] = await Promise.all([getHasSeenLogin(), getIsGuest()]);
      setHasSeenLoginFlag(seen);
      setGuestFlag(guest);

      const auth = getFirebaseAuth();
      if (!auth) {
        setIsLoading(false);
        return;
      }

      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        try {
          if (firebaseUser) {
            const localData = await loadGuestProgress();
            const provider = firebaseUser.providerData[0]?.providerId.includes('facebook')
              ? 'facebook'
              : 'google';
            const userProfile = await createOrUpdateUserProfile(firebaseUser, provider, localData);
            setProfile(userProfile);
            setGuestFlag(false);
            await Promise.all([setIsGuest(false), setHasSeenLogin()]);
            setHasSeenLoginFlag(true);
          } else if (guest) {
            setProfile(null);
          }
        } catch (e) {
          console.error('Failed to sync profile after sign-in:', e);
        } finally {
          setIsLoading(false);
        }
      });
    })();

    return () => unsub();
  }, []);

  const signInGoogle = useCallback(async (idToken: string) => {
    const firebaseUser = await signInWithGoogle(idToken);
    const localData = await loadGuestProgress();
    const userProfile = await createOrUpdateUserProfile(firebaseUser, 'google', localData);
    setUser(firebaseUser);
    setProfile(userProfile);
    setGuestFlag(false);
    await Promise.all([setIsGuest(false), setHasSeenLogin()]);
    setHasSeenLoginFlag(true);
  }, []);

  const signInFacebook = useCallback(async (accessToken: string) => {
    const firebaseUser = await signInWithFacebook(accessToken);
    const localData = await loadGuestProgress();
    const userProfile = await createOrUpdateUserProfile(firebaseUser, 'facebook', localData);
    setUser(firebaseUser);
    setProfile(userProfile);
    setGuestFlag(false);
    await Promise.all([setIsGuest(false), setHasSeenLogin()]);
    setHasSeenLoginFlag(true);
  }, []);

  const linkGoogleAccount = useCallback(async (idToken: string) => {
    const linked = await linkGoogle(idToken);
    setUser(linked);
    await refreshProfile();
  }, [refreshProfile]);

  const linkFacebookAccount = useCallback(async (accessToken: string) => {
    const linked = await linkFacebook(accessToken);
    setUser(linked);
    await refreshProfile();
  }, [refreshProfile]);

  const continueAsGuest = useCallback(async () => {
    // Prefer a real (anonymous) Firebase account so guests get a verifiable token
    // and can play versus/tournaments. onAuthStateChanged sets user/profile/flags.
    // Throws if Anonymous sign-in is disabled in Firebase — callers surface that.
    if (isFirebaseConfigured) {
      await signInAsGuest();
      return;
    }
    setGuestFlag(true);
    setUser(null);
    setProfile(null);
    await Promise.all([setIsGuest(true), setHasSeenLogin()]);
    setHasSeenLoginFlag(true);
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
    setProfile(null);
    setGuestFlag(true);
    await setIsGuest(true);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      isGuest,
      isAnonymous: !!user?.isAnonymous,
      isLoading,
      hasSeenLogin,
      isFirebaseReady: isFirebaseConfigured && canUseSocialAuth(),
      signInGoogle,
      signInFacebook,
      linkGoogleAccount,
      linkFacebookAccount,
      continueAsGuest,
      signOut,
      setProfile,
      refreshProfile,
    }),
    [
      user,
      profile,
      isGuest,
      isLoading,
      hasSeenLogin,
      signInGoogle,
      signInFacebook,
      linkGoogleAccount,
      linkFacebookAccount,
      continueAsGuest,
      signOut,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
