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

export const MARKET_W = 2.7 * 4 + 1.6;
export function createMarket({ x0, z0, de = true }) {
  const group = new THREE.Group(); group.position.set(x0, 0, z0);
  // ---- layout (local): lanes along +z (cheap at the far/north end → expensive near the viewer) ----
  const LANE = 2.7, W = LANE * 4 + 1.6, TRACK = 22, HEAD = 3.0, PAD = 7.4, L = HEAD + TRACK + 1.2 + PAD + 1.0;
  const zTrack0 = -L / 2 + HEAD, laneX = i => -W / 2 + .8 + LANE * (i + .5);
  // slots: per resource array of local positions, index 0 = cheapest
  const SLOTS = {};
  ORDER.forEach((k, li) => {
    const n = RES[k].prices.length; SLOTS[k] = [];
    if (k === 'uranium') for (let i = 0; i < n; i++) SLOTS[k].push(new THREE.Vector3(laneX(li), 0, zTrack0 + (i + .5) * TRACK / n));
    else for (let i = 0; i < n; i++) { const cell = Math.floor(i / 3), j = i % 3; SLOTS[k].push(new THREE.Vector3(laneX(li) - .25 + (j - 1) * .74, 0, zTrack0 + (cell + .5) * TRACK / 8)); }
  });
  // ---- slab ----
  const shape = new THREE.Shape(); const r = 1.2, hw = W / 2, hl = L / 2;
  shape.moveTo(-hw + r, -hl); shape.lineTo(hw - r, -hl); shape.quadraticCurveTo(hw, -hl, hw, -hl + r); shape.lineTo(hw, hl - r); shape.quadraticCurveTo(hw, hl, hw - r, hl); shape.lineTo(-hw + r, hl); shape.quadraticCurveTo(-hw, hl, -hw, hl - r); shape.lineTo(-hw, -hl + r); shape.quadraticCurveTo(-hw, -hl, -hw + r, -hl);
  const D = .45; const sg = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2 });
  sg.rotateX(-Math.PI / 2); sg.translate(0, -D, 0);
  // top texture: engraved lanes + prices
  const TS = 40, cw = Math.round(W * TS), ch = Math.round(L * TS); const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const x = cv.getContext('2d');
  const tx = v => (v + W / 2) * TS, tz = v => (v + L / 2) * TS;
  const grd = x.createLinearGradient(0, 0, 0, ch); grd.addColorStop(0, '#1e2a33'); grd.addColorStop(1, '#18222a'); x.fillStyle = grd; x.fillRect(0, 0, cw, ch);
  for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * .03})`; x.fillRect(Math.random() * cw, Math.random() * ch, 1.5, 1.5); }
  x.strokeStyle = 'rgba(242,179,61,.5)'; x.lineWidth = 2; roundRect(x, 12, 12, cw - 24, ch - 24, 30); x.stroke(); x.strokeStyle = 'rgba(242,179,61,.18)'; x.lineWidth = 1; roundRect(x, 20, 20, cw - 40, ch - 40, 24); x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#f2b33d'; x.font = `800 ${TS * .62}px Orbitron, sans-serif`; x.fillText(de ? 'ROHSTOFFMARKT' : 'RESOURCE MARKET', cw / 2, tz(-L / 2 + 1.1));
  ORDER.forEach((k, li) => {
    const R = RES[k]; x.fillStyle = R.col === '#1c1d22' ? '#8d96a0' : R.col; x.font = `700 ${TS * .42}px Barlow, sans-serif`; x.fillText((de ? R.de : R.en).toUpperCase(), tx(laneX(li)), tz(zTrack0 - .9));
    x.strokeStyle = 'rgba(242,179,61,.18)'; x.lineWidth = 2; roundRect(x, tx(laneX(li) - LANE / 2 + .12), tz(zTrack0 - .2), (LANE - .24) * TS, (TRACK + .4) * TS, 14); x.stroke();
    const cells = k === 'uranium' ? R.prices.length : 8;
    for (let c = 0; c < cells; c++) {
      const zc = zTrack0 + (c + .5) * TRACK / cells, price = k === 'uranium' ? R.prices[c] : c + 1;
      x.fillStyle = 'rgba(0,0,0,.28)'; roundRect(x, tx(laneX(li) - LANE / 2 + .3), tz(zc - TRACK / cells / 2 + .12), (LANE - .6) * TS, (TRACK / cells - .24) * TS, 10); x.fill();
      x.fillStyle = 'rgba(227,234,238,.62)'; x.font = `800 ${TS * (k === 'uranium' ? .44 : .56)}px Orbitron, sans-serif`; x.fillText(price, tx(laneX(li) + LANE / 2 - .32), tz(zc));
    }
  });
  x.fillStyle = 'rgba(242,179,61,.75)'; x.font = `700 ${TS * .42}px Barlow, sans-serif`; x.fillText(de ? 'DEINE KRAFTWERKE' : 'YOUR POWER PLANTS', cw / 2, tz(zTrack0 + TRACK + 1.0));
  const top = new THREE.CanvasTexture(cv); top.colorSpace = THREE.SRGBColorSpace; top.anisotropy = 8;
  const pos = sg.attributes.position, uv = sg.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + W / 2) / W, 1 - (pos.getZ(i) + L / 2) / L);
  const slab = new THREE.Mesh(sg, [new THREE.MeshStandardMaterial({ map: top, roughness: .75, metalness: .05 }), new THREE.MeshStandardMaterial({ color: 0x24303a, roughness: .55, metalness: .3 })]);
  slab.receiveShadow = true; slab.castShadow = true; group.add(slab);
  // gold rim
  

  // ---- power plant tiles ----
  const PLANTS = [];
  function plantTile(num, px) {
    const [res, need, pow] = PLANTDATA[num]; const m = makeCard(num, de); m.scale.setScalar(.9);
    m.position.set(px, .04, zTrack0 + TRACK + 1.9 + 1.6); group.add(m);
    const cap = need * 2, P = { num, res, cap, powers: pow, mesh: m, store: [], pieces: [] };
    P.store = Array.from({ length: cap }, (_, i) => new THREE.Vector3(px - (cap - 1) * .33 + i * .66, .02, m.position.z + CARD_D * .45 + .55));
    PLANTS.push(P); return P;
  }
  const PADX = [-4.1, 0, 4.1];
  plantTile(10, PADX[0]); plantTile(16, PADX[1]);
  const addPlant = num => plantTile(num, PADX[PLANTS.length]);
  // ---- pieces ----
  const pieces = {}; ORDER.forEach(k => pieces[k] = []);
  const count = { coal: 24, oil: 18, garbage: 6, uranium: 2 };
  function makePiece(k) { const m = new THREE.Mesh(pieceGeo[k], pieceMat[k].clone()); m.castShadow = true; m.receiveShadow = true; group.add(m); return m; }
  ORDER.forEach(k => { const S = SLOTS[k]; for (let i = S.length - count[k]; i < S.length; i++) { const m = makePiece(k); m.position.copy(S[i]); m.rotation.y = (Math.random() - .5) * .4; pieces[k].push({ m, slot: i }); } });
  const cheapest = (k, n) => pieces[k].slice().sort((a, b) => a.slot - b.slot).slice(0, n);
  const price = (k, n) => cheapest(k, n).reduce((s, p) => s + RES[k].prices[p.slot], 0);
  const world = v => v.clone().add(group.position);
  return { group, SLOTS, PLANTS, addPlant, pieces, cheapest, price, count: k => pieces[k].length, makePiece, world, bounds: { minX: x0 - W / 2, maxX: x0 + W / 2, minZ: z0 - L / 2, maxZ: z0 + L / 2 }, W, L };
}
