export interface WordBank {
  vi: string[];
  en: string[];
}

export const WORDS: WordBank = {
  vi: [
    // === PHÁP BẢO, ĐỒ VẬT MA THUẬT & TRANG BỊ ===
    'Đũa phép',
    'Chổi bay',
    'Mũ Phân Loại',
    'Áo choàng tàng hình',
    'Bản đồ Đạo tặc',
    'Xoay Thời gian',
    'Gương Ảo ảnh',
    'Chén Lửa',
    'Quả cầu Gợi nhớ',
    'Quả cầu Pha lê',
    'Vạc phù thủy',
    'Thư cú',
    'Thư Sấm',
    'Đá Phù thủy',
    'Tưởng Ký',
    'Bột Floo',
    'Kính Thiên văn',
    'Cân đồng',
    'Đèn Tắt sáng',
    'Còi Báo động',
    'Bàn tay Khỉ khô',
    'Gương Hai chiều',
    'Đồng hồ nhà Weasley',
    'Cúp Tam Pháp Thuật',
    'Cúp Nhà',

    // === QUIDDITCH ===
    'Trái Snitch',
    'Trái Quaffle',
    'Trái Bludger',
    'Gậy Đập thủ',
    'Vòng tròn gôn',

    // === TRƯỜNG LỚP & ĐỊA DANH ===
    'Đại Sảnh Đường',
    'Phòng Chứa Bí Mật',
    'Phòng Theo Yêu Cầu',
    'Rừng Cấm',
    'Hồ Đen',
    'Cây Liễu Roi',
    'Nhà Kính Thảo dược',
    'Tháp Thiên văn',
    'Tháp Cú',
    'Bệnh Thất',
    'Hầm Độc dược',
    'Thư viện Hogwarts',
    'Hẻm Xéo',
    'Hẻm Knockturn',
    'Quán Cái Vạc Lủng',
    'Lều Hét',
    'Trạm xe Chín Ba Phần Tư',

    // === SINH VẬT HUYỀN BÍ & MA QUỶ ===
    'Nhân mã',
    'Kỳ lân',
    'Bằng mã',
    'Vong mã',
    'Giám ngục',
    'Gia tinh',
    'Yêu tinh',
    'Người sói',
    'Thủy quái',
    'Rồng phun lửa',
    'Ông Kẹ',
    'Cây Chùm bẫy quỷ',
    'Cây Mandrake',
    'Ma Trêu chọc',
    'Hồn ma',
    'Mèo bà Norris',

    // === MÓN ĂN & BÁNH KẸO PHÙ THỦY ===
    'Bia bơ',
    'Nước bí đỏ',
    'Ếch sô-cô-la',
    'Kẹo Bông lan Bột đường',
    'Kẹo Mút có gai',
    'Bánh Ca-la-men béo ngậy',

    // === TÊN RIÊNG: NHÂN VẬT & THÚ CƯNG ===
    'Harry Potter',
    'Hermione Granger',
    'Ron Weasley',
    'Albus Dumbledore',
    'Severus Snape',
    'Minerva McGonagall',
    'Lord Voldemort',
    'Draco Malfoy',
    'Rubeus Hagrid',
    'Sirius Black',
    'Remus Lupin',
    'Ginny Weasley',
    'Neville Longbottom',
    'Luna Lovegood',
    'Hedwig',
    'Fawkes',
    'Buckbeak',
    'Aragog',
    'Nagini',
    'Fluffy',
    'Dobby',
    'Kreacher',
    'Crookshanks',
    'Scabbers',
    'Peeves',
    'Trevor',

    // === TÊN RIÊNG: BÙA CHÚ & CÂU THẦN CHÚ ===
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
    'Incendio',
    'Aguamenti',
    'Silencio',
    'Sectumsempra',
    'Avada Kedavra',
    'Crucio',
    'Imperio',

    // === CHỦ ĐỀ ĐỜI SỐNG & PHỔ THÔNG (50 TỪ THƯỜNG) ===
    // Đồ vật gia đình & Học tập
    'Bút chì',
    'Cặp sách',
    'Đồng hồ đeo tay',
    'Bàn ủi',
    'Tủ lạnh',
    'Quạt máy',
    'Cây kéo',
    'Gương soi',
    'Mắt kính',
    'Chiếc dù',
    'Bóng đèn',
    'Điện thoại',

    // Phương tiện & Địa điểm
    'Xe đạp',
    'Xe buýt',
    'Máy bay',
    'Thuyền buồm',
    'Tàu hỏa',
    'Khinh khí cầu',
    'Cây cầu',
    'Ngọn hải đăng',
    'Bãi biển',

    // Thiên nhiên & Hiện tượng
    'Mặt trời',
    'Mặt trăng',
    'Cầu vồng',
    'Sao băng',
    'Cơn mưa',
    'Ngọn núi',
    'Bông hoa',
    'Núi lửa',

    // Động vật gần gũi
    'Con mèo',
    'Con chó',
    'Con gà',
    'Chim cánh cụt',
    'Con rùa',
    'Con cá',
    'Con thỏ',
    'Con bướm',
    'Con ong',
    'Con hươu cao cổ',
    'Con khỉ',

    // Ẩm thực & Trái cây quen thuộc
    'Bánh mì',
    'Bánh sinh nhật',
    'Trứng ốp la',
    'Cà phê',
    'Kem que',
    'Quả chuối',
    'Quả dưa hấu',
    'Quả táo',
    'Củ cà rốt',
    'Bắp ngô',
  ],
  en: [
    // === HARRY POTTER ARTIFACTS ===
    'Magic Wand', 'Nimbus 2000', 'Golden Snitch', 'Sorting Hat', 'Invisibility Cloak',
    'Marauders Map', 'Time Turner', 'Mirror of Erised', 'Sword of Gryffindor', 'Goblet of Fire',
    'Flying Car', 'Remembrall', 'Crystal Ball', 'Potion Cauldron', 'Ravenclaw Diadem',
    'Tom Riddle Diary', 'Philosophers Stone', 'Triwizard Cup', 'Hogwarts Letter',

    // === MAGICAL CREATURES ===
    'Hedwig Owl', 'Fawkes Phoenix', 'Buckbeak Hippogriff', 'Aragog Spider', 'Nagini Snake',
    'Fluffy Three Headed Dog', 'Hungarian Horntail Dragon', 'Azkaban Dementor', 'Dobby House Elf', 'Centaur',
    'Crookshanks Cat', 'Unicorn', 'Scabbers Rat', 'Thestral',

    // === CHARACTERS & PLACES ===
    'Harry Potter', 'Hermione Granger', 'Ron Weasley', 'Albus Dumbledore', 'Severus Snape',
    'Professor McGonagall', 'Lord Voldemort', 'Draco Malfoy', 'Rubeus Hagrid', 'Sirius Black',
    'Hogwarts Castle', 'Diagon Alley', 'Forbidden Forest', 'Platform 9 3/4', 'Hogwarts Express',
    'Chamber of Secrets', 'Great Hall', 'Hagrids Hut', 'Gringotts Bank',

    // === SPELLS & FEAST ===
    'Butterbeer', 'Chocolate Frog', 'Bertie Botts Every Flavour Beans', 'Pumpkin Juice',
    'Lumos', 'Expecto Patronum', 'Wingardium Leviosa', 'Patronus'
  ]
};

/**
 * Normalize text for guessing comparison
 */
export function normalizeGuess(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

/**
 * Exact match comparison
 */
export function isWordMatch(guess: string, target: string): boolean {
  const g = guess.trim().toLowerCase();
  const t = target.trim().toLowerCase();
  if (g === t) return true;
  return normalizeGuess(g) === normalizeGuess(t);
}

/**
 * Levenshtein distance for close-guess ("You're close!") detection
 */
export function levenshteinDistance(a: string, b: string): number {
  const normA = normalizeGuess(a);
  const normB = normalizeGuess(b);

  const matrix: number[][] = [];
  for (let i = 0; i <= normB.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= normA.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= normB.length; i++) {
    for (let j = 1; j <= normA.length; j++) {
      if (normB.charAt(i - 1) === normA.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[normB.length][normA.length];
}

/**
 * Detect whether a chat message from a player who already knows a secret word
 * leaks that secret word (exact, normalized substring, fuzzy phrase, or distinctive token).
 */
export function containsWordSpoiler(message: string, target: string): boolean {
  const normMsg = normalizeGuess(message);
  const normTarget = normalizeGuess(target);
  if (!normMsg || !normTarget) return false;
  if (isWordMatch(message, target)) return true;
  if (normTarget.length >= 2 && normMsg.includes(normTarget)) return true;

  const maxDist = normTarget.length >= 6 ? 2 : normTarget.length >= 4 ? 1 : 0;
  if (maxDist > 0 && levenshteinDistance(normMsg, normTarget) <= maxDist) return true;

  const msgTokens = normMsg.split(/[^a-z0-9]+/).filter(Boolean);
  const targetTokens = normTarget.split(/[^a-z0-9]+/).filter(Boolean);

  if (targetTokens.length > 0 && msgTokens.length >= targetTokens.length && maxDist > 0) {
    const winLen = targetTokens.length;
    for (let i = 0; i <= msgTokens.length - winLen; i++) {
      const candidate = msgTokens.slice(i, i + winLen).join(' ');
      if (levenshteinDistance(candidate, normTarget) <= maxDist) return true;
    }
  }

  if (targetTokens.length >= 2) {
    for (const tok of targetTokens) {
      if (tok.length >= 5 && msgTokens.includes(tok)) {
        return true;
      }
    }
  }

  return false;
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Get 3 random words for selection, prioritizing words not yet used in the current match
 * and preserving & deduplicating custom words by padding from the default bank.
 */
export function getRandomWordChoices(
  lang: 'vi' | 'en' = 'vi',
  customWords: string[] = [],
  excludeNormalized?: ReadonlySet<string>
): string[] {
  const defaultBank = WORDS[lang] || WORDS.vi;
  const normalizedExclude = excludeNormalized ?? new Set<string>();

  const trimmedCustom = customWords.map((w) => w.trim()).filter((w) => w.length > 0);
  const customPool: string[] = [];
  const seenCustom = new Set<string>();
  for (const word of trimmedCustom) {
    const norm = normalizeGuess(word);
    if (!norm || seenCustom.has(norm)) continue;
    seenCustom.add(norm);
    customPool.push(word);
  }

  const defaultPool: string[] = [];
  const seenDefault = new Set<string>();
  for (const word of defaultBank) {
    const norm = normalizeGuess(word);
    if (!norm || seenDefault.has(norm)) continue;
    seenDefault.add(norm);
    defaultPool.push(word);
  }

  const freshCustom = customPool.filter((w) => !normalizedExclude.has(normalizeGuess(w)));
  const freshDefault = defaultPool.filter((w) => !normalizedExclude.has(normalizeGuess(w)));

  const candidates: string[] = [];
  const selectedNorms = new Set<string>();

  const addUnique = (source: string[]) => {
    const shuffled = shuffleInPlace([...source]);
    for (const item of shuffled) {
      if (candidates.length >= 3) break;
      const norm = normalizeGuess(item);
      if (!selectedNorms.has(norm)) {
        selectedNorms.add(norm);
        candidates.push(item);
      }
    }
  };

  addUnique(freshCustom);

  if (candidates.length < 3 && customPool.length >= 3) {
    addUnique(customPool);
  }

  if (candidates.length < 3) {
    addUnique(freshDefault);
  }

  if (candidates.length < 3) {
    addUnique(defaultPool);
  }

  return candidates.slice(0, 3);
}

/**
 * Create masked word with underscores and revealed letters
 */
export function createMaskedWord(word: string, revealedIndices: number[]): string {
  return word
    .split('')
    .map((char, index) => {
      if (char === ' ') return '   ';
      if (revealedIndices.includes(index)) return char;
      return '_';
    })
    .join(' ');
}

/**
 * Whether a character is unmasked (like spaces and hyphens)
 */
export function isUnmaskedChar(char: string): boolean {
  return char === ' ' || char === '-';
}

/**
 * Count total maskable characters (non-space characters)
 */
export function countMaskableChars(word: string): number {
  return word.split('').filter((c) => !isUnmaskedChar(c)).length;
}

/**
 * Get maskable indices (indices of non-space characters)
 */
export function getMaskableIndices(word: string): number[] {
  return word
    .split('')
    .map((c, i) => (!isUnmaskedChar(c) ? i : -1))
    .filter((i) => i !== -1);
}
