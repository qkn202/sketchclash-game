import React from 'react';
import type { Player, GameMode } from '../types';
import { AvatarDisplay } from './AvatarPicker';
import { Crown, Wand2, CheckCircle2, Bot, Copy, Check, Sparkles, X } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ScoreBoardProps {
  players: Player[];
  currentUserId: string;
  currentDrawerId?: string | null;
  roomCode: string;
  roomToken?: string;
  round: number;
  totalRounds: number;
  maxPlayers?: number;
  isHost: boolean;
  onAddBot?: () => void;
  onRemovePlayer?: (playerId: string) => void;
  mode?: GameMode;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  players,
  currentUserId,
  roomCode,
  roomToken,
  round,
  totalRounds,
  maxPlayers = 20,
  isHost,
  onAddBot,
  onRemovePlayer,
  mode = 'classic',
}) => {
  const [copied, setCopied] = React.useState(false);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const copyRoomLink = () => {
    soundManager.playClick();
    const t = roomToken ? `&t=${encodeURIComponent(roomToken)}` : '';
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomCode)}${t}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '18px',
        border: '2px solid var(--border-card)',
        boxShadow: 'var(--card-shadow)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        maxHeight: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header Info */}
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--bg-stage)',
          borderBottom: '2px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }} className="font-cinzel">
            {mode === 'relay_phone' ? 'CHẶNG CUỘN GIẤY' : 'VÒNG THI ĐẤU'}
          </span>
          <h4 style={{ fontSize: '16px', color: 'var(--hogwarts-gold)', fontWeight: 800 }} className="font-cinzel">
            {round} / {totalRounds}
          </h4>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }} className="font-cinzel">
            MÃ SẢNH
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {roomCode}
            </span>
            <button
              type="button"
              onClick={copyRoomLink}
              aria-label={`Sao chép liên kết mời vào sảnh ${roomCode}`}
              style={{
                background: 'transparent',
                border: 'none',
                color: copied ? 'var(--accent-cyan)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                minInlineSize: '28px',
                minBlockSize: '28px',
                justifyContent: 'center',
              }}
            >
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          maxHeight: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {sortedPlayers.map((player, index) => {
          const isCurrent = player.id === currentUserId;
          const isDrawer = Boolean(player.isDrawer);
          const isLoneGuesser = Boolean(player.isLoneGuesser);
          const hasGuessed = player.hasGuessed;

          return (
            <div
              key={player.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '14px',
                background: hasGuessed
                  ? 'rgba(45, 212, 191, 0.15)'
                  : isDrawer
                  ? 'rgba(255, 216, 117, 0.15)'
                  : isLoneGuesser
                  ? 'rgba(168, 85, 247, 0.18)'
                  : isCurrent
                  ? 'rgba(116, 0, 1, 0.25)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: hasGuessed
                  ? '2px solid var(--accent-cyan)'
                  : isDrawer
                  ? '2px solid var(--hogwarts-gold)'
                  : isLoneGuesser
                  ? '2px solid #c084fc'
                  : isCurrent
                  ? '2px solid rgba(255, 216, 117, 0.5)'
                  : '1px solid var(--border-card)',
                transition: 'all 0.2s',
              }}
            >
              {/* Rank */}
              <div
                style={{
                  width: '22px',
                  fontWeight: 800,
                  fontSize: '13px',
                  color: index === 0 ? '#ffd875' : index === 1 ? '#cbd5e1' : index === 2 ? '#cd7f32' : 'var(--text-muted)',
                  textAlign: 'center',
                }}
                className="font-cinzel"
              >
                #{index + 1}
              </div>

              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <AvatarDisplay avatar={player.avatar} size={38} />
                {player.isHost && (
                  <Crown
                    size={13}
                    color="#ffd875"
                    aria-hidden="true"
                    style={{ position: 'absolute', top: -5, right: -4, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
                  />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: isCurrent ? 'var(--hogwarts-gold)' : '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {player.name}
                  </span>
                  {player.isBot && (
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Bot size={13} color="var(--accent-blue)" aria-hidden="true" />
                      <span className="visually-hidden"> (Pháp sư AI Hogwarts)</span>
                    </span>
                  )}
                  {isHost && !isCurrent && onRemovePlayer && (
                    <button
                      type="button"
                      aria-label={
                        player.isBot
                          ? `Thu hồi Pháp sư AI ${player.name}`
                          : `Mời ${player.name} rời sảnh`
                      }
                      onClick={() => {
                        soundManager.playClick();
                        onRemovePlayer(player.id);
                      }}
                      style={{
                        marginLeft: 'auto',
                        background: 'rgba(185, 28, 28, 0.3)',
                        border: '1px solid rgba(248, 113, 113, 0.45)',
                        color: '#fca5a5',
                        borderRadius: '6px',
                        padding: '2px',
                        minInlineSize: '20px',
                        minBlockSize: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <X size={11} aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--hogwarts-gold)', fontWeight: 800 }}>
                    {player.score} Điểm
                  </span>

                  {/* Status Badge */}
                  {mode === 'rush_draw' ? (
                    <span
                      style={{
                        fontSize: '10px',
                        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(124, 58, 237, 0.4) 100%)',
                        color: '#ffd875',
                        border: '1px solid var(--border-gold)',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                      className="font-cinzel"
                    >
                      <span aria-hidden="true">⚡</span> {(player.solvedOpponentIds || []).length}/{Math.max(1, players.length - 1)}
                    </span>
                  ) : isDrawer ? (
                    <span
                      style={{
                        fontSize: '10px',
                        background: 'var(--hogwarts-gold)',
                        color: '#261601',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                      className="font-cinzel"
                    >
                      <Wand2 size={10} aria-hidden="true" />
                      {mode === 'dual_coop'
                        ? 'Vẽ Co-op'
                        : mode === 'all_draw'
                        ? 'Cùng Vẽ'
                        : mode === 'polyjuice_impostor'
                        ? 'Vẽ 1 nét'
                        : mode === 'relay_phone'
                        ? 'Họa tranh'
                        : 'Vẽ'}
                    </span>
                  ) : isLoneGuesser ? (
                    <span
                      style={{
                        fontSize: '10px',
                        background: '#9333ea',
                        color: '#ffffff',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        boxShadow: '0 0 8px rgba(147, 51, 234, 0.4)',
                      }}
                      className="font-cinzel"
                    >
                      <Sparkles size={10} aria-hidden="true" /> Thám Tử
                    </span>
                  ) : hasGuessed ? (
                    <span
                      style={{
                        fontSize: '10px',
                        background: 'var(--accent-cyan)',
                        color: '#042f2e',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                      className="font-cinzel"
                    >
                      <CheckCircle2 size={10} aria-hidden="true" /> Đúng
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Hogwarts Bot Button */}
      {isHost && onAddBot && (
        <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-card)', flexShrink: 0 }}>
          <button
            type="button"
            disabled={players.length >= maxPlayers}
            onClick={() => {
              soundManager.playClick();
              onAddBot();
            }}
            className="btn-gold"
            style={{ width: '100%', padding: '8px', fontSize: '13px' }}
          >
            <Sparkles size={15} aria-hidden="true" /> Triệu Hồi Pháp Sư AI
          </button>
        </div>
      )}
    </div>
  );
};
