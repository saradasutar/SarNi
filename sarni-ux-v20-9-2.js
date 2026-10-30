/* SarNi UX 20.9.2 — collapsible reports, progressive disclosure, notifications and quick expense.
   Never stores credentials, does not call external services and does not change data APIs. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const safeText=el=>String(el?.textContent||'').trim();
function nav(section){const b=document.querySelector('#sarniSidebarPrimary button[data-section="'+section+'"]');if(b)b.click();}
function installExpense(){
 const form=$('expenseForm');if(!form||form.dataset.sarni209)return;
 form.dataset.sarni209='1';
 // Optional detail fields remain fully functional, including editing, printing and preplans.
 const extra=document.createElement('details');extra.id='sarniExpenseMoreDetails';extra.className='sarni-expense-extra';
 extra.innerHTML='<summary>More details <span>Subcategory · Project · Notes</span></summary>';
 const fields=[$('expenseSubcategory')?.closest('label'),$('expenseMajorProjectGroup'),$('expenseNotes')?.closest('label')];
 for(const field of fields)if(field)extra.appendChild(field);
 const buttons=form.querySelector('.form-actions');if(buttons)form.insertBefore(extra,buttons);else form.appendChild(extra);
 const btn=$('saveExpenseBtn');if(btn)btn.textContent='Save expense';
 const hero=$('lifeExpenseStudio')?.querySelector('.life-section-title');
 if(hero&&!$('sarniExpenseFastBtn')){
  const quick=document.createElement('button');quick.id='sarniExpenseFastBtn';quick.className='primary-button sarni-expense-fast';
  quick.type='button';quick.textContent='＋ Quick Expense';
  quick.addEventListener('click',()=>{nav('expenditure');const b=document.querySelector('[data-expense-add="ACTUAL"],#addActualExpenseBtn,#addExpenseBtn,#expenseAddBtn');if(b)b.click();else if(typeof window.SarniQuickExpenseOpen==='function')window.SarniQuickExpenseOpen();else document.querySelector('.expense-hero-actions button')?.click();});
  hero.appendChild(quick);
 }
}
function installNotice(){const root=document.querySelector('.top-actions');if(!root||$('sarniNoticeBtn'))return;
 const box=document.createElement('div');box.className='sarni-notice-wrap';
 box.innerHTML='<button id="sarniNoticeBtn" class="sarni-notice-button" aria-label="Notifications and reminders" title="Notifications and reminders" aria-haspopup="dialog" aria-expanded="false">♢ <span class="sarni-notice-count" hidden></span></button><div id="sarniNoticePanel" class="sarni-notice-panel" hidden role="dialog" aria-label="SarNi notifications"><div class="sarni-notice-head"><strong>Notifications</strong><button type="button" id="sarniNoticeClose" aria-label="Close notifications">×</button></div><div id="sarniNoticeItems"></div><div class="sarni-notice-footer">Notices are based on your existing SarNi records. Email alerts remain controlled by Calendar settings.</div></div>';
 root.insertBefore(box,root.firstChild);
 const btn=$('sarniNoticeBtn'),panel=$('sarniNoticePanel');
 function toggle(open){panel.hidden=!open;btn.setAttribute('aria-expanded',String(open));if(open)update();}
 btn.addEventListener('click',()=>toggle(panel.hidden));$('sarniNoticeClose').addEventListener('click',()=>toggle(false));
 document.addEventListener('click',e=>{if(!box.contains(e.target)&&!panel.hidden)toggle(false);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')toggle(false);});
 function update(){const items=[],expense=safeText($('expenseRegularDueCount')),planned=safeText($('expensePlannedCount'));
  const num=s=>Number((s.match(/\d+/)||[])[0]||0);
  if(num(expense))items.push({text:expense+' regular payment(s) due in 30 days',section:'expenditure'});
  if(num(planned))items.push({text:planned+' preplanned expense(s) pending',section:'expenditure'});
  const count=items.length,badge=box.querySelector('.sarni-notice-count');badge.hidden=!count;badge.textContent=String(count);
  $('sarniNoticeItems').innerHTML='';
  if(!count){const p=document.createElement('p');p.className='sarni-notice-empty';p.textContent='No expense notices currently. Open Calendar to view important dates and reminders.';$('sarniNoticeItems').append(p);}
  for(const item of items){const b=document.createElement('button');b.type='button';b.textContent=item.text;b.addEventListener('click',()=>{toggle(false);nav(item.section);});$('sarniNoticeItems').append(b);}
  const c=document.createElement('button');c.type='button';c.textContent='◷ Open Calendar & reminders';c.addEventListener('click',()=>{toggle(false);nav('calendar');});$('sarniNoticeItems').append(c);
 }
 update();setInterval(()=>{if(!panel.hidden)update();},20000);
}
/* Accessible collapsible sections: preserve existing charts, forms, IDs, and event handlers.
   Only the expanded/collapsed flag is stored locally; no personal or finance data. */
function installCollapsible(){
 const settings=[
  {id:'sarniDetailedExpenseStatement',key:'records',title:'Expense register · Search, edit & print',desc:'Open when you want to review saved transactions',expanded:false},
  {id:'peopleExpenseModule',key:'people',title:'Expenses by user',desc:'Person-wise spending report',expanded:false},
  {selector:'#lifeMonthlyTrend',key:'trend',title:'Monthly spending trend',desc:'Long-term history and comparisons',expanded:false}
 ];
 let saved={};try{saved=JSON.parse(localStorage.getItem('sarni_panel_preferences_v2092')||'{}')||{};}catch(e){}
 const save=()=>{try{localStorage.setItem('sarni_panel_preferences_v2092',JSON.stringify(saved));}catch(e){}};
 const built=[];
 function add(cfg){
  const el=cfg.id?$(cfg.id):document.querySelector(cfg.selector)?.closest('article.life-card');
  if(!el||el.dataset.sarniCollapseReady)return;
  el.dataset.sarniCollapseReady='1';
  const body=document.createElement('div');body.className='sarni-collapse-body';body.id='sarniCollapseBody-'+cfg.key;
  while(el.firstChild)body.appendChild(el.firstChild);
  const header=document.createElement('div');header.className='sarni-collapse-head';
  const btn=document.createElement('button');btn.className='sarni-collapse-toggle';btn.type='button';btn.setAttribute('aria-controls',body.id);
  btn.innerHTML='<span class="sarni-collapse-heading"></span><span class="sarni-collapse-chevron" aria-hidden="true">⌄</span>';
  const title=btn.querySelector('.sarni-collapse-heading');
  const label=document.createElement('strong');label.textContent=cfg.title;
  const sub=document.createElement('small');sub.textContent=cfg.desc;
  title.append(label,sub);header.append(btn);el.append(header,body);
  el.classList.add('sarni-collapsible');
  const set=open=>{el.classList.toggle('sarni-collapsed',!open);btn.setAttribute('aria-expanded',String(open));body.hidden=!open;saved[cfg.key]=!!open;save();if(open){requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));}};
  btn.addEventListener('click',()=>set(body.hidden));
  set(Object.prototype.hasOwnProperty.call(saved,cfg.key)?saved[cfg.key]:cfg.expanded);
  built.push({cfg,set});
 }
 settings.forEach(add);
 const records=built.find(x=>x.cfg.key==='records');
 function showRecords(){if(records)records.set(true);}
 // Support existing tab and shortcut buttons without replacing their original click handlers.
 ['sarniDetailedMode','mobileExpenseRecordsBtn'].forEach(id=>$(id)?.addEventListener('click',showRecords));
 // Expense Insights already uses native <details>: remember its state; don't add double collapses.
 const charts=$('sarniExpenseChartsDetails');if(charts&&!charts.dataset.sarniCollapseReady){
  charts.dataset.sarniCollapseReady='1';charts.open=!!saved.charts;
  charts.addEventListener('toggle',()=>{saved.charts=!!charts.open;save();});
 }
 // Give the user quick access to all optional reports from the main expenditure header.
 const hero=$('lifeExpenseStudio')?.querySelector('.life-section-title');
 if(hero&&!$('sarniShowReports')){
  const btn=document.createElement('button');btn.id='sarniShowReports';btn.type='button';btn.className='sarni-reports-shortcut';btn.textContent='▤ Show / hide reports';
  btn.addEventListener('click',()=>{
   const open=built.some(x=>['records','trend','people'].includes(x.cfg.key)&&($('sarniCollapseBody-'+x.cfg.key)?.hidden));
   for(const item of built){if(['records','trend','people'].includes(item.cfg.key))item.set(open);}
   if(charts)charts.open=open;
  });
  hero.append(btn);
 }
}
function install(){installExpense();installNotice();installCollapsible();document.documentElement.classList.add('sarni-ux-2091','sarni-ux-2092');}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
