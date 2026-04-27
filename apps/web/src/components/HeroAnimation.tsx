'use client';

/**
 * HeroAnimation — algorithmic background based on Brian's-Brain–style cellular
 * automaton (3 states: dead, alive, dying/firing). Renders into an HTML5 canvas
 * positioned absolutely behind hero text. Pauses when the document is hidden,
 * respects prefers-reduced-motion, and throttles to ~30fps.
 *
 * Source mockup: brain/Projects/AIAG/Wireframes/animations/hero-demo-v2.html
 */

import { useEffect, useRef } from 'react';

type Props = {
  className?: string;
  cellSize?: number;
  density?: number;
  /** ms per generation tick. 33ms ≈ 30fps. */
  tickMs?: number;
  /** Final canvas opacity (after fade-in). */
  opacity?: number;
};

export default function HeroAnimation({
  className = '',
  cellSize = 6,
  density = 0.32,
  tickMs = 140,
  opacity = 0.45,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      2
    );

    let cols = 1;
    let rows = 1;
    let cellPx = cellSize * dpr;
    let grid = new Uint8Array(1);
    let buf = new Uint8Array(1);
    let rafId = 0;
    let lastTick = 0;
    let running = true;

    const cellColor = 'rgba(161, 161, 170, 0.75)';
    const accentColor = 'rgba(245, 158, 11, 1)';

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = w;
      canvas.height = h;
      cellPx = cellSize * dpr;
      cols = Math.max(1, Math.floor(w / cellPx));
      rows = Math.max(1, Math.floor(h / cellPx));
      const len = cols * rows;
      grid = new Uint8Array(len);
      buf = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        grid[i] = Math.random() < density ? 1 : 0;
      }
      if (ctx) ctx.imageSmoothingEnabled = false;
    }

    function tick() {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const s = grid[i];
          // 1 (alive) → 2 (dying), 2/3 → 0 (dead)
          if (s === 1) {
            buf[i] = 2;
            continue;
          }
          if (s === 2 || s === 3) {
            buf[i] = 0;
            continue;
          }
          // dead: count alive neighbours (toroidal wrap)
          let c = 0;
          for (let dy = -1; dy <= 1; dy++) {
            const ny = (y + dy + rows) % rows;
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = (x + dx + cols) % cols;
              if (grid[ny * cols + nx] === 1) c++;
            }
          }
          if (c === 2) buf[i] = 1;
          else if (c >= 4)
            buf[i] = 3; // over-firing → accent flash
          else buf[i] = 0;
        }
      }
      // small chance of a random spark to keep things lively
      if (Math.random() < 0.08) {
        buf[Math.floor(Math.random() * buf.length)] = 3;
      }
      const tmp = grid;
      grid = buf;
      buf = tmp;
    }

    function render() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = cellColor;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (grid[y * cols + x] === 1) {
            ctx.fillRect(x * cellPx, y * cellPx, cellPx - 1, cellPx - 1);
          }
        }
      }
      ctx.fillStyle = accentColor;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const s = grid[y * cols + x];
          if (s === 2 || s === 3) {
            ctx.fillRect(x * cellPx, y * cellPx, cellPx - 1, cellPx - 1);
          }
        }
      }
    }

    function loop(t: number) {
      if (!running) return;
      // pause if tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        rafId = requestAnimationFrame(loop);
        return;
      }
      if (t - lastTick > tickMs) {
        tick();
        render();
        lastTick = t;
      }
      rafId = requestAnimationFrame(loop);
    }

    resize();
    if (reduceMotion) {
      // single static frame
      render();
    } else {
      rafId = requestAnimationFrame(loop);
    }

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        render();
      }, 150);
    }
    window.addEventListener('resize', onResize);

    return () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, [cellSize, density, tickMs]);

  return (
    <div
      aria-hidden
      className={className}
      style={{ opacity, mixBlendMode: 'screen' as const }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
