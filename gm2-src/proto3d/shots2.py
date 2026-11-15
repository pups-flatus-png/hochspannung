import asyncio
from playwright.async_api import async_playwright
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await (await b.new_context(viewport={'width':844,'height':390},device_scale_factor=2,locale='de-DE')).new_page()
    pg.on('pageerror',lambda e:print('ERR',str(e)[:300]))
    await pg.goto('file:///home/claude/hochspannung/gm2-src/proto3d/dist/gm2-3d.html?test')
    await pg.wait_for_function('()=>window.__gm3d&&!__gm3d.state().introRunning',timeout=300000)
    await pg.wait_for_timeout(1500); await pg.screenshot(path='shots/v4-overview.png',timeout=200000)
    mk=await pg.evaluate("()=>__gm3d.mk()"); m=mk['m']
    await pg.evaluate(f"()=>__gm3d.cam({m['x']+1},{6},{m['z']+9},{m['x']+1},0,{m['z']+4})"); await pg.wait_for_timeout(1500); await pg.screenshot(path='shots/v4-pieces.png',timeout=200000)
    await pg.evaluate("()=>__gm3d.market()"); await pg.wait_for_timeout(4000); await pg.screenshot(path='shots/v4-market.png',timeout=200000)
    await pg.evaluate("()=>__gm3d.plants()"); await pg.wait_for_timeout(4000); await pg.screenshot(path='shots/v4-plants.png',timeout=200000)
    await b.close()
asyncio.run(m())
