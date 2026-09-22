import React, { useState } from 'react';
import type { Player, RoomConfig, GameMode } from '../types';
import { AvatarDisplay } from './AvatarPicker';
import { Wand2, Users, Bot, Play, Copy, Check, ArrowLeft, Sparkles, Shield, Crown } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface WaitingRoomProps {
  roomConfig: RoomConfig;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onModeChange: (mode: GameMode) => void;
  onAddBot: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

interface GameModeOption {
  id: GameMode;
  name: string;
  subtitle: string;
  icon: string;
  badge: string;
  desc: string;
}

const GAME_MODES: GameModeOption[] = [
  {
    id: 'classic',
    name: 'Độc Hành Phép Thuật',
    subtitle: '1 Người Vẽ — Cả Phòng Đoán',
    icon: '🪄',
    badge: 'Cổ Điển',
    desc: 'Từng pháp sư lần lượt múa đũa vẽ bảo bối bí mật, những người còn lại so tài tốc độ giải mã.',
  },
  {
    id: 'dual_coop',
    name: 'Song Kiếm Hợp Bích',
    subtitle: '2 Phù Thủy Cùng Vẽ Song Song',
    icon: '🤝',
    badge: 'Co-op 2 Người',
    desc: '2 pháp sư cùng cầm đũa vẽ trực tiếp lên 1 bảng vẽ theo thời gian thực! Nhân đôi điểm thưởng tương trợ.',
  },
  {
    id: 'all_draw',
    name: 'Đại Hợp Xướng',
    subtitle: 'Tất Cả Cùng Vẽ — 1 Người Đoán',
    icon: '🎭',
    badge: 'Hỗn Loạn Cực Vui',
    desc: 'Chỉ 1 người làm Thám Tử duy nhất! Tất cả những người còn lại đồng loạt múa đũa để gợi ý cho Thám Tử.',
  },
];

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomConfig,
  players,
  currentPlayerId,
  isHost,
  onModeChange,
  onAddBot,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(roomConfig.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedMode = GAME_MODES.find((m) => m.id === (roomConfig.mode || 'classic')) || GAME_MODES[0];
  const canStart = players.length >= 2;

  return (
    <div className="waiting-room-container">
      {/* Top Navigation & Quick Host Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          background: 'var(--bg-card)',
          padding: '12px 18px',
          borderRadius: '16px',
          border: '2px solid var(--border-card)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="btn-icon"
            title="Rời phòng về đại sảnh"
            style={{ padding: '8px' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2
                className="gold-title"
                style={{ fontSize: 'clamp(16px, 3.5vw, 22px)', fontWeight: 900, margin: 0 }}
              >
                {roomConfig.roomName}
              </h2>
              <span
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid var(--hogwarts-gold)',
                  color: 'var(--hogwarts-gold)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {selectedMode.badge}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '2px 0 0 0' }}>
              Phòng Chờ Đại Sảnh Đường — Chọn chế độ và bắt đầu ván đấu
            </p>
          </div>
        </div>

        {/* Room Code & Copy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-gold)',
              borderRadius: '12px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MÃ:</span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '1px',
                color: 'var(--accent-cyan)',
              }}
              className="font-cinzel"
            >
              {roomConfig.roomCode}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="btn-icon"
            title="Sao chép mã phòng gửi bạn bè"
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', minHeight: '34px' }}
          >
            {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
            <span style={{ fontSize: '11px' }}>{copied ? 'Đã chép!' : 'Chép'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="waiting-room-grid">
        {/* Left Column: Game Mode Selection (Host Controls) */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '18px',
            borderRadius: '18px',
            border: '2px solid var(--border-card)',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: 'var(--hogwarts-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0,
              }}
              className="font-cinzel"
            >
              <Wand2 size={17} color="var(--hogwarts-gold)" />
              {isHost ? 'Thiết Lập Chế Độ Chơi (Host)' : 'Chế Độ Đang Chọn'}
            </h3>
            {isHost && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Chạm để đổi chế độ
              </span>
            )}
          </div>

          {/* Mode Selection Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {GAME_MODES.map((mode) => {
              const isSelected = (roomConfig.mode || 'classic') === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  disabled={!isHost}
                  onClick={() => {
                    if (!isHost) return;
                    soundManager.playToolSelect();
                    onModeChange(mode.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    borderRadius: '14px',
                    textAlign: 'left',
                    cursor: isHost ? 'pointer' : 'default',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.24) 0%, rgba(116, 0, 1, 0.28) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected
                      ? '2px solid var(--hogwarts-gold)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isSelected ? '0 0 16px rgba(255, 216, 117, 0.25)' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      fontSize: '26px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: isSelected ? '1px solid var(--hogwarts-gold)' : 'none',
                    }}
                  >
                    {mode.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          color: isSelected ? 'var(--hogwarts-gold)' : '#fff',
                        }}
                        className="font-cinzel"
                      >
                        {mode.name}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            fontSize: '9px',
                            background: 'var(--hogwarts-gold)',
                            color: '#261601',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontWeight: 800,
                          }}
                        >
                          ĐANG CHỌN
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: isSelected ? '#fef08a' : 'var(--text-muted)',
                        fontWeight: 600,
                        marginTop: '1px',
                      }}
                    >
                      {mode.subtitle}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.65)',
                        marginTop: '3px',
                        lineHeight: 1.3,
                      }}
                    >
                      {mode.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Player Roster in Great Hall */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '18px',
            borderRadius: '18px',
            border: '2px solid var(--border-card)',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: 'var(--hogwarts-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0,
              }}
              className="font-cinzel"
            >
              <Users size={17} color="var(--hogwarts-gold)" />
              Phù Thủy Trong Sảnh ({players.length}/8)
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {roomConfig.language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
            </span>
          </div>

          {/* Players Grid: Natural in-flow display (NO inner scroll container) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '10px',
              padding: '2px',
            }}
          >
            {players.map((p) => {
              const isMe = p.id === currentPlayerId;
              return (
                <div
                  key={p.id}
                  style={{
                    background: isMe
                      ? 'linear-gradient(180deg, rgba(212, 175, 55, 0.18) 0%, rgba(10, 6, 18, 0.7) 100%)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isMe
                      ? '2px solid var(--hogwarts-gold)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    padding: '10px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  {/* Host Crown */}
                  {p.isHost && (
                    <div style={{ position: 'absolute', top: '6px', right: '6px' }} title="Trưởng phòng (Host)">
                      <Crown size={14} color="#ffd700" />
                    </div>
                  )}

                  <AvatarDisplay avatar={p.avatar} size={46} />

                  <div style={{ width: '100%' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: isMe ? 'var(--hogwarts-gold)' : '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.name} {isMe && '(Bạn)'}
                    </div>
                    <div style={{ fontSize: '10px', color: p.isBot ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                      {p.isBot ? '🤖 Bot AI' : p.isHost ? '👑 Host' : '✨ Học sinh'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mode Rules Guide Box */}
          <div
            style={{
              marginTop: 'auto',
              background: 'var(--bg-stage)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Shield size={18} color="var(--hogwarts-gold)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#fff' }}>Luật Thi Đấu: </strong>
              {selectedMode.id === 'classic' && 'Mỗi lượt 1 người vẽ, tất cả cùng gõ phím giải mã tên bảo bối.'}
              {selectedMode.id === 'dual_coop' && 'Mỗi lượt 2 người cùng vẽ song song! Đoán đúng sẽ cộng điểm cho cả 2 họa sĩ.'}
              {selectedMode.id === 'all_draw' && 'Chỉ 1 người đoán! Tất cả những người còn lại đều cầm đũa vẽ cùng lúc để gợi ý.'}
            </div>
          </div>
        </div>
      </div>

      {/* Big Bottom Action Card: In natural page flow (NO sticky overlap) */}
      <div className="waiting-room-launch-card">
        <div className="dock-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{selectedMode.icon}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--hogwarts-gold)' }} className="font-cinzel">
                {selectedMode.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {players.length}/8 phù thủy sẵn sàng {players.length < 2 && '• (Bấm "+Bot" để thêm người)'}
              </div>
            </div>
          </div>
        </div>

        <div className="dock-actions">
          {isHost ? (
            <>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onAddBot();
                }}
                className="btn-gryffindor"
                style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '12px' }}
                title="Thêm học sinh Hogwarts AI vào phòng"
              >
                <Bot size={18} /> Triệu Hồi Bot (+Bot)
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playSpellVfx();
                  onStartGame();
                }}
                disabled={!canStart}
                className="btn-primary"
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: 900,
                  borderRadius: '12px',
                  boxShadow: canStart ? '0 6px 20px rgba(255, 216, 117, 0.4)' : 'none',
                }}
              >
                <Play size={18} />
                <span>BẮT ĐẦU VÁN ĐẤU</span>
              </button>
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--hogwarts-gold)',
                fontSize: '13px',
                fontWeight: 700,
              }}
              className="font-cinzel"
            >
              <Sparkles size={16} />
              <span>Đang đợi Trưởng Phòng khai mạc ván đấu...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
