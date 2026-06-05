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
  // ── MONACO alt routes ──────────────────────────────────────────────────
  // KEY: every route BEGINS with a sharp curve in the entry direction so
  // the player instantly feels like they've turned off the main road.
  0: [
    {
      name:       'Harbour Wall',
      entryLabel: '→ HARBOUR WALL',
      mainEntryZ: 30,   mainExitZ: 195,
      entryDir:   1, entryX: 0.48,
      hillColor:  '#04090f',
      skyTop: '#020510', skyBot: '#0a1830',   // deep night harbour sky
      sections: [
        { len: 12, curve:  4.8 },             // SHARP RIGHT — you've turned onto the dock
        { len: 35, curve:  0.0 },             // long harbour straight, wide
        { len: 18, curve: -3.0 },             // left bend along harbour wall
        { len: 25, curve:  0.0 },             // dock mid-section
        { len: 18, curve:  3.2 },             // right — pier end corner
        { len: 30, curve:  0.0 },             // back stretch
        { len: 15, curve: -4.0 },             // hard left back toward main
        { len: 20, curve:  0.0 },             // rejoin straight
      ]
    },
    {
      name:       'Casino Tunnel',
      entryLabel: '← CASINO TUNNEL',
      mainEntryZ: 240,  mainExitZ: 400,
      entryDir:   -1, entryX: 0.48,
      hillColor:  '#020208',
      skyTop: '#000005', skyBot: '#050510',   // pitch-black tunnel sky
      sections: [
        { len: 10, curve: -4.5, fogZone: true, roadWidthMult: 0.85 }, // SHARP LEFT — tunnel entrance
        { len: 30, curve: -1.5, fogZone: true, roadWidthMult: 0.82 }, // sweeping left inside
        { len: 20, curve:  2.8, fogZone: true, roadWidthMult: 0.80 }, // right-hander
        { len: 20, curve: -2.8, fogZone: true, roadWidthMult: 0.80 }, // S-left back
        { len: 15, curve:  0.0, fogZone: true, item: 'nitro', roadWidthMult: 0.85 },
        { len: 25, curve:  2.0, fogZone: true },                       // exit curve
        { len: 15, curve: -3.5 },                                      // hard left — back to main
        { len: 15, curve:  0.0 },                                      // rejoin
      ]
    },
    {
      name:       'Rooftop Circuit',
      entryLabel: '→ ROOFTOP',
      mainEntryZ: 510,  mainExitZ: 670,
      entryDir:   1, entryX: 0.48,
      hillColor:  '#060810',
      skyTop: '#0a0518', skyBot: '#1a1030',   // elevated purple city glow
      sections: [
        { len: 10, curve:  4.5 },             // SHARP RIGHT — ramp up to roof
        { len: 25, curve: -1.8 },             // sweeping left across rooftop
        { len: 20, curve:  0.0 },             // rooftop straight — city vista
        { len: 18, curve:  3.5 },             // sharp right — edge of building
        { len: 20, curve:  0.0 },             // straight along parapet
        { len: 18, curve: -3.5 },             // sharp left back
        { len: 25, curve: -1.5 },             // sweeping right descent
        { len: 15, curve:  0.0 },             // rejoin approach
      ]
    },
  ],

  // ── MONZA alt routes ───────────────────────────────────────────────────
  1: [
    {
      name:       'Oval Banking',
      entryLabel: '→ OVAL BANKING',
      mainEntryZ: 155,  mainExitZ: 310,
      entryDir:   1, entryX: 0.48,
      hillColor:  '#1a3a1a',
      skyTop: '#1a3a6a', skyBot: '#4a8ad0',   // bright Monza blue
      sections: [
        { len: 10, curve:  4.2 },             // SHARP RIGHT — onto banked oval
        { len: 60, curve:  1.2 },             // long sustained banking — pure speed
        { len: 10, curve:  0.0, item: 'turbo' },
        { len: 40, curve:  1.0 },             // second banking section
        { len: 15, curve: -4.5 },             // hard left back to chicane
        { len: 15, curve:  0.0 },             // rejoin
      ]
    },
    {
      name:       'Forest Rally',
      entryLabel: '← FOREST RALLY',
      mainEntryZ: 410,  mainExitZ: 575,
      entryDir:   -1, entryX: 0.48,
      hillColor:  '#071410',
      skyTop: '#0a1a08', skyBot: '#103018',   // deep forest canopy sky
      sections: [
        { len: 10, curve: -4.8, surfaceGrip: 0.75 }, // SHARP LEFT — into the forest
        { len: 25, curve: -2.0, surfaceGrip: 0.72 }, // sweeping left through trees
        { len: 20, curve:  2.5, surfaceGrip: 0.72 }, // right — narrow forest road
        { len: 20, curve: -2.5, surfaceGrip: 0.72 }, // left — S-curve
        { len: 25, curve:  0.0, surfaceGrip: 0.70, item: 'nitro' },
        { len: 20, curve:  2.0, surfaceGrip: 0.72 }, // right — final bend
        { len: 15, curve:  4.5 },             // HARD RIGHT — back to main
        { len: 15, curve:  0.0 },
      ]
    },
    {
      name:       'Parabolica Inner',
      entryLabel: '→ INNER ARC',
      mainEntryZ: 695,  mainExitZ: 855,
      entryDir:   1, entryX: 0.48,
      hillColor:  '#1e4a1e',
      skyTop: '#1a3a6a', skyBot: '#4a7ab8',
      sections: [
        { len: 10, curve:  4.0 },             // HARD RIGHT — onto inner arc
        { len: 50, curve:  2.8 },             // sustained Parabolica inner curve
        { len: 20, curve:  0.0, item: 'shield' },
        { len: 30, curve:  2.2 },             // second arc section
        { len: 15, curve: -4.5 },             // hard left back out
        { len: 15, curve:  0.0 },
      ]
    },
  ],

  // ── MOUNTAIN PASS alt routes ───────────────────────────────────────────
  2: [
    {
      name:       'Cliff Ledge',
      entryLabel: '→ CLIFF LEDGE',
      mainEntryZ: 105,  mainExitZ: 250,
      entryDir:   1, entryX: 0.48,
      hillColor:  '#2a1a0a',
      skyTop: '#100510', skyBot: '#281030',   // dramatic purple cliff sky
      sections: [
        { len: 10, curve:  4.5, roadWidthMult: 0.72, fogZone: true }, // SHARP RIGHT — onto ledge
        { len: 30, curve: -2.5, roadWidthMult: 0.68, fogZone: true }, // sweeping left along cliff
        { len: 20, curve:  3.0, roadWidthMult: 0.65, fogZone: true }, // tight right hairpin
        { len: 15, curve:  0.0, roadWidthMult: 0.70, item: 'shield' },
        { len: 25, curve: -2.0, roadWidthMult: 0.72 },                // left — cliff traverse
        { len: 20, curve:  3.5, roadWidthMult: 0.75 },                // right — back toward main
        { len: 15, curve:  0.0 },
      ]
    },
    {
      name:       'Valley Floor',
      entryLabel: '← VALLEY FLOOR',
      mainEntryZ: 310,  mainExitZ: 475,
      entryDir:   -1, entryX: 0.48,
      hillColor:  '#1a3a10',
      skyTop: '#0a1420', skyBot: '#203040',   // valley low-light sky
      sections: [
        { len: 10, curve: -4.5 },             // SHARP LEFT — descend to valley
        { len: 35, curve: -1.5, roadWidthMult: 1.20 }, // sweeping left descent
        { len: 30, curve:  0.0, roadWidthMult: 1.25 }, // wide valley floor straight
        { len: 20, curve:  1.8, roadWidthMult: 1.20, item: 'nitro' },
        { len: 30, curve:  0.0, roadWidthMult: 1.20 }, // back stretch
        { len: 20, curve: -2.0, roadWidthMult: 1.15 }, // curve to exit
        { len: 15, curve:  4.5 },             // HARD RIGHT — climb back to main
        { len: 15, curve:  0.0 },
      ]
    },
    {
      name:       'Summit Ridge',
      entryLabel: '→ SUMMIT RIDGE',
      mainEntryZ: 560,  mainExitZ: 710,
      entryDir:   1, entryX: 0.48,
      hillColor:  '#3a3828',
      skyTop: '#0a0618', skyBot: '#1a1228',   // high-altitude night
      sections: [
        { len: 10, curve:  4.2, oilSlick: true },      // SHARP RIGHT — up to ridge
        { len: 25, curve:  2.0, oilSlick: true },      // sweeping right along ridge
        { len: 20, curve: -3.0 },                       // left — ridge corner
        { len: 25, curve:  0.0, item: 'cool' },         // exposed straight
        { len: 20, curve:  2.8, oilSlick: true },       // right — back edge
        { len: 20, curve: -2.5 },                       // left — descent starts
        { len: 15, curve: -4.0 },                       // HARD LEFT — back to main
        { len: 15, curve:  0.0 },
      ]
    },
  ],

  // ── AMAZON CIRCUIT alt routes ──────────────────────────────────────────
  3: [
    {
      name:       'River Crossing',
      entryLabel: '← RIVER FORD',
      mainEntryZ: 95,   mainExitZ: 230,
      entryDir:   -1, entryX: 0.48,
      hillColor:  '#082818',
      skyTop: '#061018', skyBot: '#0a2030',   // riverside dusk
      sections: [
        { len: 10, curve: -4.5, riverCrossing: true, surfaceGrip: 0.58 }, // SHARP LEFT — into river
        { len: 30, curve: -1.5, riverCrossing: true, surfaceGrip: 0.55 }, // sweeping left crossing
        { len: 20, curve:  2.5, riverCrossing: true, surfaceGrip: 0.55 }, // right S-curve in water
        { len: 20, curve: -2.5, riverCrossing: true, surfaceGrip: 0.55 },
        { len: 15, curve:  0.0, item: 'grip', surfaceGrip: 0.62 },
        { len: 25, curve:  1.5, surfaceGrip: 0.68 },                      // riverbank exit
        { len: 15, curve:  4.2 },                                          // HARD RIGHT — back to main
        { len: 15, curve:  0.0 },
      ]
    },
    {
      name:       'Canopy Climb',
      entryLabel: '→ CANOPY PATH',
      mainEntryZ: 290,  mainExitZ: 450,
      entryDir:   1, entryX: 0.48,
      hillColor:  '#051008',
      skyTop: '#040808', skyBot: '#0a1410',   // dense canopy — almost no sky
      sections: [
        { len: 10, curve:  4.5, fogZone: true },       // SHARP RIGHT — up into canopy
        { len: 25, curve:  2.0, fogZone: true },       // sweeping right — elevated path
        { len: 20, curve: -3.0, fogZone: true },       // sharp left through branches
        { len: 20, curve:  2.5, fogZone: true },       // right — canopy traverse
        { len: 15, curve:  0.0, fogZone: true, item: 'nitro' },
        { len: 25, curve: -2.5, fogZone: true },       // left curve — canopy descent
        { len: 20, curve: -2.0 },                       // descend back toward main
        { len: 15, curve: -4.5 },                       // SHARP LEFT — back to main
        { len: 15, curve:  0.0 },
      ]
    },
    {
      name:       'Cave Passage',
      entryLabel: '← CAVE PASSAGE',
      mainEntryZ: 550,  mainExitZ: 690,
      entryDir:   -1, entryX: 0.48,
      hillColor:  '#020504',
      skyTop: '#010203', skyBot: '#030608',   // cave black
      sections: [
        { len: 10, curve: -4.5, fogZone: true, roadWidthMult: 0.85 }, // SHARP LEFT — cave mouth
        { len: 25, curve: -2.2, fogZone: true, roadWidthMult: 0.80 }, // left through cave
        { len: 20, curve:  3.0, fogZone: true, roadWidthMult: 0.78 }, // right — cave bend
        { len: 15, curve:  0.0, fogZone: true, item: 'shield', roadWidthMult: 0.82 },
        { len: 25, curve: -2.5, fogZone: true, roadWidthMult: 0.80 }, // left — cave exit approach
        { len: 15, curve:  4.5 },                                      // HARD RIGHT — exit cave
        { len: 15, curve:  0.0 },
      ]
    },
  ],

  // ── SAHARA DESERT alt routes ───────────────────────────────────────────
  4: [
    {
      name:       'Dune Rally',
      entryLabel: '→ DUNE RALLY',
      mainEntryZ: 165,  mainExitZ: 320,
      entryDir:   1, entryX: 0.48,
      hillColor:  '#b89030',
      skyTop: '#200a00', skyBot: '#d06010',   // intense orange desert sunset
      sections: [
        { len: 10, curve:  4.2, surfaceGrip: 0.72, heatZone: true }, // SHARP RIGHT — into dunes
        { len: 30, curve:  1.8, surfaceGrip: 0.70, heatZone: true }, // sweeping right dune crest
        { len: 25, curve: -2.5, surfaceGrip: 0.70 },                  // sharp left dune valley
        { len: 25, curve:  2.0, surfaceGrip: 0.72, heatZone: true }, // right crest again
        { len: 15, curve:  0.0, surfaceGrip: 0.72, item: 'cool' },
        { len: 25, curve: -1.5, surfaceGrip: 0.74 },                  // left — return curve
        { len: 15, curve: -4.0 },                                      // HARD LEFT — back to road
        { len: 15, curve:  0.0 },
      ]
    },
    {
      name:       'Ancient Ruins',
      entryLabel: '← ANCIENT RUINS',
      mainEntryZ: 390,  mainExitZ: 530,
      entryDir:   -1, entryX: 0.48,
      hillColor:  '#503a18',
      skyTop: '#180a00', skyBot: '#503010',   // ancient dusty sunset
      sections: [
        { len: 10, curve: -4.5, roadWidthMult: 0.85 }, // SHARP LEFT — into ruins entrance
        { len: 20, curve: -2.5, roadWidthMult: 0.82 }, // sweeping left through pillars
        { len: 18, curve:  3.8, roadWidthMult: 0.80 }, // sharp right — ruins corner
        { len: 20, curve:  0.0, roadWidthMult: 0.82 }, // ruins corridor
        { len: 18, curve: -3.5, roadWidthMult: 0.80, item: 'nitro' }, // sharp left — inner court
        { len: 20, curve:  2.8, roadWidthMult: 0.82 }, // right — exit arch
        { len: 15, curve:  4.2 },                       // HARD RIGHT — back to desert road
        { len: 15, curve:  0.0 },
      ]
    },
    {
      name:       'Oasis Circuit',
      entryLabel: '→ OASIS',
      mainEntryZ: 610,  mainExitZ: 745,
      entryDir:   1, entryX: 0.48,
      hillColor:  '#104a20',
      skyTop: '#082010', skyBot: '#204a30',   // cool green oasis sky
      sections: [
        { len: 10, curve:  4.0 },             // SHARP RIGHT — turn into oasis
        { len: 25, curve: -2.0 },             // sweeping left around oasis lake
        { len: 20, curve:  0.0 },             // shaded straight — palm trees
        { len: 20, curve:  2.5 },             // right — far end of oasis
        { len: 25, curve: -2.5, item: 'turbo' }, // left — oasis return
        { len: 20, curve:  1.5 },             // gentle right — exit road
        { len: 15, curve: -4.0 },             // HARD LEFT — back to desert
        { len: 15, curve:  0.0 },
      ]
    },
  ],

  // ── GREAT WALL alt routes ──────────────────────────────────────────────
  5: [
    {
      name:       'Below Wall',
      entryLabel: '← BELOW WALL',
      mainEntryZ: 105,  mainExitZ: 250,
      entryDir:   -1, entryX: 0.48,
      hillColor:  '#2a3020',
      skyTop: '#101820', skyBot: '#203040',   // misty mountain base
      sections: [
        { len: 10, curve: -4.5, roadWidthMult: 1.15 }, // SHARP LEFT — drop below wall
        { len: 35, curve: -1.5, roadWidthMult: 1.18 }, // sweeping left along wall base
        { len: 30, curve:  0.0, roadWidthMult: 1.20, item: 'nitro' }, // wide base straight
        { len: 25, curve:  1.8, roadWidthMult: 1.15 }, // right — return curve
        { len: 20, curve:  0.0, roadWidthMult: 1.12 }, // approach back up
        { len: 15, curve:  4.5 },                       // HARD RIGHT — climb back to wall
        { len: 15, curve:  0.0 },
      ]
    },
    {
      name:       'Mountain Village',
      entryLabel: '→ MOUNTAIN VILLAGE',
      mainEntryZ: 330,  mainExitZ: 490,
      entryDir:   1, entryX: 0.48,
      hillColor:  '#381510',
      skyTop: '#100808', skyBot: '#302010',   // warm village lantern glow
      sections: [
        { len: 10, curve:  4.5, roadWidthMult: 0.80 }, // SHARP RIGHT — into village gate
        { len: 20, curve: -2.5, roadWidthMult: 0.76 }, // left — main village street
        { len: 20, curve:  2.0, roadWidthMult: 0.75 }, // right — market alley
        { len: 20, curve:  0.0, roadWidthMult: 0.76 }, // village square straight
        { len: 18, curve: -3.0, roadWidthMult: 0.78, item: 'shield' }, // left — temple road
        { len: 20, curve:  2.5, roadWidthMult: 0.80 }, // right — exit road
        { len: 15, curve: -4.5 },                       // SHARP LEFT — back to main wall
        { len: 15, curve:  0.0 },
      ]
    },
    {
      name:       "Dragon's Back",
      entryLabel: '← DRAGON RIDGE',
      mainEntryZ: 590,  mainExitZ: 745,
      entryDir:   -1, entryX: 0.48,
      hillColor:  '#1a2018',
      skyTop: '#080510', skyBot: '#180f28',   // dramatic ridge purple sky
      sections: [
        { len: 10, curve: -4.8 },             // SHARP LEFT — onto dragon ridge
        { len: 25, curve: -2.5 },             // sweeping left — first spine
        { len: 20, curve:  4.0 },             // hard right — spine peak
        { len: 15, curve:  0.0, item: 'dragon' }, // dragon orb at highest point
        { len: 25, curve: -3.5 },             // sharp left — down the other side
        { len: 20, curve:  3.0 },             // right — second ridge peak
        { len: 20, curve: -2.0 },             // left — descent
        { len: 15, curve:  4.5 },             // HARD RIGHT — back to wall
        { len: 15, curve:  0.0 },
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

