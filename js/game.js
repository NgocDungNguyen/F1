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

// ── Multiplayer state ─────────────────────────────────────────────────────
let multiplayerMode = false;
let player1         = null;
let player2         = null;
let p1CarConfig     = { color: '#e8001c', decal: 'stripes', vehicleType: 'f1', difficulty: 'medium' };
let p2CarConfig     = { color: '#0033cc', decal: 'solid',   vehicleType: 'f1', difficulty: 'medium' };
let p1ViewMode      = VIEW_3RD;
let p2ViewMode      = VIEW_3RD;
let _projected1     = [];
let _projected2     = [];
let p2Lap           = 1;
let p1Finished      = false;
let p2Finished      = false;
// MP vehicle-select cursor (which vehicle is highlighted per player)
let _mpP1VehicleIdx = 0;
let _mpP2VehicleIdx = 0;

let mouseX = 0, mouseY = 0;
let clickedThisFrame = false;

// ── Resize ────────────────────────────────────────────────────────────────
function resize() {
  const vv = window.visualViewport;
  const nw = vv ? Math.round(vv.width)     : window.innerWidth;
  const nh = vv ? Math.round(vv.height)    : window.innerHeight;
  const ox = vv ? Math.round(vv.offsetLeft) : 0;
  const oy = vv ? Math.round(vv.offsetTop)  : 0;

  if (nw !== W || nh !== H) {
    W = canvas.width  = nw;
    H = canvas.height = nh;
  }
  // Sync CSS pixel size to exactly match the canvas bitmap — eliminates the
  // CSS-to-canvas coordinate scale mismatch that causes touch misalignment.
  canvas.style.width  = nw + 'px';
  canvas.style.height = nh + 'px';
  // Position canvas at visual viewport offset (accounts for visible address bar).
  canvas.style.left   = ox + 'px';
  canvas.style.top    = oy + 'px';
}

// ── Touch/mouse coordinate helper ────────────────────────────────────────
// Converts CSS client coordinates to canvas pixel coordinates.
// Required because canvas CSS size may differ from canvas bitmap size
// (especially when browser chrome is visible on mobile).
function _toCanvas(clientX, clientY) {
  const r  = canvas.getBoundingClientRect();
  const sx = r.width  > 0 ? W / r.width  : 1;
  const sy = r.height > 0 ? H / r.height : 1;
  return {
    x: (clientX - r.left) * sx,
    y: (clientY - r.top)  * sy,
  };
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

// ── Start multiplayer race ─────────────────────────────────────────────────
function startMultiplayerRace() {
  multiplayerMode = true;
  buildTrack(selectedTrack);
  // Init both players
  player1 = createPlayer(); player1.z = 10;
  player2 = createPlayer(); player2.z = 4;
  player  = player1;  // keep global pointing at P1 as default
  carConfig = p1CarConfig;
  // Init AI using P1 difficulty
  const savedCC = carConfig;
  carConfig = { ...p1CarConfig };
  initAI();
  carConfig = savedCC;
  initWeather();
  lastCrashTime = -5;
  raceData = { lap: 1, raceTime: 0, lapStartTime: 0, lapTimes: [], position: 1, countdownT: 0 };
  p2Lap = 1;
  p1Finished = false;
  p2Finished = false;
  p1ViewMode = VIEW_3RD;
  p2ViewMode = VIEW_3RD;
  STATE = 'COUNTDOWN';
  if (!audioCtx) initAudio();
  scheduleCountdownBeeps();
}

// ── Lap check for multiplayer (does not auto-set STATE = FINISH) ────────────
function _checkLapMP(prevZ, who) {
  const curZ = player.z;
  if (prevZ > TRACK_SEGMENTS * 0.9 && curZ < TRACK_SEGMENTS * 0.1) {
    raceData.lap++;
    if (typeof showPopup === 'function')
      showPopup(`LAP ${raceData.lap}`, '#ffcc00', 1.2);
    if (who === 'p1' && raceData.lap > TOTAL_LAPS) p1Finished = true;
    if (who === 'p2' && raceData.lap > TOTAL_LAPS) p2Finished = true;
  }
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
      player.nitroBar = Math.min(1, player.nitroBar + 0.60);
      if (!player.boosting && player.nitroBar > 0.01) {
        player.nitroLevel = 1; player.boosting = true;
      }
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
      player.dragonTimer = ITEM_DEFS.dragon.duration;
      player.shield      = true;
      player.nitroBar    = 1.0;
      player.nitroLevel  = 3;
      player.boosting    = true;
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
    finishData = {
      totalTime:  raceData.raceTime,
      lapTimes:   raceData.lapTimes,
      position:   raceData.position,
      takedowns:  player ? (player.takedowns || 0) : 0,
      nearMisses: player ? (player.nearMisses || 0) : 0,
      driftTime:  player ? Math.round(player.totalDriftTime || 0) : 0,
      animTime:   0,
    };
    STATE = 'FINISH';
    silenceEngine();
    stopRainAmbient();
    stopWindAmbient();
    playFinishFanfare();
    // Great Wall: launch fireworks on finish
    if (currentTrackDef && currentTrackDef.bgObjects === 'greatwall') triggerFireworks();
  }
}

// ── Near-miss detection ───────────────────────────────────────────────────
function checkNearMisses() {
  if (!player || !aiCars) return;
  const veh       = VEHICLE_DEFS[carConfig.vehicleType] || VEHICLE_DEFS.f1;
  const hitRadius = veh.collisionRadius + 0.13;
  for (const ai of aiCars) {
    let relZ = ai.z - player.z;
    if (relZ < 0) relZ += TRACK_SEGMENTS;
    if (relZ < 0.4 || relZ > 4.0) continue;
    const latDiff = Math.abs(player.x - ai.x);
    if (latDiff < hitRadius * 1.8 && latDiff > hitRadius) {
      if (!ai._nearMissedThisFrame) {
        player.nitroBar = Math.min(1, player.nitroBar + 0.15);
        player.nearMisses    = (player.nearMisses || 0) + 1;
        if (typeof showPopup === 'function') showPopup('NEAR MISS! ✨', '#ffee44', 1.0);
        ai._nearMissedThisFrame = true;
      }
    } else {
      ai._nearMissedThisFrame = false;
    }
  }
}

// ── UPDATE ─────────────────────────────────────────────────────────────────
function update(dt) {
  switch (STATE) {
    case 'COUNTDOWN':
      raceData.countdownT += dt;
      updateCameraShake(dt);
      // Trigger camera shake + flash exactly once at GO! moment
      if (raceData.countdownT >= 4.0 && raceData.countdownT - dt < 4.0) {
        triggerCameraShake(1.2);
        triggerFlash('#00ff88', 0.70);
      }
      if (raceData.countdownT >= 5) STATE = 'RACING';
      break;

    case 'RACING': {
      raceData.raceTime += dt;

      if (multiplayerMode) {
        // ── Player 1 ────────────────────────────────────────────────────────
        const prevZ1 = player1.z;
        player = player1; carConfig = p1CarConfig;
        updatePlayer(dt, getInputP1());
        checkItemCollection(dt);
        checkSlipstream(dt);
        checkNearMisses();
        if (!player.altRoute) checkCollisions(raceData.raceTime);
        const savedLap1 = raceData.lap;
        _checkLapMP(prevZ1, 'p1');
        raceData.position = computePosition();

        // ── Player 2 ────────────────────────────────────────────────────────
        const prevZ2 = player2.z;
        player = player2; carConfig = p2CarConfig;
        raceData.lap = p2Lap;
        updatePlayer(dt, getInputP2());
        checkItemCollection(dt);
        checkSlipstream(dt);
        checkNearMisses();
        if (!player.altRoute) checkCollisions(raceData.raceTime);
        _checkLapMP(prevZ2, 'p2');
        p2Lap = raceData.lap;
        raceData.lap = savedLap1;
        raceData.p2Position = computePosition();

        // ── Shared ──────────────────────────────────────────────────────────
        player = player1; carConfig = p1CarConfig;
        updateAI(dt);
        updateWeather(dt);

        if (p1Finished && p2Finished) {
          finishData = { time: raceData.raceTime, lap: TOTAL_LAPS, position: raceData.position, lapTimes: raceData.lapTimes, multiplayer: true, p2Lap };
          STATE = 'FINISH';
        }
      } else {
        // ── Single player ────────────────────────────────────────────────────
        const prevZ = player.z;
        updatePlayer(dt, getInput());
        updateAI(dt);
        updateWeather(dt);
        updateCameraShake(dt);
        if (!player || !player.altRoute) {
          checkCollisions(raceData.raceTime);
          checkFlyingObjectCollisions();
        }
        checkItemCollection(dt);
        checkSlipstream(dt);
        checkNearMisses();
        checkLap(prevZ);
        raceData.position = computePosition();
      }
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
      if (a === 'PLAY')        { if (typeof tryFullscreen === 'function') tryFullscreen(); STATE = 'DIFFICULTY_SELECT'; }
      if (a === 'HOW')         STATE = 'HOW';
      if (a === 'MULTIPLAYER') { if (typeof tryFullscreen === 'function') tryFullscreen(); STATE = 'MP_VEHICLE_P1'; }
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
        if (a === 'START') { if (typeof tryFullscreen === 'function') tryFullscreen(); startRace(); }
        if (a === 'BACK')  STATE = 'VEHICLE_SELECT';
      }
      break;
    }

    case 'MP_VEHICLE_P1': {
      const a = renderMPVehicleSelect(W, H, mouseX, mouseY, clickedThisFrame, 1, p1CarConfig, _mpP1VehicleIdx);
      if (a && a.vehicleType) { p1CarConfig.vehicleType = a.vehicleType; _mpP1VehicleIdx = a.idx || 0; }
      if (a === 'NEXT') STATE = 'MP_VEHICLE_P2';
      if (a === 'BACK') { multiplayerMode = false; STATE = 'MENU'; }
      break;
    }

    case 'MP_VEHICLE_P2': {
      const a = renderMPVehicleSelect(W, H, mouseX, mouseY, clickedThisFrame, 2, p2CarConfig, _mpP2VehicleIdx);
      if (a && a.vehicleType) { p2CarConfig.vehicleType = a.vehicleType; _mpP2VehicleIdx = a.idx || 0; }
      if (a === 'NEXT') STATE = 'MP_KEY_CONFIG';
      if (a === 'BACK') STATE = 'MP_VEHICLE_P1';
      break;
    }

    case 'MP_KEY_CONFIG': {
      const a = renderMPKeyConfig(W, H, mouseX, mouseY, clickedThisFrame);
      if (a === 'START') { startMultiplayerRace(); }
      if (a === 'BACK')  STATE = 'MP_VEHICLE_P2';
      break;
    }

    case 'COUNTDOWN':
    case 'RACING':
    case 'PAUSED': {
      if (multiplayerMode) {
        _renderSplitScreen();
        if (STATE === 'COUNTDOWN') {
          renderCountdown(W, H, raceData.countdownT);
        } else if (STATE === 'PAUSED') {
          const pa = renderPause(W, H, mouseX, mouseY, clickedThisFrame);
          if (pa === 'RESUME') STATE = 'RACING';
          if (pa === 'MENU')   { STATE = 'MENU'; multiplayerMode = false; silenceEngine(); stopRainAmbient(); stopWindAmbient(); }
        }
      } else {
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

  const visScale = (typeof weatherState !== 'undefined') ? weatherState.visibility : 1.0;
  _weatherVisibility = visScale;

  _effectivePlayerX = ePX;

  // Apply camera shake as canvas translation
  ctx.save();
  ctx.translate(_cameraShakeX || 0, _cameraShakeY || 0);

  // Swap segment array AND sky colors when player is on an alt route
  const _savedSegments = segments;
  const _savedSkyTop   = currentTrackDef ? currentTrackDef.skyTop  : null;
  const _savedSkyBot   = currentTrackDef ? currentTrackDef.skyBot   : null;
  const _savedHillCol  = currentTrackDef ? currentTrackDef.hillColor: null;
  let   renderZ        = pZ;
  if (player && player.altRoute && typeof _altRouteData !== 'undefined') {
    const ar = _altRouteData[player.altRoute.idx];
    if (ar) {
      segments = ar.builtSegments;
      renderZ  = player.altRoute.altZ;
      // Override sky and terrain colors for total visual transformation
      if (currentTrackDef) {
        if (ar.skyTop)    currentTrackDef.skyTop    = ar.skyTop;
        if (ar.skyBot)    currentTrackDef.skyBot     = ar.skyBot;
        if (ar.hillColor) currentTrackDef.hillColor  = ar.hillColor;
      }
    }
  }

  projectRoad(renderZ, ePX, W, H);
  renderSkyAndBackground(W, H);
  renderRoad(W, H);
  renderItemOrbs(W, H);
  renderAICars(W, H);

  if (typeof renderWeatherOverlay === 'function') renderWeatherOverlay(W, H);

  if (viewMode === VIEW_1ST) {
    renderCockpit(W, H);
  } else {
    renderPlayerCar(W, H);
  }

  // Always restore segments and track colors after rendering
  segments = _savedSegments;
  if (currentTrackDef) {
    if (_savedSkyTop  !== null) currentTrackDef.skyTop    = _savedSkyTop;
    if (_savedSkyBot  !== null) currentTrackDef.skyBot     = _savedSkyBot;
    if (_savedHillCol !== null) currentTrackDef.hillColor  = _savedHillCol;
  }

  ctx.restore();

  // Speed lines and screen flash drawn outside shake transform (screen-space)
  if (player) {
    const spFrac = player.speed / ((VEHICLE_DEFS[carConfig.vehicleType] || VEHICLE_DEFS.f1).maxSpeed);
    renderSpeedLines(W, H, spFrac);
  }
  renderScreenFlash(W, H, _loopDt);
}

// ── Race HUD ──────────────────────────────────────────────────────────────
function _renderRaceHUD() {
  renderHUD(W, H, {
    speed:         player ? player.speed        : 0,
    lap:           raceData.lap,
    raceTime:      raceData.raceTime,
    position:      raceData.position,
    nitroBar:       player ? player.nitroBar       : 0,
    nitroLevel:     player ? player.nitroLevel     : 0,
    nitroTapWindow: player ? player.nitroTapWindow : false,
    boosting:       player ? player.boosting       : false,
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

// ── Split-screen multiplayer renderer ─────────────────────────────────────
function _renderSplitScreen() {
  const halfW  = Math.floor(W / 2);
  const savedW = W;

  function renderHalf(playerObj, carCfg, vMode, projArr, offsetX) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(offsetX, 0, halfW, H);
    ctx.clip();
    if (offsetX > 0) ctx.translate(offsetX, 0);

    // Per-player camera shake
    const shakeX = playerObj.cameraShakeX || 0;
    const shakeY = playerObj.cameraShakeY || 0;

    // Swap globals
    const _sp  = player, _sc = carConfig, _sv = viewMode;
    const _spr = _projected;
    const _sShakeX = _cameraShakeX, _sShakeY = _cameraShakeY;
    player    = playerObj;
    carConfig = carCfg;
    viewMode  = vMode;
    _projected = projArr;
    _cameraShakeX = shakeX;
    _cameraShakeY = shakeY;
    W = halfW;

    _renderRaceScene();
    if (STATE === 'RACING') _renderRaceHUD();

    // Restore globals
    player    = _sp;
    carConfig = _sc;
    viewMode  = _sv;
    _projected     = _spr;
    _cameraShakeX  = _sShakeX;
    _cameraShakeY  = _sShakeY;
    W = savedW;
    ctx.restore();
  }

  renderHalf(player1, p1CarConfig, p1ViewMode, _projected1, 0);
  renderHalf(player2, p2CarConfig, p2ViewMode, _projected2, halfW);

  // Centre divider
  ctx.fillStyle = 'rgba(220,220,220,0.75)';
  ctx.fillRect(halfW - 1, 0, 2, H);

  // Player labels
  ctx.save();
  ctx.font      = 'bold 14px monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(4, 4, 34, 18);
  ctx.fillRect(halfW * 2 - 38, 4, 34, 18);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';  ctx.fillText('P1', 8,  6);
  ctx.textAlign = 'right'; ctx.fillText('P2', halfW * 2 - 8, 6);
  ctx.restore();
}

// ── MAIN LOOP ──────────────────────────────────────────────────────────────
let lastTs = 0, lastState = '';
let _weatherVisibility = 1.0;  // read by renderer for draw-distance clipping
let _loopDt = 0.016;           // current frame dt, read by effects

function loop(ts) {
  const dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs   = ts;
  _loopDt  = dt;
  resize();
  update(dt);
  render();
  if (STATE !== lastState) { lastState = STATE; updateMobileControls(); }
  clickedThisFrame = false;
  requestAnimationFrame(loop);
}

// ── INPUT WIRING ───────────────────────────────────────────────────────────
canvas.addEventListener('mousemove', e => {
  const c = _toCanvas(e.clientX, e.clientY);
  mouseX = c.x; mouseY = c.y;
});
canvas.addEventListener('mousedown', e => {
  const c = _toCanvas(e.clientX, e.clientY);
  mouseX = c.x; mouseY = c.y;
  clickedThisFrame = true; resumeAudio();
});
canvas.addEventListener('touchstart', e => {
  if (e.touches.length > 0) {
    const c = _toCanvas(e.touches[0].clientX, e.touches[0].clientY);
    mouseX = c.x; mouseY = c.y;
  }
  if (typeof tryFullscreen === 'function') tryFullscreen();
  resumeAudio();
}, { passive: true });
canvas.addEventListener('touchend', e => {
  if (e.changedTouches.length > 0) {
    const c = _toCanvas(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    mouseX = c.x; mouseY = c.y; clickedThisFrame = true;
  }
}, { passive: true });

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
