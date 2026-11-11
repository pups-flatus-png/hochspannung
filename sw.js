const CACHE='hochspannung-v107';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
function fromNet(req){return fetch(req,{cache:'no-cache'}).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'index.html':req,copy))}return res})}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  if(req.mode==='navigate'){
    e.respondWith(new Promise(resolve=>{
      let done=false;const fallback=()=>caches.match('index.html').then(r=>{if(!done){done=true;resolve(r||fetch(req))}});
      const t=setTimeout(fallback,3000);
      fromNet(req).then(r=>{clearTimeout(t);if(!done){done=true;resolve(r)}}).catch(()=>{clearTimeout(t);fallback()});
    }));return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r||fromNet(req)).catch(()=>caches.match('index.html')));
});
