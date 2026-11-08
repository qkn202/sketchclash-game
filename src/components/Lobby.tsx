import React, { useState, useId } from 'react';
import type { AvatarConfig, RoomConfig, GameMode } from '../types';
import { AvatarPicker } from './AvatarPicker';
import { CustomRoomModal } from './CustomRoomModal';
import { Wand2, Play, Plus, LogIn, Bot, Volume2, VolumeX, Sparkles, Scroll } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface LobbyProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  avatar: AvatarConfig;
  onAvatarChange: (avatar: AvatarConfig) => void;
  isMuted: boolean;
  onToggleSound: () => void;
  onJoinRoom: (roomCode: string, config?: Partial<RoomConfig>, addBots?: boolean, isCreating?: boolean) => void;
}

function readInviteRoomFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return (params.get('room') || '').trim().toUpperCase();
}

/**
 * Room-code generation (finding #3 mitigation). Codes are only used as the
 * name of a Supabase BroadcastChannel / local BroadcastChannel — there is no
 * server-side membership, so a short sequential space (HOGWARTS100–999, ~900
 * codes) let a script enumerate live rooms and DoS them via room-full. A wide,
 * non-sequential code makes brute-force discovery infeasible. The readable
 * prefix is kept for UX; the body is 6 uppercase-alphanumerics (~20^6 ≈ 64M).
 */
function makeRoomCode(prefix: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 (confusables)
  let body = '';
  for (let i = 0; i < 6; i++) body += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}${body}`;
}

export const Lobby: React.FC<LobbyProps> = ({
  playerName,
  onPlayerNameChange,
  avatar,
  onAvatarChange,
  isMuted,
  onToggleSound,
  onJoinRoom,
}) => {
  const formId = useId();
  const [invitedRoomCode] = useState<string>(readInviteRoomFromUrl);
  const [roomCodeInput, setRoomCodeInput] = useState<string>(readInviteRoomFromUrl);
  const [showCustomModal, setShowCustomModal] = useState(false);

  const [mode, setMode] = useState<GameMode>('classic');
  const [drawTime, setDrawTime] = useState<number>(60);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [maxPlayers, setMaxPlayers] = useState<number>(20);
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [customWordsText, setCustomWordsText] = useState('');

  const handleQuickPlay = () => {
    if (!playerName.trim()) return;
    soundManager.playClick();
    const randomCode = makeRoomCode('HOGWARTS');
    onJoinRoom(
      randomCode,
      {
        drawTime: 60,
        totalRounds: 3,
        language: 'vi',
      },
      true,
      true
    );
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
    const randomCode = makeRoomCode('SPELL');
    const customWords = customWordsText
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    onJoinRoom(
      randomCode,
      {
        mode,
        drawTime,
        totalRounds,
        maxPlayers,
        language,
        customWords,
      },
      false,
      true
    );
  };

  const handlePlaySoloWithBots = () => {
    if (!playerName.trim()) return;
    soundManager.playClick();
    const soloCode = makeRoomCode('MAGIC');
    onJoinRoom(
      soloCode,
      {
        drawTime: 60,
        totalRounds: 3,
        language: 'vi',
      },
      true,
      true
    );
  };

  return (
    <main
      style={{
        maxWidth: '1050px',
        margin: '8px auto',
        padding: 'clamp(8px, 2.5vw, 20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
      }}
    >
      {/* Top Brand Bar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            aria-hidden="true"
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
              Đại Sảnh Đường — Đấu Trí Vẽ &amp; Đoán Đồ Vật Ma Thuật
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleSound}
          aria-label={isMuted ? 'Mở bùa âm thanh' : 'Tắt bùa âm thanh'}
          aria-pressed={!isMuted}
          className="btn-icon"
          style={{ padding: '10px' }}
        >
          {isMuted ? (
            <VolumeX size={20} color="var(--accent-red)" aria-hidden="true" />
          ) : (
            <Volume2 size={20} color="var(--hogwarts-gold)" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Invite Banner when ?room=CODE is present */}
      {invitedRoomCode && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.22) 0%, rgba(116, 0, 1, 0.35) 100%)',
            border: '2px solid var(--hogwarts-gold)',
            borderRadius: '16px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            boxShadow: '0 0 20px rgba(255, 216, 117, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Sparkles size={18} color="var(--hogwarts-gold)" aria-hidden="true" />
            <span>
              Thư cú mời bạn vào sảnh <strong style={{ color: 'var(--accent-cyan)' }}>{invitedRoomCode}</strong>!
            </span>
          </div>
          <button
            type="button"
            disabled={!playerName.trim()}
            onClick={() => {
              soundManager.playClick();
              onJoinRoom(invitedRoomCode, undefined, false, false);
            }}
            className="btn-gold"
            style={{ padding: '8px 18px', fontSize: '14px' }}
          >
            <LogIn size={16} aria-hidden="true" /> Vào Sảnh {invitedRoomCode} Ngay
          </button>
        </div>
      )}

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
            <label
              htmlFor={`${formId}-player-name`}
              style={{ fontSize: '14px', fontWeight: 700, color: 'var(--hogwarts-gold)', display: 'block', marginBottom: '8px' }}
              className="font-cinzel"
            >
              Tên Phù Thủy Của Bạn:
            </label>
            <input
              id={`${formId}-player-name`}
              name="playerName"
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
            <h2 style={{ fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hogwarts-gold)' }} className="font-cinzel">
              <Wand2 size={20} color="var(--hogwarts-gold)" aria-hidden="true" /> Chọn Sảnh Thi Đấu
            </h2>

            <button
              type="button"
              onClick={handleQuickPlay}
              disabled={!playerName.trim()}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '17px' }}
            >
              <Play size={20} aria-hidden="true" /> Vào Phòng Thi Đấu (Quick Play)
            </button>

            <button
              type="button"
              onClick={handlePlaySoloWithBots}
              disabled={!playerName.trim()}
              className="btn-gryffindor"
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              <Bot size={20} aria-hidden="true" /> Luyện Tập Cùng Học Sinh Hogwarts (AI Bots)
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setShowCustomModal(true);
              }}
              disabled={!playerName.trim()}
              className="btn-yellow"
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              <Plus size={20} aria-hidden="true" /> Tạo Phòng Phép Thuật Riêng
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-card)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }} className="font-cinzel">HOẶC</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-card)' }} />
            </div>

            {/* Join by Code Form */}
            <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '8px' }}>
              <label htmlFor={`${formId}-room-code`} className="visually-hidden">
                Mã phòng Hogwarts
              </label>
              <input
                id={`${formId}-room-code`}
                name="roomCode"
                type="text"
                maxLength={16}
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
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
                <LogIn size={18} aria-hidden="true" /> Vào
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
              <Scroll size={16} aria-hidden="true" /> <strong>Học Viện Hogwarts:</strong> Tranh tài đoán các bảo bối huyền thoại: Quả Snitch Vàng, Mũ Phân Loại, Cú Hedwig, Áo Choàng Tàng Hình...
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
              <Sparkles size={16} color="var(--accent-cyan)" aria-hidden="true" /> <strong>Học sinh AI thông thái:</strong> Cùng thi đấu với Hermione Granger, Ron Weasley, Draco Malfoy và Cụ Dumbledore!
            </div>
          </div>
        </div>
      </div>

      {/* Custom Room Modal via native <dialog> */}
      {showCustomModal && (
        <CustomRoomModal
          mode={mode}
          drawTime={drawTime}
          totalRounds={totalRounds}
          maxPlayers={maxPlayers}
          language={language}
          customWordsText={customWordsText}
          onModeChange={setMode}
          onDrawTimeChange={setDrawTime}
          onTotalRoundsChange={setTotalRounds}
          onMaxPlayersChange={setMaxPlayers}
          onLanguageChange={setLanguage}
          onCustomWordsTextChange={setCustomWordsText}
          onClose={() => setShowCustomModal(false)}
          onConfirm={handleCreateCustom}
        />
      )}
    </main>
  );
};
