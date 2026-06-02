// ─────────────────────────────────────────────
//  WEB AUDIO API  –  per-vehicle engine, weather ambients, FX
// ─────────────────────────────────────────────

let audioCtx        = null;
let engineOsc       = null;    // primary oscillator
let engineOsc2      = null;    // harmonic (motorcycle only)
let engineGain      = null;
let engineGain2     = null;    // separate gain for harmonic at 0.30 level
let engineDistNode  = null;
let audioReady      = false;

// Weather ambient nodes
let rainSrc        = null;
let rainGain       = null;
let windSrc        = null;
let windGain       = null;

function initAudio() {
  if (audioReady) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    engineDistNode = audioCtx.createWaveShaper();
    engineDistNode.curve = makeDistortionCurve(80);
    engineDistNode.oversample = '2x';

    engineOsc = audioCtx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 65;

    // Second oscillator for motorcycle harmonic — silent by default
    engineOsc2 = audioCtx.createOscillator();
    engineOsc2.type = 'sine';
    engineOsc2.frequency.value = 140;

    engineGain = audioCtx.createGain();
    engineGain.gain.value = 0;

    // Harmonic gets its own gain node fixed at 0.30 relative volume
    engineGain2 = audioCtx.createGain();
    engineGain2.gain.value = 0.30;

    engineOsc.connect(engineDistNode);
    engineDistNode.connect(engineGain);
    engineOsc2.connect(engineGain2);
    engineGain2.connect(engineGain);   // harmonic → its gain (0.30) → master gain
    engineGain.connect(audioCtx.destination);

    engineOsc.start();
    engineOsc2.start();

    audioReady = true;
  } catch (e) {
    console.warn('AudioContext init failed:', e);
  }
}

function makeDistortionCurve(amount) {
  const n    = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

// ── Per-vehicle engine sound ──────────────────────────────────────────────────
// normSpeed: 0–1. carConfig.vehicleType selects the sound profile from VEHICLE_DEFS.
function updateEngineSound(normSpeed) {
  if (!audioReady) return;
  const vt  = (typeof carConfig !== 'undefined') ? (carConfig.vehicleType || 'f1') : 'f1';
  const def = (typeof VEHICLE_DEFS !== 'undefined') ? (VEHICLE_DEFS[vt] || VEHICLE_DEFS.f1) : null;
  const freqLo  = def ? def.freqLo  : 80;
  const freqHi  = def ? def.freqHi  : 340;
  const distAmt = def ? def.distAmt : 80;
  const oscType = def ? def.oscType  : 'sawtooth';

  // Reconfigure oscillator type if it changed (can't change mid-play without glitch — only on type change)
  if (engineOsc.type !== oscType) {
    engineOsc.type = oscType;
    engineDistNode.curve = makeDistortionCurve(distAmt);
  }

  const freq = freqLo + normSpeed * (freqHi - freqLo);
  const vol  = 0.03 + normSpeed * 0.09;

  engineOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.07);
  engineGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.07);

  // Motorcycle: second harmonic oscillator at 2.1× frequency, 30% volume
  if (vt === 'moto') {
    engineOsc2.frequency.setTargetAtTime(freq * 2.1, audioCtx.currentTime, 0.07);
    // Use gain param on engineOsc2 via engineGain (shared); harmonic is 30% of main
    // Since they share the gain node we set harmonic at lower amplitude at source via engineGain
    // Instead: set osc2 gain indirectly — it is always 30% since both go to engineGain
  } else {
    // Non-moto: silence the harmonic osc (set freq very low, inaudible)
    engineOsc2.frequency.setTargetAtTime(10, audioCtx.currentTime, 0.1);
  }
}

function silenceEngine() {
  if (!audioReady) return;
  engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
}

// ── Crash sound ───────────────────────────────────────────────────────────────
function playCrash() {
  if (!audioReady) return;
  const dur     = 0.55;
  const bufSize = Math.floor(audioCtx.sampleRate * dur);
  const buf     = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data    = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const env = Math.pow(1 - i / bufSize, 1.8);
    data[i]   = (Math.random() * 2 - 1) * env;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const g = audioCtx.createGain();
  g.gain.value = 0.55;
  src.connect(g); g.connect(audioCtx.destination); src.start();
}

// ── Beeps (countdown, fanfare) ────────────────────────────────────────────────
function playBeep(freq, when, duration) {
  if (!audioReady) return;
  const osc = audioCtx.createOscillator();
  const g   = audioCtx.createGain();
  osc.type            = 'square';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.28, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + duration);
  osc.connect(g); g.connect(audioCtx.destination);
  osc.start(when); osc.stop(when + duration + 0.02);
}

function scheduleCountdownBeeps() {
  if (!audioReady) return;
  const now = audioCtx.currentTime;
  playBeep(440, now + 1.0, 0.25);
  playBeep(440, now + 2.0, 0.25);
  playBeep(440, now + 3.0, 0.25);
  playBeep(880, now + 4.0, 0.45);
}

function playFinishFanfare() {
  if (!audioReady) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => playBeep(freq, audioCtx.currentTime + i * 0.18, 0.3));
}

// ── Per-vehicle boost sound ───────────────────────────────────────────────────
function playBoostSound() {
  if (!audioReady) return;
  const vt = (typeof carConfig !== 'undefined') ? (carConfig.vehicleType || 'f1') : 'f1';
  const osc = audioCtx.createOscillator();
  const g   = audioCtx.createGain();

  switch (vt) {
    case 'f1v2':   // LMP1 — electric torque surge (lower, longer)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.80);
      g.gain.setValueAtTime(0.20, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.90);
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.95);
      break;
    case 'nascar': // NASCAR — supercharger whine (deep then mid)
      osc.type = 'square';
      osc.frequency.setValueAtTime(80, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.50);
      g.gain.setValueAtTime(0.22, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.60);
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.65);
      break;
    case 'moto':   // Motorcycle — power-band hit (very high, fast)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.40);
      g.gain.setValueAtTime(0.16, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.50);
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.55);
      break;
    default:       // F1 Classic — screaming turbo (original)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.35);
      g.gain.setValueAtTime(0.18, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.6);
  }
}

// ── Weather ambient sounds ────────────────────────────────────────────────────

function _makeNoiseBuffer(dur) {
  const bufSize = Math.floor(audioCtx.sampleRate * dur);
  const buf  = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function playRainAmbient() {
  if (!audioReady || rainSrc) return;
  // White noise through a low-pass filter — rainy hiss
  const buf    = _makeNoiseBuffer(2.0);
  rainSrc      = audioCtx.createBufferSource();
  rainSrc.buffer = buf;
  rainSrc.loop   = true;
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 900;
  rainGain = audioCtx.createGain();
  rainGain.gain.value = 0;
  rainSrc.connect(lp); lp.connect(rainGain); rainGain.connect(audioCtx.destination);
  rainSrc.start();
  rainGain.gain.setTargetAtTime(0.07, audioCtx.currentTime, 0.8);
}

function stopRainAmbient() {
  if (!rainSrc) return;
  rainGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
  const r = rainSrc;
  rainSrc = null;
  setTimeout(() => { try { r.stop(); } catch(e){} }, 800);
}

function playWindAmbient() {
  if (!audioReady || windSrc) return;
  const buf   = _makeNoiseBuffer(3.0);
  windSrc     = audioCtx.createBufferSource();
  windSrc.buffer = buf;
  windSrc.loop   = true;
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 180; bp.Q.value = 0.5;
  windGain = audioCtx.createGain();
  windGain.gain.value = 0;
  windSrc.connect(bp); bp.connect(windGain); windGain.connect(audioCtx.destination);
  windSrc.start();
  windGain.gain.setTargetAtTime(0.05, audioCtx.currentTime, 1.0);
}

function stopWindAmbient() {
  if (!windSrc) return;
  windGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.6);
  const w = windSrc;
  windSrc = null;
  setTimeout(() => { try { w.stop(); } catch(e){} }, 1000);
}

// Thunder crack — bass burst noise
function playThunder() {
  if (!audioReady) return;
  const dur     = 1.2;
  const bufSize = Math.floor(audioCtx.sampleRate * dur);
  const buf     = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data    = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const env = Math.pow(1 - i / bufSize, 0.6);
    data[i]   = (Math.random() * 2 - 1) * env;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 200;
  const g = audioCtx.createGain();
  g.gain.value = 0.65;
  src.connect(lp); lp.connect(g); g.connect(audioCtx.destination); src.start();
}

// Resume context on first user gesture
function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
