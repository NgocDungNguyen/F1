// ─────────────────────────────────────────────
//  GAME-WIDE CONSTANTS
// ─────────────────────────────────────────────

// Road / projection
const DRAW_DISTANCE  = 150;   // segments visible ahead
const CAMERA_H       = 0.84;
const ROAD_HALF_NORM = 0.42;
const HORIZON_FRAC   = 0.45;

// Track
const TRACK_SEGMENTS = 900;
const CURVE_SCALE    = 0.004;

// Player (legacy fallbacks — physics now per-vehicle via VEHICLE_DEFS)
const PLAYER_MAX_SPEED   = 14;
const PLAYER_ACCEL       = 4.5;
const PLAYER_BRAKE       = 9;
const PLAYER_COAST       = 1.8;
const BOOST_SPEED        = 22;
const BOOST_DURATION     = 3.5;
const BOOST_COOLDOWN     = 28;
const STEER_SPEED        = 2.2;
const OFFROAD_FRICTION   = 0.55;
const CRASH_SPEED_MULT   = 0.42;
const ROAD_EDGE          = 1.0;
const GRASS_EDGE         = 1.55;

// AI
const AI_COUNT       = 3;   // legacy; active count comes from difficulty
const AI_MAX_SPEED   = 11.5;
const AI_ACCEL       = 3.5;
const AI_STEER       = 1.8;

// Misc
const TOTAL_LAPS     = 3;

// Camera effects
const CAMERA_LEAN_FACTOR = 0.32;
const COCKPIT_TILT_ANGLE = 0.09;
const COCKPIT_PIVOT_Y    = 0.88;

// View modes
const VIEW_1ST = '1st';
const VIEW_3RD = '3rd';

// Mobile detection
const IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
               || ('ontouchstart' in window);

// ─────────────────────────────────────────────
//  VEHICLE DEFINITIONS
// ─────────────────────────────────────────────
const VEHICLE_DEFS = {
  f1: {
    name: 'F1 CLASSIC',
    desc: 'Balanced · Responsive',
    maxSpeed: 14, accel: 4.5, brake: 9, coast: 1.8,
    steerSpeed: 2.2, minSteer: 0.38,
    boostSpeed: 22, boostDuration: 3.5, boostCooldown: 28,
    collisionRadius: 0.30,
    playerWidth: 0.082,
    cornerDrag: 0.18,
    // Sound profile
    oscType: 'sawtooth', freqLo: 80, freqHi: 340, distAmt: 80,
    stats: { speed: 3, handling: 4, accel: 3 },
  },
  f1v2: {
    name: 'LMP1',
    desc: 'Prototype · Covered Wheels',
    maxSpeed: 15, accel: 5.0, brake: 10, coast: 1.5,
    steerSpeed: 2.5, minSteer: 0.38,
    boostSpeed: 23, boostDuration: 4.0, boostCooldown: 24,
    collisionRadius: 0.32,
    playerWidth: 0.095,
    cornerDrag: 0.14,
    oscType: 'triangle', freqLo: 65, freqHi: 280, distAmt: 40,
    stats: { speed: 4, handling: 4, accel: 4 },
  },
  nascar: {
    name: 'NASCAR',
    desc: 'Top Speed · Oval Power',
    maxSpeed: 16, accel: 3.5, brake: 7.5, coast: 1.2,
    steerSpeed: 1.6, minSteer: 0.28,
    boostSpeed: 24, boostDuration: 4.0, boostCooldown: 32,
    collisionRadius: 0.36,
    playerWidth: 0.100,
    cornerDrag: 0.22,
    oscType: 'square', freqLo: 55, freqHi: 200, distAmt: 120,
    stats: { speed: 5, handling: 2, accel: 2 },
  },
  moto: {
    name: 'MOTORBIKE',
    desc: 'Fastest · Narrow',
    maxSpeed: 17, accel: 5.8, brake: 10, coast: 2.2,
    steerSpeed: 2.8, minSteer: 0.42,
    boostSpeed: 24, boostDuration: 3.0, boostCooldown: 22,
    collisionRadius: 0.22,
    playerWidth: 0.060,
    cornerDrag: 0.12,
    oscType: 'sine', freqLo: 110, freqHi: 420, distAmt: 30,
    stats: { speed: 5, handling: 4, accel: 5 },
  },
};

// ─────────────────────────────────────────────
//  DIFFICULTY DEFINITIONS
// ─────────────────────────────────────────────
const DIFFICULTY_DEFS = {
  easy: {
    name: 'EASY',
    desc: 'Clear skies · Perfect grip',
    icons: '☀️',
    aiCount: 3,
    weatherPool: ['sunny'],
    nightCycle: false,
    flyingObjects: false,
    weatherInterval: 0,
  },
  medium: {
    name: 'MEDIUM',
    desc: 'Day/night cycle · Light rain',
    icons: '☀️🌧️',
    aiCount: 3,
    weatherPool: ['sunny', 'rain'],
    nightCycle: true,
    flyingObjects: false,
    weatherInterval: 120,
  },
  hard: {
    name: 'HARD',
    desc: 'Storms · Snow · 5 rivals',
    icons: '⛈️❄️🌪️',
    aiCount: 5,
    weatherPool: ['sunny', 'rain', 'snow', 'storm', 'sandstorm'],
    nightCycle: true,
    flyingObjects: false,
    weatherInterval: 60,
  },
  asian: {
    name: 'ASIAN',
    desc: 'Chaos every 15s · 6 rivals',
    icons: '🌪️⚡🌊',
    aiCount: 6,
    weatherPool: ['rain', 'snow', 'storm', 'sandstorm', 'tropical_storm', 'tornado'],
    nightCycle: true,
    flyingObjects: true,
    weatherInterval: 15,
  },
};

// ─────────────────────────────────────────────
//  WEATHER PHYSICS CONSTANTS
// ─────────────────────────────────────────────
const WEATHER_DEFS = {
  sunny:          { grip: 1.00, visibility: 1.00, roadWet: false, skyTint: null,                  particleType: null,   particleRate: 0   },
  rain:           { grip: 0.75, visibility: 0.85, roadWet: true,  skyTint: 'rgba(10,20,60,0.35)', particleType: 'rain', particleRate: 80  },
  snow:           { grip: 0.55, visibility: 0.70, roadWet: false, skyTint: 'rgba(180,190,210,0.25)',particleType:'snow', particleRate: 60  },
  storm:          { grip: 0.65, visibility: 0.72, roadWet: true,  skyTint: 'rgba(20,0,50,0.45)',  particleType: 'rain', particleRate: 140 },
  sandstorm:      { grip: 0.80, visibility: 0.50, roadWet: false, skyTint: 'rgba(140,80,10,0.50)',particleType: 'sand', particleRate: 120 },
  tropical_storm: { grip: 0.60, visibility: 0.65, roadWet: true,  skyTint: 'rgba(0,40,50,0.50)', particleType: 'rain', particleRate: 180 },
  tornado:        { grip: 0.50, visibility: 0.60, roadWet: false, skyTint: 'rgba(20,20,20,0.55)', particleType: 'debris',particleRate: 50  },
};
