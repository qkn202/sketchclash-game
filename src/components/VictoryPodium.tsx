import React, { useEffect, useState, useId } from 'react';
import type { Player } from '../types';
import { AvatarDisplay } from './AvatarPicker';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import { Trophy, RotateCcw, Crown, Sparkles, Users, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { ModalDialog } from './ModalDialog';

interface VictoryPodiumProps {
  players: Player[];
  isHost?: boolean;
  currentPlayerId?: string;
  onPlayAgain: (returnToWaitingRoom?: boolean) => void;
  onBackToLobby: () => void;
}

export const VictoryPodium: React.FC<VictoryPodiumProps> = ({
  players,
  isHost = true,
  currentPlayerId,
  onPlayAgain,
  onBackToLobby,
}) => {
  const titleId = useId();
  const [showFullScores, setShowFullScores] = useState(false);

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  useEffect(() => {
    soundManager.playVictory();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const colors = ['#ffd875', '#740001', '#1a472a', '#0e1a40'];
    const fireBurst = () => {
      confetti({
        particleCount: 18,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 18,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors,
        disableForReducedMotion: true,
      });
    };

    fireBurst();
    const intervalId = window.setInterval(fireBurst, 450);
    const stopTimerId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 3200);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(stopTimerId);
      confetti.reset();
    };
  }, []);

  return (
    <ModalDialog
      ariaLabelledBy={titleId}
      dismissible={false}
      maxWidth="680px"
      className="podium-modal"
      style={{ textAlign: 'center' }}
    >
      {/* Header Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--hogwarts-gold)', marginBottom: '4px' }}>
        <Trophy size={26} aria-hidden="true" />
        <h2 id={titleId} style={{ fontSize: 'clamp(17px, 3.8vw, 24px)', fontWeight: 900, margin: 0 }} className="font-cinzel">
          ĐẠI TIỆC TRAO CÚP NHÀ HOGWARTS
        </h2>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
        Vinh danh những phù thủy có nhãn lực và tài hội họa xuất sắc nhất!
      </p>

      {/* Top 3 Podium Pillars */}
      <div
        className="podium-container"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '28px',
          marginBottom: '16px',
          height: '190px',
          width: '100%',
          flexShrink: 0,
        }}
      >
        {second && (
          <div className="podium-pillar-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '110px', minWidth: '0' }}>
            <AvatarDisplay avatar={second.avatar} size={44} />
            <span style={{ fontSize: '11.5px', fontWeight: 700, marginTop: '4px', color: '#fff', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
              {second.name}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--hogwarts-gold)', fontWeight: 800, marginBottom: '4px' }}>
              {second.score} Điểm
            </span>
            <div
              style={{
                width: '100%',
                height: '80px',
                background: 'linear-gradient(180deg, #94a3b8 0%, #475569 100%)',
                borderTop: '4px solid #cbd5e1',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 900,
                color: '#fff',
                boxShadow: '0 -4px 15px rgba(0,0,0,0.5)',
              }}
              className="font-cinzel"
            >
              2
            </div>
          </div>
        )}

        {first && (
          <div className="podium-pillar-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1.15, maxWidth: '125px', minWidth: '0' }}>
            <div style={{ position: 'relative' }}>
              <Crown size={26} color="#ffd875" aria-hidden="true" style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)' }} />
              <AvatarDisplay avatar={first.avatar} size={54} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 800, marginTop: '6px', color: 'var(--hogwarts-gold)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }} className="font-cinzel">
              {first.name}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', fontWeight: 800, marginBottom: '4px' }}>
              {first.score} Điểm
            </span>
            <div
              style={{
                width: '100%',
                height: '115px',
                background: 'linear-gradient(180deg, #ffd875 0%, #c8aa6e 60%, #8f6e2f 100%)',
                borderTop: '4px solid #fff2be',
                borderRadius: '14px 14px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 900,
                color: '#261601',
                boxShadow: '0 -4px 25px rgba(255, 216, 117, 0.5)',
              }}
              className="font-cinzel"
            >
              1
            </div>
          </div>
        )}

        {third && (
          <div className="podium-pillar-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '110px', minWidth: '0' }}>
            <AvatarDisplay avatar={third.avatar} size={40} />
            <span style={{ fontSize: '11.5px', fontWeight: 700, marginTop: '4px', color: '#fff', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
              {third.name}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--hogwarts-gold)', fontWeight: 800, marginBottom: '4px' }}>
              {third.score} Điểm
            </span>
            <div
              style={{
                width: '100%',
                height: '60px',
                background: 'linear-gradient(180deg, #b45309 0%, #78350f 100%)',
                borderTop: '4px solid #f59e0b',
                borderRadius: '10px 10px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 900,
                color: '#fff',
                boxShadow: '0 -4px 15px rgba(0,0,0,0.5)',
              }}
              className="font-cinzel"
            >
              3
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
          {isHost ? (
            <>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  soundManager.playClick();
                  onPlayAgain(false);
                }}
                className="btn-gold"
                style={{ padding: '10px 18px', fontSize: '14px', flex: '1 1 180px', maxWidth: '260px' }}
              >
                <RotateCcw size={16} aria-hidden="true" /> Làm Ván Mới (Cùng Phòng)
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onPlayAgain(true);
                }}
                className="btn-gryffindor"
                style={{ padding: '10px 16px', fontSize: '13px', flex: '1 1 170px', maxWidth: '240px' }}
              >
                <Users size={16} aria-hidden="true" /> Về Phòng Chờ Đổi Chế Độ
              </button>
            </>
          ) : (
            <div
              style={{
                background: 'rgba(255, 216, 117, 0.15)',
                border: '1px solid var(--border-gold)',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '13px',
                color: 'var(--hogwarts-gold)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              className="font-cinzel"
            >
              <Sparkles size={15} aria-hidden="true" /> Đang đợi Trưởng Phòng làm ván mới...
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onBackToLobby();
            }}
            className="btn-icon"
            style={{ padding: '10px 14px', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
          >
            <LogOut size={16} aria-hidden="true" /> Rời Phòng
          </button>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--accent-cyan)', margin: 0, fontWeight: 600 }}>
          🏰 Tất cả {players.length} thành viên vẫn được giữ nguyên trong phòng — không ai bị đá ra ngoài!
        </p>
      </div>

      {/* Full Scoreboard Summary Toggle */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-gold)',
          borderRadius: '16px',
          padding: '10px 14px',
          textAlign: 'left',
        }}
      >
        <button
          type="button"
          aria-expanded={showFullScores}
          onClick={() => setShowFullScores(!showFullScores)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'transparent',
            border: 'none',
            color: 'var(--hogwarts-gold)',
            cursor: 'pointer',
            padding: '2px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={15} aria-hidden="true" />
            <span style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase' }} className="font-cinzel">
              BẢNG TỔNG KẾT ĐIỂM SỐ ({sorted.length} Phù Thủy)
            </span>
          </div>
          {showFullScores ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </button>

        {showFullScores && (
          <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', paddingRight: '4px' }}>
            {sorted.map((player, idx) => {
              const rank = idx + 1;
              const isCurrentUser = player.id === currentPlayerId;
              return (
                <div
                  key={player.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '5px 8px',
                    borderRadius: '8px',
                    background: isCurrentUser
                      ? 'rgba(212, 175, 55, 0.16)'
                      : idx % 2 === 0
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'transparent',
                    border: isCurrentUser ? '1px solid var(--hogwarts-gold)' : '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <span style={{ width: '20px', textAlign: 'center', fontWeight: 900, fontSize: '13px', flexShrink: 0 }}>
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </span>
                    <AvatarDisplay avatar={player.avatar} size={24} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player.name}
                    </span>
                    {player.isHost && (
                      <span style={{ fontSize: '8.5px', background: 'rgba(212, 175, 55, 0.25)', color: 'var(--hogwarts-gold)', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>
                        Host
                      </span>
                    )}
                    {isCurrentUser && (
                      <span style={{ fontSize: '8.5px', background: 'rgba(34, 211, 238, 0.25)', color: 'var(--accent-cyan)', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>
                        Bạn
                      </span>
                    )}
                    {player.isBot && (
                      <span style={{ fontSize: '8.5px', background: 'rgba(148, 163, 184, 0.25)', color: '#94a3b8', padding: '1px 4px', borderRadius: '4px' }}>
                        AI
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--hogwarts-gold)', minWidth: '60px', textAlign: 'right', flexShrink: 0 }}>
                    {player.score}đ
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalDialog>
  );
};
