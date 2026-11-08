import { useEffect } from 'react';
import { flushSync } from 'react-dom';
import type { Point, ToolType } from '../types';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './canvasRenderer';
import { soundManager } from './audio';

/**
 * Maps a client viewport coordinate onto the logical 800x500 canvas coordinate space,
 * accounting for object-fit letterboxing if the element aspect ratio differs slightly.
 */
export function computeLogicalCanvasPoint(
  canvas: HTMLCanvasElement | null,
  clientX: number,
  clientY: number
): Point | null {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const intrinsicRatio = LOGICAL_WIDTH / LOGICAL_HEIGHT;
  const elemRatio = rect.width / rect.height;
  let contentWidth = rect.width;
  let contentHeight = rect.height;
  let offsetX = 0;
  let offsetY = 0;

  if (elemRatio > intrinsicRatio + 0.001) {
    contentHeight = rect.height;
    contentWidth = contentHeight * intrinsicRatio;
    offsetX = (rect.width - contentWidth) / 2;
  } else if (elemRatio < intrinsicRatio - 0.001) {
    contentWidth = rect.width;
    contentHeight = contentWidth / intrinsicRatio;
    offsetY = (rect.height - contentHeight) / 2;
  }

  return {
    x: Math.max(
      0,
      Math.min(LOGICAL_WIDTH, ((clientX - (rect.left + offsetX)) / contentWidth) * LOGICAL_WIDTH)
    ),
    y: Math.max(
      0,
      Math.min(LOGICAL_HEIGHT, ((clientY - (rect.top + offsetY)) / contentHeight) * LOGICAL_HEIGHT)
    ),
  };
}

interface UseCanvasHotkeysOptions {
  enabled: boolean;
  singleStrokeMode?: boolean;
  hideClear?: boolean;
  onSelectTool: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onRequestClear: () => void;
}

export function useCanvasHotkeys({
  enabled,
  singleStrokeMode = false,
  hideClear = false,
  onSelectTool,
  onUndo,
  onRedo,
  onRequestClear,
}: UseCanvasHotkeysOptions): void {
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.closest('dialog')) {
        return;
      }

      const key = e.key.toLowerCase();
      if (!singleStrokeMode && (e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
        return;
      }
      if (!singleStrokeMode && (e.ctrlKey || e.metaKey) && key === 'y') {
        e.preventDefault();
        onRedo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (key === '1' || key === 'b') {
        soundManager.playToolSelect();
        onSelectTool('brush');
      } else if (key === '2') {
        soundManager.playFlame();
        onSelectTool('fire');
      } else if (key === '3') {
        soundManager.playFrost();
        onSelectTool('ice');
      } else if (key === '4') {
        soundManager.playSparkle();
        onSelectTool('sparkle');
      } else if (!singleStrokeMode && key === 'e') {
        soundManager.playToolSelect();
        onSelectTool('eraser');
      } else if (!singleStrokeMode && key === 'f') {
        soundManager.playToolSelect();
        onSelectTool('bucket');
      } else if (!singleStrokeMode && !hideClear && key === 'c') {
        onRequestClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, singleStrokeMode, hideClear, onSelectTool, onUndo, onRedo, onRequestClear]);
}

/**
 * Progressive-enhancement directional View Transition wrapper (`forward` / `backward`)
 * for album/carousel navigation, falling back immediately when unsupported.
 */
export function runDirectionalViewTransition(
  direction: 'forward' | 'backward',
  updateDOM: () => void
): void {
  const docWithVT = typeof document !== 'undefined'
    ? (document as Document & {
        startViewTransition?: (
          arg: { update: () => void; types: string[] } | (() => void)
        ) => unknown;
      })
    : null;

  if (!docWithVT || typeof docWithVT.startViewTransition !== 'function') {
    updateDOM();
    return;
  }

  try {
    docWithVT.startViewTransition({
      update: () => {
        flushSync(updateDOM);
      },
      types: [direction],
    });
  } catch {
    updateDOM();
  }
}

