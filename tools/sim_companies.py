"""Founders balance check: 4 AI players on Germany, every 4-way matchup rotated through all seats.
Usage: python3 tools/sim_companies.py <reps> [build dir]   (reps=20 → 1200 games; fair share is 25 %)"""
import sys,asyncio,os,json
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));sys.path.insert(0,R+'/tests');os.chdir(R+'/tests')
import srvthread
from playwright.async_api import async_playwright
srvthread.start(os.path.abspath(sys.argv[2]) if len(sys.argv)>2 else R,int(os.environ.get('PORT','8790')))
REPS=int(sys.argv[1]) if len(sys.argv)>1 else 2
JS="""async(reps)=>{const quiet=()=>{window.__fast=true;try{clearTimeout(timer)}catch(_){};window.schedule=()=>{}};bootEnd(true);quiet();
 const CO=['eco','coal','atom','oil','grid','waste'],combos=[];for(let a=0;a<6;a++)for(let b=a+1;b<6;b++)for(let c=b+1;c<6;c++)for(let d=c+1;d<6;d++)combos.push([CO[a],CO[b],CO[c],CO[d]]);
 const W={},G={},seatW=[0,0,0,0],rounds=[],bad=[];CO.forEach(c=>{W[c]=0;G[c]=0});
 for(let rep=0;rep<reps;rep++)for(const cb of combos)for(let rot=0;rot<4;rot++){try{
   newGame('T',3,'normal',null,'de',{deck:'std',styles:false});quiet();S.players.forEach(p=>p.human=false);
   const m={};S.players.forEach((p,i)=>m[p.id]={co:cb[(i+rot)%4],mo:'kon'});const mon=S.players.map(p=>p.money);matAssign(m);S.players.forEach((p,i)=>p.money=mon[i]);S.matReveal=0;
   let st=0;while(S.phase!=='end'&&st++<30000){if(S.gate){gateGo();continue}S.players.forEach(q=>{const mm=S.mat[q.id];while(matPending(q))matUpgrade(q,aiUpPick(mm.mo,mm.up))});const a=actor();if(!a){if(S.phase==='bureau'){finishBureau();continue}break}aiAct(a)}
   if(S.phase!=='end'){bad.push(cb.join()+':'+S.phase);continue}
   const win=rankPlayers()[0],seat=S.players.findIndex(p=>p.id===win);seatW[seat]++;W[S.mat[win].co]++;S.players.forEach(p=>G[S.mat[p.id].co]++);rounds.push(S.round)
 }catch(e){bad.push(String(e).slice(0,80))}}
 return {W,G,seatW,n:rounds.length,avgR:rounds.reduce((a,b)=>a+b,0)/Math.max(1,rounds.length),bad:bad.slice(0,5),nbad:bad.length}}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page()
    await pg.goto('http://localhost:'+os.environ.get('PORT','8790')+'/index.html');await pg.wait_for_timeout(800)
    r=await pg.evaluate(JS,REPS);print(json.dumps(r))
asyncio.run(main())
