/* SarNi admin control for temporary submit-only Quick Expense links. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const hasAdmin=()=>{try{return Boolean(state?.token)&&typeof isSarNiAdmin==='function'&&isSarNiAdmin();}catch(e){return false;}};
let panel=null;
function node(tag,text,className){const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(className)x.className=className;return x;}
function status(text,error){const n=$('qeAdminStatus');if(n){n.textContent=text||'';n.style.color=error?'#a63347':'#285e55';}}
function fmt(iso){try{return new Date(iso).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'});}catch{return iso;}}
function defaultExpiry(){
 const now=new Date(Date.now()+86400000),local=new Date(now.getTime()-now.getTimezoneOffset()*60000);
 return local.toISOString().slice(0,16);
}
function linkUrl(token){const u=new URL('./quick-expense.html',location.href);u.hash='token='+token;return u.toString();}
async function refresh(){
 if(!hasAdmin())return;
 const list=$('qeAdminLinks');if(!list)return;list.replaceChildren(node('p','Loading active and expired links…'));
 try{
 const r=await api('qeListLinks',{}, {retry:false,timeoutMs:30000});list.replaceChildren();
 if(!(r.links||[]).length){list.append(node('p','No links created yet.'));return;}
 for(const x of (r.links||[])){
  const line=node('div',undefined,'qe-admin-link-row');line.style.cssText='border-top:1px solid #e2e6ef;padding:10px 0;display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap';
  const meta=node('div');meta.append(node('strong',String(x.label||'Expense link')));
  const expired=Date.parse(x.expiresAt)<=Date.now(),active=!x.revoked&&!expired;
  const info=node('small',(active?'Active':'Inactive')+' · Ends '+fmt(x.expiresAt)+' · '+(x.submissionCount||0)+' entries');
  info.style.cssText='display:block;color:#62708a;margin-top:3px';meta.append(info);line.append(meta);
  if(active){const revoke=node('button','Revoke','life-quiet');revoke.type='button';revoke.onclick=async()=>{
   if(!confirm('Disable this link immediately? Previously saved expenses remain in the register.'))return;
   revoke.disabled=true;try{await api('qeRevokeLink',{id:x.id},{retry:false});status('Link disabled.');await refresh();}
   catch(err){status(err.message,true);revoke.disabled=false;}
  };line.append(revoke);}
  list.append(line);
 }
 }catch(error){list.replaceChildren(node('p',error.message||'Unable to fetch links.'));status('Update and deploy SarNi Code.gs v3.17.31 to enable secure Quick Expense links.',true);}
}
function install(){
 if(panel)return;
 const target=$('lifeExpenseStudio');if(!target)return;
 panel=node('details',undefined,'life-card admin-only hidden');panel.id='qeAdminPanel';
 panel.style.cssText='padding:15px;margin:12px 0;border:1px solid #b8c9e8;border-radius:16px;background:linear-gradient(135deg,#fff,#f2f6ff)';
 const sum=node('summary','⚡ Quick Expense Link · No-login entry (Admin)');sum.style.cssText='font-weight:850;cursor:pointer;color:#244c91;padding:5px 0';panel.append(sum);
 const intro=node('p','Create a secure link for fast expense entries. Set exactly when it expires. Anyone with the link can submit an expense, including one paid by somebody else, but cannot view or edit other records.','life-hint');panel.append(intro);
 const form=node('form');form.id='qeAdminForm';form.style.cssText='display:grid;gap:10px;max-width:580px';
 const label1=node('label','Link description (e.g., Odisha trip)');const in1=node('input');in1.name='label';in1.maxLength=100;in1.value='Travel expenses';in1.required=true;label1.append(in1);form.append(label1);
 const label2=node('label','Link valid until (administrator decides)');const in2=node('input');in2.type='datetime-local';in2.name='expiresAt';in2.required=true;in2.value=defaultExpiry();label2.append(in2);form.append(label2);
 const label3=node('label','Suggested Paid by names (optional, separated by commas)');const in3=node('input');in3.name='payers';in3.maxLength=800;in3.placeholder='e.g. Sarada, Niharika, Brother, Friend';label3.append(in3);form.append(label3);
 const hint=node('p','The Paid by field always allows any name, not just the suggestions. The expense is saved under the administrator’s SarNi expense account.','life-hint');form.append(hint);
 const create=node('button','Generate secure link','life-save');create.type='submit';form.append(create);
 const output=node('div');output.id='qeNewLink';output.hidden=true;
 const url=node('input');url.id='qeNewUrl';url.readOnly=true;url.setAttribute('aria-label','New Quick Expense link');url.style.cssText='width:100%;padding:12px;border:1px solid #a5b8dc;border-radius:10px;margin:8px 0';
 const copy=node('button','Copy link','life-quiet');copy.type='button';copy.onclick=async()=>{try{await navigator.clipboard.writeText(url.value);status('Link copied. Share it privately.');}catch(e){url.focus();url.select();status('Select and copy the link.');}};
 const share=node('button','Share link','life-quiet');share.type='button';share.onclick=()=>{if(navigator.share)navigator.share({title:'SarNi Quick Expense',url:url.value}).catch(()=>{});else copy.click();};
 output.append(node('strong','Copy or share this link now — the secret is displayed only once.'),url,copy,share);form.append(output);
 const msg=node('p');msg.id='qeAdminStatus';msg.setAttribute('role','status');form.append(msg);
 form.onsubmit=async e=>{
  e.preventDefault();if(!hasAdmin())return;
  const expiry=new Date(in2.value);if(!Number.isFinite(expiry.getTime())||expiry<=new Date()){status('Select a future expiry date and time.',true);return;}
  create.disabled=true;status('Creating link…');
  try{const r=await api('qeCreateLink',{label:in1.value.trim(),expiresAt:expiry.toISOString(),payers:in3.value.split(',').map(x=>x.trim()).filter(Boolean)},{retry:false,timeoutMs:35000});
   url.value=linkUrl(r.linkToken);output.hidden=false;status('Link created. You may now copy/share it.');await refresh();}
  catch(error){status(error.message||'Unable to create link. Confirm the new Apps Script backend is deployed.',true);}
  finally{create.disabled=false;}
 };
 panel.append(form);
 const ref=node('button','Refresh link statuses','life-quiet');ref.type='button';ref.onclick=refresh;panel.append(ref);
 const links=node('div');links.id='qeAdminLinks';panel.append(links);
 panel.addEventListener('toggle',()=>{if(panel.open)refresh();});
 target.prepend(panel);
 panel.classList.toggle('hidden',!hasAdmin());
 setInterval(()=>{if(!panel)return;const visible=hasAdmin();panel.classList.toggle('hidden',!visible);if(!visible)panel.open=false;},5000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
