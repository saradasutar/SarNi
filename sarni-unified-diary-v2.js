/* SarNi Unified Diary & Knowledge v2.2 (history + search) — additive private API integration.
   Existing personal diary, StockDiary and MonthlyDiary records are not migrated or duplicated. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const monthNow=()=>today().slice(0,7);
const plain=x=>String(x||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const state={tab:'write',kind:'personal',entry:null,dirty:false,busy:false,loaded:false,loading:false,showLegacy:false,q:'',month:monthNow(),period:'all',day:today(),year:today().slice(0,4),from:'',to:'',category:'all',flag:'all',company:'all',sort:'newest',limit:30,data:{diary:[],notes:[],wisdom:[],companies:[],annotations:[],legacyMonthly:[]}};
const keys={personal:'Personal Diary',stock:'Stock Research',wisdom:'Investment Wisdom'};
let editorSelection='',editorRange=null,draftMeta=null,searchTimer=0;
function bridge(){const b=window.SarniStockBridge;if(!b?.call||!b?.session)throw Error('SarNi is not ready. Sign in and verify the current Stock Diary frontend was installed.');if(!b.session().signedIn)throw Error('Sign in to SarNi first.');return b;}
async function api(action,payload={}){const r=await bridge().call(action,payload);if(!r||r.ok!==true)throw Error(r?.message||'Unable to complete request');return r;}
function toast(s,err=false){const el=$('dkMessage');if(el){el.textContent=s;el.classList.toggle('dk-error',err);}if(err)console.warn('SarNi Diary & Knowledge: '+s);}
function cleanHtml(html){const tmp=document.createElement('template');tmp.innerHTML=String(html||'');const allow=new Set(['P','DIV','BR','B','STRONG','I','EM','U','S','STRIKE','UL','OL','LI','BLOCKQUOTE','H2','H3','SPAN']);
 const walk=parent=>{for(const c of [...parent.childNodes]){if(c.nodeType===1){if(!allow.has(c.tagName)){const v=document.createTextNode(c.textContent||'');c.replaceWith(v);continue;}let fg='',bg='';if(c.tagName==='SPAN'){fg=c.style.color;bg=c.style.backgroundColor;}[...c.attributes].forEach(a=>c.removeAttribute(a.name));if(fg&&(/^(#[a-f0-9]{3}(?:[a-f0-9]{3})?|rgb\([0-9, ]+\))$/i).test(fg))c.style.color=fg;if(bg&&(/^(#[a-f0-9]{3}(?:[a-f0-9]{3})?|rgb\([0-9, ]+\))$/i).test(bg))c.style.backgroundColor=bg;walk(c);}else if(c.nodeType!==3)c.remove();}};walk(tmp.content);return tmp.innerHTML;}
function meta(kind,id){return state.data.annotations.find(m=>m.kind===kind&&m.recordId===id)||{};}
function allEntries(){return [
 ...state.data.diary.map(x=>({kind:'personal',id:x.id,date:x.entryDate,title:x.title||'Personal diary',text:x.text||'',category:x.entryType||'PERSONAL',original:x})),
 ...state.data.notes.map(x=>({kind:'stock',id:x.id,date:String(x.entryDate||'').slice(0,10),title:x.title||'Stock note',text:plain(x.content),category:'STOCK',original:x})),
 ...state.data.wisdom.map(x=>({kind:'wisdom',id:x.id,date:String(x.createdAt||'').slice(0,10)||((meta('wisdom',x.id).monthKey||'')+'-01'),title:x.title||'Investment lesson',text:plain(x.content),category:'WISDOM',original:x}))].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
}
function skeleton(){const diary=$('diarySection'),sidebar=$('sarniSidebarPrimary')?.querySelector('[data-section="diary"]');if(!diary||!sidebar||!$('mainDashboard')||$('dkUnifiedSection'))return false;
 const ui=document.createElement('section');ui.id='dkUnifiedSection';ui.innerHTML=`<div class="dk-banner"><div><span class="dk-eyebrow">YOUR WRITING & KNOWLEDGE CENTRE</span><h2>Diary &amp; Knowledge</h2><p>Write once, mark monthly highlights and keep lessons connected. Calendar stays in the main menu.</p></div><div class="dk-banner-actions"><button type="button" data-dk-action="new">＋ New entry</button><button type="button" class="dk-quiet" data-dk-action="refresh">↻ Refresh</button></div></div>
 <div class="dk-nav" role="navigation" aria-label="Diary and Knowledge views"><button type="button" data-dk-tab="write">✎ Write</button><button type="button" data-dk-tab="all">▤ Browse history</button><button type="button" data-dk-tab="monthly">★ Monthly highlights</button><button type="button" data-dk-tab="stock">▥ Stock Research</button><button type="button" data-dk-tab="wisdom">✦ Investment Wisdom</button></div>
 <p id="dkMessage" aria-live="polite" class="dk-message">Your existing diary records remain in SarNi.</p>
 <div id="dkContent"></div><div class="dk-footer"><button type="button" data-dk-action="legacy">Open existing monthly plans, targets &amp; old diary views</button><button type="button" data-dk-action="book">Open investment book &amp; advanced research</button></div>`;
 diary.prepend(ui);diary.classList.add('dk-compact');document.documentElement.classList.add('dk-installed');
 const ico=sidebar.querySelector('span[aria-hidden]');sidebar.textContent='';if(ico){ico.textContent='◈';sidebar.appendChild(ico);}sidebar.append(document.createTextNode(' Diary & Knowledge'));
 const ret=document.createElement('button');ret.type='button';ret.id='dkReturn';ret.textContent='← Return to Diary & Knowledge';ret.addEventListener('click',()=>setLegacy(false));diary.prepend(ret);
 sidebar.addEventListener('click',()=>{if(state.showLegacy)setLegacy(false);setTimeout(()=>{if(!state.loaded)load();},0);});
 const legacyNav=$('sarniSidebarPrimary');if(legacyNav)legacyNav.querySelectorAll('[data-section="stockDiary"],[data-sd-only="wisdom"]').forEach(b=>b.classList.add('dk-hide-nav'));
 ui.addEventListener('click',onClick);ui.addEventListener('submit',onSubmit);ui.addEventListener('change',onChange);ui.addEventListener('input',onListInput);
 return true;
}
function setLegacy(yes){state.showLegacy=!!yes;const root=$('diarySection');root?.classList.toggle('dk-compact',!yes);root?.classList.toggle('dk-legacy',yes);if(!yes)draw();}
function makeToolbar(){return `<div class="dk-toolbar" role="toolbar" aria-label="Writing formatting"><button type="button" data-dk-format="bold" title="Bold"><b>B</b></button><button type="button" data-dk-format="italic" title="Italic"><i>I</i></button><button type="button" data-dk-format="underline" title="Underline"><u>U</u></button><button type="button" data-dk-format="strikeThrough" title="Strikethrough"><s>S</s></button><button type="button" data-dk-format="insertUnorderedList" title="Bullets">☷</button><button type="button" data-dk-format="insertOrderedList" title="Numbered list">1.</button><button type="button" data-dk-format="formatBlock" data-dk-value="h3" title="Heading">H</button><label>Text <input aria-label="Text colour" type="color" id="dkColor" value="#245cc5"></label><label>Highlight <input aria-label="Highlight colour" type="color" id="dkHighlight" value="#fff0a6"></label><button type="button" data-dk-format="removeFormat" title="Clear formatting">Tx</button></div>`;}
function kinds(){return `<option value="personal">Personal / Learning / Plans</option><option value="stock">Stock Research</option><option value="wisdom">Investment Wisdom</option>`;}
function writeView(){const r=state.entry||{},kind=state.kind,m=state.entry?.id?meta(kind,state.entry.id):(draftMeta||{});
 let date=r.entryDate||r.date||(kind==='wisdom'&&m.monthKey?m.monthKey+'-01':'')||(kind==='wisdom'?String(r.createdAt||'').slice(0,10):'')||today();const html=cleanHtml(m.html||(kind==='personal'?esc(r.text||'').replace(/\n/g,'<br>'):(r.content||'')));
 const selectCompanies=state.data.companies.map(c=>`<option value="${esc(c.id)}" ${r.companyId===c.id?'selected':''}>${esc(c.name)} ${c.symbol?'('+esc(c.symbol)+')':''}</option>`).join('');
 const isStock=kind==='stock',isWisdom=kind==='wisdom',month=m.monthKey||date.slice(0,7);
 $('dkContent').innerHTML=`<form id="dkForm" data-entry-id="${esc(r.id||'')}" data-entry-kind="${esc(kind)}" autocomplete="off" class="dk-editor-form"><div class="dk-editor-top"><div><h3>${r.id?'Edit existing entry':'Write a new entry'}</h3><p>One original record, accessible from all relevant views.</p></div><span class="dk-private">◉ Stored in private SarNi backend</span></div>
 <div class="dk-two"><label>Entry type<select name="kind" id="dkKind">${kinds()}</select></label><label>Entry date<input name="entryDate" type="date" id="dkDate" value="${esc(date)}" required></label></div>
 ${isStock?`<div class="dk-two"><label>Company<select name="companyId" id="dkCompany"><option value="">Select company…</option>${selectCompanies}</select></label><div class="dk-company-add"><button type="button" data-dk-action="company">＋ Add company</button></div></div><div class="dk-two"><label>Decision<select name="decision"><option>Research further</option><option>Watch</option><option>Buy</option><option>Hold</option><option>Avoid</option><option>Sell</option></select></label><label>Next review date<input type="date" name="reviewDate" value="${esc(r.reviewDate||'')}"></label></div>`:''}
 ${isWisdom?`<div class="dk-two"><label>Book chapter<input name="chapter" placeholder="Valuation, investing psychology..." maxlength="120" value="${esc(r.chapter||'')}"></label><label>Lesson category<input name="category" maxlength="100" value="${esc(r.category||'Investment Principle')}"></label></div>`:''}
 ${kind==='personal'?`<div class="dk-two"><label>Type<select id="dkEntryType" name="entryType">${['PERSONAL','LEARNING','TARGET','IDEA','GRATITUDE'].map(x=>`<option value="${x}" ${r.entryType===x?'selected':''}>${x.charAt(0)+x.slice(1).toLowerCase()}</option>`).join('')}</select></label><label>Privacy<select name="visibility"><option value="PRIVATE" ${r.visibility==='SHARED'?'':'selected'}>🔒 Private to me</option><option value="SHARED" ${r.visibility==='SHARED'?'selected':''}>👥 Share with spouse</option></select></label></div>`:''}
 <label>Title <input name="title" maxlength="160" placeholder="What happened, what I learned, or what I researched" value="${esc(r.title||'')}"></label>
 ${makeToolbar()}<div id="dkRich" role="textbox" aria-label="Diary content" contenteditable="true" spellcheck="true" data-placeholder="Write your thoughts, analysis, or lessons here…">${html}</div>
 <div class="dk-two"><label>Tags (separate with commas)<input name="tags" maxlength="1200" value="${esc(m.tags||r.tags||'')}" placeholder="family, important, research, learning"></label><label class="dk-check"><input type="checkbox" name="important" ${r.important?'checked':''}> ★ Important</label></div>
 <div class="dk-highlight-box"><label class="dk-check"><input type="checkbox" name="monthlyHighlight" id="dkMonthly" ${m.monthlyHighlight?'checked':''}> <b>Show in Monthly Highlights</b></label><p>This entry will appear in ${esc(month)} automatically. You will not create another diary.</p><label>Selected passage for monthly view (optional)<textarea name="highlightExcerpt" id="dkExcerpt" rows="2" maxlength="4500" placeholder="Leave blank to show the entry summary">${esc(m.highlightExcerpt||'')}</textarea></label><button type="button" data-dk-action="selection">Use selected passage from my writing</button></div>
 <div class="dk-form-actions"><button type="submit" class="dk-primary" ${state.busy?'disabled':''}>${r.id?'Save changes':'Save entry'}</button><button type="button" data-dk-action="clear">New / Clear</button><button type="button" data-dk-action="draft">Download draft</button><span id="dkWriteCount">0 words</span></div>
 </form>`;
 $('dkKind').value=kind;const f=$('dkForm');if(f.elements.decision&&r.decision)f.elements.decision.value=r.decision;
 const ed=$('dkRich');f.addEventListener('input',()=>{state.dirty=true;});ed.addEventListener('input',countWords);ed.addEventListener('mouseup',captureSelection);ed.addEventListener('keyup',captureSelection);ed.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();f.requestSubmit();}});countWords();
}
function captureSelection(){const s=window.getSelection();if(s?.rangeCount&&$('dkRich')?.contains(s.anchorNode)){editorSelection=s.toString().trim().slice(0,4500);editorRange=s.getRangeAt(0).cloneRange();}}
function countWords(){const text=$('dkRich')?.innerText||'';$('dkWriteCount')&&($('dkWriteCount').textContent=(text.trim()?text.trim().split(/\s+/).length:0)+' words');}
// Search and date browsing use the existing authenticated dkList response. No data is duplicated.
function normal(s){return String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/\s+/g,' ').trim();}
function queryWords(s){const matches=String(s||'').match(/"[^"]+"|\S+/g)||[];return matches.map(x=>normal(x.replace(/^"|"$/g,''))).filter(Boolean);}
function companyName(id){const c=state.data.companies.find(x=>String(x.id)===String(id));return c?`${c.name||''} ${c.symbol||''} ${c.sector||''}`:'';}
function recordDate(x){const s=String(x.date||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';}
function archiveEntries(){return state.data.legacyMonthly.map(x=>({kind:'archive',id:x.id||'',date:String(x.monthKey||'').slice(0,7)+'-01',monthOnly:true,title:x.title||'Old monthly diary',text:x.text||'',category:'ARCHIVE',original:x}));}
function entryIndex(x){const m=meta(x.kind,x.id),r=x.original||{};return normal([x.title,x.text,m.highlightExcerpt,m.tags,r.tags,x.category,x.kind,r.decision,r.chapter,r.category,r.principle,r.application,r.sourceLinks,companyName(r.companyId||r.sourceCompanyId),x.monthOnly?'monthly diary archive':'',x.date].join(' '));}
function periodMatch(x,tab){const date=recordDate(x);if(tab==='monthly')return (x.kind==='archive'||meta(x.kind,x.id).monthlyHighlight===true)&&String(x.monthOnly?x.original.monthKey:meta(x.kind,x.id).monthKey||date).startsWith(state.month);
 if(state.period==='all')return true;
 if(!date)return false;
 if(state.period==='day')return !x.monthOnly&&date===state.day;
 if(state.period==='month')return date.slice(0,7)===state.month;
 if(state.period==='year')return date.slice(0,4)===state.year;
 if(state.period==='range')return (!state.from||date>=state.from)&&(!state.to||date<=state.to)&&(!x.monthOnly||!state.from||state.from.slice(0,7)<=date.slice(0,7));
 return true;
}
function filterEntries(tab){const terms=queryWords(state.q);let rows=allEntries();if(tab==='all'||tab==='monthly')rows=rows.concat(archiveEntries());
 rows=rows.filter(x=>{
  if(tab==='stock'&&x.kind!=='stock'||tab==='wisdom'&&x.kind!=='wisdom')return false;
  if(!periodMatch(x,tab))return false;
  if(state.category!=='all'){
    const category=state.category;
    if(category==='personal'&&x.kind!=='personal'||category==='stock'&&x.kind!=='stock'||category==='wisdom'&&x.kind!=='wisdom'||category==='archive'&&x.kind!=='archive')return false;
    if(['learning','target','idea','gratitude'].includes(category)&&!(x.kind==='personal'&&String(x.category||'').toLowerCase()===category))return false;
  }
  const m=meta(x.kind,x.id),r=x.original||{};
  if(state.flag==='important'&&!(r.important===true||String(r.important).toLowerCase()==='true'))return false;
  if(state.flag==='monthly'&&!(m.monthlyHighlight===true||x.kind==='archive'))return false;
  if(state.company!=='all'&&String(r.companyId||r.sourceCompanyId||'')!==state.company)return false;
  if(terms.length&&!terms.every(t=>entryIndex(x).includes(t)))return false;
  return true;
 });
 rows.sort((a,b)=>state.sort==='title'?String(a.title||'').localeCompare(String(b.title||'')):(state.sort==='oldest'?1:-1)*recordDate(a).localeCompare(recordDate(b)) || String(b.id||'').localeCompare(String(a.id||'')));
 return rows;
}
function periodControls(){const p=state.period;return p==='day'?`<label>Choose day<input id="dkHistoryDay" aria-label="Choose day" type="date" value="${esc(state.day)}"></label>`
 :p==='month'?`<label>Choose month<input id="dkHistoryMonth" aria-label="Choose month" type="month" value="${esc(state.month)}"></label>`
 :p==='year'?`<label>Choose year<select id="dkHistoryYear" aria-label="Choose year">${yearOptions()}</select></label>`
 :p==='range'?`<label>From<input id="dkHistoryFrom" type="date" value="${esc(state.from)}"></label><label>To<input id="dkHistoryTo" type="date" value="${esc(state.to)}"></label>`:'';}
function yearOptions(){const years=new Set([today().slice(0,4),state.year]);allEntries().concat(archiveEntries()).forEach(x=>{const yr=recordDate(x).slice(0,4);if(/^\d{4}$/.test(yr))years.add(yr);});return [...years].sort((a,b)=>b.localeCompare(a)).map(y=>`<option value="${esc(y)}" ${y===state.year?'selected':''}>${esc(y)}</option>`).join('');}
function rowHtml(x){const m=meta(x.kind,x.id),arch=x.kind==='archive',stamp=x.monthOnly?String(x.original.monthKey||'')+' · Archived monthly diary':(recordDate(x)||'Undated');const category=x.kind==='personal'&&String(x.category).toUpperCase()!=='PERSONAL'?' · '+x.category:'';
 return `<article class="dk-item" data-dk-row="${esc(x.id)}"><div><div class="dk-item-meta">${esc(stamp)} · ${esc(keys[x.kind]||'Monthly Diary')}${esc(category)} ${m.monthlyHighlight?' · ★ Monthly':''}</div><h4>${esc(x.title)}</h4><p>${esc((m.highlightExcerpt||x.text||'').slice(0,380))}</p>${m.tags?`<small>Tags: ${esc(m.tags)}</small>`:''}${x.kind==='stock'||x.kind==='wisdom'?`<small>${esc(companyName(x.original.companyId||x.original.sourceCompanyId))}</small>`:''}</div><div class="dk-row-actions">${arch?'<span class="dk-archive-label">Read-only archive</span>':`<button type="button" data-dk-edit="${esc(x.kind+':'+x.id)}">Edit</button><button type="button" data-dk-mark="${esc(x.kind+':'+x.id)}">${m.monthlyHighlight?'★ Marked':'☆ Highlight'}</button>${x.kind==='stock'?`<button type="button" data-dk-wisdom="${esc(x.id)}">✦ To Wisdom</button>`:''}`}</div></article>`;}
function drawResults(){const box=$('dkResultList');if(!box)return;const rows=filterEntries(state.tab),visible=rows.slice(0,state.limit);
 const count=$('dkResultCount');if(count)count.textContent=`${rows.length} matching ${rows.length===1?'entry':'entries'}${rows.length>state.limit?' · Showing first '+visible.length:''}`;
 box.innerHTML=visible.length?visible.map(rowHtml).join(''):'<div class="dk-empty">No matching entries. Change the date, category or search, or choose All dates.</div>';
 const more=$('dkLoadMore');if(more){more.hidden=rows.length<=state.limit;more.textContent=`Show more (${rows.length-state.limit} remaining)`;}
 const print=$('dkPrintResults');if(print)print.disabled=!rows.length;
}
function listView(tab){const head={all:'Browse your diary history',monthly:'Monthly highlights',stock:'Company research and reviews',wisdom:'Investment Wisdom'}[tab];
 const help=tab==='monthly'?'Entries marked for the selected month, plus existing monthly diary archives.':'Find entries by day, month, year, keyword, category or company. No second calendar.';
 const opts=[['all','All dates'],['day','Particular day'],['month','Particular month'],['year','Entire year'],['range','Date range']].map(([v,t])=>`<option value="${v}" ${state.period===v?'selected':''}>${t}</option>`).join('');
 const categories=[['all','All types'],['personal','Personal Diary'],['learning','Learning'],['target','Targets'],['idea','Ideas'],['gratitude','Gratitude'],['stock','Stock Research'],['wisdom','Investment Wisdom'],['archive','Old monthly diary']].map(([v,t])=>`<option value="${v}" ${state.category===v?'selected':''}>${t}</option>`).join('');
 const companies=state.data.companies.map(c=>`<option value="${esc(c.id)}" ${state.company===c.id?'selected':''}>${esc(c.name)}${c.symbol?' ('+esc(c.symbol)+')':''}</option>`).join('');
 $('dkContent').innerHTML=`<div class="dk-list-head"><div><h3>${head}</h3><p>${help}</p></div><button type="button" data-dk-action="new">＋ New entry</button></div>
 <section class="dk-history-search" aria-label="Diary search and history filters"><label class="dk-search-main">Search diary, research, wisdom or tags<input id="dkSearch" autocomplete="off" type="search" placeholder='Try: "loan growth", expenses, HDFC, lesson' value="${esc(state.q)}"></label>
 <div class="dk-history-shortcuts" role="group" aria-label="Quick date selection"><button type="button" data-dk-shortcut="today">Today</button><button type="button" data-dk-shortcut="month">This month</button><button type="button" data-dk-shortcut="year">This year</button><button type="button" data-dk-shortcut="all">All dates</button></div>
 <div class="dk-history-controls">${tab==='monthly'?`<label>Highlight month<input id="dkMonthFilter" type="month" value="${esc(state.month)}"></label>`:`<label>Browse by<select id="dkPeriod">${opts}</select></label><span id="dkPeriodControls" class="dk-period-controls">${periodControls()}</span>`}
 ${tab==='all'?`<label>Entry type<select id="dkCategory">${categories}</select></label>`:''}
 ${(tab==='all'||tab==='stock'||tab==='wisdom')?`<label>Company<select id="dkCompanyFilter"><option value="all">All companies</option>${companies}</select></label>`:''}
 <label>Show<select id="dkFlag"><option value="all" ${state.flag==='all'?'selected':''}>All records</option><option value="important" ${state.flag==='important'?'selected':''}>★ Important</option><option value="monthly" ${state.flag==='monthly'?'selected':''}>Monthly highlights</option></select></label>
 <label>Sort<select id="dkSort"><option value="newest" ${state.sort==='newest'?'selected':''}>Newest first</option><option value="oldest" ${state.sort==='oldest'?'selected':''}>Oldest first</option><option value="title" ${state.sort==='title'?'selected':''}>Title A–Z</option></select></label></div>
 <div class="dk-search-bottom"><span id="dkResultCount" role="status" aria-live="polite"></span><div><button type="button" data-dk-action="clearfilters">Clear filters</button><button type="button" id="dkPrintResults" data-dk-action="print">Print results / PDF</button>${tab==='stock'?'<button type="button" data-dk-action="company">＋ Company</button>':''}</div></div></section>
 <div id="dkResultList" class="dk-list-results"></div><button id="dkLoadMore" type="button" data-dk-action="more" class="dk-load-more" hidden>Show more</button>
 ${tab==='wisdom'?'<div class="dk-secondary-actions"><button type="button" data-dk-action="book">Open Investment Book chapters and export</button></div>':''}`;
 drawResults();
}
function onListInput(e){if(e.target?.id!=='dkSearch')return;state.q=e.target.value;state.limit=30;clearTimeout(searchTimer);searchTimer=setTimeout(drawResults,130);}
function updateListFilter(e){const id=e.target.id,val=e.target.value;const match={dkPeriod:'period',dkHistoryDay:'day',dkHistoryMonth:'month',dkHistoryYear:'year',dkHistoryFrom:'from',dkHistoryTo:'to',dkMonthFilter:'month',dkCategory:'category',dkCompanyFilter:'company',dkFlag:'flag',dkSort:'sort'};if(!match[id])return false;
 state[match[id]]=val;state.limit=30;
 if(id==='dkPeriod'){$('dkPeriodControls').innerHTML=periodControls();}
 if(id==='dkHistoryFrom'&&state.to&&state.from>state.to){state.to=state.from;const to=$('dkHistoryTo');if(to)to.value=state.to;}
 if(id==='dkHistoryTo'&&state.from&&state.to<state.from){state.from=state.to;const from=$('dkHistoryFrom');if(from)from.value=state.from;}
 drawResults();return true;
}
function printVisibleResults(){const rows=filterEntries(state.tab),label=state.tab==='monthly'?`Monthly highlights · ${state.month}`:'Diary & Knowledge — filtered results';
 const content=rows.map(x=>`<article><small>${esc(x.monthOnly?x.original.monthKey:recordDate(x))} · ${esc(keys[x.kind]||'Old Monthly Diary')}</small><h2>${esc(x.title)}</h2><p>${esc(meta(x.kind,x.id).highlightExcerpt||x.text).replace(/\n/g,'<br>')}</p></article>`).join('');
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(label)}</title><style>body{font:16px/1.6 system-ui;max-width:850px;margin:36px auto;color:#23364a}article{page-break-inside:avoid;border-bottom:1px solid #dce5e9;padding:16px 0}h1{color:#165c54}h2{font-size:19px}small{color:#667b8b}p{white-space:normal}</style></head><body><h1>${esc(label)}</h1><p>${rows.length} entries · ${esc(state.q?'Search: '+state.q:'')}</p>${content||'<p>No records match the filters.</p>'}</body></html>`;
 const w=window.open('','_blank');if(!w){toast('Allow pop-ups to print or save as PDF.',true);return;}w.document.open();w.document.write(html);w.document.close();w.focus();w.print();
}
function draw(){const sec=$('diarySection');if(!sec||state.showLegacy)return;const title=$('pageTitle');if(title&&(!sec.classList.contains('hidden')))title.textContent='Diary & Knowledge';document.querySelectorAll('#dkUnifiedSection [data-dk-tab]').forEach(x=>{let active=x.dataset.dkTab===state.tab;x.classList.toggle('active',active);x.setAttribute('aria-current',active?'page':'false');});if(state.tab==='write')writeView();else listView(state.tab);}
async function load(){if(state.loading)return;state.loading=true;toast('Loading your private diary library…');try{const r=await api('dkList');for(const k of Object.keys(state.data))state.data[k]=r[k]||[];state.loaded=true;toast(`${state.data.diary.length} diary entries · ${state.data.notes.length} stock notes · ${state.data.wisdom.length} wisdom entries`);if(state.tab!=='write')draw();}catch(e){toast(e.message,true);}finally{state.loading=false;}}
function goto(tab,kind){if(tab!==state.tab&&state.dirty&&!confirm('Discard unsaved changes in your entry?'))return;state.dirty=false;state.tab=tab;if(kind)state.kind=kind;if(tab==='write'&&!state.entry)state.kind=kind||state.kind;setLegacy(false);draw();if(!state.loaded)load();}
function start(kind='personal',record=null){if(state.dirty&&!confirm('Discard unsaved changes in your entry?'))return;state.kind=kind;state.entry=record;state.tab='write';state.dirty=false;editorSelection='';editorRange=null;draftMeta=null;setLegacy(false);draw();}
function edit(kind,id){let source=kind==='personal'?state.data.diary:kind==='stock'?state.data.notes:state.data.wisdom;const r=source.find(x=>x.id===id);if(!r){toast('Record not found. Refresh and retry.',true);return;}start(kind,r);}
function promote(id){let note=state.data.notes.find(x=>x.id===id);if(!note)return;const r={title:'Lesson from: '+note.title,content:note.content||'',sourceNoteId:id,sourceCompanyId:note.companyId,chapter:'Uncategorised',category:'Investment Principle'};start('wisdom',r);}
function companyAdd(){const name=prompt('Company name (as you want it in your Stock Library):');if(!name?.trim())return;const symbol=prompt('NSE / BSE symbol (optional):')||'';api('dkSaveCompany',{record:{name:name.trim(),symbol:symbol.trim()}}).then(()=>load()).then(()=>{state.kind='stock';state.tab='write';state.entry=null;draw();toast('Company added. You can now write the research note.');}).catch(e=>toast(e.message,true));}
function onClick(e){const tab=e.target.closest('[data-dk-tab]');if(tab){if(state.dirty&&!confirm('Discard unsaved changes in your entry?'))return;state.dirty=false;state.tab=tab.dataset.dkTab;draw();return;}
 const shortcut=e.target.closest('[data-dk-shortcut]');if(shortcut){const mode=shortcut.dataset.dkShortcut;if(mode==='today'){state.period='day';state.day=today();}else if(mode==='month'){state.period='month';state.month=monthNow();}else if(mode==='year'){state.period='year';state.year=today().slice(0,4);}else state.period='all';state.limit=30;draw();return;}
 const more=e.target.closest('[data-dk-action="more"]');if(more){state.limit+=30;drawResults();return;}
 const clear=e.target.closest('[data-dk-action="clearfilters"]');if(clear){state.q='';state.period='all';state.category='all';state.flag='all';state.company='all';state.sort='newest';state.limit=30;draw();return;}
 const fmt=e.target.closest('[data-dk-format]');if(fmt){e.preventDefault();$('dkRich')?.focus();document.execCommand(fmt.dataset.dkFormat,false,fmt.dataset.dkValue||null);countWords();return;}
 const editBtn=e.target.closest('[data-dk-edit]');if(editBtn){const [kind,id]=editBtn.dataset.dkEdit.split(':');edit(kind,id);return;}
 const mark=e.target.closest('[data-dk-mark]');if(mark){let [kind,id]=mark.dataset.dkMark.split(':'),m=meta(kind,id);api('dkHighlight',{kind,id,monthlyHighlight:!m.monthlyHighlight}).then(()=>load()).catch(e=>toast(e.message,true));return;}
 const p=e.target.closest('[data-dk-wisdom]');if(p){promote(p.dataset.dkWisdom);return;}
 const act=e.target.closest('[data-dk-action]');if(!act)return;
 if(act.dataset.dkAction==='new'){start(state.tab==='stock'?'stock':state.tab==='wisdom'?'wisdom':'personal');return;}
 if(act.dataset.dkAction==='clear'){start(state.kind);return;}
 if(act.dataset.dkAction==='draft'){const f=$('dkForm');if(!f)return;const content=cleanHtml($('dkRich')?.innerHTML||'');const title=String(f.elements.title?.value||'Untitled').trim();const safe=title.replace(/[<>"']/g,'').slice(0,150);const doc='<!doctype html><html><head><meta charset="utf-8"><title>Offline diary draft</title></head><body><h1>'+esc(safe)+'</h1><p>Draft only — not yet saved in SarNi</p>'+content+'</body></html>';const url=URL.createObjectURL(new Blob([doc],{type:'text/html;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='sarni-draft-'+today()+'.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),2500);toast('Draft downloaded to this device. This does not save it to SarNi.');return;}
 if(act.dataset.dkAction==='refresh'){load();return;}
 if(act.dataset.dkAction==='selection'){captureSelection();if(editorSelection){$('dkExcerpt').value=editorSelection;$('dkMonthly').checked=true;toast('Selected passage added to Monthly Highlights. Save your entry.');}else toast('Select the passage in your writing first, then click this button.',true);return;}
 if(act.dataset.dkAction==='company'){companyAdd();return;}
 if(act.dataset.dkAction==='legacy'){setLegacy(true);$('diarySection').scrollIntoView({block:'start'});return;}
 if(act.dataset.dkAction==='book'){if(!window.SarniStockDiary?.open){toast('Stock Diary frontend is missing.',true);return;}window.SarniStockDiary.open('book');return;}
 if(act.dataset.dkAction==='print'){printVisibleResults();return;}
}
function onChange(e){if(e.target.id==='dkKind'){if(state.entry?.id&&!confirm('Switch category? The existing entry remains unchanged, and your text will start a new entry.')){e.target.value=state.kind;return;}const form=$('dkForm');draftMeta={html:cleanHtml($('dkRich')?.innerHTML||''),tags:form?.elements.tags?.value||'',monthlyHighlight:!!form?.elements.monthlyHighlight?.checked,highlightExcerpt:form?.elements.highlightExcerpt?.value||''};state.entry={title:form?.elements.title?.value||'',entryDate:form?.elements.entryDate?.value||today(),text:$('dkRich')?.innerText||'',content:cleanHtml($('dkRich')?.innerHTML||''),important:!!form?.elements.important?.checked};state.kind=e.target.value;draw();return;}if(e.target.id==='dkColor'||e.target.id==='dkHighlight'){const action=e.target.id==='dkColor'?'foreColor':'hiliteColor';$('dkRich')?.focus();if(editorRange){const sel=window.getSelection();sel.removeAllRanges();sel.addRange(editorRange);}document.execCommand(action,false,e.target.value);return;}if(updateListFilter(e))return;}
async function onSubmit(e){if(e.target.id!=='dkForm')return;e.preventDefault();if(state.busy)return;if(navigator.onLine===false){toast('You are offline. Download a draft now; saving requires connection to SarNi.',true);return;}const f=e.target,ed=$('dkRich'),html=cleanHtml(ed?.innerHTML||''),text=plain(html);if(!text){toast('Write something before saving.',true);return;}
 const data=Object.fromEntries(new FormData(f));let kind=state.kind;let entry={id:state.entry?.id||'',title:data.title||'',html,entryDate:data.entryDate||today(),tags:data.tags||'',important:!!f.elements.important?.checked,monthlyHighlight:!!f.elements.monthlyHighlight?.checked,highlightExcerpt:data.highlightExcerpt||'',entryType:data.entryType||'PERSONAL',visibility:data.visibility||'PRIVATE',companyId:data.companyId||'',decision:data.decision||'Research further',reviewDate:data.reviewDate||'',chapter:data.chapter||'',category:data.category||'',sourceNoteId:state.entry?.sourceNoteId||'',sourceCompanyId:state.entry?.sourceCompanyId||''};
 state.busy=true;f.querySelector('[type="submit"]').disabled=true;toast('Saving one original entry…');try{const r=await api('dkSave',{kind,record:entry});state.entry={...state.entry,id:r.record.id};state.dirty=false;window.dispatchEvent(new CustomEvent("sarni-entry-saved",{detail:{kind,id:r.record.id}}));toast('Saved successfully. Monthly Highlights will show this entry if selected.');await load();const saved=(kind==='personal'?state.data.diary:kind==='stock'?state.data.notes:state.data.wisdom).find(x=>x.id===r.record.id);state.kind=kind;state.entry=saved||state.entry;state.tab='write';draftMeta=null;draw();}catch(err){const msg=err.message||String(err);toast(msg,true);if(/Original record saved as/.test(msg)){toast(msg+' Do not press Save again. Refresh first.',true);}}finally{state.busy=false;f.querySelector('[type="submit"]').disabled=false;}}
function init(){if(!skeleton()){console.warn('SarNi unified diary: missing required SarNi frontend containers.');return;}state.month=monthNow();draw();window.SarniUnifiedDiary={openEntry:async(kind,id)=>{if(state.dirty&&!confirm('Discard unsaved changes in your entry?'))return;const nav=$('sarniSidebarPrimary')?.querySelector('[data-section="diary"]');nav?.click();if(state.loading){for(let i=0;i<50&&state.loading;i++)await new Promise(r=>setTimeout(r,80));}if(!state.loaded)await load();if(!state.loaded){toast('Could not load this entry. Try again.',true);return;}edit(kind,id);},open:(tab='write',kind='personal')=>{const old=$('sarniSidebarPrimary')?.querySelector('[data-section="diary"]');old?.click();state.tab=tab;state.kind=kind;setTimeout(()=>{setLegacy(false);draw();if(!state.loaded)load();},50);},version:'2.2'};}
window.addEventListener('beforeunload',e=>{if(state.dirty&&state.tab==='write'){e.preventDefault();e.returnValue='';}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
