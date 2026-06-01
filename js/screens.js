// ─────────────────────────────────────────────
//  ALL NON-GAMEPLAY SCREENS
//  Mobile-first, overlap-free layout.
//  All positions derived from W / H each frame.
//  Buttons are anchored from the BOTTOM so they
//  are always visible and never covered.
// ─────────────────────────────────────────────

// ── Shared layout helpers ────────────────────────────────────────────────

// True when the shortest screen edge is phone-sized
function _mob() { return Math.min(W, H) < 480; }

// Scale factor: 1.0 at H=420, scales linearly with H but caps at 1.5
function _s()   { return Math.min(H / 420, 1.5); }

// Scaled pixel value
function _p(v)  { return Math.round(v * _s()); }

// Responsive font setter
function _font(sz, bold) {
  ctx.font = `${bold ? 'bold ' : ''}${_p(sz)}px monospace`;
}

// ── Standard dark background ─────────────────────────────────────────────
function _bg() {
  ctx.fillStyle = '#06080e';
  ctx.fillRect(0, 0, W, H);
  // Subtle horizontal scan-lines
  ctx.fillStyle = 'rgba(255,255,255,0.016)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
}

// ── Pill button ──────────────────────────────────────────────────────────
// Returns true while hovered (triggers on clicked flag outside)
function _btn(label, x, y, w, h, mx, my, accent, fs) {
  accent = accent || '#cc2200';
  const hov  = hitTest(mx, my, x, y, w, h);
  const fill = hov ? accent : 'rgba(18,20,30,0.92)';
  const glow = hov ? 0.9 : 0.55;

  ctx.shadowColor = accent;
  ctx.shadowBlur  = hov ? _p(12) : 0;
  ctx.fillStyle   = fill;
  roundRect(ctx, x, y, w, h, _p(8), true, false);
  ctx.shadowBlur  = 0;

  ctx.strokeStyle = accent;
  ctx.lineWidth   = hov ? 2 : 1;
  ctx.globalAlpha = glow;
  roundRect(ctx, x, y, w, h, _p(8), false, true);
  ctx.globalAlpha = 1;

  ctx.fillStyle    = hov ? '#fff' : '#ddd';
  ctx.font         = `bold ${fs || _p(17)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  return hov;
}

// Section title bar at top
function _title(text, y) {
  ctx.fillStyle    = '#ff4400';
  ctx.font         = `bold ${_p(24)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, y);
}

// ── Wrap text helper ─────────────────────────────────────────────────────
function _wrap(text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', cy = y;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(line, x, cy); line = w; cy += lh;
    } else line = t;
  }
  if (line) ctx.fillText(line, x, cy);
}

// ─────────────────────────────────────────────
//  MAIN MENU
// ─────────────────────────────────────────────
let _menuT = 0;

function renderMenu(W, H, _t, mx, my, clicked) {
  _menuT += 0.018;
  _bg();

  // ── F1 logo glow circle ───────────────────────────────────────────────
  const cx = W / 2, logoY = H * 0.24;
  const pulse = 0.7 + 0.3 * Math.sin(_menuT * 1.8);
  ctx.fillStyle = `rgba(204,34,0,${0.06 * pulse})`;
  ctx.beginPath();
  ctx.arc(cx, logoY, _p(72) * pulse, 0, Math.PI * 2);
  ctx.fill();

  // ── "F1" main title ───────────────────────────────────────────────────
  const f1Sz = Math.min(_p(68), W * 0.15);
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold ${f1Sz}px monospace`;
  ctx.shadowColor  = '#ff4400';
  ctx.shadowBlur   = _p(22) + Math.sin(_menuT * 2) * _p(6);
  ctx.fillStyle    = '#ff4400';
  ctx.fillText('F1', cx, logoY);
  ctx.shadowBlur   = 0;

  // ── "RACER" subtitle ──────────────────────────────────────────────────
  const racerSz = Math.min(_p(32), W * 0.08);
  ctx.font      = `bold ${racerSz}px monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('RACER', cx, logoY + f1Sz * 0.62);

  // ── Tagline ───────────────────────────────────────────────────────────
  ctx.font      = `${_p(11)}px monospace`;
  ctx.fillStyle = '#556';
  ctx.fillText('PSEUDO-3D ARCADE RACING', cx, logoY + f1Sz * 0.62 + racerSz + _p(8));
  ctx.restore();

  // ── Buttons (anchored from bottom, never overlapped) ──────────────────
  // Primary button height: 13% of H, min 44px
  const bH  = Math.max(Math.round(H * 0.13), 44);
  const bH2 = Math.max(Math.round(H * 0.11), 40);
  const bW  = Math.min(Math.round(W * 0.55), _p(280));
  const bX  = cx - bW / 2;
  const gap = _p(10);

  // PLAY button: second-from-last slot
  const playY = H - bH - bH2 - gap * 3;
  // HOW TO PLAY: last slot (pinned to bottom with margin)
  const howY  = H - bH2 - _p(18);

  let action = null;
  if (_btn('▶  PLAY', bX, playY, bW, bH, mx, my, '#cc2200', _p(20)) && clicked) action = 'PLAY';
  if (_btn('?  HOW TO PLAY', bX, howY, bW, bH2, mx, my, '#334466', _p(14)) && clicked) action = 'HOW';

  // ── Decorative car (desktop only – never near buttons) ────────────────
  if (!_mob()) {
    ctx.save();
    const carSz = _p(70);
    const carX  = cx + Math.sin(_menuT * 0.5) * W * 0.20;
    const carY  = playY - carSz * 0.6;     // always ABOVE the PLAY button
    drawF1Sprite(carX, carY, carSz, carConfig.color, carConfig.decal);
    ctx.restore();
  }

  // ── Version ───────────────────────────────────────────────────────────
  ctx.fillStyle    = '#2a2a3a';
  ctx.font         = `${_p(9)}px monospace`;
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('v1.0 · 3 LAPS · 2 TRACKS', W - _p(10), H - _p(4));

  return action;
}

// ─────────────────────────────────────────────
//  HOW TO PLAY
// ─────────────────────────────────────────────
function renderHowToPlay(W, H, mx, my, clicked) {
  _bg();
  _title('HOW TO PLAY', H * 0.08);

  const fs   = _p(_mob() ? 13 : 15);
  const lh   = Math.round(fs * 1.9);
  const lx   = W * (_mob() ? 0.07 : 0.12);
  const rx   = W * (_mob() ? 0.93 : 0.88);
  let   y    = H * 0.17;

  const rows = [
    ['CONTROLS', null],
    ['Accelerate',            '↑ / W'],
    ['Brake',                 '↓ / S'],
    ['Steer',                 '← → / A D'],
    ['Boost',                 'SPACE'],
    ['Toggle Camera',         'V  /  🎥 button'],
    ['Pause',                 'ESC  /  ⏸ button'],
    [null, null],
    ['RULES', null],
    ['3 laps – fastest time wins.', ''],
    ['Collisions cut your speed.', ''],
    ['Boost has a 28s cooldown.', ''],
    ['Grass heavily slows you down.', ''],
  ];

  rows.forEach(([left, right]) => {
    if (!left) { y += lh * 0.5; return; }
    if (right === null) {
      ctx.fillStyle = '#ff8844';
      ctx.font      = `bold ${fs}px monospace`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(left, lx, y);
    } else if (right === '') {
      ctx.fillStyle = '#aaa'; ctx.font = `${fs}px monospace`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      _wrap(left, lx, y, rx - lx, lh);
    } else {
      ctx.fillStyle = '#ccc'; ctx.font = `${fs}px monospace`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(left, lx, y);
      ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'right';
      ctx.fillText(right, rx, y);
    }
    y += lh;
  });

  const bH = Math.max(Math.round(H * 0.11), 40);
  const bW = Math.min(_p(180), W * 0.42);
  if (_btn('◀  BACK', W / 2 - bW / 2, H - bH - _p(16), bW, bH, mx, my, '#445566', _p(15)) && clicked) return 'BACK';
  return null;
}

// ─────────────────────────────────────────────
//  TRACK SELECT
// ─────────────────────────────────────────────
function renderTrackSelect(W, H, mx, my, clicked, selectedIdx) {
  _bg();
  _title('SELECT TRACK', H * 0.08);

  // Button row pinned to bottom
  const bH  = Math.max(Math.round(H * 0.12), 42);
  const bW  = Math.min(_p(170), W * 0.32);
  const bY  = H - bH - _p(14);
  const bGap = _p(12);

  // Card area: between title bottom and button row top
  const titleBottom = H * 0.08 + _p(24) / 2 + _p(12);
  const cardAreaBottom = bY - _p(10);
  const cardAreaH = cardAreaBottom - titleBottom;

  const gap = _p(10);
  const cW  = (W - gap * 3) / 2;
  const cH  = Math.max(cardAreaH, _p(200));
  const cY  = titleBottom + _p(4);

  let action = null;

  TRACK_DEFS.forEach((def, i) => {
    const cx  = gap + i * (cW + gap);
    const sel = i === selectedIdx;
    const hov = hitTest(mx, my, cx, cY, cW, cH);

    // Card
    ctx.fillStyle = sel ? 'rgba(160,22,0,0.22)' : 'rgba(12,14,22,0.90)';
    roundRect(ctx, cx, cY, cW, cH, _p(8), true, false);
    ctx.strokeStyle = sel ? '#ff4400' : (hov ? '#662200' : '#1e2030');
    ctx.lineWidth   = sel ? 2.5 : 1;
    roundRect(ctx, cx, cY, cW, cH, _p(8), false, true);

    // Mini-map (top 46% of card)
    const mmH = Math.round(cH * 0.46);
    _drawTrackMinimap(def, cx + _p(8), cY + _p(8), cW - _p(16), mmH - _p(8));

    // Text area below map
    const txtY = cY + mmH + _p(8);
    const nameSz = Math.min(_p(_mob() ? 14 : 17), cW * 0.11);
    ctx.fillStyle    = sel ? '#ff6600' : '#fff';
    ctx.font         = `bold ${nameSz}px monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(def.name, cx + cW / 2, txtY);

    const subSz = Math.min(_p(_mob() ? 10 : 12), cW * 0.08);
    ctx.fillStyle = '#778'; ctx.font = `${subSz}px monospace`;
    ctx.fillText(def.subtitle, cx + cW / 2, txtY + nameSz + _p(4));

    const descSz = Math.min(_p(_mob() ? 9 : 10), cW * 0.07);
    ctx.font      = `${descSz}px monospace`;
    def.desc.split(' • ').forEach((bit, bi) => {
      ctx.fillStyle = '#445';
      ctx.fillText(bit, cx + cW / 2, txtY + nameSz + _p(4) + subSz + _p(4) + bi * (descSz + _p(3)));
    });

    // Selected tick
    if (sel) {
      ctx.fillStyle = '#ff4400'; ctx.font = `bold ${_p(11)}px monospace`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('✓ SELECTED', cx + cW - _p(8), cY + _p(6));
    }

    if (hov && clicked) action = { type: 'SELECT', idx: i };
  });

  // Buttons
  if (_btn('◀  BACK', bGap, bY, bW, bH, mx, my, '#445566', _p(14)) && clicked) action = { type: 'BACK' };
  if (_btn('NEXT  ▶', W - bW - bGap, bY, bW, bH, mx, my, '#cc2200', _p(15)) && clicked && !action) action = { type: 'NEXT' };

  return action;
}

function _drawTrackMinimap(def, x, y, w, h) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#0a0d14'; ctx.fillRect(x, y, w, h);

  const pts = []; let px = 0, py = 0, angle = -Math.PI / 2;
  const sc  = Math.min(w, h) / 280;
  pts.push([px, py]);
  for (const sec of def.sections) {
    const cr = sec.curve * 0.045;
    for (let s = 0; s < sec.len; s += 3) {
      angle += cr * 3; px += Math.cos(angle) * 3 * sc; py += Math.sin(angle) * 3 * sc;
      pts.push([px, py]);
    }
  }
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const mnX = Math.min(...xs), mxX = Math.max(...xs);
  const mnY = Math.min(...ys), mxY = Math.max(...ys);
  const ox = x + w / 2 - (mnX + mxX) / 2, oy = y + h / 2 - (mnY + mxY) / 2;

  ctx.strokeStyle = '#b84400'; ctx.lineWidth = _p(3);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach(([px2, py2], i) => i === 0 ? ctx.moveTo(px2+ox, py2+oy) : ctx.lineTo(px2+ox, py2+oy));
  ctx.stroke();

  ctx.fillStyle = '#ffcc00';
  ctx.beginPath(); ctx.arc(pts[0][0]+ox, pts[0][1]+oy, _p(4), 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ─────────────────────────────────────────────
//  CAR CUSTOMISE
// ─────────────────────────────────────────────
const CAR_COLORS = [
  { name: 'Ferrari Red',    hex: '#e8001c' },
  { name: 'McLaren Orange', hex: '#ff6600' },
  { name: 'Sauber Blue',    hex: '#0033cc' },
  { name: 'Jordan Yellow',  hex: '#ffcc00' },
  { name: 'Force Pink',     hex: '#ff44aa' },
  { name: 'Williams White', hex: '#dddddd' },
];

function renderCarCustomize(W, H, mx, my, clicked) {
  _bg();
  _title('CUSTOMISE CAR', H * 0.08);

  // ── Action buttons pinned to bottom ───────────────────────────────────
  const bH = Math.max(Math.round(H * 0.12), 42);
  const bW = Math.min(_p(160), W * 0.30);
  const bY = H - bH - _p(14);

  // ── Content area ──────────────────────────────────────────────────────
  const titleBottom = H * 0.08 + _p(24) / 2 + _p(14);
  const contentH    = bY - titleBottom - _p(8);
  const mob         = _mob();

  let colAction = null;

  if (mob) {
    // ── MOBILE: left = car, right = controls ─────────────────────────
    const leftW = W * 0.38;
    const rightX = leftW + _p(10);
    const rightW = W - leftW - _p(16);

    // Car preview centred in left column
    const carSz = Math.min(leftW * 0.55, contentH * 0.40, _p(80));
    const carX  = leftW / 2;
    const carY  = titleBottom + contentH * 0.32;
    drawF1Sprite(carX, carY, carSz, carConfig.color, carConfig.decal);

    // Tiny cockpit nose preview below car
    const npW = leftW * 0.75, npH = npW * 0.45;
    const npX = leftW / 2 - npW / 2;
    const npY = carY + carSz * 0.35 + _p(6);
    _miniCockpit(npX, npY, npW, npH);

    // Colour swatches in right column
    const swCols = 3, swGap = _p(6);
    const swSz   = Math.min((rightW - swGap * (swCols-1)) / swCols, _p(40), contentH * 0.14);
    const swY0   = titleBottom;

    ctx.fillStyle = '#888'; ctx.font = `${_p(11)}px monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('COLOUR', rightX, swY0);

    CAR_COLORS.forEach((c, i) => {
      const col = i % swCols, row = Math.floor(i / swCols);
      const sx  = rightX + col * (swSz + swGap);
      const sy  = swY0 + _p(14) + row * (swSz + swGap);
      const sel = carConfig.color === c.hex;
      const hov = hitTest(mx, my, sx-2, sy-2, swSz+4, swSz+4);
      ctx.fillStyle = c.hex;
      roundRect(ctx, sx, sy, swSz, swSz, _p(4), true, false);
      if (sel) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
        roundRect(ctx, sx-3, sy-3, swSz+6, swSz+6, _p(6), false, true);
      } else if (hov) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
        roundRect(ctx, sx, sy, swSz, swSz, _p(4), false, true);
      }
      if (hov && clicked) colAction = c.hex;
    });

    // Decal toggles
    const swRows   = Math.ceil(CAR_COLORS.length / swCols);
    const decalY   = swY0 + _p(14) + swRows * (swSz + swGap) + _p(12);
    ctx.fillStyle  = '#888'; ctx.font = `${_p(11)}px monospace`;
    ctx.textAlign  = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('DECAL', rightX, decalY);

    const dBW = (rightW - swGap) / 2;
    const dBH = Math.max(_p(32), H * 0.08);
    ['solid', 'stripes'].forEach((d, i) => {
      const dx = rightX + i * (dBW + swGap), dy = decalY + _p(14);
      const sel = carConfig.decal === d, hov = hitTest(mx, my, dx, dy, dBW, dBH);
      ctx.fillStyle = sel ? 'rgba(180,28,0,0.38)' : 'rgba(14,14,22,0.85)';
      roundRect(ctx, dx, dy, dBW, dBH, _p(6), true, false);
      ctx.strokeStyle = sel ? '#ff4400' : '#333'; ctx.lineWidth = sel ? 2 : 1;
      roundRect(ctx, dx, dy, dBW, dBH, _p(6), false, true);
      ctx.fillStyle    = sel ? '#fff' : '#888';
      ctx.font         = `bold ${_p(11)}px monospace`;
      ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(d.toUpperCase(), dx + dBW / 2, dy + dBH / 2);
      if (hov && clicked) colAction = { decal: d };
    });

  } else {
    // ── DESKTOP: left preview, right controls ─────────────────────────
    const leftW = W * 0.40;
    const carSz = Math.min(leftW * 0.38, contentH * 0.40, _p(120));
    const carX  = leftW / 2;
    const carY  = titleBottom + contentH * 0.35;
    drawF1Sprite(carX, carY, carSz, carConfig.color, carConfig.decal);
    const npW = leftW * 0.60, npH = npW * 0.40;
    _miniCockpit(leftW/2 - npW/2, carY + carSz*0.32 + _p(8), npW, npH);

    const rightX = leftW + _p(20), rightW = W - leftW - _p(30);
    const swCols = 6, swGap = _p(7);
    const swSz   = Math.min((rightW - swGap*(swCols-1)) / swCols, _p(46), contentH * 0.14);
    const swY0   = titleBottom;

    ctx.fillStyle = '#888'; ctx.font = `${_p(13)}px monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('COLOUR', rightX, swY0);

    CAR_COLORS.forEach((c, i) => {
      const col = i % swCols, row = Math.floor(i / swCols);
      const sx  = rightX + col * (swSz + swGap);
      const sy  = swY0 + _p(16) + row * (swSz + swGap);
      const sel = carConfig.color === c.hex, hov = hitTest(mx, my, sx-2, sy-2, swSz+4, swSz+4);
      ctx.fillStyle = c.hex;
      roundRect(ctx, sx, sy, swSz, swSz, _p(5), true, false);
      if (sel) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        roundRect(ctx, sx-3, sy-3, swSz+6, swSz+6, _p(7), false, true);
      } else if (hov) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
        roundRect(ctx, sx, sy, swSz, swSz, _p(5), false, true);
      }
      if (hov && clicked) colAction = c.hex;
    });

    const decalY  = swY0 + _p(16) + swSz + _p(20);
    ctx.fillStyle = '#888'; ctx.font = `${_p(13)}px monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('DECAL', rightX, decalY);

    const dBW = Math.min((rightW - swGap) / 2, _p(110)), dBH = Math.max(_p(36), H * 0.09);
    ['solid', 'stripes'].forEach((d, i) => {
      const dx = rightX + i*(dBW+swGap), dy = decalY + _p(16);
      const sel = carConfig.decal === d, hov = hitTest(mx, my, dx, dy, dBW, dBH);
      ctx.fillStyle = sel ? 'rgba(180,28,0,0.38)' : 'rgba(14,14,22,0.85)';
      roundRect(ctx, dx, dy, dBW, dBH, _p(6), true, false);
      ctx.strokeStyle = sel ? '#ff4400' : '#333'; ctx.lineWidth = sel ? 2 : 1;
      roundRect(ctx, dx, dy, dBW, dBH, _p(6), false, true);
      ctx.fillStyle = sel ? '#fff' : '#888';
      ctx.font = `bold ${_p(13)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(d.toUpperCase(), dx+dBW/2, dy+dBH/2);
      if (hov && clicked) colAction = { decal: d };
    });
  }

  // ── Bottom buttons ─────────────────────────────────────────────────────
  let action = colAction;
  if (_btn('◀  BACK',  _p(14), bY, bW, bH, mx, my, '#445566', _p(14)) && clicked) action = action || 'BACK';
  if (_btn('RACE!  ▶', W-bW-_p(14), bY, bW, bH, mx, my, '#cc2200', _p(16)) && clicked) action = 'START';

  return action;
}

// Mini cockpit-nose preview box
function _miniCockpit(x, y, w, h) {
  ctx.fillStyle = '#0e0e0e';
  ctx.beginPath();
  ctx.moveTo(x, y+h); ctx.lineTo(x+w, y+h);
  ctx.lineTo(x+w*0.84, y+h*0.48); ctx.lineTo(x+w*0.16, y+h*0.48);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = carConfig.color; ctx.lineWidth = _p(2);
  ctx.beginPath(); ctx.moveTo(x+w*0.16, y+h*0.48); ctx.lineTo(x+w*0.84, y+h*0.48); ctx.stroke();
  ctx.fillStyle = carConfig.color;
  ctx.beginPath();
  ctx.moveTo(x+w*0.30,y+h); ctx.lineTo(x+w*0.70,y+h);
  ctx.lineTo(x+w*0.58,y+h*0.58); ctx.lineTo(x+w*0.42,y+h*0.58);
  ctx.closePath(); ctx.fill();
}

// ─────────────────────────────────────────────
//  COUNTDOWN
// ─────────────────────────────────────────────
function renderCountdown(W, H, countdownT) {
  const phase = Math.floor(countdownT);
  if (phase <= 0) return;
  const frac  = countdownT - phase;
  const zoom  = 1 + (1 - frac) * 0.55;

  const text  = phase === 1 ? '3' : phase === 2 ? '2' : phase === 3 ? '1' : 'GO!';
  const color = phase === 1 ? '#ffcc00' : phase === 2 ? '#ff8800' : phase === 3 ? '#ff2200' : '#00ff88';
  const alpha = phase >= 4 ? Math.max(0, 1 - (countdownT - 4) * 3.5) : Math.min(1, frac * 5);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W / 2, H * 0.44);
  ctx.scale(zoom, zoom);

  const r = Math.min(H * 0.13, W * 0.09);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  ctx.shadowColor = color; ctx.shadowBlur = _p(24);
  ctx.fillStyle   = color;
  ctx.font        = `bold ${Math.min(H * 0.20, W * 0.14)}px monospace`;
  ctx.textAlign   = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// ─────────────────────────────────────────────
//  PAUSE MENU
// ─────────────────────────────────────────────
function renderPause(W, H, mx, my, clicked) {
  ctx.fillStyle = 'rgba(0,0,10,0.75)';
  ctx.fillRect(0, 0, W, H);

  const pW = Math.min(W * 0.64, _p(340));
  const bH = Math.max(Math.round(H * 0.12), 44);
  const gap = _p(10);
  // 3 buttons: resume, view toggle, quit
  const pH = _p(52) + bH * 3 + gap * 4;
  const pX = W / 2 - pW / 2;
  const pY = H / 2 - pH / 2;

  ctx.fillStyle = 'rgba(5,7,14,0.96)';
  roundRect(ctx, pX, pY, pW, pH, _p(12), true, false);
  ctx.strokeStyle = '#cc2200'; ctx.lineWidth = 2;
  roundRect(ctx, pX, pY, pW, pH, _p(12), false, true);

  ctx.fillStyle    = '#ff4400';
  ctx.font         = `bold ${_p(26)}px monospace`;
  ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', W / 2, pY + _p(30));

  const bW = pW * 0.80, bX = W / 2 - bW / 2;
  let y    = pY + _p(56);

  let action = null;
  if (_btn('▶  RESUME',       bX, y, bW, bH, mx, my, '#00aa44', _p(15)) && clicked) action = 'RESUME';
  y += bH + gap;

  const vLabel = (typeof viewMode !== 'undefined' && viewMode === VIEW_1ST)
    ? '🎥  SWITCH TO 3RD PERSON' : '🎥  SWITCH TO 1ST PERSON';
  if (_btn(vLabel, bX, y, bW, bH, mx, my, '#226688', _p(13)) && clicked) {
    if (typeof toggleView === 'function') toggleView();
  }
  y += bH + gap;

  if (_btn('⌂  QUIT TO MENU', bX, y, bW, bH, mx, my, '#445566', _p(14)) && clicked) action = 'MENU';

  return action;
}

// ─────────────────────────────────────────────
//  FINISH SCREEN
// ─────────────────────────────────────────────
function renderFinish(W, H, mx, my, clicked, data) {
  _bg();

  // Chequered flag header
  const flagH = Math.min(H * 0.20, _p(80));
  const sqSz  = Math.max(14, Math.floor(W / 26));
  for (let fx = 0; fx < W; fx += sqSz) {
    for (let fy = 0; fy < flagH; fy += sqSz) {
      ctx.fillStyle = (Math.floor(fx/sqSz)+Math.floor(fy/sqSz)) % 2 === 0
        ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.88)';
      ctx.fillRect(fx, fy, sqSz, sqSz);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(0, 0, W, flagH);

  // Position badge
  const posC  = ['#ffd700','#c0c0c0','#cd7f32','#aaa'][Math.min(data.position-1,3)];
  const bR    = Math.min(H * 0.10, W * 0.07, _p(50));
  const bX2   = W / 2, bY2 = flagH + bR + _p(10);

  ctx.fillStyle = posC;
  ctx.beginPath(); ctx.arc(bX2, bY2, bR, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.30)'; ctx.lineWidth = _p(3);
  ctx.beginPath(); ctx.arc(bX2, bY2, bR, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#000'; ctx.font = `bold ${Math.round(bR*0.78)}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ordinal(data.position), bX2, bY2);

  // Headline
  const hdY  = bY2 + bR + _p(12);
  const hdSz = Math.min(_p(26), W * 0.055);
  ctx.fillStyle = '#fff'; ctx.font = `bold ${hdSz}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('RACE FINISHED!', W / 2, hdY);

  // Stats
  const sSz   = Math.min(_p(14), W * 0.028);
  const sLH   = Math.round(sSz * 1.9);
  const sPW   = Math.min(W * 0.70, _p(310));
  const sPH   = (data.lapTimes.length + 2) * sLH + _p(24);
  const sPX   = W / 2 - sPW / 2;
  const sPY   = hdY + hdSz + _p(10);

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, sPX, sPY, sPW, sPH, _p(8), true, false);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  roundRect(ctx, sPX, sPY, sPW, sPH, _p(8), false, true);

  const stats = [
    ['Total Time', formatTime(data.totalTime)],
    ['Best Lap',   formatTime(Math.min(...data.lapTimes))],
    ...data.lapTimes.map((lt, i) => [`Lap ${i+1}`, formatTime(lt)]),
  ];
  ctx.font = `${sSz}px monospace`;
  stats.forEach(([label, val], ri) => {
    const ry = sPY + _p(12) + ri * sLH;
    ctx.fillStyle = '#778'; ctx.textAlign = 'left';  ctx.textBaseline = 'top';
    ctx.fillText(label, sPX + _p(14), ry);
    ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'right';
    ctx.fillText(val, sPX + sPW - _p(14), ry);
  });

  // Buttons pinned to bottom
  const fbH = Math.max(Math.round(H * 0.12), 42);
  const fbW = Math.min(W * 0.34, _p(180));
  const fbY = H - fbH - _p(14);
  let action = null;
  if (_btn('▶  PLAY AGAIN', _p(14), fbY, fbW, fbH, mx, my, '#cc2200', _p(13)) && clicked) action = 'AGAIN';
  if (_btn('⌂  MAIN MENU',  W-fbW-_p(14), fbY, fbW, fbH, mx, my, '#445566', _p(13)) && clicked) action = 'MENU';

  return action;
}
