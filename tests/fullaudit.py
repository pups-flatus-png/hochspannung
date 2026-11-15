import os
BASE=os.environ.get('GM_BASE','http://localhost:8778')
import asyncio,json,collections
from playwright.async_api import async_playwright
MID=open('midgame.json').read()
CHK="""(tag)=>{const bad=[];const W=innerWidth;
 const roots=[...document.querySelectorAll('#panel,#actbar,.actbar,#top,#sheet:not([hidden])')];
 const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'};
 for(const root of roots)for(const e of root.querySelectorAll('*')){if(!vis(e))continue;const cs=getComputedStyle(e);
   if(e.children.length===0&&e.textContent.trim()&&e.scrollWidth>e.clientWidth+1&&cs.overflow!=='visible'&&cs.textOverflow!=='ellipsis')bad.push('clip:'+e.textContent.trim().slice(0,24));
   const r=e.getBoundingClientRect();if(r.right>W+1&&cs.position!=='fixed')bad.push('offR:'+(e.className&&e.className.baseVal===undefined?e.className:e.tagName)+':'+e.textContent.trim().slice(0,16));
   if(e.matches('button,.btn')&&e.children.length===0&&e.textContent.trim()){const rg=document.createRange();rg.selectNodeContents(e);const tops=new Set([...rg.getClientRects()].map(q=>Math.round(q.top)));if(tops.size>=3)bad.push('btn3lines:'+e.textContent.trim().slice(0,24))}
 }
 if(document.documentElement.scrollWidth>W+1)bad.push('hscroll');
 return [...new Set(bad)].slice(0,12)}"""
STATES=[('auction',"()=>{render()}"),
 ('bid',"()=>{const ids=S.order.slice();S.auc={mode:'bid',plant:S.market[0],bid:S.market[0]+3,high:ids[0],all:ids,bidders:ids.slice()};S.phase='auction';try{render()}catch(e){}}"),
 ('bidMine',"()=>{const ids=S.order.slice();const o=ids.filter(i=>i!==H)[0];S.auc={mode:'bid',chooser:o,plant:S.market[0],bid:S.market[0]+9,high:o,all:ids,bidders:[o,H],turn:1};S.phase='auction';me().money=180;UI.bidKey='';try{render()}catch(e){}}"),
 ('resources',"()=>{S.auc=null;startResources();S.seqIdx=Math.max(0,S.seq.indexOf(H));UI.sheet=null;UI.mkClosedR=S.round;render();suggestCart();render()}"),
 ('build',"()=>{startBuild();S.seqIdx=Math.max(0,S.seq.indexOf(H));render()}"),
 ('bureau',"()=>{startBureau();render()}"),
 ('gateRound',"()=>{S.gate='round';render()}"),
 ('gateAuc',"()=>{S.gate='resources';render()}"),
 ('gateRes',"()=>{S.gate='build';render()}"),
 ('markets',"()=>{S.gate=null;UI.sheet='markets';render()}"),
 ('menu',"()=>{UI.sheet='menu';render()}"),
 ('stats',"()=>{UI.sheet=null;render();A.stats&&A.stats();renderStats&&renderStats()}"),
]
VPS=[(320,640),(375,667),(390,844),(430,932),(667,375),(844,390),(932,430),(820,1180),(1180,820),(1440,900)]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();res=collections.defaultdict(list)
    for w,h in VPS:
     for lang in ['de','en']:
      ctx=await b.new_context(viewport={'width':w,'height':h},service_workers='block');pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:120]))
      await pg.goto(BASE+'/index.html');await pg.wait_for_timeout(150)
      await pg.evaluate("([st,l])=>{localStorage.setItem(SAVE_KEY,st);localStorage.setItem('hochspannung-lang',l)}",[MID,lang])
      await pg.goto(BASE+'/index.html');await pg.wait_for_timeout(600)
      await pg.evaluate("()=>{bootEnd(true);BOOT.zoom=false;S=JSON.parse(localStorage.getItem(SAVE_KEY));A.cont();UI.sheet=null;UI.intro=false;clearTimeout(timer);timer=null;window.schedule=()=>{};render()}")
      for nm,js in STATES:
        try:
          await pg.evaluate(js);await pg.wait_for_timeout(120)
          bad=await pg.evaluate(CHK,nm)
        except Exception as e:bad=['ERR '+str(e)[:80]]
        if bad:res[(nm,tuple(bad))].append(f'{w}x{h}{lang}')
      if errs:print('pageerrors',w,h,lang,errs[:2])
      await ctx.close()
    for (nm,bad),where in sorted(res.items()):print(nm,list(bad),'@',' '.join(where[:8]),('+%d'%(len(where)-8) if len(where)>8 else ''))
    await b.close()
asyncio.run(main())
