/* SarNi 11 Book Studio: progressive, non-destructive writer enhancements.
   No new backend routes; book/chapter writes use authenticated existing SarNi API only. */
(()=>{
'use strict';
const ready=()=>{
 const $=id=>document.getElementById(id),section=$('booksSection'),editor=$('chapterContent'),modal=$('chapterModal'),grid=$('booksGrid');
 if(!section||!editor||!modal||!grid)return;
 const style=document.createElement('style');
 style.textContent=`
 #sarni11WriterTools{border:1px solid #ddd9ef;background:linear-gradient(120deg,#fbfaff,#f5f7ff);border-radius:14px;padding:11px;margin:8px 0 11px;display:grid;gap:10px}
 #sarni11WriterTools .s11bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
 #sarni11WriterTools button,#sarni11LibraryTools button{border:1px solid #ccc2e9;background:#fff;color:#523d8a;border-radius:9px;min-height:36px;padding:7px 10px;font:700 12px system-ui;cursor:pointer}
 #sarni11WriterTools button:focus-visible{outline:3px solid #8d73d6}
 #sarni11WriterTools input[type=number]{width:76px;min-height:33px;border:1px solid #d7cdec;border-radius:8px;padding:5px 8px;font:inherit}
 #sarni11WriterTools input[type=range]{width:95px;accent-color:#674ba8}
 #sarni11WriterTools select{border:1px solid #d7cdec;border-radius:8px;min-height:35px;padding:5px;font:inherit;background:#fff}
 #sarni11WriterTools label{display:inline-flex;align-items:center;gap:5px;font:650 12px system-ui;margin:0}
 #sarni11WriterTools .s11metrics{font:650 12px system-ui;color:#5a5279;display:flex;flex-wrap:wrap;gap:12px}
 #sarni11WriterTools progress{width:100%;height:7px;accent-color:#7358b1}
 #sarni11WriterTools .s11outline{font:13px/1.5 system-ui;color:#645979;max-height:100px;overflow:auto}
 #chapterContent.s11-sepia{background:#fff7e7!important;color:#4b3825!important}
 #chapterContent.s11-dark{background:#252638!important;color:#f3eff9!important}
 #chapterContent.s11-light{background:#fff!important;color:#26334e!important}
 #chapterContent.s11-paper{font-family:Georgia,'Times New Roman',serif!important;padding:clamp(18px,4vw,38px)!important;border-radius:13px!important;min-height:320px!important;overflow:auto!important}
 #chapterModal.s11-focus{position:fixed!important;inset:clamp(5px,2vw,20px)!important;width:auto!important;max-width:none!important;max-height:none!important;height:auto!important;z-index:100000!important;overflow:auto!important;box-sizing:border-box}
 #chapterModal.s11-focus #chapterContent{min-height:50vh!important}
 #chapterModal.s11-focus .modal-head{position:sticky;top:0;background:var(--surface,#fff);z-index:5}
 #sarni11LibraryTools{background:linear-gradient(120deg,#fcfaff,#f1f6ff);border:1px solid #e0dced;border-radius:13px;padding:12px;margin:11px 0;display:flex;gap:9px;align-items:center;flex-wrap:wrap}
 #sarni11LibraryTools input{max-width:290px;flex:1 1 170px;border:1px solid #cfd1e3;border-radius:9px;padding:10px;font:inherit;font-size:14px}
 #sarni11LibraryTools small{color:#6a627d}
 #sarni11DraftImporter{border:1px solid #e1daee;border-radius:13px;padding:12px;margin:12px 0;background:#fcfbff}
 #sarni11DraftImporter details summary{cursor:pointer;font-weight:800;color:#543887}
 #sarni11DraftImporter .s11draft{border-top:1px solid #e6e1ee;padding:10px 0;display:grid;gap:5px}
 #sarni11DraftImporter select{min-height:35px;border:1px solid #d4ccdf;border-radius:8px;max-width:100%;padding:5px}
 #sarni11DraftImporter button{border:0;background:#6849ab;color:#fff;border-radius:8px;padding:9px 13px;cursor:pointer;font-weight:750}
 #sarni11DraftImporter .s11draft small{color:#655d76;line-height:1.5}
 @media(max-width:600px){#sarni11WriterTools .s11bar{gap:6px}#sarni11WriterTools button{padding:8px}#sarni11LibraryTools{align-items:stretch}#chapterContent.s11-paper{padding:14px!important}}
 @media(prefers-reduced-motion:reduce){#booksSection *{transition:none!important}}
 `;
 document.head.append(style);
 const library=document.createElement('div');library.id='sarni11LibraryTools';
 library.innerHTML='<label for="sarni11BookSearch">Find a book</label><input id="sarni11BookSearch" type="search" placeholder="Search title, genre or status…" autocomplete="off"><small id="sarni11BookCount">Books ready</small>';
 grid.before(library);
 const search=$('sarni11BookSearch'),counter=$('sarni11BookCount');
 const filter=()=>{let visible=0;const cards=grid.querySelectorAll('.book-card'),q=search.value.trim().toLocaleLowerCase();cards.forEach(c=>{const match=c.textContent.toLocaleLowerCase().includes(q);c.hidden=!match;c.style.display=match?'':'none';if(match)visible++;});counter.textContent=visible+' of '+cards.length+' books';};
 search.addEventListener('input',filter);new MutationObserver(filter).observe(grid,{childList:true});
 filter();
 const tools=document.createElement('div');tools.id='sarni11WriterTools';
 tools.innerHTML=`<div class="s11bar">
 <button type="button" id="s11Focus">⛶ Focus mode</button>
 <label>Theme <select id="s11Theme"><option value="light">Light</option><option value="sepia">Sepia</option><option value="dark">Dark</option></select></label>
 <label>Font <input id="s11Font" type="range" min="15" max="26" value="18" aria-label="Writing font size"><output id="s11FontOut">18</output></label>
 <label>Spacing <select id="s11Spacing"><option value="1.5">Normal</option><option value="1.8" selected>Comfort</option><option value="2">Spacious</option></select></label>
 </div>
 <div class="s11metrics"><span id="s11Words">0 words</span><span id="s11Chars">0 characters</span><span id="s11Read">0 min reading</span><span id="s11Time">Session 0 min</span><span id="s11Dirty">No changes detected</span></div>
 <div class="s11bar"><label>Word goal <input type="number" id="s11Goal" min="0" max="1000000" value="1000"></label><span id="s11GoalStatus">0%</span><progress id="s11GoalProgress" max="100" value="0"></progress></div>
 <div class="s11bar"><label>Find <input type="search" id="s11Find" placeholder="Search chapter…" style="min-height:35px;max-width:150px;border:1px solid #d7cdec;border-radius:8px;padding:7px"></label><span id="s11FindCount" style="font-size:12px">0 matches</span><button type="button" id="s11OutlineToggle">Outline</button><button type="button" id="s11ExportTxt">Export TXT</button><button type="button" id="s11ExportHtml">Export HTML</button></div>
 <div class="s11outline" id="s11Outline" hidden></div>`;
 const toolbar=$('chapterRteToolbar');(toolbar||editor).before(tools);
 const get=id=>document.getElementById(id), count=()=>{const plain=editor.innerText||'';const words=(plain.trim().match(/\S+/g)||[]).length,chars=plain.length,goal=Math.max(0,Number(get('s11Goal').value)||0);
 get('s11Words').textContent=words.toLocaleString('en-IN')+' words';get('s11Chars').textContent=chars.toLocaleString('en-IN')+' characters';get('s11Read').textContent=Math.ceil(words/220)+' min reading';
 const pct=goal?Math.min(100,Math.round(words/goal*100)):0;get('s11GoalProgress').value=pct;get('s11GoalStatus').textContent=goal?pct+'% of goal':'Set a goal';
 const query=get('s11Find').value.trim();if(query){const esc=query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');let hits=0;try{hits=(plain.match(new RegExp(esc,'gi'))||[]).length}catch(_){}get('s11FindCount').textContent=hits+' matches';}else get('s11FindCount').textContent='0 matches';
 const headings=[...editor.querySelectorAll('h2,h3')].map(x=>x.innerText.trim()).filter(Boolean);get('s11Outline').textContent=headings.length?headings.join('  ·  '):'Add Heading or Subheading using the existing formatting toolbar.';
 };
 editor.classList.add('s11-paper');const apply=()=>{
 editor.classList.remove('s11-light','s11-sepia','s11-dark');editor.classList.add('s11-'+get('s11Theme').value);editor.style.fontSize=get('s11Font').value+'px';editor.style.lineHeight=get('s11Spacing').value;get('s11FontOut').textContent=get('s11Font').value;};
 const prefKey='sarni11-book-editor-preferences';
 try{const p=JSON.parse(localStorage.getItem(prefKey)||'{}');if(['light','sepia','dark'].includes(p.theme))get('s11Theme').value=p.theme;if(Number(p.font)>=15&&Number(p.font)<=26)get('s11Font').value=p.font;if(['1.5','1.8','2'].includes(String(p.spacing)))get('s11Spacing').value=p.spacing;if(Number(p.goal)>=0)get('s11Goal').value=p.goal;}catch(_){}
 function prefs(){apply();try{localStorage.setItem(prefKey,JSON.stringify({theme:get('s11Theme').value,font:get('s11Font').value,spacing:get('s11Spacing').value,goal:get('s11Goal').value}));}catch(_){}count();}
 ['s11Theme','s11Font','s11Spacing','s11Goal'].forEach(id=>get(id).addEventListener('input',prefs));apply();
 get('s11Find').addEventListener('input',count);
 get('s11OutlineToggle').onclick=()=>{get('s11Outline').hidden=!get('s11Outline').hidden;count();};
 let sessionStart=0,modified=false;
 editor.addEventListener('input',()=>{modified=true;get('s11Dirty').textContent='● Unsaved edits — use Save chapter';count();});
 editor.addEventListener('focus',()=>{if(!sessionStart)sessionStart=Date.now();});
 setInterval(()=>{if(modal.classList.contains('hidden')||!sessionStart)return;get('s11Time').textContent='Session '+Math.floor((Date.now()-sessionStart)/60000)+' min';},30000);
 const toggleFocus=()=>{modal.classList.toggle('s11-focus');get('s11Focus').textContent=modal.classList.contains('s11-focus')?'⤢ Exit focus':'⛶ Focus mode';};
 get('s11Focus').onclick=toggleFocus;
 const saveButton=$('saveChapterBtn');
 editor.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();if(saveButton&&!saveButton.disabled)saveButton.click();}});
 const exportFile=(html)=>{const title=($('chapterTitle')?.value||'Chapter').replace(/[^\w\- ]/g,'').slice(0,70)||'Chapter';const cleanHtml=(typeof sarniChapterSafeHtml==='function'?sarniChapterSafeHtml(editor.innerHTML):editor.innerText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));const text=html?'<!doctype html><meta charset="utf-8"><title>'+title.replace(/</g,'&lt;')+'</title><article>'+cleanHtml+'</article>':editor.innerText;const blob=new Blob([text],{type:html?'text/html;charset=utf-8':'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=title+(html?'.html':'.txt');a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);};
 get('s11ExportTxt').onclick=()=>exportFile(false);get('s11ExportHtml').onclick=()=>exportFile(true);
 const obs=new MutationObserver(()=>{if(!modal.classList.contains('hidden'))count();else{sessionStart=0;modified=false;get('s11Dirty').textContent='No changes detected';modal.classList.remove('s11-focus');get('s11Focus').textContent='⛶ Focus mode';}});
 obs.observe(modal,{attributes:true,attributeFilter:['class']});
 count();
 // Same-origin bridge: drafts from /q/ can be imported only after normal SarNi sign-in.
 const importer=document.createElement('div');importer.id='sarni11DraftImporter';section.querySelector('.books-list-view')?.append(importer);
 importer.innerHTML='<details><summary>📥 Import Quick Book Writing drafts from this browser</summary><p style="font-size:12px;color:#665d78">Only drafts created in this same browser appear here. Sign in normally; select an existing book and confirm each new chapter. No automatic overwrite or duplication.</p><div id="s11DraftList"></div><button type="button" id="s11RefreshDrafts">Find local drafts</button></details>';
 const area=get('s11DraftList');
 async function listDrafts(){
 area.replaceChildren();
 const keys=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('sarni11-book-draft-v1-'))keys.push(k);}}catch(_){}
 if(!keys.length){area.textContent='No Quick Book Writing drafts stored in this browser.';return;}
 let books=[];try{if(typeof api==='function'&&typeof state!=='undefined'&&state.token){const r=await api('listBooks',{});books=r?.data?.books||[];}}catch(_){}
 if(!books.length){area.textContent='Sign in and create or open a book in SarNi first. Existing drafts are retained.';return;}
 for(const key of keys){let data;try{data=JSON.parse(localStorage.getItem(key)||'null')}catch(_){continue}if(!data||!data.text?.trim())continue;
 const row=document.createElement('div');row.className='s11draft';
 const name=document.createElement('strong');name.textContent=(data.book||'Untitled book')+' · '+(data.chapter||'Untitled chapter');
 const sample=document.createElement('small');sample.textContent=data.text.slice(0,125)+(data.text.length>125?'…':'');
 const select=document.createElement('select');select.setAttribute('aria-label','Destination book');for(const b of books){const opt=new Option(b.title,b.id);select.append(opt);}
 const best=books.find(b=>b.title?.trim().toLowerCase()===String(data.book||'').trim().toLowerCase());if(best)select.value=best.id;
 const btn=document.createElement('button');btn.type='button';btn.textContent='Import as new chapter';
 btn.onclick=async()=>{if(!confirm('Import this draft as a NEW chapter into '+select.options[select.selectedIndex].text+'? Check the book first to avoid duplicates.'))return;btn.disabled=true;btn.textContent='Importing…';
 try{if(typeof api!=='function'||!state?.token)throw Error('Sign in to SarNi first.');const safeText=String(data.text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\r?\n/g,'<br>');
 const result=await api('saveChapter',{chapter:{bookId:select.value,id:'',title:String(data.chapter||'Quick Book Draft').slice(0,200),status:'DRAFTING',content:safeText,assignedTo:'',notes:'Imported from Quick Book Writing on '+new Date().toLocaleDateString('en-IN')}});
 if(!result?.ok)throw Error(result?.message||'Save not confirmed');btn.textContent='✓ Imported';row.append(document.createTextNode(' Saved to SarNi Book register. Your local draft is retained until you clear it.')); }
 catch(e){btn.textContent='Import failed — retry carefully';btn.disabled=false;const err=document.createElement('small');err.textContent=String(e.message||e)+' — check the destination before retrying to avoid duplicates.';row.append(err);}
 };
 row.append(name,sample,select,btn);area.append(row);
 }
 }
 get('s11RefreshDrafts').onclick=()=>void listDrafts();
 importer.querySelector('details').addEventListener('toggle',e=>{if(e.target.open)void listDrafts();});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
