/* Konzept C – Swiss Signal: editorial, plakativ, Liniennetz-Ästhetik. Knackige, kinetische Animationen. */
const THEME = {
  meta: {
    key: 'C', name: 'Swiss Signal', tagline: 'Ein Liniennetzplan als Spielbrett: kräftige Farbflächen, dicke Linien, große Zahlen und knackige Bewegung mit Überschwung.',
    keywords: ['Liniennetz-Look', 'Kinetische Typo', 'Klappzahlen', 'Hell zuerst, Dunkel stark'],
    idea: 'Ein Netz, das wie ein Verkehrsplan funktioniert und wie ein Plakat aussieht.',
    principles: [['Formen statt Effekte', 'Kreise, Balken, Flächen. Alles flach, nichts glänzt. Farbe trägt die Information.'], ['Bewegung mit Haltung', 'Elemente schnellen mit leichtem Überschwung an ihren Platz. Kurz, präzise, nie verspielt.'], ['Zahlen sind Helden', 'Kosten und Geld erscheinen groß und klappen wie Fallblattanzeigen um.']],
    fonts: { display: 'Archivo', text: 'Inter', mono: 'JetBrains Mono' },
    statesTitle: 'Der Ring füllt sich mit jeder Firma',
    anim: { line: 'Die Linie schießt mit einem Zug-Block an der Spitze ins Ziel, die Kosten klappen groß auf.', house: 'Der Stadtkreis schnellt auf, ein Segment pro Firma wischt sich in den Ring.', power: 'Kleine Züge fahren durch jedes Netz, Städte pulsieren im Takt.', buy: 'Stücke springen in einer Reihe ins Lager, Zähler klappen.', restock: 'Neue Stücke fallen reihenweise im Takt.', auction: 'Gebote schieben sich als Balken über die Karte, die Gewinnerkarte gleitet.' },
    verdictTitle: 'Mutig, modern, sofort erkennbar',
    strengths: ['Unverwechselbar, design-preiswürdig, sehr gut lesbar auch klein', 'Animationen sind kurz und schnell, das hält das Spieltempo hoch', 'Funktioniert besonders gut im Hellmodus'], risks: ['Weniger „Brettspiel-Gemütlichkeit“, eher Design-Objekt', 'Liniennetz-Ästhetik vereinfacht die Geografie stark'],
    effort: 'Niedrig bis mittel. Reine Vektorformen, sehr leicht für jedes Gerät.',
    fit: 'Mittel: flach und edel wie gewünscht, aber deutlich grafischer als die bisherige Richtung.',
  },
  vars: {
    light: { '--bg': '#f6f5f1', '--surface': '#ffffff', '--ink': '#111111', '--muted': '#6b6b6b', '--line': '#e2e0da', '--accent': '#e1251b', '--accent-ink': '#ffffff', '--p0': '#e1251b', '--p1': '#1f5bff', '--p2': '#00a37a', '--land': '#ffffff', '--frame': '#111', '--ft': 'Inter,sans-serif', '--fd': 'Archivo,sans-serif', '--fm': '"JetBrains Mono",monospace', '--radius': '4px', '--bradius': '99px', '--h1w': '900', '--h1ls': '-.035em', '--h2w': '800' },
    dark: { '--bg': '#0c0c0c', '--surface': '#171717', '--ink': '#f4f4f4', '--muted': '#9a9a9a', '--line': '#2a2a2a', '--accent': '#ff3b2f', '--accent-ink': '#ffffff', '--p0': '#ff3b2f', '--p1': '#4d7cff', '--p2': '#19c995', '--land': '#1c1c1c', '--frame': '#000', '--ft': 'Inter,sans-serif', '--fd': 'Archivo,sans-serif', '--fm': '"JetBrains Mono",monospace', '--radius': '4px', '--bradius': '99px', '--h1w': '900', '--h1ls': '-.035em', '--h2w': '800' },
  },
  css: `
  .clabel{font:800 7px Archivo;letter-spacing:.02em;text-transform:uppercase;fill:var(--ink)}
  .edge{stroke:var(--muted);stroke-width:.8;opacity:.35}
  .own{fill:none;stroke-width:4.2;stroke-linecap:round}
  .panel{fill:var(--surface);stroke:none}
  .ptitle{font:900 18px Archivo;letter-spacing:-.01em;fill:var(--ink)}
  .rlabel{font:800 11px Archivo;fill:var(--ink);text-transform:uppercase}
  .cell{fill:var(--bg);stroke:none}
  .price{font:700 9px "JetBrains Mono";fill:var(--muted)}
  .card{fill:var(--bg);stroke:none}.card.selected{stroke:var(--accent);stroke-width:3}.card.owned{fill:var(--surface);stroke:var(--ink);stroke-width:1.5}
  .cnum{font:900 30px Archivo;letter-spacing:-.04em;fill:var(--ink)}.csub{font:700 9px Inter;fill:var(--muted);text-transform:uppercase}.cpow{font:900 14px Archivo;fill:var(--ink)}
  .cardback{fill:var(--ink)}
  .fx-text{fill:var(--ink);font-family:Archivo;font-weight:900}
  .stage{border-width:0}
  `,
  startMode: 'light',
  globalDefs() { },
  land(b, M) {
    const g = b.gLand; el('path', { d: M.land, fill: 'var(--land)', stroke: 'none' }, g);
    const tints = ['#ffd84d', '#9fd3ff', '#ffb3a7', '#b8e6c4', '#d9c7ff', '#ffd0a1'];
    M.regions.forEach((r, i) => el('path', { d: r.d, fill: tints[i % 6], 'fill-opacity': b.svg.closest('[data-mode=dark]') || document.documentElement.dataset.mode === 'dark' ? .16 : .55, stroke: 'var(--bg)', 'stroke-width': 3, class: 'reg' }, g));
    b.outline = el('path', { d: M.land, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.2 }, g);
  },
  edge(b, e, A, B) { const s = seg(A, B, 0, 6); el('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, class: 'edge' }, b.gEdges); },
  line(b, e, pl, lane) { const s = seg(CITY[e.a], CITY[e.b], lane * 1.15 - (lane ? .55 : 0), 5); return el('path', { d: `M${s.x1},${s.y1}L${s.x2},${s.y2}`, class: 'own', stroke: pcol(pl) }, b.gLines); },
  city(b, g, c, own, f) {
    const n = own.length, R = 4.2 + n * 1.6;
    const segs = own.map((pl, i) => { const a0 = -Math.PI / 2 + i * 2 * Math.PI / 3, a1 = a0 + 2 * Math.PI / 3 - .12, r = R + 1.6; return `<path class="segm" d="M${Math.cos(a0) * r},${Math.sin(a0) * r}A${r},${r} 0 0 1 ${Math.cos(a1) * r},${Math.sin(a1) * r}" fill="none" stroke="${pcol(pl)}" stroke-width="2.6" stroke-linecap="butt"/>`; }).join('');
    const reach = f.reach ? `<circle r="${R + 5}" fill="none" stroke="var(--accent)" stroke-width="1.4" stroke-dasharray="2.5 2.5"/>` : '';
    const sel = f.sel ? `<circle r="${R + 6}" fill="var(--accent)" opacity=".18"/>` : '';
    g.innerHTML = `<circle r="12" fill="transparent"/>${sel}${reach}<circle class="core" r="${R}" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.8"/>${segs}${n ? `<text y="2.4" text-anchor="middle" style="font:900 6.5px Archivo;fill:var(--ink)">${n}</text>` : ''}`;
  },
  label(b, c) { const t = el('text', { x: c.x + 9, y: c.y + 2.5, class: 'clabel' }, b.gLabels); t.textContent = c.name; },
  async animLine(b, l, A, B, pl) {
    const p = l.el; if (l.e.a !== A.id) { const d = p.getAttribute('d').match(/M([^L]+)L(.+)/); p.setAttribute('d', `M${d[2]}L${d[1]}`); }
    const L = p.getTotalLength(), s = seg(A, B), ang = Math.atan2(s.uy, s.ux) * 180 / Math.PI, train = el('rect', { x: -5, y: -2.6, width: 10, height: 5.2, rx: 2.6, fill: 'var(--ink)' }, b.gFx);
    p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    await tween(.35 + L * .004, e => { p.style.strokeDashoffset = L * (1 - e); const q = p.getPointAtLength(L * e); train.setAttribute('transform', `translate(${q.x},${q.y}) rotate(${ang})`); }, 'snap'); p.style.strokeDasharray = ''; train.remove();
    const mx = (A.x + B.x) / 2 + s.nx * 10, my = (A.y + B.y) / 2 + s.ny * 10, tag = el('g', { transform: `translate(${mx},${my})` }, b.gFx); tag.innerHTML = `<rect x="-13" y="-8" width="26" height="14" fill="var(--ink)"/><text y="2.8" text-anchor="middle" style="font:900 9px Archivo;fill:var(--bg)">0</text>`; const t = tag.querySelector('text');
    await tween(.3, e => tag.setAttribute('transform', `translate(${mx},${my}) scale(1,${e})`), 'back'); await tween(.4, e => t.textContent = Math.round(l.e.cost * e) + '€', 'out'); wait(.8).then(() => tween(.2, e => tag.setAttribute('transform', `translate(${mx},${my}) scale(1,${1 - e})`)).then(() => tag.remove()));
  },
  async animHouse(b, c, pl, g) {
    g.style.transformBox = 'fill-box'; g.style.transformOrigin = 'center';
    const core = g.querySelector('.core'); const r = +core.getAttribute('r'); await tween(.35, e => core.setAttribute('r', r * e), 'snap');
    const sg = [...g.querySelectorAll('.segm')].pop(); if (sg) { const L = sg.getTotalLength(); sg.style.strokeDasharray = L; sg.style.strokeDashoffset = L; await tween(.35, e => sg.style.strokeDashoffset = L * (1 - e), 'out'); sg.style.strokeDasharray = ''; }
    const plus = el('text', { x: c.x + 10, y: c.y - 6, style: `font:900 12px Archivo;fill:${pcol(pl)}` }, b.gFx); plus.textContent = '+1';
    await tween(.5, (e, k) => { plus.setAttribute('x', c.x + 10 + 6 * e); plus.style.opacity = k < .6 ? 1 : (1 - k) / .4; }, 'out'); plus.remove();
  },
  async animPower(b, seqs) {
    await Promise.all(seqs.map(async ({ pl, order }) => { for (const [id, from, l] of order) { if (l) { const p = l.el, L = p.getTotalLength(), rev = l.e.a !== from, tr = el('rect', { x: -3.5, y: -1.8, width: 7, height: 3.6, rx: 1.8, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': .8 }, b.gFx); const A = CITY[from], B = CITY[id], ang = Math.atan2(B.y - A.y, B.x - A.x) * 180 / Math.PI; await tween(.45, e => { const q = p.getPointAtLength(L * (rev ? 1 - e : e)); tr.setAttribute('transform', `translate(${q.x},${q.y}) rotate(${ang})`); }, 'inout'); tr.remove(); }
      const g = b.cityG(id), core = g && g.querySelector('.core'); if (core) { const r = +core.getAttribute('r'); tween(.35, (e, k) => core.setAttribute('r', r * (1 + .35 * Math.sin(k * Math.PI))), 'lin'); } } }));
  },
  async intro(b) {
    b.reset(); const regs = [...b.gLand.querySelectorAll('.reg')]; regs.forEach(r => r.style.opacity = 0); b.gCities.style.opacity = 0; b.gLabels.style.opacity = 0; b.gEdges.style.opacity = 0;
    await Promise.all(regs.map((r, i) => tween(.35, e => { r.style.opacity = e; r.style.transform = `translateY(${(1 - e) * 14}px)`; }, 'snap', i * .07)));
    b.gEdges.style.opacity = 1; b.gCities.style.opacity = 1; const cs = [...b.gCities.children]; cs.forEach(g => { g.style.opacity = 0; });
    await Promise.all(cs.map((g, i) => tween(.25, e => g.style.opacity = e, 'out', i * .015))); b.gLabels.style.opacity = 1;
    b.setup(); await Promise.all(b.lines.map((l, i) => wait(i * .1).then(() => { const L = l.el.getTotalLength(); l.el.style.strokeDasharray = L; return tween(.35, e => l.el.style.strokeDashoffset = L * (1 - e), 'snap').then(() => l.el.style.strokeDasharray = ''); })));
  },
  piece(k) {
    if (k === 'coal') return `<path d="M-5.5,4L-4,-3.5L1,-5.5L5.5,-2L4.5,4.5Z" fill="var(--ink)"/>`;
    if (k === 'oil') return `<rect x="-4.5" y="-6" width="9" height="12" rx="1.5" fill="var(--ink)"/><rect x="-4.5" y="-1" width="9" height="2" fill="var(--bg)"/>`;
    if (k === 'garbage') return `<path d="M-5.5,5.5Q-6.5,-1,-1.5,-3.5L-2.5,-6H2.5L1.5,-3.5Q6.5,-1,5.5,5.5Z" fill="#ffd21f" stroke="var(--ink)" stroke-width=".8"/>`;
    return `<rect x="-4.5" y="-6" width="9" height="12" rx="1.5" fill="var(--accent)"/><circle r="2" fill="var(--bg)"/>`;
  },
  card(n, [res, need, pow], state) { const band = { coal: '#111', oil: '#555', garbage: '#ffd21f', uranium: '#e1251b', eco: '#00a37a', hybrid: '#8a6d4a' }[res]; return `<rect width="100" height="70" class="card ${state}"/><rect width="100" height="7" fill="${band}"/><text x="7" y="44" class="cnum">${n}</text><text x="56" y="32" class="csub">${RNAME[res]}</text><text x="56" y="44" class="csub">${need ? '× ' + need : '—'}</text><text x="93" y="63" class="cpow" text-anchor="end">→${pow}</text>`; },
  cardBack() { return `<rect width="100" height="70" class="cardback"/><text x="50" y="40" text-anchor="middle" style="font:900 11px Archivo;fill:var(--bg)">GM2</text>`; },
  async animBuy(m, p, b, n) { await wait(n * .09); const a = { x: p.x, y: p.y }; await tween(.5, e => p.g.setAttribute('transform', `translate(${lerp(a.x, b.x, e)},${lerp(a.y, b.y, e) - Math.sin(e * Math.PI) * 30}) scale(${1 - .2 * e})`), 'snap'); },
  async animRestock(m, p, n) { p.g.style.opacity = 0; await wait(n * .06); p.g.style.opacity = 1; await tween(.35, e => p.g.setAttribute('transform', `translate(${p.x},${lerp(p.y - 40, p.y, e)})`), 'snap'); },
  async animAuction(pm, g, n, bids) { const p = pos(g); await tween(.25, e => setPos(g, p.x, p.y - 6 * e), 'snap'); for (const [pl, v] of bids) { const t = el('g', {}, pm.gFx); t.innerHTML = `<rect x="0" y="0" width="100" height="16" fill="${pcol(pl)}"/><text x="6" y="11.5" style="font:900 10px Archivo;fill:#fff">${PLAYERS[pl].name.toUpperCase()}</text><text x="94" y="11.5" text-anchor="end" style="font:900 10px Archivo;fill:#fff">${v === null ? 'PASST' : v + ' €'}</text>`; await tween(.22, e => t.setAttribute('transform', `translate(${p.x - 100 * (1 - e)},${p.y + 20}) scale(${e},1)`), 'snap'); await wait(.4); t.remove(); } },
  async animToMine(pm, g, to) { const p = pos(g); await tween(.6, e => setPos(g, lerp(p.x, to.x, e), lerp(p.y, to.y, e)), 'snap'); },
};
