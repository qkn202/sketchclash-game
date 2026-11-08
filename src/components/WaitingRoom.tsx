import React, { useState } from 'react';
import type { Player, RoomConfig, GameMode } from '../types';
import { AvatarDisplay } from './AvatarPicker';
import { ModeSelectorPanel, GAME_MODES } from './ModeSelectorPanel';
import { WaitingRoomSettings } from './WaitingRoomSettings';
import { Users, Bot, Play, Copy, Check, ArrowLeft, Sparkles, Shield, Crown, Link2, X } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface WaitingRoomProps {
  roomConfig: RoomConfig;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onModeChange: (mode: GameMode) => void;
  onRoomConfigChange: (partial: Partial<RoomConfig>) => void;
  onAddBot: () => void;
  onRemovePlayer: (playerId: string) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomConfig,
  players,
  currentPlayerId,
  isHost,
  onModeChange,
  onRoomConfigChange,
  onAddBot,
  onRemovePlayer,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(roomConfig.roomCode).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteLink = () => {
    soundManager.playClick();
    const t = roomConfig.roomToken
      ? `&t=${encodeURIComponent(roomConfig.roomToken)}`
      : '';
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomConfig.roomCode)}${t}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const selectedModeId = roomConfig.mode || 'classic';
  const selectedMode = GAME_MODES.find((m) => m.id === selectedModeId) || GAME_MODES[0];
  const canStart = players.length >= 2;
  const maxPlayers = roomConfig.maxPlayers || 20;

  return (
    <main className="waiting-room-container">
      {/* Top Navigation & Quick Host Action Bar */}
      <header
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
            aria-label="Rời phòng về đại sảnh"
            className="btn-icon"
            style={{ padding: '8px' }}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                className="gold-title"
                style={{ fontSize: 'clamp(16px, 3.5vw, 22px)', fontWeight: 900, margin: 0 }}
              >
                {roomConfig.roomName}
              </h1>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', minBlockSize: '36px' }}
          >
            {copiedCode ? <Check size={14} color="#4ade80" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            <span style={{ fontSize: '11px' }}>{copiedCode ? 'Đã chép mã!' : 'Chép Mã'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="btn-icon"
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', minBlockSize: '36px', borderColor: 'var(--border-gold)' }}
          >
            {copiedLink ? <Check size={14} color="#4ade80" aria-hidden="true" /> : <Link2 size={14} color="var(--hogwarts-gold)" aria-hidden="true" />}
            <span style={{ fontSize: '11px', color: 'var(--hogwarts-gold)' }}>{copiedLink ? 'Đã chép Link!' : 'Link Mời'}</span>
          </button>
        </div>
      </header>

      <WaitingRoomSettings
        roomConfig={roomConfig}
        playersCount={players.length}
        isHost={isHost}
        onRoomConfigChange={onRoomConfigChange}
      />

      {/* Main Content Layout */}
      <div className="waiting-room-grid">
        <ModeSelectorPanel
          selectedModeId={selectedModeId}
          isHost={isHost}
          onModeChange={onModeChange}
        />

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
            <h2
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
              <Users size={17} color="var(--hogwarts-gold)" aria-hidden="true" />
              Phù Thủy Trong Sảnh ({players.length}/{maxPlayers})
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {roomConfig.language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
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
                  {isHost && !isMe && (
                    <button
                      type="button"
                      aria-label={p.isBot ? `Thu hồi Pháp sư AI ${p.name}` : `Mời ${p.name} rời phòng`}
                      onClick={() => {
                        soundManager.playClick();
                        onRemovePlayer(p.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        minInlineSize: '24px',
                        minBlockSize: '24px',
                        padding: '2px',
                        borderRadius: '8px',
                        background: 'rgba(185, 28, 28, 0.82)',
                        border: '1px solid rgba(254, 202, 202, 0.5)',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  )}

                  {p.isHost && (
                    <div style={{ position: 'absolute', top: '6px', right: '6px' }} aria-hidden="true">
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
            <Shield size={18} color="var(--hogwarts-gold)" style={{ flexShrink: 0 }} aria-hidden="true" />
            <div>
              <strong style={{ color: '#fff' }}>Luật Thi Đấu: </strong>
              {selectedMode.id === 'classic' && 'Mỗi lượt 1 người vẽ, tất cả cùng gõ phím giải mã tên bảo bối.'}
              {selectedMode.id === 'dual_coop' && 'Mỗi lượt 2 người cùng vẽ song song! Đoán đúng sẽ cộng điểm cho cả 2 họa sĩ.'}
              {selectedMode.id === 'all_draw' && 'Chỉ 1 người đoán! Tất cả những người còn lại đều cầm đũa vẽ cùng lúc để gợi ý.'}
              {selectedMode.id === 'rush_draw' && 'Tất cả cùng nhận từ khóa riêng và cùng vẽ! Vừa vẽ vừa soi tranh đối thủ để gõ đoán ghi điểm.'}
              {selectedMode.id === 'relay_phone' && 'Truyền tay dây chuyền Viết câu → Vẽ tranh → Đoán nghĩa, cuối ván cùng lật mở Nhật Ký và thả biểu cảm (+15đ)! (Tự động gọi đủ tối thiểu 3 người).'}
              {selectedMode.id === 'polyjuice_impostor' && 'Mỗi người lần lượt vẽ 1 nét bằng màu mực riêng. 1 Kẻ Giả Mạo không biết từ khóa bí mật — bỏ phiếu bắt kẻ gian hoặc lật kèo phút chót! (Tối thiểu 4 người).'}
            </div>
          </div>
        </div>
      </div>

      {/* Big Bottom Action Card */}
      <div className="waiting-room-launch-card">
        <div className="dock-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }} aria-hidden="true">{selectedMode.icon}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--hogwarts-gold)' }} className="font-cinzel">
                {selectedMode.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {players.length}/{maxPlayers} phù thủy sẵn sàng {players.length < 2 && '• (Bấm "+Bot" để thêm người)'}
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
                disabled={players.length >= maxPlayers}
                className="btn-gryffindor"
                style={{ padding: '12px 18px', fontSize: '14px', borderRadius: '12px' }}
              >
                <Bot size={18} aria-hidden="true" /> Triệu Hồi Bot (+Bot)
              </button>

              {players.some((p) => p.isBot) && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    const lastBot = [...players].reverse().find((p) => p.isBot);
                    if (lastBot) onRemovePlayer(lastBot.id);
                  }}
                  className="btn-icon"
                  style={{
                    padding: '10px 14px',
                    fontSize: '13px',
                    borderRadius: '12px',
                    gap: '6px',
                    borderColor: 'rgba(248, 113, 113, 0.6)',
                    color: '#fca5a5',
                  }}
                >
                  <X size={15} aria-hidden="true" /> Thu Hồi Bot (-Bot)
                </button>
              )}

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
                <Play size={18} aria-hidden="true" />
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
              <Sparkles size={16} aria-hidden="true" />
              <span>Đang đợi Trưởng Phòng khai mạc ván đấu...</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
