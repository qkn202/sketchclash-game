import React, { useEffect, useState, useRef } from 'react';
import { Wand2, Clock, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface WordPickerModalProps {
  isDrawer: boolean;
  drawerName: string;
  wordChoices: string[];
  onSelectWord: (word: string) => void;
  onTimeout?: () => void;
  selectionTime?: number;
}

export const WordPickerModal: React.FC<WordPickerModalProps> = ({
  isDrawer,
  drawerName,
  wordChoices,
  onSelectWord,
  onTimeout,
  selectionTime = 15,
}) => {
  const [timeLeft, setTimeLeft] = useState(selectionTime);
  const onSelectWordRef = useRef(onSelectWord);
  useEffect(() => {
    onSelectWordRef.current = onSelectWord;
  }, [onSelectWord]);

  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const wordChoicesRef = useRef(wordChoices);
  useEffect(() => {
    wordChoicesRef.current = wordChoices;
  }, [wordChoices]);

  const hasSelectedRef = useRef(false);

  const handleSelect = (word: string) => {
    if (hasSelectedRef.current) return;
    hasSelectedRef.current = true;
    soundManager.playClick();
    onSelectWordRef.current(word);
  };

  useEffect(() => {
    setTimeLeft(selectionTime);
    hasSelectedRef.current = false;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasSelectedRef.current) {
            hasSelectedRef.current = true;
            if (isDrawer && onTimeoutRef.current) {
              setTimeout(() => {
                onTimeoutRef.current?.();
              }, 0);
            }
          }
          return 0;
        }
        if (prev <= 5) {
          soundManager.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectionTime, isDrawer]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 3, 8, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: '20px',
      }}
    >
      <div
        className="animate-bounce-in word-picker-modal"
        style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--hogwarts-gold)',
          borderRadius: '24px',
          padding: 'clamp(18px, 4vw, 28px)',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--card-shadow)',
          textAlign: 'center',
        }}
      >
        {isDrawer ? (
          <>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--hogwarts-gold)', marginBottom: '8px' }}>
              <Wand2 size={24} />
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }} className="font-cinzel">
                LƯỢT VẼ PHÉP THUẬT CỦA BẠN!
              </span>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px', color: '#fff' }} className="font-cinzel">
              Chọn 1 bảo bối hoặc sinh vật để vẽ:
            </h2>

            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--hogwarts-gold)', marginBottom: '22px' }}>
              <Clock size={16} />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Thời gian chọn bùa: {timeLeft}s</span>
            </div>

            {/* 3 Word Cards */}
            <div className="word-cards-grid">
              {wordChoices.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => handleSelect(word)}
                  className="btn-gold"
                  style={{
                    padding: '20px 8px',
                    fontSize: '16px',
                    fontWeight: 800,
                    borderRadius: '16px',
                    flexDirection: 'column',
                    height: '95px',
                  }}
                >
                  <Sparkles size={16} color="#634706" />
                  <span>{word}</span>
                </button>
              ))}
            </div>

            <p style={{ fontSize: '13px', color: '#ffd875', marginTop: '14px', fontWeight: 600 }}>
              ⚠️ Nếu không chọn trong {timeLeft}s, lượt vẽ sẽ tự động bị bỏ qua và chuyển cho người tiếp theo!
            </p>
          </>
        ) : (
          <div style={{ padding: '20px 0' }}>
            <div className="animate-float" style={{ fontSize: '50px', marginBottom: '16px' }}>
              ⚡
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: 'var(--hogwarts-gold)' }} className="font-cinzel">
              <span>{drawerName}</span> đang chọn bảo bối ma thuật...
            </h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--hogwarts-gold)', background: 'rgba(212, 175, 55, 0.15)', padding: '6px 14px', borderRadius: '16px', border: '1px solid var(--border-gold)', margin: '10px 0' }}>
              <Clock size={16} />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Thời gian còn lại: {timeLeft}s</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
              Nếu {drawerName} không chọn kịp, lượt vẽ sẽ tự động được chuyển sang phù thủy tiếp theo!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
