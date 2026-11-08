import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ChatMessage,
  GamePhase,
  ImpostorPublicState,
  ImpostorRoleSecret,
  PartyNetworkEvent,
  Player,
} from '../types';
import { generateImpostorBotSingleStroke, pickCategorizedWord } from '../data/partyModesData';
import { containsWordSpoiler } from '../data/words';
import {
  appendBoundedMessage,
  appendCompactDrawAction,
  resetTurnBoardState,
  type SharedGameRefs,
  type SharedGameSetters,
} from './gameControllerTypes';
import {
  assignArtistInkColors,
  buildRotatedTurnOrder,
  IMPOSTOR_STROKE_SECONDS,
  IMPOSTOR_TOTAL_PASSES,
  useImpostorTrialControls,
  type HostImpostorSecret,
} from './impostorRoundHelpers';
import { soundManager } from '../utils/audio';

export function useImpostorController(
  refs: SharedGameRefs,
  setters: SharedGameSetters,
  phase: GamePhase
) {
  const [impostorState, setImpostorState] = useState<ImpostorPublicState | null>(null);
  const impostorStateRef = useRef<ImpostorPublicState | null>(null);
  const [myImpostorRole, setMyImpostorRole] = useState<ImpostorRoleSecret | null>(null);
  const myImpostorRoleRef = useRef<ImpostorRoleSecret | null>(null);
  const [mySelectedVoteId, setMySelectedVoteId] = useState<string | null>(null);

  const impostorSecretRef = useRef<HostImpostorSecret | null>(null);
  const impostorRolesByPlayerRef = useRef<Map<string, ImpostorRoleSecret>>(new Map());
  const impostorVotesMapRef = useRef<Map<string, string>>(new Map());
  const turnsTakenRef = useRef<Map<string, number>>(new Map());
  const lastImpostorIdRef = useRef<string | null>(null);
  const isResolvingPhaseRef = useRef<boolean>(false);
  const startImpostorRoundRef = useRef<(roundNum: number, customPlayers?: Player[]) => void>(() => {});

  useEffect(() => { impostorStateRef.current = impostorState; }, [impostorState]);
  useEffect(() => { myImpostorRoleRef.current = myImpostorRole; }, [myImpostorRole]);

  const resetImpostorState = useCallback(() => {
    setImpostorState(null);
    impostorStateRef.current = null;
    setMyImpostorRole(null);
    myImpostorRoleRef.current = null;
    setMySelectedVoteId(null);
    impostorSecretRef.current = null;
    impostorRolesByPlayerRef.current.clear();
    impostorVotesMapRef.current.clear();
    turnsTakenRef.current.clear();
    isResolvingPhaseRef.current = false;
  }, []);

  const {
    concludeImpostorRound,
    resolveImpostorCounterGuess,
    resolveImpostorVotePhase,
    recordHostVote,
    enterImpostorVotePhase,
  } = useImpostorTrialControls(
    refs,
    setters,
    impostorStateRef,
    setImpostorState,
    setMySelectedVoteId,
    impostorSecretRef,
    impostorVotesMapRef,
    isResolvingPhaseRef,
    startImpostorRoundRef
  );

  const activateImpostorStrokeTurn = useCallback(
    (strokeIdx: number, basePublic: ImpostorPublicState, completedArtistId?: string | null) => {
      setters.clearBotTimeouts();
      if (completedArtistId) {
        turnsTakenRef.current.set(completedArtistId, (turnsTakenRef.current.get(completedArtistId) ?? 0) + 1);
      }
      const order = basePublic.turnOrderIds.filter((id) =>
        refs.playersRef.current.some((p) => p.id === id)
      );
      const minTurns =
        order.length > 0 ? Math.min(...order.map((id) => turnsTakenRef.current.get(id) ?? 0)) : IMPOSTOR_TOTAL_PASSES;
      if (order.length === 0 || minTurns >= IMPOSTOR_TOTAL_PASSES) {
        enterImpostorVotePhase();
        return;
      }

      const activeArtistId = order.find((id) => (turnsTakenRef.current.get(id) ?? 0) === minTurns) || order[0];
      const passNumber = minTurns + 1;

      const updatedPlayers = refs.playersRef.current.map((p) => ({
        ...p,
        isDrawer: p.id === activeArtistId,
      }));
      refs.playersRef.current = updatedPlayers;
      setters.setPlayers(updatedPlayers);
      refs.currentDrawerIdRef.current = activeArtistId;

      const nextPublic: ImpostorPublicState = {
        ...basePublic,
        turnOrderIds: order,
        passNumber,
        activeArtistId,
        strokesCompletedInRound: strokeIdx,
      };
      impostorStateRef.current = nextPublic;
      setImpostorState(nextPublic);
      refs.phaseRef.current = 'impostor_draw';
      setters.setPhase('impostor_draw');
      refs.timeLeftRef.current = IMPOSTOR_STROKE_SECONDS;
      setters.setTimeLeft(IMPOSTOR_STROKE_SECONDS);

      setters.broadcastGameState({
        phase: 'impostor_draw',
        timeLeft: IMPOSTOR_STROKE_SECONDS,
        currentDrawerId: activeArtistId,
        players: updatedPlayers,
        impostorState: nextPublic,
      });

      const activePlayer = updatedPlayers.find((p) => p.id === activeArtistId);
      const secret = impostorSecretRef.current;
      if (activePlayer?.isBot && secret) {
        const token = refs.turnTokenRef.current;
        const tid = setTimeout(() => {
          if (refs.turnTokenRef.current !== token || refs.phaseRef.current !== 'impostor_draw') return;
          const botAction = generateImpostorBotSingleStroke(
            activePlayer.id === secret.impostorId,
            secret.secretWord,
            secret.category,
            passNumber,
            nextPublic.artistColors[activePlayer.id] || '#1e293b',
            activePlayer.id,
            strokeIdx % order.length
          );
          setters.setIncomingDrawActions((prev) => appendCompactDrawAction(prev, botAction));
          setters.setMyRushDrawActions((prev) => {
            const next = appendCompactDrawAction(prev, botAction);
            refs.myRushDrawActionsRef.current = next;
            return next;
          });
          refs.roomServiceRef.current?.broadcastDraw(botAction);

          const nextTid = setTimeout(() => {
            if (refs.turnTokenRef.current !== token || refs.phaseRef.current !== 'impostor_draw') return;
            activateImpostorStrokeTurn(strokeIdx + 1, nextPublic, activeArtistId);
          }, 480);
          refs.botTimeoutsRef.current.push(nextTid);
        }, 1150);
        refs.botTimeoutsRef.current.push(tid);
      }
    },
    [enterImpostorVotePhase, refs, setters]
  );

  const startImpostorRound = useCallback(
    (roundNum: number = 1, customPlayers?: Player[]) => {
      const roster = customPlayers || refs.playersRef.current;
      if (roster.length === 0) return;

      setters.clearBotTimeouts();
      refs.turnTokenRef.current += 1;
      isResolvingPhaseRef.current = false;
      impostorVotesMapRef.current.clear();
      impostorRolesByPlayerRef.current.clear();
      turnsTakenRef.current.clear();
      setMySelectedVoteId(null);
      resetTurnBoardState(refs, setters);

      const cfg = refs.roomConfigRef.current;
      const { category, word } = pickCategorizedWord(
        cfg.language || 'vi',
        cfg.customWords,
        refs.usedWordsInMatchRef.current
      );

      const eligible = roster.filter((p) => p.id !== lastImpostorIdRef.current);
      const pool = eligible.length > 0 ? eligible : roster;
      const chosenImpostor = pool[Math.floor(Math.random() * pool.length)];
      lastImpostorIdRef.current = chosenImpostor.id;

      impostorSecretRef.current = { impostorId: chosenImpostor.id, secretWord: word, category };
      const artistColors = assignArtistInkColors(roster);
      const turnOrderIds = buildRotatedTurnOrder(roster, roundNum);

      refs.roundRef.current = roundNum;
      setters.setRound(roundNum);

      roster.forEach((p) => {
        const isImp = p.id === chosenImpostor.id;
        const role: ImpostorRoleSecret = isImp
          ? { isImpostor: true, category, inkColor: artistColors[p.id] }
          : { isImpostor: false, category, secretWord: word, inkColor: artistColors[p.id] };
        impostorRolesByPlayerRef.current.set(p.id, role);

        if (p.id === refs.currentUserId.current) {
          myImpostorRoleRef.current = role;
          setMyImpostorRole(role);
        } else if (!p.isBot) {
          refs.roomServiceRef.current?.sendPartyPrivate(p.id, { kind: 'impostor_role', role });
        }
      });

      const initialPublic: ImpostorPublicState = {
        category,
        passNumber: 1,
        totalPasses: IMPOSTOR_TOTAL_PASSES,
        turnOrderIds,
        activeArtistId: turnOrderIds[0] || null,
        strokesCompletedInRound: 0,
        artistColors,
        votedPlayerIds: [],
        accusedPlayerId: null,
        revealedImpostorId: null,
        impostorGuessText: null,
        outcomeBanner: null,
      };

      const startMsg: ChatMessage = {
        id: `imp_round_${Date.now()}`,
        text: `🧪 Vòng ${roundNum} Đa Dịch Giả Mạo — Chủ đề: [${category}]! Mỗi phù thủy lần lượt vẽ đúng 1 nét bằng màu mực riêng!`,
        type: 'system',
        timestamp: Date.now(),
      };
      setters.setMessages((m) => appendBoundedMessage(m, startMsg));
      refs.roomServiceRef.current?.broadcastChat(startMsg);
      activateImpostorStrokeTurn(0, initialPublic);
    },
    [activateImpostorStrokeTurn, refs, setters]
  );

  useEffect(() => { startImpostorRoundRef.current = startImpostorRound; }, [startImpostorRound]);

  const notifyLocalImpostorStrokeDone = useCallback(() => {
    const cur = impostorStateRef.current;
    if (!cur || cur.activeArtistId !== refs.currentUserId.current) return;

    if (refs.currentUserId.current === refs.hostIdRef.current) {
      const token = refs.turnTokenRef.current;
      const tid = setTimeout(() => {
        if (refs.turnTokenRef.current !== token || refs.phaseRef.current !== 'impostor_draw') return;
        activateImpostorStrokeTurn(cur.strokesCompletedInRound + 1, cur, cur.activeArtistId);
      }, 480);
      refs.botTimeoutsRef.current.push(tid);
    } else {
      refs.roomServiceRef.current?.sendPartyEvent({ kind: 'impostor_stroke_done', passNumber: cur.passNumber });
    }
  }, [activateImpostorStrokeTurn, refs]);

  const submitMyImpostorVote = useCallback(
    (suspectId: string) => {
      if (!suspectId || suspectId === refs.currentUserId.current || mySelectedVoteId) return;
      soundManager.playClick();
      setMySelectedVoteId(suspectId);
      if (refs.currentUserId.current === refs.hostIdRef.current) {
        recordHostVote(refs.currentUserId.current, suspectId);
      } else {
        refs.roomServiceRef.current?.sendPartyEvent({ kind: 'impostor_vote_cast', suspectId });
      }
    },
    [mySelectedVoteId, recordHostVote, refs]
  );

  const submitMyImpostorCounterGuess = useCallback(
    (guessText: string) => {
      const clean = guessText.trim();
      if (!clean) return;
      soundManager.playSpellVfx();
      if (refs.currentUserId.current === refs.hostIdRef.current) {
        resolveImpostorCounterGuess(clean);
      } else {
        refs.roomServiceRef.current?.sendPartyEvent({ kind: 'impostor_counter_guess', guessText: clean });
      }
    },
    [refs, resolveImpostorCounterGuess]
  );

  useEffect(() => {
    if (phase !== 'impostor_draw' && phase !== 'impostor_vote' && phase !== 'impostor_guess') return;
    const timer = setInterval(() => {
      const prev = refs.timeLeftRef.current;
      if (prev <= 1) {
        clearInterval(timer);
        refs.timeLeftRef.current = 0;
        setters.setTimeLeft(0);
        if (refs.currentUserId.current === refs.hostIdRef.current) {
          const cur = impostorStateRef.current;
          if (phase === 'impostor_draw' && cur) {
            activateImpostorStrokeTurn(cur.strokesCompletedInRound + 1, cur, cur.activeArtistId);
          } else if (phase === 'impostor_vote') {
            resolveImpostorVotePhase();
          } else if (phase === 'impostor_guess') {
            resolveImpostorCounterGuess('');
          }
        }
        return;
      }
      const next = prev - 1;
      refs.timeLeftRef.current = next;
      setters.setTimeLeft(next);
      if (next <= 5) soundManager.playTick();
    }, 1000);
    return () => clearInterval(timer);
  }, [
    phase,
    impostorState?.strokesCompletedInRound,
    impostorState?.activeArtistId,
    activateImpostorStrokeTurn,
    refs,
    resolveImpostorCounterGuess,
    resolveImpostorVotePhase,
    setters,
  ]);

  const handleIncomingImpostorEvent = useCallback(
    (event: PartyNetworkEvent, senderId: string) => {
      if (refs.currentUserId.current !== refs.hostIdRef.current) return;
      const cur = impostorStateRef.current;
      if (event.kind === 'impostor_stroke_done' && cur && cur.activeArtistId === senderId) {
        const token = refs.turnTokenRef.current;
        const tid = setTimeout(() => {
          if (refs.turnTokenRef.current !== token || refs.phaseRef.current !== 'impostor_draw') return;
          activateImpostorStrokeTurn(cur.strokesCompletedInRound + 1, cur, senderId);
        }, 450);
        refs.botTimeoutsRef.current.push(tid);
      } else if (event.kind === 'impostor_vote_cast') {
        recordHostVote(senderId, event.suspectId);
      } else if (
        event.kind === 'impostor_counter_guess' &&
        impostorSecretRef.current?.impostorId === senderId &&
        refs.phaseRef.current === 'impostor_guess'
      ) {
        resolveImpostorCounterGuess(event.guessText);
      }
    },
    [activateImpostorStrokeTurn, recordHostVote, refs, resolveImpostorCounterGuess]
  );

  const applySyncedImpostorState = useCallback((incoming: ImpostorPublicState) => {
    setImpostorState((prev) => {
      if (incoming.votedPlayerIds.length === 0 && prev && prev.votedPlayerIds.length > 0) {
        setMySelectedVoteId(null);
      }
      impostorStateRef.current = incoming;
      return incoming;
    });
  }, []);

  const receivePrivateImpostorRole = useCallback((role: ImpostorRoleSecret) => {
    myImpostorRoleRef.current = role;
    setMyImpostorRole(role);
    setMySelectedVoteId(null);
  }, []);

  const resendImpostorRoleToJoiner = useCallback(
    (requesterId: string) => {
      const role = impostorRolesByPlayerRef.current.get(requesterId);
      if (role) {
        refs.roomServiceRef.current?.sendPartyPrivate(requesterId, { kind: 'impostor_role', role });
      }
    },
    [refs.roomServiceRef]
  );

  const handleImpostorPlayerRemoved = useCallback(
    (removedId: string, onInsufficientPlayers: () => void) => {
      if (refs.currentUserId.current !== refs.hostIdRef.current) return;
      const p = refs.phaseRef.current;
      if (p !== 'impostor_draw' && p !== 'impostor_vote' && p !== 'impostor_guess') return;
      if (refs.playersRef.current.length < 3) {
        onInsufficientPlayers();
        return;
      }

      const secret = impostorSecretRef.current;
      const cur = impostorStateRef.current;
      if (!secret || !cur) return;

      if (secret.impostorId === removedId) {
        const rewarded = refs.playersRef.current.map((pl) => ({
          ...pl,
          isDrawer: false,
          hasGuessed: false,
          score: pl.score + 150,
        }));
        const banner = `⚖️ Kẻ Giả Mạo đã rời sảnh — Từ khóa bí mật là「${secret.secretWord}」(+150đ cho các phù thủy)!`;
        concludeImpostorRound(
          rewarded,
          { ...cur, activeArtistId: null, revealedImpostorId: removedId, outcomeBanner: banner },
          secret.secretWord,
          banner
        );
        return;
      }

      if (p === 'impostor_draw' && cur.activeArtistId === removedId) {
        activateImpostorStrokeTurn(cur.strokesCompletedInRound, cur);
      } else if (p === 'impostor_vote') {
        impostorVotesMapRef.current.delete(removedId);
        if (refs.playersRef.current.every((pl) => impostorVotesMapRef.current.has(pl.id))) {
          resolveImpostorVotePhase();
        }
      }
    },
    [activateImpostorStrokeTurn, concludeImpostorRound, refs, resolveImpostorVotePhase]
  );

  const isImpostorSpoilerBlocked = useCallback(
    (text: string): boolean => {
      const secret = impostorSecretRef.current;
      if (!secret?.secretWord) return false;
      const p = refs.phaseRef.current;
      if (p !== 'impostor_draw' && p !== 'impostor_vote' && p !== 'impostor_guess') return false;
      return containsWordSpoiler(text, secret.secretWord);
    },
    [refs.phaseRef]
  );

  return {
    impostorState,
    impostorStateRef,
    myImpostorRole,
    mySelectedVoteId,
    startImpostorRound,
    resetImpostorState,
    notifyLocalImpostorStrokeDone,
    submitMyImpostorVote,
    submitMyImpostorCounterGuess,
    handleIncomingImpostorEvent,
    handleImpostorPlayerRemoved,
    applySyncedImpostorState,
    receivePrivateImpostorRole,
    resendImpostorRoleToJoiner,
    isImpostorSpoilerBlocked,
  };
}
