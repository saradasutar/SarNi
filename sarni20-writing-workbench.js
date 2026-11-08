/* SarNi 20 — lightweight manuscript workbench.
 * No changes to manuscript storage, save backend, or existing record IDs.
 * No automatic server writes. Preferences store only IDs/caret offsets. */
(function(){
'use strict';
function init(){
 const $=id=>document.getElementById(id),modal=$('chapterModal'),editor=$('chapterContent'),form=$('chapterForm'),title=$('chapterTitle');
 if(!modal||!editor||!form||!title||$('sarni20Workbench'))return;
 const style=document.createElement('style');
 style.textContent=[
 '#sarni20Workbench{border:1px solid #dbe0ed;border-radius:13px;padding:9px 11px;margin:8px 0 10px;background:#fafbfe;color:#42506d;font:650 12px/1.5 system-ui;display:grid;gap:7px}',
 '#sarni20Workbench .s20row{display:flex;gap:7px;align-items:center;flex-wrap:wrap}',
 '#sarni20Workbench button{padding:7px 10px;min-height:35px;border-radius:8px;background:#fff;border:1px solid #cfd6e8;color:#3d4a6b;font:700 12px system-ui;cursor:pointer}',
 '#sarni20Workbench button:disabled{opacity:.4;cursor:not-allowed}',
 '#sarni20Workbench .s20label{font-weight:800;color:#54477e;margin-right:auto}',
 '#sarni20Workbench .s20dim{font-size:11px;color:#6a7891}',
 '#sarni20Workbench input[type=search]{border:1px solid #cfd6e8;border-radius:8px;min-height:36px;padding:7px 10px;max-width:210px;min-width:110px;flex:1;background:white;color:#34415d}',
 '#sarni20Workbench #s20Outline{display:flex;gap:6px;flex-wrap:wrap;max-height:105px;overflow:auto}',
 '#sarni20Workbench #s20Outline[hidden],#sarni20Workbench .s20-hidden[hidden]{display:none!important}',
 '#sarni20Workbench #s20Outline button{font-weight:600;background:#f5f2ff}',
 '#sarni20Workbench #s20Info{min-width:100px;font:650 11px system-ui;color:#62718d}',
 '#chapterModal.s20-max{width:min(1250px,calc(100vw - 12px))!important;max-height:calc(100dvh - 12px)!important}',
 '#chapterModal.s20-max #chapterContent{min-height:57vh!important}',
 '#chapterModal.s20-max #chapterForm{max-width:1160px!important}',
 '@media(max-width:620px){#sarni20Workbench{padding:8px}#sarni20Workbench button{min-height:40px}#sarni20Workbench .s20row{gap:5px}#sarni20Workbench #s20Info{width:100%}}',
 '@media print{#sarni20Workbench{display:none!important}}'
 ].join('\n');
 document.head.append(style);
 const panel=document.createElement('section');panel.id='sarni20Workbench';
 panel.innerHTML='<div class="s20row"><span class="s20label">✦ Writing tools</span><span id="s20Info">Ready</span><button id="s20More" type="button" aria-expanded="false">More tools</button></div>'
 +'<div class="s20row s20-hidden" id="s20Extras" hidden><button id="s20Prev" type="button">← Previous chapter</button><button id="s20Next" type="button">Next chapter →</button><button id="s20Fullscreen" type="button">Expand editor</button><button id="s20OutlineToggle" type="button">Headings</button><button id="s20Position" type="button">Resume position</button></div>'
 +'<div class="s20row s20-hidden" id="s20SearchRow" hidden><input id="s20Search" type="search" placeholder="Find within chapter" aria-label="Find text within chapter"><span class="s20dim" id="s20Matches">0 matches</span><span class="s20dim" id="s20Metrics"></span></div>'
 +'<div id="s20Outline" hidden></div>';
 const anchor=$('sarni15Writer')||editor;anchor.after(panel);
 let visible=false,dirty=false,currentId='',currentBook='',sessionStart=0,interval=null;
 const info=$('s20Info'),extras=$('s20Extras'),searchRow=$('s20SearchRow');
 const current=()=>({bookId:$('chapterBookId')?.value||'',id:$('chapterId')?.value||'',title:title.value||''});
 const isReadOnly=()=>editor.contentEditable==='false';
 function items(){const d=window.SarniAuthorBook?.getCurrent?.();return Array.isArray(d?.chapters)?d.chapters:[];}
 function updateButtons(){
  const xs=items(),index=xs.findIndex(c=>String(c.id)===currentId);
  $('s20Prev').disabled=index<=0;$('s20Next').disabled=index<0||index>=xs.length-1;
 }
 function stats(){
  if(!visible)return;
  const text=editor.innerText||'',words=text.trim()?(text.match(/\S+/g)||[]).length:0,minutes=Math.ceil(words/210);
  const elapsed=sessionStart?Math.floor((Date.now()-sessionStart)/60000):0;
  $('s20Metrics').textContent=words.toLocaleString('en-IN')+' words · '+minutes+' min read · '+elapsed+' min session';
  const q=$('s20Search').value.trim();
  let count=0;
  if(q){const lower=text.toLocaleLowerCase(),needle=q.toLocaleLowerCase();let from=0,next;while((next=lower.indexOf(needle,from))!==-1&&count<10000){count++;from=next+needle.length;}}
  $('s20Matches').textContent=count+' match'+(count===1?'':'es');
  info.textContent=dirty?'● Unsaved changes':'Writing ready';
 }
 function allTextNodes(){const walk=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);const out=[];while(walk.nextNode())out.push(walk.currentNode);return out;}
 function caretOffset(){
  const sel=window.getSelection();if(!sel?.rangeCount||!editor.contains(sel.anchorNode))return null;
  const nodes=allTextNodes();let offset=0;for(const n of nodes){if(n===sel.anchorNode)return offset+Math.min(sel.anchorOffset,n.textContent.length);offset+=n.textContent.length;}
  return null;
 }
 function positionKey(){
  let username='';try{username=String(window.SarniStockBridge?.session?.().username||'')}catch(e){}
  if(!username||!currentBook||!currentId)return '';
  return 'sarni20-caret-'+encodeURIComponent(username)+'-'+encodeURIComponent(currentBook)+'-'+encodeURIComponent(currentId);
 }
 function remember(){
  const key=positionKey(),offset=caretOffset();if(!key||offset===null)return;
  try{localStorage.setItem(key,String(offset));}catch(e){}
 }
 function restore(){
  const key=positionKey();if(!key)return;
  let saved;try{saved=Number(localStorage.getItem(key));}catch(e){return;}
  if(!Number.isFinite(saved)||saved<0)return;
  let remaining=saved,last=null;
  for(const n of allTextNodes()){
    if(remaining<=n.textContent.length){const sel=window.getSelection(),range=document.createRange();range.setStart(n,remaining);range.collapse(true);sel.removeAllRanges();sel.addRange(range);editor.focus({preventScroll:true});n.parentElement?.scrollIntoView({block:'center'});return;}
    remaining-=n.textContent.length;last=n;
  }
  if(last){editor.focus({preventScroll:true});}
 }
 function headings(){
  const el=$('s20Outline');el.replaceChildren();
  const hs=[...editor.querySelectorAll('h2,h3,h4')].slice(0,60);
  if(!hs.length){el.textContent='No headings. Use the existing Paragraph / Heading dropdown to add one.';return;}
  for(const h of hs){const b=document.createElement('button');b.type='button';b.textContent=h.textContent.trim().slice(0,90)||'Untitled heading';b.onclick=()=>{h.scrollIntoView({block:'center'});h.focus?.();};el.append(b);}
 }
 function switchChapter(delta){
  const xs=items(),index=xs.findIndex(c=>String(c.id)===currentId);
  if(index<0||index+delta<0||index+delta>=xs.length)return;
  if(dirty){info.textContent='Save your edits before changing chapters.';return;}
  remember();
  if(!window.SarniAuthorBook?.openChapter?.(xs[index+delta].id))info.textContent='Chapter navigation unavailable.';
 }
 $('s20Prev').onclick=()=>switchChapter(-1);
 $('s20Next').onclick=()=>switchChapter(1);
 $('s20Fullscreen').onclick=()=>{
  const enabled=modal.classList.toggle('s20-max');
  $('s20Fullscreen').textContent=enabled?'Normal editor':'Expand editor';
 };
 $('s20OutlineToggle').onclick=()=>{const x=$('s20Outline');x.hidden=!x.hidden;if(!x.hidden)headings();};
 $('s20Position').onclick=restore;
 $('s20More').onclick=()=>{
  const show=extras.hidden;extras.hidden=!show;searchRow.hidden=!show;
  $('s20More').setAttribute('aria-expanded',String(show));
  $('s20More').textContent=show?'Fewer tools':'More tools';
  if(show)stats();
 };
 $('s20Search').addEventListener('input',stats);
 editor.addEventListener('input',()=>{if(!visible)return;dirty=true;stats();});
 editor.addEventListener('keyup',()=>{if(visible)remember();});
 editor.addEventListener('mouseup',()=>{if(visible)remember();});
 const obs=new MutationObserver(()=>{
  const isOpen=!modal.classList.contains('hidden');
  if(!isOpen){if(visible)remember();visible=false;clearInterval(interval);interval=null;modal.classList.remove('s20-max');return;}
  const c=current();
  if(visible&&c.id===currentId&&c.bookId===currentBook)return;
  visible=true;currentBook=c.bookId;currentId=c.id;dirty=false;sessionStart=Date.now();
  info.textContent='Writing ready';updateButtons();stats();
  clearInterval(interval);interval=setInterval(()=>{if(visible&&!searchRow.hidden)stats();},30000);
 });
 obs.observe(modal,{attributes:true,attributeFilter:['class']});
 // The editor can open another chapter without closing the parent modal.
 document.addEventListener('sarni:chapter-opened',()=>{
  const c=current();visible=true;currentId=c.id;currentBook=c.bookId;dirty=false;sessionStart=Date.now();
  info.textContent='Writing ready';updateButtons();stats();
 });
 // Explicit save confirmation uses existing app handling; no guessed success.
 $('saveChapterBtn')?.addEventListener('click',()=>{if(visible)remember();},true);
 window.addEventListener('pagehide',remember);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();