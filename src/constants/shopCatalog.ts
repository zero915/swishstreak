import { ShopItem } from '../types';
import { GAME_ASSETS } from './gameAssets';

const RIM_NET = GAME_ASSETS.hoop.rimNetClassic;

export const SHOP_CATALOG: ShopItem[] = [
  // —— Balls (galaxy = most expensive) ——
  {
    id: 'ball-classic',
    category: 'balls',
    name: 'Classic Orange',
    cost: 0,
    color: '#FF6B35',
    defaultUnlocked: true,
    imageSource: GAME_ASSETS.ball.classic,
  },
  {
    id: 'ball-ice',
    category: 'balls',
    name: 'Blizzard Ice',
    cost: 75,
    color: '#4FC3F7',
    imageSource: GAME_ASSETS.ball.ice,
  },
  {
    id: 'ball-candy',
    category: 'balls',
    name: 'Candy Swirl',
    cost: 150,
    color: '#F48FB1',
    imageSource: GAME_ASSETS.ball.candy,
  },
  {
    id: 'ball-fire',
    category: 'balls',
    name: 'Flame Ball',
    cost: 275,
    color: '#EF5350',
    imageSource: GAME_ASSETS.ball.fire,
  },
  {
    id: 'ball-gold',
    category: 'balls',
    name: 'Golden Legend',
    cost: 500,
    color: '#FFD54F',
    imageSource: GAME_ASSETS.ball.gold,
  },
  {
    id: 'ball-galaxy',
    category: 'balls',
    name: 'Galaxy Cosmic',
    cost: 950,
    color: '#7E57C2',
    imageSource: GAME_ASSETS.ball.galaxy,
  },

  // —— Backboards: basic = template color swaps ——
  {
    id: 'backboard-standard',
    category: 'backboards',
    name: 'Classic Orange',
    cost: 0,
    color: '#FF9800',
    defaultUnlocked: true,
    backboardImage: GAME_ASSETS.hoop.backboardClassic,
    rimNetImage: RIM_NET,
  },
  {
    id: 'backboard-crimson',
    category: 'backboards',
    name: 'Crimson',
    cost: 45,
    color: '#E53935',
    rimNetImage: RIM_NET,
  },
  {
    id: 'backboard-neon',
    category: 'backboards',
    name: 'Neon Green',
    cost: 65,
    color: '#69F0AE',
    rimNetImage: RIM_NET,
  },
  {
    id: 'backboard-ocean',
    category: 'backboards',
    name: 'Ocean Blue',
    cost: 65,
    color: '#29B6F6',
    rimNetImage: RIM_NET,
  },
  {
    id: 'backboard-carbon',
    category: 'backboards',
    name: 'Carbon Steel',
    cost: 85,
    color: '#78909C',
    rimNetImage: RIM_NET,
  },
  {
    id: 'backboard-purple',
    category: 'backboards',
    name: 'Purple Glass',
    cost: 95,
    color: '#AB47BC',
    rimNetImage: RIM_NET,
  },

  // —— Backboards: premium = template + visual FX ——
  {
    id: 'backboard-stars',
    category: 'backboards',
    name: 'Starry Night',
    cost: 320,
    color: '#283593',
    rimNetImage: RIM_NET,
  },
  {
    id: 'backboard-blizzard',
    category: 'backboards',
    name: 'Blizzard Frost',
    cost: 380,
    color: '#B3E5FC',
    rimNetImage: RIM_NET,
  },
  {
    id: 'backboard-fire',
    category: 'backboards',
    name: 'Inferno',
    cost: 420,
    color: '#E65100',
    rimNetImage: RIM_NET,
  },
  {
    id: 'backboard-cracks',
    category: 'backboards',
    name: 'Shattered',
    cost: 460,
    color: '#424242',
    rimNetImage: RIM_NET,
  },
  {
    id: 'backboard-bones',
    category: 'backboards',
    name: 'Bone Yard',
    cost: 520,
    color: '#5D4037',
    rimNetImage: RIM_NET,
  },
  {
    id: 'backboard-clouds',
    category: 'backboards',
    name: 'Sky Clouds',
    cost: 580,
    color: '#4FC3F7',
    rimNetImage: RIM_NET,
  },

  // —— Backgrounds ——
  {
    id: 'bg-court-green',
    category: 'backgrounds',
    name: 'Sunny Backyard',
    cost: 0,
    color: '#B8E6F5',
    secondaryColor: '#7EC8E3',
    defaultUnlocked: true,
    imageSource: GAME_ASSETS.background.default,
  },
  { id: 'bg-sunset', category: 'backgrounds', name: 'Sunset Backyard', cost: 60, color: '#FFCC80', secondaryColor: '#FF8A65' },
  { id: 'bg-night', category: 'backgrounds', name: 'Twilight Yard', cost: 180, color: '#5C6BC0', secondaryColor: '#3949AB' },
  { id: 'bg-arena', category: 'backgrounds', name: 'Autumn Yard', cost: 300, color: '#FFE082', secondaryColor: '#FFB74D' },
];

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_CATALOG.find((item) => item.id === id);
}

export function getItemsByCategory(category: ShopItem['category']): ShopItem[] {
  return SHOP_CATALOG.filter((item) => item.category === category);
}
