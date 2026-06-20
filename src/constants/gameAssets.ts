import { ImageSourcePropType } from 'react-native';

/** Default sprite paths — referenced by shop catalog and fallbacks. */
export const GAME_ASSETS = {
  background: {
    default: require('../../assets/images/background/bg_default.png') as ImageSourcePropType,
  },
  ball: {
    classic: require('../../assets/images/ball/ball_classic.png') as ImageSourcePropType,
  },
  hoop: {
    backboardClassic: require('../../assets/images/hoop/backboard_classic.png') as ImageSourcePropType,
    rimNetClassic: require('../../assets/images/hoop/rim_net_classic.png') as ImageSourcePropType,
  },
  fx: {
    sparkle: require('../../assets/images/fx/sparkle.png') as ImageSourcePropType,
    comboBadge: require('../../assets/images/fx/combo_badge.png') as ImageSourcePropType,
  },
} as const;

export function resolveBallImage(imageSource?: ImageSourcePropType): ImageSourcePropType | undefined {
  return imageSource;
}

export function resolveBackgroundImage(imageSource?: ImageSourcePropType): ImageSourcePropType | undefined {
  return imageSource;
}

export function resolveBackboardImages(
  backboardImage?: ImageSourcePropType,
  rimNetImage?: ImageSourcePropType
): { board?: ImageSourcePropType; rimNet?: ImageSourcePropType } {
  return {
    board: backboardImage,
    rimNet: rimNetImage,
  };
}
