/* SarNi 9 — batch of 10 progressive, interface-only enhancements.
 * No backend calls, storage, credentials, mutation of entries, or new permissions.
 * The existing SarNi form, authorization and save handlers stay authoritative. */
(() => {
 'use strict';
 const boot=()=>{
  const $=id=>document.getElementById(id);
  const tabs=$('tabs'),fields=$('fields'),search=$('recentSearch');
  if(!tabs||!fields||!search)return;
  // 1. Clear Recent Entries search without clearing any saved entries.
  const clear=document.createElement('button');
  clear.type='button';clear.id='qeSearchClear';clear.className='qe9-search-clear';
  clear.textContent='Clear search';clear.setAttribute('aria-label','Clear Recent Entries search');
  search.closest('label')?.insertAdjacentElement('afterend',clear);
  const updateClear=()=>{clear.hidden=!search.value;};
  clear.addEventListener('click',()=>{search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));search.focus();updateClear();});
  search.addEventListener('input',updateClear);
  tabs.addEventListener('click',()=>queueMicrotask(updateClear));
  updateClear();

  // 2. Announce the search result count to assistive technologies.
  const searchInfo=$('recentSearchInfo');
  if(searchInfo){searchInfo.setAttribute('role','status');searchInfo.setAttribute('aria-live','polite');searchInfo.setAttribute('aria-atomic','true');}

  // 3. Arrow keys navigate the tab buttons without submitting or changing a form.
  tabs.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
   const current=event.target.closest('button[data-mode]');if(!current)return;
   const buttons=[...tabs.querySelectorAll('button[data-mode]:not([disabled])')];
   const index=buttons.indexOf(current);if(index<0)return;
   const deltas={ArrowLeft:-1,ArrowRight:1,ArrowUp:-3,ArrowDown:3};
   const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:
    Math.max(0,Math.min(buttons.length-1,index+deltas[event.key]));
   event.preventDefault();buttons[next]?.focus();
  });

  // 4. Alt+Shift+1..6 activates the currently displayed, permitted tab.
  document.addEventListener('keydown',event=>{
   if(!event.altKey||!event.shiftKey||event.ctrlKey||event.metaKey||event.repeat||!/^Digit[1-6]$/.test(event.code))return;
   const active=document.activeElement;
   if(active?.isContentEditable||active?.matches('input,textarea,select'))return;
   const available=[...tabs.querySelectorAll('button[data-mode]')];
   const button=available[Number(event.code.slice(-1))-1];if(!button||button.disabled||tabs.hidden)return;
   event.preventDefault();button.click();button.focus();
  });

  // 5. Show a compact character count for the active long-text form field.
  const counter=document.createElement('small');counter.id='qeActiveFieldCount';
  counter.className='qe9-character-count';counter.hidden=true;
  counter.setAttribute('aria-live','off');
  fields.insertAdjacentElement('afterend',counter);
  const updateCount=event=>{
   const input=event.target;
   if(!fields.contains(input)||!input.matches('textarea,input[type="text"],input:not([type])')||input.maxLength<50){
    if(event.type==='focusin')counter.hidden=true;
    return;
   }
   const label=input.labels?.[0]?.textContent?.trim()||input.getAttribute('aria-label')||'Text';
   counter.textContent=label.slice(0,40)+': '+input.value.length+' / '+input.maxLength+' characters';
   counter.hidden=false;
  };
  fields.addEventListener('focusin',updateCount);
  fields.addEventListener('input',updateCount);
  tabs.addEventListener('click',()=>{counter.hidden=true;});

  // 10. Back to Top appears only after scrolling; never touches form values.
  const top=document.createElement('button');top.type='button';top.id='qeBackToTop';
  top.className='qe9-back-to-top';top.textContent='↑ Top';
  top.title='Back to top';top.setAttribute('aria-label','Back to top');
  top.hidden=true;document.body.append(top);
  const syncTop=()=>{top.hidden=window.scrollY<450;};
  window.addEventListener('scroll',syncTop,{passive:true});syncTop();
  top.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
})();
