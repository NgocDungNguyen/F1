// ─────────────────────────────────────────────────────────────────────────────
//  THREE.JS 3D RENDERER
//  Converts the pseudo-3D track segment data into real 3D geometry.
//  Player / AI game positions (z = track segment index, x = lateral -1..+1)
//  map to world positions via trackPath3D[], computed from the same curve
//  data the original pseudo-3D scanline renderer used.
//
//  Rendering split:
//    Three.js WebGL canvas  → world (road, cars, sky, item orbs)
//    2D gameCanvas overlay  → weather particles, cockpit, HUD, speed lines
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────
const SEG_LEN_3D     = 4.0;     // metres per track segment in world space
const ROAD_HALF_3D   = 5.5;     // road half-width (metres)
const RUMBLE_W_3D    = ROAD_HALF_3D * 0.11;  // rumble strip width
const DASH_HALF_3D   = ROAD_HALF_3D * 0.035; // centre-line dash half-width
const CURVE_3D       = 0.045;   // rad / segment / curve-unit (same scale as minimap)

// ── Module state ──────────────────────────────────────────────────────────────
let _thr    = null;   // THREE.WebGLRenderer
let _scene  = null;   // THREE.Scene
let _cam    = null;   // THREE.PerspectiveCamera
let _sun    = null;   // THREE.DirectionalLight
let _amb    = null;   // THREE.AmbientLight

let _roadMesh   = null;
let _rumbleMesh = null;
let _dashMesh   = null;
let _groundMesh = null;

let _playerMesh3D = null;
const _aiMeshes3D = [];
const _orbMeshes3D = [];   // { mesh, segIdx }

// Camera smooth-follow targets
const _camPos  = new THREE.Vector3();
const _camLook = new THREE.Vector3();

// 3D path: one entry per segment  {x, y, z, fwdX, fwdZ, rgtX, rgtZ}
let trackPath3D = [];

// ── Path generation ──────────────────────────────────────────────────────────
function build3DPath() {
  if (!segments || segments.length === 0) return;
  trackPath3D = [];
  let wx = 0, wy = 0, wz = 0, angle = 0;
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const sinA = Math.sin(angle), cosA = Math.cos(angle);
    trackPath3D.push({
      x: wx, y: wy, z: wz,
      fwdX: sinA, fwdZ: cosA,
      rgtX: cosA, rgtZ: -sinA,
    });
    angle += segments[i].curve * CURVE_3D;
    wx    += sinA * SEG_LEN_3D;
    wz    += cosA * SEG_LEN_3D;
  }
}

// ── Track coords → world position ────────────────────────────────────────────
function trackToWorld3D(z, x) {
  if (!trackPath3D.length) return { x: 0, y: 0, z: 0, fwdX: 0, fwdZ: 1, rgtX: 1, rgtZ: 0 };
  const i0 = ((Math.floor(z) % TRACK_SEGMENTS) + TRACK_SEGMENTS) % TRACK_SEGMENTS;
  const i1 = (i0 + 1) % TRACK_SEGMENTS;
  const f  = z - Math.floor(z);
  const t0 = trackPath3D[i0], t1 = trackPath3D[i1];

  const lx = t0.x + (t1.x - t0.x) * f;
  const lz = t0.z + (t1.z - t0.z) * f;
  const rx = t0.rgtX + (t1.rgtX - t0.rgtX) * f;
  const rz = t0.rgtZ + (t1.rgtZ - t0.rgtZ) * f;
  const fx = t0.fwdX + (t1.fwdX - t0.fwdX) * f;
  const fz = t0.fwdZ + (t1.fwdZ - t0.fwdZ) * f;
  const ly = t0.y;

  return {
    x: lx + rx * x * ROAD_HALF_3D,
    y: ly,
    z: lz + rz * x * ROAD_HALF_3D,
    fwdX: fx, fwdZ: fz,
    rgtX: rx, rgtZ: rz,
  };
}

// ── Mesh builder helper ───────────────────────────────────────────────────────
function _makeMesh(posArr, colArr, idxArr, transparent) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posArr), 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(colArr), 3));
  geo.setIndex(idxArr);
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  if (transparent) { mat.transparent = true; mat.opacity = 0.9; }
  return new THREE.Mesh(geo, mat);
}

// ── Road geometry ────────────────────────────────────────────────────────────
function buildRoad3D() {
  if (!trackPath3D.length) return;
  [_roadMesh, _rumbleMesh, _dashMesh].forEach(m => {
    if (m) { _scene.remove(m); m.geometry.dispose(); }
  });

  const RH = ROAD_HALF_3D, RW = RUMBLE_W_3D, DW = DASH_HALF_3D, Y = 0.02;

  const rPos = [], rCol = [], rIdx = [];
  const uPos = [], uCol = [], uIdx = [];
  const dPos = [], dCol = [], dIdx = [];

  function pt3(tp, lat, yOff) {
    return [tp.x + tp.rgtX * lat, Y + yOff, tp.z + tp.rgtZ * lat];
  }

  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const t0  = trackPath3D[i];
    const t1  = trackPath3D[(i + 1) % TRACK_SEGMENTS];
    const seg = segments[i];
    const even = (i & 1) === 0;

    // ── Road surface (grey, river = blue, sand = tan, flood = deep blue) ──
    const b = rPos.length / 3;
    rPos.push(...pt3(t0, -RH, 0), ...pt3(t0, RH, 0),
              ...pt3(t1, -RH, 0), ...pt3(t1, RH, 0));
    rIdx.push(b, b+1, b+2,  b+1, b+3, b+2);

    let r, g, bv;
    if (seg.riverCrossing)                    { r=0.27; g=0.38; bv=0.54; }
    else if (seg.sandBlind)                   { r=0.78; g=0.63; bv=0.25; }
    else if (seg.floodBlind)                  { r=0.23; g=0.37; bv=0.63; }
    else if (seg.forkSection)                 { r=0.48; g=0.46; bv=0.40; }
    else if (seg.isFinish) { const c = even ? 0.95 : 0.05; r=g=bv=c; }
    else { const c = even ? 0.51 : 0.56; r=g=bv=c; }

    for (let v = 0; v < 4; v++) rCol.push(r, g, bv);

    // ── Rumble strips (red / white alternating) ───────────────────────────
    const rc = even ? [0.88, 0.10, 0.10] : [1.0, 1.0, 1.0];
    const ul = uPos.length / 3;
    uPos.push(...pt3(t0, -RH-RW, 0), ...pt3(t0, -RH, 0),
              ...pt3(t1, -RH-RW, 0), ...pt3(t1, -RH, 0));
    uIdx.push(ul, ul+1, ul+2,  ul+1, ul+3, ul+2);
    for (let v = 0; v < 4; v++) uCol.push(...rc);

    const ur = uPos.length / 3;
    uPos.push(...pt3(t0, RH, 0), ...pt3(t0, RH+RW, 0),
              ...pt3(t1, RH, 0), ...pt3(t1, RH+RW, 0));
    uIdx.push(ur, ur+1, ur+2,  ur+1, ur+3, ur+2);
    for (let v = 0; v < 4; v++) uCol.push(...rc);

    // ── Centre dashes (white, every other segment) ────────────────────────
    if (even && !seg.isFinish) {
      const db = dPos.length / 3;
      dPos.push(...pt3(t0, -DW, 0.008), ...pt3(t0, DW, 0.008),
                ...pt3(t1, -DW, 0.008), ...pt3(t1, DW, 0.008));
      dIdx.push(db, db+1, db+2,  db+1, db+3, db+2);
      for (let v = 0; v < 4; v++) dCol.push(1, 1, 1);
    }
  }

  _roadMesh   = _makeMesh(rPos, rCol, rIdx, false);
  _rumbleMesh = _makeMesh(uPos, uCol, uIdx, false);
  _dashMesh   = _makeMesh(dPos, dCol, dIdx, false);
  _scene.add(_roadMesh);
  _scene.add(_rumbleMesh);
  _scene.add(_dashMesh);
}

// ── Ground plane ─────────────────────────────────────────────────────────────
function buildGround3D() {
  if (_groundMesh) { _scene.remove(_groundMesh); _groundMesh.geometry.dispose(); }
  const colStr = (currentTrackDef && currentTrackDef.hillColor) || '#2d7a2d';
  const geo = new THREE.PlaneGeometry(14000, 14000, 1, 1);
  const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(colStr) });
  _groundMesh = new THREE.Mesh(geo, mat);
  _groundMesh.rotation.x = -Math.PI / 2;
  _groundMesh.position.y = -0.06;
  _scene.add(_groundMesh);
}

// ── Car mesh ─────────────────────────────────────────────────────────────────
function _createCar3D(colorStr) {
  const col  = new THREE.Color(colorStr);
  const dark = new THREE.Color(colorStr).multiplyScalar(0.52);
  const bMat = new THREE.MeshLambertMaterial({ color: col  });
  const dMat = new THREE.MeshLambertMaterial({ color: dark });
  const cMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const tMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

  const g = new THREE.Group();

  function box(sx, sy, sz, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(x, y, z);
    g.add(m);
  }

  // Main body
  box(1.90, 0.40, 4.30, bMat,  0,    0.38,  0);
  // Nose cone
  box(0.85, 0.18, 0.90, dMat,  0,    0.25,  2.30);
  // Cockpit
  box(0.90, 0.52, 1.50, cMat,  0,    0.78, -0.22);
  // Sidepods
  box(0.55, 0.30, 1.80, bMat,  0.97, 0.37, -0.15);
  box(0.55, 0.30, 1.80, bMat, -0.97, 0.37, -0.15);
  // Front wing
  box(2.30, 0.06, 0.40, dMat,  0,    0.11,  2.53);
  // Rear wing
  box(1.55, 0.06, 0.50, dMat,  0,    1.06, -2.18);
  box(0.06, 0.44, 0.50, cMat,  0.78, 0.87, -2.18);
  box(0.06, 0.44, 0.50, cMat, -0.78, 0.87, -2.18);

  // Wheels
  const wGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.34, 14);
  for (const [wx, wy, wz] of [
    [ 1.13, 0.38,  1.55], [-1.13, 0.38,  1.55],
    [ 1.13, 0.38, -1.62], [-1.13, 0.38, -1.62],
  ]) {
    const w = new THREE.Mesh(wGeo, tMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, wy, wz);
    g.add(w);
  }

  // Halo (safety bar over cockpit)
  const hGeo = new THREE.TorusGeometry(0.44, 0.055, 6, 16, Math.PI);
  const h = new THREE.Mesh(hGeo, cMat);
  h.rotation.y = Math.PI / 2;
  h.position.set(0, 1.04, -0.08);
  g.add(h);

  return g;
}

// ── Init / update car meshes ─────────────────────────────────────────────────
function initCars3D() {
  if (_playerMesh3D) _scene.remove(_playerMesh3D);
  _aiMeshes3D.forEach(m => _scene.remove(m));
  _aiMeshes3D.length = 0;

  if (player && typeof carConfig !== 'undefined') {
    _playerMesh3D = _createCar3D(carConfig.color || '#ff0000');
    _scene.add(_playerMesh3D);
  }

  if (typeof aiCars !== 'undefined') {
    for (const ai of aiCars) {
      const m = _createCar3D(ai.color || '#0033cc');
      _scene.add(m);
      _aiMeshes3D.push(m);
    }
  }
}

function _placeCar(mesh, z, x, steerAngle) {
  if (!mesh || !trackPath3D.length) return;
  const w = trackToWorld3D(z, x);
  mesh.position.set(w.x, w.y + 0.44, w.z);
  mesh.rotation.y = -Math.atan2(w.fwdX, w.fwdZ);
  mesh.rotation.z = -(steerAngle || 0) * 0.18;
}

function updateCars3D() {
  if (!player || !trackPath3D.length) return;
  _placeCar(_playerMesh3D, player.z, player.x, player.steeringAngle || 0);

  if (typeof aiCars !== 'undefined') {
    for (let i = 0; i < aiCars.length; i++) {
      _placeCar(_aiMeshes3D[i], aiCars[i].z, aiCars[i].x, 0);
    }
  }
}

// ── Item orb meshes ──────────────────────────────────────────────────────────
function initItemOrbs3D() {
  _orbMeshes3D.forEach(o => _scene.remove(o.mesh));
  _orbMeshes3D.length = 0;

  if (typeof _itemRespawnMap === 'undefined' || typeof ITEM_DEFS === 'undefined') return;
  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const id = _itemRespawnMap[i];
    if (!id || !ITEM_DEFS[id]) continue;
    const def = ITEM_DEFS[id];
    const col = new THREE.Color(def.color);
    const geo = new THREE.SphereGeometry(0.62, 10, 7);
    const mat = new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.55 });
    const mesh = new THREE.Mesh(geo, mat);
    const wp   = trackToWorld3D(i + 0.5, 0);
    mesh.position.set(wp.x, wp.y + 1.45, wp.z);
    _scene.add(mesh);
    _orbMeshes3D.push({ mesh, segIdx: i });
  }
}

function updateItemOrbs3D() {
  const t = Date.now() * 0.001;
  for (const o of _orbMeshes3D) {
    const seg = segments[o.segIdx];
    o.mesh.visible = !!(seg && seg.item);
    if (o.mesh.visible) {
      o.mesh.rotation.y = t * 1.85;
      const baseY = trackPath3D[o.segIdx] ? trackPath3D[o.segIdx].y : 0;
      o.mesh.position.y = baseY + 1.45 + Math.sin(t * 2.6 + o.segIdx * 0.7) * 0.22;
    }
  }
}

// ── Road hazard meshes ───────────────────────────────────────────────────────
const _hazardMeshes3D = [];

function initHazards3D() {
  _hazardMeshes3D.forEach(m => _scene.remove(m));
  _hazardMeshes3D.length = 0;

  for (let i = 0; i < TRACK_SEGMENTS; i++) {
    const seg = segments[i];
    const hz  = seg.rockHazard || seg.brickHazard;
    if (!hz) continue;

    const isB  = !!seg.brickHazard;
    const matC = new THREE.MeshLambertMaterial({ color: isB ? 0x7a7a7a : 0x7a6a55 });
    const sx = isB ? 1.1 : 0.9,  sy = isB ? 0.90 : 0.72,  sz = isB ? 0.95 : 0.80;
    const geo = new THREE.BoxGeometry(sx, sy, sz);

    function placeH(side) {
      const xOff = side * (ROAD_HALF_3D * 0.78);
      const wp   = trackToWorld3D(i + 0.5, side * 0.78);
      const m    = new THREE.Mesh(geo, matC);
      m.position.set(wp.x, wp.y + sy * 0.5, wp.z);
      m.rotation.y = -Math.atan2(wp.fwdX, wp.fwdZ);
      _scene.add(m);
      _hazardMeshes3D.push(m);
    }

    if (hz === 'left'  || hz === 'both') placeH(-1);
    if (hz === 'right' || hz === 'both') placeH( 1);
  }
}

// ── Camera ───────────────────────────────────────────────────────────────────
function updateCamera3D() {
  if (!player || !trackPath3D.length) return;

  const is1st = typeof viewMode !== 'undefined' && viewMode === '1st';

  if (is1st) {
    const eye = trackToWorld3D(player.z + 0.4, player.x);
    _camPos.set(eye.x, eye.y + 1.55, eye.z);
    const fwd = trackToWorld3D(player.z + 6.0, player.x * 0.7);
    _camLook.set(fwd.x, fwd.y + 1.3, fwd.z);
  } else {
    const back = 10.0 / SEG_LEN_3D;
    const bp   = trackToWorld3D(player.z - back, player.x * 0.35);
    _camPos.set(bp.x, bp.y + 4.4, bp.z);
    const fp   = trackToWorld3D(player.z + 4.5, player.x);
    _camLook.set(fp.x, fp.y + 1.4, fp.z);
  }

  _cam.position.lerp(_camPos, 0.14);
  _cam.lookAt(_camLook);
}

// ── Sky / lighting update ────────────────────────────────────────────────────
function updateSky3D() {
  if (!_scene || !currentTrackDef) return;
  const top = new THREE.Color(currentTrackDef.skyTop || '#1a3a6a');
  const bot = new THREE.Color(currentTrackDef.skyBot || '#4a7ab8');
  _scene.background = top.clone().lerp(bot, 0.55);
  if (_amb) {
    // Night cycle: dim ambient during dark sky
    const brightness = top.r * 0.3 + top.g * 0.59 + top.b * 0.11;  // luminance
    _amb.intensity = 0.35 + brightness * 1.2;
    if (_sun) _sun.intensity = 0.7 + brightness * 0.6;
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
function init3DRenderer(canvas3D, W, H) {
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded — 3D renderer unavailable');
    return;
  }
  _thr = new THREE.WebGLRenderer({ canvas: canvas3D, antialias: true });
  _thr.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  _thr.setSize(W, H, false);
  _thr.shadowMap.enabled = false;

  _scene = new THREE.Scene();
  _cam   = new THREE.PerspectiveCamera(62, W / H, 0.5, 9000);

  _amb = new THREE.AmbientLight(0xffffff, 0.7);
  _scene.add(_amb);
  _sun = new THREE.DirectionalLight(0xffffff, 0.85);
  _sun.position.set(600, 900, 200);
  _scene.add(_sun);
}

// ── Rebuild scene (called after buildTrack + initPlayer + initAI) ─────────────
function rebuild3DScene() {
  if (!_thr) return;
  build3DPath();
  buildRoad3D();
  buildGround3D();
  initCars3D();
  initItemOrbs3D();
  initHazards3D();
  updateSky3D();
}

// ── Per-frame render ─────────────────────────────────────────────────────────
function render3D() {
  if (!_thr || !_scene || !_cam) return;
  updateSky3D();
  updateCars3D();
  updateItemOrbs3D();
  updateCamera3D();
  _thr.render(_scene, _cam);
}

// ── Resize ───────────────────────────────────────────────────────────────────
function resize3DRenderer(W, H) {
  if (!_thr || !_cam) return;
  _thr.setSize(W, H, false);
  _cam.aspect = W / H;
  _cam.updateProjectionMatrix();
}
