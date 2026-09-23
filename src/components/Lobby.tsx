import React, { useState } from 'react';
import type { AvatarConfig, RoomConfig, GameMode } from '../types';
import { AvatarPicker } from './AvatarPicker';
import { Wand2, Play, Plus, LogIn, Bot, Volume2, VolumeX, Sparkles, Settings2, Scroll } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface LobbyProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  avatar: AvatarConfig;
  onAvatarChange: (avatar: AvatarConfig) => void;
  onJoinRoom: (roomCode: string, config?: Partial<RoomConfig>, addBots?: boolean, isCreating?: boolean) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  playerName,
  onPlayerNameChange,
  avatar,
  onAvatarChange,
  onJoinRoom,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());

  const [mode, setMode] = useState<GameMode>('classic');
  const [drawTime, setDrawTime] = useState<number>(60);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [maxPlayers, setMaxPlayers] = useState<number>(20);
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [customWordsText, setCustomWordsText] = useState('');

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };


  const handleQuickPlay = () => {
    if (!playerName.trim()) return;
    soundManager.playClick();
    const randomCode = 'HOGWARTS' + Math.floor(100 + Math.random() * 900);
    onJoinRoom(randomCode, {
      drawTime: 60,
      totalRounds: 3,
      language: 'vi',
    }, true, true);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCodeInput.trim()) return;
    soundManager.playClick();
    onJoinRoom(roomCodeInput.trim().toUpperCase(), undefined, false, false);
  };

  const handleCreateCustom = () => {
    if (!playerName.trim()) return;
    soundManager.playClick();
    const randomCode = 'SPELL' + Math.floor(1000 + Math.random() * 9000);
    const customWords = customWordsText
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    onJoinRoom(randomCode, {
      mode,
      drawTime,
      totalRounds,
      maxPlayers,
      language,
      customWords,
    }, false, true);
  };

  const handlePlaySoloWithBots = () => {
    if (!playerName.trim()) return;
    soundManager.playClick();
    const soloCode = 'MAGIC' + Math.floor(100 + Math.random() * 900);
    onJoinRoom(soloCode, {
      drawTime: 60,
      totalRounds: 3,
      language: 'vi',
    }, true, true);
  };

  return (
    <div
      style={{
        maxWidth: '1050px',
        margin: '8px auto',
        padding: 'clamp(8px, 2.5vw, 20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Top Brand Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="animate-float"
            style={{
              fontSize: 'clamp(24px, 6vw, 36px)',
              background: 'linear-gradient(135deg, #ffd875 0%, #740001 100%)',
              width: 'clamp(44px, 11vw, 56px)',
              height: 'clamp(44px, 11vw, 56px)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(255, 216, 117, 0.35)',
              border: '2px solid var(--hogwarts-gold)',
              flexShrink: 0,
            }}
          >
            ⚡
          </div>
          <div>
            <h1
              className="gold-title"
              style={{
                fontSize: 'clamp(20px, 5.5vw, 32px)',
                fontWeight: 900,
                letterSpacing: '1px',
                lineHeight: 1.1,
              }}
            >
              HOGWARTS SKETCH
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(11px, 2.8vw, 13px)', marginTop: '2px' }} className="font-cinzel">
              Đại Sảnh Đường — Đấu Trí Vẽ & Đoán Đồ Vật Ma Thuật
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSound}
          className="btn-icon"
          title={isMuted ? 'Mở Bùa Âm Thanh' : 'Tắt Bùa Âm Thanh'}
          style={{ padding: '10px' }}
        >
          {isMuted ? <VolumeX size={20} color="var(--accent-red)" /> : <Volume2 size={20} color="var(--hogwarts-gold)" />}
        </button>
      </div>

      {/* Main Grid */}
      <div className="lobby-grid">
        {/* Left: Avatar & Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '20px',
              border: '2px solid var(--border-card)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--hogwarts-gold)', display: 'block', marginBottom: '8px' }} className="font-cinzel">
              Tên Phù Thủy Của Bạn:
            </label>
            <input
              type="text"
              value={playerName}
              maxLength={20}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder="Nhập tên pháp sư..."
              style={{ width: '100%', fontSize: '17px', fontWeight: 700, padding: '12px 16px' }}
            />
          </div>

          <AvatarPicker avatar={avatar} onChange={onAvatarChange} />
        </div>

        {/* Right: Game Modes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '20px',
              border: '2px solid var(--border-card)',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hogwarts-gold)' }} className="font-cinzel">
              <Wand2 size={20} color="var(--hogwarts-gold)" /> Chọn Sảnh Thi Đấu
            </h3>

            {/* Quick Play (Gryffindor theme) */}
            <button
              type="button"
              onClick={handleQuickPlay}
              disabled={!playerName.trim()}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '17px' }}
            >
              <Play size={20} /> Vào Phòng Thi Đấu (Quick Play)
            </button>

            {/* Solo Practice with Hogwarts Bots */}
            <button
              type="button"
              onClick={handlePlaySoloWithBots}
              disabled={!playerName.trim()}
              className="btn-gryffindor"
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              <Bot size={20} /> Luyện Tập Cùng Học Sinh Hogwarts (AI Bots)
            </button>


            {/* Custom Room */}
            <button
              type="button"
              onClick={() => { soundManager.playClick(); setShowCustomModal(true); }}
              disabled={!playerName.trim()}
              className="btn-yellow"
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              <Plus size={20} /> Tạo Phòng Phép Thuật Riêng
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-card)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }} className="font-cinzel">HOẶC</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-card)' }} />
            </div>

            {/* Join by Code Form */}
            <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="NHẬP MÃ PHÒNG HOGWARTS..."
                style={{ flex: 1, textTransform: 'uppercase', fontWeight: 700 }}
              />
              <button
                type="submit"
                disabled={!playerName.trim() || !roomCodeInput.trim()}
                className="btn-primary"
                style={{ padding: '0 18px', borderRadius: '12px' }}
              >
                <LogIn size={18} /> Vào
              </button>
            </form>
          </div>

          {/* Magical Features Highlight */}
          <div
            style={{
              background: 'var(--bg-stage)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid var(--border-card)',
              fontSize: '13px',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--hogwarts-gold)' }}>
              <Scroll size={16} /> <strong>Học Viện Hogwarts:</strong> Tranh tài đoán các bảo bối huyền thoại: Quả Snitch Vàng, Mũ Phân Loại, Cú Hedwig, Áo Choàng Tàng Hình...
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
              <Sparkles size={16} color="var(--accent-cyan)" /> <strong>Học sinh AI thông thái:</strong> Cùng thi đấu với Hermione Granger, Ron Weasley, Draco Malfoy và Cụ Dumbledore!
            </div>
          </div>
        </div>
      </div>

      {/* Custom Room Modal */}
      {showCustomModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 4, 10, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="animate-bounce-in"
            style={{
              background: 'var(--bg-card)',
              border: '3px solid var(--hogwarts-gold)',
              borderRadius: '24px',
              padding: 'clamp(16px, 3vw, 24px)',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              width: '100%',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hogwarts-gold)', marginBottom: '16px' }}>
              <Settings2 size={24} />
              <h2 style={{ fontSize: '22px', fontWeight: 800 }} className="font-cinzel">Tùy Chỉnh Phòng Phép Thuật</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Chế độ thi đấu ma thuật:
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as GameMode)}
                  style={{ width: '100%', fontWeight: 700 }}
                >
                  <option value="classic">🪄 Độc Hành Phép Thuật (1 người vẽ - Cả phòng đoán)</option>
                  <option value="dual_coop">🤝 Song Kiếm Hợp Bích (Co-op 2 người cùng vẽ)</option>
                  <option value="all_draw">🎭 Đại Hợp Xướng (Tất cả vẽ - 1 người đoán)</option>
                  <option value="rush_draw">⚡ Đuổi Hình Bắt Chữ (Tất cả vừa vẽ vừa đoán đồng thời)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Thời gian niệm phép mỗi vòng:
                </label>
                <select
                  value={drawTime}
                  onChange={(e) => setDrawTime(Number(e.target.value))}
                  style={{ width: '100%' }}
                >
                  <option value={45}>45 giây</option>
                  <option value={60}>60 giây (Mặc định)</option>
                  <option value={80}>80 giây</option>
                  <option value={90}>90 giây (Khuyên dùng cho Đuổi Hình Bắt Chữ)</option>
                  <option value={100}>100 giây</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Số vòng thi đấu:
                </label>
                <select
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(Number(e.target.value))}
                  style={{ width: '100%' }}
                >
                  <option value={2}>2 vòng</option>
                  <option value={3}>3 vòng (Mặc định)</option>
                  <option value={5}>5 vòng</option>
                  <option value={8}>8 vòng</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Số lượng phù thủy tối đa:
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  style={{ width: '100%', fontWeight: 700 }}
                >
                  <option value={8}>8 phù thủy</option>
                  <option value={12}>12 phù thủy</option>
                  <option value={16}>16 phù thủy</option>
                  <option value={20}>20 phù thủy (Tối đa Hogwarts - Mặc định)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Ngôn ngữ từ vựng ma thuật:
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'vi' | 'en')}
                  style={{ width: '100%' }}
                >
                  <option value="vi">🇻🇳 Tiếng Việt (Pháp bảo & Sinh vật huyền bí)</option>
                  <option value="en">🇬🇧 English (Spells & Hogwarts Lore)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Thêm bảo bối/từ ngữ riêng (phân cách bằng dấu phẩy):
                </label>
                <input
                  type="text"
                  value={customWordsText}
                  onChange={(e) => setCustomWordsText(e.target.value)}
                  placeholder="Ví dụ: Bia bơ, Đũa cơm nguội, Thần chú Lumos..."
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="btn-icon"
                style={{ padding: '10px 18px' }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleCreateCustom}
                className="btn-primary"
                style={{ padding: '10px 22px' }}
              >
                Mở Cổng Phòng Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
