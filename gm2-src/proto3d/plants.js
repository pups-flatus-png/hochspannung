// Kraftwerksmarkt als flaches Spielbrett links neben der Karte; Karten mit gemeinsamem Design.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Basisspiel-Kraftwerke: [Rohstoff, Bedarf, versorgte Städte]
export const PLANTDATA = { 3: ['oil', 2, 1], 4: ['coal', 2, 1], 5: ['hybrid', 2, 1], 6: ['garbage', 1, 1], 7: ['oil', 3, 2], 8: ['coal', 3, 2], 9: ['oil', 1, 1], 10: ['coal', 2, 2], 11: ['uranium', 1, 2], 12: ['hybrid', 2, 2], 13: ['eco', 0, 1], 14: ['garbage', 2, 2], 15: ['coal', 2, 3], 16: ['oil', 2, 3], 17: ['uranium', 1, 2], 18: ['eco', 0, 2], 19: ['garbage', 2, 3], 20: ['coal', 3, 5], 21: ['hybrid', 2, 4], 22: ['eco', 0, 2], 23: ['uranium', 1, 3], 24: ['garbage', 2, 4], 25: ['coal', 2, 5], 26: ['oil', 2, 5], 27: ['eco', 0, 3], 28: ['uranium', 1, 4], 29: ['hybrid', 1, 4], 30: ['garbage', 3, 6], 31: ['coal', 3, 6], 32: ['oil', 3, 6], 33: ['eco', 0, 4], 34: ['uranium', 1, 5], 35: ['oil', 1, 5], 36: ['coal', 3, 7], 37: ['eco', 0, 4], 38: ['garbage', 3, 7], 39: ['uranium', 1, 6], 40: ['oil', 2, 6], 42: ['coal', 2, 6], 44: ['eco', 0, 5], 46: ['hybrid', 3, 7], 50: ['fusion', 0, 6] };
const BAND = { coal: '#5b3b22', oil: '#20252c', garbage: '#d8b02c', uranium: '#b8261f', eco: '#3f8f4e', hybrid: '#4a3a2c', fusion: '#5a4fa0' };
const NAME = { de: { coal: 'Kohle', oil: 'Öl', garbage: 'Müll', uranium: 'Uran', eco: 'Öko', hybrid: 'Kohle/Öl', fusion: 'Fusion' }, en: { coal: 'Coal', oil: 'Oil', garbage: 'Garbage', uranium: 'Uranium', eco: 'Eco', hybrid: 'Coal/Oil', fusion: 'Fusion' } };

function icon(x, k, cx, cy, s) { // kleine Rohstoff-Piktogramme
  x.save(); x.translate(cx, cy); x.scale(s, s);
  if (k === 'coal') { x.fillStyle = '#1b1b1d'; x.beginPath(); x.moveTo(-10, 6); x.lineTo(-8, -6); x.lineTo(0, -10); x.lineTo(9, -5); x.lineTo(11, 5); x.lineTo(2, 10); x.closePath(); x.fill(); x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.moveTo(-6, -4); x.lineTo(0, -8); x.lineTo(3, -2); x.closePath(); x.fill(); }
  else if (k === 'oil' || k === 'uranium') { x.fillStyle = k === 'oil' ? '#23282f' : '#c8302a'; x.fillRect(-8, -11, 16, 22); x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect(-8, -4, 16, 1.6); x.fillRect(-8, 3, 16, 1.6); if (k === 'uranium') { x.fillStyle = '#f4c430'; x.beginPath(); x.arc(0, 0, 3.4, 0, 7); x.fill(); } }
  else if (k === 'garbage') { x.fillStyle = '#e9bf2f'; x.beginPath(); x.ellipse(0, 3, 10, 8, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(-3, -4); x.lineTo(3, -4); x.lineTo(4, -10); x.lineTo(-4, -10); x.closePath(); x.fill(); }
  else if (k === 'eco') { x.strokeStyle = '#2f7a3e'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(0, 12); x.lineTo(0, -2); x.stroke(); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * 2.094; x.beginPath(); x.moveTo(0, -2); x.lineTo(Math.cos(a) * 11, -2 + Math.sin(a) * 11); x.stroke(); } }
  else if (k === 'fusion') { x.strokeStyle = '#5a4fa0'; x.lineWidth = 2; for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(0, 0, 11, 4, i * 1.05, 0, 7); x.stroke(); } }
  x.restore();
}
const cache = new Map();
export function cardTexture(num, de = true) {
  if (cache.has(num)) return cache.get(num);
  const [res, need, pow] = PLANTDATA[num]; const W = 360, H = 250;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#efe8d6'; x.fillRect(0, 0, W, H);
  x.fillStyle = BAND[res]; x.fillRect(0, 0, 112, H);
  x.fillStyle = res === 'garbage' ? '#1d1405' : '#fff'; x.font = '800 78px Orbitron, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(num, 56, 108);
  { const lab = NAME[de ? 'de' : 'en'][res].toUpperCase(); let fs = 22; do { x.font = `700 ${fs}px Barlow, sans-serif`; fs--; } while (x.measureText(lab).width > 100 && fs > 12); x.fillText(lab, 56, 190); }
  // Bedarf
  const kinds = res === 'hybrid' ? ['coal', 'oil'] : [res];
  if (need) { for (let i = 0; i < need; i++) icon(x, kinds[i % kinds.length], 150 + i * 44, 82, 1.45); }
  else icon(x, res, 170, 82, 1.6);
  x.fillStyle = '#5b5446'; x.font = '600 20px Barlow, sans-serif'; x.textAlign = 'left'; x.fillText(need ? (de ? `verbrennt ${need}` : `burns ${need}`) : (de ? 'kein Brennstoff' : 'no fuel'), 132, 128);
  // Leistung
  x.fillStyle = '#1d1405'; x.beginPath(); x.moveTo(144, 210); x.lineTo(144, 186); x.lineTo(160, 172); x.lineTo(176, 186); x.lineTo(176, 210); x.closePath(); x.fill();
  x.font = '800 46px Orbitron, sans-serif'; x.textAlign = 'left'; x.fillText('→ ' + pow, 190, 194);
  x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 4; x.strokeRect(2, 2, W - 4, H - 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cache.set(num, t); return t;
}
let BACK;
function backTexture() {
  if (BACK) return BACK; const c = document.createElement('canvas'); c.width = 360; c.height = 250; const x = c.getContext('2d');
  x.fillStyle = '#16202a'; x.fillRect(0, 0, 360, 250); x.strokeStyle = 'rgba(242,179,61,.7)'; x.lineWidth = 3; x.strokeRect(12, 12, 336, 226);
  x.fillStyle = '#f2b33d'; x.font = '800 30px Orbitron, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('GRID MASTER', 180, 112); x.font = '700 18px Barlow, sans-serif'; x.fillStyle = 'rgba(242,179,61,.7)'; x.fillText('KRAFTWERK', 180, 148);
  BACK = new THREE.CanvasTexture(c); BACK.colorSpace = THREE.SRGBColorSpace; return BACK;
}
export const CARD_W = 4.4, CARD_D = 3.05;
const cardBody = new RoundedBoxGeometry(CARD_W, .07, CARD_D, 2, .03);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd9d1bc, roughness: .7 });
export function makeCard(num, de) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(cardBody, bodyMat); b.castShadow = true; b.receiveShadow = true; g.add(b);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W - .08, CARD_D - .08), new THREE.MeshStandardMaterial({ map: cardTexture(num, de), roughness: .55 })); f.rotation.x = -Math.PI / 2; f.position.y = .036; g.add(f);
  const k = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W - .08, CARD_D - .08), new THREE.MeshStandardMaterial({ map: backTexture(), roughness: .5 })); k.rotation.x = Math.PI / 2; k.rotation.z = Math.PI; k.position.y = -.036; g.add(k);
  g.userData.num = num; return g;
}

function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

export function createPlantMarket({ x0, z0, de = true, market, deck }) {
  const group = new THREE.Group(); group.position.set(x0, 0, z0);
  const W = 12.4, HEAD = 3.4, ROW = 3.75, DECKA = 5.2, L = HEAD + ROW * 4 + DECKA + .6;
  const colX = [-3.05, 3.05], rowZ = r => -L / 2 + HEAD + ROW * (r + .5), deckPos = new THREE.Vector3(0, 0, -L / 2 + HEAD + ROW * 4 + DECKA / 2);
  // slab + print
  const shape = new THREE.Shape(); const r = 1.2, hw = W / 2, hl = L / 2;
  shape.moveTo(-hw + r, -hl); shape.lineTo(hw - r, -hl); shape.quadraticCurveTo(hw, -hl, hw, -hl + r); shape.lineTo(hw, hl - r); shape.quadraticCurveTo(hw, hl, hw - r, hl); shape.lineTo(-hw + r, hl); shape.quadraticCurveTo(-hw, hl, -hw, hl - r); shape.lineTo(-hw, -hl + r); shape.quadraticCurveTo(-hw, -hl, -hw + r, -hl);
  const D = .45, sg = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2 }); sg.rotateX(-Math.PI / 2); sg.translate(0, -D, 0);
  const TS = 40, cw = Math.round(W * TS), ch = Math.round(L * TS), cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const x = cv.getContext('2d');
  const tx = v => (v + W / 2) * TS, tz = v => (v + L / 2) * TS;
  const grd = x.createLinearGradient(0, 0, 0, ch); grd.addColorStop(0, '#1e2a33'); grd.addColorStop(1, '#18222a'); x.fillStyle = grd; x.fillRect(0, 0, cw, ch);
  for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * .03})`; x.fillRect(Math.random() * cw, Math.random() * ch, 1.5, 1.5); }
  x.strokeStyle = 'rgba(242,179,61,.5)'; x.lineWidth = 2; roundRect(x, 12, 12, cw - 24, ch - 24, 30); x.stroke(); x.strokeStyle = 'rgba(242,179,61,.18)'; x.lineWidth = 1; roundRect(x, 20, 20, cw - 40, ch - 40, 24); x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#f2b33d'; x.font = `800 ${TS * .62}px Orbitron, sans-serif`; x.fillText(de ? 'KRAFTWERKSMARKT' : 'POWER PLANT MARKET', cw / 2, tz(-L / 2 + 1.2));
  x.font = `700 ${TS * .42}px Barlow, sans-serif`; x.fillStyle = 'rgba(227,234,238,.75)'; x.fillText(de ? 'AKTUELL' : 'CURRENT', tx(colX[0]), tz(-L / 2 + 2.6)); x.fillStyle = 'rgba(227,234,238,.45)'; x.fillText(de ? 'ZUKUNFT' : 'FUTURE', tx(colX[1]), tz(-L / 2 + 2.6));
  for (let c = 0; c < 2; c++) for (let rr = 0; rr < 4; rr++) { x.strokeStyle = c ? 'rgba(227,234,238,.12)' : 'rgba(242,179,61,.28)'; x.lineWidth = 2; x.setLineDash(c ? [8, 6] : []); roundRect(x, tx(colX[c] - CARD_W / 2 - .12), tz(rowZ(rr) - CARD_D / 2 - .12), (CARD_W + .24) * TS, (CARD_D + .24) * TS, 10); x.stroke(); }
  x.setLineDash([]); x.strokeStyle = 'rgba(227,234,238,.14)'; roundRect(x, tx(-CARD_W / 2 - .12), tz(deckPos.z - CARD_D / 2 - .12), (CARD_W + .24) * TS, (CARD_D + .24) * TS, 10); x.stroke();
  x.fillStyle = 'rgba(227,234,238,.4)'; x.font = `600 ${TS * .34}px Barlow, sans-serif`; x.fillText(de ? 'STAPEL' : 'DECK', tx(0), tz(deckPos.z + CARD_D / 2 + .5));
  const top = new THREE.CanvasTexture(cv); top.colorSpace = THREE.SRGBColorSpace; top.anisotropy = 8;
  const pos = sg.attributes.position, uv = sg.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + W / 2) / W, 1 - (pos.getZ(i) + L / 2) / L);
  const slab = new THREE.Mesh(sg, [new THREE.MeshStandardMaterial({ map: top, roughness: .75, metalness: .05 }), new THREE.MeshStandardMaterial({ color: 0x24303a, roughness: .55, metalness: .3 })]);
  slab.receiveShadow = true; group.add(slab);
  // cards
  const cards = new Map();
  const slot = i => new THREE.Vector3(colX[i < 4 ? 0 : 1], .04, rowZ(i % 4));
  market.slice().sort((a, b) => a - b).forEach((n, i) => { const c = makeCard(n, de); c.position.copy(slot(i)); group.add(c); cards.set(n, c); });
  const pile = []; deck.forEach((n, i) => { const c = makeCard(n, de); c.position.set(deckPos.x, .04 + i * .075, deckPos.z); c.rotation.z = Math.PI; group.add(c); pile.push(c); });
  return { group, cards, pile, slot, deckPos, market, deck, bounds: { minX: x0 - W / 2, maxX: x0 + W / 2, minZ: z0 - L / 2, maxZ: z0 + L / 2 }, W, L };
}
