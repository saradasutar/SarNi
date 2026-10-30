/* SarNi UX 20.9.1 — progressive disclosure, notifications and quick expense.
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
function install(){installExpense();installNotice();document.documentElement.classList.add('sarni-ux-2091');}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
