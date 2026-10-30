/* SarNi Diary & Knowledge — reliable navigation v2.1 (2026-10-30)
 * Single workspace / three views. No database or authentication changes.
 * Loads safely even if Stock Diary is initialized AFTER this script.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const modes=['personal','stock','wisdom'];
let mode='personal',ready=false,started=false,pending=false,retryCount=0;
const captions={personal:'Personal Diary',stock:'Stock Research',wisdom:'Investment Wisdom'};
const titleText={personal:'Your diary, learning and monthly reflections',stock:'Company research, dated notes and reviews',wisdom:'Important lessons and investment book chapters'};
const isShown=el=>!!(el && !el.hidden && !el.classList.contains('hidden') && getComputedStyle(el).display!=='none');
function navButton(){return $('sarniSidebarPrimary')?.querySelector('button[data-section="diary"]');}
function switcher(){
 const n=document.createElement('nav');n.className='sarni-dk-switcher';n.setAttribute('aria-label','Diary and Knowledge');
 n.innerHTML='<div class="sarni-dk-title"><strong>Diary &amp; Knowledge</strong><span>One workspace · Your original records preserved</span></div>'+
 '<div class="sarni-dk-options" role="group" aria-label="Choose writing area">'+
 '<button type="button" data-dk="personal"><span aria-hidden="true">✎</span><strong>Personal Diary</strong><small>Everyday writing</small></button>'+
 '<button type="button" data-dk="stock"><span aria-hidden="true">▥</span><strong>Stock Research</strong><small>Companies &amp; reviews</small></button>'+
 '<button type="button" data-dk="wisdom"><span aria-hidden="true">✦</span><strong>Investment Wisdom</strong><small>Lessons &amp; book</small></button></div>';
 n.addEventListener('click',e=>{const b=e.target.closest('button[data-dk]');if(b)go(b.dataset.dk);});return n;
}
function onScreen(){return isShown($('diarySection'))||isShown($('stockDiarySection'));}
function mark(){
 if(!ready)return;
 const personal=isShown($('diarySection')),stock=isShown($('stockDiarySection'));
 const shown=personal?'personal':stock?mode:null;
 const root=document.documentElement;
 for(const name of modes)root.classList.toggle('sarni-dk-'+name,shown===name);
 document.querySelectorAll('.sarni-dk-switcher [data-dk]').forEach(b=>{
   const yes=b.dataset.dk===shown;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',yes?'true':'false');
 });
 const parent=navButton();
 if(parent && shown){parent.classList.add('active');parent.setAttribute('aria-current','page');}
 if(shown){const pg=$('pageTitle');if(pg&&pg.textContent!=='Diary & Knowledge')pg.textContent='Diary & Knowledge';}
 const heading=$('stockDiarySection')?.querySelector('.sd-hero h2');
 if(stock&&heading){const wanted=shown==='wisdom'?'Investment Wisdom':'Stock Research Diary';if(heading.textContent!==wanted)heading.textContent=wanted;}
 const desc=$('stockDiarySection')?.querySelector('.sd-hero p');
 if(stock&&desc){const wanted=titleText[shown]||'';if(desc.textContent!==wanted)desc.textContent=wanted;}
}
function queueMark(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;mark();});}
function checkUnsaved(){
 // Do not silently discard an open Stock Diary edit form.
 const form=$('stockDiarySection')?.querySelector('#sdForm');
 return !form || form.hidden || form.offsetParent===null || window.confirm('Leave this unsaved research form?');
}
function go(which){
 if(!modes.includes(which))return;
 if(which!==mode && !checkUnsaved())return;
 if(which==='personal'){
   mode='personal';const btn=navButton();if(!btn)return;
   if(!isShown($('diarySection')))btn.click();
 }else{
   if(!window.SarniStockDiary?.open){console.warn('Stock research is not ready. Refresh SarNi and sign in again.');return;}
   mode=which;
   window.SarniStockDiary.open(which==='wisdom'?'wisdom':'companies');
 }
 queueMark();
}
function relabel(){
 const btn=navButton();if(!btn)return;
 const icon=btn.querySelector('span[aria-hidden="true"]');
 if(icon)icon.textContent='◈';
 // Retain button identity and all attached listeners.
 for(const node of [...btn.childNodes])if(node.nodeType===3)node.nodeValue=' Diary & Knowledge';
 btn.setAttribute('title','Personal Diary · Stock Research · Investment Wisdom');
}
function init(){
 if(ready)return true;
 const diary=$('diarySection'),stock=$('stockDiarySection'),sidebar=navButton();
 if(!diary||!stock||!sidebar||typeof window.SarniStockDiary?.open!=='function')return false;
 relabel();
 if(!diary.querySelector('.sarni-dk-switcher'))diary.insertBefore(switcher(),diary.firstChild);
 if(!stock.querySelector('.sarni-dk-switcher'))stock.insertBefore(switcher(),stock.firstChild);
 // Stock Diary updates its own nav when the user moves between sections.
 const previous=window.sarniStockAfterNavigate;
 if(!previous?.__sarniDK21){
   const hook=function(section){if(typeof previous==='function')previous(section);
     if(section==='diary')mode='personal';
     else if(section==='stockDiary'&&mode==='personal')mode='stock';
     queueMark();};
   hook.__sarniDK21=true;window.sarniStockAfterNavigate=hook;
 }
 document.addEventListener('click',e=>{
  const diaryLink=e.target.closest('[data-section="diary"]');
  if(diaryLink){mode='personal';queueMark();}
  // Calendar is a separate, single app: no diary calendar is created here.
 },true);
 const observer=new MutationObserver(queueMark);
 observer.observe(diary,{attributes:true,attributeFilter:['class','hidden']});
 observer.observe(stock,{attributes:true,attributeFilter:['class','hidden']});
 ready=true;document.documentElement.classList.add('sarni-dk-ready');mark();
 window.SarniDiaryKnowledge={version:'2.1',open:go,ready:()=>ready};
 return true;
}
function start(){
 if(started)return;started=true;
 if(init())return;
 // Finite retry for asynchronous Stock Diary initialization, then leave original menu untouched.
 const poll=()=>{if(ready)return;if(init())return;if(++retryCount<40)setTimeout(poll,250);else console.warn('SarNi Diary & Knowledge: prerequisites not available; original navigation preserved.');};
 poll();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('load',()=>{if(!ready)init();},{once:true});
})();
