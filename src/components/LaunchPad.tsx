import { StyleSheet, View } from 'react-native';

interface LaunchPadProps {
  x: number;
  y: number;
  size?: number;
}

export function LaunchPad({ x, y, size = 120 }: LaunchPadProps) {
  const padSize = size;

  return (
    <View
      style={[
        styles.container,
        {
          left: x - padSize / 2,
          top: y - padSize / 2,
          width: padSize,
          height: padSize,
        },
      ]}
    >
      <View style={styles.outerRing} />
      <View style={styles.innerPad} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
  },
  innerPad: {
    width: '72%',
    height: '72%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
