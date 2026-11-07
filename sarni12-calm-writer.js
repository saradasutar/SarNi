(()=>{
'use strict';
function init(){
 const $=id=>document.getElementById(id),modal=$('chapterModal'),editor=$('chapterContent'),save=$('saveChapterBtn');
 if(!modal||!editor||!save||$('sarni12Toolbar'))return;
 const style=document.createElement('style');
 style.textContent="#sarni12Toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;margin:8px 0;border:1px solid #dcd8ed;border-radius:12px;background:#f8f6ff;font:600 12px system-ui;color:#473968}#sarni12Toolbar button,#sarni12Recovery button{border:1px solid #c9c0e0;border-radius:8px;background:white;color:#48366f;padding:8px 11px;min-height:36px;font-weight:700;cursor:pointer}#sarni12Toolbar .primary{background:#6548a7;color:white}#sarni12Notice{margin-right:auto}#sarni12Recovery{padding:12px;background:#fff8e8;border:1px solid #e7ca8d;border-radius:10px;display:flex;flex-wrap:wrap;align-items:center;gap:9px;color:#674b23;font:600 13px system-ui}#sarni12Recovery[hidden]{display:none!important}#chapterModal.sarni12Quiet #chapterForm{max-width:1050px;margin:auto}#chapterModal.sarni12Quiet #chapterContent{max-width:var(--sarni12-width,740px);margin:auto;min-height:50vh!important;box-shadow:0 5px 25px #343f5a12;border:1px solid #d7dce8;border-radius:15px;padding:clamp(16px,3vw,32px)!important}#booksSection .book-chapter-row{transition:background .14s}#booksSection .book-chapter-row:hover{background:#eef1fb}@media(max-width:600px){#sarni12Toolbar button{flex:1 1 auto}#chapterModal.sarni12Quiet #chapterContent{min-height:55vh!important}}";
 document.head.append(style);
 const bar=document.createElement('div');bar.id='sarni12Toolbar';
 bar.innerHTML='<span id="sarni12Notice" role="status">✍️ Writing ready</span><button type="button" id="sarni12Quiet">Quiet mode</button><button type="button" id="sarni12Width">Narrow page</button><button type="button" id="sarni12Backup">Keep safety copy</button><button type="button" class="primary" id="sarni12Save">Save chapter</button>';
 const toolbar=$('sarni11WriterTools');(toolbar||editor).before(bar);
 const recovery=document.createElement('div');recovery.id='sarni12Recovery';recovery.hidden=true;
 recovery.innerHTML='<span id="sarni12RecoveryLabel"></span><button type="button" id="sarni12Review">Restore local text</button><button type="button" id="sarni12Export">Export copy</button><button type="button" id="sarni12Dismiss">Dismiss</button>';
 bar.after(recovery);
 const note=$('sarni12Notice');let dirty=false,visible=false,latestKey='',localCopy=null;
 const say=(t)=>{note.textContent=t;};
 const getKey=()=>{
  const b=$('chapterBookId')?.value||'',c=$('chapterId')?.value||'',t=$('chapterTitle')?.value.trim()||'';
  let who='';try{who=String(state?.username||state?.user?.username||'')}catch(_){}
  if(!who||!b||!(c||t))return '';
  return 'sarni12-local-'+encodeURIComponent(who)+'-'+encodeURIComponent(b)+'-'+encodeURIComponent(c||'new:'+t.toLowerCase());
 };
 const backup=()=>{
  if(!visible||!dirty||editor.contentEditable==='false')return false;
  const key=getKey();if(!key){say('Enter chapter title for backup');return false;}
  const obj={key,html:editor.innerHTML,plain:editor.innerText||'',notes:$('chapterNotes')?.value||'',at:new Date().toISOString()};
  try{sessionStorage.setItem(key,JSON.stringify(obj));latestKey=key;say('Local safety copy · not yet saved to SarNi');return true;}catch(e){say('Local backup failed — export your writing');return false;}
 };
 const check=()=>{
  recovery.hidden=true;localCopy=null;const key=getKey();if(!key)return;
  try{const x=JSON.parse(sessionStorage.getItem(key)||'null');if(x&&x.html!==editor.innerHTML){localCopy=x;recovery.hidden=false;$('sarni12RecoveryLabel').textContent='Local copy from '+new Date(x.at).toLocaleString()+' differs from server text. No text was overwritten.';}}catch(e){}
 };
 const mark=()=>{dirty=true;say('● Unsaved changes — save chapter');};
 editor.addEventListener('input',mark);$('chapterNotes')?.addEventListener('input',mark);
 $('chapterTitle')?.addEventListener('input',mark);
 $('sarni12Quiet').onclick=()=>{
  const on=modal.classList.toggle('sarni12Quiet');
  $('sarni12Quiet').textContent=on?'Exit quiet mode':'Quiet mode';if(on)editor.focus({preventScroll:true});
 };
 $('sarni12Width').onclick=()=>{
  const narrow=modal.style.getPropertyValue('--sarni12-width')!=='620px';
  modal.style.setProperty('--sarni12-width',narrow?'620px':'860px');
  $('sarni12Width').textContent=narrow?'Wide page':'Narrow page';
 };
 $('sarni12Backup').onclick=()=>{dirty=true;backup();};
 $('sarni12Save').onclick=()=>{if(editor.contentEditable==='false'||save.disabled)return;save.click();};
 function exportText(x){
  const blob=new Blob([x.plain||''],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='SarNi-chapter-safety-copy.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
 }
 $('sarni12Export').onclick=()=>{if(localCopy)exportText(localCopy);};
 $('sarni12Dismiss').onclick=()=>{recovery.hidden=true;};
 $('sarni12Review').onclick=()=>{
  if(!localCopy||getKey()!==localCopy.key||editor.contentEditable==='false')return;
  if(!confirm('Replace editor contents with local backup? The result will NOT be saved to SarNi until Save chapter is pressed.'))return;
  const clean=typeof sarniChapterSafeHtml==='function'?sarniChapterSafeHtml(localCopy.html):String(localCopy.plain||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\r?\n/g,'<br>');
  editor.innerHTML=clean;
  if($('chapterNotes'))$('chapterNotes').value=localCopy.notes||'';
  recovery.hidden=true;mark();editor.dispatchEvent(new Event('input',{bubbles:true}));
 };
 let former=false;
 const observer=new MutationObserver(()=>{
  const now=!modal.classList.contains('hidden');if(now===former)return;former=now;visible=now;
  if(now){dirty=false;say('✍️ Writing ready');requestAnimationFrame(check);}
  else{dirty=false;latestKey='';localCopy=null;recovery.hidden=true;modal.classList.remove('sarni12Quiet');$('sarni12Quiet').textContent='Quiet mode';}
 });
 observer.observe(modal,{attributes:true,attributeFilter:['class']});
 window.addEventListener('pagehide',()=>backup());
 setInterval(()=>{if(visible&&dirty)backup();},20000);
 save.addEventListener('click',()=>{if(dirty)backup();say('Saving… retain local copy until verified');},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();