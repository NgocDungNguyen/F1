// ─────────────────────────────────────────────
//  SPRITES  –  F1 car drawing + AI placement
// ─────────────────────────────────────────────

// ── Draw a single F1 car (front-facing 3/4 view) ─────────────────────────
// cx,cy = screen centre of the car's base (bottom-centre on road surface)
// w  = total car width in pixels
// color = livery colour, decal = 'stripes'|'solid'
function drawF1Sprite(cx, cy, w, color, decal) {
  if (w < 6) return;                     // too small to bother

  const h  = w * 0.48;                  // body height
  const hw = w / 2;
  const hh = h / 2;

  ctx.save();
  ctx.translate(cx, cy - hh * 0.6);     // centre vertically

  // ── Rear wing ─────────────────────────────────────────────────────────
  ctx.fillStyle = '#111111';
  ctx.fillRect(-hw * 0.72, -hh * 0.05, w * 1.44, hh * 0.18);
  ctx.fillStyle = color;
  ctx.fillRect(-hw * 0.68, -hh * 0.12, w * 1.36, hh * 0.10);

  // ── Side pods ─────────────────────────────────────────────────────────
  ctx.fillStyle = _darken(color, 0.7);
  roundRect(ctx, -hw * 1.05, -hh * 0.55, hw * 0.38, h * 0.90, 3, true, false);
  roundRect(ctx,  hw * 0.67, -hh * 0.55, hw * 0.38, h * 0.90, 3, true, false);

  // ── Main body ─────────────────────────────────────────────────────────
  ctx.fillStyle = color;
  roundRect(ctx, -hw * 0.68, -hh * 0.70, w * 1.36, h * 1.05, 5, true, false);

  // ── Nose ──────────────────────────────────────────────────────────────
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.22, -hh * 0.70);
  ctx.lineTo( hw * 0.22, -hh * 0.70);
  ctx.lineTo( hw * 0.10, -hh * 1.58);
  ctx.lineTo(-hw * 0.10, -hh * 1.58);
  ctx.closePath(); ctx.fill();

  // ── Front wing ────────────────────────────────────────────────────────
  ctx.fillStyle = '#111111';
  ctx.fillRect(-hw * 0.62, -hh * 1.48, w * 1.24, hh * 0.16);
  ctx.fillStyle = color;
  ctx.fillRect(-hw * 0.58, -hh * 1.55, w * 1.16, hh * 0.10);
  // End plates
  ctx.fillStyle = '#111111';
  ctx.fillRect(-hw * 0.64, -hh * 1.58, hh * 0.08, hh * 0.26);
  ctx.fillRect( hw * 0.56, -hh * 1.58, hh * 0.08, hh * 0.26);

  // ── Cockpit / halo ─────────────────────────────────────────────────────
  ctx.fillStyle = '#0a1520';
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.18, hw * 0.20, hh * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  // Halo bar
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(-hw * 0.24, -hh * 0.46, w * 0.48, hh * 0.09);
  // Visor glint
  ctx.fillStyle = 'rgba(100,180,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.26, hw * 0.12, hh * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Wheels (4) ────────────────────────────────────────────────────────
  const tyreW  = hw * 0.29;
  const tyreH  = hh * 0.30;
  const tyreXF = hw * 0.82;
  const tyreYF = -hh * 0.95;
  const tyreXR = hw * 1.00;
  const tyreYR =  hh * 0.40;

  [[-tyreXF, tyreYF], [tyreXF, tyreYF],
   [-tyreXR, tyreYR], [tyreXR, tyreYR]].forEach(([tx, ty]) => {
    // Tyre
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(tx, ty, tyreW, tyreH, 0, 0, Math.PI * 2);
    ctx.fill();
    // Rim highlight
    ctx.fillStyle = '#555555';
    ctx.beginPath();
    ctx.ellipse(tx, ty, tyreW * 0.52, tyreH * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.ellipse(tx - tyreW*0.1, ty - tyreH*0.1, tyreW * 0.20, tyreH * 0.20, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── Livery decal ──────────────────────────────────────────────────────
  if (decal === 'stripes') {
    ctx.globalAlpha = 0.72;
    ctx.fillStyle   = '#ffffff';
    // Two parallel stripes along body
    ctx.fillRect(-hw * 0.10, -hh * 0.68, hw * 0.12, h * 0.95);
    ctx.fillRect( hw * 0.00, -hh * 0.68, hw * 0.12, h * 0.95);
    ctx.globalAlpha = 1.0;
  }

  // ── Diffuser (back detail) ────────────────────────────────────────────
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(-hw * 0.50, hh * 0.30, w * 1.00, hh * 0.16);

  ctx.restore();
}

// Helper: darken a hex colour by a factor (0=black, 1=original)
function _darken(hex, factor) {
  const c = parseInt(hex.replace('#',''), 16);
  const r = Math.floor(((c >> 16) & 0xff) * factor);
  const g = Math.floor(((c >>  8) & 0xff) * factor);
  const b = Math.floor(( c        & 0xff) * factor);
  return `rgb(${r},${g},${b})`;
}

// ── Render PLAYER car (3rd-person / over-shoulder view) ──────────────────
function renderPlayerCar(W, H) {
  if (!player) return;
  const steer  = player.steeringAngle;
  const carW   = W * 0.145;
  const carX   = W / 2;
  const carY   = H * 0.795;

  ctx.save();
  // Lateral lean: body tilts into corner
  ctx.translate(carX, carY);
  ctx.rotate(steer * 0.12);
  ctx.translate(-carX, -carY);

  // Small horizontal drift when steering (offset car body)
  const drift = steer * W * 0.018;
  drawF1Sprite(carX + drift, carY, carW, carConfig.color, carConfig.decal);

  // Tyre smoke when off-road
  if (player.offRoadTimer > 0.3) {
    const alpha = Math.min(0.6, player.offRoadTimer * 0.3);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ccaa44';
    for (let i = 0; i < 4; i++) {
      const sx = carX + drift + (Math.random() - 0.5) * carW;
      const sy = carY + carW * 0.3;
      const sr = 4 + Math.random() * 8;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ── Render all AI cars into the scene ────────────────────────────────────
function renderAICars(W, H) {
  if (!aiCars || !_projected || !player) return;

  const pZ = player.z;

  for (const ai of aiCars) {
    // Relative distance ahead of player (wrap around)
    let relZ = ai.z - pZ;
    if (relZ < 0)               relZ += TRACK_SEGMENTS;
    if (relZ < 0.5 || relZ > DRAW_DISTANCE - 1) continue;

    // Nearest projected slice
    const n = clamp(Math.round(relZ), 1, DRAW_DISTANCE);
    const p = _projected[n];
    if (!p) continue;

    // Lateral screen position: road-centre + AI lateral offset scaled by rHalf
    const aiScreenX = p.centerX + ai.x * p.rHalf;
    const aiScreenY = p.screenY;

    // Sprite width proportional to road width at this depth
    const spriteW   = p.rHalf * 2.2;
    if (spriteW < 6) continue;

    drawF1Sprite(aiScreenX, aiScreenY, spriteW, ai.color, ai.decal);

    // Crash flash ring
    if (ai.crashing) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth   = spriteW * 0.15;
      ctx.beginPath();
      ctx.arc(aiScreenX, aiScreenY, spriteW * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
