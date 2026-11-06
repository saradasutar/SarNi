/* SarNi main dashboard: batch of ten progressive UX improvements.
 * No API, storage, authentication, submission, or data mutation.
 * Existing nav-item click handlers own the actual section transitions. */
(()=>{
 'use strict';
 const init=()=>{
  const dashboard=document.getElementById('mainDashboard');
  const app=document.getElementById('appView');
  const navigation=document.getElementById('sarniSidebarPrimary');
  if(!dashboard||!app||!navigation||document.getElementById('sarni10Nav'))return;
  const sections=[
   {key:'overview',title:'Home',short:'Home',icon:'⌂'},
   {key:'diary',title:'Diary',short:'Diary',icon:'✎'},
   {key:'calendar',title:'Calendar',short:'Calendar',icon:'▦'},
   {key:'expenditure',title:'Expense',short:'Expense',icon:'₹'}
  ];
  // 1. Compact, additive section quick navigation (no duplicate app routing).
  const nav=document.createElement('nav');nav.id='sarni10Nav';nav.className='sarni10-nav';
  nav.setAttribute('aria-label','Quick section navigation');
  const caption=document.createElement('span');caption.className='sarni10-nav-title';caption.textContent='QUICK SECTIONS';
  nav.append(caption);
  const items=new Map();
  for(const item of sections){
   const button=document.createElement('button');button.type='button';
   button.dataset.sarni10Section=item.key;button.className='sarni10-nav-button';
   button.textContent=item.icon+' '+item.short;button.title='Open '+item.title;
   button.setAttribute('aria-label','Open '+item.title);
   button.addEventListener('click',()=>{
    const original=navigation.querySelector('[data-section="'+item.key+'"]');
    if(original&&original.getClientRects().length)original.click();
    else if(original)original.click();
   });
   items.set(item.key,button);nav.append(button);
  }
  const health=document.getElementById('sarniMainHealth');
  if(health)health.insertAdjacentElement('beforebegin',nav);
  else dashboard.prepend(nav);

  // 2. Current-section announcement that tracks existing navigation.
  const live=document.createElement('span');live.id='sarni10ActiveStatus';
  live.className='sarni10-screen-reader';live.setAttribute('role','status');
  live.setAttribute('aria-live','polite');nav.append(live);
  let activeKey='';
  function sync(){
   if(app.classList.contains('hidden'))return;
   const active=navigation.querySelector('.nav-item.active[data-section]')?.dataset.section||'';
   for(const [key,button] of items){
    const selected=key===active;
    button.classList.toggle('is-current',selected);
    if(selected)button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
   }
   if(active&&active!==activeKey){
    activeKey=active;
    const chosen=sections.find(x=>x.key===active);
    if(chosen)live.textContent=chosen.title+' section selected';
   }
  }
  navigation.addEventListener('click',()=>queueMicrotask(sync));
  const observer=new MutationObserver(sync);
  observer.observe(navigation,{subtree:true,attributes:true,attributeFilter:['class']});
  observer.observe(app,{attributes:true,attributeFilter:['class']});
  sync();

  // 3. Keyboard shortcut for section access, disabled during editing.
  document.addEventListener('keydown',event=>{
   if(!event.altKey||!event.shiftKey||event.ctrlKey||event.metaKey||event.repeat)return;
   if(!/^Digit[1-4]$/.test(event.code))return;
   const el=document.activeElement;
   if(el?.isContentEditable||el?.matches?.('input,textarea,select,[role="textbox"]'))return;
   if(app.classList.contains('hidden'))return;
   const button=[...items.values()][Number(event.code.slice(-1))-1];
   if(!button)return;
   event.preventDefault();button.click();button.focus();
  });

  // 4. Read-only page scroll progress.
  const progress=document.createElement('div');progress.id='sarni10ScrollProgress';
  progress.className='sarni10-scroll-progress';
  progress.setAttribute('aria-hidden','true');
  const track=document.createElement('div');track.className='sarni10-scroll-progress-fill';progress.append(track);
  dashboard.prepend(progress);

  // 5. Back to Top control.
  const top=document.createElement('button');top.id='sarni10BackTop';top.type='button';
  top.className='sarni10-back-top';top.textContent='↑ Top';top.hidden=true;
  top.setAttribute('aria-label','Back to top of dashboard');dashboard.append(top);
  top.addEventListener('click',()=>dashboard.scrollTo({
   top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'
  }));
  function updateScroll(){
   const scroller=dashboard.scrollHeight>dashboard.clientHeight+10?dashboard:document.scrollingElement;
   const y=scroller.scrollTop,range=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
   track.style.width=(range?Math.min(100,Math.max(0,y/range*100)):0)+'%';
   top.hidden=y<440||app.classList.contains('hidden');
  }
  dashboard.addEventListener('scroll',updateScroll,{passive:true});
  window.addEventListener('scroll',updateScroll,{passive:true});
  window.addEventListener('resize',updateScroll,{passive:true});
  updateScroll();

  // 6. Discoverable, collapsible keyboard help; no account settings.
  const help=document.createElement('details');help.className='sarni10-keyboard-help';
  const summary=document.createElement('summary');summary.textContent='Keyboard shortcuts';
  const desc=document.createElement('p');desc.textContent='Alt + Shift + 1–4: Home, Diary, Calendar, Expense. Ctrl/⌘ + K: existing dashboard search. Shortcuts are ignored when typing in a field.';
  help.append(summary,desc);nav.insertAdjacentElement('afterend',help);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
