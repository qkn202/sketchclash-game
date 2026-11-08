import React from 'react';
import type { GameMode, GamePhase } from '../types';
import { Sparkles } from 'lucide-react';

interface CanvasOverlayBadgesProps {
  isDrawer: boolean;
  mode: GameMode;
  coopPartnerName?: string;
  isLoneGuesser: boolean;
  phase: GamePhase;
  currentWord: string;
  roundEndMessage: string | null;
}

export const CanvasOverlayBadges: React.FC<CanvasOverlayBadgesProps> = ({
  isDrawer,
  mode,
  coopPartnerName,
  isLoneGuesser,
  phase,
  currentWord,
  roundEndMessage,
}) => {
  return (
    <>
      {!isDrawer ? (
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
      ) : null}

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
            gap: '12px',
            zIndex: 30,
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div
            className="animate-bounce-in"
            style={{
              background: 'linear-gradient(135deg, rgba(25, 12, 42, 0.96) 0%, rgba(10, 5, 20, 0.96) 100%)',
              border: '2px solid var(--hogwarts-gold)',
              borderRadius: '20px',
              padding: '20px 32px',
              boxShadow: '0 0 40px rgba(255, 216, 117, 0.4), inset 0 0 20px rgba(255, 216, 117, 0.1)',
              maxWidth: '90%',
            }}
          >
            <span
              style={{ fontSize: '13px', color: 'var(--accent-yellow)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}
              className="font-cinzel"
            >
              KẾT THÚC LƯỢT ĐẤU
            </span>
            <h2
              style={{
                fontSize: 'clamp(22px, 4vw, 34px)',
                color: '#fff',
                margin: '10px 0',
                textShadow: '0 0 20px rgba(255, 216, 117, 0.6)',
                fontWeight: 900,
                letterSpacing: '1px',
              }}
              className="gold-title"
            >
              {currentWord || 'Bảo bối ma thuật'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--accent-cyan)', fontWeight: 600, whiteSpace: 'pre-line' }}>
              {roundEndMessage || 'Đang chuẩn bị lượt tiếp theo...'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

