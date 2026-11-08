export type EyeType = 'normal' | 'happy' | 'wink' | 'cool' | 'shocked' | 'sleepy' | 'star';
export type MouthType = 'smile' | 'open' | 'tongue' | 'grin' | 'sad' | 'surprised';
export type AccessoryType = 'none' | 'glasses' | 'sunglasses' | 'hat' | 'crown' | 'mustache';

export interface AvatarConfig {
  color: string;
  eyes: EyeType;
  mouth: MouthType;
  accessory: AccessoryType;
}

export type GameMode =
  | 'classic'
  | 'dual_coop'
  | 'all_draw'
  | 'rush_draw'
  | 'relay_phone'
  | 'polyjuice_impostor';

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
  joinedAt?: number;
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
  type: 'stroke' | 'fill' | 'clear' | 'restore';
  stroke?: DrawStroke;
  fill?: DrawFill;
  snapshot?: string;
  drawerId?: string;
  _seq?: number;
}

export interface RoomConfig {
  roomCode: string;
  roomName: string;
  mode: GameMode;
  drawTime: number; // e.g. 60, 80
  totalRounds: number; // e.g. 3, 5
  language: 'vi' | 'en';
  customWords: string[];
  customWordsCount?: number;
  maxPlayers: number;
  /**
   * Per-room secret that is folded into the remote Supabase channel name and the
   * invite link (?t=). A stranger who knows only the (wide) room code but not
   * this token cannot subscribe to the room channel — closing the code-scan /
   * room-full DoS vector (finding #3). Omitted for legacy open rooms.
   */
  roomToken?: string;
}

export type GamePhase =
  | 'lobby'
  | 'waiting_room'
  | 'selecting_word'
  | 'drawing'
  | 'round_end'
  | 'game_over'
  | 'relay_prompt'
  | 'relay_draw'
  | 'relay_guess'
  | 'relay_showcase'
  | 'impostor_draw'
  | 'impostor_vote'
  | 'impostor_guess';

export type RelayReactionEmoji = '😂' | '🔥' | '🤯';

export interface RelayEntry {
  stepIndex: number;
  kind: 'prompt' | 'draw' | 'guess';
  authorId: string;
  authorName: string;
  text?: string;
  actions?: DrawAction[];
  reactions?: Partial<Record<RelayReactionEmoji, string[]>>;
}

export interface RelayChain {
  chainId: string;
  ownerId: string;
  ownerName: string;
  entries: RelayEntry[];
}

export interface RelayTaskAssignment {
  stepIndex: number;
  totalSteps: number;
  chainId: string;
  chainOwnerName: string;
  kind: 'prompt' | 'draw' | 'guess';
  previousPrompt?: string;
  previousDrawing?: DrawAction[];
  previousAuthorName?: string;
}

export interface RelayPublicState {
  stepIndex: number;
  totalSteps: number;
  submittedPlayerIds: string[];
  showcaseChains?: RelayChain[];
  showcaseChainIndex: number;
  showcaseRevealedCount: number;
}

export interface ImpostorRoleSecret {
  isImpostor: boolean;
  category: string;
  secretWord?: string;
  inkColor: string;
}

export interface ImpostorPublicState {
  category: string;
  passNumber: number;
  totalPasses: number;
  turnOrderIds: string[];
  activeArtistId: string | null;
  strokesCompletedInRound: number;
  artistColors: Record<string, string>;
  votedPlayerIds: string[];
  voteTally?: Record<string, string>;
  accusedPlayerId?: string | null;
  revealedImpostorId?: string | null;
  impostorGuessText?: string | null;
  outcomeBanner?: string | null;
}

export type PartyNetworkEvent =
  | { kind: 'relay_submit'; stepIndex: number; chainId: string; text?: string; actions?: DrawAction[] }
  | { kind: 'relay_showcase_nav'; direction: 'forward' | 'backward'; chainIndex: number }
  | { kind: 'relay_showcase_reveal'; revealedCount: number }
  | { kind: 'relay_reaction'; chainId: string; stepIndex: number; emoji: RelayReactionEmoji }
  | { kind: 'impostor_stroke_done'; passNumber: number }
  | { kind: 'impostor_vote_cast'; suspectId: string }
  | { kind: 'impostor_counter_guess'; guessText: string };

export type PartyPrivatePayload =
  | { kind: 'relay_task'; task: RelayTaskAssignment }
  | { kind: 'impostor_role'; role: ImpostorRoleSecret };

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
  roundEndMessage?: string | null;
  revealedWord?: string;
  customWords?: string[];
  customWordsCount?: number;
  language?: 'vi' | 'en';
  maxPlayers?: number;
  relayState?: RelayPublicState;
  impostorState?: ImpostorPublicState;
  winner: Player | null;
}
