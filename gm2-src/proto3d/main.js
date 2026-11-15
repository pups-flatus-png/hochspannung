// Grid Master 2 – 3D board prototype v2: Deutschland als freistehendes Relief-Modell
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices, mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import MAP from './de.js';
import GEO from './geo_de.json';
import { createSkylines } from './skyline.js';
import { createMarket, RES, ORDER, MARKET_W } from './market.js';
let SKY = null;

// ---------- i18n / flags ----------
const DE = (navigator.language || 'de').toLowerCase().startsWith('de');
const T = DE ? {
  power: 'Strom liefern', view: 'Ansicht', hi: 'Hoch', lo: 'Sparsam', build: 'Bauen', line: 'Leitung', house: 'Haus',
  total: 'Gesamt', full: 'Belegt', own: 'Schon deine Stadt', poor: 'Zu wenig Geld', noroute: 'Keine Verbindung',
  start: 'Tippe auf eine leuchtende Stadt, um zu bauen.', paid: 'Einnahmen', cities: 'Städte', q: 'Grafik'
} : {
  power: 'Deliver power', view: 'View', hi: 'High', lo: 'Saver', build: 'Build', line: 'Line', house: 'House',
  total: 'Total', full: 'Full', own: 'Already yours', poor: 'Not enough money', noroute: 'No connection',
  start: 'Tap a glowing city to build.', paid: 'Income', cities: 'cities', q: 'Graphics'
};
const QS = new URLSearchParams(location.search);
const TESTMODE = QS.has('test'); const FDT = +QS.get('fdt') || 0; let SIMT = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- projection & map data ----------
const K = 10, LON0 = 10.45, LAT0 = 51.15, CL = Math.cos(51.2 * Math.PI / 180);
const P = (lon, lat) => [(lon - LON0) * CL * K, (LAT0 - lat) * K];
const CITY = {}, ADJ = {}, EDGES = [];
function km(a, b) { const t = Math.PI / 180, dLa = (b.lat - a.lat) * t, dLo = (b.lon - a.lon) * t; const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLo / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(h)); }
MAP.cities.forEach(([id, name, reg, lat, lon]) => { const [x, z] = P(lon, lat); CITY[id] = { id, name, reg, lat, lon, x, z, houses: [], hm: [] }; ADJ[id] = []; });
MAP.edges.forEach(([a, b], i) => { const cost = Math.max(2, Math.round(km(CITY[a], CITY[b]) / 12)); const e = { i, a, b, cost, owners: [] }; EDGES.push(e); ADJ[a].push(e); ADJ[b].push(e); });
const ringArea = r => { let s = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; };
const RINGS = GEO.land.map(r => r.map(([lo, la]) => P(lo, la))).filter(r => Math.abs(ringArea(r)) > 0.15);
RINGS.sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)));
const MAIN = RINGS[0];
let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
RINGS.flat().forEach(([x, z]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); });
const CX = (minX + maxX) / 2, CZ = (minZ + maxZ) / 2, BW = maxX - minX, BH = maxZ - minZ;

// ---------- terrain height ----------
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, o = 5) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s; }
function ridged(x, y) { let s = 0, a = .5, f = 1; for (let i = 0; i < 5; i++) { const n = 1 - Math.abs(vnoise(x * f, y * f) * 2 - 1); s += a * n * n; f *= 2.1; a *= .5; } return s; }
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// Mittelgebirge: [lat, lon, Halbachse lat, Halbachse lon, Drehung°, Höhe]
const RANGES = [[51.76, 10.62, .13, .33, 0, .62], [50.62, 10.8, .1, .55, -38, .55], [50.55, 13.0, .12, .85, 22, .58], [49.0, 13.15, .22, .55, 38, .6],
  [50.03, 11.85, .14, .2, 0, .5], [48.2, 8.15, .72, .2, 8, .78], [48.43, 9.4, .14, .85, 28, .45], [50.45, 9.95, .14, .2, 0, .42], [50.5, 9.22, .14, .17, 0, .36],
  [50.24, 8.3, .1, .42, 25, .36], [49.85, 7.2, .11, .55, 25, .4], [50.3, 6.75, .28, .38, 0, .42], [51.18, 8.2, .3, .52, 0, .48], [50.02, 9.42, .18, .22, 0, .3],
  [49.62, 8.88, .18, .18, 0, .32], [49.3, 7.82, .24, .2, 0, .36], [51.45, 9.6, .2, .3, 0, .3], [50.4, 12.3, .2, .4, 0, .25]];
const HMAX = 1.5;
function rawH(x, z) {
  const lat = LAT0 - z / K, lon = LON0 + x / (CL * K);
  let h = 0.05 * fbm(x * .12 + 3.1, z * .12 + 7.7, 4) + 0.07 * sstep(53.2, 52.2, lat) * fbm(x * .3 + 9, z * .3, 4);
  for (const [la, lo, ra, ro, deg, amp] of RANGES) {
    const dla = (lat - la), dlo = (lon - lo) * CL, c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180);
    const u = (dlo * c - dla * s) / (ro * CL), v = (dlo * s + dla * c) / ra; const q = u * u + v * v; if (q > 9) continue;
    h += amp * Math.exp(-q * 1.6) * (0.65 + 0.55 * ridged(x * .35 + amp * 10, z * .35));
  }
  const alps = sstep(47.95, 47.45, lat); if (alps > 0) h += alps * (0.7 + 0.9 * ridged(x * .22 + 5, z * .22 + 9)) * sstep(9.6, 10.1, lon);
  const alpsW = sstep(47.85, 47.5, lat) * (1 - sstep(9.6, 10.1, lon)); if (alpsW > 0) h += alpsW * 0.5 * ridged(x * .3, z * .3);
  return Math.min(1.25, h);
}
// coastline distance with segment buckets
const CELL = 3, BUCK = new Map();
const SEGS = []; RINGS.forEach(r => r.forEach((p, i) => SEGS.push([p, r[(i + 1) % r.length]])));
SEGS.forEach((s, i) => { const x0 = Math.floor((Math.min(s[0][0], s[1][0]) - CELL) / CELL), x1 = Math.floor((Math.max(s[0][0], s[1][0]) + CELL) / CELL), z0 = Math.floor((Math.min(s[0][1], s[1][1]) - CELL) / CELL), z1 = Math.floor((Math.max(s[0][1], s[1][1]) + CELL) / CELL); for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) { const k = a * 10007 + b; let l = BUCK.get(k); if (!l) BUCK.set(k, l = []); l.push(i); } });
function coastDist(x, z) { const l = BUCK.get(Math.floor(x / CELL) * 10007 + Math.floor(z / CELL)); if (!l) return CELL; let d = CELL * CELL; for (const i of l) { const [a, b] = SEGS[i]; const dx = b[0] - a[0], dz = b[1] - a[1]; const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); const ex = a[0] + dx * t - x, ez = a[1] + dz * t - z; d = Math.min(d, ex * ex + ez * ez); } return Math.sqrt(d); }
const LIFT = 0.06;
function hAt(x, z) { return LIFT + rawH(x, z) * HMAX * sstep(0, 2.2, coastDist(x, z)); }

// ---------- players / demo ----------
const PLAYERS = [{ name: DE ? 'Du' : 'You', col: '#f2b33d', money: 60 }, { name: 'Rhein AG', col: '#ff5fa2' }, { name: 'Isar Energie', col: '#4fd6c4' }];
const ME = 0;
const DEMO = [[0, ['berlin', 'potsdam', 'leipzig']], [1, ['koeln', 'duesseldorf', 'essen', 'dortmund']], [2, ['muenchen', 'augsburg', 'nuernberg']]];
const SLOT = [10, 15, 20], STEP = 2;
const INCOME = [10, 22, 33, 44, 54, 64, 73, 82, 90, 98, 105, 112, 118, 124, 129, 134, 138, 142, 145, 148, 150];

// ---------- renderer / scene ----------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
app.appendChild(renderer.domElement);
const scene = new THREE.Scene();
{ const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#0d1720'); g.addColorStop(.55, '#070c11'); g.addColorStop(1, '#030507'); x.fillStyle = g; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
scene.fog = new THREE.FogExp2(0x05090d, 0.0028);
const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 900);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.28;
const hemi = new THREE.HemisphereLight(0x5a7690, 0x0a0d10, 1.0); scene.add(hemi);
const moon = new THREE.DirectionalLight(0xb4c6ff, 1.9);
moon.position.set(CX - 45, 70, CZ - 55); moon.target.position.set(CX, 0, CZ);
moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -52, right: 52, top: 52, bottom: -52, near: 20, far: 200 });
moon.shadow.bias = -0.0004; moon.shadow.normalBias = 0.04; moon.shadow.radius = 2.5;
scene.add(moon, moon.target);
const warm = new THREE.DirectionalLight(0xffb070, 0.55); warm.position.set(CX + 70, 18, CZ + 60); scene.add(warm);
const rim = new THREE.DirectionalLight(0x6fa8ff, 0.7); rim.position.set(CX + 10, 12, CZ - 90); scene.add(rim);

// ---------- terrain textures (color + emissive city light) ----------
const TW = TESTMODE ? 1024 : 2048, TH = Math.round(TW * BH / BW), TS = TW / BW;
const tp = (x, z) => [(x - minX) * TS, (z - minZ) * TS];
function ringPath(ctx, r) { ctx.beginPath(); r.forEach((p, i) => i ? ctx.lineTo(...tp(...p)) : ctx.moveTo(...tp(...p))); ctx.closePath(); }
function bakeColor() {
  const W = TESTMODE ? 512 : 768, Hh = Math.round(W * BH / BW), s = W / BW;
  const H = new Float32Array(W * Hh);
  for (let py = 0; py < Hh; py++) for (let px = 0; px < W; px++) H[py * W + px] = rawH(minX + (px + .5) / s, minZ + (py + .5) / s);
  const cl = Object.values(CITY); const rc = {}; for (const k in MAP.regions) rc[k] = new THREE.Color(MAP.regions[k].col);
  const keys = Object.keys(MAP.regions); const R = new Uint8Array(W * Hh);
  const low = new THREE.Color('#33464f'), mid = new THREE.Color('#4b5f67'), high = new THREE.Color('#7a878e'), snow = new THREE.Color('#d2dce2'), c = new THREE.Color(), n = new THREE.Vector3();
  const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const x = cv.getContext('2d'); const img = x.createImageData(W, Hh); const D = img.data;
  const L = new THREE.Vector3(-.55, .62, -.55).normalize();
  for (let py = 0; py < Hh; py++) for (let px = 0; px < W; px++) {
    const i = py * W + px, h = H[i], wx = minX + (px + .5) / s, wz = minZ + (py + .5) / s;
    let best = 1e9, br = 'N'; for (const q of cl) { const d = (q.x - wx) ** 2 + (q.z - wz) ** 2; if (d < best) { best = d; br = q.reg; } } R[i] = keys.indexOf(br);
    c.copy(low).lerp(mid, sstep(0, .35, h)).lerp(high, sstep(.35, .85, h)).lerp(snow, sstep(.95, 1.2, h)).lerp(rc[br], 0.17);
    c.multiplyScalar(0.86 + 0.26 * fbm(wx * 1.7, wz * 1.7, 3));
    const hx = (H[i + (px < W - 1)] - H[i - (px > 0)]) * HMAX * s * .5, hz = (H[i + (py < Hh - 1) * W] - H[i - (py > 0) * W]) * HMAX * s * .5;
    n.set(-hx, 1, -hz).normalize(); c.multiplyScalar(0.3 + 1.3 * Math.max(0, n.dot(L)) ** 1.3);
    const o = i * 4; D[o] = Math.min(255, c.r * 255); D[o + 1] = Math.min(255, c.g * 255); D[o + 2] = Math.min(255, c.b * 255); D[o + 3] = 255;
  }
  // region borders: dotted light pixels
  for (let py = 1; py < Hh - 1; py++) for (let px = 1; px < W - 1; px++) { const i = py * W + px; if ((R[i] !== R[i + 1] || R[i] !== R[i + W]) && (px + py) % 5 < 3) { const o = i * 4; D[o] = D[o] * .5 + 100; D[o + 1] = D[o + 1] * .5 + 110; D[o + 2] = D[o + 2] * .5 + 118; } }
  x.putImageData(img, 0, 0);
  const out = document.createElement('canvas'); out.width = TW; out.height = TH; const o = out.getContext('2d');
  o.drawImage(cv, 0, 0, TW, TH);
  o.lineCap = 'round'; o.lineJoin = 'round';
  for (const r of GEO.riv) { const pts = r.map(([lo, la]) => tp(...P(lo, la))); for (const [w, col] of [[6, 'rgba(60,150,200,.10)'], [2.2, 'rgba(90,175,220,.55)'], [.9, 'rgba(170,220,245,.6)']]) { o.strokeStyle = col; o.lineWidth = w; o.beginPath(); pts.forEach((p, i) => i ? o.lineTo(...p) : o.moveTo(...p)); o.stroke(); } }
  for (const lk of GEO.lak || []) { o.fillStyle = 'rgba(40,110,150,.75)'; o.beginPath(); lk.forEach(([lo, la], i) => { const p = tp(...P(lo, la)); i ? o.lineTo(...p) : o.moveTo(...p); }); o.closePath(); o.fill(); }
  o.save(); o.beginPath(); RINGS.forEach(r => r.forEach((p, i) => i ? o.lineTo(...tp(...p)) : o.moveTo(...tp(...p)))); o.clip(); o.strokeStyle = 'rgba(150,190,215,.18)'; o.lineWidth = 6; RINGS.forEach(r => { ringPath(o, r); o.stroke(); }); o.restore();
  const t = new THREE.CanvasTexture(out); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
const EW = 1024, EH = Math.round(EW * BH / BW), ES = EW / BW; const ep = (x, z) => [(x - minX) * ES, (z - minZ) * ES];
const emCanvas = document.createElement('canvas'); emCanvas.width = EW; emCanvas.height = EH; const emx = emCanvas.getContext('2d');
const emTex = new THREE.CanvasTexture(emCanvas); emTex.colorSpace = THREE.SRGBColorSpace;
function drawLights() {
  emx.globalCompositeOperation = 'source-over'; emx.fillStyle = '#000'; emx.fillRect(0, 0, EW, EH); emx.globalCompositeOperation = 'lighter';
  for (const c of Object.values(CITY)) {
    const [px, py] = ep(c.x, c.z); const n = c.houses.length; const r = (2.2 + n * 1.1) * ES; const a = .1 + n * .13 + (c.lit || 0) * .22;
    const g = emx.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(255,190,110,${a})`); g.addColorStop(.35, `rgba(255,150,70,${a * .45})`); g.addColorStop(1, 'rgba(255,120,40,0)');
    emx.fillStyle = g; emx.beginPath(); emx.arc(px, py, r, 0, 7); emx.fill();
    for (let k = 0; k < 14 + n * 8; k++) { const ang = hash(k, c.x * 100 | 0) * 6.283, rr = Math.sqrt(hash(c.z * 100 | 0, k)) * r * .8; emx.fillStyle = `rgba(255,205,140,${.25 + n * .15})`; emx.fillRect(px + Math.cos(ang) * rr, py + Math.sin(ang) * rr, 1.4, 1.4); }
  }
  for (const e of EDGES) e.owners.forEach(pl => { const A = CITY[e.a], B = CITY[e.b]; emx.strokeStyle = PLAYERS[pl].col + '40'; emx.lineWidth = 5; emx.beginPath(); emx.moveTo(...ep(A.x, A.z)); emx.lineTo(...ep(B.x, B.z)); emx.stroke(); });
  emTex.needsUpdate = true;
}

// ---------- terrain mesh ----------
const terrainUniforms = { uT: { value: 0 }, uScan: { value: -999 }, uWaves: { value: [new THREE.Vector4(0, 0, -99, 0), new THREE.Vector4(0, 0, -99, 0), new THREE.Vector4(0, 0, -99, 0)] } };
let waveI = 0; function shock(x, z, amp = .35) { terrainUniforms.uWaves.value[waveI++ % 3].set(x, z, terrainUniforms.uT.value, amp); }
function buildTerrain() {
  const colorTex = bakeColor(); drawLights();
  const mat = new THREE.MeshStandardMaterial({ map: colorTex, emissiveMap: emTex, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 1.6, roughness: .93, metalness: 0 });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uT = terrainUniforms.uT; sh.uniforms.uScan = terrainUniforms.uScan; sh.uniforms.uWaves = terrainUniforms.uWaves;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying float vWave; uniform float uT; uniform vec4 uWaves[3];')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vWave=0.; for(int i=0;i<3;i++){ vec4 w=uWaves[i]; float age=uT-w.z; if(age>0. && age<2.6){ float d=distance(transformed.xz,w.xy); float r=age*11.; float env=exp(-pow(d-r,2.)*.35)*(1.-age/2.6); transformed.y += w.w*env*sin((d-r)*1.6+1.5); vWave+=env; } }`)
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWP; varying float vWave; uniform float uT; uniform float uScan;
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float cloud(vec2 p){return n2(p)*.55+n2(p*2.1+3.)*.3+n2(p*4.3-7.)*.15;}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{ vec2 cp=vWP.xz*.045+vec2(uT*.012,uT*.006); float cs=smoothstep(.48,.72,cloud(cp)); diffuseColor.rgb*=1.-cs*.22; }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ float d=vWP.z-uScan; float band=exp(-d*d*.08); totalEmissiveRadiance+=vec3(.55,.75,1.)*band*.35+vec3(1.,.8,.45)*vWave*.5; }`);
  };
  const tess = new TessellateModifier(TESTMODE ? 1.1 : .75, 14);
  const parts = [];
  RINGS.forEach((r, ri) => {
    let g = new THREE.ShapeGeometry(new THREE.Shape(r.map(([x, z]) => new THREE.Vector2(x, -z))));
    if (ri === 0 || Math.abs(ringArea(r)) > 2) g = tess.modify(g);
    g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g, 1e-4); g.rotateX(-Math.PI / 2); parts.push(g);
  });
  const g = mergeGeometries(parts);
  const pos = g.attributes.position, uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); pos.setY(i, hAt(x, z)); uv[i * 2] = (x - minX) / BW; uv[i * 2 + 1] = 1 - (z - minZ) / BH; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.computeVertexNormals();
  const terrain = new THREE.Mesh(g, mat); terrain.receiveShadow = true; terrain.castShadow = true; scene.add(terrain);
  // cliff walls
  const D = 3.2, walls = [];
  RINGS.forEach(r => { const eg = new THREE.ExtrudeGeometry(new THREE.Shape(r.map(([x, z]) => new THREE.Vector2(x, -z))), { depth: D, bevelEnabled: false, steps: 6 }); eg.rotateX(-Math.PI / 2); eg.translate(0, -D + LIFT * .5, 0); const ng = eg.index ? eg.toNonIndexed() : eg; ng.deleteAttribute('uv'); walls.push(ng); });
  const wg = mergeGeometries(walls); const col = new Float32Array(wg.attributes.position.count * 3); const wc = new THREE.Color(), top = new THREE.Color(.11, .13, .145);
  for (let i = 0; i < wg.attributes.position.count; i++) { const y = wg.attributes.position.getY(i); const k = Math.max(0, Math.min(1, (y + D) / D)); wc.setRGB(.02, .028, .034).lerp(top, k ** 2.2); col.set([wc.r, wc.g, wc.b], i * 3); }
  wg.setAttribute('color', new THREE.BufferAttribute(col, 3)); wg.computeVertexNormals();
  const wall = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .75, metalness: .25 })); wall.receiveShadow = true; scene.add(wall);
  // golden coast rim
  const rimCurve = new THREE.CatmullRomCurve3(MAIN.map(([x, z]) => new THREE.Vector3(x, LIFT * .6, z)), true, 'catmullrom', .2);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(rimCurve, MAIN.length * 2, .045, 4, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf2b33d).multiplyScalar(.9) })));
  // floor shadow + under-glow
  const fc = document.createElement('canvas'); const FW = 512, FH = Math.round(FW * (BH + 40) / (BW + 40)); fc.width = FW; fc.height = FH; const fx = fc.getContext('2d');
  const fs = FW / (BW + 40); fx.filter = 'blur(14px)'; fx.fillStyle = 'rgba(0,0,0,.85)';
  RINGS.forEach(r => { fx.beginPath(); r.forEach(([x, z], i) => { const px = (x - minX + 20) * fs + 10, py = (z - minZ + 20) * fs + 14; i ? fx.lineTo(px, py) : fx.moveTo(px, py); }); fx.closePath(); fx.fill(); });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(BW + 40, BH + 40), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(fc), transparent: true, depthWrite: false, opacity: .9 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(CX, -7, CZ); scene.add(floor);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(BW * 2.2, BH * 1.8), new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(70,120,170,.35)'], [1, 'rgba(70,120,170,0)']], 256), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(CX, -7.2, CZ); scene.add(glow);
}

// ---------- decal textures ----------
function radialTex(stops, size = 128) { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, size, size); return new THREE.CanvasTexture(c); }
const TEX_GLOW = radialTex([[0, 'rgba(255,255,255,1)'], [.25, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
const TEX_RING = radialTex([[0, 'rgba(255,255,255,0)'], [.62, 'rgba(255,255,255,0)'], [.74, 'rgba(255,255,255,1)'], [.8, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']], 256);
const TEX_SPARK = radialTex([[0, 'rgba(255,255,255,1)'], [.3, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']], 64);
function decal(tex, size, col, op = 1) { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4 })); m.rotation.x = -Math.PI / 2; return m; }

// ---------- cities ----------
const SLOTPOS = [[-.4, .25], [.4, .25], [0, -.45]];
const socketGeo = new THREE.LatheGeometry([new THREE.Vector2(0, -.6), new THREE.Vector2(1.18, -.6), new THREE.Vector2(1.18, .12), new THREE.Vector2(1.12, .2), new THREE.Vector2(1.02, .22), new THREE.Vector2(.98, .17), new THREE.Vector2(0, .17)], 48);
const socketMat = new THREE.MeshStandardMaterial({ color: 0x5b6872, metalness: .9, roughness: .26 });
const inlayGeo = new THREE.RingGeometry(.86, .92, 64); inlayGeo.rotateX(-Math.PI / 2); inlayGeo.translate(0, .175, 0);
const inlayMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf2b33d).multiplyScalar(.75) });
const cupGeo = new THREE.CylinderGeometry(.27, .24, .05, 32); cupGeo.translate(0, .17, 0);
const cupMat = new THREE.MeshStandardMaterial({ color: 0x141b20, metalness: .6, roughness: .4 });
function buildCities() {
  Object.values(CITY).forEach((c, idx) => c.idx = idx);
  for (const c of Object.values(CITY)) {
    c.y = hAt(c.x, c.z); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) c.y = Math.max(c.y, hAt(c.x + dx, c.z + dz));
    const g = new THREE.Group(); g.position.set(c.x, c.y, c.z);
    const s = new THREE.Mesh(socketGeo, socketMat); s.castShadow = true; s.receiveShadow = true; g.add(s);
    const inlay = new THREE.Mesh(inlayGeo, inlayMat); g.add(inlay);
    SLOTPOS.forEach(([sx, sz]) => { const cup = new THREE.Mesh(cupGeo, cupMat); cup.position.set(sx, 0, sz); g.add(cup); });
    const ring = decal(TEX_RING, 3.6, new THREE.Color(0xf2b33d).multiplyScalar(1.6), 0); ring.position.y = .02; g.add(ring);
    const pool = decal(TEX_GLOW, 5, new THREE.Color(0xffb36b), 0); pool.position.y = .2; g.add(pool);
    scene.add(g); c.g = g; c.ring = ring; c.pool = pool;
  }
}

// ---------- houses ----------
const houseBodyG = new RoundedBoxGeometry(.42, .32, .38, 3, .05); houseBodyG.translate(0, .16, 0);
const houseRoofG = (() => { const s = new THREE.Shape([new THREE.Vector2(-.27, 0), new THREE.Vector2(.27, 0), new THREE.Vector2(0, .24)]); const g = new THREE.ExtrudeGeometry(s, { depth: .44, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2 }); g.translate(0, .31, -.22); return g; })();
const chimG = new THREE.BoxGeometry(.07, .14, .07); chimG.translate(.12, .5, -.05);
const winG = (() => { const a = new THREE.PlaneGeometry(.1, .1); a.translate(-.09, .17, .192); const b = new THREE.PlaneGeometry(.1, .1); b.translate(.09, .17, .192); const c2 = new THREE.PlaneGeometry(.1, .1); c2.rotateY(Math.PI / 2); c2.translate(.212, .17, 0); return mergeGeometries([a, b, c2]); })();
function makeHouse(pl) {
  const col = new THREE.Color(PLAYERS[pl].col);
  const body = new THREE.Mesh(houseBodyG, new THREE.MeshPhysicalMaterial({ color: col, roughness: .38, metalness: 0, clearcoat: 1, clearcoatRoughness: .18, emissive: col, emissiveIntensity: .06 }));
  const roofMat = new THREE.MeshPhysicalMaterial({ color: col.clone().multiplyScalar(.5), roughness: .45, clearcoat: .8, clearcoatRoughness: .25 });
  const roof = new THREE.Mesh(houseRoofG, roofMat), chim = new THREE.Mesh(chimG, roofMat);
  const win = new THREE.Mesh(winG, new THREE.MeshBasicMaterial({ color: 0x3a2c14 }));
  const g = new THREE.Group(); [body, roof, chim].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); }); g.add(win);
  g.userData = { body, win }; g.scale.setScalar(1.45); return g;
}

// ---------- ground routes ----------
let hlAttr;
const groundMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, uniforms: { uT: { value: 0 } },
  vertexShader: `attribute float aD; attribute float aHL; attribute float aS; varying float vD; varying float vHL; varying float vS;
    void main(){ vD=aD; vHL=aHL; vS=aS; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uT; varying float vD; varying float vHL; varying float vS;
    void main(){ float dot_=1.-smoothstep(.18,.32,abs(fract(vD*2.2)-.5));
      float edge=1.-smoothstep(.4,1.,abs(vS));
      float flow=pow(fract(vD*.5-uT*1.2),6.);
      vec3 c=mix(vec3(.55,.68,.78),vec3(2.2,1.5,.5),vHL);
      float a=mix(.22*dot_, .55+.9*flow, vHL)*edge;
      gl_FragColor=vec4(c*(1.+flow*vHL*1.5),a);
      #include <colorspace_fragment>
    }`
});
function routePoints(A, B, step = .45, lift = .07, trim = 1.25) {
  const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz); const n = Math.max(2, Math.ceil((L - 2 * trim) / step)); const out = [];
  for (let k = 0; k <= n; k++) { const t = trim + (L - 2 * trim) * k / n; const x = A.x + dx / L * t, z = A.z + dz / L * t; out.push({ x, z, y: hAt(x, z) + lift, t }); }
  return { pts: out, L, ux: dx / L, uz: dz / L };
}
function buildGround() {
  const P3 = [], D = [], HL = [], S = [], I = [];
  EDGES.forEach(e => {
    const { pts, ux, uz } = routePoints(CITY[e.a], CITY[e.b]); const nx = -uz, nz = ux, w = .09; e.gv = P3.length / 3; e.gn = pts.length * 2;
    pts.forEach((p, k) => { for (const s of [-1, 1]) { P3.push(p.x + nx * w * s, p.y, p.z + nz * w * s); D.push(p.t); HL.push(0); S.push(s); } if (k) { const b = e.gv + (k - 1) * 2; I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } });
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 1));
  hlAttr = new THREE.Float32BufferAttribute(HL, 1); g.setAttribute('aHL', hlAttr); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 1)); g.setIndex(I);
  const m = new THREE.Mesh(g, groundMat); m.renderOrder = 3; scene.add(m);
}
function setHL(set) { EDGES.forEach(e => { const v = set.has(e) ? 1 : 0; for (let j = 0; j < e.gn; j++) hlAttr.setX(e.gv + j, v); }); hlAttr.needsUpdate = true; }

// ---------- pylons ----------
const PS = 1.0;
const pylonGeo = (() => {
  const parts = [], m = new THREE.Matrix4(), q = new THREE.Quaternion(), H = 1.25, b0 = .2, b1 = .055;
  const bar = (a, b, t = .022) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(); const g = new THREE.BoxGeometry(t, L, t); q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.compose(a.clone().add(b).multiplyScalar(.5), q, new THREE.Vector3(1, 1, 1)); g.applyMatrix4(m); parts.push(g.toNonIndexed()); };
  const leg = (sx, sz, y) => { const k = y / H, w = b0 + (b1 - b0) * k; return new THREE.Vector3(sx * w, y, sz * w); };
  const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  C.forEach(([sx, sz]) => bar(leg(sx, sz, 0), leg(sx, sz, H), .03));
  const lv = [0, .32, .62, .9, H];
  for (let i = 0; i < lv.length - 1; i++) for (let f = 0; f < 4; f++) { const [ax, az] = C[f], [bx, bz] = C[(f + 1) % 4]; bar(leg(ax, az, lv[i]), leg(bx, bz, lv[i + 1]), .014); bar(leg(bx, bz, lv[i]), leg(ax, az, lv[i + 1]), .014); }
  bar(new THREE.Vector3(-.42, 1.02, 0), new THREE.Vector3(.42, 1.02, 0), .03); bar(new THREE.Vector3(-.3, .8, 0), new THREE.Vector3(.3, .8, 0), .025);
  for (const x of [-.4, .4, -.28, .28]) { const y = Math.abs(x) > .35 ? 1.02 : .8; const ins = new THREE.CylinderGeometry(.018, .018, .1, 6); ins.translate(x, y - .06, 0); parts.push(ins.toNonIndexed()); }
  const tip = new THREE.ConeGeometry(.045, .16, 4); tip.translate(0, H + .08, 0); parts.push(tip.toNonIndexed());
  parts.forEach(p => { p.deleteAttribute('uv'); });
  return mergeGeometries(parts);
})();
const pylons = new THREE.InstancedMesh(pylonGeo, new THREE.MeshStandardMaterial({ color: 0xc4ced6, metalness: .9, roughness: .28 }), 1500);
pylons.castShadow = true; pylons.frustumCulled = false; pylons.count = 0; scene.add(pylons);
const PYL = []; const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
function writePylon(i) { const p = PYL[i]; _q.setFromAxisAngle(_up, p.yaw); _s.set(PS, PS * Math.max(.001, p.s), PS); _m.compose(p.pos, _q, _s); pylons.setMatrixAt(i, _m); pylons.instanceMatrix.needsUpdate = true; }

// ---------- cables ----------
function cableMat(col, L) {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uP: { value: 0 }, uC: { value: new THREE.Color(col) }, uG: { value: 1 }, uL: { value: L }, uO: { value: Math.random() * 10 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uT,uP,uG,uL,uO; uniform vec3 uC; varying vec2 vUv;
      void main(){ if(vUv.x>uP) discard; float d=vUv.x*uL;
        float streak=pow(fract((d*.18)-uT*.55+uO),14.)*2.6;
        float head=smoothstep(uP-.035,uP,vUv.x)*step(uP,.999);
        vec3 c=uC*(.32+.35*uG)+uC*streak*uG+vec3(1.,.95,.8)*head*6.;
        gl_FragColor=vec4(c,1.);
        #include <colorspace_fragment>
      }`
  });
}
const LINES = [];
function buildLine(e, pl) {
  e.owners.push(pl); const lane = e.owners.length - 1; const off = [0, .55, -.55][lane] || 0;
  const A = CITY[e.a], B = CITY[e.b]; const { L, ux, uz } = routePoints(A, B); const nx = -uz, nz = ux;
  const yaw = Math.atan2(-uz, ux) + Math.PI / 2;
  const n = Math.max(1, Math.round((L - 2.7) / 2.6)); const pts = []; const start = PYL.length;
  for (let k = 0; k <= n; k++) { const t = 1.35 + (L - 2.7) * (k / n); const x = A.x + ux * t + nx * off, z = A.z + uz * t + nz * off; const pos = new THREE.Vector3(x, hAt(x, z) - .02, z); PYL.push({ pos, yaw, s: 0, t }); pts.push(pos); }
  pylons.count = PYL.length; for (let i = start; i < PYL.length; i++) writePylon(i);
  const wires = [];
  for (const [side, hy] of [[-1, 1.02], [1, 1.02], [-.7, .8], [.7, .8]]) {
    const lat = Math.abs(side) === 1 ? .4 : .28, sgn = Math.sign(side);
    const path = [new THREE.Vector3(A.x + ux * 1.0 + nx * (off + sgn * .12), A.y + .25, A.z + uz * 1.0 + nz * (off + sgn * .12))];
    const sag = (a, b, depth) => { for (let j = 1; j < 8; j++) { const t = j / 8; const q = a.clone().lerp(b, t); q.y -= Math.sin(Math.PI * t) * depth; path.push(q); } path.push(b); };
    for (const p of pts) sag(path[path.length - 1], new THREE.Vector3(p.x + nx * sgn * lat, p.y + (hy - .06) * PS, p.z + nz * sgn * lat), .32);
    sag(path[path.length - 1], new THREE.Vector3(B.x - ux * 1.0 + nx * (off + sgn * .12), B.y + .25, B.z - uz * 1.0 + nz * (off + sgn * .12)), .2);
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path, false, 'centripetal'), path.length * 2, Math.abs(side) === 1 ? .026 : .02, 5, false);
    const m = new THREE.Mesh(geo, cableMat(new THREE.Color(PLAYERS[pl].col).multiplyScalar(1.15), L)); scene.add(m); wires.push(m);
  }
  const ln = { e, pl, wires, pyl: [start, PYL.length], from: e.a, L };
  LINES.push(ln); return ln;
}

// ---------- fx ----------
const FX = [];
function addFX(dur, up, end) { FX.push({ t: 0, dur, up, end }); }
function sparkBurst(pos, col, n = 46, power = 1) {
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), v = [];
  for (let i = 0; i < n; i++) { p.set([pos.x, pos.y, pos.z], i * 3); const a = Math.random() * 6.283, s = (1.2 + Math.random() * 3) * power; v.push([Math.cos(a) * s, (2 + Math.random() * 4) * power, Math.sin(a) * s]); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ map: TEX_SPARK, color: new THREE.Color(col).multiplyScalar(2.6), size: .22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m); scene.add(pts);
  addFX(1.2, (k, dt) => { for (let i = 0; i < n; i++) { v[i][1] -= 9.5 * dt; v[i][0] *= .985; v[i][2] *= .985; p[i * 3] += v[i][0] * dt; p[i * 3 + 1] = Math.max(pos.y - .1, p[i * 3 + 1] + v[i][1] * dt); p[i * 3 + 2] += v[i][2] * dt; } g.attributes.position.needsUpdate = true; m.opacity = (1 - k) ** 1.5; m.size = .22 * (1 - k * .5); }, () => { scene.remove(pts); g.dispose(); m.dispose(); });
}
function ripple(c, col, big = 1) {
  const d = decal(TEX_RING, 3, new THREE.Color(col).multiplyScalar(2.2), 1); d.position.set(c.x, c.y + .12, c.z); scene.add(d);
  addFX(1.3, k => { const e = 1 - (1 - k) ** 3; d.scale.setScalar(1 + e * 5 * big); d.material.opacity = (1 - k) ** 2; }, () => { scene.remove(d); d.material.dispose(); });
}
const beamGeo = (() => { const g = new THREE.CylinderGeometry(.55, .9, 14, 32, 1, true); g.translate(0, 7, 0); return g; })();
function beam(c, col) {
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uC: { value: new THREE.Color(col).multiplyScalar(1.6) }, uA: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uC; uniform float uA; varying vec2 vUv; void main(){ float a=(1.-vUv.y)*(1.-vUv.y)*uA; gl_FragColor=vec4(uC*a,a); }` });
  const b = new THREE.Mesh(beamGeo, m); b.position.set(c.x, c.y, c.z); scene.add(b);
  return { show: k => { m.uniforms.uA.value = k; }, remove: () => { scene.remove(b); m.dispose(); } };
}
const orbMat = col => new THREE.SpriteMaterial({ map: TEX_GLOW, color: new THREE.Color(col).multiplyScalar(3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
function makeOrb(col, s = 1.1) { const o = new THREE.Sprite(orbMat(col)); o.scale.setScalar(s); scene.add(o); return o; }
function trail(pos, col) { const s = new THREE.Sprite(orbMat(col)); s.position.copy(pos); s.scale.setScalar(.45); scene.add(s); addFX(.6, k => { s.material.opacity = 1 - k; s.scale.setScalar(.45 * (1 - k * .6)); s.position.y += .006; }, () => { scene.remove(s); s.material.dispose(); }); }

// ---------- tweens ----------
const TW_ = [];
const ease = { out: k => 1 - (1 - k) ** 3, in: k => k * k * k, inout: k => k < .5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2, back: k => { const c = 1.7; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; }, spring: k => 1 - Math.cos(k * Math.PI * 4.5) * Math.exp(-k * 6) };
const PACE = 1.5; // ruhigeres Grundtempo, damit jede Animation lesbar bleibt
function tween(dur, fn, delay = 0) { return new Promise(res => TW_.push({ t: -delay * PACE, dur: reduced ? Math.min(dur, .12) : dur * PACE, fn, done: res })); }
const wait = s => tween(s, () => { });

// ---------- build animation ----------
function routePos(ln, k) {
  const A = CITY[ln.from], B = CITY[ln.from === ln.e.a ? ln.e.b : ln.e.a]; const x = A.x + (B.x - A.x) * k, z = A.z + (B.z - A.z) * k;
  const lane = ln.e.owners.indexOf(ln.pl), off = [0, .55, -.55][lane] || 0; const L = Math.hypot(B.x - A.x, B.z - A.z); const nx = -(B.z - A.z) / L, nz = (B.x - A.x) / L;
  const sgn = ln.from === ln.e.a ? 1 : -1; const px = x + nx * off * sgn, pz = z + nz * off * sgn;
  return new THREE.Vector3(px, hAt(px, pz) + 1.15, pz);
}
function flash(pos, col) { const s = makeOrb(col, .2); s.position.copy(pos); tween(.45, k => { s.scale.setScalar(.2 + Math.sin(k * Math.PI) * 1.1); s.material.opacity = 1 - k; }).then(() => { scene.remove(s); s.material.dispose(); }); }
let CHASE = null;
async function animLine(ln, speed = 1, chase = false) {
  const [s0, s1] = ln.pyl, n = s1 - s0, rev = ln.from !== ln.e.a;
  if (rev) ln.wires.forEach(w => { const a = w.geometry.attributes.uv.array; for (let j = 0; j < a.length; j += 2) a[j] = 1 - a[j]; w.geometry.attributes.uv.needsUpdate = true; });
  const col = PLAYERS[ln.pl].col, orb = makeOrb(col, 1.2);
  if (chase) { controls.enabled = false; const A = CITY[ln.from], B = CITY[ln.from === ln.e.a ? ln.e.b : ln.e.a]; CHASE = { orb, dir: new THREE.Vector3(B.x - A.x, 0, B.z - A.z).normalize() }; }
  const dur = (.55 + ln.L * .045) / speed, raised = new Set(); let lastT = 0;
  await tween(dur, k => {
    const q = ease.inout(k); orb.position.copy(routePos(ln, q));
    if (k - lastT > .02) { trail(orb.position, col); lastT = k; }
    ln.wires.forEach(w => w.material.uniforms.uP.value = Math.max(0, q - .02) * 1.002);
    for (let j = 0; j < n; j++) { const i = rev ? s1 - 1 - j : s0 + j; const pt = PYL[i].t / ln.L, pk = rev ? 1 - pt : pt; if (!raised.has(i) && q >= pk - .06) { raised.add(i); tween(.6 / speed, z => { PYL[i].s = ease.spring(z); writePylon(i); }); const top = PYL[i].pos.clone(); top.y += 1.3; flash(top, col); } }
  });
  ln.wires.forEach(w => w.material.uniforms.uP.value = 1.01);
  tween(.35, k => { orb.material.opacity = 1 - k; orb.scale.setScalar(1.2 + k * 2); }).then(() => { scene.remove(orb); orb.material.dispose(); });
}
async function dropHouse(cid, pl, speed = 1, show = false) {
  const c = CITY[cid], slot = c.houses.length; c.houses.push(pl);
  const h = makeHouse(pl), [sx, sz] = SLOTPOS[slot], y0 = .19, col = PLAYERS[pl].col;
  h.position.set(sx, 9, sz); h.rotation.y = 2.4; c.g.add(h); c.hm.push(h);
  const bm = beam(c, col);
  await tween(.35 / speed, k => bm.show(k * .9));
  // streak while falling
  let lt = 0;
  await tween(.7 / speed, k => { h.position.y = y0 + (9 - y0) * (1 - ease.in(k)); h.rotation.y = 2.4 * (1 - ease.out(k)); if (k - lt > .08 && k < .9) { lt = k; const p = new THREE.Vector3(); h.getWorldPosition(p); trail(p, col); } });
  sparkBurst(new THREE.Vector3(c.x + sx * 1.45, c.y + .3, c.z + sz * 1.45), col, show ? 70 : 40, show ? 1 : .7); ripple(c, col, show ? 1.6 : 1.1);
  shock(c.x, c.z, show ? .45 : .2); if (show) shake(.35);
  tween(.55 / speed, k => { const sq = Math.sin(k * Math.PI) * Math.exp(-k * 2); h.scale.set(1.45 * (1 + sq * .25), 1.45 * (1 - sq * .32), 1.45 * (1 + sq * .25)); });
  tween(.7, k => bm.show(.9 * (1 - k))).then(bm.remove);
  igniteCity(c, .8); drawLights();
  // the skyline takes the owner's colour and powers up floor by floor
  const st = SKY.state[c.idx]; st.own.set(col); tween(1.2, k => { st.ownA = k * .9; });
  skylineSweep(c, show ? 1.6 : .8, show ? 1.4 : 1);
  if (show) { searchlights(c, col); fireworks(c, col, 4); }
}
function skylineSweep(c, boost = 1, dur = 1.2) {
  const st = SKY.state[c.idx]; st.light = 0;
  tween(.5, k => { st.pulse = Math.sin(k * Math.PI) * 1.0; });
  tween(dur, k => { st.light = ease.out(k) * 1.12; st.boost = boost * Math.sin(Math.min(1, k * 1.4) * Math.PI / 2); }).then(() => tween(1.6, k => { st.boost = boost * (1 - ease.out(k)); }));
}
function searchlights(c, col) {
  const info = SKY.info[c.idx]; const g = new THREE.Group(); g.position.copy(info.centre); scene.add(g);
  const mats = [];
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.CylinderGeometry(.9, .06, 18, 20, 1, true); geo.translate(0, 9, 0);
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uA: { value: 0 }, uC: { value: new THREE.Color(i ? 0xfff1d0 : col).multiplyScalar(1.2) } },
      vertexShader: `varying float vY; void main(){ vY=uv.y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform float uA; uniform vec3 uC; varying float vY; void main(){ float a=pow(1.-vY,1.6)*.32*uA; gl_FragColor=vec4(uC*a,a); }` });
    const b = new THREE.Mesh(geo, m); const pivot = new THREE.Group(); pivot.add(b); pivot.rotation.y = i * 2.1; b.rotation.z = .35; g.add(pivot); mats.push([m, pivot, b, i]);
  }
  tween(3.6, k => { const a = Math.sin(Math.min(1, k * 3) * Math.PI / 2) * (k > .75 ? (1 - k) / .25 : 1); mats.forEach(([m, pv, b, i]) => { m.uniforms.uA.value = a; pv.rotation.y = i * 2.1 + k * 4.2; b.rotation.z = .25 + .25 * Math.sin(k * 7 + i); }); })
    .then(() => { scene.remove(g); mats.forEach(([m, , b]) => { m.dispose(); b.geometry.dispose(); }); });
}
function fireworks(c, col, n = 3) {
  const top = SKY.info[c.idx].top;
  for (let i = 0; i < n; i++) {
    const start = new THREE.Vector3(c.x + (Math.random() - .5) * 1.5, c.y + .5, c.z + (Math.random() - .5) * 1.5);
    const apex = start.clone().add(new THREE.Vector3((Math.random() - .5) * 3, 6 + Math.random() * 4 + (top.y - c.y), (Math.random() - .5) * 3));
    const pc = i % 2 ? '#ffe2a0' : col;
    wait(i * .35).then(async () => {
      const r = makeOrb(pc, .5); let lt = 0;
      await tween(.75, k => { const e = ease.out(k); r.position.lerpVectors(start, apex, e); if (k - lt > .05) { lt = k; trail(r.position, pc); } });
      scene.remove(r); r.material.dispose(); flash(apex, pc); burst(apex, pc);
    });
  }
}
function burst(pos, col) {
  const n = 90, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), v = [];
  for (let i = 0; i < n; i++) { p.set([pos.x, pos.y, pos.z], i * 3); const u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = 4 + Math.random() * 1.5, q = Math.sqrt(1 - u * u); v.push([Math.cos(a) * q * s, u * s, Math.sin(a) * q * s]); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ map: TEX_SPARK, color: new THREE.Color(col).multiplyScalar(3.2), size: .35, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m); scene.add(pts);
  addFX(1.8, (k, dt) => { for (let i = 0; i < n; i++) { v[i][0] *= .965; v[i][1] = v[i][1] * .965 - 3.2 * dt; v[i][2] *= .965; p[i * 3] += v[i][0] * dt; p[i * 3 + 1] += v[i][1] * dt; p[i * 3 + 2] += v[i][2] * dt; } g.attributes.position.needsUpdate = true; m.opacity = (1 - k) ** 1.3 * (k > .5 ? .6 + .4 * Math.sin(k * 60) : 1); m.size = .35 * (1 - k * .4); }, () => { scene.remove(pts); g.dispose(); m.dispose(); });
}
let SHAKE = 0; function shake(a) { SHAKE = Math.max(SHAKE, a); }
function igniteCity(c, amt = 1) { const p = c.pool; p.material.color.set(0xffb36b).multiplyScalar(1.2); tween(1.6, k => { p.material.opacity = (c.houses.length ? .35 : 0) + Math.sin(Math.min(1, k * 2) * Math.PI / 2) * amt * (1 - k * .55); }); }

// ---------- routing ----------
function network(pl) { return Object.values(CITY).filter(c => c.houses.includes(pl)).map(c => c.id); }
function dijkstra(pl) {
  const src = network(pl), dist = {}, prev = {}; Object.keys(CITY).forEach(k => dist[k] = Infinity); src.forEach(s => dist[s] = 0); const Q = new Set(Object.keys(CITY));
  while (Q.size) { let u = null, b = Infinity; for (const k of Q) if (dist[k] < b) { b = dist[k]; u = k; } if (u === null) break; Q.delete(u);
    for (const e of ADJ[u]) { const v = e.a === u ? e.b : e.a, w = e.owners.includes(pl) ? 0 : e.cost; if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = [u, e]; } } }
  return { dist, prev };
}
function quote(cid) {
  const c = CITY[cid], R = dijkstra(ME);
  if (c.houses.includes(ME)) return { ok: false, why: T.own };
  if (c.houses.length >= STEP) return { ok: false, why: T.full };
  if (R.dist[cid] === Infinity) return { ok: false, why: T.noroute };
  const path = []; let v = cid; while (R.prev[v]) { const [u, e] = R.prev[v]; if (!e.owners.includes(ME)) path.unshift({ e, from: u }); v = u; }
  const line = R.dist[cid], house = SLOT[c.houses.length], total = line + house;
  return { ok: total <= PLAYERS[ME].money, why: total > PLAYERS[ME].money ? T.poor : '', line, house, total, path };
}

// ---------- resource market (3D) ----------
let MKT = null; const CART = { coal: 0, oil: 0, garbage: 0, uranium: 0 }; let MODE = 'city';
const RN = k => DE ? RES[k].de : RES[k].en;
function buildMarket() {
  MKT = createMarket({ x0: maxX + 5.5 + MARKET_W / 2, z0: CZ - 2, de: DE }); scene.add(MKT.group);
  $('#cRows').addEventListener('click', e => { const b = e.target.closest('.st'); if (!b || MODE !== 'market') return; CART[b.dataset.k] = Math.max(0, CART[b.dataset.k] + +b.dataset.d); renderMarketCard(); previewCart(); });
}
function plantFor(k) { return MKT.PLANTS.find(p => p.res === k); }
function room(k) { const p = plantFor(k); return p ? p.cap - p.pieces.length : 0; }
function cartCost() { return ORDER.reduce((s, k) => s + (CART[k] ? MKT.price(k, CART[k]) : 0), 0); }
function previewCart() {
  ORDER.forEach(k => { const sel = new Set(MKT.cheapest(k, CART[k])); MKT.pieces[k].forEach(p => { const on = sel.has(p); const ty = MKT.SLOTS[k][p.slot].y + (on ? .45 : 0); tween(.25, q => { p.m.position.y += (ty - p.m.position.y) * q; }); p.m.material.emissive = p.m.material.emissive || new THREE.Color(); if (k !== 'uranium') { p.m.material.emissive.set(on ? 0xf2b33d : 0x000000); p.m.material.emissiveIntensity = on ? .45 : 0; } }); });
}
function fitCorners(corners, polar, insetR = 0) {
  const topF = 1 - 2 * (SAFE.t / VH), botF = -1 + 2 * (SAFE.b / VH), want = (topF + botF) / 2, xr = 1 - 2 * insetR / VW, xl = -.97;
  let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9; corners.forEach(v => { mnx = Math.min(mnx, v.x); mxx = Math.max(mxx, v.x); mnz = Math.min(mnz, v.z); mxz = Math.max(mxz, v.z); });
  const tgt = new THREE.Vector3((mnx + mxx) / 2, 0, (mnz + mxz) / 2), cam = camera.clone();
  const place = d => { cam.position.set(tgt.x, Math.cos(polar) * d, tgt.z + Math.sin(polar) * d); cam.lookAt(tgt); cam.updateMatrixWorld(); };
  const span = () => { let a = 1e9, b = -1e9, l = 1e9, r = -1e9; for (const c of corners) { const p = c.clone().project(cam); a = Math.min(a, p.y); b = Math.max(b, p.y); l = Math.min(l, p.x); r = Math.max(r, p.x); } return [a, b, l, r]; };
  let d = 60;
  for (let it = 0; it < 7; it++) { let lo = 8, hi = 600; for (let k = 0; k < 26; k++) { d = (lo + hi) / 2; place(d); const [a, b, l, r] = span(); if ((r - l) < (xr - xl) * .97 && (b - a) < (topF - botF) * .96) hi = d; else lo = d; } d = hi; place(d); const [a, b, l, r] = span(); const k2 = d * Math.tan(camera.fov * Math.PI / 360); tgt.z += (want - (a + b) / 2) * k2 * .7; tgt.x += (((l + r) / 2) - (xl + xr) / 2) * k2 * camera.aspect * .7; }
  place(d); return { tgt: tgt.clone(), pos: cam.position.clone() };
}
function marketPose() { const b = MKT.bounds; const land = VW > VH && matchMedia('(max-height: 500px)').matches; return fitCorners([[b.minX, b.minZ], [b.maxX, b.minZ], [b.minX, b.maxZ], [b.maxX, b.maxZ]].map(([x, z]) => new THREE.Vector3(x, 0, z)), VW > VH ? .88 : .7, card.classList.contains('on') || MODE === 'market' ? (land ? 300 : 0) : 0); }
function marketPoseOld() { const b = MKT.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2 + 2, pol = .78, d = VW > VH ? 50 : 62; const tgt = new THREE.Vector3(cx + (VW > VH ? 5 : 0), 0, cz); return { tgt, pos: new THREE.Vector3(tgt.x, Math.cos(pol) * d, tgt.z + Math.sin(pol) * d) }; }
function openMarket() {
  if (BUSY) return; SEL = null; setHL(new Set()); MODE = 'market'; ORDER.forEach(k => CART[k] = 0);
  renderMarketCard(); card.classList.add('on'); layoutHUD(); markReachable(); flyTo(marketPose(), 1.1);
}
function renderMarketCard() {
  $('#cName').textContent = DE ? 'Rohstoffe kaufen' : 'Buy resources';
  const money = PLAYERS[ME].money, cost = cartCost();
  $('#cRows').innerHTML = ORDER.map(k => {
    const cap = room(k), n = CART[k], next = MKT.count(k) > n ? RES[k].prices[MKT.cheapest(k, n + 1)[n].slot] : null;
    const can = cap > n && next !== null && cost + next <= money;
    const sub = n ? `${MKT.price(k, n)} €` : (cap ? (next !== null ? (DE ? 'ab ' : 'from ') + next + ' €' : (DE ? 'leer' : 'empty')) : '—');
    return `<div class="mrow"><span class="sw" style="background:${RES[k].col}"></span><span class="nm">${RN(k)}</span><span class="sub">${sub}</span><button class="st" data-k="${k}" data-d="-1" ${n ? '' : 'disabled'} aria-label="−">−</button><b class="n">${n}</b><button class="st" data-k="${k}" data-d="1" ${can ? '' : 'disabled'} aria-label="+">+</button></div>`;
  }).join('') + `<div class="row tot"><span>${T.total}</span><b>${cost} €</b></div>`;
  const b = $('#cBuild'); b.disabled = !cost; b.textContent = cost ? `${DE ? 'Kaufen' : 'Buy'} · ${cost} €` : (DE ? 'Kaufen' : 'Buy');
}
async function flyPiece(p, k, dest, dur, opts = {}) { // arc flight in market-local space
  const m = p.m, a = m.position.clone(), b = dest.clone(), peak = Math.max(a.y, b.y) + (opts.h || 4.5);
  const spin = (Math.random() - .5) * 8; let lt = 0;
  await tween(dur, q => { const e = ease.inout(q); m.position.lerpVectors(a, b, e); m.position.y = a.y + (b.y - a.y) * e + Math.sin(Math.PI * e) * (peak - Math.max(a.y, b.y)); m.rotation.x = spin * e; m.rotation.z = spin * .6 * e; if (q - lt > .06 && opts.trail) { lt = q; trail(MKT.world(m.position), opts.trail); } });
  m.rotation.set(0, 0, 0);
}
async function buyCart() {
  const cost = cartCost(); if (!cost || BUSY) return; BUSY = true; MODE = 'city'; card.classList.remove('on'); layoutHUD();
  PLAYERS[ME].money -= cost; setMoney(PLAYERS[ME].money);
  const jobs = []; let i = 0;
  for (const k of ORDER) {
    if (!CART[k]) continue; const P = plantFor(k); const take = MKT.cheapest(k, CART[k]);
    for (const p of take) {
      const pr = RES[k].prices[p.slot]; MKT.pieces[k].splice(MKT.pieces[k].indexOf(p), 1);
      const slotPos = P.store[P.pieces.length]; P.pieces.push(p);
      jobs.push(wait(i++ * .22).then(async () => {
        floatText(`−${pr} €`, MKT.world(p.m.position).add(new THREE.Vector3(0, .8, 0)), 'neg sm');
        await tween(.25, q => { p.m.position.y += .04; });
        await flyPiece(p, k, slotPos, .9, { h: 3.5, trail: '#f2b33d' });
        p.m.material.emissiveIntensity = k === 'uranium' ? .6 : 0; p.m.scale.setScalar(.9);
        sparkBurst(MKT.world(slotPos).add(new THREE.Vector3(0, .3, 0)), '#f2b33d', 14, .35);
        tween(.3, q => { const s = .9 * (1 + Math.sin(q * Math.PI) * .2); p.m.scale.set(s, .9 * (1 - Math.sin(q * Math.PI) * .2), s); });
      }));
    }
    CART[k] = 0;
  }
  await Promise.all(jobs); await wait(.5);
  // opponents buy too: their pieces fly across the map into their home cities
  await opponentBuys([[1, 'coal', 2, 'essen'], [2, 'oil', 2, 'muenchen'], [1, 'garbage', 1, 'essen']]);
  BUSY = false; markReachable();
}
async function opponentBuys(list) {
  const jobs = []; let i = 0;
  for (const [pl, k, n, city] of list) for (const p of MKT.cheapest(k, n)) {
    MKT.pieces[k].splice(MKT.pieces[k].indexOf(p), 1); const C = CITY[city]; const dest = new THREE.Vector3(C.x, C.y + .8, C.z).sub(MKT.group.position);
    jobs.push(wait(i++ * .2).then(async () => { await flyPiece(p, k, dest, 1.5, { h: 9, trail: PLAYERS[pl].col }); flash(MKT.world(p.m.position), PLAYERS[pl].col); MKT.group.remove(p.m); }));
  }
  await Promise.all(jobs);
}
async function burnFuel() { // resources on my plants burn and fly as energy into my grid
  const root = CITY[network(ME)[0]]; if (!root) return; const jobs = []; let i = 0;
  for (const P of MKT.PLANTS) { const used = P.pieces.splice(0, Math.min(P.pieces.length, P.cap / 2)); for (const p of used) jobs.push(wait(i++ * .18).then(async () => {
    await tween(.6, q => { p.m.position.y = .22 + ease.out(q) * 1.4; p.m.rotation.y += .25; p.m.material.emissive.set(0xffd27a); p.m.material.emissiveIntensity = q * 3; });
    const wpos = MKT.world(p.m.position); MKT.group.remove(p.m); flash(wpos, '#ffd27a');
    const orb = makeOrb('#ffd27a', 1); const dest = new THREE.Vector3(root.x, root.y + 1.2, root.z), a = wpos.clone(); let lt = 0;
    await tween(1.4, q => { const e = ease.inout(q); orb.position.lerpVectors(a, dest, e); orb.position.y += Math.sin(Math.PI * e) * 10; if (q - lt > .04) { lt = q; trail(orb.position, '#ffd27a'); } });
    scene.remove(orb); orb.material.dispose(); ripple(root, '#ffd27a', .8);
  })); }
  await Promise.all(jobs);
}
async function restock(amounts) {
  const jobs = []; let i = 0;
  for (const k of ORDER) {
    const occ = new Set(MKT.pieces[k].map(p => p.slot)); let n = amounts[k];
    for (let s = MKT.SLOTS[k].length - 1; s >= 0 && n > 0; s--) { if (occ.has(s)) continue; n--; const slot = s;
      jobs.push(wait(i++ * .14).then(async () => {
        const m = MKT.makePiece(k), dest = MKT.SLOTS[k][slot]; m.position.set(dest.x, 14, dest.z); m.rotation.set(Math.random() * 3, Math.random() * 3, 0); const p = { m, slot }; MKT.pieces[k].push(p);
        await tween(.7, q => { m.position.y = dest.y + 14 * (1 - ease.in(q)); m.rotation.x *= .9; m.rotation.z = 0; });
        m.rotation.set(0, (Math.random() - .5) * .4, 0); sparkBurst(MKT.world(dest).add(new THREE.Vector3(0, .2, 0)), RES[k].col === '#1c1d22' ? '#9aa6ad' : RES[k].col, 12, .3);
        tween(.3, q => { const s2 = 1 + Math.sin(q * Math.PI) * .18; m.scale.set(s2, 1 - Math.sin(q * Math.PI) * .25, s2); });
      }));
    }
  }
  await Promise.all(jobs);
}

// ---------- DOM HUD ----------
const $ = s => document.querySelector(s);
const labels = $('#labels'); const LBL = [];
let VW = 1, VH = 1, SAFE = { t: 0, b: 0 };
function initLabels() {
  for (const c of Object.values(CITY)) { const d = document.createElement('div'); d.className = 'lb city'; d.textContent = c.name; labels.appendChild(d); LBL.push({ el: d, c, pri: 2, w3: new THREE.Vector3(c.x, c.y, c.z + 1.6) }); }
  for (const e of EDGES) { const d = document.createElement('div'); d.className = 'lb cost'; d.textContent = e.cost; labels.appendChild(d); const A = CITY[e.a], B = CITY[e.b], mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2; LBL.push({ el: d, e, pri: 1, w3: new THREE.Vector3(mx, hAt(mx, mz) + .2, mz) }); }
}
const moneyEl = $('#money'); let moneyShown = PLAYERS[ME].money; moneyEl.textContent = moneyShown;
function setMoney(v) { const a = moneyShown; tween(.9, q => { moneyShown = Math.round(a + (v - a) * ease.out(q)); moneyEl.textContent = moneyShown; }); }
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), ms); }
function floatText(txt, w3, cls) { const d = document.createElement('div'); d.className = 'float ' + (cls || ''); d.textContent = txt; labels.appendChild(d); const v = w3.clone(); tween(1.5, q => { const p = v.clone(); p.y += ease.out(q) * 3; p.project(camera); d.style.transform = `translate(${(p.x * .5 + .5) * VW}px,${(-p.y * .5 + .5) * VH}px) translate(-50%,-50%) scale(${.8 + Math.min(1, q * 4) * .2})`; d.style.opacity = q < .7 ? Math.min(1, q * 5) : (1 - q) / .3; }).then(() => d.remove()); }

let SEL = null, BUSY = false;
const card = $('#card');
function select(cid) {
  if (BUSY) return; if (MODE === 'market') { MODE = 'city'; ORDER.forEach(k => CART[k] = 0); previewCart(); } SEL = cid; const q = quote(cid), c = CITY[cid];
  $('#cName').textContent = c.name;
  if (q.line === undefined) { $('#cRows').innerHTML = `<div class="why">${q.why}</div>`; setHL(new Set()); }
  else { $('#cRows').innerHTML = `<div class="row"><span>${T.line}</span><b>${q.line} €</b></div><div class="row"><span>${T.house} (${q.house})</span><b>${q.house} €</b></div><div class="row tot"><span>${T.total}</span><b>${q.total} €</b></div>${q.ok ? '' : `<div class="why">${q.why}</div>`}`; setHL(new Set(q.path.map(p => p.e))); }
  const b = $('#cBuild'); b.disabled = !q.ok; b.textContent = q.total ? `${T.build} · ${q.total} €` : T.build;
  card.classList.add('on'); layoutHUD(); markReachable();
}
function closeCard() { if (MODE === 'market') { MODE = 'city'; ORDER.forEach(k => CART[k] = 0); previewCart(); } SEL = null; card.classList.remove('on'); setHL(new Set()); markReachable(); }
$('#cX').onclick = closeCard;
$('#cBuild').onclick = async () => {
  if (MODE === 'market') return buyCart();
  const q = quote(SEL); if (!q.ok || BUSY) return; const cid = SEL; BUSY = true; closeCard(); hideRings();
  PLAYERS[ME].money -= q.total; setMoney(PLAYERS[ME].money);
  const C = CITY[cid]; floatText(`−${q.total} €`, new THREE.Vector3(C.x, C.y + 1.6, C.z), 'neg');
  const saved = { pos: camera.position.clone(), tgt: controls.target.clone() };
  const cine = !reduced;
  if (!cine) await focusPath(q.path.map(p => p.e), C);
  for (const st of q.path) { const ln = buildLine(st.e, ME); ln.from = st.from; await animLine(ln, cine ? .8 : 1, cine); }
  CHASE = null;
  drawLights();
  if (cine) { // swing round to a low hero angle on the target city
    const az = .5, pol = 1.0, d = 15, tgt = new THREE.Vector3(C.x, C.y + .6, C.z);
    await flyTo({ tgt, pos: new THREE.Vector3(tgt.x + Math.sin(az) * Math.sin(pol) * d, tgt.y + Math.cos(pol) * d, tgt.z + Math.cos(az) * Math.sin(pol) * d) }, .9);
  }
  await dropHouse(cid, ME, 1, true); await wait(2.2);
  if (cine) await flyTo(saved, 1.4);
  BUSY = false; markReachable();
};
function hideRings() { Object.values(CITY).forEach(c => c.ringOn = false); }
function markReachable() {
  if (BUSY) return hideRings(); const R = dijkstra(ME);
  Object.values(CITY).forEach(c => { c.reach = !c.houses.includes(ME) && c.houses.length < STEP && R.dist[c.id] + SLOT[c.houses.length] <= PLAYERS[ME].money; c.ringOn = c.reach || c.id === SEL; });
}
$('#bPower').onclick = async () => {
  if (BUSY) return; BUSY = true; closeCard(); hideRings();
  // night deepens, city light takes over
  const L0 = { m: moon.intensity, w: warm.intensity, h: hemi.intensity };
  await tween(.8, k => { const e = ease.inout(k); moon.intensity = L0.m * (1 - .7 * e); warm.intensity = L0.w * (1 - .8 * e); hemi.intensity = L0.h * (1 - .55 * e); SKY.U.uNight.value = 1 + .9 * e; });
  const saved = { pos: camera.position.clone(), tgt: controls.target.clone() };
  await flyTo(fitPose(undefined, true), 1.0);
  await burnFuel();
  Object.values(CITY).forEach(c => { if (c.houses.length) { const st = SKY.state[c.idx]; tween(.4, k => st.light = 1.12 * (1 - k * .85)); } });
  const jobs = [], coins = [];
  PLAYERS.forEach((p, pl) => {
    const set = new Set(network(pl)); if (!set.size) return; const root = network(pl)[0]; const order = [[root, null, null]], seen = new Set([root]);
    for (let i = 0; i < order.length; i++) for (const e of ADJ[order[i][0]]) { if (!e.owners.includes(pl)) continue; const v = e.a === order[i][0] ? e.b : e.a; if (!seen.has(v)) { seen.add(v); order.push([v, order[i][0], e]); } }
    const at = {}; at[root] = 0;
    const arrive = cid => { const c = CITY[cid]; pulseCity(c, pl); skylineSweep(c, 1.4, .9); shock(c.x, c.z, .12); if (pl === ME) coins.push(flyCoin(c)); };
    order.forEach(([cid, from, e]) => {
      if (!from) { jobs.push(wait(.4).then(() => arrive(cid))); return; }
      const L = Math.hypot(CITY[cid].x - CITY[from].x, CITY[cid].z - CITY[from].z), dur = .4 + L * .035, t0 = at[from]; at[cid] = t0 + dur;
      jobs.push(wait(.4 + t0).then(async () => {
        const ln = LINES.find(l => l.e === e && l.pl === pl);
        if (ln) { const orb = makeOrb(PLAYERS[pl].col, 1.1), fake = { ...ln, from }; let lt = 0; ln.wires.forEach(w => tween(dur + .6, k => w.material.uniforms.uG.value = 1 + Math.sin(k * Math.PI) * 3)); await tween(dur, k => { orb.position.copy(routePos(fake, ease.inout(k))); if (k - lt > .04) { trail(orb.position, PLAYERS[pl].col); lt = k; } }); scene.remove(orb); orb.material.dispose(); }
        if (set.has(cid)) arrive(cid);
      }));
    });
  });
  bloomBoost(); await Promise.all(jobs); await Promise.all(coins); await wait(.3);
  const n = network(ME).length, inc = INCOME[Math.min(n, INCOME.length - 1)]; PLAYERS[ME].money += inc; setMoney(PLAYERS[ME].money);
  $('.money').classList.add('pop'); setTimeout(() => $('.money').classList.remove('pop'), 600);
  toast(`${T.paid}: ${n} ${T.cities} → +${inc} €`);
  // grid surge, then dawn returns
  LINES.forEach(l => l.wires.forEach(w => tween(1.2, k => w.material.uniforms.uG.value = 1 + Math.sin(k * Math.PI) * 2)));
  await wait(1.2);
  await tween(1.2, k => { const e = ease.inout(k); moon.intensity = L0.m * (.3 + .7 * e); warm.intensity = L0.w * (.2 + .8 * e); hemi.intensity = L0.h * (.45 + .55 * e); SKY.U.uNight.value = 1.9 - .9 * e; });
  toast(DE ? 'Nachschub für den Rohstoffmarkt' : 'Restocking the resource market', 2400);
  await flyTo(marketPose(), 1.0); await restock({ coal: 4, oil: 2, garbage: 1, uranium: 1 }); await wait(.6);
  await flyTo(saved, 1.2);
  BUSY = false; markReachable();
};
function flyCoin(c) {
  const d = document.createElement('div'); d.className = 'coin'; d.textContent = '€'; document.body.appendChild(d);
  const p = new THREE.Vector3(c.x, c.y + 1.2, c.z).project(camera); const x0 = (p.x * .5 + .5) * VW, y0 = (-p.y * .5 + .5) * VH;
  const r = $('.money').getBoundingClientRect(), x1 = r.left + r.width * .3, y1 = r.top + r.height / 2;
  const cx = (x0 + x1) / 2 + (Math.random() - .5) * 120, cy = Math.min(y0, y1) - 120 - Math.random() * 80;
  return tween(1.0 + Math.random() * .3, k => { const e = ease.inout(k), u = 1 - e; const x = u * u * x0 + 2 * u * e * cx + e * e * x1, y = u * u * y0 + 2 * u * e * cy + e * e * y1; d.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) scale(${.6 + Math.sin(k * Math.PI) * .7}) rotate(${k * 540}deg)`; d.style.opacity = k < .1 ? k * 10 : 1; }, .15).then(() => d.remove());
}
function pulseCity(c, pl) {
  c.hm.forEach((h, i) => { if (c.houses[i] !== pl) return; const w = h.userData.win, col = new THREE.Color(0xffd28a); tween(2.2, q => { const k = q < .15 ? q / .15 : 1 - (q - .15) / .85 * .6; w.material.color.copy(col).multiplyScalar(.15 + k * 5); h.userData.body.material.emissiveIntensity = .06 + k * .5; }); });
  ripple(c, PLAYERS[pl].col, .7); igniteCity(c, 1.2); c.lit = 1; drawLights();
}
let bloomPass, bloomBase = .55;
function bloomBoost() { if (!bloomPass) return; tween(2.6, q => { bloomPass.strength = bloomBase + Math.sin(q * Math.PI) * .35; }); }

// ---------- camera ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = .08; controls.screenSpacePanning = false;
controls.minPolarAngle = .25; controls.maxPolarAngle = 1.12; controls.minDistance = 12; controls.maxDistance = 220;
controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
controls.zoomToCursor = true;
controls.addEventListener('change', () => { const t = controls.target; t.x = Math.max(minX, Math.min(MKT ? MKT.bounds.maxX : maxX, t.x)); t.z = Math.max(minZ, Math.min(maxZ, t.z)); t.y = 0; });
function fitPose(polar, all) {
  if (polar === undefined) polar = VW > VH ? .95 : .78;
  const corners = MAIN.filter((_, i) => i % 3 === 0).map(([x, z]) => new THREE.Vector3(x, 0, z));
  if (MKT && (all || VW > VH)) { const b = MKT.bounds; [[b.minX, b.minZ], [b.maxX, b.minZ], [b.minX, b.maxZ], [b.maxX, b.maxZ]].forEach(([x, z]) => corners.push(new THREE.Vector3(x, 0, z))); }
  let mnx = 1e9, mxx = -1e9; corners.forEach(v => { mnx = Math.min(mnx, v.x); mxx = Math.max(mxx, v.x); });
  const topF = 1 - 2 * (SAFE.t / VH), botF = -1 + 2 * (SAFE.b / VH), want = (topF + botF) / 2;
  const tgt = new THREE.Vector3((mnx + mxx) / 2, 0, CZ), cam = camera.clone();
  const place = d => { cam.position.set(tgt.x, Math.cos(polar) * d, tgt.z + Math.sin(polar) * d); cam.lookAt(tgt); cam.updateMatrixWorld(); };
  const span = () => { let a = 1e9, b = -1e9, xm = 0; for (const c of corners) { const p = c.clone().project(cam); a = Math.min(a, p.y); b = Math.max(b, p.y); xm = Math.max(xm, Math.abs(p.x)); } return [a, b, xm]; };
  let d = 120;
  for (let it = 0; it < 7; it++) { let lo = 15, hi = 600; for (let k = 0; k < 26; k++) { d = (lo + hi) / 2; place(d); const [a, b, xm] = span(); if (xm < .97 && b < topF - .015 && a > botF + .015) hi = d; else lo = d; } d = hi; place(d); const [a, b] = span(); tgt.z += (want - (a + b) / 2) * d * Math.tan(camera.fov * Math.PI / 360) * .7; }
  place(d); return { tgt: tgt.clone(), pos: cam.position.clone() };
}
async function flyTo(pose, dur = 1.2) {
  const p0 = camera.position.clone(), t0 = controls.target.clone(); controls.enabled = false;
  await tween(dur, q => { const k = ease.inout(q); camera.position.lerpVectors(p0, pose.pos, k); controls.target.lerpVectors(t0, pose.tgt, k); camera.lookAt(controls.target); });
  controls.enabled = true; controls.update();
}
function focusPath(edges, C) {
  const pts = [new THREE.Vector3(C.x, 0, C.z)]; edges.forEach(e => pts.push(new THREE.Vector3(CITY[e.a].x, 0, CITY[e.a].z), new THREE.Vector3(CITY[e.b].x, 0, CITY[e.b].z)));
  const box = new THREE.Box3().setFromPoints(pts), ctr = box.getCenter(new THREE.Vector3()), size = Math.max(10, box.getSize(new THREE.Vector3()).length());
  const pol = .86, dist = Math.min(100, Math.max(55, size * 2.5)), tgt = new THREE.Vector3(ctr.x, 0, ctr.z);
  return flyTo({ tgt, pos: new THREE.Vector3(tgt.x, Math.cos(pol) * dist, tgt.z + Math.sin(pol) * dist) }, .9);
}
$('#bView').onclick = () => flyTo(fitPose(), 1.0);

// ---------- post processing ----------
const TiltShift = {
  uniforms: { tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uDir: { value: new THREE.Vector2(1, 0) }, uFocus: { value: .5 }, uBand: { value: .27 }, uAmt: { value: 2.2 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uRes, uDir; uniform float uFocus, uBand, uAmt; varying vec2 vUv;
    void main(){ float b=smoothstep(uBand, uBand+.38, abs(vUv.y-uFocus))*uAmt; vec2 o=uDir/uRes*b;
      vec4 c=texture2D(tDiffuse,vUv)*.2270270;
      c+=(texture2D(tDiffuse,vUv+o*1.3846)+texture2D(tDiffuse,vUv-o*1.3846))*.3162162;
      c+=(texture2D(tDiffuse,vUv+o*3.2308)+texture2D(tDiffuse,vUv-o*3.2308))*.0702703;
      gl_FragColor=c; }`
};
const Vignette = {
  uniforms: { tDiffuse: { value: null }, uV: { value: 1.05 } }, vertexShader: TiltShift.vertexShader,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uV; varying vec2 vUv; void main(){ vec4 c=texture2D(tDiffuse,vUv); vec2 d=vUv-.5; float v=1.-dot(d,d)*uV; gl_FragColor=vec4(c.rgb*clamp(v,0.,1.),c.a); }`
};
let QUAL = (() => { try { return localStorage.getItem('gm2-3d-q') || 'hi'; } catch (e) { return 'hi'; } })();
let composer, rt, tsH, tsV;
function setupComposer() {
  const hi = QUAL === 'hi', dpr = Math.min(devicePixelRatio || 1, hi ? 2 : 1.5);
  renderer.setPixelRatio(dpr); renderer.setSize(VW, VH, false);
  rt && rt.dispose();
  rt = new THREE.WebGLRenderTarget(VW * dpr, VH * dpr, { type: THREE.HalfFloatType, samples: hi ? 4 : 0 });
  composer = new EffectComposer(renderer, rt); composer.setPixelRatio(dpr); composer.setSize(VW, VH);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(VW * (hi ? 1 : .5), VH * (hi ? 1 : .5)), bloomBase, .6, .9); composer.addPass(bloomPass);
  tsH = new ShaderPass(TiltShift); tsV = new ShaderPass(TiltShift); tsV.uniforms.uDir.value.set(0, 1);
  [tsH, tsV].forEach(p => { p.uniforms.uRes.value.set(VW * dpr, VH * dpr); p.uniforms.uAmt.value = 1.7 * dpr / 2; p.enabled = hi; composer.addPass(p); });
  composer.addPass(new ShaderPass(Vignette)); composer.addPass(new OutputPass());
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = hi; moon.castShadow = hi;
  scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); });
  $('#bQ').textContent = hi ? 'HQ' : 'Eco'; $('#bQ').setAttribute('aria-label', `${T.q}: ${hi ? T.hi : T.lo}`);
}
$('#bQ').onclick = () => { QUAL = QUAL === 'hi' ? 'lo' : 'hi'; try { localStorage.setItem('gm2-3d-q', QUAL); } catch (e) { } setupComposer(); layoutHUD(); };

// ---------- layout ----------
function layoutHUD() {
  const top = $('#top').getBoundingClientRect(), bot = $('#bot').getBoundingClientRect();
  SAFE.t = top.height ? top.bottom + 6 : 6; SAFE.b = bot.height ? VH - bot.top + 6 : 6;
  if (card.classList.contains('on') && card.offsetHeight && !matchMedia('(orientation: landscape) and (max-height: 500px)').matches) SAFE.b = VH - card.getBoundingClientRect().top + 6;
  const f = 1 - ((SAFE.t + (VH - SAFE.b)) / 2) / VH; if (tsH) [tsH, tsV].forEach(p => p.uniforms.uFocus.value = f);
}
function resize() { VW = innerWidth; VH = innerHeight; camera.aspect = VW / VH; camera.updateProjectionMatrix(); setupComposer(); layoutHUD(); }
addEventListener('resize', () => { resize(); if (!BUSY && !introRunning) { const p = fitPose(); camera.position.copy(p.pos); controls.target.copy(p.tgt); controls.update(); } });

// ---------- picking ----------
let pd = null;
renderer.domElement.addEventListener('pointerdown', e => { pd = { x: e.clientX, y: e.clientY, t: performance.now() }; if (introRunning) skipIntro(); });
renderer.domElement.addEventListener('pointerup', e => {
  if (!pd) return; const moved = Math.hypot(e.clientX - pd.x, e.clientY - pd.y), dt = performance.now() - pd.t; pd = null;
  if (moved > 8 || dt > 450 || BUSY) return;
  let best = null, bd = 40; const v = new THREE.Vector3();
  for (const c of Object.values(CITY)) { v.set(c.x, c.y + .2, c.z).project(camera); const d = Math.hypot((v.x * .5 + .5) * VW - e.clientX, (-v.y * .5 + .5) * VH - e.clientY); if (d < bd) { bd = d; best = c; } }
  if (best) select(best.id); else closeCard();
});

// ---------- labels ----------
const _p = new THREE.Vector3();
function updateLabels() {
  const camD = camera.position.distanceTo(controls.target), showCost = camD < 70, pathEdges = new Set();
  if (SEL) { const q = quote(SEL); (q.path || []).forEach(p => pathEdges.add(p.e)); }
  const placed = [...document.querySelectorAll('.brand,.money,#bot button,#card.on,#toast.on')].map(e => { const r = e.getBoundingClientRect(); return [r.left - 2, r.top - 2, r.right + 2, r.bottom + 2]; });
  const items = LBL.map(l => { _p.copy(l.w3).project(camera); return { l, x: (_p.x * .5 + .5) * VW, y: (-_p.y * .5 + .5) * VH, vis: _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1, pri: l.pri + (l.c && (l.c.houses.length || l.c.reach || l.c.id === SEL) ? 2 : 0) + (l.e && pathEdges.has(l.e) ? 3 : 0) }; });
  items.sort((a, b) => b.pri - a.pri);
  for (const it of items) {
    const { l } = it; let show = it.vis && !introRunning && (l.c || showCost || pathEdges.has(l.e));
    if (show) { const w = l.w || (l.w = l.el.offsetWidth), h = l.h || (l.h = l.el.offsetHeight); const r = [it.x - w / 2 - 2, it.y - h / 2 - 1, it.x + w / 2 + 2, it.y + h / 2 + 1]; if (r[0] < 4 || r[2] > VW - 4) show = false; else if (placed.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) show = false; else placed.push(r); }
    l.el.style.visibility = show ? 'visible' : 'hidden';
    if (show) { l.el.style.transform = `translate(${it.x}px,${it.y}px) translate(-50%,-50%)`; l.el.classList.toggle('hl', !!((l.e && pathEdges.has(l.e)) || (l.c && l.c.id === SEL))); l.el.classList.toggle('own', !!(l.c && l.c.houses.includes(ME))); }
  }
}

// ---------- intro ----------
let introRunning = true, introSkip = false;
function skipIntro() { introSkip = true; TW_.forEach(t => { if (t.t < 0) t.t = 0; t.dur = Math.min(t.dur, .05); }); }
async function intro() {
  const pose = fitPose();
  Object.values(CITY).forEach(c => c.g.scale.set(1, .001, 1));
  moon.intensity = 0; warm.intensity = 0;
  controls.enabled = false;
  // sweeping fly-over from the Alps, northwards, then up into the play view
  const path = new THREE.CatmullRomCurve3([new THREE.Vector3(CX + 22, 7, maxZ + 10), new THREE.Vector3(CX + 8, 14, CZ + 18), new THREE.Vector3(CX - 18, 30, CZ - 4), pose.pos.clone()]);
  const look = new THREE.CatmullRomCurve3([new THREE.Vector3(CX + 4, 1, maxZ - 12), new THREE.Vector3(CX - 2, 0, CZ + 2), new THREE.Vector3(CX, 0, CZ - 6), pose.tgt.clone()]);
  const D = reduced ? .2 : 5.2;
  tween(2.4, k => { moon.intensity = 1.9 * ease.out(k); warm.intensity = .55 * ease.out(k); });
  tween(3.4, k => { terrainUniforms.uScan.value = maxZ + 6 - (BH + 12) * ease.inout(k); }, .2).then(() => terrainUniforms.uScan.value = -999);
  Object.values(CITY).forEach(c => {
    const dl = .4 + (maxZ - c.z) / BH * 3.0, st = SKY.state[c.idx];
    tween(.55, q => c.g.scale.set(1, Math.max(.001, ease.back(q)), 1), dl);
    tween(1.1, q => { st.rise = ease.back(q); }, dl + .1).then(() => { st.rise = 1; });
    tween(1.4, q => { st.light = q * 1.12 * (.6 + .4 * Math.random()); }, dl + .6).then(() => st.light = 1.12);
  });
  const fly = tween(D, q => { const e = ease.inout(q); camera.position.copy(path.getPointAt(e)); controls.target.copy(look.getPointAt(e)); camera.lookAt(controls.target); });
  await fly; controls.enabled = true; controls.update();
  for (const [pl, list] of DEMO) {
    for (let i = 0; i < list.length; i++) {
      if (i) { const e = EDGES.find(e => (e.a === list[i] && e.b === list[i - 1]) || (e.b === list[i] && e.a === list[i - 1])); if (e) { const ln = buildLine(e, pl); ln.from = list[i - 1]; animLine(ln, 2.4); } }
      wait(i * .25).then(() => dropHouse(list[i], pl, 2));
    }
    await wait(introSkip ? 0 : .45);
  }
  await wait(1.6); drawLights();
  introRunning = false; markReachable(); toast(T.start, 3600);
}

// ---------- loop ----------
const clock = new THREE.Clock(); let fpsN = 0, fpsT = 0, autoChecked = false;
function loop() {
  const raw = clock.getDelta(); const dt = FDT || Math.min(TESTMODE ? 1 : .05, raw); SIMT += dt; const t = SIMT;
  for (let i = TW_.length - 1; i >= 0; i--) { const w = TW_[i]; w.t += dt; if (w.t < 0) continue; const k = Math.min(1, w.t / w.dur); w.fn(k); if (k >= 1) { TW_.splice(i, 1); w.done(); } }
  for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i]; f.t += dt; const k = Math.min(1, f.t / f.dur); f.up(k, dt); if (k >= 1) { FX.splice(i, 1); f.end(); } }
  terrainUniforms.uT.value = t; groundMat.uniforms.uT.value = t;
  LINES.forEach(l => l.wires.forEach(w => w.material.uniforms.uT.value = t));
  Object.values(CITY).forEach(c => { const r = c.ring, target = c.ringOn ? (c.id === SEL ? 1 : .3 + .14 * Math.sin(t * 2.6 + c.x)) : 0; r.material.opacity += (target - r.material.opacity) * Math.min(1, dt * 8); r.scale.setScalar(c.id === SEL ? 1.12 + .04 * Math.sin(t * 5) : 1); r.visible = r.material.opacity > .01; });
  if (SKY) SKY.update(t);
  if (CHASE) { const o = CHASE.orb.position, d = CHASE.dir; const want = new THREE.Vector3(o.x - d.x * 9 + d.z * 3, o.y + 5.5, o.z - d.z * 9 - d.x * 3); const f = 1 - Math.exp(-dt * 3.2); camera.position.lerp(want, f); controls.target.lerp(new THREE.Vector3(o.x + d.x * 3, o.y - 1, o.z + d.z * 3), f); camera.lookAt(controls.target); }
  if (controls.enabled) controls.update();
  let sh = null; if (SHAKE > .002) { sh = camera.position.clone(); camera.position.add(new THREE.Vector3((Math.random() - .5) * SHAKE, (Math.random() - .5) * SHAKE, (Math.random() - .5) * SHAKE)); SHAKE *= Math.exp(-dt * 7); }
  composer.render(dt); if (sh) camera.position.copy(sh); updateLabels();
  fpsN++; fpsT += dt; if (fpsT > 1) { const fps = fpsN / fpsT, f = $('#fps'); if (f) f.textContent = fps.toFixed(0) + ' fps'; let stored = null; try { stored = localStorage.getItem('gm2-3d-q'); } catch (e) { } if (!introRunning && !autoChecked && QUAL === 'hi' && !stored && !TESTMODE && fps < 36) { autoChecked = true; QUAL = 'lo'; setupComposer(); } fpsN = 0; fpsT = 0; }
  requestAnimationFrame(loop);
}

// ---------- boot ----------
$('#bPower').textContent = T.power; $('#bView').textContent = T.view; $('#bMkt').textContent = DE ? 'Rohstoffe' : 'Resources'; $('#bMkt').onclick = openMarket;
if (QS.has('debug')) $('#fps').hidden = false;
buildTerrain(); buildCities(); SKY = createSkylines(Object.values(CITY), ADJ); scene.add(SKY.group); buildMarket(); buildGround(); initLabels();
document.fonts && document.fonts.ready.then(() => LBL.forEach(l => { l.w = l.h = 0; }));
resize(); intro(); loop();
window.__gm3d = { look: (cid, d = 9, pol = .95, az = .4) => { const c = CITY[cid], tg = new THREE.Vector3(c.x, c.y + .8, c.z); controls.target.copy(tg); camera.position.set(tg.x + Math.sin(az) * Math.sin(pol) * d, tg.y + Math.cos(pol) * d, tg.z + Math.cos(az) * Math.sin(pol) * d); camera.lookAt(tg); controls.update(); }, market: openMarket, cart: (k, n) => { CART[k] = n; renderMarketCard(); previewCart(); }, select, CITY, quote, build: () => $('#cBuild').onclick(), power: () => $('#bPower').onclick(), state: () => ({ introRunning, BUSY, money: PLAYERS[ME].money, t: SIMT }), skip: skipIntro };
