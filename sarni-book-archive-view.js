/* SarNi Book Archive visibility v1 — read-only. No storage or backend mutations. */
(()=>{'use strict';
if(window.__sarniBookArchiveView)return;window.__sarniBookArchiveView=true;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const archived=b=>{const s=String(b.status||'').toUpperCase();return s==='ARCHIVED'||s==='ARCHIVE'||b.isArchived===true||Boolean(b.archivedAt)};
let mode='active',books=[],loading=false;
const css=document.createElement('style');css.textContent=`
#sarniBookArchiveTabs{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:9px 0 14px}
#sarniBookArchiveTabs button{border:1px solid #d4d4ed;border-radius:10px;background:#f7f7fe;color:#51437d;padding:9px 12px;font-size:12px;font-weight:800;cursor:pointer}
#sarniBookArchiveTabs button[aria-selected="true"]{background:#e7e1ff;color:#4c2ca0;border-color:#9987d8}
#sarniArchiveBooksPanel{margin:10px 0;border:1px solid #d9def0;padding:14px;border-radius:13px;background:#f9faff;min-width:0}
#sarniArchiveBooksPanel[hidden]{display:none!important}
#sarniArchiveBooksPanel .sarni-archive-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,210px),1fr));gap:12px;margin-top:12px}
#sarniArchiveBooksPanel .sarni-archive-card{border:1px solid #dde0ef;border-radius:12px;background:white;padding:14px;color:#253451}
#sarniArchiveBooksPanel .sarni-archive-card strong{display:block;margin-bottom:5px;overflow-wrap:anywhere}
#sarniArchiveBooksPanel .sarni-archive-card small{display:block;color:#718098;margin-bottom:8px}
#sarniArchiveBooksPanel .sarni-archive-card button{border:1px solid #bdb1ec;border-radius:8px;padding:7px 10px;background:#f1edff;color:#4b3995;font-weight:800;cursor:pointer}
#sarniArchiveBooksPanel .sarni-archive-note{font-size:12px;color:#52647d;line-height:1.6;margin:5px 0}
`;document.head.append(css);
function boot(){
 const section=document.getElementById('booksSection'),grid=document.getElementById('booksGrid');
 if(!section||!grid||document.getElementById('sarniBookArchiveTabs'))return;
 const head=section.querySelector('.books-list-view .panel-head');
 const bar=document.createElement('div');bar.id='sarniBookArchiveTabs';bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Book list views');
 const make=(id,label)=>{const b=document.createElement('button');b.id=id;b.type='button';b.setAttribute('role','tab');b.textContent=label;bar.appendChild(b);return b;};
 const active=make('sarniBookActiveTab','Current books');const archive=make('sarniBookArchivedTab','Archived books');
 const refresh=make('sarniBookArchiveRefresh','↻ Refresh list');refresh.removeAttribute('role');
 const panel=document.createElement('div');panel.id='sarniArchiveBooksPanel';panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-label','Archived books');
 grid.parentElement.insertBefore(bar,grid);grid.parentElement.insertBefore(panel,grid.nextSibling);
 const render=()=>{
  active.setAttribute('aria-selected',String(mode==='active'));archive.setAttribute('aria-selected',String(mode==='archive'));
  panel.hidden=mode!=='archive';grid.hidden=mode==='archive';
  const empty=document.getElementById('booksEmpty');if(empty)empty.style.display=mode==='archive'?'none':'';
  if(mode!=='archive')return;
  const list=books.filter(archived);
  if(loading){panel.innerHTML='<p class="sarni-archive-note">Checking your saved books…</p>';return;}
  if(!list.length){panel.innerHTML='<strong>Archived books are not included in the book list returned by the server.</strong><p class="sarni-archive-note">This does not mean the books were deleted. The server may be excluding archived records from listBooks. Refresh once; if this message remains, the Apps Script book-list action must be updated to return archived books for the signed-in user.</p>';return;}
  panel.innerHTML='<strong>Archived books ('+list.length+')</strong><div class="sarni-archive-grid">'+list.map(b=>'<article class="sarni-archive-card"><strong>'+esc(b.title||'Untitled book')+'</strong><small>'+esc(b.genre||'Book')+' · Archived</small><button type="button" data-sarni-open-archive="'+esc(b.id)+'">Open book</button></article>').join('')+'</div>';
 };
 const fetchBooks=async(force=false)=>{
  const api=window.SarniHomeBookApi;
  if(!api?.load){panel.innerHTML='<p class="sarni-archive-note">Book list is still initializing.</p>';return;}
  loading=true;render();
  try{const res=await api.load(force);books=Array.isArray(res)?res:[]}
  catch(err){books=[];panel.innerHTML='<p class="sarni-archive-note">Unable to load books: '+esc(err?.message||err)+'</p>';loading=false;return;}
  loading=false;render();
 };
 active.addEventListener('click',()=>{mode='active';render()});
 archive.addEventListener('click',()=>{mode='archive';render();fetchBooks(true)});
 refresh.addEventListener('click',()=>fetchBooks(true));
 panel.addEventListener('click',ev=>{const b=ev.target.closest('[data-sarni-open-archive]');if(!b)return;const id=b.getAttribute('data-sarni-open-archive');const opened=window.SarniHomeBookApi?.open?.(id);if(!opened)panel.insertAdjacentHTML('afterbegin','<p class="sarni-archive-note">Unable to open this book with the current session. Please sign in again and retry.</p>')});
 document.addEventListener('sarni:home-books-updated',()=>{const v=window.SarniHomeBookApi?.peek?.();if(Array.isArray(v)){books=v;render()}});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();