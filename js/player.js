// ─────────────────────────────────────────────
//  PLAYER STATE + PHYSICS
// ─────────────────────────────────────────────

let player = null;

function initPlayer() {
  player = {
    z:              8,           // track position (segment index, fractional)
    x:              0,           // lateral position: 0=centre, ±1=road edge
    speed:          0,           // segments/sec
    steeringAngle:  0,           // wheel visual angle (radians)
    boosting:       false,
    boostTimer:     0,           // seconds remaining on active boost
    boostCooldown:  0,           // seconds until boost is ready
    crashTimer:     0,           // seconds of crash state remaining
    offRoadTimer:   0,           // seconds off-road (for sound/visual)
    laps:           0,
  };
}

function updatePlayer(dt, inp) {
  if (!player) return;

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
    player.boostTimer    = BOOST_DURATION;
    player.boostCooldown = BOOST_COOLDOWN;
    player.boosting      = true;
    playBoostSound();
  }

  // ── Crash state: slow player, no steering ──────────────────────────────
  if (player.crashTimer > 0) {
    player.crashTimer -= dt;
    player.speed      *= 1 - dt * 3.5;
    updateEngineSound(player.speed / PLAYER_MAX_SPEED);
    return;                                       // skip normal physics
  }

  // ── Speed ──────────────────────────────────────────────────────────────
  const maxSpd = player.boosting ? BOOST_SPEED : PLAYER_MAX_SPEED;

  if (inp.gas) {
    player.speed = Math.min(player.speed + PLAYER_ACCEL * dt, maxSpd);
  } else if (inp.brake) {
    player.speed = Math.max(player.speed - PLAYER_BRAKE * dt, 0);
  } else {
    player.speed = Math.max(player.speed - PLAYER_COAST * dt, 0);
  }

  // ── Steering ───────────────────────────────────────────────────────────
  const speedFrac   = player.speed / PLAYER_MAX_SPEED;
  const steerAmount = STEER_SPEED * dt * Math.max(0.35, 1 - speedFrac * 0.5);

  if (inp.left)        player.x -= steerAmount;
  else if (inp.right)  player.x += steerAmount;

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
    player.speed        *= Math.pow(OFFROAD_FRICTION, dt * 8);
    // Hard boundary
    player.x = clamp(player.x, -GRASS_EDGE, GRASS_EDGE);
  } else {
    player.offRoadTimer = 0;
  }

  // ── Advance position ───────────────────────────────────────────────────
  player.z = (player.z + player.speed * dt) % TRACK_SEGMENTS;

  // ── Audio ──────────────────────────────────────────────────────────────
  updateEngineSound(player.speed / (player.boosting ? BOOST_SPEED : PLAYER_MAX_SPEED));
}
