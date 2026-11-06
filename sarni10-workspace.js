/* SarNi 10: progressive workspace toolbar (10 UI upgrades).
 * No backend calls, writes, credential access, storage, or overrides to app routing.
 * Existing navigation, search, density and theme handlers remain authoritative. */
(function(){
 'use strict';
 const boot=()=>{
  const $=id=>document.getElementById(id);
  const main=$('mainDashboard'),bar=$('sarni10WorkspaceBar'),side=$('sarniSidebarPrimary');
  if(!main||!bar||!side)return;
  const nav=[...bar.querySelectorAll('[data-sarni10-section]')];
  const navName={overview:'Home',expenditure:'Expenditure',calendar:'Calendar',diary:'Diary',books:'Book Writing'};
  const sectionTitle=$('sarni10SectionLabel');
  const syncActive=()=>{
   const active=side.querySelector('.nav-item[data-section].active');
   const section=active?.dataset.section||'overview';
   sectionTitle.textContent=active?.textContent?.trim()||navName[section]||'Workspace';
   for(const button of nav){
    const chosen=button.dataset.sarni10Section===section;
    button.classList.toggle('is-current',chosen);
    button.setAttribute('aria-current',chosen?'page':'false');
   }
  };
  const activate=section=>{
   const button=[...side.querySelectorAll('.nav-item[data-section]')].find(el=>el.dataset.section===section&&!el.disabled&&!el.classList.contains('hidden'));
   if(button){button.click();syncActive();}
  };
  // 1. One-line, keyboard-accessible workspace toolbar.
  // 2. Current-section label and selected shortcut.
  // 3. Quick navigation routed through the existing sidebar.
  bar.addEventListener('click',event=>{
   const button=event.target.closest('[data-sarni10-section]');
   if(button)activate(button.dataset.sarni10Section);
  });
  const observer=new MutationObserver(syncActive);
  observer.observe(side,{subtree:true,attributes:true,attributeFilter:['class','aria-current']});
  syncActive();

  // 4. Existing command palette shortcut.
  $('sarni10Search')?.addEventListener('click',()=>$('commandPaletteBtn')?.click());

  // 5. One-click Compact/Comfortable using existing native preferences.
  $('sarni10Density')?.addEventListener('click',()=>{
   const select=$('displayDensitySelect');if(!select)return;
   select.value=select.value==='COMPACT'?'COMFORTABLE':'COMPACT';
   select.dispatchEvent(new Event('change',{bubbles:true}));
   $('sarni10Density').setAttribute('aria-pressed',String(select.value==='COMPACT'));
  });
  $('displayDensitySelect')?.addEventListener('change',()=>{
   $('sarni10Density')?.setAttribute('aria-pressed',String($('displayDensitySelect').value==='COMPACT'));
  });
  $('sarni10Density')?.setAttribute('aria-pressed',String($('displayDensitySelect')?.value==='COMPACT'));

  // 6. Theme cycling delegates to the dashboard's existing selector.
  $('sarni10Theme')?.addEventListener('click',()=>{
   const select=$('displayThemeSelect');if(!select)return;
   const values=['LIGHT','DARK','AUTO'];
   select.value=values[(values.indexOf(select.value)+1)%values.length];
   select.dispatchEvent(new Event('change',{bubbles:true}));
   $('sarni10Theme').title='Theme: '+select.value;
  });

  // 7. Connectivity is browser-only, never interpreted as backend success.
  const connection=$('sarni10Network');
  const updateConnection=()=>{
   if(!connection)return;
   const online=navigator.onLine;
   connection.textContent=online?'● Online':'○ Offline';
   connection.dataset.online=String(online);
   connection.title='Browser network only — backend sync is not independently verified';
  };
  window.addEventListener('online',updateConnection);
  window.addEventListener('offline',updateConnection);
  updateConnection();

  // 8. Reading progress, no record access or persistent state.
  const progress=$('sarni10ScrollProgress');
  const top=$('sarni10Top');
  const updateScroll=()=>{
   const root=document.documentElement;
   const available=Math.max(0,root.scrollHeight-root.clientHeight);
   const pct=available?Math.min(100,Math.max(0,Math.round(window.scrollY/available*100))):0;
   if(progress)progress.style.width=pct+'%';
   if(top)top.hidden=window.scrollY<350;
  };
  window.addEventListener('scroll',updateScroll,{passive:true});
  window.addEventListener('resize',updateScroll,{passive:true});
  updateScroll();

  // 9. Back to top.
  top?.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));

  // 10. Alt+Shift+1–5 keyboard navigation; never intercept typing fields.
  document.addEventListener('keydown',event=>{
   if(!event.altKey||!event.shiftKey||event.ctrlKey||event.metaKey||event.repeat||!/^Digit[1-5]$/.test(event.code))return;
   const current=document.activeElement;
   if(current?.isContentEditable||current?.matches('input,textarea,select'))return;
   if($('appView')?.classList.contains('hidden'))return;
   const section=['overview','expenditure','calendar','diary','books'][Number(event.code.slice(-1))-1];
   if(!section)return;
   event.preventDefault();activate(section);
  });
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
})();
