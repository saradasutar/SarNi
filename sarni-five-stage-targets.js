(()=>{'use strict';
const $=id=>document.getElementById(id);
const A='[SARNI_TARGET_STAGES_V1]', Z='[/SARNI_TARGET_STAGES_V1]';
const defaults=['Planning','Preparation','Execution','Review','Completion'];
const fresh=()=>defaults.map(name=>({name,date:'',done:false,completedOn:'',remark:''}));
function decode(value){
 const t=String(value||''),p=t.indexOf(A),q=t.indexOf(Z,p+A.length);
 if(p<0||q<0)return {detail:t,stages:fresh(),structured:false};
 try{let x=JSON.parse(t.slice(p+A.length,q).trim());if(!Array.isArray(x)||x.length!==5)throw Error('Invalid');
 return {detail:(t.slice(0,p)+t.slice(q+Z.length)).trim(),stages:x.map((s,i)=>({name:String(s.name||defaults[i]),date:String(s.date||''),done:!!s.done,completedOn:String(s.completedOn||''),remark:String(s.remark||'')})),structured:true};
 }catch(e){return {detail:t,stages:fresh(),structured:false};}
}
window.SarniTargetStages={decode};
function boot(){
 const $form=$('sarniTargetInlineForm'),workspace=$('sarniTargetsWorkspace');
 if(!$form||!workspace)return;
 const node=document.createElement('div');node.id='sarniFiveStages';node.hidden=true;
 node.innerHTML='<div class="five-head"><strong>Five stages (20% each)</strong><span id="sarniFiveCount">0 / 5 · 0%</span></div><div class="five-scroll"><table><thead><tr><th>#</th><th>Stage / Work</th><th>Target date</th><th>Done</th><th>Completed date</th><th>Short remark</th></tr></thead><tbody id="sarniFiveBody"></tbody></table></div><div class="five-track"><span id="sarniFiveFill"></span></div>';
 $form.querySelector('.sarni-target-inline-footer').before(node);
 const css=document.createElement('style');
 css.textContent='#sarniFiveStages{background:#faf9ff;border:1px solid #d8d0f2;border-radius:12px;padding:12px}#sarniFiveStages[hidden]{display:none!important}#sarniFiveStages .five-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:13px;color:#5943a0;margin-bottom:8px}#sarniFiveStages .five-scroll{max-width:100%;overflow-x:auto}#sarniFiveStages table{min-width:720px;width:100%;border-collapse:collapse;background:white;font-size:12px}#sarniFiveStages td,#sarniFiveStages th{border:1px solid #e4e5ef;padding:7px;text-align:left}#sarniFiveStages th{background:#eeebf8}#sarniFiveStages input[type=text],#sarniFiveStages input[type=date]{width:100%;min-height:34px;font-size:12px;padding:5px}#sarniFiveStages input[type=checkbox]{width:20px;min-height:0;height:20px}#sarniFiveStages tr.done{background:#ecfbf2}#sarniFiveStages .five-track{background:#e4e0f1;border-radius:8px;height:9px;overflow:hidden;margin-top:10px}#sarniFiveFill{display:block;height:100%;background:#159b75;width:0}';
 document.head.append(css);
 let editId='';window.SarniTargetStages.editingId='';
 const now=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
 const trRows=()=>[...$('sarniFiveBody').children];
 function read(){return trRows().map(tr=>({name:tr.querySelector('[data-name]').value.trim(),date:tr.querySelector('[data-date]').value,done:tr.querySelector('[data-done]').checked,completedOn:tr.querySelector('[data-completed]').value,remark:tr.querySelector('[data-remark]').value.trim()}));}
 function update(){
  let n=0;for(const tr of trRows()){let checked=tr.querySelector('[data-done]').checked,done=tr.querySelector('[data-completed]');if(checked){n++;if(!done.value)done.value=now();}else done.value='';tr.classList.toggle('done',checked);}
  $('sarniFiveCount').textContent=n+' / 5 · '+n*20+'%';$('sarniFiveFill').style.width=n*20+'%';
 }
 function fill(rows){$('sarniFiveBody').replaceChildren();rows.forEach((r,i)=>{let tr=document.createElement('tr');tr.innerHTML='<td>'+(i+1)+'</td><td><input data-name type="text" maxlength="140" required></td><td><input data-date type="date"></td><td><input data-done type="checkbox" aria-label="Complete stage '+(i+1)+'"></td><td><input data-completed type="date"></td><td><input data-remark type="text" maxlength="220" placeholder="Optional remark"></td>';tr.querySelector('[data-name]').value=r.name;tr.querySelector('[data-date]').value=r.date;tr.querySelector('[data-done]').checked=r.done;tr.querySelector('[data-completed]').value=r.completedOn;tr.querySelector('[data-remark]').value=r.remark;$('sarniFiveBody').append(tr);});update();}
 function visibility(){node.hidden=$form.elements.type.value!=='TARGET';if(!node.hidden&&!trRows().length)fill(fresh());}
 $('sarniFiveBody').addEventListener('change',update);
 $form.elements.type.addEventListener('change',visibility);
 for(const id of ['sarniTargetAdd','sarniReminderAdd'])$(id)?.addEventListener('click',()=>{editId='';window.SarniTargetStages.editingId='';fill(fresh());visibility();});
 $('sarniTargetInlineCancel')?.addEventListener('click',()=>{editId='';window.SarniTargetStages.editingId='';node.hidden=true;});
 // Capture runs before the existing workspace submit handler. It adds the
 // stage table to the existing backend text payload and preserves note ID.
 $form.addEventListener('submit',event=>{
  if($form.elements.type.value!=='TARGET')return;
  const entries=read();
  if(entries.length!==5||entries.some(s=>!s.name)){event.preventDefault();event.stopImmediatePropagation();$('sarniTargetInlineStatus').textContent='Complete all five stage names.';return;}
  const detail=decode($form.elements.details.value).detail.trim();
  const packed=detail+(detail?'\n\n':'')+A+'\n'+JSON.stringify(entries)+'\n'+Z;
  if(packed.length>5000){event.preventDefault();event.stopImmediatePropagation();$('sarniTargetInlineStatus').textContent='Shorten the stage remarks to fit the saved note.';return;}
  $form.elements.details.value=packed;
  if(editId)$('stickyNoteId').value=editId;
 },true);
 // In the workspace, intercept target Edit and reuse the existing core
 // handler to load all original fields before opening the inline table.
 workspace.addEventListener('click',event=>{
  const btn=event.target.closest('.sticky-note-card.target [data-sticky-edit]');
  if(!btn)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  const id=btn.dataset.stickyEdit;
  const original=[...$('stickyNotesList').querySelectorAll('[data-sticky-edit]')].find(b=>b.dataset.stickyEdit===id);
  if(!original)return;
  original.click();
  const fields={id:$('stickyNoteId').value,type:$('stickyNoteType').value,title:$('stickyNoteTitle').value,due:$('stickyNoteDueDate').value,parsed:decode($('stickyNoteText').value)};
  $('modalBackdrop').classList.add('hidden');$('modalBackdrop').setAttribute('aria-hidden','true');$('stickyNoteModal').classList.add('hidden');
  $form.reset();$form.hidden=false;editId=fields.id;window.SarniTargetStages.editingId=editId;
  $form.elements.type.value=fields.type;$form.elements.title.value=fields.title;$form.elements.dueDate.value=fields.due;$form.elements.details.value=fields.parsed.detail;
  fill(fields.parsed.stages);visibility();$('sarniTargetInlineHeading').textContent='Edit Target';$('sarniTargetInlineSave').textContent='Save Target';$form.scrollIntoView({block:'nearest'});
 },true);

 const escapeHtml=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function decorate(root){
  if(!root)return;
  root.querySelectorAll('.sticky-note-card.target').forEach(card=>{
   const raw=card.querySelector('.sticky-full-text');
   if(!raw||card.querySelector('.sarni-stage-display'))return;
   const parsed=decode(raw.textContent);
   if(!parsed.structured)return;
   raw.style.display='none'; // retain original stage JSON for editing and Home summaries
   const done=parsed.stages.filter(s=>s.done).length;
   const wrap=document.createElement('div');wrap.className='sarni-stage-display';
   const rows=parsed.stages.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+escapeHtml(r.name)+'</td><td>'+escapeHtml(r.date||'—')+'</td><td>'+(r.done?'✓ Done':'Pending')+'</td><td>'+escapeHtml(r.completedOn||'—')+'</td><td>'+escapeHtml(r.remark||'')+'</td></tr>').join('');
   wrap.innerHTML=(parsed.detail?'<p class="sarni-stage-desc">'+escapeHtml(parsed.detail)+'</p>':'')+
    '<div class="sarni-stage-badge">'+done+' / 5 stages · '+done*20+'% complete</div>'+
    '<div class="sarni-stage-bar"><span style="width:'+(done*20)+'%"></span></div>'+
    '<details class="sarni-stage-details"><summary>View five stages</summary><div class="sarni-stage-table-scroll"><table><thead><tr><th>#</th><th>Stage</th><th>Target date</th><th>Status</th><th>Completed</th><th>Remark</th></tr></thead><tbody>'+rows+'</tbody></table></div></details>';
   raw.after(wrap);
  });
 }
 const displayStyle=document.createElement('style');
 displayStyle.textContent='.sarni-stage-display{margin:8px 0}.sarni-stage-desc{white-space:pre-wrap;font-size:12px;color:#5a6682}.sarni-stage-badge{font-size:12px;color:#493aa3;font-weight:800;margin:6px 0}.sarni-stage-bar{background:#e4e0f0;height:7px;border-radius:99px;overflow:hidden}.sarni-stage-bar span{display:block;height:100%;background:#18a27c}.sarni-stage-details{margin-top:9px}.sarni-stage-details summary{cursor:pointer;font-size:12px;font-weight:800;color:#6146a6}.sarni-stage-table-scroll{overflow-x:auto}.sarni-stage-details table{min-width:670px;width:100%;border-collapse:collapse;background:white;font-size:11px;margin-top:7px}.sarni-stage-details th,.sarni-stage-details td{border:1px solid #e0e5ed;padding:6px;white-space:normal}.sarni-stage-details th{background:#f2effb}';
 document.head.append(displayStyle);
 for(const id of ['stickyNotesList','sarniTargetRows']){
  const el=$(id);if(!el)continue;
  decorate(el);
  new MutationObserver(()=>decorate(el)).observe(el,{childList:true});
 }

}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();