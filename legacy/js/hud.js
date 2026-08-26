// ─────────────────────────────────────────────
//  HUD  –  fully responsive, all above cockpit
//  All dimensions derived from W / H each frame.
// ─────────────────────────────────────────────

// Scale helper: returns value scaled to shorter screen edge
function _h(base) { return Math.round(base * Math.min(H / 420, W / 700, 1.4)); }

// ── Main HUD ─────────────────────────────────────────────────────────────
function renderHUD(W, H, data) {
  const { speed, lap, raceTime, position, nitroBar, nitroLevel, nitroTapWindow, boosting } = data;
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

  // Speed bar — max reference is the active vehicle's boost speed
  const vehDef = (typeof VEHICLE_DEFS !== 'undefined' && carConfig) ? (VEHICLE_DEFS[carConfig.vehicleType] || VEHICLE_DEFS.f1) : null;
  const maxKmh = Math.round((vehDef ? vehDef.boostSpeed : BOOST_SPEED) * 23.5);
  const frac   = clamp(kmh / maxKmh, 0, 1);
  const bX2 = spX + _h(8), bY2 = spY + spH - _h(14), bW2 = spW - _h(16), bH2 = _h(7);
  ctx.fillStyle = '#1a1a1a'; roundRect(ctx, bX2, bY2, bW2, bH2, 3, true, false);
  const r2 = Math.floor(lerp(20, 220, frac));
  const g2 = Math.floor(lerp(180, 18, frac));
  ctx.fillStyle = `rgb(${r2},${g2},18)`;
  roundRect(ctx, bX2, bY2, bW2 * frac, bH2, 3, true, false);

  // ── TOP-RIGHT: Nitro bar (Asphalt-style 3-tier) ────────────────────
  const bsY2 = spY + spH + _h(6);
  const bsH  = _h(42);
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  roundRect(ctx, spX, bsY2, spW, bsH, _h(5), true, false);

  const barPad = _h(4);
  const barX   = spX + barPad;
  const barW   = spW - barPad * 2;
  const barY   = bsY2 + barPad;
  const barH   = _h(16);

  // Track background
  ctx.fillStyle = '#111111';
  roundRect(ctx, barX, barY, barW, barH, _h(3), true, false);

  // Fill gradient based on level
  if (nitroBar > 0.001) {
    const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    if (nitroLevel <= 1) {
      fillGrad.addColorStop(0,   '#002299');
      fillGrad.addColorStop(0.5, '#1155ff');
      fillGrad.addColorStop(1,   '#44aaff');
    } else if (nitroLevel === 2) {
      fillGrad.addColorStop(0,   '#880000');
      fillGrad.addColorStop(0.5, '#ff3300');
      fillGrad.addColorStop(1,   '#ff8800');
    } else {
      fillGrad.addColorStop(0,   '#440066');
      fillGrad.addColorStop(0.5, '#aa00ff');
      fillGrad.addColorStop(1,   '#ff88ff');
    }
    const glowColors = ['#0066ff', '#0066ff', '#ff6600', '#cc44ff'];
    ctx.save();
    ctx.shadowColor = glowColors[nitroLevel] || '#0066ff';
    ctx.shadowBlur  = boosting ? 10 : 3;
    ctx.fillStyle   = fillGrad;
    roundRect(ctx, barX, barY, Math.max(2, barW * nitroBar), barH, _h(3), true, false);
    ctx.shadowBlur  = 0;
    ctx.restore();
  }

  // Sweet-spot tap window overlay
  if (boosting && nitroTapWindow) {
    const swLo = (nitroLevel === 1) ? NITRO_SWEET1_LO : NITRO_SWEET2_LO;
    const swHi = (nitroLevel === 1) ? NITRO_SWEET1_HI : NITRO_SWEET2_HI;
    const swX1 = barX + barW * swLo;
    const swX2 = barX + barW * swHi;
    const pulse = 0.55 + 0.45 * Math.sin(Date.now() * 0.014);
    ctx.save();
    ctx.globalAlpha = 0.80 * pulse;
    ctx.fillStyle   = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur  = 14;
    roundRect(ctx, swX1, barY - _h(1), swX2 - swX1, barH + _h(2), _h(2), true, false);
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.fillStyle    = '#000000';
    ctx.font         = `bold ${_h(8)}px monospace`;
    ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('TAP!', (swX1 + swX2) / 2, barY + barH / 2);
  }

  // Label row
  const labelY = barY + barH + _h(3);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (!boosting && nitroBar < 0.02) {
    ctx.fillStyle = '#444444';
    ctx.font      = `${_h(9)}px monospace`;
    ctx.fillText('NITRO  —  DRIVE TO FILL', spX + spW / 2, labelY + _h(4));
  } else if (!boosting) {
    const pct = Math.round(nitroBar * 100);
    const rdy = nitroBar > 0.08;
    const readyPulse = rdy ? (0.75 + 0.25 * Math.sin(Date.now() * 0.006)) : 1;
    ctx.fillStyle   = rdy ? '#88ccff' : '#3366aa';
    ctx.shadowColor = '#0044ff'; ctx.shadowBlur = rdy ? 5 * readyPulse : 0;
    ctx.font        = `bold ${_h(9)}px monospace`;
    ctx.fillText(rdy ? `NITRO ${pct}%  [SHIFT]` : `NITRO ${pct}%`, spX + spW / 2, labelY + _h(4));
    ctx.shadowBlur = 0;
  } else {
    const levelNames  = ['', 'BLUE', 'RED', 'ULTIMATE'];
    const levelColors = ['', '#44aaff', '#ff6633', '#cc66ff'];
    const glowCols    = ['', '#0066ff', '#ff4400', '#aa00ff'];
    const pulse2 = 0.8 + 0.2 * Math.sin(Date.now() * 0.010);
    ctx.fillStyle   = levelColors[nitroLevel] || '#ffffff';
    ctx.shadowColor = glowCols[nitroLevel] || '#ffffff'; ctx.shadowBlur = 8 * pulse2;
    ctx.font        = `bold ${_h(10)}px monospace`;
    ctx.fillText(`⚡ ${levelNames[nitroLevel] || ''} NITRO`, spX + spW / 2, labelY + _h(4));
    ctx.shadowBlur  = 0;
  }

  // ── Drift meter bar (below nitro) ──────────────────────────────────
  if (player && (player.driftMeter > 0.01 || player.isDrifting)) {
    const dmY = bsY2 + bsH + _h(4);
    const dmH = _h(18);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(ctx, spX, dmY, spW, dmH, _h(4), true, false);
    const driftGrad = ctx.createLinearGradient(spX + _h(4), 0, spX + spW - _h(4), 0);
    driftGrad.addColorStop(0,   '#ff6600');
    driftGrad.addColorStop(0.6, '#ffaa00');
    driftGrad.addColorStop(1,   '#ffee00');
    ctx.fillStyle = driftGrad;
    const dmPulse = player.driftMeter >= 0.95 ? (0.85 + 0.15 * Math.sin(Date.now() * 0.01)) : 1;
    roundRect(ctx, spX + _h(3), dmY + _h(3), (spW - _h(6)) * player.driftMeter * dmPulse, dmH - _h(6), _h(2), true, false);
    ctx.fillStyle = player.isDrifting ? '#ffee00' : '#ffaa44';
    ctx.font      = `bold ${_h(9)}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(player.isDrifting ? `DRIFTING  ${player.driftTimer.toFixed(1)}s` : 'DRIFT METER', spX + spW / 2, dmY + dmH / 2);
  }

  // ── Vehicle-specific HUD panel (below boost strip) ────────────────────
  const vsY = bsY2 + bsH + _h(6);
  const vsH = _h(30);
  const vt  = carConfig ? carConfig.vehicleType : 'f1';

  if (vt === 'f1' || vt === 'f1v2') {
    // F1 / LMP1: gear indicator + shift lights
    const speedFrac = player ? (player.speed / ((vehDef ? vehDef.maxSpeed : 14))) : 0;
    const gear = Math.max(1, Math.ceil(speedFrac * 7));
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(ctx, spX, vsY, spW, vsH, _h(5), true, false);
    ctx.fillStyle = '#ffcc00'; ctx.font = `bold ${_h(16)}px monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('G' + gear, spX + _h(8), vsY + vsH / 2);
    // 5 shift LEDs
    const nLed = 5, ledW = (_h(12)), ledH = _h(7), ledGap = _h(3);
    const ledX0 = spX + spW - nLed * (ledW + ledGap) - _h(6);
    for (let i = 0; i < nLed; i++) {
      const on = i < Math.ceil(speedFrac * nLed);
      ctx.fillStyle = on ? (i < 3 ? '#00ee44' : (i < 4 ? '#ffaa00' : '#ff2200')) : '#1a1a1a';
      roundRect(ctx, ledX0 + i * (ledW + ledGap), vsY + (vsH - ledH) / 2, ledW, ledH, 2, true, false);
    }
    // LMP1 ERS bar
    if (vt === 'f1v2' && player) {
      const ersY = vsY + vsH + _h(4);
      const ersH = _h(16);
      ctx.fillStyle = 'rgba(0,0,40,0.65)';
      roundRect(ctx, spX, ersY, spW, ersH, _h(4), true, false);
      ctx.fillStyle = '#0055ff'; ctx.lineWidth = 1;
      roundRect(ctx, spX + _h(4), ersY + _h(3), (spW - _h(8)) * (player.ersCharge || 0), ersH - _h(6), _h(2), true, false);
      ctx.fillStyle = '#88aaff'; ctx.font = `${_h(9)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('ERS ' + Math.round((player.ersCharge || 0) * 100) + '%', spX + spW / 2, ersY + ersH / 2);
    }

  } else if (vt === 'nascar') {
    // NASCAR: draft indicator + fuel gauge
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(ctx, spX, vsY, spW, vsH, _h(5), true, false);
    // Check if any AI is within 8 segments ahead
    let inDraft = false;
    if (player && aiCars) {
      for (const ai of aiCars) {
        let relZ = ai.z - player.z;
        if (relZ < 0) relZ += TRACK_SEGMENTS;
        if (relZ > 0 && relZ < 8 && Math.abs(ai.x - player.x) < 0.4) { inDraft = true; break; }
      }
    }
    if (inDraft) {
      ctx.fillStyle = '#ffcc00'; ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 6;
      ctx.font = `bold ${_h(11)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('▲ IN DRAFT', spX + spW / 2, vsY + vsH / 2);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#445'; ctx.font = `${_h(10)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('DRAFT: CLEAR', spX + spW / 2, vsY + vsH / 2);
    }
    // Fuel gauge
    const fuelY = vsY + vsH + _h(4), fuelH = _h(12);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, spX, fuelY, spW, fuelH, _h(3), true, false);
    const fuel = player ? (player.fuel !== undefined ? player.fuel : 1.0) : 1.0;
    ctx.fillStyle = fuel > 0.3 ? '#dd8800' : '#cc2200';
    roundRect(ctx, spX + _h(4), fuelY + _h(2), (spW - _h(8)) * fuel, fuelH - _h(4), _h(2), true, false);
    ctx.fillStyle = '#aaa'; ctx.font = `${_h(8)}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('FUEL', spX + spW / 2, fuelY + fuelH / 2);

  } else if (vt === 'moto') {
    // Motorcycle: lean angle gauge
    const steer = player ? player.steeringAngle : 0;
    const leanDeg = Math.round(steer * 38);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(ctx, spX, vsY, spW, vsH, _h(5), true, false);
    // Lean arc gauge
    const arcCX = spX + spW / 2;
    const arcCY = vsY + vsH - _h(4);
    const arcR  = _h(14);
    ctx.strokeStyle = '#333'; ctx.lineWidth = _h(4);
    ctx.beginPath(); ctx.arc(arcCX, arcCY, arcR, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.strokeStyle = Math.abs(leanDeg) > 25 ? '#ff4400' : '#00ffcc';
    ctx.lineWidth   = _h(4);
    ctx.beginPath();
    ctx.arc(arcCX, arcCY, arcR, Math.PI, Math.PI + (steer + 0.45) / 0.9 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#aaa'; ctx.font = `${_h(9)}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(Math.abs(leanDeg) + '° ' + (leanDeg < 0 ? '◀' : leanDeg > 0 ? '▶' : '—'), arcCX, vsY + _h(2));
    // Wheelie warning
    if (player && player.speed / (vehDef ? vehDef.maxSpeed : 17) > 0.92 && Math.abs(steer) < 0.05) {
      ctx.fillStyle = '#ff8800'; ctx.font = `bold ${_h(9)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('⚠ WHEELIE', arcCX, vsY + vsH / 2);
    }
  }

  // ── Active item effects (right column, below vehicle panel) ───────────
  if (player && typeof ITEM_DEFS !== 'undefined') {
    // Compute bottom of vehicle panel
    let itemY = vsY + vsH + _h(8);
    if (vt === 'f1v2') itemY += _h(16) + _h(4);
    if (vt === 'nascar') itemY += _h(12) + _h(4);

    const iW = spW, iH = _h(20);

    // Dragon boost timer — bright red/gold glow bar
    if (player.dragonTimer > 0) {
      const frac = player.dragonTimer / 4.0;
      ctx.fillStyle = 'rgba(80,10,0,0.80)';
      roundRect(ctx, spX, itemY, iW, iH, _h(4), true, false);
      ctx.fillStyle = `rgba(255,${Math.floor(80 + 120 * frac)},0,0.9)`;
      roundRect(ctx, spX + _h(3), itemY + _h(3), (iW - _h(6)) * frac, iH - _h(6), _h(2), true, false);
      ctx.fillStyle = '#ffdd44'; ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 8;
      ctx.font = `bold ${_h(10)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🐉 DRAGON  ' + player.dragonTimer.toFixed(1) + 's', spX + iW / 2, itemY + iH / 2);
      ctx.shadowBlur = 0;
      itemY += iH + _h(4);
    }

    // Turbo timer bar
    if (player.turboTimer > 0) {
      const frac = player.turboTimer / ITEM_DEFS.turbo.duration;
      ctx.fillStyle = 'rgba(40,20,0,0.80)';
      roundRect(ctx, spX, itemY, iW, iH, _h(4), true, false);
      ctx.fillStyle = '#ff7700';
      roundRect(ctx, spX + _h(3), itemY + _h(3), (iW - _h(6)) * frac, iH - _h(6), _h(2), true, false);
      ctx.fillStyle = '#ffe088'; ctx.font = `bold ${_h(10)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('TURBO  ' + player.turboTimer.toFixed(1) + 's', spX + iW / 2, itemY + iH / 2);
      itemY += iH + _h(4);
    }

    // Grip timer bar
    if (player.gripTimer > 0) {
      const frac = player.gripTimer / ITEM_DEFS.grip.duration;
      ctx.fillStyle = 'rgba(0,30,10,0.80)';
      roundRect(ctx, spX, itemY, iW, iH, _h(4), true, false);
      ctx.fillStyle = '#40ff70';
      roundRect(ctx, spX + _h(3), itemY + _h(3), (iW - _h(6)) * frac, iH - _h(6), _h(2), true, false);
      ctx.fillStyle = '#ccffdd'; ctx.font = `bold ${_h(10)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('MAX GRIP  ' + player.gripTimer.toFixed(1) + 's', spX + iW / 2, itemY + iH / 2);
      itemY += iH + _h(4);
    }

    // Cool timer bar
    if (player.coolTimer > 0) {
      const frac = player.coolTimer / ITEM_DEFS.cool.duration;
      ctx.fillStyle = 'rgba(0,20,40,0.80)';
      roundRect(ctx, spX, itemY, iW, iH, _h(4), true, false);
      ctx.fillStyle = '#40d8ff';
      roundRect(ctx, spX + _h(3), itemY + _h(3), (iW - _h(6)) * frac, iH - _h(6), _h(2), true, false);
      ctx.fillStyle = '#ccefff'; ctx.font = `bold ${_h(10)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('COOLING  ' + player.coolTimer.toFixed(1) + 's', spX + iW / 2, itemY + iH / 2);
      itemY += iH + _h(4);
    }

    // Shield icon
    if (player.shield) {
      ctx.fillStyle = 'rgba(60,50,0,0.80)';
      roundRect(ctx, spX, itemY, iW, iH, _h(4), true, false);
      ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 6;
      ctx.font = `bold ${_h(11)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🛡 SHIELD ACTIVE', spX + iW / 2, itemY + iH / 2);
      ctx.shadowBlur = 0;
      itemY += iH + _h(4);
    }
  }

  // ── Sahara heat gauge ───────────────────────────────────────────────────
  if (player && currentTrackDef && currentTrackDef.bgObjects === 'desert') {
    const htX = spX, htW = spW, htH = _h(22);
    // Position below item effects if any, otherwise below vehicle panel
    let htY = vsY + vsH + _h(8);
    if (vt === 'f1v2')  htY += _h(20);
    if (vt === 'nascar') htY += _h(16);
    // Stack below item timers dynamically — use bottom of screen fallback
    htY = Math.max(htY, H * 0.58);

    const heat = player.heat || 0;
    const r = Math.floor(lerp(20, 220, heat));
    const g = Math.floor(lerp(180, 20, heat));
    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    roundRect(ctx, htX, htY, htW, htH, _h(4), true, false);
    ctx.fillStyle = `rgb(${r},${g},18)`;
    roundRect(ctx, htX + _h(4), htY + _h(4), (htW - _h(8)) * heat, htH - _h(8), _h(2), true, false);
    ctx.fillStyle = heat > 0.85 ? '#ff4400' : '#ffaa44';
    ctx.font = `bold ${_h(9)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(heat > 0.85 ? '⚠ OVERHEAT' : 'ENGINE TEMP', htX + htW / 2, htY + htH / 2);
  }

  // ── Alt route progress indicator ────────────────────────────────────────
  if (player && player.altRoute && typeof _altRouteData !== 'undefined') {
    const ar  = _altRouteData[player.altRoute.idx];
    if (ar) {
      const pct   = Math.min(1, player.altRoute.altZ / Math.max(1, ar.builtSegments.length - 2));
      const arW   = _h(188), arH = _h(34);
      const arX   = W / 2 - arW / 2;
      const arY   = H * 0.40;
      ctx.save();
      ctx.fillStyle = 'rgba(0,30,22,0.88)';
      roundRect(ctx, arX, arY, arW, arH, _h(6), true, false);
      ctx.strokeStyle = '#44ffaa'; ctx.lineWidth = 1.2;
      roundRect(ctx, arX, arY, arW, arH, _h(6), false, true);
      // Route name
      ctx.fillStyle    = '#44ffcc';
      ctx.font         = `bold ${_h(11)}px monospace`;
      ctx.textAlign    = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('🛣  ' + (ar.name || 'ALT ROUTE'), W / 2, arY + _h(4));
      // Progress bar
      const pbX = arX + _h(10), pbW = arW - _h(20), pbH = _h(7);
      const pbY = arY + arH - pbH - _h(5);
      ctx.fillStyle = '#0a2218'; ctx.fillRect(pbX, pbY, pbW, pbH);
      const fillGrad = ctx.createLinearGradient(pbX, 0, pbX + pbW, 0);
      fillGrad.addColorStop(0, '#22cc88');
      fillGrad.addColorStop(1, '#44ffcc');
      ctx.fillStyle = fillGrad;
      ctx.fillRect(pbX, pbY, pbW * pct, pbH);
      ctx.restore();
    }
  }

  // ── Fork shortcut indicator ─────────────────────────────────────────────
  if (player && player.onShortcut) {
    ctx.save();
    ctx.fillStyle = 'rgba(80,40,0,0.82)';
    roundRect(ctx, W / 2 - _h(90), H * 0.46, _h(180), _h(28), _h(6), true, false);
    ctx.fillStyle    = '#ffaa44';
    ctx.shadowColor  = '#ff8800'; ctx.shadowBlur = 8;
    ctx.font         = `bold ${_h(13)}px monospace`;
    ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⚡ SHORTCUT PATH +8%', W / 2, H * 0.46 + _h(14));
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Slipstream indicator (Monza) ────────────────────────────────────────
  if (player && player.slipstreaming) {
    ctx.fillStyle = 'rgba(0,20,60,0.75)';
    roundRect(ctx, W / 2 - _h(90), H * 0.55, _h(180), _h(28), _h(6), true, false);
    ctx.fillStyle = '#88ddff'; ctx.shadowColor = '#44aaff'; ctx.shadowBlur = 10;
    ctx.font = `bold ${_h(13)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⚡ SLIPSTREAM +12%', W / 2, H * 0.55 + _h(14));
    ctx.shadowBlur = 0;
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
    ctx.fillText('↑ Gas  ↓ Brake  SPACE Hard Brake  ← → Steer  SHIFT Nitro  V View  ESC Pause', W / 2, H * 0.695);
  }

  // ── Takedown / stunt badge (top-left, below minimap) ────────────────
  if (player && player.takedowns > 0) {
    const tbX = _h(10), tbY = _h(10) + _h(38) + _h(6) + _h(38) + _h(8) + _h(108) + _h(6);
    const tbW = _h(138), tbH = _h(22);
    ctx.fillStyle = 'rgba(60,0,0,0.75)';
    roundRect(ctx, tbX, tbY, tbW, tbH, _h(4), true, false);
    ctx.fillStyle = '#ff6644'; ctx.font = `bold ${_h(10)}px monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`💥 ×${player.takedowns} TAKEDOWNS`, tbX + _h(6), tbY + tbH / 2);
  }

  ctx.restore();

  // ── Floating popups (rendered last, above everything) ───────────────
  if (typeof renderPopups === 'function') renderPopups(W, H, _loopDt || 0.016);
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
