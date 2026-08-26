// ─────────────────────────────────────────────
//  AI CARS
// ─────────────────────────────────────────────

let aiCars = [];

// 6 distinct colors for up to 6 AI cars
const AI_COLORS        = ['#0033cc', '#ffcc00', '#00aa44', '#cc0044', '#aa44ff', '#ff8800'];
const AI_DECALS        = ['solid', 'solid', 'solid', 'solid', 'solid', 'solid'];
const AI_VEHICLE_TYPES = ['f1', 'f1v2', 'nascar', 'moto'];

// Starting gaps for up to 6 AI (segments ahead of player start position)
const AI_GAPS = [14, 30, 52, 78, 108, 145];

// AI nitro constants (single-tier — fills passively, activates on straights)
const AI_NITRO_FILL_RATE  = NITRO_FILL_ROAD * 0.55;  // 55% of player road-fill rate
const AI_NITRO_DRAIN_RATE = NITRO_DRAIN_L1  * 0.90;  // slightly slower drain than player L1
const AI_NITRO_BOOST_MULT = 1.32;                     // speed multiplier when boosting

// Curve-braking thresholds  (curveMag → speed fraction of AI_MAX_SPEED)
const AI_BRAKE_HAIRPIN  = 0.50;   // curveMag > 3.5 — very tight corner
const AI_BRAKE_MEDIUM   = 0.72;   // curveMag 2.0–3.5
const AI_BRAKE_GENTLE   = 0.90;   // curveMag 0.8–2.0

function initAI() {
  aiCars = [];
  const diff    = (typeof carConfig !== 'undefined' && carConfig.difficulty)
                    ? carConfig.difficulty : 'medium';
  const diffDef = (typeof DIFFICULTY_DEFS !== 'undefined') ? DIFFICULTY_DEFS[diff] : null;
  const aiCount = diffDef ? diffDef.aiCount : AI_COUNT;
  const startZ  = player ? player.z : 8;

  for (let i = 0; i < aiCount; i++) {
    aiCars.push({
      z:           (startZ + AI_GAPS[i % AI_GAPS.length]) % TRACK_SEGMENTS,
      x:           (i % 2 === 0 ? -0.28 : 0.28),
      speed:       AI_MAX_SPEED * (0.78 + (i % 3) * 0.04),
      color:       AI_COLORS[i % AI_COLORS.length],
      decal:       AI_DECALS[i % AI_DECALS.length],
      vehicleType: AI_VEHICLE_TYPES[Math.floor(Math.random() * AI_VEHICLE_TYPES.length)],
      laps:        0,
      crashing:    false,
      crashTimer:  0,
      // Nitro state — start with a small random charge so AI boost timings vary
      nitroBar:    0.15 + Math.random() * 0.25,
      boosting:    false,
      nitroLevel:  0,
    });
  }
}

function updateAI(dt) {
  // Pre-compute player's completed laps for rubber-band gap calculation
  const playerLapsDone = (typeof raceData !== 'undefined') ? raceData.lap - 1 : 0;

  for (const ai of aiCars) {
    // ── Crash bleed ───────────────────────────────────────────────────────
    if (ai.crashTimer > 0) {
      ai.crashTimer -= dt;
      ai.speed      *= 1 - dt * 2.5;
      if (ai.crashTimer <= 0) { ai.crashing = false; ai.crashTimer = 0; }
    }

    // ── Current + look-ahead segment ──────────────────────────────────────
    const segIdx = Math.floor(ai.z) % TRACK_SEGMENTS;
    const seg    = segments[segIdx];
    if (!seg) continue;

    // Sample 10 segments ahead — AI brakes for corners before reaching them
    let maxAheadCurve = Math.abs(seg.curve);
    for (let a = 1; a <= 10; a++) {
      const as = segments[(segIdx + a) % TRACK_SEGMENTS];
      if (as) maxAheadCurve = Math.max(maxAheadCurve, Math.abs(as.curve));
    }

    // ── Rubber-band gap (positive = AI ahead, negative = AI behind) ───────
    let relGap = 0;
    if (player) {
      let gap = (ai.z - player.z + TRACK_SEGMENTS) % TRACK_SEGMENTS;
      if (gap > TRACK_SEGMENTS * 0.5) gap -= TRACK_SEGMENTS;
      relGap = gap + (ai.laps - playerLapsDone) * TRACK_SEGMENTS;
    }

    let gapBonus = 1.0;
    if      (relGap < -50) gapBonus = 1.20;   // well behind: +20% speed
    else if (relGap < -20) gapBonus = 1.11;   // slightly behind: +11%
    else if (relGap > 80)  gapBonus = 0.93;   // comfortably ahead: ease off

    // ── Target speed from corner severity + gap bonus ─────────────────────
    let targetSpd;
    if      (maxAheadCurve > 3.5) targetSpd = AI_MAX_SPEED * AI_BRAKE_HAIRPIN;
    else if (maxAheadCurve > 2.0) targetSpd = AI_MAX_SPEED * (AI_BRAKE_MEDIUM  - maxAheadCurve * 0.025);
    else if (maxAheadCurve > 0.8) targetSpd = AI_MAX_SPEED * (AI_BRAKE_GENTLE  - maxAheadCurve * 0.04);
    else                          targetSpd = AI_MAX_SPEED;
    targetSpd *= gapBonus;

    // ── Nitro: passive fill on straights ──────────────────────────────────
    if (!ai.boosting && !ai.crashing && maxAheadCurve < 1.2) {
      ai.nitroBar = Math.min(1, ai.nitroBar + AI_NITRO_FILL_RATE * dt);
    }

    // ── Nitro: activation (straight road, bar ready, or catch-up desperation)
    if (!ai.boosting && !ai.crashing && !seg.forkSection && !seg.forkEntry) {
      const onStraight  = maxAheadCurve < 0.55;
      const barFull     = ai.nitroBar >= 0.60;
      const catchUp     = relGap < -28 && ai.nitroBar >= 0.35 && maxAheadCurve < 1.1;
      if ((barFull && onStraight) || catchUp) {
        ai.boosting  = true;
        ai.nitroLevel = 1;
      }
    }

    // ── Nitro: drain + speed boost; cancel on tight corners ───────────────
    if (ai.boosting) {
      ai.nitroBar = Math.max(0, ai.nitroBar - AI_NITRO_DRAIN_RATE * dt);
      if (ai.nitroBar <= 0 || maxAheadCurve > 2.2) {
        ai.boosting  = false;
        ai.nitroLevel = 0;
      } else {
        targetSpd = Math.min(
          AI_MAX_SPEED * AI_NITRO_BOOST_MULT,
          targetSpd * AI_NITRO_BOOST_MULT
        );
      }
    }

    // ── Apply acceleration / braking ──────────────────────────────────────
    const speedDiff  = targetSpd - ai.speed;
    const accelLimit = ai.boosting ? AI_ACCEL * dt * 2.6 : AI_ACCEL * dt;
    ai.speed += clamp(speedDiff, -AI_ACCEL * dt * 2.4, accelLimit);
    ai.speed  = clamp(ai.speed, 0, AI_MAX_SPEED * AI_NITRO_BOOST_MULT * 1.05);

    // ── Lane preference ───────────────────────────────────────────────────
    if (seg.forkSection) {
      const stripCenter = FORK_DIV + FORK_STRIP_HALF * 0.80;
      const laneTarget  = ai.x <= 0 ? -stripCenter : stripCenter;
      const xLo = ai.x <= 0 ? -(FORK_OUTER - 0.1) : FORK_DIV + 0.05;
      const xHi = ai.x <= 0 ? -(FORK_DIV + 0.05)  : FORK_OUTER - 0.1;
      ai.x += (laneTarget - ai.x) * AI_STEER * dt * 0.6;
      ai.x  = clamp(ai.x, xLo, xHi);
    } else {
      const laneTarget = ai.x > 0 ? 0.35 : -0.35;
      ai.x += (laneTarget - ai.x) * AI_STEER * dt * 0.4;
      // Curve drift slightly more responsive than before (0.015 vs old 0.012)
      ai.x += seg.curve * (ai.speed / AI_MAX_SPEED) * 0.015 * dt * 60;
      ai.x  = clamp(ai.x, -ROAD_EDGE * 0.9, ROAD_EDGE * 0.9);
    }

    // ── Advance position ──────────────────────────────────────────────────
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
