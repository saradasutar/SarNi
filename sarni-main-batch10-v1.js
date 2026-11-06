/* SarNi Main Dashboard — ten additive UI refinements (v1).
   No backend calls, credential access, transaction writes or persistent storage.
   All navigation delegates to existing SarNi controls and permissions. */
(()=>{
 'use strict';
 const start=()=>{
  const main=document.getElementById('mainDashboard');
  const nav=document.getElementById('sarniSimplifiedNav');
  if(!main||!nav||document.getElementById('sarniMainJump'))return;
  const choices=[
   ['overview','Home'],['expenditure','Expenditure'],['creditCards','Credit Cards'],
   ['calendar','Calendar'],['diary','Diary'],['experiences','Life Experiences'],['books','Book Writing']
  ];
  // 1. Compact, searchable section jump alongside existing navigation.
  const jump=document.createElement('div');jump.id='sarniMainJump';jump.className='sarni10-jump';
  const label=document.createElement('label');label.htmlFor='sarniMainJumpInput';label.textContent='Jump to section';
  const input=document.createElement('input');input.id='sarniMainJumpInput';input.type='search';
  input.placeholder='Find a section…';input.autocomplete='off';input.setAttribute('aria-controls','sarniMainJumpResults');input.setAttribute('aria-expanded','false');
  const results=document.createElement('div');results.id='sarniMainJumpResults';results.className='sarni10-results';results.hidden=true;
  const status=document.createElement('small');status.id='sarniMainJumpStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  status.textContent='Search sections, not personal records';
  const current=document.createElement('span');current.id='sarniMainCurrentSection';current.className='sarni10-current';current.textContent='Viewing: Home';
  const clear=document.createElement('button');clear.id='sarniMainJumpClear';clear.type='button';clear.textContent='Clear';clear.hidden=true;
  const head=document.createElement('div');head.className='sarni10-jump-head';head.append(label,current);
  const searchLine=document.createElement('div');searchLine.className='sarni10-jump-input';searchLine.append(input,clear);
  jump.append(head,searchLine,results,status);
  nav.insertAdjacentElement('afterend',jump);
  const allowed=choice=>[...document.querySelectorAll('[data-section]')].some(button=>{
   return button.dataset.section===choice[0]&&button.tagName==='BUTTON'&&!button.disabled&&!button.classList.contains('hidden')&&!button.closest('.hidden');
  });
  let visible=[],position=-1;
  function closeResults(){
   results.hidden=true;input.setAttribute('aria-expanded','false');position=-1;
  }
  function display(){
   const q=input.value.trim().toLocaleLowerCase();
   clear.hidden=!q;
   results.replaceChildren();
   visible=q?choices.filter(choice=>allowed(choice)&&choice[1].toLocaleLowerCase().includes(q)):[];
   if(!q){closeResults();status.textContent='Search sections, not personal records';return;}
   visible.forEach(([key,name],index)=>{
    const button=document.createElement('button');button.type='button';button.dataset.targetSection=key;
    button.textContent=name;button.setAttribute('role','option');button.setAttribute('aria-selected',String(index===position));
    button.addEventListener('click',()=>navigate(key));
    results.append(button);
   });
   results.hidden=!visible.length;input.setAttribute('aria-expanded',String(visible.length>0));
   status.textContent=visible.length+' available section'+(visible.length===1?'':'s')+' found';
  }
  function navigate(key){
   const target=[...document.querySelectorAll('[data-section]')].find(button=>
    button.dataset.section===key&&button.tagName==='BUTTON'&&!button.disabled&&
    !button.classList.contains('hidden')&&!button.closest('.hidden'));
   if(!target){status.textContent='This section is not currently available';return;}
   target.click();input.value='';clear.hidden=true;closeResults();
   const title=choices.find(x=>x[0]===key)?.[1]||'Section';
   status.textContent='Opened '+title;current.textContent='Viewing: '+title;
  }
  input.addEventListener('input',()=>{position=-1;display();});
  clear.addEventListener('click',()=>{input.value='';display();input.focus();});
  // 2. Match count is announced in status; 3. arrows and Enter choose a result.
  input.addEventListener('keydown',event=>{
   if(event.key==='Escape'){input.value='';display();input.blur();event.preventDefault();return;}
   if(!visible.length)return;
   if(event.key==='ArrowDown'||event.key==='ArrowUp'){
    event.preventDefault();position=event.key==='ArrowDown'?(position+1)%visible.length:(position+visible.length-1)%visible.length;
    [...results.querySelectorAll('button')].forEach((b,i)=>b.setAttribute('aria-selected',String(i===position)));
   }else if(event.key==='Enter'){
    event.preventDefault();navigate(visible[Math.max(0,position)][0]);
   }
  });
  // 4. Escape closes suggestions; 5. Alt+Shift+J opens section jump.
  document.addEventListener('keydown',event=>{
   if(event.key.toLowerCase()!=='j'||!event.altKey||!event.shiftKey||event.ctrlKey||event.metaKey)return;
   if(main.closest('.hidden')||document.getElementById('appView')?.classList.contains('hidden'))return;
   const active=document.activeElement;
   if(active?.matches('input,textarea,select')||active?.isContentEditable)return;
   event.preventDefault();input.focus();
  });
  document.addEventListener('pointerdown',event=>{if(!jump.contains(event.target))closeResults();});
  // 6. Reflect known navigation events without claiming backend/data readiness.
  document.addEventListener('click',event=>{
   const target=event.target.closest('button[data-section]');
   if(!target||target.disabled||target.classList.contains('hidden'))return;
   const name=choices.find(x=>x[0]===target.dataset.section)?.[1];
   if(name)current.textContent='Viewing: '+name;
  });
  // 7. Back to Top, visible only after meaningful scroll.
  const top=document.createElement('button');top.id='sarniMainBackToTop';top.className='sarni10-back-to-top';top.type='button';
  top.textContent='↑ Top';top.setAttribute('aria-label','Back to top of dashboard');top.hidden=true;
  document.body.append(top);
  const updateTop=()=>{top.hidden=window.scrollY<480||document.getElementById('appView')?.classList.contains('hidden');};
  window.addEventListener('scroll',updateTop,{passive:true});updateTop();
  top.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
