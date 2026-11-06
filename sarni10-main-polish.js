/* SarNi 10: ten non-destructive main-dashboard usability enhancements.
 * Uses existing authorized sidebar navigation; does not access records, credentials,
 * backend APIs or storage, and never bypasses login/section permissions. */
(()=>{'use strict';
function setup(){
 const $=id=>document.getElementById(id),main=$('mainDashboard');
 if(!main||$('sarni10JumpBar'))return;
 const sections=[['overview','Home','⌂'],['diary','Diary','✎'],['calendar','Calendar','▦'],['expenditure','Expense','₹']];
 const bar=document.createElement('nav');bar.id='sarni10JumpBar';bar.className='sarni10-jump-bar';
 bar.setAttribute('aria-label','Quick navigation to SarNi sections');
 const heading=document.createElement('span');heading.className='sarni10-jump-heading';heading.textContent='Quick navigation';
 bar.append(heading);
 for(const [section,label,sign] of sections){
  const b=document.createElement('button');b.type='button';b.dataset.sarni10Jump=section;
  b.className='sarni10-jump-link';b.textContent=sign+' '+label;
  b.title='Open '+label+' using existing SarNi navigation';bar.append(b);
 }
 const help=document.createElement('button');help.type='button';help.id='sarni10ShortcutHelp';help.className='sarni10-help-btn';
 help.textContent='⌨ Keys';help.setAttribute('aria-controls','sarni10HelpPanel');help.setAttribute('aria-expanded','false');bar.append(help);
 const panel=document.createElement('div');panel.id='sarni10HelpPanel';panel.className='sarni10-help-panel';panel.hidden=true;
 panel.textContent='Keyboard: Alt + Shift + H (Home), D (Diary), C (Calendar), E (Expense). Esc closes this help. Shortcuts do not operate while typing.';
 const progress=document.createElement('div');progress.id='sarni10ScrollProgress';progress.setAttribute('aria-hidden','true');
 const fill=document.createElement('div');fill.className='sarni10-progress-fill';progress.append(fill);
 const context=document.createElement('p');context.id='sarni10ActiveSection';context.setAttribute('aria-live','polite');
 context.className='sarni10-context';context.textContent='Current section: Home';
 const first=main.querySelector('.topbar');if(first)first.insertAdjacentElement('afterend',bar);else main.prepend(bar);
 bar.insertAdjacentElement('afterend',panel);panel.insertAdjacentElement('afterend',context);
 document.body.append(progress);
 const back=document.createElement('button');back.id='sarni10BackTop';back.type='button';back.className='sarni10-back-top';
 back.textContent='↑ Top';back.title='Return to top';back.setAttribute('aria-label','Back to top');back.hidden=true;document.body.append(back);
 function permitted(section){
  const b=document.querySelector('.side-nav button[data-section="'+section+'"]');
  if(!b||b.disabled||b.hidden||b.classList.contains('hidden'))return null;
  if(getComputedStyle(b).display==='none'||getComputedStyle(b).visibility==='hidden')return null;
  return b;
 }
 function navigate(section){const b=permitted(section);if(!b)return false;b.click();sync();return true;}
 function sync(){
  const active=document.querySelector('.side-nav button.nav-item.active[data-section]');
  const chosen=active?.dataset.section||'overview';
  const title=sections.find(x=>x[0]===chosen)?.[1]||active?.textContent?.trim()?.slice(0,50)||'Workspace';
  context.textContent='Current section: '+title;
  bar.querySelectorAll('[data-sarni10-jump]').forEach(b=>{
   const available=!!permitted(b.dataset.sarni10Jump);
   b.hidden=!available;
   b.classList.toggle('is-active',b.dataset.sarni10Jump===chosen);
   b.setAttribute('aria-current',b.dataset.sarni10Jump===chosen?'page':'false');
  });
 }
 bar.addEventListener('click',event=>{
  const target=event.target.closest('[data-sarni10-jump]');
  if(target)navigate(target.dataset.sarni10Jump);
 });
 const observer=new MutationObserver(sync);
 const side=document.getElementById('sarniSidebarPrimary');
 if(side)observer.observe(side,{subtree:true,attributes:true,attributeFilter:['class','hidden','disabled','style']});
 const helpToggle=show=>{
  panel.hidden=!show;help.setAttribute('aria-expanded',String(show));
 };
 help.addEventListener('click',()=>helpToggle(panel.hidden));
 const shortcuts={KeyH:'overview',KeyD:'diary',KeyC:'calendar',KeyE:'expenditure'};
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!panel.hidden){helpToggle(false);help.focus();return;}
  if(!event.altKey||!event.shiftKey||event.ctrlKey||event.metaKey||event.repeat)return;
  if(event.target?.closest('input,textarea,select,[contenteditable],dialog,[role="dialog"]'))return;
  const section=shortcuts[event.code];if(section&&permitted(section)){event.preventDefault();navigate(section);}
 });
 function updateScroll(){
  const documentHeight=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);
  const max=Math.max(1,documentHeight-window.innerHeight);
  const current=Math.min(max,Math.max(0,window.scrollY));
  fill.style.transform='scaleX('+Math.min(1,current/max)+')';
  back.hidden=current<500;
 }
 back.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
 window.addEventListener('scroll',updateScroll,{passive:true});
 window.addEventListener('resize',updateScroll,{passive:true});
 sync();updateScroll();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
