import asyncio
from playwright.async_api import async_playwright
MID=open('midgame.json').read()
CHK="""()=>{const t=document.getElementById('top');const els=[...t.querySelectorAll('#pl2rd b,#pl2rd small,.wallet,.undo,[data-act=menu],.iconbtn')].filter(e=>e.offsetParent);
 const bad=[];const R=els.map(e=>[e,e.getBoundingClientRect()]);
 for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const[a,ra]=R[i],[b,rb]=R[j];if(a.contains(b)||b.contains(a))continue;if(ra.left<rb.right-1&&rb.left<ra.right-1&&ra.top<rb.bottom-1&&rb.top<ra.bottom-1)bad.push((a.className||a.tagName)+' x '+(b.className||b.tagName))}
 const W=innerWidth;R.forEach(([e,r])=>{if(r.right>W+1||r.left<-1)bad.push('offscreen '+(e.className||e.tagName))});
 [...t.querySelectorAll('*')].forEach(e=>{if(e.offsetParent&&e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflow!=='visible'&&e.children.length===0&&(e.closest('.po.me')||e.textContent.trim().length<6||getComputedStyle(e).textOverflow!=='ellipsis'))bad.push('clip '+(e.className||e.tagName)+' '+e.textContent.slice(0,20))});
 t.querySelectorAll('.po,.pl2-ct,.pl2-rm,.wallet,.pl2-tabs span').forEach(bx=>{if(!bx.offsetParent)return;const br=bx.getBoundingClientRect();bx.querySelectorAll('*').forEach(c=>{if(!c.offsetParent)return;const cr=c.getBoundingClientRect();if(cr.width&&(cr.right>br.right+1||cr.left<br.left-1)&&getComputedStyle(bx).overflow==='visible')bad.push('spill '+(c.className||c.tagName)+' in '+bx.className);if(cr.width&&cr.right>br.right+1&&c.textContent.trim()&&getComputedStyle(c).textOverflow!=='ellipsis'&&c.children.length===0&&!c.closest('.po b'))bad.push('cut '+c.textContent.trim().slice(0,12)+' in '+bx.className)})});
 t.querySelectorAll('.pl2-ord .po').forEach(po=>{if(!po.offsetParent)return;const vis=[...po.querySelectorAll('b,em,.po-lg,i')].some(c=>{const r=c.getBoundingClientRect();return r.width>2&&getComputedStyle(c).display!=='none'&&getComputedStyle(c).visibility!=='hidden'});if(!vis)bad.push('empty chip')});
 if(document.documentElement.scrollWidth>W+1)bad.push('hscroll');return bad}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();allbad=0
    for w,h in [(667,375),(844,390),(932,430),(320,640),(360,780),(375,812),(390,844),(414,896),(430,932),(820,1180),(1024,1366),(1180,820),(1440,900)]:
     for lang in ['de','en']:
      ctx=await b.new_context(viewport={'width':w,'height':h},service_workers='block');pg=await ctx.new_page()
      await pg.goto('http://localhost:8778/index.html');await pg.wait_for_timeout(200)
      await pg.evaluate("([st,l])=>{localStorage.setItem(SAVE_KEY,st);localStorage.setItem('hochspannung-lang',l)}",[MID,lang])
      await pg.goto('http://localhost:8778/index.html');await pg.wait_for_timeout(700)
      await pg.evaluate("()=>{bootEnd(true);BOOT.zoom=false;S=JSON.parse(localStorage.getItem(SAVE_KEY));A.cont();UI.sheet=null;UI.intro=false;clearTimeout(timer);timer=null;window.schedule=()=>{};render()}");await pg.wait_for_timeout(300)
      for st in ['plain','undo','undo188','bid4','bid6']:
        await pg.evaluate("(s)=>{if(s!=='plain')UI.undo=[{}];if(s==='undo188')me().money=188;if(s.startsWith('bid')){const n=+s[3];while(S.players.length<n){const c=JSON.parse(JSON.stringify(S.players[1]));c.id=S.players.length;c.name=['Südnetz AG','Westfalen Volt','Nordlicht AG'][S.players.length-3];c.human=false;S.players.push(c);S.order.push(c.id);if(S.stats&&S.stats.pl)S.stats.pl.push(JSON.parse(JSON.stringify(S.stats.pl[1])))}S.n=S.players.length;S.phase='auction';S.gate=null;const ids=S.order.slice();S.auc={mode:'bid',plant:S.market[0],bid:99,high:ids[0],all:ids,bidders:[ids[0],H]};}try{render()}catch(e){try{pl2Top();fitChips()}catch(_){}}}",st);await pg.wait_for_timeout(150)
        bad=await pg.evaluate(CHK)
        if bad:allbad+=1;print(w,lang,st,bad[:4]);await pg.screenshot(path=f'hdr_bad_{w}_{lang}_{st}.png',clip={'x':0,'y':0,'width':w,'height':120})
      await ctx.close()
    print('fails',allbad);await b.close()
asyncio.run(main())
