/* SarNi v20.10.1: compact mobile +, direct-to-destination More navigation.
   No new account, no new storage: logged-in saves use existing authenticated APIs. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const f=$('sarniQcForm'),dialog=$('sarniQcDialog');if(!f||!dialog)return;
const stamp=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
let kind='expense',busy=false,companies=[],loadedCompanies=false;
const signedIn=()=>{try{return Boolean(state?.token&&state?.user);}catch{return false;}};
function notice(s,error=false){const p=$('sarniQcStatus');p.textContent=s||'';p.style.color=error?'#b42337':'#126b53';}
function switchWorkspace(section){const b=document.querySelector('#sarniSidebarPrimary [data-section="'+section+'"]');if(b){b.click();return true;}if(typeof switchSection==='function'){switchSection(section);return true;}return false;}
function focus(id,selector){const pane=$(id);if(!pane)return false;for(let p=pane;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;setTimeout(()=>{pane.scrollIntoView({block:'start',behavior:'instant'});const field=selector?pane.querySelector(selector):null;if(field)field.focus({preventScroll:true});},85);return true;}
function closeMore(){if(typeof closeSarNiMobileMore==='function')closeSarNiMobileMore();const open=$('sarniMobileAddSheet');if(open&&!open.classList.contains('hidden'))$('sarniMobileAddClose')?.click();}
function openPanel(k){if(!signedIn())return;
 kind=['expense','diary','stock'].includes(k)?k:'expense';closeMore();
 $('sarniQcTitle').textContent=kind==='expense'?'Quick Expense':kind==='stock'?'Quick Stock Note':'Quick Diary';
 $('sarniQcExpense').hidden=kind!=='expense';$('sarniQcNote').hidden=kind==='expense';$('sarniQcCompanyWrap').hidden=kind!=='stock';
 [...f.elements].forEach(x=>{if(!x.name)return; if(['amount','category','reason'].includes(x.name))x.required=kind==='expense';if(x.name==='body')x.required=kind!=='expense';if(x.name==='companyId')x.required=kind==='stock';});
 document.querySelectorAll('[data-qc-tab]').forEach(b=>{const yes=b.dataset.qcTab===kind;b.setAttribute('aria-pressed',String(yes));b.classList.toggle('active',yes);});
 if(!f.elements.entryDate.value)f.elements.entryDate.value=stamp();
 if(kind==='expense')loadCategories();if(kind==='stock')void loadCompanies();
 notice('');dialog.showModal?.();if(!dialog.open)dialog.setAttribute('open','');
 setTimeout(()=>{(kind==='expense'?f.elements.amount:kind==='stock'&&loadedCompanies?$('sarniQcCompany'):f.elements.body)?.focus();},35);
}
function closePanel(){if(busy)return;if(dialog.open&&dialog.close)dialog.close();else dialog.removeAttribute('open');}
function loadCategories(){const select=$('sarniQcCategory'),old=select.value;
 let cats=[];try{cats=Array.isArray(state.expenseCategories)?state.expenseCategories:[];}catch{}
 select.replaceChildren(new Option('Choose category',''));cats.filter(c=>c&&c.active!==false).forEach(c=>{const name=String(c.name||c.Name||'').trim();if(name)select.add(new Option(name,name));});
 if([...select.options].some(x=>x.value===old))select.value=old;
 else if(cats.length===1)select.selectedIndex=1;
 loadSubcategories();
}
function loadSubcategories(){const sel=$('sarniQcSubcategory'),name=$('sarniQcCategory').value;
 const cats=Array.isArray(state.expenseCategories)?state.expenseCategories:[];
 const cat=cats.find(c=>String(c.name||c.Name)===name);let subs=cat?.subcategories||[];
 if(typeof subs==='string'){try{subs=JSON.parse(subs);}catch{subs=subs.split(',');}}
 if(!Array.isArray(subs))subs=[];const was=sel.value;sel.replaceChildren(new Option('None',''));
 subs.forEach(x=>{const v=String(typeof x==='string'?x:x?.name||'').trim();if(v)sel.add(new Option(v,v));});if([...sel.options].some(o=>o.value===was))sel.value=was;
}
async function loadCompanies(){try{const r=await api('dkList',{}, {retry:false});if(!r?.ok)throw Error(r?.message||'Unable to list companies');
 companies=(r.companies||[]).filter(c=>c?.id);const sel=$('sarniQcCompany'),old=sel.value;
 sel.replaceChildren(new Option('Choose a saved company',''));
 companies.forEach(c=>sel.add(new Option([c.name,c.symbol].filter(Boolean).join(' · '),c.id)));
 if([...sel.options].some(o=>o.value===old))sel.value=old;
 loadedCompanies=true;if(!companies.length)notice('Add a company once through More / Full Entry before saving a Stock Note.',true);
 }catch(e){notice('Unable to list stock companies: '+e.message,true);}}
async function save(e){e.preventDefault();if(busy||!signedIn())return;
 if(!f.reportValidity())return;
 if(navigator.onLine===false){notice('Offline: this quick form cannot confirm saving. Use Full Entry to save a local draft.',true);return;}
 busy=true;$('sarniQcSave').disabled=true;notice('Saving securely…');
 const owner=String(state.username||state.user?.username||'');
 try{let r;const date=f.elements.entryDate.value||stamp();
 if(kind==='expense'){
  r=await api('saveExpense',{record:{dateSpent:date,amount:Number(f.elements.amount.value),category:f.elements.category.value,subcategory:f.elements.subcategory.value,reason:f.elements.reason.value.trim(),debitedFrom:f.elements.debitedFrom.value.trim(),paidTo:f.elements.paidTo.value.trim(),notes:f.elements.expenseNotes.value.trim()}},{retry:false});
  if(r?.ok&&r.data){if(typeof applyBootstrap==='function')applyBootstrap(r.data);}
 }else{
  const body=f.elements.body.value.trim();if(!body)throw Error('Write a note first.');
  const title=f.elements.title.value.trim()||(kind==='diary'?'Diary entry':'Stock observation');
  r=await api('dkSave',{kind:kind==='stock'?'stock':'personal',record:{title,html:body.split('\n').map(s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')).join('<br>'),entryDate:date,companyId:kind==='stock'?f.elements.companyId.value:'',important:f.elements.important.checked,monthlyHighlight:f.elements.monthlyHighlight.checked,tags:f.elements.tags.value,visibility:'PRIVATE',entryType:'PERSONAL'}},{retry:false});
 }
 if(!r?.ok)throw Error(r?.message||'Could not confirm save.');
 if(owner!==String(state.username||state.user?.username||''))throw Error('Account changed during saving. Refresh the dashboard.');
 notice('✓ Saved '+(kind==='expense'?'expense':kind==='diary'?'diary':'stock note')+' successfully.');
 if(kind==='expense'){f.elements.amount.value='';f.elements.reason.value='';f.elements.expenseNotes.value='';}
 else{f.elements.title.value='';f.elements.body.value='';f.elements.important.checked=false;f.elements.monthlyHighlight.checked=false;}
 (kind==='expense'?f.elements.amount:f.elements.body).focus();
 }catch(err){notice('Not confirmed: '+String(err.message||err)+'. Check the register before retrying.',true);}
 finally{busy=false;$('sarniQcSave').disabled=false;}
}
function goDirect(route){closeMore();switch(route){
 case 'diary-history': window.SarniUnifiedDiary?.open('all','personal');break;
 case 'diary-new':window.SarniUnifiedDiary?.open('write','personal');break;
 case 'stock':window.SarniUnifiedDiary?.open('stock','stock');break;
 case 'wisdom':window.SarniUnifiedDiary?.open('wisdom','wisdom');break;
 case 'calendar':switchWorkspace('calendar');focus('standaloneCalendarGrid');break;
 case 'festivals':switchWorkspace('calendar');focus('sarniFestivalManager','#sarniFestivalNew');break;
 case 'reminder':switchWorkspace('calendar');const form=$('calendarEventForm');if(form?.elements?.kind)form.elements.kind.value='REMINDER';focus('calendarEventForm','[name="title"]');break;
 case 'target': if(typeof openStickyNote==='function')openStickyNote();else $('homeAddTargetBtn')?.click();break;
 case 'smartpaste': {const trigger=document.querySelector('[data-sarni-smartpaste-open]');if(trigger)trigger.click();else $('sarniSmartPasteDialog')?.showModal?.();break;}
 case 'credit':switchWorkspace('creditCards');focus('creditCardsSection');break;
 case 'expenses':switchWorkspace('expenditure');focus('lifeExpenseStudio');break;
 case 'experiences':switchWorkspace('experiences');focus('lifeExperienceList');break;
 case 'books':switchWorkspace('books');focus('booksSection');break;
 case 'notes':$('utilityDrawerOpenBtn')?.click();break;
 case 'admin': if(typeof isSarNiAdmin==='function'&&!isSarNiAdmin())return;switchWorkspace('adminSettings');focus('adminSettingsSection');break;
 }}
function install(){
 document.addEventListener('click',e=>{
 const dock=e.target.closest('#sarniMobileQuickAdd');if(dock){e.preventDefault();e.stopImmediatePropagation();openPanel('expense');return;}
 const q=e.target.closest('[data-sarni-qc]');if(q){e.preventDefault();e.stopImmediatePropagation();openPanel(q.dataset.sarniQc);return;}
 const direct=e.target.closest('#mobileMoreSheet [data-sarni-direct],#sarniMoreMenu [data-sarni-direct]');if(direct){e.preventDefault();e.stopImmediatePropagation();goDirect(direct.dataset.sarniDirect);}
 },true);
 // Small + panel always opens quick modal, not the full Diary/Expense page.
 $('sarniQcClose')?.addEventListener('click',closePanel);dialog.addEventListener('click',e=>{if(e.target===dialog)closePanel();});dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
 dialog.querySelectorAll('[data-qc-tab]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.qcTab)));
 $('sarniQcCategory')?.addEventListener('change',loadSubcategories);
 $('sarniQcFull')?.addEventListener('click',()=>{const k=kind;closePanel();if(k==='expense'){switchWorkspace('expenditure');focus('lifeExpenseMain','input[name="amount"]');}else{window.SarniUnifiedDiary?.open('write',k==='stock'?'stock':'personal');}});
 f.addEventListener('submit',save);
 // Add direct entries to desktop More menu, without removing its existing advanced options.
 const menu=$('sarniMoreMenu');if(menu&&!menu.querySelector('[data-sarni-direct]')){
   const extra=[['festivals','❀ Festivals'],['reminder','◷ Add Reminder'],['stock','▥ Stock Research'],['wisdom','✦ Investment Wisdom'],['diary-history','▤ Diary History'],['expenses','₹ Expense Register']];
   extra.forEach(([key,title])=>{const btn=document.createElement('button');btn.type='button';btn.dataset.sarniDirect=key;btn.textContent=title;menu.append(btn);});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.SarniQuickEntry={open:openPanel,direct:goDirect};
})();
