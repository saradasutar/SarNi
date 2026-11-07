/**
 * SarNi Quick Entry PWA cache contract (synthetic, offline, no private data).
 * Exercises the real service worker with mock CacheStorage/network.
 * Does not call the real backend or store personal records.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';

const origin='https://saradasutar.github.io';
const scope=origin+'/SarNi/q/';
const events=new Map();
const stores=new Map();
const calls=[];
let offline=false;
const normalize=x=>new URL(typeof x==='string'?x:x.url,scope).href;
const caches={
  async open(name){
    if(!stores.has(name))stores.set(name,new Map());
    const entries=stores.get(name);
    return {
      async put(url,response){
        const key=normalize(url);
        assert.ok(!/[?&](?:k|key|pin|token)=/i.test(key),'never cache token-bearing URL');
        entries.set(key,response);
      },
      async match(url){return entries.get(normalize(url));}
    };
  },
  async keys(){return [...stores.keys()];},
  async delete(key){return stores.delete(key);}
};
async function fetchMock(request){
  const url=normalize(request);
  calls.push(url);
  if(offline)throw Error('Synthetic offline state');
  return {ok:true,type:'basic',url,tag:'network'};
}
const self={
  registration:{scope},
  location:{origin},
  addEventListener(type,handler){events.set(type,handler);},
  async skipWaiting(){},
  async clientsClaim(){},
  clients:{async claim(){}}
};
const src=readFileSync(new URL('../q/sw.js',import.meta.url),'utf8');
new Script(src,{filename:'q/sw.js'}).runInContext(createContext({
  self,caches,fetch:fetchMock,URL,Set,Promise,Response:{error:()=>({ok:false,tag:'error'})}
}));

async function dispatch(type,request){
  const handler=events.get(type);
  assert.ok(handler,'Missing '+type+' listener');
  let task;
  const event={request,waitUntil(p){task=p;},respondWith(p){task=p;}};
  handler(event);
  if(task===undefined)return {intercepted:false};
  return {intercepted:true,result:await task};
}
await dispatch('install');
const cacheNames=await caches.keys();
assert.deepEqual(cacheNames,['sarni-q-private-shell-v3']);
const cached=stores.get(cacheNames[0]);
assert.ok(cached.has(scope+'sarni9-batch10.css'),'CSS cached');
assert.ok(cached.has(scope+'sarni9-batch10.js'),'JS cached');
assert.ok(cached.has(scope+'index.html'),'public page shell cached');
assert.ok([...cached.keys()].every(url=>!new URL(url).search),'no query strings cached');

let before=calls.length;
const css=await dispatch('fetch',{method:'GET',url:scope+'sarni9-batch10.css',mode:'cors'});
assert.equal(css.intercepted,true);
assert.equal(css.result.tag,'network','public CSS was fetched into cache at install');
assert.equal(calls.length,before,'cached CSS avoids another network request');
const js=await dispatch('fetch',{method:'GET',url:scope+'sarni9-batch10.js',mode:'cors'});
assert.equal(js.intercepted,true);
assert.equal(calls.length,before,'cached JS avoids another network request');

const credentialed=await dispatch('fetch',{method:'POST',url:origin+'/macros/s/TEST/exec',mode:'cors'});
assert.equal(credentialed.intercepted,false,'do not intercept private POST');
const queryAsset=await dispatch('fetch',{method:'GET',url:scope+'sarni9-batch10.css?token=DO_NOT_CACHE',mode:'cors'});
assert.equal(queryAsset.intercepted,false,'do not intercept query-bearing assets');
const otherOrigin=await dispatch('fetch',{method:'GET',url:'https://script.google.com/macros/s/TEST/exec',mode:'cors'});
assert.equal(otherOrigin.intercepted,false,'never cache backend responses');

before=calls.length;
const config=await dispatch('fetch',{method:'GET',url:origin+'/SarNi/config.js',mode:'cors'});
assert.equal(config.intercepted,true);
assert.equal(calls.length,before+1,'config must check network first');

before=calls.length;
const privateNavigation=await dispatch('fetch',{method:'GET',url:scope+'?k=TEST_PRIVATE_TOKEN',mode:'navigate'});
assert.equal(privateNavigation.intercepted,true);
assert.equal(calls.length,before+1,'online private navigation uses network');
assert.ok([...cached.keys()].every(url=>!url.includes('TEST_PRIVATE_TOKEN')));

offline=true;
const fallback=await dispatch('fetch',{method:'GET',url:scope+'?k=TEST_PRIVATE_TOKEN',mode:'navigate'});
assert.equal(fallback.result.tag,'network','offline navigation returns generic cached shell');
assert.ok([...cached.keys()].every(url=>!url.includes('TEST_PRIVATE_TOKEN')));
console.log('PASS public CSS/JS PWA cache; config network-first; private URLs, backend and POST never cached.');
