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
 <form id="sarniTargetInlineForm" class="sarni-target-inline" hidden>
   <div class="sarni-target-inline-heading"><strong id="sarniTargetInlineHeading">New Target</strong><button type="button" id="sarniTargetInlineCancel">✕ Cancel</button></div>
   <label>Title<input name="title" type="text" maxlength="120" required placeholder="What do you want to achieve?"/></label>
   <div class="sarni-target-inline-grid"><label>Due date (optional)<input name="dueDate" type="date"/></label><label>Type<select name="type"><option value="TARGET">Target</option><option value="REMINDER">Reminder</option></select></label></div>
   <label>Details (optional)<textarea name="details" rows="3" maxlength="5000" placeholder="Write details or important next actions"></textarea></label>
   <div class="sarni-target-inline-footer"><button type="submit" id="sarniTargetInlineSave">Save Target</button><span id="sarniTargetInlineStatus" role="status"></span></div>
 </form>
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
 .sarni-target-inline{display:grid;gap:10px;border:1px solid #cdc4f4;border-radius:14px;padding:15px;margin:12px 0;background:white}
 .sarni-target-inline[hidden]{display:none!important}
 .sarni-target-inline-heading,.sarni-target-inline-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
 .sarni-target-inline-heading strong{color:#49339e;font-size:17px}
 .sarni-target-inline-heading button{border:1px solid #ddd6f3;background:#fff;padding:8px 11px;border-radius:9px;cursor:pointer}
 .sarni-target-inline label{display:grid;gap:5px;font-weight:750;font-size:13px;color:#3b4660}
 .sarni-target-inline input,.sarni-target-inline textarea,.sarni-target-inline select{box-sizing:border-box;width:100%;min-height:42px;padding:9px 10px;border:1px solid #cfd8e8;border-radius:9px;font:inherit;background:#fff;color:#26334a}
 .sarni-target-inline-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
 .sarni-target-inline-footer button{background:#5e4aca;border:0;border-radius:10px;color:#fff;font-weight:800;padding:11px 20px;cursor:pointer}
 .sarni-target-inline-footer button:disabled{opacity:.55}
 #sarniTargetInlineStatus{font-size:12px;color:#66758f}
 @media(max-width:480px){.sarni-target-inline-grid{grid-template-columns:1fr}}
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
  document.dispatchEvent(new CustomEvent('sarni:target-workspace-rendered'));
 }
 function show(){open=true;sheet.hidden=false;sheet.style.display='block';nav.classList.add('active');nav.setAttribute('aria-current','page');if($('utilityDrawer')?.classList.contains('open'))$('utilityDrawerCloseBtn')?.click();render();}
 window.SarNiTargetsOpen=show;
 function close(){open=false;sheet.hidden=true;sheet.style.display='none';nav.classList.remove('active');nav.removeAttribute('aria-current');}
 nav.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();show();});
 $('sarniMobileTargetsBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const menu=$('sarniMoreMenu');if(menu)menu.hidden=true;show();});
 $('sarniTargetsClose').addEventListener('click',close);
 sheet.querySelectorAll('[data-sarni-target-tab]').forEach(btn=>btn.addEventListener('click',()=>{current=btn.dataset.sarniTargetTab;render();}));
 $('sarniTargetSearch').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();render();});
 const inline=$('sarniTargetInlineForm');
 function begin(type){
  if(!inline)return;
  inline.reset();inline.hidden=false;inline.elements.type.value=type;
  $('sarniTargetInlineHeading').textContent=type==='TARGET'?'New Target':'New Reminder';
  $('sarniTargetInlineSave').textContent=type==='TARGET'?'Save Target':'Save Reminder';
  $('sarniTargetInlineStatus').textContent='';
  inline.elements.title.focus();
  inline.scrollIntoView({block:'nearest',behavior:'smooth'});
 }
 $('sarniTargetInlineCancel').addEventListener('click',()=>{inline.hidden=true;inline.reset();});
 inline.addEventListener('submit',e=>{
  e.preventDefault();
  const form=$('stickyNoteForm');
  if(!form||!$('stickyNoteTitle')||!$('stickyNoteType')){
   $('sarniTargetInlineStatus').textContent='Existing backend form unavailable. Refresh and sign in again.';return;
  }
  const title=inline.elements.title.value.trim();
  if(!title){$('sarniTargetInlineStatus').textContent='Please enter a title.';return;}
  const prepared=window.SarniTargetStages?.prepareForSave?.()||
    {ok:true,text:inline.elements.details.value.trim()};
  if(!prepared.ok){
   $('sarniTargetInlineStatus').textContent=prepared.error||'Check all five stages before saving.';
   return;
  }
  form.reset();
  $('stickyNoteId').value=window.SarniTargetStages?.editingId||'';
  $('stickyNoteType').value=inline.elements.type.value;
  $('stickyNoteTitle').value=title;
  $('stickyNoteDueDate').value=inline.elements.dueDate.value;
  $('stickyNoteText').value=prepared.text;
  $('sarniTargetInlineSave').disabled=true;
  $('sarniTargetInlineStatus').textContent='Saving to SarNi…';
  // The existing authenticated listener handles saving, permission checks,
  // rerendering, and errors. Never create a second record-writing route.
  try{form.requestSubmit();}catch(err){$('sarniTargetInlineStatus').textContent='Save could not start: '+(err.message||err);$('sarniTargetInlineSave').disabled=false;return;}
  // Wait for the authenticated backend save result before reporting success.
  // The normal app sends the result event; errors stay visible for correction.
 });

 $('sarniTargetAdd').addEventListener('click',()=>begin('TARGET'));
 $('sarniReminderAdd').addEventListener('click',()=>begin('REMINDER'));
 document.addEventListener('click',e=>{
  if(!open)return;
  if(e.target.closest('#sarniTargetsWorkspace,#stickyNoteModal,#modalBackdrop,#sarniSidebarTargetsBtn'))return;
  if(e.target.closest('[data-section],.mobile-nav-item,.sarni-mobile-dock'))close();
 },true);
 document.addEventListener('keydown',e=>{if(open&&e.key==='Escape'&&$('modalBackdrop')?.classList.contains('hidden'))close();});
 document.addEventListener('sarni:sticky-rendered',()=>{if(open)render();});
 document.addEventListener('sarni:sticky-save-result',e=>{
  if(!open||inline.hidden)return;
  const save=$('sarniTargetInlineSave'),status=$('sarniTargetInlineStatus');
  save.disabled=false;
  if(e.detail?.ok){
   inline.hidden=true;
   inline.reset();
   if(window.SarniTargetStages)window.SarniTargetStages.editingId='';
   status.textContent='';
   render();
  }else{
   status.textContent=e.detail?.error||'Save was unsuccessful. Review the form and try again.';
  }
 });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();