import React, { useEffect, useId, useState } from 'react';
import type {
  DrawAction,
  GamePhase,
  Player,
  RelayPublicState,
  RelayReactionEmoji,
  RelayTaskAssignment,
} from '../types';
import { pickRandomRelayPrompt } from '../data/partyModesData';
import { CanvasBoard } from './CanvasBoard';
import { MiniCanvasBoard } from './MiniCanvasBoard';
import { soundManager } from '../utils/audio';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Dices, Send, Sparkles, Trophy } from 'lucide-react';

const EMPTY_RELAY_INCOMING: DrawAction[] = [];

const REACTION_EMOJIS: { emoji: RelayReactionEmoji; label: string }[] = [
  { emoji: '😂', label: 'Hài xỉu' },
  { emoji: '🔥', label: 'Tuyệt tác' },
  { emoji: '🤯', label: 'Tam sao' },
];

interface RelayStageViewProps {
  phase: GamePhase;
  language: 'vi' | 'en';
  players: Player[];
  currentUserId: string;
  isHost: boolean;
  relayState: RelayPublicState | null;
  myRelayTask: RelayTaskAssignment | null;
  hasSubmittedStep: boolean;
  myRelayDraftActions: DrawAction[];
  myRelayDraftTextRef: React.MutableRefObject<string>;
  relayCanvasResetKey: number;
  toolbarPortalTarget?: HTMLElement | null;
  onLocalDraw: (action: DrawAction) => void;
  onSubmitStep: (text?: string) => void;
  onShowcaseNav: (direction: 'forward' | 'backward') => void;
  onShowcaseRevealNext: () => void;
  onReaction: (chainId: string, stepIndex: number, emoji: RelayReactionEmoji) => void;
  onFinishShowcase: () => void;
}

export const RelayStageView: React.FC<RelayStageViewProps> = ({
  phase,
  language,
  players,
  currentUserId,
  isHost,
  relayState,
  myRelayTask,
  hasSubmittedStep,
  myRelayDraftActions,
  myRelayDraftTextRef,
  relayCanvasResetKey,
  toolbarPortalTarget,
  onLocalDraw,
  onSubmitStep,
  onShowcaseNav,
  onShowcaseRevealNext,
  onReaction,
  onFinishShowcase,
}) => {
  const formId = useId();
  const [textDraft, setTextDraft] = useState<string>('');

  useEffect(() => {
    setTextDraft('');
    myRelayDraftTextRef.current = '';
  }, [myRelayTask?.stepIndex, myRelayTask?.chainId, myRelayDraftTextRef]);

  const updateDraft = (val: string) => {
    setTextDraft(val);
    myRelayDraftTextRef.current = val;
  };

  const totalSteps = relayState?.totalSteps || myRelayTask?.totalSteps || 3;
  const activeStepIdx = phase === 'relay_showcase' ? totalSteps : relayState?.stepIndex ?? 0;
  const submittedIds = relayState?.submittedPlayerIds || [];

  const stepLabels = Array.from({ length: totalSteps }, (_, idx) => {
    if (idx === 0) return '1. Khởi Nguồn';
    return idx % 2 === 1 ? `${idx + 1}. Họa Tranh` : `${idx + 1}. Giải Mã`;
  });

  const handleTextFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textDraft.trim() || hasSubmittedStep) return;
    onSubmitStep(textDraft.trim());
  };

  const renderProgressTracker = () => (
    <div className="relay-top-bar">
      <nav aria-label="Tiến độ Tam Sao Thất Bản" style={{ flex: 1, minWidth: 0 }}>
        <ol className="relay-progress-tracker">
          {stepLabels.map((label, idx) => {
            const isCurrent = phase !== 'relay_showcase' && idx === activeStepIdx;
            const isDone = phase === 'relay_showcase' || idx < activeStepIdx;
            return (
              <li
                key={label}
                aria-current={isCurrent ? 'step' : undefined}
                className={`relay-step-pill ${isCurrent ? 'step-active' : isDone ? 'step-done' : 'step-todo'}`}
              >
                {label}
              </li>
            );
          })}
          <li
            aria-current={phase === 'relay_showcase' ? 'step' : undefined}
            className={`relay-step-pill ${phase === 'relay_showcase' ? 'step-active' : 'step-todo'}`}
          >
            📖 Nhật Ký
          </li>
        </ol>
      </nav>

      {phase !== 'relay_showcase' && (
        <div className="relay-submitted-badge">
          Đã nộp: <strong>{submittedIds.length}/{players.length}</strong>
        </div>
      )}
    </div>
  );

  if (phase === 'relay_showcase') {
    const chains = relayState?.showcaseChains || [];
    const chainIdx = relayState?.showcaseChainIndex ?? 0;
    const activeChain = chains[chainIdx];
    const revealedCount = relayState?.showcaseRevealedCount ?? 1;
    const visibleEntries = activeChain ? activeChain.entries.slice(0, revealedCount) : [];
    const hasMoreStepsInChain = activeChain ? revealedCount < activeChain.entries.length : false;

    return (
      <div className="party-stage-shell">
        {renderProgressTracker()}

        <div className="relay-showcase-card">
          <div className="relay-showcase-header">
            <button
              type="button"
              onClick={() => onShowcaseNav('backward')}
              disabled={chains.length <= 1}
              className="btn-icon"
              aria-label="Xem cuộn giấy trước"
              style={{ padding: '6px 12px', gap: '4px', fontSize: '12px' }}
            >
              <ChevronLeft size={16} aria-hidden="true" /> Cuộn Trước
            </button>

            <div style={{ textAlign: 'center', minWidth: 0 }}>
              <div className="font-cinzel" style={{ fontSize: '15px', fontWeight: 900, color: 'var(--hogwarts-gold)' }}>
                <BookOpen size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} aria-hidden="true" />
                Cuộn Giấy #{chainIdx + 1}/{Math.max(1, chains.length)} — {activeChain?.ownerName || 'Phù thủy'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Thả biểu cảm vào bước bạn thích để thưởng nóng +15 điểm cho tác giả!
              </div>
            </div>

            <button
              type="button"
              onClick={() => onShowcaseNav('forward')}
              disabled={chains.length <= 1}
              className="btn-icon"
              aria-label="Xem cuộn giấy tiếp theo"
              style={{ padding: '6px 12px', gap: '4px', fontSize: '12px' }}
            >
              Cuộn Tiếp <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="relay-timeline-scroll">
            {visibleEntries.map((entry) => (
              <article key={`${activeChain.chainId}_${entry.stepIndex}`} className="relay-entry-card animate-bounce-in">
                <div className="relay-entry-meta">
                  <span className="relay-entry-author">
                    {entry.kind === 'prompt'
                      ? `✍️ Khởi nguồn bởi ${entry.authorName}`
                      : entry.kind === 'draw'
                      ? `🎨 Minh họa bởi ${entry.authorName}`
                      : `🔮 Giải mã bởi ${entry.authorName}`}
                  </span>

                  <div className="relay-reaction-row" role="group" aria-label={`Biểu cảm cho ${entry.authorName}`}>
                    {REACTION_EMOJIS.map(({ emoji, label }) => {
                      const reactors = entry.reactions?.[emoji] || [];
                      const reactedByMe = reactors.includes(currentUserId);
                      return (
                        <button
                          key={emoji}
                          type="button"
                          aria-pressed={reactedByMe}
                          aria-label={`${label} (${reactors.length})`}
                          onClick={() => onReaction(activeChain.chainId, entry.stepIndex, emoji)}
                          className={`relay-reaction-btn ${reactedByMe ? 'active' : ''}`}
                        >
                          <span>{emoji}</span>
                          {reactors.length > 0 && <span>{reactors.length}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {entry.kind === 'draw' ? (
                  <div style={{ maxWidth: '430px', width: '100%', margin: '4px auto 0' }}>
                    <MiniCanvasBoard
                      key={`${activeChain.chainId}_draw_${entry.stepIndex}`}
                      actions={entry.actions || []}
                      playerName={entry.authorName}
                    />
                  </div>
                ) : (
                  <blockquote className="relay-quote-bubble">
                    “{entry.text}”
                  </blockquote>
                )}
              </article>
            ))}
          </div>

          <div className="relay-showcase-footer">
            {hasMoreStepsInChain && (
              <button
                type="button"
                onClick={onShowcaseRevealNext}
                className="btn-gold"
                style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: 800, fontSize: '13px' }}
              >
                <Sparkles size={15} aria-hidden="true" /> Tiết Lộ Bước Kế ({revealedCount}/{activeChain?.entries.length})
              </button>
            )}

            {isHost && (
              <button
                type="button"
                onClick={onFinishShowcase}
                className="btn-primary"
                style={{ padding: '10px 22px', borderRadius: '12px', fontWeight: 900, fontSize: '13px' }}
              >
                <Trophy size={15} aria-hidden="true" /> Tổng Kết Bục Vinh Quang
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (hasSubmittedStep) {
    return (
      <div className="party-stage-shell">
        {renderProgressTracker()}
        <div className="relay-waiting-seal-card">
          <CheckCircle2 size={44} color="#4ade80" aria-hidden="true" />
          <h2 className="font-cinzel" style={{ fontSize: '20px', color: 'var(--hogwarts-gold)', margin: 0 }}>
            Đã Niêm Phong Cuộn Giấy Sáp Đỏ!
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Đang chờ các phù thủy còn lại hoàn tất chặng này ({submittedIds.length}/{players.length})...
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'relay_draw') {
    return (
      <div className="party-stage-shell">
        {renderProgressTracker()}

        <div className="relay-prompt-banner">
          <div>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              NHIỆM VỤ VẼ ({myRelayTask?.previousAuthorName || 'Ẩn danh'} truyền lại):
            </span>
            <div className="font-cinzel" style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>
              “{myRelayTask?.previousPrompt || 'Đũa phép Hogwarts'}”
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSubmitStep()}
            className="btn-primary"
            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}
          >
            <Send size={14} aria-hidden="true" /> Gửi Bức Tranh
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <CanvasBoard
            isDrawer={true}
            onBroadcastDraw={onLocalDraw}
            incomingActions={EMPTY_RELAY_INCOMING}
            initialActions={myRelayDraftActions}
            actionResetKey={relayCanvasResetKey}
            phase="drawing"
            hideOverlayBadges={true}
            toolbarPortalTarget={toolbarPortalTarget}
          />
        </div>
      </div>
    );
  }

  const isGuessPhase = phase === 'relay_guess';
  return (
    <div className="party-stage-shell">
      {renderProgressTracker()}

      <form onSubmit={handleTextFormSubmit} className="relay-form-card">
        {isGuessPhase ? (
          <>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 800 }} className="font-cinzel">
                BỨC TRANH BÍ ẨN TỪ {myRelayTask?.previousAuthorName?.toUpperCase() || 'PHÙ THỦY'}
              </span>
              <div style={{ maxWidth: '400px', margin: '8px auto 0' }}>
                <MiniCanvasBoard
                  key={`guess_preview_${myRelayTask?.chainId}_${myRelayTask?.stepIndex}`}
                  actions={myRelayTask?.previousDrawing || []}
                  playerName={myRelayTask?.previousAuthorName || 'Phù thủy'}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor={`${formId}-relay-input`} style={{ fontSize: '13px', fontWeight: 700, color: 'var(--hogwarts-gold)' }}>
                Theo bạn, bức tranh trên đang diễn tả cảnh gì?
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  id={`${formId}-relay-input`}
                  name="relayGuess"
                  type="text"
                  required
                  maxLength={100}
                  enterKeyHint="send"
                  value={textDraft}
                  onChange={(e) => updateDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Nhập câu đoán thật dí dỏm của bạn..."
                  style={{ flex: '1 1 220px', fontSize: '16px', minHeight: '48px' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0 22px', borderRadius: '12px', fontWeight: 800, minHeight: '48px' }}
                >
                  <Send size={16} aria-hidden="true" /> Chốt Đáp Án
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              <h2 className="gold-title" style={{ fontSize: 'clamp(18px, 3vw, 24px)', margin: '0 0 6px 0' }}>
                📜 Khởi Tạo Cuộn Giấy Tam Sao Thất Bản
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Hãy viết một tình huống phép thuật thật hài hước để thử thách tài hội họa của người kế tiếp!
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <label htmlFor={`${formId}-relay-input`} style={{ fontSize: '13px', fontWeight: 700, color: 'var(--hogwarts-gold)' }}>
                  Câu chủ đề khởi nguồn của bạn:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    updateDraft(pickRandomRelayPrompt(language));
                  }}
                  className="btn-icon"
                  style={{ padding: '6px 12px', fontSize: '12px', gap: '5px', color: 'var(--accent-cyan)' }}
                >
                  <Dices size={14} aria-hidden="true" /> Gợi Ý Tình Huống Lầy Lội
                </button>
              </div>

              <input
                id={`${formId}-relay-input`}
                name="relayPrompt"
                type="text"
                required
                maxLength={100}
                enterKeyHint="send"
                value={textDraft}
                onChange={(e) => updateDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) {
                    e.preventDefault();
                  }
                }}
                placeholder="VD: Cụ Dumbledore cưỡi chổi uống trà sữa trân châu..."
                style={{ width: '100%', fontSize: '16px', minHeight: '48px' }}
              />

              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 900, fontSize: '15px', minHeight: '48px', alignSelf: 'flex-end' }}
              >
                <Send size={16} aria-hidden="true" /> Niêm Phong Cuộn Giấy
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};
