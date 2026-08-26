// ─────────────────────────────────────────────
//  EFFECTS — camera shake, speed lines, popups, drift smoke, nitro fire
// ─────────────────────────────────────────────

// ── Camera shake ──────────────────────────────────────────────────────────
let _cameraShake  = 0;
let _cameraShakeX = 0;
let _cameraShakeY = 0;

function triggerCameraShake(amount) {
  _cameraShake = Math.max(_cameraShake, amount);
}

function updateCameraShake(dt) {
  if (_cameraShake > 0) {
    _cameraShake = Math.max(0, _cameraShake - dt * 4);
    _cameraShakeX = (Math.random() - 0.5) * _cameraShake * 12;
    _cameraShakeY = (Math.random() - 0.5) * _cameraShake * 10;
  } else {
    _cameraShakeX = _cameraShakeY = 0;
  }
}

// ── Floating popup text ───────────────────────────────────────────────────
let _popups = [];
let _popupDt = 0;  // dt passed in each render frame

function showPopup(text, color, duration) {
  color    = color    || '#ffcc00';
  duration = duration || 1.4;
  // Deduplicate: don't stack identical text within 0.4s
  const now = Date.now();
  for (const p of _popups) {
    if (p.text === text && (now - p.createdAt) < 400) return;
  }
  _popups.push({
    text,
    color,
    timer:     duration,
    maxTime:   duration,
    y:         0,          // set on first render relative to H
    createdAt: now,
  });
}

function renderPopups(W, H, dt) {
  _popupDt = dt;
  if (!_popups.length) return;
  const baseY = H * 0.38;
  _popups = _popups.filter((p, idx) => {
    p.timer = Math.max(0, p.timer - dt);
    if (p.y === 0) p.y = baseY - idx * 32;
    p.y -= 28 * dt;  // float upward

    const alpha = Math.min(1, p.timer / p.maxTime * 2);
    const scale = 1 + (1 - p.timer / p.maxTime) * 0.15;  // slight grow-in

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(W / 2, p.y);
    ctx.scale(scale, scale);
    // Shadow / glow
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = p.color;
    ctx.font        = `bold ${Math.round(Math.min(H, W) * 0.042)}px monospace`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.text, 0, 0);
    ctx.shadowBlur  = 0;
    ctx.restore();

    return p.timer > 0;
  });
}

// ── Speed lines (radial streaks at high speed) ────────────────────────────
function renderSpeedLines(W, H, speedFrac) {
  if (speedFrac < 0.70) return;
  const alpha = ((speedFrac - 0.70) / 0.30) * 0.28;
  const carX = W / 2;
  const carY = H * 0.73;
  const numLines = 18;
  const t = Date.now() * 0.001;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#ffffff';

  for (let i = 0; i < numLines; i++) {
    const angle  = (i / numLines) * Math.PI * 2 + t * 0.3;
    const noise  = Math.sin(t * 3.1 + i * 2.7) * 0.12;
    const d1     = W * (0.12 + noise + (i % 3) * 0.04);
    const d2     = d1 + W * (0.04 + Math.abs(Math.sin(t * 2 + i)) * 0.06);
    ctx.lineWidth = 0.8 + (i % 2) * 0.5;
    ctx.beginPath();
    ctx.moveTo(carX + Math.cos(angle) * d1, carY + Math.sin(angle) * d1 * 0.45);
    ctx.lineTo(carX + Math.cos(angle) * d2, carY + Math.sin(angle) * d2 * 0.45);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Drift smoke (spawned into weatherState.particles) ─────────────────────
function spawnDriftSmoke(screenX, screenY) {
  if (typeof weatherState === 'undefined' || !weatherState.particles) return;
  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    weatherState.particles.push({
      type:  'driftSmoke',
      x:     screenX + (Math.random() - 0.5) * 18,
      y:     screenY + (Math.random() - 0.5) * 8,
      vx:    (Math.random() - 0.5) * 22,
      vy:    -45 - Math.random() * 35,
      life:  0.55 + Math.random() * 0.25,
      size:  16 + Math.random() * 14,
    });
  }
}

// ── Nitro fire trail ──────────────────────────────────────────────────────
// Call from renderPlayerCar with the car's screen bounding box
function renderNitroFire(cx, bottomY, carW, isDragon) {
  const t   = Date.now() * 0.014;
  const col = isDragon
    ? ['#ff0000', '#ff4400', '#ff8800', '#ffcc00']
    : ['#0066ff', '#00aaff', '#44ccff', '#99eeff'];

  ctx.save();
  for (let i = 0; i < 4; i++) {
    const flicker = Math.sin(t + i * 1.3) * 0.08;
    const fw = carW * (0.28 - i * 0.05 + flicker);
    const fh = carW * (0.35 + i * 0.18 + flicker * 0.5);
    const fy = bottomY + carW * (0.05 + i * 0.15);
    ctx.globalAlpha = 0.75 - i * 0.15;
    ctx.fillStyle   = col[i];
    ctx.shadowColor = col[0];
    ctx.shadowBlur  = 10;
    ctx.beginPath();
    ctx.ellipse(cx, fy, fw, fh, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Screen flash (used by GO! countdown) ─────────────────────────────────
let _flashAlpha = 0;
let _flashColor = '#ffffff';

function triggerFlash(color, alpha) {
  _flashColor = color || '#ffffff';
  _flashAlpha = Math.max(_flashAlpha, alpha || 1.0);
}

function renderScreenFlash(W, H, dt) {
  if (_flashAlpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = _flashAlpha;
  ctx.fillStyle   = _flashColor;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  _flashAlpha = Math.max(0, _flashAlpha - dt * 3.5);
}
