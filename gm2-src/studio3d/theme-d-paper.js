// Konzept D – Paper Craft 3D: ein Brettspiel aus Schichtpapier. Pop-up-Häuser, Papierstreifen, Papierschnipsel.
import { THREE, drawMapBasic, noiseTex, trefoilTex, strip, alongLine, lerp, tween, wait, canvasTex } from './base.js';
const mat = o => new THREE.MeshStandardMaterial({ roughness: .95, metalness: 0, ...o });
export default {
  meta: {
    key: 'D', name: 'Paper Craft', gf: 'family=Fraunces:opsz,wght@9..144,600;9..144,800&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@500',
    tagline: 'Ein Brettspiel aus Schichtpapier auf dem Holztisch: Regionen als Papierlagen, Leitungen als Papierstreifen, Städte klappen wie im Pop-up-Buch auf.',
    keywords: ['Schichtpapier', 'Pop-up-Häuser', 'Warme Töne', 'Dunkel = Kohlepapier'], idea: 'Das Gefühl eines echten Brettspiels, digital und lebendig.',
    principles: [['Fühlbar', 'Papier, Karton, Holz. Weiche Schatten statt Glanz. Jede Lage liegt sichtbar auf der anderen.'], ['Pop-up statt Spektakel', 'Häuser klappen auf, Streifen rollen sich aus, Schnipsel fliegen. Freundlich, nie hektisch.'], ['Warm und ruhig', 'Kraftpapier, Terrakotta, gedeckte Spielerfarben, eine Serifenschrift mit Charakter.']],
    fonts: { display: 'Fraunces', text: 'DM Sans', mono: 'DM Mono' },
    swatches: [['Kraft', '#c9b48f'], ['Papier', '#f3ead8'], ['Kohlepapier', '#2b2824'], ['Du', '#c8553d'], ['Rhein AG', '#4a6fa5'], ['Isar', '#5b8c5a']],
    design: {
      map: 'Dicker Karton, Regionen als aufgeklebte Papierlagen in Pastell, Trassen als gestrichelte Naht mit Kosten.',
      market: 'Kartontablett mit gestempelten Preisen; Stücke als gefaltete Papiermodelle: kantiger Kohlebrocken, Fass, Sack, Uranfass.',
      plants: 'Karten aus dickem Papier mit Eselsohr, Spalten als aufgeklebte Fächer.',
      player: 'Kartonablage mit gestanzten Lagermulden, Münzen aus Pappe.',
      track: 'Gestanzte Kartonleiste mit Städten, Einkommen und Reihenfolge.',
      marketLong: 'Ein Kartontablett mit gestempelten Preisen. Die Stücke sind kleine Papiermodelle mit sichtbaren Kanten, warm und matt.',
      marketItems: [['Kaufen', 'Stücke heben ab, ihr Schatten wird größer, sie landen weich im Lager.'], ['Nachschub', 'Neue Stücke fallen leicht schaukelnd wie Papier und federn aus.'], ['Verbrennen', 'Stücke steigen auf und zerfallen in Papierfunken.']],
      cityLong: 'Jede Stadt ist ein Papierteller. Jede Firma klappt ein kleines Papierhaus in ihrer Farbe auf, die Stadt wächst zu einem kleinen Dorf.',
      cityItems: [['Bauen', 'Eine Papierrolle rollt die Trasse entlang und hinterlässt den Streifen.'], ['Wachsen', 'Das Haus klappt wie im Pop-up-Buch auf, bunte Schnipsel fliegen.'], ['Erreichbar', 'Ein gestrichelter Kreis markiert, wohin du bauen kannst.']],
      plantsLong: 'Kraftwerke sind dicke Papierkarten. Gebote hängen als kleine Anhänger über der Karte und schaukeln.',
      plantsItems: [['Auswahl', 'Die Karte hebt sich mit wachsendem Schatten.'], ['Gebote', 'Anhänger in Spielerfarbe schaukeln über der Karte.'], ['Gewinn', 'Die Karte segelt drehend in deinen Bereich.']],
      bureauLong: 'Gemütlicher Takt: Papierfunken im Lager, warme Lichtpunkte im Netz, Pappmünzen aus der Bank.',
    },
    verdictTitle: 'Warm, zugänglich, sehr „Brettspiel“',
    strengths: ['Fühlt sich am meisten nach echtem Brettspiel an', 'Spricht auch Gelegenheitsspieler an', 'Weiche Schatten geben Tiefe ohne billigen Glanz'],
    risks: ['Weniger Energie- und Technik-Charakter', 'Texturen müssen fein dosiert sein, sonst wirkt es verspielt'],
    effort: 'Mittel. Einfache Low-Poly-Modelle, weiche Schatten, kein Post-Processing.', fit: 'Mittel bis hoch: flach mit minimaler Tiefe, in eine wärmere Richtung.',
  },
  vars: {
    light: { '--bg': '#e6dfcf', '--surface': '#f5efe2', '--ink': '#2e2a25', '--muted': '#786f62', '--line': '#d3c7b0', '--accent': '#c8553d', '--accent-ink': '#fff', '--stagebg': '#d9cfb9', '--frame': '#3a332b', '--fd': 'Fraunces,serif', '--ft': '"DM Sans",sans-serif', '--fm': '"DM Mono",monospace', '--radius': '18px', '--bradius': '12px', '--h1w': '800' },
    dark: { '--bg': '#22201d', '--surface': '#2d2a26', '--ink': '#f1e9dc', '--muted': '#a99f8f', '--line': '#3f3a34', '--accent': '#e07a5f', '--accent-ink': '#22201d', '--stagebg': '#1c1a17', '--frame': '#0f0e0c', '--fd': 'Fraunces,serif', '--ft': '"DM Sans",sans-serif', '--fm': '"DM Mono",monospace', '--radius': '18px', '--bradius': '12px', '--h1w': '800' },
  },
  startMode: 'light', font: 'Fraunces',
  palette(mode) { const d = mode === 'dark'; return d ? { bg: '#1c1a17', table: '#ffffff', edge: '#4a443b', exposure: .95, env: .25, hemi: .7, sky: '#ffe9c8', ground: '#1a1816', keyI: 1.5, key: '#ffd9a8', fillI: .2, players: ['#e07a5f', '#7c9cd3', '#86b37f'], accent: '#e07a5f', neg: '#e07a5f', coin: '#9b7a4a', dark: true, mapDepth: .3, boardDepth: .3 }
    : { bg: '#d9cfb9', table: '#ffffff', edge: '#e9dcc0', exposure: .85, env: .35, hemi: .9, sky: '#fff6e6', ground: '#8a7656', keyI: 1.5, key: '#fff0d8', fillI: .25, players: ['#c8553d', '#4a6fa5', '#5b8c5a'], accent: '#c8553d', neg: '#c8553d', coin: '#b08d57', mapDepth: .3, boardDepth: .3 }; },
  tableTex(P) { return P.dark ? noiseTex('#2b2824', 14, 512, 18, true) : noiseTex('#b89e74', 16, 512, 18, true); },
  board(P) { const d = P.dark; return { bg: d ? '#36312a' : '#efe5cf', ink: d ? '#f1e9dc' : '#2e2a25', muted: d ? '#a99f8f' : '#786f62', cell: d ? '#2c2823' : '#e2d5b9', cellR: 12, slot: d ? '#6b6153' : '#b5a483', upper: false, hot: P.accent,
    title: '800 44px Fraunces', small: '500 23px "DM Sans"', tiny: '500 17px "DM Sans"', num: '500 26px "DM Mono"', card: '#f6efe0', cardStyle: 'circle', cardFont: 'Fraunces', cardText: '"DM Sans"', cardInk: '#2e2a25', cardMuted: '#786f62', back: P.accent, backText: 'Kraftwerk', cardTitle: '800 46px Fraunces', tag: '#f6efe0', tagInk: '#2e2a25',
    decor: (x, w, h) => { const id = x.getImageData(0, 0, w, h), dd = id.data; for (let i = 0; i < dd.length; i += 4) { const n = (Math.random() - .5) * 10; dd[i] += n; dd[i + 1] += n; dd[i + 2] += n; } x.putImageData(id, 0, 0); } }; },
  drawMap(x, MAP, P) { const d = P.dark, T = d ? ['#5a4b30', '#33465a', '#5a3a34', '#3a4f39', '#463d58', '#5a4430'] : ['#ecd08a', '#a9c6dd', '#ecb6a8', '#b9d0b0', '#cdbfe3', '#f1c595'];
    drawMapBasic(x, MAP, P, { land: d ? '#3a352e' : '#f3ead8', regionFill: i => T[i % 6], regionPattern: (x, i, r) => { x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 6; x.shadowOffsetY = 1.5; x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 3; x.stroke(new Path2D(r.d)); x.shadowColor = 'transparent'; },
      regionStroke: d ? 'rgba(241,233,220,.35)' : 'rgba(255,255,255,.8)', regionW: 1.2, river: d ? '#6f93b8' : '#6f9ac4', riverW: 1.4,
      edge: d ? 'rgba(241,233,220,.45)' : 'rgba(46,42,37,.45)', edgeW: .8, edgeDash: [2, 2.2], costBox: d ? '#f1e9dc' : '#fffaf0', costLine: d ? 'rgba(0,0,0,.3)' : 'rgba(46,42,37,.3)', costInk: '#2e2a25', costRound: true, costFont: '600 5.4px "DM Mono"',
      label: d ? '#f1e9dc' : '#2e2a25', labelFont: '600 6.4px Fraunces', labelHalo: d ? '#3a352e' : '#f3ead8', labelDy: 15 }); },
  cityBase(ctx, c) { const g = new THREE.Group(), P = ctx.P; const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .06, 36), mat({ color: P.dark ? '#d8ccb6' : '#fbf6ea' })); plate.position.y = .03; plate.castShadow = true; plate.receiveShadow = true; g.add(plate);
    const st = new THREE.Mesh(new THREE.RingGeometry(.95, 1.0, 36), new THREE.MeshBasicMaterial({ color: '#b5a483' })); st.rotation.x = -Math.PI / 2; st.position.y = .062; g.add(st); return g; },
  house(ctx, pl, c, i) { const P = ctx.P, m = mat({ color: P.players[pl], flatShading: true }), g = new THREE.Group(), inner = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(.46, .34, .4), m); body.position.y = .17; const roofGeo = new THREE.CylinderGeometry(.33, .33, .44, 3, 1); roofGeo.rotateZ(Math.PI / 2); roofGeo.rotateX(Math.PI / 6 + Math.PI / 2); const roof = new THREE.Mesh(roofGeo, mat({ color: new THREE.Color(P.players[pl]).multiplyScalar(.82), flatShading: true })); roof.position.y = .42; roof.scale.set(1, .7, 1);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(.11, .17), mat({ color: '#f3ead8' })); door.position.set(0, .09, .201); inner.add(body, roof, door); inner.traverse(o => o.isMesh && (o.castShadow = true)); inner.position.z = -.2; g.add(inner); g.userData.inner = inner; inner.position.z = 0; return g; },
  line(ctx, ends, pl) { const o = strip(ends, .42, .035, mat({ color: ctx.P.players[pl] }), .02, false); return { obj: o.obj, set: o.set }; },
  resStyle: { lowpoly: true },
  resMats(ctx, k) { const f = { flatShading: true }; if (k === 'coal') return { body: mat({ color: '#3a3530', ...f }) }; if (k === 'oil') return { body: mat({ color: '#3d4a5a', ...f }), rib: mat({ color: '#c9c0ad', ...f }) }; if (k === 'garbage') return { body: mat({ color: '#e9c46a', ...f }), rib: mat({ color: '#a8862e' }) }; return { body: mat({ color: '#c8553d', ...f }), band: mat({ color: '#f3ead8' }), top: mat({ map: trefoilTex('#f4d35e', '#3a3530') }) }; },
  coinMat(ctx) { return mat({ color: ctx.P.coin, roughness: 1 }); },
  async animLine(ctx, lo, A, B, pl) { const e = lo.ends, P = ctx.P; const roll = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .44, 18), mat({ color: P.players[pl] })); roll.rotation.order = 'YXZ'; roll.rotation.y = -Math.atan2(e.uz, e.ux) + Math.PI / 2; roll.rotation.x = Math.PI / 2; roll.castShadow = true; ctx.fx.add(roll);
    await tween(.6 + e.L * .06, k => { lo.set(k); const r = .34 * (1 - k * .7) + .04; roll.scale.set(r, 1, r); const p = alongLine(e, k, r + .02); roll.position.copy(p); roll.rotation.z = -k * e.L / .25; }, 'inout'); ctx.fx.remove(roll); },
  async animHouse(ctx, h, c, pl) { const inner = h.userData.inner; inner.rotation.x = -Math.PI / 2; await wait(.05); await tween(.8, e => inner.rotation.x = -Math.PI / 2 * (1 - e), 'spring');
    const P = ctx.P; ctx.FX.burst(new THREE.Vector3(c.X, 1, c.Z), [P.players[pl], '#ecd08a', '#a9c6dd', '#ecb6a8', '#b9d0b0'], 30, { speed: 3.5, up: 6, g: 6, life: 1.6, mesh: col => new THREE.Mesh(new THREE.PlaneGeometry(.2, .12), new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 1 })) }); await wait(.3); },
  async animRestock(ctx, p, n) { const to = p.m.position.clone(); p.m.visible = false; await wait(n * .08); p.m.visible = true; await tween(1.1, (e, k) => { p.m.position.set(to.x + Math.sin(k * 9) * .5 * (1 - k), lerp(10, to.y, e), to.z); p.m.rotation.z = Math.sin(k * 9) * .5 * (1 - k); }, 'out'); },
  async animBid(ctx, card, pl, v) { const P = ctx.P; const tex = canvasTex(220, 260, (x) => { x.fillStyle = '#f6efe0'; x.beginPath(); x.moveTo(40, 60); x.lineTo(110, 10); x.lineTo(180, 60); x.lineTo(180, 250); x.lineTo(40, 250); x.closePath(); x.fill(); x.fillStyle = '#2e2a25'; x.beginPath(); x.arc(110, 52, 10, 0, 7); x.fill(); x.fillStyle = P.players[pl]; x.beginPath(); x.arc(110, 120, 30, 0, 7); x.fill(); x.font = '800 46px Fraunces'; x.fillStyle = '#2e2a25'; x.textAlign = 'center'; x.fillText(v === null ? 'passt' : v + ' €', 110, 210); });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.8), new THREE.MeshStandardMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, roughness: 1 })); s.castShadow = true; const piv = new THREE.Group(); piv.position.copy(card.position).add(new THREE.Vector3(pl * 1.7 - 1.7, 3.6, 1.6)); s.position.y = -.9; piv.add(s); ctx.fx.add(piv);
    await tween(1.2, (e, k) => { piv.rotation.z = Math.sin(k * 12) * .5 * (1 - k); piv.rotation.x = -.5; s.material.opacity = Math.min(1, k * 4); }, 'lin'); await tween(.3, (e, k) => s.material.opacity = 1 - k, 'lin'); ctx.fx.remove(piv); },
};
