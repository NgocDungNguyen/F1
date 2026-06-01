// ─────────────────────────────────────────────
//  ALL NON-GAMEPLAY SCREENS  –  fully responsive
//  Uses W / H every frame so everything scales to
//  any device (phone landscape, tablet, desktop).
// ─────────────────────────────────────────────

// ── Responsive helpers ────────────────────────────────────────────────────

// True when the viewport is "phone-sized" in landscape
function _isMobileLayout() { return IS_MOBILE || Math.min(W, H) < 420; }

// Scale a base pixel value relative to screen short-edge (H in landscape)
function _sp(base) { return Math.round(base * Math.min(H / 420, W / 700)); }

// Draw a pill button; returns true if hovered/focused
function _btn(label, x, y, w, h, mx, my, accent, fontSz) {
  const hov  = hitTest(mx, my, x, y, w, h);
  const fs   = fontSz || _sp(18);
  ctx.fillStyle = hov ? (accent || '#cc2200') : 'rgba(22,22,32,0.90)';
  roundRect(ctx, x, y, w, h, Math.min(h * 0.35, 14), true, false);
  ctx.strokeStyle = hov ? '#ff6644' : (accent || '#cc2200');
  ctx.lineWidth   = hov ? 2.5 : 1.5;
  roundRect(ctx, x, y, w, h, Math.min(h * 0.35, 14), false, true);
  ctx.fillStyle    = '#fff';
  ctx.font         = `bold ${fs}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  return hov;
}

// Dark bg + grid
function _drawBg(W, H) {
  ctx.fillStyle = '#060810';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(204,34,0,0.07)';
  ctx.lineWidth   = 1;
  const sp = _sp(38);
  for (let y = 0; y < H + sp; y += sp) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  for (let x = 0; x < W + sp; x += sp) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
}

// Section header text
function _sectionTitle(text, y) {
  ctx.fillStyle    = '#ff4400';
  ctx.font         = `bold ${_sp(28)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, y);
}

// ─────────────────────────────────────────────
//  MAIN MENU
// ─────────────────────────────────────────────
let _menuT = 0;

function renderMenu(W, H, t, mx, my, clicked) {
  _menuT += 0.018;
  _drawBg(W, H);

  // Animated red stripe
  ctx.fillStyle = '#cc2200';
  ctx.fillRect(0, H * 0.5 + Math.sin(_menuT) * H * 0.015, W, Math.max(2, H * 0.004));

  ctx.save();
  ctx.textAlign = 'center';

  // "F1" glow
  const titleSz = Math.min(_sp(72), W * 0.16, H * 0.22);
  ctx.font         = `bold ${titleSz}px monospace`;
  ctx.shadowColor  = '#ff4400';
  ctx.shadowBlur   = 24 + Math.sin(_menuT * 2) * 8;
  ctx.fillStyle    = '#ff4400';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('F1', W / 2, H * 0.30);
  ctx.shadowBlur   = 0;

  // "RACER"
  const subSz = Math.min(_sp(38), W * 0.085, H * 0.12);
  ctx.font      = `bold ${subSz}px monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('RACER', W / 2, H * 0.30 + titleSz * 0.8);

  // Tagline
  const tagSz = Math.min(_sp(12), W * 0.025, H * 0.04);
  ctx.font      = `${tagSz}px monospace`;
  ctx.fillStyle = '#666';
  ctx.fillText('PSEUDO-3D ARCADE RACING', W / 2, H * 0.30 + titleSz * 0.8 + subSz * 0.8);

  ctx.restore();

  // Buttons
  const bW  = Math.min(W * 0.55, _sp(240));
  const bH  = Math.max(_sp(46), H * 0.11);
  const bX  = W / 2 - bW / 2;
  const gap = bH * 0.36;
  const b1Y = H * 0.55;

  let action = null;
  if (_btn('▶  PLAY', bX, b1Y, bW, bH, mx, my, '#cc2200', _sp(19)) && clicked) action = 'PLAY';
  if (_btn('?  HOW TO PLAY', bX, b1Y + bH + gap, bW, bH, mx, my, '#336699', _sp(16)) && clicked) action = 'HOW';

  // Animated preview car
  ctx.save();
  const cSz = Math.min(W * 0.10, _sp(65));
  const cX  = W / 2 + Math.sin(_menuT * 0.55) * W * 0.22;
  drawF1Sprite(cX, H * 0.89, cSz, carConfig.color, carConfig.decal);
  ctx.restore();

  // Version tag
  ctx.fillStyle    = '#333';
  ctx.font         = `${_sp(10)}px monospace`;
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('v1.0  ·  3 LAPS  ·  2 TRACKS', W - 10, H - 6);

  return action;
}

// ─────────────────────────────────────────────
//  HOW TO PLAY
// ─────────────────────────────────────────────
function renderHowToPlay(W, H, mx, my, clicked) {
  _drawBg(W, H);
  _sectionTitle('HOW TO PLAY', H * 0.08);

  const mob   = _isMobileLayout();
  const fs    = _sp(mob ? 13 : 15);
  const lineH = fs * 1.85;
  const col1  = W * (mob ? 0.08 : 0.12);
  const col2  = W * (mob ? 0.92 : 0.88);
  let   y     = H * 0.18;

  const rows = [
    ['CONTROLS', null],
    ['Accelerate',        '↑ / W'],
    ['Brake',             '↓ / S'],
    ['Steer',             '← → / A D'],
    ['Boost',             'SPACE'],
    ['Toggle View',       'V'],
    ['Pause',             'ESC'],
    [null, null],
    ['RULES', null],
    ['Complete 3 laps as fast as possible.', ''],
    ['Collisions slow you down.', ''],
    ['Boost has a 28-second cooldown.', ''],
    ['Driving on grass heavily reduces speed.', ''],
  ];

  rows.forEach(([left, right]) => {
    if (!left) { y += lineH * 0.5; return; }
    if (!right && right !== '') {
      // Section header
      ctx.fillStyle    = '#ff8844';
      ctx.font         = `bold ${fs}px monospace`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(left, col1, y);
    } else if (right === '') {
      // Rule line
      ctx.fillStyle    = '#aaa';
      ctx.font         = `${fs}px monospace`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      // Wrap long lines if mobile
      const maxW = col2 - col1;
      _wrapText(left, col1, y, maxW, lineH, fs);
    } else {
      ctx.fillStyle    = '#ccc';
      ctx.font         = `${fs}px monospace`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(left, col1, y);
      ctx.fillStyle    = '#ffcc00';
      ctx.textAlign    = 'right';
      ctx.fillText(right, col2, y);
    }
    y += lineH;
  });

  const bW = Math.min(W * 0.42, _sp(180));
  const bH = Math.max(_sp(42), H * 0.10);
  if (_btn('◀  BACK', W / 2 - bW / 2, H - bH - _sp(18), bW, bH, mx, my, '#445566', _sp(16)) && clicked) return 'BACK';
  return null;
}

function _wrapText(text, x, y, maxW, lineH, fs) {
  ctx.font = `${fs}px monospace`;
  const words  = text.split(' ');
  let line     = '';
  let curY     = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, curY);
      line = w; curY += lineH;
    } else { line = test; }
  }
  if (line) ctx.fillText(line, x, curY);
}

// ─────────────────────────────────────────────
//  TRACK SELECT
// ─────────────────────────────────────────────
function renderTrackSelect(W, H, mx, my, clicked, selectedIdx) {
  _drawBg(W, H);
  _sectionTitle('SELECT TRACK', H * 0.08);

  const mob    = _isMobileLayout();
  const pad    = _sp(10);
  // On very narrow layouts stack cards vertically, otherwise side by side
  const stacked = H > W * 0.85;   // true if nearly square (shouldn't happen in landscape)
  const cols   = stacked ? 1 : 2;
  const gap    = _sp(12);
  const totalW = W - pad * 2;
  const cW     = (totalW - gap * (cols - 1)) / cols;
  const cH     = Math.min(H * 0.72, _sp(290));
  const cY     = H * 0.14;
  const startX = pad;

  let action = null;

  TRACK_DEFS.forEach((def, i) => {
    const cx  = startX + i * (cW + gap);
    const sel = i === selectedIdx;
    const hov = hitTest(mx, my, cx, cY, cW, cH);

    // Card bg
    ctx.fillStyle = sel ? 'rgba(180,28,0,0.22)' : 'rgba(16,18,28,0.88)';
    roundRect(ctx, cx, cY, cW, cH, _sp(10), true, false);
    ctx.strokeStyle = sel ? '#ff4400' : (hov ? '#883300' : '#2a2a3a');
    ctx.lineWidth   = sel ? 2.5 : 1;
    roundRect(ctx, cx, cY, cW, cH, _sp(10), false, true);

    // Mini-map
    const mmH = cH * 0.48;
    drawTrackMinimap(ctx, def, cx + pad, cY + pad, cW - pad * 2, mmH);

    // Name
    const nameSz = Math.min(_sp(mob ? 16 : 19), cW * 0.12);
    ctx.fillStyle    = sel ? '#ff6600' : '#fff';
    ctx.font         = `bold ${nameSz}px monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(def.name, cx + cW / 2, cY + mmH + pad * 2);

    const subSz = Math.min(_sp(mob ? 11 : 13), cW * 0.09);
    ctx.fillStyle = '#888';
    ctx.font      = `${subSz}px monospace`;
    ctx.fillText(def.subtitle, cx + cW / 2, cY + mmH + pad * 2 + nameSz + 4);

    // Desc lines
    const descSz = Math.min(_sp(mob ? 10 : 11), cW * 0.08);
    ctx.font      = `${descSz}px monospace`;
    const bits    = def.desc.split(' • ');
    bits.forEach((bit, bi) => {
      ctx.fillStyle = '#555';
      ctx.fillText(bit, cx + cW / 2, cY + mmH + pad * 2 + nameSz + 4 + subSz + 6 + bi * (descSz + 4));
    });

    // Select highlight ring
    if (sel) {
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth   = 3;
      ctx.setLineDash([6, 4]);
      roundRect(ctx, cx + 3, cY + 3, cW - 6, cH - 6, _sp(9), false, true);
      ctx.setLineDash([]);
    }

    if (hov && clicked) action = { type: 'SELECT', idx: i };
  });

  // Buttons row
  const bH  = Math.max(_sp(44), H * 0.10);
  const bW  = Math.min(W * 0.35, _sp(180));
  const bY  = H - bH - _sp(12);

  if (_btn('◀  BACK', _sp(14), bY, bW, bH, mx, my, '#445566', _sp(15)) && clicked) action = { type: 'BACK' };
  if (_btn('NEXT  ▶', W - bW - _sp(14), bY, bW, bH, mx, my, '#cc2200', _sp(15)) && clicked && !action) action = { type: 'NEXT' };

  return action;
}

// Track mini-map for cards
function drawTrackMinimap(ctx, def, x, y, w, h) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#0c1018'; ctx.fillRect(x, y, w, h);

  const pts = []; let px = 0, py = 0, angle = -Math.PI / 2;
  const scale = Math.min(w, h) / 280;
  pts.push([px, py]);
  for (const sec of def.sections) {
    const cr = sec.curve * 0.045;
    for (let s = 0; s < sec.len; s += 3) {
      angle += cr * 3; px += Math.cos(angle) * 3 * scale; py += Math.sin(angle) * 3 * scale;
      pts.push([px, py]);
    }
  }
  const minX2 = Math.min(...pts.map(p => p[0])), maxX2 = Math.max(...pts.map(p => p[0]));
  const minY2 = Math.min(...pts.map(p => p[1])), maxY2 = Math.max(...pts.map(p => p[1]));
  const ox = x + w / 2 - (minX2 + maxX2) / 2, oy = y + h / 2 - (minY2 + maxY2) / 2;

  ctx.strokeStyle = '#cc4400'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach(([px2, py2], i) => i === 0 ? ctx.moveTo(px2+ox, py2+oy) : ctx.lineTo(px2+ox, py2+oy));
  ctx.stroke();
  ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(pts[0][0]+ox, pts[0][1]+oy, 5, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ─────────────────────────────────────────────
//  CAR CUSTOMISE
// ─────────────────────────────────────────────
const CAR_COLORS = [
  { name:'Ferrari Red',    hex:'#e8001c' },
  { name:'McLaren Orange', hex:'#ff6600' },
  { name:'Sauber Blue',    hex:'#0033cc' },
  { name:'Jordan Yellow',  hex:'#ffcc00' },
  { name:'Force Pink',     hex:'#ff44aa' },
  { name:'Williams White', hex:'#dddddd' },
];

function renderCarCustomize(W, H, mx, my, clicked) {
  _drawBg(W, H);
  _sectionTitle('CUSTOMISE CAR', H * 0.08);

  const mob     = _isMobileLayout();
  // Layout: left = preview, right = controls
  // On very small screens: preview on top, controls below
  const splitH  = mob && H < 350;   // stack vertically

  // Preview area
  const prvW = splitH ? W        : W * 0.42;
  const prvH = splitH ? H * 0.40 : H;
  const prvX = 0;
  const prvY = splitH ? H * 0.12 : 0;

  // Preview: top-down sprite
  const carSz  = Math.min(prvW * 0.30, prvH * 0.28, _sp(110));
  const carX   = prvX + prvW / 2;
  const carY   = splitH ? prvY + prvH * 0.38 : H * 0.38;
  drawF1Sprite(carX, carY, carSz, carConfig.color, carConfig.decal);

  // Cockpit mini-preview box
  const cpW = Math.min(prvW * 0.45, _sp(130));
  const cpH = cpW * 0.58;
  const cpX = carX - cpW / 2;
  const cpY = carY + carSz * 0.55;
  ctx.fillStyle = '#0e0e0e';
  ctx.beginPath();
  ctx.moveTo(cpX, cpY + cpH); ctx.lineTo(cpX + cpW, cpY + cpH);
  ctx.lineTo(cpX + cpW * 0.84, cpY + cpH * 0.52); ctx.lineTo(cpX + cpW * 0.16, cpY + cpH * 0.52);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = carConfig.color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cpX+cpW*0.16, cpY+cpH*0.52); ctx.lineTo(cpX+cpW*0.84, cpY+cpH*0.52); ctx.stroke();
  ctx.fillStyle = carConfig.color;
  ctx.beginPath();
  ctx.moveTo(cpX+cpW*0.30, cpY+cpH); ctx.lineTo(cpX+cpW*0.70, cpY+cpH);
  ctx.lineTo(cpX+cpW*0.58, cpY+cpH*0.62); ctx.lineTo(cpX+cpW*0.42, cpY+cpH*0.62);
  ctx.closePath(); ctx.fill();

  // Divider line
  if (!splitH) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(prvW, H * 0.12); ctx.lineTo(prvW, H * 0.92); ctx.stroke();
  }

  // ── Controls area ─────────────────────────────────────────────────────
  const ctrlX  = splitH ? W * 0.05      : prvW + W * 0.03;
  const ctrlW  = splitH ? W * 0.90      : W - prvW - W * 0.04;
  const ctrlY0 = splitH ? prvY + prvH + _sp(10) : H * 0.14;

  // Colour label
  const lblSz  = _sp(mob ? 12 : 14);
  ctx.fillStyle = '#aaa'; ctx.font = `${lblSz}px monospace`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('COLOUR', ctrlX, ctrlY0);

  // Swatches
  const swCols  = 6;
  const swGap   = _sp(6);
  const swSize  = Math.min((ctrlW - swGap * (swCols - 1)) / swCols, _sp(mob ? 38 : 46), H * 0.10);
  let colAction = null;

  CAR_COLORS.forEach((c, i) => {
    const col = i % swCols, row = Math.floor(i / swCols);
    const sx  = ctrlX + col * (swSize + swGap);
    const sy  = ctrlY0 + lblSz + _sp(8) + row * (swSize + swGap);
    const sel = carConfig.color === c.hex;
    const hov = hitTest(mx, my, sx - 2, sy - 2, swSize + 4, swSize + 4);

    ctx.fillStyle = c.hex;
    roundRect(ctx, sx, sy, swSize, swSize, _sp(5), true, false);
    if (sel) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      roundRect(ctx, sx-3, sy-3, swSize+6, swSize+6, _sp(7), false, true);
    } else if (hov) {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
      roundRect(ctx, sx, sy, swSize, swSize, _sp(5), false, true);
    }
    if (hov && clicked) colAction = c.hex;
  });

  // Decal toggle
  const decalY = ctrlY0 + lblSz + _sp(8) + swSize + _sp(20);
  ctx.fillStyle = '#aaa'; ctx.font = `${lblSz}px monospace`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('DECAL', ctrlX, decalY);

  const decalBW = Math.min((ctrlW - swGap) / 2, _sp(mob ? 90 : 110));
  const decalBH = Math.max(_sp(34), H * 0.08);

  ['solid', 'stripes'].forEach((d, i) => {
    const dx  = ctrlX + i * (decalBW + swGap);
    const dy  = decalY + lblSz + _sp(8);
    const sel = carConfig.decal === d;
    const hov = hitTest(mx, my, dx, dy, decalBW, decalBH);

    ctx.fillStyle = sel ? 'rgba(180,28,0,0.38)' : 'rgba(18,18,28,0.80)';
    roundRect(ctx, dx, dy, decalBW, decalBH, _sp(6), true, false);
    ctx.strokeStyle = sel ? '#ff4400' : '#333'; ctx.lineWidth = sel ? 2 : 1;
    roundRect(ctx, dx, dy, decalBW, decalBH, _sp(6), false, true);
    ctx.fillStyle    = sel ? '#fff' : '#888';
    ctx.font         = `bold ${_sp(mob ? 11 : 13)}px monospace`;
    ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(d.toUpperCase(), dx + decalBW / 2, dy + decalBH / 2);
    if (hov && clicked) colAction = { decal: d };
  });

  // Action buttons
  const bH2 = Math.max(_sp(42), H * 0.10);
  const bW2 = Math.min(W * 0.30, _sp(160));
  const bY2 = H - bH2 - _sp(12);
  let action = colAction;
  if (_btn('◀  BACK', _sp(14), bY2, bW2, bH2, mx, my, '#445566', _sp(14)) && clicked) action = action || 'BACK';
  if (_btn('RACE!  ▶', W - bW2 - _sp(14), bY2, bW2, bH2, mx, my, '#cc2200', _sp(16)) && clicked) action = 'START';

  return action;
}

// ─────────────────────────────────────────────
//  COUNTDOWN
// ─────────────────────────────────────────────
function renderCountdown(W, H, countdownT) {
  const phase = Math.floor(countdownT);
  const frac  = countdownT - phase;
  const zoom  = 1 + (1 - frac) * 0.55;

  let text, color;
  if      (phase <= 0) return;
  else if (phase === 1) { text = '3';   color = '#ffcc00'; }
  else if (phase === 2) { text = '2';   color = '#ff8800'; }
  else if (phase === 3) { text = '1';   color = '#ff2200'; }
  else                  { text = 'GO!'; color = '#00ff88'; }

  const alpha = phase >= 4 ? Math.max(0, 1 - (countdownT - 4) * 3.5) : Math.min(1, frac * 5);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W / 2, H * 0.44);
  ctx.scale(zoom, zoom);

  const r = Math.min(H * 0.13, W * 0.09);
  ctx.fillStyle = 'rgba(0,0,0,0.50)';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  ctx.shadowColor = color; ctx.shadowBlur = 28;
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
  ctx.fillStyle = 'rgba(0,0,10,0.72)';
  ctx.fillRect(0, 0, W, H);

  const pW = Math.min(W * 0.62, _sp(340)), pH = _sp(230);
  const pX = W / 2 - pW / 2, pY = H / 2 - pH / 2;

  ctx.fillStyle = 'rgba(6,8,16,0.96)';
  roundRect(ctx, pX, pY, pW, pH, _sp(12), true, false);
  ctx.strokeStyle = '#cc2200'; ctx.lineWidth = 2;
  roundRect(ctx, pX, pY, pW, pH, _sp(12), false, true);

  ctx.fillStyle    = '#ff4400';
  ctx.font         = `bold ${_sp(28)}px monospace`;
  ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', W / 2, pY + _sp(46));

  const bW = pW * 0.72, bH = Math.max(_sp(44), pH * 0.19);
  const bX = W / 2 - bW / 2;

  let action = null;
  if (_btn('▶  RESUME',       bX, pY + _sp(88),  bW, bH, mx, my, '#00aa44', _sp(16)) && clicked) action = 'RESUME';
  if (_btn('⟳  QUIT TO MENU', bX, pY + _sp(88) + bH + _sp(12), bW, bH, mx, my, '#445566', _sp(15)) && clicked) action = 'MENU';

  // View toggle button in pause
  const vW = pW * 0.72, vH = bH * 0.75;
  const vY = pY + _sp(88) + bH * 2 + _sp(24);
  const viewLabel = (typeof viewMode !== 'undefined' && viewMode === VIEW_1ST)
    ? '🎥  SWITCH TO 3RD PERSON'
    : '🎥  SWITCH TO 1ST PERSON';
  if (_btn(viewLabel, W/2 - vW/2, vY, vW, vH, mx, my, '#226688', _sp(12)) && clicked) {
    if (typeof toggleView === 'function') toggleView();
  }

  return action;
}

// ─────────────────────────────────────────────
//  FINISH SCREEN
// ─────────────────────────────────────────────
let _finishT = 0;

function renderFinish(W, H, mx, my, clicked, data) {
  _finishT += 0.018;
  _drawBg(W, H);

  // Chequered flag header
  const flagH = Math.min(H * 0.20, _sp(88));
  const sqSz  = Math.max(14, Math.floor(W / 24));
  for (let fx = 0; fx < W; fx += sqSz) {
    for (let fy = 0; fy < flagH; fy += sqSz) {
      ctx.fillStyle = (Math.floor(fx/sqSz)+Math.floor(fy/sqSz)) % 2 === 0
        ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)';
      ctx.fillRect(fx, fy, sqSz, sqSz);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, flagH);

  // Position badge
  const posColors = ['#ffd700','#c0c0c0','#cd7f32','#aaaaaa'];
  const posColor  = posColors[Math.min(data.position - 1, 3)];
  const badgeR    = Math.min(H * 0.10, W * 0.07, _sp(52));
  const badgeX    = W / 2, badgeY = flagH + badgeR + _sp(12);

  ctx.fillStyle = posColor;
  ctx.beginPath(); ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI*2); ctx.stroke();

  ctx.fillStyle    = '#000';
  ctx.font         = `bold ${Math.round(badgeR * 0.8)}px monospace`;
  ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ordinal(data.position), badgeX, badgeY);

  // Headline
  const hdY  = badgeY + badgeR + _sp(14);
  const hdSz = Math.min(_sp(28), W * 0.055, H * 0.08);
  ctx.fillStyle    = '#ffffff';
  ctx.font         = `bold ${hdSz}px monospace`;
  ctx.textAlign    = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('RACE FINISHED!', W / 2, hdY);

  // Stats panel
  const statSz    = Math.min(_sp(14), W * 0.028, H * 0.042);
  const statLineH = statSz * 1.9;
  const statPad   = _sp(14);
  const statPW    = Math.min(W * 0.70, _sp(320));
  const statPH    = (data.lapTimes.length + 2) * statLineH + statPad * 2;
  const statPX    = W / 2 - statPW / 2;
  const statPY    = hdY + hdSz + _sp(10);

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, statPX, statPY, statPW, statPH, _sp(8), true, false);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
  roundRect(ctx, statPX, statPY, statPW, statPH, _sp(8), false, true);

  const stats = [
    ['Total Time', formatTime(data.totalTime)],
    ['Best Lap',   formatTime(Math.min(...data.lapTimes))],
    ...data.lapTimes.map((lt, i) => [`Lap ${i+1}`, formatTime(lt)]),
  ];

  ctx.font = `${statSz}px monospace`;
  stats.forEach(([label, val], ri) => {
    const ry = statPY + statPad + ri * statLineH;
    ctx.fillStyle = '#888'; ctx.textAlign = 'left';  ctx.textBaseline = 'top';
    ctx.fillText(label, statPX + statPad, ry);
    ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'right';
    ctx.fillText(val, statPX + statPW - statPad, ry);
  });

  // Buttons
  const bH3 = Math.max(_sp(44), H * 0.10);
  const bW3 = Math.min(W * 0.35, _sp(180));
  const bY3 = H - bH3 - _sp(12);
  let action = null;
  if (_btn('▶  PLAY AGAIN', _sp(14), bY3, bW3, bH3, mx, my, '#cc2200', _sp(14)) && clicked) action = 'AGAIN';
  if (_btn('⌂  MAIN MENU',  W-bW3-_sp(14), bY3, bW3, bH3, mx, my, '#445566', _sp(14)) && clicked) action = 'MENU';

  return action;
}
