import React, { useEffect, useRef, useId } from 'react';
import { Wand2, Clock, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { ModalDialog } from './ModalDialog';

interface WordPickerModalProps {
  isDrawer: boolean;
  drawerName: string;
  wordChoices: string[];
  timeLeft: number;
  onSelectWord: (word: string) => void;
  selectionTime?: number;
}

export const WordPickerModal: React.FC<WordPickerModalProps> = ({
  isDrawer,
  drawerName,
  wordChoices,
  timeLeft,
  onSelectWord,
  selectionTime = 15,
}) => {
  const titleId = useId();
  const onSelectWordRef = useRef(onSelectWord);
  useEffect(() => {
    onSelectWordRef.current = onSelectWord;
  }, [onSelectWord]);

  const hasSelectedRef = useRef(false);
  const displaySeconds = Math.max(0, Math.min(selectionTime, timeLeft));

  const handleSelect = (word: string) => {
    if (hasSelectedRef.current) return;
    hasSelectedRef.current = true;
    soundManager.playClick();
    onSelectWordRef.current(word);
  };

  return (
    <ModalDialog
      ariaLabelledBy={titleId}
      dismissible={false}
      maxWidth="560px"
      className="word-picker-modal"
      style={{ textAlign: 'center' }}
    >
      {isDrawer ? (
        <>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--hogwarts-gold)', marginBottom: '8px' }}>
            <Wand2 size={24} aria-hidden="true" />
            <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }} className="font-cinzel">
              LƯỢT VẼ PHÉP THUẬT CỦA BẠN!
            </span>
          </div>

          <h2 id={titleId} style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px', color: '#fff' }} className="font-cinzel">
            Chọn 1 bảo bối hoặc sinh vật để vẽ:
          </h2>

          {/* Authoritative synced timer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--hogwarts-gold)', marginBottom: '22px' }}>
            <Clock size={16} aria-hidden="true" />
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Thời gian chọn bùa: {displaySeconds}s</span>
          </div>

          {/* 3 Word Cards */}
          <div className="word-cards-grid">
            {wordChoices.map((word, index) => (
              <button
                key={`${word}_${index}`}
                type="button"
                autoFocus={index === 0}
                onClick={() => handleSelect(word)}
                className="btn-gold"
                style={{
                  padding: '20px 8px',
                  fontSize: '16px',
                  fontWeight: 800,
                  borderRadius: '16px',
                  flexDirection: 'column',
                  minBlockSize: '95px',
                }}
              >
                <Sparkles size={16} color="#634706" aria-hidden="true" />
                <span>{word}</span>
              </button>
            ))}
          </div>

          <p style={{ fontSize: '13px', color: '#ffd875', marginTop: '14px', fontWeight: 600 }}>
            ⚠️ Nếu không chọn trong {displaySeconds}s, lượt vẽ sẽ tự động được xử lý để không làm kẹt phòng!
          </p>
        </>
      ) : (
        <div style={{ padding: '20px 0' }}>
          <div className="animate-float" style={{ fontSize: '50px', marginBottom: '16px' }} aria-hidden="true">
            ⚡
          </div>
          <h2 id={titleId} style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: 'var(--hogwarts-gold)' }} className="font-cinzel">
            <span>{drawerName}</span> đang chọn bảo bối ma thuật...
          </h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--hogwarts-gold)', background: 'rgba(212, 175, 55, 0.15)', padding: '6px 14px', borderRadius: '16px', border: '1px solid var(--border-gold)', margin: '10px 0' }}>
            <Clock size={16} aria-hidden="true" />
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Thời gian còn lại: {displaySeconds}s</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
            Nếu {drawerName} không chọn kịp, lượt vẽ sẽ tự động được chuyển sang phù thủy tiếp theo!
          </p>
        </div>
      )}
    </ModalDialog>
  );
};
