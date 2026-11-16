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
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import MAP from './map.json';
import { plantModel, truck, paddle, ladder, stampMesh, assemble, tanker, garbageTruck, train } from './models.js';

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
export const REFILL = { 1: { coal: 5, oil: 3, garbage: 2, uranium: 1 }, 2: { coal: 6, oil: 4, garbage: 3, uranium: 2 }, 3: { coal: 4, oil: 5, garbage: 4, uranium: 2 } };

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
export function createTable(theme, mode = 'dark', opt = {}) { let ctx_ov = null;
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
  const fx = new THREE.Group(); scene.add(fx); const ov = new THREE.Scene(); ctx_ov = ov; // Overlay: Sprites ohne GTAO/Tiefenschärfe-Artefakte
  const ctx = { THREE, T, P, scene, camera, controls, renderer, fx, get ov() { return ctx_ov; }, mode, E, tween, wait, lerp, rng, canvasTex, rr };

  // ---------- state ----------
  const ME = 0; const ST = opt.state || {
    step: 1, round: 4,
    players: [{ name: 'Du', money: 60, plants: [10, 16], stock: {} }, { name: 'Rhein AG', money: 41, plants: [15, 18], stock: {} }, { name: 'Isar Energie', money: 55, plants: [12, 14], stock: {} }, { name: 'Elbe Strom', money: 50, plants: [11, 13], stock: {} }],
    order: [1, 2, 3, 0], owners: {}, lines: [],
    occ: { coal: [...Array(21).keys()].map(i => i + 3), oil: [...Array(16).keys()].map(i => i + 8), garbage: [15, 16, 17, 18, 19, 20, 21, 22, 23], uranium: [8, 9, 10, 11] },
    market: [17, 19, 20, 21, 22, 23, 24, 25], deck: [31, 27, 34, 26, 29, 38, 30, 28],
  };
  if (!opt.state) { [[0, ['berlin', 'potsdam', 'leipzig']], [1, ['koeln', 'duesseldorf', 'essen', 'dortmund']], [2, ['muenchen', 'augsburg', 'nuernberg']], [3, ['kiel', 'luebeck']]].forEach(([pl, list]) => list.forEach((id, i) => { (ST.owners[id] ||= []).push(pl); if (i) { const e = EDGES.find(e => (e.a === id && e.b === list[i - 1]) || (e.b === id && e.a === list[i - 1])); if (e) ST.lines.push({ e: e.i, pl, from: list[i - 1] }); } })); }
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

  // ================= Tischlayout v3 =================
  // Oben die Leiste, Mitte die Karte, links Kraftwerksmarkt + Auktionsbühne, rechts Rohstoffregal + Logistik, unten vier gleiche Spielermatten.
  const NP = ST.players.length;
  const pieces = { coal: [], oil: [], garbage: [], uranium: [] }; const pieceGroup = new THREE.Group(); scene.add(pieceGroup);
  const glowTex = canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  const smokeTex = canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.6, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  const FX = ctx.FX = {
    sprite(col, s = 1, add = true) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(col), transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending })); m.scale.setScalar(s); ov.add(m); return m; },
    kill(o) { o.parent && o.parent.remove(o); o.material && o.material.dispose && o.material.dispose(); },
    burst(pos, cols, n = 24, o = {}) { const g = new THREE.Group(); fx.add(g); const parts = []; for (let i = 0; i < n; i++) { const col = Array.isArray(cols) ? cols[i % cols.length] : cols; const m = o.mesh ? o.mesh(col) : new THREE.Mesh(new THREE.BoxGeometry(.12, .12, .12), new THREE.MeshBasicMaterial({ color: col })); m.position.copy(pos); g.add(m); const a = Math.random() * 6.283, s = (o.speed || 4) * (.4 + Math.random()); parts.push({ m, v: new THREE.Vector3(Math.cos(a) * s, (o.up || 4) * (.5 + Math.random()), Math.sin(a) * s), r: new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0) }); }
      let last = 0; return tween(o.life || 1.1, (e, k) => { const dt = (k - last) * (o.life || 1.1); last = k; parts.forEach(p => { p.v.y -= (o.g ?? 9) * dt; p.m.position.addScaledVector(p.v, dt); if (p.m.position.y < .05) { p.m.position.y = .05; p.v.multiplyScalar(.5); } p.m.rotation.x += p.r.x * dt; p.m.rotation.y += p.r.y * dt; p.m.scale.setScalar(1 - k * .6); }); }, 'lin').then(() => { fx.remove(g); }); },
    ripple(pos, col, r = 3, dur = 1) { const m = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.copy(pos).setY(pos.y + .06); ov.add(m); return tween(dur, (e, k) => { m.scale.setScalar(.3 + r * e); m.material.opacity = 1 - k; }, 'out').then(() => FX.kill(m)); },
    arc(obj, to, dur = 1, h = 4, ease = 'inout', spin = 0) { const a = obj.position.clone(), r0 = obj.rotation.y; return tween(dur, e => { obj.position.lerpVectors(a, to, e); obj.position.y += Math.sin(e * Math.PI) * h; obj.rotation.y = r0 + spin * e; }, ease); },
    label(text, pos, col = '#fff', dur = 1.4, size = 1) { const tex = canvasTex(320, 96, (x) => { x.font = '700 54px ' + (T.font || 'sans-serif'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 10; x.strokeStyle = 'rgba(0,0,0,.65)'; x.strokeText(text, 160, 50); x.fillStyle = col; x.fillText(text, 160, 50); }); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(4 * size, 1.2 * size, 1); s.position.copy(pos); s.renderOrder = 10; ov.add(s); return tween(dur, (e, k) => { s.position.y = pos.y + e * 1.6; s.material.opacity = k < .75 ? 1 : (1 - k) / .25; }, 'out').then(() => FX.kill(s)); },
    smoke(at, dur = 2, col = '#d9dde3', n = 18) { const jobs = []; for (let i = 0; i < n; i++) jobs.push(wait(i * dur / n).then(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: new THREE.Color(col), transparent: true, depthWrite: false, opacity: 0 })); s.position.copy(at); ov.add(s); const dx = (Math.random() - .3) * 1.4, dz = (Math.random() - .5) * .8; return tween(1.8, (e, k) => { s.position.set(at.x + dx * e, at.y + 2.6 * e, at.z + dz * e); s.scale.setScalar(.25 + 1.05 * e); s.material.opacity = .42 * Math.sin(k * Math.PI) ** .7; }, 'out').then(() => FX.kill(s)); })); return Promise.all(jobs); },
  };

  // ---------- Rohstoffregal ----------
  const MK = { x: 47, z: -6, W: 25, L: 15 }; const SH = { RES, top: 1.9, rowH: 2.6, x0: 4.4, cellsW: 20, PRICE, REFILL };
  const shelfTop = canvasTex(25 * 48, 15 * 48, (x, w, h) => T.drawShelf(x, w, h, P, SH));
  const mk = slab(MK.W, MK.L, P.boardDepth ?? .45, .8, new THREE.MeshStandardMaterial({ map: shelfTop, roughness: .8 }), sideMat); mk.position.set(MK.x, 0, MK.z); scene.add(mk);
  const rowZ = r => MK.z - MK.L / 2 + SH.top + (r + .5) * SH.rowH; const cellW = k => SH.cellsW / (k === 'uranium' ? 12 : 8);
  const cellX = (k, c) => MK.x - MK.W / 2 + SH.x0 + (c + .5) * cellW(k);
  ctx.mslot = (k, i) => { const r = RES.indexOf(k), c = k === 'uranium' ? i : Math.floor(i / 3), j = i % 3; return new THREE.Vector3(cellX(k, c) + (k === 'uranium' ? 0 : (j - 1) * .66), 0, rowZ(r) - .25); };
  function addPiece(k, i, at) { const m = T.resource(ctx, k); m.position.copy(at || ctx.mslot(k, i)); m.rotation.y = (Math.random() - .5) * .5; pieceGroup.add(m); return { m, k, i }; }
  RES.forEach(k => ST.occ[k].forEach(i => pieces[k].push(addPiece(k, i))));
  // Preisschilder links an jeder Zeile: „ab X €“ + Vorrat; Rahmen um das günstigste Feld
  const ICON = { coal: '#3b3631', oil: '#24303f', garbage: '#d9a62e', uranium: '#c8342b' }, RN = { coal: 'Kohle', oil: 'Öl', garbage: 'Müll', uranium: 'Uran' };
  const tags = {}; RES.forEach((k, r) => { const c = document.createElement('canvas'); c.width = 384; c.height = 224; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const g = new THREE.Group(); const body = new THREE.Mesh(new RoundedBoxGeometry(3.8, .28, 2.2, 2, .08), new THREE.MeshStandardMaterial({ color: P.dark ? '#1a2a39' : '#ffffff', roughness: .6 })); body.position.y = .14; body.castShadow = true; const top = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 2.1), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); top.rotation.x = -Math.PI / 2; top.position.y = .285; g.add(body, top); g.position.set(MK.x - MK.W / 2 + 2.25, 0, rowZ(r)); scene.add(g);
    const fr = new THREE.Mesh(new THREE.RingGeometry(.1, .1, 4), new THREE.MeshBasicMaterial({ color: P.accent })); const frame = new THREE.Group(); [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([sx, sz]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx ? .08 : cellW(k) - .12, .04, sz ? .08 : SH.rowH - .16), new THREE.MeshBasicMaterial({ color: P.accent })); b.position.set(sx * (cellW(k) - .12) / 2, .03, sz * (SH.rowH - .16) / 2); frame.add(b); }); scene.add(frame);
    tags[k] = { c, tex, g, frame, v: null }; });
  function cheapestIdx(k) { const occ = pieces[k].map(p => p.i); return occ.length ? Math.min(...occ) : -1; }
  function drawTag(k) { const T0 = tags[k], x = T0.c.getContext('2d'), i = cheapestIdx(k), v = i < 0 ? '–' : PRICE(k, i); x.clearRect(0, 0, 384, 224); x.fillStyle = ICON[k]; x.beginPath(); x.arc(56, 60, 34, 0, 7); x.fill(); x.fillStyle = P.dark ? '#e6edf3' : '#141c24'; x.textBaseline = 'middle'; x.textAlign = 'left'; x.font = '600 40px ' + (T.font || 'sans-serif'); x.fillText(RN[k].toUpperCase(), 104, 60);
    x.font = '700 92px "IBM Plex Sans Condensed",sans-serif'; x.fillText(i < 0 ? 'leer' : 'ab ' + v + '€', 20, 156); x.font = '600 34px ' + (T.font || 'sans-serif'); x.textAlign = 'right'; x.fillStyle = P.dark ? '#8b9bab' : '#5c6773'; x.fillText('noch ' + pieces[k].length, 368, 196); T0.tex.needsUpdate = true; return v; }
  ctx.updateMarkers = (instant = false) => { RES.forEach(k => { const T0 = tags[k], i = cheapestIdx(k), old = T0.v, v = drawTag(k); T0.v = v; const r = RES.indexOf(k), c = i < 0 ? -1 : (k === 'uranium' ? i : Math.floor(i / 3)); T0.frame.visible = c >= 0; if (c < 0) return; const to = new THREE.Vector3(cellX(k, c), 0, rowZ(r));
      if (instant || old === null) { T0.frame.position.copy(to); return; } if (old === v) return; const a = T0.frame.position.clone(); tween(.45, e => { T0.frame.position.lerpVectors(a, to, e); T0.frame.position.y = Math.sin(e * Math.PI) * .5; }, 'back'); tween(.3, (e, kk) => T0.g.scale.setScalar(1 + .12 * Math.sin(kk * Math.PI)), 'lin');
      if (typeof old === 'number' && typeof v === 'number') FX.label((v > old ? '+' : '−') + Math.abs(v - old) + ' €', to.clone().setY(1.6), v > old ? (P.neg || '#ff8a7a') : (P.pos || '#4caf50'), 1.2, .7); }); };
  // Erschwinglichkeit für den aktiven Spieler: Felder einfärben, die er bezahlen und lagern kann
  const hi = []; RES.forEach((k, r) => { const n = k === 'uranium' ? 12 : 8; for (let c = 0; c < n; c++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(cellW(k) - .2, SH.rowH - .24), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(cellX(k, c), .02, rowZ(r)); m.userData = { k, c }; scene.add(m); hi.push(m); } });
  ctx.highlightMarket = (pl) => { const can = {}; if (pl != null) { let money = ST.players[pl].money; const cap = {}; RES.forEach(k => { cap[k] = storeRoom(pl, k); }); const all = []; RES.forEach(k => pieces[k].forEach(p => all.push(p))); all.sort((a, b) => PRICE(a.k, a.i) - PRICE(b.k, b.i));
      RES.forEach(k => { let m = money, room = cap[k]; pieces[k].slice().sort((a, b) => a.i - b.i).forEach(p => { const pr = PRICE(k, p.i); if (room > 0 && pr <= m) { m -= pr; room--; can[k + ':' + (k === 'uranium' ? p.i : Math.floor(p.i / 3))] = true; } }); }); }
    hi.forEach(m => { const on = !!can[m.userData.k + ':' + m.userData.c]; const o0 = m.material.opacity, o1 = on ? .38 : 0; if (on) m.material.color.set(P.players[pl]); tween(.35, e => m.material.opacity = lerp(o0, o1, e)); }); };

  // ---------- Logistikstreifen hinter dem Regal: Wasser, Gleis, Straße ----------
  const LZ = { water: MK.z - MK.L / 2 - 6.6, rail: MK.z - MK.L / 2 - 3.9, road: MK.z - MK.L / 2 - 1.7 }, LX0 = MK.x - MK.W / 2 - 1, LX1 = 110;
  { const len = LX1 - LX0, cx = (LX0 + LX1) / 2; const water = new THREE.Mesh(new THREE.BoxGeometry(len, .1, 3.0), new THREE.MeshStandardMaterial({ color: P.dark ? '#16466e' : '#7fb1d8', roughness: .25, metalness: .1 })); water.position.set(cx, -.5, LZ.water); water.receiveShadow = true; scene.add(water);
    const bank1 = new THREE.Mesh(new THREE.BoxGeometry(len, .5, .3), sideMat); bank1.position.set(cx, -.35, LZ.water + 1.65); scene.add(bank1);
    const ballast = new THREE.Mesh(new THREE.BoxGeometry(len, .12, 1.4), new THREE.MeshStandardMaterial({ color: P.dark ? '#2a333d' : '#9aa0a6', roughness: .95 })); ballast.position.set(cx, -.56, LZ.rail); ballast.receiveShadow = true; scene.add(ballast);
    [-.38, .38].forEach(dz => { const rl = new THREE.Mesh(new THREE.BoxGeometry(len, .08, .07), new THREE.MeshStandardMaterial({ color: '#9aa3ad', metalness: .6, roughness: .35 })); rl.position.set(cx, -.44, LZ.rail + dz); scene.add(rl); });
    const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(.18, .06, 1.2), new THREE.MeshStandardMaterial({ color: P.dark ? '#3b4652' : '#7b8188' }), Math.floor(len / .7)); const mtx = new THREE.Matrix4(); for (let i = 0; i < sl.count; i++) { mtx.makeTranslation(LX0 + i * .7, -.48, LZ.rail); sl.setMatrixAt(i, mtx); } scene.add(sl);
    const roadTex = canvasTex(256, 64, (x) => { x.fillStyle = P.dark ? '#1e252d' : '#5d636a'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#e6e8eb'; for (let i = 0; i < 256; i += 64) x.fillRect(i, 30, 34, 4); }); roadTex.wrapS = THREE.RepeatWrapping; roadTex.repeat.set(len / 6, 1);
    const road = new THREE.Mesh(new THREE.BoxGeometry(len, .1, 1.8), new THREE.MeshStandardMaterial({ map: roadTex, roughness: .9 })); road.position.set(cx, -.55, LZ.road); road.receiveShadow = true; scene.add(road); }

  // ---------- Kraftwerksmarkt + Auktionsbühne ----------
  const PM = { x: -55, z: -6, W: 15, L: 28 };
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
  // Bühne rechts neben dem Markt: Sockel + Staffelei, Blick flach gegen den Horizont
  const STG = new THREE.Vector3(-40.5, 0, -4);
  { const g = new THREE.Group(); g.position.copy(STG); const m1 = new THREE.MeshStandardMaterial({ color: P.dark ? '#1a2a39' : '#e8e6e0', roughness: .7 }), m2 = new THREE.MeshStandardMaterial({ color: '#8e98a3', roughness: .5 });
    const ped = new THREE.Mesh(new RoundedBoxGeometry(5.4, .5, 3.4, 2, .08), m1); ped.position.y = .25; ped.castShadow = ped.receiveShadow = true; g.add(ped);
    [-2.2, 2.2].forEach(x => { const leg = new THREE.Mesh(new THREE.BoxGeometry(.12, 4.6, .12), m2); leg.position.set(x, 2.3, -1.85); leg.rotation.x = .1; leg.castShadow = true; g.add(leg); }); const rail = new THREE.Mesh(new THREE.BoxGeometry(4.8, .12, .3), m2); rail.position.set(0, 1.0, -1.72); g.add(rail);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(4.6, .45), new THREE.MeshBasicMaterial({ map: canvasTex(512, 50, (x) => { x.fillStyle = P.dark ? '#1a2a39' : '#e8e6e0'; x.fillRect(0, 0, 512, 50); x.fillStyle = P.dark ? '#8b9bab' : '#5c6773'; x.font = '600 30px "IBM Plex Mono",monospace'; x.textAlign = 'center'; x.fillText('AUKTION', 256, 36); }) })); plate.position.set(0, .25, 1.71); g.add(plate); scene.add(g); }

  // ---------- Leiste am Kopf + Reihenfolge ----------
  const TR = { x: 0, z: -51.5, W: 66, L: 6 };
  const trTop = canvasTex(66 * 32, 6 * 32, (x, w, h) => T.drawTrack(x, w, h, P));
  const trb = slab(TR.W, TR.L, P.boardDepth ?? .45, .8, new THREE.MeshStandardMaterial({ map: trTop, roughness: .8 }), sideMat); trb.position.set(TR.x, 0, TR.z); scene.add(trb);
  ctx.trackPos = (n, pl) => new THREE.Vector3(TR.x - TR.W / 2 + 13.4 + n * 2.45, .1 + pl * .34, TR.z + .6);
  ctx.orderPos = i => new THREE.Vector3(TR.x - TR.W / 2 + 2.6 + i * 2.7, .1, TR.z + .6);
  function cityCount(pl) { return Object.values(ST.owners).filter(o => o.includes(pl)).length; }
  const discs = ST.players.map((p, pl) => { const d = T.disc(ctx, pl); d.position.copy(ctx.trackPos(cityCount(pl), pl)); scene.add(d); return d; });
  const orderDiscs = ST.order.map((pl, i) => { const d = T.disc(ctx, pl); d.position.copy(ctx.orderPos(i)); d.userData.pl = pl; scene.add(d); return d; });

  // ---------- Vier gleiche Spielermatten am unteren Rand ----------
  const MATZ = 53, MATL = 11; const BOARDS = ctx.BOARDS = ST.players.map((p, i) => ({ x: (i - (NP - 1) / 2) * 16.5, z: MATZ, W: 15, L: MATL, cs: .62 }));
  const matMeshes = [], plates = [];
  BOARDS.forEach((B, pl) => { const tex = canvasTex(15 * 48, MATL * 48, (x, w, h) => T.drawMat(x, w, h, P, pl, ST.players[pl].name)); const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: .8 }); const s = slab(B.W, B.L, P.boardDepth ?? .45, .8, mat, sideMat); s.position.set(B.x, 0, B.z); scene.add(s); matMeshes.push({ s, mat });
    const c = document.createElement('canvas'); c.width = 256; c.height = 80; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const pm = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.0), new THREE.MeshBasicMaterial({ map: t, transparent: true })); pm.rotation.x = -Math.PI / 2; pm.position.set(B.x + 5.3, .02, B.z - MATL / 2 + .74); scene.add(pm); plates.push({ c, t, pm, s }); });
  function drawPlate(pl) { const { c, t } = plates[pl], x = c.getContext('2d'); x.clearRect(0, 0, 256, 80); x.fillStyle = '#fff'; x.font = '700 56px "IBM Plex Mono",monospace'; x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillText(ST.players[pl].money + '€', 246, 42); t.needsUpdate = true; }
  ST.players.forEach((p, pl) => drawPlate(pl));
  const matTop = pl => BOARDS[pl].z - MATL / 2;
  ctx.plantSlot = (pl, i) => new THREE.Vector3(BOARDS[pl].x - 4.75 + i * 4.75, .06, matTop(pl) + 4.0);
  ctx.storeSlot = (pl, pi, j) => { const s = ctx.plantSlot(pl, pi); return new THREE.Vector3(s.x - 1.0 + (j % 3) * 1.0, .06, matTop(pl) + 6.35 + Math.floor(j / 3) * .85); };
  // Aktiver Spieler: Matte hebt sich, Farbsaum um Matte und Tisch, die anderen treten zurück
  const rimMat = new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0 }); const rims = BOARDS.map(B => { const g = new THREE.Group(); const w = B.W + .5, l = B.L + .5; [[0, -l / 2, w, .14], [0, l / 2, w, .14], [-w / 2, 0, .14, l], [w / 2, 0, .14, l]].forEach(([x, z, a, b]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(a, .06, b), rimMat.clone()); m.position.set(x, .02, z); g.add(m); }); g.position.set(B.x, 0, B.z); scene.add(g); return g; });
  const edge = new THREE.Group(); { const x0 = -64, x1 = 62, z0 = -57, z1 = 61, t = .22; [[(x0 + x1) / 2, z0, x1 - x0, t], [(x0 + x1) / 2, z1, x1 - x0, t], [x0, (z0 + z1) / 2, t, z1 - z0], [x1, (z0 + z1) / 2, t, z1 - z0]].forEach(([x, z, a, b]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(a, .04, b), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0 })); m.position.set(x, -.58, z); edge.add(m); }); scene.add(edge); }
  ctx.active = null;
  ctx.setActive = (pl) => { if (ctx.active === pl) return; ctx.active = pl; matMeshes.forEach((M, i) => { const on = i === pl, y0 = M.s.position.y, y1 = on ? .35 : 0, c0 = M.mat.color.r, c1 = pl == null || on ? 1 : .55; tween(.45, e => { M.s.position.y = lerp(y0, y1, e); M.mat.color.setScalar(lerp(c0, c1, e)); plates[i].pm.position.y = M.s.position.y + .02; }, 'back');
      rims[i].children.forEach(r => { r.material.color.set(P.players[i]); const o0 = r.material.opacity; tween(.4, e => r.material.opacity = lerp(o0, on ? .95 : 0, e)); }); tween(.45, e => rims[i].position.y = lerp(rims[i].position.y, on ? .35 : 0, e)); });
    edge.children.forEach(m => { if (pl != null) m.material.color.set(P.players[pl]); const o0 = m.material.opacity; tween(.5, e => m.material.opacity = lerp(o0, pl == null ? 0 : .8, e)); }); ctx.emit && ctx.emit('active', pl); };

  const spinners = []; let spinBoost = 0; const MS = .75;
  function attachModel(card, n, pl, vis) { if (card.userData.model) card.remove(card.userData.model); const m = plantModel(n, PLANTDATA[n][0], pl == null ? null : P.players[pl]); m.scale.setScalar(MS); m.position.set(1.0, .05, -.42); m.visible = vis; card.add(m); card.userData.model = m; m.userData.spinners.forEach(s => spinners.push(s)); return m; }
  function tintModel(card, pl) { const a = card.userData.model && card.userData.model.userData.accent; if (a) a.material = new THREE.MeshStandardMaterial({ color: P.players[pl], roughness: .6 }); }
  const hand = ST.players.map((p, pl) => p.plants.map((n, i) => { const c = makeCard(n); c.scale.setScalar(BOARDS[pl].cs); c.position.copy(ctx.plantSlot(pl, i)); cardGroup.add(c); attachModel(c, n, pl, true); return c; }));
  const stored = ST.players.map(p => { const o = {}; p.plants.forEach(n => o[n] = []); return o; });
  const pieceScale = () => .8;
  function storePiece(pl, num, k) { const pi = ST.players[pl].plants.indexOf(num), j = stored[pl][num].length; const m = T.resource(ctx, k); m.scale.setScalar(pieceScale(pl)); m.position.copy(ctx.storeSlot(pl, pi, j)); pieceGroup.add(m); const p = { m, k, i: -1 }; stored[pl][num].push(p); return p; }
  (opt.stock || [[0, 10, ['coal', 'coal']], [1, 15, ['coal', 'coal']], [2, 12, ['coal', 'oil']], [2, 14, ['garbage', 'garbage']], [3, 11, ['uranium']]]).forEach(([pl, num, ks]) => ks.forEach(k => storePiece(pl, num, k)));
  function fuelOk(f, k) { return f === k || (f === 'hybrid' && (k === 'coal' || k === 'oil')); }
  function fuelPlant(pl, k) { const pls = ST.players[pl].plants; for (let i = 0; i < pls.length; i++) { const [f, need] = PLANTDATA[pls[i]]; if (fuelOk(f, k) && stored[pl][pls[i]].length < need * 2) return i; } return -1; }
  function storeRoom(pl, k) { return ST.players[pl].plants.reduce((s, n) => { const [f, need] = PLANTDATA[n]; return s + (fuelOk(f, k) ? Math.max(0, need * 2 - stored[pl][n].length) : 0); }, 0); }
  ctx.canStore = (pl, k) => fuelPlant(pl, k) >= 0;
  // Münzen: Stapel zu zehn im Kassenfeld jeder Matte
  const coinGroup = new THREE.Group(); scene.add(coinGroup); const coins = ST.players.map(() => []);
  ctx.coinPos = (pl, i) => new THREE.Vector3(BOARDS[pl].x - 4.4 + (Math.floor(i / 10) % 8) * 1.3, .06 + (i % 10) * .19 + (matMeshes[pl] ? matMeshes[pl].s.position.y : 0), matTop(pl) + 9.35);
  function syncCoins(pl) { const want = Math.max(0, Math.round(ST.players[pl].money / 5)), L = coins[pl]; while (L.length > want) coinGroup.remove(L.pop()); while (L.length < want) { const c = T.coin(ctx); c.position.copy(ctx.coinPos(pl, L.length)); coinGroup.add(c); L.push(c); } drawPlate(pl); }
  ST.players.forEach((p, pl) => syncCoins(pl));
  ctx.bankPos = () => new THREE.Vector3(MK.x + MK.W / 2 - 3.5, .2, MK.z + MK.L / 2 + 3.2);
  const bank = new THREE.Group(); for (let i = 0; i < 24; i++) { const c = T.coin(ctx); c.position.set((i % 6 - 2.5) * 1.3, Math.floor(i / 6) * .19, 0); bank.add(c); } bank.position.copy(ctx.bankPos()); scene.add(bank);

  // ---------- Modellkatalog (Regal vor dem Tisch) ----------
  const KIT = { z: 98 }; const kitSpin = [];
  { const items = [['Kohle 4', 4], ['Öl 7', 7], ['Müll 6', 6], ['Uran 11', 11], ['Wind 13', 13], ['Solar 18', 18], ['Hybrid 5', 5]]; const N = items.length + 3, sp = 8.4, W0 = N * sp;
    const tex = canvasTex(N * 160, 120, (x, w, h) => { x.fillStyle = P.dark ? '#13202d' : '#f3f2ee'; x.fillRect(0, 0, w, h); x.fillStyle = P.dark ? '#e6edf3' : '#141c24'; x.font = '600 30px ' + (T.font || 'monospace'); x.textAlign = 'center'; [...items.map(i => i[0]), 'Rohstoffe', 'Fahrzeuge', 'Stadt + Mast'].forEach((s, i) => x.fillText(s.toUpperCase(), (i + .5) * 160, 98)); });
    const shelf = slab(W0, 6.5, .45, .8, new THREE.MeshStandardMaterial({ map: tex, roughness: .8 }), sideMat); shelf.position.set(0, 0, KIT.z); scene.add(shelf);
    const X = i => -W0 / 2 + (i + .5) * sp; const put = (o, i) => { const g = new THREE.Group(); g.position.set(X(i), 0, KIT.z - .8); g.add(o); scene.add(g); kitSpin.push(g); return g; };
    items.forEach(([l, n], i) => { const m = plantModel(n, PLANTDATA[n][0], P.accent); m.scale.setScalar(1.25); put(m, i); m.userData.spinners.forEach(s => spinners.push(s)); });
    const rg = new THREE.Group(); RES.forEach((k, i) => { const m = T.resource(ctx, k); m.scale.setScalar(2.4); m.position.set((i % 2 - .5) * 2.6, 0, (Math.floor(i / 2) - .5) * 2.2); rg.add(m); }); put(rg, items.length);
    const vg = new THREE.Group(); const tk = tanker(); tk.scale.setScalar(.7); tk.position.z = -1.2; const gt = garbageTruck(); gt.scale.setScalar(.8); gt.position.z = 1.4; vg.add(tk, gt); put(vg, items.length + 1);
    const sg = new THREE.Group(); const st = T.cityBase(ctx, CITY.berlin); st.scale.setScalar(1.3); sg.add(st); [0, 1, 2].forEach(i => { const h = T.house(ctx, i, CITY.berlin, i); h.scale.setScalar(1.3); sg.add(h); }); if (ctx._pyl) { const py = ctx._pyl.clone(); py.scale.setScalar(2.2); py.position.x = 3; sg.add(py); } put(sg, items.length + 2); }

  // ---------- Lesbarkeit aus der Distanz: Plaketten mit fester Bildschirmgröße ----------
  const badges = []; let bFrame = 0, bAlpha = 0; const bInk = P.dark ? '#e6edf3' : '#141c24', bBg = P.dark ? 'rgba(18,28,38,.92)' : 'rgba(255,255,255,.94)', bLine = P.dark ? 'rgba(230,237,243,.3)' : 'rgba(20,28,36,.22)';
  function addBadge(pos, sig, draw, w = .085, h = .032) { const c = document.createElement('canvas'); c.width = 320; c.height = 120; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false, opacity: 0 })); s.scale.set(w, h, 1); s.renderOrder = 30; s.visible = false; ov.add(s); badges.push({ s, pos, sig, draw, c, tex, last: null }); }
  function pill(x, w, h) { x.clearRect(0, 0, w, h); x.fillStyle = bBg; rr(x, 4, 4, w - 8, h - 8, (h - 8) / 2); x.fill(); x.strokeStyle = bLine; x.lineWidth = 3; x.stroke(); }
  RES.forEach((k, r) => addBadge(() => new THREE.Vector3(MK.x - MK.W / 2 - 2.5, 1, rowZ(r)), () => k + pieces[k].length + tags[k].v, (x, w, h) => { pill(x, w, h); x.fillStyle = ICON[k]; x.beginPath(); x.arc(52, 60, 26, 0, 7); x.fill(); x.fillStyle = bInk; x.font = '700 46px ' + (T.font || 'sans-serif'); x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText((tags[k].v ?? '–') + '€', 92, 62); x.font = '600 32px ' + (T.font || 'sans-serif'); x.textAlign = 'right'; x.fillText('×' + pieces[k].length, w - 26, 64); }));
  ST.players.forEach((p, pl) => addBadge(() => new THREE.Vector3(BOARDS[pl].x, 1.4, BOARDS[pl].z - MATL / 2 - 1.4), () => ST.players[pl].money + ':' + ST.players[pl].plants.join(','), (x, w, h) => { pill(x, w, h); x.fillStyle = P.players[pl]; x.beginPath(); x.arc(46, 60, 20, 0, 7); x.fill(); x.fillStyle = bInk; x.textBaseline = 'middle'; x.font = '700 44px ' + (T.font || 'sans-serif'); x.textAlign = 'left'; x.fillText(ST.players[pl].money + '€', 80, 62); x.font = '600 30px ' + (T.font || 'sans-serif'); x.textAlign = 'right'; x.fillText(ST.players[pl].plants.length + ' KW', w - 24, 64); }, .09, .034));
  for (let i = 0; i < 8; i++) addBadge(() => ctx.cslot(i).setY(1.2), () => sortedMarket()[i], (x, w, h) => { const n = sortedMarket()[i]; x.clearRect(0, 0, w, h); if (n == null) return; const [f, need, pw] = PLANTDATA[n]; pill(x, w, h); x.fillStyle = ICON[f] || (f === 'eco' ? '#3f9b57' : '#6e5a45'); x.beginPath(); x.arc(50, 60, 24, 0, 7); x.fill(); x.fillStyle = bInk; x.textBaseline = 'middle'; x.font = '700 50px ' + (T.font || 'sans-serif'); x.textAlign = 'left'; x.fillText(String(n), 86, 62); x.font = '600 32px ' + (T.font || 'sans-serif'); x.textAlign = 'right'; x.fillText('→' + pw, w - 24, 64); }, .056, .022);
  MAP.cities.forEach(c => addBadge(() => new THREE.Vector3(CITY[c.id].X, 2.6, CITY[c.id].Z), () => (ST.owners[c.id] || []).join(','), (x, w, h) => { x.clearRect(0, 0, w, h); const o = ST.owners[c.id] || []; if (!o.length) return; const bw = 40 + o.length * 56; x.fillStyle = bBg; rr(x, (w - bw) / 2, 22, bw, 76, 38); x.fill(); x.strokeStyle = bLine; x.lineWidth = 3; x.stroke(); o.forEach((pl, i) => { x.fillStyle = P.players[pl]; x.beginPath(); x.arc((w - bw) / 2 + 48 + i * 56, 60, 22, 0, 7); x.fill(); }); }, .05, .019));
  ctx.badgesOn = true;
  ctx.updateBadges = () => { const far = camera.position.distanceTo(controls.target); const want = ctx.badgesOn && far > (camera.aspect < 1 ? 130 : 90) ? 1 : 0; bAlpha += (want - bAlpha) * .12; const check = (bFrame++ % 15) === 0;
    badges.forEach(b => { b.s.visible = bAlpha > .02; if (!b.s.visible) return; b.s.material.opacity = bAlpha; b.s.position.copy(b.pos()); if (check || b.last === null) { const sg = String(b.sig()); if (sg !== b.last) { b.last = sg; b.draw(b.c.getContext('2d'), b.c.width, b.c.height); b.tex.needsUpdate = true; } } }); };

  // ---------- Kamera ----------
  const VIEWS = ctx.VIEWS = {
    overview: { t: [0, 0, 3], d: 172, pol: .74, az: 0, w: 132 }, map: { t: [0, 0, -2], d: 118, pol: .6, az: 0, w: 70 }, hero: { t: [-4, 0, 6], d: 108, pol: .95, az: .4 },
    market: { t: [MK.x - 1, 0, MK.z], d: 36, pol: .55, az: -.06, w: 28 }, logistics: { t: [MK.x + 10, 0, LZ.rail], d: 44, pol: .9, az: -.4, w: 44 },
    plants: { t: [PM.x + 4, 0, PM.z], d: 50, pol: .72, az: .18, w: 17 }, stage: { t: [STG.x, 2.7, STG.z], d: 21, pol: 1.24, az: .1, w: 13 },
    mats: { t: [0, 0, MATZ - 1], d: 64, pol: .66, az: 0, w: 68 }, track: { t: [0, 0, TR.z], d: 60, pol: .82, az: 0, w: 70 }, kit: { t: [0, 1.5, KIT.z - 1], d: 52, pol: 1.0, az: 0 },
    north: { t: [CITY.hamburg.X + 6, 0, CITY.hamburg.Z + 6], d: 40, pol: .78, az: .2 }, east: { t: [CITY.berlin.X - 4, 0, CITY.berlin.Z + 6], d: 44, pol: .8, az: -.15 },
  };
  BOARDS.forEach((B, i) => VIEWS['mat' + i] = { t: [B.x, 0, B.z], d: 24, pol: .8, az: 0 }); VIEWS.player = VIEWS.mat0; VIEWS.auction = VIEWS.stage; VIEWS.opp1 = VIEWS.mat1; VIEWS.opp2 = VIEWS.mat2; VIEWS.opp3 = VIEWS.mat3;
  const boardView = pl => 'mat' + pl;
  function pose(v, aspect) { const V = typeof v === 'string' ? VIEWS[v] : v; const k = aspect < 1 ? Math.min(2.1, 1 / aspect * .95) : aspect < 1.4 ? 1.15 : 1; const fit = V.w ? (V.w / 2) / (Math.tan(camera.fov * Math.PI / 360) * aspect) * 1.08 : 0; const d = Math.max(V.d * k, fit); const tg = new THREE.Vector3(...V.t); return { tgt: tg, pos: new THREE.Vector3(tg.x + Math.sin(V.az) * Math.sin(V.pol) * d, tg.y + Math.cos(V.pol) * d, tg.z + Math.cos(V.az) * Math.sin(V.pol) * d) }; }
  ctx.view = (v, dur = 1.1, ease = 'inout') => { if (typeof v === 'string' && dofT) ctx.dof(null, 0, .5); const p = pose(v, camera.aspect); if (!dur) { camera.position.copy(p.pos); controls.target.copy(p.tgt); controls.update(); return Promise.resolve(); } const p0 = camera.position.clone(), t0 = controls.target.clone(); controls.enabled = false; return tween(dur, e => { camera.position.lerpVectors(p0, p.pos, e); camera.position.y += Math.sin(e * Math.PI) * p0.distanceTo(p.pos) * .08; controls.target.lerpVectors(t0, p.tgt, e); camera.lookAt(controls.target); }, ease).then(() => { controls.enabled = true; controls.update(); }); };
  ctx.cityView = (id, d = 16) => { ctx.dof(new THREE.Vector3(CITY[id].X, .5, CITY[id].Z), .0005, .8); return ctx.view({ t: [CITY[id].X, 0, CITY[id].Z], d, pol: .9, az: .35 }); };
  ctx.follow = (obj, dur, d = 40, pol = .75, az = .1) => { const off = pose({ t: [0, 0, 0], d, pol, az }, camera.aspect).pos; controls.enabled = false; const p0 = camera.position.clone(), t0 = controls.target.clone(); const tmp = new THREE.Vector3(); return tween(dur, (e, k) => { obj.getWorldPosition(tmp); tmp.y = 0; const b = Math.min(1, k * 3); controls.target.lerpVectors(t0, tmp, b); camera.position.lerpVectors(p0, tmp.clone().add(off), b); camera.lookAt(controls.target); }, 'lin').then(() => { controls.enabled = true; controls.update(); }); };
  ctx.orbit = (dur, amt = .5) => { const tg = controls.target.clone(), off = camera.position.clone().sub(tg); controls.enabled = false; return tween(dur, e => { const a = amt * e, c = Math.cos(a), s = Math.sin(a); camera.position.set(tg.x + off.x * c + off.z * s, tg.y + off.y, tg.z - off.x * s + off.z * c); camera.lookAt(tg); }, 'inout').then(() => { controls.enabled = true; controls.update(); }); };
  const spot = new THREE.SpotLight('#fff6e0', 0, 0, .36, .7, 0); scene.add(spot, spot.target); const base = { h: hemi.intensity, k: key.intensity };
  ctx.stageLight = (pos, on) => { if (on) { spot.position.set(pos.x + 3, pos.y + 14, pos.z + 9); spot.target.position.copy(pos); } const a = { h: hemi.intensity, k: key.intensity, s: spot.intensity }; return tween(.6, e => { hemi.intensity = lerp(a.h, on ? base.h * .5 : base.h, e); key.intensity = lerp(a.k, on ? base.k * .5 : base.k, e); spot.intensity = lerp(a.s, on ? 2.4 : 0, e); }, 'inout'); };
  ctx.think = (pos, col, dur) => { const dots = [0, 1, 2].map(i => { const d = new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 8), new THREE.MeshBasicMaterial({ color: col })); d.position.copy(pos).add(new THREE.Vector3((i - 1) * .4, 0, 0)); fx.add(d); return d; }); return tween(dur, (e, k) => dots.forEach((d, i) => { const ph = Math.max(0, Math.sin(k * 14 - i * 1.2)); d.position.y = pos.y + ph * .25; d.scale.setScalar(.7 + ph * .5); }), 'lin').then(() => dots.forEach(d => fx.remove(d))); };
  ctx.phase = (n, t, s) => ctx.emit && ctx.emit('phase', { n, t, s });

  // ---------- Regeln ----------
  function route(pl, target) {
    const src = Object.keys(ST.owners).filter(k => ST.owners[k].includes(pl)), dist = {}, prev = {}; MAP.cities.forEach(c => dist[c.id] = Infinity); src.forEach(s => dist[s] = 0); const Q = new Set(Object.keys(dist));
    while (Q.size) { let u = null, b = Infinity; for (const k of Q) if (dist[k] < b) { b = dist[k]; u = k; } if (u === null) break; Q.delete(u); for (const e of ADJ[u]) { const v = e.a === u ? e.b : e.a, w = ST.lines.some(l => l.e === e.i && l.pl === pl) ? 0 : e.cost; if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = [u, e]; } } }
    if (!target) return dist; const path = []; let v = target; while (prev[v]) { const [u, e] = prev[v]; if (!ST.lines.some(l => l.e === e.i && l.pl === pl)) path.unshift({ e, from: u, to: v }); v = u; } return { cost: dist[target], path };
  }
  ctx.quote = (id, pl = ME) => { const own = ST.owners[id] || []; if (own.includes(pl)) return { why: 'Schon deine Stadt' }; if (own.length >= ST.step) return { why: `Stufe ${ST.step}: belegt` }; const r = route(pl, id); if (r.cost === Infinity) return { why: 'Keine Verbindung' }; const house = [10, 15, 20][own.length]; return { line: r.cost, house, total: r.cost + house, path: r.path, ok: r.cost + house <= ST.players[pl].money }; };
  ctx.cheapestCity = pl => { let best = null; MAP.cities.forEach(c => { const q = ctx.quote(c.id, pl); if (q.path && q.path.length && q.ok && (!best || q.total < best.q.total)) best = { id: c.id, q }; }); return best && best.id; };
  ctx.markReach = (on = true) => { const d = route(ME); MAP.cities.forEach(c => { const own = ST.owners[c.id] || []; const ok = on && !own.includes(ME) && own.length < ST.step && d[c.id] + [10, 15, 20][own.length] <= ST.players[ME].money; cityG[c.id].userData.ring.visible = ok; cityG[c.id].userData.reach = ok; }); };
  ctx.cheapest = (k, n) => pieces[k].slice().sort((a, b) => a.i - b.i).slice(0, n);
  ctx.cityCount = cityCount; ctx.cityName = id => CITY[id].name;
  ctx.capacity = pl => ST.players[pl].plants.reduce((s, n) => s + PLANTDATA[n][2], 0);

  // ---------- Geld ----------
  ctx.pay = async (pl, amount, to = ctx.bankPos()) => { if (amount <= 0) return; ST.players[pl].money -= amount; drawPlate(pl); const L = coins[pl], n = Math.max(1, Math.min(L.length, Math.round(amount / 5))); const fly = L.splice(Math.max(0, L.length - n), n); FX.label(`−${amount} €`, ctx.coinPos(pl, L.length).add(new THREE.Vector3(0, 1.8, 0)), P.neg || '#ff8a7a'); ctx.emit && ctx.emit('money');
    await Promise.all(fly.map((c, i) => wait(i * .05).then(() => FX.arc(c, to.clone().add(new THREE.Vector3((Math.random() - .5) * 3, 0, (Math.random() - .5) * 2)), .9, 6, 'inout', 3)).then(() => coinGroup.remove(c)))); syncCoins(pl); };
  ctx.earn = async (pl, amount) => { ST.players[pl].money += amount; drawPlate(pl); const n = Math.max(1, Math.round(amount / 5)), L = coins[pl], jobs = []; for (let i = 0; i < n; i++) { const c = T.coin(ctx); c.position.copy(ctx.bankPos()); coinGroup.add(c); const to = ctx.coinPos(pl, L.length); L.push(c); jobs.push(wait(i * .05).then(() => FX.arc(c, to, 1.0, 7, 'inout', 4)).then(() => tween(.14, k => c.scale.set(1 + .3 * Math.sin(k * Math.PI), 1 - .4 * Math.sin(k * Math.PI), 1 + .3 * Math.sin(k * Math.PI)), 'lin'))); } FX.label(`+${amount} €`, ctx.coinPos(pl, 0).add(new THREE.Vector3(0, 2.4, 0)), P.players[pl], 1.6); ctx.emit && ctx.emit('money'); await Promise.all(jobs); syncCoins(pl); };

  // ---------- PHASE 4: Bauen ----------
  ctx.build = async (id, pl = ME, o = {}) => {
    const q = ctx.quote(id, pl); if (!q.path) return false; ctx.markReach(false); ctx.setActive(pl);
    if (o.camera !== false) { const pts = [id, ...q.path.map(s => s.from)].map(k => CITY[k]); const cx = pts.reduce((s, c) => s + c.X, 0) / pts.length, cz = pts.reduce((s, c) => s + c.Z, 0) / pts.length, ext = Math.max(...pts.map(c => Math.hypot(c.X - cx, c.Z - cz))); await ctx.view({ t: [cx, 0, cz], d: Math.max(26, ext * 3.2), pol: .78, az: .15 }, .9); }
    ctx.pay(pl, q.total);
    for (const st of q.path) { const l = { e: st.e.i, pl, from: st.from }; ST.lines.push(l); const lo = addLine(l, false); await T.animLine(ctx, lo, CITY[st.from], CITY[st.to], pl); }
    const slot = (ST.owners[id] ||= []).length; ST.owners[id].push(pl); const h = placeHouse(id, pl, slot);
    if (o.camera !== false) await ctx.cityView(id, 15);
    await T.animHouse(ctx, h, CITY[id], pl, slot);
    await FX.arc(discs[pl], ctx.trackPos(cityCount(pl), pl), .6, 1.2); ctx.refreshMap(); ctx.emit && ctx.emit('state'); return true;
  };

  // ---------- PHASE 3: Rohstoffe ----------
  ctx.buy = async (pl, cart) => {
    ctx.setActive(pl); ctx.highlightMarket(pl); await wait(.7);
    const plan = []; for (const k in cart) { const take = ctx.cheapest(k, cart[k]); for (const p of take) { const pi = fuelPlant(pl, k); if (pi < 0) break; const num = ST.players[pl].plants[pi]; const j = stored[pl][num].length; stored[pl][num].push(p); plan.push({ p, pi, j }); pieces[k].splice(pieces[k].indexOf(p), 1); ST.occ[k] = ST.occ[k].filter(i => i !== p.i); } }
    const cost = plan.reduce((s, x) => s + PRICE(x.p.k, x.p.i), 0); ctx.pay(pl, cost);
    await Promise.all(plan.map((x, n) => wait(n * .16).then(async () => { const dest = ctx.storeSlot(pl, x.pi, x.j); dest.y += matMeshes[pl].s.position.y; const price = PRICE(x.p.k, x.p.i); x.p.i = -1; ctx.updateMarkers(); await T.animBuy(ctx, x.p, dest, price); x.p.m.scale.setScalar(pieceScale(pl)); })));
    ctx.highlightMarket(null); ctx.emit && ctx.emit('state'); return cost;
  };
  // Nachschub: Tanker (Öl), Müllwagen (Müll), Güterzug (Kohle), kleiner Zug (Uran)
  ctx.restock = async (step = ST.step, o = {}) => { const add = REFILL[step], jobs = []; let n = 0; for (const k of ['coal', 'oil', 'garbage', 'uranium']) { let c = add[k]; const total = k === 'uranium' ? 12 : 24, targets = []; for (let i = total - 1; i >= 0 && c > 0; i--) { if (ST.occ[k].includes(i)) continue; c--; targets.push(i); } if (!targets.length) continue; targets.forEach(i => ST.occ[k].push(i)); const d = n++ * 1.4; jobs.push(wait(d).then(() => deliver(k, targets, o.follow && d === 0))); } await Promise.all(jobs); };
  async function deliver(k, targets, follow) {
    const kind = { oil: 'water', garbage: 'road', coal: 'rail', uranium: 'rail' }[k]; const v = k === 'oil' ? tanker() : k === 'garbage' ? garbageTruck() : train(k); const z = LZ[kind], y = kind === 'water' ? -.45 : kind === 'rail' ? -.4 : -.5;
    const xs = targets.map(i => ctx.mslot(k, i).x), stopX = xs.reduce((a, b) => a + b, 0) / xs.length, x0 = LX1 - 4, x1 = LX0 - 2;
    v.position.set(x0, y, z); scene.add(v); const cargo = targets.map((i, j) => { const m = T.resource(ctx, k); m.scale.setScalar(.8); const s = v.userData.slots[j % v.userData.slots.length]; m.position.copy(s).add(new THREE.Vector3(0, Math.floor(j / v.userData.slots.length) * .5, 0)); v.add(m); return { m, k, i }; });
    if (follow) ctx.follow(v, 2.2, 30, .9, -.45);
    await tween(2.2, e => { v.position.x = lerp(x0, stopX + (v.userData.anchor || 0), e); if (kind === 'water') { v.rotation.z = Math.sin(e * 12) * .02; v.position.y = y + Math.sin(e * 9) * .04; } else v.position.y = y + Math.abs(Math.sin(e * 40)) * .02; }, 'out');
    if (v.userData.horn) ctx.shake(.04);
    await Promise.all(cargo.map((p, j) => wait(j * .14).then(async () => { pieceGroup.attach(p.m); const to = ctx.mslot(k, p.i); await FX.arc(p.m, to, .8, 3.4, 'inout', 3); await tween(.16, kk => p.m.scale.setScalar(.8 + .35 * Math.sin(kk * Math.PI)), 'lin'); p.m.scale.setScalar(1); pieces[k].push(p); ctx.updateMarkers(); })));
    await wait(.25); const sx = v.position.x; await tween(1.6, (e, kk) => { v.position.x = lerp(sx, x1, e); if (kk > .8) v.scale.setScalar(Math.max(.001, (1 - kk) / .2)); }, 'in'); scene.remove(v);
  }

  // ---------- PHASE 2: Kraftwerke ersteigern (Bühne vor dem Horizont) ----------
  ctx.selectCard = n => { cards.forEach((c, m) => { const on = m === n; const y0 = c.position.y, y1 = on ? .8 : .06; tween(.3, e => { c.position.y = lerp(y0, y1, e); }); }); ctx.selected = n; };
  const seatX = i => (i - (NP - 1) / 2) * 2.3;
  ctx.auction = async (n, bids, o = {}) => {
    const c = cards.get(n); if (!c) return; ctx.selected = null; ctx.setActive(bids[0][0]);
    await ctx.view('plants', .8); const from = c.position.clone();
    await tween(.22, k => { c.position.y = from.y - .12 * Math.sin(k * Math.PI / 2); }, 'out');
    await tween(.5, e => { c.position.y = lerp(from.y, 1.6, e); }, 'out');
    // Karte fliegt zur Bühne und richtet sich auf der Staffelei auf
    const up = new THREE.Vector3(STG.x, 3.05, STG.z - 1.55); ctx.view('stage', 1.2); ctx.stageLight(new THREE.Vector3(STG.x, 1.5, STG.z), true);
    const a = c.position.clone(); await tween(1.15, e => { c.position.lerpVectors(a, up, e); c.position.y += Math.sin(e * Math.PI) * 3; c.rotation.x = (Math.PI / 2 - .1) * E.inout(e); c.scale.setScalar(1 + .15 * e); }, 'inout');
    ctx.shake(.08); ctx.dof(new THREE.Vector3(STG.x, 1.6, STG.z), .0005, .8);
    const sm = plantModel(n, PLANTDATA[n][0], null); sm.position.set(STG.x, .5, STG.z + .35); scene.add(sm); sm.userData.spinners.forEach(s => spinners.push(s)); FX.ripple(new THREE.Vector3(STG.x, .5, STG.z), P.accent, 3.5, .8); await assemble(sm, tween, 1.2);
    const lad = ladder(n); lad.position.set(STG.x + 3.4, .5, STG.z + .4); lad.scale.set(.8, .001, .8); scene.add(lad); const mk = new THREE.Mesh(new RoundedBoxGeometry(1.0, .22, .3, 2, .05), new THREE.MeshStandardMaterial({ color: P.accent })); lad.add(mk); mk.position.set(0, lad.userData.y(n), .12);
    await tween(.5, e => lad.scale.y = Math.max(.001, .8 * e), 'back');
    const pads = {}; let last = null;
    for (const [pl, v] of bids) {
      ctx.setActive(pl); const px = STG.x + seatX(pl), pz = STG.z + 3.6;
      if (pl !== ME) await ctx.think(new THREE.Vector3(px, 3.0, pz), P.players[pl], .55 + Math.random() * .4);
      if (last && v !== null && pads[last[0]] && last[0] !== pl) { const op = pads[last[0]]; tween(.5, (e, k) => op.rotation.z = Math.sin(k * 26) * .12 * (1 - k), 'lin'); }
      if (pads[pl]) { const old = pads[pl]; tween(.3, (e, k) => old.position.y = -2.6 * k, 'in').then(() => scene.remove(old)); }
      const pd = paddle(P.players[pl], ST.players[pl].name, v); pd.position.set(px, 0, pz); pd.scale.set(.9, .001, .9); scene.add(pd); pads[pl] = pd;
      ctx.view({ ...VIEWS.stage, az: VIEWS.stage.az + seatX(pl) * .025 }, .6);
      await tween(.45, e => pd.scale.y = Math.max(.001, .9 * e), 'back');
      if (v !== null) { last = [pl, v]; const y0 = mk.position.y; const y1 = lad.userData.y(Math.min(v, n + 12)); await tween(.4, e => mk.position.y = lerp(y0, y1, e), 'out'); FX.label(v + ' €', new THREE.Vector3(lad.position.x, .5 + y1 * .8 + .8, lad.position.z + .3), P.players[pl], 1, .8); tween(.25, k => c.position.z = up.z + Math.sin(k * Math.PI) * .2, 'lin'); }
      else { await tween(.5, e => { pd.rotation.z = (seatX(pl) > 0 ? -1 : 1) * 1.2 * e; pd.position.y = -.4 * e; }, 'in'); }
      await wait(.35);
    }
    const [winner, price] = last; ctx.setActive(winner);
    const stp = stampMesh(); stp.rotation.x = 0; stp.position.set(up.x, up.y + 2.4, up.z + .2); stp.scale.setScalar(1.8); ov.add(stp); await tween(.3, e => { stp.position.y = lerp(up.y + 2.4, up.y, e); stp.position.z = up.z + .12; stp.scale.setScalar(lerp(1.8, .9, e)); }, 'in');
    ctx.hitPause(.14); ctx.shake(.5); FX.burst(up.clone().add(new THREE.Vector3(0, 0, .4)), ['#c0392b', '#ffffff', P.players[winner]], 30, { speed: 4, up: 3, life: 1 }); await wait(.7); tween(.4, (e, k) => stp.material.opacity = 1 - k, 'lin').then(() => ov.remove(stp));
    Object.values(pads).forEach(pd => tween(.4, (e, k) => pd.position.y = -2.6 * k, 'in').then(() => scene.remove(pd))); tween(.4, (e, k) => lad.scale.y = Math.max(.001, .8 * (1 - k)), 'in').then(() => scene.remove(lad));
    ctx.dof(null, 0, .4); ctx.stageLight(null, false);
    cards.delete(n); ST.market = ST.market.filter(x => x !== n); ctx.pay(winner, price);
    // Modell verschwindet von der Bühne, Karte legt sich flach und fliegt mit eigenem Modell zur Matte
    tween(.45, (e, k) => sm.scale.setScalar(Math.max(.001, 1 - k)), 'in').then(() => scene.remove(sm));
    let slot = ST.players[winner].plants.length; if (slot >= 3) { const low = Math.min(...ST.players[winner].plants); slot = ST.players[winner].plants.indexOf(low); await ctx.view(boardView(winner), .9); await scrap(winner, low); }
    ST.players[winner].plants[slot] = n; stored[winner][n] = []; hand[winner][slot] = c;
    const m = attachModel(c, n, winner, true); m.scale.setScalar(.001);
    const to = ctx.plantSlot(winner, slot); to.y += matMeshes[winner].s.position.y; const b0 = c.position.clone(), s0 = c.scale.x, s1 = BOARDS[winner].cs, r0 = c.rotation.x;
    ctx.follow(c, 1.9, 34, .78, 0);
    await tween(1.9, e => { c.position.lerpVectors(b0, to, e); c.position.y += Math.sin(e * Math.PI) * 8; c.rotation.x = lerp(r0, 0, Math.min(1, e * 1.6)); c.rotation.y = Math.sin(e * Math.PI) * -.4; c.scale.setScalar(lerp(s0, s1, e)); m.scale.setScalar(Math.max(.001, MS * Math.min(1, e * 1.4))); }, 'inout'); c.rotation.set(0, 0, 0);
    FX.ripple(to.clone(), P.players[winner], 3, .8); FX.burst(to.clone().setY(to.y + .5), [P.players[winner], '#ffffff'], 18, { speed: 3, up: 3, life: .8 }); await wait(.4);
    if (o.refill !== false) await ctx.refill(); ctx.emit && ctx.emit('state'); return winner;
  };
  async function scrap(pl, num) { const i = ST.players[pl].plants.indexOf(num), c = hand[pl][i], m = c.userData.model; const pos = new THREE.Vector3(); c.getWorldPosition(pos);
    FX.label('Abriss', pos.clone().setY(2.5), P.neg || '#ff8a7a', 1.2, .9); if (m) { await tween(.8, (e, k) => { m.scale.y = Math.max(.001, MS * (1 - e)); m.rotation.z = Math.sin(k * 30) * .03 * (1 - k); }, 'in'); FX.burst(pos.clone().setY(.4), ['#b9bec5', '#8e98a3', '#d3d6db'], 30, { speed: 2.5, up: 2.5, life: 1.2 }); }
    stored[pl][num].forEach(p => tween(.5, (e, k) => p.m.scale.setScalar(Math.max(.001, 1 - k)), 'in').then(() => pieceGroup.remove(p.m))); delete stored[pl][num];
    const a = c.position.clone(), to = new THREE.Vector3(a.x, -2, a.z + 16); await tween(1.0, (e, k) => { c.position.lerpVectors(a, to, e); c.position.y = a.y + Math.sin(e * Math.PI) * 4 - 2 * e; c.rotation.x = e * 2; }, 'in'); cardGroup.remove(c); }
  ctx.refill = async (o = {}) => { const top = deckCards.pop(); if (!top) return; const n = ST.deck.pop(); ST.market.push(n); cards.set(n, top); top.userData.card = n; if (o.camera !== false) await ctx.view('plants', .7);
    const a = top.position.clone(); await tween(.8, e => { top.position.set(a.x + 3.5 * e, a.y + Math.sin(e * Math.PI) * 4 + .1, a.z - 2 * e); top.rotation.z = Math.PI * (1 - e); }, 'inout');
    const m = attachModel(top, n, null, true); await assemble(m, tween, .6); await wait(.4); await tween(.3, (e, k) => m.scale.y = Math.max(.001, MS * (1 - k)), 'in'); m.visible = false;
    const order = sortedMarket(); await Promise.all(order.map((mm, i) => { const c = cards.get(mm), from = c.position.clone(), to = ctx.cslot(i); if (from.distanceTo(to) < .01) return; return tween(.8, e => { c.position.lerpVectors(from, to, e); c.position.y += Math.sin(e * Math.PI) * .9; }, 'inout', i * .05); })); };
  ctx.cycleHighest = async () => { const hi2 = sortedMarket().pop(), c = cards.get(hi2); cards.delete(hi2); ST.market = ST.market.filter(x => x !== hi2); ST.deck.unshift(hi2); const d = ctx.deckPos(); FX.label('unter den Stapel', c.position.clone().setY(2.4), P.dark ? '#e6edf3' : '#141c24', 1.2, .8); await tween(.5, e => { c.position.y = lerp(.06, 1.5, e); c.rotation.z = Math.PI * e; }); await FX.arc(c, new THREE.Vector3(d.x, -.02, d.z), .8, 1.5); deckCards.unshift(c); deckCards.forEach((dc, i) => { const y0 = dc.position.y; tween(.4, e => dc.position.y = lerp(y0, .06 + i * .1, e)); }); await ctx.refill({ camera: false }); };
  ctx.scrapLowestMarket = async () => { const lo = sortedMarket()[0], c = cards.get(lo); cards.delete(lo); ST.market = ST.market.filter(x => x !== lo); FX.label('aus dem Spiel', c.position.clone().setY(2.4), P.neg || '#ff8a7a', 1.2, .8); await tween(.6, (e, k) => { c.position.y = .06 + 2 * e; c.scale.setScalar(Math.max(.001, 1 - k)); c.rotation.y = 4 * e; }, 'in'); FX.burst(c.position.clone(), ['#fffdf2', '#cfcabe'], 30, { speed: 3, up: 2, life: 1, mesh: col => new THREE.Mesh(new THREE.PlaneGeometry(.3, .2), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })) }); cardGroup.remove(c); await ctx.refill({ camera: false }); };

  // ---------- PHASE 5: Bürokratie ----------
  ctx.burnFire = async (pl) => { ctx.setActive(pl); let cap = 0; const jobs = []; let n = 0; hand[pl].forEach((c, i) => { const num = ST.players[pl].plants[i]; if (num == null || !c) return; const [f, need, pw] = PLANTDATA[num]; const st = stored[pl][num]; if (st.length < need) { const p = new THREE.Vector3(); c.getWorldPosition(p); FX.label('kein Brennstoff', p.setY(2), P.neg || '#ff8a7a', 1.3, .7); return; } cap += pw;
      const use = st.splice(0, need), model = c.userData.model, wp = new THREE.Vector3(); model.getWorldPosition(wp);
      jobs.push((async () => { await Promise.all(use.map((p, j) => wait((n + j) * .12).then(async () => { await FX.arc(p.m, wp.clone().setY(wp.y + .4), .7, 2.2, 'in', 2); const fl = FX.sprite('#ff9a3c', .3); fl.position.copy(wp).setY(wp.y + .9); tween(.5, (e, k) => fl.scale.setScalar(.3 + 2.2 * Math.sin(k * Math.PI)), 'out').then(() => FX.kill(fl)); pieceGroup.remove(p.m); }))); n += use.length;
        const p0 = model.position.clone(); await tween(.45, (e, k) => model.position.set(p0.x + (Math.random() - .5) * .06 * k, p0.y, p0.z + (Math.random() - .5) * .06 * k), 'lin'); model.position.copy(p0);
        const ch = model.userData.chimneys.map(v => model.localToWorld(v.clone())); spinBoost = 6; await Promise.all([...ch.map(at => FX.smoke(at, 2.2, P.smoke || '#dfe3ea')), wait(2.2)]); spinBoost = 0; })()); });
    await Promise.all(jobs); const B = BOARDS[pl]; FX.label(`${cap} Städte Kapazität`, new THREE.Vector3(B.x, 3.2, B.z - 3.5), P.players[pl], 1.6, .9); return cap; };
  ctx.power = async () => {
    const seqs = []; ST.players.forEach((p, pl) => { const net = Object.keys(ST.owners).filter(k => ST.owners[k].includes(pl)); if (!net.length) return; const order = [[net[0], null, null]], seen = new Set([net[0]]); for (let i = 0; i < order.length; i++) for (const e of ADJ[order[i][0]]) { const lo = lineObjs.find(o => o.l.e === e.i && o.l.pl === pl); if (!lo) continue; const v = e.a === order[i][0] ? e.b : e.a; if (!seen.has(v)) { seen.add(v); order.push([v, order[i][0], lo]); } } net.forEach(id => { if (!seen.has(id)) { seen.add(id); order.push([id, null, null]); } }); seqs.push({ pl, order }); });
    ctx.setActive(null); await T.animPower(ctx, seqs);
  };
  ctx.bureaucracy = async (o = {}) => {
    ctx.phase(5, 'Bürokratie', 'Verbrennen, Strom liefern, Einkommen, Nachschub');
    await ctx.view('mats', 1.1); const caps = []; for (let pl = 0; pl < NP; pl++) { caps[pl] = await ctx.burnFire(pl); }
    await ctx.view('map', 1.2); await ctx.power();
    await ctx.view('overview', 1.1); ctx.setActive(null); await Promise.all(ST.players.map((p, pl) => wait(pl * .25).then(() => ctx.earn(pl, INCOME[Math.min(cityCount(pl), caps[pl], 10)]))));
    await ctx.view('logistics', 1.1); await ctx.restock(ST.step, { follow: false }); await ctx.view('plants', 1); await ctx.cycleHighest(); ctx.emit && ctx.emit('state');
  };
  // ---------- PHASE 1: Reihenfolge ----------
  ctx.reorder = async () => { const ord = ST.players.map((p, i) => i).sort((a, b) => cityCount(b) - cityCount(a) || Math.max(...ST.players[b].plants) - Math.max(...ST.players[a].plants)); ST.order = ord; await ctx.view('track', 1); for (let i = 0; i < ord.length; i++) { const pl = ord[i], d = orderDiscs.find(dd => dd.userData.pl === pl); ctx.setActive(pl); await FX.arc(d, ctx.orderPos(i), .7, 3, 'inout', 3.14); } await wait(.3); ctx.setActive(ord[0]); };
  ctx.setStep = async s => { ST.step = s; ctx.refreshMap(); ctx.markReach(); ctx.emit && ctx.emit('state'); };
  ctx.stepEvent = async s => { ctx.phase(0, 'Stufe ' + s, s === 2 ? 'Jede Stadt öffnet einen zweiten Platz' : 'Alle drei Plätze offen, der Markt schrumpft auf sechs'); await ctx.view('map', 1.1); ST.step = s;
    const ids = MAP.cities.map(c => c.id).sort((a, b) => CITY[a].X - CITY[b].X); await Promise.all(ids.map((id, i) => wait(i * .025).then(() => { const g = cityG[id]; FX.ripple(g.position.clone(), P.accent, 2.6, .8); return tween(.4, (e, k) => g.position.y = Math.sin(k * Math.PI) * .6, 'out'); })));
    ctx.refreshMap(); await ctx.view('plants', 1); await ctx.scrapLowestMarket(); ctx.markReach(); ctx.emit && ctx.emit('state'); };

  // ---------- Eine komplette Runde mit Regie ----------
  ctx.round = async () => {
    ctx.phase(1, 'Spielerreihenfolge', 'Wer die meisten Städte hat, zieht zuerst'); await ctx.view('hero', 1.6); await ctx.reorder();
    ctx.phase(2, 'Kraftwerke ersteigern', 'Reihum: auswählen, bieten, Zuschlag'); const m1 = sortedMarket()[1]; await ctx.auction(m1, [[1, m1], [0, m1 + 1], [3, m1 + 2], [1, m1 + 4], [0, null], [3, null]]);
    const m2 = sortedMarket().slice(0, 4).find(x => PLANTDATA[x][0] !== 'eco' && x !== m1) || sortedMarket()[0]; await ctx.auction(m2, [[0, m2], [2, m2 + 1], [0, m2 + 4], [2, null]]);
    ctx.phase(3, 'Rohstoffe kaufen', 'Umgekehrte Reihenfolge, die Preise steigen mit jedem Kauf'); await ctx.view('market', 1.2);
    for (const [pl, cart] of [[3, { uranium: 1 }], [2, { garbage: 2, coal: 1 }], [1, { coal: 3 }], [0, { coal: 2, oil: 2, garbage: 2, uranium: 1 }]]) { const fil = {}; for (const k in cart) if (ctx.canStore(pl, k)) fil[k] = cart[k]; await ctx.buy(pl, fil); await wait(.4); }
    ctx.phase(4, 'Netz bauen', 'Umgekehrte Reihenfolge: Leitung plus Anschluss'); for (const pl of [3, 2, 1, 0]) { const id = ctx.cheapestCity(pl); if (id) await ctx.build(id, pl); }
    await ctx.bureaucracy(); await ctx.view('overview', 1.4); ctx.setActive(null); ctx.phase(-1, 'Runde beendet', 'Nächste Runde beginnt mit neuer Reihenfolge');
  };
  ctx.intro = async () => { const hs = []; Object.values(cityG).forEach(g => g.userData.houses.forEach(h => h && hs.push(h))); hs.forEach(h => h.scale.setScalar(.001)); lineObjs.forEach(l => l.set(0)); const models = hand.flat().map(c => c.userData.model).filter(Boolean); models.forEach(m => m.scale.set(MS, .001, MS));
    await ctx.view({ t: [0, 0, 0], d: 240, pol: .2, az: -.7 }, 0); ctx.phase(0, 'Grid Master 2', 'Grid Plan · ein Netzplanungsmodell'); const cam = ctx.view('hero', 3.6);
    await wait(1.0); await Promise.all(lineObjs.map((l, i) => wait(i * .1).then(() => tween(.9, e => { l.set(e); if (l.pylons) l.pylons.forEach(p => p.scale.y = Math.max(.001, Math.min(1, (e - p.userData.t) * 6 + 1))); }, 'inout'))));
    await Promise.all([...hs.map((h, i) => wait(i * .06).then(() => tween(.55, e => h.scale.setScalar(Math.max(.001, e)), 'spring'))), ...models.map((m, i) => wait(.3 + i * .15).then(() => { m.scale.setScalar(MS); return assemble(m, tween, .8); }))]); await cam; ctx.updateMarkers(true); };
  ctx.updateMarkers(true);
  Object.assign(ctx, { hand, stored, coins, spinners, kitSpin, boardView, syncCoins, getSpin: () => spinBoost, STG, LZ });

  // ---------- picking ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let pd = null;
  renderer.domElement.addEventListener('pointerdown', e => { pd = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', e => { if (!pd || Math.hypot(e.clientX - pd.x, e.clientY - pd.y) > 8) return; const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([cities, cardGroup], true); for (const h of hits) { let o = h.object; while (o && !o.userData.city && !o.userData.card) o = o.parent; if (!o) continue; if (o.userData.city) { ctx.onCity && ctx.onCity(o.userData.city); return; } if (o.userData.card && cards.get(o.userData.card) === o) { ctx.onCard && ctx.onCard(o.userData.card); return; } } });

  // ---------- render ----------
  // ---------- Render-Pipeline: GTAO (Kontaktschatten), Tiefenschärfe für Nahaufnahmen, Vignette + Korn ----------
  const Q = ctx.quality = opt.quality || (/[?&]q=low/.test(location.search) ? 'low' : /[?&]q=mid/.test(location.search) ? 'mid' : (Math.min(screen.width, screen.height) < 600 ? 'mid' : 'high'));
  let composer = null, gtao = null, bokeh = null, finish = null; ctx.fxOn = Q !== 'low';
  { const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: Q === 'high' ? 4 : 2 }); composer = new EffectComposer(renderer, rt); composer.addPass(new RenderPass(scene, camera));
    if (Q !== 'low') { gtao = new GTAOPass(scene, camera, 4, 4); gtao.updateGtaoMaterial({ radius: .9, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: Q === 'high' ? 16 : 8, distanceFallOff: 1, screenSpaceRadius: false }); gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: Q === 'high' ? 16 : 8 }); gtao.blendIntensity = P.ao ?? .95; composer.addPass(gtao); }
    if (P.bloom) { composer.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), P.bloom, .5, .9); composer.addPass(composer.bloom); }
    bokeh = new BokehPass(scene, camera, { focus: 40, aperture: 0, maxblur: .0045 }); bokeh.enabled = false; composer.addPass(bokeh); const ovPass = new RenderPass(ov, camera); ovPass.clear = false; ovPass.clearDepth = true; composer.addPass(ovPass);
    composer.addPass(new OutputPass());
    finish = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uV: { value: P.vignette ?? .32 }, uG: { value: P.grain ?? .035 }, uT: { value: 0 } }, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform sampler2D tDiffuse;uniform float uV,uG,uT;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 d=vUv-.5;float v=1.-uV*smoothstep(.25,.9,length(d*vec2(1.15,1.)));c.rgb*=v;c.rgb+=(h(vUv*913.+uT)-.5)*uG;gl_FragColor=c;}' }); composer.addPass(finish); }
  key.shadow.radius = Q === 'low' ? 1 : 3; key.shadow.blurSamples = 12;
  ctx.setFx = on => { ctx.fxOn = on; if (gtao) gtao.enabled = on; finish.uniforms.uV.value = on ? (P.vignette ?? .32) : 0; finish.uniforms.uG.value = on ? (P.grain ?? .035) : 0; if (!on) { bokeh.enabled = false; dofT = null; } };
  // Tiefenschärfe: Fokus auf einen Punkt, Blende weich ein- und ausblenden
  let dofT = null, dofA = 0; ctx.dof = (target, aperture = .0016, dur = .6) => { if (!ctx.fxOn || Q === 'low' || (target && ctx.noDof)) return Promise.resolve(); const a0 = dofA, a1 = target ? aperture : 0; if (target) { dofT = target.clone ? target.clone() : new THREE.Vector3(...target); bokeh.enabled = true; } return tween(dur, e => { dofA = lerp(a0, a1, e); bokeh.uniforms.aperture.value = dofA * (camera.aspect < 1 ? .6 : 1); }, 'inout').then(() => { if (!target) { bokeh.enabled = false; dofT = null; } }); };
  // Kamera-Rütteln und Treffer-Pause (kurzes Einfrieren der Zeit für Gewicht)
  let shake = 0, timeScale = 1; ctx.shake = (amp = .35) => { shake = Math.max(shake, amp); }; ctx.hitPause = (s = .12) => { timeScale = .04; setTimeout(() => timeScale = 1, s * 1000); };
  ctx.resize = (w, h) => { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); if (gtao) gtao.setSize(w * renderer.getPixelRatio(), h * renderer.getPixelRatio()); };
  const clock = new THREE.Clock(); let t = 0; const shk = new THREE.Vector3(); const perf = [];
  ctx.frame = () => { const rdt = Math.min(.05, clock.getDelta()), dt = rdt * timeScale; t += dt; stepTweens(dt); T.tick && T.tick(ctx, t, dt); spinners.forEach(s => s.rotation.z += dt * (1.4 + spinBoost)); kitSpin.forEach(g => g.rotation.y += dt * .3); cities.children.forEach(g => { const r = g.userData.ring; if (r && r.visible) { r.material.opacity = .2 + .14 * Math.sin(t * 3); r.scale.setScalar(1 + .04 * Math.sin(t * 3)); } });
    if (controls.enabled) controls.update(); ctx.updateBadges && ctx.updateBadges();
    if (dofT) bokeh.uniforms.focus.value = camera.position.distanceTo(dofT);
    if (shake > .002) { shk.set((Math.random() - .5), (Math.random() - .5), (Math.random() - .5)).multiplyScalar(shake); camera.position.add(shk); shake *= Math.pow(.02, rdt); } else shk.set(0, 0, 0);
    // Adaptive Qualität: bei dauerhaft langsamen Bildern zuerst Tiefenschärfe, dann GTAO abschalten
    if (!/[?&]test/.test(location.search) && ctx.fxOn) { perf.push(rdt); if (perf.length > 120) { const avg = perf.reduce((a, b) => a + b, 0) / perf.length; perf.length = 0; if (avg > .042) { if (!ctx.noDof) ctx.noDof = true; else if (gtao && gtao.enabled) { gtao.enabled = false; ctx.emit && ctx.emit('quality', 'GTAO aus'); } } } }
    finish.uniforms.uT.value = t % 10; composer.render(rdt); camera.position.sub(shk); };
  ctx.dispose = () => { scene.traverse(o => { o.geometry && o.geometry.dispose(); }); controls.dispose(); };
  Object.assign(ctx, { cityG, cards, pieces, discs, lineObjs, MK, PM, TR, placeHouse, addPiece, makeCard, route });
  ctx.view('overview', 0); ctx.markReach();
  return ctx;
}
