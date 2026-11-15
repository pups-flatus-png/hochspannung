// Grid Master 2 – 3D-Spieltisch: Karte, Rohstoffmarkt, Kraftwerksmarkt, Spielerbereich, Städteleiste, Münzen.
// Spiellogik (vereinfachte Demo mit echten Regeln für Kosten, Stufen, Nachschub) + alle Phasen-Animationen.
// Themes liefern Materialien, Figuren und Animations-Charakter.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import MAP from './map.json';

export { THREE, RoundedBoxGeometry };
// ---------- data ----------
export const S = 1 / 9, wx = px => (px - 290) * S, wz = py => (py - 386) * S;
export const CITY = {}, ADJ = {};
MAP.cities.forEach(c => { CITY[c.id] = { ...c, X: wx(c.x), Z: wz(c.y) }; ADJ[c.id] = []; });
export const EDGES = MAP.edges.map(([a, b, cost], i) => { const e = { i, a, b, cost }; ADJ[a].push(e); ADJ[b].push(e); return e; });
export const PLANTDATA = { 3: ['oil', 2, 1], 4: ['coal', 2, 1], 5: ['hybrid', 2, 1], 6: ['garbage', 1, 1], 7: ['oil', 3, 2], 8: ['coal', 3, 2], 9: ['oil', 1, 1], 10: ['coal', 2, 2], 11: ['uranium', 1, 2], 12: ['hybrid', 2, 2], 13: ['eco', 0, 1], 14: ['garbage', 2, 2], 15: ['coal', 2, 3], 16: ['oil', 2, 3], 17: ['uranium', 1, 2], 18: ['eco', 0, 2], 19: ['garbage', 2, 3], 20: ['coal', 3, 5], 21: ['hybrid', 2, 4], 22: ['eco', 0, 2], 23: ['uranium', 1, 3], 24: ['garbage', 2, 4], 25: ['coal', 2, 5], 26: ['oil', 2, 5], 27: ['eco', 0, 3], 28: ['uranium', 1, 4], 29: ['hybrid', 1, 4], 30: ['garbage', 3, 6], 31: ['coal', 3, 6], 34: ['uranium', 1, 5], 38: ['garbage', 3, 7] };
export const RES = ['coal', 'oil', 'garbage', 'uranium'];
export const RNAME = { coal: 'Kohle', oil: 'Öl', garbage: 'Müll', uranium: 'Uran', eco: 'Öko', hybrid: 'Kohle/Öl' };
export const PRICE = (k, i) => k === 'uranium' ? [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16][i] : Math.floor(i / 3) + 1;
export const INCOME = [10, 22, 33, 44, 54, 64, 73, 82, 90, 98, 105];
export const REFILL = { 1: { coal: 4, oil: 2, garbage: 1, uranium: 1 }, 2: { coal: 5, oil: 3, garbage: 2, uranium: 1 }, 3: { coal: 3, oil: 4, garbage: 3, uranium: 1 } };

// ---------- tweens ----------
export const E = { lin: k => k, out: k => 1 - (1 - k) ** 3, in: k => k * k * k, inout: k => k < .5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2, back: k => { const c = 1.7; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; }, spring: k => 1 - Math.cos(k * Math.PI * 4.5) * Math.exp(-k * 6), snap: k => k < .7 ? E.out(k / .7) * 1.06 : 1.06 - .06 * E.inout((k - .7) / .3), bounce: k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; } };
const TW = []; let SPEED = 1; const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export function setSpeed(s) { SPEED = s; }
export function tween(dur, fn, ease = 'inout', delay = 0) { return new Promise(res => TW.push({ t: -delay * SPEED, d: reduced ? Math.min(dur, .1) : dur * SPEED, fn, e: typeof ease === 'function' ? ease : E[ease], res })); }
export const wait = s => tween(s, () => { }, 'lin');
function stepTweens(dt) { for (let i = TW.length - 1; i >= 0; i--) { const w = TW[i]; w.t += dt; if (w.t < 0) continue; const k = Math.min(1, w.t / w.d); w.fn(w.e(k), k); if (k >= 1) { TW.splice(i, 1); w.res(); } } }
export const lerp = (a, b, k) => a + (b - a) * k;
export function rng(seed) { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------- canvas helpers ----------
export function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
export function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
function pathPolys(d) { return d.split('M').filter(Boolean).map(s => s.replace('Z', '').split('L').map(p => p.split(',').map(Number))); }
export function slab(w, l, depth, r, topMat, sideMat) { // rounded slab, top at y=0, UVs 0..1 on top
  const s = new THREE.Shape(), hw = w / 2, hl = l / 2; s.moveTo(-hw + r, -hl); s.lineTo(hw - r, -hl); s.quadraticCurveTo(hw, -hl, hw, -hl + r); s.lineTo(hw, hl - r); s.quadraticCurveTo(hw, hl, hw - r, hl); s.lineTo(-hw + r, hl); s.quadraticCurveTo(-hw, hl, -hw, hl - r); s.lineTo(-hw, -hl + r); s.quadraticCurveTo(-hw, -hl, -hw + r, -hl);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 2 }); g.rotateX(-Math.PI / 2); g.translate(0, -depth, 0);
  const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + hw) / w, 1 - (p.getZ(i) + hl) / l);
  const m = new THREE.Mesh(g, [topMat, sideMat]); m.receiveShadow = true; m.castShadow = true; return m;
}

// ================= TABLE =================
export function createTable(theme, mode = 'dark', opt = {}) {
  const T = theme, P = T.palette(mode);
  const renderer = opt.renderer || new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = P.exposure || 1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.bg);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = P.env ?? .5;
  const camera = new THREE.PerspectiveCamera(32, 1, .5, 800);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = .09; controls.screenSpacePanning = false; controls.maxPolarAngle = 1.2; controls.minDistance = 8; controls.maxDistance = 320;
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }; controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  // lights
  const hemi = new THREE.HemisphereLight(P.sky || 0xffffff, P.ground || 0x444444, P.hemi ?? 1); scene.add(hemi);
  const key = new THREE.DirectionalLight(P.key || 0xffffff, P.keyI ?? 1.6); key.position.set(-40, 90, 50); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, near: 10, far: 260 }); key.shadow.bias = -.0005; key.shadow.normalBias = .04; scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(P.fill || 0xffffff, P.fillI ?? .4); fill.position.set(60, 40, -30); scene.add(fill);
  // table surface
  const tableTex = T.tableTex ? T.tableTex(P) : null;
  const table = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.MeshStandardMaterial({ color: P.table, map: tableTex, roughness: .9, metalness: 0 })); table.rotation.x = -Math.PI / 2; table.position.y = -.62; table.receiveShadow = true; scene.add(table);
  if (P.fog) scene.fog = new THREE.Fog(P.bg, 180, 420);
  const fx = new THREE.Group(); scene.add(fx);
  const ctx = { THREE, T, P, scene, camera, controls, renderer, fx, mode, E, tween, wait, lerp, rng, canvasTex, rr };

  // ---------- state ----------
  const ME = 0; const ST = opt.state || {
    step: 1, round: 4,
    players: [{ name: 'Du', money: 60, plants: [10, 16], stock: { 10: 0, 16: 0 } }, { name: 'Rhein AG', money: 41, plants: [15, 18], stock: {} }, { name: 'Isar Energie', money: 55, plants: [12, 14], stock: {} }],
    order: [1, 2, 0], owners: {}, lines: [],
    occ: { coal: [...Array(24).keys()], oil: [...Array(18).keys()].map(i => i + 6), garbage: [18, 19, 20, 21, 22, 23], uranium: [10, 11] },
    market: [17, 19, 20, 21, 22, 23, 24, 25], deck: [31, 27, 34, 26, 29, 38, 30, 28],
  };
  if (!opt.state) { [[0, ['berlin', 'potsdam', 'leipzig']], [1, ['koeln', 'duesseldorf', 'essen', 'dortmund']], [2, ['muenchen', 'augsburg', 'nuernberg']]].forEach(([pl, list]) => list.forEach((id, i) => { (ST.owners[id] ||= []).push(pl); if (i) { const e = EDGES.find(e => (e.a === id && e.b === list[i - 1]) || (e.b === id && e.a === list[i - 1])); if (e) ST.lines.push({ e: e.i, pl, from: list[i - 1] }); } })); }
  ctx.ST = ST; ctx.ME = ME; ctx.pcol = i => P.players[i];

  // ---------- map board ----------
  const MAPW = MAP.w * S, MAPL = MAP.h * S;
  const mapTop = canvasTex(2048, Math.round(2048 * MAP.h / MAP.w), (x, w, h) => { x.scale(w / MAP.w, h / MAP.h); T.drawMap(x, MAP, P, ST); });
  const polys = pathPolys(MAP.land).filter(p => p.length > 8);
  const mapGroup = new THREE.Group(); scene.add(mapGroup);
  const topMat = new THREE.MeshStandardMaterial({ map: mapTop, roughness: P.mapRough ?? .85, metalness: 0 }), sideMat = new THREE.MeshStandardMaterial({ color: P.edge, roughness: .6, metalness: P.edgeMetal ?? .1 });
  polys.forEach(poly => {
    const s = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(wx(x), -wz(y)))); const depth = P.mapDepth ?? .55;
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, -depth, 0);
    const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) / S + 290) / MAP.w, 1 - (p.getZ(i) / S + 386) / MAP.h);
    const m = new THREE.Mesh(g, [topMat, sideMat]); m.receiveShadow = true; m.castShadow = true; mapGroup.add(m);
  });
  ctx.refreshMap = () => { const c = mapTop.image, x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.scale(c.width / MAP.w, c.height / MAP.h); T.drawMap(x, MAP, P, ST); mapTop.needsUpdate = true; };

  // ---------- cities ----------
  const cityG = {}; const cities = new THREE.Group(); scene.add(cities);
  MAP.cities.forEach(c0 => { const c = CITY[c0.id]; const g = new THREE.Group(); g.position.set(c.X, 0, c.Z); g.userData = { city: c.id, houses: [] }; const base = T.cityBase(ctx, c); g.add(base); cities.add(g); cityG[c.id] = g; });
  const SLOT = [[-.62, .34], [.62, .34], [0, -.62]];
  ctx.slotPos = (id, i) => new THREE.Vector3(CITY[id].X + SLOT[i][0], 0, CITY[id].Z + SLOT[i][1]);
  function placeHouse(id, pl, i) { const h = T.house(ctx, pl, CITY[id], i); if (h.userData.centered) h.position.set(0, 0, 0); else h.position.set(SLOT[i][0], .1, SLOT[i][1]); cityG[id].add(h); cityG[id].userData.houses[i] = h; return h; }
  Object.entries(ST.owners).forEach(([id, list]) => list.forEach((pl, i) => placeHouse(id, pl, i)));
  // reach / select markers
  const ringMat = new THREE.MeshBasicMaterial({ color: P.accent, transparent: true, opacity: .0, depthWrite: false });
  const ringGeo = new THREE.RingGeometry(1.6, 1.72, 48); ringGeo.rotateX(-Math.PI / 2);
  MAP.cities.forEach(c => { const r = new THREE.Mesh(ringGeo, ringMat.clone()); r.position.y = .03; r.visible = false; cityG[c.id].add(r); cityG[c.id].userData.ring = r; });

  // ---------- lines ----------
  const lineGroup = new THREE.Group(); scene.add(lineGroup);
  ctx.lineEnds = (e, lane) => { const A = CITY[e.a], B = CITY[e.b], dx = B.X - A.X, dz = B.Z - A.Z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux, o = (lane - (lane ? .5 : 0)) * .55, t = 1.25; return { a: new THREE.Vector3(A.X + ux * t + nx * o, 0, A.Z + uz * t + nz * o), b: new THREE.Vector3(B.X - ux * t + nx * o, 0, B.Z - uz * t + nz * o), L: L - 2 * t, ux, uz, nx, nz }; };
  const lineObjs = [];
  function addLine(l, instant = true) { const e = EDGES[l.e]; const lane = ST.lines.filter(x => x.e === l.e).indexOf(l); const ends = ctx.lineEnds(e, Math.max(0, lane)); const o = T.line(ctx, ends, l.pl); o.obj.userData.l = l; lineGroup.add(o.obj); if (instant) o.set(1); lineObjs.push({ l, ...o, ends }); return lineObjs[lineObjs.length - 1]; }
  ST.lines.forEach(l => addLine(l, true));

  // ---------- resource market board ----------
  const MK = { x: 46, z: -8, W: 15, L: 38 };
  const mkTop = canvasTex(15 * 48, 38 * 48, (x, w, h) => T.drawMarket(x, w, h, P, MK));
  const mk = slab(MK.W, MK.L, P.boardDepth ?? .45, .8, new THREE.MeshStandardMaterial({ map: mkTop, roughness: .8 }), sideMat); mk.position.set(MK.x, 0, MK.z); scene.add(mk);
  ctx.mslot = (k, i) => { const li = RES.indexOf(k), lx = MK.x - MK.W / 2 + 1.2 + 3.2 * (li + .5), z0 = MK.z - MK.L / 2 + 3.4, TR = 30; if (k === 'uranium') return new THREE.Vector3(lx, 0, z0 + (i + .5) * TR / 12); const cell = Math.floor(i / 3), j = i % 3; return new THREE.Vector3(lx + (j - 1) * .82 - .25, 0, z0 + (cell + .5) * TR / 8); };
  const pieces = { coal: [], oil: [], garbage: [], uranium: [] }; const pieceGroup = new THREE.Group(); scene.add(pieceGroup);
  function addPiece(k, i, at) { const m = T.resource(ctx, k); m.position.copy(at || ctx.mslot(k, i)); m.rotation.y = (Math.random() - .5) * .5; pieceGroup.add(m); const p = { m, k, i }; return p; }
  RES.forEach(k => ST.occ[k].forEach(i => pieces[k].push(addPiece(k, i))));

  // ---------- plant market board ----------
  const PM = { x: -46, z: -14, W: 15, L: 28 };
  const pmTop = canvasTex(15 * 48, 28 * 48, (x, w, h) => T.drawPlantBoard(x, w, h, P, PM));
  const pmb = slab(PM.W, PM.L, P.boardDepth ?? .45, .8, new THREE.MeshStandardMaterial({ map: pmTop, roughness: .8 }), sideMat); pmb.position.set(PM.x, 0, PM.z); scene.add(pmb);
  const CW = 5.6, CD = 3.9;
  ctx.cslot = i => new THREE.Vector3(PM.x + (i < 4 ? -3.2 : 3.2), .06, PM.z - PM.L / 2 + 4.2 + (i % 4) * 4.5);
  ctx.deckPos = () => new THREE.Vector3(PM.x, .06, PM.z + PM.L / 2 - 3.6);
  const cardGeo = new RoundedBoxGeometry(CW, .09, CD, 2, .04);
  const backTex = canvasTex(400, 280, (x, w, h) => T.drawCardBack(x, w, h, P));
  function makeCard(n) { const g = new THREE.Group(); const body = new THREE.Mesh(cardGeo, new THREE.MeshStandardMaterial({ color: P.cardEdge || 0xdddddd, roughness: .6 })); body.castShadow = true; body.receiveShadow = true; g.add(body);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(CW - .1, CD - .1), new THREE.MeshStandardMaterial({ map: canvasTex(400, 280, (x, w, h) => T.drawCard(x, w, h, n, PLANTDATA[n], P)), roughness: .55 })); face.rotation.x = -Math.PI / 2; face.position.y = .047; g.add(face);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(CW - .1, CD - .1), new THREE.MeshStandardMaterial({ map: backTex, roughness: .55 })); back.rotation.x = Math.PI / 2; back.rotation.z = Math.PI; back.position.y = -.047; g.add(back);
    g.userData = { card: n }; return g; }
  const cards = new Map(); const cardGroup = new THREE.Group(); scene.add(cardGroup);
  const sortedMarket = () => [...ST.market].sort((a, b) => a - b);
  sortedMarket().forEach((n, i) => { const c = makeCard(n); c.position.copy(ctx.cslot(i)); cardGroup.add(c); cards.set(n, c); });
  const deckCards = ST.deck.map((n, i) => { const c = makeCard(n); c.position.copy(ctx.deckPos()); c.position.y += i * .1; c.rotation.z = Math.PI; cardGroup.add(c); return c; });

  // ---------- player area (my plants, storage, coins) ----------
  const PA = { x: -46, z: 24, W: 15, L: 17 };
  const paTop = canvasTex(15 * 48, 17 * 48, (x, w, h) => T.drawPlayerBoard(x, w, h, P, PA));
  const pab = slab(PA.W, PA.L, P.boardDepth ?? .45, .8, new THREE.MeshStandardMaterial({ map: paTop, roughness: .8 }), sideMat); pab.position.set(PA.x, 0, PA.z); scene.add(pab);
  ctx.mineSlot = i => new THREE.Vector3(PA.x - 4.75 + i * 4.75, .06, PA.z - 3.4);
  ctx.storeSlot = (pi, j) => new THREE.Vector3(PA.x - 4.75 + pi * 4.75 - 1.05 + (j % 3) * 1.05, .06, PA.z - .2 + Math.floor(j / 3) * .95);
  const mine = ST.players[ME].plants.map((n, i) => { const c = makeCard(n); c.scale.setScalar(.78); c.position.copy(ctx.mineSlot(i)); cardGroup.add(c); return c; });
  const stored = {}; ST.players[ME].plants.forEach(n => stored[n] = []);
  // coins
  const coinGroup = new THREE.Group(); scene.add(coinGroup); const coins = [];
  ctx.coinPos = i => new THREE.Vector3(PA.x - 5.6 + (Math.floor(i / 10) % 6) * 1.5, .06 + (i % 10) * .19, PA.z + 5.2);
  ctx.bankPos = () => new THREE.Vector3(MK.x, .2, MK.z + MK.L / 2 + 4);
  function syncCoins(animate = false) { const want = Math.max(0, Math.round(ST.players[ME].money / 5)); while (coins.length > want) coinGroup.remove(coins.pop()); while (coins.length < want) { const c = T.coin(ctx); c.position.copy(ctx.coinPos(coins.length)); coinGroup.add(c); coins.push(c); } }
  syncCoins();
  // bank pile
  const bank = new THREE.Group(); for (let i = 0; i < 18; i++) { const c = T.coin(ctx); c.position.set((i % 6 - 2.5) * 1.3, i % 6 === 0 ? 0 : Math.floor(i / 6) * .19, Math.floor(i / 6) * 0 + (i % 3) * .2); bank.add(c); } bank.position.copy(ctx.bankPos()); scene.add(bank);

  // ---------- city track + turn order ----------
  const TR = { x: 0, z: 52, W: 66, L: 6 };
  const trTop = canvasTex(66 * 32, 6 * 32, (x, w, h) => T.drawTrack(x, w, h, P));
  const trb = slab(TR.W, TR.L, P.boardDepth ?? .45, .8, new THREE.MeshStandardMaterial({ map: trTop, roughness: .8 }), sideMat); trb.position.set(TR.x, 0, TR.z); scene.add(trb);
  ctx.trackPos = (n, pl) => new THREE.Vector3(TR.x - TR.W / 2 + 12 + n * 2.55, .1 + pl * .34, TR.z + .6);
  ctx.orderPos = i => new THREE.Vector3(TR.x - TR.W / 2 + 2.6 + i * 2.7, .1, TR.z + .6);
  const discs = ST.players.map((p, pl) => { const d = T.disc(ctx, pl); d.position.copy(ctx.trackPos(cityCount(pl), pl)); scene.add(d); return d; });
  const orderDiscs = ST.order.map((pl, i) => { const d = T.disc(ctx, pl); d.position.copy(ctx.orderPos(i)); scene.add(d); return d; });
  function cityCount(pl) { return Object.values(ST.owners).filter(o => o.includes(pl)).length; }

  // ---------- generic fx ----------
  const glowTex = canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  const FX = ctx.FX = {
    sprite(col, s = 1, add = true) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(col), transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending })); m.scale.setScalar(s); fx.add(m); return m; },
    kill(o) { fx.remove(o); o.material && o.material.dispose && o.material.dispose(); },
    burst(pos, cols, n = 24, o = {}) { const g = new THREE.Group(); fx.add(g); const parts = []; for (let i = 0; i < n; i++) { const col = Array.isArray(cols) ? cols[i % cols.length] : cols; const m = o.mesh ? o.mesh(col) : new THREE.Mesh(new THREE.BoxGeometry(.12, .12, .12), new THREE.MeshBasicMaterial({ color: col })); m.position.copy(pos); g.add(m); const a = Math.random() * 6.283, s = (o.speed || 4) * (.4 + Math.random()); parts.push({ m, v: new THREE.Vector3(Math.cos(a) * s, (o.up || 4) * (.5 + Math.random()), Math.sin(a) * s), r: new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0) }); }
      let last = 0; return tween(o.life || 1.1, (e, k) => { const dt = (k - last) * (o.life || 1.1); last = k; parts.forEach(p => { p.v.y -= (o.g ?? 9) * dt; p.m.position.addScaledVector(p.v, dt); if (p.m.position.y < .05) { p.m.position.y = .05; p.v.multiplyScalar(.5); } p.m.rotation.x += p.r.x * dt; p.m.rotation.y += p.r.y * dt; p.m.scale.setScalar(1 - k * .6); }); }, 'lin').then(() => { fx.remove(g); }); },
    ripple(pos, col, r = 3, dur = 1) { const m = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.copy(pos).setY(.06); fx.add(m); return tween(dur, (e, k) => { m.scale.setScalar(.3 + r * e); m.material.opacity = 1 - k; }, 'out').then(() => FX.kill(m)); },
    arc(obj, to, dur = 1, h = 4, ease = 'inout', spin = 0) { const a = obj.position.clone(), r0 = obj.rotation.y; return tween(dur, e => { obj.position.lerpVectors(a, to, e); obj.position.y += Math.sin(e * Math.PI) * h; obj.rotation.y = r0 + spin * e; }, ease); },
    label(text, pos, col = '#fff', dur = 1.4, size = 1) { const tex = canvasTex(256, 96, (x) => { x.font = '700 54px ' + (T.font || 'sans-serif'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 10; x.strokeStyle = 'rgba(0,0,0,.65)'; x.strokeText(text, 128, 50); x.fillStyle = col; x.fillText(text, 128, 50); }); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(3.2 * size, 1.2 * size, 1); s.position.copy(pos); s.renderOrder = 10; fx.add(s); return tween(dur, (e, k) => { s.position.y = pos.y + e * 1.6; s.material.opacity = k < .75 ? 1 : (1 - k) / .25; }, 'out').then(() => FX.kill(s)); },
  };

  // ---------- camera presets ----------
  const VIEWS = {
    overview: { t: [0, 0, 6], d: 150, pol: .78, az: 0 }, map: { t: [0, 0, 2], d: 118, pol: .62, az: 0 },
    market: { t: [MK.x, 0, MK.z + 2], d: 52, pol: .72, az: -.12 }, plants: { t: [PM.x, 0, PM.z + 1], d: 46, pol: .7, az: .12 },
    player: { t: [PA.x, 0, PA.z + 1], d: 32, pol: .82, az: .1 }, track: { t: [0, 0, TR.z - 2], d: 58, pol: .9, az: 0 },
    north: { t: [CITY.hamburg.X + 6, 0, CITY.hamburg.Z + 6], d: 40, pol: .78, az: .2 }, east: { t: [CITY.berlin.X - 4, 0, CITY.berlin.Z + 6], d: 44, pol: .8, az: -.15 },
    city: { t: [CITY.berlin.X, 0, CITY.berlin.Z], d: 16, pol: .9, az: .35 },
  };
  function pose(v, aspect) { const V = typeof v === 'string' ? VIEWS[v] : v; const k = aspect < 1 ? Math.min(2.1, 1 / aspect * .95) : aspect < 1.4 ? 1.15 : 1; const d = V.d * k; const tg = new THREE.Vector3(...V.t); return { tgt: tg, pos: new THREE.Vector3(tg.x + Math.sin(V.az) * Math.sin(V.pol) * d, Math.cos(V.pol) * d, tg.z + Math.cos(V.az) * Math.sin(V.pol) * d) }; }
  ctx.view = (v, dur = 1.1) => { const p = pose(v, camera.aspect); if (!dur) { camera.position.copy(p.pos); controls.target.copy(p.tgt); controls.update(); return Promise.resolve(); } const p0 = camera.position.clone(), t0 = controls.target.clone(); controls.enabled = false; return tween(dur, e => { camera.position.lerpVectors(p0, p.pos, e); controls.target.lerpVectors(t0, p.tgt, e); camera.lookAt(controls.target); }).then(() => { controls.enabled = true; controls.update(); }); };
  ctx.cityView = (id, d = 16) => ctx.view({ t: [CITY[id].X, 0, CITY[id].Z], d, pol: .9, az: .35 });
  ctx.VIEWS = VIEWS;

  // ---------- rules ----------
  function route(pl, target) {
    const src = Object.keys(ST.owners).filter(k => ST.owners[k].includes(pl)), dist = {}, prev = {}; MAP.cities.forEach(c => dist[c.id] = Infinity); src.forEach(s => dist[s] = 0); const Q = new Set(Object.keys(dist));
    while (Q.size) { let u = null, b = Infinity; for (const k of Q) if (dist[k] < b) { b = dist[k]; u = k; } if (u === null) break; Q.delete(u); for (const e of ADJ[u]) { const v = e.a === u ? e.b : e.a, w = ST.lines.some(l => l.e === e.i && l.pl === pl) ? 0 : e.cost; if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = [u, e]; } } }
    if (!target) return dist; const path = []; let v = target; while (prev[v]) { const [u, e] = prev[v]; if (!ST.lines.some(l => l.e === e.i && l.pl === pl)) path.unshift({ e, from: u, to: v }); v = u; } return { cost: dist[target], path };
  }
  ctx.quote = (id, pl = ME) => { const own = ST.owners[id] || []; if (own.includes(pl)) return { why: 'Schon deine Stadt' }; if (own.length >= ST.step) return { why: `Stufe ${ST.step}: belegt` }; const r = route(pl, id); if (r.cost === Infinity) return { why: 'Keine Verbindung' }; const house = [10, 15, 20][own.length]; return { line: r.cost, house, total: r.cost + house, path: r.path, ok: r.cost + house <= ST.players[pl].money }; };
  ctx.markReach = (on = true) => { const d = route(ME); MAP.cities.forEach(c => { const own = ST.owners[c.id] || []; const ok = on && !own.includes(ME) && own.length < ST.step && d[c.id] + [10, 15, 20][own.length] <= ST.players[ME].money; cityG[c.id].userData.ring.visible = ok; cityG[c.id].userData.reach = ok; }); };
  ctx.cheapest = (k, n) => pieces[k].slice().sort((a, b) => a.i - b.i).slice(0, n);
  ctx.priceOf = (k, n) => ctx.cheapest(k, n).reduce((s, p) => s + PRICE(k, p.i), 0);
  ctx.cityCount = cityCount; ctx.cityName = id => CITY[id].name;

  // ---------- money animation ----------
  ctx.pay = async (amount, to = ctx.bankPos()) => { ST.players[ME].money -= amount; const n = Math.max(1, Math.round(amount / 5)); const fly = coins.splice(Math.max(0, coins.length - n), n); FX.label(`−${amount} €`, ctx.coinPos(coins.length).add(new THREE.Vector3(0, 1.5, 0)), P.neg || '#ff8a7a'); await Promise.all(fly.map((c, i) => wait(i * .05).then(() => FX.arc(c, to.clone().add(new THREE.Vector3((Math.random() - .5) * 2, 0, (Math.random() - .5) * 2)), .8, 5, 'inout', 3)).then(() => coinGroup.remove(c)))); ctx.emit && ctx.emit('money'); };
  ctx.earn = async (amount) => { ST.players[ME].money += amount; const n = Math.max(1, Math.round(amount / 5)); const jobs = []; for (let i = 0; i < n; i++) { const c = T.coin(ctx); c.position.copy(ctx.bankPos()); coinGroup.add(c); const to = ctx.coinPos(coins.length); coins.push(c); jobs.push(wait(i * .06).then(() => FX.arc(c, to, .9, 6, 'inout', 4))); } FX.label(`+${amount} €`, ctx.bankPos().add(new THREE.Vector3(0, 2, 0)), P.accent); await Promise.all(jobs); syncCoins(); ctx.emit && ctx.emit('money'); };

  // ---------- PHASE: build ----------
  ctx.build = async (id, pl = ME, o = {}) => {
    const q = ctx.quote(id, pl); if (!q.path) return; ctx.markReach(false);
    if (pl === ME) await ctx.pay(q.total);
    if (o.camera !== false) { const pts = [id, ...q.path.map(s => s.from)].map(k => CITY[k]); const cx = pts.reduce((s, c) => s + c.X, 0) / pts.length, cz = pts.reduce((s, c) => s + c.Z, 0) / pts.length, ext = Math.max(...pts.map(c => Math.hypot(c.X - cx, c.Z - cz))); await ctx.view({ t: [cx, 0, cz], d: Math.max(26, ext * 3.2), pol: .78, az: .15 }, .9); }
    for (const st of q.path) { const l = { e: st.e.i, pl, from: st.from }; ST.lines.push(l); const lo = addLine(l, false); await T.animLine(ctx, lo, CITY[st.from], CITY[st.to], pl); }
    const slot = (ST.owners[id] ||= []).length; ST.owners[id].push(pl); const h = placeHouse(id, pl, slot);
    if (o.camera !== false) await ctx.cityView(id, 15);
    await T.animHouse(ctx, h, CITY[id], pl, slot);
    { const d0 = discs[pl].position.clone(), d1 = ctx.trackPos(cityCount(pl), pl); await FX.arc(discs[pl], d1, .6, 1.2); } ctx.refreshMap();
    ctx.emit && ctx.emit('state');
  };
  // ---------- PHASE: resources ----------
  ctx.buy = async (cart, pl = ME) => {
    let cost = 0; for (const k in cart) cost += ctx.priceOf(k, cart[k]); if (pl === ME) ctx.pay(cost); let n = 0; const jobs = [];
    for (const k in cart) { const take = ctx.cheapest(k, cart[k]); for (const p of take) { pieces[k].splice(pieces[k].indexOf(p), 1); ST.occ[k] = ST.occ[k].filter(i => i !== p.i);
      const pi = ST.players[ME].plants.findIndex(num => PLANTDATA[num][0] === k || (PLANTDATA[num][0] === 'hybrid' && (k === 'coal' || k === 'oil'))); if (pi < 0) { pieceGroup.remove(p.m); continue; } const num = ST.players[ME].plants[pi]; const j = stored[num].length; stored[num].push(p); ST.players[ME].stock[num] = stored[num].length;
      const dest = pl === ME ? ctx.storeSlot(pi, j) : new THREE.Vector3(CITY.essen.X, 1, CITY.essen.Z);
      jobs.push(wait(n++ * .14).then(() => T.animBuy(ctx, p, dest, PRICE(k, p.i)))); } }
    await Promise.all(jobs); ctx.emit && ctx.emit('state');
  };
  ctx.restock = async (step = ST.step) => { const add = REFILL[step], jobs = []; let n = 0; for (const k of RES) { let c = add[k]; const total = k === 'uranium' ? 12 : 24; for (let i = total - 1; i >= 0 && c > 0; i--) { if (ST.occ[k].includes(i)) continue; c--; ST.occ[k].push(i); const p = addPiece(k, i); pieces[k].push(p); jobs.push(T.animRestock(ctx, p, n++)); } } await Promise.all(jobs); };
  // ---------- PHASE: auction ----------
  ctx.selectCard = n => { cards.forEach((c, m) => { const on = m === n; const y0 = c.position.y, y1 = on ? 1 : .06; tween(.3, e => { c.position.y = lerp(y0, y1, e); c.rotation.x = on ? -.15 * e : 0; }); }); ctx.selected = n; };
  ctx.auction = async (n, bids) => {
    const c = cards.get(n); await ctx.view('plants', .8); if (ctx.selected !== n) ctx.selectCard(n); await wait(.35);
    for (const [pl, v] of bids) { await T.animBid(ctx, c, pl, v); }
    const win = [...bids].reverse().find(b => b[1] !== null), price = win[1], winner = win[0];
    cards.delete(n); ST.market = ST.market.filter(x => x !== n); ctx.selected = null;
    if (winner === ME) { await ctx.pay(price); ST.players[ME].plants.push(n); stored[n] = []; const to = ctx.mineSlot(ST.players[ME].plants.length - 1); await ctx.view({ t: [(PM.x + PA.x) / 2, 0, (PM.z + PA.z) / 2 + 2], d: 58, pol: .7, az: .1 }, .7); await T.animCardMove(ctx, c, to, .78); mine.push(c); }
    else { const home = winner === 1 ? CITY.essen : CITY.muenchen; await T.animCardAway(ctx, c, new THREE.Vector3(home.X, 2, home.Z), winner); cardGroup.remove(c); ST.players[winner].plants.push(n); }
    await ctx.refill(); ctx.emit && ctx.emit('state');
  };
  ctx.refill = async () => { const top = deckCards.pop(); if (!top) return; const n = ST.deck.pop(); ST.market.push(n); cards.set(n, top); top.userData.card = n; await ctx.view('plants', .6); await T.animDraw(ctx, top); const order = sortedMarket(); await Promise.all(order.map((m, i) => { const c = cards.get(m), from = c.position.clone(), to = ctx.cslot(i); if (from.distanceTo(to) < .01) return; return tween(.7, e => { c.position.lerpVectors(from, to, e); c.position.y += Math.sin(e * Math.PI) * .8; }); })); };
  ctx.cycleHighest = async () => { const hi = sortedMarket().pop(), c = cards.get(hi); cards.delete(hi); ST.market = ST.market.filter(x => x !== hi); ST.deck.unshift(hi); const d = ctx.deckPos(); await tween(.5, e => { c.position.y = lerp(.06, 1.5, e); c.rotation.z = Math.PI * e; }); await FX.arc(c, new THREE.Vector3(d.x, -.02, d.z), .8, 1.5); deckCards.unshift(c); deckCards.forEach((dc, i) => { tween(.4, e => dc.position.y = lerp(dc.position.y, .06 + i * .1, e)); }); await ctx.refill(); };
  // ---------- PHASE: bureaucracy ----------
  ctx.burn = async () => { const jobs = []; let n = 0; ST.players[ME].plants.forEach(num => { const need = PLANTDATA[num][1]; const use = stored[num].splice(0, need); ST.players[ME].stock[num] = stored[num].length; use.forEach(p => jobs.push(wait(n++ * .15).then(() => T.animBurn(ctx, p)))); }); await Promise.all(jobs); };
  ctx.power = async () => {
    const seqs = []; ST.players.forEach((p, pl) => { const net = Object.keys(ST.owners).filter(k => ST.owners[k].includes(pl)); if (!net.length) return; const order = [[net[0], null, null]], seen = new Set([net[0]]); for (let i = 0; i < order.length; i++) for (const e of ADJ[order[i][0]]) { const lo = lineObjs.find(o => o.l.e === e.i && o.l.pl === pl); if (!lo) continue; const v = e.a === order[i][0] ? e.b : e.a; if (!seen.has(v)) { seen.add(v); order.push([v, order[i][0], lo]); } } seqs.push({ pl, order }); });
    await T.animPower(ctx, seqs);
  };
  ctx.bureaucracy = async () => {
    await ctx.view('player', .9); await ctx.burn(); await ctx.view('map', 1); await ctx.power();
    const n = cityCount(ME), cap = ST.players[ME].plants.reduce((s, num) => s + PLANTDATA[num][2], 0); await ctx.view({ t: [(PA.x + MK.x) / 2, 0, 24], d: 110, pol: .8, az: 0 }, .8); await ctx.earn(INCOME[Math.min(n, cap, 10)]);
    await ctx.view('market', .9); await ctx.restock(); await ctx.cycleHighest(); ctx.emit && ctx.emit('state');
  };
  ctx.opponents = async () => { ST.players[1].money -= 0; await ctx.build('frankfurt', 1, { camera: true }); await ctx.build('stuttgart', 2, { camera: true }); };
  // turn order reshuffle (by city count, then biggest plant)
  ctx.reorder = async () => { const ord = [0, 1, 2].sort((a, b) => cityCount(b) - cityCount(a) || Math.max(...ST.players[b].plants) - Math.max(...ST.players[a].plants)); ST.order = ord; await ctx.view('track', .8); await Promise.all(ord.map((pl, i) => { const d = orderDiscs.find(dd => dd.userData.pl === pl); return FX.arc(d, ctx.orderPos(i), .8, 2.5); })); };
  orderDiscs.forEach((d, i) => d.userData.pl = ST.order[i]);
  ctx.setStep = async s => { ST.step = s; ctx.refreshMap(); ctx.markReach(); ctx.emit && ctx.emit('state'); };

  // ---------- picking ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let pd = null;
  renderer.domElement.addEventListener('pointerdown', e => { pd = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', e => { if (!pd || Math.hypot(e.clientX - pd.x, e.clientY - pd.y) > 8) return; const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([cities, cardGroup], true); for (const h of hits) { let o = h.object; while (o && !o.userData.city && !o.userData.card) o = o.parent; if (!o) continue; if (o.userData.city) { ctx.onCity && ctx.onCity(o.userData.city); return; } if (o.userData.card && cards.get(o.userData.card) === o) { ctx.onCard && ctx.onCard(o.userData.card); return; } } });

  // ---------- render ----------
  let composer = null;
  if (P.bloom) { const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 }); composer = new EffectComposer(renderer, rt); composer.addPass(new RenderPass(scene, camera)); composer.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), P.bloom, .5, .9); composer.addPass(composer.bloom); composer.addPass(new OutputPass()); }
  ctx.resize = (w, h) => { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); } };
  const clock = new THREE.Clock(); let t = 0;
  ctx.frame = () => { const dt = Math.min(.05, clock.getDelta()); t += dt; stepTweens(dt); T.tick && T.tick(ctx, t, dt); cities.children.forEach(g => { const r = g.userData.ring; if (r && r.visible) { r.material.opacity = .3 + .2 * Math.sin(t * 3); r.scale.setScalar(1 + .04 * Math.sin(t * 3)); } }); if (controls.enabled) controls.update(); if (composer) composer.render(dt); else renderer.render(scene, camera); };
  ctx.dispose = () => { scene.traverse(o => { o.geometry && o.geometry.dispose(); }); controls.dispose(); };
  Object.assign(ctx, { cityG, cards, mine, stored, pieces, coins, discs, lineObjs, MK, PM, PA, TR, placeHouse, addPiece, makeCard, syncCoins, route });
  ctx.view('overview', 0); ctx.markReach();
  return ctx;
}
