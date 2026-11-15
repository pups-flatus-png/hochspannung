// Pitch-Deck-Hülle: ein WebGL-Renderer wandert zwischen den Folien, jede Folie fährt ihre eigene Kamera und Szene an.
import { THREE, createTable, setSpeed, wait, PLANTDATA, RNAME } from './table.js';
import { BASE } from './base.js';
import CSS from './deck3d.css';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

export async function boot(THEME) {
  const T = { ...BASE, ...THEME }, M = T.meta; let mode = T.startMode || 'dark';
  document.head.appendChild(h('style', null, CSS)); if (T.css) document.head.appendChild(h('style', null, T.css));
  if (M.gf) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?' + M.gf + '&display=swap'; document.head.appendChild(l); }
  const root = document.documentElement; const applyVars = () => { root.dataset.mode = mode; for (const [k, v] of Object.entries(T.vars[mode])) root.style.setProperty(k, v); }; applyVars();
  document.title = 'Grid Master 2 – ' + M.name;
  const SL = [['Titel'], ['Idee'], ['Live-Tisch'], ['Rohstoffmarkt'], ['Städte & Netz'], ['Kraftwerke'], ['Bürokratie'], ['Geräte'], ['Bewertung']];
  const bar = h('header', 'bar', `<div class="brand"><b>GRID MASTER 2</b><span>Konzept ${M.key} · ${M.name} · 3D</span></div><nav class="dots">${SL.map((s, i) => `<button class="dot" aria-label="${s[0]}" data-i="${i}"></button>`).join('')}</nav><div class="tools"><button class="tbtn" id="speed" aria-label="Zeitlupe">1×</button><button class="tbtn" id="mode" aria-label="Hell oder Dunkel">${mode === 'dark' ? 'Hell' : 'Dunkel'}</button></div>`);
  document.body.appendChild(bar); const main = h('main', 'slides'); document.body.appendChild(main);
  const stage = (view, cls = '') => `<div class="stage3d ${cls}" data-view="${view}"><div class="ph">3D lädt …</div></div>`;
  const btns = list => list.map(([id, t, p]) => `<button class="btn ${p ? 'primary' : ''}" data-act="${id}">${t}</button>`).join('');
  const panel = (kicker, title, txt, items, actions) => `<aside class="panel"><p class="kicker">${kicker}</p><h2>${title}</h2><p class="lead">${txt}</p><ul class="feat">${items.map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join('')}</ul><div class="acts">${btns(actions)}</div></aside>`;
  const D = M.design;
  main.innerHTML = `
  <section class="slide s-cover" id="s0"><div class="cover-text"><p class="kicker">Konzept ${M.key} für Grid Master 2 · voll 3D</p><h1>${M.name}</h1><p class="tag">${M.tagline}</p><ul class="kw">${M.keywords.map(k => `<li>${k}</li>`).join('')}</ul><div class="acts"><button class="btn primary" data-act="intro">Intro abspielen</button><button class="btn" data-act="tour">Tischrundgang</button></div></div>${stage('overview', 'cover')}</section>
  <section class="slide" id="s1"><div class="head"><p class="kicker">Die Idee</p><h2>${M.idea}</h2></div><div class="princ">${M.principles.map(([t, x], i) => `<div class="pc"><span class="pn">0${i + 1}</span><h3>${t}</h3><p>${x}</p></div>`).join('')}</div>
    <div class="system"><div class="pc"><h3>Der Spieltisch</h3><ol class="parts"><li><b>Karte</b> ${D.map}</li><li><b>Rohstoffmarkt</b> ${D.market}</li><li><b>Kraftwerksmarkt</b> ${D.plants}</li><li><b>Dein Bereich</b> ${D.player}</li><li><b>Leiste</b> ${D.track}</li></ol></div>
    <div class="pc"><h3>Farben und Schrift</h3><div class="sw">${M.swatches.map(([n, c]) => `<div><i style="background:${c}"></i><b>${n}</b><code>${c}</code></div>`).join('')}</div><p class="spec" style="font-family:var(--fd)">Aa ${M.fonts.display}</p><p class="muted">${M.fonts.text} · Fließtext &nbsp; <code style="font-family:var(--fm)">0123456789 € · ${M.fonts.mono}</code></p></div></div></section>
  <section class="slide s-live" id="s2"><div class="head"><p class="kicker">Spielbar</p><h2>Live-Tisch</h2></div>
    <div class="live"><div class="money"><span>Geld</span><b id="money">60</b><i>€</i></div>${stage('overview', 'big')}<div class="toolbar"><div class="grp"><span>Phasen</span>${btns([['phase1', 'Reihenfolge'], ['phase2', 'Auktion'], ['phase3', 'Rohstoffe'], ['phase4', 'Bauen'], ['phase5', 'Bürokratie', 1]])}</div><div class="grp"><span>Kamera</span>${btns([['v:overview', 'Tisch'], ['v:map', 'Karte'], ['v:market', 'Markt'], ['v:plants', 'Kraftwerke'], ['v:player', 'Mein Bereich'], ['v:track', 'Leiste']])}</div><div class="grp"><span>Demo</span>${btns([['opp', 'Gegner ziehen'], ['reset', 'Zurücksetzen']])}</div></div></div>
    <p class="hint">Tippe auf eine leuchtende Stadt, um zu bauen, oder auf eine Kraftwerkskarte, um zu bieten. Ziehen verschiebt, zwei Finger drehen und zoomen.</p></section>
  <section class="slide s-detail" id="s3"><div class="duo">${stage('market')}${panel('Modell', 'Rohstoffmarkt', D.marketLong, D.marketItems, [['buy', 'Kaufen: 2 Kohle, 2 Öl', 1], ['burn', 'Verbrennen'], ['re1', 'Nachschub Stufe 1'], ['re2', 'Stufe 2'], ['re3', 'Stufe 3']])}</div></section>
  <section class="slide s-detail" id="s4"><div class="duo">${stage('east')}${panel('Modell', 'Städte & Netz', D.cityLong, D.cityItems, [['grow', 'Stadt wächst (3 Firmen)', 1], ['bham', 'Hamburg anschließen'], ['net', 'Strom fließen lassen'], ['st2', 'Stufe 2'], ['st3', 'Stufe 3']])}</div></section>
  <section class="slide s-detail" id="s5"><div class="duo">${stage('plants')}${panel('Modell', 'Kraftwerksauktion', D.plantsLong, D.plantsItems, [['auc', 'Auktion um Nr. 19', 1], ['auclose', 'Auktion verlieren'], ['cycle', 'Höchstes unter den Stapel'], ['draw', 'Karte nachziehen']])}</div></section>
  <section class="slide s-detail" id="s6"><div class="duo">${stage('player')}${panel('Ablauf', 'Bürokratie', D.bureauLong, [['1 · Verbrennen', 'Rohstoffe verlassen das Lager.'], ['2 · Strom liefern', 'Energie läuft durch dein Netz.'], ['3 · Einkommen', 'Münzen fliegen aus der Bank.'], ['4 · Nachschub', 'Der Markt füllt sich nach Stufe.'], ['5 · Kraftwerke', 'Das höchste wandert unter den Stapel.'], ['6 · Reihenfolge', 'Die Marker sortieren sich neu.']], [['bureau', 'Komplette Phase abspielen', 1], ['power', 'Nur Strom liefern'], ['income', 'Nur Einkommen'], ['order', 'Reihenfolge']])}</div></section>
  <section class="slide" id="s7"><div class="head"><p class="kicker">Geräte</p><h2>Ein Tisch, drei Formate</h2></div><div class="devices"><figure class="dev phone"><div class="screen"><img alt="iPhone hochkant"><div class="hud top"><b>60 €</b><span>Phase 4 · Bauen</span></div><div class="hud bottom"><i></i><i></i><i></i><i></i></div></div><figcaption>iPhone hochkant: Karte füllt den Bildschirm, Märkte als Wischkarten unten.</figcaption></figure>
    <figure class="dev land"><div class="screen"><img alt="iPhone quer"><div class="hud side"><b>60 €</b><i></i><i></i><i></i></div></div><figcaption>iPhone quer: ganzer Tisch, Bedienleiste rechts.</figcaption></figure>
    <figure class="dev tab"><div class="screen"><img alt="iPad und Mac"><div class="hud top"><b>60 €</b><span>Phase 2 · Auktion</span></div></div><figcaption>iPad und Mac: ganzer Tisch mit allen Märkten gleichzeitig.</figcaption></figure></div></section>
  <section class="slide" id="s8"><div class="head"><p class="kicker">Bewertung</p><h2>${M.verdictTitle}</h2></div><div class="verdict"><div class="pc"><h3>Stärken</h3><ul>${M.strengths.map(s => `<li>${s}</li>`).join('')}</ul></div><div class="pc"><h3>Risiken</h3><ul>${M.risks.map(s => `<li>${s}</li>`).join('')}</ul></div><div class="pc"><h3>Aufwand</h3><p>${M.effort}</p></div><div class="pc"><h3>Passung</h3><p>${M.fit}</p></div></div></section>`;

  // ---------- fonts, renderer ----------
  try { await Promise.race([Promise.all([M.fonts.display, M.fonts.text, M.fonts.mono].map(f => document.fonts.load(`700 40px "${f}"`))), wait(2.5)]); } catch (e) { }
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); renderer.domElement.className = 'gl';
  let tb = null, busy = false, host = null, hostView = 'overview', pending = null;
  const build = h('div', 'buildcard'); build.hidden = true;
  const toast = h('div', 'toast'); toast.hidden = true;
  const say = (t, s = 2.4) => { toast.textContent = t; toast.hidden = false; clearTimeout(say.t); say.t = setTimeout(() => toast.hidden = true, s * 1000); };
  function make() { if (tb) tb.dispose(); tb = createTable(T, mode, { renderer }); tb.emit = () => { document.getElementById('money').textContent = tb.ST.players[0].money; }; tb.emit(); tb.onCity = onCity; tb.onCard = onCard; if (host) { fit(); tb.view(hostView, 0); } window.__tb = tb; }
  function fit() { const r = host.getBoundingClientRect(); tb.resize(Math.max(50, r.width), Math.max(50, r.height)); }
  function attach(st) { if (host === st) return; host = st; st.appendChild(renderer.domElement); st.appendChild(build); st.appendChild(toast); build.hidden = true; st.querySelector('.ph') && st.querySelector('.ph').remove(); hostView = st.dataset.view; fit(); if (!busy) tb.view(hostView, host.classList.contains('cover') && !attach.done ? 0 : .9); attach.done = true; }
  make();
  const stages = [...document.querySelectorAll('.stage3d')]; const vis = new Map();
  const io = new IntersectionObserver(es => { es.forEach(e => vis.set(e.target, e.intersectionRatio)); let best = null, b = .25; vis.forEach((r, s) => { if (r > b) { b = r; best = s; } }); if (best) attach(best); running = [...vis.values()].some(r => r > 0); }, { threshold: [0, .25, .5, .75, 1] });
  stages.forEach(s => io.observe(s)); let running = true;
  new ResizeObserver(() => host && fit()).observe(document.body);
  (function loop() { requestAnimationFrame(loop); if (running && host) tb.frame(); })();
  attach(stages[0]);

  // ---------- interaction ----------
  async function run(fn) { if (busy) return; busy = true; document.body.classList.add('busy'); build.hidden = true; tb.markReach(false); try { await fn(); } catch (e) { console.error(e); } busy = false; document.body.classList.remove('busy'); tb.markReach(true); }
  function onCity(id) { if (busy) return; const q = tb.quote(id), c = tb.cityG[id] && id; const name = (window.__names || {})[id] || id; build.hidden = false;
    if (!q.path) { build.innerHTML = `<div class="bc-h"><b>${cityName(id)}</b><button class="x" aria-label="Schließen">×</button></div><p class="muted">${q.why}</p>`; }
    else build.innerHTML = `<div class="bc-h"><b>${cityName(id)}</b><button class="x" aria-label="Schließen">×</button></div><div class="bc-r"><span>Leitung</span><b>${q.line} €</b></div><div class="bc-r"><span>Anschluss (${q.house})</span><b>${q.house} €</b></div><div class="bc-r tot"><span>Gesamt</span><b>${q.total} €</b></div><button class="btn primary" data-build="${id}" ${q.ok ? '' : 'disabled'}>${q.ok ? 'Bauen · ' + q.total + ' €' : 'Zu teuer'}</button>`;
    build.querySelector('.x').onclick = () => build.hidden = true; const b = build.querySelector('[data-build]'); if (b) b.onclick = () => run(async () => { await tb.build(id); await tb.view(hostView, 1); }); }
  const cityName = id => (tb.cityName && tb.cityName(id)) || id;
  function onCard(n) { if (busy) return; tb.selectCard(n); const d = PLANTDATA[n]; build.hidden = false; build.innerHTML = `<div class="bc-h"><b>Kraftwerk ${n}</b><button class="x" aria-label="Schließen">×</button></div><div class="bc-r"><span>${RNAME[d[0]]}</span><b>${d[1] ? d[1] + '×' : '—'}</b></div><div class="bc-r"><span>versorgt</span><b>${d[2]} Städte</b></div><button class="btn primary" data-bid>Bieten ab ${n} €</button>`;
    build.querySelector('.x').onclick = () => { build.hidden = true; tb.selectCard(null); }; build.querySelector('[data-bid]').onclick = () => run(() => tb.auction(n, [[0, n], [1, n + 1], [2, null], [0, n + 2], [1, null]])); }
  const ACT = {
    intro: () => tb.intro(), tour: async () => { for (const v of ['map', 'market', 'plants', 'player', 'track', 'overview']) { await tb.view(v, 1.3); await wait(.6); } },
    phase1: () => tb.reorder(), phase2: () => { const n = [...tb.ST.market].sort((a, b) => a - b)[1]; return tb.auction(n, [[0, n], [1, n + 1], [2, n + 2], [0, n + 4], [1, null], [2, null]]); },
    phase3: async () => { await tb.view('market', .9); await tb.buy({ coal: 2, oil: 2 }); await tb.view('player', .8); }, phase4: async () => { await tb.view('map', .9); say('Tippe auf eine leuchtende Stadt.'); },
    phase5: () => tb.bureaucracy(), opp: () => tb.opponents(), reset: async () => { make(); tb.emit(); },
    buy: async () => { await tb.buy({ coal: 2, oil: 2 }); await tb.view('player', .8); await wait(.6); await tb.view('market', .8); }, burn: async () => { await tb.view('player', .7); await tb.burn(); await tb.view('market', .8); },
    re1: () => tb.restock(1), re2: () => tb.restock(2), re3: () => tb.restock(3),
    grow: async () => { await tb.setStep(3); for (const pl of [1, 2, 0]) if (tb.quote('hannover', pl).path) await tb.build('hannover', pl); await tb.cityView('hannover', 13); },
    bham: async () => { const q = tb.quote('hamburg'); if (q.path) await tb.build('hamburg'); else say(q.why); await tb.view('east', 1); },
    net: async () => { await tb.view('map', .9); await tb.power(); }, st2: () => { say('Stufe 2: zweite Firma pro Stadt erlaubt.'); return tb.setStep(2); }, st3: () => { say('Stufe 3: alle drei Plätze offen.'); return tb.setStep(3); },
    auc: () => tb.ST.market.includes(19) ? tb.auction(19, [[0, 19], [1, 20], [2, null], [0, 22], [1, null]]) : say('Karte 19 ist schon verkauft.'), auclose: () => { const n = [...tb.ST.market].sort((a, b) => a - b)[0]; return tb.auction(n, [[0, n], [1, n + 2], [0, null], [2, null]]); },
    cycle: () => tb.cycleHighest(), draw: async () => { await tb.refill(); },
    bureau: () => tb.bureaucracy(), power: async () => { await tb.view('map', .9); await tb.power(); await tb.view('player', 1); }, income: async () => { await tb.view('player', .7); await tb.earn(44); }, order: () => tb.reorder(),
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act; const st = b.closest('.slide').querySelector('.stage3d'); if (st) attach(st);
    if (a.startsWith('v:')) { if (!busy) { hostView = a.slice(2); tb.view(hostView, 1); } return; } if (a === 'reset') { make(); return; } run(ACT[a]); });
  // dots
  const dots = [...document.querySelectorAll('.dot')], slides = [...document.querySelectorAll('.slide')];
  dots.forEach(d => d.onclick = () => slides[d.dataset.i].scrollIntoView({ behavior: 'smooth' }));
  function slideIOcb(es) { es.forEach(e => { if (e.isIntersecting) { const i = slides.indexOf(e.target); dots.forEach((d, j) => d.classList.toggle('on', i === j)); if (i === 7) shots(); } }); }
  const slideIO = new IntersectionObserver(slideIOcb, { threshold: .45 }); slides.forEach(s => slideIO.observe(s));
  // device snapshots
  let shotMode = null;
  function shots() { if (shotMode === mode || busy) return; shotMode = mode; const sizes = [['.phone img', 390, 844, 'map'], ['.land img', 844, 390, 'overview'], ['.tab img', 1180, 820, 'overview']];
    for (const [sel, w, hh, v] of sizes) { renderer.setSize(w, hh, false); tb.camera.aspect = w / hh; tb.camera.updateProjectionMatrix(); tb.view(v, 0); tb.frame(); document.querySelector(sel).src = renderer.domElement.toDataURL('image/jpeg', .85); }
    fit(); tb.view(hostView, 0); }
  // tools
  const sp = document.getElementById('speed'); sp.onclick = () => { const slow = sp.textContent === '1×'; sp.textContent = slow ? '0,4×' : '1×'; sp.classList.toggle('on', slow); setSpeed(slow ? 2.5 : 1); };
  const mb = document.getElementById('mode'); mb.onclick = () => { if (busy) return; mode = mode === 'dark' ? 'light' : 'dark'; mb.textContent = mode === 'dark' ? 'Hell' : 'Dunkel'; applyVars(); make(); shotMode = null; };
  window.__deck = { get tb() { return tb; }, ACT, run, attach, stages, get busy() { return busy; } };
  if (/[?&]fast/.test(location.search)) setSpeed(.3);
  if (!/[?&](test|static)/.test(location.search)) setTimeout(() => run(() => tb.intro()), 400);
}
