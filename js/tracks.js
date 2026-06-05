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
    desc: 'Hairpins • Oil slicks • Tunnel • Two-path chicanes',
    skyTop:    '#0a1628',
    skyBot:    '#1a3a6a',
    hillColor: '#1a3a1a',
    bgObjects: 'buildings',
    sections: [
      { len: 50,  curve:  0.0 },                                     // harbour straight
      { len: 20,  curve:  3.8 },                                     // Ste Devote right
      { len: 8,   curve:  0.0, forkEntry: true },                    // FORK 1 entry — casino
      { len: 50,  curve:  0.0, forkSection: true, item: 'nitro' },  // FORK 1 body
      { len: 8,   curve:  0.0, forkExit: true },                    // FORK 1 exit
      { len: 18,  curve: -2.2 },                                     // Massenet left
      { len: 22,  curve:  4.2 },                                     // Casino square right
      { len: 20,  curve:  0.0, oilSlick: true },                    // oil patch — Casino exit
      { len: 18,  curve: -3.4 },                                     // Mirabeau left
      { len: 8,   curve:  0.0, forkEntry: true },                    // FORK 2 entry — loews
      { len: 50,  curve:  0.0, forkSection: true },                 // FORK 2 body
      { len: 8,   curve:  0.0, forkExit: true },                    // FORK 2 exit
      { len: 25,  curve:  4.0 },                                     // Grand Hotel hairpin
      { len: 30,  curve:  0.0 },                                     // tunnel entrance
      { len: 40,  curve:  0.8, fogZone: true, roadWidthMult: 0.82 }, // TUNNEL — narrow + dark
      { len: 30,  curve:  0.0 },                                     // tunnel exit
      { len: 28,  curve: -3.2 },                                     // Nouvelle chicane L
      { len: 28,  curve:  3.2 },                                     // Nouvelle chicane R
      { len: 55,  curve:  0.0 },                                     // Tabac straight
      { len: 25,  curve: -2.8 },                                     // Swimming Pool L
      { len: 25,  curve:  2.8 },                                     // Swimming Pool R
      { len: 60,  curve:  0.0 },                                     // final straight
      { len: 25,  curve: -3.0 },                                     // Rascasse
      { len: 30,  curve:  0.0 },                                     // finish run
    ]
  },

  // ── 1: MONZA ───────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'MONZA',
    subtitle: 'Temple of Speed',
    desc: 'Slipstream wars • Chicane forks • Longest straights',
    skyTop:    '#1a3a6a',
    skyBot:    '#4a7ab8',
    hillColor: '#2a5a2a',
    bgObjects: 'forest',
    sections: [
      { len: 150, curve:  0.0, slipstreamZone: true },              // main straight — slipstream
      { len: 30,  curve:  3.0 },                                     // Prima Variante R
      { len: 8,   curve:  0.0, forkEntry: true },                    // FORK 1 entry — chicane bypass
      { len: 55,  curve:  0.0, forkSection: true, item: 'turbo' }, // FORK 1 body
      { len: 8,   curve:  0.0, forkExit: true },                    // FORK 1 exit
      { len: 30,  curve: -3.0 },                                     // Prima Variante L
      { len: 100, curve:  0.0, slipstreamZone: true },              // back straight — slipstream
      { len: 45,  curve:  1.6 },                                     // Seconda Variante R
      { len: 45,  curve: -1.6 },                                     // Seconda Variante L
      { len: 80,  curve:  0.0 },                                     // high-speed straight
      { len: 50,  curve:  1.8 },                                     // Lesmo 1
      { len: 8,   curve:  0.0, forkEntry: true },                    // FORK 2 entry — Lesmo bypass
      { len: 50,  curve:  0.0, forkSection: true },                 // FORK 2 body
      { len: 8,   curve:  0.0, forkExit: true },                    // FORK 2 exit
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
    desc: 'Fog patches • Rock hazards • ±4.5° hairpins • Three fork paths',
    skyTop:    '#120820',
    skyBot:    '#3a1a50',
    hillColor: '#4a3a2a',
    bgObjects: 'mountains',
    sections: [
      { len: 80,  curve:  0.0 },                                     // summit straight
      { len: 25,  curve:  4.5 },                                     // cliff hairpin (sharpest)
      { len: 8,   curve:  0.0, forkEntry: true },                    // FORK 1 entry — cliff bypass
      { len: 55,  curve:  0.0, forkSection: true, item: 'shield' }, // FORK 1 body
      { len: 8,   curve:  0.0, forkExit: true },                    // FORK 1 exit
      { len: 30,  curve:  0.0, fogZone: true },                     // FOG PATCH 1
      { len: 28,  curve: -3.6, rockHazard: 'right' },               // hidden fog hairpin
      { len: 8,   curve:  0.0, forkEntry: true },                    // FORK 2 entry — valley bypass
      { len: 55,  curve:  0.0, forkSection: true },                 // FORK 2 body
      { len: 8,   curve:  0.0, forkExit: true },                    // FORK 2 exit
      { len: 30,  curve:  0.0, fogZone: true },                     // FOG PATCH 2
      { len: 40,  curve:  0.0 },                                     // valley floor straight
      { len: 30,  curve:  2.8 },                                     // sweeping right
      { len: 40,  curve:  0.0 },                                     // mid-mountain straight
      { len: 32,  curve: -4.5, rockHazard: 'left' },                // SEVERE left + rock
      { len: 8,   curve:  0.0, forkEntry: true },                    // FORK 3 entry — blind apex
      { len: 50,  curve:  0.0, forkSection: true },                 // FORK 3 body
      { len: 8,   curve:  0.0, forkExit: true },                    // FORK 3 exit
      { len: 25,  curve:  0.0, fogZone: true },                     // FOG PATCH 3
      { len: 50,  curve:  0.0 },                                     // descending straight
      { len: 28,  curve:  2.4 },                                     // right sweeper
      { len: 28,  curve: -2.4 },                                     // left sweeper
      { len: 65,  curve:  0.0 },                                     // return summit straight
      { len: 28,  curve: -3.0 },                                     // final left
      { len: 25,  curve:  0.0 },
    ]
  },

  // ── 3: AMAZON CIRCUIT ──────────────────────────────────────────────────
  {
    id: 3,
    name: 'AMAZON CIRCUIT',
    subtitle: 'Jungle Rally',
    desc: 'Mud patches • River crossings • Three fork paths • Quad-S chains',
    skyTop:    '#0a1a08',
    skyBot:    '#1a4a14',
    hillColor: '#0a2808',
    bgObjects: 'jungle',
    sections: [
      { len: 60,  curve:  0.0 },                                          // jungle main straight
      { len: 28,  curve:  2.0 },                                          // gentle right
      { len: 28,  curve: -2.0 },                                          // S left
      { len: 28,  curve:  2.0 },                                          // S right — triple-S opening
      { len: 8,   curve:  0.0, forkEntry: true },                         // FORK 1 entry — river bank
      { len: 55,  curve:  0.0, forkSection: true, item: 'grip',
        surfaceGrip: 0.72 },                                              // FORK 1: left=river(slippery)
      { len: 8,   curve:  0.0, forkExit: true },                         // FORK 1 exit
      { len: 30,  curve:  0.0, surfaceGrip: 0.55 },                      // MUD PATCH 1
      { len: 40,  curve:  0.0 },                                          // canopy tunnel straight
      { len: 32,  curve: -3.6 },                                          // jungle hairpin left
      { len: 8,   curve:  0.0, forkEntry: true },                         // FORK 2 entry — jungle bypass
      { len: 55,  curve:  0.0, forkSection: true },                      // FORK 2 body
      { len: 8,   curve:  0.0, forkExit: true },                         // FORK 2 exit
      { len: 25,  curve:  0.0, surfaceGrip: 0.60 },                      // MUD PATCH 2
      { len: 25,  curve:  2.4 },                                          // vine crossing right
      { len: 25,  curve: -2.4 },                                          // quick left
      { len: 30,  curve:  0.0, surfaceGrip: 0.60, riverCrossing: true }, // RIVER CROSSING
      { len: 50,  curve:  0.0 },                                          // river-bank back straight
      { len: 22,  curve:  1.8 },                                          // S chain 1
      { len: 22,  curve: -1.8 },                                          // S chain 2
      { len: 22,  curve:  1.8 },                                          // S chain 3 — triple-S
      { len: 22,  curve: -1.8 },                                          // S chain 4 — quad-S
      { len: 45,  curve:  0.0 },                                          // finish straight
      { len: 28,  curve: -2.8 },                                          // final hairpin
      { len: 8,   curve:  0.0, forkEntry: true },                         // FORK 3 entry — finish bypass
      { len: 45,  curve:  0.0, forkSection: true },                      // FORK 3 body
      { len: 8,   curve:  0.0, forkExit: true },                         // FORK 3 exit
      { len: 22,  curve:  0.0 },
    ]
  },

  // ── 4: SAHARA DESERT ───────────────────────────────────────────────────
  {
    id: 4,
    name: 'SAHARA DESERT',
    subtitle: 'Desert Endurance',
    desc: 'Heat drain • Sandstorm pockets • Longest straights • Fork shortcuts',
    skyTop:    '#1a0a00',
    skyBot:    '#c87020',
    hillColor: '#c8a040',
    bgObjects: 'desert',
    sections: [
      { len: 150, curve:  0.0, heatZone: true },                      // LONGEST straight — heat
      { len: 32,  curve:  2.2 },                                       // dune sweep right
      { len: 8,   curve:  0.0, forkEntry: true },                      // FORK 1 entry — dune bypass
      { len: 55,  curve:  0.0, forkSection: true, item: 'cool' },    // FORK 1 body
      { len: 8,   curve:  0.0, forkExit: true },                      // FORK 1 exit
      { len: 32,  curve: -1.8 },                                       // matching left
      { len: 100, curve:  0.0, heatZone: true },                      // back straight — heat zone
      { len: 28,  curve:  3.0 },                                       // oasis hairpin right
      { len: 8,   curve:  0.0, forkEntry: true },                      // FORK 2 entry — oasis bypass
      { len: 55,  curve:  0.0, forkSection: true },                   // FORK 2 body
      { len: 8,   curve:  0.0, forkExit: true },                      // FORK 2 exit
      { len: 28,  curve: -2.8 },                                       // tight left
      { len: 50,  curve:  0.0, fogZone: true },                       // SANDSTORM POCKET 1
      { len: 25,  curve:  1.8 },                                       // S right
      { len: 25,  curve: -1.8 },                                       // S left
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
    desc: 'Narrow watchtowers • 4.2° turns • Three fork paths • Dragon boost • Fireworks',
    skyTop:    '#1a2a3a',
    skyBot:    '#6a9abf',
    hillColor: '#4a5040',
    bgObjects: 'greatwall',
    sections: [
      { len: 80,  curve:  0.0 },                                      // wall walkway straight
      { len: 20,  curve:  0.0, roadWidthMult: 0.68 },               // watchtower 1 approach
      { len: 22,  curve:  3.8, roadWidthMult: 0.72 },               // watchtower sharp right
      { len: 8,   curve:  0.0, forkEntry: true },                    // FORK 1 entry — mountain bypass
      { len: 55,  curve:  0.0, forkSection: true, item: 'shield' }, // FORK 1 body
      { len: 8,   curve:  0.0, forkExit: true },                    // FORK 1 exit
      { len: 20,  curve: -3.8, roadWidthMult: 0.72 },               // watchtower sharp left
      { len: 20,  curve:  0.0, roadWidthMult: 0.68 },               // narrow exit
      { len: 60,  curve:  0.0 },                                      // long wall section
      { len: 18,  curve:  0.0, roadWidthMult: 0.65 },               // tower 2 approach — NARROWEST
      { len: 20,  curve:  2.8, roadWidthMult: 0.68 },               // corner tower right
      { len: 8,   curve:  0.0, forkEntry: true },                    // FORK 2 entry — ridge bypass
      { len: 55,  curve:  0.0, forkSection: true, item: 'dragon' }, // FORK 2 body — DRAGON ORB
      { len: 8,   curve:  0.0, forkExit: true },                    // FORK 2 exit
      { len: 20,  curve: -2.8, roadWidthMult: 0.68 },               // corner tower left
      { len: 18,  curve:  0.0, roadWidthMult: 0.65 },               // narrow exit 2
      { len: 50,  curve:  0.0 },                                      // descent section
      { len: 28,  curve: -4.2 },                                      // SEVERE left descent
      { len: 8,   curve:  0.0, forkEntry: true },                    // FORK 3 entry — hillside
      { len: 50,  curve:  0.0, forkSection: true },                 // FORK 3 body
      { len: 8,   curve:  0.0, forkExit: true },                    // FORK 3 exit
      { len: 28,  curve:  4.2 },                                      // severe right recovery
      { len: 70,  curve:  0.0 },                                      // final wall straight
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
      rawRockHazard.push(i === mid ? (sec.rockHazard || null) : null);
      rawRiverCrossing.push(!!sec.riverCrossing);
      rawForkSection.push(!!sec.forkSection);
      rawForkEntry.push(!!sec.forkEntry);
      rawForkExit.push(!!sec.forkExit);
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
//  ALT ROUTE DEFINITIONS  (2–3 per track)
//  Each altRoute has its own sections[] that build a completely separate
//  road segment array. Player enters by steering hard toward entryDir side
//  at mainEntryZ, drives through, rejoins main at mainExitZ.
// ─────────────────────────────────────────────

const ALT_ROUTES_BY_TRACK = {
  // ── MONACO alt routes ──────────────────────────────────────────────
  0: [
    {
      name:       'Harbour Wall',
      entryLabel: '→ HARBOUR WALL',
      mainEntryZ: 30,
      mainExitZ:  185,
      entryDir:   1,      // steer RIGHT
      entryX:     0.58,
      hillColor:  '#080d18',
      sections: [
        { len: 40, curve:  0.0 },           // dock straight — wide, fast
        { len: 25, curve:  3.0 },           // tight right-hander at dock end
        { len: 30, curve:  0.0 },           // harbourfront flat
        { len: 20, curve: -1.8 },           // gentle left back to main
        { len: 35, curve:  0.0 },           // final approach
      ]
    },
    {
      name:       'Casino Tunnel',
      entryLabel: '← CASINO TUNNEL',
      mainEntryZ: 240,
      mainExitZ:  385,
      entryDir:   -1,     // steer LEFT
      entryX:     0.58,
      hillColor:  '#050810',
      sections: [
        { len: 15, curve:  0.0, fogZone: true, roadWidthMult: 0.82 }, // tunnel entrance
        { len: 30, curve: -2.5, fogZone: true, roadWidthMult: 0.80 }, // left-hander inside
        { len: 20, curve:  2.5, fogZone: true, roadWidthMult: 0.80 }, // right-hander
        { len: 15, curve:  0.0, item: 'nitro', fogZone: true },       // nitro pickup
        { len: 30, curve: -1.5, fogZone: true },                      // exit S-curve
        { len: 15, curve:  0.0 },                                     // rejoin approach
      ]
    },
    {
      name:       'Rooftop Route',
      entryLabel: '→ ROOFTOP',
      mainEntryZ: 510,
      mainExitZ:  650,
      entryDir:   1,
      entryX:     0.55,
      hillColor:  '#0a0f1a',
      sections: [
        { len: 35, curve:  0.0 },           // rooftop straight — wide vista
        { len: 22, curve:  3.5 },           // sharp right — edge of building
        { len: 20, curve:  0.0 },           // brief straight
        { len: 22, curve: -3.5 },           // sharp left back
        { len: 35, curve:  0.0 },           // descent to main
      ]
    },
  ],

  // ── MONZA alt routes ───────────────────────────────────────────────
  1: [
    {
      name:       'Banking Bypass',
      entryLabel: '→ BANKING BYPASS',
      mainEntryZ: 155,
      mainExitZ:  295,
      entryDir:   1,
      entryX:     0.55,
      hillColor:  '#2a5a2a',
      sections: [
        { len: 100, curve:  0.8 },          // long banked oval section — pure speed
        { len: 25,  curve:  0.0, item: 'turbo' }, // turbo pickup
        { len: 15,  curve: -1.2 },          // merge back toward main
      ]
    },
    {
      name:       'Forest Path',
      entryLabel: '← FOREST PATH',
      mainEntryZ: 410,
      mainExitZ:  565,
      entryDir:   -1,
      entryX:     0.55,
      hillColor:  '#0a2010',
      sections: [
        { len: 25, curve: -1.5, surfaceGrip: 0.72 }, // into forest, loose surface
        { len: 20, curve:  1.8, surfaceGrip: 0.72 }, // S-curve through trees
        { len: 20, curve: -1.8, surfaceGrip: 0.72 },
        { len: 25, curve:  0.0, surfaceGrip: 0.70, item: 'nitro' }, // forest straight
        { len: 20, curve:  1.5, surfaceGrip: 0.72 }, // exit curves
        { len: 20, curve:  0.0, surfaceGrip: 0.75 }, // rejoin
      ]
    },
    {
      name:       'Parabolica Inner',
      entryLabel: '→ PARABOLICA INNER',
      mainEntryZ: 695,
      mainExitZ:  840,
      entryDir:   1,
      entryX:     0.52,
      hillColor:  '#2a5a2a',
      sections: [
        { len: 40, curve:  1.0 },           // wide arc approach
        { len: 35, curve:  3.2 },           // Parabolica inner — tight banking
        { len: 35, curve:  0.0, item: 'shield' }, // exit straight + shield
        { len: 20, curve: -1.0 },           // merge back
      ]
    },
  ],

  // ── MOUNTAIN PASS alt routes ───────────────────────────────────────
  2: [
    {
      name:       'Cliff Ledge',
      entryLabel: '→ CLIFF LEDGE',
      mainEntryZ: 105,
      mainExitZ:  235,
      entryDir:   1,
      entryX:     0.55,
      hillColor:  '#3a2a1a',
      sections: [
        { len: 20, curve:  0.0, roadWidthMult: 0.68, fogZone: true }, // narrow ledge approach
        { len: 30, curve:  3.0, roadWidthMult: 0.65, fogZone: true }, // hairpin on cliff
        { len: 20, curve:  0.0, roadWidthMult: 0.68, item: 'shield' },
        { len: 25, curve: -1.8, roadWidthMult: 0.72 }, // wind back
        { len: 20, curve:  0.0 },                      // rejoin
      ]
    },
    {
      name:       'Valley Floor',
      entryLabel: '← VALLEY FLOOR',
      mainEntryZ: 310,
      mainExitZ:  460,
      entryDir:   -1,
      entryX:     0.55,
      hillColor:  '#2a4a1a',
      sections: [
        { len: 40, curve:  0.0, roadWidthMult: 1.20 }, // wide valley road
        { len: 25, curve:  1.5, roadWidthMult: 1.15 }, // gentle right
        { len: 40, curve:  0.0, roadWidthMult: 1.20, item: 'nitro' }, // valley straight
        { len: 25, curve: -1.5, roadWidthMult: 1.15 }, // gentle left
        { len: 20, curve:  0.0 },                      // climb back to main
      ]
    },
    {
      name:       'Summit Ridge',
      entryLabel: '→ SUMMIT RIDGE',
      mainEntryZ: 560,
      mainExitZ:  695,
      entryDir:   1,
      entryX:     0.52,
      hillColor:  '#4a4a3a',
      sections: [
        { len: 30, curve:  0.0, oilSlick: true },      // exposed windy ridge
        { len: 25, curve:  2.8 },                       // hard right — ridge edge
        { len: 25, curve: -2.8, oilSlick: true },       // hard left
        { len: 20, curve:  0.0, item: 'cool' },         // summit straight
        { len: 25, curve:  1.2 },                       // descend to main
      ]
    },
  ],

  // ── AMAZON CIRCUIT alt routes ──────────────────────────────────────
  3: [
    {
      name:       'River Ford',
      entryLabel: '← RIVER FORD',
      mainEntryZ: 95,
      mainExitZ:  215,
      entryDir:   -1,
      entryX:     0.55,
      hillColor:  '#0a1a20',
      sections: [
        { len: 30, curve:  0.0, riverCrossing: true, surfaceGrip: 0.55 }, // wide slippery river
        { len: 20, curve:  1.2, riverCrossing: true, surfaceGrip: 0.58 }, // river bend
        { len: 20, curve: -1.2, riverCrossing: true, surfaceGrip: 0.58 }, // S-bend
        { len: 25, curve:  0.0, item: 'grip', surfaceGrip: 0.62 },        // mid-river pickup
        { len: 20, curve:  0.0 },                                          // river bank exit
      ]
    },
    {
      name:       'Canopy Path',
      entryLabel: '→ CANOPY PATH',
      mainEntryZ: 290,
      mainExitZ:  435,
      entryDir:   1,
      entryX:     0.55,
      hillColor:  '#0a1a08',
      sections: [
        { len: 25, curve:  0.0, fogZone: true },        // enter canopy — dark
        { len: 20, curve: -2.2, fogZone: true },        // left through branches
        { len: 20, curve:  2.2, fogZone: true },        // right
        { len: 25, curve:  0.0, fogZone: true, item: 'nitro' }, // canopy straight
        { len: 20, curve: -1.8, fogZone: true },
        { len: 25, curve:  0.0 },                       // exit canopy
      ]
    },
    {
      name:       'Cave Passage',
      entryLabel: '← CAVE PASSAGE',
      mainEntryZ: 550,
      mainExitZ:  670,
      entryDir:   -1,
      entryX:     0.52,
      hillColor:  '#050805',
      sections: [
        { len: 15, curve:  0.0, fogZone: true, roadWidthMult: 0.82 }, // cave entrance
        { len: 25, curve: -2.0, fogZone: true, roadWidthMult: 0.80 }, // left tunnel
        { len: 25, curve:  2.0, fogZone: true, roadWidthMult: 0.80 }, // right tunnel
        { len: 15, curve:  0.0, fogZone: true, item: 'shield', roadWidthMult: 0.85 },
        { len: 20, curve:  0.0, fogZone: true },        // cave straight
        { len: 15, curve:  0.0 },                       // exit into jungle
      ]
    },
  ],

  // ── SAHARA DESERT alt routes ───────────────────────────────────────
  4: [
    {
      name:       'Dune Run',
      entryLabel: '→ DUNE RUN',
      mainEntryZ: 165,
      mainExitZ:  305,
      entryDir:   1,
      entryX:     0.55,
      hillColor:  '#d4a840',
      sections: [
        { len: 40, curve:  0.0, surfaceGrip: 0.72, heatZone: true }, // open dunes
        { len: 25, curve:  1.5, surfaceGrip: 0.70 },                  // dune crest
        { len: 25, curve: -1.5, surfaceGrip: 0.70 },                  // dune valley
        { len: 30, curve:  0.0, surfaceGrip: 0.72, item: 'cool' },    // cool pickup
        { len: 20, curve:  1.0 },                                      // rejoin approach
      ]
    },
    {
      name:       'Ancient Ruins',
      entryLabel: '← ANCIENT RUINS',
      mainEntryZ: 390,
      mainExitZ:  510,
      entryDir:   -1,
      entryX:     0.55,
      hillColor:  '#6a5030',
      sections: [
        { len: 15, curve:  3.5, roadWidthMult: 0.82 }, // sharp entry into ruins
        { len: 20, curve:  0.0, roadWidthMult: 0.80 }, // ruins corridor
        { len: 15, curve: -3.5, roadWidthMult: 0.82 }, // sharp left
        { len: 20, curve:  0.0, roadWidthMult: 0.80, item: 'nitro' }, // ruins straight
        { len: 15, curve:  2.5, roadWidthMult: 0.85 }, // right hairpin
        { len: 15, curve:  0.0 },                      // exit ruins
      ]
    },
    {
      name:       'Oasis Track',
      entryLabel: '→ OASIS',
      mainEntryZ: 610,
      mainExitZ:  730,
      entryDir:   1,
      entryX:     0.52,
      hillColor:  '#1a4a20',
      sections: [
        { len: 30, curve:  0.0 },           // palm-lined approach
        { len: 25, curve:  1.8 },           // oasis right-hander
        { len: 25, curve: -1.8 },           // matching left
        { len: 30, curve:  0.0, item: 'turbo' }, // oasis flat + turbo
        { len: 15, curve: -1.2 },           // exit back to desert
      ]
    },
  ],

  // ── GREAT WALL alt routes ──────────────────────────────────────────
  5: [
    {
      name:       'Below Wall',
      entryLabel: '← BELOW WALL',
      mainEntryZ: 105,
      mainExitZ:  230,
      entryDir:   -1,
      entryX:     0.55,
      hillColor:  '#3a4030',
      sections: [
        { len: 50, curve:  0.0, roadWidthMult: 1.15 }, // wide base-of-wall path
        { len: 20, curve:  1.2, roadWidthMult: 1.10 }, // gentle right
        { len: 30, curve:  0.0, item: 'nitro', roadWidthMult: 1.15 }, // long straight
        { len: 20, curve: -1.2 },                      // merge back
      ]
    },
    {
      name:       'Mountain Village',
      entryLabel: '→ MOUNTAIN VILLAGE',
      mainEntryZ: 330,
      mainExitZ:  475,
      entryDir:   1,
      entryX:     0.55,
      hillColor:  '#4a2010',
      sections: [
        { len: 20, curve:  2.0, roadWidthMult: 0.78 }, // village entrance right
        { len: 25, curve:  0.0, roadWidthMult: 0.76 }, // village street
        { len: 20, curve: -2.0, roadWidthMult: 0.78 }, // left through market
        { len: 20, curve:  0.0, item: 'shield', roadWidthMult: 0.80 },
        { len: 20, curve:  1.8, roadWidthMult: 0.82 }, // right at temple
        { len: 20, curve:  0.0 },                      // exit village
      ]
    },
    {
      name:       "Dragon's Back Ridge",
      entryLabel: '← DRAGON RIDGE',
      mainEntryZ: 590,
      mainExitZ:  730,
      entryDir:   -1,
      entryX:     0.52,
      hillColor:  '#2a3020',
      sections: [
        { len: 25, curve:  0.0 },           // ridge approach
        { len: 25, curve:  4.0 },           // sharp right — exposed edge
        { len: 20, curve:  0.0, item: 'dragon' }, // dragon orb at exposed peak
        { len: 25, curve: -4.0 },           // sharp left — other side
        { len: 25, curve:  0.0 },           // ridge descent back
      ]
    },
  ],
};

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

