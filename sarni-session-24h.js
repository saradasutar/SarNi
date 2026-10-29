/* SarNi v20.8.19 24-hour inactivity selector compatibility fix.
 * This script does not alter passwords, data or permissions.
 * Requires backend v3.17.35+ with saveSecuritySettings accepting 1440.
 */
(function(){
 'use strict';
 const MINUTES=1440;
 let saving=false;
 const byId=id=>document.getElementById(id);
 function message(text,error){
   let el=byId('sarni24hFixStatus');
   if(!el){el=document.createElement('p');el.id='sarni24hFixStatus';el.setAttribute('role','status');el.style.cssText='font-size:13px;font-weight:650;line-height:1.5;margin:9px 0';(byId('securitySettingsForm')||document.body).append(el);}
   el.textContent=text;el.style.color=error?'#b62a40':'#146c55';
 }
 function install(){
   const form=byId('securitySettingsForm');
   const select=byId('securityIdleTimeout');
   if(!form||!select||form.dataset.sarni24hFix==='installed')return;
   form.dataset.sarni24hFix='installed';
   if(!Array.from(select.options).some(o=>Number(o.value)===MINUTES)){
     select.add(new Option('24 hours (maximum)','1440'));
   }
   // Capture only the 24-hour choice before the older application's submit
   // validator; allow all original shorter-duration settings to work unchanged.
   form.addEventListener('submit',async function(event){
     if(Number(select.value)!==MINUTES)return;
     event.preventDefault();event.stopImmediatePropagation();
     if(saving)return;
     const save=byId('saveSecuritySettingsBtn')||form.querySelector('button[type="submit"]');
     saving=true;if(save)save.disabled=true;
     message('Saving 24-hour inactivity setting…');
     try{
       if(typeof api!=='function')throw new Error('Dashboard API not loaded. Reload SarNi and try again.');
       const result=await api('saveSecuritySettings',{idleTimeoutMinutes:MINUTES},{retry:false});
       if(!result?.ok)throw new Error(result?.message||'Backend rejected the new setting.');
       // Existing SarNi classic script owns a top-level state object. Updating it
       // lets its own idle checker use the newly selected duration this visit.
       try{
         if(typeof state!=='undefined'&&state&&typeof state==='object'){
           state.securityIdleMinutes=MINUTES;
           if(state.securitySettings&&typeof state.securitySettings==='object'){
             state.securitySettings.idleTimeoutMinutes=MINUTES;
             state.securitySettings.hiddenFallbackMinutes=MINUTES;
           }
         }
       }catch(_ignored){}
       select.value=String(MINUTES);
       const badge=byId('securityPolicyBadge');if(badge)badge.textContent='24-hour policy';
       const status=byId('securitySettingsStatus');if(status)status.textContent='Current policy: sign out after 24 hours of inactivity · warning during final minute.';
       message('✓ 24-hour inactivity setting saved. The backend now enforces 1,440 minutes.');
     }catch(err){
       message('Could not save 24 hours: '+String(err?.message||err)+' Check your deployed Code.gs supports 1440 minutes.',true);
     }finally{
       saving=false;if(save)save.disabled=false;
     }
   },true);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
