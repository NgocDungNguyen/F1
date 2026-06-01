// ─────────────────────────────────────────────
//  MAIN GAME LOOP + STATE MACHINE
// ─────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let W = 0, H = 0;

// ── Game State ────────────────────────────────────────────────────────────
let STATE         = 'MENU';
let selectedTrack = 0;
let carConfig     = { color: '#e8001c', decal: 'stripes' };
let viewMode      = VIEW_1ST;          // VIEW_1ST | VIEW_3RD  (toggled with V)

let raceData = {
  lap: 1, raceTime: 0, lapStartTime: 0,
  lapTimes: [], position: 1, countdownT: 0,
};
let finishData = null;

let mouseX = 0, mouseY = 0;
let clickedThisFrame = false;

// ── Resize ────────────────────────────────────────────────────────────────
function resize() {
  const nw = window.innerWidth, nh = window.innerHeight;
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
  const mctrl   = document.getElementById('mobileControls');
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
  // 3rd-person: lower horizon (more road visible, camera "higher")
  horizonFrac = (viewMode === VIEW_3RD) ? HORIZON_FRAC - 0.06 : HORIZON_FRAC;
}

// ── Start race ─────────────────────────────────────────────────────────────
function startRace() {
  buildTrack(selectedTrack);
  initPlayer();
  initAI();
  lastCrashTime = -5;
  raceData = { lap:1, raceTime:0, lapStartTime:0, lapTimes:[], position:1, countdownT:0 };
  STATE    = 'COUNTDOWN';
  if (!audioCtx) initAudio();
  scheduleCountdownBeeps();
}

// ── Lap detection ──────────────────────────────────────────────────────────
function checkLap(prevZ) {
  const crossed = prevZ > TRACK_SEGMENTS * 0.9 && player.z < TRACK_SEGMENTS * 0.1;
  if (!crossed) return;
  const lapTime = raceData.raceTime - raceData.lapStartTime;
  raceData.lapTimes.push(lapTime);
  raceData.lapStartTime = raceData.raceTime;
  raceData.lap++;
  if (raceData.lap > TOTAL_LAPS) {
    finishData = { totalTime: raceData.raceTime, lapTimes: raceData.lapTimes, position: raceData.position };
    STATE = 'FINISH';
    silenceEngine();
    playFinishFanfare();
  }
}

// ── UPDATE ─────────────────────────────────────────────────────────────────
function update(dt) {
  switch (STATE) {
    case 'COUNTDOWN':
      raceData.countdownT += dt;
      if (raceData.countdownT >= 5) STATE = 'RACING';
      break;

    case 'RACING':
      raceData.raceTime += dt;
      const prevZ = player.z;
      updatePlayer(dt, getInput());
      updateAI(dt);
      checkCollisions(raceData.raceTime);
      checkLap(prevZ);
      raceData.position = computePosition();
      break;
  }
}

// ── RENDER ─────────────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, W, H);

  switch (STATE) {

    case 'MENU': {
      const a = renderMenu(W, H, raceData.raceTime, mouseX, mouseY, clickedThisFrame);
      if (a === 'PLAY') STATE = 'TRACK_SELECT';
      if (a === 'HOW')  STATE = 'HOW';
      break;
    }

    case 'HOW': {
      const a = renderHowToPlay(W, H, mouseX, mouseY, clickedThisFrame);
      if (a === 'BACK') STATE = 'MENU';
      break;
    }

    case 'TRACK_SELECT': {
      const a = renderTrackSelect(W, H, mouseX, mouseY, clickedThisFrame, selectedTrack);
      if (a) {
        if (a.type === 'SELECT') selectedTrack = a.idx;
        if (a.type === 'NEXT')   STATE = 'CAR_CUSTOMIZE';
        if (a.type === 'BACK')   STATE = 'MENU';
      }
      break;
    }

    case 'CAR_CUSTOMIZE': {
      const a = renderCarCustomize(W, H, mouseX, mouseY, clickedThisFrame);
      if (a) {
        if (typeof a === 'string' && a.startsWith('#')) carConfig.color = a;
        if (typeof a === 'object' && a.decal)           carConfig.decal = a.decal;
        if (a === 'START') startRace();
        if (a === 'BACK')  STATE = 'TRACK_SELECT';
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
        if (pa === 'MENU')   { STATE = 'MENU'; silenceEngine(); }
      }
      break;
    }

    case 'FINISH': {
      if (finishData) {
        const a = renderFinish(W, H, mouseX, mouseY, clickedThisFrame, finishData);
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

  // Set horizon based on view mode
  setViewHorizon();

  // Write effective X for scanline renderer
  _effectivePlayerX = ePX;

  // Project
  projectRoad(pZ, ePX, W, H);

  // Sky + ground
  renderSkyAndBackground(W, H);

  // Road
  renderRoad(W, H);

  // AI cars (always drawn regardless of view)
  renderAICars(W, H);

  // View-specific layer
  if (viewMode === VIEW_1ST) {
    renderCockpit(W, H);
  } else {
    renderPlayerCar(W, H);
  }
}

// ── Race HUD (drawn after scene) ──────────────────────────────────────────
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

  // Minimap
  renderMinimap(W, H, player ? player.z : 0);

  // View mode indicator (small badge)
  ctx.save();
  ctx.fillStyle    = 'rgba(0,0,0,0.55)';
  roundRect(ctx, W / 2 - 52, H * 0.695, 104, 22, 5, true, false);
  ctx.fillStyle    = viewMode === VIEW_1ST ? '#88ccff' : '#ffcc44';
  ctx.font         = 'bold 12px monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    viewMode === VIEW_1ST ? '🎥 1ST PERSON  [V]' : '🎥 3RD PERSON  [V]',
    W / 2, H * 0.695 + 11
  );
  ctx.restore();
}

// ── MAIN LOOP ──────────────────────────────────────────────────────────────
let lastTs = 0, lastState = '';

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
canvas.addEventListener('touchend', e   => { if (e.changedTouches.length > 0) { mouseX = e.changedTouches[0].clientX; mouseY = e.changedTouches[0].clientY; clickedThisFrame = true; } }, { passive: true });

// ── INIT ───────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  resize();
  checkOrientation();
  initInput();
  buildTrack(selectedTrack);
  requestAnimationFrame(loop);
});

window.addEventListener('resize', () => { resize(); checkOrientation(); });
