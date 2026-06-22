import { BackboardTheme } from '../types';

/** Single template — basic tiers swap gradient colors; premium tiers add effects. */
export const BACKBOARD_THEMES: Record<string, BackboardTheme> = {
  'backboard-standard': {
    gradient: ['#FFB74D', '#FF9800', '#F57C00'],
    frameColor: '#FFFFFF',
    targetFill: 'rgba(255,255,255,0.15)',
    targetBorder: '#FFFFFF',
  },
  'backboard-crimson': {
    gradient: ['#EF5350', '#E53935', '#C62828'],
    frameColor: '#FFCDD2',
    targetFill: 'rgba(255,255,255,0.12)',
    targetBorder: '#FFEBEE',
  },
  'backboard-neon': {
    gradient: ['#69F0AE', '#00E676', '#00C853'],
    frameColor: '#FFFFFF',
    targetFill: 'rgba(255,255,255,0.18)',
    targetBorder: '#B9F6CA',
  },
  'backboard-ocean': {
    gradient: ['#4FC3F7', '#29B6F6', '#0288D1'],
    frameColor: '#E1F5FE',
    targetFill: 'rgba(255,255,255,0.14)',
    targetBorder: '#B3E5FC',
  },
  'backboard-carbon': {
    gradient: ['#90A4AE', '#607D8B', '#455A64'],
    frameColor: '#ECEFF1',
    targetFill: 'rgba(255,255,255,0.1)',
    targetBorder: '#CFD8DC',
  },
  'backboard-purple': {
    gradient: ['#CE93D8', '#AB47BC', '#8E24AA'],
    frameColor: '#F3E5F5',
    targetFill: 'rgba(255,255,255,0.14)',
    targetBorder: '#E1BEE7',
  },
  'backboard-stars': {
    gradient: ['#1A237E', '#283593', '#0D1642'],
    frameColor: '#FFD54F',
    targetFill: 'rgba(255,255,255,0.08)',
    targetBorder: '#FFEB3B',
    effect: 'stars',
  },
  'backboard-blizzard': {
    gradient: ['#E1F5FE', '#B3E5FC', '#81D4FA'],
    frameColor: '#FFFFFF',
    targetFill: 'rgba(255,255,255,0.35)',
    targetBorder: '#E3F2FD',
    effect: 'blizzard',
  },
  'backboard-fire': {
    gradient: ['#FF6F00', '#E65100', '#BF360C'],
    frameColor: '#FFEB3B',
    targetFill: 'rgba(255,235,59,0.2)',
    targetBorder: '#FFD54F',
    effect: 'fire',
  },
  'backboard-cracks': {
    gradient: ['#424242', '#303030', '#212121'],
    frameColor: '#9E9E9E',
    targetFill: 'rgba(255,255,255,0.06)',
    targetBorder: '#757575',
    effect: 'cracks',
  },
  'backboard-bones': {
    gradient: ['#5D4037', '#4E342E', '#3E2723'],
    frameColor: '#EFEBE9',
    targetFill: 'rgba(255,255,255,0.1)',
    targetBorder: '#D7CCC8',
    effect: 'bones',
  },
  'backboard-clouds': {
    gradient: ['#81D4FA', '#4FC3F7', '#29B6F6'],
    frameColor: '#FFFFFF',
    targetFill: 'rgba(255,255,255,0.25)',
    targetBorder: '#E1F5FE',
    effect: 'clouds',
  },
};

export function getBackboardTheme(backboardId: string): BackboardTheme | undefined {
  return BACKBOARD_THEMES[backboardId];
}

export function isPremiumBackboard(backboardId: string): boolean {
  const theme = BACKBOARD_THEMES[backboardId];
  return Boolean(theme?.effect);
}
