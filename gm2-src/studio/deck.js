/* Deck-Hülle im Studio-Stil + Standard-Implementierungen, die die Konzepte überschreiben. */
const { el, html, tween, wait, FX, E, lerp, CITY, MAP, PLANTDATA, RES, RNAME, PRICES, PLAYERS, pcol, css, seg } = GM;
const pos = g => ({ x: +g.dataset.x, y: +g.dataset.y });
const setPos = (g, x, y, extra = '') => { g.dataset.x = x; g.dataset.y = y; g.setAttribute('transform', `translate(${x},${y}) ${extra}`); };

const BASE = {
  label(b, c) { const t = el('text', { x: c.x, y: c.y + 17, class: 'clabel', 'text-anchor': 'middle' }, b.gLabels); t.textContent = c.name; },
  edge(b, e, A, B) { const s = seg(A, B); el('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, class: 'edge' }, b.gEdges); },
  line(b, e, pl, lane) { const A = CITY[e.a], B = CITY[e.b], s = seg(A, B, lane - .0); return el('path', { d: `M${s.x1},${s.y1}L${s.x2},${s.y2}`, class: 'own', stroke: pcol(pl) }, b.gLines); },
  async animLine(b, l, A, B, pl) { if (l.e.a !== A.id) { const d = l.el.getAttribute('d').match(/M([^L]+)L(.+)/); l.el.setAttribute('d', `M${d[2]}L${d[1]}`); } await FX.drawStroke(l.el, .5 + seg(A, B).L * .006); },
  async animHouse(b, c, pl, g) { await tween(.5, e => g.setAttribute('transform', `translate(${c.x},${c.y}) scale(${e})`), 'back'); FX.ripple(b.gFx, c.x, c.y, pcol(pl), 26); },
  async animPower(b, seqs) {
    await Promise.all(seqs.map(async ({ pl, order }) => { for (const [id, from, l] of order) { if (l) { const p = l.el, orb = el('circle', { r: 3, fill: pcol(pl), class: 'fx-glow' }, b.gFx); const rev = l.e.a !== from; await FX.along(p, .45, (q, k) => { const L = p.getTotalLength(), qq = rev ? p.getPointAtLength(L * (1 - k)) : q; orb.setAttribute('cx', qq.x); orb.setAttribute('cy', qq.y); }); orb.remove(); } const c = CITY[id]; FX.ripple(b.gFx, c.x, c.y, pcol(pl), 18, .7); } }));
  },
  async intro(b) {
    b.reset(); const cs = [...b.gCities.children]; cs.forEach(g => g.style.opacity = 0);
    await Promise.all(cs.map((g, i) => tween(.4, e => { g.style.opacity = e; }, 'out', i * .02)));
    b.setup(); const ls = b.lines.map(l => l.el); await Promise.all(ls.map((p, i) => wait(i * .12).then(() => FX.drawStroke(p, .5))));
  },
  marketBase(m) {
    const g = m.gBase; el('rect', { x: 6, y: 6, width: m.W - 12, height: m.H - 12, rx: 14, class: 'panel' }, g);
    const t = el('text', { x: 20, y: 30, class: 'ptitle' }, g); t.textContent = 'ROHSTOFFMARKT';
    RES.forEach(k => { const row = RES.indexOf(k), y = 62 + row * 46; const lb = el('text', { x: 20, y: y + 4, class: 'rlabel' }, g); lb.textContent = RNAME[k]; const n = k === 'uranium' ? 12 : 8; for (let c = 0; c < n; c++) { const q = m.cell(k, c); el('rect', { x: q.x + 1.5, y: q.y + 2, width: q.w - 3, height: q.h - 4, rx: 6, class: 'cell' }, g); const pt = el('text', { x: q.x + q.w - 5, y: q.y + q.h - 6, class: 'price', 'text-anchor': 'end' }, g); pt.textContent = q.price; } });
    const s = el('text', { x: 20, y: 272, class: 'rlabel' }, g); s.textContent = 'Dein Lager';
    RES.forEach(k => { const b = m.bin(k); el('rect', { x: b.x - 10, y: b.y - 13, width: 80, height: 26, rx: 6, class: 'cell' }, g); });
  },
  async animBuy(m, p, b, n) { await wait(n * .15); const a = { x: p.x, y: p.y }; await tween(.8, e => { const x = lerp(a.x, b.x, e), y = lerp(a.y, b.y, e) - Math.sin(e * Math.PI) * 60; p.g.setAttribute('transform', `translate(${x},${y}) scale(${1 - .2 * e})`); }); p.g.setAttribute('transform', `translate(${b.x},${b.y}) scale(.8)`); },
  async animRestock(m, p, n) { const y1 = p.y; p.g.style.opacity = 0; await wait(n * .12); p.g.style.opacity = 1; await tween(.6, e => p.g.setAttribute('transform', `translate(${p.x},${lerp(y1 - 80, y1, e)})`), 'out'); },
  async animBurn(m, g, n) { await wait(n * .12); const tr = g.getAttribute('transform'); await tween(.7, (e, k) => { g.setAttribute('transform', tr + ` translate(0,${-24 * e})`); g.style.opacity = 1 - k; }); g.remove(); },
  plantsBase(pm) { const g = pm.gBase; el('rect', { x: 6, y: 6, width: pm.W - 12, height: pm.H - 12, rx: 14, class: 'panel' }, g); const t = el('text', { x: 20, y: 32, class: 'ptitle' }, g); t.textContent = 'KRAFTWERKSMARKT'; const a = el('text', { x: 20, y: 226, class: 'rlabel' }, g); a.textContent = 'Deine Kraftwerke'; },
  card(n, [res, need, pow], state) { return `<rect width="100" height="70" rx="8" class="card ${state}"/><text x="12" y="34" class="cnum">${n}</text><text x="12" y="56" class="csub">${RNAME[res]}${need ? ' ×' + need : ''}</text><text x="88" y="56" class="cpow" text-anchor="end">→${pow}</text>`; },
  cardBack() { return `<rect width="100" height="70" rx="8" class="cardback"/>`; },
  async animAuction(pm, g, n, bids) { const p = pos(g); await tween(.3, e => setPos(g, p.x, p.y - 8 * e)); for (const [pl, v] of bids) { FX.float(pm.gFx, p.x + 50, p.y - 6, v === null ? 'passt' : v + ' €', 'bid', pcol(pl)); await wait(.7); } },
  async animToMine(pm, g, to) { const p = pos(g); await tween(1, e => setPos(g, lerp(p.x, to.x, e), lerp(p.y, to.y, e) - Math.sin(e * Math.PI) * 40)); },
  async animAway(pm, g, pl) { const p = pos(g); await tween(.9, (e, k) => { setPos(g, p.x - 200 * e, p.y - 60 * e); g.style.opacity = 1 - k; }); },
  async animRefill(pm, back, g, n, order) {
    const d = pos(back), i = order.indexOf(n), to = pm.slot(i);
    await tween(.35, e => setPos(back, d.x, d.y - 20 * e)); back.remove(); setPos(g, d.x, d.y - 20); g.style.opacity = 1;
    await tween(.35, e => g.setAttribute('transform', `translate(${d.x + 50 * (1 - Math.abs(1 - 2 * e)) * 0},${d.y - 20}) translate(50,0) scale(${Math.abs(1 - 2 * e) || .01},1) translate(-50,0)`));
    await Promise.all(order.map((m, j) => { const c = pm.cards.get(m), a = pos(c), t = pm.slot(j); return tween(.6, e => setPos(c, lerp(a.x, t.x, e), lerp(a.y, t.y, e))); }));
  },
};

// ---------- deck builder ----------
function buildDeck(T0) {
  const T = Object.assign({}, BASE, T0); const M = T.meta;
  if (T.css) { const st = document.createElement('style'); st.textContent = T.css; document.head.appendChild(st); }
  document.title = `Grid Master 2 – ${M.name}`;
  const root = document.documentElement; let mode = T0.startMode || 'dark';
  function applyVars() { const v = T.vars[mode]; for (const k in v) root.style.setProperty(k, v[k]); root.dataset.mode = mode; }
  applyVars();
  const defsSvg = el('svg', { width: 0, height: 0, style: 'position:absolute' }, document.body); T.globalDefs && T.globalDefs(el('defs', {}, defsSvg));
  const app = document.getElementById('deck');
  app.innerHTML = `
  <header class="bar"><div class="brand"><b>GRID MASTER 2</b><span>Konzept ${M.key} · ${M.name}</span></div>
    <nav class="dots" aria-label="Folien"></nav>
    <div class="tools"><button class="tbtn" id="speed" aria-label="Zeitlupe umschalten">1×</button><button class="tbtn" id="mode" aria-label="Hell/Dunkel umschalten">${mode === 'dark' ? 'Hell' : 'Dunkel'}</button></div></header>
  <main class="slides">
    <section class="slide s-cover" data-t="Titel"><div class="cover-text"><p class="kicker">Konzept ${M.key} für Grid Master 2</p><h1>${M.name}</h1><p class="tag">${M.tagline}</p><ul class="kw">${M.keywords.map(k => `<li>${k}</li>`).join('')}</ul><button class="btn primary" id="cv-replay">Intro abspielen</button></div><div class="cover-board stage" id="cv-board"></div></section>
    <section class="slide s-idea" data-t="Idee"><div class="head"><p class="kicker">Die Idee</p><h2>${M.idea}</h2></div><div class="princ">${M.principles.map(([t, x], i) => `<article class="pc"><span class="pn">0${i + 1}</span><h3>${t}</h3><p>${x}</p></article>`).join('')}</div><div class="system"><div class="swatches" id="sw"></div><div class="type"><p class="t-d">Aa ${M.fonts.display}</p><p class="t-t">${M.fonts.text} · Fließtext und Bedienung</p><p class="t-m">0123456789 € · ${M.fonts.mono || M.fonts.display}</p></div></div></section>
    <section class="slide s-studio" data-t="Live-Brett"><div class="head row"><div><p class="kicker">Studio</p><h2>Live-Spielbrett</h2></div><div class="money"><span>Geld</span><b id="money">60</b><i>€</i></div></div>
      <div class="studio"><div class="st-board stage" id="st-board"><div class="hint" id="st-hint">Tippe auf eine markierte Stadt, um zu bauen.</div><div class="buildcard" id="bc" hidden></div></div>
      <div class="st-side"><div class="stage" id="st-market"></div><div class="stage" id="st-plants"></div></div></div>
      <div class="controls"><button class="btn" data-a="buy">Rohstoffe kaufen</button><button class="btn" data-a="auction">Kraftwerk ersteigern</button><button class="btn primary" data-a="power">Strom liefern</button><button class="btn" data-a="restock">Nachschub</button><button class="btn" data-a="intro">Intro</button><button class="btn ghost" data-a="reset">Zurücksetzen</button></div></section>
    <section class="slide s-states" data-t="Zustände"><div class="head"><p class="kicker">Alle Zustände</p><h2>${M.statesTitle || 'Städte wachsen, Leitungen erzählen'}</h2></div><div class="states" id="states"></div></section>
    <section class="slide s-anims" data-t="Animationen"><div class="head"><p class="kicker">Jede Animation</p><h2>Mit Replay</h2></div><div class="anims" id="anims"></div></section>
    <section class="slide s-devices" data-t="Geräte"><div class="head"><p class="kicker">Auf allen Geräten</p><h2>Zweispaltig, mit klaren Zonen</h2></div><div class="devices" id="devices"></div></section>
    <section class="slide s-verdict" data-t="Bewertung"><div class="head"><p class="kicker">Bewertung</p><h2>${M.verdictTitle}</h2></div><div class="verdict"><article><h3>Stärken</h3><ul>${M.strengths.map(x => `<li>${x}</li>`).join('')}</ul></article><article><h3>Risiken</h3><ul>${M.risks.map(x => `<li>${x}</li>`).join('')}</ul></article><article><h3>Aufwand</h3><p>${M.effort}</p><h3>Passt zu deiner Richtung</h3><p>${M.fit}</p></article></div></section>
  </main>`;
  // nav dots
  const slides = [...app.querySelectorAll('.slide')], dots = app.querySelector('.dots'), main = app.querySelector('.slides');
  slides.forEach((s, i) => { const b = document.createElement('button'); b.className = 'dot'; b.setAttribute('aria-label', s.dataset.t); b.title = s.dataset.t; b.onclick = () => s.scrollIntoView({ behavior: 'smooth' }); dots.appendChild(b); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const i = slides.indexOf(e.target); [...dots.children].forEach((d, j) => d.classList.toggle('on', i === j)); e.target.dispatchEvent(new Event('enter')); } }), { root: main, threshold: .55 });
  slides.forEach(s => io.observe(s));
  addEventListener('keydown', e => { if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(e.key)) return; const i = [...dots.children].findIndex(d => d.classList.contains('on')); const j = Math.max(0, Math.min(slides.length - 1, i + (/Down/.test(e.key) ? 1 : -1))); slides[j].scrollIntoView({ behavior: 'smooth' }); e.preventDefault(); });
  // swatches
  const sw = app.querySelector('#sw'); const names = T.swatches || [['--bg', 'Grund'], ['--surface', 'Fläche'], ['--ink', 'Schrift'], ['--accent', 'Akzent'], ['--p0', 'Du'], ['--p1', 'Rhein AG'], ['--p2', 'Isar']];
  function paintSw() { sw.innerHTML = names.map(([v, n]) => `<div class="swc"><span style="background:var(${v})"></span><b>${n}</b><i>${css(v)}</i></div>`).join(''); }
  paintSw();

  // ---------- cover ----------
  const cover = new GM.Board(app.querySelector('#cv-board'), T, { cls: 'cv' });
  const playCover = () => cover.intro(); app.querySelector('#cv-replay').onclick = playCover;
  let coverDone = false; slides[0].addEventListener('enter', () => { if (!coverDone) { coverDone = true; playCover(); } });

  // ---------- studio ----------
  const board = new GM.Board(app.querySelector('#st-board'), T, { interactive: true, cls: 'st' });
  const market = new GM.Market(app.querySelector('#st-market'), T); const plants = new GM.Plants(app.querySelector('#st-plants'), T);
  board.setup(); board.markReach();
  const moneyEl = app.querySelector('#money'), bc = app.querySelector('#bc'), hint = app.querySelector('#st-hint');
  const setMoney = v => { const a = board.money; board.money = v; FX.countTo(moneyEl, a, v); };
  let busy = false; const lock = async fn => { if (busy || board.busy) return; busy = true; app.querySelector('.controls').classList.add('busy'); bc.hidden = true; try { await fn(); } finally { busy = false; app.querySelector('.controls').classList.remove('busy'); board.markReach(); } };
  board.onCity = id => { if (busy) return; const q = board.quote(id); board.sel = id; board.markReach(); hint.hidden = true; bc.hidden = false;
    bc.innerHTML = q ? `<b>${CITY[id].name}</b><div><span>Leitung</span><i>${q.line} €</i></div><div><span>Haus (${q.house})</span><i>${q.house} €</i></div><div class="tot"><span>Gesamt</span><i>${q.total} €</i></div><button class="btn primary" ${q.total > board.money ? 'disabled' : ''}>Bauen · ${q.total} €</button><button class="x" aria-label="Schließen">✕</button>` : `<b>${CITY[id].name}</b><p>Hier kannst du gerade nicht bauen.</p><button class="x" aria-label="Schließen">✕</button>`;
    bc.querySelector('.x').onclick = () => { bc.hidden = true; board.sel = null; board.markReach(); };
    const bb = bc.querySelector('.btn'); if (bb) bb.onclick = () => lock(async () => { setMoney(board.money - q.total); await board.build(id, 0, { hero: true }); }); };
  const A = {
    async buy() { const cost = market.priceOf('coal', 2) + market.priceOf('oil', 1); setMoney(board.money - cost); await market.buy({ coal: 2, oil: 1 }); },
    async power() { await market.burn(); await board.power(); const n = Object.values(board.owners).filter(o => o.includes(0)).length; setMoney(board.money + [10, 22, 33, 44, 54, 64, 73, 82, 90, 98][Math.min(n, 9)]); },
    async restock() { await market.restock(); },
    async auction() { const n = plants.sorted()[1]; if (plants.mine.length >= 3) { plants.mine.pop(); plants.render(); } await plants.auction(n, [[0, n], [1, n + 1], [0, n + 2], [2, null], [1, null]]); setMoney(board.money - (n + 2)); await plants.takeToMine(n); await plants.refill(); const c = plants.sorted()[0]; await plants.auction(c, [[1, c]]); await plants.takeAway(c, 1); await plants.refill(); },
    async intro() { await board.intro(); },
    async reset() { board.reset(); board.money = 60; moneyEl.textContent = 60; board.setup(); market.occ = { coal: [...Array(24).keys()], oil: [...Array(18).keys()].map(i => i + 6), garbage: [18, 19, 20, 21, 22, 23], uranium: [10, 11] }; market.store = { coal: 0, oil: 0, garbage: 0, uranium: 0 }; market.render(); plants.market = [17, 19, 20, 21, 22, 23, 24, 25]; plants.deck = [38, 29, 26, 34, 27, 31]; plants.mine = [10, 16]; plants.render(); },
  };
  app.querySelectorAll('.controls .btn').forEach(b => b.onclick = () => lock(A[b.dataset.a]));
  window.__deck = { board, market, plants, A, cover };

  // ---------- states ----------
  const ST = app.querySelector('#states');
  const city = (title, owners, flags = {}) => { const box = document.createElement('figure'); box.className = 'st-tile'; ST.appendChild(box); const c = CITY.hannover; const b = new GM.Board(box, T, { view: `${c.x - 34} ${c.y - 30} 68 60`, cls: 'tile', noLabels: true }); if (owners.length) b.owners.hannover = owners; b.sel = flags.sel ? 'hannover' : null; b.reach = flags.reach ? new Set(['hannover']) : null; b.drawCity(c); const f = document.createElement('figcaption'); f.textContent = title; box.appendChild(f); return b; };
  const lineTile = (title, setup) => { const box = document.createElement('figure'); box.className = 'st-tile'; ST.appendChild(box); const a = CITY.berlin, z = CITY.leipzig; const b = new GM.Board(box, T, { view: `${Math.min(a.x, z.x) - 30} ${a.y - 14} ${Math.abs(a.x - z.x) + 60} ${z.y - a.y + 28}`, cls: 'tile', noLabels: true }); setup(b); const f = document.createElement('figcaption'); f.textContent = title; box.appendChild(f); };
  city('Freie Stadt', []); city('Erreichbar', [], { reach: true }); city('Ausgewählt', [], { sel: true }); city('1 Firma', [0]); city('2 Firmen', [0, 1]); city('3 Firmen · voll', [0, 1, 2]);
  const ePB = GM.EDGES.find(e => (e.a === 'berlin' && e.b === 'potsdam') || (e.b === 'berlin' && e.a === 'potsdam')), ePL = GM.EDGES.find(e => (e.a === 'potsdam' && e.b === 'leipzig') || (e.b === 'potsdam' && e.a === 'leipzig'));
  lineTile('Freie Verbindung', () => { }); lineTile('Eigene Leitung', b => { b.owners.berlin = [0]; b.owners.potsdam = [0]; b.addLine(ePB, 0, true); b.addLine(ePL, 0, true); b.owners.leipzig = [0]; MAP.cities.forEach(c => b.drawCity(c)); });
  lineTile('Geteilte Leitung', b => { b.addLine(ePL, 0, true); b.addLine(ePL, 2, true); b.owners.leipzig = [0, 2]; b.owners.potsdam = [0, 2]; MAP.cities.forEach(c => b.drawCity(c)); });
  // market + card states
  const mt = document.createElement('figure'); mt.className = 'st-tile wide'; ST.appendChild(mt); new GM.Market(mt, T); const mf = document.createElement('figcaption'); mf.textContent = 'Rohstoffmarkt · voll bis knapp'; mt.appendChild(mf);
  const ct = document.createElement('figure'); ct.className = 'st-tile wide'; ST.appendChild(ct); const cs = el('svg', { viewBox: '0 0 460 96', class: 'cards' }, ct); [['current', 17], ['future', 23], ['owned', 10], ['selected', 19]].forEach(([s, n], i) => { const g = html(cs, T.card(n, PLANTDATA[n], s)); g.setAttribute('transform', `translate(${10 + i * 112},12)`); }); const cf = document.createElement('figcaption'); cf.textContent = 'Kraftwerkskarten · aktuell, Zukunft, eigene, gewählt'; ct.appendChild(cf);

  // ---------- animation library ----------
  const AN = app.querySelector('#anims');
  function animCard(title, desc, make) { const box = document.createElement('article'); box.className = 'an'; box.innerHTML = `<div class="an-stage stage"></div><div class="an-meta"><h3>${title}</h3><p>${desc}</p><button class="btn small">▶ Abspielen</button></div>`; AN.appendChild(box); const st = box.querySelector('.an-stage'); let ctl = make(st); const btn = box.querySelector('button'); let run = false; btn.onclick = async () => { if (run) return; run = true; btn.disabled = true; st.innerHTML = ''; ctl = make(st); await ctl.play(); btn.disabled = false; run = false; }; return () => btn.click(); }
  const H = CITY.hamburg, BE = CITY.berlin; const viewHB = `${H.x - 30} ${H.y - 40} ${BE.x - H.x + 70} ${BE.y - H.y + 75}`;
  const plays = [
    animCard('Leitung bauen', M.anim.line, st => { const b = new GM.Board(st, T, { view: viewHB, cls: 'anb' }); b.owners.berlin = [0]; b.drawCity(BE); return { play: () => b.build('hamburg', 0, { hero: true }) }; }),
    animCard('Stadt wächst', M.anim.house, st => { const b = new GM.Board(st, T, { view: `${H.x - 40} ${H.y - 34} 80 68`, cls: 'anb', noLabels: true }); return { play: async () => { for (const pl of [0, 1, 2]) { (b.owners.hamburg ||= []).push(pl); const g = b.drawCity(H, true); await T.animHouse(b, H, pl, g, { hero: true }); await wait(.3); } } }; }),
    animCard('Strom fließt', M.anim.power, st => { const b = new GM.Board(st, T, { cls: 'anb' }); b.setup(); return { play: () => b.power() }; }),
    animCard('Rohstoffe kaufen', M.anim.buy, st => { const m = new GM.Market(st, T); return { play: () => m.buy({ coal: 2, oil: 1, garbage: 1 }) }; }),
    animCard('Nachschub', M.anim.restock, st => { const m = new GM.Market(st, T); m.occ.coal = m.occ.coal.slice(8); m.occ.oil = m.occ.oil.slice(6); m.render(); return { play: () => m.restock({ coal: 6, oil: 4, garbage: 2, uranium: 2 }) }; }),
    animCard('Auktion und Nachziehen', M.anim.auction, st => { const p = new GM.Plants(st, T); return { play: async () => { const n = 19; await p.auction(n, [[0, 19], [1, 20], [0, 21], [2, null], [1, null]]); await p.takeToMine(n); await p.refill(); } }; }),
  ];
  slides[4].addEventListener('enter', () => { if (!slides[4].dataset.played) { slides[4].dataset.played = 1; plays.forEach((p, i) => setTimeout(p, i * 250)); } });

  // ---------- devices ----------
  const DV = app.querySelector('#devices');
  function devices() {
    DV.innerHTML = `<figure class="dev phone-p"><div class="scr"><div class="d-top"><b>R4 · BAUEN</b><i>${board.money} €</i></div><div class="d-board"></div><div class="d-sheet"><b>Hamburg</b><span>Leitung 23 € · Haus 10 €</span><em>Bauen · 33 €</em></div></div><figcaption>iPhone hoch</figcaption></figure>
      <figure class="dev phone-l"><div class="scr"><div class="d-board"></div><div class="d-side"><b>R4 · BAUEN</b><i>${board.money} €</i><span>Du · Rhein AG · Isar</span><em>Bauen · 33 €</em></div></div><figcaption>iPhone quer</figcaption></figure>
      <figure class="dev tab"><div class="scr"><div class="d-board"></div><div class="d-side"><b>Runde 4 · Bauen</b><div class="d-mini m1"></div><div class="d-mini m2"></div><em>Bauen · 33 €</em></div></div><figcaption>iPad / Mac</figcaption></figure>`;
    DV.querySelectorAll('.d-board').forEach(d => d.appendChild(board.svg.cloneNode(true)));
    DV.querySelector('.m1').appendChild(market.svg.cloneNode(true)); DV.querySelector('.m2').appendChild(plants.svg.cloneNode(true));
  }
  slides[5].addEventListener('enter', devices);

  // ---------- mode + speed ----------
  const mb = app.querySelector('#mode'); mb.onclick = () => { mode = mode === 'dark' ? 'light' : 'dark'; mb.textContent = mode === 'dark' ? 'Hell' : 'Dunkel'; applyVars(); paintSw(); [cover, board].forEach(b => { b.render(); }); board.markReach(); market.render(); plants.render(); };
  const sb = app.querySelector('#speed'); let slow = false; sb.onclick = () => { slow = !slow; GM.setSpeed(slow ? 2.5 : 1); sb.textContent = slow ? '0,4×' : '1×'; sb.classList.toggle('on', slow); };
}
