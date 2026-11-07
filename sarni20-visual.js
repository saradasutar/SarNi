/* SarNi Batch 20: progressive, front-end-only refinements. 
 * No API, credentials, personal data storage, record writes, or permission changes.
 * Reuse ONLY existing authorized SarNi navigation and controls. */
(()=>{'use strict';
const boot=()=>{
 const root=document.getElementById('sarni10Workspace'),nav=document.getElementById('sarniSidebarPrimary'),main=document.getElementById('mainDashboard');
 if(!root||!nav||!main||document.getElementById('sarni20Header'))return;
 const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
 const heading=el('div','sarni20-header');heading.id='sarni20Header';
 const intro=el('div','sarni20-intro');
 const eyebrow=el('span','sarni20-eyebrow','MY SARNI WORKSPACE');
 const title=el('strong','sarni20-title','Your day, organized');
 const subtitle=el('span','sarni20-subtitle','Jump to an existing section without changing saved information.');
 intro.append(eyebrow,title,subtitle);
 const meta=el('div','sarni20-meta');
 const date=el('span','sarni20-today'),clock=el('span','sarni20-clock'),network=el('span','sarni20-network');
 network.setAttribute('role','status');
 meta.append(date,clock,network);heading.append(intro,meta);
 const panel=el('div','sarni20-quicknav');panel.id='sarni20Quicknav';
 const panelHead=el('div','sarni20-quicknav-head');
 const panelTitle=el('strong','','Quick navigation');
 const panelNote=el('small','','Uses your existing permitted pages');
 const toggle=el('button','sarni20-toggle','Hide shortcuts');toggle.type='button';toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-controls','sarni20Tiles');
 panelHead.append(panelTitle,panelNote,toggle);
 const tiles=el('div','sarni20-tiles');tiles.id='sarni20Tiles';
 panel.append(panelHead,tiles);
 const utility=el('div','sarni20-utility');
 const active=el('span','sarni20-active','Active section: Home');active.id='sarni20Active';
 const find=el('button','sarni20-find','Find section /');find.type='button';
 find.addEventListener('click',()=>{const x=document.getElementById('sarni10ModuleSearch');if(!x)return;x.focus();x.select();});
 const current=el('button','sarni20-current','Jump to section');current.type='button';
 current.addEventListener('click',()=>{const s=[...main.querySelectorAll('.page-section')].find(x=>!x.classList.contains('hidden')&&!x.hidden);s?.scrollIntoView({block:'start',behavior:reduced()?'auto':'smooth'});});
 utility.append(active,find,current);
 root.insertBefore(heading,root.firstChild);
 root.append(panel,utility);
 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const fmtDate=new Intl.DateTimeFormat(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric'});
 const fmtTime=new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'});
 let lastMinute='';
 const tick=()=>{const now=new Date(),minute=now.getHours()+':'+now.getMinutes(),day=now.toDateString();if(lastMinute===minute&&date.dataset.day===day)return;lastMinute=minute;date.dataset.day=day;date.textContent=fmtDate.format(now);clock.textContent=fmtTime.format(now);};
 tick();const timer=setInterval(()=>{if(document.visibilityState==='visible')tick();},30000);
 window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
 const updateNetwork=()=>{network.textContent=navigator.onLine?'● Browser online':'● Browser offline';network.classList.toggle('is-offline',!navigator.onLine);network.title='Browser connection only; this is not an Apps Script or synchronization health check.';};
 window.addEventListener('online',updateNetwork);window.addEventListener('offline',updateNetwork);updateNetwork();
 const sections=[['overview','Home','⌂'],['expenditure','Expense','₹'],['calendar','Calendar','▦'],['diary','Diary','✎'],['creditCards','Cards','▣'],['books','Books','▤'],['experiences','Life','✧']];
 const permitted=button=>!!button&&!button.disabled&&!button.classList.contains('hidden')&&!button.closest('[hidden],.hidden')&&button.getAttribute('aria-hidden')!=='true';
 const render=()=>{
  const selected=nav.querySelector('button[data-section].active'),id=selected?.dataset.section||'overview';
  const label=selected?.textContent?.replace(/\s+/g,' ').trim()||'Home';active.textContent='Active section: '+label;
  // Visibility is presentation only: actual server-side authorization stays unchanged.
  tiles.replaceChildren();
  for(const [key,name,icon] of sections){
   const b=nav.querySelector('button[data-section="'+key+'"]');
   if(!permitted(b))continue;
   const tile=el('button','sarni20-tile');
   tile.type='button';tile.dataset.section=key;tile.setAttribute('aria-label','Open '+name);
   if(key===id){tile.classList.add('is-current');tile.setAttribute('aria-current','page');}
   const glyph=el('span','sarni20-tile-icon',icon),word=el('span','',name);
   tile.append(glyph,word);
   tile.addEventListener('click',()=>{if(!permitted(b)||document.getElementById('appView')?.classList.contains('hidden'))return;b.click();});
   tiles.append(tile);
  }
  panel.hidden=!tiles.childElementCount;
 };
 let queued=false;
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});};
 const observer=new MutationObserver(schedule);observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['class','hidden','disabled']});
 const setExpanded=expanded=>{tiles.hidden=!expanded;toggle.textContent=expanded?'Hide shortcuts':'Show shortcuts';toggle.setAttribute('aria-expanded',String(expanded));};
 toggle.addEventListener('click',()=>setExpanded(tiles.hidden));
 document.addEventListener('keydown',e=>{if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.key!=='/'||e.repeat)return;
 const target=e.target;
 if(target?.isContentEditable||target?.closest('input,select,textarea,[role="dialog"]'))return;
 if(!main.offsetParent)return;
 const search=document.getElementById('sarni10ModuleSearch');if(!search)return;
 e.preventDefault();search.focus();search.select();
 });
 render();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
