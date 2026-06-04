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
    ├── constants.js    # All game constants, VEHICLE_DEFS, DIFFICULTY_DEFS, WEATHER_DEFS, ITEM_DEFS
    ├── utils.js        # roundRect, hitTest, lerp, clamp, formatTime, ordinal
    ├── audio.js        # Web Audio API: per-vehicle engine sounds, weather ambients
    ├── input.js        # Keyboard + touch input state
    ├── tracks.js       # 6 track definitions + buildTrack() segment builder + respawnTrackItems()
    ├── renderer.js     # Pseudo-3D scanline road renderer, sky/background drawers, item orbs, fireworks
    ├── sprites.js      # 4 vehicle draw functions + player/AI render functions
    ├── cockpit.js      # First-person cockpit overlay (per-vehicle dashboard/wheel)
    ├── player.js       # Player physics: speed, steering, boost, ERS, items, heat, slipstream
    ├── ai.js           # AI car initialization and physics update
    ├── collision.js    # Player↔AI collision detection (shield-aware, combined radius model)
    ├── weather.js      # Weather system: particles, lightning, flying objects, overlay
    ├── hud.js          # HUD rendering: speed, lap, position, boost, per-vehicle gauges, item timers
    ├── screens.js      # All menu screens: Difficulty, Track, Vehicle, Customize, etc.
    └── game.js         # Main game loop, state machine, item collection, slipstream, scene compositor
```

**Script load order (index.html):**
constants → utils → audio → input → tracks → renderer → sprites → cockpit → player → ai → collision → weather → hud → screens → game

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
| `f1` | F1 Classic | 14 seg/s | 4.5 | 2.2 | 22 | 0.18 | Balanced open-wheel |
| `f1v2` | LMP1 | 15 seg/s | 5.0 | 2.5 | 23 | 0.19 | Closed-canopy prototype |
| `nascar` | NASCAR | 16 seg/s | 3.5 | 1.6 | 24 | 0.22 | High-speed oval beast |
| `moto` | Motorbike | 17 seg/s | 5.8 | 2.8 | 24 | 0.14 | Fastest, narrowest |

> Collision radii were reduced ~40% from original values so AI cars occupy one lane, making overtaking practical.

### Sprite draw functions (`sprites.js`)
- `drawF1Sprite(cx, cy, w, color, decal)` — Classic open-wheel, pointed nose, rear wing, halo
- `drawF1V2Sprite(cx, cy, w, color, decal)` — LMP1 prototype: one-piece wedge body, enclosed fenders, bubble canopy, shark-fin
- `drawNASCARSprite(cx, cy, w, color, decal)` — Stock car: rounded box body, roof, windshield, rear spoiler
- `drawMotoSprite(cx, cy, w, color, decal)` — Motorcycle: narrow elongated fairing, rider+helmet, lean on corners

### AI cars
AI cars always render as F1 Classic (`drawF1Sprite`). AI count is set by difficulty (3/3/5/6). Sprite width reduced to `p.rHalf × 0.42` (from 0.90), keeping each AI car to one lane. Combined hitbox = `playerCollisionRadius + 0.13`.

### Player physics (`player.js`)
- Speed: per-vehicle `maxSpeed`, `accel`, `brake`, `coast`
- **Steering**: authority = `veh.steerSpeed × steerFactor × effectiveGrip`, where `steerFactor = max(minSteer, 1 − speedFrac × 0.44 + brakeTurnBonus)`
- **Trail-brake bonus**: pressing Brake + a steering direction gives `+0.28` steer authority (trail-braking mechanic)
- **Corner drag**: above 75% speed (was 65%), steering bleeds speed to minimum 78% of max (was 72%)
- **Curve push**: `seg.curve × speedFrac × 0.006` per frame (halved from 0.012) — less auto-drift off-road on bends
- **Surface grip**: `seg.surfaceGrip` (mud, river crossing) overrides weather grip on specific segments; `gripTimer` item ignores all surface penalties
- **Oil slick**: `seg.oilSlick` segments add random lateral micro-drift
- **Fog zone**: `seg.fogZone` collapses draw distance to 35 segments
- **Road width**: `seg.roadWidthMult` shrinks effective road edge (Great Wall narrow sections)
- **Heat system**: on Sahara `heatZone` segments, heat builds at 0.06/s above 85% speed; above 0.85 heat, speed bleeds at −0.5/s
- **Item timers**: `turboTimer`, `dragonTimer`, `gripTimer`, `coolTimer`, `shield` — each modifies speed cap or grip
- Road stickiness: no-input centering at high speed
- LMP1 ERS: regenerates off-throttle (+0.08/s), depletes on boost (−0.15/s)
- NASCAR fuel: cosmetic gauge, depletes 0.0008/s while moving
- Off-road: exponential friction × `dt × 11`, hard-capped at 52% of `veh.maxSpeed`; `dragonTimer` bypasses off-road penalty

---

## Tracks (6 circuits)

Track definitions in `TRACK_DEFS` in `tracks.js`. Each track has sections (`{len, curve, shortcut?, item?, fogZone?, roadWidthMult?, oilSlick?, heatZone?, slipstreamZone?, surfaceGrip?, rockHazard?, riverCrossing?}`) tiled to fill `TRACK_SEGMENTS = 900` segments per lap.

| ID | Name | Subtitle | Unique Mechanic | Max Curve | Item Drop |
|----|------|----------|----------------|-----------|-----------|
| 0 | Monaco | Night Glamour Circuit | Tunnel (fog+narrow), Casino oil slick | ±4.2° | 💙 NITRO |
| 1 | Monza | Temple of Speed | Slipstream bonus on long straights | ±3.0° | 🟠 TURBO |
| 2 | Mountain Pass | Alpine Danger | Fog patches (3 zones), rock hazards | ±4.5° | 🟡 SHIELD |
| 3 | Amazon Circuit | Jungle Rally | Mud patches, blue river crossing | ±3.6° | 🟢 GRIP |
| 4 | Sahara Desert | Desert Endurance | Heat drain + 2 sandstorm pockets | ±3.0° | 🩵 COOL |
| 5 | Great Wall | The Dragon Circuit | Narrow watchtowers (0.65×), fireworks finish | ±4.2° | 🔴 DRAGON |

### Track-specific mechanics

**Monaco — tunnel**: `fogZone + roadWidthMult: 0.82` segments. Draw distance collapses to 35. Dark sky overlay with orange side-light strips. Two casino-exit segments have `oilSlick: true` — car slides randomly on exit.

**Monza — slipstream**: `slipstreamZone: true` on the 150-segment main straight and 100-segment back straight. In `checkSlipstream()`, if any AI is 3–8 segments ahead in the same lane, `player.slipstreaming = true` and speed gains +0.8/s up to 1.12× maxSpeed. HUD shows "⚡ SLIPSTREAM +12%".

**Mountain Pass — fog + rocks**: Three `fogZone` sections collapse visibility. Two segments have `rockHazard: 'left'|'right'` — a boulder is drawn on that side of the road.

**Amazon — mud + river**: `surfaceGrip: 0.55` on mud sections reduces effective grip regardless of weather. River crossing: `roadWidthMult: 1.10` (slightly wider), `surfaceGrip: 0.60`, and blue road color `#4a6890`. The `grip` item negates all surface penalties for 8s.

**Sahara — heat drain**: `heatZone: true` on long straight sections. `player.heat` builds at 0.06/s when speed > 85% maxSpeed; cools at 0.04/s otherwise. Above 0.85 heat, engine drags at −0.5/s. `fogZone` on two sections creates localized sandstorm pockets (amber-brown sky tint + collapsed visibility). HUD shows ENGINE TEMP bar for all vehicles on Sahara.

**Great Wall — narrow + dragon**: `roadWidthMult: 0.65–0.72` at watchtower sections moves the road edge inward — car physically fits through less space. The `dragon` item gives 4s of super speed + collision immunity; `player.shield` absorbs the first hit. `triggerFireworks()` launches a 3-second particle burst overlay on the finish screen.

### Shortcuts / alternate routes
Every track has 2–3 shortcut sections (35–45 segments each). These are marked `shortcut: true` and render as brown/gravel surface with yellow dashed edges and double-chevron arrows at the entry point. They are wider (1.12×) and free from rumble strips. Items are often placed on shortcut bypasses to reward taking the alternate route. All items respawn at the start of each new lap via `respawnTrackItems()`.

### Background renderers (`renderer.js`)
- `_drawBuildings` — Monaco city skyline with lit windows (parallax shift on camera lean)
- `_drawForest` — Monza treeline with pines
- `_drawMountains` — Layered silhouettes, far peaks + snow caps + rocky outcrops
- `_drawJungle` — Multi-layer canopy, hanging vines, tropical flower dots
- `_drawDesert` — Sahara sandy dune silhouettes, sun disk with radial gradient, cactus/rock shapes
- `_drawGreatWall` — Chinese mountain range, stone battlements (crenellations), watchtower blocks with roof peaks

---

## Power-Up Item System

Items are placed on specific track segments via the `item` property in `TRACK_DEFS`. `buildTrack()` places each item on the midpoint segment of its section. Items are collected when `Math.floor(player.z)` matches a segment with a non-null `item`. Consumed items are restored by `respawnTrackItems()` at every lap start.

### Item types (`ITEM_DEFS` in `constants.js`)

| ID | Color | Effect | Duration | Primary Track |
|----|-------|--------|----------|---------------|
| `nitro` | 💙 Blue | Instant boost refill | Instant | Monaco, Monza |
| `shield` | 🟡 Gold | Absorbs next collision | Until hit | Mountain Pass, Great Wall |
| `grip` | 🟢 Green | Max grip — ignores mud/dirt/wet | 8s | Amazon |
| `turbo` | 🟠 Orange | Raises maxSpeed cap ×1.25 | 6s | Monza |
| `cool` | 🩵 Cyan | Resets heat, prevents overheat | 10s | Sahara |
| `dragon` | 🔴 Red-Gold | Super speed (boostSpeed ×1.15) + invulnerability | 4s | Great Wall |

### Item orb rendering (`renderer.js` — `renderItemOrbs`)
- Drawn between `renderRoad()` and `renderAICars()` so orbs appear on the road surface
- Spinning diamond shape with radial glow halo, colored by item type
- Bobbing animation: `sin(Date.now() × 0.004 + n × 0.85) × orbR × 0.45`
- Scaled to road perspective: `orbR = p.rHalf × 0.24`
- Item label (`NITRO`, `TURBO`, etc.) rendered below orb

---

## Difficulty System

Defined in `DIFFICULTY_DEFS` in `constants.js`.

| Key | Name | AI Count | Weather | Night Cycle | Flying Objects | Weather Change |
|-----|------|----------|---------|-------------|----------------|----------------|
| `easy` | Easy | 3 | Sunny only | No | No | Never |
| `medium` | Medium | 3 | Sunny + Rain | Yes | No | Every 120s |
| `hard` | Hard | 5 | Sunny/Rain/Snow/Storm/Sandstorm | Yes | No | Every 60s |
| `asian` | Asian | 6 | All types incl. Tornado | Yes | Yes | Every 15s |

---

## Weather System (`weather.js`)

Global `weatherState` object. Initialized by `initWeather()` at race start, updated by `updateWeather(dt)`, rendered by `renderWeatherOverlay(W, H)` after road but before cockpit.

| Type | Grip | Visibility | Particles | Special |
|------|------|-----------|-----------|---------|
| `sunny` | 1.00 | 1.00 | None | — |
| `rain` | 0.75 | 0.85 | Blue rain streaks | Road shimmer, thunder |
| `snow` | 0.55 | 0.70 | White snowflakes | Road tint |
| `storm` | 0.65 | 0.72 | Heavy rain | Lightning, thunder |
| `sandstorm` | 0.80 | 0.50 | Horizontal sand | Edge-blur vignette |
| `tropical_storm` | 0.60 | 0.65 | Diagonal rain | Lightning + wind |
| `tornado` | 0.50 | 0.60 | Flying debris | Flying objects that crash player |

> Track `fogZone` segments create **localized** fog/sandstorm pockets independent of the global weather system — they collapse draw distance regardless of current weather type.

### Night cycle
240-second cycle (smooth sine). At peak night: sky darkens, visibility drops to 65%, black overlay at 55% opacity. 3rd-person view adds a radial headlight cone.

---

## Audio System (`audio.js`)

Fully procedural Web Audio API — no audio files.

| Vehicle | Oscillator | Freq Range | Distortion |
|---------|-----------|-----------|------------|
| F1 Classic | sawtooth | 80–340 Hz | 80 |
| LMP1 | triangle | 65–280 Hz | 40 |
| NASCAR | square | 55–200 Hz | 120 |
| Moto | sine + harmonic (×0.30) | 110–420 Hz | 30 |

---

## HUD System (`hud.js`)

### Generic HUD (all vehicles)
- **Top-left**: Race timer
- **Top-left below timer**: Position badge (1st = gold, 2nd = orange, 3rd+ = red)
- **Top-left minimap**: Track outline with AI dots and pulsing player dot
- **Top-center**: Lap counter `LAP X / Y`
- **Top-right**: Speed gauge (km/h + bar, green→red) + Boost strip (READY / cooldown / active)
- **Center-right (stacked)**: Active item timer bars — Dragon, Turbo, Grip, Cool, Shield
- **Center**: Weather type banner when not sunny; Slipstream indicator when drafting (Monza)
- **Bottom-center**: View mode badge + desktop key hints

### Per-vehicle gauges (top-right, below boost)
- **F1 Classic**: Gear display (1–7) + 5-LED shift indicator (green→red)
- **LMP1**: Same gear display + ERS charge bar (blue, 0–100%)
- **NASCAR**: "IN DRAFT" indicator when within 8 segments of AI + fuel gauge (cosmetic)
- **Motorbike**: Arc lean-angle gauge (±38°) + "⚠ WHEELIE" warning at high speed

### Track-specific gauges
- **Sahara (all vehicles)**: ENGINE TEMP bar below vehicle panel — green→red, "⚠ OVERHEAT" above 85%
- **Monza (slipstream)**: "⚡ SLIPSTREAM +12%" overlay at H×0.55 when drafting behind AI
- **Great Wall (dragon)**: Dragon timer bar with red-gold glow countdown

### Overlays
- **Crash**: Red screen flash + "COLLISION!" text (shield/dragon blocks this)
- **Off-road**: Yellow "▲ OFF ROAD" warning

---

## Rendering Pipeline (`renderer.js`)

### Projection (`projectRoad`)
1. Computes segments visible ahead up to `DRAW_DISTANCE × visibilityScale`
2. **Fog zone override**: if player's current segment has `fogZone: true`, draw distance is capped to 35
3. Per segment: `scale = CAMERA_H / z`, `screenY = H × horizonFrac + scale × roadBase`, `rHalf = scale × W × ROAD_HALF_NORM`
4. Stores in `_projected[]` array

### Road scanline (`renderRoad`)
For each screen row bottom→horizon, back-projects to depth `z`, looks up segment, draws 1-pixel strips:
- Grass → left rumble → road surface (or shortcut/river) → centre markings → right rumble
- **`roadWidthMult`**: `effectiveHalf = roadHalfPx × seg.roadWidthMult` on narrow sections (Great Wall)
- Shortcut zones: 1.12× wider, no rumble, yellow dotted edges
- Finish line: checkered black/white pattern

### Item orbs (`renderItemOrbs`)
Called between `renderRoad` and `renderAICars`. Loops `_projected[n]` for all visible segments and draws spinning colored diamond + glow halo for each segment with a non-null `item`.

### Shortcut markers
Yellow double-chevron arrows drawn at the first segment of each shortcut zone to signal entry point.

### Atmospheric overlays (`renderSkyAndBackground`)
- **Monaco tunnel** (`fogZone` + `buildings` track): dark screen overlay + orange side-strip lights
- **Sahara sandstorm pockets** (`fogZone` + `desert` track): amber-brown tint `rgba(160,90,10,0.40)` over full canvas

### Fireworks (`renderFireworks`, `triggerFireworks`)
Triggered when player finishes on Great Wall. 12 colored bursts with ring + ray animation, fading over 3 seconds. Called from the FINISH screen render.

### Camera
- `HORIZON_FRAC = 0.45` (1st-person); 3rd-person lowers by 0.06
- `CAMERA_LEAN_FACTOR = 0.32` — steering pans road view in 1st-person
- `COCKPIT_TILT_ANGLE = 0.09` rad — cockpit tilts on corners

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
| Pause | ESC | ⏸ button |

> **Tip**: Hold Brake + a steering direction simultaneously for trail-braking — this gives extra steering authority through tight hairpins.

---

## Key Constants (`constants.js`)

| Constant | Value | Purpose |
|----------|-------|---------|
| `DRAW_DISTANCE` | 150 | Max segments rendered ahead (scaled by weather + fogZone) |
| `TRACK_SEGMENTS` | 900 | Segments per lap |
| `CAMERA_H` | 0.84 | Perspective camera height factor |
| `ROAD_HALF_NORM` | 0.42 | Road half-width as fraction of `W/2` at scale 1 |
| `HORIZON_FRAC` | 0.45 | Horizon y as fraction of H |
| `TOTAL_LAPS` | 3 | Laps per race |
| `ROAD_EDGE` | 1.0 | Normalised half-width of drivable road (multiplied by `roadWidthMult`) |
| `GRASS_EDGE` | 1.55 | Hard boundary (car stops sliding here) |
| `OFFROAD_FRICTION` | 0.55 | Speed decay per frame when off-road |

---

## Design Notes

1. **Track tiling**: Each track's sections expand to a raw sample array, then tile to exactly 900 segments. Item orbs are placed at the midpoint segment of their section to ensure one orb per section per lap.
2. **Fog zones vs weather**: `fogZone` segments collapse draw distance locally (35 segs) regardless of global weather. On the Sahara, this creates sandstorm pockets you drive through; on Monaco, it creates a dark tunnel effect.
3. **roadWidthMult**: Only affects the visual road width and the off-road edge detection. AI cars do not respect it — they can clip the edge on narrow sections, making overtaking there harder.
4. **Shield vs dragon**: `player.shield` is a one-shot absorber. `player.dragonTimer > 0` is continuous immunity. Both are consumed/expired by the collision check in `collision.js`. Dragon also forces `player.boosting = true` for its duration.
5. **Slipstream**: Only activates on `slipstreamZone` segments (Monza's long straights). The bonus applies continuously while the conditions hold — it doesn't require any button press.
6. **Item respawn**: `respawnTrackItems()` restores all `_itemRespawnMap` values to `segments[i].item` at the start of each new lap, so items are available once per lap per location.
7. **AI vehicle type**: All AI cars always render as F1 Classic. This keeps AI predictable and performance-consistent.
8. **ERS/Fuel**: LMP1 ERS is gameplay-meaningful (tracked in player state, shown in HUD). NASCAR fuel is purely cosmetic (displayed but carries no gameplay penalty).

---

## Deployment

No build step required. Open `index.html` directly in any modern browser, or host the directory statically (GitHub Pages, Netlify, etc.).

```bash
# Local development (any static server)
npx serve .
# or
python -m http.server 8080
```
