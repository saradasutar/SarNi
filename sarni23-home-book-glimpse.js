/* SarNi Home Book Glimpse — automatic, read-only, no manual entry.
   Reads only the existing authenticated listBooks summary. No manuscript text
   is persisted to browser storage, and no new spreadsheet is created. */
(()=>{
'use strict';
function boot(){
 const $=id=>document.getElementById(id),root=$('sarniHomeBookGlance'),select=$('sarniHomeBookChoose'),open=$('sarniHomeOpenBook');
 if(!root||!select||!open||root.dataset.ready==='1')return;
 root.dataset.ready='1';
 const fmt=x=>Math.max(0,Number(x)||0).toLocaleString('en-IN');
 const set=(id,value)=>{const n=$(id);if(n)n.textContent=value;};
 let books=[],chosen='',busy=false,awaiting=false;
 const validDate=input=>{
  if(!input)return null;
  const date=new Date(input);return Number.isFinite(date.getTime())?date:null;
 };
 const fallback=msg=>{
  set('sarniHwChapters','—');set('sarniHwChapterDetail','Saved chapters');
  set('sarniHwWords','—');set('sarniHwTarget','—');set('sarniHwTargetDetail','From book settings');
  set('sarniHwRecent','—');set('sarniHwRecentDetail','Latest saved update');
  set('sarniHwPercent','—');set('sarniHwGoalLabel','Book word target');
  const fill=$('sarniHwFill');if(fill)fill.style.width='0%';
  const track=$('sarniHwTrack');if(track){track.setAttribute('aria-valuenow','0');track.setAttribute('aria-label','Book word target not available');}
  set('sarniHwStatus',msg);
 };
 const chooseBook=list=>{
  const byId=list.find(b=>String(b.id)===chosen);
  const focus=list.find(b=>/the story before ours/i.test(String(b.title||'')));
  return byId||focus||list.find(b=>b.active!==false)||list[0];
 };
 function paint(){
  if(!books.length){fallback('No books are available in your account yet. Open Book Writing to create one.');open.disabled=true;return;}
  const book=chooseBook(books);
  if(!book){fallback('Book summary is unavailable.');open.disabled=true;return;}
  chosen=String(book.id);
  select.value=chosen;
  open.disabled=false;
  const count=Math.max(0,Number(book.chapterCount)||0),done=Math.max(0,Number(book.doneChapterCount)||0);
  const words=Math.max(0,Number(book.totalWordCount)||0);
  const target=Math.max(0,Number(book.targetWordCount)||0);
  const percent=target?Math.min(100,Math.round(words/target*100)):null;
  set('sarniHwChapters',fmt(done)+' / '+fmt(count));
  set('sarniHwChapterDetail',count?Math.round(100*done/count)+'% completed':'No chapters yet');
  set('sarniHwWords',fmt(words));
  set('sarniHwTarget',target?fmt(target):'Not set');
  set('sarniHwTargetDetail',target?'Total manuscript target':'Set target in Book Writing');
  const updated=validDate(book.latestChapterAt||book.updatedAt||book.lastUpdatedAt);
  set('sarniHwRecent',updated?new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short'}).format(updated):'Not recorded');
  set('sarniHwRecentDetail',updated?(book.latestChapterAt?'Latest saved chapter update':'Latest book record update'):'Date unavailable');
  set('sarniHwPercent',percent===null?'—':percent+'%');
  set('sarniHwGoalLabel',target?'Target: '+fmt(words)+' / '+fmt(target)+' words':'Add a word target in Book Writing');
  const fill=$('sarniHwFill');if(fill)fill.style.width=(percent||0)+'%';
  const track=$('sarniHwTrack');if(track){track.setAttribute('aria-valuenow',String(percent||0));track.setAttribute('aria-label',percent===null?'Book word target not set':'Book writing target '+percent+' percent complete');}
  set('sarniHwStatus','Automatically updated from saved book records. No writing log needed.');
 }
 function populate(rows){
  if(!Array.isArray(rows))return;
  books=rows.filter(b=>b&&b.id);
  const remembered=chosen;
  select.replaceChildren();
  if(!books.length){const o=new Option('No books','');select.add(o);paint();return;}
  for(const b of books){
   const option=new Option(String(b.title||'Untitled book'),String(b.id));
   select.add(option);
  }
  chosen=remembered;
  paint();
 }
 async function load(force=false){
  if(busy){awaiting=true;return;}
  const service=window.SarniHomeBookApi;
  if(!service?.load)return;
  busy=true;
  if(!books.length)set('sarniHwStatus','Loading saved book progress…');
  try{
   const response=await service.load(force);
   populate(response);
  }catch(e){
   if(!books.length)fallback('Could not load book progress. Open Book Writing to check connectivity.');
   else set('sarniHwStatus','Showing last loaded figures. Refresh Book Writing for the latest records.');
  }finally{
   busy=false;if(awaiting){awaiting=false;load(false);}
  }
 }
 select.addEventListener('change',()=>{chosen=select.value;paint();});
 open.addEventListener('click',()=>{
  if(!chosen)return;
  if(!window.SarniHomeBookApi?.open?.(chosen))set('sarniHwStatus','Open Book Writing from the More menu to select a book.');
 });
 document.addEventListener('sarni:home-visible',()=>{load(false);});
 document.addEventListener('sarni:home-books-updated',()=>{
  const rows=window.SarniHomeBookApi?.peek?.();if(rows)populate(rows);
 });
 // Initial signed-in home: run only after it becomes visible, never on login screen.
 function checkInitial(){
  const app=$('appView'),home=$('overviewSection');
  if(app&&!app.classList.contains('hidden')&&home&&!home.classList.contains('hidden'))load(false);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',checkInitial,{once:true});
 else checkInitial();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();