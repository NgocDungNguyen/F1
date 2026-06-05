// ─────────────────────────────────────────────
//  WEATHER SYSTEM
//  Particles, physics effects, lighting, flying objects
// ─────────────────────────────────────────────

let weatherState = {
  current:          'sunny',
  transitionTimer:  0,
  nightPhase:       0,     // 0=full day, 1=full night
  nightTimer:       0,     // seconds into day/night cycle
  particles:        [],
  flyingObjects:    [],
  lightningTimer:   3 + Math.random() * 4,
  lightningFlash:   0,
  gripFactor:       1.0,
  visibility:       1.0,
  roadWet:          false,
  shimmerPhase:     0,
};

// ── Initialise weather for a new race ─────────────────────────────────────
function initWeather() {
  const diff   = (typeof carConfig !== 'undefined' && carConfig.difficulty) ? carConfig.difficulty : 'easy';
  const diffDef = (typeof DIFFICULTY_DEFS !== 'undefined') ? DIFFICULTY_DEFS[diff] : null;
  const pool   = diffDef ? diffDef.weatherPool : ['sunny'];
  const first  = pool[Math.floor(Math.random() * pool.length)];

  weatherState = {
    current:         first,
    transitionTimer: diffDef ? diffDef.weatherInterval : 0,
    nightPhase:      0,
    nightTimer:      0,
    particles:       [],
    flyingObjects:   [],
    lightningTimer:  3 + Math.random() * 5,
    lightningFlash:  0,
    gripFactor:      1.0,
    visibility:      1.0,
    roadWet:         false,
    shimmerPhase:    0,
  };
  _applyWeatherDef(first);
  _startWeatherAmbient(first);
}

function _applyWeatherDef(type) {
  const def = (typeof WEATHER_DEFS !== 'undefined') ? (WEATHER_DEFS[type] || WEATHER_DEFS.sunny) : {};
  weatherState.gripFactor  = def.grip       !== undefined ? def.grip       : 1.0;
  weatherState.visibility  = def.visibility !== undefined ? def.visibility : 1.0;
  weatherState.roadWet     = def.roadWet    !== undefined ? def.roadWet    : false;
}

function _startWeatherAmbient(type) {
  if (!audioCtx) return;
  const needsRain = ['rain','storm','tropical_storm'].includes(type);
  const needsWind = ['storm','sandstorm','tornado','tropical_storm'].includes(type);
  if (needsRain) { try { playRainAmbient(); } catch(e){} }
  else           { try { stopRainAmbient(); } catch(e){} }
  if (needsWind) { try { playWindAmbient(); } catch(e){} }
  else           { try { stopWindAmbient(); } catch(e){} }
}

// ── Update every game frame ────────────────────────────────────────────────
function updateWeather(dt) {
  const diff    = (typeof carConfig !== 'undefined' && carConfig.difficulty) ? carConfig.difficulty : 'easy';
  const diffDef = (typeof DIFFICULTY_DEFS !== 'undefined') ? DIFFICULTY_DEFS[diff] : null;

  // ── Weather rotation (Asian/Hard/Medium) ──────────────────────────────
  const interval = diffDef ? diffDef.weatherInterval : 0;
  if (interval > 0) {
    weatherState.transitionTimer -= dt;
    if (weatherState.transitionTimer <= 0) {
      const pool    = diffDef.weatherPool;
      const current = weatherState.current;
      let next      = current;
      // Pick different weather
      for (let tries = 0; tries < 8 && next === current; tries++) {
        next = pool[Math.floor(Math.random() * pool.length)];
      }
      weatherState.current        = next;
      weatherState.transitionTimer = interval + Math.random() * interval * 0.4;
      weatherState.particles       = [];  // clear old particles
      _applyWeatherDef(next);
      _startWeatherAmbient(next);
    }
  }

  // ── Night cycle (medium/hard/asian) ───────────────────────────────────
  if (diffDef && diffDef.nightCycle) {
    weatherState.nightTimer += dt;
    const cycleLen = 240;   // 4-minute cycle
    const phase    = (weatherState.nightTimer % cycleLen) / cycleLen;
    // Smooth sine curve: 0=day, 1=night (peaks at phase=0.5)
    weatherState.nightPhase = Math.max(0, Math.sin(phase * Math.PI));
    // Night reduces visibility
    if (weatherState.nightPhase > 0.6) {
      weatherState.visibility = Math.min(
        weatherState.visibility,
        1.0 - weatherState.nightPhase * 0.30
      );
    }
  } else {
    weatherState.nightPhase = 0;
  }

  // ── Particles ─────────────────────────────────────────────────────────
  const wdef = (typeof WEATHER_DEFS !== 'undefined') ? (WEATHER_DEFS[weatherState.current] || {}) : {};
  const rate = wdef.particleRate || 0;
  const type = wdef.particleType;

  if (type && rate > 0) {
    // Spawn new particles
    const spawnN = Math.round(rate * dt);
    for (let i = 0; i < spawnN; i++) {
      weatherState.particles.push(_spawnParticle(type));
    }
  }

  // Update existing particles
  const scrW = (typeof W !== 'undefined') ? W : 400;
  const scrH = (typeof H !== 'undefined') ? H : 700;
  weatherState.particles = weatherState.particles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    return p.life > 0 && p.y < scrH + 20 && p.x > -40 && p.x < scrW + 40;
  });

  // ── Lightning (rain/storm/tropical_storm) ─────────────────────────────
  const hasLightning = ['rain','storm','tropical_storm'].includes(weatherState.current);
  if (hasLightning) {
    weatherState.lightningTimer -= dt;
    if (weatherState.lightningTimer <= 0) {
      weatherState.lightningFlash = 0.9;
      weatherState.lightningTimer = 4 + Math.random() * 12;
      if (typeof playThunder === 'function') {
        setTimeout(() => { try { playThunder(); } catch(e){} }, 300 + Math.random() * 600);
      }
    }
  }
  if (weatherState.lightningFlash > 0) {
    weatherState.lightningFlash = Math.max(0, weatherState.lightningFlash - dt * 6);
  }

  // ── Shimmer phase (road wetness animation) ────────────────────────────
  weatherState.shimmerPhase += dt * 2.5;

  // ── Flying objects (tornado / Asian) ──────────────────────────────────
  const needsDebris = weatherState.current === 'tornado' || (diffDef && diffDef.flyingObjects && weatherState.current !== 'sunny');
  if (needsDebris) {
    if (Math.random() < dt * 0.8) {
      weatherState.flyingObjects.push(_spawnFlyingObject());
    }
  }
  weatherState.flyingObjects = weatherState.flyingObjects.filter(o => {
    o.x  += o.vx * dt;
    o.y  += o.vy * dt;
    o.vy += 55 * dt;   // gravity arc
    o.rotation += o.rotSpeed * dt;
    o.life -= dt;
    return o.life > 0 && o.y < scrH + 60 && o.x > -80 && o.x < scrW + 80;
  });
}

function _spawnParticle(type) {
  const scrW = (typeof W !== 'undefined') ? W : 400;
  const scrH = (typeof H !== 'undefined') ? H : 700;
  const horizon = scrH * ((typeof horizonFrac !== 'undefined') ? horizonFrac : 0.45);

  switch (type) {
    case 'rain':
      return { x: Math.random() * scrW * 1.4 - scrW * 0.2, y: horizon,
               vx: -30 - Math.random() * 20, vy: 600 + Math.random() * 300,
               len: 8 + Math.random() * 12, life: 1.5, type };
    case 'snow':
      return { x: Math.random() * scrW * 1.2 - scrW * 0.1, y: horizon,
               vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 80,
               size: 2 + Math.random() * 4, life: 4 + Math.random() * 2, type };
    case 'sand':
      return { x: Math.random() < 0.5 ? -10 : scrW + 10, y: horizon + Math.random() * (scrH - horizon) * 0.7,
               vx: (Math.random() < 0.5 ? 1 : -1) * (150 + Math.random() * 120),
               vy: (Math.random() - 0.5) * 20, size: 1 + Math.random() * 2, life: 1.5, type };
    case 'debris':
      return { x: Math.random() * scrW, y: horizon,
               vx: (Math.random() - 0.5) * 80, vy: 100 + Math.random() * 200,
               size: 3 + Math.random() * 6, life: 2 + Math.random(), type };
    default:
      return { x: 0, y: 0, vx: 0, vy: 0, life: 0, type: 'rain' };
  }
}

function _spawnFlyingObject() {
  const scrW = (typeof W !== 'undefined') ? W : 400;
  const scrH = (typeof H !== 'undefined') ? H : 700;
  const side  = Math.random() < 0.5;
  // Randomise object type: plank, rock, barrel, sign
  const types = ['plank', 'rock', 'barrel', 'sign'];
  const objType = types[Math.floor(Math.random() * types.length)];
  return {
    x:        side ? -50 : scrW + 50,
    y:        scrH * (0.38 + Math.random() * 0.28),  // stay in road/car zone
    vx:       side ? (140 + Math.random() * 160) : -(140 + Math.random() * 160),
    vy:       -(20 + Math.random() * 60),
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 8,
    size:     22 + Math.random() * 22,   // larger: 22–44px
    life:     2.2 + Math.random() * 0.8,
    objType,
  };
}

// ── Render weather overlay (called from game.js after road render) ─────────
function renderWeatherOverlay(W, H) {
  const ws      = weatherState;
  const wdef    = (typeof WEATHER_DEFS !== 'undefined') ? (WEATHER_DEFS[ws.current] || {}) : {};
  const horizon = Math.floor(H * ((typeof horizonFrac !== 'undefined') ? horizonFrac : 0.45));

  ctx.save();

  // ── Sky tint (weather colour cast) ────────────────────────────────────
  if (wdef.skyTint) {
    ctx.fillStyle = wdef.skyTint;
    ctx.fillRect(0, 0, W, horizon);
  }

  // ── Night overlay ─────────────────────────────────────────────────────
  if (ws.nightPhase > 0.05) {
    ctx.fillStyle = `rgba(0,0,15,${ws.nightPhase * 0.55})`;
    ctx.fillRect(0, 0, W, H);
    // Headlight cone in 3rd-person view
    if ((typeof viewMode !== 'undefined') && viewMode !== '1st') {
      const cx  = W / 2;
      const cyS = H * 0.79;
      const grad = ctx.createRadialGradient(cx, cyS, 0, cx, cyS - H * 0.22, H * 0.32);
      grad.addColorStop(0, 'rgba(255,245,200,0.18)');
      grad.addColorStop(1, 'rgba(255,245,200,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(W * 0.25, horizon, W * 0.5, H - horizon);
    }
  }

  // ── Particles ─────────────────────────────────────────────────────────
  ctx.save();
  for (const p of ws.particles) {
    const alpha = Math.min(1, p.life * 2);
    switch (p.type) {
      case 'rain':
        ctx.strokeStyle = `rgba(160,200,255,${alpha * 0.60})`;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 0.015, p.y + p.len);
        ctx.stroke();
        break;
      case 'snow':
        ctx.fillStyle = `rgba(240,245,255,${alpha * 0.80})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'sand':
        ctx.fillStyle = `rgba(190,130,40,${alpha * 0.55})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'debris':
        ctx.fillStyle = `rgba(60,40,20,${alpha * 0.45})`;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.6);
        break;
      case 'driftSmoke': {
        // Expanding gray circle that fades out — drawn in screen space
        const age  = 1 - p.life / 0.80;   // 0→1 as particle ages
        const r    = p.size * (0.4 + age * 1.2);
        const a    = alpha * 0.50 * (1 - age * 0.6);
        ctx.fillStyle = `rgba(180,180,180,${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        break;
      }
    }
  }
  ctx.restore();

  // ── Sandstorm edge blur (left/right vignette) ─────────────────────────
  if (ws.current === 'sandstorm' || ws.current === 'tornado') {
    const gL = ctx.createLinearGradient(0, 0, W * 0.25, 0);
    gL.addColorStop(0, ws.current === 'sandstorm' ? 'rgba(160,90,10,0.50)' : 'rgba(30,30,30,0.55)');
    gL.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gL; ctx.fillRect(0, 0, W * 0.25, H);
    const gR = ctx.createLinearGradient(W, 0, W * 0.75, 0);
    gR.addColorStop(0, ws.current === 'sandstorm' ? 'rgba(160,90,10,0.50)' : 'rgba(30,30,30,0.55)');
    gR.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gR; ctx.fillRect(W * 0.75, 0, W * 0.25, H);
  }

  // ── Lightning flash (full-screen white) ───────────────────────────────
  if (ws.lightningFlash > 0.05) {
    ctx.fillStyle = `rgba(220,230,255,${ws.lightningFlash * 0.65})`;
    ctx.fillRect(0, 0, W, H);
    // Draw a jagged lightning bolt
    if (ws.lightningFlash > 0.5) {
      ctx.strokeStyle = `rgba(200,220,255,${ws.lightningFlash})`;
      ctx.lineWidth   = 2;
      const lx = W * (0.3 + Math.random() * 0.4);
      ctx.beginPath(); ctx.moveTo(lx, 0);
      let cy2 = 0;
      while (cy2 < horizon) {
        cy2 += 15 + Math.random() * 20;
        ctx.lineTo(lx + (Math.random() - 0.5) * 30, cy2);
      }
      ctx.stroke();
    }
  }

  // ── Road shimmer (wet surface) ────────────────────────────────────────
  if (ws.roadWet) {
    const shimY0 = horizon + (H - horizon) * 0.4;
    const shimH  = (H - horizon) * 0.55;
    for (let i = 0; i < 3; i++) {
      const sy = shimY0 + Math.sin(ws.shimmerPhase + i * 1.8) * (H - horizon) * 0.08;
      const shimAlpha = 0.04 + Math.sin(ws.shimmerPhase * 0.7 + i) * 0.02;
      ctx.fillStyle = `rgba(140,180,255,${Math.max(0, shimAlpha)})`;
      ctx.fillRect(0, sy, W, 2);
    }
  }

  // ── Flying objects — bright, outlined, clearly visible ──────────────────
  for (const o of ws.flyingObjects) {
    ctx.save();
    // Only fade in the final 0.35 seconds so objects stay fully visible while crossing
    ctx.globalAlpha = o.life > 0.35 ? 1.0 : o.life / 0.35;
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rotation);

    const s = o.size;

    switch (o.objType) {
      case 'plank': {
        // Wooden plank — bright orange-brown rectangle with wood grain lines
        ctx.fillStyle = '#d4820a';
        ctx.fillRect(-s * 0.50, -s * 0.18, s, s * 0.36);
        // Wood grain
        ctx.strokeStyle = '#8b4a05'; ctx.lineWidth = Math.max(1, s * 0.04);
        for (let g = -s * 0.35; g < s * 0.45; g += s * 0.18) {
          ctx.beginPath(); ctx.moveTo(g, -s * 0.18); ctx.lineTo(g, s * 0.18); ctx.stroke();
        }
        // Bold bright outline
        ctx.strokeStyle = '#ffcc44'; ctx.lineWidth = Math.max(2, s * 0.07);
        ctx.strokeRect(-s * 0.50, -s * 0.18, s, s * 0.36);
        break;
      }
      case 'rock': {
        // Jagged grey rock — irregular polygon with light sheen
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        const pts = [
          [0, -s * 0.50], [s * 0.36, -s * 0.26], [s * 0.44, s * 0.10],
          [s * 0.20, s * 0.46], [-s * 0.22, s * 0.44], [-s * 0.46, s * 0.08],
          [-s * 0.38, -s * 0.30],
        ];
        ctx.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
        ctx.closePath(); ctx.fill();
        // Light face
        ctx.fillStyle = '#bbbbbb';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.42); ctx.lineTo(s * 0.22, -s * 0.18);
        ctx.lineTo(s * 0.10, s * 0.10); ctx.lineTo(-s * 0.18, -s * 0.06);
        ctx.closePath(); ctx.fill();
        // Bright outline
        ctx.strokeStyle = '#eeeeee'; ctx.lineWidth = Math.max(2, s * 0.07);
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
        ctx.closePath(); ctx.stroke();
        break;
      }
      case 'barrel': {
        // Blue/red barrel — circle with bands
        ctx.fillStyle = '#cc2200';
        ctx.beginPath(); ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2); ctx.fill();
        // White bands
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, s * 0.08);
        ctx.beginPath(); ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = Math.max(1, s * 0.05);
        ctx.beginPath(); ctx.arc(0, 0, s * 0.20, 0, Math.PI * 2); ctx.stroke();
        // Bright outer ring
        ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = Math.max(2, s * 0.08);
        ctx.beginPath(); ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2); ctx.stroke();
        break;
      }
      case 'sign': {
        // Yellow warning diamond sign
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.50);
        ctx.lineTo( s * 0.44, 0);
        ctx.lineTo(0,  s * 0.50);
        ctx.lineTo(-s * 0.44, 0);
        ctx.closePath(); ctx.fill();
        // Black border
        ctx.strokeStyle = '#111111'; ctx.lineWidth = Math.max(2, s * 0.07);
        ctx.stroke();
        // Exclamation mark
        ctx.fillStyle = '#111111';
        ctx.font = `bold ${Math.round(s * 0.44)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, 0);
        break;
      }
    }

    // Danger glow — red shadow when object is in the car-impact zone
    const _W2 = (typeof W !== 'undefined' && W > 0) ? W : 400;
    const _H2 = (typeof H !== 'undefined' && H > 0) ? H : 700;
    if (o.x > _W2 * 0.30 && o.x < _W2 * 0.70 && o.y > _H2 * 0.60) {
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur  = s * 0.80;
      // Redraw outline to trigger glow
      ctx.strokeStyle = 'rgba(255,50,0,0.0)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, s * 0.50, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // ── Warning indicator when a flying object is heading toward the car ─────
  const _W3 = (typeof W !== 'undefined' && W > 0) ? W : 400;
  const _H3 = (typeof H !== 'undefined') ? H : 700;
  for (const o of ws.flyingObjects) {
    // Only warn when the object is in the air approaching the car lane
    if (o.y < _H3 * 0.60 || o.life < 0.4) continue;
    const inLane = o.x > _W3 * 0.25 && o.x < _W3 * 0.75;
    if (!inLane) continue;
    // Arrow pointing from top of screen down toward the object
    const arrowX = Math.max(_W3 * 0.12, Math.min(_W3 * 0.88, o.x));
    const pulse   = 0.6 + 0.4 * Math.sin(Date.now() * 0.012);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle   = '#ff3300';
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth   = 2;
    // Downward triangle arrow at top of screen
    const ay = Math.max(36, o.y - _H3 * 0.28);
    ctx.beginPath();
    ctx.moveTo(arrowX,        ay);
    ctx.lineTo(arrowX - 10,   ay - 16);
    ctx.lineTo(arrowX + 10,   ay - 16);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ── Weather label banner (top of screen) ─────────────────────────────
  if (ws.current !== 'sunny') {
    const labels = {
      rain: '🌧 RAIN', snow: '❄ SNOW', storm: '⛈ STORM',
      sandstorm: '🌪 SANDSTORM', tropical_storm: '🌊 TROPICAL STORM', tornado: '🌪 TORNADO',
    };
    const lbl = labels[ws.current];
    if (lbl) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.50)';
      ctx.fillRect(0, 0, W, 28);
      ctx.fillStyle = '#ffee44'; ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, W / 2, 14);
      ctx.restore();
    }
  }

  ctx.restore();
}

// ── Check flying object collisions with player car ─────────────────────────
function checkFlyingObjectCollisions() {
  if (!player || player.crashTimer > 0) return;
  const _W = (typeof W !== 'undefined' && W > 0) ? W : 400;
  const _H = (typeof H !== 'undefined' && H > 0) ? H : 700;
  const carX1 = _W * 0.40, carX2 = _W * 0.60;
  const carY1 = _H * 0.72, carY2 = _H * 0.86;
  for (const o of weatherState.flyingObjects) {
    if (o.x > carX1 && o.x < carX2 && o.y > carY1 && o.y < carY2) { // eslint-disable-line
      player.speed     *= 0.55;
      player.crashTimer = 0.8;
      o.life            = 0;   // remove object
      if (typeof playCrash === 'function') playCrash();
      break;
    }
  }
}
