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

    // Shield or dragon absorbs the hit without player crash
    if (player.shield || player.dragonTimer > 0) {
      player.shield = false;
      ai.speed     *= 0.75;
      ai.crashing   = true;
      ai.crashTimer = 0.5;
      break;
    }

    // ── TAKEDOWN: player approaching AI from behind at speed ──────────
    const veh        = VEHICLE_DEFS[carConfig.vehicleType] || VEHICLE_DEFS.f1;
    const isTakedown = player.speed > ai.speed * 1.10
                    && player.speed > veh.maxSpeed * 0.60
                    && relZ > 0 && relZ < 1.8;

    if (isTakedown) {
      // Player earns nitro, no crash
      player.nitroBar = Math.min(1, player.nitroBar + 0.40);
      player.takedowns     = (player.takedowns || 0) + 1;
      // AI flies off track dramatically
      ai.x      += Math.sign(ai.x === 0 ? 1 : ai.x) * 1.2;
      ai.speed  *= 0.28;
      ai.crashing  = true;
      ai.crashTimer = 1.5;
      if (typeof triggerCameraShake === 'function') triggerCameraShake(0.6);
      if (typeof showPopup === 'function') showPopup('TAKEDOWN! 💥', '#ff4400', 1.8);
      if (typeof playTakedownSound === 'function') playTakedownSound();
      lastCrashTime = raceTime;
      break;
    }

    // ── Normal collision ──────────────────────────────────────────────
    player.speed     *= CRASH_SPEED_MULT;
    player.crashTimer = 1.2;
    player.x         -= Math.sign(player.x - ai.x) * 0.3;

    ai.speed      *= 0.65;
    ai.crashing    = true;
    ai.crashTimer  = 0.8;

    if (typeof triggerCameraShake === 'function') triggerCameraShake(0.8);

    if (raceTime - lastCrashTime > 1.0) {
      playCrash();
      lastCrashTime = raceTime;
    }
    break;
  }
}
