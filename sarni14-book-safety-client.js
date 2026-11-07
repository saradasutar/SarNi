/* SarNi Book Safety — progressive feature activation.
   Only uses revision/autosave actions when the authorized Apps Script backend confirms support.
   Server drafts never overwrite the published chapter. Manual Save remains explicit. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
function init(){
 const modal=$('chapterModal'),editor=$('chapterContent'),title=$('chapterTitle');
 if(!modal||!editor||!title||$('sarni14SafetyTools'))return;
 const style=document.createElement('style');
 style.textContent='#sarni14SafetyTools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0;padding:11px;background:#f5f8ff;border:1px solid #dce3f4;border-radius:12px;color:#3b567f;font:650 12px/1.5 system-ui}#sarni14SafetyTools button,#sarni14SafetyPanel button{border:1px solid #aebfdd;border-radius:9px;min-height:36px;padding:7px 11px;background:#fff;color:#294a82;font-weight:750;cursor:pointer}#sarni14SafetyTools button:disabled{opacity:.48;cursor:not-allowed}#sarni14SaveStatus{margin-right:auto}#sarni14SafetyPanel{border:1px solid #d9e0ed;border-radius:12px;background:#fbfcff;padding:12px;display:grid;gap:9px;margin:8px 0;font:13px/1.55 system-ui;color:#3b4d6d}#sarni14SafetyPanel[hidden]{display:none!important}#sarni14SafetyPanel .s14entry{border:1px solid #e4e7f0;background:#fff;padding:10px;border-radius:9px;display:flex;justify-content:space-between;gap:9px;align-items:center;flex-wrap:wrap}#sarni14SafetyPanel small{display:block;color:#697892;font-size:11px}#sarni14SafetyPanel button{min-height:33px}#sarni14SafetyStatus[data-state=error]{color:#9b3447}#sarni14SafetyStatus[data-state=ready]{color:#227454}@media(max-width:560px){#sarni14SafetyTools button{flex:1 1 auto}#sarni14SaveStatus{flex-basis:100%}}';
 document.head.append(style);
 const tools=document.createElement('div');tools.id='sarni14SafetyTools';
 tools.innerHTML='<span id="sarni14SaveStatus" role="status">Safety check runs when a chapter opens.</span><button type="button" id="sarni14SaveDraft" disabled>Save cloud draft</button><button type="button" id="sarni14BrowseDrafts" disabled>Cloud drafts</button><button type="button" id="sarni14Revisions" disabled>Revision history</button>';
 const target=$('sarni12Toolbar')||$('sarni11WriterTools')||editor;target.before(tools);
 const panel=document.createElement('div');panel.id='sarni14SafetyPanel';panel.hidden=true;tools.after(panel);
 const notice=$('sarni14SaveStatus'),saveDraftBtn=$('sarni14SaveDraft'),draftBtn=$('sarni14BrowseDrafts'),revBtn=$('sarni14Revisions');
 let currentBook='',currentChapter='',draftKey='',enabled=false,visible=false,requestEpoch=0,changeEpoch=0,lastSyncedEpoch=-1,timer=null,inFlight=false,queued=false,needsBackup=false,cloudCopyExists=false;
 const msg=(t,state)=>{notice.textContent=t;notice.dataset.state=state||'';};
 const canEdit=()=>editor.contentEditable!=='false';
 const context=()=>{
  const bookId=$('chapterBookId')?.value||'',chapterId=$('chapterId')?.value||'';
  return {bookId,chapterId,title:title.value.trim(),status:$('chapterStatus')?.value||'DRAFTING',notes:$('chapterNotes')?.value||'',content:editor.innerHTML,baseUpdatedAt:editor.dataset.baseUpdatedAt||''};
 };
 function randomId(){return 'session-'+(crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(18)),x=>x.toString(16).padStart(2,'0')).join(''));}
 const showPanel=(text)=>{panel.hidden=false;panel.replaceChildren();if(text){const p=document.createElement('div');p.textContent=text;panel.append(p);}};
 const button=(text,callback)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=callback;return b;};
 function updateButtons(){const okay=enabled&&canEdit();saveDraftBtn.disabled=!okay;draftBtn.disabled=!enabled;revBtn.disabled=!enabled||!currentChapter;}
 async function probe(){
  const my=++requestEpoch;
  const c=context();enabled=false;currentBook=c.bookId;currentChapter=c.chapterId;draftKey=randomId();changeEpoch=0;lastSyncedEpoch=-1;cloudCopyExists=false;needsBackup=false;panel.hidden=true;updateButtons();
  if(!currentBook||typeof api!=='function'){msg('Normal chapter saving is available; cloud history not connected.');return;}
  msg('Checking secure book backup service…');
  try{
   const r=await api('sarniBookSafetyStatus',{bookId:currentBook});
   if(my!==requestEpoch||!visible||context().bookId!==currentBook)return;
   enabled=r?.enabled===true&&r?.ok===true;
   msg(enabled?'Protected writing enabled · automatic cloud drafts':'Standard saving only · backup not activated',enabled?'ready':'');
  }catch(e){
   if(my!==requestEpoch||!visible)return;
   enabled=false;msg('Standard saving only · deploy the Book Safety backend to enable cloud autosave');
  }
  updateButtons();
 }
 async function sendDraft(force){
  if(!visible||!enabled||!canEdit())return;
  const c=context();if(!c.bookId||!c.title)return msg('Enter a chapter title for cloud backup');
  if(c.content.length>42000)return msg('Chapter too long for cloud draft; export the chapter','error');
  if(inFlight){queued=true;return;}
  if(!force&&lastSyncedEpoch===changeEpoch)return;
  const epoch=changeEpoch;inFlight=true;queued=false;
  msg('Saving separate cloud draft…');
  try{
   const r=await api('sarniBookDraftSave',{bookId:c.bookId,draft:{draftKey,chapterId:c.chapterId,title:c.title,status:c.status,content:c.content,notes:c.notes,baseUpdatedAt:c.baseUpdatedAt}});
   if(!r?.ok)throw Error('Backend did not confirm draft');
   cloudCopyExists=true;lastSyncedEpoch=epoch;
   if(visible&&epoch===changeEpoch)msg('Cloud draft secured at '+new Date().toLocaleTimeString(),'ready');
   else if(visible)msg('New edits pending · earlier cloud draft saved');
  }catch(e){
   if(visible)msg('Cloud draft not confirmed. Save chapter or export text. '+String(e.message||e).slice(0,130),'error');
  }finally{
   inFlight=false;
   if(queued&&visible&&changeEpoch!==lastSyncedEpoch){queued=false;schedule(2500);}
  }
 }
 function schedule(ms){clearTimeout(timer);if(enabled&&visible&&canEdit())timer=setTimeout(()=>void sendDraft(false),ms);}
 const changed=()=>{if(!visible)return;changeEpoch++;needsBackup=true;if(enabled&&canEdit()){msg('Unsaved changes · cloud draft scheduled');schedule(7000);}};
 for(const elem of [editor,title,$('chapterNotes'),$('chapterStatus')])elem?.addEventListener('input',changed);
 $('chapterStatus')?.addEventListener('change',changed);
 saveDraftBtn.onclick=()=>void sendDraft(true);
 async function list(kind){
  if(!enabled||!currentBook)return;
  const my=requestEpoch, c=context(),isRevision=kind==='revision';
  showPanel('Loading '+(isRevision?'saved revisions':'cloud drafts')+'…');
  try{
   const route=isRevision?'sarniBookRevisionList':'sarniBookDraftList';
   const payload=isRevision?{bookId:currentBook,chapterId:currentChapter}:{bookId:currentBook};
   const r=await api(route,payload);
   if(my!==requestEpoch||!visible)return;
   const rows=isRevision?r?.data?.revisions:r?.data?.drafts;
   if(!Array.isArray(rows))throw Error('Invalid history response');
   showPanel(rows.length?'Choose a previous copy. Loading it never publishes or overwrites a chapter until you press Save chapter.':'No '+(isRevision?'saved revisions':'cloud drafts')+' found yet.');
   const eligible=isRevision?rows:rows.filter(x=>(x.chapterId||'')===(c.chapterId||''));
   if(!eligible.length&&rows.length&&!isRevision){const t=document.createElement('small');t.textContent='Other chapters have their own cloud drafts; they are not loaded into this editor.';panel.append(t);}
   for(const x of eligible.slice(0,30)){
    const row=document.createElement('div');row.className='s14entry';
    const label=document.createElement('div');label.textContent=String(x.title||'Untitled');
    const small=document.createElement('small');small.textContent=String(x.savedAt||'')+(isRevision?' · '+String(x.author||''):'');
    label.append(small);row.append(label);
    row.append(button('Preview / load text',()=>void loadSnapshot(isRevision,x.id,c.chapterId,my)));
    panel.append(row);
   }
  }catch(e){if(my===requestEpoch&&visible)showPanel('History unavailable: '+String(e.message||e));}
 }
 async function loadSnapshot(isRevision,id,expectedChapter,epoch){
  if(!canEdit())return msg('Read-only chapter','error');
  if(!confirm('Load this saved text into the editor? It will NOT save or overwrite the published chapter. Export your current changes first if needed.'))return;
  try{
   const c=context();if(c.chapterId!==expectedChapter)return msg('Chapter changed — reopen history','error');
   const route=isRevision?'sarniBookRevisionGet':'sarniBookDraftGet';
   const payload={bookId:c.bookId,id};if(isRevision)payload.chapterId=c.chapterId;
   const r=await api(route,payload);
   if(epoch!==requestEpoch||!visible||context().chapterId!==expectedChapter)return;
   const d=r?.data;
   if(!d||typeof d.content!=='string')throw Error('Missing saved text');
   const originalText=editor.innerText||'';
   if(originalText.trim()){
    try{sessionStorage.setItem('sarni14-before-recovery-'+draftKey,JSON.stringify({chapterId:c.chapterId,text:originalText,at:new Date().toISOString()}));}catch(_){}
   }
   editor.innerHTML=typeof sarniChapterSafeHtml==='function'?sarniChapterSafeHtml(d.content):String(d.content).replace(/</g,'&lt;');
   if($('chapterNotes'))$('chapterNotes').value=d.notes||'';
   editor.dispatchEvent(new Event('input',{bubbles:true}));
   showPanel('Previous text loaded into the editor only. Review it, then press Save chapter if you wish to publish it.');
   msg('Restored text is UNSAVED · please review before saving','error');
  }catch(e){if(visible)msg('Could not load old version: '+String(e.message||e),'error');}
 }
 draftBtn.onclick=()=>void list('draft');
 revBtn.onclick=()=>void list('revision');
 const obs=new MutationObserver(()=>{
  const now=!modal.classList.contains('hidden');
  if(now===visible)return;
  visible=now;
  if(now)void probe();
  else{requestEpoch++;enabled=false;clearTimeout(timer);panel.hidden=true;updateButtons();}
 });
 obs.observe(modal,{attributes:true,attributeFilter:['class']});
 window.SarNiBookSafety={enabledFor:bookId=>enabled&&visible&&currentBook===bookId,backendReady:()=>enabled};
 // Public per-view state only; never exposes credentials or manuscript data.
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();