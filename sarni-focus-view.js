/* SarNi 9.8 readiness: compact, reversible focus view for the existing workspace.
 * Frontend-only; no storage, API calls or changes to permissions or records. */
(()=>{'use strict';
function boot(){
 const root=document.getElementById('sarni10Workspace'),search=document.getElementById('sarni10ModuleSearch'),collections=root?.querySelector('.sarni10-collections'),results=document.getElementById('sarni10ModuleResults');
 if(!root||!search||!collections||!results||document.getElementById('sarniFocusViewButton'))return;
 const button=document.createElement('button');
 button.id='sarniFocusViewButton';
 button.type='button';
 button.className='sarni-focus-view-toggle';
 button.setAttribute('aria-controls','sarni10ModuleResults sarni10Favorites sarni10Recent');
 button.title='Show or hide extra navigation lists; does not affect your saved records';
 const row=root.querySelector('.sarni10-search-row');
 if(row)row.append(button);
 else root.insertBefore(button,root.firstChild);
 let focused=matchMedia('(max-width: 700px)').matches;
 const apply=()=>{
  root.classList.toggle('sarni-focus-view',focused);
  button.textContent=focused?'Show full workspace':'Focus view';
  button.setAttribute('aria-pressed',String(focused));
  button.setAttribute('aria-label',focused?'Show favorites and all module shortcuts':'Hide extra navigation and show a compact workspace');
  // Search results always remain available when a query is entered.
  root.classList.toggle('sarni-focus-searching',Boolean(search.value.trim()));
 };
 button.addEventListener('click',()=>{focused=!focused;apply();});
 search.addEventListener('input',apply);
 apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();