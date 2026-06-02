// ─────────────────────────────────────────────
//  PLAYER STATE + PHYSICS
// ─────────────────────────────────────────────

let player = null;

function initPlayer() {
  player = {
    z:              8,
    x:              0,
    speed:          0,
    steeringAngle:  0,
    boosting:       false,
    boostTimer:     0,
    boostCooldown:  0,
    crashTimer:     0,
    offRoadTimer:   0,
    laps:           0,
    ersCharge:      1.0,   // LMP1 ERS charge 0–1
    fuel:           1.0,   // NASCAR fuel 0–1 (cosmetic)
  };
}

function updatePlayer(dt, inp) {
  if (!player) return;

  // Per-vehicle physics parameters
  const veh = VEHICLE_DEFS[carConfig.vehicleType] || VEHICLE_DEFS.f1;

  // ── Boost logic ────────────────────────────────────────────────────────
  if (player.boostTimer > 0) {
    player.boostTimer -= dt;
    player.boosting    = true;
    if (player.boostTimer <= 0) {
      player.boostTimer = 0;
      player.boosting   = false;
    }
  }
  if (player.boostCooldown > 0) player.boostCooldown -= dt;

  if (inp.boost && !player.boosting && player.boostCooldown <= 0) {
    player.boostTimer    = veh.boostDuration;
    player.boostCooldown = veh.boostCooldown;
    player.boosting      = true;
    playBoostSound();
  }

  // ── Crash state: slow player, no steering ──────────────────────────────
  if (player.crashTimer > 0) {
    player.crashTimer -= dt;
    player.speed      *= 1 - dt * 3.5;
    updateEngineSound(player.speed / veh.maxSpeed);
    return;
  }

  // ── Speed ──────────────────────────────────────────────────────────────
  const maxSpd = player.boosting ? veh.boostSpeed : veh.maxSpeed;

  if (inp.gas) {
    player.speed = Math.min(player.speed + veh.accel * dt, maxSpd);
  } else if (inp.brake) {
    player.speed = Math.max(player.speed - veh.brake * dt, 0);
  } else {
    player.speed = Math.max(player.speed - veh.coast * dt, 0);
  }

  // ── Weather grip ───────────────────────────────────────────────────────
  const wetGrip = (typeof weatherState !== 'undefined') ? weatherState.gripFactor : 1.0;

  // ── Steering (speed-dependent authority, reduced by wet grip) ──────────
  const speedFrac   = player.speed / veh.maxSpeed;
  const steerFactor = Math.max(veh.minSteer, 1 - speedFrac * 0.58);
  const steerAmount = veh.steerSpeed * dt * steerFactor * wetGrip;

  if (inp.left)        player.x -= steerAmount;
  else if (inp.right)  player.x += steerAmount;

  // Wet-road micro-sliding (random drift when road is wet and driving fast)
  if (typeof weatherState !== 'undefined' && weatherState.roadWet && speedFrac > 0.55) {
    player.x += (Math.random() - 0.5) * 0.003 * (1 - wetGrip) * speedFrac;
  }

  // High-speed cornering drag — simulates centripetal force / tyre load
  if ((inp.left || inp.right) && speedFrac > 0.65) {
    const drag = ((speedFrac - 0.65) / 0.35) * veh.cornerDrag;
    player.speed = Math.max(player.speed * (1 - drag * dt), veh.maxSpeed * 0.72);
  }

  // Road stickiness — at high speed, subtle straight-line centering force
  if (!inp.left && !inp.right && speedFrac > 0.70) {
    player.x *= (1 - dt * 0.08 * speedFrac);
  }

  // ── LMP1 ERS charge ────────────────────────────────────────────────────
  if (carConfig.vehicleType === 'f1v2') {
    if (inp.gas && player.boosting) {
      player.ersCharge = Math.max(0, player.ersCharge - dt * 0.15);
    } else if (!inp.gas) {
      player.ersCharge = Math.min(1, player.ersCharge + dt * 0.08);  // regen
    }
  }

  // ── NASCAR fuel (cosmetic) ─────────────────────────────────────────────
  if (carConfig.vehicleType === 'nascar' && player.speed > 0) {
    player.fuel = Math.max(0, player.fuel - dt * 0.0008);
  }

  // Steering wheel visual
  const targetAngle = inp.left ? -0.45 : (inp.right ? 0.45 : 0);
  player.steeringAngle += (targetAngle - player.steeringAngle) * Math.min(1, dt * 10);

  // ── Road curve push ─────────────────────────────────────────────────────
  const segIdx = Math.floor(player.z) % TRACK_SEGMENTS;
  const seg    = segments[segIdx];
  if (seg) {
    player.x += seg.curve * speedFrac * 0.012 * dt * 60;
  }

  // ── Off-road detection ─────────────────────────────────────────────────
  const isOffRoad = Math.abs(player.x) > ROAD_EDGE;

  if (isOffRoad) {
    player.offRoadTimer += dt;
    // Sharper initial bite when hitting grass at speed
    player.speed *= Math.pow(OFFROAD_FRICTION, dt * 11);
    if (player.speed > veh.maxSpeed * 0.52) player.speed = veh.maxSpeed * 0.52;
    player.x = clamp(player.x, -GRASS_EDGE, GRASS_EDGE);
  } else {
    player.offRoadTimer = 0;
  }

  // ── Advance position ───────────────────────────────────────────────────
  player.z = (player.z + player.speed * dt) % TRACK_SEGMENTS;

  // ── Audio ──────────────────────────────────────────────────────────────
  updateEngineSound(player.speed / (player.boosting ? veh.boostSpeed : veh.maxSpeed));
}
