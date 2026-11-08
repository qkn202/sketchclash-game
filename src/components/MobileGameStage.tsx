import React, { useState, useId } from 'react';
import type { Player, RoomConfig, DrawAction, ChatMessage, GamePhase } from '../types';
import { CanvasBoard } from './CanvasBoard';
import { ScoreBoard } from './ScoreBoard';
import { ChatPanel } from './ChatPanel';
import { MiniCanvasBoard } from './MiniCanvasBoard';
import { Send, Maximize2, Minimize2 } from 'lucide-react';
import { soundManager } from '../utils/audio';
import type { MobileTab } from './InGameStage';

interface MobileGameStageProps {
  mobileTab: MobileTab;
  isCanvasMaximized: boolean;
  onToggleMaximize: (next: boolean) => void;
  showMiniOpponentsStrip: boolean;
  roomConfig: RoomConfig;
  phase: GamePhase;
  round: number;
  players: Player[];
  opponents: Player[];
  currentPlayer: Player;
  currentDrawer: Player | null;
  coopPartner?: Player;
  currentUserId: string;
  isHost: boolean;
  isCurrentDrawer: boolean;
  displayWordForOverlay: string;
  roundEndMessage: string | null;
  messages: ChatMessage[];
  incomingDrawActions: DrawAction[];
  canvasResetKey: number;
  myRushDrawActions: DrawAction[];
  opponentDrawActions: Record<string, DrawAction[]>;
  getSolvedWord: (opp: Player, isSolved: boolean) => string | undefined;
  onBroadcastLocalDraw: (action: DrawAction) => void;
  onSendGuessOrChat: (text: string) => void;
  onAddBot: () => void;
  onRemovePlayer: (playerId: string) => void;
  onInspectOpponent: (playerId: string) => void;
  partyStageContent?: React.ReactNode;
}

export const MobileGameStage: React.FC<MobileGameStageProps> = ({
  mobileTab,
  isCanvasMaximized,
  onToggleMaximize,
  showMiniOpponentsStrip,
  roomConfig,
  phase,
  round,
  players,
  opponents,
  currentPlayer,
  currentDrawer,
  coopPartner,
  currentUserId,
  isHost,
  isCurrentDrawer,
  displayWordForOverlay,
  roundEndMessage,
  messages,
  incomingDrawActions,
  canvasResetKey,
  myRushDrawActions,
  opponentDrawActions,
  getSolvedWord,
  onBroadcastLocalDraw,
  onSendGuessOrChat,
  onAddBot,
  onRemovePlayer,
  onInspectOpponent,
  partyStageContent,
}) => {
  const inputBaseId = useId();
  const [mobileGuessInput, setMobileGuessInput] = useState('');

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Mobile Tab 1: Canvas */}
      <div
        style={{
          display: mobileTab === 'canvas' ? 'flex' : 'none',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          height: '100%',
          gap: '4px',
        }}
      >
        {partyStageContent ? (
          partyStageContent
        ) : (
          <>
        {roomConfig.mode === 'rush_draw' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', color: 'var(--hogwarts-gold)', fontWeight: 700 }} className="font-cinzel">
              🎨 BẢNG VẼ CỦA BẠN
            </span>
            <button
              type="button"
              onClick={() => onToggleMaximize(!isCanvasMaximized)}
              style={{
                background: isCanvasMaximized ? 'rgba(56, 189, 248, 0.2)' : 'rgba(212, 175, 55, 0.15)',
                border: `1px solid ${isCanvasMaximized ? 'var(--accent-cyan)' : 'var(--border-gold)'}`,
                color: isCanvasMaximized ? 'var(--accent-cyan)' : 'var(--hogwarts-gold)',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                minBlockSize: '28px',
              }}
            >
              {isCanvasMaximized ? <Minimize2 size={12} aria-hidden="true" /> : <Maximize2 size={12} aria-hidden="true" />}
              <span>{isCanvasMaximized ? 'Thu Nhỏ' : '⛶ Phóng To Bảng'}</span>
            </button>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <CanvasBoard
            isDrawer={roomConfig.mode === 'rush_draw' ? phase === 'drawing' : isCurrentDrawer && phase === 'drawing'}
            onBroadcastDraw={onBroadcastLocalDraw}
            incomingActions={incomingDrawActions}
            actionResetKey={canvasResetKey}
            mode={roomConfig.mode}
            coopPartnerName={coopPartner?.name}
            isLoneGuesser={currentPlayer.isLoneGuesser}
            phase={phase}
            currentWord={displayWordForOverlay}
            roundEndMessage={roundEndMessage}
            initialActions={myRushDrawActions}
          />
        </div>

        {showMiniOpponentsStrip && roomConfig.mode === 'rush_draw' && phase === 'drawing' && (
          <div className="rush-thumbnail-strip" style={{ padding: '2px 0' }}>
            {opponents.map((opp) => {
              const isSolved = (currentPlayer.solvedOpponentIds || []).includes(opp.id);
              return (
                <div key={opp.id} style={{ width: '110px', flexShrink: 0 }}>
                  <MiniCanvasBoard
                    actions={opponentDrawActions[opp.id] || []}
                    playerName={opp.name}
                    avatarColor={opp.avatar.color}
                    isSolved={isSolved}
                    solvedWord={getSolvedWord(opp, isSolved)}
                    onInspect={() => onInspectOpponent(opp.id)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {roomConfig.mode !== 'rush_draw' && !isCurrentDrawer && phase === 'drawing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {messages.length > 0 && (
              <div className="mobile-live-ticker-container">
                {messages.slice(-2).map((msg) => (
                  <div
                    key={msg.id}
                    className={`mobile-live-ticker ${msg.type === 'correct' ? 'correct' : msg.type === 'close' ? 'close' : 'normal'}`}
                  >
                    {msg.type === 'correct' && <span>🎉</span>}
                    {msg.type === 'close' && <span>⚠️</span>}
                    {msg.type === 'system' && <span>🪄</span>}
                    {msg.type === 'chat' && (
                      <span style={{ color: 'var(--accent-yellow)', fontWeight: 700 }}>{msg.playerName}:</span>
                    )}
                    <span>{msg.text}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mobile-quick-emojis">
              {['❤️', '😂', '👏', '🔥', '⚡', '🪄'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`Thả cảm xúc ${emoji}`}
                  onClick={() => {
                    soundManager.playToolSelect();
                    onSendGuessOrChat(emoji);
                  }}
                  className="mobile-emoji-pill"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!mobileGuessInput.trim()) return;
                soundManager.playClick();
                onSendGuessOrChat(mobileGuessInput.trim());
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
              <label htmlFor={`${inputBaseId}-mobile-guess`} className="visually-hidden">
                Gõ dự đoán tên bảo bối ma thuật
              </label>
              <input
                id={`${inputBaseId}-mobile-guess`}
                name="guess"
                type="text"
                maxLength={120}
                enterKeyHint="send"
                value={mobileGuessInput}
                onChange={(e) => setMobileGuessInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) {
                    e.preventDefault();
                  }
                }}
                placeholder={currentPlayer.hasGuessed ? 'Đã đoán đúng! Chat tự do...' : 'Gõ tên bảo bối ma thuật...'}
                style={{ flex: 1, padding: '10px 12px', fontSize: '16px' }}
              />
              <button
                type="submit"
                aria-label="Gửi dự đoán"
                disabled={!mobileGuessInput.trim()}
                className="btn-gold"
                style={{ padding: '0 16px', minBlockSize: '42px', borderRadius: '10px' }}
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </form>
          </div>
        )}
          </>
        )}
      </div>

      {/* Mobile Tab 2: Opponents Live Drawings */}
      {roomConfig.mode === 'rush_draw' && (
        <div
          style={{
            display: mobileTab === 'opponents' ? 'flex' : 'none',
            flex: 1,
            minHeight: 0,
            height: '100%',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <div className="rush-opponents-grid">
            {opponents.map((opp) => {
              const isSolved = (currentPlayer.solvedOpponentIds || []).includes(opp.id);
              return (
                <MiniCanvasBoard
                  key={opp.id}
                  actions={opponentDrawActions[opp.id] || []}
                  playerName={opp.name}
                  avatarColor={opp.avatar.color}
                  isSolved={isSolved}
                  solvedWord={getSolvedWord(opp, isSolved)}
                  onInspect={() => onInspectOpponent(opp.id)}
                />
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!mobileGuessInput.trim()) return;
              soundManager.playClick();
              onSendGuessOrChat(mobileGuessInput.trim());
              setMobileGuessInput('');
            }}
            className="mobile-rush-quick-guess-dock"
          >
            <label htmlFor={`${inputBaseId}-rush-guess`} className="visually-hidden">
              Gõ tên bảo bối để giải mã tranh đối thủ
            </label>
            <input
              id={`${inputBaseId}-rush-guess`}
              name="rushGuess"
              type="text"
              maxLength={120}
              enterKeyHint="send"
              value={mobileGuessInput}
              onChange={(e) => setMobileGuessInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) {
                  e.preventDefault();
                }
              }}
              placeholder="Gõ tên bảo bối để giải mã tranh..."
              style={{ flex: 1, padding: '10px 14px', fontSize: '16px' }}
            />
            <button
              type="submit"
              aria-label="Gửi dự đoán giải mã tranh"
              disabled={!mobileGuessInput.trim()}
              className="btn-primary"
              style={{ padding: '0 16px', borderRadius: '10px' }}
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Tab 3: Chat Panel */}
      <div style={{ display: mobileTab === 'chat' ? 'flex' : 'none', flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
        <ChatPanel
          messages={messages}
          onSendMessage={onSendGuessOrChat}
          isDrawer={roomConfig.mode === 'rush_draw' ? false : isCurrentDrawer && phase === 'drawing'}
          hasGuessed={currentPlayer.hasGuessed}
          currentPlayer={currentPlayer}
          mode={roomConfig.mode}
        />
      </div>

      {/* Mobile Tab 4: Score Board */}
      <div style={{ display: mobileTab === 'scores' ? 'flex' : 'none', flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
        <ScoreBoard
          players={players}
          currentUserId={currentUserId}
          currentDrawerId={currentDrawer?.id || null}
          roomCode={roomConfig.roomCode}
          round={round}
          totalRounds={roomConfig.totalRounds}
          maxPlayers={roomConfig.maxPlayers}
          isHost={isHost}
          onAddBot={onAddBot}
          onRemovePlayer={onRemovePlayer}
          mode={roomConfig.mode}
        />
      </div>
    </div>
  );
};

