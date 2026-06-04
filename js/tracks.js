// ─────────────────────────────────────────────
//  TRACK DEFINITIONS + BUILDER
// ─────────────────────────────────────────────

// Section props: { len, curve, shortcut?, item?, surfaceGrip?, fogZone?,
//                  roadWidthMult?, oilSlick?, heatZone?, slipstreamZone?,
//                  rockHazard?, riverCrossing? }
const TRACK_DEFS = [
  // ── 0: MONACO ──────────────────────────────────────────────────────────
  {
    id: 0,
    name: 'MONACO',
    subtitle: 'Night Glamour Circuit',
    desc: 'Hairpins • Oil slicks • Monaco tunnel • City chicanes',
    skyTop:    '#0a1628',
    skyBot:    '#1a3a6a',
    hillColor: '#1a3a1a',
    bgObjects: 'buildings',
    sections: [
      { len: 50,  curve:  0.0 },                                    // harbour front straight
      { len: 20,  curve:  3.8 },                                    // Ste Devote right
      { len: 38,  curve:  0.0, shortcut: true, item: 'nitro' },    // casino bypass (alt route + nitro)
      { len: 18,  curve: -2.2 },                                    // Massenet left
      { len: 22,  curve:  4.2 },                                    // Casino square right (tightest)
      { len: 20,  curve:  0.0, oilSlick: true },                   // oil patch — Casino exit
      { len: 18,  curve: -3.4 },                                    // Mirabeau left
      { len: 30,  curve:  0.0, shortcut: true },                   // Loews inside cut (alt route)
      { len: 25,  curve:  4.0 },                                    // Grand Hotel hairpin
      { len: 30,  curve:  0.0 },                                    // tunnel entrance straight
      { len: 40,  curve:  0.8, fogZone: true, roadWidthMult: 0.82 }, // TUNNEL — narrow + dark
      { len: 30,  curve:  0.0 },                                    // tunnel exit
      { len: 28,  curve: -3.2 },                                    // Nouvelle chicane L
      { len: 28,  curve:  3.2 },                                    // Nouvelle chicane R
      { len: 55,  curve:  0.0 },                                    // Tabac straight
      { len: 25,  curve: -2.8 },                                    // Swimming Pool L
      { len: 25,  curve:  2.8 },                                    // Swimming Pool R
      { len: 60,  curve:  0.0 },                                    // final straight
      { len: 25,  curve: -3.0 },                                    // Rascasse
      { len: 30,  curve:  0.0 },                                    // finish run
    ]
  },

  // ── 1: MONZA ───────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'MONZA',
    subtitle: 'Temple of Speed',
    desc: 'Slipstream wars • Longest straights • Turbo chicane bypass',
    skyTop:    '#1a3a6a',
    skyBot:    '#4a7ab8',
    hillColor: '#2a5a2a',
    bgObjects: 'forest',
    sections: [
      { len: 150, curve:  0.0, slipstreamZone: true },             // main straight — slipstream
      { len: 30,  curve:  3.0 },                                    // Prima Variante R (sharper)
      { len: 35,  curve:  0.0, shortcut: true, item: 'turbo' },   // chicane bypass + turbo orb
      { len: 30,  curve: -3.0 },                                    // Prima Variante L
      { len: 100, curve:  0.0, slipstreamZone: true },             // back straight — slipstream
      { len: 45,  curve:  1.6 },                                    // Seconda Variante R
      { len: 45,  curve: -1.6 },                                    // Seconda Variante L
      { len: 80,  curve:  0.0 },                                    // high-speed straight
      { len: 50,  curve:  1.8 },                                    // Lesmo 1
      { len: 35,  curve:  0.0, shortcut: true },                   // Lesmo bypass (alt route)
      { len: 50,  curve:  1.8 },                                    // Lesmo 2
      { len: 80,  curve:  0.0 },                                    // Serraglio straight
      { len: 40,  curve: -2.0 },                                    // Ascari chicane L
      { len: 40,  curve:  2.0 },                                    // Ascari chicane R
      { len: 90,  curve:  0.0 },                                    // Parabolica approach
      { len: 35,  curve:  1.8 },                                    // Parabolica banking
    ]
  },

  // ── 2: MOUNTAIN PASS ───────────────────────────────────────────────────
  {
    id: 2,
    name: 'MOUNTAIN PASS',
    subtitle: 'Alpine Danger',
    desc: 'Fog patches • Rock hazards • ±4.5° hairpins • Blind apexes',
    skyTop:    '#120820',
    skyBot:    '#3a1a50',
    hillColor: '#4a3a2a',
    bgObjects: 'mountains',
    sections: [
      { len: 80,  curve:  0.0 },                                    // summit straight
      { len: 25,  curve:  4.5 },                                    // cliff hairpin (sharpest in game)
      { len: 40,  curve:  0.0, shortcut: true, item: 'shield' },  // cliff bypass + shield
      { len: 30,  curve:  0.0, fogZone: true },                    // FOG PATCH 1
      { len: 28,  curve: -3.6, rockHazard: 'right' },              // hidden fog hairpin + rock
      { len: 40,  curve:  0.0, shortcut: true },                   // valley bypass (alt route)
      { len: 30,  curve:  0.0, fogZone: true },                    // FOG PATCH 2
      { len: 40,  curve:  0.0 },                                    // valley floor straight
      { len: 30,  curve:  2.8 },                                    // sweeping right
      { len: 40,  curve:  0.0 },                                    // mid-mountain straight
      { len: 32,  curve: -4.5, rockHazard: 'left' },               // SEVERE left + rock hazard
      { len: 40,  curve:  0.0, shortcut: true },                   // blind apex bypass (alt route)
      { len: 25,  curve:  0.0, fogZone: true },                    // FOG PATCH 3 on descent
      { len: 50,  curve:  0.0 },                                    // descending straight
      { len: 28,  curve:  2.4 },                                    // right sweeper
      { len: 28,  curve: -2.4 },                                    // left sweeper (S-curve)
      { len: 65,  curve:  0.0 },                                    // return summit straight
      { len: 28,  curve: -3.0 },                                    // final left before finish
      { len: 25,  curve:  0.0 },
    ]
  },

  // ── 3: AMAZON CIRCUIT ──────────────────────────────────────────────────
  {
    id: 3,
    name: 'AMAZON CIRCUIT',
    subtitle: 'Jungle Rally',
    desc: 'Mud patches • River crossings • Triple-S chains • Grip pickups',
    skyTop:    '#0a1a08',
    skyBot:    '#1a4a14',
    hillColor: '#0a2808',
    bgObjects: 'jungle',
    sections: [
      { len: 60,  curve:  0.0 },                                       // jungle main straight
      { len: 28,  curve:  2.0 },                                       // gentle right
      { len: 28,  curve: -2.0 },                                       // S left
      { len: 28,  curve:  2.0 },                                       // S right — triple-S opening
      { len: 45,  curve:  0.0, shortcut: true, item: 'grip' },       // river bank bypass + grip
      { len: 30,  curve:  0.0, surfaceGrip: 0.55 },                  // MUD PATCH 1
      { len: 40,  curve:  0.0 },                                       // canopy tunnel straight
      { len: 32,  curve: -3.6 },                                       // jungle hairpin left
      { len: 45,  curve:  0.0, shortcut: true },                      // inside jungle bypass (alt)
      { len: 25,  curve:  0.0, surfaceGrip: 0.60 },                  // MUD PATCH 2
      { len: 25,  curve:  2.4 },                                       // vine crossing right
      { len: 25,  curve: -2.4 },                                       // quick left
      { len: 30,  curve:  0.0, surfaceGrip: 0.60, riverCrossing: true }, // RIVER CROSSING
      { len: 50,  curve:  0.0 },                                       // river-bank back straight
      { len: 22,  curve:  1.8 },                                       // S chain 1
      { len: 22,  curve: -1.8 },                                       // S chain 2
      { len: 22,  curve:  1.8 },                                       // S chain 3 — triple-S
      { len: 22,  curve: -1.8 },                                       // S chain 4 — quad-S
      { len: 45,  curve:  0.0 },                                       // finish straight through canopy
      { len: 28,  curve: -2.8 },                                       // final hairpin left
      { len: 40,  curve:  0.0, shortcut: true },                      // finish bypass (alt route)
      { len: 22,  curve:  0.0 },
    ]
  },

  // ── 4: SAHARA DESERT ───────────────────────────────────────────────────
  {
    id: 4,
    name: 'SAHARA DESERT',
    subtitle: 'Desert Endurance',
    desc: 'Heat drain • Sandstorm pockets • Longest straights • Cooling pickups',
    skyTop:    '#1a0a00',
    skyBot:    '#c87020',
    hillColor: '#c8a040',
    bgObjects: 'desert',
    sections: [
      { len: 150, curve:  0.0, heatZone: true },                     // LONGEST straight — heat builds
      { len: 32,  curve:  2.2 },                                      // dune sweep right
      { len: 40,  curve:  0.0, shortcut: true, item: 'cool' },      // dune bypass + cool pickup
      { len: 32,  curve: -1.8 },                                      // matching left
      { len: 100, curve:  0.0, heatZone: true },                     // back straight — heat zone
      { len: 28,  curve:  3.0 },                                      // oasis hairpin right
      { len: 45,  curve:  0.0, shortcut: true },                     // oasis inner bypass (alt)
      { len: 28,  curve: -2.8 },                                      // tight left
      { len: 50,  curve:  0.0, fogZone: true },                      // SANDSTORM POCKET 1
      { len: 25,  curve:  1.8 },                                      // S right
      { len: 25,  curve: -1.8 },                                      // S left
      { len: 40,  curve:  0.0, fogZone: true },                      // SANDSTORM POCKET 2
      { len: 60,  curve:  0.0, heatZone: true },                     // return straight — heat zone
      { len: 28,  curve: -2.4 },                                      // final corner
      { len: 25,  curve:  0.0 },                                      // finish run
    ]
  },

  // ── 5: GREAT WALL ──────────────────────────────────────────────────────
  {
    id: 5,
    name: 'GREAT WALL',
    subtitle: 'The Dragon Circuit',
    desc: 'Narrow watchtowers • 4.2° turns • Dragon boost • Fireworks finish',
    skyTop:    '#1a2a3a',
    skyBot:    '#6a9abf',
    hillColor: '#4a5040',
    bgObjects: 'greatwall',
    sections: [
      { len: 80,  curve:  0.0 },                                      // wall walkway straight
      { len: 20,  curve:  0.0, roadWidthMult: 0.68 },               // watchtower 1 approach — NARROW
      { len: 22,  curve:  3.8, roadWidthMult: 0.72 },               // watchtower sharp right (narrow)
      { len: 38,  curve:  0.0, shortcut: true, item: 'shield' },   // mountain bypass + shield
      { len: 20,  curve: -3.8, roadWidthMult: 0.72 },               // watchtower sharp left
      { len: 20,  curve:  0.0, roadWidthMult: 0.68 },               // narrow exit
      { len: 60,  curve:  0.0 },                                      // long wall section
      { len: 18,  curve:  0.0, roadWidthMult: 0.65 },               // tower 2 approach — NARROWEST
      { len: 20,  curve:  2.8, roadWidthMult: 0.68 },               // corner tower right
      { len: 38,  curve:  0.0, shortcut: true, item: 'dragon' },   // ridge bypass + DRAGON ORB
      { len: 20,  curve: -2.8, roadWidthMult: 0.68 },               // corner tower left
      { len: 18,  curve:  0.0, roadWidthMult: 0.65 },               // narrow exit 2
      { len: 50,  curve:  0.0 },                                      // descent section
      { len: 28,  curve: -4.2 },                                      // SEVERE left (worst on Great Wall)
      { len: 40,  curve:  0.0, shortcut: true },                    // hillside bypass (alt route)
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

// Stores each segment's original item so items can be restored on next lap
let _itemRespawnMap = [];

function buildTrack(trackIdx) {
  const def = TRACK_DEFS[Math.min(trackIdx, TRACK_DEFS.length - 1)];
  currentTrackDef = def;
  segments = [];

  // ── Expand sections → per-sample raw arrays ──────────────────────────
  const rawCurve        = [];
  const rawShortcut     = [];
  const rawItem         = [];
  const rawSurfaceGrip  = [];
  const rawFogZone      = [];
  const rawWidthMult    = [];
  const rawOilSlick     = [];
  const rawHeatZone     = [];
  const rawSlipstream   = [];
  const rawRockHazard   = [];
  const rawRiverCrossing = [];

  for (const sec of def.sections) {
    const mid = Math.floor(sec.len / 2);   // item orb placed on middle segment only
    for (let i = 0; i < sec.len; i++) {
      rawCurve.push(sec.curve || 0);
      rawShortcut.push(!!sec.shortcut);
      rawItem.push(i === mid ? (sec.item || null) : null);
      rawSurfaceGrip.push(sec.surfaceGrip != null ? sec.surfaceGrip : 1.0);
      rawFogZone.push(!!sec.fogZone);
      rawWidthMult.push(sec.roadWidthMult != null ? sec.roadWidthMult : 1.0);
      rawOilSlick.push(!!sec.oilSlick);
      rawHeatZone.push(!!sec.heatZone);
      rawSlipstream.push(!!sec.slipstreamZone);
      rawRockHazard.push(i === mid ? (sec.rockHazard || null) : null);
      rawRiverCrossing.push(!!sec.riverCrossing);
    }
  }

  // ── Tile raw arrays to TRACK_SEGMENTS ───────────────────────────────
  const len = rawCurve.length;
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const j           = i % len;
    const isShortcut  = rawShortcut[j];
    const isRiver     = rawRiverCrossing[j];
    const even        = (i & 1) === 0;

    // Road color: shortcuts = dirt, river = blue-grey, normal = grey
    let roadColor;
    if (isShortcut)      roadColor = even ? '#7a5a30' : '#8a6a40';
    else if (isRiver)    roadColor = even ? '#4a6890' : '#5a78a0';
    else                 roadColor = even ? '#888'    : '#999';

    segments.push({
      index:          i,
      curve:          rawCurve[j],
      isShortcut,
      item:           rawItem[j],
      surfaceGrip:    rawSurfaceGrip[j],
      fogZone:        rawFogZone[j],
      roadWidthMult:  rawWidthMult[j],
      oilSlick:       rawOilSlick[j],
      heatZone:       rawHeatZone[j],
      slipstreamZone: rawSlipstream[j],
      rockHazard:     rawRockHazard[j],
      riverCrossing:  isRiver,
      roadColor,
      grassColor:     even
                        ? (def.hillColor || '#2d7a2d')
                        : (def.hillColor ? def.hillColor + 'cc' : '#39993a'),
      rumbleColor:    isShortcut ? '#7a5a30' : (even ? '#cc2222' : '#ffffff'),
      isFinish:       (i === 0 || i === 1),
    });
  }

  // ── Build item respawn map ───────────────────────────────────────────
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
}

// Restore all items for new lap
function respawnTrackItems() {
  for (let i = 0; i < segments.length; i++) {
    segments[i].item = _itemRespawnMap[i];
  }
}
