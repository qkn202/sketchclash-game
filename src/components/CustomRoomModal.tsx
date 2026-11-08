import React, { useId } from 'react';
import type { GameMode } from '../types';
import { ModalDialog } from './ModalDialog';
import { Settings2 } from 'lucide-react';

interface CustomRoomModalProps {
  mode: GameMode;
  drawTime: number;
  totalRounds: number;
  maxPlayers: number;
  language: 'vi' | 'en';
  customWordsText: string;
  onModeChange: (mode: GameMode) => void;
  onDrawTimeChange: (seconds: number) => void;
  onTotalRoundsChange: (rounds: number) => void;
  onMaxPlayersChange: (max: number) => void;
  onLanguageChange: (lang: 'vi' | 'en') => void;
  onCustomWordsTextChange: (text: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const CustomRoomModal: React.FC<CustomRoomModalProps> = ({
  mode,
  drawTime,
  totalRounds,
  maxPlayers,
  language,
  customWordsText,
  onModeChange,
  onDrawTimeChange,
  onTotalRoundsChange,
  onMaxPlayersChange,
  onLanguageChange,
  onCustomWordsTextChange,
  onClose,
  onConfirm,
}) => {
  const formId = useId();

  return (
    <ModalDialog
      ariaLabelledBy={`${formId}-custom-title`}
      dismissible={true}
      onClose={onClose}
      maxWidth="480px"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hogwarts-gold)', marginBottom: '16px' }}>
        <Settings2 size={24} aria-hidden="true" />
        <h2 id={`${formId}-custom-title`} style={{ fontSize: '22px', fontWeight: 800, margin: 0 }} className="font-cinzel">
          Tùy Chỉnh Phòng Phép Thuật
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        <div>
          <label htmlFor={`${formId}-mode`} style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Chế độ thi đấu ma thuật:
          </label>
          <select
            id={`${formId}-mode`}
            value={mode}
            onChange={(e) => onModeChange(e.target.value as GameMode)}
            style={{ width: '100%', fontWeight: 700 }}
            autoFocus
          >
            <option value="classic">🪄 Độc Hành Phép Thuật (1 người vẽ - Cả phòng đoán)</option>
            <option value="rush_draw">⚡ Đuổi Hình Bắt Chữ (Tất cả vừa vẽ vừa đoán đồng thời)</option>
            <option value="relay_phone">📜 Cuộn Giấy Tam Sao Thất Bản (Viết câu → Vẽ → Đoán hài hước)</option>
            <option value="polyjuice_impostor">🧪 Đa Dịch Giả Mạo (Mỗi người 1 nét — Bắt Kẻ Giả Mạo)</option>
            <option value="dual_coop">🤝 Song Kiếm Hợp Bích (Co-op 2 người cùng vẽ)</option>
            <option value="all_draw">🎭 Đại Hợp Xướng (Tất cả vẽ - 1 người đoán)</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${formId}-drawtime`} style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Thời gian niệm phép mỗi vòng:
          </label>
          <select
            id={`${formId}-drawtime`}
            value={drawTime}
            onChange={(e) => onDrawTimeChange(Number(e.target.value))}
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
          <label htmlFor={`${formId}-rounds`} style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Số vòng thi đấu:
          </label>
          <select
            id={`${formId}-rounds`}
            value={totalRounds}
            onChange={(e) => onTotalRoundsChange(Number(e.target.value))}
            style={{ width: '100%' }}
          >
            <option value={2}>2 vòng</option>
            <option value={3}>3 vòng (Mặc định)</option>
            <option value={5}>5 vòng</option>
            <option value={8}>8 vòng</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${formId}-maxplayers`} style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Số lượng phù thủy tối đa:
          </label>
          <select
            id={`${formId}-maxplayers`}
            value={maxPlayers}
            onChange={(e) => onMaxPlayersChange(Number(e.target.value))}
            style={{ width: '100%', fontWeight: 700 }}
          >
            <option value={8}>8 phù thủy</option>
            <option value={12}>12 phù thủy</option>
            <option value={16}>16 phù thủy</option>
            <option value={20}>20 phù thủy (Tối đa Hogwarts - Mặc định)</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${formId}-lang`} style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Ngôn ngữ từ vựng ma thuật:
          </label>
          <select
            id={`${formId}-lang`}
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as 'vi' | 'en')}
            style={{ width: '100%' }}
          >
            <option value="vi">🇻🇳 Tiếng Việt (Pháp bảo &amp; Sinh vật huyền bí)</option>
            <option value="en">🇬🇧 English (Spells &amp; Hogwarts Lore)</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${formId}-customwords`} style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Thêm bảo bối/từ ngữ riêng (phân cách bằng dấu phẩy):
          </label>
          <input
            id={`${formId}-customwords`}
            name="customWords"
            type="text"
            maxLength={500}
            value={customWordsText}
            onChange={(e) => onCustomWordsTextChange(e.target.value)}
            placeholder="Ví dụ: Bia bơ, Đũa cơm nguội, Thần chú Lumos..."
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} className="btn-icon" style={{ padding: '10px 18px' }}>
          Đóng
        </button>
        <button type="button" onClick={onConfirm} className="btn-primary" style={{ padding: '10px 22px' }}>
          Mở Cổng Phòng Ngay
        </button>
      </div>
    </ModalDialog>
  );
};

