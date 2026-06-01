// ─────────────────────────────────────────────
//  PSEUDO-3D ROAD RENDERER
// ─────────────────────────────────────────────
//
//  Scanline-based rendering:
//    For each screen row y, compute depth z, look up segment data,
//    draw grass + road + rumble in a 1-px strip.
//    No painter's-algorithm rounding bugs.
//
//  horizonFrac can be changed per-frame by game.js for view switching.
// ─────────────────────────────────────────────

let _projected    = [];                 // shared with sprites.js
let horizonFrac   = HORIZON_FRAC;      // can be set by game.js each frame

// ── Project all visible segments ─────────────────────────────────────────
// effectivePlayerX = player.x + cameraLean  (lean = steering look-ahead)
function projectRoad(playerZ, effectivePlayerX, W, H) {
  if (!segments || segments.length === 0) return;

  const startIdx = Math.floor(playerZ) % TRACK_SEGMENTS;
  const segFrac  = playerZ - Math.floor(playerZ);
  const roadBase = H * (1 - horizonFrac);

  _projected = [];
  let curveX = 0;

  for (let n = 1; n <= DRAW_DISTANCE + 1; n++) {
    const segIdx = (startIdx + n - 1) % TRACK_SEGMENTS;
    const seg    = segments[segIdx];

    const z       = n - segFrac;
    const scale   = CAMERA_H / z;
    const screenY = H * horizonFrac + scale * roadBase;
    const centerX = W / 2 + (curveX - effectivePlayerX) * W * ROAD_HALF_NORM;
    const rHalf   = scale * W * ROAD_HALF_NORM;

    _projected[n] = { centerX, screenY, rHalf, scale, seg, curveX, n };
    curveX += seg.curve * CURVE_SCALE;
  }
}

// ── Sky + background ──────────────────────────────────────────────────────
function renderSkyAndBackground(W, H) {
  const def      = currentTrackDef;
  const horizon  = Math.floor(H * horizonFrac);
  const camShift = player ? player.x * 14 : 0;

  const grad = ctx.createLinearGradient(0, 0, 0, horizon);
  grad.addColorStop(0, def.skyTop || '#1a3a6a');
  grad.addColorStop(1, def.skyBot || '#4a7ab8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, horizon);

  if (def.bgObjects === 'buildings') _drawBuildings(W, horizon, camShift);
  else                               _drawForest(W, horizon, camShift);
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
    ctx.fillStyle = '#0d1e38';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffee88';
    for (let wy = y + 5; wy < horizon - 4; wy += 11) {
      for (let wx = x + 5; wx < x + w - 4; wx += 9) {
        const seed = Math.sin(wx * 127.1 + wy * 311.7) * 43758.5;
        if ((seed - Math.floor(seed)) > 0.38) ctx.fillRect(wx, wy, 4, 5);
      }
    }
  });
}

function _drawForest(W, horizon, shift) {
  ctx.fillStyle = '#1e4a1e';
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  for (let x = 0; x <= W + 40; x += 20) {
    const y = horizon
            - Math.sin((x - shift) * 0.011) * horizon * 0.22
            - Math.sin((x - shift) * 0.029) * horizon * 0.09;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#0f300f';
  [0.02,0.07,0.13,0.19,0.26,0.33,0.60,0.67,0.73,0.80,0.87,0.94].forEach(tx => {
    const x = tx * W - shift * 0.7, h = horizon * 0.22;
    ctx.beginPath();
    ctx.moveTo(x, horizon - h); ctx.lineTo(x - 11, horizon); ctx.lineTo(x + 11, horizon);
    ctx.closePath(); ctx.fill();
  });
}

// ── Road scanline renderer ─────────────────────────────────────────────────
function renderRoad(W, H) {
  if (!_projected || _projected.length === 0) return;

  const horizon  = Math.floor(H * horizonFrac);
  const roadBase = H - horizon;

  ctx.fillStyle = (currentTrackDef && currentTrackDef.hillColor) || '#2d7a2d';
  ctx.fillRect(0, horizon, W, H - horizon);

  const pxX = player ? player.x : 0;
  // Camera lean shifts road centre view (from game.js effectivePlayerX passed to projectRoad)
  // But scanline needs to use the SAME effectivePlayerX, so we read it from _projected[1]
  const projRef = _projected[1];
  if (!projRef) return;
  // Reconstruct what effectivePlayerX was: W/2 + (curveX_0 - ePX)*halfW = projRef.centerX
  // effectivePlayerX = (W/2 - projRef.centerX) / (W * ROAD_HALF_NORM) + projRef.curveX
  // Simpler: just read directly from a stored variable set by game.js
  const ePX = _effectivePlayerX !== undefined ? _effectivePlayerX : pxX;

  for (let y = H - 1; y > horizon; y--) {
    const dy         = y - horizon;
    const z          = CAMERA_H * roadBase / dy;
    const n          = clamp(Math.round(z), 1, DRAW_DISTANCE);
    const p          = _projected[n];
    if (!p) continue;

    const scale      = dy / roadBase;
    const roadHalfPx = scale * W * ROAD_HALF_NORM;
    const rumW       = Math.max(2, roadHalfPx * 0.13);
    const dashW      = Math.max(1, roadHalfPx * 0.022);
    const seg        = p.seg;

    // Road centre using stored curveX + effective camera position
    const cx    = W / 2 + (p.curveX - ePX) * W * ROAD_HALF_NORM;
    const roadL = cx - roadHalfPx;
    const roadR = cx + roadHalfPx;

    // Grass
    ctx.fillStyle = seg.grassColor;
    ctx.fillRect(0, y, W, 1);

    // Left rumble
    const lRL = Math.max(0, roadL - rumW), lRR = Math.min(W, roadL);
    if (lRR > lRL) { ctx.fillStyle = seg.rumbleColor; ctx.fillRect(lRL, y, lRR - lRL, 1); }

    // Road
    const rL = Math.max(0, roadL), rR = Math.min(W, roadR);
    if (rR > rL) {
      if (seg.isFinish) {
        const sq = Math.max(4, roadHalfPx / 5);
        ctx.fillStyle = (Math.floor(cx / sq) + Math.floor(y / sq)) % 2 === 0 ? '#fff' : '#000';
      } else {
        ctx.fillStyle = seg.roadColor;
      }
      ctx.fillRect(rL, y, rR - rL, 1);
    }

    // Centre dashes
    if (!seg.isFinish && seg.index % 4 < 2 && rR > rL) {
      ctx.fillStyle = '#fff';
      const dL = Math.max(rL, cx - dashW), dR = Math.min(rR, cx + dashW);
      if (dR > dL) ctx.fillRect(dL, y, dR - dL, 1);
    }

    // Right rumble
    const rRL = Math.max(0, roadR), rRR = Math.min(W, roadR + rumW);
    if (rRR > rRL) { ctx.fillStyle = seg.rumbleColor; ctx.fillRect(rRL, y, rRR - rRL, 1); }
  }
}

// Shared variable: game.js writes effective player X used by scanline renderer
let _effectivePlayerX = 0;
