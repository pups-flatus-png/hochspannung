// Grid Master 2 – 3D board prototype (P0)
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import MAP from './de.js';

// ---------- i18n ----------
const DE = (navigator.language || 'de').toLowerCase().startsWith('de');
const T = DE ? {
  power: 'Strom liefern', view: 'Ansicht', hi: 'Hoch', lo: 'Sparsam', build: 'Bauen', line: 'Leitung', house: 'Haus',
  total: 'Gesamt', full: 'Belegt', own: 'Schon deine Stadt', poor: 'Zu wenig Geld', noroute: 'Keine Verbindung',
  start: 'Tippe auf eine gold markierte Stadt, um zu bauen.', paid: 'Einnahmen', cities: 'Städte', q: 'Grafik'
} : {
  power: 'Deliver power', view: 'View', hi: 'High', lo: 'Saver', build: 'Build', line: 'Line', house: 'House',
  total: 'Total', full: 'Full', own: 'Already yours', poor: 'Not enough money', noroute: 'No connection',
  start: 'Tap a gold-marked city to build.', paid: 'Income', cities: 'cities', q: 'Graphics'
};
const TESTMODE = new URLSearchParams(location.search).has('test');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- geometry of the map ----------
const K = 10, LON0 = 10.45, LAT0 = 51.15, CL = Math.cos(51.2 * Math.PI / 180);
const P = (lon, lat) => [(lon - LON0) * CL * K, (LAT0 - lat) * K]; // -> [x, z]
const CITY = {}, ADJ = {}, EDGES = [];
function km(a, b) { const t = Math.PI / 180, dLa = (b.lat - a.lat) * t, dLo = (b.lon - a.lon) * t; const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLo / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(h)); }
MAP.cities.forEach(([id, name, reg, lat, lon]) => { const [x, z] = P(lon, lat); CITY[id] = { id, name, reg, lat, lon, x, z, houses: [] }; ADJ[id] = []; });
MAP.edges.forEach(([a, b], i) => { const cost = Math.max(2, Math.round(km(CITY[a], CITY[b]) / 12)); const e = { i, a, b, cost, owners: [] }; EDGES.push(e); ADJ[a].push(e); ADJ[b].push(e); });
const LAND = MAP.land[0].map(([lo, la]) => P(lo, la));
let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
LAND.forEach(([x, z]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); });
const CX = (minX + maxX) / 2, CZ = (minZ + maxZ) / 2, BW = maxX - minX, BH = maxZ - minZ;

// ---------- players (demo state) ----------
const PLAYERS = [
  { name: DE ? 'Du' : 'You', col: '#f2b33d', money: 60 },
  { name: 'Rhein AG', col: '#ff5fa2' },
  { name: 'Isar Energie', col: '#4fd6c4' },
];
const ME = 0;
const DEMO = [
  [0, ['berlin', 'potsdam', 'leipzig']],
  [1, ['koeln', 'duesseldorf', 'essen', 'dortmund']],
  [2, ['muenchen', 'augsburg', 'nuernberg']],
];
const SLOT = [10, 15, 20];
const STEP = 2; // demo: step 2 → two houses per city
const INCOME = [10, 22, 33, 44, 54, 64, 73, 82, 90, 98, 105, 112, 118, 124, 129, 134, 138, 142, 145, 148, 150];

// ---------- renderer ----------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setClearColor(0x05080b, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x05080b, 140, 320);
const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 600);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

// lights
scene.add(new THREE.HemisphereLight(0x3a5266, 0x05070a, 0.9));
const moon = new THREE.DirectionalLight(0xa8bcff, 1.5);
moon.position.set(-40, 90, -50); moon.target.position.set(CX, 0, CZ);
moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
const sc = moon.shadow.camera; sc.left = -60; sc.right = 60; sc.top = 60; sc.bottom = -60; sc.near = 10; sc.far = 260;
moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.03; moon.shadow.radius = 3;
scene.add(moon, moon.target);
const warm = new THREE.DirectionalLight(0xffc27a, 0.35); warm.position.set(60, 30, 80); scene.add(warm);

// ---------- procedural noise ----------
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y) { let s = 0, a = .5, f = 1; for (let i = 0; i < 5; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s; }
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function height(x, z) { // world → 0..1
  const lat = LAT0 - z / K; const n = fbm(x * .09 + 3.1, z * .09 + 7.7);
  const alps = sstep(48.1, 47.4, lat) * (0.55 + 0.45 * fbm(x * .2, z * .2));
  const mid = sstep(52.3, 51.2, lat) * 0.38 * n;
  return Math.min(1, 0.06 * n + mid + alps * 0.9);
}

// ---------- land texture bake ----------
const TW = 1024, TH = Math.round(TW * BH / BW);
function bakeLand() {
  const reg = document.createElement('canvas'); reg.width = TW; reg.height = TH;
  const rx = reg.getContext('2d'); const img = rx.createImageData(TW, TH); const D = img.data;
  const cl = Object.values(CITY); const rc = {}; for (const k in MAP.regions) rc[k] = new THREE.Color(MAP.regions[k].col);
  const base = new THREE.Color('#1a252d'); const tmp = new THREE.Color();
  const H = new Float32Array(TW * TH); const RID = new Uint8Array(TW * TH); const rkeys = Object.keys(MAP.regions);
  for (let py = 0; py < TH; py++) for (let px = 0; px < TW; px++) {
    const x = minX + (px + .5) / TW * BW, z = minZ + (py + .5) / TH * BH;
    let best = 1e9, br = null; for (const c of cl) { const d = (c.x - x) ** 2 + (c.z - z) ** 2; if (d < best) { best = d; br = c.reg; } }
    const h = height(x, z); const i = py * TW + px; H[i] = h; RID[i] = rkeys.indexOf(br);
    tmp.copy(base).lerp(rc[br], 0.26 + h * 0.08);
    const o = i * 4; D[o] = tmp.r * 255; D[o + 1] = tmp.g * 255; D[o + 2] = tmp.b * 255; D[o + 3] = 255;
  }
  // hillshade + contours + region borders
  for (let py = 1; py < TH - 1; py++) for (let px = 1; px < TW - 1; px++) {
    const i = py * TW + px, o = i * 4;
    const dx = H[i + 1] - H[i - 1], dy = H[i + TW] - H[i - TW];
    const shade = 1 + (-dx * 9 - dy * 7);
    let m = Math.max(.7, Math.min(1.35, shade));
    const lv = Math.floor(H[i] * 14), cont = lv !== Math.floor(H[i + 1] * 14) || lv !== Math.floor(H[i + TW] * 14);
    if (cont) m *= 1.22;
    if (RID[i] !== RID[i + 1] || RID[i] !== RID[i + TW]) m *= 1.55;
    D[o] *= m; D[o + 1] *= m; D[o + 2] *= m;
  }
  rx.putImageData(img, 0, 0);
  // final 2048 canvas
  const cv = document.createElement('canvas'); cv.width = TW * 2; cv.height = TH * 2; const x = cv.getContext('2d');
  x.imageSmoothingEnabled = true; x.drawImage(reg, 0, 0, cv.width, cv.height);
  const s = cv.width / BW; const tp = (wx, wz) => [(wx - minX) * s, (wz - minZ) * s];
  // rivers
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (const r of MAP.rivers || []) {
    const pts = r.map(([lo, la]) => tp(...P(lo, la)));
    for (const [w, a] of [[9, .12], [3.2, .55]]) { x.strokeStyle = `rgba(80,170,210,${a})`; x.lineWidth = w; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.stroke(); }
  }
  // inner coast glow
  x.save(); x.beginPath(); LAND.forEach((p, i) => i ? x.lineTo(...tp(...p)) : x.moveTo(...tp(...p))); x.closePath(); x.clip();
  x.strokeStyle = 'rgba(242,179,61,.22)'; x.lineWidth = 10; x.stroke(); x.strokeStyle = 'rgba(242,179,61,.55)'; x.lineWidth = 2.5; x.stroke(); x.restore();
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  // normal map from heights
  const nc = document.createElement('canvas'); nc.width = TW; nc.height = TH; const nx = nc.getContext('2d'); const ni = nx.createImageData(TW, TH);
  for (let py = 0; py < TH; py++) for (let px = 0; px < TW; px++) {
    const i = py * TW + px, l = H[i - (px > 0)], r = H[i + (px < TW - 1)], u = H[i - (py > 0) * TW], d = H[i + (py < TH - 1) * TW];
    // canvas y goes south (+z); texture v goes north, so flip y component
    let vx = (l - r) * 18, vy = (d - u) * 18, vz = 1; const L = Math.hypot(vx, vy, vz); vx /= L; vy /= L; vz /= L;
    const o = i * 4; ni.data[o] = (vx * .5 + .5) * 255; ni.data[o + 1] = (vy * .5 + .5) * 255; ni.data[o + 2] = (vz * .5 + .5) * 255; ni.data[o + 3] = 255;
  }
  nx.putImageData(ni, 0, 0); const ntex = new THREE.CanvasTexture(nc);
  return { tex, ntex };
}

// ---------- board ----------
const DEPTH = 1.6;
function buildBoard() {
  const { tex, ntex } = bakeLand();
  const shape = new THREE.Shape(LAND.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: .18, bevelSize: .18, bevelSegments: 2, steps: 1 });
  g.rotateX(-Math.PI / 2); g.translate(0, -DEPTH, 0);
  // remap cap UVs: u=(x-minX)/BW, v=(maxZ - z)/BH  (v=1 north)
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - minX) / BW, (maxZ - pos.getZ(i)) / BH);
  [tex, ntex].forEach(t => { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; });
  const top = new THREE.MeshStandardMaterial({ map: tex, normalMap: ntex, normalScale: new THREE.Vector2(1.2, 1.2), roughness: .82, metalness: .05 });
  const side = new THREE.MeshStandardMaterial({ color: 0x0c1216, roughness: .7, metalness: .2 });
  const land = new THREE.Mesh(g, [top, side]); land.receiveShadow = true; land.castShadow = true; scene.add(land);

  // tray (gold frame)
  const pad = 7, W = BW + pad * 2, Hh = BH + pad * 2, r = 4;
  const rr = (w, h, r, x0, y0) => { const s = new THREE.Shape(); s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); s.lineTo(x0 + w, y0 + h - r); s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h); s.lineTo(x0 + r, y0 + h); s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0); return s; };
  const outer = rr(W + 3, Hh + 3, r + 1.5, CX - W / 2 - 1.5, -CZ - Hh / 2 - 1.5);
  const hole = rr(W, Hh, r, CX - W / 2, -CZ - Hh / 2); outer.holes.push(hole);
  const fg = new THREE.ExtrudeGeometry(outer, { depth: 2.4, bevelEnabled: true, bevelThickness: .25, bevelSize: .25, bevelSegments: 3 });
  fg.rotateX(-Math.PI / 2); fg.translate(0, -2.1, 0);
  const gold = new THREE.MeshStandardMaterial({ color: 0x9a7330, metalness: 1, roughness: .32, envMapIntensity: 1.6 });
  const frame = new THREE.Mesh(fg, gold); frame.receiveShadow = true; scene.add(frame);
  // water
  const wg = new THREE.ShapeGeometry(hole, 8); wg.rotateX(-Math.PI / 2); wg.translate(0, -.55, 0);
  water.uniforms.uC.value.set(CX, CZ);
  const wm = new THREE.Mesh(wg, water); scene.add(wm);
  // table
  const tc = document.createElement('canvas'); tc.width = tc.height = 512; const t = tc.getContext('2d');
  const grd = t.createRadialGradient(256, 256, 30, 256, 256, 256); grd.addColorStop(0, '#141c22'); grd.addColorStop(1, '#05080b'); t.fillStyle = grd; t.fillRect(0, 0, 512, 512);
  const ttex = new THREE.CanvasTexture(tc); ttex.colorSpace = THREE.SRGBColorSpace;
  const table = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.MeshStandardMaterial({ map: ttex, roughness: .95 }));
  table.rotation.x = -Math.PI / 2; table.position.set(CX, -2.15, CZ); table.receiveShadow = true; scene.add(table);
}
const water = new THREE.ShaderMaterial({
  uniforms: { uT: { value: 0 }, uC: { value: new THREE.Vector2() } },
  vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform float uT; uniform vec2 uC; varying vec3 vW;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){ vec2 p=vW.xz*.35; float a=n(p+vec2(uT*.12,uT*.05)), b=n(p*2.3-vec2(uT*.09,-uT*.11));
    float w=a*.6+b*.4; vec3 c=mix(vec3(.008,.02,.03),vec3(.018,.045,.06),w);
    float s=pow(max(0.,n(vW.xz*3.1+vec2(uT*.5,uT*.3))*n(vW.xz*4.3-uT*.4)),10.)*1.6;
    float d=length(vW.xz-uC)/70.; c+=vec3(.75,.82,1.)*s*(1.-d*.6);
    gl_FragColor=vec4(c,1.);
    #include <colorspace_fragment>
  }`
});

// ---------- cities ----------
const cityGroup = new THREE.Group(); scene.add(cityGroup);
const SLOTPOS = [[-.42, .26], [.42, .26], [0, -.46]];
function slotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#1a242c'; x.beginPath(); x.arc(128, 128, 128, 0, Math.PI * 2); x.fill();
  SLOTPOS.forEach(([sx, sz], i) => {
    const px = 128 + sx * 118, py = 128 + sz * 118;
    x.fillStyle = '#0d1418'; x.beginPath(); x.arc(px, py, 40, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(242,179,61,.55)'; x.lineWidth = 3; x.stroke();
    x.fillStyle = 'rgba(227,234,238,.75)'; x.font = '800 30px Orbitron, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(SLOT[i], px, py + 1);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
let SLOT_TEX;
const plinthMat = new THREE.MeshStandardMaterial({ color: 0x2a3640, metalness: .75, roughness: .35 });
const ringGeo = new THREE.TorusGeometry(1.32, .06, 8, 48); ringGeo.rotateX(Math.PI / 2);
function buildCities() {
  SLOT_TEX = slotTexture();
  const topMat = new THREE.MeshStandardMaterial({ map: SLOT_TEX, roughness: .6, metalness: .2 });
  const pg = new THREE.CylinderGeometry(1.12, 1.25, .38, 6); pg.translate(0, .19, 0);
  const tg = new THREE.CircleGeometry(1.0, 40); tg.rotateX(-Math.PI / 2); tg.translate(0, .385, 0);
  for (const c of Object.values(CITY)) {
    const g = new THREE.Group(); g.position.set(c.x, 0, c.z);
    const p = new THREE.Mesh(pg, plinthMat); p.castShadow = true; p.receiveShadow = true; p.rotation.y = Math.PI / 6;
    const t = new THREE.Mesh(tg, topMat); t.receiveShadow = true;
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf2b33d).multiplyScalar(2.2), transparent: true, opacity: 0, depthWrite: false }));
    ring.position.y = .2; ring.visible = false;
    g.add(p, t, ring); cityGroup.add(g); c.g = g; c.ring = ring;
  }
}

// ---------- houses ----------
const houseBody = new THREE.BoxGeometry(.4, .3, .36); houseBody.translate(0, .15, 0);
const houseRoof = (() => { const s = new THREE.Shape([new THREE.Vector2(-.24, 0), new THREE.Vector2(.24, 0), new THREE.Vector2(0, .22)]); const g = new THREE.ExtrudeGeometry(s, { depth: .4, bevelEnabled: false }); g.translate(0, .3, -.2); return g; })();
const winGeo = new THREE.PlaneGeometry(.12, .1); winGeo.translate(0, .14, .181);
const winMatOff = new THREE.MeshBasicMaterial({ color: 0x2a2416 });
function makeHouse(pl) {
  const col = new THREE.Color(PLAYERS[pl].col);
  const g = new THREE.Group();
  const b = new THREE.Mesh(houseBody, new THREE.MeshStandardMaterial({ color: col, roughness: .45, metalness: .1, emissive: col, emissiveIntensity: .12 }));
  const r = new THREE.Mesh(houseRoof, new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(.55), roughness: .5 }));
  const w = new THREE.Mesh(winGeo, new THREE.MeshBasicMaterial({ color: 0x2a2416 }));
  [b, r].forEach(m => { m.castShadow = true; m.receiveShadow = true; });
  g.add(b, r, w); g.userData = { win: w, body: b }; g.scale.setScalar(1.5);
  return g;
}

// ---------- ground connections (dashed ribbons) ----------
let groundMesh, hlAttr;
const groundMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uT: { value: 0 } },
  vertexShader: `attribute float aD; attribute float aHL; varying float vD; varying float vHL; varying float vS;
    attribute float aS; void main(){ vD=aD; vHL=aHL; vS=aS; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uT; varying float vD; varying float vHL; varying float vS;
    void main(){ float dash=step(.45,fract(vD*1.6-(vHL>.5?uT*1.8:0.)));
      float edge=1.-smoothstep(.55,1.,abs(vS));
      vec3 base=vec3(.30,.40,.47); vec3 gold=vec3(1.9,1.35,.45);
      vec3 c=mix(base,gold,vHL); float a=mix(.55*dash,.95*max(dash,.35),vHL)*edge;
      gl_FragColor=vec4(c,a);
      #include <colorspace_fragment>
    }`
});
function buildGround() {
  const P3 = [], D = [], HL = [], S = [], I = [];
  EDGES.forEach((e, k) => {
    const A = CITY[e.a], B = CITY[e.b]; const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz); const ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
    const w = .11, t0 = 1.35, t1 = L - 1.35; const base = P3.length / 3;
    for (const [t, s] of [[t0, -1], [t0, 1], [t1, -1], [t1, 1]]) { P3.push(A.x + ux * t + nx * w * s, .03, A.z + uz * t + nz * w * s); D.push(t); HL.push(0); S.push(s); }
    I.push(base, base + 1, base + 2, base + 1, base + 3, base + 2); e.gv = base;
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 1)); hlAttr = new THREE.Float32BufferAttribute(HL, 1); g.setAttribute('aHL', hlAttr);
  g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 1)); g.setIndex(I);
  groundMesh = new THREE.Mesh(g, groundMat); groundMesh.renderOrder = 2; scene.add(groundMesh);
}
function setHL(edgeSet) { EDGES.forEach(e => { const v = edgeSet.has(e) ? 1 : 0; for (let j = 0; j < 4; j++) hlAttr.setX(e.gv + j, v); }); hlAttr.needsUpdate = true; }

// ---------- pylons + cables ----------
const pylonGeo = (() => {
  const parts = []; const m = new THREE.Matrix4();
  const leg = new THREE.BoxGeometry(.05, 1.0, .05);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const g = leg.clone(); const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(sz * .1, 0, -sx * .1)); m.compose(new THREE.Vector3(sx * .07, .5, sz * .07), q, new THREE.Vector3(1, 1, 1)); g.applyMatrix4(m); parts.push(g); }
  const arm = new THREE.BoxGeometry(.7, .05, .06); arm.translate(0, .86, 0); parts.push(arm);
  const arm2 = new THREE.BoxGeometry(.44, .04, .05); arm2.translate(0, .66, 0); parts.push(arm2);
  const tip = new THREE.ConeGeometry(.05, .18, 4); tip.translate(0, 1.06, 0); parts.push(tip);
  return mergeGeometries(parts.map(p => p.index ? p.toNonIndexed() : p));
})();
const pylons = new THREE.InstancedMesh(pylonGeo, new THREE.MeshStandardMaterial({ color: 0xb7c3cc, metalness: .8, roughness: .3 }), 1200);
pylons.castShadow = true; pylons.frustumCulled = false; pylons.count = 0; scene.add(pylons);
const PS = 1.45; const PYL = []; // {pos, yaw, s}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
function writePylon(i) { const p = PYL[i]; _q.setFromAxisAngle(_up, p.yaw); _s.set(PS, PS * Math.max(.001, p.s), PS); _m.compose(p.pos, _q, _s); pylons.setMatrixAt(i, _m); pylons.instanceMatrix.needsUpdate = true; }

function cableMat(col) {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uP: { value: 0 }, uC: { value: new THREE.Color(col) }, uG: { value: 1 }, uL: { value: 10 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uT,uP,uG,uL; uniform vec3 uC; varying vec2 vUv;
      void main(){ if(vUv.x>uP) discard; float d=vUv.x*uL;
        float pulse=pow(max(0.,sin(d*1.1-uT*5.)),18.)*1.8;
        float head=smoothstep(uP-.04,uP,vUv.x)*step(uP,.999)*4.;
        vec3 c=uC*(.55+.5*uG)+uC*pulse*uG+vec3(1.,.9,.6)*head;
        gl_FragColor=vec4(c,1.);
        #include <colorspace_fragment>
      }`
  });
}
const LINES = []; // per built connection
function lineOffset(e) { return (e.owners.length - 1) * .62 - .31 * (e.owners.length > 1); }
function buildLine(e, pl) {
  // returns object for animation
  e.owners.push(pl);
  const lane = e.owners.length - 1; const off = [0, .6, -.6][lane] || 0;
  const A = CITY[e.a], B = CITY[e.b]; const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz); const ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
  const yaw = Math.atan2(-uz, ux); // arm perpendicular to line... arm is along local x; rotate so x aligns with normal
  const n = Math.max(1, Math.round((L - 2.6) / 2.4)); const pts = [];
  const start = PYL.length;
  for (let k = 0; k <= n; k++) {
    const t = 1.3 + (L - 2.6) * (k / n);
    const pos = new THREE.Vector3(A.x + ux * t + nx * off, 0, A.z + uz * t + nz * off);
    PYL.push({ pos, yaw: yaw + Math.PI / 2, s: 0 }); pts.push(pos);
  }
  pylons.count = PYL.length; for (let i = start; i < PYL.length; i++) writePylon(i);
  // two wires
  const wires = [];
  for (const side of [-1, 1]) {
    const path = [];
    const a0 = new THREE.Vector3(A.x + ux * .95 + nx * (off + side * .14), .42, A.z + uz * .95 + nz * (off + side * .14));
    path.push(a0);
    for (let k = 0; k < pts.length; k++) {
      const p = pts[k]; const att = new THREE.Vector3(p.x + nx * side * .32 * PS, .85 * PS, p.z + nz * side * .32 * PS);
      const prev = path[path.length - 1];
      for (let j = 1; j < 6; j++) { const t = j / 6; const q = prev.clone().lerp(att, t); q.y -= Math.sin(Math.PI * t) * .24; path.push(q); }
      path.push(att);
    }
    const b0 = new THREE.Vector3(B.x - ux * .95 + nx * (off + side * .14), .42, B.z - uz * .95 + nz * (off + side * .14));
    const prev = path[path.length - 1]; for (let j = 1; j < 6; j++) { const t = j / 6; const q = prev.clone().lerp(b0, t); q.y -= Math.sin(Math.PI * t) * .12; path.push(q); }
    path.push(b0);
    const curve = new THREE.CatmullRomCurve3(path, false, 'centripetal');
    const geo = new THREE.TubeGeometry(curve, path.length * 3, .028, 5, false);
    const mat = cableMat(new THREE.Color(PLAYERS[pl].col).multiplyScalar(1.25)); mat.uniforms.uL.value = L;
    const m = new THREE.Mesh(geo, mat); scene.add(m); wires.push(m);
  }
  const ln = { e, pl, wires, pyl: [start, PYL.length], from: e.a };
  LINES.push(ln); return ln;
}

// ---------- particles / fx ----------
const FX = [];
const ringFxGeo = new THREE.RingGeometry(.6, .9, 48); ringFxGeo.rotateX(-Math.PI / 2);
function shockwave(x, z, col) {
  const m = new THREE.Mesh(ringFxGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(2.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.position.set(x, .42, z); scene.add(m);
  FX.push({ t: 0, dur: .9, up(k) { m.scale.setScalar(1 + k * 3.2); m.material.opacity = (1 - k) ** 2; }, end() { scene.remove(m); m.material.dispose(); } });
  // sparks
  const N = 40, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3), v = [];
  for (let i = 0; i < N; i++) { p[i * 3] = x; p[i * 3 + 1] = .5; p[i * 3 + 2] = z; const a = Math.random() * 6.283, s = 1.5 + Math.random() * 3; v.push([Math.cos(a) * s, 2 + Math.random() * 3, Math.sin(a) * s]); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pm = new THREE.PointsMaterial({ color: new THREE.Color(col).multiplyScalar(3), size: .14, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, pm); scene.add(pts); let last = 0;
  FX.push({ t: 0, dur: 1.1, up(k, dt) { for (let i = 0; i < N; i++) { v[i][1] -= 9 * dt; p[i * 3] += v[i][0] * dt; p[i * 3 + 1] = Math.max(.05, p[i * 3 + 1] + v[i][1] * dt); p[i * 3 + 2] += v[i][2] * dt; } g.attributes.position.needsUpdate = true; pm.opacity = 1 - k; }, end() { scene.remove(pts); g.dispose(); pm.dispose(); } });
}

// ---------- tween queue ----------
const TW_ = [];
const ease = { out: k => 1 - (1 - k) ** 3, inout: k => k < .5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2, bounce: k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; }, back: k => { const c = 1.9; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; } };
function tween(dur, fn, delay = 0, done) { return new Promise(res => TW_.push({ t: -delay, dur: reduced ? Math.min(dur, .15) : dur, fn, done: () => { done && done(); res(); } })); }
const wait = s => tween(s, () => { });

// ---------- build animations ----------
async function animLine(ln, speed = 1) {
  const [s0, s1] = ln.pyl; const n = s1 - s0; const reverse = ln.from !== ln.e.a;
  const per = .14 / speed;
  const tasks = [];
  for (let k = 0; k < n; k++) { const i = reverse ? s1 - 1 - k : s0 + k; tasks.push(tween(.45 / speed, q => { PYL[i].s = ease.back(q); writePylon(i); }, k * per)); }
  ln.wires.forEach(w => { if (reverse) { w.geometry.attributes.uv.array.forEach((v, j, a) => { if (j % 2 === 0) a[j] = 1 - v; }); w.geometry.attributes.uv.needsUpdate = true; } });
  tasks.push(tween(n * per + .5 / speed, q => ln.wires.forEach(w => w.material.uniforms.uP.value = ease.inout(q) * 1.001), .15 / speed));
  await Promise.all(tasks);
}
async function dropHouse(cid, pl, speed = 1) {
  const c = CITY[cid]; const slot = c.houses.length; c.houses.push(pl);
  const h = makeHouse(pl); const [sx, sz] = SLOTPOS[slot]; const y0 = .39;
  h.position.set(sx, 9, sz); h.rotation.y = (Math.random() - .5) * .3; c.g.add(h); c.hm = c.hm || []; c.hm.push(h);
  await tween(.7 / speed, q => { h.position.y = y0 + (9 - y0) * (1 - ease.bounce(q)); });
  shockwave(c.x + sx, c.z + sz, PLAYERS[pl].col);
  pulseCity(c);
}
function pulseCity(c) { const g = c.g; tween(.35, q => { const s = 1 + Math.sin(q * Math.PI) * .07; g.scale.set(s, 1 - Math.sin(q * Math.PI) * .05, s); }); }

// ---------- routing ----------
function network(pl) { return Object.values(CITY).filter(c => c.houses.includes(pl)).map(c => c.id); }
function dijkstra(pl) {
  const src = network(pl); const dist = {}, prev = {}; Object.keys(CITY).forEach(k => dist[k] = Infinity);
  const Q = new Set(Object.keys(CITY)); src.forEach(s => dist[s] = 0);
  while (Q.size) { let u = null, b = Infinity; for (const k of Q) if (dist[k] < b) { b = dist[k]; u = k; } if (u === null) break; Q.delete(u);
    for (const e of ADJ[u]) { const v = e.a === u ? e.b : e.a; const w = e.owners.includes(pl) ? 0 : e.cost; if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = [u, e]; } } }
  return { dist, prev, src };
}
function quote(cid) {
  const c = CITY[cid]; const pl = ME; const R = dijkstra(pl);
  if (c.houses.includes(pl)) return { ok: false, why: T.own };
  if (c.houses.length >= STEP) return { ok: false, why: T.full };
  const path = []; let v = cid; while (R.prev[v]) { const [u, e] = R.prev[v]; if (!e.owners.includes(pl)) path.unshift({ e, from: u }); v = u; }
  if (R.dist[cid] === Infinity) return { ok: false, why: T.noroute };
  const line = R.dist[cid], house = SLOT[c.houses.length], total = line + house;
  return { ok: total <= PLAYERS[pl].money, why: total > PLAYERS[pl].money ? T.poor : '', line, house, total, path };
}

// ---------- DOM HUD ----------
const $ = s => document.querySelector(s);
const labels = $('#labels'); const LBL = [];
for (const c of Object.values(CITY)) { const d = document.createElement('div'); d.className = 'lb city'; d.textContent = c.name; labels.appendChild(d); LBL.push({ el: d, c, pri: 2, w3: new THREE.Vector3(c.x, 0, c.z + 1.75) }); }
for (const e of EDGES) { const d = document.createElement('div'); d.className = 'lb cost'; d.textContent = e.cost; labels.appendChild(d); const A = CITY[e.a], B = CITY[e.b]; LBL.push({ el: d, e, pri: 1, w3: new THREE.Vector3((A.x + B.x) / 2, .1, (A.z + B.z) / 2) }); }
const moneyEl = $('#money'); let moneyShown = PLAYERS[ME].money;
function setMoney(v) { const a = moneyShown; tween(.8, q => { moneyShown = Math.round(a + (v - a) * ease.out(q)); moneyEl.textContent = moneyShown; }); }
moneyEl.textContent = moneyShown;
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), ms); }
function floatText(txt, w3, cls) { const d = document.createElement('div'); d.className = 'float ' + (cls || ''); d.textContent = txt; labels.appendChild(d); const v = w3.clone(); tween(1.4, q => { const p = v.clone(); p.y += q * 3; p.project(camera); d.style.transform = `translate(${(p.x * .5 + .5) * VW}px,${(-p.y * .5 + .5) * VH}px) translate(-50%,-50%)`; d.style.opacity = q < .7 ? 1 : (1 - q) / .3; }).then(() => d.remove()); }

let SEL = null, BUSY = false;
const card = $('#card');
function select(cid) {
  if (BUSY) return;
  SEL = cid; const q = quote(cid); const c = CITY[cid];
  $('#cName').textContent = c.name;
  if (q.line === undefined) { $('#cRows').innerHTML = `<div class="why">${q.why}</div>`; setHL(new Set()); }
  else {
    $('#cRows').innerHTML = `<div class="row"><span>${T.line}</span><b>${q.line} €</b></div><div class="row"><span>${T.house} (${q.house})</span><b>${q.house} €</b></div><div class="row tot"><span>${T.total}</span><b>${q.total} €</b></div>${q.ok ? '' : `<div class="why">${q.why}</div>`}`;
    setHL(new Set(q.path.map(p => p.e)));
  }
  const b = $('#cBuild'); b.disabled = !q.ok; b.textContent = T.build;
  card.classList.add('on'); layoutHUD(); markReachable();
}
function closeCard() { SEL = null; card.classList.remove('on'); setHL(new Set()); markReachable(); }
$('#cX').onclick = closeCard;
$('#cBuild').onclick = async () => {
  const q = quote(SEL); if (!q.ok || BUSY) return; const cid = SEL; BUSY = true; closeCard(); hideRings();
  PLAYERS[ME].money -= q.total; setMoney(PLAYERS[ME].money);
  floatText(`−${q.total} €`, new THREE.Vector3(CITY[cid].x, 1.5, CITY[cid].z), 'neg');
  focusOn(CITY[cid]);
  for (const st of q.path) { const ln = buildLine(st.e, ME); ln.from = st.from; await animLine(ln, 1); }
  await dropHouse(cid, ME);
  BUSY = false; markReachable();
};
function hideRings() { Object.values(CITY).forEach(c => { c.ring.visible = false; }); }
function markReachable() {
  if (BUSY) return hideRings();
  const R = dijkstra(ME);
  Object.values(CITY).forEach(c => { const ok = !c.houses.includes(ME) && c.houses.length < STEP && R.dist[c.id] + SLOT[c.houses.length] <= PLAYERS[ME].money; c.ring.visible = ok || c.id === SEL; c.reach = ok; });
}

// power delivery: light wave through each network
$('#bPower').onclick = async () => {
  if (BUSY) return; BUSY = true; closeCard(); hideRings();
  const per = PLAYERS.map((p, i) => network(i));
  const waves = [];
  PLAYERS.forEach((p, pl) => {
    // BFS order along own lines
    const set = new Set(per[pl]); if (!set.size) return; const order = [per[pl][0]], seen = new Set(order);
    for (let i = 0; i < order.length; i++) for (const e of ADJ[order[i]]) { if (!e.owners.includes(pl)) continue; const v = e.a === order[i] ? e.b : e.a; if (set.has(v) && !seen.has(v)) { seen.add(v); order.push(v); } }
    per[pl].forEach(v => { if (!seen.has(v)) order.push(v); });
    order.forEach((cid, k) => waves.push(wait(.25 + k * .28).then(() => lightCity(CITY[cid], pl))));
    LINES.filter(l => l.pl === pl).forEach(l => l.wires.forEach(w => tween(2.6, q => { w.material.uniforms.uG.value = 1 + Math.sin(q * Math.PI) * 2.2; }, .2)));
  });
  bloomBoost();
  await Promise.all(waves); await wait(.4);
  const n = per[ME].length, inc = INCOME[Math.min(n, INCOME.length - 1)];
  PLAYERS[ME].money += inc; setMoney(PLAYERS[ME].money);
  floatText(`+${inc} €`, new THREE.Vector3(CITY[per[ME][0]].x, 1.5, CITY[per[ME][0]].z), 'pos');
  toast(`${T.paid}: ${n} ${T.cities} → +${inc} €`);
  await wait(.5); BUSY = false; markReachable();
};
function lightCity(c, pl) {
  (c.hm || []).forEach((h, i) => { if (c.houses[i] !== pl) return; const w = h.userData.win; const col = new THREE.Color(0xffd27a);
    tween(1.6, q => { const k = q < .25 ? q / .25 : 1 - (q - .25) / .75 * .55; w.material.color.copy(col).multiplyScalar(.3 + k * 4); h.userData.body.material.emissiveIntensity = .12 + k * .9; }); });
  shockwave(c.x, c.z, PLAYERS[pl].col);
}
let bloomPass, bloomBase = .62;
function bloomBoost() { if (!bloomPass) return; tween(2.4, q => { bloomPass.strength = bloomBase + Math.sin(q * Math.PI) * .45; }); }

// ---------- camera ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = .09; controls.screenSpacePanning = false;
controls.minPolarAngle = .18; controls.maxPolarAngle = 1.05; controls.minDistance = 14; controls.maxDistance = 190;
controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
controls.zoomToCursor = true;
controls.addEventListener('change', () => { const t = controls.target; t.x = Math.max(minX - 2, Math.min(maxX + 2, t.x)); t.z = Math.max(minZ - 2, Math.min(maxZ + 2, t.z)); t.y = 0; });
let VW = 1, VH = 1, SAFE = { t: 0, b: 0 };
function fitPose(polar) {
  if (polar === undefined) polar = VW > VH ? .92 : .8;
  const corners = [[minX, minZ], [maxX, minZ], [minX, maxZ], [maxX, maxZ], [CX, minZ - 1], [CX, maxZ + 1], [minX, CZ], [maxX, CZ]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const topF = 1 - 2 * (SAFE.t / VH), botF = -1 + 2 * (SAFE.b / VH), want = (topF + botF) / 2;
  const tgt = new THREE.Vector3(CX, 0, CZ); const cam = camera.clone();
  const place = d => { cam.position.set(tgt.x, Math.cos(polar) * d, tgt.z + Math.sin(polar) * d); cam.lookAt(tgt); cam.updateMatrixWorld(); };
  const span = () => { let a = 1e9, b = -1e9, xm = 0; for (const c of corners) { const p = c.clone().project(cam); a = Math.min(a, p.y); b = Math.max(b, p.y); xm = Math.max(xm, Math.abs(p.x)); } return [a, b, xm]; };
  let d = 120;
  for (let it = 0; it < 8; it++) {
    let lo = 15, hi = 500;
    for (let k = 0; k < 28; k++) { d = (lo + hi) / 2; place(d); const [a, b, xm] = span(); if (xm < .95 && b < topF - .01 && a > botF + .01) hi = d; else lo = d; }
    d = hi; place(d); const [a, b] = span(); const mid = (a + b) / 2;
    tgt.z += (want - mid) * d * Math.tan(camera.fov * Math.PI / 360) * .7; // content too low → move target south
  }
  place(d); return { tgt: tgt.clone(), pos: cam.position.clone() };
}
async function flyTo(pose, dur = 1.2) {
  const p0 = camera.position.clone(), t0 = controls.target.clone(); controls.enabled = false;
  await tween(dur, q => { const k = ease.inout(q); camera.position.lerpVectors(p0, pose.pos, k); controls.target.lerpVectors(t0, pose.tgt, k); camera.lookAt(controls.target); });
  controls.enabled = true; controls.update();
}
function focusOn(c) {
  const dist = Math.min(camera.position.distanceTo(controls.target), 58), pol = .82; const off = new THREE.Vector3(0, Math.cos(pol) * dist, Math.sin(pol) * dist);
  const tgt = new THREE.Vector3(c.x, 0, c.z); flyTo({ tgt, pos: tgt.clone().add(off) }, .9);
}
$('#bView').onclick = () => flyTo(fitPose(), 1.0);

// quality
let QUAL = localStorage.getItem('gm2-3d-q') || 'hi';
let composer, rt;
function setupComposer() {
  const dpr = Math.min(devicePixelRatio || 1, QUAL === 'hi' ? 2 : 1.5);
  renderer.setPixelRatio(dpr); renderer.setSize(VW, VH, false);
  rt && rt.dispose(); composer && composer.dispose && composer.dispose();
  rt = new THREE.WebGLRenderTarget(VW * dpr, VH * dpr, { type: THREE.HalfFloatType, samples: QUAL === 'hi' ? 4 : 0 });
  composer = new EffectComposer(renderer, rt); composer.setPixelRatio(dpr); composer.setSize(VW, VH);
  composer.addPass(new RenderPass(scene, camera));
  const bs = QUAL === 'hi' ? 1 : .5;
  bloomPass = new UnrealBloomPass(new THREE.Vector2(VW * bs, VH * bs), bloomBase, .55, .86); composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = QUAL === 'hi'; moon.castShadow = QUAL === 'hi';
  scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); });
  $('#bQ').textContent = `${T.q}: ${QUAL === 'hi' ? T.hi : T.lo}`;
}
$('#bQ').onclick = () => { QUAL = QUAL === 'hi' ? 'lo' : 'hi'; try { localStorage.setItem('gm2-3d-q', QUAL); } catch (e) { } setupComposer(); };

// ---------- layout ----------
function layoutHUD() {
  const top = $('#top').getBoundingClientRect(), bot = $('#bot').getBoundingClientRect();
  SAFE.t = top.bottom + 6; SAFE.b = VH - bot.top + 6;
  if (card.classList.contains('on') && !matchMedia('(orientation: landscape) and (max-height: 500px)').matches) SAFE.b = VH - card.getBoundingClientRect().top + 6;
}
function resize() {
  VW = innerWidth; VH = innerHeight; camera.aspect = VW / VH; camera.updateProjectionMatrix(); layoutHUD(); setupComposer();
}
addEventListener('resize', () => { resize(); if (!BUSY && !introRunning) { const p = fitPose(); camera.position.copy(p.pos); controls.target.copy(p.tgt); controls.update(); } });

// ---------- picking ----------
let pd = null;
renderer.domElement.addEventListener('pointerdown', e => { pd = { x: e.clientX, y: e.clientY, t: performance.now() }; if (introRunning) skipIntro(); });
renderer.domElement.addEventListener('pointerup', e => {
  if (!pd) return; const moved = Math.hypot(e.clientX - pd.x, e.clientY - pd.y), dt = performance.now() - pd.t; pd = null;
  if (moved > 8 || dt > 450 || BUSY) return;
  let best = null, bd = 40; const v = new THREE.Vector3();
  for (const c of Object.values(CITY)) { v.set(c.x, .4, c.z).project(camera); const sx = (v.x * .5 + .5) * VW, sy = (-v.y * .5 + .5) * VH; const d = Math.hypot(sx - e.clientX, sy - e.clientY); if (d < bd) { bd = d; best = c; } }
  if (best) select(best.id); else closeCard();
});

// ---------- labels with collision culling ----------
const _p = new THREE.Vector3();
function updateLabels() {
  const camD = camera.position.distanceTo(controls.target); const showCost = camD < 75; const pathEdges = new Set();
  if (SEL) { const q = quote(SEL); (q.path || []).forEach(p => pathEdges.add(p.e)); }
  const placed = [...document.querySelectorAll('.brand,.money,#bot button,#card.on,#toast.on')].map(e => { const r = e.getBoundingClientRect(); return [r.left - 2, r.top - 2, r.right + 2, r.bottom + 2]; });
  const items = LBL.map(l => { _p.copy(l.w3).project(camera); const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1; return { l, x: (_p.x * .5 + .5) * VW, y: (-_p.y * .5 + .5) * VH, vis, pri: l.pri + (l.c && (l.c.houses.length || l.c.reach || l.c.id === SEL) ? 2 : 0) + (l.e && pathEdges.has(l.e) ? 3 : 0) }; });
  items.sort((a, b) => b.pri - a.pri);
  for (const it of items) {
    const { l } = it; let show = it.vis && (l.c || showCost || pathEdges.has(l.e));
        if (show) { const w = l.w || (l.w = l.el.offsetWidth), h = l.h || (l.h = l.el.offsetHeight); const r = [it.x - w / 2 - 2, it.y - h / 2 - 1, it.x + w / 2 + 2, it.y + h / 2 + 1]; if (r[0] < 4 || r[2] > VW - 4) show = false; else if (placed.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) show = false; else placed.push(r); }
    l.el.style.visibility = show ? 'visible' : 'hidden';
    if (show) { l.el.style.transform = `translate(${it.x}px,${it.y}px) translate(-50%,-50%)`; l.el.classList.toggle('hl', !!((l.e && pathEdges.has(l.e)) || (l.c && l.c.id === SEL))); }
  }
}

// ---------- intro ----------
let introRunning = true, introSkip = false;
function skipIntro() { introSkip = true; TW_.forEach(t => t.t = t.dur); }
async function intro() {
  const pose = fitPose();
  camera.position.set(CX, 230, CZ + 30); controls.target.set(CX, 0, CZ); camera.lookAt(controls.target);
  cityGroup.children.forEach(g => g.scale.set(1, .001, 1));
  if (!reduced) await wait(.15);
  const ord = Object.values(CITY).sort((a, b) => a.z - b.z);
  ord.forEach((c, i) => tween(.5, q => c.g.scale.set(1, Math.max(.001, ease.back(q)), 1), .3 + i * .025));
  await flyTo(pose, reduced ? .2 : 2.4);
  // existing networks assemble
  for (const [pl, list] of DEMO) {
    const jobs = [];
    for (let i = 0; i < list.length; i++) {
      jobs.push(dropHouse(list[i], pl, 1.6));
      if (i) { const e = EDGES.find(e => (e.a === list[i] && e.b === list[i - 1]) || (e.b === list[i] && e.a === list[i - 1])) || shortestEdge(list[i], pl); if (e) { const ln = buildLine(e, pl); ln.from = list[i - 1]; jobs.push(animLine(ln, 2.2)); } }
    }
    await wait(introSkip ? 0 : .35);
  }
  await wait(.9);
  introRunning = false; markReachable(); toast(T.start, 3600);
}
function shortestEdge(cid, pl) { return ADJ[cid].find(e => CITY[e.a === cid ? e.b : e.a].houses.includes(pl)); }

// ---------- loop ----------
const clock = new THREE.Clock(); let fpsN = 0, fpsT = 0, autoChecked = false;
function loop() {
  const dt = Math.min(TESTMODE ? 1 : .05, clock.getDelta()); const t = clock.elapsedTime;
  for (let i = TW_.length - 1; i >= 0; i--) { const w = TW_[i]; w.t += dt; if (w.t < 0) continue; const k = Math.min(1, w.t / w.dur); w.fn(k); if (k >= 1) { TW_.splice(i, 1); w.done(); } }
  for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i]; f.t += dt; const k = Math.min(1, f.t / f.dur); f.up(k, dt); if (k >= 1) { FX.splice(i, 1); f.end(); } }
  water.uniforms.uT.value = t; groundMat.uniforms.uT.value = t;
  LINES.forEach(l => l.wires.forEach(w => w.material.uniforms.uT.value = t));
  Object.values(CITY).forEach(c => { if (c.ring.visible) { const s = c.id === SEL ? 1.15 : 1 + .06 * Math.sin(t * 3); c.ring.scale.setScalar(s); c.ring.material.opacity = c.id === SEL ? 1 : .32 + .2 * Math.sin(t * 3); } });
  if (controls.enabled) controls.update();
  composer.render(dt); updateLabels();
  // auto quality: measure after intro
  fpsN++; fpsT += dt; if (fpsT > 1) { const fps = fpsN / fpsT; $('#fps') && ($('#fps').textContent = fps.toFixed(0) + ' fps'); if (!introRunning && !autoChecked && QUAL === 'hi' && !localStorage.getItem('gm2-3d-q') && !TESTMODE && fps < 38) { autoChecked = true; QUAL = 'lo'; setupComposer(); } fpsN = 0; fpsT = 0; }
  requestAnimationFrame(loop);
}

// ---------- boot ----------
$('#bPower').textContent = T.power; $('#bView').textContent = T.view;
if (new URLSearchParams(location.search).has('debug')) $('#fps').hidden = false;
buildBoard(); buildCities(); buildGround();
document.fonts && document.fonts.ready.then(() => { const t = slotTexture(); SLOT_TEX.image = t.image; SLOT_TEX.needsUpdate = true; LBL.forEach(l => { l.w = l.h = 0; }); });
resize(); intro(); loop();
window.__gm3d = { select, CITY, quote, build: () => $('#cBuild').onclick(), power: () => $('#bPower').onclick(), state: () => ({ introRunning, BUSY, money: PLAYERS[ME].money }) };
