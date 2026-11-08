import type React from 'react';
import type { AvatarConfig, Player, RoomConfig, GameState, DrawAction, ChatMessage, GamePhase } from '../types';
import type { RealtimeRoomService } from '../services/supabase';
import type { MobileTab } from '../components/InGameStage';

export const DEFAULT_AVATAR: AvatarConfig = {
  color: '#ffd875',
  eyes: 'happy',
  mouth: 'smile',
  accessory: 'sunglasses',
};

/**
 * Per-room secret for the remote channel gate (finding #3). High-entropy
 * (crypto where available) so a room-code scan can't enumerate rooms: knowing
 * the (wide) code alone does not let a stranger subscribe to the Supabase
 * channel.
 */
export function generateRoomToken(): string {
  const toBase36 = (buf: Uint8Array) =>
    Array.from(buf, (b) => (b % 36).toString(36)).join('');
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return toBase36(crypto.getRandomValues(new Uint8Array(12))); // ~144 bits
  }
  return `${Math.random().toString(36).slice(2, 11)}${Math.random().toString(36).slice(2, 11)}`;
}

export function getOrCreateTabUserId(): string {
  if (typeof window === 'undefined') {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  try {
    const existing = window.sessionStorage.getItem('sketchclash_tab_uid');
    if (existing) return existing;
    const created = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    window.sessionStorage.setItem('sketchclash_tab_uid', created);
    return created;
  } catch {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
}

export interface SharedGameRefs {
  currentUserId: React.MutableRefObject<string>;
  hostIdRef: React.MutableRefObject<string | null>;
  roomServiceRef: React.MutableRefObject<RealtimeRoomService | null>;
  roomConfigRef: React.MutableRefObject<RoomConfig>;
  phaseRef: React.MutableRefObject<GamePhase>;
  roundRef: React.MutableRefObject<number>;
  timeLeftRef: React.MutableRefObject<number>;
  playersRef: React.MutableRefObject<Player[]>;
  currentDrawerIndexRef: React.MutableRefObject<number>;
  currentDrawerIdRef: React.MutableRefObject<string | null>;
  currentWordRef: React.MutableRefObject<string>;
  maskedWordRef: React.MutableRefObject<string>;
  revealedIndicesRef: React.MutableRefObject<number[]>;
  selectionTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  botTimeoutsRef: React.MutableRefObject<ReturnType<typeof setTimeout>[]>;
  turnTokenRef: React.MutableRefObject<number>;
  isEndingRound: React.MutableRefObject<boolean>;
  rushPickedWordsRef: React.MutableRefObject<Map<string, string>>;
  rushChoicesMapRef: React.MutableRefObject<Map<string, string[]>>;
  myRushDrawActionsRef: React.MutableRefObject<DrawAction[]>;
  opponentDrawActionsRef: React.MutableRefObject<Record<string, DrawAction[]>>;
  pendingWordBackupsRef: React.MutableRefObject<Map<string, string>>;
  drawnPlayerIdsInRoundRef: React.MutableRefObject<Set<string>>;
  usedWordsInMatchRef: React.MutableRefObject<Set<string>>;
}

export interface SharedGameSetters {
  setPhase: React.Dispatch<React.SetStateAction<GamePhase>>;
  setRound: React.Dispatch<React.SetStateAction<number>>;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setCurrentDrawerIndex: React.Dispatch<React.SetStateAction<number>>;
  setCurrentWord: React.Dispatch<React.SetStateAction<string>>;
  setRevealedWord: React.Dispatch<React.SetStateAction<string>>;
  setMaskedWord: React.Dispatch<React.SetStateAction<string>>;
  setRevealedIndices: React.Dispatch<React.SetStateAction<number[]>>;
  setWordChoices: React.Dispatch<React.SetStateAction<string[]>>;
  setRoundEndMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIncomingDrawActions: React.Dispatch<React.SetStateAction<DrawAction[]>>;
  setCanvasResetKey: React.Dispatch<React.SetStateAction<number>>;
  setOpponentDrawActions: React.Dispatch<React.SetStateAction<Record<string, DrawAction[]>>>;
  setMyRushDrawActions: React.Dispatch<React.SetStateAction<DrawAction[]>>;
  setSolvedWordsMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setInspectingPlayerId: React.Dispatch<React.SetStateAction<string | null>>;
  setInspectFeedback: React.Dispatch<React.SetStateAction<string | null>>;
  setHasSubmittedRushWord: React.Dispatch<React.SetStateAction<boolean>>;
  setMobileTab: React.Dispatch<React.SetStateAction<MobileTab>>;
  setNoticeToast: React.Dispatch<React.SetStateAction<string | null>>;
  broadcastGameState: (state: Partial<GameState>) => void;
  clearBotTimeouts: () => void;
}

export const MAX_CHAT_HISTORY = 150;

export function appendBoundedMessage(prev: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  const next = [...prev, msg];
  return next.length > MAX_CHAT_HISTORY ? next.slice(-MAX_CHAT_HISTORY) : next;
}

export function computeNextTurnAndRound(r: SharedGameRefs): { nextDrawerIdx: number; nextRound: number } {
  const currentPlayers = r.playersRef.current;
  const len = currentPlayers.length;
  if (len === 0) return { nextDrawerIdx: 0, nextRound: r.roundRef.current + 1 };

  const drawnSet = r.drawnPlayerIdsInRoundRef.current;
  const activeDrawerPos = r.currentDrawerIdRef.current
    ? currentPlayers.findIndex((p) => p.id === r.currentDrawerIdRef.current)
    : -1;

  const startPos =
    activeDrawerPos >= 0
      ? (activeDrawerPos + 1) % len
      : Math.min(r.currentDrawerIndexRef.current, len - 1);

  for (let offset = 0; offset < len; offset++) {
    const candidateIdx = (startPos + offset) % len;
    const candidate = currentPlayers[candidateIdx];
    if (candidate && !drawnSet.has(candidate.id)) {
      return { nextDrawerIdx: candidateIdx, nextRound: r.roundRef.current };
    }
  }

  drawnSet.clear();
  return { nextDrawerIdx: 0, nextRound: r.roundRef.current + 1 };
}

let monotonicDrawSeq = 1;

export function stampDrawAction(action: DrawAction): DrawAction {
  return action._seq ? action : { ...action, _seq: monotonicDrawSeq++ };
}

/**
 * Append a DrawAction while compacting obsolete history on 'clear' or 'restore'
 * so Base64 PNG snapshots and superseded strokes never bloat memory.
 */
export function appendCompactDrawAction(prev: DrawAction[], action: DrawAction): DrawAction[] {
  const stamped = stampDrawAction(action);
  if (stamped.type === 'clear') return [stamped];
  if (stamped.type === 'restore') return [stamped];
  return [...prev, stamped];
}

export function resetTurnBoardState(r: SharedGameRefs, s: SharedGameSetters): void {
  r.currentWordRef.current = '';
  s.setCurrentWord('');
  s.setRevealedWord('');
  r.maskedWordRef.current = '';
  s.setMaskedWord('');
  r.revealedIndicesRef.current = [];
  s.setRevealedIndices([]);
  s.setRoundEndMessage(null);
  r.opponentDrawActionsRef.current = {};
  s.setOpponentDrawActions({});
  r.myRushDrawActionsRef.current = [];
  s.setMyRushDrawActions([]);
  s.setIncomingDrawActions([]);
  s.setSolvedWordsMap({});
  s.setInspectingPlayerId(null);
  s.setInspectFeedback(null);
  s.setHasSubmittedRushWord(false);
  r.pendingWordBackupsRef.current.clear();
  s.setCanvasResetKey((k) => k + 1);
}
