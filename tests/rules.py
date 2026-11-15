"""Grid Master rule tests – run inside the real game page (Playwright).
Usage: GM_BASE=http://localhost:8778 python3 rules.py
Exit code 0 = all passed."""
import asyncio,json,sys
from playwright.async_api import async_playwright
import os
URL=os.environ.get('GM_BASE','http://localhost:8778')+'/index.html'
JS=r"""
async()=>{
 const R=[];const ok=(name,cond,info)=>R.push({name,ok:!!cond,info:cond?'':String(info||'')});
 const quiet=()=>{window.__fast=true;try{clearTimeout(timer)}catch(_){};window.schedule=()=>{}};
 bootEnd(true);quiet();
 // ---- unit: resource price arithmetic
 newGame('T',2,'normal',null,'de',{deck:'std'});quiet();
 for(const r of RES){if(!CAP[r])continue;const n=S.resMarket[r];let sum=0;for(let i=0;i<Math.min(3,n);i++)sum+=slotPrice(r,CAP[r]-n+i);
   ok('buyCost sums slot prices ('+r+')',buyCost(r,Math.min(3,n))===sum,buyCost(r,Math.min(3,n))+' vs '+sum)}
 ok('buyCost beyond stock is Infinity',buyCost('coal',S.resMarket.coal+1)===Infinity);
 // ---- unit: payout table monotone
 let mono=true;for(let i=1;i<=20;i++)if(PAY[i]<PAY[i-1])mono=false;ok('payout table rises with cities',mono);
 // ---- unit: auction
 {const p=S.players[1];const m0=p.money,num=S.market[0];S.phase='auction';const b0=minBid(num)+2;doOpen(p.id,num,b0);
  while(S.auc&&S.auc.mode==='bid'&&S.auc.bidders.length>1){const cur=S.auc.bidders[S.auc.turn];if(cur===p.id)bidRaise(p.id,S.auc.bid+1);else bidDrop(cur)}
  ok('auction winner owns the plant',p.plants.includes(num),JSON.stringify(p.plants));
  ok('auction winner pays the bid',p.money===m0-S.auc.bid||p.money===m0-b0,m0+'→'+p.money);
  ok('plant market keeps its size',S.market.length===8||S.step===3,S.market.length);
  ok('current market sorted',S.market.every((x,i,a)=>!i||a[i-1]<=x),S.market.join(','))}
 // ---- unit: build cost = slot + connection
 {newGame('T',2,'normal',null,'de',{deck:'std'});quiet();const p=S.players[0];p.money=200;const o1=buildOptions(p)[0];const m0=p.money;doBuild(p.id,o1.city);
  ok('first city costs only the slot',m0-p.money===o1.slot&&o1.conn===0,(m0-p.money)+' slot '+o1.slot);
  const o2=buildOptions(p)[0];const m1=p.money;doBuild(p.id,o2.city);ok('second city costs slot + connection',m1-p.money===o2.slot+o2.conn&&o2.conn>0,o2.slot+'+'+o2.conn);
  ok('cannot build the same city twice',!buildOptions(p).some(x=>x.city===o1.city))}
 // ---- full computer games with invariants
 const maps=['de','fr','it','na','bx','kr','ru','ind','jp','cn','au','uk'].filter(m=>MAPS[m]);const games=[];
 for(const mp of maps)for(const nAI of [2,4]){
  newGame('T',nAI,mp==='kr'||mp==='ru'?'expert':'hard',null,mp,{deck:'std'});quiet();S.players[0].human=false;S.players[0].ai='normal';
  let steps=0,bad='';const seen=new Set();
  try{
   while(S.phase!=='end'&&steps<20000){steps++;
    if(S.gate){gateGo();continue}
    const a=actor();if(!a){if(S.phase==='bureau'){finishBureau();continue}bad='no actor in '+S.phase;break}
    aiAct(a);
    for(const p of S.players){if(p.money<0){bad=p.name+' money '+p.money;break}if(new Set(p.cities).size!==p.cities.length){bad='duplicate city '+p.name;break}
      if(RES.some(r=>p.pool[r]<0)){bad='negative pool';break}}
    for(const c in S.owners)if((S.owners[c]||[]).length>3){bad='city over 3 owners '+c}
    if(RES.some(r=>S.resMarket[r]<0||S.resMarket[r]>CAP[r])){bad='market out of range'}
    if(bad)break;
   }
  }catch(e){bad='exception '+e.message+' @'+S.phase+' r'+S.round}
  games.push({mp,n:nAI+1,rounds:S.round,end:S.phase==='end',steps,bad,win:S.ranking?P(S.ranking[0]).lastPowered:null});
  ok('full game '+mp+' '+(nAI+1)+'p ends cleanly',S.phase==='end'&&!bad,bad||('stuck r'+S.round+' '+S.phase));
  ok('game '+mp+' '+(nAI+1)+'p sensible length',S.round>=5&&S.round<=25,S.round);
 }
 return {R,games};
}
"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto(URL);await pg.wait_for_timeout(800)
    out=await pg.evaluate(JS)
    fails=[r for r in out['R'] if not r['ok']]
    for r in out['R']:print(('PASS ' if r['ok'] else 'FAIL ')+r['name']+(' – '+r['info'] if r['info'] else ''))
    for g in out['games']:print('  game',json.dumps(g))
    if errs:print('PAGE ERRORS',errs[:3])
    print(f"\n{len(out['R'])-len(fails)}/{len(out['R'])} passed");await b.close()
    sys.exit(1 if fails or errs else 0)
asyncio.run(main())
