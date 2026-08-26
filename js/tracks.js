// ─────────────────────────────────────────────
//  TRACK DEFINITIONS + BUILDER
// ─────────────────────────────────────────────

// Section props: { len, curve, forkSection?, forkEntry?, forkExit?,
//                  item?, surfaceGrip?, fogZone?, roadWidthMult?,
//                  oilSlick?, heatZone?, slipstreamZone?, rockHazard?, riverCrossing? }
//
// FORK SYSTEM (replaces old shortcut: true):
//   forkEntry  — road widens, arrow sign painted, transition in
//   forkSection — TWO separate road strips rendered (left=shortcut, right=main)
//   forkExit   — roads merge back, transition out
//
// Left strip (shortcut) = dirt/brown surface, speed bonus, harder to stay on
// Right strip (main)    = normal asphalt, standard physics

const TRACK_DEFS = [

  // ── 0: MONACO ──────────────────────────────────────────────────────────
  {
    id: 0,
    name: 'MONACO',
    subtitle: 'Night Glamour Circuit',
    desc: 'Hairpins • Oil slicks • Tunnel • Tight chicanes',
    skyTop:    '#0a1628',
    skyBot:    '#1a3a6a',
    hillColor: '#1a3a1a',
    bgObjects: 'buildings',
    sections: [
      { len: 50,  curve:  0.0 },                                     // harbour straight
      { len: 20,  curve:  3.8 },                                     // Ste Devote right
      { len: 66,  curve:  0.0, item: 'nitro' },                     // Casino straight
      { len: 18,  curve: -2.2 },                                     // Massenet left
      { len: 22,  curve:  4.2 },                                     // Casino square right
      { len: 20,  curve:  0.0, oilSlick: true },                    // oil patch — Casino exit
      { len: 18,  curve: -3.4 },                                     // Mirabeau left
      { len: 66,  curve:  0.0 },                                     // Loews straight
      { len: 25,  curve:  4.0 },                                     // Grand Hotel hairpin
      { len: 30,  curve:  0.0 },                                     // tunnel entrance
      { len: 40,  curve:  0.8, fogZone: true, roadWidthMult: 0.82 }, // TUNNEL — narrow + dark
      { len: 30,  curve:  0.0 },                                     // tunnel exit
      { len: 28,  curve: -3.2 },                                     // Nouvelle chicane L
      { len: 28,  curve:  3.2 },                                     // Nouvelle chicane R
      { len: 55,  curve:  0.0 },                                     // Tabac straight
      { len: 25,  curve: -2.8 },                                     // Swimming Pool L
      { len: 25,  curve:  2.8 },                                     // Swimming Pool R
      { len: 15,  curve:  0.0 },                                     // approach
      { len: 16,  curve: -4.0 },                                     // 180° LEFT HAIRPIN — U-turn
      { len: 13,  curve:  0.0 },                                     // brief flat
      { len: 16,  curve:  4.0 },                                     // 180° RIGHT mirror
      { len: 25,  curve: -3.0 },                                     // Rascasse
      { len: 30,  curve:  0.0 },                                     // finish run
    ]
  },

  // ── 1: MONZA ───────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'MONZA',
    subtitle: 'Temple of Speed',
    desc: 'Slipstream wars • Longest straights',
    skyTop:    '#1a3a6a',
    skyBot:    '#4a7ab8',
    hillColor: '#2a5a2a',
    bgObjects: 'forest',
    sections: [
      { len: 55,  curve:  0.0, slipstreamZone: true },              // opening blast
      { len: 10,  curve:  2.8, slipstreamZone: true },              // banking entry
      { len: 30,  curve:  2.8, slipstreamZone: true },              // 360° BANKED OVAL sweep
      { len: 10,  curve:  2.8, slipstreamZone: true },              // banking exit
      { len: 45,  curve:  0.0, slipstreamZone: true },              // closing blast
      { len: 30,  curve:  3.0 },                                     // Prima Variante R
      { len: 71,  curve:  0.0, item: 'turbo' },                     // chicane straight
      { len: 30,  curve: -3.0 },                                     // Prima Variante L
      { len: 100, curve:  0.0, slipstreamZone: true },              // back straight — slipstream
      { len: 45,  curve:  1.6 },                                     // Seconda Variante R
      { len: 45,  curve: -1.6 },                                     // Seconda Variante L
      { len: 80,  curve:  0.0 },                                     // high-speed straight
      { len: 50,  curve:  1.8 },                                     // Lesmo 1
      { len: 66,  curve:  0.0 },                                     // Lesmo straight
      { len: 50,  curve:  1.8 },                                     // Lesmo 2
      { len: 80,  curve:  0.0 },                                     // Serraglio straight
      { len: 40,  curve: -2.0 },                                     // Ascari L
      { len: 40,  curve:  2.0 },                                     // Ascari R
      { len: 80,  curve:  0.0 },                                     // Parabolica approach
      { len: 35,  curve:  1.8 },                                     // Parabolica banking
    ]
  },

  // ── 2: MOUNTAIN PASS ───────────────────────────────────────────────────
  {
    id: 2,
    name: 'MOUNTAIN PASS',
    subtitle: 'Alpine Danger',
    desc: 'Fog patches • Rock hazards • ±4.5° hairpins',
    skyTop:    '#120820',
    skyBot:    '#3a1a50',
    hillColor: '#4a3a2a',
    bgObjects: 'mountains',
    sections: [
      { len: 80,  curve:  0.0, rockHazard: 'right' },               // summit straight — rocks right
      { len: 25,  curve:  4.5 },                                     // cliff hairpin (sharpest)
      { len: 71,  curve:  0.0, item: 'shield' },                    // cliff straight
      { len: 30,  curve:  0.0, fogZone: true, rockHazard: 'left' }, // FOG PATCH 1 + rocks left
      { len: 28,  curve: -3.6, rockHazard: 'right' },               // hidden fog hairpin + rocks
      { len: 71,  curve:  0.0 },                                     // valley straight
      { len: 30,  curve:  0.0, fogZone: true, rockHazard: 'both' }, // FOG PATCH 2 + rocks both sides
      { len: 10,  curve:  0.0 },                                     // switchback approach
      { len: 20,  curve: -3.5 },                                     // 180° SWITCHBACK
      { len: 10,  curve:  0.0 },                                     // switchback exit
      { len: 30,  curve:  2.8, rockHazard: 'left' },                // sweeping right + rocks left
      { len: 40,  curve:  0.0, rockHazard: 'right' },               // mid-mountain + rocks right
      { len: 32,  curve: -4.5, rockHazard: 'left' },                // SEVERE left + rock
      { len: 66,  curve:  0.0 },                                     // blind apex straight
      { len: 25,  curve:  0.0, fogZone: true, rockHazard: 'both' }, // FOG PATCH 3 + rocks both
      { len: 50,  curve:  0.0, rockHazard: 'both' },                // descending + rocks both sides
      { len: 28,  curve:  2.4, rockHazard: 'left' },                // right sweeper + rocks
      { len: 28,  curve: -2.4 },                                     // left sweeper
      { len: 65,  curve:  0.0, rockHazard: 'right' },               // return summit + rocks right
      { len: 28,  curve: -3.0 },                                     // final left
      { len: 25,  curve:  0.0 },
    ]
  },

  // ── 3: AMAZON CIRCUIT ──────────────────────────────────────────────────
  {
    id: 3,
    name: 'AMAZON CIRCUIT',
    subtitle: 'Jungle Rally',
    desc: 'Mud patches • River crossings • Quad-S chains',
    skyTop:    '#0a1a08',
    skyBot:    '#1a4a14',
    hillColor: '#0a2808',
    bgObjects: 'jungle',
    sections: [
      { len: 60,  curve:  0.0 },                                          // jungle main straight
      { len: 28,  curve:  2.0 },                                          // gentle right
      { len: 28,  curve: -2.0 },                                          // S left
      { len: 28,  curve:  2.0 },                                          // S right — triple-S opening
      { len: 71,  curve:  0.0, item: 'grip', surfaceGrip: 0.72 },        // river-bank straight
      { len: 30,  curve:  0.0, surfaceGrip: 0.55 },                      // MUD PATCH 1
      { len: 40,  curve:  0.0 },                                          // canopy tunnel straight
      { len: 32,  curve: -3.6 },                                          // jungle hairpin left
      { len: 71,  curve:  0.0 },                                          // jungle straight
      { len: 25,  curve:  0.0, surfaceGrip: 0.60 },                      // MUD PATCH 2
      { len: 25,  curve:  2.4 },                                          // vine crossing right
      { len: 25,  curve: -2.4 },                                          // quick left
      { len: 30,  curve:  0.0, surfaceGrip: 0.60, riverCrossing: true, floodBlind: true }, // RIVER CROSSING — flood blind
      { len: 5,   curve:  4.5 },                                          // sharp turn onto island
      { len: 40,  curve:  3.5, floodBlind: true },                        // 360° ISLAND LOOP — flood blind
      { len: 5,   curve: -4.5 },                                          // island exit
      { len: 22,  curve:  1.8 },                                          // S chain 1
      { len: 22,  curve: -1.8, floodBlind: true },                        // S chain 2 — flood blind
      { len: 22,  curve:  1.8 },                                          // S chain 3 — triple-S
      { len: 22,  curve: -1.8 },                                          // S chain 4 — quad-S
      { len: 45,  curve:  0.0 },                                          // finish straight
      { len: 28,  curve: -2.8 },                                          // final hairpin
      { len: 61,  curve:  0.0 },                                          // finish straight
      { len: 22,  curve:  0.0 },
    ]
  },

  // ── 4: SAHARA DESERT ───────────────────────────────────────────────────
  {
    id: 4,
    name: 'SAHARA DESERT',
    subtitle: 'Desert Endurance',
    desc: 'Heat drain • Sandstorm pockets • Longest straights',
    skyTop:    '#1a0a00',
    skyBot:    '#c87020',
    hillColor: '#c8a040',
    bgObjects: 'desert',
    sections: [
      { len: 55,  curve:  0.0, heatZone: true },                      // opening heat blast
      { len: 40,  curve:  0.0, heatZone: true, sandBlind: true },    // SAND BLIND zone 1 — road vanishes
      { len: 55,  curve:  0.0, heatZone: true },                      // closing heat blast
      { len: 32,  curve:  2.2 },                                       // dune sweep right
      { len: 71,  curve:  0.0, item: 'cool' },                        // dune straight
      { len: 32,  curve: -1.8 },                                       // matching left
      { len: 25,  curve:  0.0, heatZone: true },                      // back straight approach
      { len: 8,   curve:  2.8, heatZone: true },                     // dune spiral entry
      { len: 34,  curve:  2.8, heatZone: true, sandBlind: true },    // 360° DUNE SPIRAL — sand blind
      { len: 8,   curve: -2.8, heatZone: true },                     // dune spiral exit
      { len: 25,  curve:  0.0, heatZone: true },                      // exit straight
      { len: 28,  curve:  3.0 },                                       // oasis hairpin right
      { len: 71,  curve:  0.0 },                                       // oasis straight
      { len: 28,  curve: -2.8 },                                       // tight left
      { len: 50,  curve:  0.0, fogZone: true },                       // SANDSTORM POCKET 1
      { len: 25,  curve:  1.8 },                                       // S right
      { len: 25,  curve: -1.8, sandBlind: true },                      // S left — SAND BLIND zone 2
      { len: 40,  curve:  0.0, fogZone: true },                       // SANDSTORM POCKET 2
      { len: 60,  curve:  0.0, heatZone: true },                      // return straight — heat
      { len: 28,  curve: -2.4 },                                       // final corner
      { len: 25,  curve:  0.0 },                                       // finish run
    ]
  },

  // ── 5: GREAT WALL ──────────────────────────────────────────────────────
  {
    id: 5,
    name: 'GREAT WALL',
    subtitle: 'The Dragon Circuit',
    desc: 'Narrow watchtowers • 4.2° turns • Dragon boost • Fireworks',
    skyTop:    '#1a2a3a',
    skyBot:    '#6a9abf',
    hillColor: '#4a5040',
    bgObjects: 'greatwall',
    sections: [
      { len: 80,  curve:  0.0, brickHazard: 'left' },                // wall walkway — bricks left
      { len: 20,  curve:  0.0, roadWidthMult: 0.68 },               // watchtower 1 approach
      { len: 22,  curve:  3.8, roadWidthMult: 0.72 },               // watchtower sharp right
      { len: 71,  curve:  0.0, item: 'shield' },                    // mountain straight
      { len: 20,  curve: -3.8, roadWidthMult: 0.72 },               // watchtower sharp left
      { len: 20,  curve:  0.0, roadWidthMult: 0.68 },               // narrow exit
      { len: 60,  curve:  0.0, brickHazard: 'right' },               // long wall section — bricks right
      { len: 18,  curve:  0.0, roadWidthMult: 0.65 },               // tower 2 approach — NARROWEST
      { len: 20,  curve:  2.8, roadWidthMult: 0.68 },               // corner tower right
      { len: 71,  curve:  0.0, item: 'dragon' },                    // ridge straight — DRAGON ORB
      { len: 20,  curve: -2.8, roadWidthMult: 0.68 },               // corner tower left
      { len: 18,  curve:  0.0, roadWidthMult: 0.65 },               // narrow exit 2
      { len: 50,  curve:  0.0, brickHazard: 'both' },                // descent — bricks both sides
      { len: 28,  curve: -4.2 },                                      // SEVERE left descent
      { len: 66,  curve:  0.0 },                                      // hillside straight
      { len: 28,  curve:  4.2 },                                      // severe right recovery
      { len: 15,  curve:  0.0, brickHazard: 'left' },                // spiral approach — bricks
      { len: 8,   curve: -3.5 },                                      // spiral entry
      { len: 36,  curve: -3.5 },                                      // 360° DRAGON WALL SPIRAL
      { len: 8,   curve:  3.5 },                                      // spiral exit
      { len: 3,   curve:  0.0 },                                      // rejoin
      { len: 25,  curve:  0.0, roadWidthMult: 0.70 },               // last watchtower narrow
      { len: 28,  curve: -2.0 },                                      // gentle left to finish
      { len: 22,  curve:  0.0 },                                      // finish run
    ]
  },
];

// ─────────────────────────────────────────────
//  BUILT ARRAYS  (written by buildTrack)
// ─────────────────────────────────────────────
let segments        = [];
let currentTrackDef = TRACK_DEFS[0];
let minimapPts      = [];
let _itemRespawnMap = [];

function buildTrack(trackIdx) {
  const def = TRACK_DEFS[Math.min(trackIdx, TRACK_DEFS.length - 1)];
  currentTrackDef = def;
  segments = [];

  // ── Expand sections → per-sample raw arrays ──────────────────────────
  const rawCurve         = [];
  const rawItem          = [];
  const rawSurfaceGrip   = [];
  const rawFogZone       = [];
  const rawWidthMult     = [];
  const rawOilSlick      = [];
  const rawHeatZone      = [];
  const rawSlipstream    = [];
  const rawRockHazard    = [];
  const rawRiverCrossing = [];
  const rawForkSection   = [];
  const rawForkEntry     = [];
  const rawForkExit      = [];
  const rawBranchDir     = [];
  const rawSandBlind     = [];
  const rawFloodBlind    = [];
  const rawBrickHazard   = [];

  for (const sec of def.sections) {
    const mid = Math.floor(sec.len / 2);
    for (let i = 0; i < sec.len; i++) {
      rawCurve.push(sec.curve || 0);
      rawItem.push(i === mid ? (sec.item || null) : null);
      rawSurfaceGrip.push(sec.surfaceGrip != null ? sec.surfaceGrip : 1.0);
      rawFogZone.push(!!sec.fogZone);
      rawWidthMult.push(sec.roadWidthMult != null ? sec.roadWidthMult : 1.0);
      rawOilSlick.push(!!sec.oilSlick);
      rawHeatZone.push(!!sec.heatZone);
      rawSlipstream.push(!!sec.slipstreamZone);
      rawRockHazard.push(sec.rockHazard  ? (i % 5 === 2 ? sec.rockHazard  : null) : null);
      rawRiverCrossing.push(!!sec.riverCrossing);
      rawForkSection.push(!!sec.forkSection);
      rawForkEntry.push(!!sec.forkEntry);
      rawForkExit.push(!!sec.forkExit);
      rawBranchDir.push(sec.branchDir || 0);
      rawSandBlind.push(!!sec.sandBlind);
      rawFloodBlind.push(!!sec.floodBlind);
      rawBrickHazard.push(sec.brickHazard ? (i % 6 === 2 ? sec.brickHazard : null) : null);
    }
  }

  // ── Tile raw arrays to TRACK_SEGMENTS ────────────────────────────────
  const len = rawCurve.length;
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const j           = i % len;
    const isRiver     = rawRiverCrossing[j];
    const isFork      = rawForkSection[j];
    const isForkEntry = rawForkEntry[j];
    const isForkExit  = rawForkExit[j];
    const even        = (i & 1) === 0;

    // Road color: fork/fork-transition use a light "merged" color
    // forkSection actual strip colors are handled by renderer directly
    let roadColor;
    if (isRiver)              roadColor = even ? '#4a6890' : '#5a78a0';
    else if (isFork)          roadColor = even ? '#888'    : '#999';   // right strip (renderer draws both)
    else if (isForkEntry || isForkExit) roadColor = even ? '#888' : '#999';
    else                      roadColor = even ? '#888'    : '#999';

    segments.push({
      index:          i,
      curve:          rawCurve[j],
      // Legacy isShortcut removed — forkSection replaces it
      isShortcut:     false,
      item:           rawItem[j],
      surfaceGrip:    rawSurfaceGrip[j],
      fogZone:        rawFogZone[j],
      roadWidthMult:  rawWidthMult[j],
      oilSlick:       rawOilSlick[j],
      heatZone:       rawHeatZone[j],
      slipstreamZone: rawSlipstream[j],
      rockHazard:     rawRockHazard[j],
      riverCrossing:  isRiver,
      forkSection:    isFork,
      forkEntry:      isForkEntry,
      forkExit:       isForkExit,
      branchDir:      rawBranchDir[j],
      sandBlind:      rawSandBlind[j],
      floodBlind:     rawFloodBlind[j],
      brickHazard:    rawBrickHazard[j],
      roadColor,
      grassColor:     even
                        ? (def.hillColor || '#2d7a2d')
                        : (def.hillColor ? def.hillColor + 'cc' : '#39993a'),
      rumbleColor:    even ? '#cc2222' : '#ffffff',
      isFinish:       (i === 0 || i === 1),
    });
  }

  _itemRespawnMap = segments.map(s => s.item);

  // ── Pre-compute minimap path ─────────────────────────────────────────
  minimapPts = [];
  let mpx = 0, mpy = 0, mAngle = -Math.PI / 2;
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    minimapPts.push({ x: mpx, y: mpy });
    mAngle += segments[i].curve * 0.045;
    mpx    += Math.cos(mAngle);
    mpy    += Math.sin(mAngle);
  }

  const xs   = minimapPts.map(p => p.x);
  const ys   = minimapPts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  minimapPts = minimapPts.map(p => ({
    x: (p.x - minX) / span,
    y: (p.y - minY) / span,
  }));

  // Build alternate route segment arrays for this track
  buildAltRoutes(trackIdx);
}

function respawnTrackItems() {
  for (let i = 0; i < segments.length; i++) {
    segments[i].item = _itemRespawnMap[i];
  }
}

// ─────────────────────────────────────────────
//  ALT ROUTES — removed (single-path tracks only)
// ─────────────────────────────────────────────

const ALT_ROUTES_BY_TRACK = {};


// ─────────────────────────────────────────────
//  ALT ROUTE BUILDER
// ─────────────────────────────────────────────
let _altRouteData = [];   // compiled for current track

function buildAltRoutes(trackIdx) {
  _altRouteData = [];
  const defs = ALT_ROUTES_BY_TRACK[trackIdx];
  if (!defs || !defs.length) return;

  for (const ar of defs) {
    const raw = [];
    for (const sec of ar.sections) {
      const mid = Math.floor(sec.len / 2);
      for (let i = 0; i < sec.len; i++) {
        raw.push({
          curve:         sec.curve        ?? 0,
          item:          i === mid ? (sec.item || null) : null,
          surfaceGrip:   sec.surfaceGrip  ?? 1.0,
          fogZone:       !!sec.fogZone,
          roadWidthMult: sec.roadWidthMult ?? 1.0,
          oilSlick:      !!sec.oilSlick,
          heatZone:      !!sec.heatZone,
          riverCrossing: !!sec.riverCrossing,
        });
      }
    }

    const hillColor  = ar.hillColor || '#2d7a2d';
    const builtSegs  = raw.map((r, i) => ({
      index:          i,
      curve:          r.curve,
      item:           r.item,
      surfaceGrip:    r.surfaceGrip,
      fogZone:        r.fogZone,
      roadWidthMult:  r.roadWidthMult,
      oilSlick:       r.oilSlick,
      heatZone:       r.heatZone,
      riverCrossing:  r.riverCrossing,
      isShortcut:     false,
      forkSection:    false,
      forkEntry:      false,
      forkExit:       false,
      roadColor:      r.riverCrossing
                        ? (i % 2 ? '#4a6890' : '#5a78a0')
                        : (i % 2 ? '#888'    : '#999'),
      grassColor:     i % 2
                        ? hillColor
                        : hillColor + 'cc',
      rumbleColor:    i % 2 ? '#cc2222' : '#ffffff',
      isFinish:       false,
    }));

    _altRouteData.push({ ...ar, builtSegments: builtSegs });
  }
}

