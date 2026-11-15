/* Konzept D – Paper Craft: geschichtetes Papier, Pop-up-Häuser, Papierstreifen als Leitungen. */
const THEME = {
  meta: {
    key: 'D', name: 'Paper Craft', tagline: 'Ein Brettspiel aus Schichtpapier: Regionen als Papierlagen, Leitungen als Papierstreifen, Städte klappen wie ein Pop-up-Buch auf.',
    keywords: ['Schichtpapier', 'Pop-up-Animationen', 'Warme Töne', 'Dunkel = Kohlepapier'],
    idea: 'Das Gefühl eines echten Brettspiels, digital und lebendig.',
    principles: [['Fühlbar', 'Weiche Papierschatten statt 3D-Glanz. Jede Lage liegt sichtbar auf der anderen, das gibt Tiefe ohne Relief.'], ['Pop-up statt Spektakel', 'Häuser klappen auf, Papierschnipsel fliegen, Streifen werden ausgerollt. Freundlich, nie hektisch.'], ['Warm und ruhig', 'Kraftpapier, Terrakotta, gedeckte Spielerfarben und eine Serifenschrift mit Charakter.']],
    fonts: { display: 'Fraunces', text: 'DM Sans', mono: 'DM Mono' },
    statesTitle: 'Mit jeder Firma klappt ein weiteres Haus auf',
    anim: { line: 'Ein Papierstreifen rollt sich aus und legt sich mit Schatten aufs Brett.', house: 'Ein Haus klappt wie im Pop-up-Buch auf, bunte Papierschnipsel fliegen.', power: 'Warme Lichtpunkte wandern über die Streifen, Häuser leuchten auf.', buy: 'Stücke heben ab (Schatten wächst), fliegen und landen weich im Lager.', restock: 'Neue Stücke werden fallen gelassen und federn aus.', auction: 'Gebote hängen als kleine Papieranhänger an der Karte, die Karte dreht sich beim Wegfliegen.' },
    verdictTitle: 'Warm, zugänglich, sehr „Brettspiel“',
    strengths: ['Fühlt sich am meisten nach echtem Brettspiel an', 'Spricht auch Gelegenheitsspieler an, freundlich und klar', 'Weiche Schatten geben Tiefe ohne den „billigen 3D“-Effekt'], risks: ['Weniger „Tech/Energie“-Charakter; passt thematisch nicht so stark wie A oder B', 'Papiertexturen müssen fein dosiert sein, sonst wirkt es verspielt'],
    effort: 'Mittel. Schattenfilter und Pop-up-Animationen sind 2D, Leistung unkritisch.',
    fit: 'Mittel bis hoch: flach mit minimaler 3D-Andeutung, wie gewünscht, aber in eine wärmere Richtung.',
  },
  vars: {
    light: { '--bg': '#e8e0cf', '--surface': '#f5efe2', '--ink': '#2e2a25', '--muted': '#786f62', '--line': '#d3c7b0', '--accent': '#c8553d', '--accent-ink': '#fff', '--p0': '#c8553d', '--p1': '#4a6fa5', '--p2': '#5b8c5a', '--land': '#f3ead8', '--shadow': 'rgba(70,50,20,.32)', '--frame': '#3a332b', '--ft': '"DM Sans",sans-serif', '--fd': 'Fraunces,serif', '--fm': '"DM Mono",monospace', '--radius': '18px', '--bradius': '12px', '--h1w': '800' },
    dark: { '--bg': '#22201d', '--surface': '#2d2a26', '--ink': '#f1e9dc', '--muted': '#a99f8f', '--line': '#3f3a34', '--accent': '#e07a5f', '--accent-ink': '#22201d', '--p0': '#e07a5f', '--p1': '#7c9cd3', '--p2': '#86b37f', '--land': '#34302a', '--shadow': 'rgba(0,0,0,.55)', '--frame': '#0f0e0c', '--ft': '"DM Sans",sans-serif', '--fd': 'Fraunces,serif', '--fm': '"DM Mono",monospace', '--radius': '18px', '--bradius': '12px', '--h1w': '800' },
  },
  css: `
  .clabel{font:500 7.5px Fraunces;fill:var(--ink);paint-order:stroke;stroke:var(--land);stroke-width:2.4px}
  .edge{stroke:var(--muted);stroke-width:.8;stroke-dasharray:2 2.2;stroke-linecap:round;opacity:.65}
  .own{fill:none;stroke-width:3.6;stroke-linecap:round;filter:url(#gd-shadow)}
  .panel{fill:var(--surface);filter:url(#gd-shadow)}
  .ptitle{font:800 16px Fraunces;fill:var(--ink)}
  .rlabel{font:500 11px "DM Sans";fill:var(--muted)}
  .cell{fill:var(--bg);stroke:none;opacity:.7}
  .price{font:500 9px "DM Mono";fill:var(--muted)}
  .card{fill:var(--land);filter:url(#gd-shadow)}.card.selected{stroke:var(--accent);stroke-width:2}.card.future{opacity:.85}
  .cnum{font:800 26px Fraunces;fill:var(--ink)}.csub{font:500 9px "DM Sans";fill:var(--muted)}.cpow{font:700 13px Fraunces;fill:var(--ink)}
  .cardback{fill:var(--accent);filter:url(#gd-shadow)}
  .fx-text{fill:var(--accent);font-family:Fraunces}
  `,
  startMode: 'light',
  globalDefs(d) {
    d.innerHTML = `<filter id="gd-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.1" flood-color="#000" flood-opacity=".28"/></filter>
    <filter id="gd-lift" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity=".3"/></filter>
    <filter id="gd-paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" result="n"/><feColorMatrix in="n" type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .06"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode/></feMerge></filter>`;
  },
  land(b, M) {
    const g = b.gLand; el('path', { d: M.land, fill: 'var(--land)', filter: 'url(#gd-shadow)' }, g);
    const tints = ['#e9c46a', '#8ab6d6', '#e8a598', '#a7c4a0', '#c3b1e1', '#f2b880'];
    M.regions.forEach((r, i) => el('path', { d: r.d, fill: tints[i % 6], 'fill-opacity': document.documentElement.dataset.mode === 'dark' ? .22 : .45, transform: 'scale(.995)', 'transform-origin': 'center', filter: 'url(#gd-shadow)', class: 'reg' }, g));
    M.rivers.forEach(d => el('path', { d, fill: 'none', stroke: '#5b8fb8', 'stroke-width': .9, 'stroke-linecap': 'round', opacity: .7 }, g));
    b.outline = el('path', { d: M.land, fill: 'none', stroke: 'var(--ink)', 'stroke-width': .5, opacity: .35 }, g);
  },
  edge(b, e, A, B) { const s = seg(A, B, 0, 7); el('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, class: 'edge' }, b.gEdges); },
  line(b, e, pl, lane) { const s = seg(CITY[e.a], CITY[e.b], lane - (lane ? .5 : 0), 6); const mx = (s.x1 + s.x2) / 2 + s.nx * 3, my = (s.y1 + s.y2) / 2 + s.ny * 3; return el('path', { d: `M${s.x1},${s.y1}Q${mx},${my} ${s.x2},${s.y2}`, class: 'own', stroke: pcol(pl) }, b.gLines); },
  city(b, g, c, own, f) {
    const houses = own.map((pl, i) => { const x = (i - (own.length - 1) / 2) * 6.2; return `<g class="hs" transform="translate(${x},-3)"><path d="M-2.8,0V-4.6L0,-7.4L2.8,-4.6V0Z" fill="${pcol(pl)}" filter="url(#gd-shadow)"/><rect x="-.8" y="-2.4" width="1.6" height="2.4" fill="var(--land)" opacity=".7"/></g>`; }).join('');
    const reach = f.reach ? `<circle r="8.5" fill="none" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="1.6 1.8" stroke-linecap="round"/>` : '';
    const sel = f.sel ? `<circle r="9.5" fill="var(--accent)" opacity=".22"/>` : '';
    g.innerHTML = `<circle r="12" fill="transparent"/>${sel}${reach}<ellipse rx="${5 + own.length * 2.4}" ry="3.2" fill="var(--surface)" filter="url(#gd-shadow)"/>${houses}${own.length ? '' : '<circle r="1.6" fill="var(--muted)" opacity=".6"/>'}`;
  },
  label(b, c) { const t = el('text', { x: c.x, y: c.y + 11, class: 'clabel', 'text-anchor': 'middle' }, b.gLabels); t.textContent = c.name; },
  async animLine(b, l, A, B, pl) {
    const p = l.el; if (l.e.a !== A.id) { const d = p.getAttribute('d').match(/M([^Q]+)Q([^ ]+) (.+)/); p.setAttribute('d', `M${d[3]}Q${d[2]} ${d[1]}`); }
    p.setAttribute('filter', 'url(#gd-lift)'); const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    const roll = el('circle', { r: 2.6, fill: pcol(pl), filter: 'url(#gd-lift)' }, b.gFx);
    await tween(.6 + L * .007, e => { p.style.strokeDashoffset = L * (1 - e); const q = p.getPointAtLength(L * e); roll.setAttribute('cx', q.x); roll.setAttribute('cy', q.y); roll.setAttribute('r', 2.6 * (1 - e * .6)); }, 'inout');
    roll.remove(); p.style.strokeDasharray = ''; await wait(.15); p.setAttribute('filter', 'url(#gd-shadow)');
  },
  async animHouse(b, c, pl, g) {
    const hs = [...g.querySelectorAll('.hs')].pop(); if (hs) { hs.style.transformBox = 'fill-box'; hs.style.transformOrigin = '50% 100%'; hs.style.transform = 'scaleY(0)'; await tween(.55, e => hs.style.transform = `scaleY(${e})`, 'spring'); }
    FX.burst(b.gFx, c.x, c.y - 6, [pcol(pl), '#e9c46a', '#8ab6d6', '#e8a598', '#a7c4a0'], 26, { shape: 'rect', speed: 45, up: 35, gravity: 55, size: 1.6, life: 1.2 });
  },
  async animPower(b, seqs) {
    await Promise.all(seqs.map(async ({ pl, order }) => { for (const [id, from, l] of order) { if (l) { const p = l.el, L = p.getTotalLength(), rev = l.e.a !== from, dot = el('circle', { r: 2.2, fill: '#ffd98a', filter: 'url(#gd-shadow)' }, b.gFx); await tween(.6, e => { const q = p.getPointAtLength(L * (rev ? 1 - e : e)); dot.setAttribute('cx', q.x); dot.setAttribute('cy', q.y); }, 'inout'); dot.remove(); }
      const c = CITY[id], halo = el('circle', { cx: c.x, cy: c.y - 3, r: 2, fill: '#ffd98a', opacity: .8 }, b.gFx); tween(.8, (e, k) => { halo.setAttribute('r', 2 + 10 * e); halo.setAttribute('opacity', .7 * (1 - k)); }, 'out').then(() => halo.remove()); } }));
  },
  async intro(b) {
    b.reset(); const regs = [...b.gLand.querySelectorAll('.reg')]; regs.forEach(r => { r.style.opacity = 0; }); b.gCities.style.opacity = 0; b.gLabels.style.opacity = 0; b.gEdges.style.opacity = 0;
    await Promise.all(regs.map((r, i) => tween(.6, (e, k) => { r.style.opacity = Math.min(1, k * 2.5); r.style.transform = `translate(${(1 - e) * -6}px,${(1 - e) * -10}px)`; r.setAttribute('filter', k < .85 ? 'url(#gd-lift)' : 'url(#gd-shadow)'); }, 'out', i * .14)));
    b.gEdges.style.opacity = 1; b.gLabels.style.opacity = 1; b.gCities.style.opacity = 1;
    b.setup(); for (const id of Object.keys(b.owners)) { const g = b.cityG(id); g.querySelectorAll('.hs').forEach(h => { h.style.transformBox = 'fill-box'; h.style.transformOrigin = '50% 100%'; h.style.transform = 'scaleY(0)'; }); }
    await Promise.all(b.lines.map((l, i) => wait(i * .12).then(() => FX.drawStroke(l.el, .6))));
    for (const id of Object.keys(b.owners)) { const g = b.cityG(id); g.querySelectorAll('.hs').forEach(h => tween(.5, e => h.style.transform = `scaleY(${e})`, 'spring')); await wait(.08); }
  },
  piece(k) {
    if (k === 'coal') return `<g filter="url(#gd-shadow)"><path d="M-5.5,3.5L-4.8,-2.5L-.5,-5.2L4.5,-3L5.8,2L1.5,5Z" fill="#3a3530"/><path d="M-.5,-5.2L4.5,-3L1,-.8Z" fill="#5c554d"/></g>`;
    if (k === 'oil') return `<g filter="url(#gd-shadow)"><rect x="-4.5" y="-6" width="9" height="12" rx="1.6" fill="#3d4a5a"/><path d="M-4.5,-2H4.5M-4.5,2H4.5" stroke="#6b7c90" stroke-width=".8"/></g>`;
    if (k === 'garbage') return `<g filter="url(#gd-shadow)"><path d="M-5.5,5.5C-6.8,0,-5,-3.4,-1.4,-3.8L-2.2,-6.2H2.2L1.4,-3.8C5,-3.4,6.8,0,5.5,5.5Z" fill="#e9c46a"/><path d="M-2.2,-6.2L0,-4.8L2.2,-6.2" fill="none" stroke="#a8862e" stroke-width=".7"/></g>`;
    return `<g filter="url(#gd-shadow)"><rect x="-4.4" y="-5.8" width="8.8" height="11.6" rx="1.6" fill="#c8553d"/><circle r="2.2" fill="#f4d35e"/><circle r=".7" fill="#3a3530"/></g>`;
  },
  card(n, [res, need, pow], state) { const band = { coal: '#3a3530', oil: '#3d4a5a', garbage: '#e9c46a', uranium: '#c8553d', eco: '#5b8c5a', hybrid: '#7b6248' }[res]; return `<rect width="100" height="70" rx="6" class="card ${state}"/><circle cx="20" cy="30" r="14" fill="${band}"/><text x="20" y="35" text-anchor="middle" style="font:800 14px Fraunces;fill:#fff">${n}</text><text x="42" y="26" class="csub">${RNAME[res]}</text><text x="42" y="38" class="csub">${need ? need + ' Stück' : 'ohne Brennstoff'}</text><text x="92" y="62" class="cpow" text-anchor="end">→ ${pow}</text><path d="M86,0H94A6,6 0 0 1 100,6V14Z" fill="var(--bg)" opacity=".7"/>`; },
  cardBack() { return `<rect width="100" height="70" rx="6" class="cardback"/><text x="50" y="40" text-anchor="middle" style="font:800 12px Fraunces;fill:#fff">Kraftwerk</text>`; },
  async animBuy(m, p, b, n) { await wait(n * .16); const a = { x: p.x, y: p.y }; p.g.setAttribute('filter', 'url(#gd-lift)'); await tween(.9, (e, k) => p.g.setAttribute('transform', `translate(${lerp(a.x, b.x, e)},${lerp(a.y, b.y, e) - Math.sin(e * Math.PI) * 45}) scale(${1 + .35 * Math.sin(k * Math.PI)})`)); p.g.removeAttribute('filter'); await tween(.25, k => p.g.setAttribute('transform', `translate(${b.x},${b.y}) scale(${.8 + .08 * Math.sin(k * Math.PI)})`), 'lin'); },
  async animRestock(m, p, n) { p.g.style.opacity = 0; await wait(n * .1); p.g.style.opacity = 1; await tween(.6, e => p.g.setAttribute('transform', `translate(${p.x},${lerp(p.y - 70, p.y, e)})`), 'in'); await tween(.35, k => p.g.setAttribute('transform', `translate(${p.x},${p.y}) scale(${1 + .18 * Math.sin(k * Math.PI)},${1 - .18 * Math.sin(k * Math.PI)})`), 'lin'); },
  async animAuction(pm, g, n, bids) { const p = pos(g); await tween(.3, e => setPos(g, p.x, p.y - 8 * e)); for (const [pl, v] of bids) { const t = el('g', {}, pm.gFx); t.innerHTML = `<line x1="0" y1="-14" x2="0" y2="-4" stroke="var(--muted)" stroke-width=".7"/><rect x="-22" y="-4" width="44" height="15" rx="3" fill="var(--surface)" filter="url(#gd-shadow)"/><circle cx="-16" cy="3.5" r="2.5" fill="${pcol(pl)}"/><text x="3" y="7" text-anchor="middle" style="font:700 9px Fraunces;fill:var(--ink)">${v === null ? 'passt' : v + ' €'}</text>`; await tween(.45, (e, k) => t.setAttribute('transform', `translate(${p.x + 50},${p.y - 2}) rotate(${Math.sin(k * 9) * 8 * (1 - k)})`), 'out'); await wait(.3); t.remove(); } },
  async animAway(pm, g, pl) { const p = pos(g); await tween(.9, (e, k) => { setPos(g, p.x - 180 * e, p.y - 50 * e, `rotate(${-30 * e})`); g.style.opacity = 1 - k; }); },
};
