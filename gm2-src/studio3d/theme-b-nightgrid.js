// Konzept B – Night Grid 3D: Deutschland bei Nacht. Skylines wachsen mit jedem Versorger, Energie fließt sichtbar.
import { THREE, RoundedBoxGeometry, drawMapBasic, noiseTex, trefoilTex, strip, alongLine, lerp, tween, wait, canvasTex, rng, CITY } from './base.js';
const mat = o => new THREE.MeshStandardMaterial({ roughness: .6, metalness: 0, ...o });
let WIN = null; const winTex = () => WIN ||= (() => { const t = canvasTex(64, 128, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, 64, 128); const r = rng('w'); for (let j = 0; j < 12; j++) for (let i = 0; i < 4; i++) { x.fillStyle = r() < .72 ? '#fff' : '#333'; x.fillRect(5 + i * 15, 4 + j * 10, 9, 6); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
export default {
  meta: {
    key: 'B', name: 'Night Grid', gf: 'family=Orbitron:wght@700;800&family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@500',
    tagline: 'Deutschland bei Nacht als dunkler Spieltisch: Jede versorgte Stadt bekommt eine leuchtende Skyline, Leitungen glühen, Energie fließt ständig durch die Netze.',
    keywords: ['Nachtkarte', 'Wachsende Skylines', 'Leuchtende Netze', 'Hell = Dämmerung'], idea: 'Energie, die man sehen kann.',
    principles: [['Licht ist Information', 'Nur was zu einem Netz gehört, leuchtet. Der Rest bleibt ruhig und dunkel.'], ['Städte wachsen', 'Jede Firma baut einen Turm in ihrer Farbe. Eine Stadt mit drei Versorgern ist sichtbar eine Großstadt.'], ['Ständiger Fluss', 'Kleine Lichtpunkte laufen dauerhaft durch jedes Netz. Beim Strom liefern rasen sie und Städte strahlen auf.']],
    fonts: { display: 'Orbitron', text: 'Barlow', mono: 'JetBrains Mono' },
    swatches: [['Nacht', '#05080f'], ['Karte', '#0e1626'], ['Glut', '#ffb000'], ['Du', '#ffb000'], ['Rhein AG', '#00e0ff'], ['Isar', '#ff4fd8']],
    design: {
      map: 'Dunkle Glasplatte, Regionen nur als Tönung, Trassen als feine Leuchtlinien mit Kosten.',
      market: 'Schwarzes Tablett mit LED-Preisziffern; echte Stücke mit Material: rauer Kohlebrocken, Stahlfass, glänzender Müllsack, Uranfass mit grün glimmendem Band.',
      plants: 'Kraftwerkskarten als dunkle Glaskacheln mit farbigem Brennstoffband.',
      player: 'Dein Lager als beleuchtete Ablage, goldene Münzstapel.',
      track: 'Leuchtleiste mit Städtezahl, Einkommen und Reihenfolge.',
      marketLong: 'Ein dunkles Tablett mit leuchtenden Preisziffern. Die Stücke sind echte Materialien: Kohle rau und matt, Fässer aus Stahl, Müllsäcke glänzend, Uran mit grünem Schimmer.',
      marketItems: [['Kaufen', 'Stücke heben ab und fliegen in einem Bogen ins Lager, über ihnen leuchtet der Preis.'], ['Verbrennen', 'Im Bürokratie-Schritt steigen sie aus dem Lager auf und verglühen als Funke.'], ['Nachschub', 'Neue Stücke fallen in die teuren Felder und federn nach.']],
      cityLong: 'Jede Stadt hat eine kleine graue Grund-Skyline. Jede Firma setzt einen Turm in ihrer Farbe dazu, mit Fenstern, die leuchten. Leitungen glühen in der Spielerfarbe.',
      cityItems: [['Bauen', 'Ein Energieball rast die Trasse entlang und zieht die Leuchtleitung hinter sich her.'], ['Wachsen', 'Ein Lichtstrahl schießt hoch, der Turm wächst aus dem Boden, Funken sprühen.'], ['Dauerbetrieb', 'Kleine Lichtpunkte laufen ständig durch alle Netze.']],
      plantsLong: 'Kraftwerke als dunkle Glaskarten. Gebote leuchten als Marker in Spielerfarbe über der Karte.',
      plantsItems: [['Auswahl', 'Die Karte hebt ab und kippt zum Spieler.'], ['Gebote', 'Leuchtmarker steigen auf, jedes Gebot lässt die Karte zucken.'], ['Gewinn', 'Die Karte fliegt in deinen Bereich, eine neue dreht sich vom Stapel auf.']],
      bureauLong: 'Die Bürokratie als Lichtshow: Stücke verglühen, Netze leuchten auf, Gold fliegt aus der Bank.',
    },
    verdictTitle: 'Spektakulär und thematisch stark',
    strengths: ['Größter Wow-Effekt, sofort als Energiespiel erkennbar', 'Wachsende Skylines machen den Spielstand auf einen Blick lesbar', 'Dauerhafte Bewegung lässt den Tisch lebendig wirken'],
    risks: ['Bloom kostet Leistung; auf alten iPhones abschaltbar machen', 'Gefahr von „zu viel Neon“, Farben müssen sparsam bleiben'],
    effort: 'Hoch. Leuchteffekte, Fenstertexturen, dauerhafte Partikel. Leistung auf älteren Geräten muss abgestimmt werden.', fit: 'Hoch: mutige Animationen, Skylines und animierte Märkte wie gewünscht; flache Karte mit echter Tiefe.',
  },
  vars: {
    dark: { '--bg': '#05080f', '--surface': '#0d1422', '--ink': '#eaf2ff', '--muted': '#8a9bb8', '--line': '#1c2840', '--accent': '#ffb000', '--accent-ink': '#05080f', '--stagebg': '#05080f', '--frame': '#000', '--fd': 'Orbitron,sans-serif', '--ft': 'Barlow,sans-serif', '--fm': '"JetBrains Mono",monospace', '--radius': '14px', '--bradius': '10px', '--h1w': '800' },
    light: { '--bg': '#cfd7e3', '--surface': '#e6ebf2', '--ink': '#0e1626', '--muted': '#4f5f78', '--line': '#b4c0d2', '--accent': '#d97a00', '--accent-ink': '#fff', '--stagebg': '#b9c4d4', '--frame': '#0e1626', '--fd': 'Orbitron,sans-serif', '--ft': 'Barlow,sans-serif', '--fm': '"JetBrains Mono",monospace', '--radius': '14px', '--bradius': '10px', '--h1w': '800' },
  },
  font: 'Orbitron',
  palette(mode) { const d = mode === 'dark'; return d ? { bg: '#05080f', table: '#ffffff', edge: '#1a2436', edgeMetal: .5, exposure: 1, env: .25, hemi: .55, sky: '#5070b0', ground: '#000', keyI: 1.0, key: '#9fb6ff', fillI: .2, players: ['#ffb000', '#00e0ff', '#ff4fd8'], accent: '#ffb000', neg: '#ff6a5a', coin: '#e0b44a', bloom: .55, dark: true, fog: true, glow: 1.5 }
    : { bg: '#b9c4d4', table: '#ffffff', edge: '#8996aa', edgeMetal: .3, exposure: .8, env: .35, hemi: .7, sky: '#ffffff', ground: '#5a6476', keyI: 1.1, key: '#ffe6c8', fillI: .3, players: ['#e08a00', '#0098c7', '#d0309f'], accent: '#d97a00', neg: '#c0392b', coin: '#d4a93a', bloom: 0, glow: .7 }; },
  tableTex(P) { return P.dark ? noiseTex('#070b14', 10, 512, 30) : noiseTex('#aeb9ca', 10, 512, 30); },
  board(P) { const d = P.dark; return { bg: d ? '#0a1120' : '#dfe5ee', ink: d ? '#eaf2ff' : '#0e1626', muted: d ? '#7f92b4' : '#4f5f78', cell: d ? '#16223a' : '#cdd6e3', cellR: 10, slot: d ? 'rgba(255,176,0,.55)' : 'rgba(14,22,38,.35)', upper: true, hot: P.accent,
    title: '800 40px Orbitron', small: '600 22px Barlow', tiny: '600 17px Barlow', num: '500 26px "JetBrains Mono"', card: d ? '#111a2c' : '#f4f6fa', cardStyle: 'band', cardFont: 'Orbitron', cardText: 'Barlow', cardInk: d ? '#eaf2ff' : '#0e1626', cardMuted: d ? '#8a9bb8' : '#4f5f78', back: d ? '#1b2944' : '#25324a', backText: 'GRID MASTER', cardTitle: '800 32px Orbitron', tag: d ? '#0d1422' : '#fff', tagInk: d ? '#eaf2ff' : '#0e1626',
    decor: (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, d ? 'rgba(255,176,0,.06)' : 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } }; },
  drawMap(x, MAP, P) { const d = P.dark;
    drawMapBasic(x, MAP, P, { land: d ? '#0e1626' : '#e3e8ef', regionFill: i => d ? ['#111c30', '#0f1a2c', '#131e33', '#101b2e', '#14203a', '#111c31'][i] : ['#e6ebf1', '#dfe6ee', '#e9edf2', '#e2e8ef', '#e5e9ee', '#dde4ec'][i],
      regionStroke: d ? 'rgba(120,150,200,.35)' : 'rgba(14,22,38,.25)', regionW: .7, river: d ? '#1d4f7a' : '#7aa6cf', riverW: 1.2,
      edge: d ? 'rgba(120,170,230,.35)' : 'rgba(14,22,38,.3)', edgeW: .6, costBox: d ? '#0a1120' : '#f4f6fa', costLine: d ? 'rgba(255,176,0,.6)' : 'rgba(14,22,38,.35)', costInk: d ? '#ffcc66' : '#0e1626', costFont: '500 5.2px "JetBrains Mono"', costRound: true,
      cityPad: d ? 'rgba(255,190,90,.07)' : 'rgba(255,255,255,.5)', cityPadR: 11, label: d ? '#c9d6ee' : '#0e1626', labelFont: '600 5.6px Barlow', labelUpper: true, labelHalo: d ? '#0e1626' : '#e3e8ef', labelDy: 15 }); },
  cityBase(ctx, c) { const g = new THREE.Group(), P = ctx.P; const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, .12, 6), mat({ color: P.dark ? '#141d2e' : '#9aa6b8', metalness: .4, roughness: .4 })); base.position.y = .06; base.receiveShadow = true; g.add(base);
    const r = rng(c.id), m = mat({ color: P.dark ? '#1a2335' : '#8794a8', emissive: P.dark ? '#ffcf85' : '#000000', emissiveMap: winTex(), emissiveIntensity: P.dark ? .35 : 0 });
    for (let i = 0; i < 5; i++) { const hgt = .25 + r() * .5, b = new THREE.Mesh(new THREE.BoxGeometry(.22 + r() * .12, hgt, .22 + r() * .12), m); const a = r() * 6.28, rad = .15 + r() * .3; b.position.set(Math.cos(a) * rad, .12 + hgt / 2, Math.sin(a) * rad - .1); b.castShadow = true; g.add(b); } return g; },
  house(ctx, pl, c, i) { const P = ctx.P, hgt = [.9, 1.35, 1.8][i]; const geo = new THREE.BoxGeometry(.42, hgt, .42); geo.translate(0, hgt / 2, 0); const t = winTex().clone(); t.repeat.set(1, hgt / .9); t.needsUpdate = true;
    const m = new THREE.Mesh(geo, mat({ color: P.dark ? '#121a2a' : '#5b6578', metalness: .5, roughness: .35, emissive: P.players[pl], emissiveMap: t, emissiveIntensity: P.glow })); m.castShadow = true;
    const top = new THREE.Mesh(new THREE.BoxGeometry(.46, .05, .46), mat({ color: P.players[pl], emissive: P.players[pl], emissiveIntensity: P.glow * 1.2 })); top.position.y = hgt; const g = new THREE.Group(); g.add(m, top); return g; },
  line(ctx, ends, pl) { const P = ctx.P, o = strip(ends, .13, .13, mat({ color: P.players[pl], emissive: P.players[pl], emissiveIntensity: P.glow }), .32, true); const posts = [], n = Math.max(1, Math.round(ends.L / 3)), pm = mat({ color: P.dark ? '#2a3550' : '#5b6578', metalness: .6, roughness: .4 });
    for (let k = 0; k <= n; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.04, .06, .34, 6), pm); p.position.set(ends.L * k / n, .17, 0); p.userData.t = k / n; p.castShadow = true; o.obj.add(p); posts.push(p); }
    return { obj: o.obj, set: k => { o.set(k); posts.forEach(p => p.visible = p.userData.t <= k + .001); } }; },
  resMats(ctx, k) { if (k === 'coal') return { body: mat({ color: '#34302c', roughness: 1, flatShading: true, emissive: '#ff4a10', emissiveIntensity: ctx.P.dark ? .06 : 0 }) }; if (k === 'oil') return { body: mat({ color: '#203248', metalness: .7, roughness: .35 }), rib: mat({ color: '#9aa7b8', metalness: .9, roughness: .25 }) }; if (k === 'garbage') return { body: mat({ color: '#e6b622', roughness: .2, metalness: .05 }), rib: mat({ color: '#7a5a10' }) }; return { body: mat({ color: '#b8281f', metalness: .5, roughness: .35 }), band: mat({ color: '#40ff7a', emissive: '#40ff7a', emissiveIntensity: ctx.P.dark ? 1.4 : .4 }), top: mat({ map: trefoilTex('#f4d35e', '#111'), metalness: .4, roughness: .4 }) }; },
  coinMat(ctx) { return mat({ color: ctx.P.coin, metalness: .9, roughness: .25 }); },
  async animLine(ctx, lo, A, B, pl) { const e = lo.ends, P = ctx.P; const orb = ctx.FX.sprite(P.players[pl], 2.6), core = ctx.FX.sprite('#ffffff', .9), trail = [0, 1, 2, 3, 4].map(i => ctx.FX.sprite(P.players[pl], 1.6 - i * .25));
    await tween(.45 + e.L * .05, k => { lo.set(k); const p = alongLine(e, k, .45); orb.position.copy(p); core.position.copy(p); trail.forEach((t, i) => t.position.copy(alongLine(e, Math.max(0, k - (i + 1) * .035), .45))); }, 'in');
    [orb, core, ...trail].forEach(s => ctx.FX.kill(s)); ctx.FX.burst(alongLine(e, 1, .5), [P.players[pl], '#ffffff'], 16, { speed: 3, up: 3, life: .7, mesh: c => new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 4), new THREE.MeshBasicMaterial({ color: c })) }); },
  async animHouse(ctx, h, c, pl) { const P = ctx.P, beam = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, 14, 16, 1, true), new THREE.MeshBasicMaterial({ color: P.players[pl], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.set(c.X + h.position.x, 7, c.Z + h.position.z); ctx.fx.add(beam);
    h.scale.set(1, .001, 1); await tween(.35, (e, k) => beam.material.opacity = .7 * e, 'out'); await tween(.9, e => h.scale.y = Math.max(.001, e), 'back');
    ctx.FX.burst(new THREE.Vector3(c.X, 1.2, c.Z), [P.players[pl], '#fff'], 30, { speed: 4, up: 6, life: 1.2, mesh: col => new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 4), new THREE.MeshBasicMaterial({ color: col })) }); await tween(.6, (e, k) => beam.material.opacity = .7 * (1 - k), 'lin'); ctx.fx.remove(beam); },
  pulseCol: (ctx, pl) => ctx.P.players[pl],
  tick(ctx, t) { if (!ctx.P.dark && ctx.P.glow < 1) { } ctx.lineObjs.forEach((lo, i) => { if (!lo.flow) { lo.flow = ctx.FX.sprite(ctx.P.players[lo.l.pl], .9); } const k = ((t * .35 + i * .37) % 1); lo.flow.visible = lo.obj.children[0].visible && lo.obj.children[0].scale.x > lo.ends.L * .98; lo.flow.position.copy(alongLine(lo.ends, k, .4)); }); },
};
