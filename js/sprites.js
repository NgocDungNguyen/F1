// ─────────────────────────────────────────────
//  SPRITES  –  2D pixel-art vehicle designs
// ─────────────────────────────────────────────

// ── Pixel grid helper ─────────────────────────────────────────────────────
// cx,cy = bottom-centre anchor; w = display width in pixels
// map   = array of equal-length strings (same char count per row)
// colorMap = { char: cssColor }   '.' and ' ' are transparent
function _drawPixelGrid(cx, cy, w, map, colorMap) {
  if (w < 4) return;
  const cols = map[0].length;
  const rows = map.length;
  const ps   = w / cols;
  const offX = cx - w / 2;
  const offY = cy - rows * ps;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = map[r][c];
      if (key === '.' || key === ' ') continue;
      ctx.fillStyle = colorMap[key] || '#ff00ff';
      ctx.fillRect(offX + c * ps, offY + r * ps, ps + 0.5, ps + 0.5);
    }
  }
}

// ── F1 Classic ─────────────────────────────────────────────────────────────
// 24 cols × 12 rows  (top row = front/nose, bottom = rear wing)
function drawF1Sprite(cx, cy, w, color, decal) {
  if (w < 6) return;
  const cm = {
    B: color,
    D: _darken(color, 0.65),
    N: _darken(color, 0.42),
    K: '#1a1a1a',
    M: '#777777',
    H: '#aaaaaa',
    C: '#060d18',
    V: '#64b4ff',
    W: '#dddddd',
  };
  // 24 cols × 16 rows — longer body, sharp pointed nose
  const map = [
    '.........WWWWWW.........',  // 0  front wing tip (narrow)
    '........WWWWWWWW........',  // 1  front wing wider
    '........BBBBBBBB........',  // 2  nose base (8 wide)
    '.........BBBBBB.........',  // 3  nose narrows to 6
    '..........BBBB..........',  // 4  narrows to 4
    '...........BB...........',  // 5  SHARP TIP (2 wide)
    '...........BB...........',  // 6  tip continues
    '..........BBBB..........',  // 7  body widens
    'KK.....BBBBBBBBBB.....KK',  // 8  front wheels + body
    '.....BBBBBBBBBBBBBB.....',  // 9  main body
    'D..BBBBBBBCCCCBBBBBBB..D',  // 10 cockpit
    'D..BBBBBBBCVVCBBBBBBB..D',  // 11 visor
    'D..BBBBBBBBHHBBBBBBBB..D',  // 12 halo bar
    'D..BBBBBBBBBBBBBBBBBB..D',  // 13 sidepods (18 B)
    'KK..DDBBBBBBBBBBBBDD..KK',  // 14 rear wheels
    '..NNWWWWWWWWWWWWWWWWNN..',  // 15 rear wing
  ];
  ctx.save();
  _drawPixelGrid(cx, cy, w, map, cm);
  ctx.restore();
}

// ── LMP1 Prototype ─────────────────────────────────────────────────────────
// 24 cols × 10 rows  (h/w ≈ 0.42 — wide closed-body prototype)
function drawF1V2Sprite(cx, cy, w, color, decal) {
  if (w < 6) return;
  const cm = {
    B: color,
    F: _darken(color, 0.55),
    D: _darken(color, 0.70),
    N: _darken(color, 0.42),
    C: '#060d18',
    G: '#5a9adf',
    S: _darken(color, 0.85),
    W: '#dddddd',
  };
  // front = top row
  const map = [
    '..........NNNN..........',  // 0  front splitter
    '.......FFBBBBBBFF.......',  // 1  front fenders
    '.....FFFFBBBBBBFFFF.....',  // 2  fender humps
    '....FFFFFFBBBBFFFFFF....',  // 3  widest fenders
    '....FFFFBBCCCCBBFFFF....',  // 4  canopy area
    '....FFFFBBCGGCBBFFFF....',  // 5  canopy glass
    '.....FFFFBBBBBBFFFF.....',  // 6  body narrows
    '.......FFBBBBBBFF.......',  // 7  tail section
    '........NNBBBBNN........',  // 8  diffuser
    '.........WWWWWW.........',  // 9  rear wing
  ];
  ctx.save();
  _drawPixelGrid(cx, cy, w, map, cm);
  ctx.restore();
}

// ── NASCAR Stock Car ────────────────────────────────────────────────────────
// 24 cols × 13 rows  (h/w ≈ 0.54 — wide boxy stock car)
function drawNASCARSprite(cx, cy, w, color, decal) {
  if (w < 6) return;
  const cm = {
    B: color,
    D: _darken(color, 0.75),
    O: _darken(color, 0.60),
    G: '#82c3ff',
    N: '#1a1a1a',
    K: '#1a1a1a',
    M: '#555555',
    W: '#ffffff',
  };
  // front = top row, bumper = row 0
  const map = [
    'NNNNNNNNNNNNNNNNNNNNNNNN',  // 0  front bumper
    'KKBBBBBBBBBBBBBBBBBBBBKK',  // 1  front body
    'MMBBBBBBGGGGGGGGBBBBBBMM',  // 2  windshield + front rim
    'KKBBBBBBOOOOOOOOBBBBBBKK',  // 3  roof
    'KKBBBBBBOWWWWWWOBBBBBBKK',  // 4  roof with racing stripe
    'KKBBBBBBOOOOOOOOBBBBBBKK',  // 5  roof
    'KKBBBBBBGGGGGGGGBBBBBBKK',  // 6  rear window
    'KKBBBBBBBBBBBBBBBBBBBBKK',  // 7  rear deck
    'KKBBBBBBBBBBBBBBBBBBBBKK',  // 8  body
    'MMBBBBBBBBBBBBBBBBBBBBMM',  // 9  rear tyre rim
    'KKBBBBBBBBBBBBBBBBBBBBKK',  // 10 rear tyre
    'KKBBBBBBBBBBBBBBBBBBBBKK',  // 11 rear tyre
    'NNNNNNNNNNNNNNNNNNNNNNNN',  // 12 rear spoiler
  ];
  ctx.save();
  _drawPixelGrid(cx, cy, w, map, cm);
  ctx.restore();
}

// ── MotoGP Motorbike ───────────────────────────────────────────────────────
// 12 cols × 15 rows  (h/w = 1.25 — narrow and elongated)
function drawMotoSprite(cx, cy, w, color, decal) {
  if (w < 5) return;
  const cm = {
    B: color,
    D: _darken(color, 0.65),
    S: _darken(color, 0.85),
    F: _darken(color, 0.80),
    K: '#1a1a1a',
    M: '#404040',
    P: '#222222',
    H: '#888888',
    V: '#64b4ff',
  };
  // front = top row
  const map = [
    '...KKKKKK...',  // 0  front tyre
    '...KMMMMK...',  // 1  front rim
    '...KKKKKK...',  // 2  front tyre
    '....HHHH....',  // 3  front forks (silver)
    '....FFFF....',  // 4  nose tip (dark fairing)
    '...BBBBBB...',  // 5  front fairing
    '..CCHHHHCC..',  // 6  helmet outer (H = silver visor band)
    '..CCVVVVCC..',  // 7  visor (blue)
    '.PPBBBBBBPP.',  // 8  rider body + fairing sides
    '.PPBBBBBBPP.',  // 9  rider body
    '..SSBBBBSS..',  // 10 tank / spine highlight
    '..DDBBBBDD..',  // 11 mid-body panels
    '...DDDDDD...',  // 12 tail section
    '...KKKKKK...',  // 13 rear tyre
    '...KMMMMK...',  // 14 rear rim
  ];
  ctx.save();
  _drawPixelGrid(cx, cy, w, map, cm);
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

  // Nitro level glow aura
  if (player.boosting && player.nitroLevel > 0) {
    const glowCols = ['', '#0066ff', '#ff5500', '#bb00ff'];
    ctx.shadowColor = glowCols[player.nitroLevel] || '#0066ff';
    ctx.shadowBlur  = 20;
  }

  switch (carConfig.vehicleType) {
    case 'f1v2':   drawF1V2Sprite  (carX + drift, carY, carW, carConfig.color, carConfig.decal); break;
    case 'nascar': drawNASCARSprite(carX + drift, carY, carW, carConfig.color, carConfig.decal); break;
    case 'moto':   drawMotoSprite  (carX + drift, carY, carW, carConfig.color, carConfig.decal); break;
    default:       drawF1Sprite    (carX + drift, carY, carW, carConfig.color, carConfig.decal); break;
  }
  ctx.shadowBlur = 0;

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

  // Nitro fire trail when boosting or dragon active
  if (player.boosting || player.dragonTimer > 0) {
    if (typeof renderNitroFire === 'function') {
      renderNitroFire(carX + drift, carY + carW * 0.55, carW, player.dragonTimer > 0);
    }
  }

  // Drift smoke from tires during hard cornering
  const speedFrac = player.speed / (veh.maxSpeed || 14);
  if (player.isDrifting && speedFrac > 0.40) {
    if (typeof spawnDriftSmoke === 'function') {
      spawnDriftSmoke(carX + drift + (Math.random() - 0.5) * carW * 0.8,
                      carY + carW * 0.35);
    }
  }
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

    switch (ai.vehicleType || 'f1') {
      case 'f1v2':   drawF1V2Sprite  (aiScreenX, aiScreenY, spriteW, ai.color, ai.decal); break;
      case 'nascar': drawNASCARSprite(aiScreenX, aiScreenY, spriteW, ai.color, ai.decal); break;
      case 'moto':   drawMotoSprite  (aiScreenX, aiScreenY, spriteW, ai.color, ai.decal); break;
      default:       drawF1Sprite    (aiScreenX, aiScreenY, spriteW, ai.color, ai.decal); break;
    }

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
