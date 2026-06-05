// ─────────────────────────────────────────────
//  AI CARS
// ─────────────────────────────────────────────

let aiCars = [];

// 6 distinct colors for up to 6 AI cars
const AI_COLORS = ['#0033cc', '#ffcc00', '#00aa44', '#cc0044', '#aa44ff', '#ff8800'];
const AI_DECALS = ['solid', 'solid', 'solid', 'solid', 'solid', 'solid'];

// Starting gaps for up to 6 AI (segments ahead of player start position)
const AI_GAPS = [14, 30, 52, 78, 108, 145];

function initAI() {
  aiCars = [];
  const diff     = (typeof carConfig !== 'undefined' && carConfig.difficulty)
                     ? carConfig.difficulty : 'medium';
  const diffDef  = (typeof DIFFICULTY_DEFS !== 'undefined') ? DIFFICULTY_DEFS[diff] : null;
  const aiCount  = diffDef ? diffDef.aiCount : AI_COUNT;
  const startZ   = player ? player.z : 8;

  for (let i = 0; i < aiCount; i++) {
    aiCars.push({
      z:         (startZ + AI_GAPS[i % AI_GAPS.length]) % TRACK_SEGMENTS,
      x:         (i % 2 === 0 ? -0.28 : 0.28),
      speed:     AI_MAX_SPEED * (0.78 + (i % 3) * 0.04),
      color:     AI_COLORS[i % AI_COLORS.length],
      decal:     AI_DECALS[i % AI_DECALS.length],
      laps:      0,
      crashing:  false,
      crashTimer: 0,
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

    const curveMag  = Math.abs(seg.curve);
    const targetSpd = AI_MAX_SPEED * (1 - curveMag * 0.07);
    const speedDiff = targetSpd - ai.speed;
    ai.speed += clamp(speedDiff, -AI_ACCEL * dt * 2, AI_ACCEL * dt);
    ai.speed  = clamp(ai.speed, 0, AI_MAX_SPEED);

    // ── Lane preference ───────────────────────────────────────────────────
    let laneTarget, xClampLo, xClampHi;
    if (seg.forkSection) {
      // Fork: AI assigned to strip by their lateral sign
      // Half AI → left strip (shortcut), half → right strip (main)
      const stripCenter = FORK_DIV + FORK_STRIP_HALF * 0.80;
      laneTarget = ai.x <= 0 ? -stripCenter : stripCenter;
      if (ai.x <= 0) {
        xClampLo = -(FORK_OUTER - 0.1);
        xClampHi = -(FORK_DIV + 0.05);
      } else {
        xClampLo = FORK_DIV + 0.05;
        xClampHi = FORK_OUTER - 0.1;
      }
      ai.x += (laneTarget - ai.x) * AI_STEER * dt * 0.6;
      ai.x  = clamp(ai.x, xClampLo, xClampHi);
    } else {
      laneTarget = ai.x > 0 ? 0.35 : -0.35;
      ai.x += (laneTarget - ai.x) * AI_STEER * dt * 0.4;
      // ── Curve-induced drift ─────────────────────────────────────────────
      ai.x += seg.curve * (ai.speed / AI_MAX_SPEED) * 0.012 * dt * 60;
      ai.x  = clamp(ai.x, -ROAD_EDGE * 0.9, ROAD_EDGE * 0.9);
    }

    // ── Advance ───────────────────────────────────────────────────────────
    const prevZ = ai.z;
    ai.z = (ai.z + ai.speed * dt) % TRACK_SEGMENTS;
    if (ai.z < prevZ) ai.laps++;
  }
}

function computePosition() {
  const playerDone = raceData.lap - 1;
  let pos = 1;
  for (const ai of aiCars) {
    if (ai.laps > playerDone || (ai.laps === playerDone && ai.z > player.z)) pos++;
  }
  return pos;
}
