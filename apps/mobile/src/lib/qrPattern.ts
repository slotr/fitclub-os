/**
 * Deterministic 21x21 QR-like pattern generator.
 * Direct port of the procedural pattern in `B1-home.html` / `A8-fullscreen-qr.html`.
 *
 * Returns a 21x21 grid of 0/1. This is *not* a real QR code — it's a visual
 * stand-in with finder squares, alignment block, timing patterns and a
 * pseudo-random data fill so it reads as "a QR" at a glance.
 */

export const QR_SIZE = 21;

export function generateQrGrid(seed = 0xcafe): number[][] {
  const N = QR_SIZE;
  const grid: number[][] = Array.from({ length: N }, () => Array<number>(N).fill(0));

  // 3 finder patterns (top-left, top-right, bottom-left)
  const placeFinder = (r: number, c: number) => {
    for (let dr = 0; dr < 7; dr++) {
      for (let dc = 0; dc < 7; dc++) {
        const onRing = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const onInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        const row = grid[r + dr]!;
        row[c + dc] = onRing || onInner ? 1 : 0;
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, N - 7);
  placeFinder(N - 7, 0);

  // small alignment block bottom-right
  for (let dr = 0; dr < 5; dr++) {
    for (let dc = 0; dc < 5; dc++) {
      const onRing = dr === 0 || dr === 4 || dc === 0 || dc === 4;
      const center = dr === 2 && dc === 2;
      const row = grid[N - 9 + dr]!;
      row[N - 9 + dc] = onRing || center ? 1 : 0;
    }
  }

  // timing patterns
  for (let i = 8; i < N - 8; i++) {
    grid[6]![i] = i % 2 === 0 ? 1 : 0;
    grid[i]![6] = i % 2 === 0 ? 1 : 0;
  }

  // pseudo-random data fill, avoiding finder/timing reserved zones
  const reserved = (r: number, c: number) => {
    if (r < 8 && c < 8) return true; // top-left finder + sep
    if (r < 8 && c >= N - 8) return true; // top-right
    if (r >= N - 8 && c < 8) return true; // bottom-left
    if (r >= N - 9 && c >= N - 9 && r < N - 4 && c < N - 4) return true;
    if (r === 6 || c === 6) return true; // timing
    return false;
  };

  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!reserved(r, c)) grid[r]![c] = rand() > 0.5 ? 1 : 0;
    }
  }

  return grid;
}
