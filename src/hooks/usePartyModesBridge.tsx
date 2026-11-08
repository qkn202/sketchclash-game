import React, { useCallback } from 'react';
import type {
  DrawAction,
  GamePhase,
  PartyNetworkEvent,
  PartyPrivatePayload,
  Player,
  RoomConfig,
} from '../types';
import type { SharedGameRefs, SharedGameSetters } from './gameControllerTypes';
import type { PartySyncBridge } from './useRoomConnection';
import { executePlayAgainReset } from './roomSyncHelpers';
import { useRelayController } from './useRelayController';
import { useImpostorController } from './useImpostorController';
import { RelayStageView } from '../components/RelayStageView';
import { ImpostorStageView } from '../components/ImpostorStageView';

interface UsePartyModesBridgeParams {
  refs: SharedGameRefs;
  setters: SharedGameSetters;
  phase: GamePhase;
  round: number;
  roomConfig: RoomConfig;
  players: Player[];
  currentUserId: string;
  isHost: boolean;
  revealedWord: string;
  roundEndMessage: string | null;
  myRushDrawActions: DrawAction[];
  incomingDrawActions: DrawAction[];
  canvasResetKey: number;
  onBroadcastLocalDraw: (action: DrawAction) => void;
  startNewTurn: (turnIdx: number, newRound?: number, customPlayers?: Player[]) => void;
}

export function usePartyModesBridge({
  refs,
  setters,
  phase,
  round,
  roomConfig,
  players,
  currentUserId,
  isHost,
  revealedWord,
  roundEndMessage,
  myRushDrawActions,
  incomingDrawActions,
  canvasResetKey,
  onBroadcastLocalDraw,
  startNewTurn,
}: UsePartyModesBridgeParams) {
  const {
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
  } = useRelayController(refs, setters, phase);

  const {
    impostorState,
    impostorStateRef,
    myImpostorRole,
    mySelectedVoteId,
    startImpostorRound,
    resetImpostorState,
    notifyLocalImpostorStrokeDone,
    submitMyImpostorVote,
    submitMyImpostorCounterGuess,
    handleIncomingImpostorEvent,
    handleImpostorPlayerRemoved,
    applySyncedImpostorState,
    receivePrivateImpostorRole,
    resendImpostorRoleToJoiner,
    isImpostorSpoilerBlocked,
  } = useImpostorController(refs, setters, phase);

  const resetPartyStates = useCallback(() => {
    resetRelayState();
    resetImpostorState();
  }, [resetRelayState, resetImpostorState]);

  const handlePlayAgainUnified = useCallback(
    (returnToWaitingRoom: boolean = false) => {
      resetPartyStates();
      executePlayAgainReset(refs, setters, returnToWaitingRoom, (turnIdx, newRound, cleanPlayers) => {
        const activeMode = refs.roomConfigRef.current.mode;
        if (activeMode === 'relay_phone') {
          startRelayMatch(cleanPlayers);
        } else if (activeMode === 'polyjuice_impostor') {
          startImpostorRound(1, cleanPlayers);
        } else {
          startNewTurn(turnIdx, newRound, cleanPlayers);
        }
      });
    },
    [refs, setters, resetPartyStates, startRelayMatch, startImpostorRound, startNewTurn]
  );

  const partySync: PartySyncBridge = {
    relayStateRef,
    impostorStateRef,
    startRelayMatch,
    startImpostorRound,
    resetPartyStates,
    onPartyEvent: (event: PartyNetworkEvent, senderId: string) => {
      handleIncomingRelayEvent(event, senderId);
      handleIncomingImpostorEvent(event, senderId);
    },
    onPartyPrivate: (data: PartyPrivatePayload) => {
      if (data.kind === 'relay_task') {
        receivePrivateRelayTask(data.task);
      } else if (data.kind === 'impostor_role') {
        receivePrivateImpostorRole(data.role);
      }
    },
    applySyncedRelayState,
    applySyncedImpostorState,
    resendPartyPrivateToJoiner: (requesterId: string) => {
      resendRelayStateToJoiner(requesterId);
      resendImpostorRoleToJoiner(requesterId);
    },
    onPartyPlayerRemoved: (removedId: string) => {
      const fallback = () => {
        setters.setNoticeToast('Không đủ phù thủy để tiếp tục — đã quay về Phòng Chờ.');
        handlePlayAgainUnified(true);
      };
      const activeMode = refs.roomConfigRef.current.mode;
      if (activeMode === 'relay_phone') {
        handleRelayPlayerRemoved(fallback);
      } else if (activeMode === 'polyjuice_impostor') {
        handleImpostorPlayerRemoved(removedId, fallback);
      }
    },
    onPartyHostPromoted: () => {
      const curPlayers = refs.playersRef.current;
      const activeMode = refs.roomConfigRef.current.mode;
      const minKeep = activeMode === 'polyjuice_impostor' ? 3 : 2;
      if (curPlayers.length < minKeep) {
        setters.setNoticeToast('Không đủ phù thủy để tiếp tục — đã quay về Phòng Chờ.');
        handlePlayAgainUnified(true);
        return;
      }
      setters.setNoticeToast('Chủ phòng cũ đã rời đi — bạn trở thành Chủ Phòng và khởi động lại vòng hiện tại!');
      if (activeMode === 'relay_phone') {
        startRelayMatch(curPlayers);
      } else if (activeMode === 'polyjuice_impostor') {
        startImpostorRound(refs.roundRef.current, curPlayers);
      }
    },
  };

  const displayRoomConfig: RoomConfig =
    roomConfig.mode === 'relay_phone' && relayState?.totalSteps
      ? { ...roomConfig, totalRounds: relayState.totalSteps }
      : roomConfig;

  let renderPartyStage: ((toolbarSlot: HTMLElement | null) => React.ReactNode) | undefined;
  if (roomConfig.mode === 'relay_phone') {
    renderPartyStage = (toolbarSlot) => (
      <RelayStageView
        phase={phase}
        language={roomConfig.language}
        players={players}
        currentUserId={currentUserId}
        isHost={isHost}
        relayState={relayState}
        myRelayTask={myRelayTask}
        hasSubmittedStep={hasSubmittedRelayStep}
        myRelayDraftActions={myRelayDraftActions}
        myRelayDraftTextRef={myRelayDraftTextRef}
        relayCanvasResetKey={relayCanvasResetKey}
        toolbarPortalTarget={toolbarSlot}
        onLocalDraw={recordLocalRelayDraw}
        onSubmitStep={submitMyRelayStep}
        onShowcaseNav={handleRelayShowcaseNav}
        onShowcaseRevealNext={handleRelayRevealStep}
        onReaction={handleRelayReaction}
        onFinishShowcase={handleFinishRelayShowcase}
      />
    );
  } else if (roomConfig.mode === 'polyjuice_impostor') {
    renderPartyStage = (toolbarSlot) => (
      <ImpostorStageView
        phase={phase}
        round={round}
        players={players}
        currentUserId={currentUserId}
        impostorState={impostorState}
        myImpostorRole={myImpostorRole}
        mySelectedVoteId={mySelectedVoteId}
        revealedWord={revealedWord}
        roundEndMessage={roundEndMessage}
        boardActions={myRushDrawActions}
        incomingActions={incomingDrawActions}
        canvasResetKey={canvasResetKey}
        toolbarPortalTarget={toolbarSlot}
        onBroadcastDraw={onBroadcastLocalDraw}
        onSingleStrokeComplete={notifyLocalImpostorStrokeDone}
        onSubmitVote={submitMyImpostorVote}
        onSubmitCounterGuess={submitMyImpostorCounterGuess}
      />
    );
  }

  return {
    partySync,
    displayRoomConfig,
    handlePlayAgainUnified,
    renderPartyStage,
    isImpostorSpoilerBlocked,
  };
}

