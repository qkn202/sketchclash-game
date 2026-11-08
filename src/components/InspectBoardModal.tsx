import React, { useState, useId } from 'react';
import type { Player, DrawAction } from '../types';
import { MiniCanvasBoard } from './MiniCanvasBoard';
import { AvatarDisplay } from './AvatarPicker';
import { X, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { ModalDialog } from './ModalDialog';

interface InspectBoardModalProps {
  opponent: Player;
  actions: DrawAction[];
  isSolved: boolean;
  solvedWord?: string;
  feedback?: string | null;
  onClearFeedback?: () => void;
  onClose: () => void;
  onGuess: (text: string) => void;
}

export const InspectBoardModal: React.FC<InspectBoardModalProps> = ({
  opponent,
  actions,
  isSolved,
  solvedWord,
  feedback,
  onClearFeedback,
  onClose,
  onGuess,
}) => {
  const titleId = useId();
  const inputId = useId();
  const [guessInput, setGuessInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    soundManager.playClick();
    onGuess(guessInput.trim());
    setGuessInput('');
  };

  return (
    <ModalDialog
      ariaLabelledBy={titleId}
      dismissible={true}
      onClose={onClose}
      maxWidth="680px"
      style={{ padding: '16px', gap: '12px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AvatarDisplay avatar={opponent.avatar} size={40} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 id={titleId} style={{ fontSize: '18px', fontWeight: 800, color: 'var(--hogwarts-gold)', margin: 0 }} className="font-cinzel">
                Tranh Của {opponent.name}
              </h2>
              {isSolved && (
                <span
                  style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid #4ade80',
                    color: '#4ade80',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={12} aria-hidden="true" /> ĐÃ GIẢI MÃ {solvedWord ? `(${solvedWord})` : ''}
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {isSolved ? 'Bạn đã giải mã thành công bức tranh này!' : 'Quan sát nét vẽ và đoán tên bảo bối'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng khung soi tranh"
          className="btn-icon"
          style={{ padding: '8px' }}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Enlarged Board */}
      <div style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <MiniCanvasBoard
          actions={actions}
          playerName={opponent.name}
          avatarColor={opponent.avatar.color}
          isSolved={isSolved}
          solvedWord={solvedWord}
        />
      </div>

      {/* Quick Guess Input */}
      {!isSolved ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          {feedback && (
            <div
              role="status"
              aria-live="polite"
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 209, 102, 0.16)',
                border: '1px solid var(--hogwarts-gold)',
                color: '#ffd875',
                fontSize: '12.5px',
                fontWeight: 700,
              }}
            >
              {feedback}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
            <label htmlFor={inputId} className="visually-hidden">
              Đoán tên bảo bối cho tranh của {opponent.name}
            </label>
            <input
              id={inputId}
              name="inspectGuess"
              type="text"
              maxLength={120}
              enterKeyHint="send"
              value={guessInput}
              onChange={(e) => {
                setGuessInput(e.target.value);
                if (feedback) onClearFeedback?.();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) {
                  e.preventDefault();
                }
              }}
              placeholder={`Nhập tên bảo bối bạn đoán cho ${opponent.name}...`}
              style={{
                flex: 1,
                fontSize: '16px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid var(--hogwarts-gold)',
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={!guessInput.trim()}
              className="btn-primary"
              style={{ padding: '0 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={18} aria-hidden="true" /> Đoán
            </button>
          </form>
        </div>
      ) : (
        <div
          style={{
            padding: '10px',
            textAlign: 'center',
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '10px',
            color: '#4ade80',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Sparkles size={16} aria-hidden="true" /> Bạn đã xuất sắc giải mã bức tranh này{solvedWord ? ` với từ khóa "${solvedWord}"` : ''}!
        </div>
      )}
    </ModalDialog>
  );
};
