import React, { useEffect, useRef } from 'react';
import type { GameMode, GamePhase } from '../types';
import { Sparkles, Wand2, Clock } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface CanvasOverlayBadgesProps {
  isDrawer: boolean;
  mode: GameMode;
  coopPartnerName?: string;
  isLoneGuesser: boolean;
  phase: GamePhase;
  currentWord: string;
  roundEndMessage: string | null;
  isSelectingWord?: boolean;
  selectingDrawerName?: string;
  wordChoices?: string[];
  timeLeft?: number;
  onSelectWord?: (word: string) => void;
}

export const CanvasOverlayBadges: React.FC<CanvasOverlayBadgesProps> = ({
  isDrawer,
  mode,
  coopPartnerName,
  isLoneGuesser,
  phase,
  currentWord,
  roundEndMessage,
  isSelectingWord = false,
  selectingDrawerName = 'Họa sĩ',
  wordChoices = [],
  timeLeft = 15,
  onSelectWord,
}) => {
  const onSelectWordRef = useRef(onSelectWord);
  useEffect(() => {
    onSelectWordRef.current = onSelectWord;
  }, [onSelectWord]);

  const hasSelectedRef = useRef(false);
  useEffect(() => {
    if (phase === 'selecting_word' && isSelectingWord) {
      hasSelectedRef.current = false;
    }
  }, [phase, isSelectingWord, wordChoices]);

  const displaySeconds = Math.max(0, Math.min(15, timeLeft));

  const handleSelect = (word: string) => {
    if (hasSelectedRef.current) return;
    hasSelectedRef.current = true;
    soundManager.playClick();
    onSelectWordRef.current?.(word);
  };

  return (
    <>
      {phase === 'drawing' && (
        !isDrawer ? (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(10, 6, 18, 0.9)',
              backdropFilter: 'blur(6px)',
              padding: '6px 14px',
              borderRadius: '20px',
              color: isLoneGuesser && mode === 'all_draw' ? 'var(--accent-cyan)' : 'var(--hogwarts-gold)',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: isLoneGuesser && mode === 'all_draw' ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 216, 117, 0.3)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
            }}
            className="font-cinzel"
          >
            <Sparkles size={14} color={isLoneGuesser && mode === 'all_draw' ? 'var(--accent-cyan)' : 'var(--hogwarts-gold)'} aria-hidden="true" />
            <span>
              {isLoneGuesser && mode === 'all_draw'
                ? '🔍 Thám Tử Đoán Chữ — Hãy quan sát toàn bộ nét vẽ để phá án!'
                : 'Quan Sát Bùa Vẽ'}
            </span>
          </div>
        ) : mode === 'dual_coop' ? (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(116, 0, 1, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '6px 14px',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--hogwarts-gold)',
              boxShadow: '0 0 10px rgba(255, 216, 117, 0.4)',
              pointerEvents: 'none',
            }}
            className="font-cinzel"
          >
            <span>🤝 Song Kiếm Hợp Bích {coopPartnerName ? `cùng ${coopPartnerName}` : ''}</span>
          </div>
        ) : mode === 'all_draw' ? (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(26, 71, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '6px 14px',
              borderRadius: '20px',
              color: '#d8f3dc',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--accent-cyan)',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
              pointerEvents: 'none',
            }}
            className="font-cinzel"
          >
            <span>🎭 Đại Hợp Xướng — Bạn và toàn trường cùng múa đũa!</span>
          </div>
        ) : null
      )}

      {phase === 'selecting_word' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(6, 4, 10, 0.88)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 35,
            padding: 'clamp(10px, 2.5vw, 24px)',
            textAlign: 'center',
            overflowY: 'auto',
          }}
        >
          <div
            className="animate-bounce-in"
            style={{
              background: 'linear-gradient(135deg, rgba(25, 12, 42, 0.96) 0%, rgba(10, 5, 20, 0.96) 100%)',
              border: '2px solid var(--hogwarts-gold)',
              borderRadius: '18px',
              padding: 'clamp(12px, 2.5vw, 24px) clamp(14px, 3vw, 28px)',
              boxShadow: '0 0 36px rgba(255, 216, 117, 0.35), inset 0 0 18px rgba(255, 216, 117, 0.08)',
              width: '100%',
              maxWidth: '520px',
            }}
          >
            {isSelectingWord ? (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--hogwarts-gold)', marginBottom: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Wand2 size={18} aria-hidden="true" />
                  <span style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }} className="font-cinzel">
                    LƯỢT VẼ PHÉP THUẬT CỦA BẠN!
                  </span>
                </div>

                <h2 style={{ fontSize: 'clamp(15px, 3.5vw, 22px)', fontWeight: 800, marginBottom: '6px', color: '#fff' }} className="font-cinzel">
                  Chọn 1 từ khóa để vẽ:
                </h2>

                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: 'var(--hogwarts-gold)', marginBottom: '12px', background: 'rgba(212, 175, 55, 0.14)', padding: '3px 12px', borderRadius: '14px', border: '1px solid var(--border-gold)' }}>
                  <Clock size={14} aria-hidden="true" />
                  <span style={{ fontWeight: 700, fontSize: '12.5px' }}>Thời gian chọn từ: {displaySeconds}s</span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  {wordChoices.map((word, index) => (
                    <button
                      key={`${word}_${index}`}
                      type="button"
                      onClick={() => handleSelect(word)}
                      className="btn-gold"
                      style={{
                        padding: '10px 8px',
                        fontSize: 'clamp(13px, 3vw, 15.5px)',
                        fontWeight: 800,
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        minBlockSize: 'clamp(48px, 9dvh, 76px)',
                        wordBreak: 'break-word',
                      }}
                    >
                      <Sparkles size={14} color="#634706" aria-hidden="true" />
                      <span>{word}</span>
                    </button>
                  ))}
                </div>

                <p style={{ fontSize: '11.5px', color: '#ffd875', margin: 0, fontWeight: 600 }}>
                  ⚠️ Nếu không chọn trong {displaySeconds}s, lượt vẽ sẽ tự động chuyển tiếp!
                </p>
              </>
            ) : (
              <div>
                <div className="animate-float" style={{ fontSize: 'clamp(28px, 6vw, 44px)', marginBottom: '8px', lineHeight: 1 }} aria-hidden="true">
                  ⚡
                </div>
                <h2 style={{ fontSize: 'clamp(15px, 3.6vw, 21px)', fontWeight: 800, marginBottom: '8px', color: 'var(--hogwarts-gold)' }} className="font-cinzel">
                  <span>{selectingDrawerName}</span> đang chọn từ khóa...
                </h2>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--hogwarts-gold)', background: 'rgba(212, 175, 55, 0.15)', padding: '5px 12px', borderRadius: '16px', border: '1px solid var(--border-gold)', marginBottom: '8px' }}>
                  <Clock size={14} aria-hidden="true" />
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>Thời gian còn lại: {displaySeconds}s</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                  💬 Trong lúc chờ, bạn vẫn có thể trò chuyện tự do cùng cả phòng!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'round_end' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(6, 4, 10, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            zIndex: 30,
            padding: 'clamp(10px, 2.5vw, 20px)',
            textAlign: 'center',
            overflowY: 'auto',
          }}
        >
          <div
            className="animate-bounce-in"
            style={{
              background: 'linear-gradient(135deg, rgba(25, 12, 42, 0.96) 0%, rgba(10, 5, 20, 0.96) 100%)',
              border: '2px solid var(--hogwarts-gold)',
              borderRadius: '20px',
              padding: 'clamp(14px, 3vw, 22px) clamp(18px, 4vw, 32px)',
              boxShadow: '0 0 40px rgba(255, 216, 117, 0.4), inset 0 0 20px rgba(255, 216, 117, 0.1)',
              maxWidth: '92%',
            }}
          >
            <span
              style={{ fontSize: '12px', color: 'var(--accent-yellow)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}
              className="font-cinzel"
            >
              KẾT THÚC LƯỢT ĐẤU
            </span>
            <h2
              style={{
                fontSize: 'clamp(20px, 4vw, 34px)',
                color: '#fff',
                margin: '8px 0',
                textShadow: '0 0 20px rgba(255, 216, 117, 0.6)',
                fontWeight: 900,
                letterSpacing: '1px',
                wordBreak: 'break-word',
              }}
              className="gold-title"
            >
              {currentWord || 'Bảo bối ma thuật'}
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--accent-cyan)', fontWeight: 600, whiteSpace: 'pre-line', margin: 0 }}>
              {roundEndMessage || 'Đang chuẩn bị lượt tiếp theo...'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
