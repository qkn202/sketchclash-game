import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type {
  ChatMessage,
  DrawAction,
  GamePhase,
  Player,
  RelayChain,
  RelayEntry,
  RelayPublicState,
  RelayReactionEmoji,
  RelayTaskAssignment,
} from '../types';
import {
  generateBotRelayGuess,
  generateRelayBotDrawing,
  pickRandomRelayPrompt,
  scoreRelayGuessSimilarity,
} from '../data/partyModesData';
import { appendBoundedMessage, type SharedGameRefs, type SharedGameSetters } from './gameControllerTypes';
import { runDirectionalViewTransition } from '../utils/canvasHelpers';
import { soundManager } from '../utils/audio';

export const RELAY_PROMPT_SECONDS = 35;
export const RELAY_GUESS_SECONDS = 40;

export function getRelayStepKind(stepIdx: number): 'prompt' | 'draw' | 'guess' {
  if (stepIdx === 0) return 'prompt';
  return stepIdx % 2 === 1 ? 'draw' : 'guess';
}

export function getRelayPhaseForStep(kind: 'prompt' | 'draw' | 'guess'): GamePhase {
  if (kind === 'prompt') return 'relay_prompt';
  if (kind === 'draw') return 'relay_draw';
  return 'relay_guess';
}

export function computeRelayShowcaseBonuses(chains: RelayChain[]): Map<string, number> {
  const bonusByPlayer = new Map<string, number>();
  chains.forEach((chain) => {
    const originPrompt = chain.entries[0]?.text || '';
    chain.entries.forEach((entry, idx) => {
      bonusByPlayer.set(entry.authorId, (bonusByPlayer.get(entry.authorId) || 0) + 60);
      if (entry.kind === 'guess' && entry.text && scoreRelayGuessSimilarity(originPrompt, entry.text)) {
        bonusByPlayer.set(entry.authorId, (bonusByPlayer.get(entry.authorId) || 0) + 90);
        const prevDrawer = chain.entries[idx - 1];
        if (prevDrawer) {
          bonusByPlayer.set(prevDrawer.authorId, (bonusByPlayer.get(prevDrawer.authorId) || 0) + 90);
        }
      }
    });
  });
  return bonusByPlayer;
}

export function appendStepSubmissionsToChains(
  ring: Player[],
  chains: RelayChain[],
  stepIdx: number,
  submissions: Map<string, { text?: string; actions?: DrawAction[] }>,
  lang: 'vi' | 'en',
  usedPrompts: Set<string>
): void {
  const kind = getRelayStepKind(stepIdx);
  ring.forEach((player, pIdx) => {
    const chainIdx = (pIdx + stepIdx) % chains.length;
    const chain = chains[chainIdx];
    if (!chain) return;

    const submitted = submissions.get(player.id);
    const prevEntry = chain.entries[chain.entries.length - 1];

    let entry: RelayEntry;
    if (kind === 'prompt') {
      const text = submitted?.text?.trim() || pickRandomRelayPrompt(lang, usedPrompts);
      entry = {
        stepIndex: stepIdx,
        kind: 'prompt',
        authorId: player.id,
        authorName: player.name,
        text,
        reactions: {},
      };
    } else if (kind === 'draw') {
      const actions =
        submitted?.actions && submitted.actions.length > 0
          ? submitted.actions
          : generateRelayBotDrawing(prevEntry?.text || 'Đũa phép', player.id);
      entry = {
        stepIndex: stepIdx,
        kind: 'draw',
        authorId: player.id,
        authorName: player.name,
        actions,
        reactions: {},
      };
    } else {
      const fallbackSource = chain.entries[stepIdx - 2]?.text || '';
      const text = submitted?.text?.trim() || generateBotRelayGuess(fallbackSource, lang);
      entry = {
        stepIndex: stepIdx,
        kind: 'guess',
        authorId: player.id,
        authorName: player.name,
        text,
        reactions: {},
      };
    }
    chain.entries.push(entry);
  });
}

export function buildPlayerRelayTask(
  chain: RelayChain,
  stepIdx: number,
  totalSteps: number,
  kind: 'prompt' | 'draw' | 'guess'
): RelayTaskAssignment {
  const lastEntry = chain.entries[chain.entries.length - 1];
  return {
    stepIndex: stepIdx,
    totalSteps,
    chainId: chain.chainId,
    chainOwnerName: chain.ownerName,
    kind,
    previousPrompt: kind === 'draw' ? lastEntry?.text || 'Đũa phép Hogwarts' : undefined,
    previousDrawing: kind === 'guess' ? lastEntry?.actions || [] : undefined,
    previousAuthorName: lastEntry?.authorName,
  };
}

export function applyReactionToChains(
  chains: RelayChain[],
  voterId: string,
  chainId: string,
  stepIndex: number,
  emoji: RelayReactionEmoji
): { nextChains: RelayChain[]; targetAuthorId: string | null } {
  let targetAuthorId: string | null = null;
  const nextChains = chains.map((c) => {
    if (c.chainId !== chainId) return c;
    return {
      ...c,
      entries: c.entries.map((entry) => {
        if (entry.stepIndex !== stepIndex) return entry;
        targetAuthorId = entry.authorId;
        const prevMap = entry.reactions || {};
        const existing = prevMap[emoji] || [];
        if (existing.includes(voterId)) return entry;
        return {
          ...entry,
          reactions: { ...prevMap, [emoji]: [...existing, voterId] },
        };
      }),
    };
  });
  return { nextChains, targetAuthorId };
}

export function useRelayShowcaseControls(
  refs: SharedGameRefs,
  setters: SharedGameSetters,
  relayChainsRef: MutableRefObject<RelayChain[]>,
  relayStateRef: MutableRefObject<RelayPublicState | null>,
  setRelayState: Dispatch<SetStateAction<RelayPublicState | null>>,
  relayAwardedReactionsRef: MutableRefObject<Set<string>>
) {
  const enterRelayShowcase = useCallback(() => {
    const chains = relayChainsRef.current;
    const bonusByPlayer = computeRelayShowcaseBonuses(chains);
    const updatedPlayers = refs.playersRef.current.map((p) => ({
      ...p,
      isDrawer: false,
      hasGuessed: false,
      score: p.score + (bonusByPlayer.get(p.id) || 0),
    }));
    refs.playersRef.current = updatedPlayers;
    setters.setPlayers(updatedPlayers);

    const showcasePublic: RelayPublicState = {
      stepIndex: chains[0]?.entries.length || 3,
      totalSteps: chains[0]?.entries.length || 3,
      submittedPlayerIds: [],
      showcaseChains: chains,
      showcaseChainIndex: 0,
      showcaseRevealedCount: 1,
    };

    soundManager.playSpellVfx();
    refs.phaseRef.current = 'relay_showcase';
    setters.setPhase('relay_showcase');
    refs.timeLeftRef.current = 0;
    setters.setTimeLeft(0);
    relayStateRef.current = showcasePublic;
    setRelayState(showcasePublic);

    const sysMsg: ChatMessage = {
      id: `relay_show_${Date.now()}`,
      text: '📖 Nhật Ký Tam Sao Thất Bản đã mở! Cùng lật mở từng cuộn giấy và thả biểu cảm để tặng +15 điểm!',
      type: 'system',
      timestamp: Date.now(),
    };
    setters.setMessages((m) => appendBoundedMessage(m, sysMsg));
    refs.roomServiceRef.current?.broadcastChat(sysMsg);
    setters.broadcastGameState({
      phase: 'relay_showcase',
      timeLeft: 0,
      players: updatedPlayers,
      relayState: showcasePublic,
    });
  }, [refs, relayChainsRef, relayStateRef, setRelayState, setters]);
  const applyShowcaseNavOnHost = useCallback(
    (direction: 'forward' | 'backward', explicitIndex?: number) => {
      const cur = relayStateRef.current;
      const chains = cur?.showcaseChains || [];
      if (!cur || chains.length <= 1) return;
      const nextIdx =
        typeof explicitIndex === 'number' && explicitIndex >= 0 && explicitIndex < chains.length
          ? explicitIndex
          : (cur.showcaseChainIndex + (direction === 'forward' ? 1 : -1) + chains.length) % chains.length;
      if (nextIdx === cur.showcaseChainIndex) return;

      runDirectionalViewTransition(direction, () => {
        const updated: RelayPublicState = { ...cur, showcaseChainIndex: nextIdx, showcaseRevealedCount: 1 };
        relayStateRef.current = updated;
        setRelayState(updated);
        refs.roomServiceRef.current?.sendPartyEvent({ kind: 'relay_showcase_nav', direction, chainIndex: nextIdx });
        setters.broadcastGameState({ relayState: updated });
      });
    },
    [refs, relayStateRef, setRelayState, setters]
  );

  const handleRelayShowcaseNav = useCallback(
    (direction: 'forward' | 'backward') => {
      const cur = relayStateRef.current;
      const chains = cur?.showcaseChains || [];
      if (!cur || chains.length <= 1) return;
      const nextIdx = (cur.showcaseChainIndex + (direction === 'forward' ? 1 : -1) + chains.length) % chains.length;
      soundManager.playClick();

      if (refs.currentUserId.current === refs.hostIdRef.current) {
        applyShowcaseNavOnHost(direction, nextIdx);
      } else {
        refs.roomServiceRef.current?.sendPartyEvent({ kind: 'relay_showcase_nav', direction, chainIndex: nextIdx });
      }
    },
    [applyShowcaseNavOnHost, refs, relayStateRef]
  );

  const handleRelayRevealStep = useCallback(() => {
    const cur = relayStateRef.current;
    const chain = cur?.showcaseChains?.[cur.showcaseChainIndex];
    if (!cur || !chain || cur.showcaseRevealedCount >= chain.entries.length) return;
    soundManager.playSpellVfx();
    const nextCount = cur.showcaseRevealedCount + 1;
    const updated: RelayPublicState = { ...cur, showcaseRevealedCount: nextCount };
    relayStateRef.current = updated;
    setRelayState(updated);
    if (refs.currentUserId.current === refs.hostIdRef.current) {
      setters.broadcastGameState({ relayState: updated });
    } else {
      refs.roomServiceRef.current?.sendPartyEvent({ kind: 'relay_showcase_reveal', revealedCount: nextCount });
    }
  }, [refs, relayStateRef, setRelayState, setters]);

  const applyRelayReactionOnHost = useCallback(
    (voterId: string, chainId: string, stepIndex: number, emoji: RelayReactionEmoji) => {
      const cur = relayStateRef.current;
      if (!cur?.showcaseChains) return;
      const { nextChains, targetAuthorId } = applyReactionToChains(cur.showcaseChains, voterId, chainId, stepIndex, emoji);
      const rewardKey = `${chainId}:${stepIndex}:${voterId}`;
      let updatedPlayers = refs.playersRef.current;
      if (targetAuthorId && targetAuthorId !== voterId && !relayAwardedReactionsRef.current.has(rewardKey)) {
        relayAwardedReactionsRef.current.add(rewardKey);
        updatedPlayers = refs.playersRef.current.map((p) => (p.id === targetAuthorId ? { ...p, score: p.score + 15 } : p));
        refs.playersRef.current = updatedPlayers;
        setters.setPlayers(updatedPlayers);
      }
      const updatedPublic: RelayPublicState = { ...cur, showcaseChains: nextChains };
      relayStateRef.current = updatedPublic;
      setRelayState(updatedPublic);
      setters.broadcastGameState({ players: updatedPlayers, relayState: updatedPublic });
    },
    [refs, relayAwardedReactionsRef, relayStateRef, setRelayState, setters]
  );

  const handleRelayReaction = useCallback(
    (chainId: string, stepIndex: number, emoji: RelayReactionEmoji) => {
      soundManager.playSparkle();
      if (refs.currentUserId.current === refs.hostIdRef.current) {
        applyRelayReactionOnHost(refs.currentUserId.current, chainId, stepIndex, emoji);
      } else {
        refs.roomServiceRef.current?.sendPartyEvent({ kind: 'relay_reaction', chainId, stepIndex, emoji });
      }
    },
    [applyRelayReactionOnHost, refs]
  );

  const handleFinishRelayShowcase = useCallback(() => {
    if (refs.currentUserId.current !== refs.hostIdRef.current) return;
    soundManager.playVictory();
    refs.phaseRef.current = 'game_over';
    setters.setPhase('game_over');
    setters.broadcastGameState({ phase: 'game_over', players: refs.playersRef.current });
  }, [refs, setters]);

  return {
    enterRelayShowcase,
    applyShowcaseNavOnHost,
    handleRelayShowcaseNav,
    handleRelayRevealStep,
    applyRelayReactionOnHost,
    handleRelayReaction,
    handleFinishRelayShowcase,
  };
}
