import asyncio
from playwright.async_api import async_playwright
MID=open('midgame.json').read()
VPS=[('l844',844,390),('l667',667,375),('l932',932,430)]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for nm,w,h in VPS:
      ctx=await b.new_context(viewport={'width':w,'height':h},service_workers='block',device_scale_factor=1);pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
      await pg.goto('http://localhost:8778/index.html');await pg.wait_for_timeout(300)
      await pg.evaluate("([st,l])=>{localStorage.setItem(SAVE_KEY,st);localStorage.setItem('hochspannung-lang',l)}",[MID,'en'])
      await pg.goto('http://localhost:8778/index.html');await pg.wait_for_timeout(1000)
      await pg.evaluate("()=>{bootEnd(true);BOOT.zoom=false;S=JSON.parse(localStorage.getItem(SAVE_KEY));A.cont();UI.sheet=null;UI.intro=false;clearTimeout(timer);timer=null;window.schedule=()=>{};render()}");await pg.wait_for_timeout(600)
      await pg.screenshot(path=f'L_{nm}_1.png')
      await pg.evaluate("()=>{startResources();S.seqIdx=Math.max(0,S.seq.indexOf(H));UI.sheet=null;UI.mkClosedR=S.round;render();suggestCart();render()}");await pg.wait_for_timeout(600);await pg.screenshot(path=f'L_{nm}_2.png')
      await pg.evaluate("()=>{startBuild();S.seqIdx=Math.max(0,S.seq.indexOf(H));UI.sheet=null;UI.undo=[{}];render()}");await pg.wait_for_timeout(600);await pg.screenshot(path=f'L_{nm}_3.png')
      await pg.evaluate("()=>{WIDE_CLASSIC=true;render()}");await pg.wait_for_timeout(400);pass
      print(nm,errs);await ctx.close()
    await b.close()
asyncio.run(main())
