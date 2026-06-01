// ─────────────────────────────────────────────
//  GAME-WIDE CONSTANTS
// ─────────────────────────────────────────────

// Road / projection
const DRAW_DISTANCE  = 150;   // segments visible ahead
const CAMERA_H       = 0.84;  // camera height in normalized "scale-at-1" units
const ROAD_HALF_NORM = 0.42;  // road half-width as fraction of (W/2) at scale 1
const HORIZON_FRAC   = 0.45;  // horizon y = H * HORIZON_FRAC

// Track
const TRACK_SEGMENTS = 900;   // segments per lap
const CURVE_SCALE    = 0.004; // how much seg.curve shifts road per segment

// Player
const PLAYER_MAX_SPEED   = 14;   // segments/sec at full throttle
const PLAYER_ACCEL       = 4.5;  // segments/sec²
const PLAYER_BRAKE       = 9;    // segments/sec²
const PLAYER_COAST       = 1.8;  // passive drag
const BOOST_SPEED        = 22;   // segments/sec while boosting
const BOOST_DURATION     = 3.5;  // seconds
const BOOST_COOLDOWN     = 28;   // seconds
const STEER_SPEED        = 2.2;  // lateral units/sec
const OFFROAD_FRICTION   = 0.55; // speed multiplier/sec when off road
const CRASH_SPEED_MULT   = 0.42; // instant speed reduction on collision
const ROAD_EDGE          = 1.0;  // normalized half-width of drivable road
const GRASS_EDGE         = 1.55; // beyond this = deep grass (hard stop)

// AI
const AI_COUNT       = 3;
const AI_MAX_SPEED   = 11.5;
const AI_ACCEL       = 3.5;
const AI_STEER       = 1.8;

// Misc
const TOTAL_LAPS     = 3;

// Camera effects
const CAMERA_LEAN_FACTOR = 0.32;   // how much steering shifts the road view laterally
const COCKPIT_TILT_ANGLE = 0.09;   // max cockpit tilt (radians) at full steering lock
const COCKPIT_PIVOT_Y    = 0.88;   // cockpit rotation pivot as fraction of H

// View modes
const VIEW_1ST = '1st';   // cockpit / first-person
const VIEW_3RD = '3rd';   // over-shoulder / third-person

// Mobile detection (evaluated once)
const IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
               || ('ontouchstart' in window);
