/* SarNi Health History v1: status codes and timestamps only.
 * Session-scoped; no URLs, personal entries, PINs, credentials, names or raw errors.
 * No network access and no cross-tab sharing. */
(function(){
 'use strict';
 if(window.SarNiHealthHistory)return;
 const statuses=new Set(['ready','attention','unavailable','unverified']);
 const kinds=new Set(['frontend','backend','modules','sync','network','errors']);
 const MAX=12, AGE=24*60*60*1000, PREFIX='sarni-health-history-v1:';
 const descriptions={
  frontend:'Frontend',backend:'Backend',modules:'Modules',
  sync:'Synchronization',network:'Browser network',errors:'Local error indicator'
 };
 const guidance={
  ready:'Status reported as ready. This alone does not prove transactions were delivered.',
  attention:'Review the panel and retry a read-only check if needed.',
  unavailable:'Check connectivity and the configured backend. Avoid repeating an uncertain save.',
  unverified:'Use destination verification; source status is not proof of delivery.'
 };
 function create(scope){
  if(scope!=='main'&&scope!=='quick')return null;
  const key=PREFIX+scope;
  const valid=x=>!!x&&kinds.has(x.kind)&&statuses.has(x.status)&&Number.isSafeInteger(x.at)&&x.at<=Date.now()+60000&&Date.now()-x.at<AGE;
  function read(){
   try{
    const parsed=JSON.parse(sessionStorage.getItem(key)||'[]');
    return Array.isArray(parsed)?parsed.filter(valid).slice(-MAX):[];
   }catch(_){return [];}
  }
  function store(items){try{sessionStorage.setItem(key,JSON.stringify(items));}catch(_){}}
  function add(kind,status){
   if(!kinds.has(kind)||!statuses.has(status))return false;
   const items=read();
   // Avoid filling history with repeated identical status checks within one minute.
   const last=items[0];
   if(last&&last.kind===kind&&last.status===status&&Date.now()-last.at<60000)return false;
   items.unshift({kind,status,at:Date.now()});store(items.slice(0,MAX));return true;
  }
  function clear(){try{sessionStorage.removeItem(key);}catch(_){}}
  function render(host){
   if(!host)return;
   host.replaceChildren();
   const items=read();
   if(!items.length){const p=document.createElement('p');p.textContent='No status history recorded in this browser tab.';host.append(p);return;}
   const list=document.createElement('ol');list.className='sarni-health-history-list';
   for(const item of items){
    const row=document.createElement('li');
    const when=document.createElement('time');when.dateTime=new Date(item.at).toISOString();when.textContent=new Date(item.at).toLocaleString();
    const label=document.createElement('strong');label.textContent=descriptions[item.kind];
    const status=document.createElement('span');status.textContent=item.status;status.className='status-'+item.status;
    row.append(when,label,status);list.append(row);
   }
   host.append(list);
  }
  return {add,clear,render,description:guidance};
 }
 window.SarNiHealthHistory=Object.freeze({create});
})();
