import type { DrawAction, DrawStroke, Point } from '../types';
import { isWordMatch, normalizeGuess } from './words';
import { generateProceduralDrawing } from '../services/botEngine';

export interface CategorizedWordGroup {
  category: string;
  words: string[];
}

export const CATEGORIZED_HOGWARTS_WORDS: Record<'vi' | 'en', CategorizedWordGroup[]> = {
  vi: [
    {
      category: 'Sinh Vật Huyền Bí',
      words: [
        'Hedwig',
        'Fawkes',
        'Buckbeak',
        'Aragog',
        'Nagini',
        'Fluffy',
        'Dobby',
        'Crookshanks',
        'Kỳ lân',
        'Nhân mã',
        'Bằng mã',
        'Vong mã',
        'Giám ngục',
        'Gia tinh',
        'Yêu tinh',
        'Người sói',
        'Ông Kẹ',
      ],
    },
    {
      category: 'Pháp Bảo & Bảo Bối',
      words: [
        'Đũa phép',
        'Chổi bay',
        'Trái Snitch',
        'Mũ Phân Loại',
        'Áo choàng tàng hình',
        'Bản đồ Đạo tặc',
        'Xoay Thời gian',
        'Gương Ảo ảnh',
        'Chén Lửa',
        'Đá Phù thủy',
        'Tưởng Ký',
        'Bột Floo',
        'Quả cầu Gợi nhớ',
        'Quả cầu Pha lê',
        'Thư Sấm',
        'Cúp Tam Pháp Thuật',
      ],
    },
    {
      category: 'Độc Dược & Yến Tiệc',
      words: [
        'Vạc phù thủy',
        'Bia bơ',
        'Nước bí đỏ',
        'Ếch sô-cô-la',
        'Kẹo Bông lan Bột đường',
        'Kẹo Mút có gai',
        'Bánh Ca-la-men béo ngậy',
      ],
    },
    {
      category: 'Địa Danh Phép Thuật',
      words: [
        'Đại Sảnh Đường',
        'Phòng Chứa Bí Mật',
        'Phòng Theo Yêu Cầu',
        'Rừng Cấm',
        'Hồ Đen',
        'Cây Liễu Roi',
        'Nhà Kính Thảo dược',
        'Tháp Thiên văn',
        'Thư viện Hogwarts',
        'Hẻm Xéo',
        'Hẻm Knockturn',
        'Lều Hét',
        'Trạm xe Chín Ba Phần Tư',
      ],
    },
    {
      category: 'Bùa Chú & Phép Thuật',
      words: [
        'Accio',
        'Alohomora',
        'Lumos',
        'Nox',
        'Expelliarmus',
        'Stupefy',
        'Petrificus Totalus',
        'Wingardium Leviosa',
        'Expecto Patronum',
        'Riddikulus',
        'Obliviate',
        'Reducto',
        'Avada Kedavra',
      ],
    },
    {
      category: 'Đời Sống & Phổ Thông',
      words: [
        'Bút chì',
        'Đồng hồ đeo tay',
        'Tủ lạnh',
        'Mắt kính',
        'Chiếc dù',
        'Xe đạp',
        'Máy bay',
        'Thuyền buồm',
        'Cầu vồng',
        'Mặt trời',
        'Bãi biển',
        'Con mèo',
        'Chim cánh cụt',
        'Con thỏ',
        'Bánh sinh nhật',
        'Kem que',
        'Quả dưa hấu',
      ],
    },
  ],
  en: [
    {
      category: 'Magical Creatures',
      words: [
        'Hedwig Owl',
        'Fawkes Phoenix',
        'Buckbeak Hippogriff',
        'Aragog Spider',
        'Nagini Snake',
        'Fluffy Three Headed Dog',
        'Hungarian Horntail Dragon',
        'Dobby House Elf',
        'Crookshanks Cat',
        'Unicorn',
      ],
    },
    {
      category: 'Enchanted Relics',
      words: [
        'Magic Wand',
        'Nimbus 2000',
        'Golden Snitch',
        'Sorting Hat',
        'Invisibility Cloak',
        'Marauders Map',
        'Time Turner',
        'Sword of Gryffindor',
        'Goblet of Fire',
        'Crystal Ball',
      ],
    },
    {
      category: 'Potions & Feast',
      words: [
        'Potion Cauldron',
        'Butterbeer',
        'Chocolate Frog',
        'Pumpkin Juice',
        'Bertie Botts Every Flavour Beans',
      ],
    },
    {
      category: 'Wizarding Locations',
      words: [
        'Hogwarts Castle',
        'Hogwarts Express',
        'Flying Car',
        'Platform 9 3/4',
        'Forbidden Forest',
        'Hagrids Hut',
      ],
    },
  ],
};

export const IMPOSTOR_INK_PALETTE: { hex: string; label: string }[] = [
  { hex: '#b91c1c', label: 'Đỏ Phượng Hoàng' },
  { hex: '#1d4ed8', label: 'Xanh Thần Sáng' },
  { hex: '#15803d', label: 'Lục Độc Dược' },
  { hex: '#7e22ce', label: 'Tím Hắc Ám' },
  { hex: '#c2410c', label: 'Cam Lửa Rồng' },
  { hex: '#0f766e', label: 'Ngọc Hồ Đen' },
  { hex: '#be185d', label: 'Hồng Tình Dược' },
  { hex: '#334155', label: 'Xám Thép Cổ' },
];

export const RELAY_STARTER_PROMPTS: Record<'vi' | 'en', string[]> = {
  vi: [
    'Cụ Dumbledore cưỡi chổi uống trà sữa trân châu',
    'Gia tinh Dobby đeo kính râm đi dạo bãi biển',
    'Chúa tể Voldemort đứng chiên trứng ốp la trong bếp',
    'Cú Hedwig đội Mũ Phân Loại giao thư siêu tốc',
    'Rồng Đuôi Gai khạc lửa nướng kẹo dẻo cắm trại',
    'Thầy Snape mỉm cười chụp ảnh bên Vạc Độc Dược',
    'Ron Weasley lái Chiếc Xe Bay vướng trên ngọn cây',
    'Mèo Crookshanks cầm Đũa phép đuổi theo Quả Snitch Vàng',
    'Bác Hagrid ôm Chó Ba Đầu Fluffy ngủ gật',
    'Harry Potter cưỡi Chổi Nimbus 2000 tránh sấm sét',
    'Ếch Socola nhảy vọt khỏi Tàu Tốc Hành Hogwarts',
    'Phượng Hoàng Fawkes đậu trên Thanh Kiếm Gryffindor',
  ],
  en: [
    'Dumbledore riding a broomstick while drinking boba tea',
    'Dobby wearing sunglasses relaxing on a sunny beach',
    'Lord Voldemort frying eggs in a tiny kitchen',
    'Hedwig wearing the Sorting Hat delivering urgent mail',
    'A giant dragon roasting marshmallows over campfire',
    'Professor Snape smiling beside a bubbling cauldron',
    'Ron Weasley parking the Flying Car in a giant tree',
    'Crookshanks chasing the Golden Snitch with a wand',
    'Hagrid singing lullabies to Fluffy the three headed dog',
    'A Chocolate Frog leaping off the Hogwarts Express',
  ],
};

export function pickCategorizedWord(
  lang: 'vi' | 'en',
  customWords: string[] = [],
  excludeNormalized?: Set<string>
): { category: string; word: string } {
  const cleanCustom = customWords.map((w) => w.trim()).filter(Boolean);
  if (cleanCustom.length >= 2 && Math.random() < 0.45) {
    const freshCustom = cleanCustom.filter((w) => !excludeNormalized?.has(normalizeGuess(w)));
    const pool = freshCustom.length > 0 ? freshCustom : cleanCustom;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    excludeNormalized?.add(normalizeGuess(picked));
    return {
      category: lang === 'vi' ? 'Từ Khóa Riêng Của Phòng' : 'Custom Room Topic',
      word: picked,
    };
  }

  const groups = CATEGORIZED_HOGWARTS_WORDS[lang] || CATEGORIZED_HOGWARTS_WORDS.vi;
  const flatCandidates: { category: string; word: string }[] = [];
  groups.forEach((g) => {
    g.words.forEach((word) => {
      if (!excludeNormalized?.has(normalizeGuess(word))) {
        flatCandidates.push({ category: g.category, word });
      }
    });
  });

  if (flatCandidates.length === 0) {
    excludeNormalized?.clear();
    const fallbackGroup = groups[Math.floor(Math.random() * groups.length)];
    const fallbackWord = fallbackGroup.words[Math.floor(Math.random() * fallbackGroup.words.length)];
    excludeNormalized?.add(normalizeGuess(fallbackWord));
    return { category: fallbackGroup.category, word: fallbackWord };
  }

  const chosen = flatCandidates[Math.floor(Math.random() * flatCandidates.length)];
  excludeNormalized?.add(normalizeGuess(chosen.word));
  return chosen;
}

export function pickRandomRelayPrompt(lang: 'vi' | 'en', usedNormalized?: Set<string>): string {
  const pool = RELAY_STARTER_PROMPTS[lang] || RELAY_STARTER_PROMPTS.vi;
  const available = pool.filter((p) => !usedNormalized?.has(normalizeGuess(p)));
  const source = available.length > 0 ? available : pool;
  const chosen = source[Math.floor(Math.random() * source.length)];
  usedNormalized?.add(normalizeGuess(chosen));
  return chosen;
}

function makeSimpleStroke(points: Point[], color: string, size: number = 6): DrawAction {
  const stroke: DrawStroke = {
    id: `party_st_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tool: 'brush',
    color,
    size,
    points,
  };
  return { type: 'stroke', stroke };
}

function makeCirclePoints(cx: number, cy: number, rx: number, ry: number = rx, steps: number = 22): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const ang = (i / steps) * Math.PI * 2;
    pts.push({ x: Math.round(cx + Math.cos(ang) * rx), y: Math.round(cy + Math.sin(ang) * ry) });
  }
  return pts;
}

/**
 * Generates a lively multi-stroke cartoon sketch for AI Bots in Relay Phone mode.
 */
export function generateRelayBotDrawing(prompt: string, botId: string): DrawAction[] {
  const base = generateProceduralDrawing(prompt, botId, true);
  // Add a cheerful stick-wizard silhouette on the side so compound prompts look comic & expressive
  const wizardExtras: DrawAction[] = [
    makeSimpleStroke(makeCirclePoints(165, 220, 24, 24), '#1e293b', 5),
    makeSimpleStroke(
      [
        { x: 138, y: 202 },
        { x: 165, y: 152 },
        { x: 192, y: 202 },
        { x: 138, y: 202 },
      ],
      '#4a154b',
      5
    ),
    makeSimpleStroke(
      [
        { x: 165, y: 244 },
        { x: 165, y: 330 },
        { x: 138, y: 382 },
      ],
      '#1e293b',
      5
    ),
    makeSimpleStroke(
      [
        { x: 165, y: 330 },
        { x: 192, y: 382 },
      ],
      '#1e293b',
      5
    ),
    makeSimpleStroke(
      [
        { x: 145, y: 274 },
        { x: 222, y: 252 },
      ],
      '#740001',
      5
    ),
  ];
  return [...base, ...wizardExtras].map((act, idx) => ({
    ...act,
    drawerId: botId,
    _seq: idx + 1,
  }));
}

/**
 * Simulates humorous "Tam Sao Thất Bản" telephone drift for AI Bots guessing a Relay drawing.
 */
export function generateBotRelayGuess(sourceText: string, lang: 'vi' | 'en'): string {
  const clean = sourceText.trim();
  if (!clean) {
    return lang === 'vi' ? 'Phù thủy đang múa đũa phép bí ẩn' : 'A wizard casting a mysterious spell';
  }
  if (Math.random() < 0.35) {
    return clean;
  }
  const norm = normalizeGuess(clean);
  if (lang === 'vi') {
    if (norm.includes('choi') || norm.includes('nimbus')) return 'Phù thủy cưỡi chổi bay siêu tốc trên trời';
    if (norm.includes('snitch')) return 'Phù thủy vung đũa bắt Quả Snitch Vàng';
    if (norm.includes('mu') || norm.includes('hedwig') || norm.includes('cu')) return 'Chim cú đội nón phù thủy đưa thư';
    if (norm.includes('rong') || norm.includes('lua')) return 'Quái thú khạc lửa bên trại phép thuật';
    if (norm.includes('vac') || norm.includes('snape') || norm.includes('tra')) return 'Pháp sư đứng khuấy vạc độc dược bốc khói';
    if (norm.includes('xe')) return 'Chiếc xe phép thuật bay ngang bầu trời Hogwarts';
    return `Phù thủy Hogwarts và ${clean.split(' ').slice(-3).join(' ')}`;
  }
  if (norm.includes('broom')) return 'A wizard zooming across the sky on a broom';
  if (norm.includes('dragon') || norm.includes('fire')) return 'A fierce dragon breathing magical fire';
  if (norm.includes('owl') || norm.includes('hat')) return 'An owl wearing a tall wizard hat';
  return `A wizard sketching ${clean.split(' ').slice(-3).join(' ')}`;
}

export function scoreRelayGuessSimilarity(originalPrompt: string, guessText: string): boolean {
  if (!originalPrompt || !guessText) return false;
  if (isWordMatch(originalPrompt, guessText)) return true;
  const origTokens = normalizeGuess(originalPrompt)
    .split(' ')
    .filter((w) => w.length >= 3);
  const guessTokens = new Set(
    normalizeGuess(guessText)
      .split(' ')
      .filter((w) => w.length >= 3)
  );
  if (origTokens.length === 0) return false;
  const overlap = origTokens.filter((t) => guessTokens.has(t)).length;
  return overlap >= Math.max(2, Math.ceil(origTokens.length * 0.45));
}

/**
 * Emits strictly ONE single stroke in the bot's signature inkColor for Polyjuice Impostor mode.
 * Real bots contribute an authentic stroke from the secretWord; Impostor bots draw a plausible bluff stroke!
 */
export function generateImpostorBotSingleStroke(
  isImpostor: boolean,
  secretWord: string,
  category: string,
  passNumber: number,
  inkColor: string,
  botId: string,
  turnSlotIndex: number
): DrawAction {
  const jitter = ((turnSlotIndex % 3) - 1) * 8;
  if (!isImpostor && secretWord) {
    const strokesOnly = generateProceduralDrawing(secretWord, botId, false).filter(
      (a) => a.type === 'stroke' && a.stroke && a.stroke.points.length > 0
    );
    if (strokesOnly.length > 0) {
      const pickIdx = (passNumber - 1 + turnSlotIndex) % strokesOnly.length;
      const baseStroke = strokesOnly[pickIdx].stroke!;
      return {
        type: 'stroke',
        drawerId: botId,
        stroke: {
          ...baseStroke,
          id: `imp_bot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          tool: 'brush',
          color: inkColor,
          size: 6,
          points: baseStroke.points.map((pt) => ({
            x: Math.max(40, Math.min(760, pt.x + jitter)),
            y: Math.max(40, Math.min(460, pt.y + jitter)),
          })),
        },
      };
    }
  }

  // Impostor bluff stroke: plausible curve/detail based ONLY on public category (never secretWord!)
  const normCat = normalizeGuess(category);
  const cx = 380 + jitter * 3;
  const cy = passNumber === 1 ? 245 + jitter : 285 - jitter;
  let bluffPoints: Point[];

  if (normCat.includes('sinh vat') || normCat.includes('creature')) {
    bluffPoints = [
      { x: cx - 75, y: cy + 20 },
      { x: cx - 35, y: cy - 35 },
      { x: cx + 25, y: cy - 30 },
      { x: cx + 70, y: cy + 18 },
    ];
  } else if (normCat.includes('doc duoc') || normCat.includes('potion')) {
    bluffPoints = makeCirclePoints(cx, cy - 25, 34, 24, 16);
  } else if (normCat.includes('dia danh') || normCat.includes('location')) {
    bluffPoints = [
      { x: cx - 70, y: cy + 55 },
      { x: cx - 70, y: cy - 35 },
      { x: cx - 25, y: cy - 75 },
      { x: cx + 20, y: cy - 35 },
      { x: cx + 20, y: cy + 55 },
    ];
  } else {
    bluffPoints = makeCirclePoints(cx, cy, 48 + passNumber * 10, 32, 18);
  }

  return {
    ...makeSimpleStroke(bluffPoints, inkColor, 6),
    drawerId: botId,
  };
}

export function pickBotImpostorCounterGuess(
  category: string,
  secretWord: string,
  lang: 'vi' | 'en'
): string {
  if (secretWord && Math.random() < 0.25) {
    return secretWord;
  }
  const groups = CATEGORIZED_HOGWARTS_WORDS[lang] || CATEGORIZED_HOGWARTS_WORDS.vi;
  const matchingGroup =
    groups.find((g) => normalizeGuess(g.category) === normalizeGuess(category)) || groups[0];
  const wrongCandidates = matchingGroup.words.filter((w) => !isWordMatch(w, secretWord));
  if (wrongCandidates.length === 0) return matchingGroup.words[0] || 'Đũa phép';
  return wrongCandidates[Math.floor(Math.random() * wrongCandidates.length)];
}

