import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { canUseSocialAuth, signInWithFacebook, signInWithGoogle, signOut as authSignOut } from '../services/authService';
import { createOrUpdateUserProfile } from '../services/userService';
import { getFirebaseAuth, isFirebaseConfigured } from '../config/firebase';
import { UserProfile } from '../types';
import { getHasSeenLogin, getIsGuest, loadGuestProgress, setHasSeenLogin, setIsGuest } from '../utils/storage';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isGuest: boolean;
  isLoading: boolean;
  hasSeenLogin: boolean;
  isFirebaseReady: boolean;
  signInGoogle: (idToken: string) => Promise<void>;
  signInFacebook: (accessToken: string) => Promise<void>;
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
        setIsLoading(false);
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

  const continueAsGuest = useCallback(async () => {
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
      isLoading,
      hasSeenLogin,
      isFirebaseReady: isFirebaseConfigured && canUseSocialAuth(),
      signInGoogle,
      signInFacebook,
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
