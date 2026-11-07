/* SarNi 13 — Manuscript Navigation & Reading Comfort.
 * Progressive enhancement only. Never writes manuscript data or backend state.
 * Does not override authenticated book/chapter events.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
function boot(){
 const section=$('booksSection'),grid=$('booksGrid'),chapters=$('bookChaptersList'),editor=$('chapterContent'),modal=$('chapterModal');
 if(!section||!grid||!chapters||!editor||!modal||$('sarni13LibraryBar'))return;
 const css=document.createElement('style');
 css.textContent=[
 '#sarni13LibraryBar,#sarni13ChapterBar{border:1px solid #d8dfef;background:linear-gradient(115deg,#f9faff,#f3f7ff);padding:12px;border-radius:13px;margin:10px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:#33466b;font:650 13px system-ui}',
 '#sarni13LibraryBar select,#sarni13ChapterBar select,#sarni13ChapterBar input{border:1px solid #c9d4e7;border-radius:9px;padding:8px 10px;background:white;color:#243651;font:inherit;min-height:38px;max-width:100%}',
 '#sarni13LibraryBar button,#sarni13ChapterBar button,#sarni13ReaderExtras button{border:1px solid #c4d0e5;border-radius:9px;background:white;color:#324d7e;padding:8px 11px;min-height:38px;font-weight:750;cursor:pointer}',
 '#sarni13LibraryBar label,#sarni13ChapterBar label{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}',
 '#sarni13LibraryBar small,#sarni13ChapterBar small{font-size:12px;color:#6b7790}',
 '#booksGrid.sarni13List{display:grid;grid-template-columns:1fr}',
 '#booksGrid.sarni13List .book-card{display:flex;flex-direction:column;min-height:0}',
 '#sarni13ChapterBar input{min-width:150px;max-width:320px;flex:1}',
 '#sarni13ReaderExtras{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:9px 2px;color:#617089;font:650 12px system-ui}',
 '#sarni13ReaderExtras span{margin-right:auto}',
 '#chapterContent.sarni13LineFocus:focus{background-image:linear-gradient(90deg,transparent 0,rgba(124,95,184,.025) 50%,transparent 100%)}',
 '#booksSection .book-card:focus-visible,#booksSection .book-chapter-main:focus-visible{outline:3px solid #8664c9;outline-offset:3px}',
 '@media(max-width:600px){#sarni13LibraryBar,#sarni13ChapterBar{gap:7px;padding:9px}#sarni13ChapterBar input{width:100%;max-width:none}#sarni13LibraryBar label{flex:1}#sarni13ReaderExtras button{min-height:42px}}',
 '@media(prefers-reduced-motion:reduce){#booksGrid .book-card{transition:none!important}}'
 ].join('\n');
 document.head.append(css);
 // Library: additional controls respect the existing library search widget.
 const bar=document.createElement('div');bar.id='sarni13LibraryBar';
 bar.innerHTML='<label>Sort books <select id="sarni13Sort"><option value="original">Original order</option><option value="title">Title A–Z</option><option value="titleDesc">Title Z–A</option><option value="chapters">Most chapters</option><option value="words">Most words</option></select></label><button type="button" id="sarni13View">Compact list</button><small id="sarni13LibraryStatus" role="status"></small>';
 const existing=$('sarni11LibraryTools');(existing||grid).before(bar);
 const sort=$('sarni13Sort'),view=$('sarni13View'),libStatus=$('sarni13LibraryStatus');
 const originals=new WeakMap();let nextOrder=0;
 function sortBooks(){
  const cards=[...grid.querySelectorAll('.book-card')];
  cards.forEach(card=>{if(!originals.has(card))originals.set(card,nextOrder++);});
  const val=sort.value;cards.sort((a,b)=>{
   const title=x=>(x.querySelector('h4')?.textContent||'').trim();
   const count=x=>Number((x.querySelector('.book-card-metrics')?.textContent||'').match(/(\d+)\s+chapters?/)?.[1]||0);
   const words=x=>Number((x.querySelector('.book-card-metrics')?.textContent||'').match(/([\d,]+)\s+words/)?.[1]?.replace(/,/g,'')||0);
   if(val==='title')return title(a).localeCompare(title(b));
   if(val==='titleDesc')return title(b).localeCompare(title(a));
   if(val==='chapters')return count(b)-count(a);
   if(val==='words')return words(b)-words(a);
   return originals.get(a)-originals.get(b);
  });
  for(const card of cards)grid.appendChild(card);
  libStatus.textContent=cards.length+' book'+(cards.length===1?'':'s');
 }
 let sorting=false;
 const libraryObs=new MutationObserver(()=>{if(sorting)return;sorting=true;libraryObs.disconnect();try{sortBooks();}finally{sorting=false;libraryObs.observe(grid,{childList:true});}});
 // Sorting reorders DOM nodes, so observe only when the app rebuilds the library.
 libraryObs.observe(grid,{childList:true});
 sort.addEventListener('change',()=>{libraryObs.disconnect();sortBooks();libraryObs.observe(grid,{childList:true});});
 view.onclick=()=>{const on=grid.classList.toggle('sarni13List');view.textContent=on?'Book cards':'Compact list';};
 // Wait for the book listing to arrive then order once.
 let attempts=0;const initSort=setInterval(()=>{if(grid.querySelector('.book-card')||++attempts>25){clearInterval(initSort);sortBooks();}},300);
 // Chapter quick find, status filter and table-of-contents export.
 const chbar=document.createElement('div');chbar.id='sarni13ChapterBar';
 chbar.innerHTML='<input id="sarni13FindChapter" type="search" aria-label="Find chapter" placeholder="Find a chapter…" autocomplete="off"><label>Stage <select id="sarni13ChapterStage"><option value="all">All chapters</option><option value="not_started">Not started</option><option value="drafting">Drafting</option><option value="review">Review</option><option value="done">Done</option></select></label><button type="button" id="sarni13ExportToc">Export contents</button><small id="sarni13ChapterStatus" role="status"></small>';
 chapters.before(chbar);
 const find=$('sarni13FindChapter'),stage=$('sarni13ChapterStage'),chStatus=$('sarni13ChapterStatus');
 const filtered=()=>{
  const nodes=[...chapters.querySelectorAll('.book-chapter-row')],q=find.value.trim().toLocaleLowerCase(),filter=stage.value;
  let shown=0;nodes.forEach(el=>{
   const match=(!q||el.textContent.toLocaleLowerCase().includes(q))&&(filter==='all'||String(el.dataset.chapterStatus||'').toLowerCase()===filter);
   el.hidden=!match;el.style.display=match?'':'none';if(match)shown++;
  });
  chStatus.textContent=shown+' of '+nodes.length+' chapters';
 };
 find.addEventListener('input',filtered);stage.addEventListener('change',filtered);
 new MutationObserver(filtered).observe(chapters,{childList:true});
 filtered();
 $('sarni13ExportToc').onclick=()=>{
  const title=$('bookDetailTitle')?.textContent||'SarNi Book';
  const rows=[...chapters.querySelectorAll('.book-chapter-row')].map(el=>el.querySelector('.book-chapter-main')?.textContent?.trim()||'').filter(Boolean);
  if(!rows.length){chStatus.textContent='No chapters loaded to export';return;}
  const content=[title,'Table of Contents','',...rows].join('\n\n');
  const blob=new Blob([content],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='SarNi-contents.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 };
 // Reader: quality-of-life controls, no text mutation.
 const extras=document.createElement('div');extras.id='sarni13ReaderExtras';
 extras.innerHTML='<span id="sarni13Selection">Select a passage to see selected words</span><button type="button" id="sarni13Spell">Spellcheck on</button><button type="button" id="sarni13Top">Back to editor start</button>';
 editor.after(extras);
 const selected=$('sarni13Selection'),spell=$('sarni13Spell');
 const selectionCount=()=>{
  const sel=window.getSelection();if(!sel||!sel.rangeCount||!editor.contains(sel.anchorNode)){selected.textContent='Select a passage to see selected words';return;}
  const text=sel.toString().trim();const words=text?(text.match(/\S+/g)||[]).length:0;
  selected.textContent=words?words+' selected word'+(words===1?'':'s'):'Selection ready';
 };
 document.addEventListener('selectionchange',()=>{if(!modal.classList.contains('hidden'))selectionCount();});
 spell.onclick=()=>{editor.spellcheck=!editor.spellcheck;spell.textContent=editor.spellcheck?'Spellcheck on':'Spellcheck off';};
 editor.spellcheck=true;
 $('sarni13Top').onclick=()=>{editor.focus({preventScroll:true});editor.scrollIntoView({behavior:'smooth',block:'start'});};
 // User preferences affect presentation only and never include manuscript contents.
 try{const prefs=JSON.parse(localStorage.getItem('sarni13-writing-prefs')||'{}');if(['original','title','titleDesc','chapters','words'].includes(prefs.sort))sort.value=prefs.sort;if(prefs.list)grid.classList.add('sarni13List');if(prefs.spell===false)editor.spellcheck=false;spell.textContent=editor.spellcheck?'Spellcheck on':'Spellcheck off';view.textContent=grid.classList.contains('sarni13List')?'Book cards':'Compact list';}catch(_){}
 const store=()=>{try{localStorage.setItem('sarni13-writing-prefs',JSON.stringify({sort:sort.value,list:grid.classList.contains('sarni13List'),spell:editor.spellcheck}));}catch(_){}};
 sort.addEventListener('change',store);view.addEventListener('click',store);spell.addEventListener('click',store);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();