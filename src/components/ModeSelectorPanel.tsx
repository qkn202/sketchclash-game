import React from 'react';
import type { GameMode } from '../types';
import { Wand2 } from 'lucide-react';
import { soundManager } from '../utils/audio';

export interface GameModeOption {
  id: GameMode;
  name: string;
  subtitle: string;
  icon: string;
  badge: string;
  desc: string;
}

export const GAME_MODES: GameModeOption[] = [
  {
    id: 'classic',
    name: 'Độc Hành Phép Thuật',
    subtitle: '1 Người Vẽ — Cả Phòng Đoán',
    icon: '🪄',
    badge: 'Cổ Điển',
    desc: 'Từng pháp sư lần lượt múa đũa vẽ bảo bối bí mật, những người còn lại so tài tốc độ giải mã.',
  },
  {
    id: 'rush_draw',
    name: 'Đuổi Hình Bắt Chữ',
    subtitle: 'Vừa Vẽ Vừa Đoán Đồng Thời',
    icon: '⚡',
    badge: 'Đấu Trí Tốc Độ',
    desc: 'Mỗi người nhận 1 từ khóa bí mật riêng biệt! Tất cả cùng lúc vừa vẽ tranh của mình, vừa soi tranh đối thủ để gõ đoán ghi điểm.',
  },
  {
    id: 'relay_phone',
    name: 'Cuộn Giấy Tam Sao Thất Bản',
    subtitle: 'Viết Câu → Họa Tranh → Giải Mã Dây Chuyền',
    icon: '📜',
    badge: 'MỚI • Hài Hước Tột Đỉnh',
    desc: 'Truyền tay cuộn giấy bí mật: người trước viết câu lầy lội, người kế chỉ nhìn câu để vẽ, người sau chỉ nhìn tranh để đoán — rồi cùng mở Nhật Ký cười nghiêng ngả!',
  },
  {
    id: 'polyjuice_impostor',
    name: 'Đa Dịch Giả Mạo',
    subtitle: 'Mỗi Người 1 Nét — Truy Tìm Kẻ Giả Mạo',
    icon: '🧪',
    badge: 'MỚI • Suy Luận Ẩn Danh',
    desc: 'Tất cả lần lượt vẽ đúng 1 nét trên cùng bức tranh bằng màu mực riêng. 1 Kẻ Giả Mạo chỉ biết Chủ Đề chứ không biết Từ Khóa — hãy vạch mặt tại Phiên Tòa Wizengamot!',
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

interface ModeSelectorPanelProps {
  selectedModeId: GameMode;
  isHost: boolean;
  onModeChange: (mode: GameMode) => void;
}

export const ModeSelectorPanel: React.FC<ModeSelectorPanelProps> = ({
  selectedModeId,
  isHost,
  onModeChange,
}) => {
  return (
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
          <Wand2 size={17} color="var(--hogwarts-gold)" aria-hidden="true" />
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
          const isSelected = selectedModeId === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              disabled={!isHost}
              aria-pressed={isSelected}
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
                  ? mode.id === 'rush_draw'
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.28) 0%, rgba(124, 58, 237, 0.22) 100%)'
                    : 'linear-gradient(135deg, rgba(212, 175, 55, 0.24) 0%, rgba(116, 0, 1, 0.28) 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: isSelected
                  ? mode.id === 'rush_draw'
                    ? '2px solid #c084fc'
                    : '2px solid var(--hogwarts-gold)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isSelected
                  ? mode.id === 'rush_draw'
                    ? '0 0 18px rgba(192, 132, 252, 0.35)'
                    : '0 0 16px rgba(255, 216, 117, 0.25)'
                  : 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                aria-hidden="true"
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
                  border: isSelected
                    ? mode.id === 'rush_draw'
                      ? '1px solid #c084fc'
                      : '1px solid var(--hogwarts-gold)'
                    : 'none',
                }}
              >
                {mode.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: isSelected
                          ? mode.id === 'rush_draw'
                            ? '#e9d5ff'
                            : 'var(--hogwarts-gold)'
                          : '#fff',
                      }}
                      className="font-cinzel"
                    >
                      {mode.name}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        background: mode.id === 'rush_draw'
                          ? 'linear-gradient(135deg, #9333ea 0%, #6b21a8 100%)'
                          : 'rgba(255, 255, 255, 0.1)',
                        border: mode.id === 'rush_draw'
                          ? '1px solid #c084fc'
                          : '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        fontWeight: 700,
                      }}
                    >
                      {mode.badge}
                    </span>
                  </div>
                  {isSelected && (
                    <span
                      style={{
                        fontSize: '9px',
                        background: mode.id === 'rush_draw' ? '#c084fc' : 'var(--hogwarts-gold)',
                        color: mode.id === 'rush_draw' ? '#2e1065' : '#261601',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      ĐANG CHỌN
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: isSelected
                      ? mode.id === 'rush_draw'
                        ? '#d8b4fe'
                        : '#fef08a'
                      : 'var(--text-muted)',
                    fontWeight: 600,
                    marginTop: '2px',
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
  );
};

