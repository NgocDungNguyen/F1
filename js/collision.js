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

    // Combined hitbox: player radius + fixed AI radius (reduced to match smaller AI sprites)
    const playerRadius = (VEHICLE_DEFS[carConfig.vehicleType] || VEHICLE_DEFS.f1).collisionRadius;
    const hitRadius    = playerRadius + 0.13;
    const latDiff      = Math.abs(player.x - ai.x);
    if (latDiff > hitRadius) continue;

    // Shield or dragon absorbs the hit
    if (player.shield || player.dragonTimer > 0) {
      player.shield = false;  // one-time shield consumed
      ai.speed     *= 0.75;
      ai.crashing   = true;
      ai.crashTimer = 0.5;
      break;
    }

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
