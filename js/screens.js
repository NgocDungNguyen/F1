// ─────────────────────────────────────────────
//  ALL NON-GAMEPLAY SCREENS
//  (Menu, Track Select, Car Customize, Countdown, Pause, Finish)
// ─────────────────────────────────────────────

// ── Shared button helpers ──────────────────────────────────────────────────

// Returns true if (mx,my) is inside button rect
function _btn(label, x, y, w, h, mx, my, accent, large) {
  const hov  = hitTest(mx, my, x, y, w, h);
  const fSize = large ? 22 : 18;

  ctx.fillStyle = hov ? (accent || '#cc2200') : 'rgba(30,30,30,0.88)';
  roundRect(ctx, x, y, w, h, 8, true, false);
  ctx.strokeStyle = accent || '#cc2200';
  ctx.lineWidth   = hov ? 2 : 1;
  roundRect(ctx, x, y, w, h, 8, false, true);

  ctx.fillStyle    = '#fff';
  ctx.font         = `bold ${fSize}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  return hov;
}

// Shared dark background with scanlines
function _drawBg(W, H) {
  ctx.fillStyle = '#070a10';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.018)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
}

// Animated grid lines effect
function _drawGrid(W, H, t) {
  ctx.strokeStyle = 'rgba(204,34,0,0.08)';
  ctx.lineWidth   = 1;
  const spacing   = 40;
  const offset    = (t * 20) % spacing;
  for (let y = -spacing + offset; y < H; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let x = 0; x < W + spacing; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
}

// ─────────────────────────────────────────────
//  MAIN MENU
// ─────────────────────────────────────────────

let menuAnim = 0;

function renderMenu(W, H, t, mx, my, clicked) {
  menuAnim += 0.016;
  _drawBg(W, H);
  _drawGrid(W, H, menuAnim);

  // Animated red racing stripe
  const stripeY = H * 0.5 + Math.sin(menuAnim * 0.8) * H * 0.02;
  ctx.fillStyle = '#cc2200';
  ctx.fillRect(0, stripeY, W, H * 0.004);

  // Title
  ctx.save();
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';

  // Glow
  ctx.shadowColor = '#ff4400';
  ctx.shadowBlur  = 30 + Math.sin(menuAnim * 2) * 8;
  ctx.fillStyle   = '#ff4400';
  ctx.font        = `bold ${Math.min(W * 0.13, 80)}px monospace`;
  ctx.fillText('F1', W / 2, H * 0.22);

  ctx.shadowBlur  = 0;
  ctx.fillStyle   = '#ffffff';
  ctx.font        = `bold ${Math.min(W * 0.075, 50)}px monospace`;
  ctx.fillText('RACER', W / 2, H * 0.34);

  ctx.fillStyle = '#888';
  ctx.font      = `${Math.min(W * 0.025, 16)}px monospace`;
  ctx.fillText('PSEUDO-3D ARCADE RACING', W / 2, H * 0.43);
  ctx.restore();

  // Buttons
  const bw = Math.min(260, W * 0.4);
  const bh = 52;
  const bx = W / 2 - bw / 2;

  let action = null;
  if (_btn('▶  PLAY', bx, H * 0.52, bw, bh, mx, my, '#cc2200', true) && clicked) action = 'PLAY';
  if (_btn('⚙  HOW TO PLAY', bx, H * 0.52 + bh + 16, bw, bh, mx, my, '#445566', false) && clicked) action = 'HOW';

  // Version
  ctx.fillStyle = '#444';
  ctx.font      = '11px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('v1.0  |  3 LAPS  |  2 TRACKS', W - 12, H - 6);

  // Small F1 car decoration
  ctx.save();
  const carX = W / 2 + Math.sin(menuAnim * 0.5) * W * 0.25;
  drawF1Sprite(carX, H * 0.885, Math.min(W * 0.12, 80), carConfig.color, carConfig.decal);
  ctx.restore();

  return action;
}

// ─────────────────────────────────────────────
//  HOW TO PLAY
// ─────────────────────────────────────────────

function renderHowToPlay(W, H, mx, my, clicked) {
  _drawBg(W, H);

  ctx.fillStyle    = '#ff4400';
  ctx.font         = `bold ${Math.min(W * 0.055, 36)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('HOW TO PLAY', W / 2, H * 0.06);

  const lines = [
    ['CONTROLS',        ''],
    ['Accelerate',      '↑ / W'],
    ['Brake',           '↓ / S'],
    ['Steer Left/Right','← → / A D'],
    ['Boost',           'SPACE'],
    ['Pause',           'ESC'],
    ['', ''],
    ['RULES', ''],
    ['Complete 3 laps as fast as possible.', ''],
    ['Avoid AI cars — collisions slow you down.', ''],
    ['Boost has a 28-second cooldown.', ''],
    ['Off-road grass drastically reduces speed.', ''],
  ];

  ctx.font      = '16px monospace';
  ctx.textAlign = 'left';
  let ly        = H * 0.18;
  const lx      = W * 0.15;

  for (const [left, right] of lines) {
    if (!left && !right) { ly += 12; continue; }
    if (!right) {
      ctx.fillStyle = '#ff8844';
      ctx.font      = 'bold 16px monospace';
      ctx.fillText(left, lx, ly);
      ctx.font      = '16px monospace';
    } else {
      ctx.fillStyle = '#ccc';
      ctx.fillText(left, lx, ly);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(right, W - lx, ly);
      ctx.textAlign = 'left';
    }
    ly += 28;
  }

  const bw = Math.min(200, W * 0.32), bh = 48;
  if (_btn('◀  BACK', W / 2 - bw / 2, H - bh - 24, bw, bh, mx, my, '#555', false) && clicked) return 'BACK';
  return null;
}

// ─────────────────────────────────────────────
//  TRACK SELECT
// ─────────────────────────────────────────────

let trackSelectHov = -1;

function renderTrackSelect(W, H, mx, my, clicked, selectedIdx) {
  _drawBg(W, H);

  ctx.fillStyle    = '#ff4400';
  ctx.font         = `bold ${Math.min(W * 0.05, 34)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('SELECT TRACK', W / 2, H * 0.055);

  const cardW = Math.min(W * 0.38, 280);
  const cardH = Math.min(H * 0.62, 320);
  const gap   = W * 0.04;
  const totalW = cardW * 2 + gap;
  const startX = (W - totalW) / 2;
  const cardY  = H * 0.15;

  let action  = null;

  TRACK_DEFS.forEach((def, i) => {
    const cx = startX + i * (cardW + gap);
    const sel = i === selectedIdx;
    const hov = hitTest(mx, my, cx, cardY, cardW, cardH);

    // Card background
    ctx.fillStyle = sel ? 'rgba(200,34,0,0.22)' : 'rgba(20,20,30,0.88)';
    roundRect(ctx, cx, cardY, cardW, cardH, 12, true, false);
    ctx.strokeStyle = sel ? '#ff4400' : (hov ? '#cc4400' : '#333');
    ctx.lineWidth   = sel ? 3 : 1;
    roundRect(ctx, cx, cardY, cardW, cardH, 12, false, true);

    // Track mini-map
    drawTrackMinimap(ctx, def, cx + 14, cardY + 14, cardW - 28, cardH * 0.5);

    // Track name
    ctx.fillStyle    = sel ? '#ff6600' : '#fff';
    ctx.font         = `bold ${Math.min(cardW * 0.1, 20)}px monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(def.name, cx + cardW / 2, cardY + cardH * 0.54);

    ctx.fillStyle = '#aaa';
    ctx.font      = `${Math.min(cardW * 0.072, 14)}px monospace`;
    ctx.fillText(def.subtitle, cx + cardW / 2, cardY + cardH * 0.63);

    // Desc
    ctx.fillStyle = '#777';
    ctx.font      = `${Math.min(cardW * 0.062, 12)}px monospace`;
    const descLines = def.desc.split(' • ');
    descLines.forEach((dl, di) => {
      ctx.fillText(dl, cx + cardW / 2, cardY + cardH * 0.72 + di * 18);
    });

    if (hov && clicked) {
      action = { type: 'SELECT', idx: i };
    }
  });

  const bw = Math.min(220, W * 0.32), bh = 48;
  if (_btn('▶  NEXT', W / 2 - bw / 2, H - bh - 22, bw, bh, mx, my, '#cc2200', true) && clicked) {
    action = { type: 'NEXT' };
  }
  if (_btn('◀  BACK', 22, H - bh - 22, Math.min(140, W * 0.2), bh, mx, my, '#445566', false) && clicked) {
    action = { type: 'BACK' };
  }

  return action;
}

// Minimal top-down track outline for the card
function drawTrackMinimap(ctx, def, x, y, w, h) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();

  ctx.fillStyle = '#111a11';
  ctx.fillRect(x, y, w, h);

  // Build a simple path from sections
  const pts = [];
  let px = 0, py = 0, angle = -Math.PI / 2;
  const scale = Math.min(w, h) / 280;

  pts.push([px, py]);
  for (const sec of def.sections) {
    const curveRad = sec.curve * 0.045;
    for (let s = 0; s < sec.len; s += 3) {
      angle += curveRad * 3;
      px += Math.cos(angle) * 3 * scale;
      py += Math.sin(angle) * 3 * scale;
      pts.push([px, py]);
    }
  }

  // Centre the path
  const minX = Math.min(...pts.map(p => p[0]));
  const maxX = Math.max(...pts.map(p => p[0]));
  const minY = Math.min(...pts.map(p => p[1]));
  const maxY = Math.max(...pts.map(p => p[1]));
  const offX = x + w / 2 - (minX + maxX) / 2;
  const offY = y + h / 2 - (minY + maxY) / 2;

  ctx.strokeStyle = '#cc4400';
  ctx.lineWidth   = 3;
  ctx.beginPath();
  pts.forEach(([px2, py2], i) => {
    if (i === 0) ctx.moveTo(px2 + offX, py2 + offY);
    else         ctx.lineTo(px2 + offX, py2 + offY);
  });
  ctx.stroke();

  // Start/finish indicator
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(pts[0][0] + offX, pts[0][1] + offY, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────────
//  CAR CUSTOMISE
// ─────────────────────────────────────────────

const CAR_COLORS = [
  { name: 'Ferrari Red',   hex: '#e8001c' },
  { name: 'McLaren Orange',hex: '#ff6600' },
  { name: 'Sauber Blue',   hex: '#0033cc' },
  { name: 'Jordan Yellow', hex: '#ffcc00' },
  { name: 'Force India Pink',hex: '#ff44aa' },
  { name: 'Williams White',hex: '#dddddd' },
];

function renderCarCustomize(W, H, mx, my, clicked) {
  _drawBg(W, H);

  ctx.fillStyle    = '#ff4400';
  ctx.font         = `bold ${Math.min(W * 0.05, 34)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('CUSTOMISE CAR', W / 2, H * 0.055);

  // ── Car preview (left side) ───────────────────────────────────────────
  const previewX = W * 0.28;
  const previewY = H * 0.42;
  drawF1Sprite(previewX, previewY, Math.min(W * 0.25, 150), carConfig.color, carConfig.decal);

  // Cockpit preview box
  ctx.strokeStyle = '#333';
  ctx.lineWidth   = 1;
  const cpW = Math.min(W * 0.22, 140);
  const cpH = cpW * 0.6;
  const cpX = previewX - cpW / 2;
  const cpY = previewY + Math.min(W * 0.14, 80);
  // Mini dashboard
  ctx.fillStyle = '#0e0e0e';
  ctx.beginPath();
  ctx.moveTo(cpX, cpY + cpH);
  ctx.lineTo(cpX + cpW, cpY + cpH);
  ctx.lineTo(cpX + cpW * 0.84, cpY + cpH * 0.5);
  ctx.lineTo(cpX + cpW * 0.16, cpY + cpH * 0.5);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = carConfig.color;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(cpX + cpW * 0.16, cpY + cpH * 0.5);
  ctx.lineTo(cpX + cpW * 0.84, cpY + cpH * 0.5);
  ctx.stroke();
  // Nose preview
  ctx.fillStyle = carConfig.color;
  ctx.beginPath();
  ctx.moveTo(cpX + cpW * 0.3, cpY + cpH);
  ctx.lineTo(cpX + cpW * 0.7, cpY + cpH);
  ctx.lineTo(cpX + cpW * 0.58, cpY + cpH * 0.62);
  ctx.lineTo(cpX + cpW * 0.42, cpY + cpH * 0.62);
  ctx.closePath(); ctx.fill();

  // ── Colour swatches (right side) ──────────────────────────────────────
  const swX0  = W * 0.52;
  const swY0  = H * 0.18;
  const swSize = Math.min(W * 0.065, 44);
  const swGap  = swSize * 0.28;
  const swCols = 3;

  ctx.fillStyle    = '#aaa';
  ctx.font         = '14px monospace';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('COLOUR', swX0, swY0 - 22);

  let colAction = null;

  CAR_COLORS.forEach((c, i) => {
    const col = i % swCols;
    const row = Math.floor(i / swCols);
    const sx  = swX0 + col * (swSize + swGap);
    const sy  = swY0 + row * (swSize + swGap);
    const sel = carConfig.color === c.hex;
    const hov = hitTest(mx, my, sx - 2, sy - 2, swSize + 4, swSize + 4);

    ctx.fillStyle = c.hex;
    roundRect(ctx, sx, sy, swSize, swSize, 6, true, false);
    if (sel) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 3;
      roundRect(ctx, sx - 2, sy - 2, swSize + 4, swSize + 4, 7, false, true);
    } else if (hov) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth   = 1;
      roundRect(ctx, sx, sy, swSize, swSize, 6, false, true);
    }

    if (hov && clicked) colAction = c.hex;
  });

  // ── Decal toggle ─────────────────────────────────────────────────────
  const dtY = swY0 + swSize * 2 + swGap * 2 + 24;
  ctx.fillStyle    = '#aaa';
  ctx.font         = '14px monospace';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('DECAL', swX0, dtY);

  const decals = ['solid', 'stripes'];
  decals.forEach((d, i) => {
    const dx  = swX0 + i * (100 + 10);
    const dy  = dtY + 22;
    const sel = carConfig.decal === d;
    const hov = hitTest(mx, my, dx, dy, 95, 38);

    ctx.fillStyle = sel ? 'rgba(200,34,0,0.4)' : 'rgba(20,20,20,0.8)';
    roundRect(ctx, dx, dy, 95, 38, 6, true, false);
    ctx.strokeStyle = sel ? '#ff4400' : '#444';
    ctx.lineWidth   = sel ? 2 : 1;
    roundRect(ctx, dx, dy, 95, 38, 6, false, true);
    ctx.fillStyle    = sel ? '#fff' : '#888';
    ctx.font         = '14px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.toUpperCase(), dx + 47, dy + 19);

    if (hov && clicked) colAction = { decal: d };
  });

  // ── Action buttons ────────────────────────────────────────────────────
  const bw = Math.min(200, W * 0.28), bh = 48;
  let action = colAction;
  if (_btn('▶  RACE!', W - bw - 22, H - bh - 22, bw, bh, mx, my, '#cc2200', true) && clicked) {
    action = 'START';
  }
  if (_btn('◀  BACK', 22, H - bh - 22, Math.min(140, W * 0.2), bh, mx, my, '#445566', false) && clicked) {
    action = action || 'BACK';
  }

  return action;
}

// ─────────────────────────────────────────────
//  COUNTDOWN
// ─────────────────────────────────────────────

function renderCountdown(W, H, countdownT) {
  // countdownT goes 0→4+; display 3,2,1,GO
  const phase = Math.floor(countdownT);
  const frac  = countdownT - phase;
  const scale = 1 + (1 - frac) * 0.6;      // zoom-out pulse

  let text, color;
  if (phase === 0)      { text = ''; }
  else if (phase === 1) { text = '3'; color = '#ffcc00'; }
  else if (phase === 2) { text = '2'; color = '#ffaa00'; }
  else if (phase === 3) { text = '1'; color = '#ff4400'; }
  else                  { text = 'GO!'; color = '#00ff88'; }

  if (!text) return;

  ctx.save();
  ctx.translate(W / 2, H / 2 - H * 0.08);
  ctx.scale(scale, scale);

  const alpha = phase >= 4 ? Math.max(0, 1 - (countdownT - 4) * 3) : Math.min(1, frac * 4);
  ctx.globalAlpha = alpha;

  ctx.fillStyle    = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.arc(0, 0, H * 0.14, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = color;
  ctx.shadowBlur  = 30;
  ctx.fillStyle   = color;
  ctx.font        = `bold ${H * 0.18}px monospace`;
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

// ─────────────────────────────────────────────
//  PAUSE MENU
// ─────────────────────────────────────────────

function renderPause(W, H, mx, my, clicked) {
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0,0,10,0.72)';
  ctx.fillRect(0, 0, W, H);

  // Panel
  const pw = Math.min(380, W * 0.55), ph = 260;
  const px = W / 2 - pw / 2, py = H / 2 - ph / 2;
  ctx.fillStyle = 'rgba(8,10,18,0.95)';
  roundRect(ctx, px, py, pw, ph, 14, true, false);
  ctx.strokeStyle = '#cc2200';
  ctx.lineWidth   = 2;
  roundRect(ctx, px, py, pw, ph, 14, false, true);

  ctx.fillStyle    = '#ff4400';
  ctx.font         = `bold ${Math.min(pw * 0.12, 32)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', W / 2, py + 52);

  const bw = pw * 0.7, bh = 46;
  const bx = W / 2 - bw / 2;

  let action = null;
  if (_btn('▶  RESUME',      bx, py + 100, bw, bh, mx, my, '#00aa44', true)  && clicked) action = 'RESUME';
  if (_btn('⟳  QUIT TO MENU', bx, py + 162, bw, bh, mx, my, '#445566', false) && clicked) action = 'MENU';

  return action;
}

// ─────────────────────────────────────────────
//  FINISH SCREEN
// ─────────────────────────────────────────────

let finishAnim = 0;

function renderFinish(W, H, mx, my, clicked, data) {
  finishAnim += 0.016;

  _drawBg(W, H);

  // Animated chequered flag pattern
  const flagW = W, flagH = H * 0.22;
  const sqSz  = Math.max(20, Math.floor(W / 20));
  for (let fx = 0; fx < flagW; fx += sqSz) {
    for (let fy = 0; fy < flagH; fy += sqSz) {
      ctx.fillStyle = ((Math.floor(fx / sqSz) + Math.floor(fy / sqSz)) % 2 === 0)
        ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)';
      ctx.fillRect(fx, fy, sqSz, sqSz);
    }
  }

  // Wave effect over flag
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, 0, W, flagH);

  // Position badge
  const posColor = data.position === 1 ? '#ffd700' : (data.position === 2 ? '#c0c0c0' : '#cd7f32');
  const pBadgeR  = Math.min(H * 0.12, 60);
  const pBadgeX  = W / 2;
  const pBadgeY  = flagH + pBadgeR + 20;

  ctx.fillStyle = posColor;
  ctx.beginPath();
  ctx.arc(pBadgeX, pBadgeY, pBadgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle    = '#000';
  ctx.font         = `bold ${pBadgeR * 0.85}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ordinal(data.position), pBadgeX, pBadgeY);

  // Headline
  ctx.fillStyle    = '#fff';
  ctx.font         = `bold ${Math.min(W * 0.065, 42)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  const headY = pBadgeY + pBadgeR + 16;
  ctx.fillText('RACE FINISHED!', W / 2, headY);

  // Stats
  ctx.font      = `${Math.min(W * 0.032, 20)}px monospace`;
  ctx.fillStyle = '#aaa';
  const stats = [
    [`Total Time`, formatTime(data.totalTime)],
    [`Best Lap`,   formatTime(Math.min(...data.lapTimes))],
  ];
  data.lapTimes.forEach((lt, i) => stats.push([`Lap ${i + 1}`, formatTime(lt)]));

  let sy = headY + Math.min(W * 0.07, 54);
  ctx.textAlign = 'left';
  stats.forEach(([label, val]) => {
    ctx.fillStyle = '#888';
    ctx.fillText(label, W * 0.24, sy);
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'right';
    ctx.fillText(val, W * 0.76, sy);
    ctx.textAlign = 'left';
    sy += 28;
  });

  // Buttons
  const bw = Math.min(220, W * 0.32), bh = 48;
  let action = null;
  if (_btn('▶  PLAY AGAIN',  W / 2 - bw - 12, H - bh - 22, bw, bh, mx, my, '#cc2200', true)  && clicked) action = 'AGAIN';
  if (_btn('⌂  MAIN MENU',   W / 2 + 12,       H - bh - 22, bw, bh, mx, my, '#445566', false) && clicked) action = 'MENU';

  return action;
}
