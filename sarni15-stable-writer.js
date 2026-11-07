/* SarNi 15 — stable writing experience, progressive enhancement.
   One small toolbar, one modal observer; no network calls, no mutation of book data,
   no automatic server writes, no continuous DOM observers or editor rewriting. */
(()=>{
'use strict';
function mount(){
 const $=id=>document.getElementById(id),modal=$('chapterModal'),editor=$('chapterContent'),form=$('chapterForm'),save=$('saveChapterBtn');
 if(!modal||!editor||!form||!save||$('sarni15Writer'))return;
 const css=document.createElement('style');
 css.textContent=[
 '#chapterModal{scrollbar-gutter:stable}',
 '#chapterModal .modal-head{position:sticky;top:0;z-index:20;background:var(--surface,#fff);border-bottom:1px solid #e5e7f0}',
 '#chapterModal .form-actions{position:sticky;bottom:0;z-index:20;background:var(--surface,#fff);padding:12px 4px;border-top:1px solid #e2e6f0;box-shadow:0 -8px 20px #1f29370a}',
 '#sarni15Writer{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:9px 11px;margin:9px 0;border:1px solid #dde4ee;border-radius:11px;background:#f7f9fd;color:#394963;font:650 12px/1.45 system-ui}',
 '#sarni15Writer .s15-status{margin-right:auto;min-width:150px}',
 '#sarni15Writer button,#sarni15Writer select{border:1px solid #bbc9df;border-radius:8px;background:white;color:#334765;padding:8px 10px;min-height:36px;font:700 12px system-ui;cursor:pointer}',
 '#sarni15Writer button:focus-visible{outline:3px solid #6d87bc}',
 '#sarni15Writer button.s15-primary{background:#4f46e5;border-color:#4f46e5;color:white}',
 '#chapterModal #chapterContent{min-height:330px;max-height:62vh;overflow-y:auto;font-size:18px;line-height:1.8;padding:18px;border-radius:12px;background:#fff;overflow-wrap:anywhere;scroll-behavior:auto}',
 '#chapterModal.sarni15-focus #chapterContent{min-height:55vh;max-height:none;width:min(100%,760px);margin-inline:auto;font-family:Georgia,serif;line-height:1.9;box-shadow:0 8px 30px #1d31570e}',
 '#chapterModal.sarni15-focus #chapterForm{max-width:1080px;margin:auto}',
 '#chapterModal .sarni-book-format-tip{font-size:12px;padding:8px 12px;margin:8px 0;background:#f8faff;border-radius:8px}',
 '#sarni15Recovery{display:grid;gap:8px;background:#fff9e9;border:1px solid #eed29c;border-radius:10px;padding:11px;font:650 12px/1.5 system-ui;color:#66502d}',
 '#sarni15Recovery[hidden]{display:none!important}',
 '#sarni15Recovery button{border:1px solid #cdb686;background:white;border-radius:7px;padding:7px 11px;cursor:pointer}',
 '@media(max-width:600px){#chapterModal #chapterContent{font-size:17px;padding:13px;min-height:46vh}#sarni15Writer{padding:8px;gap:6px}#sarni15Writer button{flex:1 1 auto}#chapterModal .form-actions{padding:9px 4px}}',
 '@media(prefers-reduced-motion:reduce){#chapterModal *{scroll-behavior:auto!important;transition:none!important}}'
 ].join('\n');
 document.head.append(css);
 const bar=document.createElement('div');bar.id='sarni15Writer';
 bar.innerHTML='<span class="s15-status" id="sarni15Status" role="status">Ready to write</span><span id="sarni15Count">0 words</span><button type="button" id="sarni15Focus">Comfort mode</button><button type="button" id="sarni15Copy">Copy chapter text</button><button type="button" class="s15-primary" id="sarni15Save">Save chapter</button>';
 const editorLabel=$('chapterWordCountLive')?.closest('label');if(editorLabel)editorLabel.after(bar);else editor.before(bar);
 const recover=document.createElement('div');recover.id='sarni15Recovery';recover.hidden=true;
 recover.innerHTML='<strong>Local safety copy from this browser session is available.</strong><span id="sarni15BackupWhen"></span><div><button type="button" id="sarni15ExportBackup">Export safety copy</button><button type="button" id="sarni15RestoreBackup">Restore into editor</button><button type="button" id="sarni15DismissBackup">Dismiss</button></div>';
 bar.after(recover);
 let showing=false,edited=false,dirtyAt=0,backup=null,backupKey='',lastOpenAt=0;
 const status=$('sarni15Status');
 const current=()=>({bookId:$('chapterBookId')?.value||'',chapterId:$('chapterId')?.value||'',title:$('chapterTitle')?.value||'',html:editor.innerHTML,notes:$('chapterNotes')?.value||''});
 const storageKey=()=>{
  const c=current();
  let username='';
  try{username=String(window.SarniStockBridge?.session?.().username||'');}catch(_){}
  if(!username||!c.bookId||(!c.chapterId&&!c.title.trim()))return '';
  return 'sarni15-safety-'+encodeURIComponent(username)+'-'+encodeURIComponent(c.bookId)+'-'+encodeURIComponent(c.chapterId||'new:'+c.title.trim().toLowerCase());
 };
 function count(){const text=editor.innerText||'';const n=(text.trim().match(/\S+/g)||[]).length;$('sarni15Count').textContent=n.toLocaleString('en-IN')+' words';}
 function flag(){if(!showing||editor.contentEditable==='false')return;edited=true;dirtyAt=Date.now();status.textContent='● Unsaved edits';count();}
 editor.addEventListener('input',flag);
 $('chapterNotes')?.addEventListener('input',flag);
 $('chapterTitle')?.addEventListener('input',flag);
 $('sarni15Focus').onclick=()=>{const enabled=modal.classList.toggle('sarni15-focus');$('sarni15Focus').textContent=enabled?'Normal mode':'Comfort mode';editor.focus({preventScroll:true});};
 $('sarni15Save').onclick=()=>{if(editor.contentEditable==='false')return;if(!save.disabled)save.click();};
 $('sarni15Copy').onclick=async()=>{try{await navigator.clipboard.writeText(editor.innerText||'');status.textContent='Text copied';}catch(_){status.textContent='Copy unavailable';}};
 function stash(){
  if(!showing||!edited||editor.contentEditable==='false')return;
  const key=storageKey();if(!key)return;
  const c=current();const record={...c,at:new Date().toISOString()};
  try{sessionStorage.setItem(key,JSON.stringify(record));backupKey=key;status.textContent='Local safety copy · use Save chapter';}
  catch(_){status.textContent='Backup unavailable — save chapter';}
 }
 function findBackup(){
  recover.hidden=true;backup=null;
  const key=storageKey();if(!key)return;
  try{
   const obj=JSON.parse(sessionStorage.getItem(key)||'null');
   if(obj&&typeof obj.html==='string'&&obj.html!==editor.innerHTML){
    backup=obj;recover.hidden=false;$('sarni15BackupWhen').textContent='Saved locally '+new Date(obj.at).toLocaleString()+'. No changes made to your server manuscript.';
   }
  }catch(_){}
 }
 function downloadBackup(){
  if(!backup)return;const plain=String(backup.html||'').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'');
  const blob=new Blob([plain],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='SarNi-chapter-local-backup.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
 $('sarni15ExportBackup').onclick=downloadBackup;
 $('sarni15DismissBackup').onclick=()=>{recover.hidden=true;};
 $('sarni15RestoreBackup').onclick=()=>{
  if(!backup||storageKey()!==backupKey&&storageKey()!==(backupKey=storageKey())||editor.contentEditable==='false')return;
  if(!confirm('Replace the current editor text with this local copy? Nothing is saved to SarNi until you press Save chapter.'))return;
  // Never trust HTML from browser storage: sanitize with the browser to text only.
  const tmp=document.createElement('div');tmp.textContent='';
  const raw=String(backup.html||'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/(?:p|div|h[1-6])>/gi,'\n');
  tmp.innerHTML=raw;const safeText=tmp.textContent||'';
  editor.textContent=safeText;if($('chapterNotes'))$('chapterNotes').value=String(backup.notes||'');
  recover.hidden=true;flag();editor.dispatchEvent(new Event('input',{bubbles:true}));
 };
 const obs=new MutationObserver(()=>{
  const open=!modal.classList.contains('hidden');if(open===showing)return;
  showing=open;
  if(open){edited=false;status.textContent='Ready to write';count();lastOpenAt=Date.now();requestAnimationFrame(findBackup);}
  else{edited=false;recover.hidden=true;backup=null;modal.classList.remove('sarni15-focus');$('sarni15Focus').textContent='Comfort mode';}
 });
 obs.observe(modal,{attributes:true,attributeFilter:['class']});
 save.addEventListener('click',()=>{if(edited)stash();status.textContent='Saving chapter…';},true);
 form.addEventListener('submit',()=>{if(edited)stash();},true);
 window.addEventListener('pagehide',stash);
 // A lightweight safety-copy checkpoint; never sends or overwrites server data.
 setInterval(()=>{if(showing&&edited&&Date.now()-dirtyAt>=15000)stash();},20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();