/* SarNi 10 — Main Dashboard: ten additive usability upgrades.
 * No API, credential, form, record, Drive, or Apps Script access.
 * Navigation only invokes existing, visible sidebar controls.
 */
(()=>{'use strict';
 const start=()=>{
  const main=document.getElementById('mainDashboard');
  const nav=document.getElementById('sarniSidebarPrimary');
  if(!main||!nav||document.getElementById('sarni10QuickNav'))return;
  const allowed=new Set(['overview','expenditure','creditCards','calendar','diary','experiences','books']);
  const defaults=['overview','diary','expenditure','calendar'];
  const favKey='sarni10_main_favorite_sections_v1';
  let favorites=defaults.slice(),recent=[],active='';
  try{
   const stored=JSON.parse(localStorage.getItem(favKey)||'null');
   if(Array.isArray(stored))favorites=[...new Set(stored.filter(x=>allowed.has(x)))].slice(0,6);
  }catch(_){}
  const names={overview:'Home',expenditure:'Expenditure',creditCards:'Credit Cards',calendar:'Calendar',diary:'Diary',experiences:'Life Experiences',books:'Book Writing'};
  const sectionButton=id=>[...nav.querySelectorAll('button[data-section]')].find(el=>el.dataset.section===id);
  // Do not expose permissions-hidden sidebar buttons in this shortcut panel.
  const available=id=>{
   const b=sectionButton(id);
   return !!b&&!b.disabled&&!b.hidden&&!b.classList.contains('hidden')&&getComputedStyle(b).display!=='none'&&getComputedStyle(b).visibility!=='hidden';
  };
  const strip=document.createElement('section');strip.id='sarni10QuickNav';strip.className='sarni10-quick-nav';
  strip.setAttribute('aria-label','Favourite and recently visited pages');
  strip.innerHTML='<div class="sarni10-nav-head"><strong>My shortcuts</strong><small>Frequently used pages · no dashboard data saved</small><button type="button" id="sarni10Toggle" aria-expanded="true">Collapse</button></div><div class="sarni10-nav-content" id="sarni10NavContent"><div class="sarni10-shortcuts" id="sarni10Favorites"></div><div class="sarni10-recent" id="sarni10Recent" aria-live="polite"></div><p class="sarni10-shortcut-note">Choose ☆ to pin or unpin a page. Shortcuts follow your existing access permissions.</p></div>';
  const header=main.querySelector('.topbar');
  if(header)header.insertAdjacentElement('afterend',strip);
  else main.prepend(strip);
  const favHost=document.getElementById('sarni10Favorites'),recentHost=document.getElementById('sarni10Recent');
  function go(id){
   const el=sectionButton(id);
   if(!available(id)||!el)return;
   el.click();el.focus({preventScroll:true});
  }
  function makeButton(label,handler,cls){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cls||'';
   b.addEventListener('click',handler);return b;
  }
  function refresh(){
   if(!strip.isConnected)return;
   favHost.replaceChildren();
   const visible=[...allowed].filter(available);
   for(const id of visible){
    const chip=document.createElement('div');chip.className='sarni10-favorite'+(id===active?' is-active':'');
    const navButton=makeButton(names[id],()=>go(id),'sarni10-go');
    navButton.setAttribute('aria-current',id===active?'page':'false');
    const pinned=favorites.includes(id);
    const pin=makeButton(pinned?'★':'☆',()=>{
     favorites=pinned?favorites.filter(x=>x!==id):[...favorites,id].slice(-6);
     try{localStorage.setItem(favKey,JSON.stringify(favorites));}catch(_){}
     refresh();
    },'sarni10-pin');
    pin.setAttribute('aria-label',(pinned?'Remove '+names[id]+' from':'Pin '+names[id]+' to')+' favourites');
    pin.setAttribute('aria-pressed',String(pinned));
    pin.title=pinned?'Unpin page':'Pin page';
    chip.append(navButton,pin);
    // Keep unpinned pages in the "customise" row without hiding available destinations.
    if(pinned)favHost.append(chip);
   }
   if(!favHost.children.length){const none=document.createElement('small');none.textContent='No favourites yet. Pin pages from the chooser.';favHost.append(none);}
   const chooser=document.createElement('details');chooser.className='sarni10-chooser';
   const summary=document.createElement('summary');summary.textContent='Customise favourites';chooser.append(summary);
   const choices=document.createElement('div');choices.className='sarni10-chooser-grid';
   visible.filter(id=>!favorites.includes(id)).forEach(id=>choices.append(makeButton('☆ '+names[id],()=>{
    favorites=[...favorites,id].slice(-6);
    try{localStorage.setItem(favKey,JSON.stringify(favorites));}catch(_){}
    refresh();
   })));
   if(!choices.childElementCount)choices.textContent='All available pages are pinned.';
   chooser.append(choices);favHost.append(chooser);
   recentHost.replaceChildren();
   const label=document.createElement('strong');label.textContent='Recently visited';recentHost.append(label);
   const items=recent.filter(available).slice(0,4);
   if(!items.length){const empty=document.createElement('small');empty.textContent='Your recent pages appear here.';recentHost.append(empty);}
   items.forEach(id=>recentHost.append(makeButton(names[id],()=>go(id),'sarni10-recent-item')));
  }
  function activeFromSidebar(){
   const b=[...nav.querySelectorAll('button[data-section].active')].find(x=>allowed.has(x.dataset.section));
   if(!b)return;
   const id=b.dataset.section;if(active===id)return;active=id;
   recent=[id,...recent.filter(x=>x!==id)].slice(0,4);refresh();
  }
  // 1 Favourite shortcuts; 2 pin/unpin; 3 recent pages; 4 active-page cues;
  // 5 permission awareness; 6 collapse; 7 keyboard shortcuts; 8 back-to-top;
  // 9 focus/mobile refinement; 10 reduced motion and wrapping in companion CSS.
  document.getElementById('sarni10Toggle').addEventListener('click',event=>{
   const expanded=event.currentTarget.getAttribute('aria-expanded')==='true';
   document.getElementById('sarni10NavContent').hidden=expanded;
   event.currentTarget.setAttribute('aria-expanded',String(!expanded));
   event.currentTarget.textContent=expanded?'Expand':'Collapse';
  });
  // Shortcuts only work outside edit fields; they invoke existing sidebar buttons.
  document.addEventListener('keydown',event=>{
   if(!event.altKey||!event.shiftKey||event.ctrlKey||event.metaKey||event.repeat||!/^Digit[1-4]$/.test(event.code))return;
   const target=event.target;
   if(target?.isContentEditable||target?.closest('input,textarea,select,[contenteditable="true"]'))return;
   const id=favorites[Number(event.code.slice(-1))-1];
   if(!id||!available(id))return;
   event.preventDefault();go(id);
  });
  const top=makeButton('↑ Top',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}),'sarni10-back-to-top');
  top.id='sarni10BackToTop';top.hidden=true;top.setAttribute('aria-label','Back to top');
  document.body.append(top);
  const updateTop=()=>{top.hidden=window.scrollY<500||main.classList.contains('hidden');};
  window.addEventListener('scroll',updateTop,{passive:true});
  const observer=new MutationObserver(()=>{activeFromSidebar();updateTop();});
  observer.observe(nav,{attributes:true,attributeFilter:['class','hidden','disabled'],subtree:true});
  observer.observe(main,{attributes:true,attributeFilter:['class']});
  nav.addEventListener('click',()=>queueMicrotask(activeFromSidebar));
  activeFromSidebar();refresh();updateTop();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
