import asyncio
from playwright.async_api import async_playwright
SAMP=open('bootall.py').read().split('SAMP="""')[1].split('"""')[0]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for mp in ['bx','de','ru']:
     for mode in ['shift','resize']:
      ctx=await b.new_context(viewport={'width':402,'height':874},service_workers='block');pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:150]))
      await pg.goto(f'http://localhost:8778/index.html?bootmap={mp}')
      await pg.wait_for_function("()=>document.documentElement.dataset.boot==='run'",timeout=8000)
      t0=await pg.evaluate("()=>performance.now()");worst=0;done=False;last=None
      for i in range(70):
        t=(await pg.evaluate("()=>performance.now()"))-t0
        if not done and t>2150:
          done=True
          if mode=='shift':await pg.evaluate("()=>{document.querySelector('#start .s3-top').style.paddingTop='70px';document.querySelector('#start .s3-hero').style.marginTop='30px'}")
          else:await pg.set_viewport_size({'width':402,'height':820})
        r=await pg.evaluate(SAMP)
        if r and not r[4] and r[3]=='visible' and r[0]-t0>1950:
          e=abs(r[1])+abs(r[2]);last=(int(r[0]-t0),r[1],r[2])
          if t>2350:worst=max(worst,e)
        await pg.wait_for_timeout(35)
      print(mp,mode,'worst after settle',worst,'last',last,errs[:1])
      await ctx.close()
    await b.close()
asyncio.run(main())
