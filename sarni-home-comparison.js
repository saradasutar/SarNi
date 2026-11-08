(()=>{'use strict';
const $=id=>document.getElementById(id),e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>Math.max(0,Number(x)||0),fmt=x=>num(x).toLocaleString('en-IN');
function boot(){
 const root=$('sarniHomeBookGlance'),source=$('stickyNotesList');
 if(!root||!source||$('sarniHomeBookRows'))return;
 const booksDiv=document.createElement('div');booksDiv.id='sarniHomeBookRows';booksDiv.className='sarni-comparison-list';
 root.querySelector('.sarni-home-writing-head').after(booksDiv);
 const targetDiv=document.createElement('section');targetDiv.id='sarniHomeTargetRowsPanel';targetDiv.className='sarni-targets-home';
 targetDiv.innerHTML='<div class="sch-head"><div><small>YOUR PROGRESS</small><h3>Targets &amp; Reminders</h3></div><button type="button" id="sarniCompareManage">Manage →</button></div><div class="sch-stats" id="sarniCompareStats"></div><div class="sarni-comparison-list" id="sarniCompareTargets"></div>';
 root.after(targetDiv);
 const css=document.createElement('style');css.textContent='.sarni-comparison-list{display:grid;gap:9px;margin:12px 0}.sch-row{border:1px solid #e0e5f0;background:#fff;border-radius:12px;padding:11px 13px}.sch-rowhead,.sch-foot,.sch-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.sch-rowhead strong{color:#253657}.sch-rowhead button,.sch-head button{border:1px solid #d6ccf1;background:#f7f4ff;color:#6245a0;border-radius:8px;padding:7px 10px;font-weight:800;cursor:pointer}.sch-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:9px 0}.sch-grid div{background:#f1f4fd;border-radius:8px;text-align:center;padding:8px 5px}.sch-grid div:nth-child(2){background:#eef9ff}.sch-grid div:nth-child(3){background:#fff6e7}.sch-grid div:nth-child(4){background:#edf9f2}.sch-grid strong,.sch-grid small{display:block;overflow-wrap:anywhere}.sch-grid small{font-size:10px;color:#687993}.sch-grid strong{font-size:16px;color:#293b55}.sch-track{height:7px;background:#e7e4f0;border-radius:20px;overflow:hidden;margin-top:7px}.sch-track span{display:block;height:100%;background:#6b58cb}.sch-foot{font-size:11px;color:#71809b;margin-top:6px}.sarni-targets-home{padding:14px;border:1px solid #dce5f2;background:#fafbff;border-radius:15px;margin:13px 0}.sch-head h3{font-size:19px;margin:3px 0;color:#293b55}.sch-head small{font-size:10px;color:#7359b1;font-weight:850;letter-spacing:.1em}.sch-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 0}.sch-stats div{background:white;border:1px solid #e6e8f1;border-radius:10px;padding:9px}.sch-stats strong{display:block;font-size:21px;color:#493aa3}.sch-stats small{font-size:10px;color:#78859a}.sch-overdue{border-left:4px solid #c43d57}.sch-empty{color:#77869a;font-size:12px}@media(max-width:620px){.sch-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sch-row{padding:10px}}';
 document.head.append(css);
 const progressCss=document.createElement('style');
 progressCss.textContent='.sch-target-card{border-left:4px solid #7357c7}.sch-target-card.sch-overdue{border-left-color:#c43d57}.sch-stages{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin:10px 0 7px}.sch-stage{min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10px;color:#738097;text-align:center}.sch-stage-dot{width:100%;height:7px;border-radius:9px;background:#e5e5f0}.sch-stage.is-done .sch-stage-dot{background:#16a57c}.sch-stage.is-next .sch-stage-dot{background:#e4a23c}.sch-stage-label{font-size:10px;font-weight:760;color:#5d6685;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.sch-target-card .sch-progress-note{font-size:11px;color:#71809a;margin-top:7px}.sch-target-card .sch-rowhead strong{flex:1;min-width:0}.sch-target-card .sch-rowhead .sch-pct{font-size:13px;font-weight:850;color:#6546ad}';
 document.head.append(progressCss);
 const nextCss=document.createElement('style');
 nextCss.textContent='.sch-home-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:7px;margin-top:9px}.sch-home-actions button{border:1px solid #d8cef0;border-radius:8px;background:#f7f4ff;color:#5f45a0;padding:7px 10px;font-size:11px;font-weight:800;cursor:pointer}.sch-home-actions button:focus-visible,.sch-home-actions summary:focus-visible{outline:2px solid #6b52cc;outline-offset:3px}.sch-home-details{margin-top:8px;border-top:1px solid #ecedf6;padding-top:8px}.sch-home-details summary{cursor:pointer;font-size:12px;color:#5b478f;font-weight:800}.sch-home-stage{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:7px;align-items:start;padding:7px 0;border-bottom:1px solid #f0edf7;font-size:12px}.sch-home-stage:last-child{border-bottom:0}.sch-home-stage .is-complete{color:#13805d}.sch-home-stage .is-pending{color:#ba862b}.sch-home-stage small{color:#687792;font-size:11px}.sch-home-stage .sch-home-remark{grid-column:2/-1;line-height:1.4;color:#65738a}.sch-home-due{white-space:nowrap}.sch-home-actions button[disabled]{opacity:.5;cursor:default}';
 document.head.append(nextCss);

 let items=[];
 function paintBooks(){
  if(!items.length){booksDiv.innerHTML='<p class="sch-empty">Saved book progress will appear after sign-in.</p>';return;}
  booksDiv.innerHTML=items.filter(x=>x?.id&&x.active!==false).map(b=>{
   const words=num(b.totalWordCount),target=num(b.targetWordCount),pct=target?Math.min(100,Math.round(words/target*100)):null;
   const d=new Date(b.latestChapterAt||b.updatedAt||b.lastUpdatedAt||'');const recent=Number.isFinite(d.getTime())?d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—';
   return '<article class="sch-row"><div class="sch-rowhead"><strong>'+e(b.title||'Untitled book')+'</strong><button type="button" data-sch-open="'+e(b.id)+'">Open ↗</button></div><div class="sch-grid"><div><small>Chapters done</small><strong>'+fmt(b.doneChapterCount)+' / '+fmt(b.chapterCount)+'</strong></div><div><small>Written words</small><strong>'+fmt(words)+'</strong></div><div><small>Word target</small><strong>'+(target?fmt(target):'Not set')+'</strong></div><div><small>Last updated</small><strong>'+e(recent)+'</strong></div></div><div class="sch-track"><span style="width:'+(pct||0)+'%"></span></div><div class="sch-foot"><span>'+(pct===null?'Set word target in Book Writing':pct+'% of word target')+'</span><span>'+e(b.status||'')+'</span></div></article>';
  }).join('')||'<p class="sch-empty">No active books found.</p>';
  root.classList.add('sch-ready');
 }
 const second=document.createElement('style');second.textContent='#sarniHomeBookGlance.sch-ready .sarni-home-writing-grid,#sarniHomeBookGlance.sch-ready .sarni-home-writing-progress,#sarniHomeBookGlance.sch-ready .sarni-home-writing-actions{display:none!important}';document.head.append(second);
 async function load(){try{let api=window.SarniHomeBookApi;if(!api?.load)return;let x=await api.load(false);if(Array.isArray(x)){items=x;paintBooks();}}catch(err){booksDiv.innerHTML='<p class="sch-empty">Book summaries unavailable; please check Book Writing.</p>';}}
 booksDiv.addEventListener('click',ev=>{const btn=ev.target.closest('[data-sch-open]');if(btn)window.SarniHomeBookApi?.open?.(btn.dataset.schOpen);});
 function renderTargets(){
  const cards=[...source.querySelectorAll('.sticky-note-card')],targets=cards.filter(x=>x.classList.contains('target')),reminders=cards.filter(x=>!x.classList.contains('target'));
  const dec=window.SarniTargetStages?.decode,now=new Date(),today=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  const models=targets.map(card=>{
   const raw=card.querySelector('.sticky-full-text')?.textContent||'',parsed=dec?.(raw),rows=parsed?.structured?parsed.stages:null;
   const done=rows?rows.filter(x=>x.done).length:0,next=rows?.find(x=>!x.done),due=next?.date||'';
   return {id:card.querySelector('[data-sticky-edit]')?.dataset.stickyEdit||'',title:card.querySelector('h4')?.textContent||'Target',rows,done,next,due,overdue:!!due&&due<today};
  });
  $('sarniCompareStats').innerHTML='<div><strong>'+models.length+'</strong><small>Active targets</small></div><div><strong>'+models.filter(x=>x.overdue).length+'</strong><small>Overdue stages</small></div><div><strong>'+reminders.length+'</strong><small>Reminders</small></div>';
  const out=$('sarniCompareTargets');out.replaceChildren();
  for(const t of models){
   const pct=t.rows?t.done*20:0,card=document.createElement('article');
   card.className='sch-row sch-target-card'+(t.overdue?' sch-overdue':'');
   const marks=t.rows?t.rows.map((stage,i)=>{
    const next=!stage.done&&t.next===stage;
    const className=stage.done?' is-done':next?' is-next':'';
    const label=stage.name||'Stage '+(i+1);
    return '<div class="sch-stage'+className+'" title="'+e(label)+'"><span class="sch-stage-dot"></span><span class="sch-stage-label">'+(i+1)+'</span></div>';
   }).join(''):'';
   const nextTitle=t.next?.name||(!t.rows?'Set up the five achievements':'All achievements completed');
   card.innerHTML='<div class="sch-rowhead"><strong>'+e(t.title)+'</strong><span class="sch-pct">'+(t.rows?pct+'%':'Not started')+'</span></div>'+
    (marks?'<div class="sch-stages" aria-label="'+t.done+' out of five stages completed">'+marks+'</div>':'')+
    '<div class="sch-track"><span style="width:'+pct+'%"></span></div>'+
    '<div class="sch-foot"><span>Next achievement: '+e(nextTitle)+'</span><span>'+(t.due?(t.overdue?'Overdue · ':'Due · ')+e(t.due):'No stage due date')+'</span></div>'+
    (!t.rows?'<div class="sch-progress-note">Open Target & Reminder to add five stages.</div>':'')+
    (t.rows?'<details class="sch-home-details"><summary>View all five achievements</summary>'+t.rows.map((stage,i)=>'<div class="sch-home-stage"><span class="'+(stage.done?'is-complete':'is-pending')+'">'+(stage.done?'✓':(i+1))+'</span><span>'+e(stage.name||'Achievement '+(i+1))+'</span><small class="sch-home-due">'+e(stage.date||'No date')+'</small>'+(stage.done&&stage.remark?'<small class="sch-home-remark">Achievement remark: '+e(stage.remark)+'</small>':'')+'</div>').join('')+'</details>':'')+
    '<div class="sch-home-actions"><button type="button" data-sch-target-edit="'+e(t.id)+'" '+(!t.id?'disabled':'')+'>✎ Update progress</button></div>';
   out.append(card);
  }
  for(const c of reminders.slice(0,3)){
   const card=document.createElement('article');card.className='sch-row';card.innerHTML='<div class="sch-rowhead"><strong>'+e(c.querySelector('h4')?.textContent||'Reminder')+'</strong><span>Reminder</span></div><div class="sch-foot">'+e(c.querySelector('.sticky-due')?.textContent||'')+'</div>';out.append(card);
  }
  if(!out.children.length)out.innerHTML='<p class="sch-empty">No active targets or reminders to show.</p>';
 }
 $('sarniCompareManage').addEventListener('click',()=>window.SarNiTargetsOpen?.());
 $('sarniCompareTargets').addEventListener('click',event=>{
  const btn=event.target.closest('[data-sch-target-edit]');
  if(!btn)return;
  const id=btn.dataset.schTargetEdit;
  if(!id)return;
  const original=[...source.querySelectorAll('[data-sticky-edit]')].find(el=>el.dataset.stickyEdit===id);
  if(!original){window.SarNiTargetsOpen?.();return;}
  window.SarNiTargetsOpen?.();
  const tab=document.querySelector('#sarniTargetsWorkspace [data-sarni-target-tab="TARGET"]');
  tab?.click();
  const edit=[...document.querySelectorAll('#sarniTargetRows [data-sticky-edit]')].find(el=>el.dataset.stickyEdit===id);
  if(edit)edit.click();
 });
 new MutationObserver(renderTargets).observe(source,{childList:true});
 document.addEventListener('sarni:home-visible',()=>{load();renderTargets();});
 document.addEventListener('sarni:home-books-updated',()=>{let rows=window.SarniHomeBookApi?.peek?.();if(Array.isArray(rows)){items=rows;paintBooks();}});
 const app=$('appView'),home=$('overviewSection');
 if(app&&!app.classList.contains('hidden')&&home&&!home.classList.contains('hidden')){load();renderTargets();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();