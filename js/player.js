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
    // ── Item effect timers ────────────────────
    shield:         false, // golden shield — next collision absorbed
    gripTimer:      0,     // green grip — ignore mud/dirt friction
    turboTimer:     0,     // orange turbo — +25% maxSpeed cap
    coolTimer:      0,     // cyan cool — heat immunity
    dragonTimer:    0,     // red dragon — super speed + invulnerability
    // ── Track-specific state ──────────────────
    heat:           0,     // Sahara overheat 0–1
    slipstreaming:  false, // Monza draft active
    onShortcut:     false, // on left fork strip (shortcut path)
    // ── Drift system ─────────────────────────
    prevX:          0,     // last frame x position (for lateral velocity)
    lateralSpeed:   0,     // world units/sec lateral movement
    isDrifting:     false,
    driftTimer:     0,     // continuous seconds spent drifting
    driftMeter:     0,     // 0–1, fills from drifting → awards nitro
    // ── Stunt tracking ───────────────────────
    takedowns:      0,
    nearMisses:     0,
    totalDriftTime: 0,
  };
}

function updatePlayer(dt, inp) {
  if (!player) return;

  const veh = VEHICLE_DEFS[carConfig.vehicleType] || VEHICLE_DEFS.f1;

  // ── Item timer countdowns ──────────────────────────────────────────────
  if (player.gripTimer   > 0) player.gripTimer   = Math.max(0, player.gripTimer   - dt);
  if (player.turboTimer  > 0) player.turboTimer  = Math.max(0, player.turboTimer  - dt);
  if (player.coolTimer   > 0) player.coolTimer   = Math.max(0, player.coolTimer   - dt);
  if (player.dragonTimer > 0) player.dragonTimer = Math.max(0, player.dragonTimer - dt);

  // ── Current segment ────────────────────────────────────────────────────
  const segIdx = Math.floor(player.z) % TRACK_SEGMENTS;
  const seg    = segments[segIdx];

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

  // ── Speed cap: turbo and dragon raise it ───────────────────────────────
  let maxSpd = player.boosting ? veh.boostSpeed : veh.maxSpeed;
  if (player.turboTimer  > 0) maxSpd *= 1.25;
  if (player.dragonTimer > 0) maxSpd  = veh.boostSpeed * 1.15;

  if (inp.gas) {
    player.speed = Math.min(player.speed + veh.accel * dt, maxSpd);
  } else if (inp.brake) {
    player.speed = Math.max(player.speed - veh.brake * dt, 0);
  } else {
    player.speed = Math.max(player.speed - veh.coast * dt, 0);
  }

  // ── Weather grip ───────────────────────────────────────────────────────
  const weatherGrip = (typeof weatherState !== 'undefined') ? weatherState.gripFactor : 1.0;

  // ── Surface grip: seg.surfaceGrip (mud, river) overrides when no grip item ──
  const segGrip    = (seg && seg.surfaceGrip != null) ? seg.surfaceGrip : 1.0;
  const effectiveGrip = player.gripTimer > 0 ? 1.0 : Math.min(weatherGrip, segGrip);

  // ── Steering (speed-dependent authority, reduced by grip) ──────────────
  const speedFrac      = player.speed / veh.maxSpeed;
  const brakeTurnBonus = (inp.brake && (inp.left || inp.right)) ? 0.28 : 0;
  const steerFactor    = Math.max(veh.minSteer, 1 - speedFrac * 0.44 + brakeTurnBonus);
  const steerAmount    = veh.steerSpeed * dt * steerFactor * effectiveGrip;

  if (inp.left)        player.x -= steerAmount;
  else if (inp.right)  player.x += steerAmount;

  // ── Wet-road micro-sliding ─────────────────────────────────────────────
  if (typeof weatherState !== 'undefined' && weatherState.roadWet && speedFrac > 0.55) {
    player.x += (Math.random() - 0.5) * 0.003 * (1 - weatherGrip) * speedFrac;
  }

  // ── Oil slick drift (Monaco Casino exit) ──────────────────────────────
  if (seg && seg.oilSlick && speedFrac > 0.30) {
    player.x += (Math.random() - 0.5) * 0.016 * speedFrac;
  }

  // ── Drift detection ────────────────────────────────────────────────────
  player.lateralSpeed = (player.x - player.prevX) / Math.max(dt, 0.001);
  player.prevX        = player.x;

  const drifting = Math.abs(player.lateralSpeed) > 0.32
                && speedFrac > 0.48
                && (inp.left || inp.right)
                && !seg?.forkSection;   // don't count divider stumbling as drift

  if (drifting) {
    if (!player.isDrifting) {
      // Drift just started — play squeal
      if (typeof playTireSqueal === 'function') playTireSqueal(speedFrac);
    }
    player.isDrifting    = true;
    player.driftTimer   += dt;
    player.totalDriftTime += dt;
    const gain = Math.abs(player.lateralSpeed) * dt * 0.18;
    player.driftMeter = Math.min(1, player.driftMeter + gain);
    // Continuous drift audio
    if (typeof playDriftAudio === 'function') playDriftAudio(player.lateralSpeed);
  } else {
    if (player.isDrifting) {
      // Drift just ended — award nitro reduction proportional to meter
      if (player.driftMeter > 0.18) {
        const reward = player.driftMeter;
        player.boostCooldown = Math.max(0, player.boostCooldown - reward * 12);
        if (typeof showPopup === 'function') {
          showPopup(
            player.driftTimer > 1.5 ? 'PERFECT DRIFT! 🔥' : 'DRIFT!',
            '#ff8800', 1.2
          );
        }
      }
      if (typeof stopDriftAudio === 'function') stopDriftAudio();
    }
    player.isDrifting  = false;
    player.driftTimer  = 0;
    player.driftMeter  = Math.max(0, player.driftMeter - dt * 0.45);
  }

  // ── High-speed cornering drag ──────────────────────────────────────────
  if ((inp.left || inp.right) && speedFrac > 0.75) {
    const drag = ((speedFrac - 0.75) / 0.25) * veh.cornerDrag;
    player.speed = Math.max(player.speed * (1 - drag * dt), veh.maxSpeed * 0.78);
  }

  // ── Road stickiness ─────────────────────────────────────────────────────
  if (!inp.left && !inp.right && speedFrac > 0.70) {
    player.x *= (1 - dt * 0.08 * speedFrac);
  }

  // ── LMP1 ERS charge ────────────────────────────────────────────────────
  if (carConfig.vehicleType === 'f1v2') {
    if (inp.gas && player.boosting) {
      player.ersCharge = Math.max(0, player.ersCharge - dt * 0.15);
    } else if (!inp.gas) {
      player.ersCharge = Math.min(1, player.ersCharge + dt * 0.08);
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
  if (seg) {
    player.x += seg.curve * speedFrac * 0.006 * dt * 60;
  }

  // ── Sahara heat system ──────────────────────────────────────────────────
  if (seg && seg.heatZone && player.coolTimer <= 0) {
    if (speedFrac > 0.85) {
      player.heat = Math.min(1, player.heat + 0.06 * dt);
    } else {
      player.heat = Math.max(0, player.heat - 0.02 * dt);
    }
  } else {
    player.heat = Math.max(0, player.heat - 0.04 * dt);
  }
  // Overheat speed bleed
  if (player.heat > 0.85) {
    player.speed = Math.max(player.speed - 0.5 * dt, veh.maxSpeed * 0.55);
  }

  // ── Off-road detection (fork-aware) ────────────────────────────────────
  if (seg && seg.forkSection) {
    // ── FORK SECTION: two strips + divider ──────────────────────────────
    const inDivider    = Math.abs(player.x) < FORK_DIV;
    const outerOOB     = Math.abs(player.x) > FORK_OUTER;
    const onLeftStrip  = player.x < -FORK_DIV;

    if (player.dragonTimer <= 0) {
      if (inDivider) {
        // Driving in center grass divider — moderate penalty
        player.offRoadTimer += dt;
        player.speed *= Math.pow(OFFROAD_FRICTION, dt * 8);
        // Nudge back to nearest strip
        player.x += (player.x >= 0 ? 1 : -1) * 0.014;
      } else if (outerOOB) {
        // Fell off the outside edge
        player.offRoadTimer += dt;
        player.speed *= Math.pow(OFFROAD_FRICTION, dt * 11);
        if (player.speed > veh.maxSpeed * 0.52) player.speed = veh.maxSpeed * 0.52;
        player.x = clamp(player.x, -GRASS_EDGE, GRASS_EDGE);
      } else {
        player.offRoadTimer = 0;
      }
    }

    // Left strip (shortcut) speed bonus — faster but requires skill
    if (onLeftStrip && !inDivider) {
      player.onShortcut = true;
      player.speed = Math.min(
        player.speed * (1 + 0.004 * dt * 60),
        veh.maxSpeed * 1.08
      );
    } else {
      player.onShortcut = false;
    }

  } else {
    // ── NORMAL road (or roadWidthMult narrow section) ──────────────────
    player.onShortcut = false;
    const widthMult     = (seg && seg.roadWidthMult != null) ? seg.roadWidthMult : 1.0;
    const effectiveEdge = ROAD_EDGE * widthMult;
    const isOffRoad     = Math.abs(player.x) > effectiveEdge;

    if (isOffRoad && player.dragonTimer <= 0) {
      player.offRoadTimer += dt;
      player.speed *= Math.pow(OFFROAD_FRICTION, dt * 11);
      if (player.speed > veh.maxSpeed * 0.52) player.speed = veh.maxSpeed * 0.52;
      player.x = clamp(player.x, -GRASS_EDGE * widthMult, GRASS_EDGE * widthMult);
    } else if (!isOffRoad) {
      player.offRoadTimer = 0;
    }
  }

  // ── Advance position ───────────────────────────────────────────────────
  player.z = (player.z + player.speed * dt) % TRACK_SEGMENTS;

  // ── Audio ──────────────────────────────────────────────────────────────
  updateEngineSound(player.speed / (player.boosting ? veh.boostSpeed : veh.maxSpeed));
  if (typeof updateWindRush === 'function') updateWindRush(speedFrac);
}
