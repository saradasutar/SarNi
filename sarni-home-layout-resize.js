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
#sarniHomeTargetRowsPanel #sarniCompareTargets .sch-hybrid-table{table-layout:fixed!important;border-collapse:separate;border-spacing:0}
#sarniCompareTargets .sch-hybrid-table th{position:relative;white-space:normal;overflow-wrap:anywhere;vertical-align:middle}
#sarniCompareTargets .sch-hybrid-table td{white-space:normal;overflow-wrap:anywhere}
#sarniCompareTargets .sarni-col-handle{position:absolute!important;right:-5px;top:0;bottom:0;width:17px;min-width:17px;cursor:col-resize!important;touch-action:none;background:transparent;border:0;padding:0;z-index:12;display:block!important}
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
function setupToolbar(container,host,table,apply,defaults){
 const section=document.getElementById('sarniHomeTargetRowsPanel');
 if(!section)return;
 let bar=document.getElementById('sarniTargetResizeTools');
 if(!bar){bar=document.createElement('div');bar.id='sarniTargetResizeTools';bar.style.cssText='display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:7px 0;padding:5px 2px;font-size:11px';
 const title=document.createElement('span');title.textContent='Target table: ';title.style.fontWeight='800';bar.appendChild(title);
 const make=(label,hint,cb)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.title=hint;b.style.cssText='padding:6px 10px;border-radius:8px;background:#f3f0ff;color:#513f9f;border:1px solid #c6bbee;font-weight:800;cursor:pointer';b.addEventListener('click',cb);bar.appendChild(b)};
 make('◀ Left','Show earlier columns',()=>{const h=container.querySelector('.sch-hybrid-wrap');h?.scrollBy({left:-280,behavior:'smooth'})});
 make('Right ▶','Show columns to the right',()=>{const h=container.querySelector('.sch-hybrid-wrap');h?.scrollBy({left:280,behavior:'smooth'})});
 make('− Narrower','Make Stage 1–5 columns narrower',()=>{for(let i=1;i<=5;i++){(state.columns||(state.columns={}))[i]=Math.max(75,(Number(state.columns[i])||150)-20)}save(state);const t=container.querySelector('table.sch-hybrid-table');if(t){t.removeAttribute('data-sarni-columns');setupTargetTable()}});
 make('+ Wider','Make Stage 1–5 columns wider',()=>{for(let i=1;i<=5;i++){(state.columns||(state.columns={}))[i]=Math.min(550,(Number(state.columns[i])||150)+20)}save(state);const t=container.querySelector('table.sch-hybrid-table');if(t){t.removeAttribute('data-sarni-columns');setupTargetTable()}});
 make('Reset','Restore initial column sizes',()=>{state.columns={};save(state);const t=container.querySelector('table.sch-hybrid-table');if(t){t.removeAttribute('data-sarni-columns');setupTargetTable()}});
 section.querySelector('.sch-head')?.after(bar);
 }
}
function setupTargetTable(){
 const container=document.getElementById('sarniCompareTargets');if(!container)return;
 const table=container.querySelector('table.sch-hybrid-table');if(!table||table.dataset.sarniColumns==='1')return;
 const oldGroup=table.querySelector(':scope > colgroup');if(oldGroup)oldGroup.remove();table.querySelectorAll('.sarni-col-handle').forEach(n=>n.remove());
 table.dataset.sarniColumns='1';
 const columns=Array.from(table.querySelectorAll('thead th'));
 if(!columns.length)return;
 const host=table.parentElement;
 if(host){host.style.maxWidth='100%';host.style.overflowX='auto';host.style.webkitOverflowScrolling='touch';}
 const widths=state.columns||{};
 const defaults=columns.map((_,i)=>i===0?220:i>=1&&i<=5?150:i===6?120:i===7?145:95);
 const apply=()=>{let total=0;columns.forEach((th,i)=>{const w=Math.max(i===0?165:75,Math.min(550,Number((state.columns||{})[i])||defaults[i]));th.style.setProperty('width',w+'px','important');th.style.setProperty('min-width',w+'px','important');th.style.setProperty('max-width',w+'px','important');colgroup.children[i].style.setProperty('width',w+'px','important');total+=w});table.style.setProperty('width',Math.max(total,890)+'px','important');table.style.setProperty('min-width',Math.max(total,890)+'px','important');};
 const colgroup=document.createElement('colgroup');
 columns.forEach((th,i)=>{
  const col=document.createElement('col');
  const def=defaults[i];
  col.style.width=Math.max(75,Math.min(550,Number(widths[i])||def))+'px';
  colgroup.appendChild(col);
  if(i===columns.length-1)return;
  const grip=document.createElement('button');grip.className='sarni-col-handle';grip.type='button';grip.title='Drag to change column width; double-click to reset';grip.setAttribute('aria-label','Resize '+th.textContent.trim()+' column');
  th.appendChild(grip);
  let active=null,start=0,base=0;
  grip.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;active=ev.pointerId;start=ev.clientX;base=parseFloat(col.style.width);grip.setPointerCapture(active);table.classList.add('sarni-col-resizing');ev.preventDefault();ev.stopPropagation()});
  grip.addEventListener('pointermove',ev=>{if(active!==ev.pointerId)return;const n=Math.max(75,Math.min(550,base+ev.clientX-start));(state.columns||(state.columns={}))[i]=Math.round(n);apply()});
  const end=ev=>{if(active!==ev.pointerId)return;active=null;table.classList.remove('sarni-col-resizing');save(state)};
  grip.addEventListener('pointerup',end);grip.addEventListener('pointercancel',end);
  grip.addEventListener('dblclick',ev=>{ev.preventDefault();ev.stopPropagation();(state.columns||(state.columns={}))[i]=def;apply();save(state)});
  grip.addEventListener('click',ev=>ev.stopPropagation());
 });
 table.prepend(colgroup);
 apply();
 setupToolbar(container,host,table,apply,defaults);
}
function init(){
 setupSidebar();setupTargetTable();
 const el=document.getElementById('sarniCompareTargets');
 if(el&&!el.__sarniResizeObserver){el.__sarniResizeObserver=new MutationObserver(()=>setupTargetTable());el.__sarniResizeObserver.observe(el,{childList:true,subtree:false});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
