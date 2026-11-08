import { useCallback, useEffect, useRef } from 'react';
import type { Player, ChatMessage, GamePhase } from '../types';
import {
  containsWordSpoiler,
  createMaskedWord,
  isUnmaskedChar,
  isWordMatch,
  levenshteinDistance,
} from '../data/words';
import { soundManager } from '../utils/audio';
import {
  appendBoundedMessage,
  type SharedGameRefs,
  type SharedGameSetters,
} from './gameControllerTypes';
import { useRoundTimers } from './useRoundTimers';

export function useGuessController(
  refs: SharedGameRefs,
  setters: SharedGameSetters,
  phase: GamePhase,
  drawTime: number,
  handleRoundEnd: () => void,
  isImpostorSpoilerBlocked?: (text: string) => boolean
) {
  const {
    currentUserId,
    hostIdRef,
    roomServiceRef,
    roomConfigRef,
    phaseRef,
    timeLeftRef,
    playersRef,
    currentWordRef,
    maskedWordRef,
    revealedIndicesRef,
  } = refs;

  const {
    setTimeLeft,
    setPlayers,
    setMaskedWord,
    setRevealedIndices,
    setMessages,
    setSolvedWordsMap,
    setInspectFeedback,
    broadcastGameState,
  } = setters;

  const handleRoundEndRef = useRef(handleRoundEnd);
  useEffect(() => {
    handleRoundEndRef.current = handleRoundEnd;
  }, [handleRoundEnd]);

  const lastMessageAtByPlayerRef = useRef<Map<string, number>>(new Map());

  const revealRandomLetter = useCallback(() => {
    const word = currentWordRef.current;
    if (!word || currentUserId.current !== hostIdRef.current) return;
    if (roomConfigRef.current.mode === 'rush_draw') return;

    const unrevealed = word
      .split('')
      .flatMap((char, index) =>
        !isUnmaskedChar(char) && !revealedIndicesRef.current.includes(index) ? [index] : []
      );
    if (unrevealed.length <= 1) return;

    const nextRevealed = [
      ...revealedIndicesRef.current,
      unrevealed[Math.floor(Math.random() * unrevealed.length)],
    ];
    revealedIndicesRef.current = nextRevealed;
    const nextMask = createMaskedWord(word, nextRevealed);
    maskedWordRef.current = nextMask;
    setRevealedIndices(nextRevealed);
    setMaskedWord(nextMask);
    broadcastGameState({ maskedWord: nextMask, revealedIndices: nextRevealed });
  }, [
    broadcastGameState,
    currentUserId,
    currentWordRef,
    hostIdRef,
    maskedWordRef,
    revealedIndicesRef,
    roomConfigRef,
    setMaskedWord,
    setRevealedIndices,
  ]);

  const handlePlayerGuess = useCallback(
    (sender: Player, text: string, targetOpponentId?: string) => {
      const trimmed = String(text || '').trim().slice(0, 250);
      if (!trimmed) return;

      if (!sender.isBot) {
        const now = Date.now();
        const prevAt = lastMessageAtByPlayerRef.current.get(sender.id) || 0;
        if (now - prevAt < 220) return;
        lastMessageAtByPlayerRef.current.set(sender.id, now);
      }

      if (currentUserId.current !== hostIdRef.current) {
        if (sender.id === currentUserId.current) {
          roomServiceRef.current?.submitGuess(trimmed, targetOpponentId);
        }
        return;
      }

      const cfg = roomConfigRef.current;
      const activePhase = phaseRef.current;
      const currentPlayers = playersRef.current;
      const liveSender = currentPlayers.find((p) => p.id === sender.id) || sender;
      const currentTimeLeft = timeLeftRef.current;

      const deliverPrivateNotice = (target: Player, notice: ChatMessage) => {
        if (target.isBot) return;
        if (target.id === currentUserId.current) {
          soundManager.playClose();
          setInspectFeedback(notice.text);
          setMessages((prev) => appendBoundedMessage(prev, notice));
        } else {
          roomServiceRef.current?.sendPrivateChat(target.id, notice);
        }
      };

      if (cfg.mode === 'rush_draw') {
        if (activePhase !== 'drawing') {
          const msg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random()}`,
            playerId: liveSender.id,
            playerName: liveSender.name,
            avatar: liveSender.avatar,
            text: trimmed,
            type: 'chat',
            timestamp: Date.now(),
          };
          setMessages((prev) => appendBoundedMessage(prev, msg));
          roomServiceRef.current?.broadcastChat(msg);
          return;
        }

        const myWord = liveSender.secretWord || (liveSender.id === currentUserId.current ? currentWordRef.current : '');
        if (myWord && containsWordSpoiler(trimmed, myWord)) {
          deliverPrivateNotice(liveSender, {
            id: `warn_${Date.now()}`,
            playerId: liveSender.id,
            playerName: liveSender.name,
            text: '🤫 Đừng tiết lộ từ khóa bí mật của chính bạn!',
            type: 'close',
            timestamp: Date.now(),
          });
          return;
        }

        const alreadySolved = liveSender.solvedOpponentIds || [];
        const spoiledSolvedOpponent = currentPlayers.find(
          (opp) => alreadySolved.includes(opp.id) && opp.secretWord && containsWordSpoiler(trimmed, opp.secretWord)
        );
        if (spoiledSolvedOpponent) {
          deliverPrivateNotice(liveSender, {
            id: `warn_solved_${Date.now()}`,
            playerId: liveSender.id,
            playerName: liveSender.name,
            text: `🤫 Suỵt! Đừng tiết lộ đáp án tranh của ${spoiledSolvedOpponent.name} cho người khác!`,
            type: 'close',
            timestamp: Date.now(),
          });
          return;
        }

        const matchedOpponent = currentPlayers.find((opp) => {
          if (opp.id === liveSender.id || alreadySolved.includes(opp.id)) return false;
          if (targetOpponentId && opp.id !== targetOpponentId) return false;
          return Boolean(opp.secretWord && isWordMatch(trimmed, opp.secretWord));
        });

        if (matchedOpponent && matchedOpponent.secretWord) {
          soundManager.playCorrect();
          if (liveSender.id === currentUserId.current) {
            setInspectFeedback(null);
          }
          const drawTimeTotal = cfg.drawTime || 90;
          const points = Math.max(150, Math.round(150 + (currentTimeLeft / drawTimeTotal) * 250));
          const drawerBonus = 100;

          const newSolvedList = [...alreadySolved, matchedOpponent.id];
          const newDrawerSolvedBy = [...(matchedOpponent.solvedByPlayerIds || []), liveSender.id];

          const updatedPlayers = currentPlayers.map((p) => {
            if (p.id === liveSender.id) {
              return { ...p, score: p.score + points, solvedOpponentIds: newSolvedList };
            }
            if (p.id === matchedOpponent.id) {
              return { ...p, score: p.score + drawerBonus, solvedByPlayerIds: newDrawerSolvedBy };
            }
            return p;
          });

          setPlayers(updatedPlayers);
          playersRef.current = updatedPlayers;
          broadcastGameState({ players: updatedPlayers });

          if (liveSender.id === currentUserId.current) {
            setSolvedWordsMap((prev) => ({
              ...prev,
              [matchedOpponent.id]: matchedOpponent.secretWord!,
            }));
          } else if (!liveSender.isBot) {
            roomServiceRef.current?.sendSolvedWord(
              liveSender.id,
              matchedOpponent.id,
              matchedOpponent.secretWord
            );
          }

          const correctMsg: ChatMessage = {
            id: `correct_${Date.now()}_${Math.random()}`,
            playerId: liveSender.id,
            playerName: liveSender.name,
            avatar: liveSender.avatar,
            text: `🎉 ${liveSender.name} đã giải mã thành công tranh của ${matchedOpponent.name}! (+${points}đ, ${matchedOpponent.name} +${drawerBonus}đ)`,
            type: 'correct',
            timestamp: Date.now(),
          };
          setMessages((prev) => appendBoundedMessage(prev, correctMsg));
          roomServiceRef.current?.broadcastChat(correctMsg);

          const totalOpponents = currentPlayers.filter((p) => p.id !== liveSender.id && Boolean(p.secretWord)).length;
          if (newSolvedList.length >= totalOpponents && totalOpponents > 0) {
            const finishMsg: ChatMessage = {
              id: `finish_${Date.now()}`,
              playerId: liveSender.id,
              playerName: liveSender.name,
              text: `🏆 Phù thủy ${liveSender.name} đã giải mã trọn vẹn TOÀN BỘ tranh của các đối thủ!`,
              type: 'system',
              timestamp: Date.now(),
            };
            setMessages((prev) => appendBoundedMessage(prev, finishMsg));
            roomServiceRef.current?.broadcastChat(finishMsg);

            const everyoneFinished = updatedPlayers.every((p) => {
              const oppCount = updatedPlayers.filter((o) => o.id !== p.id && Boolean(o.secretWord)).length;
              return oppCount > 0 && (p.solvedOpponentIds?.length || 0) >= oppCount;
            });
            if (everyoneFinished) {
              // Guard against a stale timeout firing into the next round: only end
              // the rush round if the turn token (and host) are still what they were
              // when this correct-guess fired. Register so clearBotTimeouts cancels
              // it on any phase transition.
              const endToken = refs.turnTokenRef.current;
              refs.botTimeoutsRef.current.push(
                setTimeout(() => {
                  if (refs.turnTokenRef.current !== endToken) return;
                  handleRoundEndRef.current();
                }, 900)
              );
            }
          }
          return;
        }

        if (targetOpponentId) {
          const targetOpp = currentPlayers.find((o) => o.id === targetOpponentId);
          const isClose =
            targetOpp?.secretWord &&
            trimmed.length >= 3 &&
            levenshteinDistance(trimmed, targetOpp.secretWord) <= 2;
          deliverPrivateNotice(liveSender, {
            id: `inspect_try_${Date.now()}`,
            playerId: liveSender.id,
            playerName: liveSender.name,
            text: isClose
              ? `⚡ Gần chính xác với tranh của ${targetOpp?.name || 'đối thủ'} rồi!`
              : `❌ "${trimmed}" chưa đúng với tranh của ${targetOpp?.name || 'đối thủ'}!`,
            type: 'close',
            timestamp: Date.now(),
          });
          return;
        }

        for (const opp of currentPlayers) {
          if (opp.id !== liveSender.id && !alreadySolved.includes(opp.id) && opp.secretWord) {
            const dist = levenshteinDistance(trimmed, opp.secretWord);
            if (dist > 0 && dist <= 2 && trimmed.length >= 3) {
              deliverPrivateNotice(liveSender, {
                id: `close_${Date.now()}`,
                playerId: liveSender.id,
                playerName: liveSender.name,
                text: `⚡ ${liveSender.name}, bạn đoán gần trúng tranh của ${opp.name} rồi!`,
                type: 'close',
                timestamp: Date.now(),
              });
              return;
            }
          }
        }

        const regularMsg: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random()}`,
          playerId: liveSender.id,
          playerName: liveSender.name,
          avatar: liveSender.avatar,
          text: trimmed,
          type: 'chat',
          timestamp: Date.now(),
        };
        setMessages((prev) => appendBoundedMessage(prev, regularMsg));
        roomServiceRef.current?.broadcastChat(regularMsg);
        return;
      }

      const secret = currentWordRef.current;
      if (liveSender.isDrawer || liveSender.hasGuessed || activePhase !== 'drawing') {
        if (cfg.mode === 'polyjuice_impostor' && isImpostorSpoilerBlocked?.(trimmed)) {
          deliverPrivateNotice(liveSender, {
            id: `warn_imp_${Date.now()}`,
            playerId: liveSender.id,
            playerName: liveSender.name,
            text: '🤫 Suỵt! Cấm lộ trực tiếp từ khóa bí mật trước Phiên Tòa — Kẻ Giả Mạo sẽ nghe thấy!',
            type: 'close',
            timestamp: Date.now(),
          });
          return;
        }

        if (activePhase === 'drawing' && secret && containsWordSpoiler(trimmed, secret)) {
          deliverPrivateNotice(liveSender, {
            id: `warn_${Date.now()}`,
            playerId: liveSender.id,
            playerName: liveSender.name,
            text: '🤫 Suỵt! Bạn không được tiết lộ đáp án ma thuật cho người khác!',
            type: 'close',
            timestamp: Date.now(),
          });
          return;
        }

        const msg: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          playerId: liveSender.id,
          playerName: liveSender.name,
          avatar: liveSender.avatar,
          text: trimmed,
          type: 'chat',
          timestamp: Date.now(),
        };
        setMessages((prev) => appendBoundedMessage(prev, msg));
        roomServiceRef.current?.broadcastChat(msg);
        return;
      }

      if (secret && isWordMatch(trimmed, secret)) {
        soundManager.playCorrect();
        let points = Math.max(100, Math.round(100 + (currentTimeLeft / (cfg.drawTime || 60)) * 400));
        if (cfg.mode === 'all_draw' && liveSender.isLoneGuesser) {
          points = Math.round(points * 1.4);
        }
        const drawerBonus = cfg.mode === 'dual_coop' ? 100 : 75;

        const updatedPlayers = currentPlayers.map((p) => {
          if (p.id === liveSender.id) {
            return { ...p, score: p.score + points, hasGuessed: true };
          }
          if (p.isDrawer) {
            return { ...p, score: p.score + drawerBonus };
          }
          return p;
        });

        setPlayers(updatedPlayers);
        playersRef.current = updatedPlayers;
        broadcastGameState({ players: updatedPlayers });

        const correctMsg: ChatMessage = {
          id: `correct_${Date.now()}_${Math.random()}`,
          playerId: liveSender.id,
          playerName: liveSender.name,
          avatar: liveSender.avatar,
          text: `✨ ${liveSender.name} đã giải mã đúng từ khóa ma thuật! (+${points} Điểm Nhà)`,
          type: 'correct',
          timestamp: Date.now(),
        };
        setMessages((prev) => appendBoundedMessage(prev, correctMsg));
        roomServiceRef.current?.broadcastChat(correctMsg);

        const endToken = refs.turnTokenRef.current;
        refs.botTimeoutsRef.current.push(
          setTimeout(() => {
            if (refs.turnTokenRef.current !== endToken) return;
            const latest = playersRef.current;
            const guessers = latest.filter((p) => !p.isDrawer);
            if (guessers.length > 0 && guessers.every((p) => p.hasGuessed)) {
              handleRoundEndRef.current();
            }
          }, 450)
        );
        return;
      }

      if (secret) {
        const dist = levenshteinDistance(trimmed, secret);
        if (dist > 0 && dist <= 2 && trimmed.length >= 3) {
          deliverPrivateNotice(liveSender, {
            id: `close_${Date.now()}`,
            playerId: liveSender.id,
            playerName: liveSender.name,
            text: `⚡ ${liveSender.name}, câu thần chú của bạn gần chính xác rồi!`,
            type: 'close',
            timestamp: Date.now(),
          });
          return;
        }
      }

      const regularMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        playerId: liveSender.id,
        playerName: liveSender.name,
        avatar: liveSender.avatar,
        text: trimmed,
        type: 'chat',
        timestamp: Date.now(),
      };
      setMessages((prev) => appendBoundedMessage(prev, regularMsg));
      roomServiceRef.current?.broadcastChat(regularMsg);
    },
    [
      broadcastGameState,
      currentUserId,
      currentWordRef,
      hostIdRef,
      isImpostorSpoilerBlocked,
      phaseRef,
      playersRef,
      roomConfigRef,
      roomServiceRef,
      setInspectFeedback,
      setMessages,
      setPlayers,
      setSolvedWordsMap,
      timeLeftRef,
    ]
  );

  const handlePlayerGuessRef = useRef(handlePlayerGuess);
  useEffect(() => {
    handlePlayerGuessRef.current = handlePlayerGuess;
  }, [handlePlayerGuess]);

  useRoundTimers({
    refs,
    setTimeLeft,
    phase,
    drawTime,
    revealRandomLetter,
    handleRoundEndRef,
    handlePlayerGuessRef,
  });

  return {
    handlePlayerGuess,
    handlePlayerGuessRef,
  };
}
