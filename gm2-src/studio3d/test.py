#!/usr/bin/env python3
"""python3 test.py <key> [iphone-p iphone-l ipad-l mac] [--acts]"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
D = os.path.dirname(os.path.abspath(__file__)); key = sys.argv[1]; args = [a for a in sys.argv[2:] if not a.startswith('--')]; ACTS = '--acts' in sys.argv
DEV = {'iphone-p': (390, 844, 3, True), 'iphone-l': (844, 390, 3, True), 'ipad-l': (1180, 820, 2, True), 'mac': (1440, 900, 1, False)}
os.makedirs(os.path.join(D, 'shots'), exist_ok=True)
CHECK = """() => { const out = []; const bar = document.querySelector('.bar').getBoundingClientRect();
  if (document.documentElement.scrollWidth > innerWidth + 1 || document.querySelector('.slides').scrollWidth > innerWidth + 1) out.push('hscroll');
  document.querySelectorAll('button, .money, h1, h2').forEach(b => { const r = b.getBoundingClientRect(); if (!r.width || r.bottom < bar.bottom || r.top > innerHeight) return; if (r.right > innerWidth + 1 || r.left < -1) out.push('offscreen:' + (b.textContent||'').trim().slice(0,20)); if (r.top < bar.bottom - 1 && r.bottom > bar.bottom) out.push('underbar:' + (b.textContent||'').trim().slice(0,20)); });
  const m = document.querySelector('.money').getBoundingClientRect(), bc = document.querySelector('.buildcard'); if (bc && !bc.hidden) { const r = bc.getBoundingClientRect(); if (r.left < m.right && r.top < m.bottom && r.right > m.left && r.bottom > m.top) out.push('money/buildcard overlap'); }
  return out; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for dev in args or ['mac']:
            w, h, dsf, mob = DEV[dev]
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=min(dsf, 2), is_mobile=mob, has_touch=mob, locale='de-DE')
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
            await pg.goto('file://' + os.path.join(D, 'dist', f'gm2-3d-concept-{key}.html') + '?test&fast'); await pg.wait_for_function('window.__deck', timeout=60000); await pg.wait_for_timeout(2500)
            lay = set()
            n = await pg.evaluate("document.querySelectorAll('.slide').length")
            for i in range(n):
                await pg.evaluate(f"document.querySelectorAll('.slide')[{i}].scrollIntoView()"); await pg.wait_for_timeout(2200 if i in (0,2,3,4,5,6,7) else 600)
                for x in await pg.evaluate(CHECK): lay.add(f's{i}:{x}')
                await pg.screenshot(path=os.path.join(D, 'shots', f'{key}-{dev}-s{i}.png'))
            if ACTS:
                for i, act in [(3, 'buy'), (5, 'auc'), (4, 'grow'), (6, 'bureau')]:
                    await pg.evaluate(f"document.querySelectorAll('.slide')[{i}].scrollIntoView()"); await pg.wait_for_timeout(1500)
                    await pg.evaluate(f"document.querySelector('#s{i} [data-act={act}]').click()"); await pg.wait_for_timeout(800)
                    await pg.wait_for_function('!window.__deck.busy', timeout=240000); await pg.wait_for_timeout(500)
                    await pg.screenshot(path=os.path.join(D, 'shots', f'{key}-{dev}-act-{act}.png'))
                await pg.evaluate("document.querySelectorAll('.slide')[2].scrollIntoView()"); await pg.wait_for_timeout(1500)
                await pg.evaluate("window.__tb.onCity('hamburg')"); await pg.wait_for_timeout(500)
                for x in await pg.evaluate(CHECK): lay.add('card:' + x)
                await pg.screenshot(path=os.path.join(D, 'shots', f'{key}-{dev}-card.png'))
                await pg.evaluate("document.getElementById('mode').click()"); await pg.wait_for_timeout(2500)
                await pg.screenshot(path=os.path.join(D, 'shots', f'{key}-{dev}-mode.png'))
            money = await pg.evaluate("document.getElementById('money').textContent")
            print(dev, 'errors', errs[:5], 'layout', sorted(lay), 'money', money, flush=True)
            await ctx.close()
        await b.close()
asyncio.run(main())
