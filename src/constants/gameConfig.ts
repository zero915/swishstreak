export const GRAVITY = 1500;
export const SWIPE_SCALE = 4.5;
export const VELOCITY_SCALE = 0.38;
export const FLICK_THRESHOLD = 35;
export const MIN_SWIPE_DISTANCE = 4;
export const MAX_SPEED = 1350;
export const POV_MAX_AIM_OFFSET = 160;
export const POV_MIN_SHOT_POWER = 0.03;
export const MAX_FLIGHT_TIME = 6;
export const PHYSICS_SUBSTEP = 1 / 120;
export const MAX_PHYSICS_SUBSTEPS = 16;
export const RIM_BOUNCE_RESTITUTION = 0.62;
export const RIM_RESTITUTION_MAX = 0.9;
export const RIM_RESTITUTION_MIN = 0.75;
export const BACKBOARD_RESTITUTION = 0.85;
export const SCORE_CYLINDER_RADIUS_FACTOR = 1.28;
export const SCORE_CYLINDER_TOP_MARGIN = 12;
export const SCORE_CYLINDER_BOTTOM_MARGIN = 16;
export const ASSIST_GAIN = 16;
export const ASSIST_MAX_CORRECTION_PER_FRAME = 10;
export const NEAR_MISS_RADIUS_FACTOR = 0.08;
export const RIM_ROLL_SPEED_THRESHOLD = 220;
export const RIM_STUCK_SUBSTEPS = 8;
export const RIM_STUCK_SPEED = 40;
export const SCORED_NET_DRAG = 80;
export const SCORE_NET_FALL_MS = 700;
export const SCORE_NET_DIP_MS = 130;
export const SCORE_EXIT_MS = 560;
export const MIN_MISS_SETTLE_MS = 480;
/** @deprecated Use getGameSizing() — kept for legacy imports */
export const BALL_RADIUS = 40;
export const BALL_DIAMETER = BALL_RADIUS * 2;
export const TOUCH_TARGET_SIZE = 104;
/** Ball diameter as fraction of screen width (launch POV). */
export const BALL_DIAMETER_RATIO = 0.21;
export const MIN_BALL_RADIUS = 36;
export const MAX_BALL_RADIUS = 50;
/** Inner rim opening vs ball diameter — real hoop ~1.9x; FRVR-tight ~1.22–1.28. */
export const RIM_INNER_TO_BALL_DIAMETER = 1.22;
/** Inner opening as fraction of outer rim tube width (hoopGeometry + Hoop.tsx). */
export const RIM_INNER_FRACTION = 0.76;
export const BASE_COIN_VALUE = 10;
export const MAX_MULTIPLIER = 5;
export const MAX_MISSES = 3;
export const LEVEL_UP_SHOT_INTERVAL = 7;
export const DAILY_BONUS_COINS = 50;
export const DAILY_BONUS_XP = 15;
export const DAILY_BONUS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const XP_PER_MAKE = 5;
export const XP_ARCADE_RUN_BASE = 20;
export const XP_CAMPAIGN_LEVEL_BASE = 30;
export const XP_PER_STAR = 10;

export const BASE_HOOP_Y_OFFSET = 0.48;
/** Legacy fallback — prefer getGameSizing(). */
export const BASE_RIM_WIDTH = 118;
export const RIM_SCREEN_RATIO = 0.30;
/** Inner target square on backboard face (matches BackboardFace.tsx). */
export const INNER_TARGET_HEIGHT_FRACTION = 0.36;
export const INNER_TARGET_BOTTOM_FRACTION = 0.5 + INNER_TARGET_HEIGHT_FRACTION / 2;

/** Arcade shot-based hoop movement */
export const HOOP_HOLD_OFFSET = 55;
export const HOOP_OSCILLATE_AMPLITUDE = 50;
export const HOOP_OSCILLATE_BASE_MS = 4000;
export const HOOP_OSCILLATE_SPEED_STEP_MS = 600;
export const HOOP_RANDOM_MOVE_MS = 1400;
export const HOOP_RANDOM_PAUSE_MS_MIN = 600;
export const HOOP_RANDOM_PAUSE_MS_MAX = 1400;
export const HOOP_RANDOM_AMPLITUDE = 60;

export const HOOP_MOVE_THRESHOLDS = {
  holdLeft: 3,
  holdRight: 6,
  oscillate: 9,
  speedTier1: 12,
  speedTier2: 18,
  speedTier3: 24,
  random: 30,
} as const;

/** Campaign level drift (sine) */
export const HOOP_DRIFT_AMPLITUDE = 40;
export const HOOP_DRIFT_PERIOD_MS = 3000;
export const PERFECT_WINDOW_DURATION_MS = 800;
export const PERFECT_WINDOW_INTERVAL_MIN_MS = 8000;
export const PERFECT_WINDOW_INTERVAL_MAX_MS = 12000;

export const STORAGE_KEYS = {
  coins: '@swishstreak/coins',
  shop: '@swishstreak/shop',
  dailyBonus: '@swishstreak/dailyBonus',
  guestProgress: '@swishstreak/guestProgress',
  hasSeenLogin: '@swishstreak/hasSeenLogin',
  isGuest: '@swishstreak/isGuest',
} as const;

export const DEFAULT_SHOP_STATE = {
  owned: ['ball-classic', 'backboard-standard', 'bg-court-green'],
  equipped: {
    ball: 'ball-classic',
    backboard: 'backboard-standard',
    background: 'bg-court-green',
  },
};

export const DEFAULT_PLAYER_DATA = {
  totalCoins: 0,
  totalXP: 0,
  playerLevel: 1,
  shopState: DEFAULT_SHOP_STATE,
  campaignProgress: {} as Record<number, { stars: number; bestScore: number; completedAt?: string }>,
  arcadeBest: { score: 0, streak: 0, shotsMade: 0 },
};
