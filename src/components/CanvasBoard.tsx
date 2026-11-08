import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ToolType, DrawAction, DrawStroke, Point, GameMode, GamePhase } from '../types';
import {
  clearCanvas,
  renderStroke as drawStrokeOnCtx,
  renderFill as drawFillOnCtx,
  applyDrawActionAsync,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../utils/canvasRenderer';
import { computeLogicalCanvasPoint, useCanvasHotkeys } from '../utils/canvasHelpers';
import { soundManager } from '../utils/audio';
import { CanvasToolbar, ClearCanvasConfirmModal } from './CanvasToolbar';
import { CanvasOverlayBadges } from './CanvasOverlayBadges';

interface CanvasBoardProps {
  isDrawer: boolean;
  onBroadcastDraw: (action: DrawAction) => void;
  incomingActions: DrawAction[];
  actionResetKey: number;
  mode?: GameMode;
  coopPartnerName?: string;
  isLoneGuesser?: boolean;
  phase?: GamePhase;
  currentWord?: string;
  roundEndMessage?: string | null;
  initialActions?: DrawAction[];
  toolbarPortalTarget?: HTMLElement | null;
  singleStrokeMode?: boolean;
  singleStrokeTurnKey?: string;
  lockedColor?: string;
  hideClearButton?: boolean;
  hideOverlayBadges?: boolean;
  onSingleStrokeComplete?: () => void;
  isSelectingWord?: boolean;
  selectingDrawerName?: string;
  wordChoices?: string[];
  timeLeft?: number;
  onSelectWord?: (word: string) => void;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  isDrawer,
  onBroadcastDraw,
  incomingActions,
  actionResetKey,
  mode = 'classic',
  coopPartnerName,
  isLoneGuesser = false,
  phase = 'drawing',
  currentWord = '',
  roundEndMessage = null,
  initialActions,
  toolbarPortalTarget,
  singleStrokeMode = false,
  singleStrokeTurnKey = '',
  lockedColor,
  hideClearButton = false,
  hideOverlayBadges = false,
  onSingleStrokeComplete,
  isSelectingWord = false,
  selectingDrawerName,
  wordChoices,
  timeLeft,
  onSelectWord,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<ToolType>('brush');
  const [color, setColor] = useState<string>(lockedColor || '#000000');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [hasUsedSingleStroke, setHasUsedSingleStroke] = useState<boolean>(false);
  const strokeLockedRef = useRef<boolean>(false);

  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const isDrawing = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const currentStroke = useRef<DrawStroke | null>(null);
  const preStrokeSnapRef = useRef<ImageData | null>(null);
  const lastBroadcastIdxRef = useRef<number>(0);

  const lastSeqRef = useRef<number>(0);
  const resetGenerationRef = useRef<number>(0);
  const renderQueueRef = useRef<Promise<void>>(Promise.resolve());

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [boardDimensions, setBoardDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (lockedColor) {
      setColor(lockedColor);
    }
  }, [lockedColor]);

  useEffect(() => {
    if (singleStrokeMode && (tool === 'bucket' || tool === 'eraser')) {
      setTool('brush');
    }
  }, [singleStrokeMode, tool]);

  useEffect(() => {
    strokeLockedRef.current = false;
    setHasUsedSingleStroke(false);
    if (!isDrawer && isDrawing.current) {
      isDrawing.current = false;
      activePointerIdRef.current = null;
      currentStroke.current = null;
      preStrokeSnapRef.current = null;
      lastBroadcastIdxRef.current = 0;
    }
  }, [singleStrokeMode, singleStrokeTurnKey, actionResetKey, isDrawer]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const updateDimensions = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const availW = Math.max(100, Math.floor(rect.width));
      const availH = Math.max(100, Math.floor(rect.height));

      let w = availW;
      let h = Math.floor(w / 1.6);
      if (h > availH) {
        h = availH;
        w = Math.floor(h * 1.6);
      }
      setBoardDimensions({ width: w, height: h });
    };

    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    ro.observe(el);
    window.addEventListener('resize', updateDimensions);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    return () => {
      resetGenerationRef.current += 1;
    };
  }, []);

  const initialActionsRef = useRef(initialActions);
  initialActionsRef.current = initialActions;
  const incomingActionsRef = useRef(incomingActions);
  incomingActionsRef.current = incomingActions;

  const getCtx = useCallback((): CanvasRenderingContext2D | null => {
    return canvasRef.current ? canvasRef.current.getContext('2d', { willReadFrequently: true }) : null;
  }, []);

  const pushUndoState = useCallback((): ImageData | null => {
    const ctx = getCtx();
    if (!ctx) return null;
    const snap = ctx.getImageData(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    undoStackRef.current = [...undoStackRef.current.slice(-19), snap];
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
    return snap;
  }, [getCtx]);

  // Reset & replay initialActions on new turn or Desktop <-> Mobile remount
  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;

    resetGenerationRef.current += 1;
    const gen = resetGenerationRef.current;
    const actionsToReplay = initialActionsRef.current ? [...initialActionsRef.current] : [];
    const currentIncoming = incomingActionsRef.current || [];

    const maxInitSeq = actionsToReplay.reduce((m, a, idx) => Math.max(m, a._seq ?? idx + 1), 0);
    const maxIncSeq = currentIncoming.reduce((m, a, idx) => Math.max(m, a._seq ?? idx + 1), 0);
    lastSeqRef.current = Math.max(maxInitSeq, maxIncSeq);

    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
    setShowClearConfirm(false);

    renderQueueRef.current = renderQueueRef.current.then(async () => {
      if (resetGenerationRef.current !== gen) return;
      clearCanvas(ctx);
      for (const act of actionsToReplay) {
        if (resetGenerationRef.current !== gen) return;
        await applyDrawActionAsync(ctx, act);
      }
    });
  }, [actionResetKey, getCtx]);

  // Ordered async queue for incoming remote/bot actions — never aborts in-flight batches on append
  useEffect(() => {
    const ctx = getCtx();
    if (!ctx || incomingActions.length === 0) return;

    const pending = incomingActions.filter((a, idx) => (a._seq ?? idx + 1) > lastSeqRef.current);
    if (pending.length === 0) return;

    const highestSeq = pending.reduce((m, a, idx) => Math.max(m, a._seq ?? idx + 1), lastSeqRef.current);
    lastSeqRef.current = highestSeq;
    const gen = resetGenerationRef.current;

    renderQueueRef.current = renderQueueRef.current.then(async () => {
      for (const action of pending) {
        if (resetGenerationRef.current !== gen) return;
        if (isDrawing.current && preStrokeSnapRef.current && currentStroke.current) {
          ctx.putImageData(preStrokeSnapRef.current, 0, 0);
          await applyDrawActionAsync(ctx, action);
          if (resetGenerationRef.current !== gen) return;
          if (isDrawing.current && currentStroke.current) {
            preStrokeSnapRef.current = ctx.getImageData(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
            drawStrokeOnCtx(ctx, currentStroke.current);
          }
        } else {
          await applyDrawActionAsync(ctx, action);
        }
      }
    });
  }, [incomingActions, getCtx]);

  const getCanvasCoords = useCallback((clientX: number, clientY: number): Point | null => {
    return computeLogicalCanvasPoint(canvasRef.current, clientX, clientY);
  }, []);

  const effectiveColor = lockedColor || color;
  const canInteractWithCanvas = isDrawer && !(singleStrokeMode && strokeLockedRef.current);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canInteractWithCanvas) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const pt = getCanvasCoords(e.clientX, e.clientY);
    const ctx = getCtx();
    if (!pt || !ctx) return;

    if (!singleStrokeMode && tool === 'bucket') {
      const snapCandidate = ctx.getImageData(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      if (!drawFillOnCtx(ctx, { x: pt.x, y: pt.y, color: effectiveColor })) return;
      soundManager.playToolSelect();
      undoStackRef.current = [...undoStackRef.current.slice(-19), snapCandidate];
      redoStackRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
      onBroadcastDraw({ type: 'fill', fill: { x: pt.x, y: pt.y, color: effectiveColor } });
      return;
    }

    const preSnap = singleStrokeMode
      ? ctx.getImageData(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
      : pushUndoState();

    if (tool === 'fire') soundManager.playFlame();
    else if (tool === 'ice') soundManager.playFrost();
    else if (tool === 'sparkle') soundManager.playSparkle();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointer events in tests may not have an active pointerId
    }

    isDrawing.current = true;
    activePointerIdRef.current = e.pointerId;
    preStrokeSnapRef.current = preSnap;
    lastBroadcastIdxRef.current = 0;

    const activeTool: ToolType = singleStrokeMode && (tool === 'eraser' || tool === 'bucket') ? 'brush' : tool;
    const stroke: DrawStroke = {
      id: `s_${Date.now()}_${Math.random()}`,
      tool: activeTool,
      color: activeTool === 'eraser' ? '#FFFFFF' : effectiveColor,
      size: brushSize,
      points: [pt],
    };

    currentStroke.current = stroke;
    drawStrokeOnCtx(ctx, stroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canInteractWithCanvas || !isDrawing.current || !currentStroke.current) return;
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    const pt = getCanvasCoords(e.clientX, e.clientY);
    const ctx = getCtx();
    if (!pt || !ctx) return;

    const stroke = currentStroke.current;
    stroke.points.push(pt);
    if (preStrokeSnapRef.current) {
      ctx.putImageData(preStrokeSnapRef.current, 0, 0);
    }
    drawStrokeOnCtx(ctx, stroke);

    if (stroke.points.length - lastBroadcastIdxRef.current >= 3) {
      const startIdx = Math.max(0, lastBroadcastIdxRef.current - 1);
      onBroadcastDraw({
        type: 'stroke',
        stroke: { ...stroke, points: stroke.points.slice(startIdx) },
      });
      lastBroadcastIdxRef.current = stroke.points.length;
    }
  };

  const finishActiveStroke = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawing.current || !currentStroke.current) return;
    if (e && activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    if (e) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore capture release errors
      }
    }

    const stroke = currentStroke.current;
    const alreadySent = lastBroadcastIdxRef.current;
    isDrawing.current = false;
    activePointerIdRef.current = null;
    currentStroke.current = null;
    preStrokeSnapRef.current = null;
    lastBroadcastIdxRef.current = 0;

    if (stroke.points.length === 1 && alreadySent === 0) {
      onBroadcastDraw({ type: 'stroke', stroke: { ...stroke, points: [stroke.points[0]] } });
    } else if (alreadySent < stroke.points.length) {
      const startIdx = Math.max(0, alreadySent - 1);
      onBroadcastDraw({
        type: 'stroke',
        stroke: { ...stroke, points: stroke.points.slice(startIdx) },
      });
    }

    if (singleStrokeMode && !strokeLockedRef.current && stroke.points.length > 0) {
      strokeLockedRef.current = true;
      setHasUsedSingleStroke(true);
      onSingleStrokeComplete?.();
    }
  };

  const handleUndo = useCallback(() => {
    if (!isDrawer || singleStrokeMode || undoStackRef.current.length === 0) return;
    soundManager.playClick();
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const currentSnap = ctx.getImageData(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    redoStackRef.current = [...redoStackRef.current, currentSnap];

    const restoreSnap = undoStackRef.current.pop()!;
    ctx.putImageData(restoreSnap, 0, 0);
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
    onBroadcastDraw({ type: 'restore', snapshot: canvas.toDataURL('image/png') });
  }, [isDrawer, singleStrokeMode, getCtx, onBroadcastDraw]);

  const handleRedo = useCallback(() => {
    if (!isDrawer || singleStrokeMode || redoStackRef.current.length === 0) return;
    soundManager.playClick();
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const currentSnap = ctx.getImageData(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    undoStackRef.current = [...undoStackRef.current, currentSnap];

    const nextSnap = redoStackRef.current.pop()!;
    ctx.putImageData(nextSnap, 0, 0);
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
    onBroadcastDraw({ type: 'restore', snapshot: canvas.toDataURL('image/png') });
  }, [isDrawer, singleStrokeMode, getCtx, onBroadcastDraw]);

  const requestClear = useCallback(() => {
    if (!isDrawer || singleStrokeMode || hideClearButton) return;
    soundManager.playClick();
    setShowClearConfirm(true);
  }, [isDrawer, singleStrokeMode, hideClearButton]);

  const confirmClear = useCallback(() => {
    setShowClearConfirm(false);
    if (!isDrawer || singleStrokeMode) return;
    const ctx = getCtx();
    if (!ctx) return;
    soundManager.playClear();
    pushUndoState();
    clearCanvas(ctx);
    onBroadcastDraw({ type: 'clear' });
  }, [isDrawer, singleStrokeMode, getCtx, pushUndoState, onBroadcastDraw]);

  useCanvasHotkeys({
    enabled: canInteractWithCanvas,
    singleStrokeMode,
    hideClear: hideClearButton,
    onSelectTool: setTool,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onRequestClear: requestClear,
  });

  const toolbarContent = isDrawer && !hasUsedSingleStroke ? (
    <CanvasToolbar
      tool={tool}
      color={effectiveColor}
      brushSize={brushSize}
      canUndo={canUndo}
      canRedo={canRedo}
      singleStrokeMode={singleStrokeMode}
      lockedColor={lockedColor}
      hideClearButton={hideClearButton}
      onSelectTool={setTool}
      onSelectColor={(nextColor) => {
        if (lockedColor) return;
        setColor(nextColor);
        if (tool === 'eraser') setTool('brush');
      }}
      onSelectBrushSize={setBrushSize}
      onUndo={handleUndo}
      onRedo={handleRedo}
      onClear={requestClear}
    />
  ) : null;

  const usesExternalPortal = toolbarPortalTarget !== undefined;

  return (
    <div className="canvas-board-outer-container">
      <div ref={wrapperRef} className="canvas-board-wrapper">
        <div
          className="canvas-parchment-container"
          style={boardDimensions ? { width: `${boardDimensions.width}px`, height: `${boardDimensions.height}px` } : undefined}
        >
          <canvas
            ref={canvasRef}
            width={LOGICAL_WIDTH}
            height={LOGICAL_HEIGHT}
            aria-label="Bảng vẽ giấy da phép thuật Hogwarts"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishActiveStroke}
            onPointerCancel={finishActiveStroke}
            onLostPointerCapture={finishActiveStroke}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              cursor: !canInteractWithCanvas ? 'default' : tool === 'bucket' ? 'cell' : 'crosshair',
              touchAction: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
            }}
          />

          {!hideOverlayBadges && (
            <CanvasOverlayBadges
              isDrawer={isDrawer}
              mode={mode}
              coopPartnerName={coopPartnerName}
              isLoneGuesser={isLoneGuesser}
              phase={phase}
              currentWord={currentWord}
              roundEndMessage={roundEndMessage}
              isSelectingWord={isSelectingWord}
              selectingDrawerName={selectingDrawerName}
              wordChoices={wordChoices}
              timeLeft={timeLeft}
              onSelectWord={onSelectWord}
            />
          )}
        </div>
      </div>

      {usesExternalPortal
        ? toolbarPortalTarget && toolbarContent
          ? createPortal(toolbarContent, toolbarPortalTarget)
          : null
        : toolbarContent}

      {showClearConfirm && (
        <ClearCanvasConfirmModal
          onCancel={() => setShowClearConfirm(false)}
          onConfirm={confirmClear}
        />
      )}
    </div>
  );
};
