/* SarNi Health Bridge v1.
 * Non-persistent, same-origin summary exchange between open SarNi and Quick Entry tabs.
 * Never transmits link tokens, PINs, record IDs, amounts, URLs, names, or error text.
 * No fetch, storage, write or retry calls. Opening Health initiates the request.
 */
(function(){
 'use strict';
 if(window.SarNiHealthBridge)return;
 const channelName='sarni-health-summary-v1';
 const roles=new Set(['main','quick']);
 const frontends=new Set(['ready','unknown']);
 const backends=new Set(['checked','reported','unavailable','unknown']);
 const modules=new Set(['present','needs-check','unknown']);
 const syncs=new Set(['some-verified','unverified']);
 const clip=(value,allowed,fallback)=>allowed.has(value)?value:fallback;
 const tag=Math.random().toString(36).slice(2)+Date.now().toString(36);
 function create(role,onReport){
  if(!roles.has(role)||typeof onReport!=='function'||typeof BroadcastChannel==='undefined')return null;
  let channel,latest=null;
  try{channel=new BroadcastChannel(channelName);}catch(_){return null;}
  const toReport=value=>({
   frontend:clip(value?.frontend,frontends,'unknown'),
   backend:clip(value?.backend,backends,'unknown'),
   modules:clip(value?.modules,modules,'unknown'),
   sync:clip(value?.sync,syncs,'unverified')
  });
  const post=(type,report)=>{try{channel.postMessage({type,source:role,sender:tag,at:Date.now(),report});}catch(_){}};
  channel.onmessage=event=>{
   const value=event.data;
   if(!value||value.sender===tag||!roles.has(value.source)||value.source===role)return;
   if(value.type==='request'){if(latest)post('report',latest);return;}
   if(value.type!=='report'||typeof value.report!=='object')return;
   if(!Number.isFinite(value.at)||Math.abs(Date.now()-value.at)>120000)return;
   onReport({source:value.source,at:value.at,report:toReport(value.report)});
  };
  return {
   publish(report){latest=toReport(report);post('report',latest);},
   request(){post('request',null);},
   close(){channel.close();}
  };
 }
 window.SarNiHealthBridge=Object.freeze({create});
})();
