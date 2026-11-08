import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ChatMessage,
  DrawAction,
  GamePhase,
  PartyNetworkEvent,
  Player,
  RelayChain,
  RelayPublicState,
  RelayTaskAssignment,
} from '../types';
import { generateBotRelayGuess, generateRelayBotDrawing, pickRandomRelayPrompt } from '../data/partyModesData';
import { sanitizeIncomingDrawAction } from './networkAndRoomHelpers';
import { appendBoundedMessage, appendCompactDrawAction, type SharedGameRefs, type SharedGameSetters } from './gameControllerTypes';
import {
  appendStepSubmissionsToChains,
  buildPlayerRelayTask,
  getRelayPhaseForStep,
  getRelayStepKind,
  RELAY_GUESS_SECONDS,
  RELAY_PROMPT_SECONDS,
  useRelayShowcaseControls,
} from './relayChainHelpers';
import { runDirectionalViewTransition } from '../utils/canvasHelpers';
import { soundManager } from '../utils/audio';

export function useRelayController(
  refs: SharedGameRefs,
  setters: SharedGameSetters,
  phase: GamePhase
) {
  const [relayState, setRelayState] = useState<RelayPublicState | null>(null);
  const relayStateRef = useRef<RelayPublicState | null>(null);
  const [myRelayTask, setMyRelayTask] = useState<RelayTaskAssignment | null>(null);
  const myRelayTaskRef = useRef<RelayTaskAssignment | null>(null);
  const [hasSubmittedRelayStep, setHasSubmittedRelayStep] = useState<boolean>(false);
  const hasSubmittedRelayRef = useRef<boolean>(false);

  const [myRelayDraftActions, setMyRelayDraftActions] = useState<DrawAction[]>([]);
  const myRelayDraftActionsRef = useRef<DrawAction[]>([]);
  const myRelayDraftTextRef = useRef<string>('');
  const [relayCanvasResetKey, setRelayCanvasResetKey] = useState<number>(0);

  const relayChainsRef = useRef<RelayChain[]>([]);
  const relayRingPlayersRef = useRef<Player[]>([]);
  const relayAssignmentsByPlayerRef = useRef<Map<string, RelayTaskAssignment>>(new Map());
  const relayStepSubmissionsRef = useRef<Map<string, { text?: string; actions?: DrawAction[] }>>(new Map());
  const relayUsedPromptsRef = useRef<Set<string>>(new Set());
  const relayAwardedReactionsRef = useRef<Set<string>>(new Set());
  const isCommittingStepRef = useRef<boolean>(false);
  const beginRelayStepRef = useRef<(stepIdx: number, totalSteps: number) => void>(() => {});

  useEffect(() => { relayStateRef.current = relayState; }, [relayState]);
  useEffect(() => { myRelayTaskRef.current = myRelayTask; }, [myRelayTask]);
  useEffect(() => { hasSubmittedRelayRef.current = hasSubmittedRelayStep; }, [hasSubmittedRelayStep]);

  const resetRelayState = useCallback(() => {
    setRelayState(null);
    relayStateRef.current = null;
    setMyRelayTask(null);
    myRelayTaskRef.current = null;
    setHasSubmittedRelayStep(false);
    hasSubmittedRelayRef.current = false;
    myRelayDraftActionsRef.current = [];
    setMyRelayDraftActions([]);
    myRelayDraftTextRef.current = '';
    relayChainsRef.current = [];
    relayRingPlayersRef.current = [];
    relayAssignmentsByPlayerRef.current.clear();
    relayStepSubmissionsRef.current.clear();
    relayUsedPromptsRef.current.clear();
    relayAwardedReactionsRef.current.clear();
    isCommittingStepRef.current = false;
  }, []);

  const {
    enterRelayShowcase,
    applyShowcaseNavOnHost,
    handleRelayShowcaseNav,
    handleRelayRevealStep,
    applyRelayReactionOnHost,
    handleRelayReaction,
    handleFinishRelayShowcase,
  } = useRelayShowcaseControls(
    refs,
    setters,
    relayChainsRef,
    relayStateRef,
    setRelayState,
    relayAwardedReactionsRef
  );

  const commitRelayStepAndAdvance = useCallback(
    (stepIdx: number, totalSteps: number) => {
      if (
        isCommittingStepRef.current ||
        relayStateRef.current?.stepIndex !== stepIdx ||
        refs.phaseRef.current === 'relay_showcase'
      ) {
        return;
      }
      isCommittingStepRef.current = true;
      setters.clearBotTimeouts();

      appendStepSubmissionsToChains(
        relayRingPlayersRef.current,
        relayChainsRef.current,
        stepIdx,
        relayStepSubmissionsRef.current,
        refs.roomConfigRef.current.language || 'vi',
        relayUsedPromptsRef.current
      );

      isCommittingStepRef.current = false;
      if (stepIdx + 1 < totalSteps) {
        beginRelayStepRef.current(stepIdx + 1, totalSteps);
      } else {
        enterRelayShowcase();
      }
    },
    [enterRelayShowcase, refs.roomConfigRef, setters]
  );

  const recordHostRelaySubmission = useCallback(
    (playerId: string, stepIdx: number, data: { text?: string; actions?: DrawAction[] }) => {
      const currentPublic = relayStateRef.current;
      if (!currentPublic || currentPublic.stepIndex !== stepIdx) return;
      if (relayStepSubmissionsRef.current.has(playerId)) return;

      const sanitizedActions = data.actions
        ? data.actions
            .map((a) => sanitizeIncomingDrawAction(a))
            .filter((a): a is DrawAction => Boolean(a))
            .slice(0, 180)
        : undefined;

      relayStepSubmissionsRef.current.set(playerId, {
        text: data.text ? String(data.text).trim().slice(0, 110) : undefined,
        actions: sanitizedActions,
      });

      const activeIds = new Set(refs.playersRef.current.map((p) => p.id));
      const expectedRing = relayRingPlayersRef.current.filter((p) => activeIds.has(p.id));
      const submittedIds = Array.from(relayStepSubmissionsRef.current.keys());
      const nextPublic: RelayPublicState = { ...currentPublic, submittedPlayerIds: submittedIds };
      relayStateRef.current = nextPublic;
      setRelayState(nextPublic);
      setters.broadcastGameState({ relayState: nextPublic });

      if (expectedRing.every((p) => relayStepSubmissionsRef.current.has(p.id))) {
        commitRelayStepAndAdvance(stepIdx, currentPublic.totalSteps);
      }
    },
    [commitRelayStepAndAdvance, refs.playersRef, setters]
  );

  const beginRelayStep = useCallback(
    (stepIdx: number, totalSteps: number) => {
      setters.clearBotTimeouts();
      refs.turnTokenRef.current += 1;
      const stepToken = refs.turnTokenRef.current;
      relayStepSubmissionsRef.current.clear();
      relayAssignmentsByPlayerRef.current.clear();

      const ring = relayRingPlayersRef.current;
      const chains = relayChainsRef.current;
      const kind = getRelayStepKind(stepIdx);
      const nextPhase = getRelayPhaseForStep(kind);
      const cfg = refs.roomConfigRef.current;
      const stepDuration =
        kind === 'prompt' ? RELAY_PROMPT_SECONDS : kind === 'guess' ? RELAY_GUESS_SECONDS : cfg.drawTime || 60;

      setHasSubmittedRelayStep(false);
      hasSubmittedRelayRef.current = false;
      myRelayDraftActionsRef.current = [];
      setMyRelayDraftActions([]);
      myRelayDraftTextRef.current = '';
      setRelayCanvasResetKey((k) => k + 1);

      const nextPublic: RelayPublicState = {
        stepIndex: stepIdx,
        totalSteps,
        submittedPlayerIds: [],
        showcaseChainIndex: 0,
        showcaseRevealedCount: 1,
      };
      relayStateRef.current = nextPublic;
      setRelayState(nextPublic);

      refs.phaseRef.current = nextPhase;
      setters.setPhase(nextPhase);
      refs.roundRef.current = stepIdx + 1;
      setters.setRound(stepIdx + 1);
      refs.timeLeftRef.current = stepDuration;
      setters.setTimeLeft(stepDuration);

      const updatedPlayers = refs.playersRef.current.map((p) => ({
        ...p,
        isDrawer: kind === 'draw',
        hasGuessed: false,
      }));
      refs.playersRef.current = updatedPlayers;
      setters.setPlayers(updatedPlayers);

      setters.broadcastGameState({
        phase: nextPhase,
        round: stepIdx + 1,
        timeLeft: stepDuration,
        players: updatedPlayers,
        relayState: nextPublic,
      });

      ring.forEach((player, pIdx) => {
        const chain = chains[(pIdx + stepIdx) % chains.length];
        if (!chain) return;
        const assignment = buildPlayerRelayTask(chain, stepIdx, totalSteps, kind);
        relayAssignmentsByPlayerRef.current.set(player.id, assignment);

        if (player.id === refs.currentUserId.current) {
          myRelayTaskRef.current = assignment;
          setMyRelayTask(assignment);
        } else if (!player.isBot) {
          refs.roomServiceRef.current?.sendPartyPrivate(player.id, { kind: 'relay_task', task: assignment });
        } else {
          const tid = setTimeout(() => {
            if (refs.turnTokenRef.current !== stepToken) return;
            const lang = refs.roomConfigRef.current.language || 'vi';
            if (kind === 'prompt') {
              recordHostRelaySubmission(player.id, stepIdx, {
                text: pickRandomRelayPrompt(lang, relayUsedPromptsRef.current),
              });
            } else if (kind === 'draw') {
              recordHostRelaySubmission(player.id, stepIdx, {
                actions: generateRelayBotDrawing(assignment.previousPrompt || 'Đũa phép', player.id),
              });
            } else {
              const sourcePrompt = chain.entries[stepIdx - 2]?.text || '';
              recordHostRelaySubmission(player.id, stepIdx, {
                text: generateBotRelayGuess(sourcePrompt, lang),
              });
            }
          }, 1050 + pIdx * 380);
          refs.botTimeoutsRef.current.push(tid);
        }
      });
    },
    [recordHostRelaySubmission, refs, setters]
  );

  useEffect(() => { beginRelayStepRef.current = beginRelayStep; }, [beginRelayStep]);

  const startRelayMatch = useCallback(
    (customPlayers?: Player[]) => {
      const roster = customPlayers || refs.playersRef.current;
      if (roster.length === 0) return;

      relayUsedPromptsRef.current.clear();
      relayAwardedReactionsRef.current.clear();
      isCommittingStepRef.current = false;
      relayRingPlayersRef.current = [...roster];

      const totalSteps = roster.length <= 3 ? 3 : roster.length === 4 ? 4 : 5;
      relayChainsRef.current = roster.map((owner, idx) => ({
        chainId: `chain_${idx}_${owner.id}`,
        ownerId: owner.id,
        ownerName: owner.name,
        entries: [],
      }));

      const introMsg: ChatMessage = {
        id: `relay_start_${Date.now()}`,
        text: `📜 Cuộn Giấy Tam Sao Thất Bản bắt đầu (${totalSteps} chặng)! Hãy viết tình huống mở đầu thật lầy lội!`,
        type: 'system',
        timestamp: Date.now(),
      };
      setters.setMessages((m) => appendBoundedMessage(m, introMsg));
      refs.roomServiceRef.current?.broadcastChat(introMsg);
      beginRelayStep(0, totalSteps);
    },
    [beginRelayStep, refs, setters]
  );

  const submitMyRelayStep = useCallback(
    (rawText?: string, isAutoFallback: boolean = false) => {
      if (hasSubmittedRelayRef.current) return;
      const task = myRelayTaskRef.current;
      if (!task) return;

      const lang = refs.roomConfigRef.current.language || 'vi';
      let textPayload: string | undefined;
      let actionsPayload: DrawAction[] | undefined;

      if (task.kind === 'prompt' || task.kind === 'guess') {
        const candidate = (rawText ?? myRelayDraftTextRef.current).trim();
        if (!candidate && !isAutoFallback) return;
        textPayload =
          candidate ||
          (task.kind === 'prompt'
            ? pickRandomRelayPrompt(lang)
            : lang === 'vi'
            ? 'Phù thủy đang thi triển phép thuật bí ẩn'
            : 'A wizard casting a mysterious spell');
      } else {
        actionsPayload = myRelayDraftActionsRef.current;
      }

      if (!isAutoFallback) soundManager.playCorrect();
      hasSubmittedRelayRef.current = true;
      setHasSubmittedRelayStep(true);

      if (refs.currentUserId.current === refs.hostIdRef.current) {
        recordHostRelaySubmission(refs.currentUserId.current, task.stepIndex, {
          text: textPayload,
          actions: actionsPayload,
        });
      } else {
        refs.roomServiceRef.current?.sendPartyEvent({
          kind: 'relay_submit',
          stepIndex: task.stepIndex,
          chainId: task.chainId,
          text: textPayload,
          actions: actionsPayload,
        });
      }
    },
    [recordHostRelaySubmission, refs]
  );

  const recordLocalRelayDraw = useCallback(
    (action: DrawAction) => {
      const tagged: DrawAction = { ...action, drawerId: refs.currentUserId.current };
      setMyRelayDraftActions((prev) => {
        const next = appendCompactDrawAction(prev, tagged);
        myRelayDraftActionsRef.current = next;
        return next;
      });
    },
    [refs.currentUserId]
  );

  useEffect(() => {
    if (phase !== 'relay_prompt' && phase !== 'relay_draw' && phase !== 'relay_guess') return;
    const timer = setInterval(() => {
      const prev = refs.timeLeftRef.current;
      if (prev <= 1) {
        clearInterval(timer);
        refs.timeLeftRef.current = 0;
        setters.setTimeLeft(0);
        if (!hasSubmittedRelayRef.current) {
          submitMyRelayStep(undefined, true);
        }
        if (refs.currentUserId.current === refs.hostIdRef.current) {
          const pub = relayStateRef.current;
          if (pub) {
            const tid = setTimeout(() => {
              if (relayStateRef.current?.stepIndex === pub.stepIndex) {
                commitRelayStepAndAdvance(pub.stepIndex, pub.totalSteps);
              }
            }, 350);
            refs.botTimeoutsRef.current.push(tid);
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
  }, [phase, relayState?.stepIndex, commitRelayStepAndAdvance, refs, setters, submitMyRelayStep]);

  const handleIncomingRelayEvent = useCallback(
    (event: PartyNetworkEvent, senderId: string) => {
      const amHost = refs.currentUserId.current === refs.hostIdRef.current;
      if (!amHost && event.kind === 'relay_showcase_nav' && senderId === refs.hostIdRef.current) {
        runDirectionalViewTransition(event.direction, () => {
          setRelayState((prev) => {
            if (!prev) return prev;
            const next = { ...prev, showcaseChainIndex: event.chainIndex, showcaseRevealedCount: 1 };
            relayStateRef.current = next;
            return next;
          });
        });
        return;
      }
      if (!amHost) return;
      if (event.kind === 'relay_submit') {
        recordHostRelaySubmission(senderId, event.stepIndex, { text: event.text, actions: event.actions });
      } else if (event.kind === 'relay_reaction') {
        applyRelayReactionOnHost(senderId, event.chainId, event.stepIndex, event.emoji);
      } else if (event.kind === 'relay_showcase_reveal') {
        handleRelayRevealStep();
      } else if (event.kind === 'relay_showcase_nav') {
        applyShowcaseNavOnHost(event.direction, event.chainIndex);
      }
    },
    [applyRelayReactionOnHost, applyShowcaseNavOnHost, handleRelayRevealStep, recordHostRelaySubmission, refs]
  );

  const handleRelayPlayerRemoved = useCallback(
    (onInsufficientPlayers: () => void) => {
      if (refs.currentUserId.current !== refs.hostIdRef.current) return;
      const p = refs.phaseRef.current;
      if (p !== 'relay_prompt' && p !== 'relay_draw' && p !== 'relay_guess') return;
      if (refs.playersRef.current.length < 2) {
        onInsufficientPlayers();
        return;
      }
      const pub = relayStateRef.current;
      if (!pub) return;
      const activeIds = new Set(refs.playersRef.current.map((pl) => pl.id));
      const expectedRing = relayRingPlayersRef.current.filter((pl) => activeIds.has(pl.id));
      if (expectedRing.length > 0 && expectedRing.every((pl) => relayStepSubmissionsRef.current.has(pl.id))) {
        commitRelayStepAndAdvance(pub.stepIndex, pub.totalSteps);
      }
    },
    [commitRelayStepAndAdvance, refs]
  );

  const applySyncedRelayState = useCallback((incoming: RelayPublicState) => {
    setRelayState((prev) => {
      if (
        prev &&
        incoming.showcaseChains &&
        prev.showcaseChainIndex === incoming.showcaseChainIndex &&
        prev.showcaseRevealedCount === incoming.showcaseRevealedCount &&
        JSON.stringify(prev.showcaseChains) === JSON.stringify(incoming.showcaseChains)
      ) {
        return prev;
      }
      if (prev && prev.stepIndex !== incoming.stepIndex) {
        setHasSubmittedRelayStep(false);
        hasSubmittedRelayRef.current = false;
        myRelayDraftActionsRef.current = [];
        setMyRelayDraftActions([]);
        myRelayDraftTextRef.current = '';
        setRelayCanvasResetKey((k) => k + 1);
      }
      relayStateRef.current = incoming;
      return incoming;
    });
  }, []);

  const receivePrivateRelayTask = useCallback((task: RelayTaskAssignment) => {
    myRelayTaskRef.current = task;
    setMyRelayTask(task);
    setHasSubmittedRelayStep(false);
    hasSubmittedRelayRef.current = false;
    myRelayDraftActionsRef.current = [];
    setMyRelayDraftActions([]);
    myRelayDraftTextRef.current = '';
    setRelayCanvasResetKey((k) => k + 1);
  }, []);

  const resendRelayStateToJoiner = useCallback(
    (requesterId: string) => {
      const task = relayAssignmentsByPlayerRef.current.get(requesterId);
      if (task) {
        refs.roomServiceRef.current?.sendPartyPrivate(requesterId, { kind: 'relay_task', task });
      }
    },
    [refs.roomServiceRef]
  );

  return {
    relayState,
    relayStateRef,
    myRelayTask,
    hasSubmittedRelayStep,
    myRelayDraftActions,
    myRelayDraftTextRef,
    relayCanvasResetKey,
    startRelayMatch,
    resetRelayState,
    submitMyRelayStep,
    recordLocalRelayDraw,
    handleRelayShowcaseNav,
    handleRelayRevealStep,
    handleRelayReaction,
    handleFinishRelayShowcase,
    handleIncomingRelayEvent,
    handleRelayPlayerRemoved,
    applySyncedRelayState,
    receivePrivateRelayTask,
    resendRelayStateToJoiner,
  };
}
