import React, { useRef, useEffect } from 'react';
import type { DrawAction } from '../types';
import { clearCanvas, renderDrawAction, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../utils/canvasRenderer';
import { ZoomIn, CheckCircle2 } from 'lucide-react';

interface MiniCanvasBoardProps {
  actions: DrawAction[];
  playerName: string;
  avatarColor?: string;
  isSolved?: boolean;
  solvedWord?: string;
  onInspect?: () => void;
  aspectRatio?: number;
  className?: string;
}

export const MiniCanvasBoard: React.FC<MiniCanvasBoardProps> = ({
  actions,
  playerName,
  avatarColor = '#d4af37',
  isSolved = false,
  solvedWord,
  onInspect,
  aspectRatio = 1.6,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderedIndexRef = useRef<number>(0);

  // Redraw all or incremental
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (actions.length === 0) {
      clearCanvas(ctx);
      renderedIndexRef.current = 0;
      return;
    }

    // Check if a 'clear' action was introduced, or if actions were reset
    const lastClearIdx = actions.map(a => a.type).lastIndexOf('clear');
    if (lastClearIdx >= renderedIndexRef.current || renderedIndexRef.current > actions.length) {
      clearCanvas(ctx);
      const startIdx = Math.max(0, lastClearIdx);
      for (let i = startIdx; i < actions.length; i++) {
        renderDrawAction(ctx, actions[i]);
      }
      renderedIndexRef.current = actions.length;
    } else {
      // Incremental render of only new actions
      for (let i = renderedIndexRef.current; i < actions.length; i++) {
        renderDrawAction(ctx, actions[i]);
      }
      renderedIndexRef.current = actions.length;
    }
  }, [actions]);

  return (
    <div
      onClick={onInspect}
      className={`mini-canvas-card ${className}`}
      style={{
        position: 'relative',
        background: '#ffffff',
        borderRadius: '14px',
        overflow: 'hidden',
        border: isSolved ? '2px solid #22c55e' : '2px solid var(--border-card)',
        boxShadow: isSolved ? '0 0 15px rgba(34, 197, 94, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.25)',
        cursor: onInspect ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, border-color 0.2s ease',
      }}
    >
      {/* 16:10 aspect ratio wrapper */}
      <div style={{ position: 'relative', width: '100%', paddingTop: `${(1 / aspectRatio) * 100}%` }}>
        <canvas
          ref={canvasRef}
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            background: '#ffffff',
          }}
        />

        {/* Solved Overlay */}
        {isSolved && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <CheckCircle2 size={28} color="#4ade80" />
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase' }}>
              Đã Giải Mã!
            </div>
            {solvedWord && (
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 900,
                  color: '#ffffff',
                  background: 'rgba(34, 197, 94, 0.3)',
                  border: '1px solid #4ade80',
                  borderRadius: '8px',
                  padding: '2px 8px',
                  letterSpacing: '0.5px',
                }}
              >
                {solvedWord}
              </div>
            )}
          </div>
        )}

        {/* Zoom In button hint on hover */}
        {onInspect && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              background: 'rgba(0, 0, 0, 0.55)',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s',
            }}
            title="Phóng to soi tranh"
          >
            <ZoomIn size={14} />
          </div>
        )}
      </div>

      {/* Opponent Label Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'rgba(26, 16, 37, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '12px',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            color: avatarColor,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '120px',
          }}
        >
          {playerName}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: isSolved ? '#4ade80' : 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          {isSolved ? '✅ Xong' : '✏️ Đang vẽ'}
        </span>
      </div>
    </div>
  );
};
