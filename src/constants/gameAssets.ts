import { ImageSourcePropType } from 'react-native';

/** Default sprite paths — referenced by shop catalog and fallbacks. */
export const GAME_ASSETS = {
  background: {
    default: require('../../assets/images/background/bg_default.png') as ImageSourcePropType,
  },
  ball: {
    classic: require('../../assets/images/ball/ball_classic.png') as ImageSourcePropType,
    ice: require('../../assets/images/ball/ball_ice.png') as ImageSourcePropType,
    candy: require('../../assets/images/ball/ball_candy.png') as ImageSourcePropType,
    fire: require('../../assets/images/ball/ball_fire.png') as ImageSourcePropType,
    gold: require('../../assets/images/ball/ball_gold.png') as ImageSourcePropType,
    galaxy: require('../../assets/images/ball/ball_galaxy.png') as ImageSourcePropType,
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
    rimNet: rimNetImage ?? GAME_ASSETS.hoop.rimNetClassic,
  };
}
