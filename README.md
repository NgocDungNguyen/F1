# F1 Racer — Pseudo-3D Arcade Racing Game

A fully browser-based pseudo-3D arcade racing game built with vanilla HTML5 Canvas, Web Audio API, and zero dependencies. Targets desktop and mobile browsers; deployable on GitHub Pages with no build step.

---

## Project Structure

```
F1/
├── index.html          # Entry point — loads all scripts in order, mobile controls
├── css/
│   └── style.css       # Canvas layout, mobile button CSS, safe-zone insets
└── js/
    ├── constants.js    # All game constants, VEHICLE_DEFS, DIFFICULTY_DEFS, WEATHER_DEFS
    ├── utils.js        # roundRect, hitTest, lerp, clamp, formatTime, ordinal
    ├── audio.js        # Web Audio API: per-vehicle engine sounds, weather ambients
    ├── input.js        # Keyboard + touch input state
    ├── tracks.js       # 4 track definitions + buildTrack() segment builder
    ├── renderer.js     # Pseudo-3D scanline road renderer + sky/background drawers
    ├── sprites.js      # 4 vehicle draw functions + player/AI render functions
    ├── cockpit.js      # First-person cockpit overlay (per-vehicle dashboard/wheel)
    ├── player.js       # Player physics: speed, steering, boost, ERS, weather grip
    ├── ai.js           # AI car initialization and physics update
    ├── collision.js    # Player↔AI collision detection (combined radius model)
    ├── weather.js      # Weather system: particles, lightning, flying objects, overlay
    ├── hud.js          # HUD rendering: speed, lap, position, boost, per-vehicle gauges
    ├── screens.js      # All menu screens: Difficulty, Track, Vehicle, Customize, etc.
    └── game.js         # Main game loop, state machine, scene compositor
```

**Script load order (index.html):**
constants → utils → audio → input → tracks → renderer → sprites → cockpit → player → ai → collision → **weather** → hud → screens → game

---

## Game Flow / State Machine

```
MENU → DIFFICULTY_SELECT → TRACK_SELECT → VEHICLE_SELECT → CAR_CUSTOMIZE
                                                                  ↓
                                                            COUNTDOWN (5s)
                                                                  ↓
                                                            RACING ←→ PAUSED
                                                                  ↓
                                                              FINISH
                                                           ↙         ↘
                                                    TRACK_SELECT    MENU
```

Each state is handled in `render()` inside `game.js`. The `update()` function only runs physics for `COUNTDOWN` and `RACING` states.

---

## Vehicles (4 types)

All vehicle physics live in `VEHICLE_DEFS` in `constants.js`. `player.js` reads from this at runtime — no hardcoded per-vehicle physics elsewhere.

| Key | Name | Top Speed | Accel | Steering | Boost | Collision R | Character |
|-----|------|-----------|-------|----------|-------|-------------|-----------|
| `f1` | F1 Classic | 14 seg/s | 4.5 | 2.2 | 22 | 0.30 | Balanced open-wheel |
| `f1v2` | LMP1 | 15 seg/s | 5.0 | 2.5 | 23 | 0.32 | Closed-canopy prototype |
| `nascar` | NASCAR | 16 seg/s | 3.5 | 1.6 | 24 | 0.36 | High-speed oval beast |
| `moto` | Motorbike | 17 seg/s | 5.8 | 2.8 | 24 | 0.22 | Fastest, narrowest |

### Sprite draw functions (`sprites.js`)
- `drawF1Sprite(cx, cy, w, color, decal)` — Classic open-wheel, pointed nose, rear wing, halo
- `drawF1V2Sprite(cx, cy, w, color, decal)` — LMP1 prototype: one-piece wedge body, enclosed fenders, bubble canopy, shark-fin, flat wide nose splitter
- `drawNASCARSprite(cx, cy, w, color, decal)` — Stock car: rounded box body, roof, windshield, fender wells, rear spoiler, door #07
- `drawMotoSprite(cx, cy, w, color, decal)` — Motorcycle: narrow elongated fairing, rider+helmet, single front/rear wheel, lean on corners

### AI cars
AI cars always render as F1 Classic (`drawF1Sprite`). AI count is set by difficulty (3/3/5/6). AI uses `AI_COLORS = ['#0033cc','#ffcc00','#00aa44','#cc0044','#aa44ff','#ff8800']` with 6 starting gap positions.

### Collision detection (`collision.js`)
Combined-radius model: `hitRadius = playerCollisionRadius + 0.28` (0.28 = fixed AI radius, all AI are F1 class). Motorcycle players (0.22) get 0.50 combined threshold; NASCAR (0.36) gets 0.64.

### Player physics (`player.js`)
- Speed: per-vehicle `maxSpeed`, `accel`, `brake`, `coast`
- Steering: authority = `veh.steerSpeed × steerFactor × wetGrip`, where `steerFactor = max(minSteer, 1 - speedFrac × 0.58)`
- Corner drag: above 65% speed, hard steering bleeds speed to minimum 72% of max
- Road stickiness: no-input centering at high speed
- Weather grip: `weatherState.gripFactor` multiplies all steering; wet roads add micro-slide noise
- LMP1 ERS: regenerates off-throttle (`+0.08/s`), depletes on boost (`-0.15/s`)
- NASCAR fuel: cosmetic gauge, depletes `0.0008/s` while moving
- Off-road: exponential friction × `dt × 11`, hard-capped at 52% of `veh.maxSpeed`

### First-person cockpit (`cockpit.js`)
Each vehicle type gets a completely different cockpit:
- **F1 Classic**: Open top, butterfly steering wheel (flat bottom), pointed nose cone + front wings + side mirrors
- **LMP1**: Closed canopy with windshield frame + A-pillars, compact D-ring wheel, wide flat nose visible through windshield, large door mirrors
- **NASCAR**: Wide trapezoid dashboard, large 3-spoke round wheel, wide hood with centre stripe
- **Moto**: Narrower fairing panel, handlebars with grips, digital instrument cluster showing km/h, narrow fairing nose

---

## Tracks (4 circuits)

Track definitions are in `TRACK_DEFS` in `tracks.js`. Each track has sections (`{len, curve, shortcut?}`) that are tiled to fill exactly `TRACK_SEGMENTS = 900` segments per lap.

| ID | Name | Type | Background | Character |
|----|------|------|-----------|-----------|
| 0 | Monaco | City street | Buildings | Tight hairpins, technical, short straights |
| 1 | Monza | Road circuit | Forest | Long straights, high speed, gentle sweeps (exactly 900 segs) |
| 2 | Mountain Pass | Mountain | Layered peaks + snow caps | Blind hairpins, cliff drops, S-curves |
| 3 | Amazon Circuit | Jungle rally | Canopy + vines + flowers | River crossings, flowing S-curves, dense jungle |

### Shortcut zones
Certain sections are marked `shortcut: true`. These render as a brown/gravel alternate surface alongside the main tarmac at hairpin insides. Shortcut zones:
- Have no rumble strips
- Are 12% wider than normal road
- Show yellow dashed edge lines instead of a centre dash
- AI cars steer back toward centre (avoid shortcuts)
- Give the player a passable alternate line without off-road friction penalty

### Background renderers (`renderer.js`)
- `_drawBuildings` — Monaco city skyline with lit windows
- `_drawForest` — Monza treeline with pines
- `_drawMountains` — Layered silhouettes, far peaks + snow caps + rocky outcrops
- `_drawJungle` — Multi-layer canopy, hanging vines, tropical flower dots

---

## Difficulty System

Defined in `DIFFICULTY_DEFS` in `constants.js`. Selected in `DIFFICULTY_SELECT` state before track choice.

| Key | Name | AI Count | Weather | Night Cycle | Flying Objects | Weather Change |
|-----|------|----------|---------|-------------|----------------|----------------|
| `easy` | Easy | 3 | Sunny only | No | No | Never |
| `medium` | Medium | 3 | Sunny + Rain | Yes (4-min cycle) | No | Every 120s |
| `hard` | Hard | 5 | Sunny/Rain/Snow/Storm/Sandstorm | Yes | No | Every 60s |
| `asian` | Asian | 6 | All types incl. Tornado | Yes | Yes | Every 15s |

---

## Weather System (`weather.js`)

Global `weatherState` object. Initialized by `initWeather()` at race start, updated by `updateWeather(dt)` each frame, rendered by `renderWeatherOverlay(W, H)` after road but before cockpit.

### Weather types

| Type | Grip Factor | Visibility | Particles | Special |
|------|-------------|-----------|-----------|---------|
| `sunny` | 1.00 | 1.00 | None | — |
| `rain` | 0.75 | 0.85 | Blue rain streaks (80/s) | Road shimmer, thunder+lightning |
| `snow` | 0.55 | 0.70 | White snowflakes (60/s) | Road tint |
| `storm` | 0.65 | 0.72 | Heavy rain (140/s) | Lightning, thunder |
| `sandstorm` | 0.80 | 0.50 | Horizontal sand (120/s) | Edge-blur vignette |
| `tropical_storm` | 0.60 | 0.65 | Diagonal rain (180/s) | Lightning + wind |
| `tornado` | 0.50 | 0.60 | Flying debris (50/s) | Vortex particles, flying objects that hit car |

### Night cycle (medium/hard/asian)
240-second cycle (smooth sine curve). At peak night: sky darkens, visibility drops to 65%, black overlay at 55% opacity. In 3rd-person view a radial headlight cone appears ahead of player car.

### Flying objects (tornado + Asian difficulty)
Debris rectangles and circles launch from screen sides in arcs. If a flying object overlaps the player car area (`W×[0.40–0.60], H×[0.72–0.86]`), it triggers a crash (`crashTimer = 0.8`, speed × 0.55).

### Physics integration
`weatherState.gripFactor` multiplies all player steering in `player.js`. Wet roads (`roadWet: true`) add `±0.003 × (1 - gripFactor) × speedFrac` lateral micro-sliding noise per frame.

### Weather audio (`audio.js`)
- `playRainAmbient()` / `stopRainAmbient()` — looping white noise through 900 Hz low-pass filter
- `playWindAmbient()` / `stopWindAmbient()` — looping bandpass noise (180 Hz, Q=0.5)
- `playThunder()` — bass burst noise through 200 Hz low-pass, 1.2s, volume 0.65

---

## Audio System (`audio.js`)

Fully procedural Web Audio API — no audio files. All sounds synthesized in real time.

### Engine sound
Per-vehicle oscillator profiles (from `VEHICLE_DEFS.oscType/freqLo/freqHi/distAmt`):

| Vehicle | Oscillator | Freq Range | Distortion | Character |
|---------|-----------|-----------|------------|-----------|
| F1 Classic | sawtooth | 80–340 Hz | 80 | High-pitched scream |
| LMP1 | triangle | 65–280 Hz | 40 | Turbo hybrid whine |
| NASCAR | square | 55–200 Hz | 120 | Deep V8 growl |
| Moto | sine + harmonic (×0.30) | 110–420 Hz | 30 | 2/4-stroke whine |

Motorcycle uses a second oscillator (`engineOsc2`) at `freq × 2.1`, mixed at 30% volume via a separate `engineGain2` node.

### Boost sounds (per vehicle)
- F1: 280→1400 Hz sawtooth sweep (0.6s)
- LMP1: 200→900 Hz triangle (0.8s) — electric torque surge
- NASCAR: 80→300 Hz square (0.5s) — supercharger
- Moto: 350→1800 Hz sawtooth (0.4s) — power band hit

---

## HUD System (`hud.js`)

### Generic HUD (all vehicles)
- **Top-left**: Race timer
- **Top-left below timer**: Position badge (1st = gold, 2nd = orange, 3rd+ = red)
- **Top-left minimap**: Track outline with AI dots and pulsing player dot
- **Top-center**: Lap counter `LAP X / Y`
- **Top-right**: Speed gauge (km/h + bar, green→red) + Boost strip (READY / cooldown / active)
- **Center**: Weather type banner when not sunny
- **Bottom-center**: View mode badge + desktop key hints

### Per-vehicle gauges (below boost strip, top-right)
- **F1 Classic**: Gear display (1–7 simulated) + 5-LED shift indicator (green→red)
- **LMP1**: Same gear display + ERS charge bar (blue, 0–100%)
- **NASCAR**: "IN DRAFT" indicator when within 8 segments of an AI + fuel gauge (cosmetic)
- **Motorbike**: Arc lean-angle gauge (±38°) + "⚠ WHEELIE" warning when speed > 92% max with no steering

### Overlays
- **Crash**: Red screen flash + "COLLISION!" text
- **Off-road**: Yellow "▲ OFF ROAD" warning

---

## Rendering Pipeline (`renderer.js`)

### Projection
`projectRoad(playerZ, effectivePlayerX, W, H)`:
1. Computes segments visible ahead (up to `DRAW_DISTANCE × visibilityScale`)
2. Per segment: `scale = CAMERA_H / z`, `screenY = H × horizonFrac + scale × roadBase`, `rHalf = scale × W × ROAD_HALF_NORM`
3. Stores in `_projected[]` array (shared with `sprites.js`)

### Road scanline
`renderRoad(W, H)`: For each screen row from bottom to horizon, back-projects to get depth `z`, looks up segment, draws 1-pixel strips: grass → left rumble → road (or shortcut surface) → centre markings → right rumble.

### Camera
- `HORIZON_FRAC = 0.45` (y fraction of horizon in 1st-person)
- 3rd-person: horizon lowered by 0.06 for more road visibility
- `CAMERA_LEAN_FACTOR = 0.32` — steering pans the road view in 1st-person
- `COCKPIT_TILT_ANGLE = 0.09` rad — whole cockpit tilts; motorcycle at 1.8× multiplier

### AI sprite scaling
`spriteW = p.rHalf × 0.90` — empirical factor keeping AI cars visually narrow enough to pass.

---

## Mobile Support

- **Orientation lock**: Portrait mode triggers an overlay asking to rotate
- **Touch controls**: Left/Right D-pad (circular buttons), Brake/Gas/Boost (rectangular pedals), Pause/View toggle (top-right meta)
- **Safe zones**: All controls use `env(safe-area-inset-*)` with `max()` for iPhone notch and Android nav bar
- **Menu tap**: Canvas `touchend` fires `clickedThisFrame` for menu interaction
- **Visual Viewport API**: `visualViewport` used for resize to handle Android URL bar shrink

---

## Controls

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Gas | ↑ / W | GAS button |
| Brake | ↓ / S | BRAKE button |
| Steer left | ← / A | ◀ button |
| Steer right | → / D | ▶ button |
| Boost | SPACE | ⚡ button |
| Toggle camera | V | 🎥 button |
| Pause | ESC | ⏸⏸ button |

---

## Key Constants (`constants.js`)

| Constant | Value | Purpose |
|----------|-------|---------|
| `DRAW_DISTANCE` | 150 | Max segments rendered ahead (scaled by weather visibility) |
| `TRACK_SEGMENTS` | 900 | Segments per lap |
| `CAMERA_H` | 0.84 | Perspective camera height factor |
| `ROAD_HALF_NORM` | 0.42 | Road half-width as fraction of `W/2` at scale 1 |
| `HORIZON_FRAC` | 0.45 | Horizon y as fraction of H |
| `TOTAL_LAPS` | 3 | Laps per race |
| `ROAD_EDGE` | 1.0 | Normalised half-width of drivable road |
| `GRASS_EDGE` | 1.55 | Hard boundary (car stops sliding here) |
| `OFFROAD_FRICTION` | 0.55 | Speed multiplier per frame when off-road |

---

## Known Design Notes

1. **Track tiling**: Each track definition expands sections and tiles them to exactly 900 segments. Monaco (~440 segs) repeats ~2× per lap. Monza is exactly 900 segments. Mountain Pass (~595) and Amazon (~574) tile ~1.5× per lap — this means corners repeat but the experience still feels varied.
2. **AI vehicle type**: All AI cars always render as F1 Classic regardless of player vehicle choice. This keeps AI predictable and performance-consistent.
3. **Shortcut routes**: Not true branching paths (would require a graph-based track system). Instead, marked sections render as a brown/dirt alternate surface at hairpin insides. Player can use them; AI avoids them.
4. **ERS/Fuel**: LMP1 ERS is gameplay-meaningful (tracked in player state, shown in HUD, affected by boost). NASCAR fuel is purely cosmetic (displayed but never runs out; no penalty).
5. **Weather grip**: Lower `gripFactor` reduces steering authority multiplicatively but does NOT affect engine braking or off-road friction (those are separate systems).

---

## Deployment

No build step required. Open `index.html` directly in any modern browser, or host the directory statically (GitHub Pages, Netlify, etc.).

```bash
# Local development (any static server)
npx serve .
# or
python -m http.server 8080
```
