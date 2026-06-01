// ─────────────────────────────────────────────
//  AI CARS
// ─────────────────────────────────────────────

let aiCars = [];

const AI_COLORS  = ['#0033cc', '#ffcc00', '#00aa44'];
const AI_DECALS  = ['solid',   'solid',   'solid'];

function initAI() {
  aiCars = [];
  // Stagger AI ahead of player within visible draw distance
  // so they're immediately visible and raceable
  const startZ = player ? player.z : 8;
  const gaps   = [18, 40, 70];   // segments ahead of player

  for (let i = 0; i < AI_COUNT; i++) {
    aiCars.push({
      z:           (startZ + gaps[i]) % TRACK_SEGMENTS,
      x:           (i % 2 === 0 ? -0.28 : 0.28),
      speed:       AI_MAX_SPEED * (0.80 + i * 0.03),
      color:       AI_COLORS[i % AI_COLORS.length],
      decal:       AI_DECALS[i % AI_DECALS.length],
      laps:        0,
      crashing:    false,
      crashTimer:  0,
    });
  }
}

function updateAI(dt) {
  for (const ai of aiCars) {
    // ── Crash state ───────────────────────────────────────────────────────
    if (ai.crashTimer > 0) {
      ai.crashTimer -= dt;
      ai.speed      *= 1 - dt * 2.5;
      if (ai.crashTimer <= 0) { ai.crashing = false; ai.crashTimer = 0; }
    }

    // ── Speed based on upcoming curve ─────────────────────────────────────
    const segIdx = Math.floor(ai.z) % TRACK_SEGMENTS;
    const seg    = segments[segIdx];
    if (!seg) continue;

    const curveMag   = Math.abs(seg.curve);
    const targetSpd  = AI_MAX_SPEED * (1 - curveMag * 0.07);
    const speedDiff  = targetSpd - ai.speed;
    ai.speed        += clamp(speedDiff, -AI_ACCEL * dt * 2, AI_ACCEL * dt);
    ai.speed         = clamp(ai.speed, 0, AI_MAX_SPEED);

    // ── Steer toward preferred lane (rubberband slightly toward centre) ────
    const laneTarget = (ai.x > 0 ? 0.35 : -0.35);
    ai.x += (laneTarget - ai.x) * AI_STEER * dt * 0.4;

    // ── Curve-induced drift (same as player) ──────────────────────────────
    ai.x += seg.curve * (ai.speed / AI_MAX_SPEED) * 0.012 * dt * 60;
    ai.x  = clamp(ai.x, -ROAD_EDGE * 0.9, ROAD_EDGE * 0.9);

    // ── Advance ───────────────────────────────────────────────────────────
    const prevZ = ai.z;
    ai.z = (ai.z + ai.speed * dt) % TRACK_SEGMENTS;
    if (ai.z < prevZ) ai.laps++;
  }
}

// Compute player race position (1-based).
// raceData.lap is 1-indexed; ai.laps is completed-laps count (0-indexed).
function computePosition() {
  const playerDone = raceData.lap - 1;   // completed laps
  let pos = 1;
  for (const ai of aiCars) {
    if (ai.laps > playerDone || (ai.laps === playerDone && ai.z > player.z)) {
      pos++;
    }
  }
  return pos;
}
