// ─────────────────────────────────────────────
//  INPUT  –  keyboard + touch state
// ─────────────────────────────────────────────

const keys       = {};
const touchState = { left: false, right: false, gas: false, brake: false, boost: false };

// ── Per-player configurable keys (multiplayer) ────────────────────────────
let p1KeyConfig = { nitro: 'ShiftLeft',  hardBrake: 'Space',   view: 'KeyV' };
let p2KeyConfig = { nitro: 'ShiftRight', hardBrake: 'Numpad0', view: 'KeyP' };

// When non-null, the next keydown press will be saved as a rebinding
let _listeningFor = null; // { player: 1|2, action: 'nitro'|'hardBrake'|'view' }


function initInput() {
  window.addEventListener('keydown', e => {
    // Key rebinding capture (multiplayer key config screen)
    if (_listeningFor) {
      const cfg = _listeningFor.player === 1 ? p1KeyConfig : p2KeyConfig;
      cfg[_listeningFor.action] = e.code;
      _listeningFor = null;
      e.preventDefault();
      return;
    }

    keys[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === 'Escape') handleEscKey();

    // View toggle: per-player in MP, global in single-player
    if (typeof STATE !== 'undefined' && STATE === 'RACING') {
      if (typeof multiplayerMode !== 'undefined' && multiplayerMode) {
        if (e.code === p1KeyConfig.view) {
          if (typeof p1ViewMode !== 'undefined')
            p1ViewMode = (p1ViewMode === '1st') ? '3rd' : '1st';
        }
        if (e.code === p2KeyConfig.view) {
          if (typeof p2ViewMode !== 'undefined')
            p2ViewMode = (p2ViewMode === '1st') ? '3rd' : '1st';
        }
      } else {
        if (e.code === 'KeyV') { if (typeof toggleView === 'function') toggleView(); }
      }
    } else {
      if (e.code === 'KeyV') { if (typeof toggleView === 'function') toggleView(); }
    }
  });

  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  // Focus canvas to catch keys reliably
  const canvas = document.getElementById('gameCanvas');
  canvas.setAttribute('tabindex', '0');
  canvas.focus();

  // Resume audio on any interaction
  window.addEventListener('pointerdown', resumeAudio, { once: false });
  window.addEventListener('keydown',     resumeAudio, { once: false });
}

// Reads current input into a normalised object used by player / game
function getInput() {
  return {
    left:      !!(keys['ArrowLeft']  || keys['KeyA'] || touchState.left),
    right:     !!(keys['ArrowRight'] || keys['KeyD'] || touchState.right),
    gas:       !!(keys['ArrowUp']    || keys['KeyW'] || touchState.gas),
    brake:     !!(keys['ArrowDown']  || keys['KeyS'] || touchState.brake),
    hardBrake: !!(keys['Space'] && !IS_MOBILE),
    nitro:     !!(keys['ShiftLeft']  || keys['ShiftRight'] || touchState.boost),
  };
}

// ── Per-player input (multiplayer) ────────────────────────────────────────
function getInputP1() {
  return {
    left:      !!(keys['KeyA']       || touchState.left),
    right:     !!(keys['KeyD']       || touchState.right),
    gas:       !!(keys['KeyW']       || touchState.gas),
    brake:     !!(keys['KeyS']       || touchState.brake),
    hardBrake: !!(keys[p1KeyConfig.hardBrake]),
    nitro:     !!(keys[p1KeyConfig.nitro] || touchState.boost),
  };
}

function getInputP2() {
  return {
    left:      !!(keys['ArrowLeft']),
    right:     !!(keys['ArrowRight']),
    gas:       !!(keys['ArrowUp']),
    brake:     !!(keys['ArrowDown']),
    hardBrake: !!(keys[p2KeyConfig.hardBrake]),
    nitro:     !!(keys[p2KeyConfig.nitro]),
  };
}

// ── ESC key routed through game state (defined in game.js) ───────────────
function handleEscKey() {
  if (typeof handleEsc === 'function') handleEsc();
}

// Pause tap from mobile button (defined in index.html inline handler)
function handlePauseTap() {
  resumeAudio();
  if (typeof handleEsc === 'function') handleEsc();
}
