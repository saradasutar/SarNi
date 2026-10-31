/* SarNi Quick Entry Links — authenticated administrator UI. No shared tokens stored in GitHub. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const backend=()=>String(window.PORTFOLIO_CONFIG?.API_URL||'').trim();
let loaded=false,working=false;
const status=(message,err=false)=>{const el=$('sarniQelStatus');if(el){el.textContent=message;el.style.color=err?'#b42337':'#12664d';}};
const run=async(action,payload={})=>{if(typeof api!=='function')throw Error('SarNi API is unavailable');const r=await api(action,payload,{retry:false});if(!r||r.ok!==true)throw Error(r?.message||'Request failed');return r;};
async function refresh(){
 if(working)return;
 try{status('Loading links…');const r=await run('qeListLinks');const host=$('sarniQelList');host.replaceChildren();
 if(!r.links?.length){host.textContent='No links yet. Create one below.';status('');return;}
 for(const link of r.links){
 const a=link.quickAccess||{};
 const div=document.createElement('div');div.className='sarni-qel-item';
 const expiry=link.neverExpires?'Until disabled':(link.expiresAt?new Date(link.expiresAt).toLocaleDateString():'Not specified');
 div.innerHTML='<div class="sarni-qel-head"><strong>'+esc(link.label)+'</strong><span>'+esc(link.revoked?'Disabled':'Enabled')+'</span></div><small>Expires: '+esc(expiry)+' · Entries: '+Number(link.submissionCount||0)+'</small><div class="sarni-qel-permissions"><label><input type="checkbox" data-perm="allowExpense" '+(a.allowExpense?'checked':'')+'> Expense</label><label><input type="checkbox" data-perm="allowDiary" '+(a.allowDiary?'checked':'')+'> Diary</label><label><input type="checkbox" data-perm="allowStock" '+(a.allowStock?'checked':'')+'> Stock notes</label><label><input type="checkbox" data-perm="allowRecent" '+(a.allowRecent?'checked':'')+'> Recent titles</label></div><div class="sarni-qel-actions"><button type="button" data-action="save">Save permissions</button><button type="button" data-action="toggle">'+(link.revoked?'Re-enable':'Disable')+'</button><button type="button" data-action="revoke">Revoke access</button></div>';
 div.addEventListener('click',async e=>{
 const b=e.target.closest('button[data-action]');if(!b||working)return;
 const choice=b.dataset.action;
 if(choice==='revoke'&&!confirm('Revoke this shared link? People holding its URL will lose access.'))return;
 try{working=true;status('Updating…');
 if(choice==='save'){const access={recentLimit:5};div.querySelectorAll('[data-perm]').forEach(x=>access[x.dataset.perm]=x.checked);await run('qeConfigureAccess',{id:link.id,access});}
 else if(choice==='toggle'){await run('qeSetLinkEnabled',{id:link.id,enabled:!!link.revoked,neverExpires:link.neverExpires});}
 else {await run('qeRevokeLink',{id:link.id});}
 status('Saved successfully.');}catch(ex){status(ex.message,true);}finally{working=false;await refresh();}
 });host.append(div);
 }status('');
 }catch(e){status('Cannot load links: '+e.message+'. Ensure the updated QuickCapture.gs is deployed.',true);}
}
async function create(e){
 e.preventDefault();if(working)return;const form=e.currentTarget;
 try{working=true;status('Creating private link…');
 const result=await run('qeCreateLink',{label:form.elements.label.value.trim(),neverExpires:form.elements.neverExpires.checked,expiresAt:form.elements.neverExpires.checked?'':new Date(form.elements.expiresAt.value).toISOString()});
 const access={allowExpense:form.elements.allowExpense.checked,allowDiary:form.elements.allowDiary.checked,allowStock:form.elements.allowStock.checked,allowRecent:false,recentLimit:5};
 try{await run('qeConfigureAccess',{id:result.link.id,access});}catch(permissionError){status('Link created, but permissions did not save: '+permissionError.message,true);}
 const base=backend();if(!base)throw Error('Backend URL missing from config.js');
 const url=base+'?quick=1&key='+encodeURIComponent(result.linkToken);
 $('sarniQelNewLink').value=url;$('sarniQelSecret').hidden=false;
 status('Private link created. Copy it now; SarNi cannot retrieve its secret later.');
 }catch(e){status('Could not complete creation: '+e.message,true);}finally{working=false;await refresh();}
}
function init(){
 const section=$('adminSettingsSection');if(!section||$('sarniQuickLinkPanel'))return;
 const panel=document.createElement('article');panel.id='sarniQuickLinkPanel';panel.className='panel sarni-qel-panel';
 panel.innerHTML='<h3>Login-free Quick Entry Links</h3><p>Create private mobile links for quick expenses, diary entries and stock notes. Only administrators can manage access.</p><form id="sarniQelForm"><label>Link name<input name="label" value="SarNi Daily Quick Entry" maxlength="100" required></label><label><input type="checkbox" name="neverExpires" checked> Valid until I disable it</label><label>Expiry (if applicable)<input name="expiresAt" type="datetime-local"></label><fieldset><legend>Allowed entries</legend><label><input name="allowExpense" type="checkbox" checked> Expenses</label><label><input name="allowDiary" type="checkbox" checked> Diary</label><label><input name="allowStock" type="checkbox" checked> Stock notes</label></fieldset><button class="primary-button" type="submit">Create private link</button></form><div id="sarniQelSecret" hidden><p><strong>Copy this secret link now; it is shown only once.</strong></p><input id="sarniQelNewLink" readonly aria-label="New private link"><button type="button" id="sarniQelCopy">Copy link</button></div><p id="sarniQelStatus" role="status" aria-live="polite"></p><h4>Existing links</h4><div id="sarniQelList"></div><button type="button" id="sarniQelRefresh">Refresh links</button><p><small>Secret links grant access without login. Do not share publicly. The mobile page requires QuickEntry.html and QuickCapture.gs deployed in Apps Script.</small></p>';
 section.insertBefore(panel,section.querySelector('#sarniBackupPanel')||null);
 $('sarniQelForm').addEventListener('submit',create);
 $('sarniQelCopy').addEventListener('click',()=>{const text=$('sarniQelNewLink').value;navigator.clipboard?.writeText(text).then(()=>status('Link copied.')).catch(()=>{ $('sarniQelNewLink').select();status('Select and copy the link.');});});
 $('sarniQelRefresh').addEventListener('click',refresh);
 const observer=new MutationObserver(()=>{if(!section.classList.contains('hidden')&&!loaded){loaded=true;refresh();}});
 observer.observe(section,{attributes:true,attributeFilter:['class']});
 if(!section.classList.contains('hidden')){loaded=true;refresh();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();