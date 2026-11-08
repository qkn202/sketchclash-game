import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { ChatMessage, ImpostorPublicState, Player } from '../types';
import { IMPOSTOR_INK_PALETTE, pickBotImpostorCounterGuess } from '../data/partyModesData';
import { isWordMatch } from '../data/words';
import {
  appendBoundedMessage,
  type SharedGameRefs,
  type SharedGameSetters,
} from './gameControllerTypes';
import { soundManager } from '../utils/audio';

export const IMPOSTOR_STROKE_SECONDS = 20;
export const IMPOSTOR_VOTE_SECONDS = 22;
export const IMPOSTOR_GUESS_SECONDS = 18;
export const IMPOSTOR_TOTAL_PASSES = 2;

export interface HostImpostorSecret {
  impostorId: string;
  secretWord: string;
  category: string;
}

export function assignArtistInkColors(players: Player[]): Record<string, string> {
  const colors: Record<string, string> = {};
  players.forEach((p, idx) => {
    colors[p.id] = IMPOSTOR_INK_PALETTE[idx % IMPOSTOR_INK_PALETTE.length].hex;
  });
  return colors;
}

export function buildRotatedTurnOrder(players: Player[], roundNumber: number): string[] {
  if (players.length === 0) return [];
  const offset = (roundNumber - 1) % players.length;
  return players.map((_, idx) => players[(idx + offset) % players.length].id);
}

export function tallyImpostorVotes(votesByVoterId: Map<string, string>): {
  accusedPlayerId: string | null;
  voteRecord: Record<string, string>;
} {
  const voteRecord: Record<string, string> = {};
  const countsBySuspect: Record<string, number> = {};

  votesByVoterId.forEach((suspectId, voterId) => {
    voteRecord[voterId] = suspectId;
    countsBySuspect[suspectId] = (countsBySuspect[suspectId] || 0) + 1;
  });

  let maxVotes = 0;
  let topSuspects: string[] = [];
  Object.entries(countsBySuspect).forEach(([suspectId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      topSuspects = [suspectId];
    } else if (count === maxVotes && count > 0) {
      topSuspects.push(suspectId);
    }
  });

  return {
    accusedPlayerId: topSuspects.length === 1 ? topSuspects[0] : null,
    voteRecord,
  };
}

export function chooseBotSuspectVote(botId: string, players: Player[], impostorId: string): string {
  const others = players.filter((p) => p.id !== botId);
  if (others.length === 0) return botId;
  if (botId !== impostorId && Math.random() < 0.58) {
    const imp = others.find((p) => p.id === impostorId);
    if (imp) return imp.id;
  }
  const nonImpostorOthers = others.filter((p) => p.id !== impostorId);
  const pool = botId === impostorId && nonImpostorOthers.length > 0 ? nonImpostorOthers : others;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export function computeEscapedImpostorPlayers(
  players: Player[],
  impostorId: string,
  votesByVoterId: Map<string, string>
): Player[] {
  return players.map((p) => {
    const delta = p.id === impostorId ? 320 : votesByVoterId.get(p.id) === impostorId ? 50 : 0;
    return { ...p, isDrawer: false, hasGuessed: false, score: p.score + delta };
  });
}

export function computeCounterGuessResultPlayers(
  players: Player[],
  impostorId: string,
  votesByVoterId: Map<string, string>,
  impostorGuessedRight: boolean
): Player[] {
  return players.map((p) => {
    let delta = 0;
    if (impostorGuessedRight) {
      if (p.id === impostorId) delta = 240;
      else if (votesByVoterId.get(p.id) === impostorId) delta = 70;
    } else if (p.id !== impostorId) {
      delta = 220 + (votesByVoterId.get(p.id) === impostorId ? 60 : 0);
    }
    return { ...p, isDrawer: false, hasGuessed: false, score: p.score + delta };
  });
}

export function useImpostorTrialControls(
  refs: SharedGameRefs,
  setters: SharedGameSetters,
  impostorStateRef: MutableRefObject<ImpostorPublicState | null>,
  setImpostorState: Dispatch<SetStateAction<ImpostorPublicState | null>>,
  setMySelectedVoteId: Dispatch<SetStateAction<string | null>>,
  impostorSecretRef: MutableRefObject<HostImpostorSecret | null>,
  impostorVotesMapRef: MutableRefObject<Map<string, string>>,
  isResolvingPhaseRef: MutableRefObject<boolean>,
  startImpostorRoundRef: MutableRefObject<(roundNum: number, customPlayers?: Player[]) => void>
) {
  const concludeImpostorRound = useCallback(
    (updatedPlayers: Player[], nextPublicState: ImpostorPublicState, secretWord: string, bannerMsg: string) => {
      setters.clearBotTimeouts();
      soundManager.playVictory();

      refs.playersRef.current = updatedPlayers;
      setters.setPlayers(updatedPlayers);
      refs.phaseRef.current = 'round_end';
      setters.setPhase('round_end');
      refs.timeLeftRef.current = 5;
      setters.setTimeLeft(5);
      setters.setRevealedWord(secretWord);
      setters.setRoundEndMessage(bannerMsg);
      impostorStateRef.current = nextPublicState;
      setImpostorState(nextPublicState);

      const sysMsg: ChatMessage = {
        id: `imp_end_${Date.now()}`,
        text: `🎭 ${bannerMsg}`,
        type: 'system',
        timestamp: Date.now(),
      };
      setters.setMessages((m) => appendBoundedMessage(m, sysMsg));
      refs.roomServiceRef.current?.broadcastChat(sysMsg);
      setters.broadcastGameState({
        phase: 'round_end',
        timeLeft: 5,
        players: updatedPlayers,
        revealedWord: secretWord,
        roundEndMessage: bannerMsg,
        impostorState: nextPublicState,
      });

      const token = refs.turnTokenRef.current;
      const tid = setTimeout(() => {
        if (refs.turnTokenRef.current !== token || refs.phaseRef.current !== 'round_end') return;
        const nextRound = refs.roundRef.current + 1;
        if (nextRound > refs.roomConfigRef.current.totalRounds) {
          refs.phaseRef.current = 'game_over';
          setters.setPhase('game_over');
          setters.broadcastGameState({ phase: 'game_over', players: refs.playersRef.current });
        } else {
          startImpostorRoundRef.current(nextRound, refs.playersRef.current);
        }
      }, 4500);
      refs.botTimeoutsRef.current.push(tid);
    },
    [impostorStateRef, refs, setImpostorState, setters, startImpostorRoundRef]
  );

  const resolveImpostorCounterGuess = useCallback(
    (rawGuessText: string) => {
      const secret = impostorSecretRef.current;
      const cur = impostorStateRef.current;
      if (!secret || !cur || isResolvingPhaseRef.current) return;
      isResolvingPhaseRef.current = true;

      const cleanGuess = rawGuessText.trim().slice(0, 80);
      const guessedRight = Boolean(cleanGuess && isWordMatch(cleanGuess, secret.secretWord));
      const impName = refs.playersRef.current.find((p) => p.id === secret.impostorId)?.name || 'Kẻ Giả Mạo';
      const updatedPlayers = computeCounterGuessResultPlayers(
        refs.playersRef.current,
        secret.impostorId,
        impostorVotesMapRef.current,
        guessedRight
      );

      const banner = guessedRight
        ? `🧪 LẬT KÈO NGOẠN MỤC! ${impName} bị bắt nhưng đã đoán trúng「${secret.secretWord}」(+240đ)!`
        : `🪄 WIZENGAMOT ĐẠI THẮNG! Kẻ Giả Mạo ${impName} đoán sai (${cleanGuess || 'Hết giờ'}) — Từ khóa là「${secret.secretWord}」!`;

      const nextPublic: ImpostorPublicState = { ...cur, impostorGuessText: cleanGuess || null, outcomeBanner: banner };
      isResolvingPhaseRef.current = false;
      concludeImpostorRound(updatedPlayers, nextPublic, secret.secretWord, banner);
    },
    [concludeImpostorRound, impostorSecretRef, impostorStateRef, impostorVotesMapRef, isResolvingPhaseRef, refs.playersRef]
  );

  const resolveImpostorVotePhase = useCallback(() => {
    const secret = impostorSecretRef.current;
    const cur = impostorStateRef.current;
    if (!secret || !cur || isResolvingPhaseRef.current) return;
    isResolvingPhaseRef.current = true;
    setters.clearBotTimeouts();

    const { accusedPlayerId, voteRecord } = tallyImpostorVotes(impostorVotesMapRef.current);
    const impostorPlayer = refs.playersRef.current.find((p) => p.id === secret.impostorId);
    const impName = impostorPlayer?.name || 'Kẻ Giả Mạo';

    if (accusedPlayerId && accusedPlayerId === secret.impostorId) {
      soundManager.playSpellVfx();
      const guessState: ImpostorPublicState = {
        ...cur,
        activeArtistId: null,
        accusedPlayerId,
        revealedImpostorId: secret.impostorId,
        voteTally: voteRecord,
        outcomeBanner: `⚖️ ${impName} đã bị lột mặt nạ! 18 giây cuối để đoán từ khóa lật kèo!`,
      };
      impostorStateRef.current = guessState;
      setImpostorState(guessState);
      refs.phaseRef.current = 'impostor_guess';
      setters.setPhase('impostor_guess');
      refs.timeLeftRef.current = IMPOSTOR_GUESS_SECONDS;
      setters.setTimeLeft(IMPOSTOR_GUESS_SECONDS);
      isResolvingPhaseRef.current = false;

      const sysMsg: ChatMessage = {
        id: `imp_caught_${Date.now()}`,
        text: `⚖️ Phiên Tòa Wizengamot đã lột mặt nạ ${impName}! Kẻ Giả Mạo có ${IMPOSTOR_GUESS_SECONDS}s để đoán từ khóa lật kèo!`,
        type: 'system',
        timestamp: Date.now(),
      };
      setters.setMessages((m) => appendBoundedMessage(m, sysMsg));
      refs.roomServiceRef.current?.broadcastChat(sysMsg);
      setters.broadcastGameState({ phase: 'impostor_guess', timeLeft: IMPOSTOR_GUESS_SECONDS, impostorState: guessState });

      if (impostorPlayer?.isBot) {
        const token = refs.turnTokenRef.current;
        const tid = setTimeout(() => {
          if (refs.turnTokenRef.current !== token || refs.phaseRef.current !== 'impostor_guess') return;
          resolveImpostorCounterGuess(
            pickBotImpostorCounterGuess(secret.category, secret.secretWord, refs.roomConfigRef.current.language || 'vi')
          );
        }, 2100);
        refs.botTimeoutsRef.current.push(tid);
      }
      return;
    }

    const updatedPlayers = computeEscapedImpostorPlayers(refs.playersRef.current, secret.impostorId, impostorVotesMapRef.current);
    const accusedName = refs.playersRef.current.find((p) => p.id === accusedPlayerId)?.name;
    const banner = accusedName
      ? `🧪 KẺ GIẢ MẠO ĐÀO THOÁT! Hội đồng kết tội nhầm ${accusedName} — Kẻ Giả Mạo thật là ${impName} (+320đ)!`
      : `🧪 KẺ GIẢ MẠO ĐÀO THOÁT! Phiếu bầu bị chia rẽ — ${impName} ẩn mình thành công (+320đ)!`;

    const escapedState: ImpostorPublicState = {
      ...cur,
      activeArtistId: null,
      accusedPlayerId,
      revealedImpostorId: secret.impostorId,
      voteTally: voteRecord,
      outcomeBanner: banner,
    };
    isResolvingPhaseRef.current = false;
    concludeImpostorRound(updatedPlayers, escapedState, secret.secretWord, banner);
  }, [concludeImpostorRound, impostorSecretRef, impostorStateRef, impostorVotesMapRef, isResolvingPhaseRef, refs, resolveImpostorCounterGuess, setImpostorState, setters]);

  const recordHostVote = useCallback(
    (voterId: string, suspectId: string) => {
      if (refs.phaseRef.current !== 'impostor_vote' || !suspectId || voterId === suspectId) return;
      if (impostorVotesMapRef.current.has(voterId)) return;

      impostorVotesMapRef.current.set(voterId, suspectId);
      const cur = impostorStateRef.current;
      if (!cur) return;

      const nextPublic: ImpostorPublicState = { ...cur, votedPlayerIds: Array.from(impostorVotesMapRef.current.keys()) };
      impostorStateRef.current = nextPublic;
      setImpostorState(nextPublic);
      setters.broadcastGameState({ impostorState: nextPublic });

      if (refs.playersRef.current.every((p) => impostorVotesMapRef.current.has(p.id))) {
        resolveImpostorVotePhase();
      }
    },
    [impostorStateRef, impostorVotesMapRef, refs.phaseRef, refs.playersRef, resolveImpostorVotePhase, setImpostorState, setters]
  );

  const enterImpostorVotePhase = useCallback(() => {
    const cur = impostorStateRef.current;
    const secret = impostorSecretRef.current;
    if (!cur || !secret) return;
    setters.clearBotTimeouts();
    impostorVotesMapRef.current.clear();
    setMySelectedVoteId(null);

    const updatedPlayers = refs.playersRef.current.map((p) => ({ ...p, isDrawer: false }));
    refs.playersRef.current = updatedPlayers;
    setters.setPlayers(updatedPlayers);

    const votePublic: ImpostorPublicState = {
      ...cur,
      activeArtistId: null,
      strokesCompletedInRound: cur.turnOrderIds.length * IMPOSTOR_TOTAL_PASSES,
      votedPlayerIds: [],
    };
    impostorStateRef.current = votePublic;
    setImpostorState(votePublic);

    refs.phaseRef.current = 'impostor_vote';
    setters.setPhase('impostor_vote');
    refs.timeLeftRef.current = IMPOSTOR_VOTE_SECONDS;
    setters.setTimeLeft(IMPOSTOR_VOTE_SECONDS);

    const sysMsg: ChatMessage = {
      id: `imp_vote_${Date.now()}`,
      text: '⚖️ Toàn bộ nét mực đã hoàn tất! Phiên Tòa Wizengamot khai mạc — Bỏ phiếu truy tìm Kẻ Giả Mạo!',
      type: 'system',
      timestamp: Date.now(),
    };
    setters.setMessages((m) => appendBoundedMessage(m, sysMsg));
    refs.roomServiceRef.current?.broadcastChat(sysMsg);
    setters.broadcastGameState({ phase: 'impostor_vote', timeLeft: IMPOSTOR_VOTE_SECONDS, players: updatedPlayers, impostorState: votePublic });

    const token = refs.turnTokenRef.current;
    updatedPlayers.forEach((p, idx) => {
      if (!p.isBot) return;
      const tid = setTimeout(() => {
        if (refs.turnTokenRef.current !== token || refs.phaseRef.current !== 'impostor_vote') return;
        recordHostVote(p.id, chooseBotSuspectVote(p.id, refs.playersRef.current, secret.impostorId));
      }, 1100 + idx * 450);
      refs.botTimeoutsRef.current.push(tid);
    });
  }, [impostorSecretRef, impostorStateRef, impostorVotesMapRef, recordHostVote, refs, setImpostorState, setMySelectedVoteId, setters]);

  return {
    concludeImpostorRound,
    resolveImpostorCounterGuess,
    resolveImpostorVotePhase,
    recordHostVote,
    enterImpostorVotePhase,
  };
}
