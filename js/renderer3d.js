// ─────────────────────────────────────────────────────────────────────────────
//  THREE.JS 3D RENDERER  (complete rewrite — all bugs fixed)
//
//  Fixed bugs:
//   1. Triangle winding corrected → road normals point UP, road visible
//   2. THREE.DoubleSide on all road/ground materials (belt-and-braces)
//   3. Car Y=0 in group space so wheels sit on road, not floating
//   4. Camera snapped to correct position before first render (no lerp glitch)
//   5. Four distinct vehicle meshes: f1, f1v2, nascar, moto
//   6. initCars3D() reads vehicleType for player AND all AI cars
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

// ── World-space constants ────────────────────────────────────────────────────
const SEG_LEN_3D    = 4.0;   // metres per track segment
const ROAD_HALF_3D  = 5.5;   // road half-width (metres) — full road = 11m
const RUMBLE_W_3D   = 0.65;  // rumble strip width
const DASH_HALF_3D  = 0.20;  // centre-line dash half-width
const CURVE_3D      = 0.045; // rad / segment / curve-unit (identical to minimap)

// ── Module state ─────────────────────────────────────────────────────────────
let _thr    = null;
let _scene  = null;
let _cam    = null;
let _sun    = null;
let _amb    = null;

let _roadMesh   = null;
let _rumbleMesh = null;
let _dashMesh   = null;
let _groundMesh = null;

let _playerMesh3D = null;
const _aiMeshes3D  = [];
const _orbMeshes3D = [];
const _hazMeshes3D = [];

const _camTarget = new THREE.Vector3();
const _camLook   = new THREE.Vector3();
let   _camReady  = false;   // true after first snap

// ── 3D track path ─────────────────────────────────────────────────────────────
let trackPath3D = [];

function build3DPath() {
  if (!segments || !segments.length) return;
  trackPath3D = [];
  let wx = 0, wy = 0, wz = 0, ang = 0;
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const sA = Math.sin(ang), cA = Math.cos(ang);
    trackPath3D.push({ x: wx, y: wy, z: wz, fwdX: sA, fwdZ: cA, rgtX: cA, rgtZ: -sA });
    ang += segments[i].curve * CURVE_3D;
    wx  += sA * SEG_LEN_3D;
    wz  += cA * SEG_LEN_3D;
  }
}

// ── Track → world ─────────────────────────────────────────────────────────────
function trackToWorld3D(z, x) {
  if (!trackPath3D.length) return { x:0, y:0, z:0, fwdX:0, fwdZ:1, rgtX:1, rgtZ:0 };
  const i0 = ((Math.floor(z) % TRACK_SEGMENTS) + TRACK_SEGMENTS) % TRACK_SEGMENTS;
  const i1 = (i0 + 1) % TRACK_SEGMENTS;
  const f  = z - Math.floor(z);
  const a  = trackPath3D[i0], b = trackPath3D[i1];
  const lx = a.x + (b.x - a.x) * f,  lz = a.z + (b.z - a.z) * f;
  const rx = a.rgtX + (b.rgtX - a.rgtX) * f,  rz = a.rgtZ + (b.rgtZ - a.rgtZ) * f;
  return {
    x: lx + rx * x * ROAD_HALF_3D, y: a.y, z: lz + rz * x * ROAD_HALF_3D,
    fwdX: a.fwdX + (b.fwdX - a.fwdX) * f,
    fwdZ: a.fwdZ + (b.fwdZ - a.fwdZ) * f,
    rgtX: rx, rgtZ: rz,
  };
}

// ── Geometry helper ───────────────────────────────────────────────────────────
// BUG FIX #1 & #2: use DoubleSide on all road meshes; indices use correct CCW winding
function _mkMesh(posArr, colArr, idxArr) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posArr), 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(colArr), 3));
  geo.setIndex(idxArr);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,   // visible from both sides — guarantees road is seen
  }));
}

// ── Road geometry ─────────────────────────────────────────────────────────────
function buildRoad3D() {
  if (!trackPath3D.length) return;
  [_roadMesh, _rumbleMesh, _dashMesh].forEach(m => {
    if (m) { _scene.remove(m); m.geometry.dispose(); }
  });

  const Y = 0.02;   // slightly above ground
  const rP=[],rC=[],rI=[], uP=[],uC=[],uI=[], dP=[],dC=[],dI=[];

  function edge(tp, lat) {
    return [tp.x + tp.rgtX * lat, Y, tp.z + tp.rgtZ * lat];
  }

  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const t0  = trackPath3D[i];
    const t1  = trackPath3D[(i + 1) % TRACK_SEGMENTS];
    const seg = segments[i];
    const ev  = (i & 1) === 0;

    // ── BUG FIX #1: correct CCW winding so normals point UP (+Y) ───────────
    // Quad vertices:  b=curr-L  b+1=next-L  b+2=curr-R  b+3=next-R
    // Triangle A (b, b+1, b+2) = curr-L, next-L, curr-R → CCW from above ✓
    // Triangle B (b+2, b+1, b+3) = curr-R, next-L, next-R → CCW from above ✓
    const b = rP.length / 3;
    rP.push(...edge(t0,-ROAD_HALF_3D), ...edge(t1,-ROAD_HALF_3D),
             ...edge(t0, ROAD_HALF_3D), ...edge(t1, ROAD_HALF_3D));
    rI.push(b, b+1, b+2,  b+2, b+1, b+3);

    let r, g, bv;
    if (seg.isFinish)          { const c=ev?0.95:0.05; r=g=bv=c; }
    else if (seg.riverCrossing){ r=0.27; g=0.38; bv=0.54; }
    else if (seg.sandBlind)    { r=0.78; g=0.63; bv=0.25; }
    else if (seg.floodBlind)   { r=0.22; g=0.36; bv=0.62; }
    else if (seg.forkSection)  { r=0.48; g=0.46; bv=0.42; }
    else { const c=ev?0.50:0.56; r=g=bv=c; }
    for (let v=0;v<4;v++) rC.push(r,g,bv);

    // Rumble strips — correct CCW winding
    const rc = ev ? [0.88,0.10,0.10] : [1.0,1.0,1.0];
    const ul = uP.length/3;
    uP.push(...edge(t0,-ROAD_HALF_3D-RUMBLE_W_3D), ...edge(t1,-ROAD_HALF_3D-RUMBLE_W_3D),
             ...edge(t0,-ROAD_HALF_3D),             ...edge(t1,-ROAD_HALF_3D));
    uI.push(ul,ul+1,ul+2, ul+2,ul+1,ul+3);
    for (let v=0;v<4;v++) uC.push(...rc);

    const ur = uP.length/3;
    uP.push(...edge(t0, ROAD_HALF_3D),             ...edge(t1, ROAD_HALF_3D),
             ...edge(t0, ROAD_HALF_3D+RUMBLE_W_3D), ...edge(t1, ROAD_HALF_3D+RUMBLE_W_3D));
    uI.push(ur,ur+1,ur+2, ur+2,ur+1,ur+3);
    for (let v=0;v<4;v++) uC.push(...rc);

    // Centre dashes — correct CCW winding
    if (ev && !seg.isFinish) {
      const db = dP.length/3;
      dP.push(...edge(t0,-DASH_HALF_3D), ...edge(t1,-DASH_HALF_3D),
               ...edge(t0, DASH_HALF_3D), ...edge(t1, DASH_HALF_3D));
      dI.push(db,db+1,db+2, db+2,db+1,db+3);
      for (let v=0;v<4;v++) dC.push(1,1,1);
    }
  }

  _roadMesh   = _mkMesh(rP,rC,rI); _scene.add(_roadMesh);
  _rumbleMesh = _mkMesh(uP,uC,uI); _scene.add(_rumbleMesh);
  _dashMesh   = _mkMesh(dP,dC,dI); _scene.add(_dashMesh);
}

// ── Ground ────────────────────────────────────────────────────────────────────
function buildGround3D() {
  if (_groundMesh) { _scene.remove(_groundMesh); _groundMesh.geometry.dispose(); }
  const colStr = (currentTrackDef && currentTrackDef.hillColor) || '#2d7a2d';
  const mat = new THREE.MeshLambertMaterial({
    color: new THREE.Color(colStr),
    side: THREE.DoubleSide,
  });
  _groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(14000,14000), mat);
  _groundMesh.rotation.x = -Math.PI / 2;
  _groundMesh.position.y = -0.05;
  _scene.add(_groundMesh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  VEHICLE MESHES
//  BUG FIX #3: All meshes designed so wheel bottoms touch Y=0 in group space.
//  Group is placed at trackY + 0.0 (not + 0.44) so wheels sit on road.
//
//  Axis convention (group local space):
//    +Z = forward (nose direction)
//    +X = right
//    +Y = up
// ─────────────────────────────────────────────────────────────────────────────

function _mat(color) { return new THREE.MeshLambertMaterial({ color: new THREE.Color(color) }); }
function _mats(colorStr, f) { return new THREE.MeshLambertMaterial({ color: new THREE.Color(colorStr).multiplyScalar(f) }); }

// helper: add a box child to group
function _box(g, sx, sy, sz, mat, x, y, z, rx, ry, rz) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  m.position.set(x, y, z);
  if (rx) m.rotation.x = rx;
  if (ry) m.rotation.y = ry;
  if (rz) m.rotation.z = rz;
  g.add(m);
}

// helper: add a wheel cylinder to group — radius r, thickness t, at (x,y,z)
// Wheel bottom sits at y - r  →  to sit on ground: y = r
function _wheel(g, r, t, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, t, 16), mat);
  m.rotation.z = Math.PI / 2;
  m.position.set(x, y, z);
  g.add(m);
}

// ── F1 Classic ────────────────────────────────────────────────────────────────
function _createF1_3D(colorStr) {
  const g    = new THREE.Group();
  const b    = _mat(colorStr);
  const dark = _mats(colorStr, 0.50);
  const carb = _mat('#101010');
  const tire = _mat('#1e1e1e');

  // Main body (centre of body at y=0.38, half-height=0.20, bottom=0.18 → off road)
  _box(g, 1.90,0.40,4.30, b,    0,0.38,  0);
  _box(g, 0.88,0.18,0.90, dark, 0,0.25,  2.30);  // nose
  _box(g, 0.90,0.52,1.50, carb, 0,0.78, -0.22);  // cockpit
  _box(g, 0.55,0.30,1.80, b,    0.97,0.37,-0.15); // sidepod R
  _box(g, 0.55,0.30,1.80, b,   -0.97,0.37,-0.15); // sidepod L
  _box(g, 2.30,0.06,0.40, dark, 0,0.11, 2.53);   // front wing
  _box(g, 1.55,0.06,0.52, dark, 0,1.06,-2.18);   // rear wing
  _box(g, 0.06,0.45,0.52, carb, 0.78,0.87,-2.18);// endplate R
  _box(g, 0.06,0.45,0.52, carb,-0.78,0.87,-2.18);// endplate L
  // Halo
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.44,0.055,6,16,Math.PI), carb);
  halo.rotation.y = Math.PI/2; halo.position.set(0,1.05,-0.08); g.add(halo);
  // Wheels — radius=0.38, centre at y=0.38 → bottom at y=0 ✓
  _wheel(g, 0.38,0.34,  1.13,0.38, 1.55, tire); // FL
  _wheel(g, 0.38,0.34, -1.13,0.38, 1.55, tire); // FR
  _wheel(g, 0.40,0.40,  1.13,0.40,-1.62, tire); // RL
  _wheel(g, 0.40,0.40, -1.13,0.40,-1.62, tire); // RR
  return g;
}

// ── LMP1 Prototype ────────────────────────────────────────────────────────────
function _createLMP3D(colorStr) {
  const g    = new THREE.Group();
  const b    = _mat(colorStr);
  const dark = _mats(colorStr, 0.50);
  const carb = _mat('#0a0a0a');
  const tire = _mat('#1e1e1e');

  _box(g, 2.10,0.38,4.80, b,    0,0.30,  0);    // wide flat body
  _box(g, 0.80,0.22,1.40, dark, 0,0.22,  2.60); // long nose
  _box(g, 0.95,0.42,1.40, carb, 0,0.72, -0.15); // enclosed canopy lower
  _box(g, 0.82,0.24,1.20, carb, 0,0.98, -0.15); // canopy dome
  _box(g, 0.72,0.32,1.50, b,    1.02,0.38, 1.40); // front fender R
  _box(g, 0.72,0.32,1.50, b,   -1.02,0.38, 1.40); // front fender L
  _box(g, 0.76,0.36,1.60, b,    1.04,0.38,-1.55); // rear fender R
  _box(g, 0.76,0.36,1.60, b,   -1.04,0.38,-1.55); // rear fender L
  _box(g, 0.05,0.75,1.80, dark, 0,0.72,-1.40);  // shark fin
  _box(g, 2.20,0.06,0.40, dark, 0,0.12, 2.92);  // front splitter
  _box(g, 1.90,0.08,0.55, dark, 0,0.18,-2.65);  // rear diffuser
  // Wheels under fenders, still physically present
  _wheel(g, 0.38,0.34,  1.10,0.38, 1.52, tire);
  _wheel(g, 0.38,0.34, -1.10,0.38, 1.52, tire);
  _wheel(g, 0.40,0.40,  1.10,0.40,-1.58, tire);
  _wheel(g, 0.40,0.40, -1.10,0.40,-1.58, tire);
  return g;
}

// ── NASCAR Stock Car ──────────────────────────────────────────────────────────
function _createNASCAR3D(colorStr) {
  const g    = new THREE.Group();
  const b    = _mat(colorStr);
  const dark = _mats(colorStr, 0.52);
  const carb = _mat('#111111');
  const tire = _mat('#1e1e1e');
  const wh   = _mat('#ffffff');

  _box(g, 2.18,0.65,4.85, b,    0,0.47,  0);    // wide body
  _box(g, 1.75,0.60,2.70, b,    0,1.12, -0.22); // closed roof/cabin
  _box(g, 1.60,0.04,0.85, carb, 0,1.22,  1.02, -0.52); // windshield angled
  _box(g, 1.60,0.04,0.70, carb, 0,1.18, -1.55,  0.45); // rear glass angled
  _box(g, 1.88,0.28,0.10, dark, 0,0.98, -2.45); // rear spoiler
  _box(g, 2.12,0.35,0.20, dark, 0,0.35,  2.43); // front bumper
  _box(g, 2.12,0.35,0.20, dark, 0,0.35, -2.43); // rear bumper
  // Number plate on side
  _box(g, 0.02,0.50,0.75, wh,   1.10,0.62,  0);
  _box(g, 0.02,0.50,0.75, wh,  -1.10,0.62,  0);
  // Wheels — wider than F1
  _wheel(g, 0.40,0.38,  1.12,0.40, 1.62, tire);
  _wheel(g, 0.40,0.38, -1.12,0.40, 1.62, tire);
  _wheel(g, 0.42,0.40,  1.12,0.42,-1.72, tire);
  _wheel(g, 0.42,0.40, -1.12,0.42,-1.72, tire);
  return g;
}

// ── Motorbike ─────────────────────────────────────────────────────────────────
// BUG FIX #5: completely different shape — narrow, only 2 wheels, visible rider
function _createMoto3D(colorStr) {
  const g    = new THREE.Group();
  const b    = _mat(colorStr);
  const dark = _mats(colorStr, 0.52);
  const carb = _mat('#101010');
  const tire = _mat('#1a1a1a');
  const suit = _mat('#1c1c2a');  // rider suit
  const helm = _mat(colorStr);  // helmet matches livery

  // ── TWO wheels only — narrow (0.22m thick) ─────────────────────────────
  _wheel(g, 0.32,0.22,  0,0.32, 1.55, tire); // front wheel
  _wheel(g, 0.35,0.24,  0,0.35,-1.30, tire); // rear wheel

  // Front fork
  _box(g, 0.06,0.55,0.08, carb,  0.15,0.60,1.42);
  _box(g, 0.06,0.55,0.08, carb, -0.15,0.60,1.42);

  // Main fairing/body — NARROW
  _box(g, 0.46,0.55,2.25, b,    0,0.78, 0.08);
  // Front cowl
  _box(g, 0.42,0.65,0.55, b,    0,0.95, 1.38);
  // Tail section
  _box(g, 0.36,0.22,0.82, dark, 0,0.85,-0.90);

  // ── Rider ──────────────────────────────────────────────────────────────
  // Lower body (legs)
  _box(g, 0.52,0.38,0.88, suit, 0,1.20, 0.02);
  // Upper body (torso, leaning forward)
  _box(g, 0.50,0.65,0.65, suit, 0,1.73, 0.25);
  // Arms
  _box(g, 0.16,0.14,0.55, suit,  0.30,1.68, 0.90);
  _box(g, 0.16,0.14,0.55, suit, -0.30,1.68, 0.90);
  // Helmet
  const helmMesh = new THREE.Mesh(new THREE.SphereGeometry(0.26,10,8), helm);
  helmMesh.position.set(0, 2.18, 0.22);
  g.add(helmMesh);
  // Visor
  _box(g, 0.24,0.12,0.08, _mat('#4a8aff'), 0,2.14,0.47);

  return g;
}

// ── Mesh dispatcher (BUG FIX #5) ─────────────────────────────────────────────
function _createMeshForType(vehicleType, colorStr) {
  switch (vehicleType) {
    case 'moto':   return _createMoto3D(colorStr);
    case 'nascar': return _createNASCAR3D(colorStr);
    case 'f1v2':   return _createLMP3D(colorStr);
    default:       return _createF1_3D(colorStr);
  }
}

// ── Init / update cars ────────────────────────────────────────────────────────
function initCars3D() {
  if (_playerMesh3D) _scene.remove(_playerMesh3D);
  _aiMeshes3D.forEach(m => _scene.remove(m));
  _aiMeshes3D.length = 0;

  if (player && typeof carConfig !== 'undefined') {
    // BUG FIX #5: use carConfig.vehicleType
    _playerMesh3D = _createMeshForType(carConfig.vehicleType || 'f1', carConfig.color || '#ff0000');
    _scene.add(_playerMesh3D);
  }

  if (typeof aiCars !== 'undefined') {
    for (const ai of aiCars) {
      // BUG FIX #5: use ai.vehicleType
      const m = _createMeshForType(ai.vehicleType || 'f1', ai.color || '#0033cc');
      _scene.add(m);
      _aiMeshes3D.push(m);
    }
  }
}

function _placeMesh(mesh, z, x, steer) {
  if (!mesh || !trackPath3D.length) return;
  const w = trackToWorld3D(z, x);
  // BUG FIX #3: wheels sit at y=0 in group → place group at road surface (w.y + 0.0)
  // Road surface Y = 0.02; add tiny offset to avoid z-fighting
  mesh.position.set(w.x, w.y + 0.01, w.z);
  mesh.rotation.y = -Math.atan2(w.fwdX, w.fwdZ);
  mesh.rotation.z = -(steer || 0) * 0.18;
}

function updateCars3D() {
  if (!player || !trackPath3D.length) return;
  _placeMesh(_playerMesh3D, player.z, player.x, player.steeringAngle || 0);
  if (typeof aiCars !== 'undefined') {
    for (let i = 0; i < aiCars.length; i++) {
      _placeMesh(_aiMeshes3D[i], aiCars[i].z, aiCars[i].x, 0);
    }
  }
}

// ── Item orbs ─────────────────────────────────────────────────────────────────
function initItemOrbs3D() {
  _orbMeshes3D.forEach(o => _scene.remove(o.mesh));
  _orbMeshes3D.length = 0;
  if (typeof _itemRespawnMap === 'undefined' || typeof ITEM_DEFS === 'undefined') return;
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const id  = _itemRespawnMap[i];
    if (!id || !ITEM_DEFS[id]) continue;
    const col = new THREE.Color(ITEM_DEFS[id].color);
    const mat = new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.6 });
    const m   = new THREE.Mesh(new THREE.SphereGeometry(0.60, 10, 7), mat);
    const wp  = trackToWorld3D(i + 0.5, 0);
    m.position.set(wp.x, wp.y + 1.4, wp.z);
    _scene.add(m);
    _orbMeshes3D.push({ mesh: m, segIdx: i });
  }
}

function updateItemOrbs3D() {
  const t = Date.now() * 0.001;
  for (const o of _orbMeshes3D) {
    const seg = segments[o.segIdx];
    o.mesh.visible = !!(seg && seg.item);
    if (o.mesh.visible) {
      o.mesh.rotation.y = t * 1.9;
      const baseY = (trackPath3D[o.segIdx] || {y:0}).y;
      o.mesh.position.y = baseY + 1.4 + Math.sin(t * 2.6 + o.segIdx * 0.7) * 0.20;
    }
  }
}

// ── Road hazard objects ───────────────────────────────────────────────────────
function initHazards3D() {
  _hazMeshes3D.forEach(m => _scene.remove(m));
  _hazMeshes3D.length = 0;
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const seg = segments[i];
    const hz  = seg.rockHazard || seg.brickHazard;
    if (!hz) continue;
    const isB  = !!seg.brickHazard;
    const col  = isB ? 0x7a7a7a : 0x7a6a55;
    const sx   = isB ? 1.10 : 0.88;
    const sy   = isB ? 0.88 : 0.70;
    const mat  = new THREE.MeshLambertMaterial({ color: col });
    const geo  = new THREE.BoxGeometry(sx, sy, isB ? 0.95 : 0.80);
    function placeHz(side) {
      const wp = trackToWorld3D(i + 0.5, side * 0.80);
      const m  = new THREE.Mesh(geo, mat);
      m.position.set(wp.x, wp.y + sy * 0.5, wp.z);
      m.rotation.y = -Math.atan2(wp.fwdX, wp.fwdZ);
      _scene.add(m); _hazMeshes3D.push(m);
    }
    if (hz === 'left'  || hz === 'both') placeHz(-1);
    if (hz === 'right' || hz === 'both') placeHz( 1);
  }
}

// ── Camera ────────────────────────────────────────────────────────────────────
function _computeCamTargets() {
  if (!player || !trackPath3D.length) return;
  const is1st = typeof viewMode !== 'undefined' && viewMode === '1st';
  if (is1st) {
    const eye = trackToWorld3D(player.z + 0.3, player.x);
    _camTarget.set(eye.x, eye.y + 1.55, eye.z);
    const fwd = trackToWorld3D(player.z + 7.0, player.x * 0.8);
    _camLook.set(fwd.x, fwd.y + 1.30, fwd.z);
  } else {
    const back = 11.0 / SEG_LEN_3D;
    const bp   = trackToWorld3D(player.z - back, player.x * 0.32);
    _camTarget.set(bp.x, bp.y + 4.5, bp.z);
    const fp   = trackToWorld3D(player.z + 5.0, player.x);
    _camLook.set(fp.x, fp.y + 1.4, fp.z);
  }
}

function updateCamera3D() {
  if (!_cam || !player || !trackPath3D.length) return;
  _computeCamTargets();
  // BUG FIX #4: smooth lerp only after initial snap
  _cam.position.lerp(_camTarget, 0.12);
  _cam.lookAt(_camLook);
}

// ── Sky / lighting ────────────────────────────────────────────────────────────
function updateSky3D() {
  if (!_scene || !currentTrackDef) return;
  const top = new THREE.Color(currentTrackDef.skyTop || '#1a3a6a');
  const bot = new THREE.Color(currentTrackDef.skyBot || '#4a7ab8');
  _scene.background = top.clone().lerp(bot, 0.55);
  // Adjust ambient for night (dark sky = less ambient)
  if (_amb) {
    const lum = top.r * 0.3 + top.g * 0.59 + top.b * 0.11;
    _amb.intensity = 0.50 + Math.max(0, lum) * 0.85;
    if (_sun) _sun.intensity = 0.70 + Math.max(0, lum) * 0.55;
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

  // Gentle fill light from the opposite side
  const fill = new THREE.DirectionalLight(0xaabbff, 0.25);
  fill.position.set(-400, 300, -300);
  _scene.add(fill);

  _camReady = false;
}

// ── Rebuild scene (called from startRace after buildTrack + initPlayer + initAI)
function rebuild3DScene() {
  if (!_thr) return;
  build3DPath();
  buildRoad3D();
  buildGround3D();
  initCars3D();
  initItemOrbs3D();
  initHazards3D();
  updateSky3D();

  // BUG FIX #4: Snap camera to correct start position — no lerp jitter on first frame
  _camReady = false;
  if (player && trackPath3D.length && _cam) {
    _computeCamTargets();
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
  // BUG FIX #4: only lerp camera after initial snap
  if (_camReady) {
    updateCamera3D();
  } else if (player && trackPath3D.length) {
    _computeCamTargets();
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
