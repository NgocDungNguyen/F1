// ─────────────────────────────────────────────
//  HUD  –  all elements sit ABOVE the cockpit (H × 0.715)
// ─────────────────────────────────────────────

// ── Mini-map ─────────────────────────────────────────────────────────────
// Positioned in top-left below the position badge.
// Uses pre-computed minimapPts from tracks.js.
function renderMinimap(W, H, playerZ) {
  const mW  = 155, mH = 118;
  const mX  = 12,  mY = 112;    // top-left, below the position badge
  const pad = 10;

  ctx.save();

  // Background panel
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  roundRect(ctx, mX, mY, mW, mH, 8, true, false);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth   = 1;
  roundRect(ctx, mX, mY, mW, mH, 8, false, true);

  // Clip drawing to panel
  ctx.beginPath();
  roundRect(ctx, mX + 1, mY + 1, mW - 2, mH - 2, 7, false, false);
  ctx.clip();

  const iW = mW - pad * 2;
  const iH = mH - pad * 2;
  const ox = mX + pad, oy = mY + pad;

  if (minimapPts && minimapPts.length > 1) {
    // Track outline
    ctx.strokeStyle = '#445566';
    ctx.lineWidth   = 3.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    minimapPts.forEach((p, i) => {
      const sx = ox + p.x * iW;
      const sy = oy + p.y * iH;
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    });
    // Close path (back to start)
    ctx.lineTo(ox + minimapPts[0].x * iW, oy + minimapPts[0].y * iH);
    ctx.stroke();

    // Finish line marker
    const fp = minimapPts[0];
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.arc(ox + fp.x * iW, oy + fp.y * iH, 4, 0, Math.PI * 2);
    ctx.stroke();

    // AI car dots
    if (aiCars) {
      for (const ai of aiCars) {
        const idx = Math.floor(ai.z) % minimapPts.length;
        const ap  = minimapPts[idx];
        ctx.fillStyle = ai.color;
        ctx.beginPath();
        ctx.arc(ox + ap.x * iW, oy + ap.y * iH, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      }
    }

    // Player dot (on top, larger, pulsing)
    const pidx = Math.floor(playerZ) % minimapPts.length;
    const pp   = minimapPts[pidx];
    const px   = ox + pp.x * iW;
    const py   = oy + pp.y * iH;

    // Pulse ring
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
    ctx.strokeStyle = carConfig ? carConfig.color : '#ff4400';
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 0.5 * pulse;
    ctx.beginPath(); ctx.arc(px, py, 7 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;

    // Solid dot
    ctx.fillStyle   = carConfig ? carConfig.color : '#ff4400';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // Label
  ctx.restore();
  ctx.save();
  ctx.fillStyle    = 'rgba(255,255,255,0.45)';
  ctx.font         = '10px monospace';
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('MAP', mX + mW - 5, mY + mH - 3);
  ctx.restore();
}


function renderHUD(W, H, data) {
  const { speed, lap, raceTime, position, boostCooldown, boosting } = data;

  // km/h: 1 seg/s ≈ 23.5 km/h tuned to feel like real F1 speeds
  const kmh = Math.round(speed * 23.5);

  ctx.save();

  // ── Top-left: Timer ────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  roundRect(ctx, 12, 10, 180, 42, 8, true, false);
  ctx.fillStyle    = '#ffffff';
  ctx.font         = 'bold 20px monospace';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatTime(raceTime), 22, 31);

  // ── Top-left: Position ────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  roundRect(ctx, 12, 60, 86, 42, 8, true, false);
  ctx.fillStyle    = position === 1 ? '#ffd700' : (position <= 2 ? '#ff8844' : '#ff4444');
  ctx.font         = 'bold 26px monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ordinal(position), 55, 81);

  // ── Top-center: Lap counter ────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  roundRect(ctx, W / 2 - 90, 10, 180, 42, 8, true, false);
  ctx.fillStyle    = '#ffcc00';
  ctx.font         = 'bold 22px monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`LAP  ${lap} / ${TOTAL_LAPS}`, W / 2, 31);

  // ── Top-right: Speed gauge ────────────────────────────────────────────
  const spX = W - 152, spY = 10, spW = 140, spH = 74;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  roundRect(ctx, spX, spY, spW, spH, 10, true, false);

  // Speedometer bar
  const maxKmh = Math.round(BOOST_SPEED * 23.5);
  const frac   = clamp(kmh / maxKmh, 0, 1);
  const barH   = 8, barY = spY + spH - 20, barX = spX + 10, barW = spW - 20;
  ctx.fillStyle = '#222';
  ctx.fillRect(barX, barY, barW, barH);
  const r = Math.floor(lerp(30,  220, frac));
  const g = Math.floor(lerp(180, 20,  frac));
  ctx.fillStyle = `rgb(${r},${g},20)`;
  ctx.fillRect(barX, barY, barW * frac, barH);

  ctx.fillStyle    = boosting ? '#00ffcc' : '#ffffff';
  ctx.font         = `bold ${Math.round(spH * 0.50)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(kmh, spX + spW / 2, spY + 6);
  ctx.fillStyle    = '#aaa';
  ctx.font         = '12px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('km/h', spX + spW / 2, spY + spH - 30);

  // ── Boost strip (top-right, below speed) ─────────────────────────────
  const bsY = spY + spH + 8;
  if (boosting) {
    ctx.fillStyle = 'rgba(0,255,200,0.15)';
    roundRect(ctx, spX, bsY, spW, 30, 6, true, false);
    ctx.fillStyle    = '#00ffcc';
    ctx.font         = 'bold 15px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor  = '#00ffcc';
    ctx.shadowBlur   = 10;
    ctx.fillText('⚡ BOOST ⚡', spX + spW / 2, bsY + 15);
    ctx.shadowBlur   = 0;
  } else if (boostCooldown > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, spX, bsY, spW, 30, 6, true, false);
    ctx.fillStyle    = '#888';
    ctx.font         = '13px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`BOOST  ${Math.ceil(boostCooldown)}s`, spX + spW / 2, bsY + 15);
    // Cooldown progress bar
    const cdFrac = 1 - boostCooldown / BOOST_COOLDOWN;
    ctx.fillStyle = '#336633';
    ctx.fillRect(spX + 8, bsY + 25, (spW - 16) * cdFrac, 3);
  } else {
    ctx.fillStyle = 'rgba(0,60,40,0.65)';
    roundRect(ctx, spX, bsY, spW, 30, 6, true, false);
    ctx.fillStyle    = '#00ee88';
    ctx.font         = 'bold 13px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOOST READY', spX + spW / 2, bsY + 15);
  }

  // ── Crash flash overlay ────────────────────────────────────────────────
  if (player && player.crashTimer > 0) {
    const alpha = Math.min(0.45, player.crashTimer * 0.45);
    ctx.fillStyle = `rgba(255,60,0,${alpha})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle    = '#ff4400';
    ctx.font         = `bold ${Math.round(H * 0.055)}px monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('COLLISION!', W / 2, H * 0.32);
  }

  // ── Off-road warning ───────────────────────────────────────────────────
  if (player && player.offRoadTimer > 0.25) {
    ctx.fillStyle    = '#ddff44';
    ctx.font         = 'bold 16px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▲  OFF ROAD', W / 2, H * 0.65);
  }

  // ── Desktop key hints ─────────────────────────────────────────────────
  if (!IS_MOBILE) {
    ctx.fillStyle    = 'rgba(255,255,255,0.30)';
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('↑ Gas  ↓ Brake  ← → Steer  SPACE Boost  V View  ESC Pause', W / 2, H * 0.69);
  }

  ctx.restore();
}
