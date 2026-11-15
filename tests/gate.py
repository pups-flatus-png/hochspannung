import os
BASE=os.environ.get('GM_BASE','http://localhost:8778')
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for nm,vp in [('p',{'width':390,'height':844}),('m',{'width':1440,'height':900})]:
      ctx=await b.new_context(viewport=vp,service_workers='block',device_scale_factor=1);pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
      await pg.goto(BASE+'/index.html');await pg.wait_for_timeout(300);await pg.evaluate("()=>{localStorage.setItem('hochspannung-lang','en');localStorage.setItem('hochspannung-speed','fast')}")
      await pg.goto(BASE+'/index.html');await pg.wait_for_timeout(900)
      await pg.evaluate("()=>{bootEnd(true);BOOT.zoom=false;newGame('Du',2,'expert',null,'de',{phaseOut:true,deck:'std',styles:true,promos:[],discount:'rech'});UI.intro=false;document.getElementById('intro')?.remove();start.hidden=true;$('#app').hidden=false;render();schedule()}")
      gates=[];shot=0
      for i in range(400):
        await pg.wait_for_timeout(120)
        st=await pg.evaluate("""()=>{if(S.ranking)return['END'];if(S.gate){return['G',S.gate,S.round]}
          const a=actor();if(!a){if(S.phase==='bureau'){applyPower(me(),bestPower(me()));finishBureau();render();schedule()}return['-',S.phase]}if(!P(a.pid).human)return['ai',S.phase];
          // human acts automatically
          const ph=S.phase;if(S.phase==='bureau'){applyPower(me(),bestPower(me()));finishBureau()}else aiAct(a);render();schedule();return['h',ph]}""")
        if st[0]=='G':
          gates.append(st[1]+str(st[2]))
          if shot<2 and st[1] in('build','round'):await pg.wait_for_timeout(300);await pg.screenshot(path=f'gate_{nm}_{shot}.png');shot+=1
          await pg.evaluate("()=>A.gateGo()");await pg.evaluate("()=>{render();schedule()}")
        if st[0]=='END' or len(gates)>=9:break
      print(nm,gates,errs);await ctx.close()
    await b.close()
asyncio.run(main())
