// ─────────────────────────────────────────────
//  HUD  –  fully responsive, all above cockpit
//  All dimensions derived from W / H each frame.
// ─────────────────────────────────────────────

// Scale helper: returns value scaled to shorter screen edge
function _h(base) { return Math.round(base * Math.min(H / 420, W / 700, 1.4)); }

// ── Main HUD ─────────────────────────────────────────────────────────────
function renderHUD(W, H, data) {
  const { speed, lap, raceTime, position, boostCooldown, boosting } = data;
  const kmh = Math.round(speed * 23.5);
  const mob = IS_MOBILE || Math.min(W, H) < 420;

  ctx.save();

  // ── TOP-LEFT: Race timer ────────────────────────────────────────────
  const tlH  = _h(38), tlW = _h(162);
  const tlX  = _h(10), tlY = _h(10);
  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  roundRect(ctx, tlX, tlY, tlW, tlH, _h(7), true, false);
  ctx.fillStyle    = '#ffffff';
  ctx.font         = `bold ${_h(17)}px monospace`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatTime(raceTime), tlX + _h(10), tlY + tlH / 2);

  // ── TOP-LEFT: Position badge (below timer) ──────────────────────────
  const posH = _h(38), posW = _h(74);
  const posX = tlX, posY = tlY + tlH + _h(6);
  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  roundRect(ctx, posX, posY, posW, posH, _h(7), true, false);
  ctx.fillStyle    = position === 1 ? '#ffd700' : (position <= 2 ? '#ff9944' : '#ff4444');
  ctx.font         = `bold ${_h(22)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ordinal(position), posX + posW / 2, posY + posH / 2);

  // ── TOP-CENTER: Lap counter ─────────────────────────────────────────
  const lcW = _h(168), lcH = _h(38);
  const lcX = W / 2 - lcW / 2, lcY = _h(10);
  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  roundRect(ctx, lcX, lcY, lcW, lcH, _h(7), true, false);
  ctx.fillStyle    = '#ffcc00';
  ctx.font         = `bold ${_h(19)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`LAP  ${lap} / ${TOTAL_LAPS}`, W / 2, lcY + lcH / 2);

  // ── TOP-RIGHT: Speed gauge ──────────────────────────────────────────
  const spW = _h(130), spH = _h(68);
  const spX = W - spW - _h(10), spY = _h(10);
  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  roundRect(ctx, spX, spY, spW, spH, _h(9), true, false);

  // Speed number
  ctx.fillStyle    = boosting ? '#00ffcc' : '#ffffff';
  ctx.font         = `bold ${_h(30)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(kmh, spX + spW / 2, spY + _h(6));

  ctx.fillStyle = '#777'; ctx.font = `${_h(11)}px monospace`;
  ctx.fillText('km/h', spX + spW / 2, spY + _h(40));

  // Speed bar
  const maxKmh = Math.round(BOOST_SPEED * 23.5);
  const frac   = clamp(kmh / maxKmh, 0, 1);
  const bX2 = spX + _h(8), bY2 = spY + spH - _h(14), bW2 = spW - _h(16), bH2 = _h(7);
  ctx.fillStyle = '#1a1a1a'; roundRect(ctx, bX2, bY2, bW2, bH2, 3, true, false);
  const r2 = Math.floor(lerp(20, 220, frac));
  const g2 = Math.floor(lerp(180, 18, frac));
  ctx.fillStyle = `rgb(${r2},${g2},18)`;
  roundRect(ctx, bX2, bY2, bW2 * frac, bH2, 3, true, false);

  // ── TOP-RIGHT: Boost strip (below speed) ───────────────────────────
  const bsY2 = spY + spH + _h(6);
  const bsH  = _h(26);
  if (boosting) {
    ctx.fillStyle = 'rgba(0,255,200,0.12)';
    roundRect(ctx, spX, bsY2, spW, bsH, _h(5), true, false);
    ctx.fillStyle    = '#00ffcc';
    ctx.font         = `bold ${_h(12)}px monospace`;
    ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor  = '#00ffcc'; ctx.shadowBlur = 8;
    ctx.fillText('⚡ BOOST ⚡', spX + spW / 2, bsY2 + bsH / 2);
    ctx.shadowBlur = 0;
  } else if (boostCooldown > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, spX, bsY2, spW, bsH, _h(5), true, false);
    ctx.fillStyle    = '#777'; ctx.font = `${_h(11)}px monospace`;
    ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`BOOST  ${Math.ceil(boostCooldown)}s`, spX + spW / 2, bsY2 + bsH / 2);
    const cdF = 1 - boostCooldown / BOOST_COOLDOWN;
    ctx.fillStyle = '#336633';
    ctx.fillRect(spX + _h(7), bsY2 + bsH - _h(4), (spW - _h(14)) * cdF, _h(3));
  } else {
    ctx.fillStyle = 'rgba(0,50,35,0.65)';
    roundRect(ctx, spX, bsY2, spW, bsH, _h(5), true, false);
    ctx.fillStyle    = '#00ee88'; ctx.font = `bold ${_h(11)}px monospace`;
    ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('BOOST READY', spX + spW / 2, bsY2 + bsH / 2);
  }

  // ── Crash overlay ───────────────────────────────────────────────────
  if (player && player.crashTimer > 0) {
    ctx.fillStyle = `rgba(255,50,0,${Math.min(0.45, player.crashTimer * 0.42)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle    = '#ff4400';
    ctx.font         = `bold ${_h(40)}px monospace`;
    ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('COLLISION!', W / 2, H * 0.30);
  }

  // ── Off-road warning ────────────────────────────────────────────────
  if (player && player.offRoadTimer > 0.25) {
    ctx.fillStyle    = '#ddff44';
    ctx.font         = `bold ${_h(14)}px monospace`;
    ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▲  OFF ROAD', W / 2, H * 0.64);
  }

  // ── Desktop key hints ───────────────────────────────────────────────
  if (!IS_MOBILE) {
    ctx.fillStyle    = 'rgba(255,255,255,0.28)';
    ctx.font         = `${_h(10)}px monospace`;
    ctx.textAlign    = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('↑ Gas  ↓ Brake  ← → Steer  SPACE Boost  V View  ESC Pause', W / 2, H * 0.695);
  }

  ctx.restore();
}

// ── Mini-map ─────────────────────────────────────────────────────────────
function renderMinimap(W, H, playerZ) {
  // Size and position: top-left, below position badge, scaled to screen
  const mW  = _h(138), mH = _h(108);
  const mX  = _h(10);
  const mY  = _h(10) + _h(38) + _h(6) + _h(38) + _h(8);  // below timer + position
  const pad = _h(8);

  ctx.save();

  // Panel
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  roundRect(ctx, mX, mY, mW, mH, _h(7), true, false);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  roundRect(ctx, mX, mY, mW, mH, _h(7), false, true);

  // Clip to panel interior
  ctx.beginPath();
  roundRect(ctx, mX + 1, mY + 1, mW - 2, mH - 2, _h(6), false, false);
  ctx.clip();

  const iW = mW - pad * 2, iH = mH - pad * 2;
  const ox = mX + pad,     oy = mY + pad;

  if (minimapPts && minimapPts.length > 1) {

    // Track outline
    ctx.strokeStyle = '#3a5070'; ctx.lineWidth = _h(4);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    minimapPts.forEach((p, i) => {
      const sx = ox + p.x * iW, sy = oy + p.y * iH;
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    });
    ctx.lineTo(ox + minimapPts[0].x * iW, oy + minimapPts[0].y * iH);
    ctx.stroke();

    // Finish line
    const fp = minimapPts[0];
    ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = _h(2.5);
    ctx.beginPath(); ctx.arc(ox + fp.x * iW, oy + fp.y * iH, _h(3.5), 0, Math.PI * 2); ctx.stroke();

    // AI dots
    if (aiCars) {
      aiCars.forEach(ai => {
        const idx = Math.floor(ai.z) % minimapPts.length;
        const ap  = minimapPts[idx];
        ctx.fillStyle   = ai.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = _h(1);
        ctx.beginPath(); ctx.arc(ox + ap.x * iW, oy + ap.y * iH, _h(3), 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      });
    }

    // Player dot + pulse
    const pidx  = Math.floor(playerZ) % minimapPts.length;
    const pp    = minimapPts[pidx];
    const px    = ox + pp.x * iW, py = oy + pp.y * iH;
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
    ctx.strokeStyle = carConfig ? carConfig.color : '#ff4400';
    ctx.lineWidth   = _h(1.5); ctx.globalAlpha = 0.45 * pulse;
    ctx.beginPath(); ctx.arc(px, py, _h(6) + pulse * _h(2.5), 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle   = carConfig ? carConfig.color : '#ff4400';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = _h(1.5);
    ctx.beginPath(); ctx.arc(px, py, _h(4.5), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  ctx.restore();

  // "MAP" label
  ctx.fillStyle    = 'rgba(255,255,255,0.38)';
  ctx.font         = `${_h(9)}px monospace`;
  ctx.textAlign    = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText('MAP', mX + mW - _h(4), mY + mH - _h(3));
}
