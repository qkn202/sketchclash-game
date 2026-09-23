import type { DrawStroke, DrawFill, DrawAction } from '../types';
import { floodFillCanvas } from './floodFill';

export const LOGICAL_WIDTH = 800;
export const LOGICAL_HEIGHT = 500;

export function clearCanvas(ctx: CanvasRenderingContext2D, width = LOGICAL_WIDTH, height = LOGICAL_HEIGHT): void {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
}

export function renderStroke(ctx: CanvasRenderingContext2D, stroke: DrawStroke): void {
  const { tool: sTool, color: sColor, size: sSize, points } = stroke;
  if (!points || points.length === 0) return;

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

    // Fiery floating embers
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
}

export function renderFill(ctx: CanvasRenderingContext2D, fill: DrawFill): void {
  floodFillCanvas(ctx, fill.x, fill.y, fill.color);
}

export function renderDrawAction(ctx: CanvasRenderingContext2D, action: DrawAction): void {
  if (action.type === 'clear') {
    clearCanvas(ctx);
  } else if (action.type === 'stroke' && action.stroke) {
    renderStroke(ctx, action.stroke);
  } else if (action.type === 'fill' && action.fill) {
    renderFill(ctx, action.fill);
  }
}
