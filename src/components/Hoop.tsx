import { useEffect, type ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { RIM_INNER_FRACTION } from '../constants/gameConfig';
import { getBackboardTheme } from '../constants/backboardThemes';
import { GAME_ASSETS } from '../constants/gameAssets';
import { getShopItem } from '../constants/shopCatalog';
import { BackboardFace } from './BackboardFace';
import { getContainerTop, getHoopMetrics } from '../utils/hoopGeometry';
import { getHoopSpriteLayout, getRimNetClipHeights, RIM_NET_LIP_RATIO } from '../utils/hoopSpriteLayout';

interface HoopProps {
  x: number;
  y: number;
  rimWidth: number;
  backboardId: string;
  showPerfectWindow?: boolean;
  celebrating?: boolean;
  rimPulse?: boolean;
  /** Rendered between backboard and rim/net — e.g. the ball. */
  children?: ReactNode;
}

function ProceduralBackboard({
  boardWidth,
  boardHeight,
}: {
  boardWidth: number;
  boardHeight: number;
}) {
  return (
    <LinearGradient
      colors={['#FFB74D', '#FF9800', '#F57C00']}
      style={[styles.backboard, { width: boardWidth, height: boardHeight }]}
    >
      <View style={styles.boardFrame} />
      <View style={styles.boardTarget} />
    </LinearGradient>
  );
}

function ProceduralRimOnly({
  rimWidth,
  rimHeight,
  showPerfectWindow,
  rimGlowStyle,
}: {
  rimWidth: number;
  rimHeight: number;
  showPerfectWindow: boolean;
  rimGlowStyle: ReturnType<typeof useAnimatedStyle>;
}) {
  return (
    <View style={[styles.rimRow, { width: rimWidth + 4 }]}>
      <Animated.View
        style={[
          styles.rimGlow,
          { width: rimWidth + 14, height: rimHeight + 14, borderRadius: (rimHeight + 14) / 2 },
          rimGlowStyle,
        ]}
      />
      <LinearGradient
        colors={['#FF7043', '#E64A19', '#BF360C']}
        style={[
          styles.rim,
          {
            width: rimWidth,
            height: rimHeight,
            borderRadius: rimHeight / 2,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.rimOpening,
          {
            width: rimWidth * RIM_INNER_FRACTION,
            height: rimHeight * 0.55,
            borderRadius: rimHeight * 0.3,
            top: rimHeight * 0.22,
          },
        ]}
      />
      {showPerfectWindow && (
        <View style={[styles.perfectRing, { width: rimWidth * 0.6, height: rimHeight + 6 }]} />
      )}
    </View>
  );
}

function ProceduralNetOnly({
  rimWidth,
  netHeight,
  netStyle,
}: {
  rimWidth: number;
  netHeight: number;
  netStyle: ReturnType<typeof useAnimatedStyle>;
}) {
  return (
    <Animated.View
      style={[styles.net, styles.netOverlay, { width: rimWidth * RIM_INNER_FRACTION * 0.95, height: netHeight }, netStyle]}
    >
      {Array.from({ length: 7 }).map((_, i) => (
        <View
          key={i}
          style={[styles.netLine, { left: `${(i / 6) * 100}%`, height: '100%' }]}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <View key={`h${i}`} style={[styles.netLineH, { top: `${20 + i * 20}%` }]} />
      ))}
    </Animated.View>
  );
}

export function Hoop({
  x,
  y: rimCenterY,
  rimWidth,
  backboardId,
  showPerfectWindow = false,
  celebrating = false,
  rimPulse = false,
  children,
}: HoopProps) {
  const shopItem = getShopItem(backboardId);
  const boardImage = shopItem?.backboardImage;
  const rimNetImage = shopItem?.rimNetImage ?? GAME_ASSETS.hoop.rimNetClassic;
  const boardTheme = getBackboardTheme(backboardId);
  const useBoardSprite = Boolean(boardImage);
  const useSprites = Boolean(rimNetImage);

  const m = getHoopMetrics(rimWidth);
  const sprite = getHoopSpriteLayout(rimWidth);
  const containerTop = getContainerTop(rimCenterY, rimWidth);
  const containerWidth = useSprites ? sprite.containerWidth : m.boardWidth;
  const rimLipOffsetY = m.rimCenterOffsetY - m.rimHeight / 2;
  const rimNetTop = useSprites ? sprite.rimNetTop : rimLipOffsetY;
  const rimNetHeight = useSprites ? sprite.rimNetHeight : m.rimHeight + m.netHeight + 6;
  const rimNetWidth = useSprites ? sprite.rimNetWidth : rimWidth;
  const rimClip = useSprites ? getRimNetClipHeights(rimWidth) : null;
  const proceduralNetTop = containerTop + rimLipOffsetY + m.rimHeight + 3;

  const celebrateScale = useSharedValue(1);
  const rimFlash = useSharedValue(0);
  const netStretch = useSharedValue(0);
  const boardGlow = useSharedValue(0);

  useEffect(() => {
    if (celebrating) {
      celebrateScale.value = withSequence(
        withTiming(1.04, { duration: 120, easing: Easing.out(Easing.back(1.6)) }),
        withTiming(1, { duration: 200 })
      );
      netStretch.value = withSequence(
        withTiming(1, { duration: 160 }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.quad) })
      );
      boardGlow.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(350, withTiming(0, { duration: 300 }))
      );
    }
  }, [celebrating, celebrateScale, netStretch, boardGlow]);

  useEffect(() => {
    if (rimPulse) {
      rimFlash.value = 1;
      rimFlash.value = withTiming(0, { duration: 180 });
    }
  }, [rimPulse, rimFlash]);

  const netStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: 1 + netStretch.value * 0.4 },
      { scaleX: 1 + netStretch.value * 0.15 },
    ],
  }));

  const boardGlowStyle = useAnimatedStyle(() => ({
    opacity: boardGlow.value * 0.7,
  }));

  const rimGlowStyle = useAnimatedStyle(() => ({
    opacity: rimFlash.value * 0.8,
  }));

  const boardLayerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrateScale.value }],
  }));

  const rimLayerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrateScale.value }],
  }));

  const netLayerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrateScale.value }],
  }));

  const boardContainerPos = {
    top: containerTop,
    left: x - containerWidth / 2,
    width: containerWidth,
  };

  const rimContainerPos = {
    top: containerTop + rimNetTop,
    left: x - rimNetWidth / 2,
    width: rimNetWidth,
  };

  return (
    <>
      <Animated.View
        style={[styles.container, styles.hoopBoardLayer, boardContainerPos, boardLayerStyle]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            styles.boardGlow,
            {
              width: (useSprites ? sprite.boardVisualWidth : m.boardWidth) + 12,
              height: (useSprites ? sprite.boardVisualHeight : m.boardHeight) + 12,
              top: useSprites ? sprite.boardTop - 4 : -4,
            },
            boardGlowStyle,
          ]}
        />

        {useBoardSprite ? (
          <Image
            source={boardImage}
            style={{
              position: 'absolute',
              top: sprite.boardTop,
              width: sprite.boardVisualWidth,
              height: sprite.boardVisualHeight,
              alignSelf: 'center',
            }}
            resizeMode="stretch"
          />
        ) : boardTheme ? (
          <BackboardFace
            width={useSprites ? sprite.boardVisualWidth : m.boardWidth}
            height={useSprites ? sprite.boardVisualHeight : m.boardHeight}
            theme={boardTheme}
            style={{
              position: 'absolute',
              top: useSprites ? sprite.boardTop : 0,
              alignSelf: 'center',
            }}
          />
        ) : (
          <ProceduralBackboard boardWidth={m.boardWidth} boardHeight={m.boardHeight} />
        )}
      </Animated.View>

      <Animated.View
        style={[styles.container, styles.hoopRimLayer, rimContainerPos, rimLayerStyle]}
        pointerEvents="none"
      >
        {useSprites && rimClip ? (
          <View
            style={[
              styles.rimNetSpriteWrap,
              {
                width: rimNetWidth,
                height: rimClip.rimBackClipH,
                overflow: 'hidden',
              },
            ]}
          >
            <Animated.View
              style={[
                styles.rimGlow,
                {
                  width: rimNetWidth + 14,
                  height: m.rimHeight + 14,
                  borderRadius: (m.rimHeight + 14) / 2,
                  top: rimNetHeight * RIM_NET_LIP_RATIO - (m.rimHeight + 14) / 2,
                },
                rimGlowStyle,
              ]}
            />
            <Image source={rimNetImage} style={{ width: rimNetWidth, height: rimNetHeight }} resizeMode="stretch" />
            {showPerfectWindow && (
              <View
                style={[
                  styles.perfectRing,
                  {
                    width: rimNetWidth * 0.6,
                    height: m.rimHeight + 6,
                    top: rimNetHeight * RIM_NET_LIP_RATIO - (m.rimHeight + 6) / 2,
                  },
                ]}
              />
            )}
          </View>
        ) : (
          <ProceduralRimOnly
            rimWidth={rimWidth}
            rimHeight={m.rimHeight}
            showPerfectWindow={showPerfectWindow}
            rimGlowStyle={rimGlowStyle}
          />
        )}
      </Animated.View>

      {children}

      <Animated.View
        style={[
          styles.container,
          styles.hoopNetLayer,
          useSprites && rimClip
            ? {
                top: containerTop + rimClip.netFrontOffsetY,
                left: x - rimNetWidth / 2,
                width: rimNetWidth,
                height: rimClip.netFrontHeight,
                overflow: 'hidden',
              }
            : {
                top: proceduralNetTop,
                left: x - (rimWidth * RIM_INNER_FRACTION * 0.95) / 2,
                width: rimWidth * RIM_INNER_FRACTION * 0.95,
                height: m.netHeight,
              },
          netLayerStyle,
        ]}
        pointerEvents="none"
      >
        {useSprites && rimClip ? (
          <Animated.View style={netStyle}>
            <Image
              source={rimNetImage}
              style={{
                width: rimNetWidth,
                height: rimNetHeight,
                marginTop: -rimClip.rimBackClipH + 2,
              }}
              resizeMode="stretch"
            />
          </Animated.View>
        ) : (
          <ProceduralNetOnly rimWidth={rimWidth} netHeight={m.netHeight} netStyle={netStyle} />
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  hoopBoardLayer: {
    zIndex: 4,
    elevation: 4,
  },
  hoopRimLayer: {
    zIndex: 6,
    elevation: 6,
  },
  hoopNetLayer: {
    zIndex: 12,
    elevation: 12,
  },
  boardGlow: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: '#FFD54F',
  },
  backboard: {
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  boardFrame: {
    position: 'absolute',
    top: 7,
    left: 7,
    right: 7,
    bottom: 7,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  boardTarget: {
    width: '40%',
    height: '36%',
    borderRadius: 3,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  rimNetSpriteWrap: {
    alignItems: 'center',
  },
  rimRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rimGlow: {
    position: 'absolute',
    backgroundColor: '#FFEB3B',
  },
  rim: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  rimOpening: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  perfectRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#FFEB3B',
    backgroundColor: 'rgba(255,235,59,0.35)',
  },
  net: {
    marginTop: 3,
    position: 'relative',
  },
  netOverlay: {
    marginTop: 0,
  },
  netLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginLeft: -1,
  },
  netLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
