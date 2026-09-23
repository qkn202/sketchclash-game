import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ToolType, DrawAction, DrawStroke, Point, GameMode, GamePhase } from '../types';
import { floodFillCanvas } from '../utils/floodFill';
import { soundManager } from '../utils/audio';
import { Wand2, FlaskConical, Eraser, Trash2, Undo2, Redo2, Sparkles, Flame, Snowflake } from 'lucide-react';

const HOGWARTS_MAGIC_COLORS = [
  '#000000', '#2d1b0d', '#4b2e16', '#740001', '#991b1b', '#d97706', '#ffd875',
  '#1a472a', '#15803d', '#10ac84', '#0e1a40', '#1d4ed8', '#38bdf8', '#ffffff',
  '#4a154b', '#7c3aed', '#a855f7', '#f43f5e', '#fb7185', '#faedcd', '#d4af37',
  '#042f2e', '#0f766e', '#1e293b', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0',
];

const BRUSH_SIZES = [
  { size: 3, label: 'Kim Phép' },
  { size: 6, label: 'Đũa Nhỏ' },
  { size: 12, label: 'Đũa Phép' },
  { size: 24, label: 'Lửa Phép' },
  { size: 48, label: 'Bão Phép' },
];

interface CanvasBoardProps {
  isDrawer: boolean;
  onBroadcastDraw: (action: DrawAction) => void;
  incomingAction: DrawAction | null;
  mode?: GameMode;
  coopPartnerName?: string;
  isLoneGuesser?: boolean;
  phase?: GamePhase;
  currentWord?: string;
  roundEndMessage?: string | null;
  initialActions?: DrawAction[];
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  isDrawer,
  onBroadcastDraw,
  incomingAction,
  mode = 'classic',
  coopPartnerName,
  isLoneGuesser = false,
  phase = 'drawing',
  currentWord = '',
  roundEndMessage = null,
  initialActions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<ToolType>('brush');
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(6);

  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  const isDrawing = useRef<boolean>(false);
  const currentStroke = useRef<DrawStroke | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [boardDimensions, setBoardDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const updateDimensions = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return; // Do not resize if hidden (display: none)
      const availW = Math.max(100, Math.floor(rect.width));
      const availH = Math.max(100, Math.floor(rect.height));

      // Strictly fit within available space with 16:10 aspect ratio
      let w = availW;
      let h = Math.floor(w / 1.6);
      if (h > availH) {
        h = availH;
        w = Math.floor(h * 1.6);
      }
      setBoardDimensions({ width: w, height: h });
    };

    updateDimensions();

    const ro = new ResizeObserver(() => {
      updateDimensions();
    });
    ro.observe(el);

    window.addEventListener('resize', updateDimensions);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(() => {
    return typeof document !== 'undefined' ? document.getElementById('drawing-toolbar-container') : null;
  });

  useEffect(() => {
    const updateTarget = () => {
      const el = document.getElementById('drawing-toolbar-container');
      if (el) setPortalTarget(el);
    };
    updateTarget();
    const t1 = setTimeout(updateTarget, 50);
    const t2 = setTimeout(updateTarget, 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Logical resolution
  const LOGICAL_WIDTH = 800;
  const LOGICAL_HEIGHT = 500;

  // Track initialActions in ref so we don't trigger re-init on every stroke
  const initialActionsRef = useRef(initialActions);
  useEffect(() => {
    initialActionsRef.current = initialActions;
  }, [initialActions]);

  const pushUndoState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const snap = ctx.getImageData(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    setUndoStack((prev) => [...prev.slice(-20), snap]);
    setRedoStack([]);
  };

  const renderStroke = useCallback((stroke: DrawStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { tool: sTool, color: sColor, size: sSize, points } = stroke;
    if (points.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawPath = () => {
      if (points.length === 1) {
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, sSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      } else if (points.length === 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const midX = (points[i].x + points[i + 1].x) / 2;
          const midY = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }
        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }
    };

    if (sTool === 'fire') {
      // Layer 1: Incendio Flame aura
      ctx.shadowColor = '#ff4500';
      ctx.shadowBlur = sSize * 1.3;
      ctx.strokeStyle = '#ff7a00';
      ctx.lineWidth = sSize;
      drawPath();

      // Layer 2: White-gold core
      ctx.shadowBlur = sSize * 0.4;
      ctx.shadowColor = '#ffd700';
      ctx.strokeStyle = '#fff7b2';
      ctx.lineWidth = Math.max(2, sSize * 0.45);
      drawPath();

      // Floating spark embers
      for (const pt of points) {
        if (Math.random() < 0.35) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * sSize * 0.8 + 2;
          const emberX = pt.x + Math.cos(angle) * dist;
          const emberY = pt.y + Math.sin(angle) * dist - (Math.random() * 4 + 2);
          ctx.fillStyle = Math.random() > 0.5 ? '#ffd700' : '#ff3b00';
          ctx.beginPath();
          ctx.arc(emberX, emberY, Math.random() * 2 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (sTool === 'ice') {
      // Layer 1: Glisseo Frost aura
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = sSize * 1.2;
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = sSize;
      drawPath();

      // Layer 2: Crystalline core
      ctx.shadowBlur = sSize * 0.3;
      ctx.shadowColor = '#bae6fd';
      ctx.strokeStyle = '#f0f9ff';
      ctx.lineWidth = Math.max(2, sSize * 0.4);
      drawPath();

      // Ice crystal diamonds
      for (let i = 0; i < points.length; i += 2) {
        if (Math.random() < 0.3) {
          const pt = points[i];
          const crystalSize = sSize * 0.4;
          ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - crystalSize);
          ctx.lineTo(pt.x + crystalSize * 0.6, pt.y);
          ctx.lineTo(pt.x, pt.y + crystalSize);
          ctx.lineTo(pt.x - crystalSize * 0.6, pt.y);
          ctx.closePath();
          ctx.fill();
        }
      }
    } else if (sTool === 'sparkle') {
      // Layer 1: Lumos Starlight halo
      ctx.shadowColor = '#ffd875';
      ctx.shadowBlur = sSize * 1.5;
      ctx.strokeStyle = '#ffd875';
      ctx.lineWidth = sSize;
      drawPath();

      // Layer 2: White core beam
      ctx.shadowBlur = sSize * 0.4;
      ctx.shadowColor = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, sSize * 0.35);
      drawPath();

      // 4-pointed sparkle stars
      for (const pt of points) {
        if (Math.random() < 0.28) {
          const starR = Math.max(3, sSize * 0.65);
          ctx.fillStyle = '#fffdf0';
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - starR);
          ctx.quadraticCurveTo(pt.x, pt.y, pt.x + starR, pt.y);
          ctx.quadraticCurveTo(pt.x, pt.y, pt.x, pt.y + starR);
          ctx.quadraticCurveTo(pt.x, pt.y, pt.x - starR, pt.y);
          ctx.quadraticCurveTo(pt.x, pt.y, pt.x, pt.y - starR);
          ctx.fill();
        }
      }
    } else {
      ctx.lineWidth = sSize;
      ctx.strokeStyle = sTool === 'eraser' ? '#FFFFFF' : sColor;
      drawPath();
    }

    ctx.restore();
  }, []);

  const renderFill = useCallback((x: number, y: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    floodFillCanvas(ctx, x, y, fillColor);
  }, []);

  const clearBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }, []);

  // Initialize Canvas and restore previous drawing if present
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Classic magical parchment tone
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // If pre-existing actions exist, restore them
    const actionsToReplay = initialActionsRef.current;
    if (actionsToReplay && actionsToReplay.length > 0) {
      actionsToReplay.forEach((act) => {
        if (act.type === 'stroke' && act.stroke) {
          renderStroke(act.stroke);
        } else if (act.type === 'fill' && act.fill) {
          renderFill(act.fill.x, act.fill.y, act.fill.color);
        } else if (act.type === 'clear') {
          clearBoard();
        }
      });
    }

    const baseSnapshot = ctx.getImageData(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    setUndoStack([baseSnapshot]);
    setRedoStack([]);
  }, [renderStroke, renderFill, clearBoard]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  useEffect(() => {
    if (!incomingAction) return;

    if (incomingAction.type === 'stroke' && incomingAction.stroke) {
      renderStroke(incomingAction.stroke);
    } else if (incomingAction.type === 'fill' && incomingAction.fill) {
      renderFill(incomingAction.fill.x, incomingAction.fill.y, incomingAction.fill.color);
    } else if (incomingAction.type === 'clear') {
      clearBoard();
    }
  }, [incomingAction, renderStroke, renderFill, clearBoard]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | MouseEvent | TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) {
        if ('changedTouches' in e && e.changedTouches.length > 0) {
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
        } else {
          return null;
        }
      } else {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    // Determine actual rendered content box inside canvas (handles any aspect-ratio letterboxing or scaling)
    const intrinsicRatio = LOGICAL_WIDTH / LOGICAL_HEIGHT; // 800 / 500 = 1.6
    const elemRatio = rect.width / rect.height;

    let contentWidth = rect.width;
    let contentHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (elemRatio > intrinsicRatio + 0.001) {
      // Element is wider than 16:10 -> pillarboxing (bars on left and right)
      contentHeight = rect.height;
      contentWidth = contentHeight * intrinsicRatio;
      offsetX = (rect.width - contentWidth) / 2;
    } else if (elemRatio < intrinsicRatio - 0.001) {
      // Element is taller than 16:10 -> letterboxing (bars on top and bottom)
      contentWidth = rect.width;
      contentHeight = contentWidth / intrinsicRatio;
      offsetY = (rect.height - contentHeight) / 2;
    }

    const relativeX = clientX - (rect.left + offsetX);
    const relativeY = clientY - (rect.top + offsetY);

    const x = Math.max(0, Math.min(LOGICAL_WIDTH, (relativeX / contentWidth) * LOGICAL_WIDTH));
    const y = Math.max(0, Math.min(LOGICAL_HEIGHT, (relativeY / contentHeight) * LOGICAL_HEIGHT));

    return { x, y };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    if ('preventDefault' in e) e.preventDefault();

    const pt = getCanvasCoords(e);
    if (!pt) return;

    pushUndoState();

    if (tool === 'bucket') {
      soundManager.playToolSelect();
      renderFill(pt.x, pt.y, color);
      onBroadcastDraw({
        type: 'fill',
        fill: { x: pt.x, y: pt.y, color },
      });
      return;
    }

    // Play tool-specific drawing sound
    if (tool === 'fire') {
      soundManager.playFlame();
    } else if (tool === 'ice') {
      soundManager.playFrost();
    } else if (tool === 'sparkle') {
      soundManager.playSparkle();
    }

    isDrawing.current = true;
    const stroke: DrawStroke = {
      id: `s_${Date.now()}_${Math.random()}`,
      tool,
      color: tool === 'eraser' ? '#FFFFFF' : color,
      size: brushSize,
      points: [pt],
    };

    currentStroke.current = stroke;
    renderStroke(stroke);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawing.current || !currentStroke.current) return;
    if ('preventDefault' in e) e.preventDefault();

    const pt = getCanvasCoords(e);
    if (!pt) return;

    const stroke = currentStroke.current;
    stroke.points.push(pt);

    renderStroke(stroke);

    if (stroke.points.length % 3 === 0) {
      onBroadcastDraw({
        type: 'stroke',
        stroke: { ...stroke, points: stroke.points.slice(-4) },
      });
    }
  };

  const handlePointerUp = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawing.current || !currentStroke.current) return;
    if (e && 'preventDefault' in e) e.preventDefault();

    const stroke = currentStroke.current;
    isDrawing.current = false;
    currentStroke.current = null;

    onBroadcastDraw({
      type: 'stroke',
      stroke: {
        ...stroke,
        points: stroke.points.length > 4 ? stroke.points.slice(-4) : stroke.points,
      },
    });
  };

  const handleUndo = () => {
    if (!isDrawer || undoStack.length <= 1) return;
    soundManager.playClick();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentSnap = ctx.getImageData(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    setRedoStack((prev) => [...prev, currentSnap]);

    const newUndo = [...undoStack];
    newUndo.pop();
    const restoreSnap = newUndo[newUndo.length - 1];

    setUndoStack(newUndo);
    if (restoreSnap) {
      ctx.putImageData(restoreSnap, 0, 0);
    }
  };

  const handleRedo = () => {
    if (!isDrawer || redoStack.length === 0) return;
    soundManager.playClick();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentSnap = ctx.getImageData(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    setUndoStack((prev) => [...prev, currentSnap]);

    const newRedo = [...redoStack];
    const nextSnap = newRedo.pop()!;
    setRedoStack(newRedo);

    ctx.putImageData(nextSnap, 0, 0);
  };

  const handleClear = () => {
    if (!isDrawer) return;
    if (window.confirm('Bạn có muốn dùng bùa Bombarda để xóa sạch bảng vẽ không?')) {
      soundManager.playClear();
      pushUndoState();
      clearBoard();
      onBroadcastDraw({ type: 'clear' });
    }
  };

  useEffect(() => {
    if (!isDrawer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === '1' || e.key.toLowerCase() === 'b') {
        soundManager.playToolSelect();
        setTool('brush');
      } else if (e.key === '2') {
        soundManager.playFlame();
        setTool('fire');
      } else if (e.key === '3') {
        soundManager.playFrost();
        setTool('ice');
      } else if (e.key === '4') {
        soundManager.playSparkle();
        setTool('sparkle');
      } else if (e.key.toLowerCase() === 'e') {
        soundManager.playToolSelect();
        setTool('eraser');
      } else if (e.key.toLowerCase() === 'f') {
        soundManager.playToolSelect();
        setTool('bucket');
      } else if (e.key.toLowerCase() === 'c') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawer, undoStack]);

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawer || !isDrawing.current || !currentStroke.current) return;
      const pt = getCanvasCoords(e);
      if (!pt) return;
      const stroke = currentStroke.current;
      stroke.points.push(pt);
      renderStroke(stroke);
      if (stroke.points.length % 3 === 0) {
        onBroadcastDraw({
          type: 'stroke',
          stroke: { ...stroke, points: stroke.points.slice(-4) },
        });
      }
    };

    const handleGlobalPointerUp = () => {
      if (isDrawing.current && currentStroke.current) {
        const stroke = currentStroke.current;
        isDrawing.current = false;
        currentStroke.current = null;
        onBroadcastDraw({
          type: 'stroke',
          stroke: {
            ...stroke,
            points: stroke.points.length > 4 ? stroke.points.slice(-4) : stroke.points,
          },
        });
      }
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('touchmove', handleGlobalMove, { passive: true });
    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, [isDrawer, onBroadcastDraw, renderStroke]);

  const toolbarContent = isDrawer ? (
    <div className="canvas-toolbar">
      {/* Row 1: Magical Tools & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3px', width: '100%' }}>
        <button
          type="button"
          onClick={() => { soundManager.playToolSelect(); setTool('brush'); }}
          className={`btn-icon ${tool === 'brush' ? 'btn-gold' : ''}`}
          title="Đũa Cơ Bản (Phím 1/B)"
          style={{ padding: '5px', minWidth: '28px', minHeight: '28px' }}
        >
          <Wand2 size={15} />
        </button>

        <button
          type="button"
          onClick={() => { soundManager.playFlame(); setTool('fire'); }}
          className={`btn-icon btn-tool-fire ${tool === 'fire' ? 'active' : ''}`}
          title="Cọ Lửa Incendio 🔥 (Phím 2)"
          style={{ padding: '5px', minWidth: '28px', minHeight: '28px' }}
        >
          <Flame size={15} color={tool === 'fire' ? '#ffffff' : '#ff7a00'} />
        </button>

        <button
          type="button"
          onClick={() => { soundManager.playFrost(); setTool('ice'); }}
          className={`btn-icon btn-tool-ice ${tool === 'ice' ? 'active' : ''}`}
          title="Cọ Băng Glisseo ❄️ (Phím 3)"
          style={{ padding: '5px', minWidth: '28px', minHeight: '28px' }}
        >
          <Snowflake size={15} color={tool === 'ice' ? '#ffffff' : '#38bdf8'} />
        </button>

        <button
          type="button"
          onClick={() => { soundManager.playSparkle(); setTool('sparkle'); }}
          className={`btn-icon btn-tool-sparkle ${tool === 'sparkle' ? 'active' : ''}`}
          title="Bụi Sao Lumos ✨ (Phím 4)"
          style={{ padding: '5px', minWidth: '28px', minHeight: '28px' }}
        >
          <Sparkles size={15} color={tool === 'sparkle' ? '#261601' : '#ffd875'} />
        </button>

        <div style={{ width: '1px', height: '18px', background: 'var(--border-card)', margin: '0 1px' }} />

        <button
          type="button"
          onClick={() => { soundManager.playToolSelect(); setTool('bucket'); }}
          className={`btn-icon ${tool === 'bucket' ? 'btn-gold' : ''}`}
          title="Vạc Phép Đổ Màu (Phím F)"
          style={{ padding: '5px', minWidth: '28px', minHeight: '28px' }}
        >
          <FlaskConical size={15} />
        </button>

        <button
          type="button"
          onClick={() => { soundManager.playToolSelect(); setTool('eraser'); }}
          className={`btn-icon ${tool === 'eraser' ? 'btn-gold' : ''}`}
          title="Bùa Tẩy Evanesco (Phím E)"
          style={{ padding: '5px', minWidth: '28px', minHeight: '28px' }}
        >
          <Eraser size={15} />
        </button>

        <div style={{ width: '1px', height: '18px', background: 'var(--border-card)', margin: '0 1px' }} />

        <button
          type="button"
          onClick={handleUndo}
          disabled={undoStack.length <= 1}
          className="btn-icon"
          title="Quay Ngược Thời Gian (Ctrl+Z)"
          style={{ padding: '5px', minWidth: '28px', minHeight: '28px' }}
        >
          <Undo2 size={14} />
        </button>

        <button
          type="button"
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="btn-icon"
          title="Tái Niệm Phép"
          style={{ padding: '5px', minWidth: '28px', minHeight: '28px' }}
        >
          <Redo2 size={14} />
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="btn-danger"
          title="Bùa Bombarda Xóa Sạch (Phím C)"
          style={{ padding: '5px', minWidth: '28px', minHeight: '28px' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Row 2: Brush Sizes & Custom Color Flask */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-stage)', padding: '2px 6px', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
          {BRUSH_SIZES.map((b) => (
            <button
              key={b.size}
              type="button"
              onClick={() => { soundManager.playToolSelect(); setBrushSize(b.size); }}
              title={b.label}
              style={{
                width: '24px',
                height: '24px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pha màu:</span>
          <input
            type="color"
            value={color}
            onChange={(e) => { setColor(e.target.value); if (tool === 'eraser') setTool('brush'); }}
            title="Pha chế màu sắc phép thuật mới"
            style={{
              width: '32px',
              height: '24px',
              padding: '0',
              border: '2px solid var(--hogwarts-gold)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      {/* Row 3: Hogwarts Color Grid */}
      <div className="color-swatch-container">
        <div className="color-swatch-grid">
          {HOGWARTS_MAGIC_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { soundManager.playToolSelect(); setColor(c); if (tool === 'eraser') setTool('brush'); }}
              style={{
                width: '100%',
                height: '100%',
                minWidth: '15px',
                minHeight: '15px',
                borderRadius: '4px',
                background: c,
                border: color === c ? '2px solid #ffd875' : '1px solid rgba(0,0,0,0.5)',
                transform: color === c ? 'scale(1.15)' : 'scale(1)',
                boxShadow: color === c ? '0 0 6px rgba(255,216,117,0.8)' : 'none',
                zIndex: color === c ? 2 : 1,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="canvas-board-outer-container">
      <div ref={wrapperRef} className="canvas-board-wrapper">
        {/* Hogwarts Magic Parchment Canvas */}
        <div
          className="canvas-parchment-container"
          style={
            boardDimensions
              ? { width: `${boardDimensions.width}px`, height: `${boardDimensions.height}px` }
              : undefined
          }
        >
        <canvas
          ref={canvasRef}
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: !isDrawer
              ? 'default'
              : tool === 'bucket'
              ? 'cell'
              : tool === 'eraser'
              ? 'crosshair'
              : 'crosshair',
            touchAction: 'none',
          }}
        />

        {/* Mode Status Badges on Canvas */}
        {!isDrawer ? (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(10, 6, 18, 0.9)',
              backdropFilter: 'blur(6px)',
              padding: '6px 14px',
              borderRadius: '20px',
              color: isLoneGuesser && mode === 'all_draw' ? 'var(--accent-cyan)' : 'var(--hogwarts-gold)',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: isLoneGuesser && mode === 'all_draw' ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 216, 117, 0.3)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
            }}
            className="font-cinzel"
          >
            <Sparkles size={14} color={isLoneGuesser && mode === 'all_draw' ? 'var(--accent-cyan)' : 'var(--hogwarts-gold)'} />
            <span>
              {isLoneGuesser && mode === 'all_draw'
                ? '🔍 Thám Tử Đoán Chữ — Hãy quan sát toàn bộ nét vẽ để phá án!'
                : 'Quan Sát Bùa Vẽ'}
            </span>
          </div>
        ) : mode === 'dual_coop' ? (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(116, 0, 1, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '6px 14px',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--hogwarts-gold)',
              boxShadow: '0 0 10px rgba(255, 216, 117, 0.4)',
              pointerEvents: 'none',
            }}
            className="font-cinzel"
          >
            <span>🤝 Song Kiếm Hợp Bích {coopPartnerName ? `cùng ${coopPartnerName}` : ''}</span>
          </div>
        ) : mode === 'all_draw' ? (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(26, 71, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '6px 14px',
              borderRadius: '20px',
              color: '#d8f3dc',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--accent-cyan)',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
              pointerEvents: 'none',
            }}
            className="font-cinzel"
          >
            <span>🎭 Đại Hợp Xướng — Bạn và toàn trường cùng múa đũa!</span>
          </div>
        ) : null}

        {/* Round End Secret Word Overlay */}
        {phase === 'round_end' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(6, 4, 10, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              zIndex: 30,
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <div
              className="animate-bounce-in"
              style={{
                background: 'linear-gradient(135deg, rgba(25, 12, 42, 0.96) 0%, rgba(10, 5, 20, 0.96) 100%)',
                border: '2px solid var(--hogwarts-gold)',
                borderRadius: '20px',
                padding: '20px 32px',
                boxShadow: '0 0 40px rgba(255, 216, 117, 0.4), inset 0 0 20px rgba(255, 216, 117, 0.1)',
                maxWidth: '90%',
              }}
            >
              <span
                style={{ fontSize: '13px', color: 'var(--accent-yellow)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}
                className="font-cinzel"
              >
                KẾT THÚC LƯỢT ĐẤU
              </span>
              <h2
                style={{
                  fontSize: 'clamp(22px, 4vw, 34px)',
                  color: '#fff',
                  margin: '10px 0',
                  textShadow: '0 0 20px rgba(255, 216, 117, 0.6)',
                  fontWeight: 900,
                  letterSpacing: '1px',
                }}
                className="gold-title"
              >
                {currentWord || 'Bảo bối ma thuật'}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {roundEndMessage || 'Đang chuẩn bị lượt tiếp theo...'}
              </p>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Portaled Toolbar: mounts into right-panel-column on top of Chat on desktop */}
      {portalTarget && toolbarContent ? createPortal(toolbarContent, portalTarget) : null}

      {/* Fallback inline toolbar for mobile tab view */}
      {!portalTarget && toolbarContent}
    </div>
  );
};
