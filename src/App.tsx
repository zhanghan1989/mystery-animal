/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Map as MapIcon, 
  Package, 
  ArrowUpRight, 
  Settings, 
  ShoppingCart,
  Zap,
  Box,
  Coins,
  ArrowRightLeft,
  ChevronRight,
  TrendingUp,
  Move,
  Gem,
  CreditCard,
  Crown
} from 'lucide-react';
import { 
  GameState, 
  LuckyBlock, 
  BrainrotNPC, 
  Rarity,
  Room,
  Tool,
  RARITY_COLORS, 
  RARITY_WEIGHTS,
  TradeOffer
} from './types.ts';

const ROOM_SIZE = 800; // Size of each room
const TOTAL_ROOMS = 50;

const STAGES: Room[] = Array.from({ length: TOTAL_ROOMS }).map((_, i) => ({
  id: `room-${i}`,
  depth: i * 500,
  bossEmoji: '🤌',
  cleared: false,
  requiredDepth: i * 500,
  unlocked: i === 0
}));

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    money: 100,
    gems: 10,
    health: 100,
    maxHealth: 100,
    depth: 0,
    maxDepth: 0,
    currentRoomId: 'room-0',
    unlockedRoomIds: ['room-0'],
    inventory: [],
    hotbar: Array(9).fill(null), // 9 slots like Roblox
    activeToolIndex: 0,
    inventoryCapacity: 20,
    playerPos: { x: 0, y: 0 },
    baseLevel: 1,
    multiplier: 1,
    baseSpeed: 5,
    tradeOffers: []
  });

  const [npcs, setNpcs] = useState<BrainrotNPC[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'base'>('base');
  const [baseView, setBaseView] = useState<'main' | 'open' | 'compose' | 'trade' | 'shop' | 'premium'>('main');
  const [worldEvent, setWorldEvent] = useState<{ name: string; type: 'rarity' | 'speed' | 'multiplier'; endAt: number } | null>(null);
  const [visualDepth, setVisualDepth] = useState(0);
  const [openingBlock, setOpeningBlock] = useState<{ rarity: Rarity; tool?: Tool; blockType: LuckyBlock['type'] } | null>(null);
  const [joystick, setJoystick] = useState<{ active: boolean; startX: number; startY: number; currX: number; currY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0
  });

  const playerRef = useRef(gameState.playerPos);
  const npcsRef = useRef<BrainrotNPC[]>([]);
  const lastStateRef = useRef(gameState);
  const joystickRef = useRef(joystick);
  const lastStateUpdateRef = useRef(0);
  const lastDepthUpdateRef = useRef(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lastStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    joystickRef.current = joystick;
  }, [joystick]);

  // Initialize NPCs (One Boss and many minions per revealed room)
  useEffect(() => {
    const minionEmojis = ['👾', '🤫', '🗿', '👺', '🤡', '💀', '👽', '🕺'];
    const initialNpcs: BrainrotNPC[] = [];
    
    STAGES.forEach(room => {
      // Room Boss
      const bossDepth = room.depth / 500;
      initialNpcs.push({
        id: `boss-${room.id}`,
        roomId: room.id,
        x: (Math.random() - 0.5) * ROOM_SIZE,
        y: room.depth + (Math.random() - 0.5) * (ROOM_SIZE * 0.4),
        speed: 1.2 + (bossDepth * 0.1),
        hasBlock: true,
        blockRarity: RARITY_WEIGHTS[Math.min(5, Math.floor(room.depth / 2000) + 1)],
        angle: Math.random() * Math.PI * 2,
        emoji: '🤌',
        isBoss: true,
        health: 100 + (bossDepth * 150),
        maxHealth: 100 + (bossDepth * 150)
      });

      // Minions
      for(let j = 0; j < 5; j++) {
        initialNpcs.push({
          id: `minion-${room.id}-${j}`,
          roomId: room.id,
          x: (Math.random() - 0.5) * ROOM_SIZE,
          y: (Math.random() - 0.5) * ROOM_SIZE + room.depth,
          speed: 1 + Math.random(),
          hasBlock: true,
          blockRarity: 'Common',
          angle: Math.random() * Math.PI * 2,
          emoji: minionEmojis[Math.floor(Math.random() * minionEmojis.length)],
          isBoss: false
        });
      }
    });

    setNpcs(initialNpcs);
    npcsRef.current = initialNpcs;
  }, []);

  // Trade offers generation
  useEffect(() => {
    const generateOffers = () => {
      const rarities: Rarity[] = ['Common', 'Uncommon', 'Rare'];
      const offers = Array.from({ length: 3 }).map((_, i) => ({
        id: `trade-${i}-${Date.now()}`,
        requiredRarity: rarities[i],
        requiredAmount: 2 + i,
        rewardMoney: (i + 1) * 100 * (i + 1)
      }));
      setGameState(prev => ({ ...prev, tradeOffers: offers }));
    };
    generateOffers();
    const interval = setInterval(generateOffers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Event System
  useEffect(() => {
    const handleEvents = () => {
      if (worldEvent && Date.now() > worldEvent.endAt) {
        setWorldEvent(null);
      } else if (!worldEvent && Math.random() < 0.2) {
        const events: Array<{ name: string; type: 'rarity' | 'speed' | 'multiplier' }> = [
          { name: 'ブレインロット・ストーム（高レア確定）', type: 'rarity' },
          { name: 'カーム・バイブス（NPC減速中）', type: 'speed' },
          { name: 'ハイパー・インフレーション（収入2倍）', type: 'multiplier' }
        ];
        const selected = events[Math.floor(Math.random() * events.length)];
        setWorldEvent({ ...selected, endAt: Date.now() + 60000 }); // 60s event
      }
    };
    const interval = setInterval(handleEvents, 10000);
    return () => clearInterval(interval);
  }, [worldEvent]);

  // Keybinds for Hotbar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = parseInt(e.key);
      if (key >= 1 && key <= 9) {
        setGameState(prev => ({ ...prev, activeToolIndex: key - 1 }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Loop
  useEffect(() => {
    let lastTime = performance.now();
    let frameId: number;

    const loop = (time: number) => {
      const dt = Math.min(2, (time - lastTime) / 16.66);
      lastTime = time;

      const currentJoystick = joystickRef.current;
      const currentState = lastStateRef.current;

      // Physics (60fps)
      if (currentJoystick.active) {
        const dx = currentJoystick.currX - currentJoystick.startX;
        const dy = currentJoystick.currY - currentJoystick.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          const activeTool = currentState.hotbar[currentState.activeToolIndex];
          let speedMult = 1;
          if (activeTool?.type === 'speed') speedMult = activeTool.multiplier;
          
          const moveX = (dx / dist) * currentState.baseSpeed * speedMult * dt;
          const moveY = (dy / dist) * currentState.baseSpeed * speedMult * dt;
          
          let targetY = playerRef.current.y + moveY;
          const currentRoomIndex = Math.floor(targetY / 500);
          const highestUnlockedIndex = Math.max(...currentState.unlockedRoomIds.map(id => parseInt(id.split('-')[1])));
          
          // Restricted by lock
          if (currentRoomIndex > highestUnlockedIndex) {
            targetY = highestUnlockedIndex * 500 + 450; // Bound to top of last unlocked room
          }

          playerRef.current = {
            x: Math.max(-ROOM_SIZE/2, Math.min(ROOM_SIZE/2, playerRef.current.x + moveX)),
            y: Math.max(0, Math.min(TOTAL_ROOMS * 500, targetY))
          };
        }
      }

      const currentDepthValue = playerRef.current.y;
      
      const nextNpcs = npcsRef.current.map(npc => {
        let newAngle = npc.angle + (Math.random() - 0.5) * 0.1;
        const room = STAGES.find(r => r.id === npc.roomId);
        const roomBaseY = room ? room.depth : 0;
        
        const depthFactor = Math.min(5, npc.y / 2000); 
        let currentSpeed = npc.speed * (1 + depthFactor * 0.5);
        if (worldEvent?.type === 'speed') currentSpeed *= 0.5;

        let newX = npc.x + Math.cos(newAngle) * currentSpeed * dt;
        let newY = npc.y + Math.sin(newAngle) * currentSpeed * dt;
        
        // Keep in room bounds
        if (Math.abs(newX) > ROOM_SIZE/2) newAngle = Math.PI - newAngle;
        if (newY < roomBaseY - ROOM_SIZE/2 || newY > roomBaseY + ROOM_SIZE/2) newAngle = -newAngle;

        let hasBlock = npc.hasBlock;
        let npcHealth = npc.health;
        const distToPlayer = Math.sqrt((newX - playerRef.current.x)**2 + (newY - playerRef.current.y)**2);
        
        // Boss Damage Logic
        if (npc.isBoss && distToPlayer < 70 && npcHealth && npcHealth > 0) {
          const activeTool = currentState.hotbar[currentState.activeToolIndex];
          let dmg = 1;
          if (activeTool?.type === 'strength') dmg = activeTool.multiplier * 2;
          npcHealth = Math.max(0, npcHealth - dmg * dt);

          if (npcHealth === 0 && npc.health && npc.health > 0) {
            // Unlock next room!
            const nextRoomNum = parseInt(npc.roomId.split('-')[1]) + 1;
            const nextRoomId = `room-${nextRoomNum}`;
            const rewardMoney = 500 * (nextRoomNum);
            const rewardGems = 5 * (nextRoomNum);
            
            setGameState(prev => ({
              ...prev,
              money: prev.money + rewardMoney,
              gems: prev.gems + rewardGems,
              unlockedRoomIds: prev.unlockedRoomIds.includes(nextRoomId) 
                ? prev.unlockedRoomIds 
                : [...prev.unlockedRoomIds, nextRoomId]
            }));
          }
        }

        // Defeated Bosses disappear
        if (npc.isBoss && npcHealth === 0) {
          return { ...npc, health: 0, x: -9999, y: -9999, hasBlock: false };
        }

        if (hasBlock && distToPlayer < 40) {
          if (lastStateRef.current.inventory.length < lastStateRef.current.inventoryCapacity) {
            hasBlock = false;
            const rarityValue = Math.random();
            let bonus = npc.y / 5000; 
            if (worldEvent?.type === 'rarity') bonus += 0.2;

            let rarity: Rarity = 'Common';
            let blockType: LuckyBlock['type'] = 'Classic';

            if (npc.isBoss) {
              if (rarityValue + bonus > 0.8) { rarity = 'Mythic'; blockType = 'Rainbow'; }
              else if (rarityValue + bonus > 0.6) { rarity = 'Legendary'; blockType = 'Galaxy'; }
              else { rarity = 'Epic'; blockType = 'Void'; }
            } else {
              if (rarityValue + bonus > 0.98) { rarity = 'Mythic'; blockType = 'Rainbow'; }
              else if (rarityValue + bonus > 0.93) { rarity = 'Legendary'; blockType = 'Galaxy'; }
              else if (rarityValue + bonus > 0.85) { rarity = 'Epic'; blockType = 'Void'; }
              else if (rarityValue + bonus > 0.7) { rarity = 'Rare'; blockType = 'Super'; }
              else if (rarityValue + bonus > 0.4) { rarity = 'Uncommon'; blockType = 'Classic'; }
            }
            
            const newBlock: LuckyBlock = {
              id: `block-${Date.now()}-${Math.random()}`,
              rarity,
              depth: Math.floor(npc.y),
              type: blockType
            };
            
            setGameState(prev => ({ ...prev, inventory: [...prev.inventory, newBlock] }));
          }
        }
        if (!hasBlock && Math.random() < 0.001) hasBlock = true;
        return { ...npc, x: newX, y: newY, angle: newAngle, hasBlock, health: npcHealth };
      });

      npcsRef.current = nextNpcs;

      // Smooth Visual Update (60fps via CSS Variables)
      if (mapContainerRef.current) {
        mapContainerRef.current.style.setProperty('--player-x', `${playerRef.current.x}px`);
        mapContainerRef.current.style.setProperty('--player-y', `${playerRef.current.y}px`);
      }

      // UI Throttling
      const now = performance.now();
      
      // Update visual NPCs and depth less frequently to save CPU
      if (now - lastStateUpdateRef.current > 33) { // ~30fps visual update
        setNpcs([...nextNpcs]);
        lastStateUpdateRef.current = now;
      }

      if (now - lastDepthUpdateRef.current > 100) { // ~10fps UI depth update
        setVisualDepth(Math.floor(currentDepthValue));
        setGameState(prev => ({
          ...prev,
          playerPos: playerRef.current,
          depth: Math.floor(currentDepthValue),
          maxDepth: Math.max(prev.maxDepth, Math.floor(currentDepthValue))
        }));
        lastDepthUpdateRef.current = now;
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [worldEvent]);

  // Base Logic
  // Tool definitions
  const TOOLS: Tool[] = [
    { id: 'speed_coil', name: 'スピード・コイル', emoji: '🌀', rarity: 'Uncommon', type: 'speed', multiplier: 1.5 },
    { id: 'gravity_coil', name: '重力コイル', emoji: '💫', rarity: 'Rare', type: 'strength', multiplier: 1.2 },
    { id: 'ban_hammer', name: 'BANハンマー', emoji: '🔨', rarity: 'Legendary', type: 'strength', multiplier: 3.5 },
    { id: 'pizza_sword', name: 'ピザ・ソード', emoji: '🍕', rarity: 'Common', type: 'meme', multiplier: 1.1 },
    { id: 'golden_🤌', name: '黄金の🤌', emoji: '🤌', rarity: 'Mythic', type: 'money', multiplier: 5.0 },
    { id: 'sigma_crown', name: 'シギマ・クラウン', emoji: '👑', rarity: 'Epic', type: 'meme', multiplier: 2.0 },
    { id: 'mewing_stone', name: 'ミューイング・ストーン', emoji: '🗿', rarity: 'Rare', type: 'strength', multiplier: 1.8 },
    { id: 'skibidi_toilet', name: 'スキビディ・トイレ', emoji: '🚽', rarity: 'Epic', type: 'speed', multiplier: 2.2 },
    { id: 'fanum_tax', name: 'ファナム・タックス', emoji: '🍔', rarity: 'Uncommon', type: 'money', multiplier: 1.4 },
    { id: 'sus_imposter', name: 'サス・インポスター', emoji: '📮', rarity: 'Rare', type: 'meme', multiplier: 1.5 },
    { id: 'ice_cream_so_good', name: 'アイスクリーム最高', emoji: '🍦', rarity: 'Common', type: 'money', multiplier: 1.2 },
    { id: 'italy_tricolore', name: '三色旗マント', emoji: '🇮🇹', rarity: 'Legendary', type: 'speed', multiplier: 2.8 },
  ];

  const openBlock = (id: string) => {
    setGameState(prev => {
      const block = prev.inventory.find(b => b.id === id);
      if (!block) return prev;
      
      // Calculate reward
      const baseValue = RARITY_WEIGHTS.indexOf(block.rarity) + 1;
      const depthBonus = 1 + block.depth / 200;
      let finalMultiplier = prev.multiplier;
      if (worldEvent?.type === 'multiplier') finalMultiplier *= 2; 
      const totalReward = Math.floor(baseValue * 50 * depthBonus * finalMultiplier);

      // Roblox Luck Chance based on Block Type
      const toolCances: Record<LuckyBlock['type'], number> = {
        Classic: 0.3,
        Super: 0.5,
        Galaxy: 0.7,
        Rainbow: 1.0,
        Void: 0.8
      };
      
      let newTool: Tool | null = null;
      if (Math.random() < toolCances[block.type]) {
        const eligibleTools = TOOLS.filter(t => RARITY_WEIGHTS.indexOf(t.rarity) <= RARITY_WEIGHTS.indexOf(block.rarity));
        newTool = eligibleTools[Math.floor(Math.random() * eligibleTools.length)] || null;
      }

      setOpeningBlock({ rarity: block.rarity, tool: newTool || undefined, blockType: block.type });
      setTimeout(() => setOpeningBlock(null), 2000);

      // Add to hotbar if slots available
      const nextHotbar = [...prev.hotbar];
      if (newTool) {
        // Find if user already has it
        const existingIdx = nextHotbar.findIndex(t => t?.id.split('-')[0] === newTool?.id);
        if (existingIdx === -1) {
          const emptySlot = nextHotbar.findIndex(slot => slot === null);
          if (emptySlot !== -1) {
            nextHotbar[emptySlot] = { ...newTool, id: `${newTool.id}-${Date.now()}` };
          }
        }
      }

      return {
        ...prev,
        health: Math.min(prev.maxHealth, prev.health + 5), // Opening block heals a bit like a powerup
        money: prev.money + totalReward,
        inventory: prev.inventory.filter(b => b.id !== id),
        hotbar: nextHotbar
      };
    });
  };

  const composeBlocks = (rarity: Rarity) => {
    setGameState(prev => {
      const targets = prev.inventory.filter(b => b.rarity === rarity);
      if (targets.length < 3) return prev;
      
      const nextRarityIndex = RARITY_WEIGHTS.indexOf(rarity) + 1;
      if (nextRarityIndex >= RARITY_WEIGHTS.length) return prev;
      
      const newRarity = RARITY_WEIGHTS[nextRarityIndex];
      const remainingInInventory = prev.inventory.filter(b => !targets.slice(0, 3).map(t => t.id).includes(b.id));

      const newBlock: LuckyBlock = {
        id: `composed-${Date.now()}`,
        rarity: newRarity,
        depth: Math.max(...targets.slice(0, 3).map(t => t.depth)),
        type: newRarity === 'Mythic' ? 'Rainbow' : newRarity === 'Legendary' ? 'Galaxy' : newRarity === 'Epic' ? 'Void' : 'Super'
      };

      return {
        ...prev,
        inventory: [...remainingInInventory, newBlock]
      };
    });
  };

  const fulfillTrade = (offerId: string) => {
    const offer = gameState.tradeOffers.find(o => o.id === offerId);
    if (!offer) return;

    setGameState(prev => {
      const matches = prev.inventory.filter(b => b.rarity === offer.requiredRarity);
      if (matches.length < offer.requiredAmount) return prev;

      const remainingInInventory = prev.inventory.filter(b => !matches.slice(0, offer.requiredAmount).map(t => t.id).includes(b.id));
      
      return {
        ...prev,
        inventory: remainingInInventory,
        money: prev.money + offer.rewardMoney
      };
    });
  };

  const upgradeBase = (type: 'capacity' | 'multiplier') => {
    setGameState(prev => {
      if (type === 'capacity') {
        const cost = prev.inventoryCapacity * 200;
        if (prev.money >= cost) {
          return { ...prev, money: prev.money - cost, inventoryCapacity: prev.inventoryCapacity + 2 };
        }
      } else {
        const cost = Math.floor(prev.multiplier * 1000);
        if (prev.money >= cost) {
          return { ...prev, money: prev.money - cost, multiplier: prev.multiplier + 0.2 };
        }
      }
      return prev;
    });
  };

  const buyPremium = (type: 'pack' | 'speed' | 'slots' | 'gems') => {
    setGameState(prev => {
      if (type === 'gems') {
        // Instant simulated purchase
        return { ...prev, gems: prev.gems + 100 };
      }
      
      if (type === 'pack') {
         if (prev.gems < 50) return prev;
         const rarities: Rarity[] = ['Rare', 'Epic', 'Legendary'];
         const newBlocks: LuckyBlock[] = Array.from({ length: 3 }).map((_, i) => {
           const r = rarities[Math.floor(Math.random() * rarities.length)];
           return {
             id: `premium-${Date.now()}-${i}`,
             rarity: r,
             depth: 500 + Math.random() * 1000,
             type: r === 'Legendary' ? 'Galaxy' : r === 'Epic' ? 'Void' : 'Super'
           };
         });
         const spaceLeft = prev.inventoryCapacity - prev.inventory.length;
         const added = newBlocks.slice(0, spaceLeft);
         return { ...prev, gems: prev.gems - 50, inventory: [...prev.inventory, ...added] };
      }

      if (type === 'speed') {
        if (prev.gems < 30) return prev;
        return { ...prev, gems: prev.gems - 30, baseSpeed: prev.baseSpeed + 1 };
      }

      if (type === 'slots') {
        if (prev.gems < 40) return prev;
        return { ...prev, gems: prev.gems - 40, inventoryCapacity: prev.inventoryCapacity + 10 };
      }
      return prev;
    });
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white font-sans overflow-hidden flex flex-col">
      {/* HUD Header */}
      <header className="p-4 bg-zinc-900/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
              <Coins className="text-yellow-500 w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 font-mono uppercase tracking-tighter leading-none">所持金</span>
              <span className="text-xl font-bold font-mono tracking-tight">{Math.floor(gameState.money).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-pink-500/10 p-2 rounded-lg border border-pink-500/20">
              <Gem className="text-pink-500 w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 font-mono uppercase tracking-tighter leading-none">ジェム</span>
              <span className="text-xl font-bold font-mono tracking-tight text-pink-400">{gameState.gems}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">現在の深度</span>
            <span className="text-lg font-bold text-emerald-500">{visualDepth}m</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-zinc-500 uppercase font-mono">バックパック</span>
             <span className={`text-lg font-bold ${gameState.inventory.length >= gameState.inventoryCapacity ? 'text-red-500' : 'text-zinc-200'}`}>
                {gameState.inventory.length}/{gameState.inventoryCapacity}
             </span>
          </div>
        </div>
      </header>

      {/* Main Game Screen */}
      <main className="flex-1 relative overflow-hidden bg-black">
        {activeTab === 'map' ? (
          <div 
            ref={mapContainerRef}
            className="w-full h-full relative overflow-hidden [--player-x:0px] [--player-y:0px]"
            onPointerDown={e => {
              setJoystick({ active: true, startX: e.clientX, startY: e.clientY, currX: e.clientX, currY: e.clientY });
            }}
            onPointerMove={e => {
              if (joystick.active) setJoystick(prev => ({ ...prev, currX: e.clientX, currY: e.clientY }));
            }}
            onPointerUp={() => setJoystick(prev => ({ ...prev, active: false }))}
          >
            {/* World Grid */}
            <div 
              className="absolute pointer-events-none w-full h-full"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '100px 100px',
                transform: 'translate(calc(var(--player-x) * -1), calc(var(--player-y) * -1))'
              }}
            />

            {/* Room Dividers & Room Labels */}
            {STAGES.map(room => {
              const roomIdx = parseInt(room.id.split('-')[1]);
              const isLocked = !gameState.unlockedRoomIds.includes(room.id);
              
              return (
                <React.Fragment key={room.id}>
                  <div 
                    className={`absolute w-full border-t-8 transition-colors duration-500 flex items-center justify-center ${isLocked ? 'border-red-600/50 shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]'}`}
                    style={{ 
                      top: `calc(50% + ${room.depth - ROOM_SIZE/2}px - var(--player-y))`,
                      height: '8px'
                    }}
                  >
                    {isLocked && (
                      <div className="bg-red-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest -translate-y-1/2">
                        LOCKED - DEFEAT BOSS IN ROOM {roomIdx - 1}
                      </div>
                    )}
                  </div>
                  <div 
                    className="absolute pointer-events-none opacity-20 text-[60px] font-black font-display uppercase tracking-tighter text-white/10 italic"
                    style={{ 
                      left: 'calc(50% - var(--player-x))',
                      top: `calc(50% + ${room.depth}px - var(--player-y))`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    ROOM {roomIdx}
                  </div>
                </React.Fragment>
              );
            })}

            {/* Base Indicator */}
            <div 
              className="absolute w-40 h-40 border-2 border-dashed border-zinc-700/50 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ 
                left: 'calc(50% - var(--player-x))',
                top: 'calc(50% - var(--player-y))' 
              }}
            >
              <Home className="w-6 h-6 text-zinc-700 mb-1" />
              <span className="text-[10px] text-zinc-700 uppercase font-mono">セーフゾーン</span>
            </div>

            {/* NPCs */}
            {npcs.map((npc, idx) => {
              const slang = ['SKIBIDI', 'GYATT', 'RIZZ', '🤌 MAMMA MIA', 'PIZZA RIZZ', 'SPAGHETTI GYATT', 'SIGMA 🤌', 'ITALIAN RIZZ', 'MEWING', 'FANUM TAX'];
              const showSlang = idx % 5 === 0; // Show slang on some NPCs
              const isBoss = npc.isBoss;
              
              return (
                <div 
                  key={npc.id}
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    left: `calc(50% + (${npc.x}px - var(--player-x)))`,
                    top: `calc(50% + (${npc.y}px - var(--player-y)))` 
                  }}
                >
                  <div className="relative group">
                    {showSlang && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-black text-[8px] font-black px-1 rounded animate-bounce">
                        {slang[idx % slang.length]}
                      </div>
                    )}
                    {isBoss && npc.health && npc.health > 0 && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-black/50 border border-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 transition-all duration-200"
                          style={{ width: `${(npc.health / (npc.maxHealth || 100)) * 100}%` }}
                        />
                      </div>
                    )}
                    <div className={`${isBoss ? 'text-6xl text-yellow-400' : 'text-3xl'} glitch-shadow group-hover:brainrot-shake ${isBoss ? 'drop-shadow-[0_0_25px_rgba(255,215,0,0.8)]' : ''}`}>
                      {npc.emoji}
                    </div>
                    {isBoss && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-[10px] font-black px-2 py-0.5 rounded text-white shadow-lg">
                        BOSS
                      </div>
                    )}
                    {npc.hasBlock && (
                      <div className={`absolute left-1/2 -translate-x-1/2 bg-yellow-400 border-2 border-yellow-600 animate-bounce ${isBoss ? '-top-12 w-10 h-10' : '-top-8 w-6 h-6'} rotate-12 shadow-[0_5px_0_rgba(0,0,0,0.3)] flex items-center justify-center`}>
                        <span className={`text-black font-black ${isBoss ? 'text-xl' : 'text-xs'}`}>?</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Player */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="relative brainrot-shake">
                <div className="text-4xl glitch-shadow">🏃</div>
                {/* Active Tool in Hand */}
                {gameState.hotbar[gameState.activeToolIndex] && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-4 -right-4 text-2xl drop-shadow-lg"
                  >
                    {gameState.hotbar[gameState.activeToolIndex]?.emoji}
                  </motion.div>
                )}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/20 blur-[2px] rounded-full" />
              </div>
            </div >

            {/* Classic Roblox Top HUD (Health) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-[60] pointer-events-none">
              <div className="w-64 h-2 bg-black/50 rounded-full border border-white/10 overflow-hidden shadow-lg">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: `${(gameState.health / gameState.maxHealth) * 100}%` }}
                  className={`h-full ${gameState.health < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                />
              </div>
              <span className="text-[10px] font-black italic text-white/40 uppercase tracking-widest">Health</span>
            </div>

            {/* Minimap Label */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
               <div className="flex items-center gap-2 bg-black/50 p-2 rounded-md backdrop-blur-sm border border-white/5 font-mono text-xs text-white">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                現在の深度: {visualDepth}m | 最大: {gameState.maxDepth}m
              </div>
              <div className="flex items-center gap-2 bg-pink-500/20 p-2 rounded-md backdrop-blur-sm border border-pink-500/30 font-mono text-[10px] text-pink-400 animate-pulse">
                <Zap className="w-3 h-3" />
                ブレインロット強度: {Math.min(100, Math.floor(visualDepth / 10))}%
              </div>
              {worldEvent && (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-yellow-500/90 text-black px-3 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-2"
                >
                  <Zap className="w-3 h-3" />
                  {worldEvent.name}
                </motion.div>
              )}
            </div>

            {/* Block Opening Gacha Animation */}
            <AnimatePresence>
              {openingBlock && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className={`absolute -inset-10 rounded-full blur-2xl ${
                          openingBlock.blockType === 'Rainbow' ? 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500' :
                          openingBlock.blockType === 'Galaxy' ? 'bg-blue-600/40' :
                          openingBlock.blockType === 'Void' ? 'bg-purple-900/40' :
                          'bg-white/20'
                        }`}
                      />
                      <div className="text-8xl filter drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                        {openingBlock.tool?.emoji || '💰'}
                      </div>
                    </div>
                    <div className="text-center">
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-black uppercase tracking-tighter italic text-white"
                        style={{ color: RARITY_COLORS[openingBlock.rarity] }}
                      >
                        {openingBlock.blockType} {openingBlock.rarity} !!!
                      </motion.div>
                      <div className="text-xl font-bold text-zinc-400 mt-1">
                        {openingBlock.tool?.name || 'CASH STACK'}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Roblox Style Hotbar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1 p-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl z-50">
              {gameState.hotbar.map((tool, i) => (
                <button
                  key={i}
                  onClick={() => setGameState(prev => ({ ...prev, activeToolIndex: i }))}
                  className={`relative w-14 h-14 rounded-md border-2 transition-all flex items-center justify-center ${
                    gameState.activeToolIndex === i 
                    ? 'border-white bg-white/20' 
                    : 'border-transparent bg-black/40 hover:bg-white/5'
                  }`}
                >
                  <span className="absolute top-0.5 left-1 text-[8px] font-bold text-white/40">{i + 1}</span>
                  {tool ? (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">{tool.emoji}</span>
                    </div>
                  ) : (
                    <div className="w-1 h-1 bg-white/10 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Quick Open Block Button (Roblox Style) */}
            {gameState.inventory.length > 0 && (
              <button 
                onClick={() => openBlock(gameState.inventory[0].id)}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-6 py-3 rounded-full font-black shadow-[0_4px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 group"
              >
                <Box className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                ブロックを開封！ ({gameState.inventory.length})
              </button>
            )}

            {/* Joystick UI */}
            {joystick.active && (
              <div 
                className="absolute w-32 h-32 border-2 border-white/10 rounded-full flex items-center justify-center pointer-events-none pb-20"
                style={{ left: joystick.startX - 64, top: joystick.startY - 64 }}
              >
                <div className="w-16 h-16 bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center">
                  <div 
                    className="w-8 h-8 bg-white/50 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    style={{
                      transform: `translate(${Math.max(-40, Math.min(40, joystick.currX - joystick.startX))}px, ${Math.max(-40, Math.min(40, joystick.currY - joystick.startY))}px)`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col md:flex-row bg-zinc-900/50 p-4 gap-4 overflow-y-auto">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 flex md:flex-col gap-2">
              {[
                { id: 'main', label: 'ホーム', icon: Home },
                { id: 'open', label: 'ブロック開封', icon: Zap },
                { id: 'compose', label: '合成ラボ', icon: Box },
                { id: 'trade', label: 'トレード', icon: ArrowRightLeft },
                { id: 'shop', label: '拠点強化', icon: ShoppingCart },
                { id: 'premium', label: 'ストア', icon: Crown }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setBaseView(btn.id as any)}
                  className={`flex-1 md:flex-none flex items-center gap-3 p-3 rounded-lg transition-all ${
                    baseView === btn.id ? 'bg-zinc-100 text-zinc-950 font-bold' : 'hover:bg-white/5 text-zinc-400'
                  } ${btn.id === 'premium' ? 'border border-pink-500/30' : ''}`}
                >
                  <btn.icon className={`w-5 h-5 ${btn.id === 'premium' ? 'text-pink-500' : ''}`} />
                  <span className="hidden md:inline">{btn.label}</span>
                </button>
              ))}
            </div>

            {/* Base View Content */}
            <div className="flex-1 bg-zinc-950/50 rounded-2xl border border-white/5 p-6 min-h-[400px]">
              {baseView === 'main' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-zinc-900 border border-white/5 p-5 rounded-xl">
                      <h3 className="text-zinc-500 text-xs font-mono uppercase mb-4 flex items-center gap-2">
                         <Package className="w-3 h-3" /> インベントリ配分
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {RARITY_WEIGHTS.map(r => (
                          <div key={r} className="bg-black/50 border border-white/5 px-3 py-2 rounded-lg flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RARITY_COLORS[r] }} />
                            <span className="text-xs text-white/70 font-mono">{r}: {gameState.inventory.filter(b => b.rarity === r).length}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-zinc-900 border border-white/5 p-5 rounded-xl flex flex-col justify-center">
                      <span className="text-zinc-500 text-xs font-mono uppercase">グローバル収入倍率</span>
                      <span className="text-4xl font-bold text-yellow-500">x{gameState.multiplier.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-4">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                       <Zap className="text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-bold">次回のイベント: ブレインロット・ストーム</h4>
                      <p className="text-sm text-zinc-400">4分間、高レアリティが出現しやすくなります！（近日公開）</p>
                    </div>
                  </div>
                </div>
              )}

              {baseView === 'open' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold mb-4">ブロック開封</h3>
                  {gameState.inventory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                      <Package className="w-12 h-12 mb-4 opacity-20" />
                      <p>バックパックが空です。探索して奪いに行きましょう！</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {gameState.inventory.map(block => (
                        <button
                          key={block.id}
                          onClick={() => openBlock(block.id)}
                          className="group relative bg-zinc-900 border border-white/5 p-4 rounded-xl hover:border-white/20 transition-all flex flex-col items-center gap-3 overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: RARITY_COLORS[block.rarity] }} />
                          <div className="text-4xl transform group-hover:scale-110 transition-transform">📦</div>
                          <div className="text-center">
                            <span className="text-[10px] font-mono block opacity-50 uppercase">{block.rarity}</span>
                            <span className="text-xs text-emerald-400 font-mono">{block.depth}m 知点</span>
                          </div>
                          <div className="text-xs bg-white/5 px-2 py-1 rounded w-full text-center group-hover:bg-yellow-500 group-hover:text-black font-bold transition-all">
                            開封
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {baseView === 'compose' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold mb-2">合成ラボ</h3>
                  <p className="text-sm text-zinc-400 mb-6">同じレアリティのブロック3個を合成して、1つ上のレアリティのブロックを1個入手します。</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {RARITY_WEIGHTS.slice(0, -1).map(r => {
                      const count = gameState.inventory.filter(b => b.rarity === r).length;
                      return (
                        <div key={r} className="bg-zinc-900 border border-white/5 p-5 rounded-xl flex flex-col items-center gap-4">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RARITY_COLORS[r] }} />
                             <span className="font-bold opacity-80 text-sm">{r}合成</span>
                           </div>
                           <div className="text-2xl font-mono">{count} / 3</div>
                           <button
                             disabled={count < 3}
                             onClick={() => composeBlocks(r)}
                             className={`w-full py-2 rounded-lg font-bold transition-all ${
                               count >= 3 ? 'bg-zinc-100 text-zinc-950' : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                             }`}
                           >
                             合成する
                           </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {baseView === 'trade' && (
                <div className="space-y-6">
                   <div className="flex justify-between items-center bg-zinc-900 border border-white/5 p-4 rounded-xl">
                      <div>
                        <h3 className="text-lg font-bold">Traveling Merchants</h3>
                        <p className="text-xs text-zinc-500 font-mono">Offers refresh every 30 seconds</p>
                      </div>
                      <Box className="text-zinc-700" />
                   </div>

                   <div className="space-y-3">
                      {gameState.tradeOffers.map(offer => {
                        const count = gameState.inventory.filter(b => b.rarity === offer.requiredRarity).length;
                        const canFullfill = count >= offer.requiredAmount;
                        return (
                          <div key={offer.id} className="bg-zinc-900/50 border border-white/5 p-5 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-6">
                               <div className="flex items-center gap-2">
                                  <span className="text-zinc-500 text-sm">Offer:</span>
                                  <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RARITY_COLORS[offer.requiredRarity] }} />
                                     <span className="text-xs font-mono">{offer.requiredAmount}x {offer.requiredRarity}</span>
                                  </div>
                               </div>
                               <ChevronRight className="text-zinc-700 hidden md:block" />
                               <div className="flex items-center gap-2">
                                  <span className="text-zinc-500 text-sm">Reward:</span>
                                  <span className="text-yellow-500 font-bold font-mono">${offer.rewardMoney.toLocaleString()}</span>
                               </div>
                            </div>
                            <button
                              disabled={!canFullfill}
                              onClick={() => fulfillTrade(offer.id)}
                              className={`px-8 py-2 rounded-lg font-bold transition-all ${
                                canFullfill ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                              }`}
                            >
                              TRADE
                            </button>
                          </div>
                        )
                      })}
                   </div>
                </div>
              )}

              {baseView === 'shop' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">拠点アップグレード</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-white/5 p-6 rounded-xl flex flex-col justify-between">
                       <div>
                         <h4 className="flex items-center gap-2 font-bold mb-2">
                            <Package className="w-4 h-4 text-blue-400" /> 収納容量の拡大
                         </h4>
                         <p className="text-sm text-zinc-500 mb-6">バックパックに持ち運べるラッキーブロックの最大数を増やします。</p>
                       </div>
                       <button
                         onClick={() => upgradeBase('capacity')}
                         className="w-full bg-blue-500 py-3 rounded-lg font-bold hover:bg-blue-400 transition-all flex flex-col items-center"
                       >
                         <span>アップグレード (${gameState.inventoryCapacity * 200})</span>
                         <span className="text-[10px] opacity-80 uppercase tracking-widest">{gameState.inventoryCapacity} → {gameState.inventoryCapacity + 2} スロット</span>
                       </button>
                    </div>

                    <div className="bg-zinc-900 border border-white/5 p-6 rounded-xl flex flex-col justify-between">
                       <div>
                         <h4 className="flex items-center gap-2 font-bold mb-2">
                            <Zap className="w-4 h-4 text-yellow-400" /> 収入効率アップ
                         </h4>
                         <p className="text-sm text-zinc-500 mb-6">ラッキーブロックから入手できる金額にボーナス倍率をかけます。</p>
                       </div>
                       <button
                         onClick={() => upgradeBase('multiplier')}
                         className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold hover:bg-yellow-400 transition-all flex flex-col items-center"
                       >
                         <span>アップグレード (${Math.floor(gameState.multiplier * 1000)})</span>
                         <span className="text-[10px] opacity-80 uppercase tracking-widest">x{gameState.multiplier.toFixed(1)} → x{(gameState.multiplier + 0.2).toFixed(1)} 報酬</span>
                       </button>
                    </div>
                  </div>
                </div>
              )}

              {baseView === 'premium' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between pb-4 border-b border-pink-500/20">
                     <div>
                       <h3 className="text-2xl font-display text-pink-500">PREMIUM STORE</h3>
                       <p className="text-xs text-zinc-500 uppercase font-mono">ブレインロット体験をさらに強化</p>
                     </div>
                     <Gem className="text-pink-500 w-10 h-10 animate-pulse" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button 
                      onClick={() => buyPremium('pack')}
                      className="bg-gradient-to-br from-zinc-900 to-black border border-pink-500/30 p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:scale-105 transition-transform"
                    >
                      <div className="bg-pink-500/10 p-4 rounded-full">
                         <Box className="w-8 h-8 text-pink-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white">ウルトラ・パック</h4>
                        <p className="text-xs text-zinc-500">レア以上のブロック3個</p>
                      </div>
                      <div className="bg-pink-500 text-black px-6 py-2 rounded-full font-bold flex items-center gap-2">
                         <Gem className="w-4 h-4" /> 50
                      </div>
                    </button>

                    <button 
                      onClick={() => buyPremium('speed')}
                      className="bg-gradient-to-br from-zinc-900 to-black border border-pink-500/30 p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:scale-105 transition-transform"
                    >
                      <div className="bg-cyan-500/10 p-4 rounded-full">
                         <Move className="w-8 h-8 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white">恒久スピード</h4>
                        <p className="text-xs text-zinc-500">移動速度 +20%</p>
                      </div>
                      <div className="bg-pink-500 text-black px-6 py-2 rounded-full font-bold flex items-center gap-2">
                         <Gem className="w-4 h-4" /> 30
                      </div>
                    </button>

                    <button 
                      onClick={() => buyPremium('slots')}
                      className="bg-gradient-to-br from-zinc-900 to-black border border-pink-500/30 p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:scale-105 transition-transform"
                    >
                      <div className="bg-blue-500/10 p-4 rounded-full">
                         <Package className="w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white">巨大バックパック</h4>
                        <p className="text-xs text-zinc-500">スロット +10</p>
                      </div>
                      <div className="bg-pink-500 text-black px-6 py-2 rounded-full font-bold flex items-center gap-2">
                         <Gem className="w-4 h-4" /> 40
                      </div>
                    </button>

                    <button 
                      onClick={() => buyPremium('gems')}
                      className="bg-zinc-100 p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:bg-white transition-colors group"
                    >
                      <div className="bg-zinc-200 p-4 rounded-full group-hover:bg-zinc-300 transition-colors">
                         <CreditCard className="w-8 h-8 text-black" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-black">ジェム購入</h4>
                        <p className="text-xs text-zinc-600">（シミュレーション決済）</p>
                      </div>
                      <div className="bg-black text-white px-6 py-2 rounded-full font-bold">
                         $9.99 / 100 Gems
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Navigation Footer */}
      <nav className="p-4 bg-zinc-950 border-t border-white/5 flex gap-4 z-50">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${
            activeTab === 'map' ? 'bg-zinc-100 text-zinc-950' : 'bg-transparent text-zinc-500 border border-white/5 hover:bg-white/5'
          }`}
        >
          <MapIcon className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest">探索する</span>
        </button>
        <button
          onClick={() => setActiveTab('base')}
          className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${
            activeTab === 'base' ? 'bg-zinc-100 text-zinc-950' : 'bg-transparent text-zinc-500 border border-white/5 hover:bg-white/5'
          }`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest">マイ拠点</span>
        </button>
      </nav>
      
      {/* Mobile Steal Log (Floating) */}
      <AnimatePresence>
        {gameState.inventory.length > 0 && activeTab === 'map' && (
           <motion.div 
             initial={{ x: 100, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             exit={{ x: 100, opacity: 0 }}
             className="absolute bottom-24 right-4 bg-zinc-900 border border-white/10 p-3 rounded-lg z-40 pointer-events-none"
           >
              <div className="flex items-center gap-2">
                 <Package className="w-4 h-4 text-emerald-500" />
                 <span className="text-[10px] font-mono text-zinc-200">
                   最近奪ったアイテム: {gameState.inventory[gameState.inventory.length - 1]?.rarity || 'なし'}
                 </span>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
