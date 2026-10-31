/* Standalone SarNi Quick Expense service worker. Never cache API requests or private expense data. */
const VERSION='sarni-qe-shell-20261030-v3';
const SHELL=['./quick-expense.html','./quick-expense.js?v=20261030-20101','./quick-expense-install.js?v=20261029-pwa1','./sarni-quick-link-extra.js?v=20101','./quick-expense.webmanifest','./quick-expense-192.png','./quick-expense-512.png','./config.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sarni-qe-shell-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 const allowed=['quick-expense.html','quick-expense.js','quick-expense-install.js','sarni-quick-link-extra.js','quick-expense.webmanifest','quick-expense-192.png','quick-expense-512.png','config.js'];
 if(!allowed.some(x=>url.pathname.endsWith('/'+x)))return;
 event.respondWith(fetch(req).then(resp=>{if(resp.ok){const cloned=resp.clone();caches.open(VERSION).then(cache=>cache.put(req,cloned)).catch(()=>{});}return resp;}).catch(async()=>{const exact=await caches.match(req);if(exact)return exact;if(url.pathname.endsWith('/quick-expense.html')){const shell=await caches.match('./quick-expense.html');if(shell)return shell;}return Response.error();}));
});
