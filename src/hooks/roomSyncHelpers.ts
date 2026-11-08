import type React from 'react';
import type {
  Player,
  ChatMessage,
  DrawAction,
  GameState,
  RoomConfig,
  RelayPublicState,
  ImpostorPublicState,
} from '../types';
import { getRandomWordChoices, normalizeGuess, WORDS } from '../data/words';
import { createBotPlayer, generateProceduralDrawing } from '../services/botEngine';
import {
  appendBoundedMessage,
  appendCompactDrawAction,
  computeNextTurnAndRound,
  resetTurnBoardState,
  type SharedGameRefs,
  type SharedGameSetters,
} from './gameControllerTypes';
import { buildUniqueRushChoices } from './useRushController';
import { soundManager } from '../utils/audio';

/**
 * Deterministic host election. The room creator records joinedAt = 0 and every
 * later joiner records Date.now(), so the oldest real (non-bot) player is the
 * creator / longest-present member. Ties break on id so all clients compute the
 * same winner. Used on the first game_state_sync so a random late joiner cannot
 * claim host authority simply by broadcasting first.
 */
export function oldestRealPlayer(players: Player[]): Player | null {
  const real = players.filter((p) => !p.isBot);
  if (real.length === 0) return null;
  let best: Player = real[0];
  for (const p of real) {
    const aTen = best.joinedAt ?? Number.MAX_SAFE_INTEGER;
    const bTen = p.joinedAt ?? Number.MAX_SAFE_INTEGER;
    if (bTen < aTen || (bTen === aTen && p.id < best.id)) best = p;
  }
  return best;
}

export function applyIncomingGameStateSync(
  syncState: Partial<GameState>,
  senderId: string,
  r: SharedGameRefs,
  s: SharedGameSetters,
  setRoomConfig: React.Dispatch<React.SetStateAction<RoomConfig>>,
  partySyncCallbacks?: {
    applySyncedRelayState: (st: RelayPublicState) => void;
    applySyncedImpostorState: (st: ImpostorPublicState) => void;
  }
): void {
  if (r.hostIdRef.current && senderId !== r.hostIdRef.current) return;
  if (!r.hostIdRef.current) {
    // Deterministic host election (finding #1). Host = the oldest real (non-bot)
    // player: the creator records joinedAt 0, later joiners Date.now(), and the
    // roster only ever contains *present* players (a departed creator has already
    // been removed by reconcileOnlinePresenceUpdate, which re-elects host by the
    // same tenure rule). We must elect from the authoritative incoming roster, NOT
    // the local one — a fresh joiner's local roster is just themselves, and using it
    // would let any visitor self-claim host.
    //
    // - No authoritative roster yet (a partial/config-only sync): don't claim host,
    //   wait for the full state the real host sends via request_state.
    // - Sender is not the tenure-elected host: drop the sync so a random late
    //   visitor cannot hijack scores/phases/kicks; the real host re-sends it.
    const roster =
      syncState.players && syncState.players.length > 0
        ? syncState.players
        : null;
    if (!roster) return;
    const elected = oldestRealPlayer(roster);
    if (!elected || elected.id !== senderId) return;
    r.hostIdRef.current = senderId;
  }

  const prevPhase = r.phaseRef.current;
  if (syncState.phase) {
    r.phaseRef.current = syncState.phase;
    s.setPhase(syncState.phase);
    if (syncState.phase === 'selecting_word') {
      s.setMobileTab('canvas');
      s.setHasSubmittedRushWord(false);
      r.currentWordRef.current = '';
      s.setCurrentWord('');
      s.setRevealedWord('');
      s.setRoundEndMessage(null);
      r.myRushDrawActionsRef.current = [];
      s.setMyRushDrawActions([]);
      r.opponentDrawActionsRef.current = {};
      s.setOpponentDrawActions({});
      s.setIncomingDrawActions([]);
      s.setSolvedWordsMap({});
      s.setInspectingPlayerId(null);
      s.setInspectFeedback(null);
      s.setCanvasResetKey((k) => k + 1);
    } else if (syncState.phase === 'drawing' && prevPhase !== 'drawing') {
      s.setMobileTab('canvas');
      if (prevPhase === 'selecting_word') {
        r.myRushDrawActionsRef.current = [];
        s.setMyRushDrawActions([]);
        r.opponentDrawActionsRef.current = {};
        s.setOpponentDrawActions({});
        s.setIncomingDrawActions([]);
        s.setCanvasResetKey((k) => k + 1);
      }
    } else if (syncState.phase === 'impostor_draw' && prevPhase !== 'impostor_draw') {
      s.setMobileTab('canvas');
      if (prevPhase === 'waiting_room' || prevPhase === 'round_end' || prevPhase === 'game_over') {
        r.myRushDrawActionsRef.current = [];
        s.setMyRushDrawActions([]);
        s.setIncomingDrawActions([]);
        s.setRoundEndMessage(null);
        s.setRevealedWord('');
        s.setCanvasResetKey((k) => k + 1);
      }
    } else if (syncState.phase !== 'drawing') {
      s.setInspectingPlayerId(null);
      s.setInspectFeedback(null);
      if (syncState.phase === 'waiting_room') {
        s.setHasSubmittedRushWord(false);
      }
    }
  }

  if (syncState.players) {
    const syncedPlayers = syncState.players.map((p) => {
      const localPlayer = r.playersRef.current.find((existing) => existing.id === p.id);
      return p.id === r.currentUserId.current
        ? { ...p, secretWord: syncState.phase === 'selecting_word' ? undefined : localPlayer?.secretWord }
        : { ...p, secretWord: undefined };
    });
    r.playersRef.current = syncedPlayers;
    s.setPlayers(syncedPlayers);
  }

  if (syncState.wordChoices) s.setWordChoices(syncState.wordChoices);
  if (syncState.currentDrawerId !== undefined) {
    r.currentDrawerIdRef.current = syncState.currentDrawerId;
    if (syncState.currentDrawerId) {
      const drawerIdx = syncState.players?.findIndex((p) => p.id === syncState.currentDrawerId) ?? -1;
      if (drawerIdx >= 0) {
        r.currentDrawerIndexRef.current = drawerIdx;
        s.setCurrentDrawerIndex(drawerIdx);
      }
    }
  }
  if (syncState.maskedWord !== undefined) {
    r.maskedWordRef.current = syncState.maskedWord;
    s.setMaskedWord(syncState.maskedWord);
  }
  if (syncState.revealedIndices) {
    r.revealedIndicesRef.current = syncState.revealedIndices;
    s.setRevealedIndices(syncState.revealedIndices);
  }
  if (syncState.roundEndMessage !== undefined) s.setRoundEndMessage(syncState.roundEndMessage);
  if (syncState.revealedWord !== undefined) s.setRevealedWord(syncState.revealedWord);
  if (syncState.timeLeft !== undefined) {
    r.timeLeftRef.current = syncState.timeLeft;
    s.setTimeLeft(syncState.timeLeft);
  }
  if (syncState.round !== undefined) {
    r.roundRef.current = syncState.round;
    s.setRound(syncState.round);
  }
  if (syncState.relayState) {
    partySyncCallbacks?.applySyncedRelayState(syncState.relayState);
  }
  if (syncState.impostorState) {
    partySyncCallbacks?.applySyncedImpostorState(syncState.impostorState);
  }
  if (
    syncState.mode !== undefined ||
    syncState.drawTime !== undefined ||
    syncState.totalRounds !== undefined ||
    syncState.language !== undefined ||
    syncState.maxPlayers !== undefined ||
    syncState.customWordsCount !== undefined
  ) {
    const prevCfg = r.roomConfigRef.current;
    const updatedCfg: RoomConfig = {
      ...prevCfg,
      mode: syncState.mode ?? prevCfg.mode,
      drawTime: syncState.drawTime ?? prevCfg.drawTime,
      totalRounds: syncState.totalRounds ?? prevCfg.totalRounds,
      language: syncState.language ?? prevCfg.language,
      maxPlayers: syncState.maxPlayers ?? prevCfg.maxPlayers,
      customWordsCount: syncState.customWordsCount ?? prevCfg.customWordsCount,
    };
    r.roomConfigRef.current = updatedCfg;
    r.roomServiceRef.current?.setMaxPlayers(updatedCfg.maxPlayers);
    setRoomConfig(updatedCfg);
  }
}

export interface HostRecoveryCallbacks {
  startNewTurn: (turnIdx: number, newRound?: number, customPlayers?: Player[]) => void;
  handleSkipDrawer: () => void;
  handleRoundEnd: () => void;
  onPartyHostPromoted?: () => void;
  onPartyPlayerRemoved?: (removedId: string) => void;
}

export function recoverPromotedHostSession(
  r: SharedGameRefs,
  s: SharedGameSetters,
  cb: HostRecoveryCallbacks
): void {
  const phase = r.phaseRef.current;
  const cfg = r.roomConfigRef.current;
  const turnToken = r.turnTokenRef.current;
  const pendingBackups = r.pendingWordBackupsRef.current;

  if (
    (cfg.mode === 'relay_phone' || cfg.mode === 'polyjuice_impostor') &&
    phase !== 'waiting_room' &&
    phase !== 'game_over' &&
    phase !== 'relay_showcase'
  ) {
    cb.onPartyHostPromoted?.();
    return;
  }

  if (phase === 'selecting_word') {
    if (cfg.mode === 'rush_draw') {
      if (r.rushChoicesMapRef.current.size === 0) {
        r.rushChoicesMapRef.current = buildUniqueRushChoices(r.playersRef.current, cfg.language, cfg.customWords);
      }
      if (r.currentWordRef.current) {
        r.rushPickedWordsRef.current.set(r.currentUserId.current, r.currentWordRef.current);
      }
      pendingBackups.forEach((word, senderId) => {
        if (word) r.rushPickedWordsRef.current.set(senderId, word);
      });
      r.playersRef.current.forEach((p) => {
        if (p.isBot && !r.rushPickedWordsRef.current.has(p.id)) {
          const choices = r.rushChoicesMapRef.current.get(p.id) || getRandomWordChoices(cfg.language, cfg.customWords);
          r.rushPickedWordsRef.current.set(p.id, choices[0] || 'Đũa phép');
        }
      });
      pendingBackups.clear();
    }
    if (r.selectionTimeoutRef.current) clearTimeout(r.selectionTimeoutRef.current);
    const waitMs = Math.max(1500, r.timeLeftRef.current * 1000);
    r.selectionTimeoutRef.current = setTimeout(() => {
      if (r.turnTokenRef.current === turnToken && r.phaseRef.current === 'selecting_word') {
        cb.handleSkipDrawer();
      }
    }, waitMs);
    return;
  }

  if (phase === 'round_end') {
    const tid = setTimeout(() => {
      if (r.turnTokenRef.current !== turnToken || r.phaseRef.current !== 'round_end') return;
      const currentPlayers = r.playersRef.current;
      if (currentPlayers.length === 0) return;

      if (cfg.mode === 'rush_draw') {
        const nextRound = r.roundRef.current + 1;
        if (nextRound > cfg.totalRounds) {
          r.phaseRef.current = 'game_over';
          s.setPhase('game_over');
          s.broadcastGameState({ phase: 'game_over', players: currentPlayers });
        } else {
          cb.startNewTurn(0, nextRound, currentPlayers);
        }
        return;
      }

      const { nextDrawerIdx, nextRound } = computeNextTurnAndRound(r);
      if (nextRound > cfg.totalRounds) {
        r.phaseRef.current = 'game_over';
        s.setPhase('game_over');
        s.broadcastGameState({ phase: 'game_over', players: currentPlayers });
      } else {
        cb.startNewTurn(nextDrawerIdx, nextRound, currentPlayers);
      }
    }, 3200);
    r.botTimeoutsRef.current.push(tid);
    return;
  }

  if (phase === 'drawing') {
    if (cfg.mode === 'rush_draw') {
      const hostWord = r.currentWordRef.current;
      const usedLower = new Set<string>();
      if (hostWord) usedLower.add(hostWord.toLowerCase());
      pendingBackups.forEach((w) => {
        if (w) usedLower.add(w.toLowerCase());
      });

      const fullPool = [...(cfg.customWords || []), ...(WORDS[cfg.language] || WORDS.vi)];
      const patched = r.playersRef.current.map((p) => {
        if (p.id === r.currentUserId.current && hostWord) {
          return { ...p, secretWord: hostWord };
        }
        const backedUp = pendingBackups.get(p.id);
        if (backedUp) {
          return { ...p, secretWord: backedUp };
        }
        if (p.isBot && !p.secretWord) {
          const fallback =
            fullPool.find((w) => w.trim() && !usedLower.has(w.trim().toLowerCase())) ||
            getRandomWordChoices(cfg.language, cfg.customWords)[0] ||
            'Đũa phép';
          usedLower.add(fallback.toLowerCase());
          return { ...p, secretWord: fallback };
        }
        return p;
      });
      pendingBackups.clear();
      r.playersRef.current = patched;
      s.setPlayers(patched);
      return;
    }

    if (!r.currentWordRef.current) {
      pendingBackups.forEach((word, senderId) => {
        if (!r.currentWordRef.current && word) {
          const sender = r.playersRef.current.find((p) => p.id === senderId);
          if (sender?.isDrawer) {
            r.currentWordRef.current = word;
          }
        }
      });
      pendingBackups.clear();
    }

    if (!r.currentWordRef.current) {
      const hasHumanDrawer = r.playersRef.current.some((p) => p.isDrawer && !p.isBot);
      if (!hasHumanDrawer) {
        cb.handleRoundEnd();
      } else {
        const fallbackTid = setTimeout(() => {
          if (
            r.turnTokenRef.current === turnToken &&
            r.phaseRef.current === 'drawing' &&
            !r.currentWordRef.current
          ) {
            cb.handleRoundEnd();
          }
        }, 800);
        r.botTimeoutsRef.current.push(fallbackTid);
      }
    }
  }
}

export function syncCanvasHistoryToJoiner(
  r: SharedGameRefs,
  requesterId: string
): void {
  const p = r.phaseRef.current;
  if (
    p !== 'drawing' &&
    p !== 'round_end' &&
    p !== 'impostor_draw' &&
    p !== 'impostor_vote' &&
    p !== 'impostor_guess'
  ) {
    return;
  }
  const cfg = r.roomConfigRef.current;
  if (cfg.mode === 'rush_draw') {
    const mergedOpponents: Record<string, DrawAction[]> = {
      ...r.opponentDrawActionsRef.current,
      [r.currentUserId.current]: r.myRushDrawActionsRef.current,
    };
    r.roomServiceRef.current?.sendCanvasSync(requesterId, [], mergedOpponents);
  } else if (r.myRushDrawActionsRef.current.length > 0) {
    r.roomServiceRef.current?.sendCanvasSync(requesterId, r.myRushDrawActionsRef.current, {});
  }
}

export function spawnBotIntoRoom(r: SharedGameRefs, s: SharedGameSetters): void {
  const prev = r.playersRef.current;
  const cfg = r.roomConfigRef.current;
  const phase = r.phaseRef.current;
  if (
    (cfg.mode === 'relay_phone' || cfg.mode === 'polyjuice_impostor') &&
    phase !== 'waiting_room' &&
    phase !== 'round_end' &&
    phase !== 'game_over'
  ) {
    s.setNoticeToast('Hãy triệu hồi thêm Pháp sư AI tại Phòng Chờ hoặc khi kết thúc vòng đấu!');
    return;
  }
  const maxLimit = cfg.maxPlayers || 20;
  if (prev.length >= maxLimit) {
    s.setNoticeToast(`Phòng đã đạt giới hạn tối đa ${maxLimit} phù thủy!`);
    return;
  }

  const newBot = createBotPlayer(prev);
  const turnToken = r.turnTokenRef.current;

  if (phase === 'selecting_word' || phase === 'drawing') {
    if (cfg.mode === 'all_draw') {
      newBot.isDrawer = true;
      newBot.isLoneGuesser = false;
      if (phase === 'drawing' && r.currentWordRef.current) {
        const strokes = generateProceduralDrawing(r.currentWordRef.current, newBot.id, false);
        strokes.forEach((action, idx) => {
          const tid = setTimeout(() => {
            if (r.turnTokenRef.current !== turnToken || r.phaseRef.current !== 'drawing') return;
            s.setIncomingDrawActions((p) => appendCompactDrawAction(p, action));
            s.setMyRushDrawActions((p) => {
              const next = appendCompactDrawAction(p, action);
              r.myRushDrawActionsRef.current = next;
              return next;
            });
            r.roomServiceRef.current?.broadcastDraw(action);
          }, 800 + (idx + 1) * 650);
          r.botTimeoutsRef.current.push(tid);
        });
      }
    } else if (cfg.mode === 'rush_draw') {
      const usedWords = new Set(prev.map((p) => (p.secretWord || '').toLowerCase()).filter(Boolean));
      const choices = getRandomWordChoices(
        cfg.language,
        cfg.customWords,
        r.usedWordsInMatchRef.current
      );
      const picked = choices.find((w) => !usedWords.has(w.toLowerCase())) || choices[0] || 'Đũa phép';
      r.usedWordsInMatchRef.current.add(normalizeGuess(picked));

      if (phase === 'selecting_word') {
        newBot.isDrawer = true;
        r.rushChoicesMapRef.current.set(newBot.id, choices);
        r.rushPickedWordsRef.current.set(newBot.id, picked);
      } else {
        newBot.isDrawer = true;
        newBot.secretWord = picked;
        const strokes = generateProceduralDrawing(picked, newBot.id);
        strokes.forEach((action, idx) => {
          const tid = setTimeout(() => {
            if (r.turnTokenRef.current !== turnToken || r.phaseRef.current !== 'drawing') return;
            s.setOpponentDrawActions((mapPrev) => {
              const nextMap = {
                ...mapPrev,
                [newBot.id]: appendCompactDrawAction(mapPrev[newBot.id] || [], action),
              };
              r.opponentDrawActionsRef.current = nextMap;
              return nextMap;
            });
            r.roomServiceRef.current?.broadcastDraw(action);
          }, 900 + (idx + 1) * 750);
          r.botTimeoutsRef.current.push(tid);
        });
      }
    }
  }

  const updated = [...prev, newBot];
  r.playersRef.current = updated;
  s.setPlayers(updated);

  const botJoinedMsg: ChatMessage = {
    id: `bot_join_${Date.now()}_${newBot.id}`,
    text: `🤖 ${newBot.name} đã tham gia phòng chơi!`,
    type: 'system',
    timestamp: Date.now(),
  };
  s.setMessages((m) => appendBoundedMessage(m, botJoinedMsg));
  r.roomServiceRef.current?.broadcastChat(botJoinedMsg);
  s.broadcastGameState({ players: updated });
}

export function executePlayAgainReset(
  r: SharedGameRefs,
  s: SharedGameSetters,
  returnToWaitingRoom: boolean,
  startNewTurn: (turnIdx: number, newRound?: number, customPlayers?: Player[]) => void
): void {
  soundManager.playSpellVfx();

  if (r.selectionTimeoutRef.current) {
    clearTimeout(r.selectionTimeoutRef.current);
    r.selectionTimeoutRef.current = null;
  }
  s.clearBotTimeouts();
  r.turnTokenRef.current += 1;
  r.isEndingRound.current = false;
  r.drawnPlayerIdsInRoundRef.current.clear();
  r.usedWordsInMatchRef.current.clear();
  resetTurnBoardState(r, s);

  const cleanPlayers = r.playersRef.current.map((p) => ({
    ...p,
    score: 0,
    hasGuessed: false,
    isDrawer: false,
    isLoneGuesser: false,
    secretWord: undefined,
    solvedOpponentIds: [],
    solvedByPlayerIds: [],
  }));

  r.playersRef.current = cleanPlayers;
  s.setPlayers(cleanPlayers);
  r.roundRef.current = 1;
  s.setRound(1);
  r.currentDrawerIndexRef.current = 0;
  s.setCurrentDrawerIndex(0);
  r.timeLeftRef.current = r.roomConfigRef.current.drawTime;
  s.setTimeLeft(r.roomConfigRef.current.drawTime);

  const finishText = returnToWaitingRoom
    ? '🏰 Toàn bộ phù thủy đã cùng quay về Phòng Chờ! Hãy chuẩn bị cho ván đấu tiếp theo.'
    : '⚡ Ván mới đã chính thức bắt đầu! Điểm số của tất cả thành viên đã được thiết lập lại về 0.';

  if (returnToWaitingRoom) {
    r.phaseRef.current = 'waiting_room';
    s.setPhase('waiting_room');
    s.broadcastGameState({ phase: 'waiting_room', round: 1, players: cleanPlayers });
  } else {
    startNewTurn(0, 1, cleanPlayers);
  }

  const sysMsg: ChatMessage = {
    id: `play_again_${Date.now()}`,
    text: finishText,
    type: 'system',
    timestamp: Date.now(),
  };
  s.setMessages((m) => appendBoundedMessage(m, sysMsg));
  r.roomServiceRef.current?.broadcastChat(sysMsg);
}
