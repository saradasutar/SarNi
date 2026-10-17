/* SarNi Delight: progressive enhancement only. Existing backend and app control remain authoritative.
   No tracking, timers, credentials, storage writes or network requests. */
(function(){'use strict';
  if(typeof document==='undefined')return;
  function init(){
    const root=document.documentElement;
    root.classList.add('sarni-delight-ui');
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const saveData=Boolean(navigator.connection?.saveData);
    // Defer below-the-fold media; icons and branding remain eager.
    const imgs=document.querySelectorAll('.main-content img');
    imgs.forEach((img)=>{
      if(img.closest('.topbar, .sarni-focus-hero'))return;
      if(!img.hasAttribute('loading'))img.loading='lazy';
      img.decoding='async';
    });
    // Meaningful keyboard access; navigation belongs to the existing SarNi application.
    const sidebar=document.querySelector('.side-nav.sarni-sidebar-primary');
    sidebar?.setAttribute('aria-label','Main dashboard navigation');
    // Cheap entrance styling: animate only when visible, and never hide content.
    if(!reduced&&!saveData&&'IntersectionObserver' in window){
      const observer=new IntersectionObserver((entries)=>{
        for(const item of entries){
          if(item.isIntersecting){item.target.classList.add('sarni-delight-seen');observer.unobserve(item.target);}
        }
      },{rootMargin:'0px 0px 110px 0px',threshold:.01});
      document.querySelectorAll('.sarni-focus-metrics > button,.sarni-focus-hero').forEach(el=>observer.observe(el));
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
