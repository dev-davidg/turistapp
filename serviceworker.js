const STATIC_CACHE='hikesk-static-v2';
const API_CACHE='hikesk-api-v1';
const ASSETS=['./','./index.html','./events.html','./event.html','./challenge.html','./profile.html','./login.html','./script.js','./manifest.json','./icons/icon-96.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>!([STATIC_CACHE,API_CACHE].includes(k))).map(k=>caches.delete(k))))) });
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.pathname.startsWith('/data/')){
    e.respondWith((async()=>{
      const cache=await caches.open(API_CACHE);
      const cached=await cache.match(e.request);
      const network=fetch(e.request).then(res=>{cache.put(e.request,res.clone());return res;}).catch(()=>null);
      return cached||network||Response.error();
    })());
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});