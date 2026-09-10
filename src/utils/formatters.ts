import { CurrencyConfig } from '../types/pos';

export function formatCurrency(amount: number, currency: CurrencyConfig): string {
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  });

  return currency.position === 'before'
    ? `${currency.symbol}${formatted}`
    : `${formatted} ${currency.symbol}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

// Generate realistic SVG Barcode (Code 128 style visual pattern)
export function renderBarcodeSvg(code: string, width = 200, height = 48): string {
  // Generate deterministic bar widths based on char codes
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i);
    hash |= 0;
  }

  const bars: { x: number; w: number }[] = [];
  let currentX = 10;
  const barPattern = [1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2];

  // Lead guard bars
  bars.push({ x: currentX, w: 2 });
  currentX += 4;
  bars.push({ x: currentX, w: 2 });
  currentX += 4;

  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const patternIdx = (charCode + i) % barPattern.length;
    const w = barPattern[patternIdx];
    bars.push({ x: currentX, w });
    currentX += w + 2 + ((charCode % 3) === 0 ? 1 : 0);
  }

  // End guard bars
  bars.push({ x: currentX, w: 2 });
  currentX += 4;
  bars.push({ x: currentX, w: 2 });
  currentX += 10;

  const totalWidth = Math.max(width, currentX);

  const rects = bars
    .map(
      (b) =>
        `<rect x="${b.x}" y="4" width="${b.w}" height="${height - 18}" fill="currentColor"/>`
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" class="w-full h-auto text-slate-900 dark:text-slate-100">
    ${rects}
    <text x="${totalWidth / 2}" y="${height - 2}" text-anchor="middle" font-family="monospace" font-size="10" fill="currentColor">${code}</text>
  </svg>`;
}

// Procedural SVG QR Code matrix for receipts and fiscal verification
export function renderQrCodeSvg(data: string, size = 120): string {
  // 21x21 QR Version 1 simulation with real finder patterns
  const matrixSize = 21;
  const grid: boolean[][] = Array(matrixSize)
    .fill(false)
    .map(() => Array(matrixSize).fill(false));

  // Helper for finder patterns (7x7)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0); // Top-left
  drawFinder(14, 0); // Top-right
  drawFinder(0, 14); // Bottom-left

  // Timing patterns
  for (let i = 8; i < 13; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Generate pseudo-data modules based on payload hash
  let seed = 0;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 31 + data.charCodeAt(i)) & 0xffffffff;
  }

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Don't overwrite finders or timing
      const inFinderTL = r < 8 && c < 8;
      const inFinderTR = r < 8 && c >= 13;
      const inFinderBL = r >= 13 && c < 8;
      const inTiming = (r === 6 && c >= 8 && c <= 13) || (c === 6 && r >= 8 && r <= 13);

      if (!inFinderTL && !inFinderTR && !inFinderBL && !inTiming) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        grid[r][c] = (seed % 100) > 46;
      }
    }
  }

  const cellSize = size / matrixSize;
  let paths = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (grid[r][c]) {
        paths += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize + 0.5}" height="${cellSize + 0.5}" fill="currentColor" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" class="w-full h-auto text-slate-900 dark:text-slate-100">
    ${paths}
  </svg>`;
}
