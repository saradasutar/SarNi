/* SarNi Delight: progressive design layer; no backend calls, secrets or storage changes. */
(function(){'use strict';
function init(){
 const root=document.documentElement;root.classList.add('sarni-delight-ui');
 const reduced=window.matchMedia?.('(prefers-reduced-motion:reduce)').matches;
 const saveData=Boolean(navigator.connection?.saveData);
 document.querySelectorAll('.main-content img').forEach(img=>{
  if(img.closest('.topbar,.sarni-focus-hero'))return;
  if(!img.hasAttribute('loading'))img.loading='lazy';
  img.decoding='async';
 });
 document.querySelector('.side-nav.sarni-sidebar-primary')?.setAttribute('aria-label','Main dashboard navigation');
 if(!reduced&&!saveData&&'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){
   if(entry.isIntersecting){entry.target.classList.add('sarni-delight-seen');observer.unobserve(entry.target)}
  }},{rootMargin:'0px 0px 110px 0px',threshold:.01});
  document.querySelectorAll('.sarni-focus-metrics > button,.sarni-focus-hero').forEach(el=>observer.observe(el));
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();