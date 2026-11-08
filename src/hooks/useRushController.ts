import { useCallback, useRef } from 'react';
import type { Player, ChatMessage } from '../types';
import { getRandomWordChoices, normalizeGuess, WORDS } from '../data/words';
import { generateProceduralDrawing } from '../services/botEngine';
import {
  appendBoundedMessage,
  appendCompactDrawAction,
  type SharedGameRefs,
  type SharedGameSetters,
} from './gameControllerTypes';

export function buildUniqueRushChoices(
  players: Player[],
  lang: 'vi' | 'en',
  customWords: string[],
  excludeNormalized?: ReadonlySet<string>
): Map<string, string[]> {
  const seen = new Set<string>();
  const freshCustom: string[] = [];
  const usedCustom: string[] = [];
  for (const w of customWords) {
    const clean = w.trim();
    const key = normalizeGuess(clean);
    if (clean && key && !seen.has(key)) {
      seen.add(key);
      if (excludeNormalized?.has(key)) usedCustom.push(clean);
      else freshCustom.push(clean);
    }
  }
  const freshFallback: string[] = [];
  const usedFallback: string[] = [];
  for (const w of WORDS[lang] || WORDS.vi) {
    const clean = w.trim();
    const key = normalizeGuess(clean);
    if (clean && key && !seen.has(key)) {
      seen.add(key);
      if (excludeNormalized?.has(key)) usedFallback.push(clean);
      else freshFallback.push(clean);
    }
  }
  const shuffle = (arr: string[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const combined = [
    ...shuffle(freshCustom),
    ...shuffle(freshFallback),
    ...shuffle(usedCustom),
    ...shuffle(usedFallback),
  ];

  const map = new Map<string, string[]>();
  players.forEach((p, idx) => {
    const start = idx * 3;
    if (start + 3 <= combined.length) {
      map.set(p.id, combined.slice(start, start + 3));
    } else {
      map.set(p.id, getRandomWordChoices(lang, customWords, excludeNormalized));
    }
  });
  return map;
}

export function useRushController(refs: SharedGameRefs, setters: SharedGameSetters) {
  const ctxRef = useRef({ refs, setters });
  ctxRef.current = { refs, setters };

  const launchRushDrawingPhase = useCallback(() => {
    const { refs: r, setters: s } = ctxRef.current;
    if (r.currentUserId.current !== r.hostIdRef.current) return;
    if (r.phaseRef.current !== 'selecting_word') return;

    if (r.selectionTimeoutRef.current) {
      clearTimeout(r.selectionTimeoutRef.current);
      r.selectionTimeoutRef.current = null;
    }

    const cfg = r.roomConfigRef.current;
    const roundDuration = cfg.drawTime || 90;
    const turnToken = r.turnTokenRef.current;

    const usedLower = new Set<string>();
    r.rushPickedWordsRef.current.forEach((picked) => {
      if (picked) usedLower.add(picked.toLowerCase());
    });

    const fullPool = [...(cfg.customWords || []), ...(WORDS[cfg.language] || WORDS.vi)];
    const updatedPlayers = r.playersRef.current.map((p) => {
      let secretWord = r.rushPickedWordsRef.current.get(p.id);
      const offered =
        r.rushChoicesMapRef.current.get(p.id) ||
        getRandomWordChoices(cfg.language, cfg.customWords, r.usedWordsInMatchRef.current);
      if (!secretWord) {
        secretWord =
          offered.find((w) => !usedLower.has(w.toLowerCase())) ||
          fullPool.find(
            (w) =>
              w.trim() &&
              !usedLower.has(w.trim().toLowerCase()) &&
              !r.usedWordsInMatchRef.current.has(normalizeGuess(w))
          ) ||
          fullPool.find((w) => w.trim() && !usedLower.has(w.trim().toLowerCase())) ||
          offered[0] ||
          'Đũa phép';
      }
      usedLower.add(secretWord.toLowerCase());
      r.usedWordsInMatchRef.current.add(normalizeGuess(secretWord));
      return {
        ...p,
        secretWord,
        isDrawer: true,
        hasGuessed: false,
        solvedOpponentIds: [],
        solvedByPlayerIds: [],
      };
    });

    const hostWord = updatedPlayers.find((p) => p.id === r.currentUserId.current)?.secretWord || '';
    r.currentWordRef.current = hostWord;
    s.setCurrentWord(hostWord);
    r.playersRef.current = updatedPlayers;
    s.setPlayers(updatedPlayers);

    r.timeLeftRef.current = roundDuration;
    s.setTimeLeft(roundDuration);
    r.phaseRef.current = 'drawing';
    s.setPhase('drawing');
    s.setMobileTab('canvas');
    s.setIncomingDrawActions([]);
    s.setOpponentDrawActions({});
    s.setMyRushDrawActions([]);
    s.setCanvasResetKey((k) => k + 1);
    r.roomServiceRef.current?.broadcastDraw({ type: 'clear' });

    const sysMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      text: '⚡ ĐUỔI HÌNH BẮT CHỮ BẮT ĐẦU! Tất cả các phù thủy cùng lúc múa đũa vẽ và soi tranh đối thủ để giải mã!',
      type: 'system',
      timestamp: Date.now(),
    };
    s.setMessages((prev) => appendBoundedMessage(prev, sysMsg));
    r.roomServiceRef.current?.broadcastChat(sysMsg);

    s.broadcastGameState({
      phase: 'drawing',
      timeLeft: roundDuration,
      mode: cfg.mode,
      players: updatedPlayers,
    });

    updatedPlayers.forEach((p) => {
      if (!p.isBot && p.id !== r.currentUserId.current && p.secretWord) {
        r.roomServiceRef.current?.sendPrivateWord(p.id, p.secretWord);
      }
    });

    s.clearBotTimeouts();
    updatedPlayers
      .filter((p) => p.isBot && p.secretWord)
      .forEach((bot) => {
        const botStrokes = generateProceduralDrawing(bot.secretWord!, bot.id);
        botStrokes.forEach((action, idx) => {
          const timeoutId = setTimeout(() => {
            if (r.turnTokenRef.current !== turnToken || r.phaseRef.current !== 'drawing') return;
            s.setOpponentDrawActions((prev) => {
              const nextMap = {
                ...prev,
                [bot.id]: appendCompactDrawAction(prev[bot.id] || [], action),
              };
              r.opponentDrawActionsRef.current = nextMap;
              return nextMap;
            });
            r.roomServiceRef.current?.broadcastDraw(action);
          }, 1000 + (idx + 1) * 750);
          r.botTimeoutsRef.current.push(timeoutId);
        });
      });
  }, []);

  const recordRushPlayerChoice = useCallback(
    (playerId: string, chosenWord: string) => {
      const { refs: r } = ctxRef.current;
      if (r.currentUserId.current !== r.hostIdRef.current) return;
      if (r.phaseRef.current !== 'selecting_word') return;
      r.rushPickedWordsRef.current.set(playerId, chosenWord);

      const allHumansPicked = r.playersRef.current
        .filter((p) => !p.isBot)
        .every((h) => r.rushPickedWordsRef.current.has(h.id));

      if (allHumansPicked) {
        launchRushDrawingPhase();
      }
    },
    [launchRushDrawingPhase]
  );

  return {
    launchRushDrawingPhase,
    recordRushPlayerChoice,
  };
}

