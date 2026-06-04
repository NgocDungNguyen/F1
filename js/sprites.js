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

// ── Draw LMP1 Prototype (closed fenders, canopy cockpit, wedge body) ────────
// Completely different silhouette from F1: single-body piece covers all 4 wheels,
// no exposed tyres, blunt wide nose, low-profile tail fin, bubble canopy.
function drawF1V2Sprite(cx, cy, w, color, decal) {
  if (w < 6) return;
  const h  = w * 0.42;   // much flatter than F1's 0.48 — wedge-shaped
  const hw = w / 2;
  const hh = h / 2;

  ctx.save();
  ctx.translate(cx, cy - hh * 0.55);

  // ── Rear diffuser ─────────────────────────────────────────────────────────
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(-hw * 0.68, hh * 0.55, w * 1.36, hh * 0.22);

  // ── Low-profile rear wing (thin flat plate, not tall like F1) ────────────
  ctx.fillStyle = '#111111';
  ctx.fillRect(-hw * 0.60, -hh * 0.05, w * 1.20, hh * 0.12);
  ctx.fillStyle = color;
  ctx.fillRect(-hw * 0.56, -hh * 0.16, w * 1.12, hh * 0.10);
  // Tiny end plates
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-hw * 0.62, -hh * 0.20, hh * 0.08, hh * 0.28);
  ctx.fillRect( hw * 0.54, -hh * 0.20, hh * 0.08, hh * 0.28);

  // ── Main body: one wide continuous piece (covers all 4 wheels) ───────────
  // Outer shape — rounded pentagon: very wide in the middle, tapers front/rear
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.52, -hh * 1.10);   // front-left corner
  ctx.lineTo( hw * 0.52, -hh * 1.10);   // front-right corner
  ctx.bezierCurveTo(
     hw * 1.15, -hh * 0.60,             // front-right fender bulge
     hw * 1.15,  hh * 0.40,             // rear-right fender bulge
     hw * 0.64,  hh * 0.62              // rear-right taper
  );
  ctx.lineTo(-hw * 0.64,  hh * 0.62);   // rear-left taper
  ctx.bezierCurveTo(
    -hw * 1.15,  hh * 0.40,             // rear-left fender bulge
    -hw * 1.15, -hh * 0.60,             // front-left fender bulge
    -hw * 0.52, -hh * 1.10              // back to front-left
  );
  ctx.closePath(); ctx.fill();

  // ── Fender surface highlights (show the wheel humps under body) ──────────
  const fenderShade = _darken(color, 0.78);
  ctx.fillStyle = fenderShade;
  // Front-left fender hump
  ctx.beginPath(); ctx.ellipse(-hw * 0.86, -hh * 0.52, hw * 0.30, hh * 0.36, 0, 0, Math.PI*2); ctx.fill();
  // Front-right fender hump
  ctx.beginPath(); ctx.ellipse( hw * 0.86, -hh * 0.52, hw * 0.30, hh * 0.36, 0, 0, Math.PI*2); ctx.fill();
  // Rear-left fender hump
  ctx.beginPath(); ctx.ellipse(-hw * 0.86,  hh * 0.20, hw * 0.30, hh * 0.36, 0, 0, Math.PI*2); ctx.fill();
  // Rear-right fender hump
  ctx.beginPath(); ctx.ellipse( hw * 0.86,  hh * 0.20, hw * 0.30, hh * 0.36, 0, 0, Math.PI*2); ctx.fill();

  // ── Subtle wheel shadows beneath the fenders ─────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(-hw * 0.88, -hh * 0.50, hw * 0.22, hh * 0.28, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( hw * 0.88, -hh * 0.50, hw * 0.22, hh * 0.28, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-hw * 0.88,  hh * 0.18, hw * 0.22, hh * 0.28, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( hw * 0.88,  hh * 0.18, hw * 0.22, hh * 0.28, 0, 0, Math.PI*2); ctx.fill();

  // ── Hood / upper body panel (centre strip, slightly lighter) ─────────────
  ctx.fillStyle = _darken(color, 0.90);
  ctx.beginPath();
  ctx.moveTo(-hw * 0.40, -hh * 1.08);
  ctx.lineTo( hw * 0.40, -hh * 1.08);
  ctx.lineTo( hw * 0.50,  hh * 0.58);
  ctx.lineTo(-hw * 0.50,  hh * 0.58);
  ctx.closePath(); ctx.fill();

  // ── Shark fin (spine running front to rear center) ────────────────────────
  ctx.fillStyle = _darken(color, 0.60);
  ctx.fillRect(-hw * 0.06, -hh * 0.80, w * 0.12, h * 1.30);
  // Fin highlight
  ctx.fillStyle = _darken(color, 0.75);
  ctx.fillRect(-hw * 0.02, -hh * 0.80, w * 0.04, h * 1.30);

  // ── Wide blunt nose (front splitter) ─────────────────────────────────────
  ctx.fillStyle = _darken(color, 0.72);
  ctx.beginPath();
  ctx.moveTo(-hw * 0.52, -hh * 1.08);
  ctx.lineTo( hw * 0.52, -hh * 1.08);
  ctx.lineTo( hw * 0.64, -hh * 1.38);
  ctx.lineTo(-hw * 0.64, -hh * 1.38);
  ctx.closePath(); ctx.fill();
  // Splitter underside edge
  ctx.fillStyle = '#111';
  ctx.fillRect(-hw * 0.68, -hh * 1.42, w * 1.36, hh * 0.08);

  // ── Closed bubble canopy ──────────────────────────────────────────────────
  ctx.fillStyle = '#0a1018';
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.10, hw * 0.32, hh * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  // Canopy frame
  ctx.strokeStyle = _darken(color, 0.55);
  ctx.lineWidth   = Math.max(1, w * 0.015);
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.10, hw * 0.32, hh * 0.48, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Canopy glint (highlights on glass)
  ctx.fillStyle = 'rgba(120,200,255,0.40)';
  ctx.beginPath();
  ctx.ellipse(-hw * 0.08, -hh * 0.26, hw * 0.16, hh * 0.20, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // ── Livery ────────────────────────────────────────────────────────────────
  if (decal === 'stripes') {
    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = '#ffffff';
    // Two side racing stripes along the body flanks
    ctx.fillRect(-hw * 0.70, -hh * 0.85, hw * 0.10, h * 1.20);
    ctx.fillRect( hw * 0.60, -hh * 0.85, hw * 0.10, h * 1.20);
    ctx.restore();
  }

  ctx.restore();
}

// ── Draw NASCAR stock car (wide oval-racer, top-down) ─────────────────────
function drawNASCARSprite(cx, cy, w, color, decal) {
  if (w < 6) return;
  const h  = w * 0.54;
  const hw = w / 2;
  const hh = h / 2;
  const r  = Math.min(8, w * 0.07);

  ctx.save();
  ctx.translate(cx, cy - hh * 0.50);

  // ── Main body (wide rounded rectangle) ────────────────────────────────────
  ctx.fillStyle = color;
  roundRect(ctx, -hw * 1.02, -hh * 0.92, w * 2.04, h * 1.60, r, true, false);

  // ── Hood (front, slightly darker) ─────────────────────────────────────────
  ctx.fillStyle = _darken(color, 0.86);
  roundRect(ctx, -hw * 0.98, -hh * 0.90, w * 1.96, hh * 0.80, r - 2, true, false);

  // ── Roof panel ────────────────────────────────────────────────────────────
  ctx.fillStyle = _darken(color, 0.70);
  roundRect(ctx, -hw * 0.58, -hh * 0.18, w * 1.16, hh * 1.14, 4, true, false);

  // ── Windshield ────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(130,195,255,0.38)';
  ctx.beginPath();
  ctx.moveTo(-hw * 0.54, -hh * 0.20);
  ctx.lineTo( hw * 0.54, -hh * 0.20);
  ctx.lineTo( hw * 0.48, -hh * 0.80);
  ctx.lineTo(-hw * 0.48, -hh * 0.80);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = Math.max(1, w * 0.025);
  ctx.beginPath();
  ctx.moveTo(-hw * 0.54, -hh * 0.20); ctx.lineTo(-hw * 0.48, -hh * 0.80);
  ctx.moveTo( hw * 0.54, -hh * 0.20); ctx.lineTo( hw * 0.48, -hh * 0.80);
  ctx.stroke();

  // ── Rear window ───────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(100,155,210,0.25)';
  ctx.beginPath();
  ctx.moveTo(-hw * 0.52, hh * 0.18);
  ctx.lineTo( hw * 0.52, hh * 0.18);
  ctx.lineTo( hw * 0.56, hh * 0.60);
  ctx.lineTo(-hw * 0.56, hh * 0.60);
  ctx.closePath(); ctx.fill();

  // ── Fender wells ──────────────────────────────────────────────────────────
  [[-hw * 0.80, -hh * 0.60], [hw * 0.80, -hh * 0.60],
   [-hw * 0.80,  hh * 0.30], [hw * 0.80,  hh * 0.30]].forEach(([fx, fy]) => {
    ctx.fillStyle = _darken(color, 0.48);
    ctx.beginPath();
    ctx.ellipse(fx, fy, hw * 0.46, hh * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── Fat NASCAR tyres ──────────────────────────────────────────────────────
  [[-hw * 0.82, -hh * 0.60], [hw * 0.82, -hh * 0.60],
   [-hw * 0.82,  hh * 0.30], [hw * 0.82,  hh * 0.30]].forEach(([tx, ty]) => {
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.ellipse(tx, ty, hw * 0.38, hh * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.ellipse(tx, ty, hw * 0.22, hh * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#777777';
    ctx.beginPath();
    ctx.ellipse(tx - hw*0.04, ty - hh*0.04, hw * 0.10, hh * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── Livery / race number ──────────────────────────────────────────────────
  if (decal === 'stripes') {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-hw * 1.00, -hh * 0.06, w * 2.00, hh * 0.12);
    ctx.font = `bold ${Math.max(6, Math.floor(w * 0.22))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('07', 0, hh * 0.24);
    ctx.restore();
  }

  // ── Rear spoiler (flat plate) ─────────────────────────────────────────────
  ctx.fillStyle = '#111111';
  ctx.fillRect(-hw * 0.78, hh * 0.60, w * 1.56, hh * 0.18);

  // ── Front bumper ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#111111';
  roundRect(ctx, -hw * 0.90, -hh * 0.94, w * 1.80, hh * 0.12, 4, true, false);

  // ── Rear valance ─────────────────────────────────────────────────────────
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(-hw * 0.82, hh * 0.72, w * 1.64, hh * 0.10);

  ctx.restore();
}

// ── Draw MOTORCYCLE (MotoGP / superbike, top-down) ────────────────────────
function drawMotoSprite(cx, cy, w, color, decal) {
  if (w < 5) return;
  const h  = w * 1.20;   // elongated — long like a real bike
  const hw = w / 2;
  const hh = h / 2;

  ctx.save();
  ctx.translate(cx, cy - hh * 0.52);

  // ── Rear tyre ─────────────────────────────────────────────────────────────
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(0, hh * 0.72, hw * 0.88, hh * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#404040';
  ctx.beginPath();
  ctx.ellipse(0, hh * 0.72, hw * 0.48, hh * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Tail / seat hump ──────────────────────────────────────────────────────
  ctx.fillStyle = _darken(color, 0.72);
  ctx.beginPath();
  ctx.moveTo(-hw * 0.40, hh * 0.22);
  ctx.lineTo( hw * 0.40, hh * 0.22);
  ctx.lineTo( hw * 0.22, hh * 0.62);
  ctx.lineTo(-hw * 0.22, hh * 0.62);
  ctx.closePath(); ctx.fill();

  // ── Main fairing body ─────────────────────────────────────────────────────
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.04, hw * 0.64, hh * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Spine / fuel tank highlight ───────────────────────────────────────────
  ctx.fillStyle = _darken(color, 0.80);
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.06, hw * 0.20, hh * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Rider body (crouched) ─────────────────────────────────────────────────
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.14, hw * 0.44, hh * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Helmet ────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.38, hw * 0.26, hh * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(100,195,255,0.65)';
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.42, hw * 0.16, hh * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Front fairing (pointed nose) ──────────────────────────────────────────
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.44, -hh * 0.62);
  ctx.lineTo( hw * 0.44, -hh * 0.62);
  ctx.lineTo( hw * 0.24, -hh * 0.90);
  ctx.lineTo( 0,         -hh * 1.00);
  ctx.lineTo(-hw * 0.24, -hh * 0.90);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = _darken(color, 0.50);
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.72, hw * 0.14, hh * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Front forks ───────────────────────────────────────────────────────────
  ctx.strokeStyle = '#2e2e2e';
  ctx.lineWidth = Math.max(1, w * 0.055);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-hw * 0.12, -hh * 0.62); ctx.lineTo(-hw * 0.18, -hh * 0.84);
  ctx.moveTo( hw * 0.12, -hh * 0.62); ctx.lineTo( hw * 0.18, -hh * 0.84);
  ctx.stroke();

  // ── Front tyre ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.88, hw * 0.72, hh * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#383838';
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.88, hw * 0.36, hh * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Livery stripe ─────────────────────────────────────────────────────────
  if (decal === 'stripes') {
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -hh * 0.04, hw * 0.10, hh * 0.70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

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
  const veh    = VEHICLE_DEFS[carConfig.vehicleType] || VEHICLE_DEFS.f1;
  const steer  = player.steeringAngle;
  const carW   = veh.playerWidth * W;
  const carX   = W / 2;
  const carY   = H * 0.795;
  const isMoto = carConfig.vehicleType === 'moto';

  ctx.save();
  // Motorcycle leans more dramatically into corners
  const leanMult = isMoto ? 0.28 : 0.12;
  ctx.translate(carX, carY);
  ctx.rotate(steer * leanMult);
  ctx.translate(-carX, -carY);

  const drift = steer * W * 0.018;

  switch (carConfig.vehicleType) {
    case 'f1v2':   drawF1V2Sprite  (carX + drift, carY, carW, carConfig.color, carConfig.decal); break;
    case 'nascar': drawNASCARSprite(carX + drift, carY, carW, carConfig.color, carConfig.decal); break;
    case 'moto':   drawMotoSprite  (carX + drift, carY, carW, carConfig.color, carConfig.decal); break;
    default:       drawF1Sprite    (carX + drift, carY, carW, carConfig.color, carConfig.decal); break;
  }

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

    // 0.42 = roughly one lane wide; 0.90 was too wide (filled 2 lanes)
    const spriteW   = p.rHalf * 0.42;
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
