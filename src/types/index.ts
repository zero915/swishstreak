import { ImageSourcePropType } from 'react-native';

export type ShopCategory = 'balls' | 'backboards' | 'backgrounds';

export type BackboardEffect = 'stars' | 'blizzard' | 'fire' | 'cracks' | 'bones' | 'clouds';

export interface BackboardTheme {
  gradient: [string, string, string];
  frameColor: string;
  targetFill: string;
  targetBorder: string;
  effect?: BackboardEffect;
}

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  cost: number;
  color: string;
  secondaryColor?: string;
  defaultUnlocked?: boolean;
  /** Ball or full-screen background sprite. */
  imageSource?: ImageSourcePropType;
  /** Backboard face sprite (backboards category). */
  backboardImage?: ImageSourcePropType;
  /** Rim + net sprite layered below the ball (backboards category). */
  rimNetImage?: ImageSourcePropType;
}

export interface ShopState {
  owned: string[];
  equipped: {
    ball: string;
    backboard: string;
    background: string;
  };
}

export interface CampaignLevelProgress {
  stars: number;
  bestScore: number;
  completedAt?: string;
}

export interface CampaignProgress {
  [levelId: number]: CampaignLevelProgress;
}

export interface ArcadeBest {
  score: number;
  streak: number;
  shotsMade: number;
  updatedAt?: string;
}

export interface PlayerData {
  totalCoins: number;
  totalXP: number;
  playerLevel: number;
  shopState: ShopState;
  campaignProgress: CampaignProgress;
  arcadeBest: ArcadeBest;
  dailyBonusLastClaim?: string;
}

export interface UserProfile extends PlayerData {
  uid: string;
  displayName: string;
  photoURL?: string;
  provider?: 'google' | 'facebook';
  inviteCode: string;
  friendIds: string[];
}

export type GameMode = 'arcade' | 'campaign';

export interface CampaignLevelDef {
  id: number;
  objective: 'make_n';
  targetMakes: number;
  maxMisses: number;
  hoopDistance: number;
  rimScale: number;
  wind: number;
  drift: boolean;
}

export interface DifficultyParams {
  distance: number;
  rimScale: number;
  wind: number;
  drift: boolean;
  perfectWindow: boolean;
}

export interface GameSessionState {
  mode: GameMode;
  streak: number;
  misses: number;
  level: number;
  shotsMade: number;
  makesThisLevel: number;
  coinsEarnedThisRun: number;
  bestStreakThisRun: number;
  maxStreakThisRun: number;
  totalMissesThisRun: number;
  isRunOver: boolean;
  isLevelComplete: boolean;
  isLevelFailed: boolean;
  campaignLevelId?: number;
}

export interface RunSummary {
  shotsMade: number;
  bestStreak: number;
  coinsEarned: number;
  score: number;
}

export interface LevelResult {
  levelId: number;
  stars: number;
  coinsEarned: number;
  xpEarned: number;
  passed: boolean;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  playerLevel: number;
  score: number;
  streak?: number;
  totalStars?: number;
  furthestLevel?: number;
  updatedAt?: string;
}

export interface FriendProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  playerLevel: number;
  inviteCode: string;
  furthestLevel: number;
  arcadeBest: ArcadeBest;
  totalStars: number;
}

export interface SwipeVector {
  dx: number;
  dy: number;
}

export interface LaunchVelocity {
  vx: number;
  vy: number;
}

export interface BallPosition {
  x: number;
  y: number;
}

export interface HoopBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rimInnerWidth: number;
}

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Game: { mode: GameMode; campaignLevelId?: number };
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Leaderboard: undefined;
  Friends: undefined;
  Shop: undefined;
};
