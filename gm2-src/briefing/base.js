// Gemeinsame Modelle, Brett-Zeichnungen und Standard-Animationen. Themes überschreiben, was ihren Charakter ausmacht.
import { THREE, RoundedBoxGeometry, RES, RNAME, PRICE, INCOME, REFILL, PLANTDATA, CITY, lerp, rng, rr, canvasTex, tween, wait, E } from './table.js';
export { THREE, RoundedBoxGeometry, RNAME, PRICE, INCOME, PLANTDATA, CITY, lerp, rng, rr, canvasTex, tween, wait, E };

export const RCOL = { coal: '#3b3631', oil: '#24303f', garbage: '#d9a62e', uranium: '#c8342b', eco: '#3f9b57', hybrid: '#6e5a45' };
const m = (o) => new THREE.MeshStandardMaterial(o);

// ---------- authentische Rohstoff-Geometrien (Stil-Parameter: lowpoly, chunky) ----------
export function coalGeo(seed = 1, st = {}) { const g = st.chunky ? new RoundedBoxGeometry(.56, .4, .5, 1, .1) : new THREE.IcosahedronGeometry(.33, st.lowpoly ? 0 : 1); if (!st.chunky) { const r = rng('c' + seed), p = g.attributes.position, map = new Map(); for (let i = 0; i < p.count; i++) { const k = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3); if (!map.has(k)) map.set(k, .78 + r() * .4); const f = map.get(k); p.setXYZ(i, p.getX(i) * f * 1.1, p.getY(i) * f * .78, p.getZ(i) * f); } g.computeVertexNormals(); } g.translate(0, st.chunky ? .2 : .25, 0); return g; }
export function barrel(mats, st = {}) { const g = new THREE.Group(), seg = st.lowpoly ? 8 : 22; const b = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .62, seg), mats.body); b.position.y = .31; g.add(b); if (!st.noRibs) [.13, .49].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(.275, .028, 6, seg), mats.rib || mats.body); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }); const lid = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .03, 10), mats.rib || mats.body); lid.position.set(.12, .63, .05); g.add(lid); return g; }
export function bag(mats, st = {}) { const g = new THREE.Group(); const geo = new THREE.SphereGeometry(.33, st.lowpoly ? 7 : 16, st.lowpoly ? 5 : 12); const p = geo.attributes.position, r = rng('bag'); for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const t = (y + .33) / .66; const pinch = 1 - Math.max(0, t - .62) * 1.9; x *= pinch * (1 + .06 * Math.sin(y * 20 + z * 9)); z *= pinch * (1 + .06 * Math.cos(x * 17)); if (y < -.18) y = -.18 - (y + .18) * .25; p.setXYZ(i, x, y * 1.08, z); } geo.computeVertexNormals(); const b = new THREE.Mesh(geo, mats.body); b.position.y = .22; g.add(b); const tie = new THREE.Mesh(new THREE.ConeGeometry(.08, .17, 6), mats.body); tie.position.y = .6; tie.rotation.x = Math.PI; g.add(tie); const knot = new THREE.Mesh(new THREE.TorusGeometry(.05, .02, 5, 10), mats.rib || mats.body); knot.position.y = .53; knot.rotation.x = Math.PI / 2; g.add(knot); return g; }
export function drum(mats, st = {}) { const g = new THREE.Group(), seg = st.lowpoly ? 8 : 22; const b = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .56, seg), mats.body); b.position.y = .28; g.add(b); const band = new THREE.Mesh(new THREE.CylinderGeometry(.257, .257, .14, seg, 1, true), mats.band || mats.rib || mats.body); band.position.y = .3; g.add(band); const top = new THREE.Mesh(new THREE.CircleGeometry(.2, seg), mats.top || mats.body); top.rotation.x = -Math.PI / 2; top.position.y = .565; g.add(top); return g; }
export function trefoilTex(bg = '#f4d35e', fg = '#1d1d1d') { return canvasTex(128, 128, (x) => { x.fillStyle = bg; x.fillRect(0, 0, 128, 128); x.fillStyle = fg; x.translate(64, 64); for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 50, (i * 120 - 30) * Math.PI / 180, (i * 120 + 30) * Math.PI / 180); x.closePath(); x.fill(); } x.fillStyle = bg; x.beginPath(); x.arc(0, 0, 13, 0, 7); x.fill(); x.fillStyle = fg; x.beginPath(); x.arc(0, 0, 8, 0, 7); x.fill(); }); }
export function makeResource(k, mats, st = {}) { let o; if (k === 'coal') { o = new THREE.Group(); o.add(new THREE.Mesh(coalGeo(Math.floor(Math.random() * 6), st), mats.body)); } else if (k === 'oil') o = barrel(mats, st); else if (k === 'garbage') o = bag(mats, st); else o = drum(mats, st); o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); o.userData.res = k; return o; }
export function resMats(T, ctx, k) { return (ctx._rm ||= {})[k] ||= T.resMats(ctx, k); }

// ---------- Linien-Helfer: Streifen von a nach b, wächst mit set(k) ----------
export function strip(ends, w, h, mat, y = 0, round = true) {
  const geo = round ? new RoundedBoxGeometry(1, h, w, 2, Math.min(h, w) * .45) : new THREE.BoxGeometry(1, h, w); geo.translate(.5, h / 2, 0);
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true; const obj = new THREE.Group(); obj.add(mesh); obj.position.copy(ends.a); obj.position.y = y; obj.rotation.y = -Math.atan2(ends.uz, ends.ux);
  const set = k => { mesh.scale.x = Math.max(.001, ends.L * k); mesh.visible = k > 0.002; }; set(0); return { obj, set, mesh };
}
export function alongLine(ends, k, y = 0) { return new THREE.Vector3(lerp(ends.a.x, ends.b.x, k), y, lerp(ends.a.z, ends.b.z, k)); }

// ---------- Brett-Zeichnungen (Stil kommt aus T.board(P)) ----------
const U = 48;
function txt(x, s, X, Y, font, col, al = 'left', bl = 'alphabetic') { x.font = font; x.fillStyle = col; x.textAlign = al; x.textBaseline = bl; x.fillText(s, X, Y); }
export function iconRes(x, k, X, Y, s, P) { x.save(); x.translate(X, Y); x.scale(s / 20, s / 20); x.fillStyle = RCOL[k]; x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1;
  if (k === 'coal') { x.beginPath(); x.moveTo(-9, 6); x.lineTo(-8, -3); x.lineTo(-1, -8); x.lineTo(8, -4); x.lineTo(9, 4); x.lineTo(2, 8); x.closePath(); x.fill(); }
  else if (k === 'oil') { rr(x, -7, -10, 14, 20, 3); x.fill(); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(-7, -4, 14, 1.5); x.fillRect(-7, 3, 14, 1.5); }
  else if (k === 'garbage') { x.beginPath(); x.moveTo(-9, 9); x.bezierCurveTo(-11, -2, -6, -6, -2, -6); x.lineTo(-3, -10); x.lineTo(3, -10); x.lineTo(2, -6); x.bezierCurveTo(6, -6, 11, -2, 9, 9); x.closePath(); x.fill(); }
  else if (k === 'uranium') { rr(x, -7, -10, 14, 20, 3); x.fill(); x.fillStyle = '#f4d35e'; x.beginPath(); x.arc(0, 0, 4, 0, 7); x.fill(); }
  else if (k === 'eco') { x.beginPath(); x.arc(0, 0, 9, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 7); x.lineTo(0, -2); x.moveTo(0, -2); x.lineTo(-6, -7); x.moveTo(0, -2); x.lineTo(6, -7); x.moveTo(0, -2); x.lineTo(0, -9); x.stroke(); }
  else { iconRes(x, 'coal', -5, 0, 14, P); iconRes(x, 'oil', 6, 0, 14, P); } x.restore(); }

export function drawMarket(x, w, h, P, MK, B) {
  x.fillStyle = B.bg; x.fillRect(0, 0, w, h); B.decor && B.decor(x, w, h, 'market');
  txt(x, B.upper ? 'ROHSTOFFMARKT' : 'Rohstoffmarkt', .7 * U, 1.35 * U, B.title, B.ink);
  RES.forEach((k, li) => { const cx = (1.2 + 3.2 * (li + .5)) * U; iconRes(x, k, cx - .7 * U, 2.6 * U, 22, P); txt(x, B.upper ? RNAME[k].toUpperCase() : RNAME[k], cx - .2 * U, 2.75 * U, B.small, B.muted);
    const z0 = 3.4 * U, n = k === 'uranium' ? 12 : 8, ch = 30 * U / n;
    for (let c = 0; c < n; c++) { const y = z0 + c * ch; x.fillStyle = B.cell; rr(x, cx - 1.5 * U + 3, y + 3, 3 * U - 6, ch - 6, B.cellR ?? 8); x.fill(); if (B.cellLine) { x.strokeStyle = B.cellLine; x.lineWidth = 2; x.stroke(); }
      const price = k === 'uranium' ? PRICE(k, c) : c + 1; txt(x, String(price), cx + 1.32 * U, y + ch - 10, B.num, B.ink, 'right'); }
  });
  // Nachschubtabelle
  const ty = 34.3 * U; txt(x, B.upper ? 'NACHSCHUB · 3 SPIELER' : 'Nachschub · 3 Spieler', .7 * U, ty, B.small, B.muted);
  [1, 2, 3].forEach((s, r) => { txt(x, 'Stufe ' + s, .7 * U, ty + (r + 1) * .95 * U, B.small, B.muted); RES.forEach((k, li) => txt(x, '+' + REFILL[s][k], (1.2 + 3.2 * (li + .5)) * U + .4 * U, ty + (r + 1) * .95 * U, B.num, B.ink, 'center')); });
}
export function drawPlantBoard(x, w, h, P, PM, B) {
  x.fillStyle = B.bg; x.fillRect(0, 0, w, h); B.decor && B.decor(x, w, h, 'plants');
  txt(x, B.upper ? 'KRAFTWERKSMARKT' : 'Kraftwerksmarkt', .7 * U, 1.1 * U, B.title, B.ink);
  txt(x, B.upper ? 'AKTUELL' : 'Aktuell · kaufbar', (7.5 - 3.2) * U, 1.9 * U, B.small, B.muted, 'center'); txt(x, B.upper ? 'ZUKUNFT' : 'Zukunft', (7.5 + 3.2) * U, 1.9 * U, B.small, B.muted, 'center');
  for (let i = 0; i < 8; i++) { const cx = (7.5 + (i < 4 ? -3.2 : 3.2)) * U, cy = (4.2 + (i % 4) * 4.5) * U; x.setLineDash(B.dash || [10, 8]); x.strokeStyle = B.slot; x.lineWidth = 3; rr(x, cx - 2.9 * U, cy - 2.05 * U, 5.8 * U, 4.1 * U, 14); x.stroke(); }
  x.setLineDash([]); const dy = (28 - 3.6) * U; x.strokeStyle = B.slot; x.lineWidth = 3; rr(x, 7.5 * U - 3 * U, dy - 2.15 * U, 6 * U, 4.3 * U, 14); x.stroke(); txt(x, B.upper ? 'STAPEL' : 'Stapel', 7.5 * U, dy + 2.95 * U, B.small, B.muted, 'center');
}
export function drawPlayerBoard(x, w, h, P, PA, B) {
  x.fillStyle = B.bg; x.fillRect(0, 0, w, h); B.decor && B.decor(x, w, h, 'player');
  x.fillStyle = P.players[0]; x.beginPath(); x.arc(.95 * U, 1.05 * U, .32 * U, 0, 7); x.fill(); txt(x, B.upper ? 'DEIN BEREICH' : 'Dein Bereich', 1.5 * U, 1.3 * U, B.title, B.ink);
  for (let i = 0; i < 3; i++) { const cx = (7.5 - 4.75 + i * 4.75) * U, cy = (8.5 - 3.4) * U; x.setLineDash(B.dash || [10, 8]); x.strokeStyle = B.slot; x.lineWidth = 3; rr(x, cx - 2.25 * U, cy - 1.6 * U, 4.5 * U, 3.2 * U, 12); x.stroke(); x.setLineDash([]);
    for (let j = 0; j < 6; j++) { const sx = cx + (-1.05 + (j % 3) * 1.05) * U, sy = (8.5 - .2 + Math.floor(j / 3) * .95) * U; x.fillStyle = B.cell; x.beginPath(); x.arc(sx, sy, .38 * U, 0, 7); x.fill(); } }
  txt(x, B.upper ? 'LAGER' : 'Lager', .7 * U, (8.5 + .35) * U, B.small, B.muted); txt(x, B.upper ? 'KASSE' : 'Kasse', .7 * U, (8.5 + 5.35) * U, B.small, B.muted);
}
export function drawTrack(x, w, h, P, B) {
  const u = 32; x.fillStyle = B.bg; x.fillRect(0, 0, w, h); B.decor && B.decor(x, w, h, 'track');
  txt(x, B.upper ? 'REIHENFOLGE' : 'Reihenfolge', 1.2 * u, 1.3 * u, B.small, B.muted);
  for (let i = 0; i < 4; i++) { x.fillStyle = B.cell; x.beginPath(); x.arc((2.6 + i * 2.7) * u, 3.6 * u, 1.05 * u, 0, 7); x.fill(); txt(x, String(i + 1), (2.6 + i * 2.7) * u, 5.5 * u, B.small, B.muted, 'center'); }
  txt(x, B.upper ? 'STÄDTE · EINKOMMEN' : 'Städte · Einkommen', 12.3 * u, 1.3 * u, B.small, B.muted);
  for (let n = 0; n <= 20; n++) { const cx = (13.4 + n * 2.45) * u; const hot = n === 7 || n === 17; x.fillStyle = hot ? B.hot || P.accent : B.cell; rr(x, cx - 1.1 * u, 2.4 * u, 2.2 * u, 2.4 * u, 8); x.fill(); txt(x, String(n), cx, 3.95 * u, B.num, hot ? B.hotInk || '#fff' : B.ink, 'center'); txt(x, (INCOME[Math.min(n, 10)] + (n > 10 ? (n - 10) * 5 : 0)) + '', cx, 5.6 * u, B.tiny || B.small, B.muted, 'center'); }
  txt(x, B.upper ? 'STUFE 2' : 'Stufe 2', (13.4 + 7 * 2.45) * u, 1.6 * u, B.tiny || B.small, B.hot || P.accent, 'center'); txt(x, B.upper ? 'ENDE' : 'Spielende', (13.4 + 17 * 2.45) * u, 1.6 * u, B.tiny || B.small, B.hot || P.accent, 'center');
}
export function drawCardBack(x, w, h, P, B) { x.fillStyle = B.back || P.accent; rr(x, 0, 0, w, h, 26); x.fill(); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 6; rr(x, 16, 16, w - 32, h - 32, 18); x.stroke(); txt(x, B.backText || 'GRID MASTER', w / 2, h / 2 + 12, B.cardTitle || B.title, '#fff', 'center'); }
export function drawCard(x, w, h, n, [res, need, pow], P, B) {
  x.fillStyle = B.card || '#f4f1ea'; rr(x, 0, 0, w, h, 26); x.fill(); const c = RCOL[res];
  if (B.cardStyle === 'band') { x.fillStyle = c; x.fillRect(0, 0, 70, h); txt(x, String(n), 35, h / 2 + 22, '800 64px ' + B.cardFont, '#fff', 'center'); }
  else if (B.cardStyle === 'top') { x.fillStyle = c; x.fillRect(0, 0, w, 34); txt(x, String(n), 26, 150, '800 120px ' + B.cardFont, B.cardInk, 'left'); }
  else { x.fillStyle = c; x.beginPath(); x.arc(78, 110, 56, 0, 7); x.fill(); txt(x, String(n), 78, 134, '800 64px ' + B.cardFont, '#fff', 'center'); }
  const L = B.cardStyle === 'top' ? 200 : B.cardStyle === 'band' ? 100 : 160;
  txt(x, RNAME[res], L, B.cardStyle === 'top' ? 92 : 92, '600 34px ' + B.cardText, B.cardMuted, 'left');
  for (let i = 0; i < need; i++) iconRes(x, res === 'hybrid' ? (i ? 'oil' : 'coal') : res, L + 22 + i * 46, 150, 34, P); if (!need) iconRes(x, 'eco', L + 22, 150, 34, P);
  txt(x, '→ ' + pow, w - 26, h - 30, '800 54px ' + B.cardFont, B.cardInk, 'right'); x.fillStyle = B.cardInk; for (let i = 0; i < pow; i++) { const hx = w - 40 - i * 34, hy = h - 112; x.beginPath(); x.moveTo(hx - 12, hy + 12); x.lineTo(hx - 12, hy - 2); x.lineTo(hx, hy - 14); x.lineTo(hx + 12, hy - 2); x.lineTo(hx + 12, hy + 12); x.closePath(); x.fill(); }
}

// ---------- Standard-Animationen ----------
export const BASE = {
  font: 'sans-serif',
  drawMarket(x, w, h, P, MK) { drawMarket(x, w, h, P, MK, this.board(P)); }, drawPlantBoard(x, w, h, P, PM) { drawPlantBoard(x, w, h, P, PM, this.board(P)); }, drawPlayerBoard(x, w, h, P, PA) { drawPlayerBoard(x, w, h, P, PA, this.board(P)); },
  drawTrack(x, w, h, P) { drawTrack(x, w, h, P, this.board(P)); }, drawCard(x, w, h, n, d, P) { drawCard(x, w, h, n, d, P, this.board(P)); }, drawCardBack(x, w, h, P) { drawCardBack(x, w, h, P, this.board(P)); },
  resource(ctx, k) { return makeResource(k, resMats(this, ctx, k), this.resStyle || {}); },
  coin(ctx) { const g = (ctx._coinG ||= new THREE.CylinderGeometry(.55, .55, .17, 28)); const c = new THREE.Mesh(g, ctx._coinM ||= this.coinMat(ctx)); c.castShadow = true; c.receiveShadow = true; c.geometry.translate && 0; return c; },
  coinMat(ctx) { return m({ color: ctx.P.coin || '#d8b552', metalness: .7, roughness: .35 }); },
  disc(ctx, pl) { const d = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .3, 32), m({ color: ctx.P.players[pl], roughness: .5 })); d.castShadow = true; d.geometry.translate(0, .15, 0); return d; },
  async animLine(ctx, lo, A, B, pl) { const L = lo.ends.L; const head = ctx.FX.sprite(ctx.P.players[pl], 2.2); await tween(.4 + L * .06, e => { lo.set(e); head.position.copy(alongLine(lo.ends, e, .5)); }, 'inout'); ctx.FX.kill(head); },
  async animHouse(ctx, h, c, pl) { h.scale.setScalar(.001); await tween(.6, e => h.scale.setScalar(Math.max(.001, e)), 'spring'); ctx.FX.burst(new THREE.Vector3(c.X, .8, c.Z), [ctx.P.players[pl], ctx.P.accent], 22); },
  async animBuy(ctx, p, dest, price) { ctx.FX.label(price + ' €', p.m.position.clone().add(new THREE.Vector3(0, 1.2, 0)), ctx.P.accentCss || '#fff', 1, .7); await ctx.FX.arc(p.m, dest, 1.1, 7, 'inout', 4); await tween(.2, k => p.m.scale.setScalar(1 + .15 * Math.sin(k * Math.PI)), 'lin'); },
  async animRestock(ctx, p, n) { const to = p.m.position.clone(); p.m.position.y = 14; p.m.visible = false; await wait(n * .07); p.m.visible = true; await tween(.75, e => p.m.position.y = lerp(14, to.y, e), 'bounce'); },
  bidTag(ctx, pl, v) { const P = ctx.P, B = this.board(P); return canvasTex(256, 120, (x) => { x.fillStyle = B.tag || P.surfaceCss || '#fff'; rr(x, 8, 8, 240, 104, 22); x.fill(); x.fillStyle = P.players[pl]; x.beginPath(); x.arc(52, 60, 22, 0, 7); x.fill(); txt(x, v === null ? 'passt' : v + ' €', 160, 78, '800 46px ' + this.font, B.tagInk || B.ink, 'center'); }); },
  async animBid(ctx, card, pl, v) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.bidTag(ctx, pl, v), transparent: true, depthTest: false })); s.renderOrder = 12; s.scale.set(3.2, 1.5, 1); const start = card.position.clone().add(new THREE.Vector3(pl * 1.6 - 1.6, 1, 2.6)); s.position.copy(start); ctx.fx.add(s);
    await tween(.5, (e, k) => { s.position.y = start.y + 2.2 * e; s.material.opacity = Math.min(1, k * 3); }, 'back'); if (v !== null) await tween(.25, k => card.position.y = 1 + Math.sin(k * Math.PI) * .4, 'lin'); await wait(.35); await tween(.3, (e, k) => s.material.opacity = 1 - k, 'lin'); ctx.FX.kill(s); },
  async animCardMove(ctx, c, to, sc) { const s0 = c.scale.x; await tween(1.1, e => { c.position.lerpVectors(c.userData.from ||= c.position.clone(), to, e); c.position.y += Math.sin(e * Math.PI) * 6; c.rotation.x = Math.sin(e * Math.PI) * -.4; c.scale.setScalar(lerp(s0, sc, e)); }, 'inout'); c.userData.from = null; c.rotation.x = 0; },
  async animCardAway(ctx, c, to) { const a = c.position.clone(); await tween(1.2, (e, k) => { c.position.lerpVectors(a, to, e); c.position.y += Math.sin(e * Math.PI) * 9; c.rotation.y = e * 2; c.scale.setScalar(1 - .7 * e); }, 'inout'); },
  async animDraw(ctx, c) { const a = c.position.clone(); await tween(.8, e => { c.position.set(a.x + 4 * e, a.y + Math.sin(e * Math.PI) * 4 + .1, a.z - 2 * e); c.rotation.z = Math.PI * (1 - e); }, 'inout'); },
  async animBurn(ctx, p) { const a = p.m.position.clone(); const f = ctx.FX.sprite(ctx.P.flame || '#ff8a3c', .1); await tween(.5, e => p.m.position.y = a.y + e * 1.8, 'out'); await tween(.6, (e, k) => { p.m.scale.setScalar(1 - e); f.position.copy(p.m.position); f.scale.setScalar(.2 + 2.2 * Math.sin(k * Math.PI)); }, 'in'); p.m.parent && p.m.parent.remove(p.m); ctx.FX.kill(f); },
  async animPower(ctx, seqs) { await Promise.all(seqs.map(async ({ pl, order }) => { for (const [id, from, lo] of order) { if (lo) { const s = ctx.FX.sprite(this.pulseCol ? this.pulseCol(ctx, pl) : '#ffd98a', 1.8), rev = lo.l.e && ctx.EDGESref ? 0 : 0; const fwd = lo.ends && CITY[from] && Math.hypot(lo.ends.a.x - CITY[from].X, lo.ends.a.z - CITY[from].Z) < 2; await tween(.55, e => s.position.copy(alongLine(lo.ends, fwd ? e : 1 - e, .6)), 'inout'); ctx.FX.kill(s); } const c = CITY[id]; ctx.FX.ripple(new THREE.Vector3(c.X, 0, c.Z), ctx.P.players[pl], 3, .9); const g = ctx.FX.sprite('#ffd98a', .5); g.position.set(c.X, 1.2, c.Z); tween(.9, (e, k) => { g.scale.setScalar(.5 + 4 * Math.sin(k * Math.PI)); }, 'out').then(() => ctx.FX.kill(g)); } })); },
  async intro(ctx) { const hs = []; Object.values(ctx.cityG).forEach(g => g.userData.houses.forEach(h => h && hs.push(h))); hs.forEach(h => h.scale.setScalar(.001)); ctx.lineObjs.forEach(l => l.set(0)); await ctx.view({ t: [0, 0, 0], d: 210, pol: .25, az: -.6 }, 0); const cam = ctx.view('overview', 3.2);
    await wait(1.2); await Promise.all(ctx.lineObjs.map((l, i) => wait(i * .12).then(() => tween(.9, e => l.set(e), 'inout')))); await Promise.all(hs.map((h, i) => wait(i * .07).then(() => tween(.55, e => h.scale.setScalar(Math.max(.001, e)), 'spring')))); await cam; },
};

// ---------- Karten-Grundzeichnung (alle Themes): Regionen, Flüsse, Verbindungen mit Kosten, Städtenamen ----------
import { EDGES } from './table.js';
export { EDGES };
export function drawMapBasic(x, MAP, P, o) {
  x.fillStyle = o.land; x.fillRect(0, 0, MAP.w, MAP.h);
  MAP.regions.forEach((r, i) => { const p = new Path2D(r.d); if (o.regionFill) { x.fillStyle = o.regionFill(i, r); x.fill(p); } if (o.regionPattern) { x.save(); x.clip(p); o.regionPattern(x, i, r); x.restore(); } if (o.regionStroke) { x.strokeStyle = o.regionStroke; x.lineWidth = o.regionW || 1; x.setLineDash(o.regionDash || []); x.stroke(p); x.setLineDash([]); } });
  o.under && o.under(x);
  if (o.river) MAP.rivers.forEach(d => { x.strokeStyle = o.river; x.lineWidth = o.riverW || 1.4; x.lineCap = 'round'; x.stroke(new Path2D(d)); });
  const C = {}; MAP.cities.forEach(c => C[c.id] = c);
  EDGES.forEach(e => { const A = C[e.a], B = C[e.b], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, t = 10; x.strokeStyle = o.edge; x.lineWidth = o.edgeW || 1; x.setLineDash(o.edgeDash || []); x.lineCap = 'round'; x.beginPath(); x.moveTo(A.x + ux * t, A.y + uy * t); x.lineTo(B.x - ux * t, B.y - uy * t); x.stroke(); x.setLineDash([]);
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2; if (o.cost !== false) { x.font = o.costFont || '600 6px sans-serif'; const w = x.measureText(String(e.cost)).width + 4; x.fillStyle = o.costBox; if (o.costRound) { x.beginPath(); x.arc(mx, my, 4.4, 0, 7); x.fill(); } else { rr(x, mx - w / 2, my - 3.6, w, 7.2, 1.6); x.fill(); } if (o.costLine) { x.strokeStyle = o.costLine; x.lineWidth = .5; x.stroke(); } x.fillStyle = o.costInk; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(e.cost), mx, my + .3); } });
  if (o.cityPad) MAP.cities.forEach(c => { x.fillStyle = o.cityPad; x.beginPath(); x.arc(c.x, c.y, o.cityPadR || 9, 0, 7); x.fill(); });
  MAP.cities.forEach(c => { const s = o.labelUpper ? c.name.toUpperCase() : c.name; x.font = o.labelFont || '600 6.5px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; if (o.labelHalo) { x.lineWidth = 2.2; x.strokeStyle = o.labelHalo; x.lineJoin = 'round'; x.strokeText(s, c.x, c.y + (o.labelDy || 15)); } x.fillStyle = o.label; x.fillText(s, c.x, c.y + (o.labelDy || 15)); });
  o.over && o.over(x);
}
export function gridTex(bg, minor, major, size = 1024, cells = 16, rep = 30) { const t = canvasTex(size, size, (x, w) => { x.fillStyle = bg; x.fillRect(0, 0, w, w); const s = w / cells; for (let i = 0; i <= cells; i++) { x.strokeStyle = i % 4 ? minor : major; x.lineWidth = i % 4 ? 1 : 2; x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, w); x.moveTo(0, i * s); x.lineTo(w, i * s); x.stroke(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t; }
export function noiseTex(bg, amt = 18, size = 512, rep = 24, fibers = false) { const t = canvasTex(size, size, (x, w) => { x.fillStyle = bg; x.fillRect(0, 0, w, w); const id = x.getImageData(0, 0, w, w), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(id, 0, 0); if (fibers) { x.strokeStyle = 'rgba(80,60,30,.08)'; for (let i = 0; i < 400; i++) { const a = Math.random() * w, b = Math.random() * w, r = Math.random() * 6.28; x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.cos(r) * 14, b + Math.sin(r) * 14); x.stroke(); } } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t; }
