/* SarNi Planning Centre v20.8.16
 * MyFamily-inspired presentation of EXISTING authenticated SarNi records.
 * No new backend endpoints, browser persistence, or duplicate records.
 * Target completion is task progress, NOT a money-contribution balance.
 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escDate = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v||'')) ? String(v) : '';
  const readable = v => {
    const iso=escDate(v);
    if(!iso)return 'No date';
    const d=new Date(iso+'T12:00:00');
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : 'No date';
  };
  const arr = v => Array.isArray(v) ? v : [];
  const safeState = () => typeof state !== 'undefined' && state && state.token ? state : null;
  const active = () => arr(safeState()?.stickyNotes);
  const history = () => arr(safeState()?.stickyNoteHistory);
  const important = () => arr(safeState()?.importantDates).filter(x=>!String(x.notes||'').startsWith('[SARNI_FESTIVAL_V1] '));
  const type = x => String(x?.noteType||'REMINDER').toUpperCase();
  let tab='targets', targetFilter='active', reminderFilter='all', search='', timer=0, focus=null, focusOwner='', focusAt=0, loading=false;
  let panel, count, main, searchBox, refresh;
  function el(tag,className,content){
    const n=document.createElement(tag);
    if(className)n.className=className;
    if(content!==undefined)n.textContent=String(content);
    return n;
  }
  function button(label,action,id,variant=''){
    const b=el('button','sfp-button '+variant,label);
    b.type='button';b.dataset.sfpAction=action;
    if(id!==undefined)b.dataset.sfpId=String(id);
    return b;
  }
  function notice(text){const p=el('p','sfp-empty',text);return p;}
  function datesLabel(item){
    const basis=String(item?.calendarBasis||'GREGORIAN').toUpperCase();
    const repeat=Boolean(item?.repeatYearly);
    const b=basis==='ODIA'?'Odia lunar tithi':basis==='BOTH'?'English + Odia tithi':'English date';
    return (repeat?'Every year · ':'One-time · ')+b;
  }
  function dayDiff(iso){
    if(!escDate(iso))return null;
    const a=Date.UTC(...iso.split('-').map((v,i)=>i===1?Number(v)-1:Number(v)));
    const now=new Date(),t=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
    return Math.round((a-t)/86400000);
  }
  function renderTargetCard(item,isDone){
    const card=el('article','sfp-card '+(isDone?'sfp-complete':''));
    const meta=el('div','sfp-card-meta'),label=el('strong','sfp-kind',isDone?'Completed plan / target':'Active plan / target');
    meta.append(label);
    if(isDone)meta.append(el('span','sfp-due','✓ Completed'));
    else {
      const diff=dayDiff(item.dueDate);
      const status=diff===null?'No deadline':diff<0?'Overdue · '+readable(item.dueDate):diff===0?'Due today':diff<=7?'Due in '+diff+' day'+(diff===1?'':'s'):'Due '+readable(item.dueDate);
      meta.append(el('span','sfp-due'+(diff!==null&&diff<0?' urgent':''),status));
    }
    card.append(meta,el('h4','',item.title||'Untitled target'));
    if(item.text)card.append(el('p','sfp-description',item.text));
    if(isDone){
      if(item.completedAt)card.append(el('small','sfp-reference','Completed '+readable(String(item.completedAt).slice(0,10))));
    } else {
      const actions=el('div','sfp-actions');
      actions.append(button('Edit','edit-target',item.id),button('✓ Mark done','complete-target',item.id,'primary'));
      card.append(actions);
    }
    return card;
  }
  function renderReminderCard(row){
    const card=el('article','sfp-card');
    const meta=el('div','sfp-card-meta');
    const sticky=row._sticky===true;
    const kind=sticky?'Quick reminder':String(row.kind||'Important date').replace(/_/g,' ').toLowerCase();
    meta.append(el('strong','sfp-kind',kind));
    meta.append(el('span','sfp-due',sticky?(row.dueDate?'Due '+readable(row.dueDate):'No due date'):(row.repeatYearly?'Original '+readable(row.eventDate):readable(row.eventDate))));
    card.append(meta,el('h4','',row.title||'Untitled reminder'));
    if(!sticky)card.append(el('small','sfp-reference',datesLabel(row)));
    if(row.text||row.notes)card.append(el('p','sfp-description',row.text||row.notes));
    const actions=el('div','sfp-actions');
    actions.append(button('Edit',sticky?'edit-sticky-reminder':'edit-date',row.id));
    if(!sticky)actions.append(button('Calendar','calendar-date',row.id));
    card.append(actions);
    return card;
  }
  function renderTargets(){
    const cards=active().filter(x=>type(x)==='TARGET');
    const done=history().filter(x=>type(x)==='TARGET');
    const total=cards.length+done.length;
    const percent=total?Math.round(done.length*100/total):0;
    const summary=el('div','sfp-stats');
    for(const [value,label] of [[cards.length,'Active'],[done.length,'Completed'],[percent+'%','Task completion']]){
      const tile=el('div','sfp-stat');tile.append(el('strong','',value),el('small','',label));summary.append(tile);
    }
    main.append(summary);
    const help=el('p','sfp-help','Create any personal, family, home, travel, office, learning, health, savings or village plan. Add tasks and next actions in Details, set an optional deadline, edit anytime and mark completed. Saved privately in existing SarNi records. Completion % counts finished plans, not money contributions.');
    main.append(help);
    const tools=el('div','sfp-toolbar');
    for(const [value,label] of [['active','Active'],['upcoming','Due in 7 days'],['overdue','Overdue'],['completed','Completed'],['all','All']]){
      const b=button(label,'target-filter',value,targetFilter===value?'selected':'');
      b.setAttribute('aria-pressed',String(targetFilter===value));tools.append(b);
    }
    tools.append(button('＋ New plan / target','new-target',undefined,'primary'));
    main.append(tools);
    const selected=targetFilter==='active'?cards.map(x=>({x,done:false})):targetFilter==='upcoming'?cards.filter(x=>{const days=dayDiff(x.dueDate);return days!==null&&days>=0&&days<=7;}).map(x=>({x,done:false})):targetFilter==='overdue'?cards.filter(x=>{const days=dayDiff(x.dueDate);return days!==null&&days<0;}).map(x=>({x,done:false})):targetFilter==='completed'?done.map(x=>({x,done:true})):[...cards.map(x=>({x,done:false})),...done.map(x=>({x,done:true}))];
    selected.sort((a,b)=>String(a.x.dueDate||'9999-12-31').localeCompare(String(b.x.dueDate||'9999-12-31')));
    const q=search.toLowerCase(), visible=selected.filter(({x})=>[x.title,x.text,x.dueDate].join(' ').toLowerCase().includes(q));
    const grid=el('div','sfp-grid');
    if(!visible.length)grid.append(notice(search?'No plans match your search.':'No plans in this view. Choose New plan / target to start.'));
    else visible.forEach(({x,done})=>grid.append(renderTargetCard(x,done)));
    main.append(grid);
  }
  function renderFocus(){
    const events=arr(focus?.events).filter(x=>escDate(x.date));
    if(!events.length)return;
    const group=el('section','sfp-upcoming');
    group.append(el('h4','','Upcoming backend-calculated occurrences'));
    const list=el('div','sfp-upcoming-list');
    events.slice(0,5).forEach(x=>{
      const row=el('div','sfp-upcoming-row');
      row.append(el('span','',readable(x.date)),el('strong','',x.title||'Occasion'),el('small','',x.calendarKind==='ODIA'?(x.verified?'Verified Odia':'Estimated Odia tithi'):(x.calendarKind||'English')));
      list.append(row);
    });
    group.append(list);main.append(group);
  }
  function renderReminders(){
    const standalone=important(),quick=active().filter(x=>type(x)!=='TARGET').map(x=>({...x,_sticky:true}));
    const all=[...standalone,...quick];
    const summary=el('div','sfp-stats');
    const annual=standalone.filter(x=>x.repeatYearly).length;
    const due=quick.filter(x=>{const d=dayDiff(x.dueDate);return d!==null&&d>=0&&d<=7;}).length;
    for(const [value,label] of [[all.length,'Saved reminders'],[annual,'Annual occasions'],[due,'Quick reminders due in 7 days']]){
      const tile=el('div','sfp-stat');tile.append(el('strong','',value),el('small','',label));summary.append(tile);
    }
    main.append(summary);
    main.append(el('p','sfp-help','English dates stay in English; annual Odia-tithi occasions are calculated by the SarNi backend. Never assume the original English date is the next lunar occurrence.'));
    const tools=el('div','sfp-toolbar');
    for(const [value,label] of [['all','All'],['annual','Annual'],['one-time','One-time']]){
      tools.append(button(label,'reminder-filter',value,reminderFilter===value?'selected':''));
    }
    tools.append(button('＋ New reminder','new-reminder',undefined,'primary'),button('↻ Refresh dates','refresh-dates'));
    main.append(tools);
    if(focus)renderFocus();
    let visible=all.filter(x=>reminderFilter==='all'||(reminderFilter==='annual'?!x._sticky&&x.repeatYearly:x._sticky||!x.repeatYearly));
    const q=search.toLowerCase();visible=visible.filter(x=>[x.title,x.notes,x.text,x.kind,x.eventDate,x.dueDate].join(' ').toLowerCase().includes(q));
    visible.sort((a,b)=>String(a._sticky?a.dueDate:a.eventDate||'9999-12-31').localeCompare(String(b._sticky?b.dueDate:b.eventDate||'9999-12-31')));
    const grid=el('div','sfp-grid');
    if(!visible.length)grid.append(notice(search?'No reminders match your search.':'No reminders saved here yet.'));
    else visible.forEach(x=>grid.append(renderReminderCard(x)));
    main.append(grid);
  }
  function render(){
    if(!panel||!main)return;
    const ready=Boolean(safeState());
    const owner=String(safeState()?.username||'');
    // Never show fetched occasions from another signed-in account on shared devices.
    if(focusOwner!==owner){focusOwner=owner;focus=null;focusAt=0;}
    panel.classList.toggle('sfp-locked',!ready);
    count.textContent=ready?(tab==='targets'?active().filter(x=>type(x)==='TARGET').length+' active plans':(important().length+active().filter(x=>type(x)!=='TARGET').length)+' reminders'):'Sign in to view saved plans';
    panel.querySelectorAll('[data-sfp-tab]').forEach(b=>{
      const selected=b.dataset.sfpTab===tab;b.classList.toggle('active',selected);
      b.setAttribute('aria-selected',String(selected));
    });
    searchBox.placeholder=tab==='targets'?'Search plans and targets…':'Search reminders…';
    if(searchBox.value!==search)searchBox.value=search;
    main.replaceChildren();
    if(!ready){main.append(notice('Sign in to see your private targets and reminders.'));return;}
    if(tab==='targets')renderTargets();else renderReminders();
  }
  function select(next,scroll){
    if(next!=='targets'&&next!=='reminders')return;
    if(tab!==next){search='';searchBox.value='';}
    tab=next;render();
    if(next==='reminders')void fetchUpcoming(false);
    if(scroll)requestAnimationFrame(()=>panel.scrollIntoView({behavior:'smooth',block:'start'}));
  }
  function openDateForm(row){
    if(typeof switchSection==='function')switchSection('calendar');
    const f=$('calendarEventForm');if(!f)return;
    if(row){
      const input=$('calendarEventSearch');
      // Search by the exact saved title first: the built-in calendar limits visible records.
      // Trigger the ORIGINAL edit control so lunar recurrence and email fields are preserved.
      if(input)input.value=String(row.title||'');
      if(typeof renderStandaloneCalendar==='function')renderStandaloneCalendar();
      const edit=[...document.querySelectorAll('#standaloneImportantList [data-cal-edit]')].find(b=>String(b.dataset.calEdit)===String(row.id));
      if(!edit){
        if(typeof toast==='function')toast('Could not open that date safely. Search it under Saved important dates.','error');
        if(input)input.value='';
        return;
      }
      edit.click();
      if(input){input.value='';if(typeof renderStandaloneCalendar==='function')renderStandaloneCalendar();}
    } else {
      $('calendarEventClear')?.click();
      f.elements.kind.value='REMINDER';
    }
    f.scrollIntoView({behavior:'smooth',block:'start'});
    f.elements.title?.focus({preventScroll:true});
  }
  function browseDate(row){
    if(!row||!escDate(row.eventDate))return;
    const month=$('standaloneCalendarMonth');
    if(month)month.value=row.eventDate.slice(0,7);
    if(typeof renderStandaloneCalendar==='function')renderStandaloneCalendar();
    $('standaloneCalendarGrid')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function fetchUpcoming(force){
    const s=safeState();if(!s||tab!=='reminders'||loading)return;
    const owner=String(s.username||'');
    if(owner!==focusOwner){focus=null;focusAt=0;focusOwner=owner;}
    if(!force&&focus&&Date.now()-focusAt<180000){render();return;}
    if(typeof api!=='function')return;
    loading=true;
    try{
      const r=await api('getSarNiFocus',{}, {retry:false});
      if(r?.ok&&String(safeState()?.username||'')===owner){focus=r;focusAt=Date.now();}
    }catch(err){console.warn('Planning Centre: upcoming occurrence lookup unavailable. Saved records remain accessible.',err);}
    finally{loading=false;if(tab==='reminders')render();}
  }
  function handleAction(event){
    const b=event.target.closest('[data-sfp-action]');if(!b)return;
    const action=b.dataset.sfpAction,id=b.dataset.sfpId;
    if(action==='target-filter'){targetFilter=id;render();}
    else if(action==='reminder-filter'){reminderFilter=id;render();}
    else if(action==='new-target'){if(typeof openStickyNote==='function'){openStickyNote();const x=$('stickyNoteType');if(x)x.value='TARGET';const title=$('stickyNoteModalTitle');if(title)title.textContent='New plan / target';}}
    else if(action==='edit-target'||action==='edit-sticky-reminder'){
      const row=active().find(x=>String(x.id)===String(id));if(row&&typeof openStickyNote==='function')openStickyNote(row);
    }else if(action==='complete-target'){if(typeof completeStickyNote==='function')void completeStickyNote(id);}
    else if(action==='new-reminder')openDateForm(null);
    else if(action==='edit-date'){const row=important().find(x=>String(x.id)===String(id));if(row)openDateForm(row);}
    else if(action==='calendar-date'){const row=important().find(x=>String(x.id)===String(id));if(row)browseDate(row);}
    else if(action==='refresh-dates'){focusAt=0;void fetchUpcoming(true);}
  }
  function interceptCalendarShortcut(event){
    const b=event.target.closest?.('[data-sarni-calendar-shortcut]');
    if(!b||!panel||!safeState())return;
    const action=b.dataset.sarniCalendarShortcut;
    if(action!=='target'&&action!=='reminder')return;
    event.preventDefault();event.stopImmediatePropagation();
    if(typeof closeSarNiMobileMore==='function')closeSarNiMobileMore();
    if(typeof switchSection==='function')switchSection('calendar');
    select(action==='target'?'targets':'reminders',true);
  }
  function scheduleRender(){
    if(timer) return;
    timer=requestAnimationFrame(()=>{timer=0;render();});
  }
  function install(){
    if($('sarniFamilyPlanner')||!$('calendarSection'))return;
    panel=el('section','sfp-shell');
    panel.id='sarniFamilyPlanner';
    panel.setAttribute('aria-label','SarNi universal planning, targets and reminders centre');
    panel.innerHTML='<header class="sfp-header"><div><small>YOUR PERSONAL PLANNING CENTRE</small><h3>Plans, targets &amp; reminders</h3><p>Any plan, any deadline, any occasion. Save it once, find it quickly and track progress.</p></div><span id="sfpCount"></span></header><div class="sfp-controls"><div class="sfp-tabs" role="tablist" aria-label="Planning view"><button data-sfp-tab="targets" type="button" role="tab">◎ Plans / Targets</button><button data-sfp-tab="reminders" type="button" role="tab">◷ Reminders</button></div><input id="sfpSearch" type="search" aria-label="Search plans and reminders" placeholder="Search plans and targets…" autocomplete="off"></div><div id="sfpMain" class="sfp-main" aria-live="polite"></div>';
    $('sarniFestivalManager')?.before(panel);
    if(!panel.isConnected)$('calendarSection').append(panel);
    count=$('sfpCount');main=$('sfpMain');searchBox=$('sfpSearch');
    searchBox.addEventListener('input',()=>{search=searchBox.value;render();});
    panel.addEventListener('click',event=>{
      const b=event.target.closest('[data-sfp-tab]');
      if(b){select(b.dataset.sfpTab,false);return;}
      handleAction(event);
    });
    document.addEventListener('click',interceptCalendarShortcut,true);
    if(typeof renderStickyNotes==='function'){
      const old=renderStickyNotes;
      renderStickyNotes=function(){const r=old.apply(this,arguments);scheduleRender();return r;};
    }
    if(typeof renderStandaloneCalendar==='function'){
      const old=renderStandaloneCalendar;
      renderStandaloneCalendar=function(){const r=old.apply(this,arguments);scheduleRender();return r;};
    }
    const section=$('calendarSection');
    new MutationObserver(()=>{if(!section.classList.contains('hidden'))scheduleRender();}).observe(section,{attributes:true,attributeFilter:['class']});
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();