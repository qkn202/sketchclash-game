import React, { useId } from 'react';
import type { ToolType } from '../types';
import { soundManager } from '../utils/audio';
import { Wand2, FlaskConical, Eraser, Trash2, Undo2, Redo2, Sparkles, Flame, Snowflake } from 'lucide-react';
import { ModalDialog } from './ModalDialog';

export const ClearCanvasConfirmModal: React.FC<{
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ onCancel, onConfirm }) => {
  const titleId = useId();
  return (
    <ModalDialog
      ariaLabelledBy={titleId}
      dismissible={true}
      onClose={onCancel}
      maxWidth="400px"
      style={{ padding: '20px', gap: '14px' }}
    >
      <h2
        id={titleId}
        className="font-cinzel"
        style={{ fontSize: '18px', fontWeight: 800, color: 'var(--hogwarts-gold)', margin: 0 }}
      >
        Niệm Bùa Bombarda?
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
        Bạn có chắc muốn xóa sạch toàn bộ nét vẽ trên tấm giấy da hiện tại không? (Bạn vẫn có thể Hoàn tác Ctrl+Z sau khi xóa).
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          className="btn-icon"
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          Giữ Lại Tranh
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="btn-danger"
          style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '10px' }}
        >
          Xóa Sạch (Bombarda)
        </button>
      </div>
    </ModalDialog>
  );
};

export const HOGWARTS_MAGIC_COLORS: { hex: string; name: string }[] = [
  { hex: '#000000', name: 'Mực Đen' },
  { hex: '#2d1b0d', name: 'Gỗ Sồi Đậm' },
  { hex: '#4b2e16', name: 'Gỗ Đũa Phép' },
  { hex: '#740001', name: 'Đỏ Gryffindor' },
  { hex: '#991b1b', name: 'Đỏ Phượng Hoàng' },
  { hex: '#d97706', name: 'Hổ Phách' },
  { hex: '#ffd875', name: 'Vàng Hogwarts' },
  { hex: '#1a472a', name: 'Xanh Slytherin' },
  { hex: '#15803d', name: 'Xanh Độc Dược' },
  { hex: '#10ac84', name: 'Ngọc Lục Bảo' },
  { hex: '#0e1a40', name: 'Xanh Ravenclaw' },
  { hex: '#1d4ed8', name: 'Xanh Thần Sáng' },
  { hex: '#38bdf8', name: 'Băng Glisseo' },
  { hex: '#ffffff', name: 'Trắng Tuyết' },
  { hex: '#4a154b', name: 'Tím Hắc Ám' },
  { hex: '#7c3aed', name: 'Tím Phép Thuật' },
  { hex: '#a855f7', name: 'Tím Oải Hương' },
  { hex: '#f43f5e', name: 'Hồng Tình Dược' },
  { hex: '#fb7185', name: 'Hồng San Hô' },
  { hex: '#faedcd', name: 'Giấy Da Cổ' },
  { hex: '#d4af37', name: 'Đồng Cổ' },
  { hex: '#042f2e', name: 'Rừng Cấm' },
  { hex: '#0f766e', name: 'Xanh Hồ Đen' },
  { hex: '#1e293b', name: 'Đá Lâu Đài' },
  { hex: '#64748b', name: 'Xám Sương Mù' },
  { hex: '#94a3b8', name: 'Bạc Ma Hogwarts' },
  { hex: '#cbd5e1', name: 'Bạc Ánh Trăng' },
  { hex: '#e2e8f0', name: 'Trắng Mây' },
];

export const BRUSH_SIZES = [
  { size: 3, label: 'Kim Phép (3px)' },
  { size: 6, label: 'Đũa Nhỏ (6px)' },
  { size: 12, label: 'Đũa Phép (12px)' },
  { size: 24, label: 'Lửa Phép (24px)' },
  { size: 48, label: 'Bão Phép (48px)' },
];

interface CanvasToolbarProps {
  tool: ToolType;
  color: string;
  brushSize: number;
  canUndo: boolean;
  canRedo: boolean;
  singleStrokeMode?: boolean;
  lockedColor?: string;
  hideClearButton?: boolean;
  onSelectTool: (tool: ToolType) => void;
  onSelectColor: (color: string) => void;
  onSelectBrushSize: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  tool,
  color,
  brushSize,
  canUndo,
  canRedo,
  singleStrokeMode = false,
  lockedColor,
  hideClearButton = false,
  onSelectTool,
  onSelectColor,
  onSelectBrushSize,
  onUndo,
  onRedo,
  onClear,
}) => {
  const colorInputId = useId();

  return (
    <div className="canvas-toolbar" role="toolbar" aria-label="Bộ công cụ vẽ phép thuật">
      {/* Row 1: Magical Tools & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3px', width: '100%' }}>
        <button
          type="button"
          aria-label="Đũa cơ bản (Phím 1 hoặc B)"
          aria-pressed={tool === 'brush'}
          onClick={() => {
            soundManager.playToolSelect();
            onSelectTool('brush');
          }}
          className={`btn-icon ${tool === 'brush' ? 'btn-gold' : ''}`}
          style={{ padding: '5px', minInlineSize: '30px', minBlockSize: '30px' }}
        >
          <Wand2 size={15} aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Cọ lửa Incendio (Phím 2)"
          aria-pressed={tool === 'fire'}
          onClick={() => {
            soundManager.playFlame();
            onSelectTool('fire');
          }}
          className={`btn-icon btn-tool-fire ${tool === 'fire' ? 'active' : ''}`}
          style={{ padding: '5px', minInlineSize: '30px', minBlockSize: '30px' }}
        >
          <Flame size={15} color={tool === 'fire' ? '#ffffff' : '#ff7a00'} aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Cọ băng Glisseo (Phím 3)"
          aria-pressed={tool === 'ice'}
          onClick={() => {
            soundManager.playFrost();
            onSelectTool('ice');
          }}
          className={`btn-icon btn-tool-ice ${tool === 'ice' ? 'active' : ''}`}
          style={{ padding: '5px', minInlineSize: '30px', minBlockSize: '30px' }}
        >
          <Snowflake size={15} color={tool === 'ice' ? '#ffffff' : '#38bdf8'} aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Bụi sao Lumos (Phím 4)"
          aria-pressed={tool === 'sparkle'}
          onClick={() => {
            soundManager.playSparkle();
            onSelectTool('sparkle');
          }}
          className={`btn-icon btn-tool-sparkle ${tool === 'sparkle' ? 'active' : ''}`}
          style={{ padding: '5px', minInlineSize: '30px', minBlockSize: '30px' }}
        >
          <Sparkles size={15} color={tool === 'sparkle' ? '#261601' : '#ffd875'} aria-hidden="true" />
        </button>

        {!singleStrokeMode && (
          <>
            <div style={{ width: '1px', height: '18px', background: 'var(--border-card)', margin: '0 1px' }} />

            <button
              type="button"
              aria-label="Vạc phép đổ màu (Phím F)"
              aria-pressed={tool === 'bucket'}
              onClick={() => {
                soundManager.playToolSelect();
                onSelectTool('bucket');
              }}
              className={`btn-icon ${tool === 'bucket' ? 'btn-gold' : ''}`}
              style={{ padding: '5px', minInlineSize: '30px', minBlockSize: '30px' }}
            >
              <FlaskConical size={15} aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label="Bùa tẩy Evanesco (Phím E)"
              aria-pressed={tool === 'eraser'}
              onClick={() => {
                soundManager.playToolSelect();
                onSelectTool('eraser');
              }}
              className={`btn-icon ${tool === 'eraser' ? 'btn-gold' : ''}`}
              style={{ padding: '5px', minInlineSize: '30px', minBlockSize: '30px' }}
            >
              <Eraser size={15} aria-hidden="true" />
            </button>

            <div style={{ width: '1px', height: '18px', background: 'var(--border-card)', margin: '0 1px' }} />

            <button
              type="button"
              aria-label="Quay ngược thời gian (Hoàn tác Ctrl+Z)"
              onClick={onUndo}
              disabled={!canUndo}
              className="btn-icon"
              style={{ padding: '5px', minInlineSize: '30px', minBlockSize: '30px' }}
            >
              <Undo2 size={14} aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label="Tái niệm phép (Làm lại)"
              onClick={onRedo}
              disabled={!canRedo}
              className="btn-icon"
              style={{ padding: '5px', minInlineSize: '30px', minBlockSize: '30px' }}
            >
              <Redo2 size={14} aria-hidden="true" />
            </button>

            {!hideClearButton && (
              <button
                type="button"
                aria-label="Bùa Bombarda xóa sạch bảng vẽ (Phím C)"
                onClick={onClear}
                className="btn-danger"
                style={{ padding: '5px', minInlineSize: '30px', minBlockSize: '30px' }}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Row 2: Brush Sizes & Custom Color Flask */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', width: '100%' }}>
        <div
          role="group"
          aria-label="Kích cỡ nét cọ"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-stage)', padding: '2px 6px', borderRadius: '10px', border: '1px solid var(--border-card)' }}
        >
          {BRUSH_SIZES.map((b) => (
            <button
              key={b.size}
              type="button"
              className="brush-size-btn"
              aria-label={`Cỡ cọ ${b.label}`}
              aria-pressed={brushSize === b.size}
              onClick={() => {
                soundManager.playToolSelect();
                onSelectBrushSize(b.size);
              }}
              style={{
                minInlineSize: '26px',
                minBlockSize: '26px',
                borderRadius: '50%',
                background: brushSize === b.size ? 'var(--hogwarts-gold)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <div
                style={{
                  width: Math.min(b.size, 13),
                  height: Math.min(b.size, 13),
                  borderRadius: '50%',
                  background: brushSize === b.size ? '#261601' : 'rgba(255,255,255,0.6)',
                }}
              />
            </button>
          ))}
        </div>

        {lockedColor ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(10, 6, 18, 0.7)',
              border: '1px solid var(--border-gold)',
              borderRadius: '10px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--hogwarts-gold)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: lockedColor,
                border: '2px solid #fff',
              }}
            />
            <span>Mực Định Danh (1 Nét)</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor={colorInputId} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Pha màu:
            </label>
            <input
              id={colorInputId}
              type="color"
              value={color}
              onChange={(e) => onSelectColor(e.target.value)}
              style={{
                width: '32px',
                height: '26px',
                padding: '0',
                border: '2px solid var(--hogwarts-gold)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            />
          </div>
        )}
      </div>

      {/* Row 3: Hogwarts Color Grid */}
      {!lockedColor && (
        <div className="color-swatch-container">
          <div className="color-swatch-grid" role="group" aria-label="Bảng màu phép thuật Hogwarts">
            {HOGWARTS_MAGIC_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                aria-label={`Màu ${c.name}`}
                aria-pressed={color === c.hex}
                onClick={() => {
                  soundManager.playToolSelect();
                  onSelectColor(c.hex);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  minInlineSize: '16px',
                  minBlockSize: '20px',
                  borderRadius: '4px',
                  background: c.hex,
                  border: color === c.hex ? '2px solid #ffd875' : '1px solid rgba(0,0,0,0.5)',
                  transform: color === c.hex ? 'scale(1.12)' : 'scale(1)',
                  boxShadow: color === c.hex ? '0 0 6px rgba(255,216,117,0.8)' : 'none',
                  zIndex: color === c.hex ? 2 : 1,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

