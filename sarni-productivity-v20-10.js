/* SarNi Productivity 20.10.0. Frontend-only: command search, shortcuts,
   focus writing, current-build checks. No credentials or private records in storage. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const nav=[['Home','overview','⌂'],['Expenditure','expenditure','₹'],['Calendar · English & Odia','calendar','▦'],['Diary & Knowledge','diary','✎'],['Life Experiences','experiences','✧'],['Book Writing','books','▤']];
const search={open:false,entries:[],loading:false,ready:false,query:'',selected:0};
const lower=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const clean=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const visible=()=>{const el=$('appView');return el&&!el.classList.contains('hidden')&&el.getClientRects().length>0;};
function create(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function go(section){const btn=document.querySelector('#sarniSidebarPrimary [data-section="'+section+'"]');if(btn){btn.click();return true}return false;}
function close(){const shell=$('spSearchDialog');if(!shell)return;shell.hidden=true;search.open=false;$('spSearchButton')?.setAttribute('aria-expanded','false');const input=$('spQuery');if(input)input.value='';search.query='';search.entries=[];search.ready=false;}
function open(){if(!visible())return;const shell=$('spSearchDialog');if(!shell)return;shell.hidden=false;search.open=true;search.selected=0;$('spSearchButton')?.setAttribute('aria-expanded','true');draw();$('spQuery')?.focus();}
function stamp(e){return String(e.entryDate||e.createdAt||e.date||'').slice(0,10);}
function makeIndex(data){const r=[];
  for(const e of data.diary||[])r.push({type:'personal',id:String(e.id||''),title:e.title||'Diary',date:stamp(e),text:clean(e.text),tags:e.entryType||''});
  const companies=new Map((data.companies||[]).map(c=>[String(c.id),clean(c.name+' '+(c.symbol||''))]));
  for(const e of data.notes||[])r.push({type:'stock',id:String(e.id||''),title:e.title||'Stock research',date:stamp(e),text:clean(e.content),tags:[e.tags||'',companies.get(String(e.companyId))||'',e.decision||''].join(' ')});
  for(const e of data.wisdom||[])r.push({type:'wisdom',id:String(e.id||''),title:e.title||'Investment wisdom',date:stamp(e),text:clean(e.content),tags:[e.category||'',e.chapter||''].join(' ')});
  // Keep only current response in memory; no IndexedDB/localStorage/search analytics.
  return r.filter(e=>e.id).sort((a,b)=>b.date.localeCompare(a.date));
}
async function fetchIndex(){if(search.loading||search.ready||!visible())return;const bridge=window.SarniStockBridge;if(!bridge?.call||!bridge?.session?.()?.signedIn){setStatus('Sign in to search your personal records.');return;}
 search.loading=true;setStatus('Searching private SarNi records…');try{const r=await bridge.call('dkList',{});if(!search.open)return;if(!r?.ok)throw Error(r?.message||'Could not load diary search');search.entries=makeIndex(r);search.ready=true;setStatus('Searches personal Diary, Stock Research and Investment Wisdom. For expenses, use Expenditure search.');draw();}
 catch(e){setStatus((e?.message||'Search unavailable')+' · Use the module shortcuts below.');}
 finally{search.loading=false;}
}
function setStatus(s){const e=$('spSearchStatus');if(e)e.textContent=s;}
function filtered(){const q=lower(search.query.trim());if(!q)return [];
 const terms=q.match(/"[^"]+"|\S+/g)?.map(x=>x.replace(/^"|"$/g,''))||[];
 return search.entries.filter(e=>{const hay=lower([e.title,e.date,e.text,e.tags].join(' '));return terms.every(t=>hay.includes(t));}).slice(0,18);
}
function makeButton(text,info,icon,action){const b=create('button','sp-result');b.type='button';b.append(create('span','sp-result-icon',icon));const box=create('span','sp-result-text');box.append(create('strong','',text));if(info)box.append(create('small','',info));b.append(box);b.addEventListener('click',()=>{close();action();});return b;}
function draw(){if(!search.open)return;const target=$('spSearchResults');if(!target)return;target.replaceChildren();
 const q=search.query.trim();const top=create('div','sp-result-head',q?'Matching entries':'Navigate and create');target.append(top);
 if(q&&search.ready){const items=filtered();for(const e of items){const title=e.type==='stock'?'Stock':e.type==='wisdom'?'Wisdom':'Diary';target.append(makeButton(e.title,e.date+' · '+title,e.type==='stock'?'▥':e.type==='wisdom'?'✦':'✎',()=>{go('diary');if(window.SarniUnifiedDiary?.openEntry)window.SarniUnifiedDiary.openEntry(e.type,e.id);else window.SarniUnifiedDiary?.open(e.type==='personal'?'all':e.type); }));}
 if(!items.length)target.append(create('p','sp-empty','No matching diary, stock or wisdom entries. Try fewer words.'));}
 if(!q){const options=[...nav,['New diary entry','diary-new','＋'],['Quick Expense','expense-new','₹']];for(const [name,section,icon]of options){target.append(makeButton(name,'Open '+name,icon,()=>{if(section==='diary-new'){go('diary');window.SarniUnifiedDiary?.open('write','personal');}else if(section==='expense-new'){go('expenditure');const b=document.querySelector('[data-expense-add="ACTUAL"],#addActualExpenseBtn,#addExpenseBtn');if(b)b.click();else $('sarniExpenseFastBtn')?.click();}else go(section);}));}}
 if(q){const match=nav.filter(x=>lower(x[0]).includes(lower(q)));for(const [name,section,icon]of match)target.append(makeButton('Go to '+name,'Workspace',icon,()=>go(section)));}
 if(!q)target.append(create('p','sp-empty','Tip: Ctrl/⌘ + K opens this panel. Search results are available only after sign-in.'));
}
function installSearch(){if($('spSearchDialog'))return;const top=document.querySelector('.top-actions')||document.querySelector('.sarni-focus-tools');if(!top)return;
 const b=create('button','sp-top-button','⌕ Search');b.id='spSearchButton';b.type='button';b.setAttribute('aria-label','Search SarNi and open a workspace');b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');top.prepend(b);b.addEventListener('click',()=>search.open?close():open());
 const modal=create('div','sp-dialog');modal.id='spSearchDialog';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Search Diary and SarNi workspaces');
 const inner=create('div','sp-dialog-inner');const head=create('div','sp-dialog-head');const title=create('strong','','Search SarNi');const x=create('button','sp-close','×');x.type='button';x.setAttribute('aria-label','Close search');x.addEventListener('click',close);head.append(title,x);const input=create('input','sp-input');input.id='spQuery';input.type='search';input.autocomplete='off';input.placeholder='Search diary, stocks, wisdom or workspaces';input.setAttribute('aria-label','Search');
 const status=create('p','sp-status','Use search to find a record or open a workspace.');status.id='spSearchStatus';status.setAttribute('role','status');const results=create('div','sp-results');results.id='spSearchResults';results.setAttribute('role','group');results.setAttribute('aria-label','Search results');inner.append(head,input,status,results);modal.append(inner);document.body.append(modal);
 input.addEventListener('input',()=>{search.query=input.value;draw();if(input.value.trim()&&!search.ready)void fetchIndex();});modal.addEventListener('click',e=>{if(e.target===modal)close();});
 modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key==='Tab'){const a=[...modal.querySelectorAll('button,input')].filter(x=>x.getClientRects().length>0);if(!a.length)return;const i=a.indexOf(document.activeElement);if(e.shiftKey&&i===0){e.preventDefault();a[a.length-1].focus();}else if(!e.shiftKey&&i===a.length-1){e.preventDefault();a[0].focus();}}
 if(e.key==='Enter'&&e.target===input){const first=results.querySelector('.sp-result');if(first){e.preventDefault();first.click();}}});
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){if(!visible())return;e.preventDefault();search.open?close():open();}else if(e.key==='Escape'&&search.open)close();});
 // Session end: never leave private results displayed on a login page.
 const m=new MutationObserver(()=>{if(search.open&&!visible())close();});m.observe($('appView'),{attributes:true,attributeFilter:['class','style']});
}
function installBookFocus(){const modal=$('chapterModal');if(!modal||$('spBookFocus'))return;const container=modal.querySelector('.modal-head');if(!container)return;const btn=create('button','sp-focus-button','☷ Focus writing');btn.type='button';btn.id='spBookFocus';btn.setAttribute('aria-pressed','false');btn.title='Expand the chapter editor and hide nonessential fields';container.append(btn);
 btn.addEventListener('click',()=>{const active=modal.classList.toggle('sp-book-focus');btn.textContent=active?'↙ Normal view':'☷ Focus writing';btn.setAttribute('aria-pressed',String(active));$('chapterContent')?.focus();});
 // Return to normal when the chapter modal closes; do not change chapter data.
 const ob=new MutationObserver(()=>{if(modal.classList.contains('hidden')&&modal.classList.contains('sp-book-focus')){modal.classList.remove('sp-book-focus');btn.setAttribute('aria-pressed','false');btn.textContent='☷ Focus writing';}});ob.observe(modal,{attributes:true,attributeFilter:['class']});
}
function installDraftGuard(){document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='s'&&visible()){const diary=$('dkForm');if(diary&&diary.getClientRects().length&&document.activeElement?.closest?.('#dkForm')){e.preventDefault();diary.requestSubmit();}else if(!($('chapterModal')?.classList.contains('hidden'))){e.preventDefault();$('chapterForm')?.requestSubmit();}}});}
function installBuild(){const version='20.10.0';const label=$('loginVersion');if(label)label.title='Frontend build '+version+'; backend version is reported separately by Apps Script.';
 const b=$('dashboardVersion');if(b)b.title='Frontend build '+version+' (GitHub Pages)';
}
function init(){installSearch();installBookFocus();installDraftGuard();installBuild();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
