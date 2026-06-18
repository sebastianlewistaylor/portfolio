// Stroke geometry — turns a name string into a sequence of points that
// trace a hand-drawn-feeling baseline. Pure function: same name + seed
// + dimensions yields identical output every time.

import { mulberry32 } from './rng.js';

// Returns:
//   {
//     points:    [{x,y}, ...],   in CSS pixels
//     totalLen:  number,         arc length in CSS pixels
//     bbox:      { x0, y0, x1, y1 },
//     fontSize:  number,         resolved final font size (auto-shrunk if needed)
//   }
export function buildStrokePath(name, fontFamily, fontSize, W, H, seed){
  const rng = mulberry32(seed);
  const off = (typeof OffscreenCanvas !== 'undefined')
    ? new OffscreenCanvas(W, H)
    : Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = off.getContext('2d');

  // Auto-shrink to fit ~78% of width.
  let fs = fontSize;
  ctx.font = `${fs}px ${fontFamily}`;
  let m = ctx.measureText(name);
  const target = W * 0.78;
  if (m.width > target){
    fs = Math.max(28, Math.floor(fs * (target / m.width)));
    ctx.font = `${fs}px ${fontFamily}`;
    m = ctx.measureText(name);
  }
  const cy = H * 0.5;
  const startX = (W - m.width) / 2;

  // Walk the string and emit baseline samples per character with a
  // low-frequency sine wave + small jitter so it reads as handwriting.
  const points = [];
  let x = startX;
  for (let i = 0; i < name.length; i++){
    const ch = name[i];
    const chW = ctx.measureText(ch).width;
    if (ch === ' '){ x += chW; continue; }
    const steps = Math.max(12, Math.ceil(chW * 0.7));
    for (let s = 0; s <= steps; s++){
      const t = s / steps;
      const wave  = Math.sin(t * Math.PI * 2 + i * 0.7) * (fs * 0.10);
      const drift = (rng() - 0.5) * 4;
      points.push({ x: x + t * chW, y: cy + wave + drift });
    }
    x += chW;
  }

  // Arc length + bbox
  let totalLen = 0;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < points.length; i++){
    const p = points[i];
    if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
    if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
    if (i > 0){
      const dx = p.x - points[i-1].x, dy = p.y - points[i-1].y;
      totalLen += Math.hypot(dx, dy);
    }
  }
  return { points, totalLen, bbox: { x0, y0, x1, y1 }, fontSize: fs };
}

// Rasterize the stroke into a 4-channel canvas:
//   R = ink (visible, ~2.5px)
//   G = pathU (0..1 along path)
//   B = thickness modulation (low-freq noise)
//   A = halo (~6px alpha falloff)
//
// The result is consumed as a WebGL texture by scene.js.
export function rasterizeStroke(path, W, H, dpr, drawProgress = 1){
  const cw = Math.round(W * dpr);
  const ch = Math.round(H * dpr);
  const cvs = (typeof OffscreenCanvas !== 'undefined')
    ? new OffscreenCanvas(cw, ch)
    : Object.assign(document.createElement('canvas'), { width: cw, height: ch });
  const ctx = cvs.getContext('2d');
  ctx.scale(dpr, dpr);

  // Clear all channels to 0.
  ctx.clearRect(0, 0, W, H);

  const pts = path.points;
  if (pts.length < 2) return cvs;
  const cutIdx = Math.max(1, Math.floor(pts.length * drawProgress));

  // Halo pass — wide alpha brush, low intensity. We write into ALPHA only.
  // We then composite the ink on top, which will set RGB without touching A
  // because ink is drawn with per-channel manipulation below.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw halo (alpha) in a cheap way: stroke with rgba whose A maps to halo.
  // We use a single composite: fill RGBA channels in two passes, then encode
  // the per-pixel pathU via a final indexed pass with imageData. This keeps
  // the rasterizer 100% canvas-only — no shader prepass.
  // PASS 1 — wide soft halo into the canvas as an ink-tinted glow.
  ctx.strokeStyle = 'rgba(232, 224, 212, 0.55)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < cutIdx; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  // PASS 2 — crisp ink stroke
  ctx.strokeStyle = 'rgba(232, 224, 212, 1.0)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < cutIdx; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  // PASS 3 — encode pathU into the GREEN channel by walking samples.
  // We stamp small filled discs along the path; each disc's green value
  // increases monotonically with arc-length. Discs overlap and the
  // rasterizer just keeps the latest write per pixel — for our purposes
  // (ramping 0..1 monotonically), neighbour overlap is acceptable since
  // adjacent samples have nearly identical U.
  const id = ctx.getImageData(0, 0, cw, ch);
  const data = id.data;
  // Convert each pt to image coords (already in CSS px; data is dpr-scaled)
  // We splat a small 3px radius disc per sample and write G = floor(u * 255).
  let acc = 0;
  for (let i = 0; i < cutIdx; i++){
    if (i > 0){
      const dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
      acc += Math.hypot(dx, dy);
    }
    const u = acc / Math.max(1, path.totalLen);
    const px = Math.round(pts[i].x * dpr);
    const py = Math.round(pts[i].y * dpr);
    const g  = Math.min(255, Math.max(0, Math.round(u * 255)));
    splatGreen(data, cw, ch, px, py, 3, g);
  }
  ctx.putImageData(id, 0, 0);

  return cvs;
}

function splatGreen(data, w, h, cx, cy, r, gVal){
  const r2 = r * r;
  const x0 = Math.max(0, cx - r), x1 = Math.min(w - 1, cx + r);
  const y0 = Math.max(0, cy - r), y1 = Math.min(h - 1, cy + r);
  for (let y = y0; y <= y1; y++){
    for (let x = x0; x <= x1; x++){
      const dx = x - cx, dy = y - cy;
      if (dx*dx + dy*dy > r2) continue;
      const idx = (y * w + x) * 4;
      // Only write G where there's already alpha (i.e. inside the stroke region)
      if (data[idx + 3] === 0) continue;
      data[idx + 1] = gVal;
    }
  }
}

// Generate a tiling 256×256 noise texture once at startup. Deterministic
// (seeded), so QA replays produce the same texture.
export function buildNoiseTexture(seed){
  const N = 256;
  const rng = mulberry32(seed ^ 0x9E37);
  const buf = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++){
    buf[i*4 + 0] = (rng() * 256) | 0;
    buf[i*4 + 1] = (rng() * 256) | 0;
    buf[i*4 + 2] = (rng() * 256) | 0;
    buf[i*4 + 3] = 255;
  }
  return { width: N, height: N, data: buf };
}
