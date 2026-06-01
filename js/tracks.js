// ─────────────────────────────────────────────
//  TRACK DEFINITIONS + BUILDER
// ─────────────────────────────────────────────

// Each section: { len (segments), curve (-4..4), hill }
// curve >0 = right bend, <0 = left bend
// Colours used while rendering sky/background
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
      { len: 60,  curve:  0.0 },  // pit straight
      { len: 30,  curve:  2.8 },  // Casino corner right
      { len: 20,  curve: -1.6 },  // Mirabeau left kink
      { len: 25,  curve:  3.8 },  // Loews hairpin (sharpest)
      { len: 40,  curve: -2.6 },  // Portier left
      { len: 30,  curve:  0.0 },  // tunnel straight
      { len: 35,  curve:  2.2 },  // chicane right (Swimming Pool)
      { len: 35,  curve: -2.2 },  // chicane left
      { len: 50,  curve:  0.0 },  // short back straight
      { len: 30,  curve: -3.0 },  // Rascasse left
      { len: 25,  curve:  2.4 },  // Anthony Noghes right
      { len: 60,  curve:  0.0 },  // return to start
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
      { len: 180, curve:  0.0  },  // main straight (very long)
      { len: 40,  curve:  2.2  },  // Prima Variante R
      { len: 40,  curve: -2.2  },  // Prima Variante L
      { len: 120, curve:  0.0  },  // back straight long
      { len: 55,  curve:  1.4  },  // Seconda Variante R
      { len: 55,  curve: -1.4  },  // Seconda Variante L
      { len: 160, curve:  0.0  },  // long high-speed straight
      { len: 60,  curve:  1.6  },  // Lesmo 1
      { len: 60,  curve:  1.6  },  // Lesmo 2
      { len: 100, curve:  0.0  },  // Serraglio straight
      { len: 50,  curve: -1.6  },  // Ascari chicane L
      { len: 50,  curve:  1.6  },  // Ascari chicane R
      { len: 130, curve:  0.0  },  // final straight + Parabolica entry
    ]
  }
];

// Built segment array – populated by buildTrack()
let segments        = [];
let currentTrackDef = TRACK_DEFS[0];
let minimapPts      = [];   // pre-computed {x,y} normalised points for minimap

function buildTrack(trackIdx) {
  const def = TRACK_DEFS[trackIdx];
  currentTrackDef = def;
  segments = [];

  // Expand sections → raw curve values
  const raw = [];
  for (const sec of def.sections) {
    for (let i = 0; i < sec.len; i++) {
      raw.push(sec.curve || 0);
    }
  }

  // Tile to reach TRACK_SEGMENTS
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const curve = raw[i % raw.length];
    const even  = (i & 1) === 0;

    segments.push({
      index:       i,
      curve:       curve,
      roadColor:   even ? '#888' : '#999',
      grassColor:  even ? '#2d7a2d' : '#39993a',
      rumbleColor: even ? '#cc2222' : '#ffffff',
      isFinish:    (i === 0 || i === 1),
    });
  }

  // ── Pre-compute top-down track path for minimap ───────────────────────
  minimapPts = [];
  let mpx = 0, mpy = 0, mAngle = -Math.PI / 2;
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    minimapPts.push({ x: mpx, y: mpy });
    mAngle += segments[i].curve * 0.045;
    mpx    += Math.cos(mAngle);
    mpy    += Math.sin(mAngle);
  }

  // Normalise to [0..1] range
  const xs = minimapPts.map(p => p.x);
  const ys = minimapPts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
  const span  = Math.max(spanX, spanY);
  minimapPts = minimapPts.map(p => ({
    x: (p.x - minX) / span,
    y: (p.y - minY) / span,
  }));
}
