// ─────────────────────────────────────────────
//  INPUT  –  keyboard + touch state
// ─────────────────────────────────────────────

const keys       = {};
const touchState = { left: false, right: false, gas: false, brake: false, boost: false };

function initInput() {
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === 'Escape') handleEscKey();
    if (e.code === 'KeyV')   { if (typeof toggleView === 'function') toggleView(); }
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
    left:  !!(keys['ArrowLeft']  || keys['KeyA'] || touchState.left),
    right: !!(keys['ArrowRight'] || keys['KeyD'] || touchState.right),
    gas:   !!(keys['ArrowUp']    || keys['KeyW'] || touchState.gas),
    brake: !!(keys['ArrowDown']  || keys['KeyS'] || touchState.brake),
    boost: !!(keys['Space']                      || touchState.boost),
  };
}

// ESC key routed through game state (defined in game.js)
function handleEscKey() {
  if (typeof handleEsc === 'function') handleEsc();
}

// Pause tap from mobile button (defined in index.html inline handler)
function handlePauseTap() {
  resumeAudio();
  if (typeof handleEsc === 'function') handleEsc();
}
