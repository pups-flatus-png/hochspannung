// Stilisierte Miniatur-Skylines mit Wahrzeichen, ein Draw-Call pro Material für alle Städte.
// Pro-Stadt-Animation (Aufsteigen, Fenster stockwerkweise an, Puls, Besitzerfarbe) über eine Daten-Textur.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const SINK = .7;          // Gebäude reichen so tief ins Gelände, damit sie beim Aufsteigen „herauswachsen“
const WS = .085, HS = .1; // Fensterbreite / Stockwerkhöhe in Welt-Einheiten
const CELLS = 8;          // Fenster pro Texturkachel

function rng(seed) { let s = 0; for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------- textures ----------
function windowTextures() {
  const N = 256, cell = N / CELLS;
  const a = document.createElement('canvas'), e = document.createElement('canvas'); a.width = a.height = e.width = e.height = N;
  const ax = a.getContext('2d'), ex = e.getContext('2d');
  ax.fillStyle = '#56626c'; ax.fillRect(0, 0, N, N); ex.fillStyle = '#000'; ex.fillRect(0, 0, N, N);
  const r = rng('windows');
  for (let j = 0; j < CELLS; j++) for (let i = 0; i < CELLS; i++) {
    const x = i * cell + cell * .22, y = j * cell + cell * .2, w = cell * .56, h = cell * .52;
    ax.fillStyle = '#323c45'; ax.fillRect(x, y, w, h);
    const v = r(); if (v < .58) { const warm = r() < .82; ex.fillStyle = warm ? `rgba(255,${190 + r() * 40 | 0},${110 + r() * 50 | 0},${.55 + r() * .45})` : `rgba(200,225,255,${.5 + r() * .4})`; ex.fillRect(x, y, w, h); }
  }
  const t1 = new THREE.CanvasTexture(a), t2 = new THREE.CanvasTexture(e);
  [t1, t2].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; });
  return { map: t1, em: t2 };
}

// ---------- part builders (city-local coordinates, y=0 = Sockel-Oberkante) ----------
class Kit {
  constructor(r) { this.parts = []; this.r = r; this.tint = new THREE.Color(); }
  push(mat, g, col) {
    g = g.index ? g.toNonIndexed() : g; const n = g.attributes.position.count;
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    const c = new Float32Array(n * 3); const cc = col || new THREE.Color(1, 1, 1); for (let i = 0; i < n; i++) c.set([cc.r, cc.g, cc.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); this.parts.push({ mat, g }); return g;
  }
  // facade block with windows; base y0 (default sunk)
  block(w, h, d, x, z, ry = 0, y0 = -SINK, col) {
    const g = new THREE.BoxGeometry(w, h - y0, d); g.translate(0, (h + y0) / 2, 0);
    const uv = g.attributes.uv; const dims = [[d, h - y0], [d, h - y0], [0, 0], [0, 0], [w, h - y0], [w, h - y0]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; const [fw, fh] = dims[f]; if (!fw) uv.setXY(i, .01, .01); else uv.setXY(i, uv.getX(i) * fw / (WS * CELLS), (uv.getY(i) * fh) / (HS * CELLS)); }
    g.rotateY(ry); g.translate(x, 0, z);
    return this.push('bld', g, col || this.tint.setHSL(.58 + this.r() * .06, .08 + this.r() * .08, .55 + this.r() * .25).clone());
  }
  solid(mat, g, x, y, z, ry = 0, col) { g.rotateY(ry); g.translate(x, y, z); return this.push(mat, g, col); }
  box(mat, w, h, d, x, y, z, ry, col) { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return this.solid(mat, g, x, y, z, ry, col); }
  cyl(mat, rt, rb, h, x, y, z, seg = 16, col) { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(0, h / 2, 0); return this.solid(mat, g, x, y, z, 0, col); }
  cone(mat, r, h, x, y, z, seg = 16, col) { const g = new THREE.ConeGeometry(r, h, seg); g.translate(0, h / 2, 0); return this.solid(mat, g, x, y, z, 0, col); }
  sphere(mat, r, x, y, z, sy = 1, col) { const g = new THREE.SphereGeometry(r, 18, 12); g.scale(1, sy, 1); return this.solid(mat, g, x, y, z, 0, col); }
  lathe(mat, pts, x, y, z, seg = 24, col) { const g = new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg); return this.solid(mat, g, x, y, z, 0, col); }
  onion(x, y, z, r, col) { this.lathe('accent', [[0, 0], [r * .7, 0], [r, r * .7], [r * .8, r * 1.4], [r * .25, r * 2], [.012, r * 2.6], [0, r * 2.7]], x, y, z, 16, col); }
  spireTower(x, z, w, h, sp, col) { this.box('stone', w, h + SINK, w, x, -SINK, z, 0, col); this.cone('stone', w * .62, sp, x, h, z, 4, col); }
  beacon(x, y, z) { (this.beacons ||= []).push(new THREE.Vector3(x, y, z)); }
  // generic modern cluster
  cluster(n, rad, hMin, hMax, opts = {}) {
    const r = this.r;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * .6, d = Math.sqrt(r()) * rad;
      const x = Math.cos(a) * d, z = Math.sin(a) * d * .75;
      const centre = 1 - d / (rad + .01); const h = hMin + (hMax - hMin) * (centre * .7 + r() * .3) ** 1.4;
      const w = .16 + r() * .16, dd = .14 + r() * .14, ry = (r() - .5) * .5;
      this.block(w, h, dd, x, z, ry);
      if (h > hMax * .7 && opts.crowns !== false) { if (r() < .5) { this.block(w * .62, h + .18 + r() * .2, dd * .62, x, z, ry, h - .01); if (r() < .6) this.beacon(x, h + .4, z); } else if (r() < .5) this.cone('accent', w * .45, .2, x, h, z, 4); }
    }
  }
  oldTown(n, rad) { // low pitched-roof houses
    const r = this.r;
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = .3 + Math.sqrt(r()) * rad, x = Math.cos(a) * d, z = Math.sin(a) * d * .8, w = .14 + r() * .08, h = .16 + r() * .14, ry = r() * Math.PI;
      this.block(w, h, w * 1.2, x, z, ry);
      const roof = new THREE.CylinderGeometry(.001, w * .72, .12, 4); roof.rotateY(Math.PI / 4); roof.scale(1, 1, 1.2); roof.translate(0, h + .06, 0);
      this.solid('roof', roof, x, 0, z, ry, new THREE.Color().setHSL(.02 + r() * .04, .45, .32 + r() * .1));
    }
  }
  cathedral(x, z, s = 1, twin = true, col) {
    const c = col || new THREE.Color(.82, .78, .7);
    this.box('stone', .34 * s, .42 * s + SINK, .9 * s, x, -SINK, z + .35 * s, 0, c);
    const roof = new THREE.CylinderGeometry(.001, .25 * s, .2 * s, 4); roof.rotateY(Math.PI / 4); roof.scale(1, 1, 2.6); roof.translate(0, .52 * s, 0); this.solid('roof', roof, x, 0, z + .35 * s, 0, new THREE.Color(.25, .32, .3));
    if (twin) { this.spireTower(x - .13 * s, z - .12 * s, .16 * s, 1.0 * s, .75 * s, c); this.spireTower(x + .13 * s, z - .12 * s, .16 * s, 1.0 * s, .75 * s, c); }
    else this.spireTower(x, z - .12 * s, .2 * s, 1.1 * s, .9 * s, c);
  }
  tvTower(x, z, h, ballY, ballR, needle = .5) {
    this.cyl('metal', .045, .09, h + SINK, x, -SINK, z, 14, new THREE.Color(.85, .87, .9));
    this.sphere('glass', ballR, x, ballY, z, .95, new THREE.Color(.6, .65, .72));
    this.cyl('metal', .015, .025, needle, x, h, z, 6, new THREE.Color(.9, .3, .3)); this.beacon(x, h + needle, z);
  }
  lighthouse(x, z, h) {
    for (let i = 0; i < 5; i++) this.cyl('stone', .1 - i * .008, .11 - i * .008, h / 5, x, i * h / 5 - (i ? 0 : SINK), z, 14, i % 2 ? new THREE.Color(.95, .95, .95) : new THREE.Color(.85, .15, .12));
    this.cyl('glass', .075, .075, .12, x, h, z, 12, new THREE.Color(1, .9, .6)); this.cone('accent', .1, .1, x, h + .12, z, 12, new THREE.Color(.2, .25, .25));
    (this.lights ||= []).push(new THREE.Vector3(x, h + .06, z));
  }
}

// ---------- landmarks ----------
const STONE = new THREE.Color(.6, .57, .52), BRICK = new THREE.Color(.62, .3, .22), COPPER = new THREE.Color(.36, .62, .52), GOLD = new THREE.Color(1, .78, .35);
const LANDMARK = {
  berlin(k) { k.tvTower(0, 0, 2.6, 2.05, .2, .55); k.cluster(9, .9, .25, .8); k.box('stone', .5, .32, .1, .55, 0, .35, 0, STONE); for (let i = 0; i < 6; i++) k.box('stone', .04, .3, .06, .35 + i * .08, -SINK + .02, .35, 0, STONE); },
  hamburg(k) {
    k.block(.75, .45, .32, 0, 0, .2, -SINK, BRICK.clone());
    const g = new THREE.BoxGeometry(.75, .4, .32, 24, 1, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setY(i, .2 + .12 * Math.sin(p.getX(i) * 9) + .06 * Math.sin(p.getX(i) * 21)); g.computeVertexNormals(); g.translate(0, .65, 0); k.solid('glass', g, 0, 0, 0, .2, new THREE.Color(.75, .85, .95));
    k.spireTower(-.65, .2, .12, .8, .5, COPPER); k.cluster(6, .8, .2, .55, { crowns: false });
  },
  koeln(k) { k.cathedral(0, 0, 1.25, true, new THREE.Color(.55, .52, .48)); k.cluster(7, .95, .2, .55); },
  muenchen(k) { const c = new THREE.Color(.68, .36, .26); for (const x of [-.13, .13]) { k.box('stone', .18, 1.0 + SINK, .18, x, -SINK, 0, 0, c); k.onion(x, 1.0, 0, .1, COPPER); } k.box('stone', .36, .55 + SINK, .7, 0, -SINK, .42, 0, c); k.oldTown(9, .9); },
  frankfurt(k) {
    const t = [[0, 0, 2.6, .24], [.32, -.05, 2.1, .2], [-.3, .08, 1.8, .2], [.12, .32, 1.5, .18], [-.12, -.32, 2.2, .18], [.45, .3, 1.2, .16], [-.48, -.2, 1.3, .16]];
    t.forEach(([x, z, h, w], i) => { k.block(w, h, w, x, z, i * .3); if (i === 0) { k.cone('accent', w * .7, .35, x, h, z, 4, new THREE.Color(.75, .78, .8)); k.beacon(x, h + .35, z); } else if (i % 2) k.beacon(x, h + .02, z); });
    k.cluster(6, 1.05, .25, .7, { crowns: false });
  },
  dresden(k) { k.box('stone', .42, .45 + SINK, .42, 0, -SINK, 0, 0, STONE); k.lathe('stone', [[0, 0], [.22, 0], [.24, .2], [.17, .45], [.08, .58], [.05, .62], [.05, .8], [0, .82]], 0, .45, 0, 24, STONE); k.oldTown(8, .85); k.spireTower(.5, .15, .12, .7, .45, STONE); },
  duesseldorf(k) { k.cyl('metal', .03, .07, 2.3 + SINK, 0, -SINK, 0, 12, new THREE.Color(.8, .82, .85)); k.cyl('glass', .16, .12, .12, 0, 1.75, 0, 18); k.cyl('metal', .01, .02, .4, 0, 2.3, 0, 6); k.beacon(0, 2.7, 0); k.cluster(8, .95, .2, .75); },
  stuttgart(k) { k.cyl('metal', .03, .085, 1.9 + SINK, 0, -SINK, 0, 12, new THREE.Color(.82, .84, .86)); k.cyl('glass', .14, .1, .22, 0, 1.6, 0, 16); k.cyl('metal', .012, .02, .5, 0, 1.9, 0, 6); k.beacon(0, 2.4, 0); k.cluster(7, .9, .2, .6); },
  ulm(k) { k.box('stone', .3, .45 + SINK, .8, 0, -SINK, .3, 0, STONE); k.spireTower(0, -.15, .24, 1.4, 1.35, STONE); k.oldTown(8, .8); },
  hannover(k) { k.box('stone', .9, .4 + SINK, .35, 0, -SINK, 0, 0, STONE); k.box('stone', .26, .75 + SINK, .26, 0, -SINK, 0, 0, STONE); k.lathe('accent', [[0, 0], [.15, 0], [.15, .1], [.11, .28], [.04, .36], [.02, .5], [0, .5]], 0, .75, 0, 18, COPPER); k.cluster(6, .9, .2, .6); },
  leipzig(k) { k.lathe('stone', [[0, 0], [.42, 0], [.42, .12], [.32, .14], [.32, .3], [.25, .32], [.22, .55], [.12, .7], [0, .72]], -.35, -SINK + .6, .1, 8, new THREE.Color(.55, .5, .45)); const g = new THREE.CylinderGeometry(.16, .16, 1.9, 24, 1, false, 0, Math.PI); g.translate(0, .95 - SINK * .5, 0); k.solid('bld', g, .3, 0, -.05, .3); k.beacon(.3, 1.95, -.05); k.cluster(6, .9, .2, .6); },
  luebeck(k) { const c = BRICK.clone(); k.box('stone', .34, .3 + SINK, .2, 0, -SINK, 0, 0, c); for (const x of [-.22, .22]) { k.cyl('stone', .12, .12, .42 + SINK, x, -SINK, 0, 16, c); k.cone('roof', .14, .3, x, .42, 0, 16, new THREE.Color(.2, .3, .28)); } k.spireTower(.5, -.3, .13, .9, .7, c); k.spireTower(-.5, -.25, .13, .85, .65, c); k.oldTown(6, .8); },
  kassel(k) { k.lathe('stone', [[0, 0], [.4, 0], [.3, .25], [.3, .3], [.2, .32], [.2, .62], [0, .62]], 0, -SINK + .5, 0, 8, new THREE.Color(.5, .48, .42)); k.cone('stone', .1, .42, 0, .62, 0, 4, new THREE.Color(.5, .48, .42)); k.cyl('accent', .025, .03, .2, 0, 1.04, 0, 6, COPPER); k.cluster(6, .9, .2, .5); },
  nuernberg(k) { const c = new THREE.Color(.6, .38, .3); k.box('stone', .7, .35 + SINK, .3, 0, -SINK, 0, 0, c); k.cyl('stone', .12, .12, .8 + SINK, -.32, -SINK, 0, 16, c); k.cone('roof', .14, .3, -.32, .8, 0, 16, new THREE.Color(.45, .2, .15)); k.spireTower(.35, -.05, .14, .75, .4, c); k.oldTown(9, .85); },
  essen(k) { const m = new THREE.Color(.75, .3, .2); const leg = (x1, z1) => { const a = new THREE.Vector3(x1, -SINK, z1), b = new THREE.Vector3(0, 1.05, 0); const d = b.clone().sub(a); const g = new THREE.BoxGeometry(.04, d.length(), .04); g.translate(0, d.length() / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(a.x, a.y, a.z); k.push('metal', g, m); }; leg(-.3, .1); leg(.3, .1); leg(0, -.35); for (const x of [-.09, .09]) { const w = new THREE.TorusGeometry(.13, .018, 6, 18); w.translate(x, 1.0, 0); k.push('metal', w, m); } k.block(.5, .3, .3, .2, .35); k.cluster(6, .9, .2, .5); },
  dortmund(k) { k.block(.3, 1.1, .3, 0, 0); k.box('glass', .31, .12, .31, 0, .98, 0, 0, new THREE.Color(.9, .7, .3)); k.tvTower(.45, -.2, 1.7, 1.35, .13, .35); k.cluster(6, .9, .2, .55); },
  duisburg(k) { const m = new THREE.Color(.9, .55, .15); for (const [x, z, r] of [[-.35, .1, .4], [.15, -.15, -.3], [.5, .2, .6]]) { k.box('metal', .06, .9 + SINK, .06, x, -SINK, z, 0, m); const jib = new THREE.BoxGeometry(.7, .04, .04); jib.translate(.22, .9, 0); k.solid('metal', jib, x, 0, z, r, m); k.box('metal', .12, .1, .1, x, .86, z, r, m); } k.cluster(6, .9, .15, .45, { crowns: false }); },
  mannheim(k) { k.cyl('stone', .18, .2, .7 + SINK, 0, -SINK, 0, 16, new THREE.Color(.75, .45, .35)); k.sphere('accent', .17, 0, .72, 0, .8, COPPER); k.cyl('accent', .02, .02, .15, 0, .85, 0, 6, GOLD); k.cluster(8, .95, .2, .7); },
  bremen(k) { k.cathedral(0, 0, .9, true, new THREE.Color(.6, .55, .5)); k.box('stone', .5, .32, .25, .55, 0, .3, 0, new THREE.Color(.7, .6, .45)); k.oldTown(8, .85); },
  rostock(k) { k.lighthouse(.5, .1, .9); k.spireTower(-.15, 0, .2, .9, .8, BRICK.clone()); k.oldTown(8, .8); },
  kiel(k) { k.lighthouse(-.45, .2, 1.0); k.spireTower(.2, -.1, .18, 1.0, .5, BRICK.clone()); k.cluster(6, .85, .15, .5); },
  cuxhaven(k) { k.lighthouse(0, 0, 1.0); const g = new THREE.SphereGeometry(.12, 10, 8); g.translate(.45, .75, .2); k.push('metal', g, new THREE.Color(.25, .2, .15)); k.cyl('metal', .02, .02, .7 + SINK, .45, -SINK, .2, 6, new THREE.Color(.3, .25, .2)); k.oldTown(6, .7); },
  schwerin(k) { const c = new THREE.Color(.92, .86, .72); k.box('stone', .7, .4 + SINK, .4, 0, -SINK, 0, 0, c); k.box('stone', .2, .75 + SINK, .2, 0, -SINK, 0, 0, c); k.onion(0, .75, 0, .11, GOLD); for (const x of [-.33, .33]) { k.cyl('stone', .07, .07, .55 + SINK, x, -SINK, .15, 12, c); k.onion(x, .55, .15, .07, GOLD); } k.oldTown(5, .8); },
  potsdam(k) { const c = new THREE.Color(.95, .85, .55); k.box('stone', .8, .25 + SINK, .26, 0, -SINK, 0, 0, c); k.lathe('accent', [[0, 0], [.14, 0], [.14, .08], [.1, .2], [0, .26]], 0, .25, 0, 18, COPPER); k.cyl('stone', .1, .12, .5 + SINK, .52, -SINK, -.25, 10, c); k.lathe('accent', [[0, 0], [.1, 0], [.07, .15], [0, .22]], .52, .5, -.25, 14, COPPER); k.oldTown(6, .85); },
  augsburg(k) { const c = new THREE.Color(.85, .75, .55); k.box('stone', .45, .5 + SINK, .26, 0, -SINK, 0, 0, c); for (const x of [-.14, .14]) k.onion(x, .5, 0, .07, COPPER); k.cyl('stone', .07, .07, 1.0 + SINK, .42, -SINK, -.1, 8, c); k.onion(.42, 1.0, -.1, .07, COPPER); k.oldTown(8, .85); },
  wuerzburg(k) { const c = new THREE.Color(.85, .8, .68); k.box('stone', .9, .45 + SINK, .5, 0, -SINK, -.1, 0, c); k.cyl('stone', .12, .12, .75 + SINK, -.3, -SINK, -.15, 14, c); k.onion(-.3, .75, -.15, .08, COPPER); k.cathedral(.5, .3, .7, true, c); k.oldTown(5, .8); },
  koblenz(k) { k.box('stone', .45, .3 + SINK, .45, 0, -SINK, 0, 0, new THREE.Color(.55, .5, .45)); k.box('stone', .2, .2, .2, 0, .3, 0, 0, new THREE.Color(.55, .5, .45)); k.lathe('accent', [[0, 0], [.07, 0], [.06, .15], [.03, .3], [0, .33]], 0, .5, 0, 10, COPPER); k.oldTown(8, .85); },
  halle(k) { const c = new THREE.Color(.6, .45, .35); k.box('stone', .2, .95 + SINK, .2, 0, -SINK, 0, 0, c); k.cone('roof', .16, .45, 0, .95, 0, 8, new THREE.Color(.25, .3, .3)); k.cathedral(.45, .25, .7, true, c); k.oldTown(6, .8); },
  muenster(k) { k.cathedral(0, 0, 1.0, true, new THREE.Color(.75, .68, .55)); k.oldTown(9, .9); },
  braunschweig(k) { k.cathedral(0, 0, .9, true, new THREE.Color(.65, .58, .48)); k.cluster(5, .85, .2, .5); },
  magdeburg(k) { k.cathedral(0, 0, 1.15, true, new THREE.Color(.7, .64, .55)); k.cluster(5, .9, .2, .5); },
  erfurt(k) { const c = new THREE.Color(.78, .72, .6); k.box('stone', .9, .3 + SINK, .35, 0, -SINK, .25, 0, c); k.spireTower(-.3, 0, .16, .7, .55, c); k.spireTower(-.1, 0, .16, .7, .55, c); k.spireTower(.25, -.05, .16, .75, .6, c); k.oldTown(6, .8); },
  mainz(k) { const c = new THREE.Color(.72, .36, .3); k.cathedral(0, 0, 1.0, false, c); k.cyl('stone', .1, .12, .9 + SINK, .35, -SINK, .45, 8, c); k.cone('roof', .12, .3, .35, .9, .45, 8, c); k.oldTown(7, .85); },
  regensburg(k) { k.cathedral(0, 0, 1.05, true, new THREE.Color(.68, .66, .62)); k.oldTown(9, .9); },
  freiburg(k) { const c = new THREE.Color(.62, .38, .3); k.box('stone', .3, .45 + SINK, .8, 0, -SINK, .3, 0, c); k.spireTower(0, -.15, .22, .9, 1.1, c); k.oldTown(8, .85); },
  passau(k) { const c = new THREE.Color(.92, .9, .85); k.box('stone', .36, .45 + SINK, .8, 0, -SINK, .3, 0, c); for (const x of [-.14, .14]) { k.box('stone', .14, .8 + SINK, .14, x, -SINK, -.1, 0, c); k.onion(x, .8, -.1, .07, COPPER); } k.onion(0, .5, .45, .1, COPPER); k.oldTown(7, .8); },
  goettingen(k) { k.spireTower(-.15, 0, .15, .8, .45, new THREE.Color(.65, .5, .4)); k.spireTower(.1, 0, .15, .8, .45, new THREE.Color(.65, .5, .4)); k.oldTown(9, .85); },
  saarbruecken(k) { const c = new THREE.Color(.92, .88, .8); k.box('stone', .4, .3 + SINK, .55, 0, -SINK, .1, 0, c); k.box('stone', .14, .85 + SINK, .14, 0, -SINK, -.25, 0, c); k.cone('accent', .1, .35, 0, .85, -.25, 4, COPPER); k.cluster(6, .9, .2, .5); },
  osnabrueck(k) { k.cathedral(0, 0, .9, true, new THREE.Color(.6, .55, .5)); k.oldTown(8, .85); },
  chemnitz(k) { k.block(.18, 1.0, .5, 0, 0, .2); k.block(.18, .8, .45, .35, .1, .2); k.cluster(8, .95, .2, .6); },
  cottbus(k) { k.spireTower(0, 0, .18, .8, .5, BRICK.clone()); k.cluster(6, .85, .15, .45); },
  ffo(k) { k.cathedral(0, 0, .8, false, BRICK.clone()); k.cluster(6, .85, .15, .5); },
};

// ---------- placement: the skyline sits on the side with the fewest connections, preferring north ----------
function placement(c, dirs, nearest) {
  let best = -1e9, ang = -Math.PI / 2;
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2; const dx = Math.cos(a), dz = Math.sin(a);
    let minD = Math.PI; for (const d of dirs) { let x = Math.abs(Math.atan2(Math.sin(a - d), Math.cos(a - d))); minD = Math.min(minD, x); }
    const score = minD * 1.0 + (-dz) * .9 - (dz > .3 ? 2 : 0);
    if (score > best) { best = score; ang = a; }
  }
  const S = 1.5; const scale = S * Math.max(.5, Math.min(1, (nearest - 1.6) / 4.6)); const dist = 1.25 + 1.0 * scale;
  return { ox: Math.cos(ang) * dist * scale, oz: Math.sin(ang) * dist * scale, scale };
}

// ---------- shader patching ----------
function patch(mat, kind, U) {
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute float aCity; attribute vec3 aLocal; attribute float aH;
uniform sampler2D uCity; varying float vH; varying float vCity; varying vec2 vWinUv;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vec4 cp=texelFetch(uCity, ivec2(int(aCity),0), 0);
vec3 base=position-aLocal; float sc=1.+cp.b*.12;
transformed = base + vec3(aLocal.x*sc, (aLocal.y+${SINK.toFixed(2)})*cp.r-${SINK.toFixed(2)}, aLocal.z*sc);
vH=aH; vCity=aCity; vWinUv=${kind === 'bld' ? 'uv' : 'vec2(0.)'};`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D uCity; uniform float uT; uniform float uNight; varying float vH; varying float vCity; varying vec2 vWinUv;
float hh(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*45758.5);}`)
      .replace('#include <emissivemap_fragment>', `
vec4 cp=texelFetch(uCity, ivec2(int(vCity),0), 0);
vec4 own=texelFetch(uCity, ivec2(int(vCity),1), 0);
totalEmissiveRadiance = vec3(0.);
float lit = 1.0 - smoothstep(cp.g-.08, cp.g, vH);
${kind === 'bld' ? `
vec4 em=texture2D(emissiveMap, vWinUv);
vec2 cell=floor(vWinUv*${CELLS}.0);
float flick=step(.985, hh(cell+floor(uT*.6+hh(cell)*7.)));  // occasional window switching
float base=.22*uNight;
totalEmissiveRadiance += em.rgb*(base + lit*(.75+cp.a*1.4))*(1.-flick*.8);
totalEmissiveRadiance += own.rgb*own.a*.08*(1.-vH*.5);` : kind === 'stone' ? `
totalEmissiveRadiance += vec3(1.,.8,.55)*(1.-vH)*(.01+lit*(.05+cp.a*.25))*uNight;
totalEmissiveRadiance += own.rgb*own.a*.06;` : kind === 'glass' ? `
totalEmissiveRadiance += vec3(1.,.85,.6)*lit*cp.a*.15*uNight;` : kind === 'accent' ? `
totalEmissiveRadiance += diffuseColor.rgb*lit*.12*uNight;` : `
totalEmissiveRadiance += diffuseColor.rgb*lit*.08*uNight;`}
`);
  };
  mat.customProgramCacheKey = () => 'sky-' + kind;
}

export function createSkylines(cityList, ADJ, renderer) {
  const N = cityList.length, data = new Float32Array(64 * 2 * 4);
  const tex = new THREE.DataTexture(data, 64, 2, THREE.RGBAFormat, THREE.FloatType); tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.needsUpdate = true;
  const U = { uCity: { value: tex }, uT: { value: 0 }, uNight: { value: 1 } };
  const W = windowTextures();
  // einheitlicher Zinn-Look: dunkles Schiefergrau, Gold nur für Kuppeln und Spitzen
  const MATS = {
    bld: new THREE.MeshStandardMaterial({ map: W.map, emissiveMap: W.em, emissive: 0xffffff, color: 0xffffff, roughness: .62, metalness: .45 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x55616b, roughness: .58, metalness: .5 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x5d6b77, roughness: .3, metalness: .7 }),
    accent: new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: .32, metalness: .9 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x66727c, roughness: .45, metalness: .75 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x48535c, roughness: .6, metalness: .45 }),
  };
  for (const k in MATS) patch(MATS[k], k, U);
  const buckets = {}; for (const k in MATS) buckets[k] = [];
  const beacons = [], lights = [], info = [];
  cityList.forEach((c, idx) => {
    const r = rng(c.id); const k = new Kit(r);
    (LANDMARK[c.id] || (kk => kk.cluster(10, .95, .2, .8)))(k);
    const dirs = ADJ[c.id].map(e => { const o = e.a === c.id ? e.b : e.a; const C = cityList.find(q => q.id === o); return Math.atan2(C.z - c.z, C.x - c.x); });
    let nearest = 99; cityList.forEach(q => { if (q !== c) nearest = Math.min(nearest, Math.hypot(q.x - c.x, q.z - c.z)); });
    const pl = placement(c, dirs, nearest);
    let maxH = .1; k.parts.forEach(p => { p.g.computeBoundingBox(); maxH = Math.max(maxH, p.g.boundingBox.max.y); });
    for (const p of k.parts) {
      const g = p.g; g.scale(pl.scale, pl.scale, pl.scale); g.translate(pl.ox, 0, pl.oz);
      const n = g.attributes.position.count, loc = new Float32Array(n * 3), cityA = new Float32Array(n), hA = new Float32Array(n);
      for (let i = 0; i < n; i++) { loc[i * 3] = g.attributes.position.getX(i); loc[i * 3 + 1] = g.attributes.position.getY(i); loc[i * 3 + 2] = g.attributes.position.getZ(i); cityA[i] = idx; hA[i] = Math.max(0, loc[i * 3 + 1] / (pl.scale * maxH)); }
      g.setAttribute('aLocal', new THREE.BufferAttribute(loc, 3)); g.setAttribute('aCity', new THREE.BufferAttribute(cityA, 1)); g.setAttribute('aH', new THREE.BufferAttribute(hA, 1));
      g.translate(c.x, c.y, c.z); if (!g.attributes.normal) g.computeVertexNormals();
      buckets[p.mat].push(g);
    }
    const toW = v => new THREE.Vector3(c.x + pl.ox + v.x * pl.scale, c.y + v.y * pl.scale, c.z + pl.oz + v.z * pl.scale);
    (k.beacons || []).forEach(v => beacons.push({ p: toW(v), idx }));
    (k.lights || []).forEach(v => lights.push({ p: toW(v), idx }));
    info.push({ id: c.id, idx, top: toW(new THREE.Vector3(0, maxH, 0)), centre: toW(new THREE.Vector3(0, 0, 0)), h: maxH * pl.scale });
  });
  const group = new THREE.Group();
  for (const k in buckets) if (buckets[k].length) { const m = new THREE.Mesh(mergeGeometries(buckets[k]), MATS[k]); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; group.add(m); }
  // aircraft warning lights
  const bg = new THREE.BufferGeometry(); const bp = new Float32Array(beacons.length * 3), bc = new Float32Array(beacons.length), bph = new Float32Array(beacons.length);
  beacons.forEach((b, i) => { bp.set([b.p.x, b.p.y, b.p.z], i * 3); bc[i] = b.idx; bph[i] = Math.random() * 6; });
  bg.setAttribute('position', new THREE.BufferAttribute(bp, 3)); bg.setAttribute('aCity', new THREE.BufferAttribute(bc, 1)); bg.setAttribute('aPh', new THREE.BufferAttribute(bph, 1));
  const bm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: U,
    vertexShader: `attribute float aCity; attribute float aPh; uniform sampler2D uCity; uniform float uT; varying float vA;
      void main(){ vec4 cp=texelFetch(uCity, ivec2(int(aCity),0),0); vA=step(.97,cp.r)*pow(max(0.,sin(uT*2.2+aPh)),12.);
      vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=(170./-mv.z)*(.5+vA); }`,
    fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d)*vA; gl_FragColor=vec4(vec3(2.6,.25,.15)*a,a); }` });
  const bpts = new THREE.Points(bg, bm); bpts.frustumCulled = false; group.add(bpts);
  // lighthouse beams (rotating)
  const beams = lights.map(l => {
    const g = new THREE.ConeGeometry(.3, 3, 20, 1, true); g.translate(0, -1.5, 0); g.rotateZ(Math.PI / 2);
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uA: { value: 0 } },
      vertexShader: `varying float vX; void main(){ vX=-position.x/3.; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform float uA; varying float vX; void main(){ float a=(1.-vX)*(1.-vX)*.13*uA; gl_FragColor=vec4(vec3(1.,.92,.7)*a,a); }` });
    const o = new THREE.Mesh(g, m); o.position.copy(l.p); group.add(o); return { o, m, idx: l.idx };
  });
  const state = cityList.map(() => ({ rise: 0, light: 0, pulse: 0, boost: 0, own: new THREE.Color(0, 0, 0), ownA: 0 }));
  function sync() { state.forEach((s, i) => { data.set([s.rise, s.light, s.pulse, s.boost], i * 4); data.set([s.own.r, s.own.g, s.own.b, s.ownA], (64 + i) * 4); }); tex.needsUpdate = true; }
  sync();
  return {
    group, state, info, U, sync,
    update(t) { U.uT.value = t; beams.forEach((b, i) => { b.o.rotation.y = t * 1.4 + i * 2; b.m.uniforms.uA.value = state[b.idx].rise > .97 ? 1 : 0; }); sync(); }
  };
}
