/**
 * High-performance 4-way queue flood-fill for HTML5 Canvas
 */

function hexToRgba(hex: string): [number, number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
}

function colorsMatch(
  data: Uint8ClampedArray,
  pos: number,
  targetR: number,
  targetG: number,
  targetB: number,
  targetA: number,
  tolerance: number = 32
): boolean {
  return (
    Math.abs(data[pos] - targetR) <= tolerance &&
    Math.abs(data[pos + 1] - targetG) <= tolerance &&
    Math.abs(data[pos + 2] - targetB) <= tolerance &&
    Math.abs(data[pos + 3] - targetA) <= tolerance
  );
}

export function floodFillCanvas(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string
): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const x = Math.floor(startX);
  const y = Math.floor(startY);

  if (x < 0 || x >= width || y < 0 || y >= height) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const [fillR, fillG, fillB, fillA] = hexToRgba(fillColorHex);

  const startPos = (y * width + x) * 4;
  const targetR = data[startPos];
  const targetG = data[startPos + 1];
  const targetB = data[startPos + 2];
  const targetA = data[startPos + 3];

  // If already the same color, no-op
  if (
    Math.abs(targetR - fillR) < 5 &&
    Math.abs(targetG - fillG) < 5 &&
    Math.abs(targetB - fillB) < 5 &&
    Math.abs(targetA - fillA) < 5
  ) {
    return;
  }

  // Linear queue
  const queue: number[] = [x, y];
  const visited = new Uint8Array(width * height);
  visited[y * width + x] = 1;

  while (queue.length > 0) {
    const cy = queue.pop()!;
    const cx = queue.pop()!;

    const pos = (cy * width + cx) * 4;
    data[pos] = fillR;
    data[pos + 1] = fillG;
    data[pos + 2] = fillB;
    data[pos + 3] = fillA;

    // Check 4 neighbors
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIndex = ny * width + nx;
        if (!visited[nIndex]) {
          const nPos = nIndex * 4;
          if (colorsMatch(data, nPos, targetR, targetG, targetB, targetA)) {
            visited[nIndex] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
