// 3D-Rohstoffmarkt als eigenes Spielbrett neben der Karte + Kraftwerksplättchen mit Lager.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { PLANTDATA, makeCard, CARD_D } from './plants.js';

export const RES = {
  coal: { de: 'Kohle', en: 'Coal', col: '#6b4a2e', prices: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8] },
  oil: { de: 'Öl', en: 'Oil', col: '#1c1d22', prices: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8] },
  garbage: { de: 'Müll', en: 'Garbage', col: '#e3be35', prices: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8] },
  uranium: { de: 'Uran', en: 'Uranium', col: '#e2372c', prices: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16] },
};
export const ORDER = ['coal', 'oil', 'garbage', 'uranium'];

// ---- authentische Rohstoff-Figuren ----
function noiseDisplace(g, amt, seed = 1) {
  const p = g.attributes.position, map = new Map();
  for (let i = 0; i < p.count; i++) { const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; let d = map.get(key); if (d === undefined) { d = (Math.sin(i * 12.9898 * seed + p.getX(i) * 78.2) * 43758.5453) % 1; map.set(key, d); } const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)); v.multiplyScalar(1 + d * amt); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
const L2 = pts => pts.map(([a, b]) => new THREE.Vector2(a, b));
function drumProfile(r, h) { // 200-l-Fass mit Sicken
  const pts = [[0, 0], [r * .92, 0], [r, .02 * h / .55], [r, .07], [r * .955, .085]];
  for (const y of [.33, .66]) { pts.push([r * .955, h * y - .03], [r, h * y - .012], [r, h * y + .012], [r * .955, h * y + .03]); }
  pts.push([r * .955, h - .085], [r, h - .07], [r, h], [r * .86, h], [r * .86, h - .02], [0, h - .02]);
  return L2(pts);
}
function trefoilTex(bg, fg) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 256, 128);
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 34, 256, 4); x.fillRect(0, 90, 256, 4);
  for (const cx of [64, 192]) { const cy = 64; x.fillStyle = fg; x.beginPath(); x.arc(cx, cy, 24, 0, 7); x.fill(); x.fillStyle = '#1a1a1a';
    for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * 2 * Math.PI / 3; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, 21, a - .52, a + .52); x.closePath(); x.fill(); }
    x.fillStyle = fg; x.beginPath(); x.arc(cx, cy, 6, 0, 7); x.fill(); x.fillStyle = '#1a1a1a'; x.beginPath(); x.arc(cx, cy, 4, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const pieceGeo = {
  coal: (() => { const g = noiseDisplace(new THREE.IcosahedronGeometry(.27, 1).toNonIndexed(), .45, 3); g.scale(1.1, .8, 1); g.computeBoundingBox(); g.translate(0, -g.boundingBox.min.y, 0); return g; })(),
  oil: new THREE.LatheGeometry(drumProfile(.22, .58), 28),
  garbage: (() => { const g = new THREE.LatheGeometry(L2([[0, 0], [.16, .005], [.25, .07], [.29, .2], [.27, .32], [.2, .42], [.1, .48], [.055, .51], [.05, .54], [.085, .575], [.1, .61], [.06, .64], [0, .64]]), 22); return noiseDisplace(g.toNonIndexed(), .09, 7); })(),
  uranium: new THREE.LatheGeometry(drumProfile(.19, .46), 28),
};
Object.entries(pieceGeo).forEach(([k, g]) => g.scale(...Array(3).fill(k === 'coal' ? 1.15 : 1.25)));
const pieceMat = {
  coal: new THREE.MeshPhysicalMaterial({ color: 0x1b1b1d, roughness: .42, metalness: .25, clearcoat: .5, clearcoatRoughness: .25, flatShading: true }),
  oil: new THREE.MeshPhysicalMaterial({ color: 0x23282f, roughness: .3, metalness: .55, clearcoat: 1, clearcoatRoughness: .12 }),
  garbage: new THREE.MeshPhysicalMaterial({ color: 0xf0c83a, roughness: .28, metalness: 0, clearcoat: 1, clearcoatRoughness: .08, sheen: .5 }),
  uranium: new THREE.MeshPhysicalMaterial({ map: trefoilTex('#c8302a', '#f4c430'), roughness: .35, metalness: .3, clearcoat: .8, emissive: 0x6a0d08, emissiveIntensity: .35 }),
};

function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

export const MARKET_W = 2.6 * 4 + 1.6;
export function createMarket({ x0, z0, de = true, wide = false, occ = null, myPlants = null }) {
  const group = new THREE.Group(); group.position.set(x0, 0, z0);
  // ---- layout ----
  // tall: Spuren entlang z (Hochformat).  wide: Spuren entlang x, Preise steigen nach rechts (Querformat, wie im Brettspiel).
  const LANE = 2.6, TRACK = wide ? 24 : 22, HEAD = 3.0;
  let W, L, laneC, cellC, padPos, storeOff, titleAt, padTitleAt;
  if (!wide) {
    const PAD = 7.4; W = LANE * 4 + 1.6; L = HEAD + TRACK + 1.2 + PAD + 1.0;
    const z0t = -L / 2 + HEAD; laneC = li => -W / 2 + .8 + LANE * (li + .5);
    cellC = (li, t) => new THREE.Vector3(laneC(li), 0, z0t + t * TRACK); // t: 0..1 along the track
    padPos = i => new THREE.Vector3([-4.1, 0, 4.1][i], .04, z0t + TRACK + 3.5);
    storeOff = (i, cap) => new THREE.Vector3(-(cap - 1) * .33 + i * .66, -.02, CARD_D * .45 + .55);
    titleAt = [0, -L / 2 + 1.1]; padTitleAt = [0, z0t + TRACK + 1.0];
  } else {
    const LABEL = 3.2, PADW = 7.0; L = 2.4 + LANE * 4 + .8; W = LABEL + TRACK + 1.0 + PADW + .6;
    const x0t = -W / 2 + LABEL; laneC = li => -L / 2 + 2.4 + LANE * (li + .5);
    cellC = (li, t) => new THREE.Vector3(x0t + t * TRACK, 0, laneC(li));
    padPos = i => new THREE.Vector3(W / 2 - .6 - PADW + 2.1, .04, -L / 2 + 2.4 + 1.6 + i * 3.3);
    storeOff = (i, cap) => new THREE.Vector3(2.55 + (i % 2) * .66, -.02, -.9 + Math.floor(i / 2) * .62);
    titleAt = [(-W / 2 + LABEL + TRACK / 2), -L / 2 + 1.2]; padTitleAt = [W / 2 - .6 - PADW / 2, -L / 2 + 1.2];
  }
  // slots: index 0 = cheapest
  const SLOTS = {};
  ORDER.forEach((k, li) => {
    const n = RES[k].prices.length; SLOTS[k] = [];
    if (k === 'uranium') for (let i = 0; i < n; i++) SLOTS[k].push(cellC(li, (i + .5) / n));
    else for (let i = 0; i < n; i++) { const cell = Math.floor(i / 3), j = i % 3, c = cellC(li, (cell + .5) / 8); if (wide) { c.x += (j - 1) * .78 - .2; } else { c.x += -.25 + (j - 1) * .74; } SLOTS[k].push(c); }
  });
  // ---- slab ----
  const shape = new THREE.Shape(); const r = 1.2, hw = W / 2, hl = L / 2;
  shape.moveTo(-hw + r, -hl); shape.lineTo(hw - r, -hl); shape.quadraticCurveTo(hw, -hl, hw, -hl + r); shape.lineTo(hw, hl - r); shape.quadraticCurveTo(hw, hl, hw - r, hl); shape.lineTo(-hw + r, hl); shape.quadraticCurveTo(-hw, hl, -hw, hl - r); shape.lineTo(-hw, -hl + r); shape.quadraticCurveTo(-hw, -hl, -hw + r, -hl);
  const D = .45; const sg = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2 });
  sg.rotateX(-Math.PI / 2); sg.translate(0, -D, 0);
  const TS = 40, cw = Math.round(W * TS), ch = Math.round(L * TS); const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const x = cv.getContext('2d');
  const tx = v => (v + W / 2) * TS, tz = v => (v + L / 2) * TS;
  const grd = x.createLinearGradient(0, 0, 0, ch); grd.addColorStop(0, '#1e2a33'); grd.addColorStop(1, '#18222a'); x.fillStyle = grd; x.fillRect(0, 0, cw, ch);
  for (let i = 0; i < cw * ch / 120; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * .03})`; x.fillRect(Math.random() * cw, Math.random() * ch, 1.5, 1.5); }
  x.strokeStyle = 'rgba(242,179,61,.5)'; x.lineWidth = 2; roundRect(x, 12, 12, cw - 24, ch - 24, 30); x.stroke(); x.strokeStyle = 'rgba(242,179,61,.18)'; x.lineWidth = 1; roundRect(x, 20, 20, cw - 40, ch - 40, 24); x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#f2b33d'; x.font = `800 ${TS * .62}px Orbitron, sans-serif`; x.fillText(de ? 'ROHSTOFFMARKT' : 'RESOURCE MARKET', tx(titleAt[0]), tz(titleAt[1]));
  ORDER.forEach((k, li) => {
    const R = RES[k], col = R.col === '#1c1d22' ? '#8d96a0' : R.col, cells = k === 'uranium' ? R.prices.length : 8, cellLen = TRACK / cells;
    x.fillStyle = col; x.font = `700 ${TS * .42}px Barlow, sans-serif`;
    const a = cellC(li, 0), b = cellC(li, 1);
    if (!wide) x.fillText((de ? R.de : R.en).toUpperCase(), tx(a.x), tz(a.z - .9)); else { x.textAlign = 'right'; x.fillText((de ? R.de : R.en).toUpperCase(), tx(a.x - .35), tz(a.z)); x.textAlign = 'center'; }
    x.strokeStyle = 'rgba(242,179,61,.18)'; x.lineWidth = 2;
    if (!wide) roundRect(x, tx(a.x - LANE / 2 + .12), tz(a.z - .2), (LANE - .24) * TS, (TRACK + .4) * TS, 14); else roundRect(x, tx(a.x - .2), tz(a.z - LANE / 2 + .12), (TRACK + .4) * TS, (LANE - .24) * TS, 14);
    x.stroke();
    for (let c = 0; c < cells; c++) {
      const m = cellC(li, (c + .5) / cells), price = k === 'uranium' ? R.prices[c] : c + 1;
      x.fillStyle = 'rgba(0,0,0,.28)';
      if (!wide) roundRect(x, tx(m.x - LANE / 2 + .3), tz(m.z - cellLen / 2 + .12), (LANE - .6) * TS, (cellLen - .24) * TS, 10); else roundRect(x, tx(m.x - cellLen / 2 + .12), tz(m.z - LANE / 2 + .3), (cellLen - .24) * TS, (LANE - .6) * TS, 10);
      x.fill();
      x.fillStyle = 'rgba(227,234,238,.62)'; x.font = `800 ${TS * (k === 'uranium' ? .44 : .56)}px Orbitron, sans-serif`;
      if (!wide) x.fillText(price, tx(m.x + LANE / 2 - .32), tz(m.z)); else x.fillText(price, tx(m.x + (k === 'uranium' ? 0 : cellLen / 2 - .45)), tz(m.z + (k === 'uranium' ? LANE / 2 - .62 : LANE / 2 - .55)));
    }
  });
  x.fillStyle = 'rgba(242,179,61,.75)'; x.font = `700 ${TS * .42}px Barlow, sans-serif`; x.fillText(de ? 'DEINE KRAFTWERKE' : 'YOUR POWER PLANTS', tx(padTitleAt[0]), tz(padTitleAt[1]));
  const top = new THREE.CanvasTexture(cv); top.colorSpace = THREE.SRGBColorSpace; top.anisotropy = 8;
  const pos = sg.attributes.position, uv = sg.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + W / 2) / W, 1 - (pos.getZ(i) + L / 2) / L);
  const slab = new THREE.Mesh(sg, [new THREE.MeshStandardMaterial({ map: top, roughness: .75, metalness: .05 }), new THREE.MeshStandardMaterial({ color: 0x24303a, roughness: .55, metalness: .3 })]);
  slab.receiveShadow = true; slab.castShadow = true; group.add(slab);
  // ---- pieces ----
  const pieces = {}; ORDER.forEach(k => pieces[k] = []);
  function makePiece(k) { const m = new THREE.Mesh(pieceGeo[k], pieceMat[k].clone()); m.castShadow = true; m.receiveShadow = true; group.add(m); return m; }
  // ---- power plant cards with storage ----
  const PLANTS = [];
  function plantTile(num, stock = 0) {
    const [res, need, pow] = PLANTDATA[num]; const m = makeCard(num, de); m.scale.setScalar(.9);
    m.position.copy(padPos(PLANTS.length)); group.add(m);
    const cap = need * 2, P = { num, res, cap, powers: pow, mesh: m, store: [], pieces: [] };
    P.store = Array.from({ length: cap }, (_, i) => m.position.clone().add(storeOff(i, cap)));
    for (let i = 0; i < stock; i++) { const pm = makePiece(res === 'hybrid' ? 'coal' : res); pm.position.copy(P.store[i]); pm.scale.setScalar(.9); P.pieces.push({ m: pm, slot: -1 }); }
    PLANTS.push(P); return P;
  }
  (myPlants || [{ num: 10 }, { num: 16 }]).forEach(p => plantTile(p.num, p.stock || 0));
  const addPlant = num => plantTile(num);
  const start = occ || { coal: [...Array(24).keys()], oil: [...Array(18).keys()].map(i => i + 6), garbage: [18, 19, 20, 21, 22, 23], uranium: [10, 11] };
  ORDER.forEach(k => start[k].forEach(i => { const m = makePiece(k); m.position.copy(SLOTS[k][i]); m.rotation.y = (Math.random() - .5) * .4; pieces[k].push({ m, slot: i }); }));
  const cheapest = (k, n) => pieces[k].slice().sort((a, b) => a.slot - b.slot).slice(0, n);
  const price = (k, n) => cheapest(k, n).reduce((s, p) => s + RES[k].prices[p.slot], 0);
  const world = v => v.clone().add(group.position);
  const snapshot = () => ({ occ: Object.fromEntries(ORDER.map(k => [k, pieces[k].map(p => p.slot)])), myPlants: PLANTS.map(P => ({ num: P.num, stock: P.pieces.length })) });
  return { group, SLOTS, PLANTS, addPlant, padPos, pieces, cheapest, price, count: k => pieces[k].length, makePiece, world, snapshot, wide, bounds: { minX: x0 - W / 2, maxX: x0 + W / 2, minZ: z0 - L / 2, maxZ: z0 + L / 2 }, W, L };
}
