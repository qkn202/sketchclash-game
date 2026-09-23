import React, { useState } from 'react';
import type { Player, DrawAction } from '../types';
import { MiniCanvasBoard } from './MiniCanvasBoard';
import { AvatarDisplay } from './AvatarPicker';
import { X, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface InspectBoardModalProps {
  opponent: Player;
  actions: DrawAction[];
  isSolved: boolean;
  solvedWord?: string;
  onClose: () => void;
  onGuess: (text: string) => void;
}

export const InspectBoardModal: React.FC<InspectBoardModalProps> = ({
  opponent,
  actions,
  isSolved,
  solvedWord,
  onClose,
  onGuess,
}) => {
  const [guessInput, setGuessInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    soundManager.playClick();
    onGuess(guessInput.trim());
    setGuessInput('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 2, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="animate-bounce-in"
        style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--hogwarts-gold)',
          borderRadius: '20px',
          padding: '16px',
          maxWidth: '680px',
          width: '100%',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AvatarDisplay avatar={opponent.avatar} size={40} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--hogwarts-gold)' }} className="font-cinzel">
                  Tranh Của {opponent.name}
                </h3>
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
                    <CheckCircle2 size={12} /> ĐÃ GIẢI MÃ ({solvedWord})
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
            className="btn-icon"
            style={{ padding: '8px' }}
          >
            <X size={20} />
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder={`Nhập tên bảo bối bạn đoán cho ${opponent.name}...`}
              style={{
                flex: 1,
                fontSize: '15px',
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
              <Send size={18} /> Đoán
            </button>
          </form>
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
            <Sparkles size={16} /> Bạn đã xuất sắc giải mã bức tranh này với từ khóa "{solvedWord}"!
          </div>
        )}
      </div>
    </div>
  );
};
