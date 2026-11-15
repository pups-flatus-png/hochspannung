import asyncio, sys
from playwright.async_api import async_playwright
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await (await b.new_context(viewport={'width':844,'height':390},device_scale_factor=2,locale='de-DE')).new_page()
    pg.on('pageerror',lambda e:print('ERR',str(e)[:300]))
    await pg.goto('file:///home/claude/hochspannung/gm2-src/proto3d/dist/gm2-3d.html?test')
    await pg.wait_for_function('()=>window.__gm3d&&!__gm3d.state().introRunning',timeout=300000)
    for cid,d in [('hamburg',9)]:
      await pg.evaluate(f"()=>__gm3d.look('{cid}',{d})"); await pg.wait_for_timeout(1500); await pg.screenshot(path=f'shots/city-{cid}.png',timeout=200000)
    await pg.evaluate("()=>__gm3d.market()"); await pg.wait_for_timeout(4000); await pg.screenshot(path='shots/market.png',timeout=200000)
    await b.close()
asyncio.run(m())
