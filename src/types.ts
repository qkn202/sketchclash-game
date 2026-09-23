export type EyeType = 'normal' | 'happy' | 'wink' | 'cool' | 'shocked' | 'sleepy' | 'star';
export type MouthType = 'smile' | 'open' | 'tongue' | 'grin' | 'sad' | 'surprised';
export type AccessoryType = 'none' | 'glasses' | 'sunglasses' | 'hat' | 'crown' | 'mustache';

export interface AvatarConfig {
  color: string;
  eyes: EyeType;
  mouth: MouthType;
  accessory: AccessoryType;
}

export type GameMode = 'classic' | 'dual_coop' | 'all_draw' | 'rush_draw';

export interface Player {
  id: string;
  name: string;
  avatar: AvatarConfig;
  score: number;
  isHost: boolean;
  isDrawer: boolean;
  hasGuessed: boolean;
  isBot?: boolean;
  roundScore?: number;
  isLoneGuesser?: boolean;
  secretWord?: string;
  wordChoices?: string[];
  solvedOpponentIds?: string[];
  solvedByPlayerIds?: string[];
}

export type ToolType = 'brush' | 'fire' | 'ice' | 'sparkle' | 'bucket' | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface DrawStroke {
  id: string;
  tool: ToolType;
  color: string;
  size: number;
  points: Point[];
}

export interface DrawFill {
  x: number;
  y: number;
  color: string;
}

export interface DrawAction {
  type: 'stroke' | 'fill' | 'clear';
  stroke?: DrawStroke;
  fill?: DrawFill;
  drawerId?: string;
}

export interface RoomConfig {
  roomCode: string;
  roomName: string;
  mode: GameMode;
  drawTime: number; // e.g. 60, 80
  totalRounds: number; // e.g. 3, 5
  language: 'vi' | 'en';
  customWords: string[];
  maxPlayers: number;
}

export type GamePhase = 'lobby' | 'waiting_room' | 'selecting_word' | 'drawing' | 'round_end' | 'game_over';

export interface ChatMessage {
  id: string;
  playerId?: string;
  playerName?: string;
  avatar?: AvatarConfig;
  text: string;
  type: 'chat' | 'correct' | 'close' | 'system';
  timestamp: number;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  mode?: GameMode;
  round: number;
  totalRounds: number;
  drawTime: number;
  timeLeft: number;
  currentDrawerId: string | null;
  currentDrawerIds?: string[];
  currentWord: string;
  maskedWord: string;
  wordChoices: string[];
  revealedIndices: number[];
  players: Player[];
  playerWords?: Record<string, string>;
  winner: Player | null;
}
