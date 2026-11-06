/* SarNi 10: 10 main-dashboard usability upgrades.
 * Progressive UI only: no network calls, backend actions, entry writes or secrets.
 * Navigation delegates to SarNi's existing authorised sidebar controls. */
(()=>{
 'use strict';
 function init(){
  const dashboard=document.getElementById('mainDashboard');
  const sidebar=document.getElementById('sarniSidebarPrimary');
  const shell=document.getElementById('sarni10Launcher');
  if(!dashboard||!sidebar||!shell)return;
  const $=id=>document.getElementById(id);
  const drawer=$('sarni10Menu'),search=$('sarni10Search'),list=$('sarni10NavList');
  const favoritesBar=$('sarni10Favorites'),current=$('sarni10Current');
  const density=$('sarni10Density');
  const pins=new Set(); // intentionally memory-only
  const titles={overview:'Home',expenditure:'Expenditure',creditCards:'Credit Cards',calendar:'Calendar',diary:'Diary',experiences:'Life Experiences',books:'Book Writing',users:'Users'};
  const allowed=()=>[...sidebar.querySelectorAll('button[data-section]')].filter(button=>{
   if(button.hidden||button.disabled||button.classList.contains('hidden'))return false;
   if(button.closest('[hidden],.hidden'))return false;
   if(button.classList.contains('admin-only')&&button.classList.contains('hidden'))return false;
   return true;
  });
  const title=button=>titles[button.dataset.section]||button.textContent.trim().replace(/\s+/g,' ').slice(0,48);
  function activeButton(){
   return allowed().find(x=>x.classList.contains('active')||x.getAttribute('aria-current')==='page')||null;
  }
  function chip(text,click,css){
   const button=document.createElement('button');button.type='button';button.textContent=text;
   button.className=css;button.addEventListener('click',click);return button;
  }
  function updateCurrent(){
   const active=activeButton(),label=active?title(active):'Select a section';
   current.textContent='Viewing: '+label;
   const valid=new Set(allowed().map(b=>b.dataset.section));
   for(const pinned of pins)if(!valid.has(pinned))pins.delete(pinned);
   favoritesBar.replaceChildren();
   for(const key of pins){
    const button=allowed().find(x=>x.dataset.section===key);
    if(!button)continue;
    favoritesBar.append(chip('★ '+title(button),()=>{button.click();drawer.open=false;updateCurrent()},'sarni10-favorite'));
   }
   favoritesBar.hidden=!favoritesBar.childElementCount;
  }
  // 1. Collapsible navigation launcher; 2. filter; 3. pin; 4. favorite chips.
  function populate(){
   list.replaceChildren();
   const query=search.value.trim().toLocaleLowerCase();
   const matches=allowed().filter(button=>title(button).toLocaleLowerCase().includes(query));
   for(const button of matches){
    const row=document.createElement('div');row.className='sarni10-nav-row';
    const go=chip(title(button),()=>{
     if(button.disabled||button.classList.contains('hidden'))return;
     button.click();drawer.open=false;search.value='';updateCurrent();
    },'sarni10-nav-open');
    const pin=chip(pins.has(button.dataset.section)?'★':'☆',()=>{
     if(pins.has(button.dataset.section))pins.delete(button.dataset.section);
     else pins.add(button.dataset.section);
     populate();updateCurrent();
    },'sarni10-nav-pin');
    pin.setAttribute('aria-label',(pins.has(button.dataset.section)?'Remove favourite: ':'Add favourite: ')+title(button));
    pin.setAttribute('aria-pressed',String(pins.has(button.dataset.section)));
    row.append(go,pin);list.append(row);
   }
   if(!matches.length){
    const p=document.createElement('p');p.className='sarni10-no-results';
    p.textContent='No permitted section matches your search.';list.append(p);
   }
   updateCurrent();
  }
  drawer.addEventListener('toggle',()=>{if(drawer.open){populate();search.focus();}});
  search.addEventListener('input',populate);
  $('sarni10Close').addEventListener('click',()=>{drawer.open=false;});
  $('sarni10Clear').addEventListener('click',()=>{search.value='';populate();search.focus();});
  // 5. Active-section indicator reflects sidebar classes, not inferred state.
  const observer=new MutationObserver(()=>{if(drawer.open)populate();else updateCurrent();});
  observer.observe(sidebar,{attributes:true,subtree:true,attributeFilter:['class','hidden','aria-current','disabled']});
  updateCurrent();
  // 6. Ctrl/Cmd+K opens the navigation search; Escape closes it.
  document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&drawer.open){drawer.open=false;return;}
   if(event.key.toLowerCase()!=='k'||!(event.ctrlKey||event.metaKey)||event.altKey||event.shiftKey)return;
   if(!dashboard.closest('#appView')||document.getElementById('appView')?.classList.contains('hidden'))return;
   event.preventDefault();drawer.open=true;populate();search.focus();
  });
  // 7. Back to top, hidden until scrolling.
  const top=$('sarni10BackTop');
  const showTop=()=>{top.hidden=window.scrollY<500;};
  top.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
  window.addEventListener('scroll',showTop,{passive:true});showTop();
  // 8. Compact-view switch only alters spacings in this dashboard; memory-only.
  density.addEventListener('change',()=>dashboard.classList.toggle('sarni10-compact',density.checked));
  // 9/10. Touch target and accessibility refinements are provided in sarni10-ux.css.
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
