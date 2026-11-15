// 3D-Rohstoffmarkt als eigenes Spielbrett neben der Karte + Kraftwerksplättchen mit Lager.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const RES = {
  coal: { de: 'Kohle', en: 'Coal', col: '#6b4a2e', prices: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8] },
  oil: { de: 'Öl', en: 'Oil', col: '#1c1d22', prices: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8] },
  garbage: { de: 'Müll', en: 'Garbage', col: '#e3be35', prices: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8] },
  uranium: { de: 'Uran', en: 'Uranium', col: '#e2372c', prices: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16] },
};
export const ORDER = ['coal', 'oil', 'garbage', 'uranium'];

const pieceGeo = {
  coal: new RoundedBoxGeometry(.5, .5, .5, 2, .08),
  oil: (() => { const g = new THREE.CylinderGeometry(.24, .24, .58, 18); return g; })(),
  garbage: new RoundedBoxGeometry(.5, .5, .5, 2, .12),
  uranium: (() => { const g = new THREE.CapsuleGeometry(.2, .26, 6, 14); return g; })(),
};
Object.values(pieceGeo).forEach(g => { g.translate(0, .29, 0); g.scale(1.3, 1.3, 1.3); });
const pieceMat = {
  coal: new THREE.MeshPhysicalMaterial({ color: 0x5a3c24, roughness: .6, clearcoat: .6, clearcoatRoughness: .3 }),
  oil: new THREE.MeshPhysicalMaterial({ color: 0x15161a, roughness: .25, metalness: .3, clearcoat: 1, clearcoatRoughness: .1 }),
  garbage: new THREE.MeshPhysicalMaterial({ color: 0xe0b92e, roughness: .45, clearcoat: .7 }),
  uranium: new THREE.MeshPhysicalMaterial({ color: 0xe0352b, roughness: .3, clearcoat: 1, emissive: 0xff3020, emissiveIntensity: .6 }),
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
  const D = 3.2; const sg = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: .12, bevelSize: .12, bevelSegments: 2 });
  sg.rotateX(-Math.PI / 2); sg.translate(0, -D, 0);
  // top texture: engraved lanes + prices
  const TS = 40, cw = Math.round(W * TS), ch = Math.round(L * TS); const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const x = cv.getContext('2d');
  const tx = v => (v + W / 2) * TS, tz = v => (v + L / 2) * TS;
  const grd = x.createLinearGradient(0, 0, 0, ch); grd.addColorStop(0, '#1d2830'); grd.addColorStop(1, '#141c22'); x.fillStyle = grd; x.fillRect(0, 0, cw, ch);
  for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * .025})`; x.fillRect(Math.random() * cw, Math.random() * ch, 2, 2); }
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
  const slab = new THREE.Mesh(sg, [new THREE.MeshStandardMaterial({ map: top, roughness: .7, metalness: .2 }), new THREE.MeshStandardMaterial({ color: 0x0f1519, roughness: .6, metalness: .4 })]);
  slab.receiveShadow = true; slab.castShadow = true; group.add(slab);
  // gold rim
  const rimPts = shape.getPoints(24).map(p => new THREE.Vector3(p.x, .03, -p.y));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts, true), 200, .05, 4, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf2b33d).multiplyScalar(.9) })));

  // ---- power plant tiles ----
  const PLANTS = [];
  function plantTile(num, res, cap, powers, px) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 320; const t = c.getContext('2d');
    const col = res ? RES[res].col : '#58b86a'; t.fillStyle = '#e9e2cf'; t.fillRect(0, 0, 256, 320); t.fillStyle = col; t.fillRect(0, 0, 256, 92);
    t.fillStyle = res === 'garbage' ? '#1d1405' : '#fff'; t.font = '800 64px Orbitron, sans-serif'; t.textAlign = 'center'; t.textBaseline = 'middle'; t.fillText(num, 128, 50);
    t.fillStyle = '#1d1405'; t.font = '700 30px Barlow, sans-serif'; t.fillText(res ? `${cap / 2} × ${de ? RES[res].de : RES[res].en}` : (de ? 'Öko' : 'Eco'), 128, 140);
    t.font = '800 54px Orbitron, sans-serif'; t.fillText('→ ' + powers, 128, 205);
    t.strokeStyle = 'rgba(0,0,0,.25)'; t.lineWidth = 3; t.strokeRect(14, 238, 228, 68);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const g = new RoundedBoxGeometry(3.6, .22, 4.2, 2, .08); g.translate(0, .11, 0);
    const side = new THREE.MeshStandardMaterial({ color: 0xcfc6ad, roughness: .6 });
    const topM = new THREE.MeshStandardMaterial({ map: tex, roughness: .55 });
    // BoxGeometry-like groups: RoundedBox has no groups → use separate top plane
    const m = new THREE.Mesh(g, side); const pl = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.0), topM); pl.rotation.x = -Math.PI / 2; pl.position.y = .225; m.add(pl);
    m.position.set(px, 0, zTrack0 + TRACK + 1.9 + 2.3); m.castShadow = true; m.receiveShadow = true; group.add(m);
    const store = []; for (let i = 0; i < cap; i++) store.push(new THREE.Vector3(px - .55 + (i % 2) * 1.1 - 0, .22, m.position.z + 1.55 + Math.floor(i / 2) * -.0));
    const P = { num, res, cap, powers, mesh: m, store, pieces: [] }; PLANTS.push(P); return P;
  }
  plantTile(10, 'coal', 4, 2, -2.1);
  plantTile(16, 'oil', 4, 3, 2.1);
  PLANTS.forEach(P => { P.store = [0, 1, 2, 3].map(i => new THREE.Vector3(P.mesh.position.x - 1.05 + i * .7, .22, P.mesh.position.z + 1.45)); });

  // ---- pieces ----
  const pieces = {}; ORDER.forEach(k => pieces[k] = []);
  const count = { coal: 24, oil: 18, garbage: 6, uranium: 2 };
  function makePiece(k) { const m = new THREE.Mesh(pieceGeo[k], pieceMat[k].clone()); m.castShadow = true; m.receiveShadow = true; group.add(m); return m; }
  ORDER.forEach(k => { const S = SLOTS[k]; for (let i = S.length - count[k]; i < S.length; i++) { const m = makePiece(k); m.position.copy(S[i]); m.rotation.y = (Math.random() - .5) * .4; pieces[k].push({ m, slot: i }); } });
  const cheapest = (k, n) => pieces[k].slice().sort((a, b) => a.slot - b.slot).slice(0, n);
  const price = (k, n) => cheapest(k, n).reduce((s, p) => s + RES[k].prices[p.slot], 0);
  const world = v => v.clone().add(group.position);
  return { group, SLOTS, PLANTS, pieces, cheapest, price, count: k => pieces[k].length, makePiece, world, bounds: { minX: x0 - W / 2, maxX: x0 + W / 2, minZ: z0 - L / 2, maxZ: z0 + L / 2 }, W, L };
}
