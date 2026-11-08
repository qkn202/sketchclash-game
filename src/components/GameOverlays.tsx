import React from 'react';
import type { DrawAction, GamePhase, Player, RoomConfig } from '../types';
import { WordPickerModal } from './WordPickerModal';
import { InspectBoardModal } from './InspectBoardModal';
import { VictoryPodium } from './VictoryPodium';

export const NoticeToastBanner: React.FC<{ message: string | null }> = ({ message }) => (
  <div
    role="status"
    aria-live="polite"
    style={
      message
        ? {
            position: 'fixed',
            top: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #740001 0%, #261601 100%)',
            border: '2px solid var(--hogwarts-gold)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.85)',
          }
        : { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }
    }
  >
    {message || ''}
  </div>
);

interface GameOverlaysProps {
  phase: GamePhase;
  roomConfig: RoomConfig;
  players: Player[];
  currentPlayer: Player;
  currentDrawer: Player | null;
  currentUserId: string;
  currentDrawerId: string | null;
  isHost: boolean;
  timeLeft: number;
  currentWord: string;
  wordChoices: string[];
  hasSubmittedRushWord: boolean;
  canvasResetKey: number;
  inspectingPlayerId: string | null;
  inspectFeedback: string | null;
  opponentDrawActions: Record<string, DrawAction[]>;
  solvedWordsMap: Record<string, string>;
  onSelectWord: (word: string) => void;
  onClearInspectFeedback: () => void;
  onCloseInspect: () => void;
  onInspectGuess: (opponentId: string, text: string) => void;
  onPlayAgain: (returnToWaitingRoom?: boolean) => void;
  onBackToLobby: () => void;
}

export const GameOverlays: React.FC<GameOverlaysProps> = ({
  phase,
  roomConfig,
  players,
  currentPlayer,
  currentDrawer,
  currentUserId,
  currentDrawerId,
  isHost,
  timeLeft,
  currentWord,
  wordChoices,
  hasSubmittedRushWord,
  canvasResetKey,
  inspectingPlayerId,
  inspectFeedback,
  opponentDrawActions,
  solvedWordsMap,
  onSelectWord,
  onClearInspectFeedback,
  onCloseInspect,
  onInspectGuess,
  onPlayAgain,
  onBackToLobby,
}) => {
  const inspectedOpponent =
    phase === 'drawing' && inspectingPlayerId
      ? players.find((p) => p.id === inspectingPlayerId) || null
      : null;

  return (
    <>
      {phase === 'selecting_word' && (
        <WordPickerModal
          key={`picker_${canvasResetKey}_${currentDrawer?.id || 'rush'}`}
          isDrawer={
            roomConfig.mode === 'rush_draw'
              ? !hasSubmittedRushWord
              : currentUserId === currentDrawerId
          }
          drawerName={
            roomConfig.mode === 'rush_draw'
              ? hasSubmittedRushWord
                ? `Các phù thủy khác (Bạn đã chọn: "${currentWord}")`
                : `${currentPlayer?.name || 'Bạn'} (Đuổi Hình Bắt Chữ)`
              : roomConfig.mode === 'dual_coop'
              ? players
                  .filter((p) => p.isDrawer)
                  .map((p) => p.name)
                  .join(' & ') || 'Hai Pháp Sư'
              : roomConfig.mode === 'all_draw'
              ? currentDrawer?.name || 'Đại Diện Họa Sĩ'
              : currentDrawer?.name || 'Họa sĩ'
          }
          wordChoices={wordChoices}
          timeLeft={timeLeft}
          onSelectWord={onSelectWord}
        />
      )}

      {inspectedOpponent && (() => {
        const isSolved = (currentPlayer.solvedOpponentIds || []).includes(inspectedOpponent.id);
        return (
          <InspectBoardModal
            opponent={inspectedOpponent}
            actions={opponentDrawActions[inspectedOpponent.id] || []}
            isSolved={isSolved}
            solvedWord={
              isSolved ? solvedWordsMap[inspectedOpponent.id] || inspectedOpponent.secretWord : undefined
            }
            feedback={inspectFeedback}
            onClearFeedback={onClearInspectFeedback}
            onClose={onCloseInspect}
            onGuess={(text) => onInspectGuess(inspectedOpponent.id, text)}
          />
        );
      })()}

      {phase === 'game_over' && (
        <VictoryPodium
          players={players}
          isHost={isHost}
          currentPlayerId={currentUserId}
          onPlayAgain={onPlayAgain}
          onBackToLobby={onBackToLobby}
        />
      )}
    </>
  );
};

