#!/usr/bin/env python3
import asyncio, sys, os
from playwright.async_api import async_playwright
D=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(D,'shots'); os.makedirs(OUT,exist_ok=True)
VPS={'iphone-p':(390,844,True),'iphone-l':(844,390,True),'ipad-l':(1180,820,True),'mac':(1440,900,False)}
key=sys.argv[1]; vps=sys.argv[2:] or list(VPS)
CHECK="""()=>{const ov=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;const r=s=>document.querySelector(s).getBoundingClientRect();const o=[];
if(ov(r('.brand'),r('.tools')))o.push('brand/tools');const d=r('.dots');if(d.width&&(ov(r('.brand'),d)||ov(d,r('.tools'))))o.push('dots overlap');
document.querySelectorAll('.btn,.tbtn').forEach(b=>{const q=b.getBoundingClientRect();if(q.width&&b.scrollWidth>b.clientWidth+1)o.push('cut:'+b.textContent);if(q.width&&(q.right>innerWidth+1))o.push('off:'+b.textContent)});
if(document.documentElement.scrollWidth>innerWidth+1)o.push('hscroll');return o}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for nm in vps:
      w,h,mob=VPS[nm]; ctx=await b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,is_mobile=mob,has_touch=mob); pg=await ctx.new_page(); errs=[]
      pg.on('pageerror',lambda e:errs.append(str(e)[:300])); pg.on('console',lambda m:m.type=='error' and errs.append(m.text[:200]))
      await pg.goto('file://'+D+f'/dist/gm2-concept-{key}.html'); await pg.wait_for_timeout(5500)
      res=await pg.evaluate(CHECK)
      slides=await pg.query_selector_all('.slide')
      for i,s in enumerate(slides):
        await s.scroll_into_view_if_needed(); await pg.wait_for_timeout(2600 if i==4 else 900)
        await s.screenshot(path=f'{OUT}/{key}-{nm}-s{i+1}.png')
      # studio actions
      await slides[2].scroll_into_view_if_needed()
      for a in ['buy','auction','power','restock']:
        await pg.evaluate(f"()=>__deck.A.{a}()"); await pg.wait_for_timeout(400)
      await pg.evaluate("()=>{__deck.board.onCity('hamburg')}"); await pg.wait_for_timeout(300); await slides[2].screenshot(path=f'{OUT}/{key}-{nm}-studio-card.png')
      await pg.evaluate("()=>document.querySelector('#bc .btn').click()"); await pg.wait_for_timeout(3500); await slides[2].screenshot(path=f'{OUT}/{key}-{nm}-studio-after.png')
      await pg.click('#mode'); await pg.wait_for_timeout(600); await slides[2].screenshot(path=f'{OUT}/{key}-{nm}-studio-light.png')
      print(nm,'errors',errs,'layout',res, 'money', await pg.evaluate("()=>__deck.board.money"))
      await ctx.close()
    await b.close()
asyncio.run(main())
