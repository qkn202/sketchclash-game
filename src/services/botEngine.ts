import type { Player, DrawAction, Point } from '../types';
import { WORDS } from '../data/words';

export interface BotPreset {
  name: string;
  avatarColor: string;
  eyes: 'happy' | 'cool' | 'wink' | 'star';
  mouth: 'smile' | 'grin' | 'tongue';
  accessory: 'none' | 'glasses' | 'sunglasses' | 'hat' | 'crown' | 'mustache';
}

export const BOT_PRESETS: BotPreset[] = [
  { name: 'Hermione Granger', avatarColor: '#740001', eyes: 'star', mouth: 'smile', accessory: 'glasses' },
  { name: 'Ron Weasley', avatarColor: '#d3a625', eyes: 'happy', mouth: 'grin', accessory: 'none' },
  { name: 'Draco Malfoy', avatarColor: '#1a472a', eyes: 'cool', mouth: 'smile', accessory: 'none' },
  { name: 'Cụ Dumbledore', avatarColor: '#ffd875', eyes: 'wink', mouth: 'smile', accessory: 'mustache' },
];

export function createBotPlayer(index: number = 0): Player {
  const preset = BOT_PRESETS[index % BOT_PRESETS.length];
  return {
    id: `bot_wizard_${Date.now()}_${index}`,
    name: preset.name,
    avatar: {
      color: preset.avatarColor,
      eyes: preset.eyes,
      mouth: preset.mouth,
      accessory: preset.accessory,
    },
    score: 0,
    isHost: false,
    isDrawer: false,
    hasGuessed: false,
    isBot: true,
  };
}

/**
 * Generate magical procedural drawings for Bot Drawer
 */
export function generateProceduralDrawing(word: string, drawerId?: string): DrawAction[] {
  const actions: DrawAction[] = [];
  const lower = word.toLowerCase();

  // Clear canvas first
  actions.push({ type: 'clear' });

  if (lower.includes('snitch') || lower.includes('vàng')) {
    // === Golden Snitch (Quả Snitch Vàng) ===
    actions.push(createCircleStroke(400, 250, 42, '#ffd700', 8));
    actions.push({ type: 'fill', fill: { x: 400, y: 250, color: '#ffd700' } });
    // Left Wing
    actions.push(createLineStroke([
      { x: 358, y: 240 },
      { x: 280, y: 170 },
      { x: 200, y: 180 },
      { x: 260, y: 220 },
      { x: 358, y: 250 }
    ], '#cbd5e1', 6));
    // Right Wing
    actions.push(createLineStroke([
      { x: 442, y: 240 },
      { x: 520, y: 170 },
      { x: 600, y: 180 },
      { x: 540, y: 220 },
      { x: 442, y: 250 }
    ], '#cbd5e1', 6));
    // Lumos starlight trail
    actions.push(createVfxStroke('sparkle', [
      { x: 300, y: 280 }, { x: 340, y: 260 }, { x: 380, y: 250 }
    ], '#ffd875', 10));
    actions.push(createVfxStroke('sparkle', [
      { x: 500, y: 280 }, { x: 460, y: 260 }, { x: 420, y: 250 }
    ], '#ffd875', 10));
  } else if (lower.includes('mũ') || lower.includes('phân loại') || lower.includes('hat')) {
    // === The Sorting Hat (Mũ Phân Loại) ===
    // Brim
    actions.push(createLineStroke([
      { x: 220, y: 360 },
      { x: 580, y: 360 },
      { x: 550, y: 390 },
      { x: 250, y: 390 },
      { x: 220, y: 360 }
    ], '#3e2723', 8));
    actions.push({ type: 'fill', fill: { x: 400, y: 375, color: '#4e342e' } });
    // Cone peak
    actions.push(createLineStroke([
      { x: 270, y: 360 },
      { x: 350, y: 220 },
      { x: 400, y: 140 },
      { x: 460, y: 230 },
      { x: 530, y: 360 }
    ], '#3e2723', 8));
    actions.push({ type: 'fill', fill: { x: 400, y: 260, color: '#4e342e' } });
    // Eyes & Mouth folds
    actions.push(createLineStroke([{ x: 340, y: 280 }, { x: 380, y: 290 }], '#1a0d00', 6));
    actions.push(createLineStroke([{ x: 420, y: 290 }, { x: 460, y: 280 }], '#1a0d00', 6));
    actions.push(createLineStroke([{ x: 340, y: 330 }, { x: 400, y: 345 }, { x: 460, y: 325 }], '#1a0d00', 7));
    // Magical aura around hat
    actions.push(createVfxStroke('sparkle', [
      { x: 300, y: 320 }, { x: 400, y: 150 }, { x: 500, y: 320 }
    ], '#ffd875', 10));
  } else if (lower.includes('đũa') || lower.includes('wand')) {
    // === Magic Wand (Đũa Phép) ===
    actions.push(createLineStroke([{ x: 250, y: 380 }, { x: 480, y: 190 }], '#5c3a21', 12));
    actions.push(createLineStroke([{ x: 230, y: 395 }, { x: 290, y: 350 }], '#27130c', 16));
    // Lumos sparkles shooting from wand tip
    actions.push(createVfxStroke('sparkle', [
      { x: 480, y: 190 }, { x: 520, y: 155 }, { x: 560, y: 130 }
    ], '#ffd875', 16));
    // Incendio flame spark
    actions.push(createVfxStroke('fire', [
      { x: 520, y: 155 }, { x: 570, y: 170 }, { x: 610, y: 140 }
    ], '#ff4500', 14));
  } else if (lower.includes('tử thần') || lower.includes('deathly')) {
    // === Deathly Hallows (Bảo Bối Tử Thần) ===
    // Triangle
    actions.push(createLineStroke([
      { x: 400, y: 150 },
      { x: 490, y: 320 },
      { x: 310, y: 320 },
      { x: 400, y: 150 }
    ], '#1e293b', 8));
    // Circle inside
    actions.push(createCircleStroke(400, 265, 55, '#1e293b', 7));
    // Elder Wand line
    actions.push(createLineStroke([{ x: 400, y: 150 }, { x: 400, y: 320 }], '#1e293b', 8));
    actions.push(createVfxStroke('sparkle', [
      { x: 320, y: 300 }, { x: 400, y: 160 }, { x: 480, y: 300 }
    ], '#ffd875', 12));
  } else if (lower.includes('chổi') || lower.includes('nimbus') || lower.includes('firebolt')) {
    // === Flying Broom (Chổi Bay) ===
    actions.push(createLineStroke([{ x: 220, y: 340 }, { x: 480, y: 200 }], '#78350f', 12));
    actions.push(createLineStroke([
      { x: 460, y: 210 },
      { x: 570, y: 140 },
      { x: 580, y: 180 },
      { x: 480, y: 220 }
    ], '#d97706', 10));
    actions.push(createVfxStroke('fire', [
      { x: 500, y: 200 }, { x: 580, y: 180 }, { x: 640, y: 190 }
    ], '#ff7a00', 14));
  } else if (lower.includes('lửa') || lower.includes('incendio')) {
    // === Incendio Fire Spell ===
    actions.push(createVfxStroke('fire', [
      { x: 260, y: 320 }, { x: 340, y: 210 }, { x: 400, y: 150 },
      { x: 460, y: 210 }, { x: 540, y: 320 }
    ], '#ff4500', 28));
  } else if (lower.includes('băng') || lower.includes('glisseo') || lower.includes('tuyết')) {
    // === Glisseo Frost Spell ===
    actions.push(createVfxStroke('ice', [
      { x: 250, y: 250 }, { x: 350, y: 180 }, { x: 450, y: 300 }, { x: 550, y: 250 }
    ], '#38bdf8', 24));
  } else if (lower.includes('harry') || lower.includes('potter')) {
    // === Harry Potter (Round glasses + ⚡ lightning scar) ===
    actions.push(createCircleStroke(400, 260, 90, '#faedcd', 8));
    actions.push({ type: 'fill', fill: { x: 400, y: 260, color: '#faedcd' } });
    // Round glasses
    actions.push(createCircleStroke(360, 255, 24, '#1a1a1a', 5));
    actions.push(createCircleStroke(440, 255, 24, '#1a1a1a', 5));
    actions.push(createLineStroke([{ x: 384, y: 255 }, { x: 416, y: 255 }], '#1a1a1a', 5));
    // Lightning bolt scar ⚡
    actions.push(createLineStroke([
      { x: 390, y: 185 },
      { x: 405, y: 205 },
      { x: 395, y: 205 },
      { x: 410, y: 225 }
    ], '#b91c1c', 5));
    // Smile
    actions.push(createLineStroke([{ x: 375, y: 310 }, { x: 400, y: 325 }, { x: 425, y: 310 }], '#1a1a1a', 6));
  } else {
    // General wizard cauldron / potion flask
    actions.push(createCircleStroke(400, 280, 80, '#1e293b', 10));
    actions.push({ type: 'fill', fill: { x: 400, y: 280, color: '#0f172a' } });
    // Cauldron rim
    actions.push(createLineStroke([{ x: 310, y: 220 }, { x: 490, y: 220 }], '#334155', 14));
    // Magical potion sparks
    actions.push(createVfxStroke('sparkle', [
      { x: 380, y: 200 }, { x: 400, y: 160 }, { x: 420, y: 130 }
    ], '#10ac84', 12));
  }

  return drawerId ? actions.map((a) => ({ ...a, drawerId })) : actions;
}

function createLineStroke(points: Point[], color: string, size: number): DrawAction {
  return {
    type: 'stroke',
    stroke: {
      id: `stroke_magic_${Math.random()}`,
      tool: 'brush',
      color,
      size,
      points,
    },
  };
}

function createVfxStroke(tool: 'brush' | 'fire' | 'ice' | 'sparkle' | 'bucket' | 'eraser', points: Point[], color: string, size: number): DrawAction {
  return {
    type: 'stroke',
    stroke: {
      id: `vfx_magic_${Math.random()}`,
      tool,
      color,
      size,
      points,
    },
  };
}

function createCircleStroke(cx: number, cy: number, r: number, color: string, size: number): DrawAction {
  const points: Point[] = [];
  const segments = 24;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }
  return createLineStroke(points, color, size);
}

/**
 * Simulated Guess for Harry Potter Bots
 */
export function getBotGuess(
  word: string,
  lang: 'vi' | 'en' = 'vi',
  isAccurate: boolean = false
): string {
  if (isAccurate) {
    return word;
  }

  const pool = WORDS[lang];
  const randomPick = pool[Math.floor(Math.random() * pool.length)];
  return randomPick;
}
