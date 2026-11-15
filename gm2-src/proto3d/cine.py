#!/usr/bin/env python3
"""Captures frames at fixed simulation times (deterministic ?fdt step) to review animations."""
import asyncio, os, sys
from playwright.async_api import async_playwright
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, 'shots'); os.makedirs(OUT, exist_ok=True)
W, H, DSF = (int(sys.argv[1]), int(sys.argv[2]), 2) if len(sys.argv) > 2 else (844, 390, 2)
async def at(pg, t0, dt): await pg.wait_for_function(f'()=>__gm3d.state().t>={t0+dt}', timeout=600000, polling=50)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=DSF, locale='de-DE')).new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto('file://' + D + '/dist/gm2-3d.html?test&fdt=0.04')
        await pg.wait_for_function('()=>window.__gm3d', timeout=120000)
        for tt in (1.2, 2.6, 4.0): await at(pg, 0, tt); await pg.screenshot(path=f'{OUT}/cine-intro-{tt}.png', timeout=200000)
        await pg.wait_for_function('()=>!__gm3d.state().introRunning', timeout=900000, polling=200)
        await pg.evaluate("()=>__gm3d.select('dresden')"); t0 = (await pg.evaluate("()=>__gm3d.state().t")); await pg.evaluate("()=>__gm3d.build()")
        for dt in (0.8, 1.6, 2.6, 3.3, 3.9, 4.6): await at(pg, t0, dt); await pg.screenshot(path=f'{OUT}/cine-build-{dt}.png', timeout=200000)
        await pg.wait_for_function('()=>!__gm3d.state().BUSY', timeout=900000, polling=200)
        t0 = await pg.evaluate("()=>__gm3d.state().t"); await pg.evaluate("()=>__gm3d.power()")
        for dt in (1.4, 2.4, 3.6): await at(pg, t0, dt); await pg.screenshot(path=f'{OUT}/cine-power-{dt}.png', timeout=200000)
        print('errors', errs); await b.close()
asyncio.run(main())
