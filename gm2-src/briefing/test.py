#!/usr/bin/env python3
"""python3 test.py [iphone-p iphone-l ipad-l mac] [--acts=round,aucscrap,...]"""
import asyncio, sys, os
from playwright.async_api import async_playwright
D = os.path.dirname(os.path.abspath(__file__)); args = [a for a in sys.argv[1:] if not a.startswith('--')]
ACTS = next((a.split('=')[1].split(',') for a in sys.argv if a.startswith('--acts=')), [])
DEV = {'iphone-p': (390, 844, 3, True), 'iphone-l': (844, 390, 3, True), 'ipad-l': (1180, 820, 2, True), 'mac': (1440, 900, 1, False), 'small': (1100, 690, 1, False)}
WHERE = {'bham': 'c9', 'fire': 'c10', 'round': 'c2', 'aucwin': 'c7', 'aucscrap': 'c7', 'auclose': 'c7', 'buyme': 'c8', 'buyopp': 'c8', 'refollow': 'c8', 'bham': 'c9', 'grow': 'c9', 'bureau': 'c10', 'fire': 'c10', 'st2': 'c11', 'intro': 'c0', 'kitorbit': 'c3'}
os.makedirs(os.path.join(D, 'shots'), exist_ok=True)
CHECK = """() => { const out = []; const bar = document.querySelector('.bar').getBoundingClientRect();
  if (document.documentElement.scrollWidth > innerWidth + 1 || document.querySelector('.book').scrollWidth > innerWidth + 1) out.push('hscroll');
  document.querySelectorAll('button, select, h1, h2, .score, .tl').forEach(b => { const r = b.getBoundingClientRect(); if (!r.width || r.bottom < bar.bottom || r.top > innerHeight) return; if (r.right > innerWidth + 1 || r.left < -1) out.push('offscreen:' + (b.textContent||'').trim().slice(0,20)); });
  const s = document.querySelector('.score'), bc = document.querySelector('.buildcard'); if (s && bc && !bc.hidden) { const a = s.getBoundingClientRect(), r = bc.getBoundingClientRect(); if (r.left < a.right && r.top < a.bottom && r.right > a.left && r.bottom > a.top) out.push('score/buildcard overlap'); }
  const bn = document.querySelector('.banner'); if (s && bn && !bn.hidden) { const a = s.getBoundingClientRect(), r = bn.getBoundingClientRect(); if (r.left < a.right && r.top < a.bottom && r.right > a.left && r.bottom > a.top) out.push('score/banner overlap'); }
  return out; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for dev in args or ['mac']:
            w, h, dsf, mob = DEV[dev]
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=min(dsf, 2), is_mobile=mob, has_touch=mob, locale='de-DE')
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
            await pg.goto('file://' + os.path.join(D, 'dist', 'gm2-gridplan-briefing.html') + '?test&fast' + next(('&q=' + a.split('=')[1] for a in sys.argv if a.startswith('--q=')), '')); await pg.wait_for_function('window.__deck', timeout=60000); await pg.wait_for_timeout(2500)
            lay = set(); ids = [] if '--noslides' in sys.argv else await pg.evaluate("[...document.querySelectorAll('.chap')].map(c => c.id)")
            for cid in ids:
                await pg.evaluate(f"document.getElementById('{cid}').scrollIntoView()"); await pg.wait_for_timeout(2000)
                for x in await pg.evaluate(CHECK): lay.add(f'{cid}:{x}')
                await pg.screenshot(path=os.path.join(D, 'shots', f'{dev}-{cid}.png'))
            for act in ACTS:
                cid = WHERE.get(act, 'c4'); await pg.evaluate(f"document.getElementById('{cid}').scrollIntoView()"); await pg.wait_for_timeout(1500)
                await pg.evaluate(f"document.querySelector('#{cid} [data-act={act}]').click()")
                for k in range(120 if '--long' in sys.argv else 40):
                    await pg.wait_for_timeout(4000 if act == 'round' else 1500)
                    if (act in ('round', 'aucscrap', 'bureau') and k % 3 == 1) or (act in ('aucwin', 'bham', 'fire', 'refollow')):
                        await pg.screenshot(path=os.path.join(D, 'shots', f'{dev}-act-{act}-{k:02d}.png'))
                        for x in await pg.evaluate(CHECK): lay.add(f'{act}:{x}')
                    if not await pg.evaluate('window.__deck.busy'): break
                await pg.wait_for_timeout(400); await pg.screenshot(path=os.path.join(D, 'shots', f'{dev}-act-{act}.png'))
            await pg.evaluate("document.getElementById('c4').scrollIntoView()"); await pg.wait_for_timeout(1500); await pg.evaluate("window.__tb.onCity('hamburg')"); await pg.wait_for_timeout(400)
            for x in await pg.evaluate(CHECK): lay.add('card:' + x)
            await pg.screenshot(path=os.path.join(D, 'shots', f'{dev}-card.png'))
            print(dev, 'errors', errs[:6], 'layout', sorted(lay), flush=True); await ctx.close()
        await b.close()
asyncio.run(main())
