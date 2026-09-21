export interface WordBank {
  vi: string[];
  en: string[];
}

export const WORDS: WordBank = {
  vi: [
    // === VẬT PHẨM & PHÁP BẢO HARRY POTTER ===
    'Đũa phép', 'Chổi Nimbus 2000', 'Quả Snitch Vàng', 'Mũ Phân Loại', 'Áo Choàng Tàng Hình', 
    'Bản Đồ Đạo Tặc', 'Xoay Thời Gian', 'Gương Ảo Ảnh', 'Thanh Kiếm Gryffindor', 'Chén Lửa', 
    'Chiếc Xe Bay', 'Quả Cầu Gợi Nhớ', 'Quả Cầu Pha Lê', 'Vạc Độc Dược', 'Vương Miện Ravenclaw',
    'Nhật Ký Tom Riddle', 'Đá Phù Thủy', 'Cúp Tam Pháp Thuật', 'Thư Nhập Học Hogwarts',

    // === SINH VẬT HUYỀN BÍ ===
    'Cú Hedwig', 'Phượng Hoàng Fawkes', 'Bằng Mã Buckbeak', 'Nhện Aragog', 'Rắn Nagini', 
    'Chó Ba Đầu Fluffy', 'Rồng Đuôi Gai', 'Giám Ngục Azkaban', 'Gia Tinh Dobby', 'Nhân Mã', 
    'Mèo Crookshanks', 'Kỳ Lân', 'Cóc Trevor', 'Chuột Scabbers', 'Vong Mã Thestral',

    // === NHÂN VẬT & ĐỊA DANH PHÙ THỦY ===
    'Harry Potter', 'Hermione Granger', 'Ron Weasley', 'Cụ Dumbledore', 'Thầy Snape', 
    'Giáo Sư McGonagall', 'Chúa Tể Voldemort', 'Draco Malfoy', 'Bác Hagrid', 'Sirius Black',
    'Lâu Đài Hogwarts', 'Hẻm Xéo', 'Rừng Cấm', 'Nhà Ga 9 3/4', 'Tàu Tốc Hành Hogwarts', 
    'Phòng Chứa Bí Mật', 'Đại Sảnh Đường', 'Chòi Bác Hagrid', 'Ngân Hàng Gringotts',

    // === BÙA CHÚ & ẨM THỰC HOGWARTS ===
    'Bia Bơ', 'Ếch Socola', 'Kẹo Đủ Vị Bertie Bott', 'Nước Bí Đỏ', 'Bánh Sinh Nhật Hagrid',
    'Lumos', 'Expecto Patronum', 'Wingardium Leviosa', 'Expelliarmus', 'Thần Hộ Mệnh'
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
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
 * Get 3 random words for selection
 */
export function getRandomWordChoices(lang: 'vi' | 'en' = 'vi', customWords: string[] = []): string[] {
  const pool = customWords.length >= 3 ? customWords : [...WORDS[lang]];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

/**
 * Mask word for guessers (e.g. "Cú Hedwig" -> "_ _   _ _ _ _ _ _")
 */
export function createMaskedWord(word: string, revealedIndices: number[] = []): string {
  return word
    .split('')
    .map((char, index) => {
      if (char === ' ' || char === '-') return char;
      if (revealedIndices.includes(index)) return char;
      return '_';
    })
    .join(' ');
}
