import base64,glob,os,re,sys
import pathlib
HERE=pathlib.Path(__file__).resolve().parent
REPO=HERE.parent
OUT=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else REPO
OUT.mkdir(parents=True,exist_ok=True)
SP=str(HERE)
src=open(str(REPO/'src'/'hochspannung.html')).read()
# drop Google Fonts links
src=re.sub(r'<link rel="preconnect"[^>]*>\n?','',src)
src=re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>\n?','',src)
title=re.search(r'<title>.*?</title>\n?',src).group(0); src=src.replace(title,'',1)
ff=''
for fam,pkg,ws in [('Saira Condensed','saira-condensed',[500,600,700]),('Barlow','barlow',[400,500,600,700]),('Orbitron','orbitron',[800]),('IBM Plex Mono','ibm-plex-mono',[500,600])]:
    for w in ws:
        f=glob.glob(str(REPO/'gm2-src'/'fonts')+f'/{pkg}-latin-{w}-normal.woff2')[0]
        ff+=f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{base64.b64encode(open(f,'rb').read()).decode()}) format('woff2')}}\n"
base_css="html{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}\nimg{max-width:100%}\n"
def page(extra_head='',extra_body=''):
    return f'''<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#0b1014">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Hochspannung">
{title.strip()}
{extra_head}<style>
{ff}{base_css}</style>
</head>
<body>
{src}
{extra_body}</body>
</html>
'''
icon_uri='data:image/png;base64,'+base64.b64encode(open(str(REPO/'icon-180.png'),'rb').read()).decode()
open(str(OUT)+'/index.html','w').write(page('<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" href="icon-192.png">\n<link rel="apple-touch-icon" href="icon-180.png">\n',
 "<script>if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});</script>\n"))
open(str(OUT)+'/manifest.webmanifest','w').write('''{
  "name": "Hochspannung",
  "short_name": "Hochspannung",
  "description": "Netzausbau-Strategiespiel gegen KI-Gegner",
  "lang": "de",
  "start_url": "./",
  "scope": "./",
  "display": "fullscreen",
  "orientation": "any",
  "background_color": "#0b1014",
  "theme_color": "#0b1014",
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ]
}
''')
open(str(OUT)+'/sw.js','w').write('''const CACHE='hochspannung-v232';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
function fromNet(req){return fetch(req,{cache:'no-cache'}).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'index.html':req,copy))}return res})}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;if(new URL(req.url).pathname.indexOf('/gm2/')>=0)return;
  if(req.mode==='navigate'){
    e.respondWith(new Promise(resolve=>{
      let done=false;const fallback=()=>caches.match('index.html').then(r=>{if(!done){done=true;resolve(r||fetch(req))}});
      const t=setTimeout(fallback,3000);
      fromNet(req).then(r=>{clearTimeout(t);if(!done){done=true;resolve(r)}}).catch(()=>{clearTimeout(t);fallback()});
    }));return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r||fromNet(req)).catch(()=>caches.match('index.html')));
});
''')

print('built')
