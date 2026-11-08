import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';
import type {
  Player,
  AvatarConfig,
  RoomConfig,
  ChatMessage,
  GameMode,
  RelayPublicState,
  ImpostorPublicState,
  PartyNetworkEvent,
  PartyPrivatePayload,
} from '../types';
import { RealtimeRoomService } from '../services/supabase';
import { createBotPlayer } from '../services/botEngine';
import { soundManager } from '../utils/audio';
import {
  appendBoundedMessage,
  generateRoomToken,
  type SharedGameRefs,
  type SharedGameSetters,
} from './gameControllerTypes';
import {
  applyIncomingGameStateSync,
  spawnBotIntoRoom,
  syncCanvasHistoryToJoiner,
} from './roomSyncHelpers';
import {
  applyIncomingCanvasSync,
  applyIncomingDrawActionToState,
  reconcileOnlinePresenceUpdate,
  removePlayerFromRoom,
} from './networkAndRoomHelpers';

export interface PartySyncBridge {
  relayStateRef: React.MutableRefObject<RelayPublicState | null>;
  impostorStateRef: React.MutableRefObject<ImpostorPublicState | null>;
  startRelayMatch: (customPlayers?: Player[]) => void;
  startImpostorRound: (roundNum?: number, customPlayers?: Player[]) => void;
  resetPartyStates: () => void;
  onPartyEvent: (event: PartyNetworkEvent, senderId: string) => void;
  onPartyPrivate: (data: PartyPrivatePayload) => void;
  applySyncedRelayState: (state: RelayPublicState) => void;
  applySyncedImpostorState: (state: ImpostorPublicState) => void;
  resendPartyPrivateToJoiner: (requesterId: string) => void;
  onPartyPlayerRemoved: (removedId: string) => void;
  onPartyHostPromoted: () => void;
}

export interface RoomConnectionParams {
  refs: SharedGameRefs;
  setters: SharedGameSetters;
  setRoomCode: React.Dispatch<React.SetStateAction<string | null>>;
  setRoomConfig: React.Dispatch<React.SetStateAction<RoomConfig>>;
  playerName: string;
  avatar: AvatarConfig;
  wordChoicesRef: React.MutableRefObject<string[]>;
  roundEndMessageRef: React.MutableRefObject<string | null>;
  revealedWordRef: React.MutableRefObject<string>;
  startNewTurn: (turnIdx: number, newRound?: number, customPlayers?: Player[]) => void;
  handleWordSelected: (chosenWord: string, actorId?: string) => void;
  recordRushPlayerChoice: (playerId: string, chosenWord: string) => void;
  handleSkipDrawer: () => void;
  handleRoundEnd: () => void;
  handlePlayAgain: (returnToWaitingRoom?: boolean) => void;
  handlePlayerGuessRef: React.MutableRefObject<(sender: Player, text: string, targetOpponentId?: string) => void>;
  partySync: PartySyncBridge;
}

export function useRoomConnection(params: RoomConnectionParams) {
  const ctxRef = useRef(params);
  ctxRef.current = params;

  const handleBackToLobby = useCallback(() => {
    const { refs: r, setters: s, setRoomCode } = ctxRef.current;
    if (r.selectionTimeoutRef.current) {
      clearTimeout(r.selectionTimeoutRef.current);
      r.selectionTimeoutRef.current = null;
    }
    s.clearBotTimeouts();
    r.turnTokenRef.current += 1;
    r.isEndingRound.current = false;
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
    r.drawnPlayerIdsInRoundRef.current.clear();
    r.usedWordsInMatchRef.current.clear();
    ctxRef.current.partySync.resetPartyStates();
    r.roomServiceRef.current?.disconnect();
    r.roomServiceRef.current = null;
    setRoomCode(null);
    r.phaseRef.current = 'lobby';
    s.setPhase('lobby');
    s.setMessages([]);
    r.playersRef.current = [];
    s.setPlayers([]);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    return () => {
      const { refs: r, setters: s } = ctxRef.current;
      if (r.selectionTimeoutRef.current) clearTimeout(r.selectionTimeoutRef.current);
      s.clearBotTimeouts();
      r.roomServiceRef.current?.disconnect();
    };
  }, []);

  const handleJoinRoom = useCallback(
    (
      code: string,
      configOverrides?: Partial<RoomConfig>,
      addBots: boolean = false,
      isCreating: boolean = true
    ) => {
      const {
        refs: r,
        setters: s,
        setRoomCode,
        setRoomConfig,
        playerName,
        avatar,
        wordChoicesRef,
        roundEndMessageRef,
        revealedWordRef,
      } = ctxRef.current;

      r.roomServiceRef.current?.disconnect();
      const cleanCode = code.trim().toUpperCase();
      setRoomCode(cleanCode);

      // Room-token gate (finding #3). The creator mints a fresh per-room secret;
      // a joiner arrives with it already in the invite link (?t=), read straight
      // from the URL. A typed-code join without a token stays a legacy open room.
      const tokenFromUrl = !isCreating
        ? (typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('t')?.trim()
            : undefined)
        : undefined;
      const roomToken = isCreating ? generateRoomToken() : tokenFromUrl || undefined;

      if (typeof window !== 'undefined') {
        const t = roomToken ? `&t=${encodeURIComponent(roomToken)}` : '';
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}?room=${encodeURIComponent(cleanCode)}${t}`
        );
      }

      const customList = configOverrides?.customWords || [];
      const selectedMode = configOverrides?.mode || 'classic';
      const defaultDrawTime = selectedMode === 'rush_draw' ? 90 : 60;
      const newConfig: RoomConfig = {
        roomCode: cleanCode,
        roomName: `Phòng ${cleanCode}`,
        mode: selectedMode,
        drawTime: configOverrides?.drawTime || defaultDrawTime,
        totalRounds: configOverrides?.totalRounds || 3,
        language: configOverrides?.language || 'vi',
        customWords: customList,
        customWordsCount: customList.length,
        maxPlayers: configOverrides?.maxPlayers || 20,
        roomToken,
      };
      r.roomConfigRef.current = newConfig;
      setRoomConfig(newConfig);

      const initialSelf: Player = {
        id: r.currentUserId.current,
        name: playerName.trim() || 'Pháp Sư',
        avatar,
        score: 0,
        isHost: isCreating,
        isDrawer: false,
        hasGuessed: false,
        joinedAt: isCreating ? 0 : Date.now(),
      };
      r.hostIdRef.current = isCreating ? initialSelf.id : null;
      r.pendingWordBackupsRef.current.clear();
      r.drawnPlayerIdsInRoundRef.current.clear();
      r.usedWordsInMatchRef.current.clear();

      const initialPlayers = [initialSelf];
      if (addBots) {
        const botTarget = newConfig.mode === 'polyjuice_impostor' ? 3 : 2;
        for (let i = 0; i < botTarget; i++) {
          initialPlayers.push(createBotPlayer(initialPlayers));
        }
      }

      r.playersRef.current = initialPlayers;
      s.setPlayers(initialPlayers);
      s.setMessages([]);

      const service = new RealtimeRoomService(
        cleanCode,
        initialSelf,
        {
          onDrawAction: (action) => applyIncomingDrawActionToState(action, r, s),
          onChatMessage: (msg) => {
            if (!msg || typeof msg.text !== 'string') return;
            s.setMessages((prev) =>
              appendBoundedMessage(prev, { ...msg, text: msg.text.slice(0, 300) })
            );
          },
          onPrivateChat: (targetId, msg, senderId) => {
            if (targetId !== r.currentUserId.current || senderId !== r.hostIdRef.current) return;
            if (msg.type === 'close') {
              soundManager.playClose();
              s.setInspectFeedback(msg.text);
            }
            s.setMessages((prev) => appendBoundedMessage(prev, msg));
          },
          onCanvasSync: (targetId, boardActions, opponentActions, senderId) =>
            applyIncomingCanvasSync(targetId, boardActions, opponentActions, senderId, r, s),
          onDrawerWordBackup: (targetHostId, word, senderId) => {
            if (targetHostId !== r.currentUserId.current || !word) return;
            const clean = String(word).trim().slice(0, 80);
            if (!clean) return;
            r.pendingWordBackupsRef.current.set(senderId, clean);
            if (r.currentUserId.current !== r.hostIdRef.current) return;

            if (r.roomConfigRef.current.mode === 'rush_draw') {
              if (r.phaseRef.current === 'selecting_word') {
                r.rushPickedWordsRef.current.set(senderId, clean);
              } else {
                const updated = r.playersRef.current.map((p) =>
                  p.id === senderId ? { ...p, secretWord: clean } : p
                );
                r.playersRef.current = updated;
                s.setPlayers(updated);
              }
            } else {
              const sender = r.playersRef.current.find((p) => p.id === senderId);
              if (sender?.isDrawer && !r.currentWordRef.current) {
                r.currentWordRef.current = clean;
              }
            }
          },
          onGameStateSync: (syncState, senderId) =>
            applyIncomingGameStateSync(syncState, senderId, r, s, setRoomConfig, ctxRef.current.partySync),
          onPartyEvent: (evt, senderId) => ctxRef.current.partySync.onPartyEvent(evt, senderId),
          onPartyPrivate: (targetId, data, senderId) => {
            if (targetId !== r.currentUserId.current || senderId !== r.hostIdRef.current) return;
            ctxRef.current.partySync.onPartyPrivate(data);
          },
          onPlayersUpdate: (onlinePlayers) =>
            reconcileOnlinePresenceUpdate(onlinePlayers, r, s, {
              startNewTurn: ctxRef.current.startNewTurn,
              handleSkipDrawer: ctxRef.current.handleSkipDrawer,
              handleRoundEnd: ctxRef.current.handleRoundEnd,
              onPartyHostPromoted: () => ctxRef.current.partySync.onPartyHostPromoted(),
              onPartyPlayerRemoved: (id) => ctxRef.current.partySync.onPartyPlayerRemoved(id),
            }),
          onWordSelectionRequest: (playerId, word) => {
            if (r.currentUserId.current !== r.hostIdRef.current) return;
            const cleanWord = String(word || '').trim().slice(0, 80);
            if (!cleanWord) return;
            if (r.roomConfigRef.current.mode === 'rush_draw') {
              const allowed = r.rushChoicesMapRef.current.get(playerId);
              if (allowed && allowed.length > 0 && !allowed.includes(cleanWord)) return;
              ctxRef.current.recordRushPlayerChoice(playerId, cleanWord);
            } else {
              const allowed = wordChoicesRef.current;
              if (allowed.length > 0 && !allowed.includes(cleanWord)) return;
              ctxRef.current.handleWordSelected(cleanWord, playerId);
            }
          },
          onPrivateWord: (targetId, word, senderId) => {
            if (targetId !== r.currentUserId.current || senderId !== r.hostIdRef.current) return;
            const updated = r.playersRef.current.map((p) => (p.id === targetId ? { ...p, secretWord: word } : p));
            r.playersRef.current = updated;
            s.setPlayers(updated);
            r.currentWordRef.current = word;
            s.setCurrentWord(word);
          },
          onPrivateChoices: (targetId, choices, senderId) => {
            if (targetId !== r.currentUserId.current || senderId !== r.hostIdRef.current) return;
            s.setWordChoices(choices);
          },
          onSolvedWord: (targetId, opponentId, word, senderId) => {
            if (targetId !== r.currentUserId.current || senderId !== r.hostIdRef.current) return;
            s.setSolvedWordsMap((prev) => ({ ...prev, [opponentId]: word }));
          },
          onGuessRequest: (playerId, text, targetOpponentId) => {
            if (r.currentUserId.current !== r.hostIdRef.current) return;
            const sender = r.playersRef.current.find((p) => p.id === playerId);
            if (sender) ctxRef.current.handlePlayerGuessRef.current(sender, text, targetOpponentId);
          },
          onRequestGameState: (requesterId) => {
            if (r.currentUserId.current !== r.hostIdRef.current) return;
            const cfg = r.roomConfigRef.current;
            s.broadcastGameState({
              phase: r.phaseRef.current,
              round: r.roundRef.current,
              drawTime: cfg.drawTime,
              totalRounds: cfg.totalRounds,
              language: cfg.language,
              maxPlayers: cfg.maxPlayers,
              customWordsCount: cfg.customWords.length,
              timeLeft: r.timeLeftRef.current,
              mode: cfg.mode,
              currentDrawerId: r.currentDrawerIdRef.current,
              wordChoices: cfg.mode === 'rush_draw' ? undefined : wordChoicesRef.current,
              maskedWord: r.maskedWordRef.current,
              revealedIndices: r.revealedIndicesRef.current,
              roundEndMessage: roundEndMessageRef.current,
              revealedWord: revealedWordRef.current,
              players: r.playersRef.current,
              relayState: ctxRef.current.partySync.relayStateRef.current || undefined,
              impostorState: ctxRef.current.partySync.impostorStateRef.current || undefined,
            });
            ctxRef.current.partySync.resendPartyPrivateToJoiner(requesterId);
            const requester = r.playersRef.current.find((p) => p.id === requesterId);
            if (cfg.mode === 'rush_draw' && r.phaseRef.current === 'selecting_word') {
              const pChoices = r.rushChoicesMapRef.current.get(requesterId);
              if (pChoices) r.roomServiceRef.current?.sendPrivateChoices(requesterId, pChoices);
            }
            const privateWord = requester?.secretWord || (requester?.isDrawer ? r.currentWordRef.current : '');
            if (privateWord) {
              r.roomServiceRef.current?.sendPrivateWord(requesterId, privateWord);
            }
            syncCanvasHistoryToJoiner(r, requesterId);
          },
          onRoomFull: () => {
            s.setNoticeToast(`Phòng đã đủ tối đa ${r.roomConfigRef.current.maxPlayers} phù thủy.`);
            window.setTimeout(() => handleBackToLobby(), 0);
          },
          onPlayerKicked: (senderId) => {
            if (r.hostIdRef.current && senderId !== r.hostIdRef.current) return;
            s.setNoticeToast('Chủ phòng đã mời bạn rời khỏi sảnh đấu.');
            window.setTimeout(() => handleBackToLobby(), 0);
          },
        },
        newConfig.maxPlayers,
        newConfig.roomToken
      );

      service.connect();
      r.roomServiceRef.current = service;

      if (addBots) {
        ctxRef.current.partySync.resetPartyStates();
        if (newConfig.mode === 'relay_phone') {
          ctxRef.current.partySync.startRelayMatch(initialPlayers);
        } else if (newConfig.mode === 'polyjuice_impostor') {
          ctxRef.current.partySync.startImpostorRound(1, initialPlayers);
        } else {
          ctxRef.current.startNewTurn(0, 1, initialPlayers);
        }
      } else {
        r.phaseRef.current = 'waiting_room';
        s.setPhase('waiting_room');
      }
    },
    [handleBackToLobby]
  );

  const handleModeChange = useCallback((newMode: GameMode) => {
    const { refs: r, setters: s, setRoomConfig } = ctxRef.current;
    const prev = r.roomConfigRef.current;
    let nextDrawTime = prev.drawTime;
    if (newMode === 'rush_draw' && prev.mode !== 'rush_draw' && prev.drawTime === 60) {
      nextDrawTime = 90;
    } else if (newMode !== 'rush_draw' && prev.mode === 'rush_draw' && prev.drawTime === 90) {
      nextDrawTime = 60;
    }
    const updated: RoomConfig = { ...prev, mode: newMode, drawTime: nextDrawTime };
    r.roomConfigRef.current = updated;
    setRoomConfig(updated);
    s.broadcastGameState({ mode: newMode, drawTime: nextDrawTime });
  }, []);

  const handleRoomConfigChange = useCallback((partial: Partial<RoomConfig>) => {
    const { refs: r, setters: s, setRoomConfig } = ctxRef.current;
    if (r.currentUserId.current !== r.hostIdRef.current) return;
    const prev = r.roomConfigRef.current;
    const minCap = Math.max(2, r.playersRef.current.length);
    const nextMaxPlayers =
      partial.maxPlayers !== undefined
        ? Math.max(minCap, Math.min(20, partial.maxPlayers))
        : prev.maxPlayers;
    const nextCustomWords = partial.customWords !== undefined ? partial.customWords : prev.customWords;
    const updated: RoomConfig = {
      ...prev,
      ...partial,
      maxPlayers: nextMaxPlayers,
      customWords: nextCustomWords,
      customWordsCount: nextCustomWords.length,
    };
    r.roomConfigRef.current = updated;
    r.roomServiceRef.current?.setMaxPlayers(updated.maxPlayers);
    setRoomConfig(updated);
    s.broadcastGameState({
      mode: updated.mode,
      drawTime: updated.drawTime,
      totalRounds: updated.totalRounds,
      language: updated.language,
      maxPlayers: updated.maxPlayers,
      customWordsCount: updated.customWords.length,
    });
  }, []);

  const handleStartGame = useCallback(() => {
    const { refs: r, setters: s, setRoomConfig, startNewTurn, partySync } = ctxRef.current;
    soundManager.playSpellVfx();
    const cfg = r.roomConfigRef.current;
    let currentPlayers = r.playersRef.current;

    const minPlayersRequired =
      cfg.mode === 'polyjuice_impostor'
        ? 4
        : cfg.mode === 'dual_coop' ||
          cfg.mode === 'all_draw' ||
          cfg.mode === 'rush_draw' ||
          cfg.mode === 'relay_phone'
        ? 3
        : 2;

    if (currentPlayers.length < minPlayersRequired) {
      const needed = minPlayersRequired - currentPlayers.length;
      const newBots: Player[] = [];
      for (let i = 0; i < needed; i++) {
        newBots.push(createBotPlayer([...currentPlayers, ...newBots]));
      }
      currentPlayers = [...currentPlayers, ...newBots];
      r.playersRef.current = currentPlayers;
      s.setPlayers(currentPlayers);
      if (cfg.maxPlayers < currentPlayers.length) {
        const nextCfg = { ...cfg, maxPlayers: currentPlayers.length };
        r.roomConfigRef.current = nextCfg;
        r.roomServiceRef.current?.setMaxPlayers(nextCfg.maxPlayers);
        setRoomConfig(nextCfg);
      }

      newBots.forEach((bot) => {
        const botJoinedMsg: ChatMessage = {
          id: `bot_join_${Date.now()}_${bot.id}`,
          text: `🤖 ${bot.name} đã được triệu hồi để cùng so tài phép thuật!`,
          type: 'system',
          timestamp: Date.now(),
        };
        s.setMessages((m) => appendBoundedMessage(m, botJoinedMsg));
        r.roomServiceRef.current?.broadcastChat(botJoinedMsg);
      });
    }

    partySync.resetPartyStates();
    if (cfg.mode === 'relay_phone') {
      partySync.startRelayMatch(currentPlayers);
    } else if (cfg.mode === 'polyjuice_impostor') {
      partySync.startImpostorRound(1, currentPlayers);
    } else {
      startNewTurn(0, 1, currentPlayers);
    }
  }, []);

  const handleAddBot = useCallback(() => {
    const { refs: r, setters: s } = ctxRef.current;
    spawnBotIntoRoom(r, s);
  }, []);

  const handleRemovePlayer = useCallback((targetId: string) => {
    const { refs: r, setters: s, handleSkipDrawer, handleRoundEnd, handlePlayAgain, partySync } = ctxRef.current;
    removePlayerFromRoom(targetId, r, s, {
      handleSkipDrawer,
      handleRoundEnd,
      handlePlayAgain: (toWaitingRoom) => handlePlayAgain(toWaitingRoom),
      onPartyPlayerRemoved: (id) => partySync.onPartyPlayerRemoved(id),
    });
  }, []);

  return {
    handleJoinRoom,
    handleBackToLobby,
    handleModeChange,
    handleRoomConfigChange,
    handleStartGame,
    handleAddBot,
    handleRemovePlayer,
  };
}
