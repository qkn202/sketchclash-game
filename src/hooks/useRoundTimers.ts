import { useCallback, useEffect, type MutableRefObject } from 'react';
import type { GamePhase, Player } from '../types';
import { getBotGuess } from '../services/botEngine';
import { soundManager } from '../utils/audio';
import type { SharedGameRefs } from './gameControllerTypes';

interface UseRoundTimersParams {
  refs: SharedGameRefs;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  phase: GamePhase;
  drawTime: number;
  revealRandomLetter: () => void;
  handleRoundEndRef: MutableRefObject<() => void>;
  handlePlayerGuessRef: MutableRefObject<
    (sender: Player, text: string, targetOpponentId?: string) => void
  >;
}

/**
 * Manages the 1-second authoritative/mirrored countdowns for `selecting_word`
 * and `drawing`, letter-hint reveals, and AI bot guessing ticks.
 */
export function useRoundTimers({
  refs,
  setTimeLeft,
  phase,
  drawTime,
  revealRandomLetter,
  handleRoundEndRef,
  handlePlayerGuessRef,
}: UseRoundTimersParams): void {
  const {
    currentUserId,
    hostIdRef,
    roomConfigRef,
    timeLeftRef,
    playersRef,
    currentWordRef,
  } = refs;

  const simulateBotGuesses = useCallback(
    (secondsLeft: number) => {
      if (hostIdRef.current && currentUserId.current !== hostIdRef.current) return;
      const cfg = roomConfigRef.current;
      const currentList = playersRef.current;

      if (cfg.mode === 'rush_draw') {
        currentList.forEach((bot) => {
          if (bot.isBot) {
            const unsolvedOpponents = currentList.filter(
              (o) => o.id !== bot.id && !(bot.solvedOpponentIds || []).includes(o.id) && o.secretWord
            );
            if (unsolvedOpponents.length > 0 && Math.random() < 0.08) {
              const targetOpp =
                unsolvedOpponents[Math.floor(Math.random() * unsolvedOpponents.length)];
              const isAccurate = secondsLeft < (cfg.drawTime || 90) * 0.65 && Math.random() < 0.35;
              const guess = getBotGuess(targetOpp.secretWord!, cfg.language, isAccurate);
              handlePlayerGuessRef.current(bot, guess);
            }
          }
        });
        return;
      }

      const word = currentWordRef.current;
      if (!word) return;
      currentList.forEach((p) => {
        if (p.isBot && !p.isDrawer && !p.hasGuessed && Math.random() < 0.08) {
          const isAccurate = secondsLeft < (cfg.drawTime || 60) * 0.65 && Math.random() < 0.45;
          const guess = getBotGuess(word, cfg.language, isAccurate);
          handlePlayerGuessRef.current(p, guess);
        }
      });
    },
    [currentUserId, currentWordRef, handlePlayerGuessRef, hostIdRef, playersRef, roomConfigRef]
  );

  // Word-selection & round-end countdown timer so header clock & overlay share one authoritative
  // countdown. Wall-clock based (same rationale as the drawing timer above) so a
  // throttled background tab shows the real remaining time instead of freezing.
  useEffect(() => {
    if (phase !== 'selecting_word' && phase !== 'round_end') return;
    const initial = timeLeftRef.current;
    const deadline = Date.now() + Math.max(0, initial) * 1000;
    const timer = setInterval(() => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      timeLeftRef.current = next;
      setTimeLeft(next);
      if (phase === 'selecting_word' && next > 0 && next <= 5) {
        soundManager.playTick();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeftRef, setTimeLeft]);

  // Drawing countdown timer (pure state updates outside updater for StrictMode safety)
  useEffect(() => {
    if (phase !== 'drawing') return;

    // Wall-clock based so a throttled/background tab can't stall the round. Browsers
    // clamp background-tab setInterval to ~1/min, so a naive "decrement by 1" timer
    // would freeze the host's round-end for minutes and freeze every player. Instead
    // we capture a deadline and recompute remaining from Date.now() on each tick; even
    // infrequent ticks land the countdown at the correct wall-clock value.
    const initial = timeLeftRef.current || roomConfigRef.current.drawTime || drawTime || 60;
    const deadline = Date.now() + Math.max(0, initial) * 1000;
    let ended = false;

    const timer = setInterval(() => {
      if (ended) return;
      const remainingMs = deadline - Date.now();
      const nextTime = Math.max(0, Math.ceil(remainingMs / 1000));
      timeLeftRef.current = nextTime;
      setTimeLeft(nextTime);

      if (nextTime <= 0) {
        ended = true;
        clearInterval(timer);
        if (currentUserId.current === hostIdRef.current) {
          handleRoundEndRef.current();
        }
        return;
      }

      if (nextTime <= 10) {
        soundManager.playTick();
      }

      const total = roomConfigRef.current.drawTime || drawTime || 60;
      const midTime = Math.floor(total / 2);
      const quarterTime = Math.floor(total / 4);

      if (
        (nextTime === midTime || nextTime === quarterTime) &&
        currentUserId.current === hostIdRef.current
      ) {
        revealRandomLetter();
      }

      simulateBotGuesses(nextTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [
    phase,
    drawTime,
    currentUserId,
    hostIdRef,
    roomConfigRef,
    timeLeftRef,
    revealRandomLetter,
    simulateBotGuesses,
    setTimeLeft,
    handleRoundEndRef,
  ]);
}

