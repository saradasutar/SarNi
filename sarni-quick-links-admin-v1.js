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
 const url=new URL('./q/?key='+encodeURIComponent(result.linkToken),location.href).href;
 $('sarniQelNewLink').value=url;$('sarniQelSecret').hidden=false;
 status('Private link created. Copy it now; SarNi cannot retrieve its secret later.');$('sarniQelForm').hidden=true;$('sarniQelShowCreate').textContent='＋ Create another link';
 }catch(e){status('Could not complete creation: '+e.message,true);}finally{working=false;await refresh();}
}
function init(){
 const section=$('adminSettingsSection');if(!section||$('sarniQuickLinkPanel'))return;
 const panel=document.createElement('article');panel.id='sarniQuickLinkPanel';panel.className='panel sarni-qel-panel';
 panel.innerHTML='<h3>Login-free Quick Entry Links</h3><p>Create private mobile links for quick expenses, diary entries and stock notes. Only administrators can manage access.</p><form id="sarniQelForm"><label>Link name<input name="label" value="SarNi Daily Quick Entry" maxlength="100" required></label><label><input type="checkbox" name="neverExpires" checked> Valid until I disable it</label><label>Expiry (if applicable)<input name="expiresAt" type="datetime-local"></label><fieldset><legend>Allowed entries</legend><label><input name="allowExpense" type="checkbox" checked> Expenses</label><label><input name="allowDiary" type="checkbox" checked> Diary</label><label><input name="allowStock" type="checkbox" checked> Stock notes</label></fieldset><button class="primary-button" type="submit">Create private link</button></form><div id="sarniQelSecret" hidden><p><strong>Copy this secret link now; it is shown only once.</strong></p><input id="sarniQelNewLink" readonly aria-label="New private link"><button type="button" id="sarniQelCopy">Copy link</button></div><p id="sarniQelStatus" role="status" aria-live="polite"></p><h4>Existing links</h4><div id="sarniQelList"></div><button type="button" id="sarniQelRefresh">Refresh links</button><p><small>Secret links grant access without login. Do not share publicly. The mobile page runs at the short SarNi /q/ address; QuickCapture.gs must be deployed in Apps Script.</small></p>';
 section.insertBefore(panel,section.querySelector('#sarniBackupPanel')||null);
 const frm=$('sarniQelForm');frm.hidden=true;
 const toggle=document.createElement('button');toggle.type='button';toggle.id='sarniQelShowCreate';toggle.className='secondary-button';toggle.textContent='＋ Create another link';
 panel.insertBefore(toggle,frm);
 toggle.addEventListener('click',()=>{frm.hidden=!frm.hidden;toggle.textContent=frm.hidden?'＋ Create another link':'− Close new-link form';});

 const style=document.createElement('style');style.textContent=`
 #sarniQuickLinkPanel{max-width:880px;margin:16px auto;padding:20px!important;border-radius:18px} #sarniQuickLinkPanel form[hidden],#sarniQuickLinkPanel [hidden]{display:none!important}
 #sarniQuickLinkPanel h3{font-size:20px;margin:0 0 7px}
 #sarniQuickLinkPanel p{line-height:1.5}
 #sarniQelForm{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;align-items:end}
 #sarniQelForm>label:first-child{grid-column:1/-1}
 #sarniQelForm>label{display:flex!important;flex-direction:column;gap:5px;margin:0!important;font-size:13px;font-weight:650}
 #sarniQelForm>label:has(input[type=checkbox]){flex-direction:row;align-items:center;gap:9px}
 #sarniQuickLinkPanel label:has(>input[type=checkbox]){display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;flex-direction:row!important;gap:8px!important;width:auto!important;min-height:24px!important;margin:0!important;padding:0!important;line-height:1.4!important} #sarniQuickLinkPanel input[type=checkbox]{appearance:auto!important;-webkit-appearance:checkbox!important;width:17px!important;height:17px!important;min-width:17px!important;min-height:17px!important;max-width:17px!important;max-height:17px!important;position:static!important;display:inline-block!important;padding:0!important;margin:0!important;transform:none!important;box-shadow:none!important;vertical-align:middle;accent-color:#176a55}
 #sarniQuickLinkPanel input:not([type=checkbox]){width:100%;max-width:100%;height:auto;min-height:40px;padding:9px 11px;border:1px solid #cad8d2;border-radius:9px;font-size:14px}
 #sarniQelForm fieldset{grid-column:1/-1;margin:0;padding:10px 12px;border:1px solid #d7e2dc;border-radius:12px;display:flex;align-items:center;flex-wrap:wrap;gap:12px 22px;min-width:0}
 #sarniQelForm legend{font-size:12px;font-weight:750;padding:0 6px}
 #sarniQelForm fieldset label,#sarniQelForm fieldset label:has(input[type=checkbox]){display:inline-flex!important;flex-direction:row!important;align-items:center;gap:7px;margin:0!important;font-size:13px}
 #sarniQelForm>button{grid-column:1/-1;justify-self:start}
 #sarniQelSecret{margin-top:14px;padding:12px;border-radius:12px;background:#eef8f3}
 #sarniQelSecret button{margin-top:8px}
 #sarniQelList{display:grid;gap:10px}
 #sarniQelList .sarni-qel-item{padding:12px;border:1px solid #dae6df;border-radius:12px}
 .sarni-qel-head,.sarni-qel-actions,.sarni-qel-permissions{display:flex;align-items:center;flex-wrap:wrap;gap:8px 15px}
 .sarni-qel-head{justify-content:space-between;margin-bottom:5px}
 .sarni-qel-permissions{margin:10px 0}
 .sarni-qel-permissions label{display:inline-flex!important;flex-direction:row!important;align-items:center;gap:6px;font-size:12px}
 .sarni-qel-actions button{padding:8px 11px;border:1px solid #ceded6;border-radius:9px;font-size:12px}
 @media(max-width:600px){#sarniQuickLinkPanel{padding:14px!important}#sarniQelForm{grid-template-columns:1fr}#sarniQelForm>label:first-child{grid-column:1}#sarniQelForm fieldset{grid-column:1}}
 #sarniQuickLinkPanel .sarni-qel-actions{margin-top:10px} #sarniQuickLinkPanel .sarni-qel-permissions{display:flex!important;flex-wrap:wrap!important;gap:8px 18px!important} #sarniQuickLinkPanel .sarni-qel-item{display:block!important} #sarniQuickLinkPanel .sarni-qel-item>small{display:block} #sarniQelShowCreate{margin:12px 0} `;document.head.appendChild(style);
 $('sarniQelForm').addEventListener('submit',create);
 $('sarniQelCopy').addEventListener('click',()=>{const text=$('sarniQelNewLink').value;navigator.clipboard?.writeText(text).then(()=>status('Link copied.')).catch(()=>{ $('sarniQelNewLink').select();status('Select and copy the link.');});});
 $('sarniQelRefresh').addEventListener('click',refresh);
 const observer=new MutationObserver(()=>{if(!section.classList.contains('hidden')&&!loaded){loaded=true;refresh();}});
 observer.observe(section,{attributes:true,attributeFilter:['class']});
 if(!section.classList.contains('hidden')){loaded=true;refresh();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();