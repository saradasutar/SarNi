/* SarNi 10 — ten non-invasive main-dashboard usability improvements.
 * Reuses existing navigation buttons, never reads credentials, private links
 * or record contents; no API calls, new storage or automatic saves. */
(()=>{
 'use strict';
 function init(){
  const root=document.getElementById('mainDashboard');
  const nav=document.getElementById('sarniSimplifiedNav');
  const topbar=root?.querySelector('.topbar');
  if(!root||!nav||!topbar||document.getElementById('sarni10Tools'))return;
  const definitions=[
   {id:'home',label:'Home',glyph:'⌂',shortcut:'1'},
   {id:'money',label:'Money',glyph:'₹',shortcut:'2'},
   {id:'calendar',label:'Calendar',glyph:'▦',shortcut:'3'},
   {id:'diary',label:'Diary',glyph:'✎',shortcut:'4'},
   {id:'more',label:'More',glyph:'☷',shortcut:'5'}
  ];
  // 1. A small, collapsible workspace strip below existing navigation.
  const tools=document.createElement('details');tools.id='sarni10Tools';tools.className='sarni10-tools';
  const summary=document.createElement('summary');
  summary.textContent='Quick navigation · keyboard shortcuts';
  const body=document.createElement('div');body.className='sarni10-body';
  const menu=document.createElement('div');menu.className='sarni10-shortcuts';
  menu.setAttribute('role','group');menu.setAttribute('aria-label','Workspace shortcuts');
  body.append(menu);
  const summaryRow=document.createElement('div');summaryRow.className='sarni10-meta';
  // 2. Current section indicator, derived solely from existing UI state.
  const current=document.createElement('span');current.id='sarni10Current';current.setAttribute('role','status');
  current.setAttribute('aria-live','polite');current.textContent='Current: Home';
  // 3. Local date and time (no network requests or location lookup).
  const clock=document.createElement('time');clock.id='sarni10Clock';clock.setAttribute('aria-label','Local date and time');
  summaryRow.append(current,clock);
  body.append(summaryRow);
  // 4. Keyboard help disclosure, no modal/overlay.
  const help=document.createElement('small');help.className='sarni10-help';
  help.textContent='Keyboard: Alt + Shift + 1–5 (outside a form). Arrow keys move between shortcut buttons.';
  body.append(help);
  tools.append(summary,body);
  nav.insertAdjacentElement('afterend',tools);
  const buttons=[];
  const mainButton=id=>nav.querySelector('button[data-sarni-nav="'+id+'"]');
  definitions.forEach(def=>{
   const btn=document.createElement('button');btn.type='button';btn.dataset.main10=def.id;
   btn.className='sarni10-shortcut';
   const glyph=document.createElement('span');glyph.setAttribute('aria-hidden','true');glyph.textContent=def.glyph;
   const name=document.createElement('span');name.textContent=def.label;
   const hint=document.createElement('kbd');hint.textContent=def.shortcut;
   btn.append(glyph,name,hint);
   btn.title=def.label+' · Alt+Shift+'+def.shortcut;
   btn.addEventListener('click',()=>{
    const original=mainButton(def.id);
    if(!original||original.disabled||original.hidden||original.classList.contains('hidden'))return;
    original.click();sync();
   });
   menu.append(btn);buttons.push(btn);
  });
  // 5. Synchronize the active shortcut with the existing navigation state.
  function sync(){
   for(const button of buttons){
    const original=mainButton(button.dataset.main10);
    const available=!!original&&!original.disabled&&!original.hidden&&!original.classList.contains('hidden');
    button.hidden=!available;
    const selected=available&&original.classList.contains('active');
    button.classList.toggle('is-active',selected);
    button.setAttribute('aria-pressed',String(selected));
   }
   const selected=buttons.find(x=>x.classList.contains('is-active'));
   current.textContent='Current: '+(selected?.querySelector('span:nth-child(2)')?.textContent||document.getElementById('pageTitle')?.textContent?.trim()||'Dashboard');
  }
  const observer=new MutationObserver(sync);
  observer.observe(nav,{attributes:true,subtree:true,attributeFilter:['class','hidden','disabled','aria-expanded']});
  nav.addEventListener('click',()=>queueMicrotask(sync));
  sync();
  const updateClock=()=>{
   const date=new Date();
   clock.dateTime=date.toISOString();
   clock.textContent=new Intl.DateTimeFormat(undefined,{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}).format(date);
  };
  updateClock();
  const interval=window.setInterval(()=>{if(!document.hidden)updateClock();},60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateClock();});
  // 6. Alt+Shift+1–5 shortcuts never interfere with typing or dialogs.
  document.addEventListener('keydown',event=>{
   if(!event.altKey||!event.shiftKey||event.ctrlKey||event.metaKey||event.repeat||!/^Digit[1-5]$/.test(event.code))return;
   if(document.querySelector('dialog[open],[role="dialog"]:not(.hidden):not([hidden])'))return;
   const active=document.activeElement;
   if(active?.isContentEditable||active?.matches('input,textarea,select'))return;
   const button=buttons[Number(event.code.slice(-1))-1];
   if(!button||button.hidden||button.disabled||!root.offsetParent)return;
   event.preventDefault();button.click();
  });
  // 7. Arrow-key focus navigation (no unintended section activation).
  menu.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   const index=buttons.indexOf(document.activeElement);
   if(index<0)return;
   const available=buttons.filter(x=>!x.hidden&&!x.disabled);
   const i=available.indexOf(document.activeElement);if(i<0)return;
   const target=event.key==='Home'?0:event.key==='End'?available.length-1:
    Math.max(0,Math.min(available.length-1,i+(event.key==='ArrowLeft'?-1:1)));
   event.preventDefault();available[target]?.focus();
  });
  // 8. Return to top after long scrolling, without touching form data.
  const up=document.createElement('button');up.id='sarni10BackTop';up.type='button';
  up.textContent='↑ Top';up.setAttribute('aria-label','Back to top');up.hidden=true;
  root.append(up);
  const adjustTop=()=>{up.hidden=window.scrollY<500;};
  window.addEventListener('scroll',adjustTop,{passive:true});adjustTop();
  up.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
  // 9–10. Larger mobile controls, focus rings, wrapping and reduced-motion
  // support are implemented in the paired stylesheet.
  window.addEventListener('pagehide',()=>{window.clearInterval(interval);observer.disconnect();},{once:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
