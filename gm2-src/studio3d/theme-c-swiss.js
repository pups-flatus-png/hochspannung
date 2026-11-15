// Konzept C – Swiss Signal 3D: Liniennetzplan als Spielzeugmodell. Kräftige Flächen, dicke Linien, knackige Bewegung.
import { THREE, RoundedBoxGeometry, drawMapBasic, trefoilTex, strip, alongLine, lerp, tween, wait, canvasTex, EDGES } from './base.js';
const mat = o => new THREE.MeshStandardMaterial({ roughness: .55, metalness: 0, ...o });
function wedge(i, r0 = .98, r1 = 1.38, hgt = .36) { const a0 = Math.PI / 2 + i * 2.0944 + .07, a1 = a0 + 2.0944 - .14, s = new THREE.Shape(); s.absarc(0, 0, r1, a0, a1, false); s.absarc(0, 0, r0, a1, a0, true); const g = new THREE.ExtrudeGeometry(s, { depth: hgt, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2, curveSegments: 24 }); g.rotateX(-Math.PI / 2); return g; }
export default {
  meta: {
    key: 'C', name: 'Swiss Signal', gf: 'family=Archivo:wght@600;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700',
    tagline: 'Ein Liniennetzplan als Spielzeugmodell: kräftige Farbflächen, dicke Linien wie Bahnstrecken, Stationsringe, die sich Firma für Firma füllen.',
    keywords: ['Liniennetz', 'Spielzeug-Modell', 'Knackige Bewegung', 'Hell zuerst'], idea: 'Ein Netz, das wie ein Verkehrsplan funktioniert und sich wie Spielzeug anfühlt.',
    principles: [['Formen statt Effekte', 'Kreise, Bänder, Blöcke. Alles matt und farbig, nichts glänzt. Farbe trägt die Information.'], ['Bewegung mit Haltung', 'Teile schnellen mit kleinem Überschwung an ihren Platz, ein Zug-Block führt jede neue Linie.'], ['Zahlen sind Helden', 'Kosten stehen in runden Plaketten auf jeder Strecke, Preise groß auf dem Markt.']],
    fonts: { display: 'Archivo', text: 'Inter', mono: 'JetBrains Mono' },
    swatches: [['Grund', '#f2f1ec'], ['Schrift', '#111111'], ['Signal', '#e1251b'], ['Du', '#e1251b'], ['Rhein AG', '#1f5bff'], ['Isar', '#00a37a']],
    design: {
      map: 'Matte Platte, Regionen in kräftigen Pastellflächen mit weißen Fugen, Kosten in runden Plaketten.',
      market: 'Weißes Steckbrett mit großen Preiszahlen; Stücke als robuste Spielzeugteile: Kohlewürfel, Fass mit Reifen, Sack, Uranfass.',
      plants: 'Karten mit breitem Farbband und riesiger Nummer.',
      player: 'Weiße Ablage mit runden Lagermulden, Münzen als Spielchips.',
      track: 'Fahrplanleiste mit Städten, Einkommen und Reihenfolge.',
      marketLong: 'Ein weißes Steckbrett, große Preise, die Stücke sind griffige Spielzeugteile in klaren Farben. Kaufen ist schnell und rhythmisch.',
      marketItems: [['Kaufen', 'Die Stücke hüpfen nacheinander ins Lager, jeder Sprung im Takt.'], ['Nachschub', 'Neue Stücke fallen reihenweise und schnappen auf ihr Feld.'], ['Lesbarkeit', 'Preis pro Feld groß und schwarz, die günstigsten freien Felder sind sofort erkennbar.']],
      cityLong: 'Jede Stadt ist ein Stationsring. Jede Firma setzt ein Drittel des Rings in ihrer Farbe ein, bis der Ring voll ist. Leitungen sind dicke, runde Bänder wie Bahnlinien.',
      cityItems: [['Bauen', 'Ein kleiner Zug-Block fährt voraus und zieht das Band hinter sich her, die Kosten zählen hoch.'], ['Wachsen', 'Das Ringsegment schnappt mit Überschwung ein, „+1“ springt hoch.'], ['Geteilte Strecken', 'Mehrere Firmen auf einer Strecke liegen als parallele Bänder nebeneinander.']],
      plantsLong: 'Große, klare Karten. Gebote erscheinen als Balken-Plaketten in Spielerfarbe, die Siegerkarte gleitet in deinen Bereich.',
      plantsItems: [['Auswahl', 'Die Karte springt hoch.'], ['Gebote', 'Plaketten schnellen nacheinander hoch.'], ['Nachziehen', 'Die neue Karte klappt auf, alle rutschen in die richtige Reihenfolge.']],
      bureauLong: 'Ein klarer Takt: Lager leeren, Züge fahren durch die Netze, Chips springen in die Kasse, Markt füllen.',
    },
    verdictTitle: 'Sauber, freundlich, sehr gut lesbar',
    strengths: ['Klarste Lesbarkeit aller Konzepte, auch auf dem iPhone', 'Wirkt modern und eigenständig, erinnert nicht an andere Spiele', 'Technisch leicht: matte Materialien, kaum Effekte'],
    risks: ['Weniger „Energie“-Atmosphäre als B', 'Spielzeug-Look könnte für Vielspieler zu verspielt wirken'],
    effort: 'Niedrig bis mittel. Einfache Formen, kein Post-Processing, sehr gute Leistung.', fit: 'Hoch: flach mit minimaler Tiefe, klare Märkte und animierte Abläufe.',
  },
  vars: {
    light: { '--bg': '#f2f1ec', '--surface': '#ffffff', '--ink': '#111111', '--muted': '#5d5d5d', '--line': '#dddcd5', '--accent': '#e1251b', '--accent-ink': '#fff', '--stagebg': '#e9e8e2', '--frame': '#111', '--fd': 'Archivo,sans-serif', '--ft': 'Inter,sans-serif', '--fm': '"JetBrains Mono",monospace', '--radius': '18px', '--bradius': '99px', '--h1w': '900' },
    dark: { '--bg': '#121212', '--surface': '#1d1d1d', '--ink': '#f4f4f0', '--muted': '#a3a3a0', '--line': '#2d2d2d', '--accent': '#ff3b30', '--accent-ink': '#fff', '--stagebg': '#161616', '--frame': '#000', '--fd': 'Archivo,sans-serif', '--ft': 'Inter,sans-serif', '--fm': '"JetBrains Mono",monospace', '--radius': '18px', '--bradius': '99px', '--h1w': '900' },
  },
  startMode: 'light', font: 'Archivo',
  palette(mode) { const d = mode === 'dark'; return d ? { bg: '#161616', table: '#1f1f1f', edge: '#f4f4f0', exposure: .95, env: .3, hemi: .9, sky: '#ffffff', ground: '#222', keyI: 1.4, fillI: .3, players: ['#ff3b30', '#3d7bff', '#12c08f'], accent: '#ff3b30', neg: '#ff6a5a', coin: '#f4f4f0', dark: true, mapDepth: .4 }
    : { bg: '#e9e8e2', table: '#e2e0d8', edge: '#ffffff', exposure: .82, env: .35, hemi: .95, sky: '#ffffff', ground: '#9b978c', keyI: 1.35, fillI: .3, players: ['#e1251b', '#1f5bff', '#00a37a'], accent: '#e1251b', neg: '#e1251b', coin: '#ffffff', mapDepth: .4 }; },
  board(P) { const d = P.dark; return { bg: d ? '#222' : '#ffffff', ink: d ? '#f4f4f0' : '#111', muted: d ? '#a3a3a0' : '#6b6b6b', cell: d ? '#2c2c2c' : '#f0efe9', cellR: 14, slot: d ? '#555' : '#c9c8c0', dash: [1, 0], upper: true, hot: P.accent,
    title: '900 44px Archivo', small: '700 22px Inter', tiny: '600 17px Inter', num: '800 30px Archivo', card: '#ffffff', cardStyle: 'band', cardFont: 'Archivo', cardText: 'Inter', cardInk: '#111', cardMuted: '#6b6b6b', back: '#111', backText: 'GM2', cardTitle: '900 60px Archivo', tag: '#ffffff', tagInk: '#111' }; },
  drawMap(x, MAP, P) { const d = P.dark, T = d ? ['#5a4a14', '#173a5c', '#5c2830', '#1f4a36', '#3d2f5a', '#5c3a1c'] : ['#ffe27a', '#bfe0ff', '#ffc6c6', '#bfe8cf', '#ddd0ff', '#ffd5ad'];
    drawMapBasic(x, MAP, P, { land: d ? '#1d1d1d' : '#ffffff', regionFill: i => T[i % 6], regionStroke: d ? '#1d1d1d' : '#ffffff', regionW: 2.6, river: d ? '#3d7bff' : '#6da6e8', riverW: 1.6,
      edge: d ? 'rgba(244,244,240,.35)' : 'rgba(17,17,17,.3)', edgeW: .8, costBox: d ? '#f4f4f0' : '#111', costInk: d ? '#111' : '#fff', costRound: true, costFont: '700 5.4px "JetBrains Mono"',
      label: d ? '#f4f4f0' : '#111', labelFont: '800 6px Archivo', labelUpper: true, labelHalo: d ? 'rgba(29,29,29,.85)' : 'rgba(255,255,255,.9)', labelDy: 16 }); },
  cityBase(ctx, c) { const g = new THREE.Group(), P = ctx.P; const disc = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .18, 40), mat({ color: '#ffffff' })); disc.position.y = .09; disc.castShadow = true; disc.receiveShadow = true; const ring = new THREE.Mesh(new THREE.TorusGeometry(.8, .13, 10, 40), mat({ color: '#111' })); ring.rotation.x = Math.PI / 2; ring.position.y = .2; ring.castShadow = true;
    const track = new THREE.Mesh(new THREE.RingGeometry(.98, 1.38, 48), mat({ color: P.dark ? '#333' : '#e6e5df' })); track.rotation.x = -Math.PI / 2; track.position.y = .015; g.add(track, disc, ring); return g; },
  house(ctx, pl, c, i) { const m = new THREE.Mesh(wedge(i), mat({ color: ctx.P.players[pl] })); m.castShadow = true; m.receiveShadow = true; const g = new THREE.Group(); g.add(m); g.userData.centered = true; return g; },
  line(ctx, ends, pl) { const o = strip(ends, .48, .16, mat({ color: ctx.P.players[pl] }), .02, true); return { obj: o.obj, set: o.set }; },
  resStyle: { chunky: true },
  resMats(ctx, k) { if (k === 'coal') return { body: mat({ color: '#141414' }) }; if (k === 'oil') return { body: mat({ color: '#1f2a44' }), rib: mat({ color: '#ffffff' }) }; if (k === 'garbage') return { body: mat({ color: '#ffc400' }), rib: mat({ color: '#111' }) }; return { body: mat({ color: '#e1251b' }), band: mat({ color: '#ffffff' }), top: mat({ map: trefoilTex('#ffd400', '#111') }) }; },
  coinMat(ctx) { return mat({ color: ctx.P.coin, roughness: .4 }); },
  disc(ctx, pl) { const g = new THREE.Group(); const d = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .3, 32), mat({ color: ctx.P.players[pl] })); d.position.y = .15; const r = new THREE.Mesh(new THREE.TorusGeometry(.85, .06, 8, 32), mat({ color: '#111' })); r.rotation.x = Math.PI / 2; r.position.y = .3; g.add(d, r); g.traverse(c => c.isMesh && (c.castShadow = true)); return g; },
  async animLine(ctx, lo, A, B, pl) { const e = lo.ends, P = ctx.P; const train = new THREE.Group(); const body = new THREE.Mesh(new RoundedBoxGeometry(1.1, .42, .56, 3, .14), mat({ color: '#111' })); body.position.y = .3; const win = new THREE.Mesh(new THREE.BoxGeometry(.7, .1, .58), mat({ color: P.players[pl] })); win.position.y = .38; train.add(body, win); train.traverse(c => c.isMesh && (c.castShadow = true)); train.rotation.y = -Math.atan2(e.uz, e.ux); ctx.fx.add(train);
    const cost = EDGES[lo.l.e].cost; let shown = -1; await tween(.35 + e.L * .035, k => { lo.set(k); train.position.copy(alongLine(e, k, .02)); const v = Math.round(cost * k); if (v !== shown && (v % 2 === 0 || v === cost)) shown = v; }, 'snap'); ctx.FX.label(cost + ' €', alongLine(e, .5, 1.6), P.dark ? '#fff' : '#111', 1.2, .9);
    await tween(.25, (x, k) => train.scale.setScalar(1 - k), 'in'); ctx.fx.remove(train); },
  async animHouse(ctx, h, c, pl) { const m = h.children[0]; m.scale.set(1, .001, 1); h.rotation.y = -.8; await tween(.55, e => { m.scale.y = Math.max(.001, e); h.rotation.y = -.8 * (1 - e); }, 'snap'); ctx.FX.label('+1', new THREE.Vector3(c.X, 2, c.Z), ctx.P.players[pl], 1.1, 1.1); ctx.FX.ripple(new THREE.Vector3(c.X, 0, c.Z), ctx.P.players[pl], 2.4, .6); await wait(.2); },
  async animBuy(ctx, p, dest, price) { ctx.FX.label(price + ' €', p.m.position.clone().add(new THREE.Vector3(0, 1.4, 0)), ctx.P.dark ? '#fff' : '#111', .9, .8); const a = p.m.position.clone(); await tween(.75, e => { p.m.position.lerpVectors(a, dest, e); p.m.position.y += Math.abs(Math.sin(e * Math.PI * 2)) * 2.5 + Math.sin(e * Math.PI) * 3; }, 'lin'); await tween(.18, k => p.m.scale.set(1 + .25 * Math.sin(k * Math.PI), 1 - .25 * Math.sin(k * Math.PI), 1 + .25 * Math.sin(k * Math.PI)), 'lin'); },
  async animRestock(ctx, p, n) { const to = p.m.position.clone(); p.m.visible = false; await wait(Math.floor(n / 2) * .09); p.m.visible = true; await tween(.4, e => p.m.position.y = lerp(9, to.y, e), 'in'); await tween(.2, k => p.m.scale.set(1 + .3 * Math.sin(k * Math.PI), 1 - .3 * Math.sin(k * Math.PI), 1 + .3 * Math.sin(k * Math.PI)), 'lin'); },
  pulseCol: (ctx, pl) => ctx.P.players[pl],
  async animPower(ctx, seqs) { const P = ctx.P; await Promise.all(seqs.map(async ({ pl, order }) => { for (const [id, from, lo] of order) { if (lo) { const t = new THREE.Mesh(new RoundedBoxGeometry(.8, .34, .44, 2, .12), mat({ color: '#111' })); t.rotation.y = -Math.atan2(lo.ends.uz, lo.ends.ux); ctx.fx.add(t); const C = ctx.cityG[from].position, fwd = Math.hypot(lo.ends.a.x - C.x, lo.ends.a.z - C.z) < 2; await tween(.5, e => t.position.copy(alongLine(lo.ends, fwd ? e : 1 - e, .35)), 'snap'); ctx.fx.remove(t); } const g = ctx.cityG[id]; tween(.4, (e, k) => g.scale.setScalar(1 + .25 * Math.sin(k * Math.PI)), 'lin'); ctx.FX.ripple(g.position.clone(), P.players[pl], 2.6, .6); } })); },
};
