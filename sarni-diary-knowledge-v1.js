/* SarNi Diary & Knowledge unified workspace v1.0.
   Presentation-only add-on: no changes to storage, authentication, or API routing. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const areas=['personal','stock','wisdom'];
 let active='personal', switching=false, ready=false;
 const sections={personal:'diarySection',stock:'stockDiarySection',wisdom:'stockDiarySection'};
 const names={personal:'Personal Diary',stock:'Stock Research',wisdom:'Investment Wisdom'};
 const captions={personal:'Your daily notes, plans and personal reflections.',stock:'Company research, dated notes and review decisions.',wisdom:'Preserved lessons, principles and your investment book.'};
 function panel(){
  const nav=document.createElement('nav');nav.className='sarni-dk-switcher';nav.setAttribute('aria-label','Diary and Knowledge workspaces');
  nav.innerHTML='<div class="sarni-dk-heading"><span class="sarni-dk-heading-icon" aria-hidden="true">◈</span><div><strong>Diary &amp; Knowledge</strong><small>One home for writing, research and lessons</small></div><span class="sarni-dk-build">WORKSPACE</span></div>'+ 
  '<div class="sarni-dk-options">'+
  '<button type="button" data-dk="personal"><span aria-hidden="true">✎</span><span><strong>Personal Diary</strong><small>Daily notes &amp; plans</small></span></button>'+
  '<button type="button" data-dk="stock"><span aria-hidden="true">▥</span><span><strong>Stock Research</strong><small>Stocks &amp; reviews</small></span></button>'+
  '<button type="button" data-dk="wisdom"><span aria-hidden="true">✦</span><span><strong>Investment Wisdom</strong><small>Lessons &amp; book</small></span></button></div>';
  nav.addEventListener('click',e=>{const button=e.target.closest('button[data-dk]');if(button)go(button.dataset.dk);});
  return nav;
 }
 function diarySidebar(){return $('sarniSidebarPrimary')?.querySelector('[data-section="diary"]');}
 function isVisible(id){const el=$(id);return !!(el && !el.classList.contains('hidden') && !el.hidden);}
 function updateView(){
  if(!ready)return;
  const personal=isVisible('diarySection'),stock=isVisible('stockDiarySection');
  const shown=personal?'personal':stock?active:null;
  document.documentElement.classList.toggle('sarni-dk-personal',shown==='personal');
  document.documentElement.classList.toggle('sarni-dk-stock',shown==='stock');
  document.documentElement.classList.toggle('sarni-dk-wisdom',shown==='wisdom');
  document.querySelectorAll('.sarni-dk-switcher [data-dk]').forEach(el=>{
    const selected=el.dataset.dk===shown;
    el.classList.toggle('active',selected);
    if(selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
  });
  // The stock-specific nav button is hidden; use the unified parent as its active indicator.
  const parent=diarySidebar();
  if(parent && (personal||stock)){
    parent.classList.add('active');parent.setAttribute('aria-current','page');
  }
  // Do not change the page title for other modules.
  if(personal||stock){const title=$('pageTitle');if(title)title.textContent='Diary & Knowledge';}
  const hero=$('stockDiarySection')?.querySelector('.sd-hero h2');
  if(hero)hero.textContent=shown==='wisdom'?'Investment Wisdom':'Stock Research';
  const paragraph=$('stockDiarySection')?.querySelector('.sd-hero p');
  if(paragraph)paragraph.textContent=shown==='wisdom'?'Save your best lessons, refine your principles, and build your own investment reference book.':'Study companies, preserve your original reasoning, and review what changed over time.';
 }
 function go(mode){
  if(!areas.includes(mode) || switching)return;
  if(mode==='personal' && isVisible('diarySection')){active=mode;updateView();return;}
  if(mode!=='personal' && !window.SarniStockDiary?.open){console.warn('Stock Diary module is not ready');return;}
  const editing=$('sdForm');
  if(editing && (active!==mode) && !window.confirm('Leave this research form? Unsaved edits may be lost.'))return;
  switching=true;
  try{
    active=mode;
    if(mode==='personal')diarySidebar()?.click();
    else window.SarniStockDiary.open(mode==='wisdom'?'wisdom':'companies');
    updateView();
    // Existing SarNi navigation updates the sidebar asynchronously in some releases.
    requestAnimationFrame(updateView);
  }finally{switching=false;}
 }
 function addQuickWisdom(){
  const grid=document.querySelector('.sarni-mobile-add-grid');
  if(grid&&!grid.querySelector('[data-dk-quick-wisdom]')){
   const button=document.createElement('button');button.type='button';button.setAttribute('data-dk-quick-wisdom','1');
   button.innerHTML='<span class="sarni-add-glyph sky" aria-hidden="true">✦</span><strong>Investment Wisdom</strong><small>Save a lesson</small>';
   button.addEventListener('click',()=>{go('wisdom');requestAnimationFrame(()=>{
     const create=$('sdView')?.querySelector('[data-do="create"]');
     if(create)create.click();
   });});grid.append(button);
  }
 }
 function init(){
  if(ready)return;
  const diary=$('diarySection'),stock=$('stockDiarySection'),sidebar=diarySidebar();
  if(!diary||!stock||!sidebar||!window.SarniStockDiary){console.warn('Diary & Knowledge: installed files missing; leaving existing navigation unchanged.');return;}
  // Keep the original data-section="diary" button intact so all legacy shortcuts work.
  const icon=sidebar.querySelector('span[aria-hidden]');
  sidebar.textContent='';
  if(icon){icon.textContent='◈';sidebar.append(icon);}else{const s=document.createElement('span');s.setAttribute('aria-hidden','true');s.textContent='◈';sidebar.append(s);}
  sidebar.append(document.createTextNode(' Diary & Knowledge'));
  sidebar.title='Diary & Knowledge — personal diary, stock research, investment lessons';
  if(!diary.querySelector('.sarni-dk-switcher'))diary.prepend(panel());
  if(!stock.querySelector('.sarni-dk-switcher'))stock.prepend(panel());
  const stockButtons=$('sarniSidebarPrimary')?.querySelectorAll('[data-section="stockDiary"],[data-sd-only="wisdom"]');
  if(!stockButtons||stockButtons.length<2){console.warn('Diary & Knowledge: existing stock navigation not detected; grouped buttons left visible.');}
  // Keep the existing stock navigation callback to preserve showing/hiding sections.
  const prior=window.sarniStockAfterNavigate;
  if(!prior?.__dkWrapped){
    const wrapper=function(section){if(typeof prior==='function')prior(section);
      if(section==='diary')active='personal';
      else if(section==='stockDiary' && active==='personal')active='stock';
      requestAnimationFrame(updateView);
    };
    wrapper.__dkWrapped=true;window.sarniStockAfterNavigate=wrapper;
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-section="diary"]') && !e.target.closest('.sarni-dk-switcher')){active='personal';requestAnimationFrame(updateView);}
  },true);
  new MutationObserver(updateView).observe(diary,{attributes:true,attributeFilter:['class','hidden']});
  new MutationObserver(updateView).observe(stock,{attributes:true,attributeFilter:['class','hidden']});
  ready=true;
  document.documentElement.classList.add('sarni-dk-ready');
  addQuickWisdom();updateView();
  window.SarniDiaryKnowledge={open:go,version:'1.0'};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
