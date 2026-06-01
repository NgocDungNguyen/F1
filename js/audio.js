// ─────────────────────────────────────────────
//  WEB AUDIO API  –  engine hum, crash, beeps, boost
// ─────────────────────────────────────────────

let audioCtx       = null;
let engineOsc      = null;
let engineGain     = null;
let engineDistNode = null;
let audioReady     = false;

function initAudio() {
  if (audioReady) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Wave shaper for a grittier engine tone
    engineDistNode = audioCtx.createWaveShaper();
    engineDistNode.curve = makeDistortionCurve(80);
    engineDistNode.oversample = '2x';

    engineOsc = audioCtx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 65;

    engineGain = audioCtx.createGain();
    engineGain.gain.value = 0;

    engineOsc.connect(engineDistNode);
    engineDistNode.connect(engineGain);
    engineGain.connect(audioCtx.destination);
    engineOsc.start();

    audioReady = true;
  } catch (e) {
    console.warn('AudioContext init failed:', e);
  }
}

function makeDistortionCurve(amount) {
  const n   = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

// Called every frame during racing; speed 0-1 normalised
function updateEngineSound(normSpeed) {
  if (!audioReady) return;
  const freq = 65 + normSpeed * 210;          // 65 Hz idle → 275 Hz max
  const vol  = 0.04 + normSpeed * 0.09;
  engineOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.08);
  engineGain.gain.setTargetAtTime(vol,  audioCtx.currentTime, 0.08);
}

function silenceEngine() {
  if (!audioReady) return;
  engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
}

function playCrash() {
  if (!audioReady) return;
  const dur     = 0.55;
  const bufSize = Math.floor(audioCtx.sampleRate * dur);
  const buf     = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data    = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const env  = Math.pow(1 - i / bufSize, 1.8);
    data[i]    = (Math.random() * 2 - 1) * env;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const g = audioCtx.createGain();
  g.gain.value = 0.55;
  src.connect(g);
  g.connect(audioCtx.destination);
  src.start();
}

function playBeep(freq, when, duration) {
  if (!audioReady) return;
  const osc = audioCtx.createOscillator();
  const g   = audioCtx.createGain();
  osc.type             = 'square';
  osc.frequency.value  = freq;
  g.gain.setValueAtTime(0.28, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + duration);
  osc.connect(g);
  g.connect(audioCtx.destination);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

function scheduleCountdownBeeps() {
  if (!audioReady) return;
  const now = audioCtx.currentTime;
  playBeep(440, now + 1.0, 0.25);
  playBeep(440, now + 2.0, 0.25);
  playBeep(440, now + 3.0, 0.25);
  playBeep(880, now + 4.0, 0.45);
}

function playBoostSound() {
  if (!audioReady) return;
  const osc = audioCtx.createOscillator();
  const g   = audioCtx.createGain();
  osc.type  = 'sawtooth';
  osc.frequency.setValueAtTime(280, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.35);
  g.gain.setValueAtTime(0.18, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
  osc.connect(g);
  g.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.6);
}

function playFinishFanfare() {
  if (!audioReady) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => playBeep(freq, audioCtx.currentTime + i * 0.18, 0.3));
}

// Resume context on first user gesture (required by some browsers)
function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
