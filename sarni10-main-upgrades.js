/* SarNi 10 — Main dashboard batch of ten non-destructive UI upgrades.
 * No API calls, no storage, no session changes, and no new write operations. */
(()=>{'use strict';
 const boot=()=>{
  const $=id=>document.getElementById(id);
  const root=$('mainDashboard'),bar=$('sarni10WorkspaceBar'),nav=$('sarni10Jump');
  if(!root||!bar||!nav)return;
  const userVisible=()=>!$('appView')?.classList.contains('hidden');
  const locations=[
   ['overview','Home','⌂'],['diary','Diary','✎'],
   ['expenditure','Expenses','₹'],['calendar','Calendar','▦'],
   ['creditCards','Cards','▣'],['experiences','Experiences','✧'],['books','Books','▤']
  ];
  // 1. A compact, accessible jump-to-section strip reusing native sidebar actions.
  const jumpButtons=new Map();
  for(const [id,label,glyph] of locations){
   const button=document.createElement('button');
   button.type='button';button.className='sarni10-jump-button';
   button.dataset.target=id;button.title='Open '+label;
   button.textContent=glyph+' '+label;button.setAttribute('aria-label','Open '+label);
   button.addEventListener('click',()=>{
    const original=document.querySelector('#sarniSidebarPrimary .nav-item[data-section="'+id+'"]');
    if(original&&!original.disabled&&!original.classList.contains('hidden'))original.click();
   });
   nav.append(button);jumpButtons.set(id,button);
  }
  // 2. The active-section indicator follows the existing dashboard navigation.
  const syncActive=()=>{
   const active=document.querySelector('#sarniSidebarPrimary .nav-item[data-section].active');
   const id=active?.dataset.section||'overview';
   for(const [target,button] of jumpButtons){
    const source=document.querySelector('#sarniSidebarPrimary .nav-item[data-section="'+target+'"]');
    button.hidden=!source||source.classList.contains('hidden')||source.disabled;
    button.classList.toggle('is-active',target===id);
    if(target===id)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
   }
   const name=locations.find(item=>item[0]===id)?.[1]||'Dashboard';
   $('sarni10CurrentSection').textContent='Viewing: '+name;
  };
  new MutationObserver(syncActive).observe($('sarniSidebarPrimary'),{subtree:true,attributes:true,attributeFilter:['class','disabled']});
  document.addEventListener('click',event=>{if(event.target.closest('[data-section]'))queueMicrotask(syncActive);},true);
  syncActive();
  // 3. Network availability indicator: browser-only, not backend verification.
  const online=$('sarni10NetworkStatus');
  const updateNetwork=()=>{
   const connected=navigator.onLine;
   online.textContent=connected?'Browser online':'Browser offline';
   online.classList.toggle('is-offline',!connected);
   online.title='Browser connectivity only. This does not verify Google Apps Script or synchronization.';
  };
  addEventListener('online',updateNetwork);addEventListener('offline',updateNetwork);updateNetwork();
  // 4. Scroll progress for long diaries, expense registers and calendars.
  const progress=$('sarni10Progress');
  let scheduled=false;
  const updateScroll=()=>{
   scheduled=false;
   const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
   const pct=max?Math.max(0,Math.min(100,Math.round(scrollY/max*100))):0;
   progress.style.width=pct+'%';progress.setAttribute('aria-valuenow',String(pct));
   $('sarni10BackTop').hidden=scrollY<500;
  };
  const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateScroll);}};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  updateScroll();
  // 5. Back to top without affecting any unsaved form contents.
  $('sarni10BackTop').addEventListener('click',()=>{
   scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  });
  // 6. Keyboard shortcuts for core navigation, only outside active input fields.
  document.addEventListener('keydown',event=>{
   if(!event.altKey||!event.shiftKey||event.ctrlKey||event.metaKey||event.repeat||!userVisible())return;
   if(event.target.closest?.('input,textarea,select,[contenteditable="true"],[role="dialog"]'))return;
   const target={KeyH:'overview',KeyD:'diary',KeyE:'expenditure',KeyC:'calendar'}[event.code];
   const b=jumpButtons.get(target);
   if(!b||b.hidden||b.disabled)return;
   event.preventDefault();b.click();b.focus();
  });
  // 7. Shortcut help is collapsible and nonintrusive.
  const help=$('sarni10ShortcutHelp');
  $('sarni10HelpToggle').addEventListener('click',()=>{
   help.hidden=!help.hidden;
   $('sarni10HelpToggle').setAttribute('aria-expanded',String(!help.hidden));
  });
  document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&!help.hidden){help.hidden=true;$('sarni10HelpToggle').setAttribute('aria-expanded','false');}
  });
  // 8. Lazy decode for noncritical images added later, without altering user avatars.
  const markImage=img=>{
   if(img.closest('.topbar,.side-brand,.sidebar-account-line,#loginView'))return;
   if(img.hasAttribute('loading'))return;
   if(img.getBoundingClientRect().top<innerHeight+250)return;
   img.loading='lazy';img.decoding='async';
  };
  const markImages=()=>root.querySelectorAll('img').forEach(markImage);
  markImages();
  if('MutationObserver' in window){
   new MutationObserver(records=>{
    for(const r of records)for(const node of r.addedNodes){
     if(node.nodeType!==1)continue;
     if(node.matches?.('img'))markImage(node);
     node.querySelectorAll?.('img').forEach(markImage);
    }
   }).observe(root,{childList:true,subtree:true});
  }
  // 9. Keep jump options synchronized with current permissions even after sign-in.
  const accessObserver=new MutationObserver(syncActive);
  accessObserver.observe($('appView'),{attributes:true,attributeFilter:['class']});
  // 10. Keyboard-accessible scroll-area and focus styles live in accompanying CSS.
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
})();
