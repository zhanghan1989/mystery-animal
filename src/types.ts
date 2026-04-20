export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface LuckyBlock {
  id: string;
  rarity: Rarity;
  depth: number;
  type: 'Classic' | 'Super' | 'Galaxy' | 'Rainbow' | 'Void';
}

export interface Room {
  id: string;
  depth: number;
  bossEmoji: string;
  cleared: boolean;
  requiredDepth: number;
  unlocked: boolean;
}

export interface Tool {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  type: 'speed' | 'strength' | 'meme' | 'money';
  multiplier: number;
}

export interface BrainrotNPC {
  id: string;
  roomId: string;
  x: number;
  y: number;
  speed: number;
  hasBlock: boolean;
  blockRarity: Rarity;
  angle: number;
  emoji: string;
  isBoss?: boolean;
  lastTheftTime?: number;
}

export interface GameState {
  money: number;
  gems: number; // Premium currency
  health: number;
  maxHealth: number;
  depth: number;
  maxDepth: number;
  currentRoomId: string;
  unlockedRoomIds: string[];
  inventory: LuckyBlock[];
  hotbar: (Tool | null)[]; // Roblox style 1-5 slots
  activeToolIndex: number;
  inventoryCapacity: number;
  playerPos: { x: number; y: number };
  baseLevel: number;
  multiplier: number;
  baseSpeed: number; // Added player speed attribute
  tradeOffers: TradeOffer[];
}

export interface TradeOffer {
  id: string;
  requiredRarity: Rarity;
  requiredAmount: number;
  rewardMoney: number;
}

export const RARITY_COLORS: Record<Rarity, string> = {
  Common: '#d1d5db',
  Uncommon: '#4ade80',
  Rare: '#60a5fa',
  Epic: '#a855f7',
  Legendary: '#f59e0b',
  Mythic: '#ef4444'
};

export const RARITY_WEIGHTS: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
