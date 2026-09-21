import React, { useEffect } from 'react';
import type { Player } from '../types';
import { AvatarDisplay } from './AvatarPicker';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import { Trophy, RotateCcw, Home, Crown, Sparkles, Users, LogOut, Medal, Shield } from 'lucide-react';

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
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  useEffect(() => {
    soundManager.playVictory();

    // Hogwarts 4 house colored confetti: Gold, Scarlet, Emerald, Sapphire
    const colors = ['#ffd875', '#740001', '#1a472a', '#0e1a40'];
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 4, 10, 0.94)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        className="animate-bounce-in podium-modal"
        style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--hogwarts-gold)',
          borderRadius: '24px',
          padding: '24px 28px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 216, 117, 0.2)',
          textAlign: 'center',
          overflowY: 'auto',
        }}
      >
        {/* Header Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--hogwarts-gold)', marginBottom: '4px' }}>
          <Trophy size={28} />
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900 }} className="font-cinzel">
            ĐẠI TIỆC TỔNG KẾT & TRAO CÚP NHÀ HOGWARTS
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
          Trận thi tài 3 vòng đã khép lại! Vinh danh những phù thủy có nhãn lực và tài hội họa xuất sắc nhất!
        </p>

        {/* Top 3 Podium Pillars */}
        <div
          className="podium-container"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '20px',
            height: '210px',
            width: '100%',
            flexShrink: 0,
          }}
        >
          {/* 2nd Place */}
          {second && (
            <div className="podium-pillar-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '120px', minWidth: '0' }}>
              <AvatarDisplay avatar={second.avatar} size={48} />
              <span style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px', color: '#fff', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {second.name}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--hogwarts-gold)', fontWeight: 800, marginBottom: '6px' }}>
                {second.score} Điểm
              </span>
              <div
                style={{
                  width: '100%',
                  height: '95px',
                  background: 'linear-gradient(180deg, #94a3b8 0%, #475569 100%)',
                  borderTop: '4px solid #cbd5e1',
                  borderRadius: '14px 14px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
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

          {/* 1st Place (House Cup Champion) */}
          {first && (
            <div className="podium-pillar-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1.15, maxWidth: '135px', minWidth: '0' }}>
              <div style={{ position: 'relative' }}>
                <Crown size={28} color="#ffd875" style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)' }} />
                <AvatarDisplay avatar={first.avatar} size={60} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, marginTop: '6px', color: 'var(--hogwarts-gold)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }} className="font-cinzel">
                {first.name}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 800, marginBottom: '6px' }}>
                {first.score} Điểm
              </span>
              <div
                style={{
                  width: '100%',
                  height: '130px',
                  background: 'linear-gradient(180deg, #ffd875 0%, #c8aa6e 60%, #8f6e2f 100%)',
                  borderTop: '4px solid #fff2be',
                  borderRadius: '16px 16px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
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

          {/* 3rd Place */}
          {third && (
            <div className="podium-pillar-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '120px', minWidth: '0' }}>
              <AvatarDisplay avatar={third.avatar} size={44} />
              <span style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px', color: '#fff', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {third.name}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--hogwarts-gold)', fontWeight: 800, marginBottom: '6px' }}>
                {third.score} Điểm
              </span>
              <div
                style={{
                  width: '100%',
                  height: '70px',
                  background: 'linear-gradient(180deg, #b45309 0%, #78350f 100%)',
                  borderTop: '4px solid #f59e0b',
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
                3
              </div>
            </div>
          )}
        </div>

        {/* Full Scoreboard Summary Table */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-gold)',
            borderRadius: '16px',
            padding: '12px 16px',
            marginBottom: '20px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--hogwarts-gold)', marginBottom: '10px' }}>
            <Sparkles size={16} />
            <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }} className="font-cinzel">
              BẢNG TỔNG KẾT ĐIỂM SỐ TẤT CẢ PHÙ THỦY ({sorted.length} Thành Viên)
            </span>
          </div>

          <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
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
                    gap: '10px',
                    padding: '6px 10px',
                    borderRadius: '10px',
                    background: isCurrentUser
                      ? 'rgba(212, 175, 55, 0.16)'
                      : idx % 2 === 0
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'transparent',
                    border: isCurrentUser ? '1px solid var(--hogwarts-gold)' : '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {/* Rank medal & Avatar & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ width: '22px', textAlign: 'center', fontWeight: 900, fontSize: '14px', flexShrink: 0 }}>
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </span>
                    <AvatarDisplay avatar={player.avatar} size={28} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {player.name}
                        </span>
                        {player.isHost && (
                          <span style={{ fontSize: '9px', background: 'rgba(212, 175, 55, 0.25)', color: 'var(--hogwarts-gold)', padding: '1px 5px', borderRadius: '6px', fontWeight: 700 }}>
                            Chủ phòng
                          </span>
                        )}
                        {isCurrentUser && (
                          <span style={{ fontSize: '9px', background: 'rgba(34, 211, 238, 0.25)', color: 'var(--accent-cyan)', padding: '1px 5px', borderRadius: '6px', fontWeight: 700 }}>
                            Bạn
                          </span>
                        )}
                        {player.isBot && (
                          <span style={{ fontSize: '9px', background: 'rgba(148, 163, 184, 0.25)', color: '#94a3b8', padding: '1px 5px', borderRadius: '6px', fontWeight: 600 }}>
                            AI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title & Score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {rank === 1
                        ? '👑 Quán Quân Cúp Nhà'
                        : rank === 2
                        ? '🥈 Thần Sáng Xuất Chúng'
                        : rank === 3
                        ? '🥉 Bậc Thầy Nhãn Lực'
                        : '✨ Pháp Sư Học Viện'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--hogwarts-gold)', minWidth: '65px', textAlign: 'right' }}>
                      {player.score} Điểm
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons & Notice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
            {/* Primary Action: Play Again in same room */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onPlayAgain(false);
              }}
              className="btn-gold"
              style={{ padding: '12px 24px', flex: '1 1 200px', maxWidth: '280px' }}
              title="Bắt đầu ván mới ngay lập tức với toàn bộ thành viên hiện tại"
            >
              <RotateCcw size={18} /> Làm Ván Mới (Cùng Phòng)
            </button>

            {/* Secondary Action: Return all to waiting room */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onPlayAgain(true);
              }}
              className="btn-gryffindor"
              style={{ padding: '12px 22px', flex: '1 1 190px', maxWidth: '260px' }}
              title="Cùng toàn bộ thành viên quay về phòng chờ để đổi chế độ hoặc thêm bot"
            >
              <Users size={18} /> Về Phòng Chờ Đổi Chế Độ
            </button>

            {/* Exit Room */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onBackToLobby();
              }}
              className="btn-icon"
              style={{ padding: '12px 18px', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
              title="Rời khỏi phòng để ra sảnh chính"
            >
              <LogOut size={16} /> Rời Phòng
            </button>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--accent-cyan)', margin: '4px 0 0 0', fontWeight: 600 }}>
            🏰 Tất cả {players.length} thành viên vẫn được giữ nguyên trong phòng — không ai bị đá ra ngoài!
          </p>
        </div>
      </div>
    </div>
  );
};
