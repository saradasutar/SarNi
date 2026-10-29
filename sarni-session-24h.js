/* SarNi session setting compatibility overlay.
 * Preserves older FE form behaviour while providing a dedicated 24-hour control.
 * A matching BE update is REQUIRED: the browser cannot extend sessions on its own.
 */
(function(){'use strict';
 function add(){
  const select=document.getElementById('securityIdleTimeout'),form=document.getElementById('securitySettingsForm');
  if(!select||!form)return;
  if(!Array.from(select.options).some(o=>Number(o.value)===1440))select.add(new Option('24 hours (maximum)','1440'));
  if(document.getElementById('sarniApply24Hours'))return;
  const button=document.createElement('button');button.type='button';button.id='sarniApply24Hours';
  button.textContent='Set inactivity logout to 24 hours';
  button.className='secondary-button';button.style.cssText='min-height:44px;padding:11px 15px;margin:8px 0';
  const msg=document.createElement('p');msg.id='sarni24HourStatus';msg.setAttribute('role','status');
  msg.style.cssText='font-size:13px;color:#41557d';
  button.addEventListener('click',async()=>{
   if(typeof window.api!=='function' && typeof api!=='function'){
    msg.textContent='Cannot reach SarNi backend API from this page.';return;
   }
   button.disabled=true;msg.textContent='Saving 24-hour policy…';
   try{
    const result=await api('saveSecuritySettings',{idleTimeoutMinutes:1440},{retry:false});
    if(!result?.ok)throw new Error(result?.message||'Update rejected by backend.');
    select.value='1440';
    const status=document.getElementById('securitySettingsStatus');if(status)status.textContent='Current policy: sign out after 24 hours of inactivity.';
    msg.textContent='✓ 24-hour inactivity sign-out saved. Sign in again if your earlier session is already expired.';
   }catch(err){msg.textContent='Could not save: '+(err.message||'Deploy the matching backend first.');}
   finally{button.disabled=false;}
  });
  form.append(button,msg);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add();
})();
