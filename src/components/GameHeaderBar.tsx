import React from 'react';
import type { Player, RoomConfig, GamePhase } from '../types';
import { countMaskableChars } from '../data/words';
import { Volume2, VolumeX, Clock, ArrowLeft, Eye, Maximize2, Minimize2 } from 'lucide-react';

interface GameHeaderBarProps {
  isMobile: boolean;
  isCanvasMaximized: boolean;
  roomConfig: RoomConfig;
  phase: GamePhase;
  round: number;
  timeLeft: number;
  isMuted: boolean;
  isHost: boolean;
  isCurrentDrawer: boolean;
  currentWord: string;
  maskedWord: string;
  roundEndMessage: string | null;
  currentPlayer: Player;
  players: Player[];
  currentUserId: string;
  onBackAction: () => void;
  onToggleMaximize: (next: boolean) => void;
  onSwitchToOpponentsTab: () => void;
  onToggleSound: () => void;
}

export const GameHeaderBar: React.FC<GameHeaderBarProps> = ({
  isMobile,
  isCanvasMaximized,
  roomConfig,
  phase,
  round,
  timeLeft,
  isMuted,
  isHost,
  isCurrentDrawer,
  currentWord,
  maskedWord,
  roundEndMessage,
  currentPlayer,
  players,
  currentUserId,
  onBackAction,
  onToggleMaximize,
  onSwitchToOpponentsTab,
  onToggleSound,
}) => {
  const renderClueOrWordBanner = () => {
    if (roomConfig.mode === 'relay_phone') {
      const text =
        phase === 'relay_prompt'
          ? '📜 Chặng Khởi Nguồn — Hãy viết câu chủ đề hài hước'
          : phase === 'relay_draw'
          ? '🎨 Chặng Minh Họa — Vẽ lại câu văn bạn vừa nhận'
          : phase === 'relay_guess'
          ? '🔮 Chặng Giải Mã — Nhìn tranh đoán câu chữ bí ẩn'
          : '📖 Triển Lãm Nhật Ký Tam Sao Thất Bản';
      return (
        <div className="font-cinzel" style={{ color: 'var(--hogwarts-gold)', fontSize: isMobile ? '12.5px' : '15px', fontWeight: 800 }}>
          {text}
        </div>
      );
    }

    if (roomConfig.mode === 'polyjuice_impostor' && phase !== 'round_end') {
      const text =
        phase === 'impostor_draw'
          ? '🧪 Đa Dịch Giả Mạo — Mỗi phù thủy vẽ 1 nét bằng mực định danh'
          : phase === 'impostor_vote'
          ? '⚖️ Phiên Tòa Wizengamot — Bỏ phiếu truy tìm Kẻ Giả Mạo'
          : '⚡ Cơ Hội Cuối — Kẻ Giả Mạo đoán từ khóa để lật kèo!';
      return (
        <div className="font-cinzel" style={{ color: 'var(--hogwarts-gold)', fontSize: isMobile ? '12.5px' : '15px', fontWeight: 800 }}>
          {text}
        </div>
      );
    }

    if (phase !== 'drawing') {
      if (roundEndMessage) {
        return (
          <div
            style={{ color: 'var(--hogwarts-gold)', fontSize: isMobile ? '13px' : '15px', fontWeight: 800, whiteSpace: 'pre-line' }}
            className="font-cinzel"
          >
            {roundEndMessage}
          </div>
        );
      }
      return (
        <div style={{ color: 'var(--text-muted)', fontSize: isMobile ? '12px' : '14px' }}>
          Đang chuẩn bị vòng đấu phép thuật...
        </div>
      );
    }

    if (roomConfig.mode === 'rush_draw') {
      const myWord = currentWord || currentPlayer.secretWord;
      const opps = players.filter((p) => p.id !== currentUserId);
      const solvedCount = (currentPlayer.solvedOpponentIds || []).length;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(116, 0, 1, 0.3)',
              padding: isMobile ? '4px 10px' : '4px 14px',
              borderRadius: '20px',
              border: '1px solid var(--hogwarts-gold)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--hogwarts-gold)', fontWeight: 700 }} className="font-cinzel">
              BẠN VẼ:
            </span>
            <span style={{ fontSize: isMobile ? '14px' : '17px', fontWeight: 900, color: '#fff' }} className="font-cinzel">
              {myWord || 'Đang chọn...'}
            </span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(26, 71, 42, 0.3)',
              padding: isMobile ? '4px 10px' : '4px 14px',
              borderRadius: '20px',
              border: '1px solid #4ade80',
            }}
          >
            <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700 }} className="font-cinzel">
              ĐÃ ĐOÁN:
            </span>
            <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 800, color: '#fff' }}>
              {solvedCount}/{opps.length} tranh
            </span>
          </div>
        </div>
      );
    }

    const activeSecretWord = currentWord || currentPlayer.secretWord || '';
    if (isCurrentDrawer) {
      const charCount = countMaskableChars(activeSecretWord);
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(116, 0, 1, 0.25)',
            padding: isMobile ? '4px 12px' : '4px 14px',
            borderRadius: '20px',
            border: '1px solid var(--hogwarts-gold)',
            maxWidth: '100%',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--hogwarts-gold)', fontWeight: 700, whiteSpace: 'nowrap' }} className="font-cinzel">
            BẢO BỐI:
          </span>
          <span
            style={{
              fontSize: isMobile ? '16px' : 'clamp(15px, 3.8vw, 20px)',
              fontWeight: 900,
              letterSpacing: '1px',
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
            className="font-cinzel"
          >
            {activeSecretWord}
          </span>
          {charCount > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              ({charCount} kí tự)
            </span>
          )}
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(26, 71, 42, 0.25)',
          padding: isMobile ? '4px 12px' : '4px 14px',
          borderRadius: '20px',
          border: '1px solid var(--accent-cyan)',
          maxWidth: '100%',
        }}
      >
        <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700, whiteSpace: 'nowrap' }} className="font-cinzel">
          GỢI Ý:
        </span>
        <span
          style={{
            fontSize: isMobile ? '18px' : 'clamp(15px, 4vw, 22px)',
            fontWeight: 900,
            letterSpacing: '3px',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}
        >
          {maskedWord}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          ({countMaskableChars(maskedWord)} kí tự)
        </span>
      </div>
    );
  };

  const backAriaLabel = isHost ? 'Đưa cả phòng quay về Phòng Chờ' : 'Rời phòng về Đại Sảnh';

  return (
    <header className={`game-header-bar ${isMobile ? (isCanvasMaximized ? 'mobile-header-maximized' : 'mobile-header-two-rows') : ''}`}>
      {isMobile ? (
        isCanvasMaximized ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: timeLeft <= 10 ? 'var(--accent-red)' : 'var(--accent-yellow)', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                <Clock size={14} aria-hidden="true" /> {timeLeft}s
              </div>
              <span style={{ color: 'var(--border-card)' }}>|</span>
              <span style={{ fontSize: '11px', color: 'var(--hogwarts-gold)', fontWeight: 700, flexShrink: 0 }}>
                {isCurrentDrawer || roomConfig.mode === 'rush_draw' ? 'VẼ:' : 'GỢI Ý:'}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="font-cinzel">
                {roomConfig.mode === 'rush_draw'
                  ? currentWord || currentPlayer.secretWord || 'Đang vẽ'
                  : isCurrentDrawer
                  ? currentWord || currentPlayer.secretWord || 'Đang vẽ'
                  : maskedWord || '...'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              {roomConfig.mode === 'rush_draw' && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleMaximize(false);
                    onSwitchToOpponentsTab();
                  }}
                  className="btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '8px', minBlockSize: '30px' }}
                >
                  <Eye size={12} aria-hidden="true" /> Soi ({players.filter((p) => p.id !== currentUserId).length})
                </button>
              )}
              <button
                type="button"
                onClick={() => onToggleMaximize(false)}
                className="btn-gold"
                style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '8px', minBlockSize: '30px' }}
              >
                <Minimize2 size={12} aria-hidden="true" /> Thu Nhỏ
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mobile-header-row-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onBackAction}
                  aria-label={backAriaLabel}
                  className="btn-icon"
                  style={{ padding: '6px' }}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h1 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-cyan)', whiteSpace: 'nowrap', margin: 0 }}>
                      {roomConfig.roomName}
                    </h1>
                    <span
                      style={{
                        background: 'rgba(212, 175, 55, 0.2)',
                        border: '1px solid var(--border-gold)',
                        color: 'var(--hogwarts-gold)',
                        padding: '1px 6px',
                        borderRadius: '8px',
                        fontSize: '9.5px',
                        fontWeight: 700,
                      }}
                    >
                      {roomConfig.mode === 'dual_coop'
                        ? 'Co-op'
                        : roomConfig.mode === 'all_draw'
                        ? 'Hợp Xướng'
                        : roomConfig.mode === 'rush_draw'
                        ? 'Đuổi Hình ⚡'
                        : roomConfig.mode === 'relay_phone'
                        ? 'Tam Sao 📜'
                        : roomConfig.mode === 'polyjuice_impostor'
                        ? 'Đa Dịch 🧪'
                        : 'Độc Hành'}
                    </span>
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    Vòng {round}/{roomConfig.totalRounds}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: timeLeft <= 10 ? 'rgba(239, 71, 111, 0.25)' : 'var(--bg-stage)',
                    border: timeLeft <= 10 ? '2px solid var(--accent-red)' : '1px solid var(--border-card)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    color: timeLeft <= 10 ? 'var(--accent-red)' : '#fff',
                    fontWeight: 800,
                    fontSize: '15px',
                    animation: timeLeft <= 10 ? 'pulseGlow 1s infinite' : 'none',
                  }}
                >
                  <Clock size={15} color={timeLeft <= 10 ? 'var(--accent-red)' : 'var(--accent-yellow)'} aria-hidden="true" />
                  <span>{timeLeft}s</span>
                </div>

                {phase === 'drawing' && (
                  <button
                    type="button"
                    onClick={() => onToggleMaximize(true)}
                    aria-label="Phóng to bảng vẽ tối đa"
                    className="btn-icon"
                    style={{ padding: '6px' }}
                  >
                    <Maximize2 size={16} color="var(--hogwarts-gold)" aria-hidden="true" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onToggleSound}
                  aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                  aria-pressed={!isMuted}
                  className="btn-icon"
                  style={{ padding: '6px' }}
                >
                  {isMuted ? (
                    <VolumeX size={16} color="var(--accent-red)" aria-hidden="true" />
                  ) : (
                    <Volume2 size={16} color="var(--accent-cyan)" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="mobile-header-row-2">{renderClueOrWordBanner()}</div>
          </>
        )
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onBackAction}
              aria-label={backAriaLabel}
              className="btn-icon"
              style={{ padding: '8px' }}
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-cyan)', whiteSpace: 'nowrap', margin: 0 }}>
                  {roomConfig.roomName}
                </h1>
                <span
                  style={{
                    background: 'rgba(212, 175, 55, 0.2)',
                    border: '1px solid var(--border-gold)',
                    color: 'var(--hogwarts-gold)',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {roomConfig.mode === 'dual_coop'
                    ? 'Song Kiếm Co-op'
                    : roomConfig.mode === 'all_draw'
                    ? 'Đại Hợp Xướng'
                    : roomConfig.mode === 'rush_draw'
                    ? 'Đuổi Hình Bắt Chữ ⚡'
                    : roomConfig.mode === 'relay_phone'
                    ? 'Tam Sao Thất Bản 📜'
                    : roomConfig.mode === 'polyjuice_impostor'
                    ? 'Đa Dịch Giả Mạo 🧪'
                    : 'Độc Hành'}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Vòng {round}/{roomConfig.totalRounds}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center', flex: 1, minWidth: 0, maxWidth: '600px', overflow: 'hidden' }}>
            {renderClueOrWordBanner()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: timeLeft <= 10 ? 'rgba(239, 71, 111, 0.25)' : 'var(--bg-stage)',
                border: timeLeft <= 10 ? '2px solid var(--accent-red)' : '1px solid var(--border-card)',
                padding: '6px 14px',
                borderRadius: '16px',
                color: timeLeft <= 10 ? 'var(--accent-red)' : '#fff',
                fontWeight: 800,
                fontSize: '18px',
                animation: timeLeft <= 10 ? 'pulseGlow 1s infinite' : 'none',
              }}
            >
              <Clock size={18} color={timeLeft <= 10 ? 'var(--accent-red)' : 'var(--accent-yellow)'} aria-hidden="true" />
              <span>{timeLeft}s</span>
            </div>

            {phase === 'drawing' && (
              <button
                type="button"
                onClick={() => onToggleMaximize(!isCanvasMaximized)}
                aria-label={isCanvasMaximized ? 'Thu nhỏ bảng vẽ' : 'Phóng to bảng vẽ'}
                aria-pressed={isCanvasMaximized}
                className="btn-icon"
              >
                {isCanvasMaximized ? (
                  <Minimize2 size={18} color="var(--accent-cyan)" aria-hidden="true" />
                ) : (
                  <Maximize2 size={18} color="var(--hogwarts-gold)" aria-hidden="true" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              aria-pressed={!isMuted}
              className="btn-icon"
            >
              {isMuted ? (
                <VolumeX size={18} color="var(--accent-red)" aria-hidden="true" />
              ) : (
                <Volume2 size={18} color="var(--accent-cyan)" aria-hidden="true" />
              )}
            </button>
          </div>
        </>
      )}
    </header>
  );
};

