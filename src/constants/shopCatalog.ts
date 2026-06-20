import { ShopItem } from '../types';
import { GAME_ASSETS } from './gameAssets';

export const SHOP_CATALOG: ShopItem[] = [
  {
    id: 'ball-classic',
    category: 'balls',
    name: 'Classic Orange',
    cost: 0,
    color: '#FF6B35',
    defaultUnlocked: true,
    imageSource: GAME_ASSETS.ball.classic,
  },
  { id: 'ball-ice', category: 'balls', name: 'Ice Blue', cost: 50, color: '#4FC3F7' },
  { id: 'ball-fire', category: 'balls', name: 'Fire Red', cost: 150, color: '#EF5350' },
  { id: 'ball-gold', category: 'balls', name: 'Gold', cost: 400, color: '#FFD54F' },

  {
    id: 'backboard-standard',
    category: 'backboards',
    name: 'Standard White',
    cost: 0,
    color: '#FFFFFF',
    defaultUnlocked: true,
    backboardImage: GAME_ASSETS.hoop.backboardClassic,
    rimNetImage: GAME_ASSETS.hoop.rimNetClassic,
  },
  { id: 'backboard-neon', category: 'backboards', name: 'Neon Green', cost: 75, color: '#69F0AE' },
  { id: 'backboard-carbon', category: 'backboards', name: 'Carbon Gray', cost: 200, color: '#78909C' },
  { id: 'backboard-purple', category: 'backboards', name: 'Purple Glass', cost: 350, color: '#AB47BC' },

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
