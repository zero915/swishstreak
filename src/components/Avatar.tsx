import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

interface AvatarProps {
  displayName: string;
  photoURL?: string;
  size?: number;
  backgroundColor?: string;
}

/** Renders the user's social photo when available, otherwise an initials placeholder. */
export function Avatar({ displayName, photoURL, size = 36, backgroundColor = colors.primary }: AvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (photoURL) {
    return <Image source={{ uri: photoURL }} style={[styles.image, dimensionStyle]} />;
  }

  return (
    <View style={[styles.placeholder, dimensionStyle, { backgroundColor }]}>
      <Text style={[styles.initial, { fontSize: size * 0.45 }]}>{displayName.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surface,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#fff',
    fontWeight: '700',
  },
});
