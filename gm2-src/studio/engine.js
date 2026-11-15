/* Grid Master 2 – Studio-Engine: SVG-Spielbrett, Märkte, Animationsbausteine. Themes liefern Look + Animations-Charakter. */
const GM = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const MAP = window.MAPDATA, CITY = {}, ADJ = {};
  MAP.cities.forEach(c => { CITY[c.id] = c; ADJ[c.id] = []; });
  const EDGES = MAP.edges.map(([a, b, cost], i) => { const e = { i, a, b, cost }; ADJ[a].push(e); ADJ[b].push(e); return e; });
  const PLANTDATA = { 3: ['oil', 2, 1], 4: ['coal', 2, 1], 5: ['hybrid', 2, 1], 6: ['garbage', 1, 1], 7: ['oil', 3, 2], 8: ['coal', 3, 2], 9: ['oil', 1, 1], 10: ['coal', 2, 2], 11: ['uranium', 1, 2], 12: ['hybrid', 2, 2], 13: ['eco', 0, 1], 14: ['garbage', 2, 2], 15: ['coal', 2, 3], 16: ['oil', 2, 3], 17: ['uranium', 1, 2], 18: ['eco', 0, 2], 19: ['garbage', 2, 3], 20: ['coal', 3, 5], 21: ['hybrid', 2, 4], 22: ['eco', 0, 2], 23: ['uranium', 1, 3], 24: ['garbage', 2, 4], 25: ['coal', 2, 5], 26: ['oil', 2, 5], 27: ['eco', 0, 3], 28: ['uranium', 1, 4], 29: ['hybrid', 1, 4], 30: ['garbage', 3, 6], 31: ['coal', 3, 6], 34: ['uranium', 1, 5], 38: ['garbage', 3, 7] };
  const RES = ['coal', 'oil', 'garbage', 'uranium'];
  const RNAME = { coal: 'Kohle', oil: 'Öl', garbage: 'Müll', uranium: 'Uran', eco: 'Öko', hybrid: 'Kohle/Öl' };
  const PRICES = { coal: [1, 2, 3, 4, 5, 6, 7, 8], oil: [1, 2, 3, 4, 5, 6, 7, 8], garbage: [1, 2, 3, 4, 5, 6, 7, 8], uranium: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16] };
  const PLAYERS = [{ name: 'Du' }, { name: 'Rhein AG' }, { name: 'Isar Energie' }];
  const DEMO = [[0, ['berlin', 'potsdam', 'leipzig']], [1, ['koeln', 'duesseldorf', 'essen', 'dortmund']], [2, ['muenchen', 'augsburg', 'nuernberg']]];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let SPEED = 1;

  // ---------- helpers ----------
  function el(tag, attrs = {}, parent) { const n = document.createElementNS(NS, tag); for (const k in attrs) if (attrs[k] !== undefined) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
  function html(parent, markup) { const g = el('g', {}, parent); g.innerHTML = markup; return g; }
  const E = { lin: k => k, out: k => 1 - (1 - k) ** 3, in: k => k * k * k, inout: k => k < .5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2, back: k => { const c = 1.7; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; }, spring: k => 1 - Math.cos(k * Math.PI * 4.5) * Math.exp(-k * 6), snap: k => k < .7 ? E.out(k / .7) * 1.06 : 1.06 - .06 * E.inout((k - .7) / .3) };
  function tween(dur, fn, ease = 'inout', delay = 0) {
    return new Promise(res => { const d = reduced ? Math.min(dur, .1) : dur * SPEED; const ef = typeof ease === 'function' ? ease : E[ease]; let t0 = null;
      const step = ts => { if (t0 === null) t0 = ts + delay * 1000 * SPEED; const k = Math.max(0, Math.min(1, (ts - t0) / (d * 1000))); if (ts >= t0) fn(ef(k), k); if (k < 1) requestAnimationFrame(step); else res(); };
      requestAnimationFrame(step); });
  }
  const wait = s => tween(s, () => { }, 'lin');
  const lerp = (a, b, k) => a + (b - a) * k;
  function rng(seed) { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const css = (name, root = document.documentElement) => getComputedStyle(root).getPropertyValue(name).trim();
  const pcol = i => css('--p' + i);

  // line geometry with lane offset
  function seg(A, B, lane = 0, trim = 9) { const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, o = lane * 4.2; return { x1: A.x + ux * trim + nx * o, y1: A.y + uy * trim + ny * o, x2: B.x - ux * trim + nx * o, y2: B.y - uy * trim + ny * o, L, ux, uy, nx, ny }; }

  // ---------- generic effects (themes combine these) ----------
  const FX = {
    drawStroke(p, dur, ease = 'inout') { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; return tween(dur, k => { p.style.strokeDashoffset = L * (1 - k); }, ease).then(() => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; }); },
    along(p, dur, fn, ease = 'inout') { const L = p.getTotalLength(); return tween(dur, k => { const q = p.getPointAtLength(L * k); fn(q, k); }, ease); },
    burst(layer, x, y, col, n = 18, o = {}) {
      const parts = []; for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = (o.speed || 40) * (.4 + Math.random()); const r = (o.size || 2.2) * (.6 + Math.random() * .8);
        const node = o.shape === 'rect' ? el('rect', { x: -r, y: -r * .6, width: r * 2, height: r * 1.2, fill: Array.isArray(col) ? col[i % col.length] : col }, layer) : el('circle', { r, fill: Array.isArray(col) ? col[i % col.length] : col }, layer); parts.push({ node, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), rot: Math.random() * 360 }); }
      const life = o.life || .9; let last = 0;
      return tween(life, (e, k) => { const dt = (k - last) * life; last = k; parts.forEach(p => { p.vy += (o.gravity ?? 60) * dt; p.x = (p.x || 0) + p.vx * dt; p.y = (p.y || 0) + p.vy * dt; p.rot += 300 * dt; p.node.setAttribute('transform', `translate(${x + p.x},${y + p.y}) rotate(${p.rot})`); p.node.setAttribute('opacity', 1 - k); }); }, 'lin').then(() => parts.forEach(p => p.node.remove()));
    },
    ripple(layer, x, y, col, r1 = 30, dur = .9, w = 2) { const c = el('circle', { cx: x, cy: y, r: 2, fill: 'none', stroke: col, 'stroke-width': w }, layer); return tween(dur, k => { c.setAttribute('r', 2 + r1 * k); c.setAttribute('opacity', 1 - k); c.setAttribute('stroke-width', w * (1 - k * .7)); }, 'out').then(() => c.remove()); },
    float(layer, x, y, text, cls = '', col) { const t = el('text', { x, y, class: 'fx-text ' + cls, 'text-anchor': 'middle', fill: col }, layer); t.textContent = text; return tween(1.4, (e, k) => { t.setAttribute('y', y - e * 22); t.setAttribute('opacity', k < .75 ? Math.min(1, k * 6) : (1 - k) / .25); }, 'out').then(() => t.remove()); },
    flash(layer, x, y, col, r = 14, dur = .5) { const c = el('circle', { cx: x, cy: y, r: 1, fill: col, class: 'fx-glow' }, layer); return tween(dur, k => { c.setAttribute('r', 1 + r * Math.sin(k * Math.PI)); c.setAttribute('opacity', 1 - k); }, 'out').then(() => c.remove()); },
    countTo(node, from, to, dur = .9) { return tween(dur, e => { node.textContent = Math.round(lerp(from, to, e)); }, 'out'); },
  };

  // ---------- Board ----------
  class Board {
    constructor(host, theme, o = {}) {
      this.T = theme; this.o = o; this.owners = {}; this.lines = []; this.sel = null; this.busy = false; this.money = 60;
      this.svg = el('svg', { viewBox: o.view || `0 0 ${MAP.w} ${MAP.h}`, class: 'board ' + (o.cls || ''), role: 'img', 'aria-label': 'Spielbrett Deutschland' }, host);
      const L = n => el('g', { class: 'L-' + n }, this.svg);
      this.defs = el('defs', {}, this.svg); this.gLand = L('land'); this.gEdges = L('edges'); this.gLines = L('lines'); this.gCities = L('cities'); this.gLabels = L('labels'); this.gFx = L('fx');
      this.uid = 'b' + Math.random().toString(36).slice(2, 7);
      this.render();
      if (o.interactive) this.svg.addEventListener('click', ev => { const g = ev.target.closest('.city'); if (g && !this.busy) this.onCity && this.onCity(g.dataset.id); });
    }
    render() {
      const T = this.T; [this.defs, this.gLand, this.gEdges, this.gLines, this.gCities, this.gLabels].forEach(g => g.innerHTML = '');
      T.land(this, MAP);
      EDGES.forEach(e => T.edge(this, e, CITY[e.a], CITY[e.b]));
      this.lines.forEach(l => { l.el = T.line(this, l.e, l.pl, l.lane, true); });
      MAP.cities.forEach(c => this.drawCity(c));
      if (!this.o.noLabels) MAP.cities.forEach(c => T.label(this, c));
    }
    drawCity(c, fresh) { const old = this.gCities.querySelector(`[data-id="${c.id}"]`); const g = el('g', { class: 'city', 'data-id': c.id, transform: `translate(${c.x},${c.y})` }); if (old) old.replaceWith(g); else this.gCities.appendChild(g); this.T.city(this, g, c, this.owners[c.id] || [], { sel: this.sel === c.id, reach: this.reach && this.reach.has(c.id), fresh }); return g; }
    cityG(id) { return this.gCities.querySelector(`[data-id="${id}"]`); }
    route(pl, target) {
      const src = Object.keys(this.owners).filter(k => this.owners[k].includes(pl)); const dist = {}, prev = {}; MAP.cities.forEach(c => dist[c.id] = Infinity); src.forEach(s => dist[s] = 0); const Q = new Set(Object.keys(dist));
      while (Q.size) { let u = null, b = Infinity; for (const k of Q) if (dist[k] < b) { b = dist[k]; u = k; } if (u === null) break; Q.delete(u); for (const e of ADJ[u]) { const v = e.a === u ? e.b : e.a, w = this.lines.some(l => l.e === e && l.pl === pl) ? 0 : e.cost; if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = [u, e]; } } }
      if (target === undefined) return dist;
      const path = []; let v = target; while (prev[v]) { const [u, e] = prev[v]; if (!this.lines.some(l => l.e === e && l.pl === pl)) path.unshift({ e, from: u, to: v }); v = u; }
      return { cost: dist[target], path };
    }
    quote(id, pl = 0) { const n = (this.owners[id] || []).length; if ((this.owners[id] || []).includes(pl) || n >= 3) return null; const r = this.route(pl, id); if (r.cost === Infinity) return null; return { line: r.cost, house: [10, 15, 20][n], total: r.cost + [10, 15, 20][n], path: r.path }; }
    markReach(pl = 0) { const d = this.route(pl); this.reach = new Set(MAP.cities.filter(c => !(this.owners[c.id] || []).includes(pl) && (this.owners[c.id] || []).length < 3 && d[c.id] + [10, 15, 20][(this.owners[c.id] || []).length] <= this.money).map(c => c.id)); MAP.cities.forEach(c => this.drawCity(c)); }
    addLine(e, pl, instant) { const lane = this.lines.filter(l => l.e === e).length; const l = { e, pl, lane }; l.el = this.T.line(this, e, pl, lane, instant); this.lines.push(l); return l; }
    async build(id, pl = 0, o = {}) {
      const q = this.route(pl, id); this.busy = true; this.sel = null; this.reach = null;
      for (const st of q.path) { const l = this.addLine(st.e, pl, false); await this.T.animLine(this, l, CITY[st.from], CITY[st.to], pl, o); }
      (this.owners[id] ||= []).push(pl); const g = this.drawCity(CITY[id], true);
      await this.T.animHouse(this, CITY[id], pl, g, o); this.busy = false;
    }
    setup(state = DEMO) { for (const [pl, list] of state) list.forEach((id, i) => { (this.owners[id] ||= []).push(pl); if (i) { const e = EDGES.find(e => (e.a === id && e.b === list[i - 1]) || (e.b === id && e.a === list[i - 1])); if (e) this.addLine(e, pl, true); } }); MAP.cities.forEach(c => this.drawCity(c)); }
    reset() { this.owners = {}; this.lines = []; this.sel = null; this.reach = null; this.render(); }
    async intro() { this.busy = true; await this.T.intro(this); this.busy = false; }
    async power() {
      this.busy = true; const seqs = [];
      PLAYERS.forEach((p, pl) => { const net = Object.keys(this.owners).filter(k => this.owners[k].includes(pl)); if (!net.length) return; const root = net[0], order = [[root, null]], seen = new Set([root]);
        for (let i = 0; i < order.length; i++) for (const e of ADJ[order[i][0]]) { const l = this.lines.find(l => l.e === e && l.pl === pl); if (!l) continue; const v = e.a === order[i][0] ? e.b : e.a; if (!seen.has(v)) { seen.add(v); order.push([v, order[i][0], l]); } }
        seqs.push({ pl, order }); });
      await this.T.animPower(this, seqs); this.busy = false;
    }
  }

  // ---------- Resource market ----------
  class Market {
    constructor(host, theme, o = {}) {
      this.T = theme; this.o = o; this.W = 560; this.H = 300; this.svg = el('svg', { viewBox: `0 0 ${this.W} ${this.H}`, class: 'market', role: 'img', 'aria-label': 'Rohstoffmarkt' }, host);
      this.defs = el('defs', {}, this.svg); this.gBase = el('g', {}, this.svg); this.gPieces = el('g', {}, this.svg); this.gFx = el('g', {}, this.svg);
      this.occ = { coal: [...Array(24).keys()], oil: [...Array(18).keys()].map(i => i + 6), garbage: [18, 19, 20, 21, 22, 23], uranium: [10, 11] }; this.store = { coal: 0, oil: 0, garbage: 0, uranium: 0 };
      this.render();
    }
    slot(k, i) { const row = RES.indexOf(k), y = 62 + row * 46; if (k === 'uranium') return { x: 92 + (i + .5) * (432 / 12), y }; const cell = Math.floor(i / 3), j = i % 3; return { x: 92 + (cell + .5) * 54 + (j - 1) * 14, y }; }
    cell(k, c) { const row = RES.indexOf(k), y = 62 + row * 46, n = k === 'uranium' ? 12 : 8, w = 432 / n; return { x: 92 + c * w, y: y - 20, w, h: 40, price: PRICES[k][c] }; }
    bin(k, i = 0) { return { x: 150 + RES.indexOf(k) * 100 + i * 15, y: 268 }; }
    render() { this.defs.innerHTML = ''; this.gBase.innerHTML = ''; this.gPieces.innerHTML = ''; this.T.marketBase(this); this.pieces = {}; RES.forEach(k => { this.pieces[k] = this.occ[k].map(i => this.addPiece(k, i)); }); RES.forEach(k => { for (let i = 0; i < this.store[k]; i++) this.addStored(k, i); }); }
    addPiece(k, i, at) { const p = this.slot(k, i), g = html(this.gPieces, this.T.piece(k)); g.setAttribute('class', 'piece'); g.setAttribute('transform', `translate(${(at || p).x},${(at || p).y})`); return { g, i, k, x: (at || p).x, y: (at || p).y }; }
    addStored(k, i) { const b = this.bin(k, i), g = html(this.gPieces, this.T.piece(k)); g.setAttribute('transform', `translate(${b.x},${b.y}) scale(.8)`); return g; }
    cheapest(k, n) { return this.pieces[k].slice().sort((a, b) => a.i - b.i).slice(0, n); }
    priceOf(k, n) { return this.cheapest(k, n).reduce((s, p) => s + (k === 'uranium' ? PRICES.uranium[p.i] : Math.floor(p.i / 3) + 1), 0); }
    move(p, x, y) { p.x = x; p.y = y; p.g.setAttribute('transform', `translate(${x},${y})`); }
    async buy(cart) { const jobs = []; let n = 0; for (const k in cart) { const take = this.cheapest(k, cart[k]); for (const p of take) { this.pieces[k].splice(this.pieces[k].indexOf(p), 1); this.occ[k] = this.occ[k].filter(i => i !== p.i); const b = this.bin(k, this.store[k]++); jobs.push(this.T.animBuy(this, p, b, n++)); } } await Promise.all(jobs); }
    async restock(add = { coal: 4, oil: 2, garbage: 1, uranium: 1 }) { const jobs = []; let n = 0; for (const k in add) { let c = add[k]; const total = k === 'uranium' ? 12 : 24; for (let i = total - 1; i >= 0 && c > 0; i--) { if (this.occ[k].includes(i)) continue; c--; this.occ[k].push(i); const p = this.addPiece(k, i); this.pieces[k].push(p); jobs.push(this.T.animRestock(this, p, n++)); } } await Promise.all(jobs); }
    async burn() { const jobs = []; let n = 0; const nodes = [...this.gPieces.querySelectorAll('g')].filter(g => /scale\(\.8\)/.test(g.getAttribute('transform') || '')); for (const g of nodes) jobs.push(this.T.animBurn(this, g, n++)); RES.forEach(k => this.store[k] = 0); await Promise.all(jobs); }
  }

  // ---------- Power plant market ----------
  class Plants {
    constructor(host, theme, o = {}) {
      this.T = theme; this.W = 560; this.H = 330; this.svg = el('svg', { viewBox: `0 0 ${this.W} ${this.H}`, class: 'plants', role: 'img', 'aria-label': 'Kraftwerksmarkt' }, host);
      this.defs = el('defs', {}, this.svg); this.gBase = el('g', {}, this.svg); this.gCards = el('g', {}, this.svg); this.gFx = el('g', {}, this.svg);
      this.market = [17, 19, 20, 21, 22, 23, 24, 25]; this.deck = [38, 29, 26, 34, 27, 31]; this.mine = [10, 16]; this.render();
    }
    slot(i) { return { x: 14 + (i % 4) * 106, y: 50 + (i < 4 ? 0 : 1) * 86 }; }
    mineSlot(i) { return { x: 14 + i * 106, y: 236 }; }
    deckPos() { return { x: 448, y: 93 }; }
    render() { this.defs.innerHTML = ''; this.gBase.innerHTML = ''; this.gCards.innerHTML = ''; this.T.plantsBase(this); this.cards = new Map(); this.market.slice().sort((a, b) => a - b).forEach((n, i) => this.cards.set(n, this.addCard(n, this.slot(i), i < 4 ? 'current' : 'future'))); this.mineG = this.mine.map((n, i) => this.addCard(n, this.mineSlot(i), 'owned')); this.deckG = []; this.deck.forEach((n, i) => { const d = this.deckPos(), g = html(this.gCards, this.T.cardBack()); g.setAttribute('transform', `translate(${d.x - i * .6},${d.y - i * 1.2})`); g.dataset.x = d.x - i * .6; g.dataset.y = d.y - i * 1.2; this.deckG.push(g); }); }
    addCard(n, p, state) { const g = html(this.gCards, this.T.card(n, PLANTDATA[n], state)); g.setAttribute('transform', `translate(${p.x},${p.y})`); g.dataset.n = n; g.dataset.x = p.x; g.dataset.y = p.y; g.classList.add('pcard'); return g; }
    sorted() { return [...this.cards.keys()].sort((a, b) => a - b); }
    async auction(n, bids) { const g = this.cards.get(n); await this.T.animAuction(this, g, n, bids); }
    async takeToMine(n) { const g = this.cards.get(n); this.cards.delete(n); this.market = this.market.filter(x => x !== n); const to = this.mineSlot(this.mine.length); this.mine.push(n); await this.T.animToMine(this, g, to); g.remove(); this.mineG.push(this.addCard(n, to, 'owned')); }
    async takeAway(n, pl) { const g = this.cards.get(n); this.cards.delete(n); this.market = this.market.filter(x => x !== n); await this.T.animAway(this, g, pl); g.remove(); }
    async refill() { const n = this.deck.pop(), back = this.deckG.pop(); if (!n) return; this.market.push(n); const g = this.addCard(n, this.deckPos(), 'future'); g.style.opacity = 0; this.cards.set(n, g); const order = this.sorted(); await this.T.animRefill(this, back, g, n, order); this.render(); }
  }

  // ---------- city skyline generator (shared, themes style it) ----------
  function skylineRects(id, n) { const r = rng(id); const out = []; const count = 3 + n * 2; for (let i = 0; i < count; i++) { const w = 3 + r() * 4, h = 6 + r() * (8 + n * 6); out.push({ x: -14 + i * (28 / count) + r() * 2, w, h }); } return out; }

  return { MAP, CITY, ADJ, EDGES, PLANTDATA, RES, RNAME, PRICES, PLAYERS, DEMO, el, html, tween, wait, E, FX, lerp, rng, seg, css, pcol, Board, Market, Plants, skylineRects, setSpeed: s => SPEED = s };
})();
