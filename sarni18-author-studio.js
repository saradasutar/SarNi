/* SarNi 18: One-page Author Studio. Read-only chapter navigation and presentation preferences. */
(function(){
'use strict';
function setup(){
 const get=id=>document.getElementById(id),view=get('bookDetailView'),chaptersEl=get('bookChaptersList'),modal=get('chapterModal');
 if(!view||!chaptersEl||!modal||get('sarni18Control'))return;
 let preferences={theme:'classic',font:18,width:'medium'};
 try{const p=JSON.parse(localStorage.getItem('sarni18-style')||'{}');if(['classic','modern','sepia','minimal'].includes(p.theme))preferences.theme=p.theme;if([16,18,20,22].includes(Number(p.font)))preferences.font=Number(p.font);if(['narrow','medium','wide'].includes(p.width))preferences.width=p.width;}catch(e){}
 const style=document.createElement('style');
 style.textContent=[
 '#sarni18Control{display:grid;gap:10px;background:linear-gradient(120deg,#fbf8ff,#f2f8ff);border:1px solid #e0d9f1;border-radius:16px;padding:14px;margin:12px 0}',
 '#sarni18Control .s18row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
 '#sarni18Control strong{font-size:18px;color:#313d63}',
 '#sarni18Control label{font:700 12px system-ui;color:#53617d;display:flex;align-items:center;gap:6px}',
 '#sarni18Control select,#sarni18Control button,#sarni18Control input{background:#fff;border:1px solid #cdd3e8;border-radius:9px;padding:8px 10px;min-height:39px;font:700 13px system-ui;color:#35486a;min-width:0}',
 '#sarni18Control button{cursor:pointer}',
 '#sarni18Control input{flex:1 1 160px}',
 '#sarni18Control #s18Continue{background:#6750ae;color:white;border-color:#6750ae}',
 '#sarni18Control .s18hint{font:600 12px system-ui;color:#70809a}',
 '#chapterModal.s18-classic #chapterContent{font-family:Georgia,serif!important;background:#fff!important;color:#25334c!important}',
 '#chapterModal.s18-modern #chapterContent{font-family:system-ui,sans-serif!important;background:#fff!important;color:#26374c!important}',
 '#chapterModal.s18-sepia #chapterContent{font-family:Georgia,serif!important;background:#fff7e8!important;color:#503d2d!important}',
 '#chapterModal.s18-minimal #chapterContent{font-family:system-ui,sans-serif!important;background:#f8fafc!important;color:#25344b!important;box-shadow:none!important}',
 '#chapterModal.s18-narrow #chapterContent{max-width:600px!important}',
 '#chapterModal.s18-medium #chapterContent{max-width:780px!important}',
 '#chapterModal.s18-wide #chapterContent{max-width:960px!important}',
 '#chapterModal #chapterContent{font-size:var(--s18-font,18px)!important}',
 '#sarni18Reader{position:fixed;inset:0;z-index:25000;background:#142038d9;display:grid;place-items:center;padding:12px}',
 '#sarni18Reader[hidden]{display:none!important}',
 '#sarni18Reader .s18sheet{width:min(900px,100%);height:95dvh;background:white;border-radius:16px;overflow:hidden;display:flex;flex-direction:column}',
 '#sarni18Reader .s18header{padding:12px;display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid #e3e6ee;background:#fff}',
 '#sarni18Reader .s18title{font:bold 14px system-ui;color:#273653;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
 '#sarni18Reader button{padding:8px 11px;border:1px solid #d4d9e5;border-radius:8px;background:#fff;color:#334c78;cursor:pointer;font-weight:700}',
 '#sarni18Reader .s18text{padding:clamp(18px,4vw,42px);overflow:auto;flex:1;white-space:pre-wrap;overflow-wrap:anywhere;font:19px/1.85 Georgia,serif;max-width:780px;width:100%;margin:auto;box-sizing:border-box}',
 '#sarni18Reader.s18-sepia .s18sheet,#sarni18Reader.s18-sepia .s18text{background:#fff7e8;color:#4b3828}',
 '#sarni18Reader.s18-minimal .s18text,#sarni18Reader.s18-modern .s18text{font-family:system-ui,sans-serif}',
 '@media(max-width:620px){#sarni18Control{padding:10px}#sarni18Control label{flex:1 1 130px}#sarni18Control label select{flex:1}#sarni18Reader{padding:0}#sarni18Reader .s18sheet{height:100dvh;border-radius:0}#sarni18Reader .s18text{padding:20px}}'
 ].join('\n');
 document.head.append(style);
 const panel=document.createElement('section');panel.id='sarni18Control';
 panel.innerHTML='<div class="s18row"><strong>✦ Author Studio</strong><button id="s18Continue" type="button">✍ Continue writing</button></div>'
 +'<div class="s18row"><label>Page design <select id="s18Design"><option value="classic">Classic Book</option><option value="modern">Modern</option><option value="sepia">Warm Sepia</option><option value="minimal">Minimal</option></select></label>'
 +'<label>Text size <select id="s18Size"><option value="16">16 px</option><option value="18">18 px</option><option value="20">20 px</option><option value="22">22 px</option></select></label>'
 +'<label>Page width <select id="s18Width"><option value="narrow">Narrow</option><option value="medium">Comfortable</option><option value="wide">Wide</option></select></label></div>'
 +'<div class="s18row"><input id="s18Find" type="search" placeholder="Search chapters…" aria-label="Search chapters"/><button id="s18Read" type="button">📖 Read book</button><button id="s18Toc" type="button">Contents</button></div><span class="s18hint" id="s18Message">Your saved text stays unchanged when changing page designs.</span>';
 const heading=view.querySelector('.panel-head');if(heading)heading.after(panel);else view.prepend(panel);
 const reader=document.createElement('div');reader.id='sarni18Reader';reader.hidden=true;reader.setAttribute('role','dialog');reader.setAttribute('aria-modal','true');
 reader.innerHTML='<div class="s18sheet"><div class="s18header"><span class="s18title" id="s18ReaderTitle">Book preview</span><div><button id="s18Prev" type="button">Previous</button> <button id="s18Next" type="button">Next</button> <button id="s18Close" type="button">Close</button></div></div><div class="s18text" id="s18Text"></div></div>';
 document.body.append(reader);
 let activeBook='',items=[],page=0,wasFocused=null;
 const persist=()=>{try{localStorage.setItem('sarni18-style',JSON.stringify(preferences));}catch(e){}};
 function apply(){
  get('s18Design').value=preferences.theme;get('s18Size').value=String(preferences.font);get('s18Width').value=preferences.width;
  for(const cl of Array.from(modal.classList)){if(/^s18-(classic|modern|sepia|minimal|narrow|medium|wide)$/.test(cl))modal.classList.remove(cl);}
  for(const cl of Array.from(reader.classList)){if(/^s18-(classic|modern|sepia|minimal)$/.test(cl))reader.classList.remove(cl);}
  modal.classList.add('s18-'+preferences.theme,'s18-'+preferences.width);reader.classList.add('s18-'+preferences.theme);
  modal.style.setProperty('--s18-font',preferences.font+'px');get('s18Text').style.fontSize=preferences.font+'px';
 }
 get('s18Design').onchange=e=>{preferences.theme=e.target.value;persist();apply();};
 get('s18Size').onchange=e=>{preferences.font=Number(e.target.value);persist();apply();};
 get('s18Width').onchange=e=>{preferences.width=e.target.value;persist();apply();};
 apply();
 function filter(){
  const q=get('s18Find').value.trim().toLocaleLowerCase();let count=0;
  Array.from(chaptersEl.querySelectorAll('.book-chapter-row')).forEach((row,i)=>{const yes=!q||String(items[i]?.title||'').toLocaleLowerCase().includes(q);row.hidden=!yes;row.style.display=yes?'':'none';if(yes)count++;});
  if(q)get('s18Message').textContent=count+' matching chapters';
 }
 get('s18Find').addEventListener('input',filter);
 function sync(){
  const d=window.SarniAuthorBook?.getCurrent?.();if(!d?.book||!Array.isArray(d.chapters))return;
  if(activeBook!==String(d.book.id)){activeBook=String(d.book.id);get('s18Find').value='';}
  items=d.chapters;filter();
  if(!get('s18Find').value)get('s18Message').textContent=items.length+' chapters · '+items.reduce((sum,c)=>sum+(Number(c.wordCount)||0),0).toLocaleString('en-IN')+' saved words';
 }
 document.addEventListener('sarni:book-rendered',sync);sync();
 get('s18Continue').onclick=()=>{
  if(!items.length)return;
  let id='';try{id=localStorage.getItem('sarni18-last-'+activeBook)||'';}catch(e){}
  const ch=items.find(c=>c.id===id)||items.find(c=>c.status!=='DONE')||items[0];
  if(!window.SarniAuthorBook?.openChapter?.(ch.id))get('s18Message').textContent='Unable to open chapter. Refresh this book.';
 };
 document.addEventListener('click',e=>{
  const t=e.target.closest('[data-edit-chapter]');
  if(t&&chaptersEl.contains(t)&&activeBook){try{localStorage.setItem('sarni18-last-'+activeBook,t.dataset.editChapter);}catch(_){}}
 });
 function textFromHtml(html){
  const doc=new DOMParser().parseFromString(String(html||''),'text/html');
  doc.body.querySelectorAll('script,style,iframe,svg,object,embed').forEach(x=>x.remove());
  doc.body.querySelectorAll('br').forEach(x=>x.replaceWith('\n'));
  doc.body.querySelectorAll('p,div,h1,h2,h3,li,blockquote').forEach(x=>x.append(document.createTextNode('\n\n')));
  return (doc.body.textContent||'').replace(/\n{4,}/g,'\n\n\n').trim();
 }
 function show(i){
  if(!items.length)return;
  page=Math.max(0,Math.min(i,items.length-1));
  get('s18ReaderTitle').textContent=(page+1)+' / '+items.length+' · '+items[page].title;
  get('s18Text').textContent=textFromHtml(items[page].content);
  get('s18Prev').disabled=page===0;get('s18Next').disabled=page===items.length-1;
  get('s18Text').scrollTop=0;reader.hidden=false;get('s18Close').focus();
 }
 get('s18Read').onclick=()=>{wasFocused=document.activeElement;show(0);};
 get('s18Prev').onclick=()=>show(page-1);get('s18Next').onclick=()=>show(page+1);
 const close=()=>{reader.hidden=true;wasFocused?.focus?.();};
 get('s18Close').onclick=close;
 document.addEventListener('keydown',e=>{if(!reader.hidden&&e.key==='Escape'){e.preventDefault();close();}});
 get('s18Toc').onclick=()=>{
  if(!items.length){get('s18Message').textContent='No chapters loaded';return;}
  const d=window.SarniAuthorBook?.getCurrent?.(),text=[d?.book?.title||'Book','Table of Contents','',...items.map((c,i)=>(i+1)+'. '+c.title)].join('\n');
  const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='SarNi-book-contents.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();