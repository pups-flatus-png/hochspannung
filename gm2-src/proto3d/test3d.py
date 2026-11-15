#!/usr/bin/env python3
"""Screenshots + layout checks for the 3D prototype on iPhone portrait/landscape, iPad and Mac."""
import asyncio, os, sys
from playwright.async_api import async_playwright
D = os.path.dirname(os.path.abspath(__file__))
URL = 'file://' + os.path.join(D, 'dist/gm2-3d.html') + '?test'
OUT = os.path.join(D, 'shots'); os.makedirs(OUT, exist_ok=True)
VPS = [('iphone-p', 390, 844, 2, True), ('iphone-l', 844, 390, 2, True), ('ipad-p', 820, 1180, 2, True), ('ipad-l', 1180, 820, 2, True), ('mac', 1440, 900, 1, False)]
ONLY = sys.argv[1:]
CHECK = """()=>{const r=s=>document.querySelector(s).getBoundingClientRect();const ov=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const brand=r('.brand'),money=r('.money'),bot=r('#bot'),card=document.querySelector('#card');const out=[];
if(ov(brand,money))out.push('brand/money overlap');
const sp=document.querySelector('.brand span');if(sp.scrollWidth>sp.clientWidth+1)out.push('brand truncated');
document.querySelectorAll('#bot button').forEach(b=>{if(b.scrollWidth>b.clientWidth+1)out.push('btn cut: '+b.textContent);const q=b.getBoundingClientRect();if(q.right>innerWidth||q.left<0)out.push('btn offscreen')});
if(card.classList.contains('on')){const c=card.getBoundingClientRect();document.querySelectorAll('#bot button').forEach(b=>{if(ov(c,b.getBoundingClientRect()))out.push('card/bot overlap')});if(ov(c,money))out.push('card/money overlap');if(c.bottom>innerHeight||c.top<0)out.push('card offscreen')}
const L=[...document.querySelectorAll('.lb')].filter(e=>e.style.visibility==='visible').map(e=>e.getBoundingClientRect());let lo=0;for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++)if(ov(L[i],L[j]))lo++;if(lo)out.push('label overlaps '+lo);
return out}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for nm, w, h, dsf, mob in VPS:
            if ONLY and nm not in ONLY: continue
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dsf, is_mobile=mob, has_touch=mob, locale='de-DE')
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text[:200]))
            await pg.goto(URL)
            await pg.wait_for_timeout(1500); await pg.screenshot(timeout=120000, path=f'{OUT}/{nm}-0-intro.png')
            await pg.wait_for_function('()=>window.__gm3d&&!__gm3d.state().introRunning', timeout=240000)
            await pg.wait_for_timeout(800); await pg.screenshot(timeout=120000, path=f'{OUT}/{nm}-1-board.png'); r1 = await pg.evaluate(CHECK)
            await pg.evaluate("()=>__gm3d.select('hamburg')"); await pg.wait_for_timeout(700)
            await pg.screenshot(timeout=120000, path=f'{OUT}/{nm}-2-select.png'); r2 = await pg.evaluate(CHECK)
            q = await pg.evaluate("()=>__gm3d.quote('hamburg')")
            await pg.evaluate("()=>__gm3d.select('dresden')"); await pg.wait_for_timeout(300)
            await pg.evaluate("()=>__gm3d.build()"); await pg.wait_for_timeout(900); await pg.screenshot(timeout=120000, path=f'{OUT}/{nm}-3-building.png')
            await pg.wait_for_function('()=>!__gm3d.state().BUSY', timeout=240000); await pg.wait_for_timeout(500)
            await pg.evaluate("()=>__gm3d.market()"); await pg.wait_for_timeout(1200)
            await pg.evaluate("()=>__gm3d.cart('coal',2)"); await pg.evaluate("()=>__gm3d.cart('oil',1)"); await pg.wait_for_timeout(700)
            await pg.screenshot(timeout=120000, path=f'{OUT}/{nm}-5-market.png'); r3 = await pg.evaluate(CHECK)
            await pg.evaluate("()=>__gm3d.build()"); await pg.wait_for_timeout(1500); await pg.screenshot(timeout=120000, path=f'{OUT}/{nm}-6-buying.png')
            await pg.wait_for_function('()=>!__gm3d.state().BUSY', timeout=240000); print(nm, 'market check', r3, 'money', (await pg.evaluate("()=>__gm3d.state()"))['money'])
            await pg.evaluate("()=>__gm3d.power()"); await pg.wait_for_timeout(1400); await pg.screenshot(timeout=120000, path=f'{OUT}/{nm}-4-power.png')
            await pg.wait_for_function('()=>!__gm3d.state().BUSY', timeout=240000)
            st = await pg.evaluate("()=>__gm3d.state()")
            print(nm, 'errors:', errs, '| board:', r1, '| select:', r2, '| hamburg quote:', {k: q.get(k) for k in ('line', 'house', 'total', 'ok')}, '| end money', st['money'])
            await ctx.close()
        await b.close()
asyncio.run(main())
