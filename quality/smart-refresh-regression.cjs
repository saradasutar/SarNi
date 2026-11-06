/* SarNi 9 Smart Refresh behavioral regression.
 * Run: node quality/smart-refresh-regression.cjs
 * Uses only in-memory fake backend responses; never touches a live endpoint.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../q/index.html'),'utf8');
const begin=source.indexOf('/* SarNi 9 Smart Refresh:');
const end=source.indexOf('/* SarNi 9: central read-only refresh dispatcher.',begin);
assert(begin>=0&&end>begin,'Smart Refresh module markers must exist');
const code=source.slice(begin,end);
let clock=10000,requests=0,hold=null,holdOnce=false,uncertainWrite=false;
const transport=(action,payload)=>{
 requests++;
 if(action==='qeSubmit'&&uncertainWrite)return Promise.reject(new Error('simulated timeout'));
 if(action==='qeRecent'&&payload.offset===99&&!holdOnce){
  holdOnce=true;return new Promise(resolve=>{hold=resolve});
 }
 return Promise.resolve({serial:requests,action});
};
const context={qeApiTransport:transport,Date:{now:()=>clock},Map,Set,JSON,Promise,console};
vm.runInNewContext(code+';globalThis.testApi=api;globalThis.testInvalidate=qeInvalidateReadSnapshots;',context);
(async()=>{
 const api=context.testApi, invalidate=context.testInvalidate;
 const a=await api('qeRecent',{kind:'expense',offset:0});
 const same=await api('qeRecent',{kind:'expense',offset:0});
 assert.equal(a.serial,same.serial,'Identical immediate reads should reuse response');
 clock+=2501;
 const expired=await api('qeRecent',{kind:'expense',offset:0});
 assert.notEqual(expired.serial,a.serial,'Expired read must fetch again');
 uncertainWrite=true;
 await assert.rejects(api('qeSubmit',{entryId:'SIMULATED'}),/simulated timeout/);
 const afterTimeout=await api('qeRecent',{kind:'expense',offset:0});
 assert.notEqual(afterTimeout.serial,expired.serial,'Uncertain write must invalidate cached reads');
 const older=api('qeRecent',{kind:'office',offset:99});
 await Promise.resolve();
 invalidate();
 hold({serial:'old',action:'qeRecent'});
 await older;
 const afterOld=await api('qeRecent',{kind:'office',offset:99});
 assert.notEqual(afterOld.serial,'old','Old pending response must not be cached after invalidation');
 const beforeConfirmed=await api('qeRecent',{kind:'investment',offset:0});
 uncertainWrite=false;
 await api('qpinManage',{operation:'edit',id:'SIMULATED'});
 const afterConfirmed=await api('qeRecent',{kind:'investment',offset:0});
 assert.notEqual(beforeConfirmed.serial,afterConfirmed.serial,'Confirmed edit must invalidate cached reads');
 console.log('PASS Smart Refresh: reuse, TTL, timed-out write, stale pending and confirmed edit');
})().catch(error=>{console.error(error);process.exitCode=1;});
