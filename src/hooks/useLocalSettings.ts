import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@swishstreak/prefs';

export interface LocalSettings {
  soundOn: boolean;
  hapticsOn: boolean;
  notificationsOn: boolean;
  displayName: string;
}

const DEFAULT: LocalSettings = { soundOn: true, hapticsOn: true, notificationsOn: true, displayName: '' };

/** Device-local preferences (sound/notifications + a display-name override). */
export function useLocalSettings() {
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && mounted) setSettings({ ...DEFAULT, ...(JSON.parse(raw) as Partial<LocalSettings>) });
      } catch {
        /* keep defaults */
      } finally {
        if (mounted) setIsLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
    }, 250);
  }, [settings, isLoaded]);

  const update = useCallback((patch: Partial<LocalSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  return { settings, isLoaded, update };
}
