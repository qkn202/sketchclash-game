import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Player, AvatarConfig, RoomConfig, GameState, DrawAction, ChatMessage, GamePhase } from './types';
import type { RealtimeRoomService } from './services/supabase';
import { soundManager } from './utils/audio';

import { Lobby } from './components/Lobby';
import { WaitingRoom } from './components/WaitingRoom';
import { GameHeaderBar } from './components/GameHeaderBar';
import { InGameStage, type MobileTab } from './components/InGameStage';
import { GameOverlays, NoticeToastBanner } from './components/GameOverlays';
import { useTurnController } from './hooks/useTurnController';
import { useGuessController } from './hooks/useGuessController';
import { useRoomConnection } from './hooks/useRoomConnection';
import { usePartyModesBridge } from './hooks/usePartyModesBridge';
import {
  DEFAULT_AVATAR,
  appendCompactDrawAction,
  getOrCreateTabUserId,
} from './hooks/gameControllerTypes';

export const App: React.FC = () => {
  const [mobileTab, setMobileTab] = useState<MobileTab>('canvas');
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 820 : false
  );

  const [opponentDrawActions, setOpponentDrawActions] = useState<Record<string, DrawAction[]>>({});
  const opponentDrawActionsRef = useRef<Record<string, DrawAction[]>>({});
  const [inspectingPlayerId, setInspectingPlayerId] = useState<string | null>(null);
  const [inspectFeedback, setInspectFeedback] = useState<string | null>(null);
  const [isCanvasMaximized, setIsCanvasMaximized] = useState<boolean>(false);
  const [myRushDrawActions, setMyRushDrawActions] = useState<DrawAction[]>([]);
  const myRushDrawActionsRef = useRef<DrawAction[]>([]);
  const [incomingDrawActions, setIncomingDrawActions] = useState<DrawAction[]>([]);
  const [canvasResetKey, setCanvasResetKey] = useState<number>(0);
  const [solvedWordsMap, setSolvedWordsMap] = useState<Record<string, string>>({});
  const [hasSubmittedRushWord, setHasSubmittedRushWord] = useState<boolean>(false);
  const [noticeToast, setNoticeToast] = useState<string | null>(null);

  useEffect(() => {
    if (!noticeToast) return;
    const t = setTimeout(() => setNoticeToast(null), 4000);
    return () => clearTimeout(t);
  }, [noticeToast]);

  const botTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnTokenRef = useRef<number>(0);
  const isEndingRound = useRef<boolean>(false);
  const rushPickedWordsRef = useRef<Map<string, string>>(new Map());
  const rushChoicesMapRef = useRef<Map<string, string[]>>(new Map());
  const pendingWordBackupsRef = useRef<Map<string, string>>(new Map());
  const drawnPlayerIdsInRoundRef = useRef<Set<string>>(new Set());
  const usedWordsInMatchRef = useRef<Set<string>>(new Set());

  const clearBotTimeouts = useCallback(() => {
    botTimeoutsRef.current.forEach((t) => clearTimeout(t));
    botTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 820);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('sketchclash_name') || 'Pháp Sư ' + Math.floor(10 + Math.random() * 90);
  });

  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    try {
      const saved = localStorage.getItem('sketchclash_avatar');
      return saved ? JSON.parse(saved) : DEFAULT_AVATAR;
    } catch {
      return DEFAULT_AVATAR;
    }
  });

  const [isMuted, setIsMuted] = useState(soundManager.isMuted());

  useEffect(() => {
    localStorage.setItem('sketchclash_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('sketchclash_avatar', JSON.stringify(avatar));
  }, [avatar]);

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomConfig, setRoomConfig] = useState<RoomConfig>({
    roomCode: '',
    roomName: '',
    mode: 'classic',
    drawTime: 60,
    totalRounds: 3,
    language: 'vi',
    customWords: [],
    customWordsCount: 0,
    maxPlayers: 20,
  });
  const roomConfigRef = useRef<RoomConfig>(roomConfig);
  useEffect(() => {
    roomConfigRef.current = roomConfig;
  }, [roomConfig]);

  const [phase, setPhase] = useState<GamePhase>('lobby');
  const phaseRef = useRef<GamePhase>('lobby');
  useEffect(() => {
    phaseRef.current = phase;
    if (phase !== 'drawing') setIsCanvasMaximized(false);
  }, [phase]);

  const [round, setRound] = useState<number>(1);
  const roundRef = useRef<number>(1);
  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  const [timeLeft, setTimeLeft] = useState<number>(60);
  const timeLeftRef = useRef<number>(60);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const [players, setPlayers] = useState<Player[]>([]);
  const playersRef = useRef<Player[]>(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const [currentDrawerIndex, setCurrentDrawerIndex] = useState<number>(0);
  const currentDrawerIndexRef = useRef<number>(0);
  const currentDrawerIdRef = useRef<string | null>(null);
  useEffect(() => {
    currentDrawerIndexRef.current = currentDrawerIndex;
  }, [currentDrawerIndex]);

  const [currentWord, setCurrentWord] = useState<string>('');
  const currentWordRef = useRef<string>('');
  useEffect(() => {
    currentWordRef.current = currentWord;
  }, [currentWord]);

  const [revealedWord, setRevealedWord] = useState<string>('');
  const revealedWordRef = useRef<string>('');
  useEffect(() => {
    revealedWordRef.current = revealedWord;
  }, [revealedWord]);

  const [maskedWord, setMaskedWord] = useState<string>('');
  const maskedWordRef = useRef<string>('');
  useEffect(() => {
    maskedWordRef.current = maskedWord;
  }, [maskedWord]);

  const [, setRevealedIndices] = useState<number[]>([]);
  const revealedIndicesRef = useRef<number[]>([]);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const wordChoicesRef = useRef<string[]>([]);
  useEffect(() => {
    wordChoicesRef.current = wordChoices;
  }, [wordChoices]);

  const [roundEndMessage, setRoundEndMessage] = useState<string | null>(null);
  const roundEndMessageRef = useRef<string | null>(null);
  useEffect(() => {
    roundEndMessageRef.current = roundEndMessage;
  }, [roundEndMessage]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const roomServiceRef = useRef<RealtimeRoomService | null>(null);
  const currentUserId = useRef<string>(getOrCreateTabUserId());
  const hostIdRef = useRef<string | null>(null);

  const broadcastGameState = useCallback((state: Partial<GameState>) => {
    if (currentUserId.current !== hostIdRef.current) return;
    const publicState: Partial<GameState> = { ...state };
    delete publicState.currentWord;
    delete publicState.customWords;
    if (publicState.players) {
      publicState.players = publicState.players.map(({ secretWord: _sw, wordChoices: _wc, ...player }) => player);
    }
    roomServiceRef.current?.broadcastGameState(publicState);
  }, []);

  const sharedRefs = {
    currentUserId,
    hostIdRef,
    roomServiceRef,
    roomConfigRef,
    phaseRef,
    roundRef,
    timeLeftRef,
    playersRef,
    currentDrawerIndexRef,
    currentDrawerIdRef,
    currentWordRef,
    maskedWordRef,
    revealedIndicesRef,
    selectionTimeoutRef,
    botTimeoutsRef,
    turnTokenRef,
    isEndingRound,
    rushPickedWordsRef,
    rushChoicesMapRef,
    myRushDrawActionsRef,
    opponentDrawActionsRef,
    pendingWordBackupsRef,
    drawnPlayerIdsInRoundRef,
    usedWordsInMatchRef,
  };

  const sharedSetters = {
    setPhase,
    setRound,
    setTimeLeft,
    setPlayers,
    setCurrentDrawerIndex,
    setCurrentWord,
    setRevealedWord,
    setMaskedWord,
    setRevealedIndices,
    setWordChoices,
    setRoundEndMessage,
    setMessages,
    setIncomingDrawActions,
    setCanvasResetKey,
    setOpponentDrawActions,
    setMyRushDrawActions,
    setSolvedWordsMap,
    setInspectingPlayerId,
    setInspectFeedback,
    setHasSubmittedRushWord,
    setMobileTab,
    setNoticeToast,
    broadcastGameState,
    clearBotTimeouts,
  };

  const {
    startNewTurn,
    handleWordSelected,
    recordRushPlayerChoice,
    handleSkipDrawer,
    handleRoundEnd,
  } = useTurnController(sharedRefs, sharedSetters);

  const currentPlayer = players.find((p) => p.id === currentUserId.current) || {
    id: currentUserId.current,
    name: playerName,
    avatar,
    score: 0,
    isHost: currentUserId.current === hostIdRef.current,
    isDrawer: false,
    hasGuessed: false,
  };
  const isHost = currentPlayer.isHost;

  const handleBroadcastLocalDraw = useCallback((action: DrawAction) => {
    const tagged: DrawAction = { ...action, drawerId: currentUserId.current };
    setMyRushDrawActions((prev) => {
      const next = appendCompactDrawAction(prev, tagged);
      myRushDrawActionsRef.current = next;
      return next;
    });
    roomServiceRef.current?.broadcastDraw(tagged);
  }, []);

  const {
    partySync,
    displayRoomConfig,
    handlePlayAgainUnified,
    renderPartyStage,
    isImpostorSpoilerBlocked,
  } = usePartyModesBridge({
    refs: sharedRefs,
    setters: sharedSetters,
    phase,
    round,
    roomConfig,
    players,
    currentUserId: currentUserId.current,
    isHost,
    revealedWord,
    roundEndMessage,
    myRushDrawActions,
    incomingDrawActions,
    canvasResetKey,
    onBroadcastLocalDraw: handleBroadcastLocalDraw,
    startNewTurn,
  });

  const { handlePlayerGuess, handlePlayerGuessRef } = useGuessController(
    sharedRefs,
    sharedSetters,
    phase,
    roomConfig.drawTime,
    handleRoundEnd,
    isImpostorSpoilerBlocked
  );

  const {
    handleJoinRoom,
    handleBackToLobby,
    handleModeChange,
    handleRoomConfigChange,
    handleStartGame,
    handleAddBot,
    handleRemovePlayer,
  } = useRoomConnection({
    refs: sharedRefs,
    setters: sharedSetters,
    setRoomCode,
    setRoomConfig,
    playerName,
    avatar,
    wordChoicesRef,
    roundEndMessageRef,
    revealedWordRef,
    startNewTurn,
    handleWordSelected,
    recordRushPlayerChoice,
    handleSkipDrawer,
    handleRoundEnd,
    handlePlayAgain: handlePlayAgainUnified,
    handlePlayerGuessRef,
    partySync,
  });

  const currentDrawer =
    players.find((p) => p.id === currentDrawerIdRef.current) || players[currentDrawerIndex] || null;
  const isCurrentDrawer = currentPlayer.isDrawer;
  const coopPartner = players.find((p) => p.id !== currentUserId.current && p.isDrawer);

  const toggleSound = () => {
    setIsMuted(soundManager.toggleMute());
  };

  const handleToggleMaximize = useCallback((next: boolean) => {
    setIsCanvasMaximized(next);
    if (next) setMobileTab('canvas');
  }, []);

  const handleHeaderBack = () => {
    if (isHost) {
      handlePlayAgainUnified(true);
    } else {
      handleBackToLobby();
    }
  };

  const displayWordForOverlay =
    phase === 'round_end'
      ? revealedWord || currentWord
      : currentWord || currentPlayer.secretWord || '';

  const isSelectingWord =
    roomConfig.mode === 'rush_draw'
      ? !hasSubmittedRushWord
      : currentUserId.current === currentDrawerIdRef.current;

  const selectingDrawerName =
    roomConfig.mode === 'rush_draw'
      ? 'Mọi người'
      : roomConfig.mode === 'dual_coop' || roomConfig.mode === 'all_draw'
      ? players
          .filter((p) => p.isDrawer)
          .map((p) => p.name)
          .join(' & ') ||
        currentDrawer?.name ||
        'Pháp sư'
      : currentDrawer?.name || 'Pháp sư';

  return (
    <div
      className={`game-container ${
        phase !== 'lobby' && phase !== 'waiting_room'
          ? isMobile
            ? 'in-game-mobile'
            : 'in-game-desktop'
          : ''
      }`}
    >
      <NoticeToastBanner message={noticeToast} />
      {phase === 'lobby' || !roomCode ? (
        <Lobby
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
          avatar={avatar}
          onAvatarChange={setAvatar}
          isMuted={isMuted}
          onToggleSound={toggleSound}
          onJoinRoom={handleJoinRoom}
        />
      ) : phase === 'waiting_room' ? (
        <WaitingRoom
          roomConfig={roomConfig}
          players={players}
          currentPlayerId={currentUserId.current}
          isHost={isHost}
          onModeChange={handleModeChange}
          onRoomConfigChange={handleRoomConfigChange}
          onAddBot={handleAddBot}
          onRemovePlayer={handleRemovePlayer}
          onStartGame={handleStartGame}
          onLeaveRoom={handleBackToLobby}
        />
      ) : (
        <>
          <GameHeaderBar
            isMobile={isMobile}
            isCanvasMaximized={isCanvasMaximized}
            roomConfig={displayRoomConfig}
            phase={phase}
            round={round}
            timeLeft={timeLeft}
            isMuted={isMuted}
            isHost={isHost}
            isCurrentDrawer={isCurrentDrawer}
            currentWord={currentWord}
            maskedWord={maskedWord}
            roundEndMessage={roundEndMessage}
            currentPlayer={currentPlayer}
            players={players}
            currentUserId={currentUserId.current}
            onBackAction={handleHeaderBack}
            onToggleMaximize={handleToggleMaximize}
            onSwitchToOpponentsTab={() => setMobileTab('opponents')}
            onToggleSound={toggleSound}
          />

          <InGameStage
            isMobile={isMobile}
            mobileTab={mobileTab}
            onMobileTabChange={setMobileTab}
            isCanvasMaximized={isCanvasMaximized}
            onToggleMaximize={handleToggleMaximize}
            roomConfig={displayRoomConfig}
            phase={phase}
            round={round}
            players={players}
            currentPlayer={currentPlayer}
            currentDrawer={currentDrawer}
            coopPartner={coopPartner}
            currentUserId={currentUserId.current}
            isHost={isHost}
            isCurrentDrawer={isCurrentDrawer}
            isSelectingWord={isSelectingWord}
            selectingDrawerName={selectingDrawerName}
            wordChoices={wordChoices}
            timeLeft={timeLeft}
            onSelectWord={(word) => handleWordSelected(word)}
            displayWordForOverlay={displayWordForOverlay}
            roundEndMessage={roundEndMessage}
            messages={messages}
            incomingDrawActions={incomingDrawActions}
            canvasResetKey={canvasResetKey}
            myRushDrawActions={myRushDrawActions}
            opponentDrawActions={opponentDrawActions}
            solvedWordsMap={solvedWordsMap}
            onBroadcastLocalDraw={handleBroadcastLocalDraw}
            renderPartyStage={renderPartyStage}
            onSendGuessOrChat={(text) => handlePlayerGuess(currentPlayer, text)}
            onAddBot={handleAddBot}
            onRemovePlayer={handleRemovePlayer}
            onInspectOpponent={(id) => {
              setInspectFeedback(null);
              setInspectingPlayerId(id);
            }}
          />

          <GameOverlays
            phase={phase}
            roomConfig={roomConfig}
            players={players}
            currentPlayer={currentPlayer}
            currentDrawer={currentDrawer}
            currentUserId={currentUserId.current}
            currentDrawerId={currentDrawerIdRef.current}
            isHost={isHost}
            timeLeft={timeLeft}
            currentWord={currentWord}
            wordChoices={wordChoices}
            hasSubmittedRushWord={hasSubmittedRushWord}
            canvasResetKey={canvasResetKey}
            inspectingPlayerId={inspectingPlayerId}
            inspectFeedback={inspectFeedback}
            opponentDrawActions={opponentDrawActions}
            solvedWordsMap={solvedWordsMap}
            onSelectWord={(word) => handleWordSelected(word)}
            onClearInspectFeedback={() => setInspectFeedback(null)}
            onCloseInspect={() => {
              setInspectingPlayerId(null);
              setInspectFeedback(null);
            }}
            onInspectGuess={(oppId, text) => handlePlayerGuess(currentPlayer, text, oppId)}
            onPlayAgain={handlePlayAgainUnified}
            onBackToLobby={handleBackToLobby}
          />
        </>
      )}
    </div>
  );
};
