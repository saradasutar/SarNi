/* SarNi — dedicated Targets & Reminders workspace.
 * Presentation only. Existing authenticated Sticky Note actions remain the sole
 * persistence mechanism; no new Sheets, Drive folders or local manuscript data. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current='TARGET',query='',open=false;
function start(){
 const nav=$('sarniSidebarTargetsBtn'),source=$('stickyNotesList');
 if(!nav||!source||$('sarniTargetsWorkspace'))return;
 const sheet=document.createElement('section');
 sheet.id='sarniTargetsWorkspace';sheet.hidden=true;
 sheet.setAttribute('aria-label','Manage Targets and Reminders');
 sheet.innerHTML=`<div class="sarni-target-header">
   <div><small>MY WORKSPACE</small><h2>◎ Target &amp; Reminder</h2><p>Create, review, complete and revisit your targets without managing sticky notes.</p></div>
   <button type="button" id="sarniTargetsClose" aria-label="Close Target and Reminder">✕ Close</button>
 </div>
 <div class="sarni-target-actions">
   <button type="button" id="sarniTargetAdd">＋ New Target</button>
   <button type="button" id="sarniReminderAdd">＋ New Reminder</button>
   <input id="sarniTargetSearch" type="search" placeholder="Search targets and reminders…" aria-label="Search targets and reminders"/>
 </div>
 <div class="sarni-target-stats" id="sarniTargetStats"></div>
 <div class="sarni-target-tabs" role="tablist" aria-label="Target workspace views">
  <button type="button" data-sarni-target-tab="TARGET">Active Targets</button>
  <button type="button" data-sarni-target-tab="REMINDER">Reminders</button>
  <button type="button" data-sarni-target-tab="DONE">Completed History</button>
 </div>
 <div id="sarniTargetRows" class="sarni-target-cards"></div>
 <p class="sarni-target-info">All entries are managed by your existing SarNi backend. Completed items remain in your recorded history.</p>`;
 document.body.append(sheet);
 const style=document.createElement('style');
 style.textContent=`
 #sarniTargetsWorkspace{position:fixed;z-index:75;top:65px;bottom:14px;left:clamp(205px,19vw,285px);right:14px;overflow-y:auto;background:#f7f9ff;border:1px solid #dce3f2;border-radius:20px;box-shadow:0 28px 80px #12204a30;padding:clamp(14px,2vw,24px);color:#24324b}
 #sarniTargetsWorkspace[hidden]{display:none!important}
 .sarni-target-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
 .sarni-target-header small{font-weight:800;letter-spacing:.12em;color:#6652a0}
 .sarni-target-header h2{font-size:clamp(23px,2.5vw,31px);margin:5px 0 3px;color:#1f2850}
 .sarni-target-header p{font-size:14px;color:#69778d;margin:0 0 14px;line-height:1.5}
 #sarniTargetsClose{border:1px solid #d4dcee;background:white;border-radius:10px;padding:10px 13px;color:#44516f;font-weight:700;cursor:pointer;white-space:nowrap}
 .sarni-target-actions{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin:12px 0}
 .sarni-target-actions button{border:0;border-radius:11px;padding:11px 14px;font-weight:800;background:#5e4aca;color:white;cursor:pointer}
 #sarniReminderAdd{background:#127e8b}
 #sarniTargetSearch{min-width:170px;flex:1;border:1px solid #ccd7ea;border-radius:11px;background:white;padding:11px;font-size:14px}
 .sarni-target-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:15px 0}
 .sarni-target-stat{background:#fff;border:1px solid #e0e5f4;padding:12px 15px;border-radius:13px}
 .sarni-target-stat strong{display:block;font-size:25px;color:#2d3387}
 .sarni-target-stat span{display:block;font-size:12px;color:#69778d;font-weight:750}
 .sarni-target-tabs{display:flex;gap:9px;flex-wrap:wrap;margin:16px 0}
 .sarni-target-tabs button{border:1px solid #dbe1f1;color:#4a5878;background:#fff;border-radius:10px;padding:10px 12px;font-weight:750;cursor:pointer}
 .sarni-target-tabs button[aria-selected="true"]{background:#eee9ff;border-color:#a997ec;color:#49309d}
 .sarni-target-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px}
 .sarni-target-cards>.sticky-note-card,.sarni-target-cards>.sticky-history-card{min-width:0;margin:0!important;position:relative!important;inset:auto!important;transform:none!important;width:auto!important;height:auto!important;max-width:none!important;background:#fff;border:1px solid #e0e6f1;border-radius:14px;padding:15px;box-shadow:0 4px 16px #1d315410;overflow-wrap:anywhere}
 .sarni-target-cards .sticky-note-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
 .sarni-target-cards .sticky-note-actions button{position:static!important;transform:none!important}
 .sarni-target-cards .sticky-pin-button{display:none!important}
 .sarni-target-cards .sticky-full-text{white-space:pre-wrap}
 .sarni-target-info{color:#71809a;font-size:12px;margin-top:18px}
 .sarni-target-empty{grid-column:1/-1;text-align:center;padding:35px 14px;background:#fff;border:1px dashed #cbd7e9;border-radius:14px;color:#62718d}
 @media(max-width:860px){#sarniTargetsWorkspace{inset:58px 7px 72px;border-radius:15px;padding:13px}.sarni-target-header h2{font-size:22px}.sarni-target-stats{gap:6px}.sarni-target-stat{padding:10px}.sarni-target-stat strong{font-size:21px}}
 @media(max-width:480px){.sarni-target-actions button{flex:1}.sarni-target-header{align-items:center}}
 `;
 document.head.append(style);
 function render(){
  if(!open)return;
  const targets=[],reminders=[];
  source.querySelectorAll('.sticky-note-card').forEach(el=>{
   const copy=el.cloneNode(true);
   (el.classList.contains('target')?targets:reminders).push(copy);
  });
  const targetHistory=Array.from(($('stickyTargetHistoryList')||document.createElement('div')).querySelectorAll('.sticky-history-card')).map(x=>x.cloneNode(true));
  const reminderHistory=Array.from(($('stickyReminderHistoryList')||document.createElement('div')).querySelectorAll('.sticky-history-card')).map(x=>x.cloneNode(true));
  $('sarniTargetStats').innerHTML=`<div class="sarni-target-stat"><strong>${targets.length}</strong><span>Active targets</span></div><div class="sarni-target-stat"><strong>${reminders.length}</strong><span>Reminders</span></div><div class="sarni-target-stat"><strong>${targetHistory.length+reminderHistory.length}</strong><span>Completed</span></div>`;
  sheet.querySelectorAll('[data-sarni-target-tab]').forEach(btn=>{const selected=btn.dataset.sarniTargetTab===current;btn.setAttribute('aria-selected',String(selected));});
  const rows=(current==='TARGET'?targets:current==='REMINDER'?reminders:[...targetHistory,...reminderHistory]).filter(node=>node.textContent.toLowerCase().includes(query));
  const root=$('sarniTargetRows');root.replaceChildren();
  if(!rows.length)root.innerHTML='<div class="sarni-target-empty">No matching entries. Create a new target or choose another view.</div>';
  else root.append(...rows);
 }
 function show(){open=true;sheet.hidden=false;sheet.style.display='block';nav.classList.add('active');nav.setAttribute('aria-current','page');if($('utilityDrawer')?.classList.contains('open'))$('utilityDrawerCloseBtn')?.click();render();}
 window.SarNiTargetsOpen=show;
 function close(){open=false;sheet.hidden=true;sheet.style.display='none';nav.classList.remove('active');nav.removeAttribute('aria-current');}
 nav.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();show();});
 $('sarniMobileTargetsBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const menu=$('sarniMoreMenu');if(menu)menu.hidden=true;show();});
 $('sarniTargetsClose').addEventListener('click',close);
 sheet.querySelectorAll('[data-sarni-target-tab]').forEach(btn=>btn.addEventListener('click',()=>{current=btn.dataset.sarniTargetTab;render();}));
 $('sarniTargetSearch').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();render();});
 function begin(type){
  const backdrop=$('modalBackdrop'),modal=$('stickyNoteModal'),form=$('stickyNoteForm');
  if(!backdrop||!modal||!form){
   alert('The Target & Reminder form is unavailable. Please refresh SarNi and sign in again.');
   return;
  }
  // The management workspace is a fixed overlay. Hide it while editing, so
  // it cannot cover the modal or intercept clicks in different layout modes.
  sheet.style.display='none';
  const input=$('stickyNoteId');if(input)input.value='';
  form.reset();
  const select=$('stickyNoteType');if(select)select.value=type;
  const title=$('stickyNoteModalTitle');if(title)title.textContent=type==='TARGET'?'New Target':'New Reminder';
  const save=$('saveStickyNoteBtn');if(save)save.textContent=type==='TARGET'?'Save Target':'Save Reminder';
  backdrop.classList.remove('hidden');
  backdrop.setAttribute('aria-hidden','false');
  backdrop.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));
  modal.classList.remove('hidden');
  requestAnimationFrame(()=>$('stickyNoteTitle')?.focus());
 }
 const backdrop=$('modalBackdrop');
 if(backdrop){
  new MutationObserver(()=>{
   if(open&&backdrop.classList.contains('hidden'))sheet.style.display='block';
  }).observe(backdrop,{attributes:true,attributeFilter:['class']});
 }
 $('sarniTargetAdd').addEventListener('click',()=>begin('TARGET'));
 $('sarniReminderAdd').addEventListener('click',()=>begin('REMINDER'));
 document.addEventListener('click',e=>{
  if(!open)return;
  if(e.target.closest('#sarniTargetsWorkspace,#stickyNoteModal,#modalBackdrop,#sarniSidebarTargetsBtn'))return;
  if(e.target.closest('[data-section],.mobile-nav-item,.sarni-mobile-dock'))close();
 },true);
 document.addEventListener('keydown',e=>{if(open&&e.key==='Escape'&&$('modalBackdrop')?.classList.contains('hidden'))close();});
 const observer=new MutationObserver(()=>{if(open)render();});
 ['stickyNotesList','stickyTargetHistoryList','stickyReminderHistoryList'].forEach(id=>{const el=$(id);if(el)observer.observe(el,{childList:true,subtree:false});});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();