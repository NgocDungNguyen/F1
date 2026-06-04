// ─────────────────────────────────────────────
//  ALL NON-GAMEPLAY SCREENS
//
//  MOBILE-SAFE LAYOUT RULE:
//    All interactive elements end at or before H * 0.78.
//    This leaves 22% margin for Android URL bars (~56px)
//    and iOS home indicators (~34px).
//    Nothing is anchored from the bottom (H - x) because
//    window.innerHeight can exceed the truly visible area.
//
//  Scale helper: _p(v) = v * min(H/420, 1.4)
//  Never use fixed pixel sizes for vertical positions.
// ─────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────────

function _mob() { return Math.min(W, H) < 480; }

// Proportional scale based on H (portrait height on desktop, landscape H on phone)
function _s()  { return Math.min(H / 420, 1.4); }
function _p(v) { return Math.round(v * _s()); }

// Dark grid background
function _bg() {
  ctx.fillStyle = '#06080e';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
}

// Pill button — returns true if pointer is inside
function _btn(label, x, y, w, h, mx, my, accent, fs) {
  if (w <= 0 || h <= 0) return false;
  accent = accent || '#cc2200';
  const hov = hitTest(mx, my, x, y, w, h);
  ctx.fillStyle   = hov ? accent : 'rgba(14,16,26,0.94)';
  ctx.shadowColor = accent;
  ctx.shadowBlur  = hov ? _p(10) : 0;
  roundRect(ctx, x, y, w, h, _p(7), true, false);
  ctx.shadowBlur  = 0;
  ctx.strokeStyle = accent; ctx.lineWidth = hov ? 2 : 1;
  ctx.globalAlpha = hov ? 1 : 0.55;
  roundRect(ctx, x, y, w, h, _p(7), false, true);
  ctx.globalAlpha = 1;
  ctx.fillStyle    = '#fff';
  ctx.font         = `bold ${fs || _p(15)}px monospace`;
  ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  return hov;
}

// Screen title
function _hdr(text, cy) {
  ctx.fillStyle    = '#ff4400';
  ctx.font         = `bold ${_p(22)}px monospace`;
  ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, cy);
}

// Text-wrap helper
function _wrap(text, x, y, maxW, lh, fs) {
  ctx.font = `${fs}px monospace`;
  const words = text.split(' '); let line = '', cy = y;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, cy); line = w; cy += lh; }
    else line = t;
  }
  if (line) ctx.fillText(line, x, cy);
}

// ─────────────────────────────────────────────
//  MAIN MENU
//  All content fits between y=0 and y=H*0.72
// ─────────────────────────────────────────────
let _mT = 0;

function renderMenu(W, H, _t, mx, my, clicked) {
  _mT += 0.018;
  _bg();

  // ── Vertical layout constants (fractions of H) ──
  // Logo block:   H*0.08  →  H*0.29  (21% of H)
  // Tagline:      H*0.31  →  H*0.37  ( 6%)
  // PLAY button:  H*0.42  →  H*0.55  (13%)  bottom = H*0.55
  // HOW button:   H*0.59  →  H*0.70  (11%)  bottom = H*0.70  ← safe on all phones
  // Total used: 70% of H, safe margin 30%

  const LOGO_CY  = H * 0.18;   // vertical centre of the F1/RACER stack
  const TAG_Y    = H * 0.32;
  const PLAY_Y   = H * 0.42;
  const PLAY_H   = H * 0.13;
  const HOW_Y    = H * 0.59;
  const HOW_H    = H * 0.11;

  // Glow halo behind logo
  const pulse = 0.65 + 0.35 * Math.sin(_mT * 1.8);
  ctx.fillStyle = `rgba(204,34,0,${0.07 * pulse})`;
  ctx.beginPath();
  ctx.arc(W / 2, LOGO_CY, H * 0.14 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // "F1" text
  const f1Sz = Math.min(H * 0.14, W * 0.13);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font         = `bold ${f1Sz}px monospace`;
  ctx.shadowColor  = '#ff4400';
  ctx.shadowBlur   = H * 0.05 + Math.sin(_mT * 2) * H * 0.015;
  ctx.fillStyle    = '#ff4400';
  ctx.fillText('F1', W / 2, LOGO_CY);
  ctx.shadowBlur   = 0;

  // "RACER"
  const racerSz = Math.min(f1Sz * 0.44, W * 0.07);
  ctx.font      = `bold ${racerSz}px monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('RACER', W / 2, LOGO_CY + f1Sz * 0.58);
  ctx.restore();

  // Tagline
  ctx.fillStyle    = '#445566';
  ctx.font         = `${Math.min(H * 0.030, W * 0.022)}px monospace`;
  ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('PSEUDO-3D ARCADE RACING', W / 2, TAG_Y);

  // Thin divider
  ctx.strokeStyle = 'rgba(204,34,0,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.30, TAG_Y + H * 0.03);
  ctx.lineTo(W * 0.70, TAG_Y + H * 0.03);
  ctx.stroke();

  // Buttons
  const bW = Math.min(W * 0.58, H * 1.4, _p(260));
  const bX = W / 2 - bW / 2;

  let action = null;
  if (_btn('▶   PLAY', bX, PLAY_Y, bW, PLAY_H, mx, my, '#cc2200', PLAY_H * 0.36) && clicked) action = 'PLAY';
  if (_btn('?   HOW TO PLAY', bX, HOW_Y,  bW, HOW_H, mx, my, '#334466', HOW_H * 0.38) && clicked) action = 'HOW';

  // Version (below visible safe zone — decorative only, OK if clipped)
  ctx.fillStyle    = '#1e2030';
  ctx.font         = `${_p(9)}px monospace`;
  ctx.textAlign    = 'right'; ctx.textBaseline = 'top';
  ctx.fillText('v2.0 · 3 LAPS · 4 TRACKS · 4 VEHICLES', W - _p(10), H * 0.82);

  return action;
}

// ─────────────────────────────────────────────
//  HOW TO PLAY
//  Content: H*0.10 → H*0.72  (BACK button)
// ─────────────────────────────────────────────
function renderHowToPlay(W, H, mx, my, clicked) {
  _bg();
  _hdr('HOW TO PLAY', H * 0.08);

  const fs  = Math.min(_p(_mob() ? 12 : 14), H * 0.040);
  const lh  = fs * 1.85;
  const lx  = W * 0.08, rx = W * 0.92;
  let y     = H * 0.16;

  [
    ['CONTROLS', null],
    ['Accelerate',       '↑ / W'],
    ['Brake',            '↓ / S'],
    ['Steer',            '← → / A D'],
    ['Boost',            'SPACE'],
    ['Camera',           'V / 🎥'],
    ['Pause',            'ESC / ⏸'],
    [null, null],
    ['RULES', null],
    ['3 laps – fastest time wins.', ''],
    ['Collisions cut your speed.',  ''],
    ['Boost has a 28-second cooldown.', ''],
    ['Grass heavily slows the car.',    ''],
  ].forEach(([l, r]) => {
    if (!l) { y += lh * 0.5; return; }
    if (r === null) {
      ctx.fillStyle = '#ff8844'; ctx.font = `bold ${fs}px monospace`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(l, lx, y);
    } else if (r === '') {
      ctx.fillStyle = '#99a'; ctx.font = `${fs}px monospace`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      _wrap(l, lx, y, rx - lx, lh, fs);
    } else {
      ctx.fillStyle = '#ccc'; ctx.font = `${fs}px monospace`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(l, lx, y);
      ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'right'; ctx.fillText(r, rx, y);
    }
    y += lh;
  });

  const bH = H * 0.11, bW = Math.min(W * 0.42, _p(170));
  if (_btn('◀  BACK', W / 2 - bW / 2, H * 0.72, bW, bH, mx, my, '#445566', bH * 0.36) && clicked) return 'BACK';
  return null;
}

// ─────────────────────────────────────────────
//  TRACK SELECT
//  Cards:   H*0.14 → H*0.64
//  Buttons: H*0.66 → H*0.78
// ─────────────────────────────────────────────
function renderTrackSelect(W, H, mx, my, clicked, selectedIdx) {
  _bg();
  _hdr('SELECT TRACK', H * 0.07);

  const AREA_Y = H * 0.13;
  const AREA_H = H * 0.70;
  const BTN_Y  = H * 0.85;
  const BTN_H  = H * 0.10;

  const gap   = _p(8);
  const cCols = 2;
  const cRows = 3;
  const cW    = (W - gap * (cCols + 1)) / cCols;
  const cH    = (AREA_H - gap * (cRows + 1)) / cRows;

  let action = null;

  TRACK_DEFS.forEach((def, i) => {
    const col = i % cCols;
    const row = Math.floor(i / cCols);
    const cx  = gap + col * (cW + gap);
    const cy  = AREA_Y + gap + row * (cH + gap);
    const sel = i === selectedIdx;
    const hov = hitTest(mx, my, cx, cy, cW, cH);

    // Card background
    ctx.fillStyle   = sel ? 'rgba(140,20,0,0.22)' : 'rgba(10,12,20,0.92)';
    roundRect(ctx, cx, cy, cW, cH, _p(7), true, false);
    ctx.strokeStyle = sel ? '#ff4400' : (hov ? '#551100' : '#181c28');
    ctx.lineWidth   = sel ? 2.5 : 1;
    roundRect(ctx, cx, cy, cW, cH, _p(7), false, true);

    // Mini-map (top 46% of card)
    const mmH = Math.round(cH * 0.46);
    _minimap(def, cx + _p(5), cy + _p(5), cW - _p(10), mmH - _p(5));

    // Track name
    const tY  = cy + mmH + _p(5);
    const nSz = Math.min(_p(12), cW * 0.092);
    ctx.fillStyle = sel ? '#ff6600' : '#eee';
    ctx.font      = `bold ${nSz}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(def.name, cx + cW / 2, tY);

    // Subtitle
    const sSz = Math.min(_p(9), cW * 0.070);
    ctx.fillStyle = '#778'; ctx.font = `${sSz}px monospace`;
    ctx.fillText(def.subtitle, cx + cW / 2, tY + nSz + _p(2));

    // Selected checkmark
    if (sel) {
      ctx.fillStyle = '#ff4400'; ctx.font = `bold ${_p(10)}px monospace`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('✓', cx + cW - _p(6), cy + _p(5));
    }

    if (hov && clicked) action = { type: 'SELECT', idx: i };
  });

  // Buttons
  const bW = Math.min(W * 0.30, _p(160));
  if (_btn('◀  BACK', gap, BTN_Y, bW, BTN_H, mx, my, '#445566', BTN_H * 0.36) && clicked) action = { type: 'BACK' };
  if (_btn('NEXT  ▶', W - bW - gap, BTN_Y, bW, BTN_H, mx, my, '#cc2200', BTN_H * 0.38) && clicked && !action) action = { type: 'NEXT' };

  return action;
}

function _minimap(def, x, y, w, h) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#090c14'; ctx.fillRect(x, y, w, h);
  const pts = []; let px = 0, py = 0, angle = -Math.PI / 2;
  const sc  = Math.min(w, h) / 280;
  pts.push([px, py]);
  for (const sec of def.sections) {
    const cr = sec.curve * 0.045;
    for (let s = 0; s < sec.len; s += 3) {
      angle += cr * 3; px += Math.cos(angle) * 3 * sc; py += Math.sin(angle) * 3 * sc; pts.push([px, py]);
    }
  }
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const ox = x + w/2 - (Math.min(...xs)+Math.max(...xs))/2;
  const oy = y + h/2 - (Math.min(...ys)+Math.max(...ys))/2;
  ctx.strokeStyle = '#b04000'; ctx.lineWidth = _p(3); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([px2,py2],i) => i===0?ctx.moveTo(px2+ox,py2+oy):ctx.lineTo(px2+ox,py2+oy)); ctx.stroke();
  ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(pts[0][0]+ox, pts[0][1]+oy, _p(4), 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ─────────────────────────────────────────────
//  DIFFICULTY SELECT
//  2×2 card grid (mobile) / 1×4 row (desktop)
//  Cards:   H*0.14 → H*0.64
//  Buttons: H*0.67 → H*0.78
// ─────────────────────────────────────────────
function renderDifficultySelect(W, H, mx, my, clicked, selectedDiff) {
  _bg();
  _hdr('SELECT DIFFICULTY', H * 0.07);

  const AREA_Y = H * 0.14;
  const AREA_H = H * 0.50;
  const BTN_Y  = H * 0.67;
  const BTN_H  = H * 0.11;
  const gap    = _p(8);

  const diffs   = ['easy', 'medium', 'hard', 'asian'];
  const cCols   = _mob() ? 2 : 4;
  const cRows   = Math.ceil(diffs.length / cCols);
  const cW      = (W - gap * (cCols + 1)) / cCols;
  const cH      = (AREA_H - gap * (cRows + 1)) / cRows;

  // Difficulty theme accent colors
  const diffColors = { easy: '#00aa44', medium: '#cc8800', hard: '#cc2200', asian: '#8800cc' };

  let action = null;

  diffs.forEach((diff, i) => {
    const col  = i % cCols;
    const row  = Math.floor(i / cCols);
    const cx   = gap + col * (cW + gap);
    const cy   = AREA_Y + gap + row * (cH + gap);
    const def  = DIFFICULTY_DEFS[diff];
    const sel  = diff === selectedDiff;
    const hov  = hitTest(mx, my, cx, cy, cW, cH);
    const acc  = diffColors[diff] || '#cc2200';

    // Card — selected bg tinted with difficulty accent colour
    const selBg  = { '#00aa44': 'rgba(0,80,30,0.28)', '#cc8800': 'rgba(100,60,0,0.28)', '#8800cc': 'rgba(60,0,100,0.28)' };
    ctx.fillStyle = sel ? (selBg[acc] || 'rgba(100,10,0,0.28)') : 'rgba(10,12,20,0.92)';
    roundRect(ctx, cx, cy, cW, cH, _p(7), true, false);
    ctx.strokeStyle = sel ? acc : (hov ? '#333' : '#181c28');
    ctx.lineWidth   = sel ? 2.5 : 1;
    roundRect(ctx, cx, cy, cW, cH, _p(7), false, true);

    // Difficulty name
    const nameSz = Math.min(_p(14), cW * 0.095);
    ctx.fillStyle = sel ? acc : '#eee';
    ctx.font      = `bold ${nameSz}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(def.name, cx + cW / 2, cy + _p(10));

    // Weather icons (large)
    const iconSz = Math.min(_p(22), cW * 0.14);
    ctx.font = `${iconSz}px serif`;
    ctx.fillText(def.icons, cx + cW / 2, cy + _p(10) + nameSz + _p(6));

    // AI count
    const aiSz = Math.min(_p(9), cW * 0.065);
    ctx.fillStyle = '#778'; ctx.font = `${aiSz}px monospace`;
    ctx.fillText(def.aiCount + ' rivals', cx + cW / 2, cy + _p(10) + nameSz + iconSz + _p(10));

    // Description
    const descSz = Math.min(_p(8), cW * 0.060);
    ctx.fillStyle = '#556'; ctx.font = `${descSz}px monospace`;
    const descY = cy + _p(10) + nameSz + iconSz + aiSz + _p(14);
    // Wrap description into 2 lines at most
    const words = def.desc.split(' ');
    let line1 = '', line2 = '';
    ctx.font = `${descSz}px monospace`;
    for (const w of words) {
      if (ctx.measureText(line1 + ' ' + w).width < cW - _p(10)) line1 += (line1 ? ' ' : '') + w;
      else line2 += (line2 ? ' ' : '') + w;
    }
    ctx.fillText(line1, cx + cW / 2, descY);
    if (line2) ctx.fillText(line2, cx + cW / 2, descY + descSz * 1.4);

    // Selected checkmark
    if (sel) {
      ctx.fillStyle = acc; ctx.font = `bold ${_p(11)}px monospace`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('✓', cx + cW - _p(7), cy + _p(6));
    }

    if (hov && clicked) action = { difficulty: diff };
  });

  // Navigation
  const bW = Math.min(W * 0.30, _p(160));
  if (_btn('◀  BACK', gap, BTN_Y, bW, BTN_H, mx, my, '#445566', BTN_H * 0.36) && clicked && !action) action = 'BACK';
  if (_btn('NEXT  ▶', W - bW - gap, BTN_Y, bW, BTN_H, mx, my, '#cc2200', BTN_H * 0.38) && clicked && !action) action = 'NEXT';

  return action;
}

// ── Vehicle preview dispatcher (used by VEHICLE_SELECT and CAR_CUSTOMIZE) ──
function _drawVehiclePreview(type, cx, cy, size, color, decal) {
  switch (type) {
    case 'f1v2':   drawF1V2Sprite  (cx, cy, size, color, decal); break;
    case 'nascar': drawNASCARSprite(cx, cy, size, color, decal); break;
    case 'moto':   drawMotoSprite  (cx, cy, size, color, decal); break;
    default:       drawF1Sprite    (cx, cy, size, color, decal); break;
  }
}

// ─────────────────────────────────────────────
//  VEHICLE SELECT
//  Cards: H*0.14 → H*0.64   (2×2 grid)
//  Buttons: H*0.67 → H*0.78
// ─────────────────────────────────────────────
function renderVehicleSelect(W, H, mx, my, clicked, selectedType) {
  _bg();
  _hdr('SELECT VEHICLE', H * 0.07);

  const AREA_Y = H * 0.14;
  const AREA_H = H * 0.50;
  const BTN_Y  = H * 0.67;
  const BTN_H  = H * 0.11;
  const gap    = _p(8);
  const cCols  = 2;
  const cRows  = 2;
  const cW     = (W - gap * (cCols + 1)) / cCols;
  const cH     = (AREA_H - gap * (cRows + 1)) / cRows;

  const types = ['f1', 'f1v2', 'nascar', 'moto'];
  let action = null;

  types.forEach((type, i) => {
    const col = i % cCols;
    const row = Math.floor(i / cCols);
    const cx  = gap + col * (cW + gap);
    const cy  = AREA_Y + gap + row * (cH + gap);
    const veh = VEHICLE_DEFS[type];
    const sel = type === selectedType;
    const hov = hitTest(mx, my, cx, cy, cW, cH);

    // Card background
    ctx.fillStyle   = sel ? 'rgba(140,20,0,0.22)' : 'rgba(10,12,20,0.92)';
    roundRect(ctx, cx, cy, cW, cH, _p(7), true, false);
    ctx.strokeStyle = sel ? '#ff4400' : (hov ? '#551100' : '#181c28');
    ctx.lineWidth   = sel ? 2.5 : 1;
    roundRect(ctx, cx, cy, cW, cH, _p(7), false, true);

    // Vehicle sprite preview (top ~50% of card)
    const prevH  = cH * 0.50;
    const sprSz  = Math.min(cW * 0.38, prevH * 0.82, _p(58));
    ctx.save();
    ctx.beginPath(); ctx.rect(cx + 2, cy + 2, cW - 4, prevH - 2); ctx.clip();
    _drawVehiclePreview(type, cx + cW / 2, cy + prevH * 0.54, sprSz, '#e8001c', 'stripes');
    ctx.restore();

    // Vehicle name
    const nameSz = Math.min(_p(12), cW * 0.085);
    ctx.fillStyle = sel ? '#ff6600' : '#eee';
    ctx.font      = `bold ${nameSz}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(veh.name, cx + cW / 2, cy + prevH + _p(4));

    // Description
    const descSz = Math.min(_p(8), cW * 0.060);
    ctx.fillStyle = '#667'; ctx.font = `${descSz}px monospace`;
    ctx.fillText(veh.desc, cx + cW / 2, cy + prevH + nameSz + _p(5));

    // Stat bars (SPEED / HANDLING / ACCEL) — 3 rows of segmented bars
    const barAreaY = cy + prevH + nameSz + descSz + _p(9);
    const barAreaH = cy + cH - _p(7) - barAreaY;
    const barH     = Math.max(4, Math.floor(barAreaH / 4));
    const barGap   = Math.max(0, Math.floor((barAreaH - barH * 3) / 2));
    const bx       = cx + _p(6);
    const bw       = cW - _p(12);
    const lblW     = Math.min(_p(13), bw * 0.28);
    const lblSz    = Math.min(_p(7), barH * 0.70);
    const segN     = 5;

    [
      { lbl: 'SPD', val: veh.stats.speed,    col: '#ff5522' },
      { lbl: 'HDL', val: veh.stats.handling, col: '#4499ff' },
      { lbl: 'ACC', val: veh.stats.accel,    col: '#44cc55' },
    ].forEach((s, si) => {
      const by = barAreaY + si * (barH + barGap);
      ctx.fillStyle = '#556'; ctx.font = `${lblSz}px monospace`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(s.lbl, bx, by + barH / 2);
      const segAreaW = bw - lblW;
      const segW     = segAreaW / segN;
      const segFill  = Math.max(2, segW - _p(1.5));
      for (let seg = 0; seg < segN; seg++) {
        const sx = bx + lblW + seg * segW;
        ctx.fillStyle = seg < s.val ? s.col : '#1a1c24';
        roundRect(ctx, sx, by, segFill, barH, _p(1), true, false);
      }
    });

    // Selected checkmark
    if (sel) {
      ctx.fillStyle = '#ff4400'; ctx.font = `bold ${_p(11)}px monospace`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('✓', cx + cW - _p(7), cy + _p(6));
    }

    if (hov && clicked) action = { vehicleType: type };
  });

  // Navigation buttons
  const bW = Math.min(W * 0.30, _p(160));
  if (_btn('◀  BACK', gap, BTN_Y, bW, BTN_H, mx, my, '#445566', BTN_H * 0.36) && clicked && !action) action = 'BACK';
  if (_btn('NEXT  ▶', W - bW - gap, BTN_Y, bW, BTN_H, mx, my, '#cc2200', BTN_H * 0.38) && clicked && !action) action = 'NEXT';

  return action;
}

// ─────────────────────────────────────────────
//  CAR CUSTOMISE
//  Content: H*0.10 → H*0.62
//  Buttons: H*0.64 → H*0.76
// ─────────────────────────────────────────────
const CAR_COLORS = [
  { hex: '#e8001c' }, { hex: '#ff6600' }, { hex: '#0033cc' },
  { hex: '#ffcc00' }, { hex: '#ff44aa' }, { hex: '#dddddd' },
];

function renderCarCustomize(W, H, mx, my, clicked, vehicleType) {
  const vehType = carConfig.vehicleType || 'f1';
  const veh     = VEHICLE_DEFS[vehType] || VEHICLE_DEFS.f1;
  _bg();
  _hdr('CUSTOMISE – ' + veh.name, H * 0.07);

  const BTN_Y = H * 0.64;
  const BTN_H = H * 0.12;

  // ── Split: left = car preview, right = controls ──────────────────────
  const splitX = _mob() ? W * 0.38 : W * 0.40;
  const ctrlX  = splitX + _p(10);
  const ctrlW  = W - ctrlX - _p(10);
  const topY   = H * 0.11;
  const availH = BTN_Y - topY - _p(10);

  // Vehicle sprite (dispatch to correct draw fn)
  const carSz = Math.min(splitX * 0.52, availH * 0.38, _p(90));
  const carCX  = splitX / 2;
  const carCY  = topY + availH * 0.32;
  _drawVehiclePreview(vehType, carCX, carCY, carSz, carConfig.color, carConfig.decal);

  // Cockpit nose preview — only for F1 Classic (open cockpit)
  // LMP1 (f1v2) has a closed canopy, NASCAR/moto don't have a traditional nose
  if (vehType === 'f1') {
    const npW = splitX * 0.72, npH = npW * 0.44;
    const npX = splitX / 2 - npW / 2, npY = carCY + carSz * 0.32 + _p(5);
    _nosePrev(npX, npY, npW, npH);
  }

  // ── Controls ──────────────────────────────────────────────────────────
  // Colour label
  const lblSz = Math.min(_p(11), H * 0.032);
  ctx.fillStyle = '#778'; ctx.font = `${lblSz}px monospace`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('COLOUR', ctrlX, topY);

  // Swatch grid – always 2 rows of 3 on mobile, 1 row of 6 on desktop
  const swCols  = _mob() ? 3 : 6;
  const swRows  = Math.ceil(CAR_COLORS.length / swCols);
  const swGap   = _p(5);
  const swSz    = Math.min((ctrlW - swGap * (swCols-1)) / swCols, availH * 0.13, _p(42));
  const swY0    = topY + lblSz + _p(5);
  let colAction = null;

  CAR_COLORS.forEach((c, i) => {
    const col = i % swCols, row = Math.floor(i / swCols);
    const sx  = ctrlX + col * (swSz + swGap);
    const sy  = swY0  + row * (swSz + swGap);
    const sel = carConfig.color === c.hex;
    const hov = hitTest(mx, my, sx - 2, sy - 2, swSz + 4, swSz + 4);
    ctx.fillStyle = c.hex; roundRect(ctx, sx, sy, swSz, swSz, _p(4), true, false);
    if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; roundRect(ctx, sx-3, sy-3, swSz+6, swSz+6, _p(6), false, true); }
    else if (hov) { ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; roundRect(ctx, sx, sy, swSz, swSz, _p(4), false, true); }
    if (hov && clicked) colAction = c.hex;
  });

  // Decal label + buttons
  const decalLblY = swY0 + swRows * (swSz + swGap) + _p(10);
  ctx.fillStyle = '#778'; ctx.font = `${lblSz}px monospace`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('DECAL', ctrlX, decalLblY);

  const dY  = decalLblY + lblSz + _p(5);
  const dBW = (ctrlW - swGap) / 2;
  const dBH = Math.min(availH * 0.14, _p(36));
  ['solid', 'stripes'].forEach((d, i) => {
    const dx = ctrlX + i * (dBW + swGap), dy = dY;
    const sel = carConfig.decal === d, hov = hitTest(mx, my, dx, dy, dBW, dBH);
    ctx.fillStyle = sel ? 'rgba(160,24,0,0.40)' : 'rgba(10,12,20,0.88)';
    roundRect(ctx, dx, dy, dBW, dBH, _p(5), true, false);
    ctx.strokeStyle = sel ? '#ff4400' : '#282830'; ctx.lineWidth = sel ? 2 : 1;
    roundRect(ctx, dx, dy, dBW, dBH, _p(5), false, true);
    ctx.fillStyle = sel ? '#fff' : '#778';
    ctx.font = `bold ${Math.min(_p(11), dBH*0.38)}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(d.toUpperCase(), dx + dBW / 2, dy + dBH / 2);
    if (hov && clicked) colAction = { decal: d };
  });

  // Buttons
  const bW = Math.min(W * 0.28, _p(150));
  let action = colAction;
  if (_btn('◀  BACK',  _p(10), BTN_Y, bW, BTN_H, mx, my, '#445566', BTN_H * 0.34) && clicked) action = action || 'BACK';
  if (_btn('RACE!  ▶', W - bW - _p(10), BTN_Y, bW, BTN_H, mx, my, '#cc2200', BTN_H * 0.38) && clicked) action = 'START';

  return action;
}

function _nosePrev(x, y, w, h) {
  ctx.fillStyle = '#0e0e0e';
  ctx.beginPath();
  ctx.moveTo(x,y+h); ctx.lineTo(x+w,y+h); ctx.lineTo(x+w*0.84,y+h*0.50); ctx.lineTo(x+w*0.16,y+h*0.50);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = carConfig.color; ctx.lineWidth = _p(2);
  ctx.beginPath(); ctx.moveTo(x+w*0.16,y+h*0.50); ctx.lineTo(x+w*0.84,y+h*0.50); ctx.stroke();
  ctx.fillStyle = carConfig.color;
  ctx.beginPath(); ctx.moveTo(x+w*0.30,y+h); ctx.lineTo(x+w*0.70,y+h); ctx.lineTo(x+w*0.58,y+h*0.58); ctx.lineTo(x+w*0.42,y+h*0.58); ctx.closePath(); ctx.fill();
}

// ─────────────────────────────────────────────
//  COUNTDOWN
// ─────────────────────────────────────────────
function renderCountdown(W, H, t) {
  const phase = Math.floor(t); if (phase <= 0) return;
  const frac  = t - phase;
  const text  = phase===1?'3':phase===2?'2':phase===3?'1':'GO!';
  const color = phase===1?'#ffcc00':phase===2?'#ff8800':phase===3?'#ff2200':'#00ff88';
  const alpha = phase >= 4 ? Math.max(0, 1-(t-4)*3.5) : Math.min(1, frac*5);
  const zoom  = 1 + (1-frac)*0.55;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.translate(W/2, H*0.44); ctx.scale(zoom, zoom);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.arc(0,0,H*0.12,0,Math.PI*2); ctx.fill();
  ctx.shadowColor = color; ctx.shadowBlur = _p(22);
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.min(H*0.18,W*0.13)}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0); ctx.restore();
}

// ─────────────────────────────────────────────
//  PAUSE MENU
//  Dialog sits in H*0.18 → H*0.78
// ─────────────────────────────────────────────
function renderPause(W, H, mx, my, clicked) {
  ctx.fillStyle = 'rgba(0,0,8,0.76)'; ctx.fillRect(0, 0, W, H);

  const dlgH = H * 0.60;
  const dlgW = Math.min(W * 0.62, _p(330));
  const dlgX = W/2 - dlgW/2, dlgY = H*0.18;

  ctx.fillStyle = 'rgba(5,6,14,0.96)';
  roundRect(ctx, dlgX, dlgY, dlgW, dlgH, _p(10), true, false);
  ctx.strokeStyle = '#cc2200'; ctx.lineWidth = 1.5;
  roundRect(ctx, dlgX, dlgY, dlgW, dlgH, _p(10), false, true);

  ctx.fillStyle = '#ff4400'; ctx.font = `bold ${_p(23)}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', W/2, dlgY + dlgH*0.14);

  const bW = dlgW * 0.80, bX = W/2 - bW/2;
  const bH = dlgH * 0.18;
  const gap = dlgH * 0.04;

  let action = null;
  let by = dlgY + dlgH * 0.25;
  if (_btn('▶  RESUME',       bX, by, bW, bH, mx, my, '#00aa44', bH*0.38) && clicked) action = 'RESUME';
  by += bH + gap;
  const vLabel = (typeof viewMode!=='undefined'&&viewMode===VIEW_1ST)?'🎥 SWITCH → 3RD PERSON':'🎥 SWITCH → 1ST PERSON';
  if (_btn(vLabel, bX, by, bW, bH, mx, my, '#226688', bH*0.32) && clicked) { if(typeof toggleView==='function') toggleView(); }
  by += bH + gap;
  if (_btn('⌂  QUIT TO MENU', bX, by, bW, bH, mx, my, '#445566', bH*0.36) && clicked) action = 'MENU';

  return action;
}

// ─────────────────────────────────────────────
//  FINISH
//  Flag:    H*0.00 → H*0.14
//  Content: H*0.14 → H*0.64
//  Buttons: H*0.66 → H*0.78
// ─────────────────────────────────────────────
function renderFinish(W, H, mx, my, clicked, data) {
  _bg();

  // Chequered flag band
  const flagH = H * 0.14;
  const sqSz  = Math.max(12, Math.floor(W / 28));
  for (let fx = 0; fx < W; fx += sqSz)
    for (let fy = 0; fy < flagH; fy += sqSz) {
      ctx.fillStyle = (Math.floor(fx/sqSz)+Math.floor(fy/sqSz))%2===0 ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.88)';
      ctx.fillRect(fx, fy, sqSz, sqSz);
    }
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(0,0,W,flagH);

  // Position badge
  const posC = ['#ffd700','#c0c0c0','#cd7f32','#aaa'][Math.min(data.position-1,3)];
  const bR   = Math.min(H*0.09, W*0.06, _p(46));
  const bCX  = W/2, bCY = flagH + bR + _p(8);
  ctx.fillStyle = posC; ctx.beginPath(); ctx.arc(bCX,bCY,bR,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=_p(2.5); ctx.beginPath(); ctx.arc(bCX,bCY,bR,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='#000'; ctx.font=`bold ${Math.round(bR*0.74)}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(ordinal(data.position),bCX,bCY);

  // Headline
  const hdY = bCY + bR + _p(10);
  const hdSz = Math.min(_p(22), W*0.050);
  ctx.fillStyle='#fff'; ctx.font=`bold ${hdSz}px monospace`; ctx.textAlign='center'; ctx.textBaseline='top';
  ctx.fillText('RACE FINISHED!', W/2, hdY);

  // Stats panel
  const sSz  = Math.min(_p(12), W*0.026);
  const sLH  = sSz * 1.9;
  const sPW  = Math.min(W*0.72, _p(290));
  const sPH  = (data.lapTimes.length+2)*sLH + _p(20);
  const sPX  = W/2-sPW/2, sPY = hdY+hdSz+_p(8);
  ctx.fillStyle='rgba(0,0,0,0.55)'; roundRect(ctx,sPX,sPY,sPW,sPH,_p(7),true,false);
  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1; roundRect(ctx,sPX,sPY,sPW,sPH,_p(7),false,true);

  const stats=[['Total Time',formatTime(data.totalTime)],['Best Lap',formatTime(Math.min(...data.lapTimes))],
               ...data.lapTimes.map((lt,i)=>[`Lap ${i+1}`,formatTime(lt)])];
  ctx.font=`${sSz}px monospace`;
  stats.forEach(([l,v],ri)=>{
    const ry=sPY+_p(10)+ri*sLH;
    ctx.fillStyle='#778'; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText(l,sPX+_p(12),ry);
    ctx.fillStyle='#ffcc00'; ctx.textAlign='right'; ctx.fillText(v,sPX+sPW-_p(12),ry);
  });

  // Buttons
  const fbH = H*0.11, fbW = Math.min(W*0.32,_p(170)), fbY = H*0.66;
  let action=null;
  if(_btn('▶  PLAY AGAIN', _p(10), fbY, fbW, fbH, mx,my,'#cc2200',fbH*0.36)&&clicked) action='AGAIN';
  if(_btn('⌂  MAIN MENU',  W-fbW-_p(10),fbY,fbW,fbH,mx,my,'#445566',fbH*0.36)&&clicked) action='MENU';
  return action;
}
