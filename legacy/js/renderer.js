// ─────────────────────────────────────────────
//  PSEUDO-3D ROAD RENDERER
// ─────────────────────────────────────────────

let _projected    = [];
let horizonFrac   = HORIZON_FRAC;

// ── Project all visible segments ─────────────────────────────────────────
function projectRoad(playerZ, effectivePlayerX, W, H) {
  if (!segments || segments.length === 0) return;

  // Use actual segment count so alt-route arrays (shorter than TRACK_SEGMENTS) don't overflow
  const trackLen  = segments.length;
  const startIdx  = Math.floor(playerZ) % trackLen;
  const segFrac   = playerZ - Math.floor(playerZ);
  const roadBase  = H * (1 - horizonFrac);
  const visScale  = (typeof _weatherVisibility !== 'undefined') ? _weatherVisibility : 1.0;
  let   drawDist  = Math.round(DRAW_DISTANCE * Math.max(0.35, visScale));
  // Fog zone collapses draw distance
  const startSeg = segments[startIdx];
  if (startSeg && startSeg.fogZone) drawDist = Math.min(drawDist, 35);
  // Never try to project more segments than the array actually contains
  drawDist = Math.min(drawDist, trackLen - 1);

  _projected = [];
  let curveX = 0;

  for (let n = 1; n <= drawDist + 1; n++) {
    const segIdx = (startIdx + n - 1) % trackLen;
    const seg    = segments[segIdx];
    if (!seg) break;
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
    case 'buildings': _drawBuildings(W, horizon, camShift);  break;
    case 'mountains': _drawMountains(W, horizon, camShift);  break;
    case 'jungle':    _drawJungle(W, horizon, camShift);     break;
    case 'desert':    _drawDesert(W, horizon, camShift);     break;
    case 'greatwall': _drawGreatWall(W, horizon, camShift);  break;
    default:          _drawForest(W, horizon, camShift);     break;
  }

  // Sahara sandstorm pocket — dense sand tint when in a fogZone on desert track
  if (player && def.bgObjects === 'desert') {
    const pIdx = Math.floor(player.z) % TRACK_SEGMENTS;
    const pSeg = segments[pIdx];
    if (pSeg && pSeg.fogZone) {
      ctx.fillStyle = 'rgba(160,90,10,0.40)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  // Monaco tunnel — dark overlay when in fogZone on buildings track
  if (player && def.bgObjects === 'buildings') {
    const pIdx = Math.floor(player.z) % TRACK_SEGMENTS;
    const pSeg = segments[pIdx];
    if (pSeg && pSeg.fogZone) {
      ctx.fillStyle = 'rgba(0,0,10,0.60)';
      ctx.fillRect(0, 0, W, H);
      // Tunnel edge lights
      ctx.fillStyle = 'rgba(255,200,80,0.25)';
      ctx.fillRect(0, horizon * 0.6, 18, horizon * 0.4);
      ctx.fillRect(W - 18, horizon * 0.6, 18, horizon * 0.4);
    }
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

// ── Sahara Desert background ──────────────────────────────────────────────
function _drawDesert(W, horizon, shift) {
  // Sky wash — already set by gradient, add heat shimmer band
  ctx.fillStyle = 'rgba(200,120,20,0.18)';
  ctx.fillRect(0, horizon * 0.75, W, horizon * 0.25);

  // Far flat horizon (pale sand)
  ctx.fillStyle = '#a06820';
  ctx.fillRect(0, horizon - 4, W, 4);

  // Distant dune silhouette (far layer)
  ctx.fillStyle = '#b87828';
  ctx.beginPath(); ctx.moveTo(0, horizon);
  for (let x = 0; x <= W + 60; x += 25) {
    const y = horizon - Math.abs(Math.sin((x - shift * 0.2) * 0.009)) * horizon * 0.18
                      - Math.abs(Math.sin((x - shift * 0.2) * 0.025)) * horizon * 0.07;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();

  // Near dune silhouette (closer, darker)
  ctx.fillStyle = '#c87838';
  ctx.beginPath(); ctx.moveTo(0, horizon);
  for (let x = 0; x <= W + 40; x += 18) {
    const y = horizon - Math.abs(Math.sin((x - shift * 0.5) * 0.013)) * horizon * 0.12
                      - Math.abs(Math.sin((x - shift * 0.5) * 0.037)) * horizon * 0.05;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();

  // Sun disk
  const sunX = (W * 0.72 - shift * 0.05 + W * 2) % W;
  const sunY = horizon * 0.22;
  const sunR = horizon * 0.10;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
  sunGrad.addColorStop(0, 'rgba(255,240,180,0.95)');
  sunGrad.addColorStop(0.5, 'rgba(255,160,30,0.70)');
  sunGrad.addColorStop(1, 'rgba(255,100,0,0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();

  // Cacti / rock silhouettes
  ctx.fillStyle = '#7a5010';
  [0.08, 0.22, 0.47, 0.65, 0.81, 0.93].forEach(tx => {
    const x = tx * W - shift * 0.8, h = horizon * 0.14;
    ctx.fillRect(x - 4, horizon - h, 8, h);
    ctx.fillRect(x - 14, horizon - h * 0.55, 12, 5);
    ctx.fillRect(x + 4,  horizon - h * 0.65, 12, 5);
  });
}

// ── Great Wall of China background ────────────────────────────────────────
function _drawGreatWall(W, horizon, shift) {
  // Mountain range behind wall (misty Chinese ink-wash style)
  ctx.fillStyle = '#3a4838';
  ctx.beginPath(); ctx.moveTo(0, horizon);
  for (let x = 0; x <= W + 80; x += 35) {
    const y = horizon - Math.abs(Math.sin((x - shift * 0.2) * 0.006)) * horizon * 0.60
                      - Math.abs(Math.sin((x - shift * 0.2) * 0.018)) * horizon * 0.20;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();

  // Mid mountain (darker, closer)
  ctx.fillStyle = '#2a3428';
  ctx.beginPath(); ctx.moveTo(0, horizon);
  for (let x = 0; x <= W + 50; x += 22) {
    const y = horizon - Math.abs(Math.sin((x - shift * 0.45) * 0.010)) * horizon * 0.38
                      - Math.abs(Math.sin((x - shift * 0.45) * 0.028)) * horizon * 0.12;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();

  // Mist layer over mountains
  ctx.fillStyle = 'rgba(160,180,200,0.15)';
  ctx.fillRect(0, horizon * 0.30, W, horizon * 0.55);

  // Stone wall battlements (crenellations) along horizon
  const merlonW = Math.round(W / 18);
  const merlonH = Math.round(horizon * 0.06);
  ctx.fillStyle = '#5a5848';
  for (let i = 0; i < 18; i++) {
    const bx = Math.round(i * W / 18 - (shift * 0.9) % (W / 18));
    if (i % 2 === 0) ctx.fillRect(bx, horizon - merlonH, merlonW, merlonH);
  }

  // Wall base (continuous stone band)
  ctx.fillStyle = '#4a4838';
  ctx.fillRect(0, horizon - 4, W, 4);

  // Watchtower blocks at intervals
  ctx.fillStyle = '#3a3830';
  [0.12, 0.38, 0.62, 0.88].forEach(tx => {
    const x = tx * W - shift * 0.9;
    const tw = horizon * 0.08, th = horizon * 0.18;
    ctx.fillRect(x - tw / 2, horizon - th, tw, th);
    // Roof line
    ctx.fillStyle = '#2a2820';
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.6, horizon - th);
    ctx.lineTo(x, horizon - th - tw * 0.5);
    ctx.lineTo(x + tw * 0.6, horizon - th);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a3830';
  });
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
    const dashW      = Math.max(1, roadHalfPx * 0.022);
    const rumW       = Math.max(2, roadHalfPx * 0.13);

    // Grass (always drawn full-width)
    ctx.fillStyle = seg.grassColor;
    ctx.fillRect(0, y, W, 1);

    if (seg.forkSection) {
      // ── FORK: Y-junction — branch road peels away toward the horizon ──
      const stripHalfPx = FORK_STRIP_HALF * roadHalfPx;
      const stripSepPx  = (FORK_DIV + FORK_STRIP_HALF) * roadHalfPx;
      const bDir = seg.branchDir || 1;

      // Branch diverges by (1-scale)*W*0.5 sideways — zero at player's feet,
      // large at the horizon, making the road visually split into the distance.
      const divergePx = (1.0 - scale) * W * 0.5 * bDir;

      const mainCx   = cx - bDir * stripSepPx;           // main: opposite side, stays straight
      const branchCx = cx + bDir * stripSepPx + divergePx; // branch: peels away

      // ── Main road strip (asphalt) ──
      const mRumA = Math.max(0, mainCx - bDir * (stripHalfPx + rumW));
      const mRumB = Math.max(0, mainCx - bDir * stripHalfPx);
      const mRumL2 = Math.min(mRumA, mRumB), mRumR2 = Math.max(mRumA, mRumB);
      if (mRumR2 > mRumL2) { ctx.fillStyle = seg.rumbleColor; ctx.fillRect(mRumL2, y, mRumR2 - mRumL2, 1); }
      const mL = Math.max(0, mainCx - stripHalfPx), mR = Math.min(W, mainCx + stripHalfPx);
      if (mR > mL) {
        ctx.fillStyle = seg.roadColor;
        ctx.fillRect(mL, y, mR - mL, 1);
        if (seg.index % 4 < 2) {
          ctx.fillStyle = '#fff';
          const dL = Math.max(mL, mainCx - dashW), dR = Math.min(mR, mainCx + dashW);
          if (dR > dL) ctx.fillRect(dL, y, dR - dL, 1);
        }
      }

      // ── Branch road strip (dirt) — vanishes off-screen ahead ──
      const bL = Math.max(0, branchCx - stripHalfPx), bR = Math.min(W, branchCx + stripHalfPx);
      if (bR > bL) {
        const bRumA = branchCx + bDir * stripHalfPx;
        const bRumB = branchCx + bDir * (stripHalfPx + rumW);
        const bRumL = Math.max(0, Math.min(bRumA, bRumB)), bRumR = Math.min(W, Math.max(bRumA, bRumB));
        if (bRumR > bRumL) { ctx.fillStyle = seg.rumbleColor; ctx.fillRect(bRumL, y, bRumR - bRumL, 1); }
        ctx.fillStyle = (seg.index & 1) ? '#8a6a40' : '#7a5a30';
        ctx.fillRect(bL, y, bR - bL, 1);
        if (seg.index % 4 < 2) {
          ctx.fillStyle = 'rgba(255,220,100,0.7)';
          const dL = Math.max(bL, branchCx - dashW), dR = Math.min(bR, branchCx + dashW);
          if (dR > dL) ctx.fillRect(dL, y, dR - dL, 1);
        }
      }

    } else {
      // ── NORMAL single road (or forkEntry/forkExit transition) ──────
      const widthMult     = (seg.roadWidthMult != null) ? seg.roadWidthMult : 1.0;
      // forkEntry/forkExit: widen road slightly as visual transition
      const entryMult     = seg.forkEntry ? 1.4 : (seg.forkExit ? 1.4 : 1.0);
      const effectiveHalf = roadHalfPx * widthMult * entryMult;
      const sL = cx - effectiveHalf, sR = cx + effectiveHalf;

      // Left rumble
      const lRL = Math.max(0, sL - rumW), lRR = Math.min(W, sL);
      if (lRR > lRL) { ctx.fillStyle = seg.rumbleColor; ctx.fillRect(lRL, y, lRR - lRL, 1); }

      // Road surface
      const rL = Math.max(0, sL), rR = Math.min(W, sR);
      if (rR > rL) {
        const isLastLap = typeof raceData !== 'undefined' && raceData.lap >= TOTAL_LAPS;
        if (seg.isFinish) {
          const sq = Math.max(4, roadHalfPx / 5);
          ctx.fillStyle = (Math.floor(cx/sq) + Math.floor(y/sq)) % 2 === 0 ? '#fff' : '#000';
        } else if (seg.sandBlind && isLastLap) {
          // Road covered by sand — blends with desert terrain
          ctx.fillStyle = (seg.index & 1) ? '#c8a040' : '#b8913a';
        } else if (seg.floodBlind && isLastLap) {
          // Road submerged — blue flood water
          ctx.fillStyle = (seg.index & 1) ? '#3a6090' : '#4a70a8';
        } else {
          ctx.fillStyle = seg.roadColor;
        }
        ctx.fillRect(rL, y, rR - rL, 1);
      }

      // Centre dash — hidden when road is blind (no visible markings)
      const isLastLapDash = typeof raceData !== 'undefined' && raceData.lap >= TOTAL_LAPS;
      const blindHere = isLastLapDash && (seg.sandBlind || seg.floodBlind);
      if (!seg.isFinish && !blindHere && rR > rL && seg.index % 4 < 2) {
        ctx.fillStyle = '#fff';
        const dL = Math.max(rL, cx - dashW), dR = Math.min(rR, cx + dashW);
        if (dR > dL) ctx.fillRect(dL, y, dR - dL, 1);
      }

      // Right rumble
      const rRL = Math.max(0, sR), rRR = Math.min(W, sR + rumW);
      if (rRR > rRL) { ctx.fillStyle = seg.rumbleColor; ctx.fillRect(rRL, y, rRR - rRL, 1); }
    }
  }

  // ── Fork entry sign: painted road arrow showing LEFT=SHORTCUT, RIGHT=MAIN ──
  if (!segments || !_projected) return;
  const drawDist2 = drawDist;
  for (let n = 2; n <= drawDist2; n++) {
    const p    = _projected[n];
    const pPrv = _projected[n - 1];
    if (!p || !pPrv) continue;
    const seg    = p.seg;
    const segPrv = pPrv.seg;
    if (!seg || !segPrv) continue;

    // Draw fork sign at the START of each forkEntry zone
    if (seg.forkEntry && !segPrv.forkEntry) {
      const fcx = p.centerX;
      const fcy = p.screenY;
      const aw  = Math.max(10, p.rHalf * 0.80);
      if (fcy < horizon || fcy > H) continue;
      ctx.save();
      ctx.globalAlpha = 0.88;
      // Left arrow (SHORTCUT)
      ctx.fillStyle   = '#ffbb44';
      ctx.strokeStyle = '#885500';
      ctx.lineWidth   = Math.max(1, aw * 0.06);
      ctx.beginPath();
      ctx.moveTo(fcx - aw * 0.10, fcy - aw * 0.18);
      ctx.lineTo(fcx - aw * 0.60, fcy - aw * 0.40);
      ctx.lineTo(fcx - aw * 0.55, fcy - aw * 0.22);
      ctx.lineTo(fcx - aw * 0.90, fcy - aw * 0.22);
      ctx.lineTo(fcx - aw * 0.90, fcy + aw * 0.05);
      ctx.lineTo(fcx - aw * 0.55, fcy + aw * 0.05);
      ctx.lineTo(fcx - aw * 0.60, fcy + aw * 0.22);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Right arrow (MAIN)
      ctx.fillStyle = '#88ddff';
      ctx.beginPath();
      ctx.moveTo(fcx + aw * 0.10, fcy - aw * 0.18);
      ctx.lineTo(fcx + aw * 0.60, fcy - aw * 0.40);
      ctx.lineTo(fcx + aw * 0.55, fcy - aw * 0.22);
      ctx.lineTo(fcx + aw * 0.90, fcy - aw * 0.22);
      ctx.lineTo(fcx + aw * 0.90, fcy + aw * 0.05);
      ctx.lineTo(fcx + aw * 0.55, fcy + aw * 0.05);
      ctx.lineTo(fcx + aw * 0.60, fcy + aw * 0.22);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  // ── Alt route entry signs (green arrows + label on road surface) ──────────
  if (typeof _altRouteData !== 'undefined' && _altRouteData.length
      && (!player || !player.altRoute)) {
    const horizon2 = Math.floor(H * horizonFrac);
    for (const ar of _altRouteData) {
      // Find the projected slice nearest to the alt route entry point
      for (let n = 3; n <= drawDist; n++) {
        const p = _projected[n];
        if (!p || !p.seg) continue;
        // Check if this slice corresponds to the entry Z on the main track
        const sliceZ = (Math.floor(player ? player.z : 0) + n - 1) % TRACK_SEGMENTS;
        const distToEntry = Math.abs(sliceZ - ar.mainEntryZ);
        if (distToEntry > 4) continue;

        const cx  = p.centerX;
        const cy  = p.screenY;
        if (cy < horizon2 || cy > H) continue;
        const aw  = Math.max(14, p.rHalf * 1.0);

        ctx.save();
        ctx.globalAlpha = 0.90;
        // Direction-specific arrow color: teal/green for alt routes
        const arrowColor = '#44ffcc';
        ctx.fillStyle    = arrowColor;
        ctx.strokeStyle  = '#006644';
        ctx.lineWidth    = Math.max(1.5, aw * 0.06);

        if (ar.entryDir === -1) {
          // Arrow pointing LEFT
          ctx.beginPath();
          ctx.moveTo(cx - aw * 0.05, cy - aw * 0.22);
          ctx.lineTo(cx - aw * 0.65, cy - aw * 0.45);
          ctx.lineTo(cx - aw * 0.58, cy - aw * 0.24);
          ctx.lineTo(cx - aw * 1.10, cy - aw * 0.24);
          ctx.lineTo(cx - aw * 1.10, cy + aw * 0.06);
          ctx.lineTo(cx - aw * 0.58, cy + aw * 0.06);
          ctx.lineTo(cx - aw * 0.65, cy + aw * 0.26);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        } else {
          // Arrow pointing RIGHT
          ctx.beginPath();
          ctx.moveTo(cx + aw * 0.05, cy - aw * 0.22);
          ctx.lineTo(cx + aw * 0.65, cy - aw * 0.45);
          ctx.lineTo(cx + aw * 0.58, cy - aw * 0.24);
          ctx.lineTo(cx + aw * 1.10, cy - aw * 0.24);
          ctx.lineTo(cx + aw * 1.10, cy + aw * 0.06);
          ctx.lineTo(cx + aw * 0.58, cy + aw * 0.06);
          ctx.lineTo(cx + aw * 0.65, cy + aw * 0.26);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }

        // Route label below arrow
        const label = ar.entryLabel || ar.name || 'ALT ROUTE';
        ctx.fillStyle    = '#ffffff';
        ctx.shadowColor  = '#00aa66';
        ctx.shadowBlur   = 6;
        ctx.font         = `bold ${Math.max(9, Math.round(aw * 0.30))}px monospace`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy + aw * 0.55);
        ctx.shadowBlur   = 0;
        ctx.restore();
        break;  // Only draw sign once per alt route per frame
      }
    }
  }
}

// ── Item orb renderer ─────────────────────────────────────────────────────
function renderItemOrbs(W, H) {
  if (!_projected || !segments || typeof ITEM_DEFS === 'undefined') return;
  const visScale = (typeof _weatherVisibility !== 'undefined') ? _weatherVisibility : 1.0;
  const drawDist = Math.round(DRAW_DISTANCE * Math.max(0.35, visScale));
  const t        = Date.now();
  const horizon  = Math.floor(H * horizonFrac);

  for (let n = 2; n <= drawDist; n++) {
    const p = _projected[n];
    if (!p) continue;
    const seg = p.seg;
    if (!seg || !seg.item) continue;

    const def = ITEM_DEFS[seg.item];
    if (!def) continue;

    const orbR = Math.max(6, p.rHalf * 0.24);
    const bob  = Math.sin(t * 0.004 + n * 0.85) * orbR * 0.45;
    const cx   = p.centerX;
    const cy   = p.screenY - orbR * 1.3 - bob;
    if (cy < horizon || cy > H + orbR) continue;

    ctx.save();

    // Glow halo
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 2.0);
    grd.addColorStop(0, def.color + 'bb');
    grd.addColorStop(1, def.glow + '00');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(cx, cy, orbR * 2.0, 0, Math.PI * 2); ctx.fill();

    // Spinning diamond
    ctx.translate(cx, cy);
    ctx.rotate((t * 0.0022 + n * 0.5) % (Math.PI * 2));
    ctx.fillStyle   = def.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = Math.max(1, orbR * 0.14);
    ctx.beginPath();
    ctx.moveTo(0,           -orbR);
    ctx.lineTo(orbR * 0.65,  0);
    ctx.lineTo(0,            orbR);
    ctx.lineTo(-orbR * 0.65, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Item label below orb (un-rotated)
    ctx.rotate(-((t * 0.0022 + n * 0.5) % (Math.PI * 2)));
    ctx.fillStyle    = '#fff';
    ctx.font         = `bold ${Math.max(8, Math.round(orbR * 0.85))}px monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.label.slice(0, 5), 0, orbR * 2.1);

    ctx.restore();
  }
}

// ── Fireworks (Great Wall finish) ─────────────────────────────────────────
let _fireworkTimer  = 0;
let _fireworkBursts = [];

function triggerFireworks() {
  _fireworkTimer = 3.0;
  _fireworkBursts = [];
  const colors = ['#ff4400','#ffaa00','#ffee00','#ff80ff','#80ffff','#ffffff','#ff2288','#44ff88'];
  for (let i = 0; i < 12; i++) {
    _fireworkBursts.push({
      x: 0.15 + Math.random() * 0.7,
      y: 0.10 + Math.random() * 0.45,
      color: colors[i % colors.length],
      delay: Math.random() * 1.5,
      r: 0,
    });
  }
}

function renderFireworks(W, H, dt) {
  if (_fireworkTimer <= 0) return;
  _fireworkTimer = Math.max(0, _fireworkTimer - (dt || 0.016));
  const t = Date.now();

  for (const b of _fireworkBursts) {
    if (b.delay > 0) { b.delay -= (dt || 0.016); continue; }
    b.r = Math.min(b.r + (dt || 0.016) * 180, W * 0.18);
    const alpha = Math.min(1, b.r / (W * 0.06));
    const fadeAlpha = alpha * (_fireworkTimer / 3.0);
    const cx = b.x * W, cy = b.y * H;
    // Ring burst
    ctx.save();
    ctx.globalAlpha = fadeAlpha * 0.7;
    ctx.strokeStyle = b.color;
    ctx.lineWidth   = Math.max(2, b.r * 0.07);
    ctx.beginPath(); ctx.arc(cx, cy, b.r, 0, Math.PI * 2); ctx.stroke();
    // Rays
    ctx.globalAlpha = fadeAlpha * 0.9;
    ctx.lineWidth   = Math.max(1, b.r * 0.03);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 7) {
      const rayLen = b.r * (0.5 + 0.5 * Math.sin(t * 0.008 + a));
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * rayLen, cy + Math.sin(a) * rayLen);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Shared variables written by game.js
let _effectivePlayerX = 0;
