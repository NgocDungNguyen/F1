// ─────────────────────────────────────────────
//  PSEUDO-3D ROAD RENDERER
// ─────────────────────────────────────────────

let _projected    = [];
let horizonFrac   = HORIZON_FRAC;

// ── Project all visible segments ─────────────────────────────────────────
function projectRoad(playerZ, effectivePlayerX, W, H) {
  if (!segments || segments.length === 0) return;

  const startIdx = Math.floor(playerZ) % TRACK_SEGMENTS;
  const segFrac  = playerZ - Math.floor(playerZ);
  const roadBase = H * (1 - horizonFrac);
  // Visibility scale: weather/night can shorten draw distance
  const visScale = (typeof _weatherVisibility !== 'undefined') ? _weatherVisibility : 1.0;
  const drawDist = Math.round(DRAW_DISTANCE * Math.max(0.35, visScale));

  _projected = [];
  let curveX = 0;

  for (let n = 1; n <= drawDist + 1; n++) {
    const segIdx = (startIdx + n - 1) % TRACK_SEGMENTS;
    const seg    = segments[segIdx];
    const z      = n - segFrac;
    const scale  = CAMERA_H / z;
    const screenY = H * horizonFrac + scale * roadBase;
    const centerX = W / 2 + (curveX - effectivePlayerX) * W * ROAD_HALF_NORM;
    const rHalf   = scale * W * ROAD_HALF_NORM;
    _projected[n] = { centerX, screenY, rHalf, scale, seg, curveX, n };
    curveX += seg.curve * CURVE_SCALE;
  }
}

// ── Sky + background ──────────────────────────────────────────────────────
function renderSkyAndBackground(W, H) {
  const def     = currentTrackDef;
  const horizon = Math.floor(H * horizonFrac);
  const camShift = player ? player.x * 14 : 0;

  // Night overlay modifies sky colours when weather system active
  const nightAlpha = (typeof weatherState !== 'undefined') ? weatherState.nightPhase * 0.5 : 0;
  const skyTop = def.skyTop || '#1a3a6a';
  const skyBot = def.skyBot || '#4a7ab8';

  const grad = ctx.createLinearGradient(0, 0, 0, horizon);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(1, skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, horizon);

  if (nightAlpha > 0.05) {
    ctx.fillStyle = `rgba(0,0,10,${nightAlpha})`;
    ctx.fillRect(0, 0, W, horizon);
  }

  switch (def.bgObjects) {
    case 'buildings': _drawBuildings(W, horizon, camShift); break;
    case 'mountains': _drawMountains(W, horizon, camShift); break;
    case 'jungle':    _drawJungle(W, horizon, camShift);    break;
    default:          _drawForest(W, horizon, camShift);    break;
  }
}

function _drawBuildings(W, horizon, shift) {
  const bdata = [
    [0.04,0.06,0.30],[0.11,0.04,0.48],[0.17,0.07,0.26],
    [0.25,0.05,0.52],[0.32,0.06,0.38],[0.56,0.05,0.46],
    [0.63,0.07,0.30],[0.71,0.04,0.55],[0.77,0.06,0.36],
    [0.84,0.05,0.42],[0.91,0.08,0.24],
  ];
  bdata.forEach(([bx, bw, bh]) => {
    const x = bx * W - shift, h = bh * horizon, y = horizon - h, w = bw * W;
    ctx.fillStyle = '#0d1e38'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffee88';
    for (let wy = y + 5; wy < horizon - 4; wy += 11)
      for (let wx = x + 5; wx < x + w - 4; wx += 9) {
        const seed = Math.sin(wx * 127.1 + wy * 311.7) * 43758.5;
        if ((seed - Math.floor(seed)) > 0.38) ctx.fillRect(wx, wy, 4, 5);
      }
  });
}

function _drawForest(W, horizon, shift) {
  ctx.fillStyle = '#1e4a1e';
  ctx.beginPath(); ctx.moveTo(0, horizon);
  for (let x = 0; x <= W + 40; x += 20) {
    const y = horizon - Math.sin((x-shift)*0.011)*horizon*0.22
                      - Math.sin((x-shift)*0.029)*horizon*0.09;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0f300f';
  [0.02,0.07,0.13,0.19,0.26,0.33,0.60,0.67,0.73,0.80,0.87,0.94].forEach(tx => {
    const x = tx * W - shift * 0.7, h = horizon * 0.22;
    ctx.beginPath(); ctx.moveTo(x, horizon-h); ctx.lineTo(x-11, horizon); ctx.lineTo(x+11, horizon);
    ctx.closePath(); ctx.fill();
  });
}

// ── NEW: Mountain range background ────────────────────────────────────────
function _drawMountains(W, horizon, shift) {
  // Far mountain range (light gray peaks)
  ctx.fillStyle = '#2a2838';
  ctx.beginPath(); ctx.moveTo(0, horizon);
  for (let x = 0; x <= W + 60; x += 30) {
    const y = horizon - Math.sin((x - shift * 0.3) * 0.007) * horizon * 0.55
                      - Math.abs(Math.sin((x - shift * 0.3) * 0.021)) * horizon * 0.22;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();

  // Mid mountain range (darker rocky silhouette)
  ctx.fillStyle = '#1a1428';
  ctx.beginPath(); ctx.moveTo(0, horizon);
  for (let x = 0; x <= W + 40; x += 20) {
    const y = horizon - Math.sin((x - shift * 0.6) * 0.011) * horizon * 0.38
                      - Math.abs(Math.sin((x - shift * 0.6) * 0.033)) * horizon * 0.14;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();

  // Snow caps on highest peaks (white dots / patches near peaks)
  ctx.fillStyle = 'rgba(240,240,255,0.45)';
  for (let x = 20; x < W; x += 80) {
    const sx = x - shift * 0.6;
    const peakY = horizon - Math.abs(Math.sin(sx * 0.011)) * horizon * 0.38
                            - Math.abs(Math.sin(sx * 0.033)) * horizon * 0.14;
    if (peakY < horizon * 0.45) {  // only cap if peak is high enough
      ctx.beginPath(); ctx.ellipse(x, peakY + 8, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Near rocky outcrops
  ctx.fillStyle = '#100c1a';
  [0.05,0.18,0.38,0.55,0.70,0.85,0.95].forEach(tx => {
    const x = tx * W - shift * 0.9;
    const h = horizon * 0.28;
    ctx.beginPath(); ctx.moveTo(x - 20, horizon); ctx.lineTo(x, horizon - h); ctx.lineTo(x + 20, horizon);
    ctx.closePath(); ctx.fill();
  });
}

// ── NEW: Amazon jungle background ─────────────────────────────────────────
function _drawJungle(W, horizon, shift) {
  // Deep background canopy layer (dark green)
  ctx.fillStyle = '#0a2010';
  ctx.fillRect(0, 0, W, horizon);

  // Mid canopy (layered green mass)
  ctx.fillStyle = '#0d3018';
  ctx.beginPath(); ctx.moveTo(0, horizon);
  for (let x = 0; x <= W + 40; x += 15) {
    const y = horizon - Math.abs(Math.sin((x - shift * 0.4) * 0.014)) * horizon * 0.42
                      - Math.sin((x - shift * 0.4) * 0.008) * horizon * 0.15;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();

  // Front canopy (brighter green blobs)
  ctx.fillStyle = '#155a20';
  [0.02,0.09,0.16,0.24,0.31,0.42,0.53,0.62,0.71,0.80,0.89,0.96].forEach(tx => {
    const x  = tx * W - shift * 0.7;
    const h  = horizon * (0.18 + Math.abs(Math.sin(tx * 37)) * 0.12);
    const hw = 22 + Math.abs(Math.sin(tx * 53)) * 18;
    ctx.beginPath(); ctx.ellipse(x, horizon - h * 0.6, hw, h * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  });

  // Hanging vines (thin vertical lines from horizon)
  ctx.strokeStyle = '#0a2810'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    const vx = ((i / 12 + 0.04) * W - shift * 0.5 + W) % W;
    const vy = horizon * (0.55 + Math.sin(vx * 0.04) * 0.1);
    const vlen = horizon * (0.25 + Math.sin(vx * 0.07) * 0.08);
    ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + Math.sin(vx) * 8, vy + vlen); ctx.stroke();
  }

  // Bright tropical flower dots
  ctx.fillStyle = 'rgba(255,160,30,0.5)';
  for (let i = 0; i < 8; i++) {
    const fx = ((i * 137 + 50) % W) - shift * 0.3;
    const fy = horizon * (0.45 + Math.sin(i * 0.9) * 0.12);
    ctx.beginPath(); ctx.arc(fx, fy, 4, 0, Math.PI * 2); ctx.fill();
  }
}

// ── Road scanline renderer ─────────────────────────────────────────────────
function renderRoad(W, H) {
  if (!_projected || _projected.length === 0) return;

  const horizon  = Math.floor(H * horizonFrac);
  const roadBase = H - horizon;

  ctx.fillStyle = (currentTrackDef && currentTrackDef.hillColor) || '#2d7a2d';
  ctx.fillRect(0, horizon, W, H - horizon);

  const ePX = _effectivePlayerX !== undefined ? _effectivePlayerX : (player ? player.x : 0);
  const visScale = (typeof _weatherVisibility !== 'undefined') ? _weatherVisibility : 1.0;
  const drawDist = Math.round(DRAW_DISTANCE * Math.max(0.35, visScale));

  for (let y = H - 1; y > horizon; y--) {
    const dy         = y - horizon;
    const z          = CAMERA_H * roadBase / dy;
    const n          = clamp(Math.round(z), 1, drawDist);
    const p          = _projected[n];
    if (!p) continue;

    const scale      = dy / roadBase;
    const roadHalfPx = scale * W * ROAD_HALF_NORM;
    const seg        = p.seg;
    const cx         = W / 2 + (p.curveX - ePX) * W * ROAD_HALF_NORM;
    const roadL      = cx - roadHalfPx;
    const roadR      = cx + roadHalfPx;

    // Shortcut zones: slightly wider, no rumble strip, dashed edge
    const isShortcut = seg.isShortcut;
    const effectiveHalf = isShortcut ? roadHalfPx * 1.12 : roadHalfPx;
    const sL = cx - effectiveHalf, sR = cx + effectiveHalf;
    const rumW = isShortcut ? 0 : Math.max(2, roadHalfPx * 0.13);
    const dashW = Math.max(1, roadHalfPx * 0.022);

    // Grass
    ctx.fillStyle = seg.grassColor;
    ctx.fillRect(0, y, W, 1);

    // Left rumble (skip for shortcuts)
    if (!isShortcut) {
      const lRL = Math.max(0, sL - rumW), lRR = Math.min(W, sL);
      if (lRR > lRL) { ctx.fillStyle = seg.rumbleColor; ctx.fillRect(lRL, y, lRR - lRL, 1); }
    }

    // Road surface
    const rL = Math.max(0, sL), rR = Math.min(W, sR);
    if (rR > rL) {
      if (seg.isFinish) {
        const sq = Math.max(4, roadHalfPx / 5);
        ctx.fillStyle = (Math.floor(cx/sq) + Math.floor(y/sq)) % 2 === 0 ? '#fff' : '#000';
      } else {
        ctx.fillStyle = seg.roadColor;
      }
      ctx.fillRect(rL, y, rR - rL, 1);
    }

    // Centre marking
    if (!seg.isFinish && rR > rL) {
      if (isShortcut) {
        // Shortcut: dotted edge lines instead of center dash
        if (seg.index % 6 < 2) {
          ctx.fillStyle = 'rgba(255,220,100,0.6)';
          const dL2 = Math.max(rL, sL + 2), dR2 = Math.min(rR, sL + dashW * 3);
          const dL3 = Math.max(rL, sR - dashW * 3), dR3 = Math.min(rR, sR - 2);
          if (dR2 > dL2) ctx.fillRect(dL2, y, dR2 - dL2, 1);
          if (dR3 > dL3) ctx.fillRect(dL3, y, dR3 - dL3, 1);
        }
      } else if (seg.index % 4 < 2) {
        ctx.fillStyle = '#fff';
        const dL = Math.max(rL, cx - dashW), dR = Math.min(rR, cx + dashW);
        if (dR > dL) ctx.fillRect(dL, y, dR - dL, 1);
      }
    }

    // Right rumble (skip for shortcuts)
    if (!isShortcut) {
      const rRL = Math.max(0, sR), rRR = Math.min(W, sR + rumW);
      if (rRR > rRL) { ctx.fillStyle = seg.rumbleColor; ctx.fillRect(rRL, y, rRR - rRL, 1); }
    }
  }
}

// Shared variables written by game.js
let _effectivePlayerX = 0;
