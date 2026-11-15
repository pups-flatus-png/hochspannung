/* Konzept B – Night Grid: flacher, edler Nacht-Look. Lichter, Skylines, Energie-Orbs. */
const THEME = {
  meta: {
    key: 'B', name: 'Night Grid', tagline: 'Deutschland bei Nacht: Jede versorgte Stadt leuchtet, Skylines wachsen mit jedem Versorger, Energie fließt sichtbar durchs Netz.',
    keywords: ['Nachtkarte', 'Leuchtende Skylines', 'Energie-Orbs', 'Hell = Dämmerung'],
    idea: 'Dein Netz bringt das Land zum Leuchten.',
    principles: [['Licht ist Fortschritt', 'Je mehr Firmen eine Stadt versorgen, desto größer und heller wird ihre Skyline. Der Spielstand ist ein Lichtbild.'], ['Energie hat eine Richtung', 'Beim Bauen und Liefern laufen Energie-Orbs mit Leuchtspur durch die Leitungen, die Fenster gehen Stockwerk für Stockwerk an.'], ['Flach, aber edel', 'Keine Reliefs, nur feine Gold-Haarlinien, sanfte Lichthöfe und klare Typografie.']],
    fonts: { display: 'Orbitron', text: 'Barlow', mono: 'Orbitron' },
    statesTitle: 'Skylines wachsen mit jedem Versorger',
    anim: { line: 'Ein Energie-Orb mit Leuchtspur zieht die Leitung, kleine Masten blitzen auf.', house: 'Lichtstrahl, die Skyline wächst, Fenster gehen Stockwerk für Stockwerk an, Funken.', power: 'Orbs rasen durch jedes Netz, Städte erstrahlen nacheinander.', buy: 'Stücke steigen mit Leuchtspur auf und landen im Lager.', restock: 'Neue Stücke fallen von oben, prallen auf und versprühen Funken.', auction: 'Leuchtende Gebots-Marken in Spielerfarbe, die Karte fliegt mit Spur zu dir.' },
    verdictTitle: 'Emotional, „Premium“ auf den ersten Blick',
    strengths: ['Starker Wow-Effekt, gut für App-Store-Screenshots', 'Fortschritt ist sofort sichtbar: Wer viel Licht hat, führt', 'Baut direkt auf dem 3D-Prototyp v5 auf'], risks: ['Leuchteffekte kosten auf alten iPhones Leistung', 'Bei vielen Spielern kann es unruhig werden; Glühen muss dosiert bleiben'],
    effort: 'Mittel bis hoch. Glow-Filter und Partikel brauchen Feinschliff und Leistungsstufen.',
    fit: 'Hoch: Das ist deine aktuelle 3D-Richtung, flach und ruhiger umgesetzt.',
  },
  vars: {
    dark: { '--bg': '#070c11', '--surface': '#0f1820', '--ink': '#e3eaee', '--muted': '#8797a3', '--line': '#1e2b36', '--accent': '#f2b33d', '--accent-ink': '#1d1405', '--p0': '#f2b33d', '--p1': '#ff5fa2', '--p2': '#4fd6c4', '--land': '#16212a', '--edge': '#3a4c5a', '--sky': '#2b3742', '--win': '#ffd27a', '--frame': '#000', '--ft': 'Barlow,sans-serif', '--fd': 'Orbitron,sans-serif', '--fm': 'Orbitron,sans-serif', '--radius': '16px', '--h1w': '800' },
    light: { '--bg': '#e8edf1', '--surface': '#f7f9fb', '--ink': '#17212b', '--muted': '#5b6976', '--line': '#d0d9e0', '--accent': '#c98a10', '--accent-ink': '#fff', '--p0': '#d08a00', '--p1': '#d6336c', '--p2': '#0f9d8a', '--land': '#dde4ea', '--edge': '#a7b4bf', '--sky': '#8996a2', '--win': '#ffb733', '--frame': '#1b1f24', '--ft': 'Barlow,sans-serif', '--fd': 'Orbitron,sans-serif', '--fm': 'Orbitron,sans-serif', '--radius': '16px', '--h1w': '800' },
  },
  css: `
  .clabel{font:600 6.5px Barlow;letter-spacing:.14em;text-transform:uppercase;fill:var(--ink);opacity:.75;paint-order:stroke;stroke:var(--bg);stroke-width:2px}
  .edge{stroke:var(--edge);stroke-width:.7;stroke-dasharray:.5 2.6;stroke-linecap:round}
  .own{fill:none;stroke-width:2.2;stroke-linecap:round;filter:url(#gb-glow)}
  .panel{fill:var(--surface);stroke:var(--line)}
  .ptitle{font:700 12px Orbitron;letter-spacing:.14em;fill:var(--accent)}
  .rlabel{font:600 11px Barlow;letter-spacing:.08em;fill:var(--muted);text-transform:uppercase}
  .cell{fill:color-mix(in srgb,var(--ink) 4%,transparent);stroke:var(--line)}
  .price{font:700 8px Orbitron;fill:var(--muted)}
  .card{fill:var(--bg);stroke:var(--line)}.card.selected{stroke:var(--accent);stroke-width:2}.card.future{opacity:.85}.card.owned{stroke:var(--accent)}
  .cnum{font:800 24px Orbitron;fill:var(--ink)}.csub{font:600 9px Barlow;fill:var(--muted);text-transform:uppercase;letter-spacing:.08em}.cpow{font:700 13px Orbitron;fill:var(--accent)}
  .cardback{fill:var(--bg);stroke:var(--accent);stroke-opacity:.6}
  .fx-glow{filter:url(#gb-glow)}
  .fx-text{fill:var(--accent);font-family:Orbitron}
  [data-mode=light] .own{filter:none}
  `,
  globalDefs(d) {
    d.innerHTML = `<filter id="gb-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="gb-soft" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
    <radialGradient id="gb-pool"><stop offset="0" stop-color="#ffb860" stop-opacity=".85"/><stop offset=".4" stop-color="#ff9a40" stop-opacity=".3"/><stop offset="1" stop-color="#ff8a30" stop-opacity="0"/></radialGradient>
    <linearGradient id="gb-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>
    <linearGradient id="gb-drum" x1="0" x2="1"><stop offset="0" stop-color="#0c0d10"/><stop offset=".45" stop-color="#3a414b"/><stop offset="1" stop-color="#0c0d10"/></linearGradient>
    <linearGradient id="gb-udrum" x1="0" x2="1"><stop offset="0" stop-color="#7a1712"/><stop offset=".45" stop-color="#e04b3d"/><stop offset="1" stop-color="#7a1712"/></linearGradient>
    <radialGradient id="gb-bag" cx=".35" cy=".35"><stop offset="0" stop-color="#ffe58a"/><stop offset="1" stop-color="#c99a1c"/></radialGradient>`;
  },
  land(b, M) {
    const g = b.gLand; el('path', { d: M.land, fill: 'var(--land)', stroke: 'none' }, g);
    M.regions.forEach(r => el('path', { d: r.d, fill: r.col, 'fill-opacity': .1, stroke: 'var(--ink)', 'stroke-opacity': .12, 'stroke-width': .6 }, g));
    M.rivers.forEach(d => el('path', { d, fill: 'none', stroke: '#4c8fbf', 'stroke-width': .7, opacity: .5 }, g));
    b.outline = el('path', { d: M.land, fill: 'none', stroke: 'var(--accent)', 'stroke-width': .9, 'stroke-opacity': .8 }, g);
    b.gPools = el('g', {}, g);
  },
  city(b, g, c, own, f) {
    const n = own.length, R = GM.rng(c.id), bars = []; const count = 4 + n * 2;
    for (let i = 0; i < count; i++) { const w = 2.2 + R() * 2.4, h = 4 + R() * (5 + n * 5) + (i === Math.floor(count / 2) ? n * 3 : 0), x = -9 + i * (18 / count); bars.push({ x, w, h }); }
    const lit = n > 0;
    const sky = bars.map((r, i) => `<g class="bld" data-i="${i}"><rect x="${r.x}" y="${-r.h - 3}" width="${r.w}" height="${r.h}" fill="var(--sky)"/>${lit ? Array.from({ length: Math.floor(r.h / 2.2) }, (_, k) => `<rect class="win" x="${r.x + .7}" y="${-3 - 1.6 - k * 2.2}" width="${Math.max(.6, r.w - 1.4)}" height=".7" fill="var(--win)" opacity="${GM.rng(c.id + i + k)() < .7 ? .9 : .15}"/>`).join('') : ''}</g>`).join('');
    const pool = lit ? `<circle r="${12 + n * 5}" fill="url(#gb-pool)" opacity="${.35 + n * .15}"/>` : '';
    const slots = [0, 1, 2].map(i => `<circle cx="${(i - 1) * 3.6}" cy="2.3" r="1.25" fill="${own[i] !== undefined ? pcol(own[i]) : 'var(--bg)'}" stroke="var(--edge)" stroke-width=".4"/>`).join('');
    const reach = f.reach ? `<circle r="8" fill="none" stroke="var(--accent)" stroke-width=".9" opacity=".8"><animate attributeName="r" values="7;9;7" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;.3;.9" dur="2.4s" repeatCount="indefinite"/></circle>` : '';
    const sel = f.sel ? `<circle r="10" fill="none" stroke="var(--accent)" stroke-width="1.6"/>` : '';
    g.innerHTML = `<circle r="12" fill="transparent"/>${pool}${reach}${sel}<g class="sky">${sky}</g><rect x="-7.5" y="-.2" width="15" height="5" rx="2.5" fill="var(--surface)" stroke="var(--accent)" stroke-width=".5" stroke-opacity=".7"/>${slots}`;
  },
  label(b, c) { const t = el('text', { x: c.x, y: c.y + 12.5, class: 'clabel', 'text-anchor': 'middle' }, b.gLabels); t.textContent = c.name; },
  async animLine(b, l, A, B, pl) {
    const p = l.el; if (l.e.a !== A.id) { const d = p.getAttribute('d').match(/M([^L]+)L(.+)/); p.setAttribute('d', `M${d[2]}L${d[1]}`); }
    const col = pcol(pl), L = p.getTotalLength(), orb = el('circle', { r: 3.2, fill: col, class: 'fx-glow' }, b.gFx), core = el('circle', { r: 1.4, fill: '#fff' }, b.gFx);
    p.style.strokeDasharray = L; p.style.strokeDashoffset = L; let lt = 0, lastPy = -1; const dur = .6 + L * .008;
    await tween(dur, (e, k) => { p.style.strokeDashoffset = L * (1 - e); const q = p.getPointAtLength(L * e); orb.setAttribute('cx', q.x); orb.setAttribute('cy', q.y); core.setAttribute('cx', q.x); core.setAttribute('cy', q.y);
      if (k - lt > .03) { lt = k; const t = el('circle', { cx: q.x, cy: q.y, r: 1.8, fill: col, opacity: .8 }, b.gFx); tween(.5, (e2, k2) => { t.setAttribute('r', 1.8 * (1 - k2)); t.setAttribute('opacity', .8 * (1 - k2)); }, 'lin').then(() => t.remove()); }
      const py = Math.floor(e * L / 14); if (py !== lastPy && e > .05 && e < .95) { lastPy = py; const m = el('path', { d: `M${q.x - 1.6},${q.y + 1.5}L${q.x},${q.y - 3}L${q.x + 1.6},${q.y + 1.5}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': .5, opacity: .7 }, b.gLines); FX.flash(b.gFx, q.x, q.y - 3, col, 4, .4); m.dataset.pylon = 1; } }, 'inout');
    p.style.strokeDasharray = ''; orb.remove(); core.remove();
  },
  async animHouse(b, c, pl, g, o = {}) {
    const col = pcol(pl), beam = el('rect', { x: c.x - 4, y: c.y - 90, width: 8, height: 90, fill: 'url(#gb-beam)', opacity: 0 }, b.gFx);
    await tween(.35, e => beam.setAttribute('opacity', e * .8));
    const blds = [...g.querySelectorAll('.bld')]; blds.forEach(x => { x.style.transformBox = 'fill-box'; x.style.transformOrigin = '50% 100%'; x.style.transform = 'scaleY(0)'; });
    g.querySelectorAll('.win').forEach(w => w.style.opacity = 0);
    await Promise.all(blds.map((x, i) => tween(.45, e => x.style.transform = `scaleY(${e})`, 'back', i * .05)));
    FX.burst(b.gFx, c.x, c.y - 4, [col, '#fff', 'var(--win)'], 22, { speed: 42, up: 25, gravity: 70, size: 1.3 }); FX.ripple(b.gFx, c.x, c.y, col, 30, 1, 1.4);
    tween(.6, e => beam.setAttribute('opacity', .8 * (1 - e))).then(() => beam.remove());
    const wins = [...g.querySelectorAll('.win')].sort((a, b2) => +b2.getAttribute('y') - +a.getAttribute('y'));
    await Promise.all(wins.map((w, i) => tween(.15, e => w.style.opacity = '', 'lin', i * .012)));
  },
  async animPower(b, seqs) {
    await Promise.all(seqs.map(async ({ pl, order }) => { const col = pcol(pl); for (const [id, from, l] of order) { if (l) { const p = l.el, L = p.getTotalLength(), rev = l.e.a !== from, orb = el('circle', { r: 2.8, fill: col, class: 'fx-glow' }, b.gFx); let lt = 0; await tween(.5, (e, k) => { const q = p.getPointAtLength(L * (rev ? 1 - e : e)); orb.setAttribute('cx', q.x); orb.setAttribute('cy', q.y); if (k - lt > .06) { lt = k; const t = el('circle', { cx: q.x, cy: q.y, r: 1.5, fill: col }, b.gFx); tween(.4, (e2, k2) => t.setAttribute('opacity', 1 - k2), 'lin').then(() => t.remove()); } }); orb.remove(); }
      const c = CITY[id], g = b.cityG(id); FX.flash(b.gFx, c.x, c.y - 4, col, 16, .7); FX.ripple(b.gFx, c.x, c.y, col, 20, .8, 1); if (g) { const pool = g.querySelector('circle[fill="url(#gb-pool)"]'); if (pool) tween(.9, (e, k) => pool.setAttribute('opacity', 1 - .4 * k)); } } }));
  },
  async intro(b) {
    b.reset(); b.svg.style.opacity = 0; await tween(.6, e => b.svg.style.opacity = e);
    const cs = [...b.gCities.children].sort((x, y) => MAP.cities.find(c => c.id === x.dataset.id).y - MAP.cities.find(c => c.id === y.dataset.id).y); cs.forEach(g => g.style.opacity = 0);
    await Promise.all(cs.map((g, i) => tween(.35, e => g.style.opacity = e, 'out', i * .03)));
    b.setup(); await Promise.all(b.lines.map((l, i) => wait(i * .15).then(() => FX.drawStroke(l.el, .6))));
    for (const id of Object.keys(b.owners)) { const c = CITY[id]; FX.flash(b.gFx, c.x, c.y - 4, pcol(b.owners[id][0]), 14, .6); await wait(.06); }
  },
  piece(k) {
    if (k === 'coal') return `<path d="M-5.5,3.5L-5,-2L-1.5,-5L4,-3.5L6,1.5L2,5Z" fill="#1d1d20" stroke="#000" stroke-width=".3"/><path d="M-1.5,-5L4,-3.5L1,-.5Z" fill="#5a5d66"/><path d="M-5,-2L-1.5,-5L1,-.5Z" fill="#33363d"/>`;
    if (k === 'oil') return `<rect x="-4.5" y="-6" width="9" height="12" rx="1" fill="url(#gb-drum)"/><path d="M-4.5,-2.5H4.5M-4.5,2H4.5" stroke="#6c7480" stroke-width=".6"/><ellipse cx="0" cy="-6" rx="4.5" ry="1" fill="#4a525c"/>`;
    if (k === 'garbage') return `<path d="M-5.5,5C-7,0,-5,-3.5,-1.3,-3.8L-2,-6.2L2,-6.2L1.3,-3.8C5,-3.5,7,0,5.5,5Z" fill="url(#gb-bag)"/><path d="M-2,-6.2L0,-4.6L2,-6.2" fill="none" stroke="#8a6a10" stroke-width=".6"/>`;
    return `<rect x="-4.3" y="-5.6" width="8.6" height="11.2" rx="1" fill="url(#gb-udrum)"/><circle r="2.4" fill="#f4c430"/><path d="M0,0L-1.2,-2.1A2.4,2.4 0 0 1 1.2,-2.1ZM0,0L2.4,0A2.4,2.4 0 0 1 1.2,2.1ZM0,0L-1.2,2.1A2.4,2.4 0 0 1 -2.4,0Z" fill="#1a1a1a"/>`;
  },
  card(n, [res, need, pow], state) { const band = { coal: '#5b3b22', oil: '#3a414b', garbage: '#d8b02c', uranium: '#b8261f', eco: '#3f8f4e', hybrid: '#6a5236' }[res]; return `<rect width="100" height="70" rx="8" class="card ${state}"/><path d="M8,0H30V70H8A8,8 0 0 1 0,62V8A8,8 0 0 1 8,0Z" fill="${band}"/><text x="15" y="40" text-anchor="middle" style="font:800 15px Orbitron;fill:#fff">${n}</text><text x="38" y="26" class="csub">${RNAME[res]}</text><text x="38" y="40" class="csub">${need ? '× ' + need : '—'}</text><text x="92" y="61" class="cpow" text-anchor="end">→ ${pow}</text>`; },
  cardBack() { return `<rect width="100" height="70" rx="8" class="cardback"/><text x="50" y="38" text-anchor="middle" style="font:700 8px Orbitron;fill:var(--accent)">GRID MASTER</text>`; },
  async animBuy(m, p, b, n) { await wait(n * .16); const a = { x: p.x, y: p.y }; let lt = 0; await tween(.9, (e, k) => { const x = lerp(a.x, b.x, e), y = lerp(a.y, b.y, e) - Math.sin(e * Math.PI) * 70; p.g.setAttribute('transform', `translate(${x},${y}) scale(${1 + .3 * Math.sin(k * Math.PI)})`); if (k - lt > .05) { lt = k; const t = el('circle', { cx: x, cy: y, r: 2.2, fill: 'var(--accent)', class: 'fx-glow' }, m.gFx); tween(.4, (e2, k2) => t.setAttribute('opacity', 1 - k2), 'lin').then(() => t.remove()); } }); p.g.setAttribute('transform', `translate(${b.x},${b.y}) scale(.8)`); FX.burst(m.gFx, b.x, b.y, ['var(--accent)', '#fff'], 8, { speed: 25, size: 1.2 }); },
  async animRestock(m, p, n) { p.g.style.opacity = 0; await wait(n * .1); p.g.style.opacity = 1; await tween(.55, e => p.g.setAttribute('transform', `translate(${p.x},${lerp(p.y - 120, p.y, e)})`), 'in'); FX.burst(m.gFx, p.x, p.y + 5, ['var(--accent)', '#fff'], 7, { speed: 22, up: 12, size: 1 }); await tween(.25, k => p.g.setAttribute('transform', `translate(${p.x},${p.y}) scale(${1 + .25 * Math.sin(k * Math.PI)},${1 - .25 * Math.sin(k * Math.PI)})`), 'lin'); },
  async animBurn(m, g, n) { await wait(n * .15); const tr = g.getAttribute('transform'); const glow = el('circle', { r: 0, fill: '#ffd27a', class: 'fx-glow' }, m.gFx); const [x, y] = tr.match(/translate\(([^,]+),([^)]+)\)/).slice(1).map(Number); glow.setAttribute('cx', x); glow.setAttribute('cy', y); await tween(.5, e => { glow.setAttribute('r', 8 * e); g.style.opacity = 1 - e; }); g.remove(); await tween(.6, (e, k) => { glow.setAttribute('cy', y - 80 * e); glow.setAttribute('r', 8 * (1 - k * .6)); glow.setAttribute('opacity', 1 - k); }, 'in'); glow.remove(); },
  async animAuction(pm, g, n, bids) { const p = pos(g); await tween(.35, e => setPos(g, p.x, p.y - 10 * e), 'back'); for (const [pl, v] of bids) { const t = el('g', { transform: `translate(${p.x + 50},${p.y - 14})` }, pm.gFx); t.innerHTML = `<rect x="-26" y="-11" width="52" height="16" rx="8" fill="${pcol(pl)}" class="fx-glow"/><text y="1" text-anchor="middle" style="font:700 9px Orbitron;fill:#111">${v === null ? 'passt' : v + ' €'}</text>`; await tween(.3, e => t.setAttribute('transform', `translate(${p.x + 50},${p.y - 14 - 8 * e}) scale(${.6 + .4 * e})`), 'back'); await wait(.35); await tween(.2, e => t.style.opacity = 1 - e); t.remove(); } },
  async animToMine(pm, g, to) { const p = pos(g); let lt = 0; await tween(1.1, (e, k) => { const x = lerp(p.x, to.x, e), y = lerp(p.y, to.y, e) - Math.sin(e * Math.PI) * 50; setPos(g, x, y); if (k - lt > .05) { lt = k; const t = el('circle', { cx: x + 50, cy: y + 35, r: 3, fill: 'var(--accent)', class: 'fx-glow' }, pm.gFx); tween(.5, (e2, k2) => t.setAttribute('opacity', 1 - k2), 'lin').then(() => t.remove()); } }); FX.burst(pm.gFx, to.x + 50, to.y + 35, ['var(--accent)', '#fff'], 16, { speed: 40, size: 1.5 }); },
};
