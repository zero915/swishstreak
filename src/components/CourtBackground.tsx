import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getShopItem } from '../constants/shopCatalog';

interface CourtBackgroundProps {
  backgroundId: string;
  courtWidth: number;
  courtHeight: number;
}

function Building({ left, width, height, color, top }: {
  left: number; width: number; height: number; color: string; top: number;
}) {
  return (
    <View style={[styles.building, { left, width, height, backgroundColor: color, top }]}>
      {Array.from({ length: Math.floor(height / 28) }).map((_, i) => (
        <View key={i} style={[styles.window, { top: 8 + i * 26 }]} />
      ))}
    </View>
  );
}

function ProceduralBackground({
  courtWidth,
  courtHeight,
  topColor,
  midColor,
}: {
  courtWidth: number;
  courtHeight: number;
  topColor: string;
  midColor: string;
}) {
  const floorTop = courtHeight * 0.68;
  const skylineTop = courtHeight * 0.22;

  return (
    <>
      <LinearGradient
        colors={[topColor, midColor, '#C5E8F7']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
      />
      {[0.1, 0.45, 0.72].map((pos, i) => (
        <View
          key={i}
          style={[
            styles.cloud,
            {
              top: courtHeight * (0.05 + i * 0.03),
              left: courtWidth * pos,
              transform: [{ scale: 0.7 + i * 0.15 }],
            },
          ]}
        />
      ))}
      <View style={[styles.skyline, { top: skylineTop, width: courtWidth }]}>
        <Building left={courtWidth * 0.05} width={50} height={90} color="#6BA3BE" top={30} />
        <Building left={courtWidth * 0.18} width={36} height={120} color="#5B93AE" top={0} />
        <Building left={courtWidth * 0.32} width={44} height={75} color="#7AB0C8" top={45} />
        <Building left={courtWidth * 0.55} width={40} height={110} color="#5B93AE" top={10} />
        <Building left={courtWidth * 0.72} width={52} height={85} color="#6BA3BE" top={35} />
        <View style={[styles.landmark, { left: courtWidth * 0.42, height: 140 }]} />
      </View>
      <LinearGradient
        colors={['#81C784', '#66BB6A']}
        style={[styles.floor, { top: floorTop, height: courtHeight - floorTop }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <LinearGradient
        colors={['#B0BEC5', '#90A4AE']}
        style={[styles.shootPad, { top: floorTop, height: courtHeight - floorTop }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />
    </>
  );
}

export function CourtBackground({ backgroundId, courtWidth, courtHeight }: CourtBackgroundProps) {
  const item = getShopItem(backgroundId);
  const bgImage = item?.imageSource;

  if (bgImage) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={bgImage}
          style={{ width: courtWidth, height: courtHeight }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <ProceduralBackground
        courtWidth={courtWidth}
        courtHeight={courtHeight}
        topColor={item?.secondaryColor ?? '#87CEEB'}
        midColor={item?.color ?? '#7EC8E3'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cloud: {
    position: 'absolute',
    width: 80,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 20,
  },
  skyline: {
    position: 'absolute',
    height: 160,
  },
  building: {
    position: 'absolute',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  window: {
    position: 'absolute',
    left: '20%',
    width: '60%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
  },
  landmark: {
    position: 'absolute',
    width: 28,
    backgroundColor: '#4A8FA8',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  shootPad: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0.55,
  },
});
