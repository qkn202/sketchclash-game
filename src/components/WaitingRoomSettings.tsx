import React, { useEffect, useId, useState } from 'react';
import type { RoomConfig } from '../types';
import { ChevronDown, SlidersHorizontal, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface WaitingRoomSettingsProps {
  roomConfig: RoomConfig;
  playersCount: number;
  isHost: boolean;
  onRoomConfigChange: (partial: Partial<RoomConfig>) => void;
}

export const WaitingRoomSettings: React.FC<WaitingRoomSettingsProps> = ({
  roomConfig,
  playersCount,
  isHost,
  onRoomConfigChange,
}) => {
  const baseId = useId();
  const [customDraft, setCustomDraft] = useState<string>(() =>
    (roomConfig.customWords || []).join(', ')
  );

  useEffect(() => {
    setCustomDraft((roomConfig.customWords || []).join(', '));
  }, [roomConfig.roomCode]);

  const parseCustomWords = (raw: string): string[] =>
    raw
      .split(/[,;\n]+/)
      .map((w) => w.trim().slice(0, 60))
      .filter(Boolean)
      .slice(0, 80);

  const commitCustomWords = () => {
    if (!isHost) return;
    const parsed = parseCustomWords(customDraft);
    soundManager.playClick();
    onRoomConfigChange({ customWords: parsed });
  };

  const customCount = isHost
    ? (roomConfig.customWords || []).length
    : roomConfig.customWordsCount || 0;

  return (
    <details className="waiting-room-settings" open={isHost}>
      <summary className="waiting-room-settings-summary">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <SlidersHorizontal size={15} color="var(--hogwarts-gold)" aria-hidden="true" />
          <span className="font-cinzel" style={{ fontWeight: 800, color: 'var(--hogwarts-gold)', fontSize: '13px' }}>
            {isHost ? 'Cài Đặt Thông Số Phòng Thi Đấu' : 'Thông Số Phòng Hiện Tại'}
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '2px 8px',
              borderRadius: '10px',
              border: '1px solid var(--border-card)',
            }}
          >
            ⏱️ {roomConfig.drawTime}s • 🔄 {roomConfig.totalRounds} vòng •{' '}
            {roomConfig.language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'} • 👥 tối đa {roomConfig.maxPlayers}
            {customCount > 0 ? ` • ✨ ${customCount} từ riêng` : ''}
          </span>
        </span>
        <ChevronDown size={16} className="waiting-room-settings-chevron" aria-hidden="true" />
      </summary>

      <div className="waiting-room-settings-body">
        {isHost ? (
          <>
            <div className="waiting-room-settings-grid">
              <div>
                <label
                  htmlFor={`${baseId}-draw-time`}
                  style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}
                >
                  Thời gian vẽ / lượt
                </label>
                <select
                  id={`${baseId}-draw-time`}
                  name="drawTime"
                  value={roomConfig.drawTime}
                  onChange={(e) => {
                    soundManager.playClick();
                    onRoomConfigChange({ drawTime: Number(e.target.value) });
                  }}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '10px' }}
                >
                  <option value={45}>45 giây (Siêu tốc)</option>
                  <option value={60}>60 giây (Tiêu chuẩn)</option>
                  <option value={80}>80 giây</option>
                  <option value={90}>90 giây (Khuyên dùng Tốc Chiến)</option>
                  <option value={100}>100 giây</option>
                  <option value={120}>120 giây (Thong thả)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-rounds`}
                  style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}
                >
                  Số vòng thi đấu
                </label>
                <select
                  id={`${baseId}-rounds`}
                  name="totalRounds"
                  value={roomConfig.totalRounds}
                  onChange={(e) => {
                    soundManager.playClick();
                    onRoomConfigChange({ totalRounds: Number(e.target.value) });
                  }}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '10px' }}
                >
                  <option value={2}>2 Vòng (Nhanh)</option>
                  <option value={3}>3 Vòng (Chuẩn)</option>
                  <option value={5}>5 Vòng (Đấu Cúp)</option>
                  <option value={7}>7 Vòng</option>
                  <option value={8}>8 Vòng (Marathon)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-lang`}
                  style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}
                >
                  Ngôn ngữ kho từ
                </label>
                <select
                  id={`${baseId}-lang`}
                  name="language"
                  value={roomConfig.language}
                  onChange={(e) => {
                    soundManager.playClick();
                    onRoomConfigChange({ language: e.target.value as 'vi' | 'en' });
                  }}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '10px' }}
                >
                  <option value="vi">🇻🇳 Tiếng Việt</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-max-players`}
                  style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}
                >
                  Giới hạn phù thủy
                </label>
                <select
                  id={`${baseId}-max-players`}
                  name="maxPlayers"
                  value={roomConfig.maxPlayers}
                  onChange={(e) => {
                    soundManager.playClick();
                    onRoomConfigChange({ maxPlayers: Number(e.target.value) });
                  }}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '10px' }}
                >
                  {[4, 8, 12, 16, 20].map((cap) => (
                    <option key={cap} value={cap} disabled={cap < playersCount}>
                      Tối đa {cap} người{cap < playersCount ? ` (đang có ${playersCount})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              <label
                htmlFor={`${baseId}-custom-words`}
                style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}
              >
                Bộ từ khóa riêng (ngăn cách bằng dấu phẩy — giữ bí mật với người chơi khác):
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                <input
                  id={`${baseId}-custom-words`}
                  name="customWords"
                  type="text"
                  maxLength={1200}
                  value={customDraft}
                  onChange={(e) => setCustomDraft(e.target.value)}
                  onBlur={commitCustomWords}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      commitCustomWords();
                    }
                  }}
                  placeholder="VD: Chổi Tia Chớp, Bản Đồ Đạo Tặc, Cú Hedwig..."
                  style={{ flex: '1 1 240px', padding: '8px 12px', fontSize: '13px', borderRadius: '10px' }}
                />
                <button
                  type="button"
                  onClick={commitCustomWords}
                  className="btn-icon"
                  style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, gap: '5px', color: 'var(--hogwarts-gold)', borderColor: 'var(--border-gold)' }}
                >
                  <Sparkles size={13} aria-hidden="true" /> Lưu Từ ({parseCustomWords(customDraft).length})
                </button>
              </div>
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Chủ phòng đang thiết lập ván đấu với thời gian vẽ <strong style={{ color: '#fff' }}>{roomConfig.drawTime} giây</strong>, tổng cộng{' '}
            <strong style={{ color: '#fff' }}>{roomConfig.totalRounds} vòng</strong>, kho từ{' '}
            <strong style={{ color: '#fff' }}>{roomConfig.language === 'vi' ? 'Tiếng Việt' : 'English'}</strong>
            {customCount > 0 ? ` và ${customCount} từ khóa bí mật riêng` : ''}.
          </p>
        )}
      </div>
    </details>
  );
};

