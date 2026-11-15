/* Konzept A – Grid Plan: Netzplanungs-Blatt. Plotter, Vermessungsmarken, Stempel. */
const THEME = {
  meta: {
    key: 'A', name: 'Grid Plan', tagline: 'Das Spielbrett als Netzplanungs-Blatt: Jede Leitung wird geplottet, jede Stadt bekommt einen Vermessungsring pro Versorger.',
    keywords: ['Planungsblatt', 'Plotter-Animationen', 'Vermessungsmarken', 'Hell + Dunkel (Blaupause)'],
    idea: 'Ein Ingenieursblatt, das während des Spiels fertig gezeichnet wird.',
    principles: [['Zeichnen statt Zaubern', 'Leitungen entstehen wie mit dem Plotter: erst Hilfslinie, dann Tinte, dazu eine Bemaßung mit den Kosten.'], ['Städte wachsen sichtbar', 'Jede Firma, die eine Stadt anschließt, setzt einen weiteren farbigen Vermessungsring. Volle Städte erkennt man sofort.'], ['Ruhige Präzision', 'Raster, Schraffur, Monospace-Zahlen. Kein Glanz, keine Schatten. Lesbarkeit vor Effekt.']],
    fonts: { display: 'IBM Plex Sans Condensed', text: 'IBM Plex Sans', mono: 'IBM Plex Mono' },
    statesTitle: 'Vermessungsringe zeigen, wer eine Stadt versorgt',
    anim: { line: 'Plotterkopf zieht erst eine Hilfslinie, dann die Tinte; die Kosten erscheinen als Bemaßung.', house: 'Pro Firma ein neuer Ring, dazu ein „GENEHMIGT“-Stempel.', power: 'Ein Signal läuft als Strichmuster durch jedes Netz, die Städte blinken nacheinander.', buy: 'Stücke springen auf einer gepunkteten Flugbahn ins Lager.', restock: 'Neue Stücke werden mit Passermarken „eingeplottet“.', auction: 'Gebote stehen in Handschrift-Mono neben der Karte, überbotene werden durchgestrichen.' },
    verdictTitle: 'Klar, eigenständig, sehr gut lesbar',
    strengths: ['Eigenständige Identität, die kein anderes Brettspiel-App hat', 'Top-Lesbarkeit auf dem iPhone: dünne Linien, klare Zahlen', 'Animationen erklären die Regeln: Bemaßung zeigt Kosten, Ringe zeigen Versorger', 'Hell- und Dunkelmodus (Blaupause) fühlen sich gleich stark an'],
    risks: ['Wirkt nüchtern; „Premium“ entsteht nur über Präzision und Details', 'Viele feine Linien brauchen gute Kantenglättung'],
    effort: 'Mittel. Fast alles ist 2D-Vektor und läuft auch auf alten iPhones flüssig.',
    fit: 'Sehr hoch: genau die „Grid Plan“-Richtung, die du schon magst, jetzt mit Märkten und vollem Animationssatz.',
  },
  vars: {
    dark: { '--bg': '#0d1c29', '--surface': '#112434', '--ink': '#d8e6f1', '--muted': '#8aa3b8', '--line': '#24425b', '--accent': '#ffb84d', '--accent-ink': '#1a1205', '--p0': '#ffb84d', '--p1': '#ff7aa2', '--p2': '#5fd3c3', '--grid': 'rgba(120,180,225,.10)', '--grid2': 'rgba(120,180,225,.2)', '--hatch': 'rgba(140,195,235,.22)', '--edge': '#5f86a3', '--river': '#4fa3d9', '--frame': '#05101a', '--ft': '"IBM Plex Sans",sans-serif', '--fd': '"IBM Plex Sans Condensed",sans-serif', '--fm': '"IBM Plex Mono",monospace', '--radius': '6px', '--bradius': '4px' },
    light: { '--bg': '#f1eee4', '--surface': '#f9f7f0', '--ink': '#1d2b3a', '--muted': '#5f6f7d', '--line': '#cfc8b6', '--accent': '#d9480f', '--accent-ink': '#ffffff', '--p0': '#d9480f', '--p1': '#7b2cbf', '--p2': '#0a8f84', '--grid': 'rgba(40,80,120,.08)', '--grid2': 'rgba(40,80,120,.16)', '--hatch': 'rgba(40,70,110,.2)', '--edge': '#8191a0', '--river': '#2f7fb8', '--frame': '#2b2b2b', '--ft': '"IBM Plex Sans",sans-serif', '--fd': '"IBM Plex Sans Condensed",sans-serif', '--fm': '"IBM Plex Mono",monospace', '--radius': '6px', '--bradius': '4px' },
  },
  swatches: [['--bg', 'Papier'], ['--surface', 'Fläche'], ['--ink', 'Tusche'], ['--accent', 'Markierung'], ['--p0', 'Du'], ['--p1', 'Rhein AG'], ['--p2', 'Isar']],
  css: `
  .clabel{font:600 7px var(--fm);letter-spacing:.08em;text-transform:uppercase;fill:var(--ink);opacity:.8}
  .edge{stroke:var(--edge);stroke-width:.7;stroke-dasharray:3 2.5}
  .cost{font:500 6px var(--fm);fill:var(--muted)}
  .own{fill:none;stroke-width:2.4;stroke-linecap:square}
  .panel{fill:url(#ga-grid) var(--surface);stroke:var(--ink);stroke-width:1}
  .ptitle{font:600 13px var(--fd);letter-spacing:.12em;fill:var(--ink)}
  .rlabel{font:500 11px var(--fm);fill:var(--muted);text-transform:uppercase}
  .cell{fill:none;stroke:var(--line);stroke-width:1}
  .price{font:500 9px var(--fm);fill:var(--muted)}
  .card{fill:var(--surface);stroke:var(--ink);stroke-width:1}.card.future{stroke-dasharray:4 3}.card.selected{stroke:var(--accent);stroke-width:2}.card.owned{fill:color-mix(in srgb,var(--accent) 8%,var(--surface))}
  .cnum{font:600 26px var(--fm);fill:var(--ink)}.csub{font:500 9px var(--fm);fill:var(--muted);text-transform:uppercase}.cpow{font:600 13px var(--fm);fill:var(--ink)}
  .cardback{fill:var(--surface);stroke:var(--ink);stroke-width:1}
  .fx-text{fill:var(--accent)}
  .stamp{font:700 9px var(--fm);letter-spacing:.12em;fill:none;stroke:var(--accent);stroke-width:.8}
  .pen{fill:none;stroke:var(--accent);stroke-width:1}
  .board,.market,.plants{background:var(--bg)}
  .stage{background:var(--bg)}
  `,
  globalDefs(d) {
    d.innerHTML = `<pattern id="ga-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" style="stroke:var(--grid2)" stroke-width=".8"/><path d="M8 0V40M16 0V40M24 0V40M32 0V40M0 8H40M0 16H40M0 24H40M0 32H40" fill="none" style="stroke:var(--grid)" stroke-width=".5"/></pattern>`
      + [0, 45, 90, 135, 30, 150].map((a, i) => `<pattern id="ga-h${i}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(${a})"><line x1="0" y1="0" x2="0" y2="6" style="stroke:var(--hatch)" stroke-width="1"/></pattern>`).join('');
  },
  land(b, M) {
    const g = b.gLand; el('rect', { x: -400, y: -400, width: 1400, height: 1600, fill: 'url(#ga-grid)' }, g);
    M.regions.forEach((r, i) => el('path', { d: r.d, fill: `url(#ga-h${i % 6})`, stroke: 'var(--edge)', 'stroke-width': .5, 'stroke-dasharray': '1 2' }, g));
    M.rivers.forEach(d => el('path', { d, fill: 'none', stroke: 'var(--river)', 'stroke-width': .8, 'stroke-dasharray': '4 1.5', opacity: .8 }, g));
    b.outline = el('path', { d: M.land, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5 }, g);
    el('path', { d: M.land, fill: 'none', stroke: 'var(--ink)', 'stroke-width': .5, transform: 'translate(2.5,2.5)', opacity: .5 }, g);
    if (!b.o.view) { // title block, north arrow, scale bar
      const tb = el('g', { transform: `translate(${M.w - 190},${M.h - 62})` }, g); el('rect', { width: 178, height: 50, fill: 'var(--bg)', stroke: 'var(--ink)', 'stroke-width': 1 }, tb); el('line', { x1: 0, y1: 20, x2: 178, y2: 20, stroke: 'var(--ink)', 'stroke-width': .6 }, tb);
      const t1 = el('text', { x: 8, y: 14, style: 'font:600 9px var(--fm);fill:var(--ink)' }, tb); t1.textContent = 'GRID MASTER 2 · BLATT 1'; const t2 = el('text', { x: 8, y: 33, style: 'font:500 7px var(--fm);fill:var(--muted)' }, tb); t2.textContent = 'NETZPLAN DEUTSCHLAND'; const t3 = el('text', { x: 8, y: 44, style: 'font:500 7px var(--fm);fill:var(--muted)' }, tb); t3.textContent = 'M 1:2.500.000 · RUNDE 4';
      const na = el('g', { transform: 'translate(40,60)' }, g); el('path', { d: 'M0,-18L6,6L0,1L-6,6Z', fill: 'var(--ink)' }, na); const n = el('text', { y: -22, 'text-anchor': 'middle', style: 'font:600 9px var(--fm);fill:var(--ink)' }, na); n.textContent = 'N';
    }
  },
  edge(b, e, A, B) { const s = seg(A, B); el('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, class: 'edge' }, b.gEdges); if (!b.o.view || b.o.cls === 'anb') { const t = el('text', { x: (A.x + B.x) / 2 + s.nx * 5, y: (A.y + B.y) / 2 + s.ny * 5 + 2, class: 'cost', 'text-anchor': 'middle' }, b.gEdges); t.textContent = e.cost; } },
  line(b, e, pl, lane) { const s = seg(CITY[e.a], CITY[e.b], lane - .5 * (lane > 0)); return el('path', { d: `M${s.x1},${s.y1}L${s.x2},${s.y2}`, class: 'own', stroke: pcol(pl) }, b.gLines); },
  city(b, g, c, own, f) {
    const rings = own.map((pl, i) => `<circle r="${7 + i * 2.6}" fill="none" stroke="${pcol(pl)}" stroke-width="1.8"/>`).join('');
    const reach = f.reach ? `<circle r="${9 + own.length * 2.6}" fill="none" stroke="var(--accent)" stroke-width=".9" stroke-dasharray="2 2"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="12s" repeatCount="indefinite"/></circle>` : '';
    const sel = f.sel ? [0, 90, 180, 270].map(a => `<path d="M11,7V11H7" fill="none" stroke="var(--accent)" stroke-width="1.6" transform="rotate(${a})"/>`).join('') : '';
    g.innerHTML = `<circle r="12" fill="transparent"/>${reach}${rings}<circle r="4.2" fill="var(--bg)" stroke="var(--ink)" stroke-width="1.2"/><path d="M-6,0H6M0,-6V6" stroke="var(--ink)" stroke-width=".7"/>${own.length ? `<text x="7" y="-7" style="font:600 5.5px var(--fm);fill:var(--muted)">${own.length}/3</text>` : ''}${sel}`;
  },
  async animLine(b, l, A, B, pl) {
    const p = l.el; if (l.e.a !== A.id) { const d = p.getAttribute('d').match(/M([^L]+)L(.+)/); p.setAttribute('d', `M${d[2]}L${d[1]}`); }
    const s = seg(A, B), guide = el('path', { d: p.getAttribute('d'), fill: 'none', stroke: 'var(--ink)', 'stroke-width': .6, 'stroke-dasharray': '2 2', opacity: .7 }, b.gFx);
    const head = el('g', {}, b.gFx); head.innerHTML = `<circle r="4" class="pen"/><path d="M-7,0H7M0,-7V7" class="pen"/>`;
    const dur = .5 + s.L * .007; await FX.along(guide, dur * .6, q => head.setAttribute('transform', `translate(${q.x},${q.y})`), 'lin'); guide.remove();
    p.style.opacity = 1; const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    await tween(dur, k => { p.style.strokeDashoffset = L * (1 - k); const q = p.getPointAtLength(L * k); head.setAttribute('transform', `translate(${q.x},${q.y})`); }, 'inout'); p.style.strokeDasharray = ''; head.remove();
    // dimension annotation
    const mx = (A.x + B.x) / 2 + s.nx * 11, my = (A.y + B.y) / 2 + s.ny * 11, dim = el('g', {}, b.gFx);
    dim.innerHTML = `<line x1="${s.x1 + s.nx * 11}" y1="${s.y1 + s.ny * 11}" x2="${s.x2 + s.nx * 11}" y2="${s.y2 + s.ny * 11}" stroke="var(--accent)" stroke-width=".7"/><text x="${mx + s.nx * 6}" y="${my + s.ny * 6 + 2}" text-anchor="middle" style="font:600 7px var(--fm);fill:var(--accent)">Δ ${l.e.cost} €</text>`;
    await tween(.3, e => dim.style.opacity = e); wait(1.2).then(() => tween(.4, e => dim.style.opacity = 1 - e).then(() => dim.remove()));
  },
  async animHouse(b, c, pl, g) {
    const n = (b.owners[c.id] || []).length, r = 7 + (n - 1) * 2.6, ring = el('circle', { cx: c.x, cy: c.y, r: 0, fill: 'none', stroke: pcol(pl), 'stroke-width': 1.8 }, b.gFx);
    const rings = g.querySelectorAll('circle[stroke-width="1.8"]'); const last = rings[rings.length - 1]; if (last) last.style.opacity = 0;
    await tween(.6, e => ring.setAttribute('r', r * e), 'out'); ring.remove(); if (last) last.style.opacity = 1;
    const st = el('g', { transform: `translate(${c.x + 4},${c.y - 14}) rotate(-12)` }, b.gFx); st.innerHTML = `<rect x="-30" y="-8" width="60" height="13" fill="none" stroke="var(--accent)" stroke-width="1"/><text text-anchor="middle" y="2" class="stamp">GENEHMIGT</text>`;
    await tween(.25, (e, k) => { st.setAttribute('transform', `translate(${c.x + 4},${c.y - 14}) rotate(-12) scale(${1.8 - .8 * e})`); st.style.opacity = k; }, 'in');
    FX.ripple(b.gFx, c.x, c.y, 'var(--accent)', 22, .6, 1); await wait(.7); await tween(.4, e => st.style.opacity = 1 - e); st.remove();
  },
  async animPower(b, seqs) {
    await Promise.all(seqs.map(async ({ pl, order }) => { for (const [id, from, l] of order) { if (l) { const p = l.el, o = el('path', { d: p.getAttribute('d'), fill: 'none', stroke: 'var(--bg)', 'stroke-width': 1.2, 'stroke-dasharray': '3 5' }, b.gFx); const rev = l.e.a !== from; await tween(.55, k => o.style.strokeDashoffset = (rev ? 1 : -1) * k * 40, 'lin'); wait(.6).then(() => o.remove()); } const c = CITY[id]; FX.ripple(b.gFx, c.x, c.y, pcol(pl), 16, .6, 1.2); } }));
  },
  async intro(b) {
    b.reset(); const o = b.outline, L = o.getTotalLength(); [...b.gLand.children].forEach(n => { if (n !== o) n.style.opacity = 0; }); b.gCities.style.opacity = 0; b.gLabels.style.opacity = 0; b.gEdges.style.opacity = 0;
    o.style.strokeDasharray = L; o.style.strokeDashoffset = L; await tween(1.6, k => o.style.strokeDashoffset = L * (1 - k), 'inout'); o.style.strokeDasharray = '';
    await tween(.6, e => { [...b.gLand.children].forEach(n => n.style.opacity = e); b.gEdges.style.opacity = e; });
    const cs = [...b.gCities.children]; b.gCities.style.opacity = 1; cs.forEach(c => c.style.opacity = 0);
    await Promise.all(cs.map((c, i) => tween(.25, e => c.style.opacity = e, 'out', i * .02))); b.gLabels.style.opacity = 1;
    b.setup(); await Promise.all(b.lines.map((l, i) => wait(i * .15).then(() => FX.drawStroke(l.el, .6))));
  },
  piece(k) {
    if (k === 'coal') return `<path d="M-5.5,3L-4.5,-3L0,-5.5L5,-3L6,2.5L1,5.5Z" fill="var(--ink)" fill-opacity=".85"/><path d="M-3,-2L0,-4L2,-1Z" fill="var(--bg)" opacity=".5"/>`;
    if (k === 'oil') return `<rect x="-4.5" y="-6" width="9" height="12" rx="1.2" fill="none" stroke="var(--ink)" stroke-width="1.3"/><path d="M-4.5,-2H4.5M-4.5,2H4.5" stroke="var(--ink)" stroke-width=".8"/>`;
    if (k === 'garbage') return `<path d="M-5.5,5C-6.5,0,-5,-3,-1.5,-3.5L-2.5,-6H2.5L1.5,-3.5C5,-3,6.5,0,5.5,5Z" fill="none" stroke="var(--ink)" stroke-width="1.3"/>`;
    return `<rect x="-4.5" y="-6" width="9" height="12" rx="1.2" fill="none" stroke="var(--accent)" stroke-width="1.3"/><circle r="2.2" fill="var(--accent)"/>`;
  },
  card(n, [res, need, pow], state) { return `<rect width="100" height="70" class="card ${state}"/><line x1="0" y1="18" x2="100" y2="18" stroke="var(--line)"/><text x="6" y="13" style="font:500 8px var(--fm);fill:var(--muted)">KW-${String(n).padStart(2, '0')}</text><text x="94" y="13" text-anchor="end" style="font:500 8px var(--fm);fill:var(--muted)">${state === 'owned' ? 'EIGEN' : state === 'future' ? 'ZUKUNFT' : ''}</text><text x="8" y="48" class="cnum">${n}</text><text x="52" y="38" class="csub">${RNAME[res]}</text><text x="52" y="50" class="csub">${need ? need + ' Einh.' : '—'}</text><text x="92" y="63" class="cpow" text-anchor="end">→ ${pow}</text>`; },
  cardBack() { return `<rect width="100" height="70" class="cardback"/><path d="M0,0L100,70M100,0L0,70" stroke="var(--line)"/><text x="50" y="39" text-anchor="middle" style="font:600 9px var(--fm);fill:var(--muted)">STAPEL</text>`; },
  async animBuy(m, p, b, n) { await wait(n * .18); const a = { x: p.x, y: p.y }, path = el('path', { d: `M${a.x},${a.y}Q${(a.x + b.x) / 2},${Math.min(a.y, b.y) - 50} ${b.x},${b.y}`, fill: 'none', stroke: 'var(--accent)', 'stroke-width': .8, 'stroke-dasharray': '1.5 3' }, m.gFx); await FX.along(path, .8, (q, k) => p.g.setAttribute('transform', `translate(${q.x},${q.y}) scale(${1 - .2 * k})`)); path.remove(); p.g.setAttribute('transform', `translate(${b.x},${b.y}) scale(.8)`); },
  async animRestock(m, p, n) { p.g.style.opacity = 0; await wait(n * .12); const mk = el('g', { transform: `translate(${p.x},${p.y})` }, m.gFx); mk.innerHTML = `<circle r="7" class="pen"/><path d="M-10,0H10M0,-10V10" class="pen"/>`; await tween(.25, e => mk.style.opacity = e); await tween(.3, e => p.g.style.opacity = e); await tween(.3, e => mk.style.opacity = 1 - e); mk.remove(); },
  async animAuction(pm, g, n, bids) { const p = pos(g); await tween(.3, e => setPos(g, p.x, p.y - 6 * e)); let prev = null, i = 0; for (const [pl, v] of bids) { const t = el('text', { x: p.x + 104, y: p.y + 10 + i * 11, style: `font:600 9px var(--fm);fill:${pcol(pl)}` }, pm.gFx); t.textContent = v === null ? `${PLAYERS[pl].name}: passt` : `${PLAYERS[pl].name}: ${v} €`; if (prev && v !== null) { const bb = prev.getBBox(); el('line', { x1: bb.x, y1: bb.y + bb.height / 2, x2: bb.x + bb.width, y2: bb.y + bb.height / 2, stroke: 'var(--muted)', 'stroke-width': .8 }, pm.gFx); } if (v !== null) prev = t; i++; await wait(.55); } await wait(.5); pm.gFx.innerHTML = ''; },
};
