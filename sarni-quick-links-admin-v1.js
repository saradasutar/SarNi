/* SarNi admin quick links v2 — compact single-purpose interface. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const section=$('adminSettingsSection');if(!section||$('sarniQuickLinkPanel'))return;
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const call=async(a,p={})=>{const r=await api(a,p,{retry:false});if(!r?.ok)throw Error(r?.message||'Request failed');return r;};
let busy=false;
const status=(msg,bad=false)=>{const t=$('sarniQelStatus');t.textContent=msg;t.style.color=bad?'#b42337':'#176a55';};
const panel=document.createElement('article');panel.id='sarniQuickLinkPanel';panel.className='panel';
panel.innerHTML='<div class="qel-head"><div><h3>Login-free Quick Entry</h3><p>Manage private mobile entry links for Expense, Diary and Stock Notes.</p></div><button type="button" id="sarniQelRefresh">↻ Refresh</button></div><div id="sarniQelList">Loading links…</div><button type="button" id="sarniQelShowCreate" class="secondary-button">＋ Create another link</button><form id="sarniQelForm" hidden><label class="qel-text">Link name<input name="label" maxlength="100" value="SarNi Daily Quick Entry" required></label><label class="qel-check"><input type="checkbox" name="neverExpires" checked><span>Keep active until disabled</span></label><label class="qel-text" id="sarniQelExpiry">Expiry date and time<input name="expiresAt" type="datetime-local"></label><fieldset><legend>Allow entries</legend><label class="qel-check"><input type="checkbox" name="allowExpense" checked><span>Expense</span></label><label class="qel-check"><input type="checkbox" name="allowDiary" checked><span>Diary</span></label><label class="qel-check"><input type="checkbox" name="allowStock" checked><span>Stock Notes</span></label></fieldset><button class="primary-button" type="submit">Generate private link</button></form><div id="sarniQelSecret" hidden><strong>New private link — copy now</strong><p>The secret is only displayed when the link is created.</p><input id="sarniQelNewLink" readonly><button type="button" id="sarniQelCopy">Copy link</button></div><p id="sarniQelStatus" role="status" aria-live="polite"></p><p class="qel-hint">For safety, existing links cannot reveal their original secret URL. To replace a lost URL, generate a new link and revoke the old one. Previously saved entries are not deleted.</p>';
section.insertBefore(panel,section.querySelector('#sarniBackupPanel')||null);
const styles=document.createElement('style');styles.textContent=`
#sarniQuickLinkPanel{max-width:940px!important;margin:14px auto!important;padding:18px!important;border-radius:16px!important}
#sarniQuickLinkPanel [hidden]{display:none!important}
#sarniQuickLinkPanel .qel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
#sarniQuickLinkPanel .qel-head h3{font-size:20px;margin:0 0 4px}
#sarniQuickLinkPanel .qel-head p{margin:0 0 12px;font-size:13px}
#sarniQuickLinkPanel button{width:auto!important;height:auto!important;min-height:36px!important;padding:8px 13px!important;border-radius:9px!important;font-size:13px!important}
#sarniQuickLinkPanel .qel-card{border:1px solid #dce7e1;border-radius:12px;padding:12px 14px;margin:8px 0;background:rgba(242,249,245,.4)}
#sarniQuickLinkPanel .qel-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
#sarniQuickLinkPanel .qel-card-head strong{font-size:14px}
#sarniQuickLinkPanel .qel-pill{font-size:11px;font-weight:700;padding:4px 9px;border-radius:30px;background:#e4f5e9;color:#19663b}
#sarniQuickLinkPanel .qel-pill.off{background:#f1efed;color:#826759}
#sarniQuickLinkPanel .qel-meta{font-size:12px;color:#667b73;margin:5px 0}
#sarniQuickLinkPanel details{margin-top:8px}
#sarniQuickLinkPanel summary{cursor:pointer;font-size:13px;font-weight:700;padding:5px 0}
#sarniQuickLinkPanel .qel-checks{display:flex!important;flex-flow:row wrap!important;gap:10px 20px!important;align-items:center!important;margin:9px 0}
#sarniQuickLinkPanel label.qel-check{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;flex-direction:row!important;width:auto!important;max-width:none!important;min-height:22px!important;gap:7px!important;margin:0!important;padding:0!important;position:static!important;line-height:1.3!important;font-size:13px!important;text-align:left!important}
#sarniQuickLinkPanel label.qel-check>input[type=checkbox]{appearance:checkbox!important;-webkit-appearance:checkbox!important;display:inline-block!important;visibility:visible!important;position:static!important;width:16px!important;height:16px!important;min-width:16px!important;min-height:16px!important;max-width:16px!important;max-height:16px!important;flex:0 0 16px!important;margin:0!important;padding:0!important;transform:none!important;box-shadow:none!important;outline-offset:2px!important;accent-color:#176a55!important}
#sarniQuickLinkPanel label.qel-check>span{display:inline!important;position:static!important;width:auto!important;white-space:nowrap!important;font-size:13px!important}
#sarniQuickLinkPanel label.qel-check{display:inline-flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:9px!important;cursor:pointer!important;border:1px solid #d8e6df!important;border-radius:999px!important;background:#f5f8f6!important;padding:6px 10px!important;max-width:100%!important}
#sarniQuickLinkPanel label.qel-check:has(input:checked){background:#e8f6ef!important;border-color:#97cbb2!important}
#sarniQuickLinkPanel label.qel-check>input[type=checkbox]{appearance:none!important;-webkit-appearance:none!important;position:relative!important;display:inline-block!important;width:30px!important;min-width:30px!important;max-width:30px!important;height:18px!important;min-height:18px!important;max-height:18px!important;border:1px solid #b0c2b7!important;border-radius:100px!important;background:#ced7d1!important;box-shadow:none!important;vertical-align:middle!important;flex:0 0 30px!important;margin:0!important;padding:0!important;transform:none!important;cursor:pointer!important}
#sarniQuickLinkPanel label.qel-check>input[type=checkbox]:checked{background:#187456!important;border-color:#187456!important}
#sarniQuickLinkPanel label.qel-check>input[type=checkbox]::after{content:""!important;position:absolute!important;left:2px!important;top:2px!important;width:12px!important;height:12px!important;border-radius:50%!important;background:white!important;box-shadow:0 1px 2px #0002!important;transform:none!important}
#sarniQuickLinkPanel label.qel-check>input[type=checkbox]:checked::after{transform:translateX(12px)!important}
#sarniQuickLinkPanel label.qel-check>input[type=checkbox]:focus-visible{outline:2px solid #14755b!important;outline-offset:3px!important}
#sarniQuickLinkPanel .qel-actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 2px}
#sarniQelForm{border:1px solid #dde9e3;border-radius:12px;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
#sarniQelForm .qel-text{display:flex!important;flex-direction:column!important;gap:5px!important;margin:0!important;font-size:13px!important}
#sarniQelForm .qel-text:first-child,#sarniQelForm fieldset,#sarniQelForm>button{grid-column:1/-1}
#sarniQelForm input:not([type=checkbox]),#sarniQelNewLink{width:100%!important;height:40px!important;padding:8px 10px!important;font-size:13px!important;border-radius:9px!important;border:1px solid #cbdcd2!important}
#sarniQelForm fieldset{padding:9px 12px!important;border:1px solid #d9e4de!important;border-radius:10px!important;display:flex!important;gap:10px 18px!important;align-items:center!important;flex-wrap:wrap!important;min-width:0}
#sarniQelForm legend{font-size:12px;font-weight:700}
#sarniQelForm>button{justify-self:start}
#sarniQelSecret{margin:12px 0;padding:12px;background:#ecf7f0;border-radius:10px}
#sarniQelCopy{margin-top:8px}
#sarniQuickLinkPanel .qel-hint{margin:10px 0 0;font-size:12px;color:#61766d;line-height:1.5}
@media(max-width:600px){#sarniQuickLinkPanel{padding:12px!important}#sarniQelForm{grid-template-columns:1fr}#sarniQelForm .qel-text:first-child,#sarniQelForm fieldset,#sarniQelForm>button{grid-column:1}}
`;document.head.appendChild(styles);
const form=$('sarniQelForm');const toggle=$('sarniQelShowCreate');
toggle.onclick=()=>{form.hidden=!form.hidden;toggle.textContent=form.hidden?'＋ Create another link':'− Close new-link form';};
const expiry=()=>{$('sarniQelExpiry').hidden=form.elements.neverExpires.checked;};
form.elements.neverExpires.onchange=expiry;expiry();
$('sarniQelCopy').onclick=()=>{const v=$('sarniQelNewLink').value;navigator.clipboard?.writeText(v).then(()=>status('Private link copied.')).catch(()=>{$('sarniQelNewLink').select();status('Select and copy the link manually.');});};
async function refresh(){try{const r=await call('qeListLinks');const host=$('sarniQelList');host.replaceChildren();if(!r.links?.length){host.textContent='No saved links. Select Create another link.';return;}for(const link of r.links){
 const card=document.createElement('div');card.className='qel-card';const a=link.quickAccess||{};const expiryLabel=link.neverExpires?'Until disabled':(link.expiresAt?new Date(link.expiresAt).toLocaleString():'Unknown');
 card.innerHTML='<div class="qel-card-head"><strong>'+safe(link.label||'Private link')+'</strong><span class="qel-pill '+(link.revoked?'off':'')+'">'+(link.revoked?'Disabled':'Enabled')+'</span></div><p class="qel-meta">Expires: '+safe(expiryLabel)+' · Entries: '+Number(link.submissionCount||0)+'</p><details><summary>Manage permissions & access</summary><div class="qel-checks">'+[['allowExpense','Expense'],['allowDiary','Diary'],['allowStock','Stock Notes'],['allowRecent','Recent Titles']].map(([k,label])=>'<label class="qel-check"><input type="checkbox" data-perm="'+k+'" '+(a[k]?'checked':'')+'><span>'+label+'</span></label>').join('')+'</div><div class="qel-actions"><button type="button" data-act="save">Save permissions</button><button type="button" data-act="toggle">'+(link.revoked?'Re-enable':'Disable')+'</button><button type="button" data-act="revoke">Revoke</button><button type="button" data-act="replace">Replace lost link</button></div></details>';
 const newHead=document.createElement('label');newHead.className='qel-check';newHead.innerHTML='<input type="checkbox" data-new-head><span>Allow new expense heads</span>';card.querySelector('.qel-checks').append(newHead);newHead.querySelector('input').checked=!!a.allowNewHead;
 card.onclick=async event=>{const button=event.target.closest('[data-act]');if(!button||busy)return;const act=button.dataset.act;if(act==='replace'){form.hidden=false;toggle.textContent='− Close new-link form';form.elements.label.value=(link.label||'Quick Entry')+' (new)';form.scrollIntoView({behavior:'smooth',block:'center'});status('Create a replacement, copy the new URL, then revoke the old link.');return;}if(act==='revoke'&&!confirm('Revoke this link? This does not delete its saved entries.'))return;
 try{busy=true;status('Saving…');if(act==='save'){const access={recentLimit:5};card.querySelectorAll('[data-perm]').forEach(e=>access[e.dataset.perm]=e.checked);await call('qeConfigureAccess',{id:link.id,access});await call('qeSetNewHeadAccess',{id:link.id,enabled:card.querySelector('[data-new-head]').checked});}else if(act==='toggle')await call('qeSetLinkEnabled',{id:link.id,enabled:!!link.revoked,neverExpires:link.neverExpires});else await call('qeRevokeLink',{id:link.id});status('Saved successfully.');}catch(e){status(e.message,true);}finally{busy=false;await refresh();}};
 host.append(card);
 }}catch(e){status('Unable to load existing links: '+e.message,true);}}
form.onsubmit=async e=>{e.preventDefault();if(busy)return;try{busy=true;status('Generating link…');if(!form.elements.neverExpires.checked&&!form.elements.expiresAt.value)throw Error('Select an expiry date.');const r=await call('qeCreateLink',{label:form.elements.label.value.trim(),neverExpires:form.elements.neverExpires.checked,expiresAt:form.elements.neverExpires.checked?'':new Date(form.elements.expiresAt.value).toISOString()});const access={allowExpense:form.elements.allowExpense.checked,allowDiary:form.elements.allowDiary.checked,allowStock:form.elements.allowStock.checked,allowRecent:false,recentLimit:5};await call('qeConfigureAccess',{id:r.link.id,access});if(!r.linkToken)throw Error('Link created but the backend did not return its private token.');$('sarniQelNewLink').value=new URL('./q/?key='+encodeURIComponent(r.linkToken),location.href).href;$('sarniQelSecret').hidden=false;form.hidden=true;toggle.textContent='＋ Create another link';status('Private link created. Copy it now.');}catch(ex){status(ex.message,true);}finally{busy=false;await refresh();}};
$('sarniQelRefresh').onclick=refresh;
let loaded=false;const observer=new MutationObserver(()=>{if(!section.classList.contains('hidden')&&!loaded){loaded=true;refresh();}});observer.observe(section,{attributes:true,attributeFilter:['class']});if(!section.classList.contains('hidden')){loaded=true;refresh();}
})();