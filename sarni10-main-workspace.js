/* SarNi 10: ten small, progressive improvements to the existing main dashboard.
 * Uses existing authorized sidebar buttons. No API, credential, or record access.
 * Favorites, recent modules, and density are kept in memory for this page only. */
(()=>{
 'use strict';
 const ready=()=>{
  const $=id=>document.getElementById(id);
  const root=$('sarni10Workspace'),nav=$('sarniSidebarPrimary'),main=$('mainDashboard');
  if(!root||!nav||!main)return;
  const search=$('sarni10ModuleSearch'),clear=$('sarni10ClearSearch'),results=$('sarni10ModuleResults');
  const count=$('sarni10ModuleCount'),favorites=$('sarni10Favorites'),recent=$('sarni10Recent');
  const breadcrumb=$('sarni10Breadcrumb'),density=$('sarni10Density'),top=$('sarni10Top');
  const favoriteSet=new Set(),history=[];
  let current='overview',compact=false;
  const all=()=>[...nav.querySelectorAll('button[data-section]')];
  const allowed=button=>{
   if(!button||!button.isConnected||button.disabled)return false;
   if(button.classList.contains('hidden')||button.getAttribute('aria-hidden')==='true')return false;
   if(button.closest('.hidden,[hidden]'))return false;
   // Do not expose administrator-only modules when their access gate is hidden.
   if(button.classList.contains('admin-only')&&button.classList.contains('hidden'))return false;
   // Responsive layout can hide the desktop sidebar while its authorized
   // navigation handlers remain valid. Check permission gates, not screen geometry.
   return true;
  };
  const label=button=>(button.textContent||'').replace(/[⌂₹▣▦✎✧▤♙]/g,'').replace(/\s+/g,' ').trim();
  const valid=()=>all().filter(allowed);
  const selected=()=>valid().find(button=>button.classList.contains('active'))||null;
  const createChip=(button,parent,withStar=false)=>{
   const item=document.createElement('span');item.className='sarni10-chip';
   const go=document.createElement('button');go.type='button';go.className='sarni10-go';
   go.textContent=label(button);go.title='Open '+label(button);
   go.addEventListener('click',()=>{
    if(document.getElementById('appView')?.classList.contains('hidden')||!allowed(button))return;
    button.click();record(button.dataset.section);
   });
   item.append(go);
   if(withStar){
    const star=document.createElement('button');star.type='button';star.className='sarni10-star';
    const update=()=>{const pinned=favoriteSet.has(button.dataset.section);star.textContent=pinned?'★':'☆';star.setAttribute('aria-label',(pinned?'Unpin ':'Pin ')+label(button));star.setAttribute('aria-pressed',String(pinned));};
    star.addEventListener('click',()=>{const id=button.dataset.section;favoriteSet.has(id)?favoriteSet.delete(id):favoriteSet.add(id);update();renderFavorites();});
    update();item.append(star);
   }
   parent.append(item);
  };
  const makeEmpty=(node,message)=>{const text=document.createElement('small');text.className='sarni10-muted';text.textContent=message;node.append(text);};
  function renderFavorites(){
   favorites.replaceChildren();
   const pinned=valid().filter(button=>favoriteSet.has(button.dataset.section));
   pinned.forEach(button=>createChip(button,favorites,true));
   if(!pinned.length)makeEmpty(favorites,'Pin frequently used sections using ☆ below.');
  }
  function renderRecent(){
   recent.replaceChildren();
   history.map(id=>valid().find(b=>b.dataset.section===id)).filter(Boolean).forEach(button=>createChip(button,recent));
   if(!recent.childElementCount)makeEmpty(recent,'Recently opened sections will appear here.');
  }
  function renderSearch(){
   const query=search.value.trim().toLocaleLowerCase();
   const visible=valid().filter(button=>label(button).toLocaleLowerCase().includes(query));
   results.replaceChildren();
   visible.forEach(button=>createChip(button,results,true));
   if(!visible.length)makeEmpty(results,'No permitted sections match this search.');
   count.textContent=visible.length+' of '+valid().length+' sections';
   clear.hidden=!search.value;
  }
  function updateActive(){
   const button=selected();
   if(button){
    current=button.dataset.section;
    breadcrumb.textContent='Current section: '+label(button);
   }
  }
  function record(section){
   if(!valid().some(b=>b.dataset.section===section))return;
   history.splice(history.indexOf(section)>=0?history.indexOf(section):history.length,history.includes(section)?1:0);
   history.unshift(section);history.length=Math.min(history.length,4);
   updateActive();renderRecent();
  }
  clear.addEventListener('click',()=>{search.value='';renderSearch();search.focus();});
  search.addEventListener('input',renderSearch);
  nav.addEventListener('click',event=>{
   const button=event.target.closest('button[data-section]');
   if(!allowed(button))return;
   requestAnimationFrame(()=>{record(button.dataset.section);renderSearch();});
  });
  document.addEventListener('keydown',event=>{
   if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return;
   const target=event.target;
   if(target?.isContentEditable||target?.closest('input,textarea,select,[role="dialog"]'))return;
   if(event.key==='/'&&main.offsetParent!==null){event.preventDefault();search.focus();search.select();}
   if(event.key==='Escape'&&document.activeElement===search){search.value='';renderSearch();search.blur();}
  });
  density.addEventListener('click',()=>{
   compact=!compact;main.classList.toggle('sarni10-compact',compact);
   density.textContent=compact?'Comfortable spacing':'Compact spacing';
   density.setAttribute('aria-pressed',String(compact));
  });
  const updateTop=()=>{top.hidden=window.scrollY<450;};
  window.addEventListener('scroll',updateTop,{passive:true});updateTop();
  top.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
  const refresh=()=>{updateActive();renderSearch();renderFavorites();renderRecent();};
  const observer=new MutationObserver(()=>requestAnimationFrame(refresh));
  observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['class','hidden','disabled']});
  refresh();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
