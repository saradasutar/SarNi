/* SarNi 11 — optional quick book desk. Client-side draft only.
   Book contents are never submitted to the six existing entry routes.
   Visibility switch is URL-configured and affects this link view, not server permissions. */
(()=>{
'use strict';
const query=new URLSearchParams(location.search);
if(query.get('book')!=='1')return;
const displaced=(query.get('replace')||'stock').toLowerCase();
const allowed=new Set(['expense','diary','stock','office','investment','family']);
const replaced=allowed.has(displaced)?displaced:'stock';
const host=document.querySelector('main'),tabs=document.getElementById('tabs');
if(!host||!tabs)return;
const note=document.createElement('section');
note.id='sarni11BookDesk';
note.hidden=true;
note.innerHTML=`<div class="sarni11-head"><div><small>PRIVATE WRITING DESK · SARNI 11</small><h2>📖 Book Writing</h2><p>Capture a chapter or memory wherever you are.</p></div><a href="../" target="_blank" rel="noopener noreferrer">Open main SarNi ↗</a></div>
<div class="sarni11-fields"><label>Book title<input id="sarni11BookTitle" maxlength="200" placeholder="e.g. My Father's Life"></label><label>Chapter / section<input id="sarni11Chapter" maxlength="200" placeholder="e.g. Childhood memories"></label></div>
<label>Chapter text<textarea id="sarni11Text" rows="12" placeholder="Write your memories, scenes, dialogue and chapter ideas…"></textarea></label>
<div class="sarni11-metrics"><span id="sarni11Words">0 words</span><span id="sarni11Saved">Not saved</span></div>
<div class="sarni11-actions"><button type="button" id="sarni11Save">Save draft on this device</button><button type="button" id="sarni11Download">Export text</button><button type="button" id="sarni11Copy">Copy text</button><button type="button" id="sarni11Clear">Clear draft</button></div>
<p class="sarni11-warning"><strong>Draft only:</strong> This feature does not yet write to the SarNi Book register. Device drafts are stored in this browser and may be lost if its data is cleared. Do not use on a shared device. Export your writing regularly.</p>`;
const style=document.createElement('style');
style.textContent=`
#sarni11BookDesk{background:#fff;border:1px solid #e2e1f1;border-radius:18px;padding:clamp(14px,3vw,25px);box-shadow:0 8px 28px #433a7012;margin-top:12px;color:#263454}
#sarni11BookDesk[hidden]{display:none!important}
.sarni11-head{display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap;margin-bottom:18px}
.sarni11-head small{color:#8462ae;font-size:11px;font-weight:850;letter-spacing:1px}.sarni11-head h2{font-size:26px;line-height:1.2;margin:5px 0}.sarni11-head p{margin:5px 0;color:#64748b}.sarni11-head a{color:#6042a3;font-weight:750;text-decoration:none}
#sarni11BookDesk label{display:block;font-weight:750;color:#3b3d61;margin:9px 0}
#sarni11BookDesk input,#sarni11BookDesk textarea{display:block;width:100%;box-sizing:border-box;border:1px solid #c9cbdf;border-radius:10px;padding:12px;margin-top:5px;font:inherit;font-size:16px;background:#fff;color:#24304b}
#sarni11BookDesk textarea{min-height:240px;line-height:1.8;resize:vertical}
.sarni11-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sarni11-metrics{display:flex;justify-content:space-between;color:#64748b;font-size:12px;margin:8px 0 12px}
.sarni11-actions{display:flex;flex-wrap:wrap;gap:8px}.sarni11-actions button{background:#f1ecfa;color:#543988;border:1px solid #d4c7ed;border-radius:9px;font-weight:750;padding:10px 13px;min-height:42px;cursor:pointer}
.sarni11-actions button:first-child{background:#6545ab;color:#fff}.sarni11-warning{font-size:12px;line-height:1.6;color:#795c28;background:#fff8e9;border:1px solid #f1ddaf;border-radius:10px;padding:12px;margin:14px 0 0}
#tabs button.sarni11-book-tab{background:#f0e9fb!important;color:#53328f!important;border:1px solid #cab7ed!important}
#tabs button.sarni11-book-tab.selected{box-shadow:0 0 0 2px #7655af inset!important}
@media(max-width:520px){.sarni11-fields{grid-template-columns:1fr}.sarni11-head h2{font-size:22px}}
`;
document.head.append(style);
const entry=document.getElementById('entry'),heading=document.querySelector('.entry-heading');
if(!entry)return;
entry.after(note);
const field=id=>document.getElementById(id);
const storageKey='sarni11-book-draft-v1'; // local drafts intentionally scoped to browser, not token
let bookActive=false,dirty=false;
try{const draft=JSON.parse(localStorage.getItem(storageKey)||'null');if(draft&&typeof draft==='object'){field('sarni11BookTitle').value=String(draft.book||'');field('sarni11Chapter').value=String(draft.chapter||'');field('sarni11Text').value=String(draft.text||'');field('sarni11Saved').textContent='Local draft found';}}catch(_){}
function words(){field('sarni11Words').textContent=(field('sarni11Text').value.trim().match(/\S+/g)||[]).length+' words';}
for(const el of [field('sarni11BookTitle'),field('sarni11Chapter'),field('sarni11Text')])el.addEventListener('input',()=>{dirty=true;words();field('sarni11Saved').textContent='Unsaved changes';});
words();
function save(){try{localStorage.setItem(storageKey,JSON.stringify({book:field('sarni11BookTitle').value,chapter:field('sarni11Chapter').value,text:field('sarni11Text').value,updated:new Date().toISOString()}));dirty=false;field('sarni11Saved').textContent='Saved on this device';}catch(_){field('sarni11Saved').textContent='Local save failed — export now';}}
field('sarni11Save').onclick=save;
const content=()=>[field('sarni11BookTitle').value,field('sarni11Chapter').value,'',field('sarni11Text').value].join('\n');
field('sarni11Copy').onclick=async()=>{try{await navigator.clipboard.writeText(content());field('sarni11Saved').textContent='Copied to clipboard';}catch(_){field('sarni11Saved').textContent='Copy unavailable — use Export text';}};
field('sarni11Download').onclick=()=>{const blob=new Blob([content()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='SarNi-book-draft-'+new Date().toISOString().slice(0,10)+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
field('sarni11Clear').onclick=()=>{if(!confirm('Clear this local book draft? Export first if you need a backup.'))return;for(const el of [field('sarni11BookTitle'),field('sarni11Chapter'),field('sarni11Text')])el.value='';localStorage.removeItem(storageKey);dirty=false;words();field('sarni11Saved').textContent='Draft cleared';};
function showBook(){bookActive=true;entry.hidden=true;entry.style.display='none';if(heading)heading.hidden=true;note.hidden=false;syncTabs();}
function closeBook(){if(dirty&&!confirm('Unsaved book edits will remain in this page only. Save or export first. Leave Book Writing?'))return false;bookActive=false;note.hidden=true;entry.style.removeProperty('display');entry.hidden=false;if(heading)heading.hidden=false;syncTabs();return true;}
function syncTabs(){
 const old=tabs.querySelector('button[data-mode="'+replaced+'"]');
 if(old)old.hidden=true,old.style.display='none';
 let book=tabs.querySelector('.sarni11-book-tab');
 if(!book){book=document.createElement('button');book.type='button';book.className='sarni11-book-tab qe-premium-tab';book.innerHTML='<span class="qe-tab-icon" aria-hidden="true">📖</span><span class="qe-tab-name">Book Writing</span>';book.onclick=()=>showBook();tabs.append(book);}
 book.classList.toggle('selected',bookActive);book.setAttribute('aria-pressed',String(bookActive));book.setAttribute('aria-current',bookActive?'page':'false');
 if(bookActive){tabs.querySelectorAll('button[data-mode]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');b.removeAttribute('aria-current');});}
}
tabs.addEventListener('click',e=>{if(!bookActive)return;const b=e.target.closest('button[data-mode]');if(!b)return;if(!closeBook()){e.preventDefault();e.stopPropagation();}});
const observer=new MutationObserver(()=>{if(bookActive){entry.hidden=true;entry.style.display='none';if(heading)heading.hidden=true;}syncTabs();});
observer.observe(tabs,{childList:true});
const initial=setInterval(()=>{if(!tabs.hidden&&tabs.querySelector('button[data-mode]')){syncTabs();clearInterval(initial);}},150);
setTimeout(()=>clearInterval(initial),20000);
})();
