import React, { useEffect, useId, useState } from 'react';
import type {
  DrawAction,
  GamePhase,
  ImpostorPublicState,
  ImpostorRoleSecret,
  Player,
} from '../types';
import { AvatarDisplay } from './AvatarPicker';
import { CanvasBoard } from './CanvasBoard';
import { CheckCircle2, Scale, Send, Sparkles } from 'lucide-react';

interface ImpostorStageViewProps {
  phase: GamePhase;
  round: number;
  players: Player[];
  currentUserId: string;
  impostorState: ImpostorPublicState | null;
  myImpostorRole: ImpostorRoleSecret | null;
  mySelectedVoteId: string | null;
  revealedWord: string;
  roundEndMessage: string | null;
  boardActions: DrawAction[];
  incomingActions: DrawAction[];
  canvasResetKey: number;
  toolbarPortalTarget?: HTMLElement | null;
  onBroadcastDraw: (action: DrawAction) => void;
  onSingleStrokeComplete: () => void;
  onSubmitVote: (suspectId: string) => void;
  onSubmitCounterGuess: (guessText: string) => void;
}

export const ImpostorStageView: React.FC<ImpostorStageViewProps> = ({
  phase,
  round,
  players,
  currentUserId,
  impostorState,
  myImpostorRole,
  mySelectedVoteId,
  revealedWord,
  roundEndMessage,
  boardActions,
  incomingActions,
  canvasResetKey,
  toolbarPortalTarget,
  onBroadcastDraw,
  onSingleStrokeComplete,
  onSubmitVote,
  onSubmitCounterGuess,
}) => {
  const formId = useId();
  const [draftSuspectId, setDraftSuspectId] = useState<string>('');
  const [counterGuessText, setCounterGuessText] = useState<string>('');

  useEffect(() => {
    if (phase === 'impostor_vote' && !mySelectedVoteId) {
      setDraftSuspectId('');
    }
    if (phase === 'impostor_guess') {
      setCounterGuessText('');
    }
  }, [phase, mySelectedVoteId]);

  const category = impostorState?.category || myImpostorRole?.category || 'Bí Ẩn Hogwarts';
  const artistColors = impostorState?.artistColors || {};
  const myInkColor = myImpostorRole?.inkColor || artistColors[currentUserId] || '#b91c1c';
  const activeArtistId = impostorState?.activeArtistId || null;
  const activeArtist = players.find((p) => p.id === activeArtistId);
  const isMyStrokeTurn = phase === 'impostor_draw' && activeArtistId === currentUserId;
  const votedIds = impostorState?.votedPlayerIds || [];

  const suspects = players.filter((p) => p.id !== currentUserId);
  const selectedSuspectValue = mySelectedVoteId || draftSuspectId;
  const unmaskedPlayer = players.find((p) => p.id === impostorState?.revealedImpostorId);
  const isMeUnmaskedImpostor =
    phase === 'impostor_guess' && impostorState?.revealedImpostorId === currentUserId;

  const handleVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftSuspectId || mySelectedVoteId) return;
    onSubmitVote(draftSuspectId);
  };

  const handleCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterGuessText.trim()) return;
    onSubmitCounterGuess(counterGuessText.trim());
  };

  return (
    <div className="party-stage-shell">
      {/* Secret Role & Ink Turn Strip */}
      <div className={`impostor-role-banner ${myImpostorRole?.isImpostor ? 'is-impostor' : 'is-wizard'}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div>
            {myImpostorRole?.isImpostor ? (
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#fda4af' }} className="font-cinzel">
                🧪 VAI TRÒ: KẺ GIẢ MẠO ĐA DỊCH • Chủ đề: <span style={{ color: '#fff' }}>{category}</span>
              </div>
            ) : (
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#86efac' }} className="font-cinzel">
                🪄 PHÙ THỦY THẬT • Chủ đề: <span style={{ color: '#cbd5e1' }}>{category}</span> • Từ khóa:{' '}
                <span style={{ color: 'var(--hogwarts-gold)', fontSize: '15px' }}>
                  {myImpostorRole?.secretWord || '...'}
                </span>
              </div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {phase === 'impostor_draw'
                ? isMyStrokeTurn
                  ? '✏️ TỚI LƯỢT BẠN! Hãy vẽ đúng 1 nét duy nhất bằng màu mực định danh của bạn!'
                  : `Đang chờ ${activeArtist?.name || 'phù thủy'} vẽ 1 nét (Lượt ${impostorState?.passNumber || 1}/${impostorState?.totalPasses || 2})...`
                : phase === 'impostor_vote'
                ? `⚖️ Phiên Tòa Wizengamot đang bỏ phiếu (${votedIds.length}/${players.length})...`
                : phase === 'impostor_guess'
                ? `⚡ ${unmaskedPlayer?.name || 'Kẻ Giả Mạo'} đang đoán từ khóa cơ hội cuối!`
                : 'Kết thúc vòng suy luận Đa Dịch!'}
            </div>
          </div>

          <div className="impostor-ink-roster" aria-label="Bảng màu mực định danh từng phù thủy">
            {(impostorState?.turnOrderIds || players.map((p) => p.id)).map((pid) => {
              const p = players.find((item) => item.id === pid);
              if (!p) return null;
              const ink = artistColors[p.id] || '#64748b';
              const isTurn = phase === 'impostor_draw' && p.id === activeArtistId;
              return (
                <span
                  key={p.id}
                  className={`impostor-ink-chip ${isTurn ? 'active-turn' : ''}`}
                  title={`Mực của ${p.name}`}
                >
                  <span className="impostor-ink-dot" style={{ background: ink }} aria-hidden="true" />
                  <span>{p.name.split(' ')[0]}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Voting Panel in impostor_vote */}
      {phase === 'impostor_vote' && (
        <form onSubmit={handleVoteSubmit} className="impostor-trial-panel">
          <fieldset className="impostor-vote-fieldset">
            <legend className="impostor-vote-legend font-cinzel">
              <Scale size={15} aria-hidden="true" /> Phiên Tòa Wizengamot — Ai là Kẻ Giả Mạo Đa Dịch?
            </legend>

            <div className="impostor-suspect-grid">
              {suspects.map((suspect) => {
                const radioId = `${formId}-suspect-${suspect.id}`;
                const ink = artistColors[suspect.id] || '#64748b';
                const isChecked = selectedSuspectValue === suspect.id;
                return (
                  <div key={suspect.id} className="impostor-suspect-option">
                    <input
                      type="radio"
                      id={radioId}
                      name="suspectId"
                      value={suspect.id}
                      required
                      checked={isChecked}
                      disabled={Boolean(mySelectedVoteId)}
                      onChange={() => setDraftSuspectId(suspect.id)}
                      className="visually-hidden impostor-suspect-radio"
                    />
                    <label htmlFor={radioId} className="impostor-suspect-card">
                      <AvatarDisplay avatar={suspect.avatar} size={32} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {suspect.name}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                          <span className="impostor-ink-dot" style={{ background: ink }} aria-hidden="true" />
                          <span>Mực đã vẽ</span>
                        </div>
                      </div>
                      {isChecked && <CheckCircle2 size={16} color="var(--hogwarts-gold)" aria-hidden="true" />}
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Đã bỏ phiếu: <strong style={{ color: '#fff' }}>{votedIds.length}/{players.length}</strong> phù thủy
            </span>
            <button
              type="submit"
              disabled={!draftSuspectId || Boolean(mySelectedVoteId)}
              className="btn-primary"
              style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, minHeight: '42px' }}
            >
              {mySelectedVoteId ? '✅ Đã Niêm Phong Lá Phiếu' : '⚖️ Bỏ Phiếu Kết Tội'}
            </button>
          </div>
        </form>
      )}

      {/* Counter-Guess Panel in impostor_guess */}
      {phase === 'impostor_guess' && (
        <div className="impostor-trial-panel">
          {isMeUnmaskedImpostor ? (
            <form onSubmit={handleCounterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor={`${formId}-counter-guess`}
                className="font-cinzel"
                style={{ fontSize: '13px', fontWeight: 900, color: 'var(--hogwarts-gold)' }}
              >
                ⚡ Bạn đã bị lộ diện! Đoán đúng từ khóa thuộc chủ đề [{category}] để LẬT KÈO (+240đ):
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  id={`${formId}-counter-guess`}
                  name="impostorCounterGuess"
                  type="text"
                  required
                  maxLength={80}
                  enterKeyHint="send"
                  value={counterGuessText}
                  onChange={(e) => setCounterGuessText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder={`Nhập tên bảo bối/sinh vật thuộc "${category}"...`}
                  style={{ flex: '1 1 200px', fontSize: '16px', minHeight: '46px' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0 20px', borderRadius: '10px', fontWeight: 900, minHeight: '46px' }}
                >
                  <Send size={15} aria-hidden="true" /> Lật Kèo!
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hogwarts-gold)', fontSize: '13px', fontWeight: 700 }}>
              <Sparkles size={16} aria-hidden="true" />
              <span>
                Phiên Tòa đã vạch mặt <strong>{unmaskedPlayer?.name || 'Kẻ Giả Mạo'}</strong>! Hãy chờ xem Kẻ Giả Mạo có đoán được từ khóa bí mật không...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Shared Parchment Canvas */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <CanvasBoard
          isDrawer={isMyStrokeTurn}
          onBroadcastDraw={onBroadcastDraw}
          incomingActions={incomingActions}
          actionResetKey={canvasResetKey}
          mode="polyjuice_impostor"
          phase={phase === 'round_end' ? 'round_end' : 'drawing'}
          currentWord={phase === 'round_end' ? revealedWord : ''}
          roundEndMessage={roundEndMessage}
          initialActions={boardActions}
          toolbarPortalTarget={toolbarPortalTarget}
          singleStrokeMode={true}
          singleStrokeTurnKey={`${round}_${impostorState?.strokesCompletedInRound ?? 0}_${impostorState?.activeArtistId ?? ''}`}
          lockedColor={myInkColor}
          hideClearButton={true}
          hideOverlayBadges={phase !== 'round_end'}
          onSingleStrokeComplete={onSingleStrokeComplete}
        />
      </div>
    </div>
  );
};

