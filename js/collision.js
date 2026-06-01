// ─────────────────────────────────────────────
//  COLLISION DETECTION
// ─────────────────────────────────────────────

let lastCrashTime = -5;  // prevent repeated crash sounds

function checkCollisions(raceTime) {
  if (!player || player.crashTimer > 0) return;

  for (const ai of aiCars) {
    // Relative track distance
    let relZ = ai.z - player.z;
    if (relZ < 0) relZ += TRACK_SEGMENTS;

    // Only check nearby cars (within 2 segments)
    if (relZ > 2.5 || relZ < 0.1) continue;

    // Lateral proximity (road-half-width units)
    const latDiff = Math.abs(player.x - ai.x);
    if (latDiff > 0.55) continue;               // not overlapping

    // Collision!
    player.speed     *= CRASH_SPEED_MULT;
    player.crashTimer = 1.2;
    player.x         -= Math.sign(player.x - ai.x) * 0.3;  // bounce away

    ai.speed      *= 0.65;
    ai.crashing    = true;
    ai.crashTimer  = 0.8;

    if (raceTime - lastCrashTime > 1.0) {
      playCrash();
      lastCrashTime = raceTime;
    }
    break;
  }
}
