import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

/**
 * Captures the off-screen ScoreCard view to a PNG and opens the share sheet.
 *
 * react-native-view-shot is a native module — it works in dev/standalone builds
 * (expo run:android, EAS/Gradle), but NOT in Expo Go. So on any failure (e.g. when
 * running inside Expo Go) we fall back to the plain text share.
 */
export async function shareScoreCardImage(ref: RefObject<View | null>, fallback: () => Promise<void>): Promise<void> {
  try {
    if (!ref.current) return fallback();
    const uri = await captureRef(ref as RefObject<View>, { format: 'png', quality: 1, result: 'tmpfile' });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Swish Streak score' });
    } else {
      await fallback();
    }
  } catch {
    await fallback();
  }
}
