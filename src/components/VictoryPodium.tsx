import React, { useEffect, useState } from 'react';
import type { Player } from '../types';
import { AvatarDisplay } from './AvatarPicker';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import { Trophy, RotateCcw, Home, Crown, Sparkles, Users, LogOut, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [showFullScores, setShowFullScores] = useState(false);

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
        padding: '12px',
      }}
    >
      <div
        className="animate-bounce-in podium-modal"
        style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--hogwarts-gold)',
          borderRadius: '24px',
          padding: 'clamp(14px, 3vw, 24px)',
          maxWidth: '680px',
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
          <Trophy size={26} />
          <h2 style={{ fontSize: 'clamp(17px, 3.8vw, 24px)', fontWeight: 900, margin: 0 }} className="font-cinzel">
            ĐẠI TIỆC TRAO CÚP NHÀ HOGWARTS
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
          Vinh danh những phù thủy có nhãn lực và tài hội họa xuất sắc nhất!
        </p>

        {/* Top 3 Podium Pillars: Adequate top margin prevents crown overlap */}
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
          {/* 2nd Place */}
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

          {/* 1st Place (House Cup Champion) */}
          {first && (
            <div className="podium-pillar-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1.15, maxWidth: '125px', minWidth: '0' }}>
              <div style={{ position: 'relative' }}>
                <Crown size={26} color="#ffd875" style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)' }} />
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

          {/* 3rd Place */}
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

        {/* Action Buttons: Immediately visible right under the podium */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
            {isHost ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    onPlayAgain(false);
                  }}
                  className="btn-gold"
                  style={{ padding: '10px 18px', fontSize: '14px', flex: '1 1 180px', maxWidth: '260px' }}
                  title="Bắt đầu ván mới ngay lập tức với toàn bộ thành viên hiện tại"
                >
                  <RotateCcw size={16} /> Làm Ván Mới (Cùng Phòng)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    onPlayAgain(true);
                  }}
                  className="btn-gryffindor"
                  style={{ padding: '10px 16px', fontSize: '13px', flex: '1 1 170px', maxWidth: '240px' }}
                  title="Cùng toàn bộ thành viên quay về phòng chờ để đổi chế độ hoặc thêm bot"
                >
                  <Users size={16} /> Về Phòng Chờ Đổi Chế Độ
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
                <Sparkles size={15} /> Đang đợi Trưởng Phòng làm ván mới...
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
              title="Rời khỏi phòng để ra sảnh chính"
            >
              <LogOut size={16} /> Rời Phòng
            </button>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--accent-cyan)', margin: 0, fontWeight: 600 }}>
            🏰 Tất cả {players.length} thành viên vẫn được giữ nguyên trong phòng — không ai bị đá ra ngoài!
          </p>
        </div>

        {/* Full Scoreboard Summary Table Toggle (Collapsible on Mobile for maximum space efficiency) */}
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
              <Sparkles size={15} />
              <span style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase' }} className="font-cinzel">
                BẢNG TỔNG KẾT ĐIỂM SỐ ({sorted.length} Phù Thủy)
              </span>
            </div>
            {showFullScores ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                    {/* Rank & Avatar & Name */}
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

                    {/* Score */}
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--hogwarts-gold)', minWidth: '60px', textAlign: 'right', flexShrink: 0 }}>
                      {player.score}đ
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
