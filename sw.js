/* SarNi root PWA shell. Cache only public static app shell; never cache API, guest-token URLs, or personal data. */
'use strict';
const CACHE='sarni-root-shell-v1';
const ROOT=new URL(self.registration.scope);
const SHELL=[new URL('./',ROOT).href,new URL('./index.html',ROOT).href,new URL('./manifest.webmanifest',ROOT).href,new URL('./sarni-life-icon.svg',ROOT).href,new URL('./icon-192.png',ROOT).href,new URL('./icon-512.png',ROOT).href];
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);for(const u of SHELL){try{const r=await fetch(u,{cache:'reload',credentials:'same-origin'});if(r.ok&&r.type==='basic')await c.put(u,r)}catch(_){}}await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('sarni-root-shell-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{const q=e.request,u=new URL(q.url);if(q.method!=='GET'||u.origin!==self.location.origin)return;if(q.mode==='navigate'&&u.pathname.startsWith(ROOT.pathname)){e.respondWith(fetch(q).catch(async()=>{const c=await caches.open(CACHE);return await c.match(new URL('./index.html',ROOT).href)||Response.error()}));return;}if(q.url.includes('/api')||/[?&#](k|token|key|pin)=/i.test(q.href))return;});
