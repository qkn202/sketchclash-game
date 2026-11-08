import React, { useState } from 'react';
import type { Player, RoomConfig, DrawAction, ChatMessage, GamePhase } from '../types';
import { CanvasBoard } from './CanvasBoard';
import { ScoreBoard } from './ScoreBoard';
import { ChatPanel } from './ChatPanel';
import { MiniCanvasBoard } from './MiniCanvasBoard';
import { MobileGameStage } from './MobileGameStage';
import { Palette, MessageSquare, Trophy, Eye, Maximize2, Minimize2 } from 'lucide-react';

export type MobileTab = 'canvas' | 'opponents' | 'chat' | 'scores';

interface InGameStageProps {
  isMobile: boolean;
  mobileTab: MobileTab;
  onMobileTabChange: (tab: MobileTab) => void;
  isCanvasMaximized: boolean;
  onToggleMaximize: (next: boolean) => void;
  roomConfig: RoomConfig;
  phase: GamePhase;
  round: number;
  players: Player[];
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
  solvedWordsMap: Record<string, string>;
  onBroadcastLocalDraw: (action: DrawAction) => void;
  onSendGuessOrChat: (text: string) => void;
  onAddBot: () => void;
  onRemovePlayer: (playerId: string) => void;
  onInspectOpponent: (playerId: string) => void;
  renderPartyStage?: (toolbarSlot: HTMLElement | null) => React.ReactNode;
}

export const InGameStage: React.FC<InGameStageProps> = ({
  isMobile,
  mobileTab,
  onMobileTabChange,
  isCanvasMaximized,
  onToggleMaximize,
  roomConfig,
  phase,
  round,
  players,
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
  solvedWordsMap,
  onBroadcastLocalDraw,
  onSendGuessOrChat,
  onAddBot,
  onRemovePlayer,
  onInspectOpponent,
  renderPartyStage,
}) => {
  const [rushViewTab, setRushViewTab] = useState<'my_board' | 'opponents'>('my_board');
  const [showMiniOpponentsStrip, setShowMiniOpponentsStrip] = useState<boolean>(false);
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null);

  const opponents = players.filter((p) => p.id !== currentUserId);
  const getSolvedWord = (opp: Player, isSolved: boolean): string | undefined => {
    if (!isSolved) return undefined;
    return solvedWordsMap[opp.id] || opp.secretWord;
  };

  return (
    <main style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {isMobile && !isCanvasMaximized && (
        <nav aria-label="Chuyển đổi khung nhìn di động" className="mobile-tabs-container">
          <button
            type="button"
            aria-pressed={mobileTab === 'canvas'}
            className={`mobile-tab-btn ${mobileTab === 'canvas' ? 'active' : ''}`}
            onClick={() => onMobileTabChange('canvas')}
          >
            <Palette size={15} aria-hidden="true" />{' '}
            {roomConfig.mode === 'rush_draw'
              ? 'Bảng Của Tôi'
              : roomConfig.mode === 'relay_phone'
              ? 'Cuộn Giấy'
              : roomConfig.mode === 'polyjuice_impostor'
              ? 'Suy Luận'
              : 'Bảng Vẽ'}
          </button>
          {roomConfig.mode === 'rush_draw' && (
            <button
              type="button"
              aria-pressed={mobileTab === 'opponents'}
              className={`mobile-tab-btn ${mobileTab === 'opponents' ? 'active' : ''}`}
              onClick={() => onMobileTabChange('opponents')}
            >
              <Eye size={15} aria-hidden="true" /> Soi Tranh ({opponents.length})
            </button>
          )}
          <button
            type="button"
            aria-pressed={mobileTab === 'chat'}
            className={`mobile-tab-btn ${mobileTab === 'chat' ? 'active' : ''}`}
            onClick={() => onMobileTabChange('chat')}
          >
            <MessageSquare size={15} aria-hidden="true" /> Chat ({messages.length})
          </button>
          <button
            type="button"
            aria-pressed={mobileTab === 'scores'}
            className={`mobile-tab-btn ${mobileTab === 'scores' ? 'active' : ''}`}
            onClick={() => onMobileTabChange('scores')}
          >
            <Trophy size={15} aria-hidden="true" /> Điểm ({players.length})
          </button>
        </nav>
      )}

      {isMobile ? (
        <MobileGameStage
          mobileTab={mobileTab}
          isCanvasMaximized={isCanvasMaximized}
          onToggleMaximize={onToggleMaximize}
          showMiniOpponentsStrip={showMiniOpponentsStrip}
          roomConfig={roomConfig}
          phase={phase}
          round={round}
          players={players}
          opponents={opponents}
          currentPlayer={currentPlayer}
          currentDrawer={currentDrawer}
          coopPartner={coopPartner}
          currentUserId={currentUserId}
          isHost={isHost}
          isCurrentDrawer={isCurrentDrawer}
          displayWordForOverlay={displayWordForOverlay}
          roundEndMessage={roundEndMessage}
          messages={messages}
          incomingDrawActions={incomingDrawActions}
          canvasResetKey={canvasResetKey}
          myRushDrawActions={myRushDrawActions}
          opponentDrawActions={opponentDrawActions}
          getSolvedWord={getSolvedWord}
          onBroadcastLocalDraw={onBroadcastLocalDraw}
          onSendGuessOrChat={onSendGuessOrChat}
          onAddBot={onAddBot}
          onRemovePlayer={onRemovePlayer}
          onInspectOpponent={onInspectOpponent}
          partyStageContent={renderPartyStage ? renderPartyStage(null) : undefined}
        />
      ) : (
        <div className={`game-main-grid ${roomConfig.mode === 'rush_draw' ? 'rush-mode' : ''} ${isCanvasMaximized ? 'canvas-maximized' : ''}`}>
          {!isCanvasMaximized && (
            <ScoreBoard
              players={players}
              currentUserId={currentUserId}
              currentDrawerId={currentDrawer?.id || null}
              roomCode={roomConfig.roomCode}
              roomToken={roomConfig.roomToken}
              round={round}
              totalRounds={roomConfig.totalRounds}
              maxPlayers={roomConfig.maxPlayers}
              isHost={isHost}
              onAddBot={onAddBot}
              onRemovePlayer={onRemovePlayer}
              mode={roomConfig.mode}
            />
          )}

          {renderPartyStage ? (
            renderPartyStage(toolbarSlot)
          ) : roomConfig.mode === 'rush_draw' ? (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
              <div className="rush-view-switcher">
                <button
                  type="button"
                  aria-pressed={rushViewTab === 'my_board'}
                  className={`rush-view-btn ${rushViewTab === 'my_board' ? 'active' : ''}`}
                  onClick={() => setRushViewTab('my_board')}
                >
                  <Palette size={14} aria-hidden="true" /> Bảng Vẽ Của Tôi ✏️
                </button>
                <button
                  type="button"
                  aria-pressed={rushViewTab === 'opponents'}
                  className={`rush-view-btn ${rushViewTab === 'opponents' ? 'active' : ''}`}
                  onClick={() => setRushViewTab('opponents')}
                >
                  <Eye size={14} aria-hidden="true" /> Soi Tranh Đối Thủ 👁️ ({opponents.length})
                </button>

                {rushViewTab === 'my_board' && (
                  <button
                    type="button"
                    aria-pressed={showMiniOpponentsStrip}
                    className="rush-view-btn"
                    style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      padding: '3px 8px',
                      color: showMiniOpponentsStrip ? 'var(--hogwarts-gold)' : 'var(--text-muted)',
                      border: showMiniOpponentsStrip ? '1px solid var(--border-gold)' : '1px solid transparent',
                    }}
                    onClick={() => setShowMiniOpponentsStrip(!showMiniOpponentsStrip)}
                  >
                    {showMiniOpponentsStrip ? '👁️ Ẩn dải tranh mini' : '👁️ Dải tranh mini'}
                  </button>
                )}

                <button
                  type="button"
                  aria-pressed={isCanvasMaximized}
                  className="rush-view-btn"
                  style={{
                    marginLeft: rushViewTab !== 'my_board' ? 'auto' : '4px',
                    fontSize: '11px',
                    padding: '3px 8px',
                    color: isCanvasMaximized ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    background: isCanvasMaximized ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    border: isCanvasMaximized ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)',
                  }}
                  onClick={() => onToggleMaximize(!isCanvasMaximized)}
                >
                  {isCanvasMaximized ? <Minimize2 size={13} aria-hidden="true" /> : <Maximize2 size={13} aria-hidden="true" />}
                  <span>{isCanvasMaximized ? 'Thu Nhỏ' : 'Phóng To'}</span>
                </button>
              </div>

              <div
                style={{
                  display: rushViewTab === 'my_board' ? 'flex' : 'none',
                  flexDirection: 'column',
                  flex: 1,
                  minHeight: 0,
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <CanvasBoard
                    isDrawer={phase === 'drawing'}
                    onBroadcastDraw={onBroadcastLocalDraw}
                    incomingActions={incomingDrawActions}
                    actionResetKey={canvasResetKey}
                    mode={roomConfig.mode}
                    coopPartnerName={coopPartner?.name}
                    isLoneGuesser={false}
                    phase={phase}
                    currentWord={displayWordForOverlay}
                    roundEndMessage={roundEndMessage}
                    initialActions={myRushDrawActions}
                    toolbarPortalTarget={toolbarSlot}
                  />
                </div>

                {showMiniOpponentsStrip && (
                  <div className="rush-thumbnail-strip">
                    {opponents.map((opp) => {
                      const isSolved = (currentPlayer.solvedOpponentIds || []).includes(opp.id);
                      return (
                        <div key={opp.id} style={{ width: '135px', flexShrink: 0 }}>
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
              </div>

              <div className="rush-opponents-grid" style={{ display: rushViewTab === 'opponents' ? 'grid' : 'none' }}>
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
            </div>
          ) : (
            <CanvasBoard
              isDrawer={isCurrentDrawer && phase === 'drawing'}
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
              toolbarPortalTarget={toolbarSlot}
            />
          )}

          <div className="right-panel-column">
            <div id="drawing-toolbar-container" ref={setToolbarSlot} />
            <ChatPanel
              messages={messages}
              onSendMessage={onSendGuessOrChat}
              isDrawer={roomConfig.mode === 'rush_draw' ? false : isCurrentDrawer && phase === 'drawing'}
              hasGuessed={currentPlayer.hasGuessed}
              currentPlayer={currentPlayer}
              mode={roomConfig.mode}
            />
          </div>
        </div>
      )}
    </main>
  );
};
