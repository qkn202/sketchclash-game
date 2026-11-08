import { useCallback, useEffect, useRef } from 'react';
import type { Player, ChatMessage } from '../types';
import { getRandomWordChoices, createMaskedWord, normalizeGuess } from '../data/words';
import { generateProceduralDrawing } from '../services/botEngine';
import { soundManager } from '../utils/audio';
import {
  appendBoundedMessage,
  appendCompactDrawAction,
  computeNextTurnAndRound,
  resetTurnBoardState,
  type SharedGameRefs,
  type SharedGameSetters,
} from './gameControllerTypes';
import { buildUniqueRushChoices, useRushController } from './useRushController';
import { executePlayAgainReset } from './roomSyncHelpers';

export function useTurnController(refs: SharedGameRefs, setters: SharedGameSetters) {
  const ctxRef = useRef({ refs, setters });
  ctxRef.current = { refs, setters };

  const { launchRushDrawingPhase, recordRushPlayerChoice } = useRushController(refs, setters);
  const handleSkipDrawerRef = useRef<() => void>(() => { });
  const handleWordSelectedRef = useRef<(word: string, actorId?: string) => void>(() => { });

  const startNewTurn = useCallback(
    (turnIdx: number, newRound?: number, customPlayers?: Player[]) => {
      const { refs: r, setters: s } = ctxRef.current;
      const cfg = r.roomConfigRef.current;
      const currentMode = cfg.mode || 'classic';

      if (r.selectionTimeoutRef.current) {
        clearTimeout(r.selectionTimeoutRef.current);
        r.selectionTimeoutRef.current = null;
      }
      s.clearBotTimeouts();
      r.turnTokenRef.current += 1;
      const turnToken = r.turnTokenRef.current;
      r.isEndingRound.current = false;

      const sourcePlayers = customPlayers?.length ? customPlayers : r.playersRef.current;
      if (sourcePlayers.length === 0) return;
      const len = sourcePlayers.length;

      const assignedPlayers = sourcePlayers.map((p, idx) => ({
        ...p,
        isDrawer:
          currentMode === 'rush_draw'
            ? true
            : currentMode === 'all_draw'
              ? idx !== (turnIdx + 1) % len
              : currentMode === 'dual_coop'
                ? idx === turnIdx % len || idx === (turnIdx + 1) % len
                : idx === turnIdx % len,
        hasGuessed: false,
        isLoneGuesser: currentMode === 'all_draw' && idx === (turnIdx + 1) % len,
        secretWord: undefined,
        solvedOpponentIds: [],
        solvedByPlayerIds: [],
      }));

      r.playersRef.current = assignedPlayers;
      s.setPlayers(assignedPlayers);

      r.currentDrawerIndexRef.current = turnIdx;
      s.setCurrentDrawerIndex(turnIdx);
      const activeRound = newRound ?? r.roundRef.current;
      if (newRound !== undefined) {
        if (newRound !== r.roundRef.current || (newRound === 1 && turnIdx === 0)) {
          r.drawnPlayerIdsInRoundRef.current.clear();
        }
        r.roundRef.current = newRound;
        s.setRound(newRound);
      }

      if (currentMode !== 'rush_draw') {
        const primarySlotPlayer = assignedPlayers[turnIdx % len];
        if (primarySlotPlayer) {
          r.drawnPlayerIdsInRoundRef.current.add(primarySlotPlayer.id);
        }
      }

      resetTurnBoardState(r, s);
      r.timeLeftRef.current = 15;
      s.setTimeLeft(15);
      r.phaseRef.current = 'selecting_word';
      s.setPhase('selecting_word');
      s.setMobileTab('canvas');
      window.scrollTo({ top: 0, behavior: 'instant' });

      if (currentMode === 'rush_draw') {
        r.rushPickedWordsRef.current.clear();
        const perPlayerChoices = buildUniqueRushChoices(
          assignedPlayers,
          cfg.language,
          cfg.customWords,
          r.usedWordsInMatchRef.current
        );
        r.rushChoicesMapRef.current = perPlayerChoices;
        r.currentDrawerIdRef.current = null;

        const hostChoices =
          perPlayerChoices.get(r.currentUserId.current) ||
          getRandomWordChoices(cfg.language, cfg.customWords, r.usedWordsInMatchRef.current);
        s.setWordChoices(hostChoices);

        assignedPlayers.forEach((p) => {
          const pChoices = perPlayerChoices.get(p.id) || hostChoices;
          if (p.isBot) {
            r.rushPickedWordsRef.current.set(p.id, pChoices[Math.floor(Math.random() * pChoices.length)]);
          } else if (p.id !== r.currentUserId.current) {
            r.roomServiceRef.current?.sendPrivateChoices(p.id, pChoices);
          }
        });

        s.broadcastGameState({
          phase: 'selecting_word',
          currentDrawerId: null,
          round: activeRound,
          timeLeft: 15,
          drawTime: cfg.drawTime,
          totalRounds: cfg.totalRounds,
          maskedWord: '',
          revealedIndices: [],
          roundEndMessage: null,
          revealedWord: '',
          mode: currentMode,
          players: assignedPlayers,
        });

        r.selectionTimeoutRef.current = setTimeout(() => {
          if (r.turnTokenRef.current === turnToken && r.phaseRef.current === 'selecting_word') {
            launchRushDrawingPhase();
          }
        }, 15000);
        return;
      }

      const choices = getRandomWordChoices(
        cfg.language,
        cfg.customWords,
        r.usedWordsInMatchRef.current
      );
      s.setWordChoices(choices);

      let selectedDrawerId: string | null = null;
      let isBotTurn = false;

      if (currentMode === 'dual_coop') {
        const p1 = assignedPlayers[turnIdx % len];
        const p2 = assignedPlayers[(turnIdx + 1) % len];
        const humanPicker = !p1?.isBot ? p1 : !p2?.isBot ? p2 : null;
        selectedDrawerId = (humanPicker || p1)?.id ?? null;
        isBotTurn = !humanPicker;
      } else if (currentMode === 'all_draw') {
        const orderedDrawers = Array.from({ length: len }, (_, off) => assignedPlayers[(turnIdx + off) % len]).filter(
          (p) => p.isDrawer
        );
        const picker = orderedDrawers.find((p) => !p.isBot) || orderedDrawers[0];
        selectedDrawerId = picker?.id ?? null;
        isBotTurn = Boolean(picker?.isBot);
      } else {
        const candidate = assignedPlayers[turnIdx % len];
        selectedDrawerId = candidate?.id ?? null;
        isBotTurn = Boolean(candidate?.isBot);
      }

      r.currentDrawerIdRef.current = selectedDrawerId;

      s.broadcastGameState({
        phase: 'selecting_word',
        currentDrawerId: selectedDrawerId,
        round: activeRound,
        wordChoices: choices,
        timeLeft: 15,
        drawTime: cfg.drawTime,
        totalRounds: cfg.totalRounds,
        maskedWord: '',
        revealedIndices: [],
        roundEndMessage: null,
        revealedWord: '',
        mode: currentMode,
        players: assignedPlayers,
      });

      if (isBotTurn && selectedDrawerId) {
        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        r.selectionTimeoutRef.current = setTimeout(() => {
          if (r.turnTokenRef.current === turnToken && r.phaseRef.current === 'selecting_word') {
            handleWordSelectedRef.current(botChoice, selectedDrawerId);
          }
        }, 1400);
      } else {
        r.selectionTimeoutRef.current = setTimeout(() => {
          if (
            r.turnTokenRef.current === turnToken &&
            r.currentUserId.current === r.hostIdRef.current &&
            r.phaseRef.current === 'selecting_word'
          ) {
            handleSkipDrawerRef.current();
          }
        }, 16000);
      }
    },
    [launchRushDrawingPhase]
  );

  const handleWordSelected = useCallback(
    (chosenWord: string, actorId?: string) => {
      const { refs: r, setters: s } = ctxRef.current;
      const cfg = r.roomConfigRef.current;
      const effectiveActor = actorId || r.currentUserId.current;

      if (cfg.mode === 'rush_draw') {
        s.setHasSubmittedRushWord(true);
        r.currentWordRef.current = chosenWord;
        s.setCurrentWord(chosenWord);
        if (r.currentUserId.current === r.hostIdRef.current) {
          recordRushPlayerChoice(r.currentUserId.current, chosenWord);
        } else {
          r.roomServiceRef.current?.submitWordSelection(chosenWord);
        }
        return;
      }

      if (r.currentUserId.current !== r.hostIdRef.current) {
        if (r.currentUserId.current !== r.currentDrawerIdRef.current) return;
        r.currentWordRef.current = chosenWord;
        s.setCurrentWord(chosenWord);
        r.roomServiceRef.current?.submitWordSelection(chosenWord);
        return;
      }

      if (effectiveActor !== r.currentDrawerIdRef.current) return;
      if (r.phaseRef.current !== 'selecting_word') return;

      if (r.selectionTimeoutRef.current) {
        clearTimeout(r.selectionTimeoutRef.current);
        r.selectionTimeoutRef.current = null;
      }

      const turnToken = r.turnTokenRef.current;
      const activePlayers = r.playersRef.current;
      const hostIsDrawer = Boolean(activePlayers.find((p) => p.id === r.currentUserId.current)?.isDrawer);

      r.usedWordsInMatchRef.current.add(normalizeGuess(chosenWord));
      r.currentWordRef.current = chosenWord;
      s.setCurrentWord(hostIsDrawer ? chosenWord : '');

      const initialMask = createMaskedWord(chosenWord, []);
      r.maskedWordRef.current = initialMask;
      s.setMaskedWord(initialMask);
      r.revealedIndicesRef.current = [];
      s.setRevealedIndices([]);
      r.timeLeftRef.current = cfg.drawTime;
      s.setTimeLeft(cfg.drawTime);
      r.phaseRef.current = 'drawing';
      s.setPhase('drawing');
      s.setMobileTab('canvas');

      r.myRushDrawActionsRef.current = [];
      r.opponentDrawActionsRef.current = {};
      s.setMyRushDrawActions([]);
      s.setIncomingDrawActions([]);
      s.setOpponentDrawActions({});
      s.setCanvasResetKey((k) => k + 1);
      r.roomServiceRef.current?.broadcastDraw({ type: 'clear' });

      const activeDrawerObj = activePlayers.find((p) => p.id === r.currentDrawerIdRef.current);
      let introText = `🪄 ${activeDrawerObj?.name || 'Pháp sư'} đã chọn bùa vẽ và bắt đầu múa đũa phép!`;
      if (cfg.mode === 'dual_coop') {
        const coDrawers = activePlayers.filter((p) => p.isDrawer).map((p) => p.name).join(' & ');
        introText = `🤝 ${coDrawers || 'Hai pháp sư'} đang Song Kiếm Hợp Bích cùng múa đũa vẽ!`;
      } else if (cfg.mode === 'all_draw') {
        const loneGuesser = activePlayers.find((p) => p.isLoneGuesser);
        introText = `🎭 Tất cả phù thủy đang cùng múa đũa vẽ cho ${loneGuesser?.name || 'Thám Tử'} đoán!`;
      }

      const sysMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        text: introText,
        type: 'system',
        timestamp: Date.now(),
      };
      s.setMessages((prev) => appendBoundedMessage(prev, sysMsg));
      r.roomServiceRef.current?.broadcastChat(sysMsg);

      s.broadcastGameState({
        phase: 'drawing',
        maskedWord: initialMask,
        revealedIndices: [],
        timeLeft: cfg.drawTime,
        mode: cfg.mode,
        players: activePlayers,
      });

      activePlayers.forEach((p) => {
        if (p.isDrawer && !p.isBot && p.id !== r.currentUserId.current) {
          r.roomServiceRef.current?.sendPrivateWord(p.id, chosenWord);
        }
      });

      s.clearBotTimeouts();
      const botDrawers = activePlayers.filter((p) => p.isBot && p.isDrawer);
      if (botDrawers.length > 0) {
        const humanCoDrawer = activePlayers.some((p) => !p.isBot && p.isDrawer);
        const startDelay = cfg.mode === 'dual_coop' && humanCoDrawer ? 1800 : 300;
        const stepMs = cfg.mode === 'classic' ? 550 : 650;
        const botStrokes = generateProceduralDrawing(chosenWord, undefined, false);
        botStrokes.forEach((action, idx) => {
          const tid = setTimeout(() => {
            if (r.turnTokenRef.current !== turnToken || r.phaseRef.current !== 'drawing') return;
            s.setIncomingDrawActions((prev) => appendCompactDrawAction(prev, action));
            s.setMyRushDrawActions((prev) => {
              const next = appendCompactDrawAction(prev, action);
              r.myRushDrawActionsRef.current = next;
              return next;
            });
            r.roomServiceRef.current?.broadcastDraw(action);
          }, startDelay + (idx + 1) * stepMs);
          r.botTimeoutsRef.current.push(tid);
        });
      }
    },
    [recordRushPlayerChoice]
  );

  useEffect(() => {
    handleWordSelectedRef.current = handleWordSelected;
  }, [handleWordSelected]);

  const handleSkipDrawer = useCallback(() => {
    const { refs: r, setters: s } = ctxRef.current;
    if (r.currentUserId.current !== r.hostIdRef.current) return;
    if (r.phaseRef.current !== 'selecting_word') return;

    if (r.selectionTimeoutRef.current) {
      clearTimeout(r.selectionTimeoutRef.current);
      r.selectionTimeoutRef.current = null;
    }

    const cfg = r.roomConfigRef.current;
    if (cfg.mode === 'rush_draw') {
      launchRushDrawingPhase();
      return;
    }

    const currentPlayers = r.playersRef.current;
    if (currentPlayers.length === 0) return;

    const drawer =
      currentPlayers.find((p) => p.id === r.currentDrawerIdRef.current) ||
      currentPlayers[r.currentDrawerIndexRef.current % currentPlayers.length];
    const drawerName = drawer?.name || 'Pháp sư';

    soundManager.playTick();

    const skipMsg: ChatMessage = {
      id: `skip_${Date.now()}`,
      text: `⏰ Phù thủy ${drawerName} đã không chọn từ vẽ kịp thời gian (15s)! Tự động bỏ qua lượt và chuyển sang người tiếp theo.`,
      type: 'system',
      timestamp: Date.now(),
    };
    s.setMessages((prev) => appendBoundedMessage(prev, skipMsg));
    r.roomServiceRef.current?.broadcastChat(skipMsg);

    const { nextDrawerIdx, nextRound } = computeNextTurnAndRound(r);

    if (nextRound > cfg.totalRounds) {
      r.phaseRef.current = 'game_over';
      s.setPhase('game_over');
      s.broadcastGameState({ phase: 'game_over', players: currentPlayers });
    } else {
      startNewTurn(nextDrawerIdx, nextRound, currentPlayers);
    }
  }, [launchRushDrawingPhase, startNewTurn]);

  useEffect(() => {
    handleSkipDrawerRef.current = handleSkipDrawer;
  }, [handleSkipDrawer]);

  const handleRoundEnd = useCallback(() => {
    const { refs: r, setters: s } = ctxRef.current;
    if (r.currentUserId.current !== r.hostIdRef.current) return;
    if (r.isEndingRound.current) return;
    r.isEndingRound.current = true;
    s.clearBotTimeouts();

    const cfg = r.roomConfigRef.current;
    const turnToken = r.turnTokenRef.current;
    r.phaseRef.current = 'round_end';
    s.setPhase('round_end');
    s.setInspectingPlayerId(null);
    s.setInspectFeedback(null);
    soundManager.playVictory();

    if (cfg.mode === 'rush_draw') {
      const summaryList = r.playersRef.current
        .filter((p) => p.secretWord)
        .map((p) => `${p.name}: "${p.secretWord}"`);
      const msg = `Từ khóa các phù thủy vừa vẽ:\n${summaryList.join(' • ')}`;
      const titleWord = 'Đuổi Hình Bắt Chữ';
      s.setRevealedWord(titleWord);
      s.setRoundEndMessage(msg);

      s.broadcastGameState({
        phase: 'round_end',
        revealedWord: titleWord,
        roundEndMessage: msg,
        players: r.playersRef.current,
      });

      const tid = setTimeout(() => {
        if (r.turnTokenRef.current !== turnToken) return;
        const currentPlayers = r.playersRef.current;
        if (currentPlayers.length === 0) return;
        const nextRound = r.roundRef.current + 1;
        if (nextRound > cfg.totalRounds) {
          r.phaseRef.current = 'game_over';
          s.setPhase('game_over');
          s.broadcastGameState({ phase: 'game_over', players: currentPlayers });
        } else {
          startNewTurn(0, nextRound, currentPlayers);
        }
      }, 4500);
      r.botTimeoutsRef.current.push(tid);
      return;
    }

    const answer = r.currentWordRef.current;
    const msg = `Từ khóa vừa rồi là: "${answer}"`;
    s.setRevealedWord(answer);
    s.setRoundEndMessage(msg);

    s.broadcastGameState({
      phase: 'round_end',
      revealedWord: answer,
      roundEndMessage: msg,
      players: r.playersRef.current,
    });

    const tid = setTimeout(() => {
      if (r.turnTokenRef.current !== turnToken) return;
      const currentPlayers = r.playersRef.current;
      if (currentPlayers.length === 0) return;

      const { nextDrawerIdx, nextRound } = computeNextTurnAndRound(r);

      if (nextRound > cfg.totalRounds) {
        r.phaseRef.current = 'game_over';
        s.setPhase('game_over');
        s.broadcastGameState({ phase: 'game_over', players: currentPlayers });
      } else {
        startNewTurn(nextDrawerIdx, nextRound, currentPlayers);
      }
    }, 4000);
    r.botTimeoutsRef.current.push(tid);
  }, [startNewTurn]);

  const handlePlayAgain = useCallback(
    (returnToWaitingRoom: boolean = false) => {
      const { refs: r, setters: s } = ctxRef.current;
      executePlayAgainReset(r, s, returnToWaitingRoom, startNewTurn);
    },
    [startNewTurn]
  );

  return {
    startNewTurn,
    handleWordSelected,
    recordRushPlayerChoice,
    handleSkipDrawer,
    handleRoundEnd,
    handlePlayAgain,
  };
}
