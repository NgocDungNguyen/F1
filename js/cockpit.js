// ─────────────────────────────────────────────
//  COCKPIT OVERLAY  –  first-person driver view
// ─────────────────────────────────────────────

function renderCockpit(W, H) {
  const cfg    = carConfig;
  const steer  = player ? player.steeringAngle : 0;
  const tilt   = steer * COCKPIT_TILT_ANGLE;
  const pivY   = H * COCKPIT_PIVOT_Y;
  const isMoto   = cfg.vehicleType === 'moto';
  const isNASCAR = cfg.vehicleType === 'nascar';
  const isLMP1   = cfg.vehicleType === 'f1v2';
  const veh      = (typeof VEHICLE_DEFS !== 'undefined') ? (VEHICLE_DEFS[cfg.vehicleType] || VEHICLE_DEFS.f1) : null;

  // ── Apply whole-cockpit tilt ────────────────────────────────────────────
  ctx.save();
  const tiltMult = isMoto ? 1.8 : 1.0;
  ctx.translate(W / 2, pivY);
  ctx.rotate(tilt * tiltMult);
  ctx.translate(-W / 2, -pivY);

  // ── Dashboard body ────────────────────────────────────────────────────────
  if (isMoto) {
    // Motorcycle: narrower fairing panel
    ctx.fillStyle = '#0c0c0c';
    ctx.beginPath();
    ctx.moveTo(0,        H);
    ctx.lineTo(W,        H);
    ctx.lineTo(W * 0.80, H * 0.730);
    ctx.lineTo(W * 0.20, H * 0.730);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = cfg.color; ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.beginPath();
    ctx.moveTo(W * 0.20, H * 0.730); ctx.lineTo(W * 0.80, H * 0.730);
    ctx.stroke();
  } else if (isNASCAR) {
    // NASCAR: wide dashboard with thick roll-cage A-pillars
    ctx.fillStyle = '#0c0c0c';
    ctx.beginPath();
    ctx.moveTo(0,        H);
    ctx.lineTo(W,        H);
    ctx.lineTo(W * 0.90, H * 0.710);
    ctx.lineTo(W * 0.10, H * 0.710);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = cfg.color; ctx.lineWidth = Math.max(3, W * 0.005);
    ctx.beginPath();
    ctx.moveTo(W * 0.10, H * 0.710); ctx.lineTo(W * 0.90, H * 0.710);
    ctx.stroke();
  } else if (isLMP1) {
    // LMP1: closed-cockpit — wider dash + windshield frame visible
    ctx.fillStyle = '#080808';
    ctx.beginPath();
    ctx.moveTo(0,        H);
    ctx.lineTo(W,        H);
    ctx.lineTo(W * 0.92, H * 0.705);
    ctx.lineTo(W * 0.08, H * 0.705);
    ctx.closePath(); ctx.fill();
    // Wide windshield frame (closed canopy)
    ctx.strokeStyle = _darkenHex(cfg.color, 0.7);
    ctx.lineWidth = Math.max(4, W * 0.012);
    ctx.beginPath();
    // Top windshield bar
    ctx.moveTo(W * 0.08, H * 0.705); ctx.lineTo(W * 0.92, H * 0.705);
    // Left A-pillar
    ctx.moveTo(W * 0.08, H * 0.705); ctx.lineTo(W * 0.18, H * 0.580);
    // Right A-pillar
    ctx.moveTo(W * 0.92, H * 0.705); ctx.lineTo(W * 0.82, H * 0.580);
    ctx.stroke();
    // Windshield glass tint (upper portion of screen)
    const wGrad = ctx.createLinearGradient(0, H * 0.44, 0, H * 0.705);
    wGrad.addColorStop(0, 'rgba(40,80,120,0.18)');
    wGrad.addColorStop(1, 'rgba(10,20,40,0.06)');
    ctx.fillStyle = wGrad;
    ctx.fillRect(W * 0.18, H * 0.44, W * 0.64, H * 0.265);
    // Carbon fibre dash accent
    ctx.strokeStyle = cfg.color; ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.beginPath();
    ctx.moveTo(W * 0.08, H * 0.705); ctx.lineTo(W * 0.92, H * 0.705);
    ctx.stroke();
  } else {
    // F1 Classic: open-top with halo top bar
    ctx.fillStyle = '#0d0d0d';
    ctx.beginPath();
    ctx.moveTo(0,        H);
    ctx.lineTo(W,        H);
    ctx.lineTo(W * 0.86, H * 0.715);
    ctx.lineTo(W * 0.14, H * 0.715);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = cfg.color; ctx.lineWidth = Math.max(3, W * 0.005);
    ctx.beginPath();
    ctx.moveTo(W * 0.14, H * 0.715); ctx.lineTo(W * 0.86, H * 0.715);
    ctx.stroke();
  }

  // ── Rev / speed bar ───────────────────────────────────────────────────────
  if (player) {
    const maxSpd  = veh ? (player.boosting ? veh.boostSpeed : veh.maxSpeed)
                        : (player.boosting ? BOOST_SPEED    : PLAYER_MAX_SPEED);
    const revFrac = clamp(player.speed / maxSpd, 0, 1);
    const bW = W * 0.28, bH = H * 0.022;
    const bX = W * 0.36, bY = H * 0.728;

    ctx.fillStyle = '#111';
    roundRect(ctx, bX, bY, bW, bH, 3, true, false);
    const r = Math.floor(lerp(20, 220, revFrac));
    const g = Math.floor(lerp(180, 18, revFrac));
    ctx.fillStyle = `rgb(${r},${g},18)`;
    roundRect(ctx, bX, bY, bW * revFrac, bH, 3, true, false);

    // Gear-shift lights
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

  // ── Control interface (wheel or handlebars) ───────────────────────────────
  if (isMoto) {
    // Motorcycle handlebars
    const hbCX   = W * 0.5;
    const hbCY   = H * 0.825;
    const leanOff = steer * W * 0.022;

    // Handlebar tubes
    ctx.strokeStyle = '#2e2e2e';
    ctx.lineWidth   = Math.max(6, W * 0.013);
    ctx.lineCap     = 'round';

    ctx.beginPath();
    ctx.moveTo(hbCX - W * 0.04 + leanOff, hbCY - H * 0.024);
    ctx.quadraticCurveTo(
      hbCX - W * 0.16 + leanOff, hbCY - H * 0.032,
      hbCX - W * 0.26 + leanOff, hbCY - H * 0.010
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hbCX + W * 0.04 + leanOff, hbCY - H * 0.024);
    ctx.quadraticCurveTo(
      hbCX + W * 0.16 + leanOff, hbCY - H * 0.032,
      hbCX + W * 0.26 + leanOff, hbCY - H * 0.010
    );
    ctx.stroke();

    // Grips (rubber wrap, slightly thicker and darker)
    ctx.strokeStyle = '#111111';
    ctx.lineWidth   = Math.max(8, W * 0.020);
    ctx.beginPath();
    ctx.moveTo(hbCX - W * 0.21 + leanOff, hbCY - H * 0.016);
    ctx.lineTo(hbCX - W * 0.28 + leanOff, hbCY - H * 0.006);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hbCX + W * 0.21 + leanOff, hbCY - H * 0.016);
    ctx.lineTo(hbCX + W * 0.28 + leanOff, hbCY - H * 0.006);
    ctx.stroke();

    // Centre stem / top bridge
    ctx.fillStyle = '#222';
    ctx.fillRect(hbCX - W * 0.014 + leanOff, hbCY - H * 0.040, W * 0.028, H * 0.042);

    // Digital instrument cluster
    ctx.fillStyle = '#080812';
    roundRect(ctx, hbCX - W * 0.08 + leanOff, hbCY - H * 0.072, W * 0.16, H * 0.044, 4, true, false);
    ctx.strokeStyle = '#223344'; ctx.lineWidth = 1;
    roundRect(ctx, hbCX - W * 0.08 + leanOff, hbCY - H * 0.072, W * 0.16, H * 0.044, 4, false, true);
    if (player) {
      const vehRef = veh || VEHICLE_DEFS.f1;
      const kmh  = Math.round(player.speed * 23.5);
      ctx.fillStyle = '#00ffaa'; ctx.font = `bold ${Math.round(H * 0.025)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(kmh + ' km/h', hbCX + leanOff, hbCY - H * 0.050);
    }

  } else if (isLMP1) {
    // LMP1: compact oval wheel (like Audi R18/Toyota GR010 style)
    const wx = W * 0.5;
    const wy = H * 0.824;
    const wr = Math.min(W * 0.060, H * 0.075);
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(steer * 0.48);
    // D-ring shape (flat at top for cockpit entry)
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = wr * 0.24;
    ctx.beginPath(); ctx.arc(0, 0, wr, 0, Math.PI * 2); ctx.stroke();
    // Top flat cut of D-ring
    ctx.fillStyle = '#080808';
    ctx.fillRect(-wr * 1.05, -wr, wr * 2.1, wr * 0.6);
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = wr * 0.24;
    ctx.beginPath(); ctx.moveTo(-wr, -wr * 0.4); ctx.lineTo(wr, -wr * 0.4); ctx.stroke();
    // Carbon spokes
    ctx.strokeStyle = '#222'; ctx.lineWidth = wr * 0.10;
    ctx.beginPath(); ctx.moveTo(-wr * 0.22, 0); ctx.lineTo(-wr, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( wr * 0.22, 0); ctx.lineTo( wr, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -wr * 0.22); ctx.lineTo(0, -wr * 0.40); ctx.stroke();
    // Centre hub with colour
    ctx.fillStyle = '#0e0e0e';
    ctx.beginPath(); ctx.arc(0, 0, wr * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cfg.color;
    ctx.beginPath(); ctx.arc(0, 0, wr * 0.10, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

  } else if (isNASCAR) {
    // NASCAR: larger circular steering wheel
    const wx = W * 0.5;
    const wy = H * 0.830;
    const wr = Math.min(W * 0.090, H * 0.110);

    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(steer * 0.62);

    ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = wr * 0.28;
    ctx.beginPath(); ctx.arc(0, 0, wr, 0, Math.PI * 2); ctx.stroke();

    ctx.strokeStyle = 'rgba(100,100,100,0.45)'; ctx.lineWidth = wr * 0.06;
    ctx.beginPath(); ctx.arc(0, 0, wr, -Math.PI * 0.75, -Math.PI * 0.25); ctx.stroke();

    // 3-spoke
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = wr * 0.12;
    [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach(angle => {
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * wr * 0.22, Math.sin(angle) * wr * 0.22);
      ctx.lineTo(Math.cos(angle) * wr,         Math.sin(angle) * wr);
      ctx.stroke();
    });

    ctx.fillStyle = '#141414';
    ctx.beginPath(); ctx.arc(0, 0, wr * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cfg.color;
    ctx.beginPath(); ctx.arc(0, 0, wr * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

  } else {
    // F1 butterfly steering wheel
    const wx = W * 0.5;
    const wy = H * 0.826;
    const wr = Math.min(W * 0.074, H * 0.09);

    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(steer * 0.52);

    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = wr * 0.22;
    ctx.beginPath(); ctx.arc(0, 0, wr, 0, Math.PI * 2); ctx.stroke();

    ctx.strokeStyle = 'rgba(120,120,120,0.5)'; ctx.lineWidth = wr * 0.06;
    ctx.beginPath(); ctx.arc(0, 0, wr, -Math.PI * 0.75, -Math.PI * 0.25); ctx.stroke();

    ctx.strokeStyle = '#2e2e2e'; ctx.lineWidth = wr * 0.10;
    ctx.beginPath(); ctx.moveTo(-wr * 0.18, -wr * 0.12); ctx.lineTo(-wr, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-wr * 0.18,  wr * 0.12); ctx.lineTo(-wr, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( wr * 0.18, -wr * 0.12); ctx.lineTo( wr, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( wr * 0.18,  wr * 0.12); ctx.lineTo( wr, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -wr * 0.18);          ctx.lineTo(0, -wr); ctx.stroke();

    ctx.fillStyle = '#151515';
    ctx.beginPath(); ctx.arc(0, 0, wr * 0.26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cfg.color;
    ctx.beginPath(); ctx.arc(0, 0, wr * 0.12, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#181818';
    ctx.fillRect(-wr * 0.7, wr * 0.65, wr * 1.4, wr * 0.55);
    ctx.fillStyle = cfg.color;
    ctx.fillRect(-wr * 0.55, wr * 0.68, wr * 1.1, wr * 0.10);
    ctx.restore();
  }

  // ── Nose / fairing view (shifts with steering) ────────────────────────────
  const noseOff = steer * W * 0.038;

  if (isMoto) {
    // Narrow front fairing visible between the rider's hands
    const fnOff = steer * W * 0.022;
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.moveTo(W * 0.38 + fnOff, H);
    ctx.lineTo(W * 0.62 + fnOff, H);
    ctx.lineTo(W * 0.54 + fnOff, H * 0.898);
    ctx.lineTo(W * 0.46 + fnOff, H * 0.898);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = _darkenHex(cfg.color, 0.60);
    ctx.beginPath();
    ctx.moveTo(W * 0.46 + fnOff, H * 0.898);
    ctx.lineTo(W * 0.54 + fnOff, H * 0.898);
    ctx.lineTo(W * 0.56 + fnOff, H);
    ctx.lineTo(W * 0.36 + fnOff, H);
    ctx.closePath(); ctx.fill();

  } else if (isLMP1) {
    // LMP1: very wide flat nose visible through low windshield
    const lOff = steer * W * 0.028;
    // Wide splitter / flat nose
    ctx.fillStyle = _darkenHex(cfg.color, 0.78);
    ctx.beginPath();
    ctx.moveTo(W * 0.10 + lOff, H);
    ctx.lineTo(W * 0.90 + lOff, H);
    ctx.lineTo(W * 0.76 + lOff, H * 0.880);
    ctx.lineTo(W * 0.24 + lOff, H * 0.880);
    ctx.closePath(); ctx.fill();
    // Centre fin visible on nose
    ctx.fillStyle = _darkenHex(cfg.color, 0.60);
    ctx.beginPath();
    ctx.moveTo(W * 0.48 + lOff, H);
    ctx.lineTo(W * 0.52 + lOff, H);
    ctx.lineTo(W * 0.51 + lOff, H * 0.880);
    ctx.lineTo(W * 0.49 + lOff, H * 0.880);
    ctx.closePath(); ctx.fill();
    // Side winglets
    ctx.fillStyle = '#111';
    ctx.fillRect(W * 0.06 + lOff, H * 0.920, W * 0.12, H * 0.018);
    ctx.fillRect(W * 0.82 + lOff, H * 0.920, W * 0.12, H * 0.018);
    // Side mirrors (LMP1 has large door mirrors)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(W * 0.12, H * 0.740, W * 0.055, H * 0.030);
    ctx.fillRect(W * 0.825, H * 0.740, W * 0.055, H * 0.030);
    ctx.fillStyle = 'rgba(150,200,255,0.30)';
    ctx.fillRect(W * 0.122, H * 0.742, W * 0.020, H * 0.008);
    ctx.fillRect(W * 0.827, H * 0.742, W * 0.020, H * 0.008);

  } else if (isNASCAR) {
    // Wide hood visible — occupies more of the lower screen
    ctx.fillStyle = _darkenHex(cfg.color, 0.82);
    ctx.beginPath();
    ctx.moveTo(W * 0.14 + noseOff, H);
    ctx.lineTo(W * 0.86 + noseOff, H);
    ctx.lineTo(W * 0.72 + noseOff, H * 0.875);
    ctx.lineTo(W * 0.28 + noseOff, H * 0.875);
    ctx.closePath(); ctx.fill();
    // Hood centre stripe
    ctx.fillStyle = _darkenHex(cfg.color, 0.92);
    ctx.beginPath();
    ctx.moveTo(W * 0.46 + noseOff, H);
    ctx.lineTo(W * 0.54 + noseOff, H);
    ctx.lineTo(W * 0.52 + noseOff, H * 0.875);
    ctx.lineTo(W * 0.48 + noseOff, H * 0.875);
    ctx.closePath(); ctx.fill();

  } else {
    // F1 nose cone
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.moveTo(W * 0.27 + noseOff, H);
    ctx.lineTo(W * 0.73 + noseOff, H);
    ctx.lineTo(W * 0.59 + noseOff, H * 0.886);
    ctx.lineTo(W * 0.41 + noseOff, H * 0.886);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = _darkenHex(cfg.color, 0.55);
    ctx.beginPath();
    ctx.moveTo(W * 0.41 + noseOff, H * 0.886);
    ctx.lineTo(W * 0.59 + noseOff, H * 0.886);
    ctx.lineTo(W * 0.61 + noseOff, H);
    ctx.lineTo(W * 0.29 + noseOff, H);
    ctx.closePath(); ctx.fill();

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

    // Front wing sections
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
    ctx.fillStyle = 'rgba(150,200,255,0.35)';
    ctx.fillRect(W*0.155, H*0.745, W*0.015, H*0.008);
    ctx.fillRect(W*0.809, H*0.745, W*0.015, H*0.008);
  }

  // ── Vignette ──────────────────────────────────────────────────────────────
  const vgGrad = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.9);
  vgGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vgGrad.addColorStop(1, 'rgba(0,0,0,0.48)');
  ctx.fillStyle = vgGrad;
  ctx.fillRect(0, 0, W, H * 0.72);

  ctx.restore();
}

// Local helper (not in utils.js to avoid dependency)
function _darkenHex(hex, factor) {
  const c = parseInt(hex.replace('#',''), 16);
  const r = Math.floor(((c >> 16) & 0xff) * factor);
  const g = Math.floor(((c >>  8) & 0xff) * factor);
  const b = Math.floor(( c        & 0xff) * factor);
  return `rgb(${r},${g},${b})`;
}
