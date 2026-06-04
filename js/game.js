// ─────────────────────────────────────────────
//  MAIN GAME LOOP + STATE MACHINE
// ─────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let W = 0, H = 0;

// ── Game State ────────────────────────────────────────────────────────────
let STATE         = 'MENU';
let selectedTrack = 0;
let carConfig     = { color: '#e8001c', decal: 'stripes', vehicleType: 'f1', difficulty: 'medium' };
let viewMode      = VIEW_1ST;

let raceData = {
  lap: 1, raceTime: 0, lapStartTime: 0,
  lapTimes: [], position: 1, countdownT: 0,
};
let finishData = null;

let mouseX = 0, mouseY = 0;
let clickedThisFrame = false;

// ── Resize ────────────────────────────────────────────────────────────────
function resize() {
  const vv = window.visualViewport;
  const nw = vv ? Math.round(vv.width)  : window.innerWidth;
  const nh = vv ? Math.round(vv.height) : window.innerHeight;
  if (nw !== W || nh !== H) { W = canvas.width = nw; H = canvas.height = nh; }
}

// ── Orientation / mobile controls ─────────────────────────────────────────
function checkOrientation() {
  const overlay = document.getElementById('orientationOverlay');
  const portrait = IS_MOBILE && window.innerHeight > window.innerWidth;
  overlay.style.display = portrait ? 'flex' : 'none';
  updateMobileControls();
}

function updateMobileControls() {
  const mctrl = document.getElementById('mobileControls');
  if (!mctrl) return;
  const portrait = IS_MOBILE && window.innerHeight > window.innerWidth;
  const inGame   = ['COUNTDOWN','RACING','PAUSED'].includes(STATE);
  mctrl.style.display = (IS_MOBILE && !portrait && inGame) ? 'block' : 'none';
}

// ── ESC / Pause ────────────────────────────────────────────────────────────
function handleEsc() {
  if (STATE === 'RACING') { STATE = 'PAUSED'; silenceEngine(); }
  else if (STATE === 'PAUSED') { STATE = 'RACING'; }
}

// ── V key: toggle view mode ────────────────────────────────────────────────
function toggleView() {
  if (!['RACING','PAUSED','COUNTDOWN'].includes(STATE)) return;
  viewMode = viewMode === VIEW_1ST ? VIEW_3RD : VIEW_1ST;
}

// ── Camera helpers ─────────────────────────────────────────────────────────
function getEffectivePlayerX() {
  if (!player) return 0;
  const lean = viewMode === VIEW_1ST ? player.steeringAngle * CAMERA_LEAN_FACTOR : 0;
  return player.x + lean;
}

function setViewHorizon() {
  horizonFrac = (viewMode === VIEW_3RD) ? HORIZON_FRAC - 0.06 : HORIZON_FRAC;
}

// ── Start race ─────────────────────────────────────────────────────────────
function startRace() {
  buildTrack(selectedTrack);
  initPlayer();
  initAI();
  initWeather();
  lastCrashTime = -5;
  raceData = { lap:1, raceTime:0, lapStartTime:0, lapTimes:[], position:1, countdownT:0 };
  STATE    = 'COUNTDOWN';
  if (!audioCtx) initAudio();
  scheduleCountdownBeeps();
}

// ── Item collection ────────────────────────────────────────────────────────
function checkItemCollection() {
  if (!player || !segments) return;
  const idx = Math.floor(player.z) % TRACK_SEGMENTS;
  const seg = segments[idx];
  if (seg && seg.item) {
    _applyItem(seg.item);
    seg.item = null;
  }
}

function _applyItem(id) {
  if (!player) return;
  const veh = VEHICLE_DEFS[carConfig.vehicleType] || VEHICLE_DEFS.f1;
  switch (id) {
    case 'nitro':
      player.boostTimer    = veh.boostDuration;
      player.boostCooldown = 0;
      player.boosting      = true;
      playBoostSound();
      break;
    case 'shield':
      player.shield = true;
      break;
    case 'grip':
      player.gripTimer = ITEM_DEFS.grip.duration;
      break;
    case 'turbo':
      player.turboTimer = ITEM_DEFS.turbo.duration;
      break;
    case 'cool':
      player.heat      = 0;
      player.coolTimer = ITEM_DEFS.cool.duration;
      break;
    case 'dragon':
      player.dragonTimer   = ITEM_DEFS.dragon.duration;
      player.shield        = true;
      player.boostTimer    = ITEM_DEFS.dragon.duration;
      player.boostCooldown = 0;
      player.boosting      = true;
      break;
  }
}

// ── Slipstream detection (Monza slipstreamZone segments) ──────────────────
function checkSlipstream(dt) {
  if (!player || !segments || !aiCars) return;
  const idx = Math.floor(player.z) % TRACK_SEGMENTS;
  const seg = segments[idx];
  player.slipstreaming = false;
  if (!seg || !seg.slipstreamZone) return;
  const veh = VEHICLE_DEFS[carConfig.vehicleType] || VEHICLE_DEFS.f1;
  for (const ai of aiCars) {
    let relZ = ai.z - player.z;
    if (relZ < 0) relZ += TRACK_SEGMENTS;
    if (relZ >= 3 && relZ <= 8 && Math.abs(ai.x - player.x) < 0.40) {
      player.slipstreaming = true;
      player.speed = Math.min(player.speed + 0.8 * dt, veh.maxSpeed * 1.12);
      break;
    }
  }
}

// ── Lap detection ──────────────────────────────────────────────────────────
function checkLap(prevZ) {
  const crossed = prevZ > TRACK_SEGMENTS * 0.9 && player.z < TRACK_SEGMENTS * 0.1;
  if (!crossed) return;
  respawnTrackItems();
  const lapTime = raceData.raceTime - raceData.lapStartTime;
  raceData.lapTimes.push(lapTime);
  raceData.lapStartTime = raceData.raceTime;
  raceData.lap++;
  if (raceData.lap > TOTAL_LAPS) {
    finishData = { totalTime: raceData.raceTime, lapTimes: raceData.lapTimes, position: raceData.position };
    STATE = 'FINISH';
    silenceEngine();
    stopRainAmbient();
    stopWindAmbient();
    playFinishFanfare();
    // Great Wall: launch fireworks on finish
    if (currentTrackDef && currentTrackDef.bgObjects === 'greatwall') triggerFireworks();
  }
}

// ── UPDATE ─────────────────────────────────────────────────────────────────
function update(dt) {
  switch (STATE) {
    case 'COUNTDOWN':
      raceData.countdownT += dt;
      if (raceData.countdownT >= 5) STATE = 'RACING';
      break;

    case 'RACING': {
      raceData.raceTime += dt;
      const prevZ = player.z;
      updatePlayer(dt, getInput());
      updateAI(dt);
      updateWeather(dt);
      checkCollisions(raceData.raceTime);
      checkFlyingObjectCollisions();
      checkItemCollection(dt);
      checkSlipstream(dt);
      checkLap(prevZ);
      raceData.position = computePosition();
      break;
    }
  }
}

// ── RENDER ─────────────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, W, H);

  switch (STATE) {

    case 'MENU': {
      const a = renderMenu(W, H, raceData.raceTime, mouseX, mouseY, clickedThisFrame);
      if (a === 'PLAY') STATE = 'DIFFICULTY_SELECT';
      if (a === 'HOW')  STATE = 'HOW';
      break;
    }

    case 'HOW': {
      const a = renderHowToPlay(W, H, mouseX, mouseY, clickedThisFrame);
      if (a === 'BACK') STATE = 'MENU';
      break;
    }

    case 'DIFFICULTY_SELECT': {
      const a = renderDifficultySelect(W, H, mouseX, mouseY, clickedThisFrame, carConfig.difficulty);
      if (a) {
        if (typeof a === 'object' && a.difficulty) carConfig.difficulty = a.difficulty;
        if (a === 'NEXT') STATE = 'TRACK_SELECT';
        if (a === 'BACK') STATE = 'MENU';
      }
      break;
    }

    case 'TRACK_SELECT': {
      const a = renderTrackSelect(W, H, mouseX, mouseY, clickedThisFrame, selectedTrack);
      if (a) {
        if (a.type === 'SELECT') selectedTrack = a.idx;
        if (a.type === 'NEXT')   STATE = 'VEHICLE_SELECT';
        if (a.type === 'BACK')   STATE = 'DIFFICULTY_SELECT';
      }
      break;
    }

    case 'VEHICLE_SELECT': {
      const a = renderVehicleSelect(W, H, mouseX, mouseY, clickedThisFrame, carConfig.vehicleType);
      if (a) {
        if (typeof a === 'object' && a.vehicleType) carConfig.vehicleType = a.vehicleType;
        if (a === 'NEXT') STATE = 'CAR_CUSTOMIZE';
        if (a === 'BACK') STATE = 'TRACK_SELECT';
      }
      break;
    }

    case 'CAR_CUSTOMIZE': {
      const a = renderCarCustomize(W, H, mouseX, mouseY, clickedThisFrame, carConfig.vehicleType);
      if (a) {
        if (typeof a === 'string' && a.startsWith('#')) carConfig.color = a;
        if (typeof a === 'object' && a.decal)           carConfig.decal = a.decal;
        if (a === 'START') startRace();
        if (a === 'BACK')  STATE = 'VEHICLE_SELECT';
      }
      break;
    }

    case 'COUNTDOWN':
    case 'RACING':
    case 'PAUSED': {
      _renderRaceScene();
      if (STATE === 'COUNTDOWN') {
        renderCountdown(W, H, raceData.countdownT);
      } else if (STATE === 'RACING') {
        _renderRaceHUD();
      } else if (STATE === 'PAUSED') {
        _renderRaceHUD();
        const pa = renderPause(W, H, mouseX, mouseY, clickedThisFrame);
        if (pa === 'RESUME') STATE = 'RACING';
        if (pa === 'MENU')   { STATE = 'MENU'; silenceEngine(); stopRainAmbient(); stopWindAmbient(); }
      }
      break;
    }

    case 'FINISH': {
      if (finishData) {
        const a = renderFinish(W, H, mouseX, mouseY, clickedThisFrame, finishData);
        renderFireworks(W, H, 0.016);
        if (a === 'AGAIN') STATE = 'TRACK_SELECT';
        if (a === 'MENU')  STATE = 'MENU';
      }
      break;
    }
  }
}

// ── Race scene composite ───────────────────────────────────────────────────
function _renderRaceScene() {
  const pZ  = player ? player.z : 0;
  const ePX = getEffectivePlayerX();

  setViewHorizon();

  // Apply weather visibility — shorten effective draw distance at night/blizzard
  const visScale = (typeof weatherState !== 'undefined') ? weatherState.visibility : 1.0;
  _weatherVisibility = visScale;

  _effectivePlayerX = ePX;
  projectRoad(pZ, ePX, W, H);

  renderSkyAndBackground(W, H);
  renderRoad(W, H);
  renderItemOrbs(W, H);
  renderAICars(W, H);

  // Weather overlay (particles, sky tint) — drawn over road but under cockpit
  if (typeof renderWeatherOverlay === 'function') renderWeatherOverlay(W, H);

  if (viewMode === VIEW_1ST) {
    renderCockpit(W, H);
  } else {
    renderPlayerCar(W, H);
  }
}

// ── Race HUD ──────────────────────────────────────────────────────────────
function _renderRaceHUD() {
  renderHUD(W, H, {
    speed:         player ? player.speed        : 0,
    lap:           raceData.lap,
    raceTime:      raceData.raceTime,
    position:      raceData.position,
    boostTimer:    player ? player.boostTimer   : 0,
    boostCooldown: player ? player.boostCooldown: 0,
    boosting:      player ? player.boosting     : false,
  });

  renderMinimap(W, H, player ? player.z : 0);

  // Weather status badge (top-center, below lap counter)
  if (typeof weatherState !== 'undefined' && weatherState.current !== 'sunny') {
    const wIcons = { rain:'🌧️', snow:'❄️', storm:'⛈️', sandstorm:'🌪️', tropical_storm:'🌊', tornado:'🌪️' };
    const icon   = wIcons[weatherState.current] || '';
    if (icon) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, W/2 - 36, 54, 72, 22, 5, true, false);
      ctx.fillStyle = '#ffcc00'; ctx.font = '13px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(icon + ' ' + weatherState.current.toUpperCase().replace('_',' '), W/2, 65);
      ctx.restore();
    }
  }

  // View mode badge
  ctx.save();
  ctx.fillStyle    = 'rgba(0,0,0,0.55)';
  roundRect(ctx, W / 2 - 52, H * 0.695, 104, 22, 5, true, false);
  ctx.fillStyle    = viewMode === VIEW_1ST ? '#88ccff' : '#ffcc44';
  ctx.font         = 'bold 12px monospace';
  ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(viewMode === VIEW_1ST ? '🎥 1ST PERSON  [V]' : '🎥 3RD PERSON  [V]', W/2, H*0.695+11);
  ctx.restore();
}

// ── MAIN LOOP ──────────────────────────────────────────────────────────────
let lastTs = 0, lastState = '';
let _weatherVisibility = 1.0;  // read by renderer for draw-distance clipping

function loop(ts) {
  const dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs   = ts;
  resize();
  update(dt);
  render();
  if (STATE !== lastState) { lastState = STATE; updateMobileControls(); }
  clickedThisFrame = false;
  requestAnimationFrame(loop);
}

// ── INPUT WIRING ───────────────────────────────────────────────────────────
canvas.addEventListener('mousemove', e  => { mouseX = e.clientX; mouseY = e.clientY; });
canvas.addEventListener('mousedown', e  => { mouseX = e.clientX; mouseY = e.clientY; clickedThisFrame = true; resumeAudio(); });
canvas.addEventListener('touchstart', e => { if (e.touches.length > 0) { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; } resumeAudio(); }, { passive: true });
canvas.addEventListener('touchend',   e => { if (e.changedTouches.length > 0) { mouseX = e.changedTouches[0].clientX; mouseY = e.changedTouches[0].clientY; clickedThisFrame = true; } }, { passive: true });

// ── INIT ───────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  resize();
  checkOrientation();
  initInput();
  buildTrack(selectedTrack);
  requestAnimationFrame(loop);
});

window.addEventListener('resize', () => { resize(); checkOrientation(); });
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => { resize(); checkOrientation(); });
  window.visualViewport.addEventListener('scroll', () => { resize(); });
}
