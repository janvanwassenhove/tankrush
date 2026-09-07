const CACHE='tankrush-v13';
const ASSETS=['./src/i18n.js?v=13','./previews/amazon.webp','./previews/asia.webp','./previews/malawi.webp','./previews/reef.webp','./previews/jelly.webp','./previews/outback.webp','./previews/sonora.webp','./previews/madagascar.webp','./previews/costarica.webp','./previews/caledonia.webp','./','./index.html','./style.css?v=13','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./src/main.js?v=13','./src/input.js?v=13','./src/simulation.js?v=13','./src/scene.js?v=13','./src/models.js?v=13','./src/assets.js?v=13','./vendor/three/three.module.js','./vendor/three/three.core.js','./vendor/three/addons/loaders/GLTFLoader.js','./vendor/three/addons/utils/BufferGeometryUtils.js','./models/submarine.glb','./models/buggy.glb','./models/guppy.glb','./models/piranha.glb','./models/spider.glb','./models/snake.glb','./models/monitor.glb','./models/chameleon.glb','./src/habitats.js?v=13','./src/decor.js?v=13','./src/creatures.js?v=13','./models/tetra.glb','./models/discus.glb','./models/rasbora.glb','./models/gourami.glb','./models/cichlid.glb','./models/clownfish.glb','./models/tang.glb','./models/shrimp.glb','./models/jellyfish.glb','./models/bearded.glb','./models/skink.glb','./models/gecko.glb','./models/crested.glb','./models/frog.glb','./models/scorpion.glb'];
// Install only the menu shell. Race modules and images are cached when used.
const CORE=ASSETS.filter(p=>!p.includes('/models/')&&!p.includes('/vendor/')&&!p.includes('/previews/')&&!/scene|decor|creatures|assets|models/.test(p));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
async function network(request,cache){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{const res=await fetch(request,{signal:controller.signal});
  const html=(res.headers.get('content-type')||'').includes('text/html');
  if(res.ok&&!res.redirected&&(!html||request.mode==='navigate')){
   if(!html||(await res.clone().text()).includes('id="preview-status"'))await cache.put(request,res.clone());
  }
  return res;
 }finally{clearTimeout(timer);}
}
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(event.request);
  if(event.request.mode==='navigate'){
   try{return await network(event.request,cache);}catch{return cached||await cache.match('./index.html')||Response.error();}
  }
  return cached||network(event.request,cache);
 })());
});
