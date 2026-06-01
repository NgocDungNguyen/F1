// ─────────────────────────────────────────────
//  COCKPIT OVERLAY  –  first-person driver view
//
//  Dynamic effects:
//    • Canvas rotates around COCKPIT_PIVOT_Y based on steering angle
//      (driver leans into the corner)
//    • Nose cone shifts left/right based on steering
//    • Steering wheel rotates (up to ±40°)
//    • Rev bar fills with speed-dependent colour
// ─────────────────────────────────────────────

function renderCockpit(W, H) {
  const cfg   = carConfig;
  const steer = player ? player.steeringAngle : 0;
  const tilt  = steer * COCKPIT_TILT_ANGLE;       // canvas rotation angle
  const pivY  = H * COCKPIT_PIVOT_Y;              // rotation pivot

  // ── Apply whole-cockpit tilt ──────────────────────────────────────────
  ctx.save();
  ctx.translate(W / 2, pivY);
  ctx.rotate(tilt);
  ctx.translate(-W / 2, -pivY);

  // ── Dashboard body ─────────────────────────────────────────────────────
  ctx.fillStyle = '#0d0d0d';
  ctx.beginPath();
  ctx.moveTo(0,      H);
  ctx.lineTo(W,      H);
  ctx.lineTo(W * 0.86, H * 0.715);
  ctx.lineTo(W * 0.14, H * 0.715);
  ctx.closePath();
  ctx.fill();

  // Dash top accent line in car colour
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth   = Math.max(3, W * 0.005);
  ctx.beginPath();
  ctx.moveTo(W * 0.14, H * 0.715);
  ctx.lineTo(W * 0.86, H * 0.715);
  ctx.stroke();

  // ── Rev / speed bar ───────────────────────────────────────────────────
  if (player) {
    const maxSpd  = player.boosting ? BOOST_SPEED : PLAYER_MAX_SPEED;
    const revFrac = clamp(player.speed / maxSpd, 0, 1);
    const bW = W * 0.28, bH = H * 0.022;
    const bX = W * 0.36, bY = H * 0.728;

    ctx.fillStyle = '#111';
    roundRect(ctx, bX, bY, bW, bH, 3, true, false);

    const r = Math.floor(lerp(20, 220, revFrac));
    const g = Math.floor(lerp(180, 18, revFrac));
    ctx.fillStyle = `rgb(${r},${g},18)`;
    roundRect(ctx, bX, bY, bW * revFrac, bH, 3, true, false);

    // Gear lights (top of rev bar)
    const gearLights = 8;
    const glW = (bW - 8) / gearLights - 2;
    for (let i = 0; i < gearLights; i++) {
      const filled = i < Math.ceil(revFrac * gearLights);
      const gx     = bX + 4 + i * (glW + 2);
      ctx.fillStyle = filled
        ? (i < 5 ? '#00ee44' : (i < 7 ? '#ffaa00' : '#ff2200'))
        : '#1a1a1a';
      ctx.fillRect(gx, bY - 9, glW, 7);
    }
  }

  // ── Steering wheel ────────────────────────────────────────────────────
  const wx = W * 0.5;
  const wy = H * 0.826;
  const wr = Math.min(W * 0.074, H * 0.09);

  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate(steer * 0.52);          // visual wheel rotation

  // Outer rim
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth   = wr * 0.22;
  ctx.beginPath(); ctx.arc(0, 0, wr, 0, Math.PI * 2); ctx.stroke();

  // Rim highlight
  ctx.strokeStyle = 'rgba(120,120,120,0.5)';
  ctx.lineWidth   = wr * 0.06;
  ctx.beginPath(); ctx.arc(0, 0, wr, -Math.PI * 0.75, -Math.PI * 0.25); ctx.stroke();

  // Spokes (F1 butterfly style)
  ctx.strokeStyle = '#2e2e2e';
  ctx.lineWidth   = wr * 0.10;
  // Left spoke
  ctx.beginPath(); ctx.moveTo(-wr * 0.18, -wr * 0.12); ctx.lineTo(-wr, 0);       ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-wr * 0.18,  wr * 0.12); ctx.lineTo(-wr, 0);       ctx.stroke();
  // Right spoke
  ctx.beginPath(); ctx.moveTo( wr * 0.18, -wr * 0.12); ctx.lineTo( wr, 0);       ctx.stroke();
  ctx.beginPath(); ctx.moveTo( wr * 0.18,  wr * 0.12); ctx.lineTo( wr, 0);       ctx.stroke();
  // Top spoke
  ctx.beginPath(); ctx.moveTo(0, -wr * 0.18); ctx.lineTo(0, -wr);               ctx.stroke();

  // Centre hub
  ctx.fillStyle = '#151515';
  ctx.beginPath(); ctx.arc(0, 0, wr * 0.26, 0, Math.PI * 2); ctx.fill();
  // Hub logo dot in car colour
  ctx.fillStyle = cfg.color;
  ctx.beginPath(); ctx.arc(0, 0, wr * 0.12, 0, Math.PI * 2); ctx.fill();

  // F1 steering wheel flat bottom
  ctx.fillStyle = '#181818';
  ctx.fillRect(-wr * 0.7, wr * 0.65, wr * 1.4, wr * 0.55);
  ctx.fillStyle = cfg.color;
  ctx.fillRect(-wr * 0.55, wr * 0.68, wr * 1.1, wr * 0.10);

  ctx.restore();

  // ── Nose shift (moves left/right with steering) ───────────────────────
  // noseOff: negative = car turning left → nose shifts right (right-hand visible more)
  const noseOff = steer * W * 0.038;

  // Nose body
  ctx.fillStyle = cfg.color;
  ctx.beginPath();
  ctx.moveTo(W * 0.27 + noseOff, H);
  ctx.lineTo(W * 0.73 + noseOff, H);
  ctx.lineTo(W * 0.59 + noseOff, H * 0.886);
  ctx.lineTo(W * 0.41 + noseOff, H * 0.886);
  ctx.closePath(); ctx.fill();

  // Nose shadow
  ctx.fillStyle = _darkenHex(cfg.color, 0.55);
  ctx.beginPath();
  ctx.moveTo(W * 0.41 + noseOff, H * 0.886);
  ctx.lineTo(W * 0.59 + noseOff, H * 0.886);
  ctx.lineTo(W * 0.61 + noseOff, H);
  ctx.lineTo(W * 0.29 + noseOff, H);
  ctx.closePath(); ctx.fill();

  // Decal stripes on nose
  if (cfg.decal === 'stripes') {
    ctx.save(); ctx.globalAlpha = 0.72; ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(W*0.37+noseOff, H); ctx.lineTo(W*0.42+noseOff, H);
    ctx.lineTo(W*0.46+noseOff, H*0.886); ctx.lineTo(W*0.42+noseOff, H*0.886);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W*0.58+noseOff, H); ctx.lineTo(W*0.63+noseOff, H);
    ctx.lineTo(W*0.58+noseOff, H*0.886); ctx.lineTo(W*0.54+noseOff, H*0.886);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Front wing
  ctx.fillStyle = '#0e0e0e';
  ctx.fillRect(W*0.09+noseOff, H*0.918, W*0.18, H*0.020);
  ctx.fillRect(W*0.73+noseOff, H*0.918, W*0.18, H*0.020);
  ctx.fillStyle = cfg.color;
  ctx.fillRect(W*0.09+noseOff, H*0.900, W*0.18, H*0.018);
  ctx.fillRect(W*0.73+noseOff, H*0.900, W*0.18, H*0.018);

  // Side mirrors
  ctx.fillStyle = '#111';
  ctx.fillRect(W*0.152, H*0.744, W*0.042, H*0.028);
  ctx.fillRect(W*0.806, H*0.744, W*0.042, H*0.028);
  ctx.fillStyle = _darkenHex(cfg.color, 0.7);
  ctx.fillRect(W*0.153, H*0.745, W*0.040, H*0.015);
  ctx.fillRect(W*0.807, H*0.745, W*0.040, H*0.015);

  // Mirror glass glint
  ctx.fillStyle = 'rgba(150,200,255,0.35)';
  ctx.fillRect(W*0.155, H*0.745, W*0.015, H*0.008);
  ctx.fillRect(W*0.809, H*0.745, W*0.015, H*0.008);

  // ── Vignette (dark border on 1st-person view for immersion) ──────────
  const vgGrad = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.9);
  vgGrad.addColorStop(0,   'rgba(0,0,0,0)');
  vgGrad.addColorStop(1,   'rgba(0,0,0,0.48)');
  ctx.fillStyle = vgGrad;
  ctx.fillRect(0, 0, W, H * 0.72);   // only in the road-view area

  ctx.restore();   // ← un-applies the tilt transform
}

// Local helper (not in utils.js to avoid dependency)
function _darkenHex(hex, factor) {
  const c = parseInt(hex.replace('#',''), 16);
  const r = Math.floor(((c >> 16) & 0xff) * factor);
  const g = Math.floor(((c >>  8) & 0xff) * factor);
  const b = Math.floor(( c        & 0xff) * factor);
  return `rgb(${r},${g},${b})`;
}
