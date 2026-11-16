// Grid Plan – Modellbaukasten: Kraftwerke je Brennstoff, Lieferwagen, Bieterkellen, Gebotsleiter, Zuschlag-Stempel.
// Alles im Stil weißer Architekturmodelle mit sparsamen Farbakzenten.
import { THREE, RoundedBoxGeometry, canvasTex, rr } from './table.js';
export const FUELCOL = { coal: '#3b3631', oil: '#24303f', garbage: '#d9a62e', uranium: '#c8342b', eco: '#3f9b57', hybrid: '#6e5a45' };
const W = () => new THREE.MeshStandardMaterial({ color: '#f1efe8', roughness: .82 });
const C = col => new THREE.MeshStandardMaterial({ color: col, roughness: .6 });
const M = { w: null, line: null }; const w = () => M.w ||= W(); const dark = () => M.d ||= C('#2c3440');
function box(wd, h, d, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(new RoundedBoxGeometry(wd, h, d, 2, Math.min(wd, h, d) * .08), m); o.position.set(x, y + h / 2, z); return o; }
function cyl(r0, r1, h, m, x = 0, y = 0, z = 0, seg = 18) { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, seg), m); o.position.set(x, y + h / 2, z); return o; }
function gable(wd, h, d, m, x, y, z) { const s = new THREE.Shape([new THREE.Vector2(-wd / 2, 0), new THREE.Vector2(wd / 2, 0), new THREE.Vector2(0, h)]); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; }
function chimney(g, x, z, h, col) { g.add(cyl(.24, .17, h, w(), x, 0, z)); const band = cyl(.18, .175, .16, C(col), x, h - .34, z); g.add(band); g.userData.chimneys.push(new THREE.Vector3(x, h + .05, z)); }
function turbine(g, x, z, h = 2.7) { g.add(cyl(.09, .05, h, w(), x, 0, z, 10)); const nac = box(.42, .18, .2, w(), x, h - .05, z); g.add(nac); const rot = new THREE.Group(); rot.position.set(x, h + .04, z + .14); for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.07, 1.05, .02), w()); b.position.y = .52; const arm = new THREE.Group(); arm.rotation.z = i * 2.094; arm.add(b); rot.add(arm); } rot.add(new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), w())); g.add(rot); g.userData.spinners.push(rot); }
function hyperboloid(h = 2.5, rb = .95, rw = .58, rt = .7) { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16, y = t * h; const r = rw + (t < .7 ? (rb - rw) * ((.7 - t) / .7) ** 1.6 : (rt - rw) * ((t - .7) / .3) ** 1.6); pts.push(new THREE.Vector2(r, y)); } const g = new THREE.LatheGeometry(pts, 28); return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#f1efe8', roughness: .82, side: THREE.DoubleSide })); }

// Kraftwerksmodell, Grundfläche ~4,3 × 2,7, steht auf der Karte (y = 0)
export function plantModel(n, fuel, pcol) {
  const g = new THREE.Group(); g.userData = { chimneys: [], spinners: [], fuel }; const col = FUELCOL[fuel];
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(4.5, .1, 2.9, 2, .04), w()); plinth.position.y = .05; g.add(plinth);
  const accent = new THREE.Mesh(new THREE.BoxGeometry(4.5, .03, .14), C(pcol || col)); accent.position.set(0, .1, 1.38); g.add(accent); g.userData.accent = accent;
  const top = .1;
  const add = o => { o.position.y += top; g.add(o); return o; };
  if (fuel === 'coal') { add(box(2.0, .95, 1.5, w(), -.75, 0, -.1)); add(gable(2.0, .45, 1.5, w(), -.75, .95, -.1)); [.75, 1.4].forEach(x => { const t = new THREE.Group(); g.add(t); }); chimney(g, .8, -.4, 2.9, col); chimney(g, 1.45, -.4, 2.6, col); const heap = new THREE.Mesh(new THREE.ConeGeometry(.55, .55, 7), C('#3b3631')); heap.position.set(-1.55, top + .27, .85); g.add(heap); add(box(.9, .5, .5, w(), 1.1, 0, .7)); }
  else if (fuel === 'oil') { add(box(1.7, .8, 1.3, w(), -1.15, 0, -.2)); [[.35, .55], [1.35, .55], [.85, -.55]].forEach(([x, z]) => { add(cyl(.45, .45, .85, w(), x, 0, z, 22)); const dome = new THREE.Mesh(new THREE.SphereGeometry(.45, 18, 8, 0, 6.29, 0, 1.2), w()); dome.position.set(x, top + .85, z); dome.scale.y = .35; g.add(dome); add(cyl(.455, .455, .09, C(col), x, .5, z, 22)); }); chimney(g, -1.6, .55, 2.1, col); }
  else if (fuel === 'garbage') { add(box(2.4, .9, 1.4, w(), -.5, 0, -.2)); const s = new THREE.Shape([new THREE.Vector2(-1.2, 0), new THREE.Vector2(1.2, 0), new THREE.Vector2(1.2, .2), new THREE.Vector2(-1.2, .7)]); const rg = new THREE.ExtrudeGeometry(s, { depth: 1.4, bevelEnabled: false }); rg.translate(0, 0, -.7); const roof = new THREE.Mesh(rg, w()); roof.position.set(-.5, top + .9, -.2); g.add(roof); chimney(g, 1.4, -.35, 3.0, col); [-1.4, -.7, 0].forEach(x => add(box(.5, .35, .4, C('#d9a62e'), x, 0, .95))); }
  else if (fuel === 'uranium') { const t = hyperboloid(); t.position.set(.9, top, 0); g.add(t); const rim = cyl(.7, .7, .08, C(col), .9, 2.45, 0, 28); g.add(rim); g.userData.chimneys.push(new THREE.Vector3(.9, 2.7, 0)); add(cyl(.6, .6, .7, w(), -1.15, 0, -.1, 24)); const dome = new THREE.Mesh(new THREE.SphereGeometry(.6, 24, 10, 0, 6.29, 0, 1.57), w()); dome.position.set(-1.15, top + .7, -.1); g.add(dome); add(box(.8, .4, .6, w(), -1.3, 0, .9)); }
  else if (fuel === 'eco') { const solar = n === 18 || n === 27; if (solar) { for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.8, .04, .55), C('#2d4a6b')); p.position.set(-1.6 + (i % 3) * .95, top + .45, -.6 + Math.floor(i / 3) * .9); p.rotation.x = -.5; p.castShadow = true; g.add(p); add(cyl(.03, .03, .4, w(), p.position.x, 0, p.position.z)); } turbine(g, 1.4, .1, 2.7); } else { turbine(g, -1.1, .2, 2.6); turbine(g, .3, -.4, 2.9); turbine(g, 1.6, .5, 2.4); } add(box(.6, .3, .4, C(col), 1.7, 0, -.95)); }
  else { add(box(1.8, .85, 1.3, w(), -.9, 0, -.2)); add(cyl(.45, .45, .8, w(), .9, 0, .55, 22)); chimney(g, 1.2, -.5, 2.6, col); add(box(.7, .35, .5, C('#3b3631'), -1.6, 0, .9)); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g;
}

// Lieferwagen, Front zeigt nach +x, Ladefläche bei y ≈ .78
export function truck(col = '#e4572e', uranium = false) { const g = new THREE.Group(); g.add(box(3.1, .28, 1.25, dark(), 0, .32, 0)); g.add(box(1.0, .95, 1.2, C(col), 1.15, .55, 0)); g.add(box(.08, .38, 1.0, C('#9fc2e0'), 1.66, .98, 0));
  if (uranium) { g.add(box(1.9, .9, 1.15, w(), -.45, .6, 0)); const tf = new THREE.Mesh(new THREE.CircleGeometry(.28, 20), C('#f4d35e')); tf.position.set(-.45, 1.05, .58); g.add(tf); } else { [-.62, .62].forEach(z => g.add(box(2.0, .2, .06, w(), -.45, .6, z))); g.add(box(.06, .2, 1.25, w(), -1.45, .6, 0)); }
  [[-1.0, .62], [-1.0, -.62], [1.0, .62], [1.0, -.62]].forEach(([x, z]) => { const wh = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .2, 16), dark()); wh.rotation.x = Math.PI / 2; wh.position.set(x, .3, z); g.add(wh); });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData.bed = new THREE.Vector3(-.45, .62, 0); return g; }

// Bieterkelle: Stiel + Scheibe mit Gebot
export function paddle(pcol, name, v) { const g = new THREE.Group(); g.add(cyl(.06, .06, 1.7, C('#d9c9a5'), 0, 0, 0, 8)); const tex = canvasTex(256, 256, (x) => { x.fillStyle = '#fffdf2'; x.beginPath(); x.arc(128, 128, 124, 0, 7); x.fill(); x.strokeStyle = pcol; x.lineWidth = 18; x.beginPath(); x.arc(128, 128, 112, 0, 7); x.stroke(); x.fillStyle = '#17283a'; x.textAlign = 'center'; x.font = '600 74px "IBM Plex Mono",monospace'; x.fillText(v === null ? '—' : v + '€', 128, 150); x.font = '600 26px "IBM Plex Mono",monospace'; x.fillStyle = pcol; x.fillText(v === null ? 'PASST' : name.toUpperCase(), 128, 200); });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .06, 32), C(pcol)); disc.rotation.x = Math.PI / 2; disc.position.y = 2.35; g.add(disc); const face = new THREE.Mesh(new THREE.CircleGeometry(.72, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: .8 })); face.position.set(0, 2.35, .035); g.add(face); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }

// Gebotsleiter: senkrechtes Lineal mit Preisstrichen ab Mindestgebot
export function ladder(min) { const tex = canvasTex(96, 512, (x) => { x.fillStyle = '#fffdf2'; x.fillRect(0, 0, 96, 512); x.fillStyle = '#17283a'; x.font = '600 26px "IBM Plex Mono",monospace'; x.textAlign = 'right'; for (let i = 0; i <= 12; i++) { const y = 492 - i * 38; x.fillRect(0, y, i % 2 ? 22 : 38, 3); if (i % 2 === 0) x.fillText(String(min + i), 90, y + 9); } });
  const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(.7, 4.6, .08), [W(), W(), W(), W(), new THREE.MeshStandardMaterial({ map: tex, roughness: .8 }), W()]); m.position.y = 2.4; m.castShadow = true; g.add(m); g.userData.y = v => 4.7 - (492 - (v - min) * 38) / 512 * 4.6; return g; }

export function stampMesh(text = 'ZUSCHLAG', col = '#c0392b') { const tex = canvasTex(512, 200, (x) => { x.translate(256, 100); x.rotate(-.08); x.strokeStyle = col; x.lineWidth = 12; rr(x, -230, -70, 460, 140, 18); x.stroke(); x.lineWidth = 4; rr(x, -214, -56, 428, 112, 12); x.stroke(); x.fillStyle = col; x.font = '700 84px "IBM Plex Sans Condensed",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 0, 6); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.64), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; return m; }
