// ─────────────────────────────────────────────────────────────────────────────
//  THREE.JS 3D RENDERER  —  v3 (all root-cause bugs fixed)
//
//  Bug fixes from v2:
//   A. CURVE_3D 0.045 → 0.020  (hairpins no longer self-intersect)
//   B. Road loop stops at TRACK_SEGMENTS-1 (no insane wrap polygon to origin)
//   C. Three Y layers: road=0.010, rumble=0.016, dash=0.022  (no Z-fighting)
//   D. Car rotation: +atan2 not −atan2  (car faces direction of travel)
//   E. Car group at w.y+0.010 = road surface  (wheels touch road, not sinking)
//   F. Item orbs 1.2× larger + 1.8 m high  (clearly visible)
//   G. Added FogExp2 for depth cue
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

// ── World constants ───────────────────────────────────────────────────────────
const SEG_LEN_3D   = 4.0;   // metres per track segment
const ROAD_HALF_3D = 5.5;   // road half-width  (full = 11 m)
const RUMBLE_3D    = 0.65;  // rumble strip width
const DASH_3D      = 0.20;  // centre-line dash half-width
// BUG FIX A: was 0.045 — curves now realistic (hairpin ~90-150° not 200°+)
const CURVE_3D     = 0.020;

// Y-layer heights (prevent Z-fighting between overlapping geometries)
const YR = 0.010;   // road surface
const YU = 0.016;   // rumble strips (above road)
const YD = 0.022;   // centre dashes (above rumble)

// ── Module state ──────────────────────────────────────────────────────────────
let _thr = null, _scene = null, _cam = null, _sun = null, _amb = null;
let _roadMesh = null, _rumbleMesh = null, _dashMesh = null, _groundMesh = null;
let _playerMesh3D = null;
const _aiMeshes3D  = [];
const _orbMeshes3D = [];   // { mesh, segIdx }
const _hazMeshes3D = [];
let _mainSegments  = null; // snapshot of main-track segments (immune to alt-route swap)

const _camTarget = new THREE.Vector3();
const _camLook   = new THREE.Vector3();
let   _camReady  = false;

// ── 3D track path ─────────────────────────────────────────────────────────────
let trackPath3D = [];   // { x, y, z, fwdX, fwdZ, rgtX, rgtZ }

function build3DPath() {
  if (!segments || !segments.length) return;
  trackPath3D = [];
  let wx = 0, wy = 0, wz = 0, ang = 0;
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const sA = Math.sin(ang), cA = Math.cos(ang);
    trackPath3D.push({ x: wx, y: wy, z: wz,
      fwdX: sA, fwdZ: cA, rgtX: cA, rgtZ: -sA });
    ang += segments[i].curve * CURVE_3D;
    wx  += sA * SEG_LEN_3D;
    wz  += cA * SEG_LEN_3D;
  }
}

// ── Track → world ─────────────────────────────────────────────────────────────
function trackToWorld3D(z, x) {
  if (!trackPath3D.length)
    return { x:0, y:0, z:0, fwdX:0, fwdZ:1, rgtX:1, rgtZ:0 };
  const i0 = ((Math.floor(z) % TRACK_SEGMENTS) + TRACK_SEGMENTS) % TRACK_SEGMENTS;
  const i1 = (i0 + 1) % TRACK_SEGMENTS;
  const f  = z - Math.floor(z);
  const a  = trackPath3D[i0], b = trackPath3D[i1];
  const lx = a.x + (b.x - a.x) * f,  lz = a.z + (b.z - a.z) * f;
  const rx = a.rgtX + (b.rgtX - a.rgtX) * f;
  const rz = a.rgtZ + (b.rgtZ - a.rgtZ) * f;
  return {
    x:    lx + rx * x * ROAD_HALF_3D,
    y:    a.y,
    z:    lz + rz * x * ROAD_HALF_3D,
    fwdX: a.fwdX + (b.fwdX - a.fwdX) * f,
    fwdZ: a.fwdZ + (b.fwdZ - a.fwdZ) * f,
    rgtX: rx, rgtZ: rz,
  };
}

// ── Geometry builder ──────────────────────────────────────────────────────────
function _mkMesh(pos, col, idx) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(col), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  }));
}

// vertex at lateral offset 'lat' from path point 'tp', at height 'y'
function _ev(tp, lat, y) {
  return [tp.x + tp.rgtX * lat, y, tp.z + tp.rgtZ * lat];
}

// ── Road geometry ─────────────────────────────────────────────────────────────
function buildRoad3D() {
  if (!trackPath3D.length) return;
  [_roadMesh, _rumbleMesh, _dashMesh].forEach(m => {
    if (m) { _scene.remove(m); m.geometry.dispose(); }
  });

  const rP=[],rC=[],rI=[], uP=[],uC=[],uI=[], dP=[],dC=[],dI=[];

  // BUG FIX B: loop stops at TRACK_SEGMENTS-1 — no wrap from last seg to seg-0
  // (that wrap created a gigantic polygon slashing across the entire world)
  for (let i = 0; i < TRACK_SEGMENTS - 1; i++) {
    const t0  = trackPath3D[i];
    const t1  = trackPath3D[i + 1];    // NOT (i+1)%TRACK_SEGMENTS
    const seg = segments[i];
    const ev  = (i & 1) === 0;

    // ── Road surface  (CCW winding → normals +Y) ────────────────────────────
    // Vertex layout: b=curr-L  b+1=next-L  b+2=curr-R  b+3=next-R
    const b = rP.length / 3;
    rP.push(
      ..._ev(t0, -ROAD_HALF_3D, YR), ..._ev(t1, -ROAD_HALF_3D, YR),
      ..._ev(t0,  ROAD_HALF_3D, YR), ..._ev(t1,  ROAD_HALF_3D, YR)
    );
    rI.push(b, b+1, b+2,  b+2, b+1, b+3);   // CCW from above ✓

    let r, g, bv;
    if (seg.isFinish)           { const c = ev ? 0.95 : 0.05; r=g=bv=c; }
    else if (seg.riverCrossing) { r=0.27; g=0.38; bv=0.54; }
    else if (seg.sandBlind)     { r=0.78; g=0.63; bv=0.25; }
    else if (seg.floodBlind)    { r=0.22; g=0.36; bv=0.62; }
    else if (seg.forkSection)   { r=0.48; g=0.46; bv=0.42; }
    else { const c = ev ? 0.50 : 0.57; r=g=bv=c; }
    for (let v = 0; v < 4; v++) rC.push(r, g, bv);

    // ── Rumble strips — BUG FIX C: YU=0.016 (above road) no Z-fight ────────
    const rc = ev ? [0.88,0.10,0.10] : [1.0,1.0,1.0];
    const ul = uP.length / 3;
    uP.push(
      ..._ev(t0, -ROAD_HALF_3D - RUMBLE_3D, YU), ..._ev(t1, -ROAD_HALF_3D - RUMBLE_3D, YU),
      ..._ev(t0, -ROAD_HALF_3D,             YU), ..._ev(t1, -ROAD_HALF_3D,             YU)
    );
    uI.push(ul, ul+1, ul+2,  ul+2, ul+1, ul+3);
    for (let v = 0; v < 4; v++) uC.push(...rc);

    const ur = uP.length / 3;
    uP.push(
      ..._ev(t0,  ROAD_HALF_3D,             YU), ..._ev(t1,  ROAD_HALF_3D,             YU),
      ..._ev(t0,  ROAD_HALF_3D + RUMBLE_3D, YU), ..._ev(t1,  ROAD_HALF_3D + RUMBLE_3D, YU)
    );
    uI.push(ur, ur+1, ur+2,  ur+2, ur+1, ur+3);
    for (let v = 0; v < 4; v++) uC.push(...rc);

    // ── Centre dashes — BUG FIX C: YD=0.022 (above rumble) ──────────────────
    if (ev && !seg.isFinish) {
      const db = dP.length / 3;
      dP.push(
        ..._ev(t0, -DASH_3D, YD), ..._ev(t1, -DASH_3D, YD),
        ..._ev(t0,  DASH_3D, YD), ..._ev(t1,  DASH_3D, YD)
      );
      dI.push(db, db+1, db+2,  db+2, db+1, db+3);
      for (let v = 0; v < 4; v++) dC.push(1, 1, 1);
    }
  }

  _roadMesh   = _mkMesh(rP, rC, rI); _scene.add(_roadMesh);
  _rumbleMesh = _mkMesh(uP, uC, uI); _scene.add(_rumbleMesh);
  _dashMesh   = _mkMesh(dP, dC, dI); _scene.add(_dashMesh);
}

// ── Ground plane ──────────────────────────────────────────────────────────────
function buildGround3D() {
  if (_groundMesh) { _scene.remove(_groundMesh); _groundMesh.geometry.dispose(); }
  const col = (currentTrackDef && currentTrackDef.hillColor) || '#2d7a2d';
  _groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(20000, 20000),
    new THREE.MeshLambertMaterial({ color: new THREE.Color(col), side: THREE.DoubleSide })
  );
  _groundMesh.rotation.x = -Math.PI / 2;
  _groundMesh.position.y = -0.06;
  _scene.add(_groundMesh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  VEHICLE MESHES
//  All wheels:  centre at (x, r, z) in group space → bottom at y=0
//  Group placed at world y = road surface = YR = 0.010
//  Axis: +Z = car forward (nose direction)
// ─────────────────────────────────────────────────────────────────────────────
function _mat(c)      { return new THREE.MeshLambertMaterial({ color: typeof c === 'string' ? new THREE.Color(c) : c }); }
function _darkMat(c)  { return _mat(new THREE.Color(c).multiplyScalar(0.65)); }  // was 0.50 — less black
function _glowMat(c)  { const col = new THREE.Color(c); return new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.6 }); }

function _addBox(g, sx, sy, sz, mat, x, y, z, rx, ry) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  m.position.set(x, y, z);
  if (rx) m.rotation.x = rx;
  if (ry) m.rotation.y = ry;
  g.add(m);
}

function _addWheel(g, radius, thick, x, z, mat) {
  // radius = wheel radius, y = radius so bottom touches y=0 in group space
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thick, 16), mat);
  m.rotation.z = Math.PI / 2;
  m.position.set(x, radius, z);
  g.add(m);
}

// ── F1 Classic ────────────────────────────────────────────────────────────────
function _buildF1(colorStr) {
  const g = new THREE.Group();
  const b = _mat(colorStr), d = _darkMat(colorStr), carb = _mat('#0d0d0d'), tire = _mat('#1a1a1a');
  const silver = _mat('#b0b0b0'), red = _glowMat('#ff2200');
  _addBox(g, 1.88, 0.46, 4.00, b,    0,   0.42,  0);       // main body (taller, slightly shorter)
  _addBox(g, 1.60, 0.10, 0.40, d,    0,   0.20,  1.80);    // floor/splitter transition
  _addBox(g, 0.80, 0.16, 1.10, d,    0,   0.26,  2.20);    // nose cone
  _addBox(g, 0.50, 0.08, 0.36, d,    0,   0.14,  2.70);    // nose tip
  _addBox(g, 0.90, 0.55, 1.50, carb, 0,   0.84, -0.18);    // cockpit tub (taller)
  _addBox(g, 0.60, 0.28, 0.30, carb, 0,   0.85,  0.56);    // cockpit front lip
  _addBox(g, 0.54, 0.32, 1.80, b,    0.98,0.40, -0.10);    // sidepod R
  _addBox(g, 0.54, 0.32, 1.80, b,   -0.98,0.40, -0.10);    // sidepod L
  _addBox(g, 0.30, 0.18, 0.50, silver, 0.94,0.22, 1.20);  // sidepod inlet R
  _addBox(g, 0.30, 0.18, 0.50, silver,-0.94,0.22, 1.20);  // sidepod inlet L
  _addBox(g, 2.30, 0.07, 0.42, d,    0,   0.12,  2.60);    // front wing main
  _addBox(g, 2.50, 0.06, 0.14, d,    0,   0.22,  2.72);    // front wing upper flap
  _addBox(g, 1.60, 0.07, 0.58, d,    0,   1.12, -2.10);    // rear wing
  _addBox(g, 0.07, 0.50, 0.58, carb, 0.82,0.88, -2.10);   // endplate R
  _addBox(g, 0.07, 0.50, 0.58, carb,-0.82,0.88, -2.10);   // endplate L
  _addBox(g, 0.60, 0.46, 0.80, d,    0,   0.54, -2.10);    // engine cover / diffuser upper
  _addBox(g, 0.08, 0.12, 0.28, silver, 0.30, 0.70, -2.15); // exhaust R
  _addBox(g, 0.08, 0.12, 0.28, silver,-0.30, 0.70, -2.15); // exhaust L
  _addBox(g, 1.00, 0.04, 0.12, red,   0,   0.22, -2.42);   // brake lights (emissive)
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.058, 6, 16, Math.PI), carb);
  halo.rotation.y = Math.PI / 2;  halo.position.set(0, 1.08, -0.05);  g.add(halo);
  _addWheel(g, 0.38, 0.34,  1.12,  1.55, tire);  // FL
  _addWheel(g, 0.38, 0.34, -1.12,  1.55, tire);  // FR
  _addWheel(g, 0.40, 0.42,  1.12, -1.62, tire);  // RL (wider)
  _addWheel(g, 0.40, 0.42, -1.12, -1.62, tire);  // RR (wider)
  return g;
}

// ── LMP1 Prototype ────────────────────────────────────────────────────────────
function _buildLMP(colorStr) {
  const g = new THREE.Group();
  const b = _mat(colorStr), d = _darkMat(colorStr), carb = _mat('#080808'), tire = _mat('#1a1a1a');
  const silver = _mat('#aaaaaa'), red = _glowMat('#ff2200');
  _addBox(g, 2.08, 0.38, 4.60, b,    0,   0.30,  0);       // wide flat body
  _addBox(g, 0.76, 0.18, 1.40, d,    0,   0.20,  2.52);    // long nose
  _addBox(g, 0.48, 0.10, 0.44, d,    0,   0.13,  3.14);    // nose tip
  _addBox(g, 0.94, 0.44, 1.42, carb, 0,   0.74, -0.10);    // lower canopy
  _addBox(g, 0.82, 0.26, 1.22, carb, 0,   1.02, -0.10);    // canopy dome
  _addBox(g, 0.70, 0.10, 0.30, _mat('#88aacc'), 0, 1.02, 0.52); // windscreen (light blue)
  _addBox(g, 0.72, 0.32, 1.52, b,    1.02,0.36,  1.32);    // front fender R
  _addBox(g, 0.72, 0.32, 1.52, b,   -1.02,0.36,  1.32);    // front fender L
  _addBox(g, 0.76, 0.36, 1.62, b,    1.04,0.36, -1.48);    // rear fender R
  _addBox(g, 0.76, 0.36, 1.62, b,   -1.04,0.36, -1.48);    // rear fender L
  _addBox(g, 0.06, 0.80, 1.80, d,    0,   0.72, -1.32);    // shark fin
  _addBox(g, 2.20, 0.07, 0.42, d,    0,   0.12,  2.90);    // front splitter
  _addBox(g, 1.90, 0.10, 0.56, d,    0,   0.18, -2.58);    // rear diffuser
  _addBox(g, 0.10, 0.14, 0.30, silver, 0.38, 0.36, -2.68); // exhaust R
  _addBox(g, 0.10, 0.14, 0.30, silver,-0.38, 0.36, -2.68); // exhaust L
  _addBox(g, 1.10, 0.05, 0.14, red,   0,   0.24, -2.60);   // rear brake lights
  _addWheel(g, 0.38, 0.34,  1.10,  1.52, tire);
  _addWheel(g, 0.38, 0.34, -1.10,  1.52, tire);
  _addWheel(g, 0.40, 0.40,  1.10, -1.54, tire);
  _addWheel(g, 0.40, 0.40, -1.10, -1.54, tire);
  return g;
}

// ── NASCAR Stock Car ──────────────────────────────────────────────────────────
function _buildNASCAR(colorStr) {
  const g = new THREE.Group();
  const b = _mat(colorStr), d = _darkMat(colorStr), carb = _mat('#111111'), tire = _mat('#1a1a1a');
  const white = _mat('#ffffff'), silver = _mat('#b8b8b8'), red = _glowMat('#ff2200');
  _addBox(g, 2.16, 0.66, 4.82, b,    0,   0.48,  0);       // wide body
  _addBox(g, 1.76, 0.62, 2.72, b,    0,   1.14, -0.18);    // closed roof/cabin
  _addBox(g, 1.62, 0.05, 0.86, carb, 0,   1.22,  1.02, -0.50);  // windshield
  _addBox(g, 1.62, 0.05, 0.72, carb, 0,   1.18, -1.54,  0.44);  // rear glass
  _addBox(g, 1.90, 0.30, 0.12, d,    0,   1.00, -2.44);    // rear spoiler
  _addBox(g, 0.50, 0.12, 1.10, d,    0,   0.80, -2.44);    // spoiler mount
  _addBox(g, 2.14, 0.34, 0.22, d,    0,   0.34,  2.40);    // front bumper
  _addBox(g, 2.14, 0.34, 0.22, d,    0,   0.34, -2.40);    // rear bumper
  _addBox(g, 0.40, 0.20, 0.22, silver,0,  0.80,  2.40);    // front grille
  _addBox(g, 0.30, 0.14, 0.24, silver,0,  0.60,  2.52);    // front air scoop
  _addBox(g, 0.14, 0.10, 0.40, silver, 0.70, 0.72,  0.60); // side exhaust R
  _addBox(g, 0.14, 0.10, 0.40, silver,-0.70, 0.72,  0.60); // side exhaust L
  _addBox(g, 0.03, 0.54, 0.84, white,  1.09, 0.64,  0);    // number panel R
  _addBox(g, 0.03, 0.54, 0.84, white, -1.09, 0.64,  0);    // number panel L
  _addBox(g, 0.80, 0.03, 0.60, white,  0,    1.46,  0);    // roof number (top)
  _addBox(g, 1.20, 0.05, 0.16, red,    0,    0.28, -2.42); // rear brake lights
  _addWheel(g, 0.40, 0.40,  1.12,  1.62, tire);
  _addWheel(g, 0.40, 0.40, -1.12,  1.62, tire);
  _addWheel(g, 0.42, 0.42,  1.12, -1.72, tire);
  _addWheel(g, 0.42, 0.42, -1.12, -1.72, tire);
  return g;
}

// ── Motorbike — narrow, 2 wheels, seated rider ────────────────────────────────
function _buildMoto(colorStr) {
  const g    = new THREE.Group();
  const b    = _mat(colorStr);
  const d    = _darkMat(colorStr);
  const carb = _mat('#101010');
  const tire = _mat('#191919');
  const suit = _mat(new THREE.Color(colorStr).multiplyScalar(0.75));  // tinted team suit
  const helm = _mat(colorStr);
  const visor = _mat('#22cc88');  // distinctive green visor

  // Wheels (radius, thickness, x, z)
  _addWheel(g, 0.30, 0.20,  0,  0.85, tire);   // front
  _addWheel(g, 0.32, 0.22,  0, -0.82, tire);   // rear

  // Front fork legs
  _addBox(g, 0.06, 0.46, 0.07, carb,  0.13, 0.48,  0.72);
  _addBox(g, 0.06, 0.46, 0.07, carb, -0.13, 0.48,  0.72);
  // Fork brace
  _addBox(g, 0.30, 0.05, 0.07, carb,  0,    0.30,  0.72);

  // Swing arm
  _addBox(g, 0.06, 0.06, 0.44, carb, 0, 0.30, -0.58);

  // Body — narrow (0.44 m wide)
  _addBox(g, 0.44, 0.54, 2.10, b,    0, 0.76,  0.05);
  // Front cowl / fairing
  _addBox(g, 0.42, 0.66, 0.38, b,    0, 0.88,  0.72);
  // Lower fairing
  _addBox(g, 0.40, 0.28, 1.20, d,    0, 0.48,  0.20);
  // Fuel tank
  _addBox(g, 0.36, 0.26, 0.50, d,    0, 1.04,  0.16);
  // Tail section
  _addBox(g, 0.30, 0.22, 0.56, b,    0, 0.88, -0.60);
  // Tail light (emissive)
  _addBox(g, 0.22, 0.06, 0.06, _glowMat('#ff2200'), 0, 0.88, -0.90);
  // Mirrors
  _addBox(g, 0.14, 0.06, 0.08, carb,  0.28, 1.10,  0.55);
  _addBox(g, 0.14, 0.06, 0.08, carb, -0.28, 1.10,  0.55);

  // ── Rider ──────────────────────────────────────────────────────────────────
  _addBox(g, 0.48, 0.34, 0.84, suit, 0, 1.18,  0.04);     // legs (crouched)
  _addBox(g, 0.44, 0.46, 0.64, suit, 0, 1.57,  0.22);     // torso (leaning forward)
  _addBox(g, 0.15, 0.13, 0.50, suit,  0.27, 1.50,  0.60); // arm R
  _addBox(g, 0.15, 0.13, 0.50, suit, -0.27, 1.50,  0.60); // arm L
  // Helmet (sphere)
  const helmMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), helm);
  helmMesh.position.set(0, 1.90, 0.18);
  g.add(helmMesh);
  // Visor (distinctive color so helmet reads clearly)
  _addBox(g, 0.24, 0.11, 0.07, visor, 0, 1.85, 0.44);

  return g;
}

// ── Vehicle dispatcher ────────────────────────────────────────────────────────
function _buildVehicle(type, colorStr) {
  switch (type) {
    case 'moto':   return _buildMoto(colorStr);
    case 'nascar': return _buildNASCAR(colorStr);
    case 'f1v2':   return _buildLMP(colorStr);
    default:       return _buildF1(colorStr);
  }
}

// ── Init / update cars ────────────────────────────────────────────────────────
function initCars3D() {
  if (_playerMesh3D) _scene.remove(_playerMesh3D);
  _aiMeshes3D.forEach(m => _scene.remove(m));
  _aiMeshes3D.length = 0;

  if (player && typeof carConfig !== 'undefined') {
    _playerMesh3D = _buildVehicle(carConfig.vehicleType || 'f1', carConfig.color || '#cc0000');
    _scene.add(_playerMesh3D);
  }

  if (typeof aiCars !== 'undefined') {
    for (const ai of aiCars) {
      const m = _buildVehicle(ai.vehicleType || 'f1', ai.color || '#0033cc');
      _scene.add(m);
      _aiMeshes3D.push(m);
    }
  }
}

function _placeMesh(mesh, z, x, steer) {
  if (!mesh || !trackPath3D.length) return;
  const w = trackToWorld3D(z, x);
  // BUG FIX E: group at road surface (YR=0.010). Wheel bottom in group = 0 → touches road.
  mesh.position.set(w.x, w.y + YR, w.z);
  // BUG FIX D: +atan2, not −atan2. Negative sign was making car face backwards.
  // Three.js rotation.y=θ maps local+Z to world(sin(θ),0,cos(θ)).
  // For fwdX=sin(θ), fwdZ=cos(θ): θ = atan2(fwdX, fwdZ) ✓
  mesh.rotation.y = Math.atan2(w.fwdX, w.fwdZ);
  mesh.rotation.z = -(steer || 0) * 0.16;
}

function updateCars3D() {
  if (!player || !trackPath3D.length) return;
  // BUG FIX I: during alt route, hold car at the fork-entry point on the main track
  // (alt route has no 3D geometry; mainEntryZ is where the fork begins on the main road)
  let pz = player.z;
  if (player.altRoute && typeof _altRouteData !== 'undefined') {
    const ar = _altRouteData[player.altRoute.idx];
    if (ar && ar.mainEntryZ != null) pz = ar.mainEntryZ;
  }
  _placeMesh(_playerMesh3D, pz, player.x, player.steeringAngle || 0);
  if (typeof aiCars !== 'undefined') {
    for (let i = 0; i < aiCars.length; i++) {
      if (!_aiMeshes3D[i]) continue;  // BUG FIX J: guard against mesh count mismatch
      _placeMesh(_aiMeshes3D[i], aiCars[i].z, aiCars[i].x, 0);
    }
  }
}

// ── Item orbs ─────────────────────────────────────────────────────────────────
function initItemOrbs3D() {
  _orbMeshes3D.forEach(o => _scene.remove(o.mesh));
  _orbMeshes3D.length = 0;
  if (typeof _itemRespawnMap === 'undefined' || typeof ITEM_DEFS === 'undefined') return;
  _mainSegments = segments;  // BUG FIX H: snapshot before any alt-route swap can corrupt it
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const id = _itemRespawnMap[i];
    if (!id || !ITEM_DEFS[id]) continue;
    const def = ITEM_DEFS[id];
    const col = new THREE.Color(def.color);
    // BUG FIX F: larger (0.75m), brighter emissive, higher above road (1.8m)
    const mat = new THREE.MeshLambertMaterial({
      color: col, emissive: col, emissiveIntensity: 0.85,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 8), mat);
    const wp   = trackToWorld3D(i + 0.5, 0);
    mesh.position.set(wp.x, wp.y + 1.80, wp.z);
    _scene.add(mesh);
    _orbMeshes3D.push({ mesh, segIdx: i, baseY: wp.y });
  }
}

function updateItemOrbs3D() {
  const t = Date.now() * 0.001;
  const segs = _mainSegments || segments;  // BUG FIX H: never use swapped alt-route segments
  for (const o of _orbMeshes3D) {
    const seg = segs[o.segIdx];
    o.mesh.visible = !!(seg && seg.item);
    if (o.mesh.visible) {
      o.mesh.rotation.y = t * 2.0;
      o.mesh.position.y = o.baseY + 1.80 + Math.sin(t * 2.8 + o.segIdx * 0.6) * 0.22;
    }
  }
}

// ── Road-hazard objects (rocks, bricks) ───────────────────────────────────────
function initHazards3D() {
  _hazMeshes3D.forEach(m => _scene.remove(m));
  _hazMeshes3D.length = 0;
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const seg = segments[i];
    const hz  = seg.rockHazard || seg.brickHazard;
    if (!hz) continue;
    const isB = !!seg.brickHazard;
    const sx  = isB ? 1.1 : 0.88,  sy = isB ? 0.88 : 0.70;
    const mat = _mat(isB ? '#7a7a7a' : '#7a6a55');
    const geo = new THREE.BoxGeometry(sx, sy, isB ? 0.92 : 0.78);
    function place(side) {
      const wp = trackToWorld3D(i + 0.5, side * 0.80);
      const m  = new THREE.Mesh(geo, mat);
      m.position.set(wp.x, wp.y + sy * 0.5, wp.z);
      m.rotation.y = Math.atan2(wp.fwdX, wp.fwdZ);
      _scene.add(m); _hazMeshes3D.push(m);
    }
    if (hz === 'left'  || hz === 'both') place(-1);
    if (hz === 'right' || hz === 'both') place( 1);
  }
}

// ── Camera ────────────────────────────────────────────────────────────────────
function _computeCam() {
  if (!player || !trackPath3D.length) return;
  const is1 = typeof viewMode !== 'undefined' && viewMode === '1st';
  if (is1) {
    const e = trackToWorld3D(player.z + 0.3, player.x);
    _camTarget.set(e.x, e.y + 1.55, e.z);
    const f = trackToWorld3D(player.z + 7.0, player.x * 0.8);
    _camLook.set(f.x, f.y + 1.30, f.z);
  } else {
    const back = 11 / SEG_LEN_3D;
    const bp = trackToWorld3D(player.z - back, player.x * 0.30);
    _camTarget.set(bp.x, bp.y + 4.6, bp.z);
    const fp = trackToWorld3D(player.z + 5, player.x);
    _camLook.set(fp.x, fp.y + 1.4, fp.z);
  }
}

function updateCamera3D() {
  if (!_cam || !player || !trackPath3D.length) return;
  _computeCam();
  _cam.position.lerp(_camTarget, 0.12);
  _cam.lookAt(_camLook);
}

// ── Sky + lighting ────────────────────────────────────────────────────────────
function updateSky3D() {
  if (!_scene || !currentTrackDef) return;
  const top = new THREE.Color(currentTrackDef.skyTop || '#1a3a6a');
  const bot = new THREE.Color(currentTrackDef.skyBot || '#4a7ab8');
  _scene.background = top.clone().lerp(bot, 0.55);
  if (_amb) {
    const lum = top.r * 0.3 + top.g * 0.59 + top.b * 0.11;
    _amb.intensity = 0.45 + Math.max(0, lum) * 0.90;
    if (_sun) _sun.intensity = 0.65 + Math.max(0, lum) * 0.60;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
function init3DRenderer(canvas3D, W, H) {
  if (typeof THREE === 'undefined') { console.warn('Three.js not loaded'); return; }
  _thr = new THREE.WebGLRenderer({ canvas: canvas3D, antialias: true });
  _thr.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  _thr.setSize(W, H, false);

  _scene = new THREE.Scene();
  _cam   = new THREE.PerspectiveCamera(62, W / H, 0.5, 9000);

  _amb = new THREE.AmbientLight(0xffffff, 0.65);
  _scene.add(_amb);
  _sun = new THREE.DirectionalLight(0xffffff, 0.80);
  _sun.position.set(600, 900, 200);
  _scene.add(_sun);
  const fill = new THREE.DirectionalLight(0x88aaff, 0.22);
  fill.position.set(-400, 300, -300);
  _scene.add(fill);

  // BUG FIX G: gentle fog gives depth cue and hides the open track end
  _scene.fog = new THREE.FogExp2(0x8ab0d0, 0.0006);

  _camReady = false;
}

// ── Rebuild — call after buildTrack() + initPlayer() + initAI() ──────────────
function rebuild3DScene() {
  if (!_thr) return;
  _mainSegments = null;  // reset; initItemOrbs3D will re-capture
  build3DPath();
  buildRoad3D();
  buildGround3D();
  initCars3D();
  initItemOrbs3D();
  initHazards3D();
  updateSky3D();
  // Snap camera immediately so first frame looks correct (no lerp stutter)
  _camReady = false;
  if (player && trackPath3D.length && _cam) {
    _computeCam();
    _cam.position.copy(_camTarget);
    _cam.lookAt(_camLook);
    _camReady = true;
  }
}

// ── Per-frame render ──────────────────────────────────────────────────────────
function render3D() {
  if (!_thr || !_scene || !_cam) return;
  updateSky3D();
  updateCars3D();
  updateItemOrbs3D();
  if (_camReady) {
    updateCamera3D();
  } else if (player && trackPath3D.length) {
    _computeCam();
    _cam.position.copy(_camTarget);
    _cam.lookAt(_camLook);
    _camReady = true;
  }
  _thr.render(_scene, _cam);
}

// ── Resize ────────────────────────────────────────────────────────────────────
function resize3DRenderer(W, H) {
  if (!_thr || !_cam) return;
  _thr.setSize(W, H, false);
  _cam.aspect = W / H;
  _cam.updateProjectionMatrix();
}
