import React from 'react';
import type { AvatarConfig, EyeType, MouthType, AccessoryType } from '../types';
import { Wand2, RefreshCw, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';

// 4 Hogwarts Houses & Wizarding Colors
const HOGWARTS_COLORS = [
  '#740001', // Gryffindor Scarlet
  '#ffd875', // Gryffindor Gold
  '#1a472a', // Slytherin Emerald
  '#0e1a40', // Ravenclaw Sapphire
  '#d3a625', // Hufflepuff Amber
  '#160c28', // Dark Magic Midnight
  '#9b111e', // Phoenix Red
  '#38bdf8', // Lumos Blue
  '#e2d9c8', // Old Parchment
  '#2d6a4f', // Potion Green
  '#4a154b', // Elder Magic Purple
  '#cbd5e1', // Hogwarts Ghost Silver
];

const EYE_TYPES: { id: EyeType; label: string }[] = [
  { id: 'happy', label: 'Mắt Xanh Lục (Harry)' },
  { id: 'cool', label: 'Thần Thái Kiêu Hãnh' },
  { id: 'star', label: 'Lấp Lánh Ma Thuật' },
  { id: 'wink', label: 'Nháy Mắt Tinh Quái' },
  { id: 'normal', label: 'Bình Thản' },
  { id: 'shocked', label: 'Mắt Phép Thần Kỳ' },
];

const MOUTH_TYPES: { id: MouthType; label: string }[] = [
  { id: 'smile', label: 'Mỉm Cười Thân Thiện' },
  { id: 'grin', label: 'Nụ Cười Tinh Nghịch' },
  { id: 'open', label: 'Đang Niệm Bùa Chú!' },
  { id: 'tongue', label: 'Lè Lưỡi Vui Nhộn' },
  { id: 'sad', label: 'Nghiêm Nghị (Snape)' },
];

const ACCESSORIES: { id: AccessoryType; label: string; icon: string }[] = [
  { id: 'none', label: 'Không có', icon: '✨' },
  { id: 'glasses', label: 'Kính Tròn Harry Potter', icon: '👓' },
  { id: 'hat', label: 'Mũ Phân Loại (Sorting Hat)', icon: '🧙' },
  { id: 'crown', label: 'Vương Miện Ravenclaw', icon: '👑' },
  { id: 'sunglasses', label: 'Vết Sẹo Tia Chớp ⚡', icon: '⚡' },
  { id: 'mustache', label: 'Râu Trắng Cụ Dumbledore', icon: '🧔' },
];

interface AvatarDisplayProps {
  avatar: AvatarConfig;
  size?: number;
  className?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ avatar, size = 64, className = '' }) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.42;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={`rounded-full shadow-lg transition-transform hover:scale-105 ${className}`}
      style={{ overflow: 'visible' }}
    >
      {/* Outer magical aura */}
      <circle cx={cx} cy={cy} r={r * 1.06} fill="none" stroke="rgba(255, 216, 117, 0.45)" strokeWidth={s * 0.03} />

      {/* Face Base */}
      <circle cx={cx} cy={cy} r={r} fill={avatar.color} stroke="#1b120c" strokeWidth={s * 0.04} />

      {/* Rosy Cheeks */}
      <circle cx={cx - r * 0.55} cy={cy + r * 0.2} r={r * 0.16} fill="rgba(255, 120, 100, 0.4)" />
      <circle cx={cx + r * 0.55} cy={cy + r * 0.2} r={r * 0.16} fill="rgba(255, 120, 100, 0.4)" />

      {/* Eyes */}
      {avatar.eyes === 'happy' && (
        // Harry's bright emerald eyes
        <g>
          <ellipse cx={cx - r * 0.3} cy={cy - r * 0.15} rx={r * 0.18} ry={r * 0.14} fill="#fff" stroke="#111" strokeWidth={1.5} />
          <ellipse cx={cx + r * 0.3} cy={cy - r * 0.15} rx={r * 0.18} ry={r * 0.14} fill="#fff" stroke="#111" strokeWidth={1.5} />
          <circle cx={cx - r * 0.3} cy={cy - r * 0.15} r={r * 0.11} fill="#10ac84" />
          <circle cx={cx + r * 0.3} cy={cy - r * 0.15} r={r * 0.11} fill="#10ac84" />
          <circle cx={cx - r * 0.3} cy={cy - r * 0.15} r={r * 0.05} fill="#111" />
          <circle cx={cx + r * 0.3} cy={cy - r * 0.15} r={r * 0.05} fill="#111" />
          <circle cx={cx - r * 0.33} cy={cy - r * 0.18} r={r * 0.035} fill="#fff" />
          <circle cx={cx + r * 0.27} cy={cy - r * 0.18} r={r * 0.035} fill="#fff" />
        </g>
      )}

      {avatar.eyes === 'cool' && (
        // Slytherin smirk eyes
        <g stroke="#111" strokeWidth={s * 0.055} strokeLinecap="round" fill="none">
          <path d={`M ${cx - r * 0.45} ${cy - r * 0.1} Q ${cx - r * 0.25} ${cy - r * 0.25} ${cx - r * 0.1} ${cy - r * 0.15}`} />
          <path d={`M ${cx + r * 0.1} ${cy - r * 0.15} Q ${cx + r * 0.25} ${cy - r * 0.25} ${cx + r * 0.45} ${cy - r * 0.1}`} />
        </g>
      )}

      {avatar.eyes === 'star' && (
        // Lumos starlight magic eyes
        <g fill="#ffd875" stroke="#9e7d3b" strokeWidth={0.5}>
          <text x={cx - r * 0.3} y={cy - r * 0.02} fontSize={r * 0.42} textAnchor="middle" dominantBaseline="middle">⭐</text>
          <text x={cx + r * 0.3} y={cy - r * 0.02} fontSize={r * 0.42} textAnchor="middle" dominantBaseline="middle">⭐</text>
        </g>
      )}

      {avatar.eyes === 'wink' && (
        <g stroke="#111" strokeWidth={s * 0.05} strokeLinecap="round" fill="#111">
          <circle cx={cx - r * 0.3} cy={cy - r * 0.15} r={r * 0.14} stroke="none" fill="#38bdf8" />
          <path d={`M ${cx + r * 0.1} ${cy - r * 0.1} Q ${cx + r * 0.3} ${cy - r * 0.3} ${cx + r * 0.5} ${cy - r * 0.1}`} fill="none" />
        </g>
      )}

      {avatar.eyes === 'normal' && (
        <g fill="#111">
          <circle cx={cx - r * 0.3} cy={cy - r * 0.15} r={r * 0.15} fill="#fff" stroke="#111" strokeWidth={1.5} />
          <circle cx={cx + r * 0.3} cy={cy - r * 0.15} r={r * 0.15} fill="#fff" stroke="#111" strokeWidth={1.5} />
          <circle cx={cx - r * 0.3} cy={cy - r * 0.15} r={r * 0.09} fill="#4a154b" />
          <circle cx={cx + r * 0.3} cy={cy - r * 0.15} r={r * 0.09} fill="#4a154b" />
          <circle cx={cx - r * 0.27} cy={cy - r * 0.18} r={r * 0.035} fill="#fff" />
          <circle cx={cx + r * 0.33} cy={cy - r * 0.18} r={r * 0.035} fill="#fff" />
        </g>
      )}

      {avatar.eyes === 'shocked' && (
        <g fill="#111">
          <circle cx={cx - r * 0.3} cy={cy - r * 0.15} r={r * 0.22} fill="#fff" stroke="#111" strokeWidth={2} />
          <circle cx={cx + r * 0.3} cy={cy - r * 0.15} r={r * 0.22} fill="#fff" stroke="#111" strokeWidth={2} />
          <circle cx={cx - r * 0.3} cy={cy - r * 0.15} r={r * 0.1} fill="#f43f5e" />
          <circle cx={cx + r * 0.3} cy={cy - r * 0.15} r={r * 0.1} fill="#f43f5e" />
        </g>
      )}

      {/* Mouths */}
      {avatar.mouth === 'smile' && (
        <path
          d={`M ${cx - r * 0.35} ${cy + r * 0.22} Q ${cx} ${cy + r * 0.55} ${cx + r * 0.35} ${cy + r * 0.22}`}
          fill="none"
          stroke="#111"
          strokeWidth={s * 0.045}
          strokeLinecap="round"
        />
      )}

      {avatar.mouth === 'grin' && (
        <path
          d={`M ${cx - r * 0.4} ${cy + r * 0.18} Q ${cx} ${cy + r * 0.62} ${cx + r * 0.4} ${cy + r * 0.18} Z`}
          fill="#fff"
          stroke="#111"
          strokeWidth={s * 0.04}
        />
      )}

      {avatar.mouth === 'open' && (
        // Incantation chant mouth
        <ellipse cx={cx} cy={cy + r * 0.28} rx={r * 0.22} ry={r * 0.26} fill="#450a0a" stroke="#111" strokeWidth={s * 0.035} />
      )}

      {avatar.mouth === 'tongue' && (
        <g>
          <path
            d={`M ${cx - r * 0.35} ${cy + r * 0.2} Q ${cx} ${cy + r * 0.45} ${cx + r * 0.35} ${cy + r * 0.2}`}
            fill="none"
            stroke="#111"
            strokeWidth={s * 0.045}
            strokeLinecap="round"
          />
          <path
            d={`M ${cx - r * 0.15} ${cy + r * 0.3} Q ${cx} ${cy + r * 0.65} ${cx + r * 0.15} ${cy + r * 0.3} Z`}
            fill="#ff4757"
            stroke="#111"
            strokeWidth={s * 0.02}
          />
        </g>
      )}

      {avatar.mouth === 'sad' && (
        <path
          d={`M ${cx - r * 0.3} ${cy + r * 0.4} Q ${cx} ${cy + r * 0.22} ${cx + r * 0.3} ${cy + r * 0.4}`}
          fill="none"
          stroke="#111"
          strokeWidth={s * 0.045}
          strokeLinecap="round"
        />
      )}

      {/* Harry Potter Special Accessories */}
      {avatar.accessory === 'glasses' && (
        // Harry Potter's iconic round wireframe glasses
        <g stroke="#ffd875" strokeWidth={s * 0.045} fill="none">
          <circle cx={cx - r * 0.3} cy={cy - r * 0.15} r={r * 0.28} />
          <circle cx={cx + r * 0.3} cy={cy - r * 0.15} r={r * 0.28} />
          <line x1={cx - r * 0.02} y1={cy - r * 0.15} x2={cx + r * 0.02} y2={cy - r * 0.15} strokeWidth={s * 0.05} />
        </g>
      )}

      {avatar.accessory === 'sunglasses' && (
        // The Legendary Lightning Bolt Scar on forehead! ⚡
        <g fill="#ffd875" stroke="#9e7d3b" strokeWidth={1} filter="drop-shadow(0 0 4px #ffd875)">
          <polygon points={`
            ${cx - r * 0.1},${cy - r * 0.75}
            ${cx + r * 0.05},${cy - r * 0.55}
            ${cx - r * 0.05},${cy - r * 0.55}
            ${cx + r * 0.12},${cy - r * 0.32}
            ${cx - r * 0.04},${cy - r * 0.45}
            ${cx + r * 0.06},${cy - r * 0.45}
          `} />
        </g>
      )}

      {avatar.accessory === 'hat' && (
        // The Hogwarts Sorting Hat (Mũ Phân Loại) — Perfectly centered on head
        <g>
          {/* Hat Cone */}
          <path
            d={`M ${cx - r * 0.52} ${cy - r * 0.65} Q ${cx - r * 0.32} ${cy - r * 1.02} ${cx + r * 0.12} ${cy - r * 1.32} Q ${cx + r * 0.42} ${cy - r * 1.02} ${cx + r * 0.52} ${cy - r * 0.65} Z`}
            fill="#4e342e"
            stroke="#1b0f0b"
            strokeWidth={s * 0.025}
          />
          {/* Hat Brim */}
          <ellipse
            cx={cx}
            cy={cy - r * 0.62}
            rx={r * 0.75}
            ry={r * 0.18}
            fill="#3e2723"
            stroke="#1b0f0b"
            strokeWidth={s * 0.025}
          />
          {/* Hat creases (eyes & mouth of Sorting Hat) */}
          <path
            d={`M ${cx - r * 0.25} ${cy - r * 0.88} Q ${cx} ${cy - r * 0.8} ${cx + r * 0.25} ${cy - r * 0.9}`}
            stroke="#1b0f0b"
            strokeWidth={s * 0.028}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M ${cx - r * 0.3} ${cy - r * 0.74} Q ${cx} ${cy - r * 0.66} ${cx + r * 0.3} ${cy - r * 0.76}`}
            stroke="#1b0f0b"
            strokeWidth={s * 0.032}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {avatar.accessory === 'crown' && (
        // Ravenclaw Diadem / Hogwarts House Crown — Centered on head
        <g>
          <polygon
            points={`
              ${cx - r * 0.45},${cy - r * 0.72}
              ${cx - r * 0.4},${cy - r * 1.05}
              ${cx - r * 0.18},${cy - r * 0.85}
              ${cx},${cy - r * 1.12}
              ${cx + r * 0.18},${cy - r * 0.85}
              ${cx + r * 0.4},${cy - r * 1.05}
              ${cx + r * 0.45},${cy - r * 0.72}
            `}
            fill="#ffd875"
            stroke="#8f6e2f"
            strokeWidth={s * 0.025}
          />
          <circle cx={cx} cy={cy - r * 0.82} r={r * 0.09} fill="#38bdf8" />
        </g>
      )}

      {avatar.accessory === 'mustache' && (
        // Dumbledore's long white beard
        <g fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={1}>
          <path
            d={`M ${cx - r * 0.4} ${cy + r * 0.28} Q ${cx} ${cy + r * 0.9} ${cx + r * 0.4} ${cy + r * 0.28} Q ${cx + r * 0.15} ${cy + r * 1.2} ${cx} ${cy + r * 1.28} Q ${cx - r * 0.15} ${cy + r * 1.2} ${cx - r * 0.4} ${cy + r * 0.28} Z`}
          />
        </g>
      )}
    </svg>
  );
};

interface AvatarPickerProps {
  avatar: AvatarConfig;
  onChange: (avatar: AvatarConfig) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ avatar, onChange }) => {
  const randomize = () => {
    soundManager.playToolSelect();
    const newColor = HOGWARTS_COLORS[Math.floor(Math.random() * HOGWARTS_COLORS.length)];
    const newEyes = EYE_TYPES[Math.floor(Math.random() * EYE_TYPES.length)].id;
    const newMouth = MOUTH_TYPES[Math.floor(Math.random() * MOUTH_TYPES.length)].id;
    const newAccessory = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id;
    onChange({
      color: newColor,
      eyes: newEyes,
      mouth: newMouth,
      accessory: newAccessory,
    });
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        padding: '20px',
        borderRadius: '20px',
        border: '2px solid var(--border-card)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hogwarts-gold)' }} className="font-cinzel">
          <Wand2 size={20} color="var(--hogwarts-gold)" /> Tạo Pháp Sư Của Bạn
        </h3>
        <button
          type="button"
          onClick={randomize}
          className="btn-yellow"
          style={{ padding: '6px 14px', fontSize: '13px' }}
        >
          <RefreshCw size={14} /> Bùa Biến Hình
        </button>
      </div>

      <div className="avatar-picker-preview-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--bg-stage)', padding: '14px', borderRadius: '18px', border: '2px solid var(--border-card)', display: 'flex', justifyContent: 'center' }}>
          <AvatarDisplay avatar={avatar} size={88} />
        </div>

        {/* Color Palette (House Robes) */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            Màu áo choàng Nhà Hogwarts:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
            {HOGWARTS_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  soundManager.playToolSelect();
                  onChange({ ...avatar, color: c });
                }}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  maxWidth: '36px',
                  maxHeight: '36px',
                  borderRadius: '50%',
                  background: c,
                  border: avatar.color === c ? '3px solid var(--hogwarts-gold)' : '2px solid rgba(0,0,0,0.4)',
                  transform: avatar.color === c ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: avatar.color === c ? '0 0 12px rgba(255, 216, 117, 0.6)' : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Selectors */}
      <div className="avatar-selectors-grid">
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Ánh mắt:
          </label>
          <select
            value={avatar.eyes}
            onChange={(e) => {
              soundManager.playToolSelect();
              onChange({ ...avatar, eyes: e.target.value as EyeType });
            }}
            style={{ width: '100%', fontSize: '16px', padding: '10px 8px' }}
          >
            {EYE_TYPES.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Biểu cảm:
          </label>
          <select
            value={avatar.mouth}
            onChange={(e) => {
              soundManager.playToolSelect();
              onChange({ ...avatar, mouth: e.target.value as MouthType });
            }}
            style={{ width: '100%', fontSize: '16px', padding: '10px 8px' }}
          >
            {MOUTH_TYPES.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Bảo bối phép:
          </label>
          <select
            value={avatar.accessory}
            onChange={(e) => {
              soundManager.playToolSelect();
              onChange({ ...avatar, accessory: e.target.value as AccessoryType });
            }}
            style={{ width: '100%', fontSize: '16px', padding: '10px 8px' }}
          >
            {ACCESSORIES.map((a) => (
              <option key={a.id} value={a.id}>{a.icon} {a.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
