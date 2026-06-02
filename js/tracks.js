// ─────────────────────────────────────────────
//  TRACK DEFINITIONS + BUILDER
// ─────────────────────────────────────────────

// Each section: { len, curve, shortcut? }
// shortcut:true marks inside-cut alternate surface (dirt/gravel, no rumble)
const TRACK_DEFS = [
  {
    id: 0,
    name: 'MONACO',
    subtitle: 'City Street Circuit',
    desc: 'Technical turns • Tight hairpins • Short straights',
    skyTop:    '#0a1628',
    skyBot:    '#1a3a6a',
    hillColor: '#1a3a1a',
    bgObjects: 'buildings',
    sections: [
      { len: 60,  curve:  0.0 },
      { len: 30,  curve:  2.8 },
      { len: 15,  curve:  0.0, shortcut: true },  // casino inside cut
      { len: 20,  curve: -1.6 },
      { len: 25,  curve:  3.8 },
      { len: 15,  curve:  0.0, shortcut: true },  // loews hairpin cut
      { len: 40,  curve: -2.6 },
      { len: 30,  curve:  0.0 },
      { len: 35,  curve:  2.2 },
      { len: 35,  curve: -2.2 },
      { len: 50,  curve:  0.0 },
      { len: 30,  curve: -3.0 },
      { len: 25,  curve:  2.4 },
      { len: 60,  curve:  0.0 },
    ]
  },
  {
    id: 1,
    name: 'MONZA',
    subtitle: 'Temple of Speed',
    desc: 'Long straights • High speed • Gentle sweeps',
    skyTop:    '#1a3a6a',
    skyBot:    '#4a7ab8',
    hillColor: '#2a5a2a',
    bgObjects: 'forest',
    sections: [
      { len: 100, curve:  0.0  },   // main straight (shortened from 180)
      { len: 40,  curve:  2.2  },   // Prima Variante R
      { len: 15,  curve:  0.0, shortcut: true },
      { len: 40,  curve: -2.2  },   // Prima Variante L
      { len: 80,  curve:  0.0  },   // back straight (shortened from 120)
      { len: 55,  curve:  1.4  },   // Seconda Variante R
      { len: 55,  curve: -1.4  },   // Seconda Variante L
      { len: 100, curve:  0.0  },   // long high-speed straight (shortened from 160)
      { len: 60,  curve:  1.6  },   // Lesmo 1
      { len: 15,  curve:  0.0, shortcut: true },
      { len: 60,  curve:  1.6  },   // Lesmo 2
      { len: 100, curve:  0.0  },   // Serraglio straight
      { len: 50,  curve: -1.6  },   // Ascari chicane L
      { len: 50,  curve:  1.6  },   // Ascari chicane R
      { len: 80,  curve:  0.0  },   // final straight + Parabolica
    ]  // total = 900 segments — fills exactly one lap
  },
  {
    id: 2,
    name: 'MOUNTAIN PASS',
    subtitle: 'High Altitude Circuit',
    desc: 'Blind hairpins • Cliff drops • Summit straights',
    skyTop:    '#120820',
    skyBot:    '#3a1a50',
    hillColor: '#4a3a2a',
    bgObjects: 'mountains',
    sections: [
      { len: 80,  curve:  0.0  },   // summit straight
      { len: 28,  curve:  3.8  },   // sharp right hairpin (cliff edge)
      { len: 18,  curve:  0.0, shortcut: true },  // inside hairpin cut
      { len: 35,  curve:  0.0  },   // brief descent
      { len: 32,  curve: -3.2  },   // tight left (valley wall)
      { len: 18,  curve:  0.0, shortcut: true },  // valley shortcut
      { len: 45,  curve:  0.0  },   // valley floor straight
      { len: 30,  curve:  2.6  },   // sweeping right
      { len: 40,  curve:  0.0  },   // mid-mountain straight
      { len: 35,  curve: -4.0  },   // severe left hairpin (steepest)
      { len: 18,  curve:  0.0, shortcut: true },  // blind apex cut
      { len: 50,  curve:  0.0  },   // descending straight
      { len: 28,  curve:  2.2  },   // long right sweeper
      { len: 28,  curve: -2.2  },   // matching left sweeper (S-curve)
      { len: 60,  curve:  0.0  },   // return straight to summit
      { len: 25,  curve: -2.8  },   // final left before finish
      { len: 25,  curve:  0.0  },
    ]
  },
  {
    id: 3,
    name: 'AMAZON CIRCUIT',
    subtitle: 'Jungle Rally',
    desc: 'River crossings • Dense canopy • Wild S-curves',
    skyTop:    '#0a1a08',
    skyBot:    '#1a4a14',
    hillColor: '#0a2808',
    bgObjects: 'jungle',
    sections: [
      { len: 70,  curve:  0.0  },   // jungle main straight
      { len: 30,  curve:  1.8  },   // gentle right (river bend)
      { len: 30,  curve: -1.8  },   // S-curve left
      { len: 20,  curve:  0.0, shortcut: true },  // river bank shortcut
      { len: 40,  curve:  0.0  },   // canopy tunnel straight
      { len: 35,  curve: -3.4  },   // tight jungle hairpin left
      { len: 20,  curve:  0.0, shortcut: true },  // inside jungle cut
      { len: 30,  curve:  0.0  },   // short straight
      { len: 25,  curve:  2.2  },   // vine-crossing right
      { len: 25,  curve: -2.2  },   // quick left
      { len: 60,  curve:  0.0  },   // river-bank back straight
      { len: 22,  curve:  1.5  },   // gentle right
      { len: 22,  curve: -1.5  },   // matching left (S)
      { len: 22,  curve:  1.5  },   // triple-S continuation
      { len: 55,  curve:  0.0  },   // finish straight through canopy
      { len: 28,  curve: -2.6  },   // final hairpin left
      { len: 15,  curve:  0.0, shortcut: true },
      { len: 25,  curve:  0.0  },
    ]
  },
];

// Built segment array
let segments        = [];
let currentTrackDef = TRACK_DEFS[0];
let minimapPts      = [];

function buildTrack(trackIdx) {
  const def = TRACK_DEFS[Math.min(trackIdx, TRACK_DEFS.length - 1)];
  currentTrackDef = def;
  segments = [];

  // Expand sections → raw values
  const raw        = [];
  const rawShortcut = [];
  for (const sec of def.sections) {
    for (let i = 0; i < sec.len; i++) {
      raw.push(sec.curve || 0);
      rawShortcut.push(!!sec.shortcut);
    }
  }

  // Tile to TRACK_SEGMENTS
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const curve    = raw[i % raw.length];
    const isShortcut = rawShortcut[i % rawShortcut.length];
    const even     = (i & 1) === 0;

    segments.push({
      index:       i,
      curve:       curve,
      isShortcut:  isShortcut,
      // Shortcut zones get a dirt/gravel surface
      roadColor:   isShortcut ? (even ? '#7a5a30' : '#8a6a40') : (even ? '#888' : '#999'),
      grassColor:  even ? (def.hillColor || '#2d7a2d') : (def.hillColor ? def.hillColor + 'cc' : '#39993a'),
      rumbleColor: isShortcut ? '#7a5a30' : (even ? '#cc2222' : '#ffffff'),
      isFinish:    (i === 0 || i === 1),
    });
  }

  // Pre-compute minimap path
  minimapPts = [];
  let mpx = 0, mpy = 0, mAngle = -Math.PI / 2;
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    minimapPts.push({ x: mpx, y: mpy });
    mAngle += segments[i].curve * 0.045;
    mpx    += Math.cos(mAngle);
    mpy    += Math.sin(mAngle);
  }

  const xs = minimapPts.map(p => p.x);
  const ys = minimapPts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  minimapPts = minimapPts.map(p => ({
    x: (p.x - minX) / span,
    y: (p.y - minY) / span,
  }));
}
