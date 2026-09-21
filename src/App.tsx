import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Player, AvatarConfig, RoomConfig, GameState, DrawAction, ChatMessage, GamePhase, GameMode } from './types';
import { getRandomWordChoices, createMaskedWord, isWordMatch, levenshteinDistance } from './data/words';
import { RealtimeRoomService } from './services/supabase';
import { createBotPlayer, generateProceduralDrawing, getBotGuess } from './services/botEngine';
import { soundManager } from './utils/audio';

import { Lobby } from './components/Lobby';
import { WaitingRoom } from './components/WaitingRoom';
import { CanvasBoard } from './components/CanvasBoard';
import { ScoreBoard } from './components/ScoreBoard';
import { ChatPanel } from './components/ChatPanel';
import { WordPickerModal } from './components/WordPickerModal';
import { VictoryPodium } from './components/VictoryPodium';
import { Volume2, VolumeX, Clock, ArrowLeft, Palette, MessageSquare, Trophy, Send, Users } from 'lucide-react';

const DEFAULT_AVATAR: AvatarConfig = {
  color: '#FFD166',
  eyes: 'happy',
  mouth: 'smile',
  accessory: 'sunglasses',
};

export const App: React.FC = () => {
  // Mobile responsive view tabs
  const [mobileTab, setMobileTab] = useState<'canvas' | 'chat' | 'scores'>('canvas');
  const [mobileGuessInput, setMobileGuessInput] = useState('');
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 820 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 820);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // User Profile
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

  // Save profile changes
  useEffect(() => {
    localStorage.setItem('sketchclash_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('sketchclash_avatar', JSON.stringify(avatar));
  }, [avatar]);

  // Game & Room State
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomConfig, setRoomConfig] = useState<RoomConfig>({
    roomCode: '',
    roomName: '',
    mode: 'classic',
    drawTime: 60,
    totalRounds: 3,
    language: 'vi',
    customWords: [],
    maxPlayers: 8,
  });

  const [phase, setPhase] = useState<GamePhase>('lobby');
  const phaseRef = useRef<GamePhase>('lobby');
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const [round, setRound] = useState<number>(1);
  const roundRef = useRef<number>(1);
  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentDrawerIndex, setCurrentDrawerIndex] = useState<number>(0);
  const currentDrawerIndexRef = useRef<number>(0);
  useEffect(() => {
    currentDrawerIndexRef.current = currentDrawerIndex;
  }, [currentDrawerIndex]);

  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentWord, setCurrentWord] = useState<string>('');
  const [maskedWord, setMaskedWord] = useState<string>('');
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [roundEndMessage, setRoundEndMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [incomingDrawAction, setIncomingDrawAction] = useState<DrawAction | null>(null);

  // Networking Service
  const roomServiceRef = useRef<RealtimeRoomService | null>(null);
  const currentUserId = useRef<string>(`user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const isEndingRound = useRef<boolean>(false);
  const currentWordRef = useRef<string>(currentWord);
  useEffect(() => {
    currentWordRef.current = currentWord;
  }, [currentWord]);
  const playersRef = useRef<Player[]>(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const currentPlayer = players.find((p) => p.id === currentUserId.current) || {
    id: currentUserId.current,
    name: playerName,
    avatar,
    score: 0,
    isHost: true,
    isDrawer: false,
    hasGuessed: false,
  };

  const currentDrawer = players[currentDrawerIndex] || null;
  const isHost = currentPlayer.isHost;
  const isMeDrawer = currentPlayer.isDrawer;
  const isCurrentDrawer = currentPlayer.isDrawer;
  const coopPartner = players.find((p) => p.id !== currentUserId.current && p.isDrawer);

  // Sound Mute Toggle
  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // 1. Initialize & Start Turn
  const startNewTurn = useCallback((turnIdx: number, newRound?: number, customPlayers?: Player[]) => {
    const currentMode = roomConfig.mode || 'classic';

    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = null;
    }

    setPlayers((prev) => {
      const sourcePlayers = customPlayers && customPlayers.length > 0 ? customPlayers : prev;
      if (sourcePlayers.length === 0) return sourcePlayers;
      if (currentMode === 'all_draw') {
        const guesserIdx = (turnIdx + 1) % sourcePlayers.length;
        return sourcePlayers.map((p, idx) => ({
          ...p,
          isDrawer: idx !== guesserIdx,
          hasGuessed: false,
          isLoneGuesser: idx === guesserIdx,
        }));
      } else if (currentMode === 'dual_coop') {
        const d1 = turnIdx % sourcePlayers.length;
        const d2 = (turnIdx + 1) % sourcePlayers.length;
        return sourcePlayers.map((p, idx) => ({
          ...p,
          isDrawer: idx === d1 || idx === d2,
          hasGuessed: false,
          isLoneGuesser: false,
        }));
      } else {
        const d = turnIdx % sourcePlayers.length;
        return sourcePlayers.map((p, idx) => ({
          ...p,
          isDrawer: idx === d,
          hasGuessed: false,
          isLoneGuesser: false,
        }));
      }
    });

    setCurrentDrawerIndex(turnIdx);
    currentDrawerIndexRef.current = turnIdx;
    if (newRound) {
      setRound(newRound);
      roundRef.current = newRound;
    }

    const choices = getRandomWordChoices(roomConfig.language, roomConfig.customWords);
    setWordChoices(choices);
    setCurrentWord('');
    currentWordRef.current = '';
    setMaskedWord('');
    setRevealedIndices([]);
    setRoundEndMessage(null);
    setTimeLeft(15);
    setPhase('selecting_word');
    phaseRef.current = 'selecting_word';
    window.scrollTo({ top: 0, behavior: 'instant' });

    const activePlayers = customPlayers && customPlayers.length > 0 ? customPlayers : playersRef.current;

    // Broadcast state to other players
    roomServiceRef.current?.broadcastGameState({
      phase: 'selecting_word',
      currentDrawerId: activePlayers[turnIdx % activePlayers.length]?.id,
      round: newRound || roundRef.current,
      wordChoices: choices,
      timeLeft: 15,
      mode: currentMode,
      players: activePlayers,
    });

    // Check if current turn is played by a bot drawer
    let isBotTurn = false;
    if (currentMode === 'classic') {
      const activeDrawer = activePlayers[turnIdx % activePlayers.length];
      isBotTurn = !!activeDrawer?.isBot;
    } else if (currentMode === 'dual_coop') {
      const d1 = turnIdx % activePlayers.length;
      const d2 = (turnIdx + 1) % activePlayers.length;
      isBotTurn = !!(activePlayers[d1]?.isBot && activePlayers[d2]?.isBot);
    }

    if (isBotTurn) {
      // Bot chooses word quickly after 1.5s
      selectionTimeoutRef.current = setTimeout(() => {
        handleWordSelected(choices[Math.floor(Math.random() * choices.length)]);
      }, 1500);
    } else {
      // Human drawer: set watchdog timer (16s) to auto-skip if they don't choose in time!
      selectionTimeoutRef.current = setTimeout(() => {
        if (phaseRef.current === 'selecting_word') {
          handleSkipDrawerRef.current();
        }
      }, 16000);
    }
  }, [roomConfig]);

  // 2. Drawer chooses a word
  const handleWordSelected = (chosenWord: string) => {
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = null;
    }

    setCurrentWord(chosenWord);
    currentWordRef.current = chosenWord;
    const initialMask = createMaskedWord(chosenWord, []);
    setMaskedWord(initialMask);
    setRevealedIndices([]);
    setTimeLeft(roomConfig.drawTime);
    setPhase('drawing');
    phaseRef.current = 'drawing';

    // Clear board for new drawing
    setIncomingDrawAction({ type: 'clear' });
    roomServiceRef.current?.broadcastDraw({ type: 'clear' });

    // Mode-specific announcement in chat
    let introText = `🪄 ${currentDrawer?.name || 'Pháp sư'} đã chọn bùa vẽ và bắt đầu múa đũa phép!`;
    if (roomConfig.mode === 'dual_coop') {
      const coDrawers = players.filter((p) => p.isDrawer).map((p) => p.name).join(' & ');
      introText = `🤝 ${coDrawers || 'Hai pháp sư'} đang Song Kiếm Hợp Bích cùng múa đũa vẽ!`;
    } else if (roomConfig.mode === 'all_draw') {
      const loneGuesser = players.find((p) => p.isLoneGuesser);
      introText = `🎭 Tất cả phù thủy đang cùng múa đũa vẽ cho ${loneGuesser?.name || 'Thám Tử'} đoán!`;
    }

    const sysMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      text: introText,
      type: 'system',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, sysMsg]);
    roomServiceRef.current?.broadcastChat(sysMsg);

    roomServiceRef.current?.broadcastGameState({
      phase: 'drawing',
      currentWord: chosenWord,
      maskedWord: initialMask,
      timeLeft: roomConfig.drawTime,
      mode: roomConfig.mode,
      players: playersRef.current,
    });

    // Bot drawing simulation
    if (roomConfig.mode === 'all_draw') {
      const botDrawers = players.filter((p) => p.isBot && p.isDrawer);
      if (botDrawers.length > 0) {
        const botStrokes = generateProceduralDrawing(chosenWord);
        botStrokes.forEach((action, idx) => {
          setTimeout(() => {
            setIncomingDrawAction(action);
            roomServiceRef.current?.broadcastDraw(action);
          }, (idx + 1) * 700);
        });
      }
    } else if (roomConfig.mode === 'dual_coop') {
      const botDrawers = players.filter((p) => p.isBot && p.isDrawer);
      if (botDrawers.length > 0) {
        const humanIsDrawer = currentPlayer.isDrawer;
        const startDelay = humanIsDrawer ? 2500 : 500;
        const botStrokes = generateProceduralDrawing(chosenWord);
        botStrokes.forEach((action, idx) => {
          setTimeout(() => {
            setIncomingDrawAction(action);
            roomServiceRef.current?.broadcastDraw(action);
          }, startDelay + (idx + 1) * 700);
        });
      }
    } else {
      if (currentDrawer?.isBot) {
        const botStrokes = generateProceduralDrawing(chosenWord);
        botStrokes.forEach((action, idx) => {
          setTimeout(() => {
            setIncomingDrawAction(action);
            roomServiceRef.current?.broadcastDraw(action);
          }, (idx + 1) * 600);
        });
      }
    }
  };

  // 2b. Auto-skip drawer when they fail to choose a word in time
  const handleSkipDrawer = useCallback(() => {
    if (phaseRef.current !== 'selecting_word') return;

    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = null;
    }

    const currentPlayers = playersRef.current;
    if (currentPlayers.length === 0) return;

    const drawerIdx = currentDrawerIndexRef.current;
    const drawer = currentPlayers[drawerIdx % currentPlayers.length];
    const drawerName = drawer?.name || 'Pháp sư';

    soundManager.playTick();

    const skipMsg: ChatMessage = {
      id: `skip_${Date.now()}`,
      text: `⏰ Phù thủy ${drawerName} đã không chọn từ vẽ kịp thời gian (15s)! Tự động bỏ qua lượt và chuyển sang người tiếp theo.`,
      type: 'system',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, skipMsg]);
    roomServiceRef.current?.broadcastChat(skipMsg);

    const nextDrawerIdx = (drawerIdx + 1) % currentPlayers.length;
    const nextRound = nextDrawerIdx === 0 ? roundRef.current + 1 : roundRef.current;

    if (nextRound > roomConfig.totalRounds) {
      // Game Over! Show victory podium & score summary
      setPhase('game_over');
      phaseRef.current = 'game_over';
      roomServiceRef.current?.broadcastGameState({
        phase: 'game_over',
        players: currentPlayers,
      });
    } else {
      startNewTurn(nextDrawerIdx, nextRound, currentPlayers);
    }
  }, [roomConfig.totalRounds, startNewTurn]);

  const handleSkipDrawerRef = useRef(handleSkipDrawer);
  useEffect(() => {
    handleSkipDrawerRef.current = handleSkipDrawer;
  }, [handleSkipDrawer]);

  // 3. End of Round Transition
  const handleRoundEnd = useCallback(() => {
    if (isEndingRound.current) return;
    isEndingRound.current = true;
    setPhase('round_end');
    phaseRef.current = 'round_end';
    setRoundEndMessage(`Từ khóa vừa rồi là: "${currentWordRef.current}"`);
    soundManager.playVictory();

    // Check if next drawer or next round
    setTimeout(() => {
      const currentPlayers = playersRef.current;
      if (currentPlayers.length === 0) return;

      const nextDrawerIdx = (currentDrawerIndexRef.current + 1) % currentPlayers.length;
      const nextRound = nextDrawerIdx === 0 ? roundRef.current + 1 : roundRef.current;

      if (nextRound > roomConfig.totalRounds) {
        // Game Over! Show victory podium & full score summary
        setPhase('game_over');
        phaseRef.current = 'game_over';
        roomServiceRef.current?.broadcastGameState({
          phase: 'game_over',
          players: currentPlayers,
        });
      } else {
        startNewTurn(nextDrawerIdx, nextRound, currentPlayers);
      }
    }, 4500);
  }, [roomConfig.totalRounds, startNewTurn]);

  const handleRoundEndRef = useRef(handleRoundEnd);
  useEffect(() => {
    handleRoundEndRef.current = handleRoundEnd;
  }, [handleRoundEnd]);

  // Progressive letter reveal
  const revealRandomLetter = useCallback(() => {
    const word = currentWordRef.current;
    if (!word) return;
    setRevealedIndices((prev) => {
      const unrevealed: number[] = [];
      word.split('').forEach((c, i) => {
        if (c !== ' ' && c !== '-' && !prev.includes(i)) {
          unrevealed.push(i);
        }
      });

      if (unrevealed.length <= 1) return prev;

      const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      const nextRevealed = [...prev, pick];
      setMaskedWord(createMaskedWord(word, nextRevealed));
      return nextRevealed;
    });
  }, []);

  const revealRandomLetterRef = useRef(revealRandomLetter);
  useEffect(() => {
    revealRandomLetterRef.current = revealRandomLetter;
  }, [revealRandomLetter]);

  // Forward ref for handlePlayerGuess
  const handlePlayerGuessRef = useRef<(sender: Player, text: string) => void>(() => {});

  // Bot Guesser Simulation
  const simulateBotGuesses = useCallback((secondsLeft: number) => {
    const word = currentWordRef.current;
    if (!word) return;
    const currentList = playersRef.current;
    currentList.forEach((p) => {
      if (p.isBot && !p.isDrawer && !p.hasGuessed) {
        if (Math.random() < 0.08) {
          const isAccurate = secondsLeft < roomConfig.drawTime * 0.65 && Math.random() < 0.45;
          const guess = getBotGuess(word, roomConfig.language, isAccurate);
          handlePlayerGuessRef.current(p, guess);
        }
      }
    });
  }, [roomConfig.drawTime, roomConfig.language]);

  const simulateBotGuessesRef = useRef(simulateBotGuesses);
  useEffect(() => {
    simulateBotGuessesRef.current = simulateBotGuesses;
  }, [simulateBotGuesses]);

  // 4. Timer countdown during drawing phase
  useEffect(() => {
    if (phase !== 'drawing') return;

    isEndingRound.current = false;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            handleRoundEndRef.current();
          }, 0);
          return 0;
        }

        const nextTime = prev - 1;

        // Play subtle tick sound when 10 seconds remain
        if (nextTime <= 10) {
          soundManager.playTick();
        }

        // Reveal hints at 50% and 25% of time left
        const midTime = Math.floor(roomConfig.drawTime / 2);
        const quarterTime = Math.floor(roomConfig.drawTime / 4);

        if (nextTime === midTime || nextTime === quarterTime) {
          setTimeout(() => {
            revealRandomLetterRef.current();
          }, 0);
        }

        // Simulate Bot guesses during round
        setTimeout(() => {
          simulateBotGuessesRef.current(nextTime);
        }, 0);

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, roomConfig.drawTime]);

  // 5. Guess & Chat Handler
  const handlePlayerGuess = (sender: Player, text: string) => {
    // If player is drawer or already guessed, treat as regular chat
    if (sender.isDrawer || sender.hasGuessed || phase !== 'drawing') {
      const msg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        playerId: sender.id,
        playerName: sender.name,
        avatar: sender.avatar,
        text,
        type: 'chat',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      roomServiceRef.current?.broadcastChat(msg);
      return;
    }

    // Check exact match
    if (isWordMatch(text, currentWord)) {
      soundManager.playCorrect();

      // Calculate time-weighted score
      let points = Math.max(100, Math.round(100 + (timeLeft / roomConfig.drawTime) * 400));
      if (roomConfig.mode === 'all_draw' && sender.isLoneGuesser) {
        points = Math.round(points * 1.4);
      }
      const drawerBonus = roomConfig.mode === 'dual_coop' ? 100 : 75;

      // Update scores
      const updatedPlayers = playersRef.current.map((p) => {
        if (p.id === sender.id) {
          return { ...p, score: p.score + points, hasGuessed: true };
        }
        if (p.isDrawer) {
          return { ...p, score: p.score + drawerBonus };
        }
        return p;
      });

      setPlayers(updatedPlayers);
      roomServiceRef.current?.broadcastGameState({
        players: updatedPlayers,
      });

      // Add success message
      const correctMsg: ChatMessage = {
        id: `correct_${Date.now()}_${Math.random()}`,
        playerId: sender.id,
        playerName: sender.name,
        avatar: sender.avatar,
        text: `✨ ${sender.name} đã giải mã đúng từ khóa ma thuật! (+${points} Điểm Nhà)`,
        type: 'correct',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, correctMsg]);
      roomServiceRef.current?.broadcastChat(correctMsg);

      // Check if all active guessers have answered
      setTimeout(() => {
        const latest = playersRef.current;
        const guessers = latest.filter((p) => !p.isDrawer);
        const allGuessed = guessers.length > 0 && guessers.every((p) => p.hasGuessed);
        if (allGuessed) {
          setTimeout(() => {
            handleRoundEndRef.current();
          }, 0);
        }
      }, 500);

      return;
    }

    // Check fuzzy close match (Levenshtein)
    const dist = levenshteinDistance(text, currentWord);
    if (dist > 0 && dist <= 2 && text.length >= 3) {
      soundManager.playClose();
      const closeMsg: ChatMessage = {
        id: `close_${Date.now()}`,
        playerId: sender.id,
        playerName: sender.name,
        text: `⚡ ${sender.name}, câu thần chú của bạn gần chính xác rồi!`,
        type: 'close',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, closeMsg]);
      return;
    }

    // Regular chat
    const regularMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      playerId: sender.id,
      playerName: sender.name,
      avatar: sender.avatar,
      text,
      type: 'chat',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, regularMsg]);
    roomServiceRef.current?.broadcastChat(regularMsg);
  };

  useEffect(() => {
    handlePlayerGuessRef.current = handlePlayerGuess;
  }, [handlePlayerGuess]);

  // Join or Create Room
  const handleJoinRoom = (code: string, configOverrides?: Partial<RoomConfig>, addBots: boolean = false) => {
    setRoomCode(code);
    const newConfig: RoomConfig = {
      roomCode: code,
      roomName: `Phòng ${code}`,
      mode: configOverrides?.mode || 'classic',
      drawTime: configOverrides?.drawTime || 60,
      totalRounds: configOverrides?.totalRounds || 3,
      language: configOverrides?.language || 'vi',
      customWords: configOverrides?.customWords || [],
      maxPlayers: 8,
    };
    setRoomConfig(newConfig);

    const initialHost: Player = {
      id: currentUserId.current,
      name: playerName,
      avatar,
      score: 0,
      isHost: true,
      isDrawer: false,
      hasGuessed: false,
    };

    let initialPlayers = [initialHost];
    if (addBots) {
      initialPlayers.push(createBotPlayer(0));
      initialPlayers.push(createBotPlayer(1));
    }

    setPlayers(initialPlayers);

    // Initialize Realtime Network
    const service = new RealtimeRoomService(code, initialHost, {
      onDrawAction: (action) => setIncomingDrawAction(action),
      onChatMessage: (msg) => setMessages((prev) => [...prev, msg]),
      onGameStateSync: (syncState) => {
        if (syncState.phase) {
          setPhase(syncState.phase);
          phaseRef.current = syncState.phase;
        }
        if (syncState.players) {
          setPlayers(syncState.players);
        }
        if (syncState.currentWord) {
          setCurrentWord(syncState.currentWord);
          currentWordRef.current = syncState.currentWord;
        }
        if (syncState.maskedWord) setMaskedWord(syncState.maskedWord);
        if (syncState.timeLeft !== undefined) setTimeLeft(syncState.timeLeft);
        if (syncState.round !== undefined) {
          setRound(syncState.round);
          roundRef.current = syncState.round;
        }
        if (syncState.mode) {
          setRoomConfig((prev) => ({ ...prev, mode: syncState.mode! }));
        }
      },
      onPlayersUpdate: (onlinePlayers) => {
        setPlayers((prev) => {
          const merged = [...prev];
          onlinePlayers.forEach((op) => {
            const exists = merged.find((p) => p.id === op.id);
            if (!exists) merged.push(op);
          });
          return merged;
        });
      },
    });

    service.connect();
    roomServiceRef.current = service;

    // Direct into Waiting Room for host to pick mode and start
    setPhase('waiting_room');
  };

  // Host changes mode in waiting room
  const handleModeChange = (newMode: GameMode) => {
    setRoomConfig((prev) => ({ ...prev, mode: newMode }));
    roomServiceRef.current?.broadcastGameState({ mode: newMode });
  };

  // Start game from waiting room
  const handleStartGame = () => {
    soundManager.playSpellVfx();
    let currentPlayers = players;
    // For dual_coop or all_draw, auto-summon bots to ensure at least 3 players (at least 2 drawers + 1 guesser)
    if ((roomConfig.mode === 'dual_coop' || roomConfig.mode === 'all_draw') && currentPlayers.length < 3) {
      const needed = 3 - currentPlayers.length;
      const newBots: Player[] = [];
      for (let i = 0; i < needed; i++) {
        newBots.push(createBotPlayer(currentPlayers.length + i));
      }
      currentPlayers = [...currentPlayers, ...newBots];
      setPlayers(currentPlayers);

      newBots.forEach((bot) => {
        const botJoinedMsg: ChatMessage = {
          id: `bot_join_${Date.now()}_${bot.id}`,
          text: `🤖 ${bot.name} đã được triệu hồi để hỗ trợ chế độ Co-op!`,
          type: 'system',
          timestamp: Date.now(),
        };
        setMessages((m) => [...m, botJoinedMsg]);
      });
    }
    startNewTurn(0, 1, currentPlayers);
  };

  // Add a Bot to current room
  const handleAddBot = () => {
    setPlayers((prev) => {
      const newBot = createBotPlayer(prev.length);
      const updated = [...prev, newBot];
      const botJoinedMsg: ChatMessage = {
        id: `bot_join_${Date.now()}`,
        text: `🤖 ${newBot.name} đã tham gia phòng chơi!`,
        type: 'system',
        timestamp: Date.now(),
      };
      setMessages((m) => [...m, botJoinedMsg]);
      roomServiceRef.current?.broadcastChat(botJoinedMsg);
      roomServiceRef.current?.broadcastGameState({
        players: updated,
      });
      return updated;
    });
  };

  // Return to Lobby
  const handleBackToLobby = () => {
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = null;
    }
    roomServiceRef.current?.disconnect();
    roomServiceRef.current = null;
    setRoomCode(null);
    setPhase('lobby');
    phaseRef.current = 'lobby';
    setMessages([]);
    setPlayers([]);
  };

  // Restart Game / Làm Ván Mới (Giữ nguyên toàn bộ thành viên trong phòng)
  const handlePlayAgain = (returnToWaitingRoom: boolean = false) => {
    soundManager.playSpellVfx();

    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = null;
    }

    // Reset scores, guesses and drawer flags for all players in room
    const resetPlayers = playersRef.current.map((p) => ({
      ...p,
      score: 0,
      hasGuessed: false,
      isDrawer: false,
      isLoneGuesser: false,
    }));

    setPlayers(resetPlayers);
    setRound(1);
    roundRef.current = 1;
    setCurrentDrawerIndex(0);
    currentDrawerIndexRef.current = 0;
    setCurrentWord('');
    currentWordRef.current = '';
    setMaskedWord('');
    setRevealedIndices([]);
    setRoundEndMessage(null);
    setTimeLeft(roomConfig.drawTime);
    isEndingRound.current = false;

    if (returnToWaitingRoom) {
      setPhase('waiting_room');
      phaseRef.current = 'waiting_room';
      roomServiceRef.current?.broadcastGameState({
        phase: 'waiting_room',
        round: 1,
        players: resetPlayers,
      });

      const sysMsg: ChatMessage = {
        id: `play_again_${Date.now()}`,
        text: '🏰 Toàn bộ phù thủy đã cùng quay về Phòng Chờ! Hãy chuẩn bị cho ván đấu tiếp theo.',
        type: 'system',
        timestamp: Date.now(),
      };
      setMessages((m) => [...m, sysMsg]);
      roomServiceRef.current?.broadcastChat(sysMsg);
    } else {
      // Start turn 0 round 1 immediately
      startNewTurn(0, 1, resetPlayers);

      const sysMsg: ChatMessage = {
        id: `play_again_${Date.now()}`,
        text: '⚡ Ván mới đã chính thức bắt đầu! Điểm số của tất cả thành viên đã được thiết lập lại về 0.',
        type: 'system',
        timestamp: Date.now(),
      };
      setMessages((m) => [...m, sysMsg]);
      roomServiceRef.current?.broadcastChat(sysMsg);
    }
  };

  const renderClueOrWordBanner = () => {
    if (phase !== 'drawing') {
      if (roundEndMessage) {
        return (
          <div style={{ color: 'var(--hogwarts-gold)', fontSize: isMobile ? '13px' : '15px', fontWeight: 800 }} className="font-cinzel">
            {roundEndMessage}
          </div>
        );
      }
      return (
        <div style={{ color: 'var(--text-muted)', fontSize: isMobile ? '12px' : '14px' }}>
          Đang chuẩn bị vòng đấu phép thuật...
        </div>
      );
    }

    if (isCurrentDrawer) {
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(116, 0, 1, 0.25)',
            padding: isMobile ? '4px 12px' : '4px 14px',
            borderRadius: '20px',
            border: '1px solid var(--hogwarts-gold)',
            maxWidth: '100%',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--hogwarts-gold)', fontWeight: 700, whiteSpace: 'nowrap' }} className="font-cinzel">
            BẢO BỐI:
          </span>
          <span
            style={{
              fontSize: isMobile ? '16px' : 'clamp(15px, 3.8vw, 20px)',
              fontWeight: 900,
              letterSpacing: '1px',
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
            className="font-cinzel"
          >
            {currentWord}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            ({currentWord.replace(/\s+/g, '').length}kí tự)
          </span>
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(26, 71, 42, 0.25)',
          padding: isMobile ? '4px 12px' : '4px 14px',
          borderRadius: '20px',
          border: '1px solid var(--accent-cyan)',
          maxWidth: '100%',
        }}
      >
        <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700, whiteSpace: 'nowrap' }} className="font-cinzel">
          GỢI Ý:
        </span>
        <span
          style={{
            fontSize: isMobile ? '18px' : 'clamp(15px, 4vw, 22px)',
            fontWeight: 900,
            letterSpacing: '3px',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}
        >
          {maskedWord}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          ({currentWord.replace(/\s+/g, '').length}kí tự)
        </span>
      </div>
    );
  };

  return (
    <div className={`game-container ${isMobile && phase !== 'lobby' && phase !== 'waiting_room' ? 'in-game-mobile' : ''}`}>
      {phase === 'lobby' || !roomCode ? (
        <Lobby
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
          avatar={avatar}
          onAvatarChange={setAvatar}
          onJoinRoom={handleJoinRoom}
        />
      ) : phase === 'waiting_room' ? (
        <WaitingRoom
          roomConfig={roomConfig}
          players={players}
          currentPlayerId={currentUserId.current}
          isHost={isHost}
          onModeChange={handleModeChange}
          onAddBot={handleAddBot}
          onStartGame={handleStartGame}
          onLeaveRoom={handleBackToLobby}
        />
      ) : (
        <>
          {/* In-Game Header Bar */}
          <div className={`game-header-bar ${isMobile ? 'mobile-header-two-rows' : ''}`}>
            {isMobile ? (
              <>
                {/* Mobile Row 1: Room Info & Exit on left, Timer & Sound on right */}
                <div className="mobile-header-row-1">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setPhase('waiting_room')}
                      className="btn-icon"
                      title="Quay lại phòng chờ để đổi chế độ hoặc thêm bạn"
                      style={{ padding: '6px' }}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-cyan)', whiteSpace: 'nowrap', margin: 0 }}>
                          {roomConfig.roomName}
                        </h3>
                        <span
                          style={{
                            background: 'rgba(212, 175, 55, 0.2)',
                            border: '1px solid var(--border-gold)',
                            color: 'var(--hogwarts-gold)',
                            padding: '1px 6px',
                            borderRadius: '8px',
                            fontSize: '9.5px',
                            fontWeight: 700,
                          }}
                        >
                          {roomConfig.mode === 'dual_coop'
                            ? 'Co-op'
                            : roomConfig.mode === 'all_draw'
                            ? 'Hợp Xướng'
                            : 'Độc Hành'}
                        </span>
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        Vòng {round}/{roomConfig.totalRounds}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: timeLeft <= 10 ? 'rgba(239, 71, 111, 0.25)' : 'var(--bg-stage)',
                        border: timeLeft <= 10 ? '2px solid var(--accent-red)' : '1px solid var(--border-card)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        color: timeLeft <= 10 ? 'var(--accent-red)' : '#fff',
                        fontWeight: 800,
                        fontSize: '15px',
                        animation: timeLeft <= 10 ? 'pulseGlow 1s infinite' : 'none',
                      }}
                    >
                      <Clock size={15} color={timeLeft <= 10 ? 'var(--accent-red)' : 'var(--accent-yellow)'} />
                      <span>{timeLeft}s</span>
                    </div>

                    <button
                      type="button"
                      onClick={toggleSound}
                      className="btn-icon"
                      title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                      style={{ padding: '6px' }}
                    >
                      {isMuted ? <VolumeX size={16} color="var(--accent-red)" /> : <Volume2 size={16} color="var(--accent-cyan)" />}
                    </button>
                  </div>
                </div>

                {/* Mobile Row 2: Prominent Full-Width Word / Masked Clue */}
                <div className="mobile-header-row-2">
                  {renderClueOrWordBanner()}
                </div>
              </>
            ) : (
              <>
                {/* Desktop Left: Back to Waiting Room & Room info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPhase('waiting_room')}
                    className="btn-icon"
                    title="Quay lại phòng chờ để đổi chế độ hoặc thêm bạn"
                    style={{ padding: '8px' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-cyan)', whiteSpace: 'nowrap', margin: 0 }}>
                        {roomConfig.roomName}
                      </h3>
                      <span
                        style={{
                          background: 'rgba(212, 175, 55, 0.2)',
                          border: '1px solid var(--border-gold)',
                          color: 'var(--hogwarts-gold)',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        {roomConfig.mode === 'dual_coop'
                          ? 'Song Kiếm Co-op'
                          : roomConfig.mode === 'all_draw'
                          ? 'Đại Hợp Xướng'
                          : 'Độc Hành'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Vòng {round}/{roomConfig.totalRounds}
                    </span>
                  </div>
                </div>

                {/* Desktop Center: Word Banner or Clue */}
                <div style={{ textAlign: 'center', flex: 1, minWidth: 0, maxWidth: '600px', overflow: 'hidden' }}>
                  {renderClueOrWordBanner()}
                </div>

                {/* Desktop Right: Timer & Sound */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: timeLeft <= 10 ? 'rgba(239, 71, 111, 0.25)' : 'var(--bg-stage)',
                      border: timeLeft <= 10 ? '2px solid var(--accent-red)' : '1px solid var(--border-card)',
                      padding: '6px 14px',
                      borderRadius: '16px',
                      color: timeLeft <= 10 ? 'var(--accent-red)' : '#fff',
                      fontWeight: 800,
                      fontSize: '18px',
                      animation: timeLeft <= 10 ? 'pulseGlow 1s infinite' : 'none',
                    }}
                  >
                    <Clock size={18} color={timeLeft <= 10 ? 'var(--accent-red)' : 'var(--accent-yellow)'} />
                    <span>{timeLeft}s</span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleSound}
                    className="btn-icon"
                    title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                  >
                    {isMuted ? <VolumeX size={18} color="var(--accent-red)" /> : <Volume2 size={18} color="var(--accent-cyan)" />}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Tabs Switcher */}
          {isMobile && (
            <div className="mobile-tabs-container">
              <button
                type="button"
                className={`mobile-tab-btn ${mobileTab === 'canvas' ? 'active' : ''}`}
                onClick={() => setMobileTab('canvas')}
              >
                <Palette size={15} /> Bảng Vẽ
              </button>
              <button
                type="button"
                className={`mobile-tab-btn ${mobileTab === 'chat' ? 'active' : ''}`}
                onClick={() => setMobileTab('chat')}
              >
                <MessageSquare size={15} /> Chat ({messages.length})
              </button>
              <button
                type="button"
                className={`mobile-tab-btn ${mobileTab === 'scores' ? 'active' : ''}`}
                onClick={() => setMobileTab('scores')}
              >
                <Trophy size={15} /> Điểm ({players.length})
              </button>
            </div>
          )}

          {/* Main Content: Either Mobile Tab or Desktop 3-Column Grid */}
          {isMobile ? (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {mobileTab === 'canvas' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '8px' }}>
                  <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <CanvasBoard
                      isDrawer={isCurrentDrawer && phase === 'drawing'}
                      onBroadcastDraw={(action) => roomServiceRef.current?.broadcastDraw(action)}
                      incomingAction={incomingDrawAction}
                      mode={roomConfig.mode}
                      coopPartnerName={coopPartner?.name}
                      isLoneGuesser={currentPlayer.isLoneGuesser}
                      phase={phase}
                      currentWord={currentWord}
                      roundEndMessage={roundEndMessage}
                    />
                  </div>

                  {/* Inline Quick Guess, Live Ticker & Reactions for Mobile Guessers right under canvas */}
                  {!isCurrentDrawer && phase === 'drawing' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Live Ticker: Shows 2 most recent guesses/results without leaving canvas */}
                      {messages.length > 0 && (
                        <div className="mobile-live-ticker-container">
                          {messages.slice(-2).map((msg) => (
                            <div
                              key={msg.id}
                              className={`mobile-live-ticker ${
                                msg.type === 'correct' ? 'correct' : msg.type === 'close' ? 'close' : 'normal'
                              }`}
                            >
                              {msg.type === 'correct' && <span>🎉</span>}
                              {msg.type === 'close' && <span>⚠️</span>}
                              {msg.type === 'system' && <span>🪄</span>}
                              {msg.type === 'chat' && (
                                <span style={{ color: 'var(--accent-yellow)', fontWeight: 700 }}>
                                  {msg.playerName}:
                                </span>
                              )}
                              <span>{msg.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Emoji Reaction Pills */}
                      <div className="mobile-quick-emojis">
                        {['❤️', '😂', '👏', '🔥', '⚡', '🪄'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              soundManager.playToolSelect();
                              handlePlayerGuess(currentPlayer, emoji);
                            }}
                            className="mobile-emoji-pill"
                            title={`Thả cảm xúc ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {/* Guess Input Form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!mobileGuessInput.trim()) return;
                          soundManager.playClick();
                          handlePlayerGuess(currentPlayer, mobileGuessInput.trim());
                          setMobileGuessInput('');
                        }}
                        style={{
                          background: 'var(--bg-card)',
                          border: '2px solid var(--border-card)',
                          borderRadius: '14px',
                          padding: '6px 8px',
                          display: 'flex',
                          gap: '6px',
                          alignItems: 'center',
                        }}
                      >
                        <input
                          type="text"
                          value={mobileGuessInput}
                          onChange={(e) => setMobileGuessInput(e.target.value)}
                          placeholder={currentPlayer.hasGuessed ? 'Đã đoán đúng! Chat tự do...' : 'Gõ tên bảo bối ma thuật...'}
                          style={{ flex: 1, padding: '10px 12px', fontSize: '16px' }}
                        />
                        <button
                          type="submit"
                          disabled={!mobileGuessInput.trim()}
                          className="btn-gold"
                          style={{ padding: '0 16px', minHeight: '42px', borderRadius: '10px' }}
                        >
                          <Send size={16} />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {mobileTab === 'chat' && (
                <div style={{ flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
                  <ChatPanel
                    messages={messages}
                    onSendMessage={(text) => handlePlayerGuess(currentPlayer, text)}
                    isDrawer={isCurrentDrawer && phase === 'drawing'}
                    hasGuessed={currentPlayer.hasGuessed}
                    currentPlayer={currentPlayer}
                  />
                </div>
              )}

              {mobileTab === 'scores' && (
                <div style={{ flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
                  <ScoreBoard
                    players={players}
                    currentUserId={currentUserId.current}
                    currentDrawerId={currentDrawer?.id || null}
                    roomCode={roomConfig.roomCode}
                    round={round}
                    totalRounds={roomConfig.totalRounds}
                    isHost={isHost}
                    onAddBot={handleAddBot}
                    mode={roomConfig.mode}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="game-main-grid">
              <ScoreBoard
                players={players}
                currentUserId={currentUserId.current}
                currentDrawerId={currentDrawer?.id || null}
                roomCode={roomConfig.roomCode}
                round={round}
                totalRounds={roomConfig.totalRounds}
                isHost={isHost}
                onAddBot={handleAddBot}
                mode={roomConfig.mode}
              />

              <CanvasBoard
                isDrawer={isCurrentDrawer && phase === 'drawing'}
                onBroadcastDraw={(action) => roomServiceRef.current?.broadcastDraw(action)}
                incomingAction={incomingDrawAction}
                mode={roomConfig.mode}
                coopPartnerName={coopPartner?.name}
                isLoneGuesser={currentPlayer.isLoneGuesser}
                phase={phase}
                currentWord={currentWord}
                roundEndMessage={roundEndMessage}
              />

              <div className="right-panel-column">
                <div id="drawing-toolbar-container" />
                <ChatPanel
                  messages={messages}
                  onSendMessage={(text) => handlePlayerGuess(currentPlayer, text)}
                  isDrawer={isCurrentDrawer && phase === 'drawing'}
                  hasGuessed={currentPlayer.hasGuessed}
                  currentPlayer={currentPlayer}
                />
              </div>
            </div>
          )}

          {/* Word Selection Modal */}
          {phase === 'selecting_word' && (
            <WordPickerModal
              isDrawer={isCurrentDrawer}
              drawerName={
                roomConfig.mode === 'dual_coop'
                  ? players.filter((p) => p.isDrawer).map((p) => p.name).join(' & ') || 'Hai Pháp Sư'
                  : roomConfig.mode === 'all_draw'
                  ? 'Toàn Thể Pháp Sư'
                  : currentDrawer?.name || 'Họa sĩ'
              }
              wordChoices={wordChoices}
              onSelectWord={handleWordSelected}
              onTimeout={handleSkipDrawer}
            />
          )}

          {/* Victory Podium */}
          {phase === 'game_over' && (
            <VictoryPodium
              players={players}
              isHost={isHost}
              currentPlayerId={currentUserId.current}
              onPlayAgain={handlePlayAgain}
              onBackToLobby={handleBackToLobby}
            />
          )}
        </>
      )}
    </div>
  );
};
