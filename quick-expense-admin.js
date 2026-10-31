/* SarNi Quick Expense: admin-controlled links, including reversible disable/enable.
 * Replaces only the previous quick-expense-admin.js. Existing expense registry is unchanged.
 * No link secrets are saved in the browser or shown after initial creation.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const node=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e;};
let panel=null, latest=[];
const isAdmin=()=>{try{return !!state?.token&&typeof isSarNiAdmin==='function'&&isSarNiAdmin();}catch{return false;}};
const fmt=d=>{try{const v=new Date(d);return Number.isFinite(v.getTime())?v.toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'Not set';}catch{return 'Not set';}};
function localDate(iso){const d=new Date(iso);if(!Number.isFinite(d.getTime()))return '';return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
function nextDate(){return localDate(new Date(Date.now()+24*3600000));}
function status(message,error){const t=$('qeAdminStatus');if(t){t.textContent=message||'';t.style.color=error?'#a32638':'#176955';}}
function urlFromSecret(secret){const u=new URL('./quick-expense.html',location.href);u.hash='token='+secret;return u.toString();}
function field(labelText,input){const lab=node('label');lab.style.cssText='display:block;font-weight:650;margin:9px 0 3px';lab.append(node('span',labelText),input);return lab;}
function input(type,attrs){const x=node('input');x.type=type;x.style.cssText='display:block;width:100%;min-height:44px;border:1px solid #c4d2eb;padding:9px 10px;border-radius:9px;font:inherit;margin-top:5px';Object.entries(attrs||{}).forEach(([k,v])=>{if(k==='value')x.value=v;else x.setAttribute(k,v)});return x;}
function btn(label,cls){const b=node('button',label,cls||'life-quiet');b.type='button';b.style.cssText='min-height:44px;cursor:pointer;margin:4px 7px 4px 0';return b;}
function rowStatus(row){if(row.revoked)return 'Disabled by administrator';if(!row.neverExpires&&Date.parse(row.expiresAt)<=Date.now())return 'Expired';return 'Enabled';}
async function refresh(){
 if(!isAdmin())return;
 const list=$('qeAdminLinks');if(!list)return;list.replaceChildren(node('p','Loading your links…'));
 try{const r=await api('qeListLinks',{},{retry:false,timeoutMs:30000});latest=Array.isArray(r.links)?r.links:[];renderLinks();}
 catch(err){list.replaceChildren(node('p','Unable to load links. Deploy the updated SarNi backend first.'));status(String(err.message||err),true);}
}
async function mutate(row,enabled,expiresAt,neverExpires){
 if(!isAdmin())return;
 try{
  const result=await api('qeSetLinkEnabled',{id:row.id,enabled:!!enabled,
    neverExpires:!!neverExpires,expiresAt:neverExpires?'':expiresAt},{retry:false,timeoutMs:35000});
  status(result.message||'Link updated.');await refresh();
 }catch(err){status(err.message||'Could not update link.',true);}
}
function renderLinks(){
 const list=$('qeAdminLinks');if(!list)return;list.replaceChildren();
 if(!latest.length){list.append(node('p','No shared links created yet.'));return;}
 const header=node('p','Links are stored in your existing SarNi spreadsheet. Disabling blocks new entries; enabling restores the SAME previously shared URL. Copy each new URL when first generated.','life-hint');list.append(header);
 for(const row of latest){
  const box=node('section');box.style.cssText='padding:14px 0;border-top:1px solid #d8e2f1';
  const title=node('strong',String(row.label||'Quick Expense Link'));box.append(title);
  const active=rowStatus(row)==='Enabled';const summary=node('p',rowStatus(row)+' · '+(row.neverExpires?'Valid until disabled':'Expires '+fmt(row.expiresAt))+' · '+Number(row.submissionCount||0)+' submitted');summary.style.cssText='margin:4px 0 10px;color:#57637c;font-size:13px';box.append(summary);
  const c=node('div');c.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:9px;align-items:end;max-width:580px';
  const until=input('checkbox');until.checked=!!row.neverExpires;until.style.cssText='width:20px;height:20px;margin:0 7px 0 0;vertical-align:middle';
  const neverLabel=node('label');neverLabel.style.cssText='display:flex;align-items:center;gap:5px;font-size:13px;min-height:46px';neverLabel.append(until,node('span','Valid until disabled'));
  const exp=input('datetime-local',{value:row.neverExpires?nextDate():localDate(row.expiresAt)});exp.disabled=until.checked;
  until.addEventListener('change',()=>{exp.disabled=until.checked;});
  const expiryLabel=field('Expiry (when used)',exp);c.append(neverLabel,expiryLabel);box.append(c);
  const line=node('div');line.style.cssText='display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:8px';
  const toggle=btn(active?'Disable link':'Enable same link');toggle.disabled=false;
  toggle.onclick=async()=>{
   const enable=!active;
   if(!enable&&!confirm('Pause this link? New expense submissions will be blocked, but existing records stay saved.'))return;
   const expiry=exp.value?new Date(exp.value):null;
   if(enable&&!until.checked&&(!expiry||expiry.getTime()<=Date.now()+60000)){status('Choose a future expiry time or select Valid until disabled.',true);return;}
   toggle.disabled=true;await mutate(row,enable,until.checked?'':expiry?.toISOString(),until.checked);toggle.disabled=false;
  };
  const change=btn('Save validity');change.onclick=async()=>{
   const date=exp.value?new Date(exp.value):null;
   if(!until.checked&&(!date||date.getTime()<=Date.now()+60000)){status('Choose a future expiry time.',true);return;}
   change.disabled=true;await mutate(row,active,until.checked?'':date?.toISOString(),until.checked);change.disabled=false;
  };
  line.append(toggle,change);box.append(line);
  const acl=node('div');acl.style.cssText='border:1px solid #d9e5f6;border-radius:12px;padding:12px;margin-top:12px;background:#f8fbff';
  acl.append(node('strong','No-login Quick Entry permissions'));
  const settings=row.quickAccess||{};
  const makeFlag=(name,text,checked)=>{const label=node('label');label.style.cssText='display:flex;align-items:center;gap:8px;margin:8px 0;font-size:13px';const input=node('input');input.type='checkbox';input.checked=!!checked;input.style.cssText='width:20px;height:20px';label.append(input,node('span',text));acl.append(label);return input;};
  const diary=makeFlag('diary','Allow Diary entries (saved privately to link owner)',settings.allowDiary);
  const stock=makeFlag('stock','Allow Stock Diary (saved privately to link owner)',settings.allowStock);
  const wisdom=makeFlag('wisdom','Allow Investment Wisdom (saved as a tagged Diary entry)',settings.allowWisdom||settings.allowDiary);
  const recent=makeFlag('recent','Allow view of recent entries written through this specific link',settings.allowRecentView);
  const saveAcl=btn('Save Quick Entry permissions');
  saveAcl.onclick=async()=>{if(!isAdmin())return;saveAcl.disabled=true;try{const result=await api('qeConfigureAccess',{id:row.id,allowDiary:diary.checked,allowStock:stock.checked,allowWisdom:wisdom.checked,allowRecentView:recent.checked},{retry:false});if(!result?.ok)throw Error(result?.message||'Permission update failed');status('Quick Entry permissions saved. The existing link continues to work.');await refresh();}catch(e){status(e.message||'Could not update permissions.',true);}finally{saveAcl.disabled=false;}};
  acl.append(saveAcl);box.append(acl);
  list.append(box);
 }
}
function install(){
 if(panel)return;const target=$('lifeExpenseStudio');if(!target)return;
 panel=node('details',undefined,'life-card admin-only hidden');panel.id='qeAdminPanel';panel.style.cssText='padding:16px;margin:15px 0;background:#fafcff;border:1px solid #bac9e4;border-radius:16px';
 const sum=node('summary','⚡ Daily Quick Expense Links · No login (Admin)');sum.style.cssText='font-weight:850;color:#21477e;cursor:pointer;padding:8px 0';panel.append(sum);
 panel.append(node('p','Create one private link for all daily expenses: groceries, food, household bills, shopping, transport or trips. The user chooses the category and subcategory from your existing SarNi Category Manager, and can enter expenses paid by anyone. Choose a fixed expiry or valid until disabled.','life-hint'));
 const form=node('form');form.id='qeAdminForm';form.style.cssText='display:grid;gap:9px;max-width:620px';
 const label=input('text',{maxlength:'100',required:'required',value:'Daily expenses'}),expiration=input('datetime-local',{value:nextDate()});
 const never=input('checkbox');never.checked=true;never.style.cssText='width:20px;height:20px;vertical-align:middle;margin:0 6px 0 0';expiration.disabled=true;
 never.addEventListener('change',()=>{expiration.disabled=never.checked;expiration.required=!never.checked;});
 const payers=input('text',{maxlength:'800',placeholder:'e.g. Sarada, Niharika, Friend'});
 form.append(field('Link name (e.g., Daily expenses / Grocery / Trip)',label),field('Valid until (optional)',expiration));
 const neverLab=node('label');neverLab.style.cssText='display:flex;align-items:center;gap:8px;font-weight:750';neverLab.append(never,node('span','Keep active until admin disables it'));form.append(neverLab);
 form.append(field('Suggested Paid by names (optional; any name may be typed)',payers));
 const create=btn('Generate private link','life-save');create.type='submit';form.append(create);
 const generated=node('div');generated.hidden=true;const link=input('url',{readonly:'readonly'});
 const copy=btn('Copy link'),share=btn('Share link');copy.onclick=async()=>{try{await navigator.clipboard.writeText(link.value);status('Link copied. Share privately.');}catch{link.focus();link.select();status('Select and copy this link.');}};
 share.onclick=()=>{if(navigator.share)navigator.share({title:'SarNi Quick Expense',url:link.value}).catch(()=>{});else copy.click();};
 generated.append(node('strong','Save this link now—its secret cannot be retrieved later.'),link,copy,share);form.append(generated);
 const feedback=node('p');feedback.id='qeAdminStatus';feedback.setAttribute('role','status');form.append(feedback);
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!isAdmin())return;
  let expiry; if(!never.checked){expiry=new Date(expiration.value);if(!Number.isFinite(expiry.getTime())||expiry<=new Date(Date.now()+60000)){status('Choose an expiry more than one minute from now.',true);return;}}
  create.disabled=true;status('Generating link…');
  try{const r=await api('qeCreateLink',{label:label.value.trim(),neverExpires:never.checked,
    expiresAt:never.checked?'':expiry.toISOString(),payers:payers.value.split(',').map(x=>x.trim()).filter(Boolean)},{retry:false,timeoutMs:35000});
    link.value=urlFromSecret(r.linkToken);generated.hidden=false;status('Link created. Copy or share it now.');await refresh();
  }catch(err){status(err.message||'Could not create link. Deploy the backend first.',true);}
  finally{create.disabled=false;}
 });
 panel.append(form);
 const refreshButton=btn('Refresh link status');refreshButton.onclick=refresh;panel.append(refreshButton);
 const all=node('div');all.id='qeAdminLinks';panel.append(all);panel.addEventListener('toggle',()=>{if(panel.open)refresh();});target.prepend(panel);
 const sync=()=>{const yes=isAdmin();panel.classList.toggle('hidden',!yes);if(!yes)panel.open=false;};
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 document.addEventListener('click',e=>{if(e.target.closest('[data-section],#logoutBtn,#loginButton'))queueMicrotask(sync);},{passive:true});sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
