/* SarNi quality diagnostics v1: on-device measurements only, no network requests,
   cookies, analytics, passwords, names, tokens, or financial records transmitted. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const state={lcp:null,cls:0,inp:null,longTasks:0,errors:0,samples:0};
function observe(type,cb){
 try{
  if(!('PerformanceObserver' in window)||!PerformanceObserver.supportedEntryTypes?.includes(type))return;
  const po=new PerformanceObserver(list=>{for(const entry of list.getEntries())cb(entry)});
  po.observe({type,buffered:true});
 }catch(e){}
}
observe('largest-contentful-paint',e=>{state.lcp=e.startTime});
observe('layout-shift',e=>{if(!e.hadRecentInput)state.cls+=e.value});
observe('event',e=>{if(e.duration>=(state.inp||0))state.inp=e.duration});
observe('longtask',()=>{state.longTasks++});
window.addEventListener('error',()=>{state.errors++},{passive:true});
window.addEventListener('unhandledrejection',()=>{state.errors++},{passive:true});
function e(tag,text,cls){const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x}
function estimatedBytes(){
 try{return performance.getEntriesByType('resource').filter(x=>x.initiatorType==='script'||x.initiatorType==='link').reduce((n,x)=>n+(x.transferSize||0),0)}catch{return 0}
}
function ready(){
 if(!$('sarniQualityPanel')){
  const target=$('adminSecurityPanel')?.parentElement;
  if(target){
   const section=e('details',undefined,'admin-only hidden');section.id='sarniQualityPanel';
   section.append(e('summary','Quality & speed diagnostics · device only'));
   section.append(e('p','Measurements from this device and page load. They are not a formal 9.5/10 score, and they never include your financial or personal records.','sq-foot'));
   const grid=e('div',undefined,'sq-metrics');grid.id='sqMetrics';
   section.append(grid);
   const info=e('p',undefined,'sq-status');info.id='sqQualityInfo';info.setAttribute('aria-live','polite');section.append(info);
   const actions=e('div',undefined,'sq-actions');
   const refresh=e('button','Refresh measurements');refresh.type='button';refresh.onclick=paint;actions.append(refresh);
   const copy=e('button','Copy diagnostic summary');copy.type='button';copy.onclick=async()=>{const summary=getSummary();try{await navigator.clipboard.writeText(summary);info.textContent='Diagnostic summary copied (no private records included).';}catch{info.textContent=summary;}};actions.append(copy);
   section.append(actions);target.append(section);
   section.addEventListener('toggle',()=>{if(section.open)paint()});
  }
 }
 const main=$('mainDashboard');
 if(main&&!document.querySelector('.sarni-skip-link')){
  if(!main.hasAttribute('tabindex'))main.tabIndex=-1;
  const skip=e('a','Skip to main dashboard','sarni-skip-link');skip.href='#mainDashboard';
  document.body.prepend(skip);
 }
}
function isAdmin(){try{return typeof isSarNiAdmin==='function'&&isSarNiAdmin()&&!!stateToken()}catch{return false}}
function stateToken(){try{return typeof window!=='undefined'&&typeof state!=='undefined'&&state.token}catch{return ''}}
function formatNum(x){return Number.isFinite(x)?x.toFixed(2):'Not measured'}
function nav(){try{return performance.getEntriesByType('navigation')[0]||null}catch{return null}}
function metrics(){
 const n=nav();
 const lcp=state.lcp,inp=state.inp,cls=state.cls;
 return [
  {title:'Largest paint (LCP)',value:lcp==null?'Not measured':Math.round(lcp)+' ms',target:'Good ≤ 2,500 ms'},
  {title:'Responsiveness (INP)',value:inp==null?'Not measured':Math.round(inp)+' ms',target:'Good ≤ 200 ms'},
  {title:'Layout shift (CLS)',value:formatNum(cls),target:'Good ≤ 0.10'},
  {title:'Page load',value:n?Math.round(n.loadEventEnd||n.duration)+' ms':'Not measured',target:'Navigation event, not server sync'},
  {title:'Script & CSS transfer',value:estimatedBytes()?Math.round(estimatedBytes()/1024)+' KB':'Unavailable',target:'Network transfer size, if exposed'},
  {title:'Long tasks',value:String(state.longTasks),target:'More suggests UI blocking'}
 ];
}
function getSummary(){
 const m=metrics().map(x=>x.title+': '+x.value);
 return 'SarNi local diagnostics\n'+new Date().toISOString()+'\n'+m.join('\n')+'\nError/rejection count: '+state.errors+
 '\nBrowser: '+navigator.userAgent.replace(/[^a-zA-Z0-9 .;()/_-]/g,'').slice(0,200)+
 '\nData is measured only on this device; thresholds are guidelines, not a site-wide score.';
}
function paint(){
 const section=$('sarniQualityPanel');if(!section)return;
 section.classList.toggle('hidden',!isAdmin());if(!isAdmin())return;
 const target=$('sqMetrics');if(!target)return;target.replaceChildren();
 for(const m of metrics()){
  const item=e('div',undefined,'sq-metric');item.append(e('small',m.title),e('strong',m.value),e('small',m.target));target.append(item);
 }
 const lcp=state.lcp,inp=state.inp,cls=state.cls;
 const status=$('sqQualityInfo');
 if(status)status.textContent='Measured on this page only. '+(lcp==null||inp==null?'Some metrics require supported browser events and actual interaction. ':'')+
  'JavaScript errors/rejections captured this visit: '+state.errors+'. No records, links, or credentials are collected.';
}
function init(){ready();document.addEventListener('click',event=>{if(event.target.closest('[data-section="adminSettings"],[data-sarni-nav="adminSettings"]'))setTimeout(paint,150)},{passive:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();