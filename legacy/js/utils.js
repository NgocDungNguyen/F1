// ─────────────────────────────────────────────
//  UTILITY HELPERS
// ─────────────────────────────────────────────

function formatTime(t) {
  const m   = Math.floor(t / 60);
  const s   = Math.floor(t % 60);
  const ms  = Math.floor((t % 1) * 1000);
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function ordinal(n) {
  return ['1st', '2nd', '3rd', '4th', '5th'][n - 1] || n + 'th';
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
  ctx.lineTo(x,     y + r);
  ctx.quadraticCurveTo(x,     y,     x + r, y);
  ctx.closePath();
  if (fill)   ctx.fill();
  if (stroke) ctx.stroke();
}

function hitTest(mx, my, x, y, w, h) {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Ease-in-out quad for menu animations
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Draw glowing text (used in menus)
function glowText(ctx, text, x, y, color, glowColor, glowBlur, font) {
  ctx.save();
  ctx.font = font || '48px monospace';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = glowColor || color;
  ctx.shadowBlur  = glowBlur || 20;
  ctx.fillStyle   = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur  = 0;
  ctx.restore();
}

// Interpolate between two hex colours for track select previews
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}
