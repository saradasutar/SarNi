/* SarNi Quick Entry app shell only. No personal data, API responses or private URLs are cached. */
'use strict';
const CACHE_NAME='sarni-q-private-shell-v1';
const SCOPE=new URL(self.registration.scope);
const SHELL=new URL('./index.html',SCOPE).href;
const STATIC=[SHELL,new URL('./manifest.webmanifest',SCOPE).href,new URL('../config.js',SCOPE).href,new URL('../sarni-life-icon.svg',SCOPE).href,new URL('../quick-expense-192.png',SCOPE).href,new URL('../quick-expense-512.png',SCOPE).href];
const PATHS=new Set(STATIC.map(u=>new URL(u).pathname));
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  for(const url of STATIC){
   try{const r=await fetch(url,{cache:'reload',credentials:'same-origin'});if(r.ok&&r.type==='basic')await cache.put(url,r);}catch(_){}
  }
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(x=>x.startsWith('sarni-q-private-shell-')&&x!==CACHE_NAME).map(x=>caches.delete(x)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 const isShell=(url.pathname===SCOPE.pathname||url.pathname===new URL(SHELL).pathname);
 // Never use incoming navigation URL as a cache key: it may contain ?k=private-token.
 if(request.mode==='navigate'&&isShell){
  event.respondWith(fetch(request).catch(async()=>{
   const cache=await caches.open(CACHE_NAME);
   const cached=await cache.match(SHELL);
   return cached||Response.error();
  }));
  return;
 }
 // Exact allowlist, no query strings: no API calls, auth, photos, or arbitrary pages.
 if(!PATHS.has(url.pathname)||url.search)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(url.pathname);
  if(cached)return cached;
  return fetch(request);
 })());
});
