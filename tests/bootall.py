import os
BASE=os.environ.get('GM_BASE','http://localhost:8778')
import asyncio,json,sys
from playwright.async_api import async_playwright
SAMP="""()=>{const d=document.querySelector('#boot .bt-dot');const hm=document.querySelector('#start .s3-hero .hero-map');if(!d||!HM.intro||!HM.g||!HM.mp||!hm)return null;const I=HM.intro;const n=HM.g.n[I.src];if(!n)return null;const b=hm.getBoundingClientRect(),q=HM.gp?HM.gp(n.x,n.y):[n.x,n.y];const dr=d.getBoundingClientRect();
 return [Math.round(performance.now()),Math.round(b.left+HM.mp.ox+q[0]*HM.mp.s-(dr.left+dr.width/2)),Math.round(b.top+HM.mp.oy+q[1]*HM.mp.s-(dr.top+dr.height/2)),getComputedStyle(d).visibility,d.classList.contains('gone')]}"""
async def main():
  maps=sys.argv[1].split(',');vps=[(402,874),(390,844),(375,667),(844,390),(1440,900),(820,1180)]
  async with async_playwright() as p:
    b=await p.chromium.launch()
    res={}
    for mp in maps:
      for w,h in vps:
        ctx=await b.new_context(viewport={'width':w,'height':h},service_workers='block');pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:150]))
        await pg.goto(fBASE+'/index.html?bootmap={mp}')
        await pg.wait_for_function("()=>document.documentElement.dataset.boot==='run'",timeout=8000)
        t0=await pg.evaluate("()=>performance.now()")
        worst=0;samples=[]
        for i in range(70):
          r=await pg.evaluate(SAMP)
          if r and not r[4] and r[3]=='visible':
            t=r[0]-t0
            if t>1900:  # after bootFly
              e=abs(r[1])+abs(r[2]);samples.append((int(t),r[1],r[2]));worst=max(worst,e)
          await pg.wait_for_timeout(40)
        res[f'{mp} {w}x{h}']=(worst,samples[:2],samples[-1:] if samples else None,errs[:1])
        await ctx.close()
    for k,v in res.items():print(k,v)
    await b.close()
asyncio.run(main())
