/* SarNi home layout controls — additive FE only; no backend or target-data changes. */
(()=>{'use strict';
if(window.__sarniLayoutDragV1)return;
window.__sarniLayoutDragV1=true;
const STORE='sarni.home.layout.v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch(_){return {}}};
const save=x=>{try{localStorage.setItem(STORE,JSON.stringify(x))}catch(_){}};
const state=read();
const css=document.createElement('style');
css.textContent=`
@media(min-width:861px){
 #appView.sarni-resizable-layout{grid-template-columns:var(--sarni-left-width,268px) minmax(0,1fr)!important}
 #appView.sarni-resizable-layout>.main-content{min-width:0!important}
 #sarniLayoutHandle{position:fixed;z-index:50;width:12px;top:90px;bottom:90px;cursor:col-resize;touch-action:none;transform:translateX(-50%);background:transparent;border:0;padding:0}
 #sarniLayoutHandle:after{content:'';position:absolute;left:5px;top:0;bottom:0;width:2px;background:#8584ad55;border-radius:8px}
 #sarniLayoutHandle:hover:after,#sarniLayoutHandle:focus-visible:after,#sarniLayoutHandle.is-dragging:after{background:#7566c9;width:4px;left:4px}
 body.sarni-layout-dragging{cursor:col-resize!important;user-select:none!important}
}
@media(max-width:860px){#sarniLayoutHandle{display:none!important}}
#sarniCompareTargets .sch-table-scroll,#sarniCompareTargets .sch-compact-scroll,#sarniCompareTargets .sch-hybrid-scroll{max-width:100%;overflow-x:auto!important;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
#sarniCompareTargets .sch-hybrid-table{table-layout:fixed;width:max-content;min-width:100%;border-collapse:separate;border-spacing:0}
#sarniCompareTargets .sch-hybrid-table th{position:relative;white-space:normal;overflow-wrap:anywhere;vertical-align:middle}
#sarniCompareTargets .sch-hybrid-table td{white-space:normal;overflow-wrap:anywhere}
#sarniCompareTargets .sarni-col-handle{position:absolute;right:0;top:0;bottom:0;width:11px;cursor:col-resize;touch-action:none;background:transparent;border:0;padding:0;z-index:2}
#sarniCompareTargets .sarni-col-handle:after{content:'';display:block;height:55%;position:absolute;top:22%;right:4px;border-right:2px solid #a49bc7}
#sarniCompareTargets .sarni-col-handle:hover:after,#sarniCompareTargets .sarni-col-handle:focus-visible:after{border-color:#5a49b3;border-right-width:3px}
#sarniCompareTargets .sarni-col-resizing{cursor:col-resize!important;user-select:none!important}
@media(max-width:860px){#sarniCompareTargets .sarni-col-handle{display:none}}
`;
document.head.append(css);
function setupSidebar(){
 const app=document.getElementById('appView');
 const sidebar=app?.querySelector(':scope > .sidebar');
 if(!app||!sidebar||document.getElementById('sarniLayoutHandle'))return;
 const handle=document.createElement('button');
 handle.id='sarniLayoutHandle';handle.type='button';handle.title='Drag to resize left panel; double-click to reset';handle.setAttribute('aria-label','Resize left navigation panel');handle.setAttribute('aria-orientation','vertical');
 app.appendChild(handle);
 const setWidth=n=>{const value=Math.max(190,Math.min(410,Math.round(n)));app.style.setProperty('--sarni-left-width',value+'px');handle.style.left=value+'px';return value;};
 const eligible=()=>window.matchMedia('(min-width:861px)').matches&&!document.body.classList.contains('sidebar-compact');
 const sync=()=>{app.classList.toggle('sarni-resizable-layout',eligible());handle.style.display=eligible()?'':'none';if(eligible())setWidth(state.navWidth||268)};
 sync();window.addEventListener('resize',sync,{passive:true});
 let active=null;
 handle.addEventListener('pointerdown',ev=>{if(!eligible()||ev.button!==0)return;active=ev.pointerId;handle.setPointerCapture(active);handle.classList.add('is-dragging');document.body.classList.add('sarni-layout-dragging');ev.preventDefault()});
 handle.addEventListener('pointermove',ev=>{if(active!==ev.pointerId)return;state.navWidth=setWidth(ev.clientX-app.getBoundingClientRect().left)});
 const end=ev=>{if(active!==ev.pointerId)return;active=null;handle.classList.remove('is-dragging');document.body.classList.remove('sarni-layout-dragging');save(state)};
 handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
 handle.addEventListener('dblclick',()=>{state.navWidth=setWidth(268);save(state)});
 handle.addEventListener('keydown',ev=>{if(!eligible())return;if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'){ev.preventDefault();state.navWidth=setWidth((state.navWidth||268)+(ev.key==='ArrowRight'?16:-16));save(state)}else if(ev.key==='Home'){state.navWidth=setWidth(268);save(state)}});
}
function setupTargetTable(){
 const container=document.getElementById('sarniCompareTargets');if(!container)return;
 const table=container.querySelector('table.sch-hybrid-table');if(!table||table.dataset.sarniColumns==='1')return;
 table.dataset.sarniColumns='1';
 const columns=Array.from(table.querySelectorAll('thead th'));
 if(!columns.length)return;
 const host=table.parentElement;
 if(host){host.style.maxWidth='100%';host.style.overflowX='auto';host.style.webkitOverflowScrolling='touch';}
 const widths=state.columns||{};
 const colgroup=document.createElement('colgroup');
 columns.forEach((th,i)=>{
  const col=document.createElement('col');
  const def=i===0?210:i>=1&&i<=5?155:i===6?105:i===7?135:90;
  col.style.width=Math.max(75,Math.min(550,Number(widths[i])||def))+'px';
  colgroup.appendChild(col);
  if(i===columns.length-1)return;
  const grip=document.createElement('button');grip.className='sarni-col-handle';grip.type='button';grip.title='Drag to change column width; double-click to reset';grip.setAttribute('aria-label','Resize '+th.textContent.trim()+' column');
  th.appendChild(grip);
  let active=null,start=0,base=0;
  grip.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;active=ev.pointerId;start=ev.clientX;base=parseFloat(col.style.width);grip.setPointerCapture(active);table.classList.add('sarni-col-resizing');ev.preventDefault();ev.stopPropagation()});
  grip.addEventListener('pointermove',ev=>{if(active!==ev.pointerId)return;const n=Math.max(75,Math.min(550,base+ev.clientX-start));col.style.width=n+'px';(state.columns||(state.columns={}))[i]=Math.round(n)});
  const end=ev=>{if(active!==ev.pointerId)return;active=null;table.classList.remove('sarni-col-resizing');save(state)};
  grip.addEventListener('pointerup',end);grip.addEventListener('pointercancel',end);
  grip.addEventListener('dblclick',ev=>{ev.preventDefault();ev.stopPropagation();col.style.width=def+'px';(state.columns||(state.columns={}))[i]=def;save(state)});
  grip.addEventListener('click',ev=>ev.stopPropagation());
 });
 table.prepend(colgroup);
}
function init(){
 setupSidebar();setupTargetTable();
 const el=document.getElementById('sarniCompareTargets');
 if(el&&!el.__sarniResizeObserver){el.__sarniResizeObserver=new MutationObserver(()=>setupTargetTable());el.__sarniResizeObserver.observe(el,{childList:true,subtree:false});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
