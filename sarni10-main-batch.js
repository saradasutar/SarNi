/* SarNi 10: ten progressive main-dashboard usability improvements.
   No API calls, storage, permissions, form writes, or existing navigation overrides. */
(()=>{
 'use strict';
 function init(){
  const main=document.getElementById('mainDashboard');
  const app=document.getElementById('appView');
  const sidebar=document.getElementById('sarniSidebarPrimary');
  const topbar=main?.querySelector('.topbar');
  if(!main||!app||!sidebar||!topbar||document.getElementById('sarni10Tools'))return;
  const shortcuts=[['overview','Home','⌂'],['expenditure','Expense','₹'],['calendar','Calendar','▦'],['diary','Diary','✎']];
  const navButtons=()=>[...sidebar.querySelectorAll('button[data-section]:not(.hidden)')].filter(b=>!b.disabled);
  function navigate(section){
   const target=navButtons().find(b=>b.dataset.section===section);
   if(!target)return false;
   target.click();return true;
  }
  const strip=document.createElement('nav');strip.id='sarni10Tools';strip.className='sarni10-tools';
  strip.setAttribute('aria-label','Quick dashboard navigation');
  const location=document.createElement('span');location.id='sarni10Current';location.className='sarni10-current';
  location.setAttribute('aria-live','polite');location.textContent='Home';
  const jump=document.createElement('select');jump.id='sarni10Jump';
  jump.setAttribute('aria-label','Jump to dashboard section');
  const first=document.createElement('option');first.value='';first.textContent='Jump to section';jump.append(first);
  for(const [section,label] of shortcuts){
   const opt=document.createElement('option');opt.value=section;opt.textContent=label;jump.append(opt);
  }
  const actions=document.createElement('div');actions.className='sarni10-actions';
  for(const [section,label,glyph] of shortcuts){
   const button=document.createElement('button');button.type='button';button.className='sarni10-action';
   button.dataset.target=section;button.textContent=glyph+' '+label;button.title='Open '+label;
   button.addEventListener('click',()=>navigate(section));actions.append(button);
  }
  strip.append(location,jump,actions);
  topbar.insertAdjacentElement('afterend',strip);
  jump.addEventListener('change',()=>{navigate(jump.value);jump.value='';});
  function syncSection(){
   const selected=navButtons().find(b=>b.classList.contains('active')||b.getAttribute('aria-current')==='page');
   const section=selected?.dataset.section||'overview';
   const label=(selected?.textContent||'Home').trim().replace(/\s+/g,' ').slice(0,45);
   location.textContent='Viewing: '+label;
   actions.querySelectorAll('button').forEach(b=>{
    const active=b.dataset.target===section;
    b.classList.toggle('is-active',active);
    if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
   });
  }
  // 1. Jump selector, 2. section indicator, 3. favorites all reuse existing navigation.
  const observer=new MutationObserver(syncSection);
  observer.observe(sidebar,{subtree:true,attributes:true,attributeFilter:['class','aria-current','disabled']});
  syncSection();
  // 4. Keyboard section shortcuts, disabled in text fields and modals.
  document.addEventListener('keydown',e=>{
   if(!e.altKey||!e.shiftKey||e.ctrlKey||e.metaKey||e.repeat)return;
   const key=e.key.toLowerCase(),mapping={h:'overview',e:'expenditure',c:'calendar',d:'diary'};
   const section=mapping[key];if(!section||app.classList.contains('hidden'))return;
   const a=document.activeElement;
   if(a?.isContentEditable||a?.matches('input,textarea,select,[role="textbox"]'))return;
   if(document.querySelector('.modal:not(.hidden),[role="dialog"]:not(.hidden)'))return;
   if(navigate(section))e.preventDefault();
  });
  strip.title='Shortcuts: Alt+Shift+H (Home), E (Expense), C (Calendar), D (Diary)';
  // 5. Reading progress — viewport scroll only, no personal data.
  const progress=document.createElement('div');progress.id='sarni10Progress';progress.setAttribute('aria-hidden','true');
  const fill=document.createElement('div');fill.className='sarni10-progress-fill';progress.append(fill);document.body.append(progress);
  // 6. Back to Top.
  const back=document.createElement('button');back.id='sarni10Top';back.type='button';back.textContent='↑ Top';
  back.setAttribute('aria-label','Back to top');back.hidden=true;document.body.append(back);
  back.addEventListener('click',()=>{
   window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
   main.scrollTo?.({top:0,behavior:'auto'});
  });
  let frame=false;
  const updateScroll=()=>{
   frame=false;
   if(app.classList.contains('hidden')){progress.hidden=true;back.hidden=true;return;}
   const scroller=main.scrollHeight>main.clientHeight+60&&getComputedStyle(main).overflowY!=='visible'?main:document.scrollingElement;
   const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
   const y=Math.max(0,scroller.scrollTop||0);
   fill.style.transform='scaleX('+(max?Math.min(1,y/max):0)+')';
   progress.hidden=max<150;
   back.hidden=y<450;
  };
  const schedule=()=>{if(!frame){frame=true;requestAnimationFrame(updateScroll);}};
  window.addEventListener('scroll',schedule,{passive:true});
  main.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  const visibility=new MutationObserver(schedule);
  visibility.observe(app,{attributes:true,attributeFilter:['class']});
  schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
