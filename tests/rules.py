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
 const quiet=()=>{window.__fast=true;window.__strict=true;try{clearTimeout(timer)}catch(_){};window.schedule=()=>{}};
 bootEnd(true);quiet();
 // ---- unit: resource price arithmetic
 newGame('T',2,'normal',null,'de',{deck:'std'});quiet();
 for(const r of RES){if(!CAP[r])continue;const n=S.resMarket[r];let sum=0;for(let i=0;i<Math.min(3,n);i++)sum+=slotPrice(r,CAP[r]-n+i);
   ok('buyCost sums slot prices ('+r+')',buyCost(r,Math.min(3,n))===sum,buyCost(r,Math.min(3,n))+' vs '+sum)}
 ok('buyCost beyond stock is Infinity',buyCost('coal',S.resMarket.coal+1)===Infinity);
 // ---- unit: payout table monotone
 let mono=true;for(let i=1;i<=20;i++)if(PAY[i]<PAY[i-1])mono=false;ok('payout table rises with cities',mono);
 // ---- unit: auction
 {const p=P(S.auc.chooser);const m0=p.money,num=S.market[0];const b0=minBid(num)+2;doOpen(p.id,num,b0);
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
 // ---- Phase 1: state machine, turn order, input validation
 {newGame('T',3,'normal',null,'de',{deck:'std'});quiet();
  ok('new game starts in PHASE_2_SELECT_PLANT',S.fsm===ST.SELECT,S.fsm);
  const c=S.auc.chooser;ok('round 1: passing is refused',!canPass(c));
  let threw=false;try{doPass(c)}catch(e){threw=true}ok('round 1: doPass throws in strict mode',threw&&!P(c).done);
  const other=S.order.find(id=>id!==c),num=buyable()[0];
  ok('out-of-turn opening refused',!canOpen(other,num,minBid(num)));
  ok('opening below minimum refused',!canOpen(c,num,minBid(num)-1));
  ok('opening above cash refused',!canOpen(c,num,P(c).money+1));
  doOpen(c,num,minBid(num));ok('opening a bid → PHASE_2_BIDDING',S.fsm===ST.BID||S.fsm===ST.SELECT,S.fsm);
  if(S.fsm===ST.BID){const cur=S.auc.bidders[S.auc.turn];ok('raise must beat the bid',!canRaise(cur,S.auc.bid));ok('raise beyond cash refused',!canRaise(cur,P(cur).money+1));
    const nt=S.auc.bidders.find(x=>x!==cur);ok('out-of-turn raise refused',!canRaise(nt,S.auc.bid+1))}
  let st=0;while(S.fsm!==ST.BUY&&S.fsm!==ST.ANIM&&st++<200){const a=actor();if(!a)break;aiAct(a)}
  ok('after round-1 auction: order re-determined, PHASE_3 next',S.fsm===ST.BUY||S.fsm===ST.ANIM,S.fsm);
  const ord=S.players.map(p=>p.id).sort((a,b)=>cityCount(P(b))-cityCount(P(a))||Math.max(0,...P(b).plants)-Math.max(0,...P(a).plants));
  ok('round-1 order follows biggest plant',S.order.join()===ord.join(),S.order.join()+' vs '+ord.join());
  ok('PHASE_3 buys in reverse order',S.seq.join()===[...S.order].reverse().join(),S.seq.join());
  const buyer=S.seq[S.seqIdx],notBuyer=S.seq[1];ok('out-of-turn buying refused',!canBuy(notBuyer,{coal:0,oil:0,garbage:0,uranium:0}));
  ok('buying beyond storage refused',!canBuy(buyer,{coal:S.resMarket.coal,oil:0,garbage:0,uranium:0})||caps(P(buyer)).coal+caps(P(buyer)).hybrid>=S.resMarket.coal);
  ok('illegal transition throws in strict mode',(()=>{try{fsmGo(ST.OVER);return false}catch(e){return true}})());
  ok('old saves get a state',(()=>{const f=S.fsm;delete S.fsm;const d=fsmSync();S.fsm=f;return d===f})());
  /* gate: with a human player the game waits in ANIMATING and ignores everything except Continue */
  newGame('T',2,'normal',null,'de',{deck:'std'});const fw=window.__fast;window.__fast=false;window.schedule=()=>{};AUTO_NEXT=false;
  let g=0;while(S.fsm!==ST.ANIM&&g++<200){const a=actor();if(!a)break;aiAct(a)}
  ok('phase end waits in ANIMATING',S.fsm===ST.ANIM&&S.gate==='resources'&&actor()===null,S.fsm+' '+S.gate);
  ok('game input blocked while ANIMATING',!inputOK('buy')&&!inputOK('open'));
  UI.lastAct=null;ok('Continue accepted while ANIMATING',inputOK('gateGo'));gateGo();ok('Continue → PHASE_3_BUY_RESOURCES',S.fsm===ST.BUY,S.fsm);
  UI.lastAct=null;const t0=inputOK('skipbuy'),t1=inputOK('skipbuy');ok('double click on a move is ignored',t0&&!t1);
  window.__fast=fw;quiet()}
 // ---- Phase 4: edge cases
 {const toAuction=()=>{newGame('T',3,'normal',null,'de',{deck:'std'});quiet();S.players.forEach(p=>p.human=false);let g=0;while(!(S.round>=2&&S.fsm===ST.SELECT)&&g++<3000){if(S.gate){gateGo();continue}const a=actor();if(!a){if(S.phase==='bureau'){finishBureau();continue}break}aiAct(a)}};
  // Step 3 drawn during the auction
  toAuction();S.step=2;const tuck=S.deck.filter(x=>x!==STEP3).slice(-2);S.deck=[STEP3,...S.deck.filter(x=>x!==STEP3)];
  const c=S.auc.chooser,num=buyable()[0];P(c).money=999;doOpen(c,num,minBid(num));let g=0;while(S.fsm===ST.BID&&g++<50){const a=actor();aiAct(a)}
  ok('step 3 in auction: card waits at the end of the future market',S.step3Pending&&S.market.length===7&&!S.deck.includes(STEP3),S.step3Pending+' '+S.market.length);
  ok('step 3 in auction: tucked plants stay in the shuffled stack',tuck.every(x=>S.deck.includes(x)),tuck.join());
  g=0;while(S.phase==='auction'&&g++<400){if(S.gate)break;const a=actor();if(!a)break;aiAct(a)}
  ok('step 3 in auction: after the auction 6 plants, all buyable',S.step===3&&S.market.length===6&&buyN()===6,S.step+' '+S.market.length+' '+buyN());
  // Step 3 drawn in phase 4 (obsolescence replacement)
  toAuction();S.step=2;S.phase='build';S.fsm=ST.BUILD;S.deck=[STEP3,...S.deck.filter(x=>x!==STEP3)];const lo=S.market[0];S.players[1].cities=activeIds().slice(0,Math.floor(lo));
  removeLowCities();ok('step 3 in phase 4: market shrinks to 6',S.step===3&&S.market.length===6&&!S.market.includes(lo),S.step+' '+S.market.join(','));
  // Step 3 drawn in phase 5 (market update)
  toAuction();S.players[0].human=true;g=0;while(S.fsm!==ST.BUREAU&&g++<3000){if(S.gate){gateGo();continue}const a=actor();if(!a)break;aiAct(a)}
  if(S.fsm===ST.BUREAU){S.step=2;S.endTriggered=false;S.deck=[STEP3,...S.deck.filter(x=>x!==STEP3)];const hi=S.market[S.market.length-1];finishBureau();
    ok('step 3 in phase 5: market shrinks to 6',S.step===3&&S.market.length===6,S.step+' '+S.market.length);
    ok('step 3 in phase 5: tucked high plant goes back into the shuffled stack',S.deck.includes(hi)&&!S.deck.includes(STEP3),hi+' '+S.deck.join(','))}
  else ok('step 3 in phase 5: reached phase 5',false,S.fsm);
  // nobody buys: lowest plant leaves (also on maps without the discount rule)
  newGame('T',3,'normal',null,'bw',{deck:'std'});quiet();S.players.forEach(p=>p.human=false);g=0;while(!(S.round>=2&&S.fsm===ST.SELECT)&&g++<3000){if(S.gate){gateGo();continue}const a=actor();if(!a){if(S.phase==='bureau'){finishBureau();continue}break}aiAct(a)}
  {const m0=S.market.slice();g=0;while(S.fsm===ST.SELECT&&g++<20)doPass(S.auc.chooser);
   ok('nobody buys: lowest plant removed and replaced',!S.market.includes(m0[0])&&S.market.length===m0.length,m0.join(',')+' → '+S.market.join(','))}
  // empty stack in step 3: phase 5 still removes the lowest plant
  toAuction();S.players[0].human=true;g=0;while(S.fsm!==ST.BUREAU&&g++<3000){if(S.gate){gateGo();continue}const a=actor();if(!a)break;aiAct(a)}
  if(S.fsm!==ST.BUREAU)ok('empty stack test reached phase 5',false,S.fsm);else{S.step=3;S.endTriggered=false;S.deck=[];const n0=S.market.length,l0=S.market[0];let err='';try{finishBureau()}catch(e){err=e.message}
    ok('empty stack in step 3: no crash, lowest plant removed',!err&&S.market.length===n0-1&&!S.market.includes(l0),err||n0+'→'+S.market.length)}
  // game end straight after phase 4, no final income, tie-breakers
  toAuction();g=0;while(S.fsm!==ST.BUILD&&g++<3000){if(S.gate){gateGo();continue}const a=actor();if(!a)break;aiAct(a)}
  {const p1=S.players[1];p1.cities=activeIds().slice(0,END_AT);const money=S.players.map(p=>p.money);S.seqIdx=S.seq.length;endBuild();
   ok('end: game over right after phase 4',S.phase==='end'&&S.fsm===ST.OVER,S.phase+' '+S.fsm);
   ok('end: no income in the final round',S.players.every((p,i)=>p.money===money[i]),money+' vs '+S.players.map(p=>p.money));
   ok('end: winner has most powered cities',S.ranking.every((id,i,a)=>!i||P(a[i-1]).lastPowered>=P(id).lastPowered),S.ranking.map(id=>P(id).lastPowered).join())}
  {const sv=S.players.map(p=>({lp:p.lastPowered,m:p.money,c:p.cities}));const [a,b,c3]=S.players;a.lastPowered=b.lastPowered=c3.lastPowered=10;a.money=20;b.money=30;c3.money=30;a.cities=activeIds().slice(0,12);b.cities=activeIds().slice(0,11);c3.cities=activeIds().slice(0,13);
   {const rk=rankPlayers().filter(id=>[a.id,b.id,c3.id].includes(id));ok('tie-break: money, then built cities',rk.join()===[c3.id,b.id,a.id].join(),rk.join())}S.players.forEach((p,i)=>{p.lastPowered=sv[i].lp;p.money=sv[i].m;p.cities=sv[i].c})}
  ok('end city targets 3–6 players (+2p table)',[[2,21],[3,17],[4,17],[5,15],[6,14]].every(([n,e])=>RULES_N[n].end===e));
  // hybrids mix fuels; fuel can be moved between plants
  newGame('T',2,'normal',null,'de',{deck:'std'});quiet();{const p=S.players[0];p.plants=[5,26,32];p.pool={coal:1,oil:4,garbage:0,uranium:0};
   ok('hybrid runs on mixed coal and oil',!!powerOptions(p,[5]),JSON.stringify(p.pool));
   p.pool={coal:0,oil:3,garbage:0,uranium:0};p.alloc={5:[],26:[],32:['oil','oil','oil']};const o=allocPower(p,[26]);
   ok('fuel stored on another plant is moved over when needed',!!o&&o.powered>=0&&o.realloc&&o.realloc[26].filter(r=>r==='oil').length>=2,JSON.stringify(o&&o.realloc))}
 }
 // ---- full computer games with invariants
 const maps=['de','fr','it','na','bx','kr','ru','ind','jp','cn','au','uk'].filter(m=>MAPS[m]);const games=[];
 for(const mp of maps)for(const nAI of [2,4]){
  newGame('T',nAI,mp==='kr'||mp==='ru'?'expert':'hard',null,mp,{deck:'std'});quiet();S.players[0].human=false;S.players[0].ai='normal';
  let steps=0,bad='';const seen=new Set();
  try{
   while(S.phase!=='end'&&steps<20000){steps++;
    if(S.gate){gateGo();continue}
    const a=actor();if(!a){if(S.phase==='bureau'){finishBureau();continue}bad='no actor in '+S.phase;break}
    const f0=S.fsm;aiAct(a);
    if(S.fsm!==fsmDerive()){bad='state '+S.fsm+' but fields say '+fsmDerive()+' (after '+a.kind+' from '+f0+')';break}
    if((S.phase==='resources'||S.phase==='build')&&!S.gate&&S.seq.join()!==[...S.order].reverse().join()){bad='turn order not reversed in '+S.phase;break}
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
 // ---- AI levels are clearly different: expert should beat easy over many games
 {const wins={easy:0,normal:0,expert:0};for(let g=0;g<30;g++){newGame('T',2,'normal',null,['de','fr','it','na','bx','uk'][g%6],{deck:'std',styles:false});quiet();
   const lv=['easy','normal','expert'];const rot=g%3;S.players.forEach((p,i)=>{p.human=false;p.ai=lv[(i+rot)%3]});let st=0;
   while(S.phase!=='end'&&st++<20000){if(S.gate){gateGo();continue}const a=actor();if(!a){if(S.phase==='bureau'){finishBureau();continue}break}aiAct(a)}
   if(S.ranking)wins[P(S.ranking[0]).ai]++}
  ok('AI levels distinct: expert beats easy ('+JSON.stringify(wins)+')',wins.expert>wins.easy+2&&wins.expert>=wins.normal,JSON.stringify(wins))}
 // ---- AI explains its moves
 {newGame('T',2,'normal',null,'de',{deck:'std'});quiet();S.players[0].human=false;let st=0;while(S.round<3&&st++<5000){if(S.gate){gateGo();continue}const a=actor();if(!a){if(S.phase==='bureau'){finishBureau();continue}break}aiAct(a)}
  const w=(S.why||{})[2]||{};ok('AI records reasons for its moves',Object.keys(w).length>=2&&Object.values(w).every(x=>x.build&&x.buy),JSON.stringify(w).slice(0,200))}

 // ---- Campaign: star evaluation, unlock chain, logo rewards, season points
 {try{localStorage.removeItem('hochspannung-camp')}catch(_){}
  const mk=(o,pl)=>({rounds:o.rounds||14,players:[Object.assign({human:true,place:1,powered:15,cities:15,money:60,plants:[],auc:[]},pl||{}),{human:false,place:2,powered:12,cities:12,money:40,plants:[]}]});
  ok('campaign covers every map once',CAMP.length===Object.keys(MAPS).length&&new Set(CAMP.map(c=>c.map)).size===CAMP.length,CAMP.map(c=>c.map).join());
  ok('campaign gets harder',CAMP.slice(-3).every(c=>c.diff==='expert'&&c.n>=4)&&CAMP[0].diff!=='expert');
  ok('only first scenario open at start',campOpen(0)&&!campOpen(1));
  const c1=CAMP[0];ok('loss gives no win star',!campEval(mk({},{place:2}),c1)[0]);
  ok('win in 12 rounds with 15 powered = 3 stars',campEval(mk({rounds:12}),c1).every(Boolean));
  S.camp=CAMP[0].id;let r=campRecord(mk({rounds:16}));ok('win in 16 rounds = 2 stars',r.stars===2,JSON.stringify(r));
  ok('second scenario unlocked after a star',campOpen(1));
  r=campRecord(mk({rounds:16},{place:3}));ok('worse result keeps best stars',campStars()[CAMP[0].id]===2&&r.stars===0);
  const hk=localStorage.getItem(STATS_KEY);localStorage.setItem(STATS_KEY,'[]');localStorage.removeItem('hochspannung-camp');
  ok('10 logos, only 1 free at start',LOGO_KEYS.length===10&&LOGO_KEYS.filter(k=>!logoLocked(k)).length===1,[...logoUnlockedSet(true)].join());
  localStorage.setItem('hochspannung-camp',JSON.stringify({[CAMP[0].id]:3}));logoUnlockedSet(true);ok('3 stars unlock Aurora only',!logoLocked('star')&&logoLocked('wind')&&logoLocked('crown'));
  localStorage.setItem(STATS_KEY,JSON.stringify([Object.assign(mk({}),{diff:'expert'})]));logoUnlockedSet(true);ok('expert win unlocks Dawn and Atomic',!logoLocked('sun')&&!logoLocked('atom')&&logoLocked('leaf'));
  localStorage.setItem('hochspannung-camp',JSON.stringify(Object.fromEntries(CAMP.map(c=>[c.id,3]))));logoUnlockedSet(true);ok('all campaign stars unlock Crown',!logoLocked('crown'));
  if(hk!=null)localStorage.setItem(STATS_KEY,hk);else localStorage.removeItem(STATS_KEY);logoUnlockedSet(true);
  localStorage.removeItem('hochspannung-camp');delete S.camp;
  ok('season key is calendar month',seasonKey(new Date(2026,10,15))==='2026-11'&&seasonDaysLeft()>=1)}

 // ---- every campaign scenario starts and an AI-only game on it ends cleanly
 {const bad=[];for(const c of CAMP){try{newGame('T',c.n,c.diff,null,c.map,{deck:'std',styles:false});quiet();S.players.forEach(p=>p.human=false);let st=0;
   while(S.phase!=='end'&&st++<30000){if(S.gate){gateGo();continue}const a=actor();if(!a){if(S.phase==='bureau'){finishBureau();continue}break}aiAct(a)}
   if(S.phase!=='end')bad.push(c.map+':'+S.phase+S.round)}catch(e){bad.push(c.map+':'+String(e).slice(0,60))}}
  ok('all '+CAMP.length+' campaign maps play to the end',!bad.length,bad.join(' '))}
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
