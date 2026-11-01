/* SarNi Family Expense frontend patches v1.0. No external dependencies. */
function requireAnchor(source,anchor,label){if(!source.includes(anchor))throw new Error(label+': expected code anchor not found; source version may have changed. No changes saved.');}
function onlyOnce(source,anchor,label){requireAnchor(source,anchor,label);if(source.split(anchor).length!==2)throw new Error(label+': unexpected duplicate anchor; safe stop.');}
function replaceBetween(source,begin,end,replacement,label){let i=source.indexOf(begin),j=source.indexOf(end,i+begin.length);if(i<0||j<0)throw new Error(label+': unable to safely locate block.');if(source.indexOf(begin,i+begin.length)>=0)throw new Error(label+': duplicate block.');return source.slice(0,i)+replacement+source.slice(j);}
function patchQ(s){
 if(s.includes('familyExpenseOpen') && s.includes('familyQuickFrame'))return s; // idempotent
 const begin=" if(mode==='family'){",end=" if(mode==='expense'){";
 const familyBlock=` if(mode==='family'){
 $('fields').innerHTML='<div class="family-expense-help"><strong>Family Expense · MyFamily</strong><p>Use MyFamily’s existing expense register, categories, payer and member fields without signing in again.</p><div id="familyQuickFrame" aria-live="polite">Checking Family Expense permission…</div><p id="familyQuickStatus" role="status"></p><button type="button" id="familyQuickReload">↻ Reload MyFamily expense form</button></div>';
 $('save').hidden=true;$('reset').hidden=true;status('');
 $('familyQuickReload').onclick=loadFamilyExpense;
 void loadFamilyExpense();return;
 }
 $('save').hidden=false;$('reset').hidden=false;
`;
 s=replaceBetween(s,begin,end,familyBlock,'q/ Family Expense form');
 const renderAnchor='function render(){';onlyOnce(s,renderAnchor,'q render');
 const load=`async function loadFamilyExpense(){
 const host=$('familyQuickFrame'),message=$('familyQuickStatus');if(!host||!message)return;
 message.textContent='Checking MyFamily link…';host.textContent='Opening your existing MyFamily form…';
 try{
  const r=await api('familyExpenseOpen');
  const u=new URL(r.url);
  if(u.origin!=='https://saradasutar.github.io'||u.pathname!=='/MyFamily/quick-expense.html'||!u.searchParams.get('t'))throw Error('Invalid MyFamily link returned by backend.');
  if(mode!=='family'||!document.getElementById('familyQuickFrame'))return;
  const f=document.createElement('iframe');f.src=u.href;f.title='Existing MyFamily Quick Expense entry';f.loading='eager';f.referrerPolicy='no-referrer';f.setAttribute('allow','clipboard-write');f.style.cssText='display:block;width:100%;height:850px;max-height:80vh;border:1px solid #e5bbca;border-radius:14px;background:#fff;';
  host.replaceChildren(f);message.textContent='Expenses are saved directly to MyFamily.';
 }catch(e){host.textContent='';message.textContent='Family Expense unavailable: '+e.message+'. Check SarNi backend, Script Properties and administrator link permission.';}
}
`;
 s=s.replace(renderAnchor,load+renderAnchor);
 // Distinct rose family tab, easily visible in six-tab layout.
 onlyOnce(s,'</style><script src="../config.js"></script>','q style');
 s=s.replace('</style><script src="../config.js"></script>',`/* Family Expense is a distinct sixth mode: rose, not purple like Diary. */
#tabs{grid-template-columns:repeat(3,minmax(0,1fr))!important}
#tabs button[data-mode="family"]{background:#fff0f2!important;color:#993e59!important;border-color:#edc0ca!important}
main[data-entry-mode="family"]{--mode-bg:#fff8f9;--mode-border:#efccd5;--mode-accent:#993e59}
#familyQuickReload{background:#fce9ed!important;color:#8c3752!important;border:1px solid #e9b8c6!important;padding:9px 12px!important;font-weight:760!important;min-height:40px!important;margin:10px 0}
#familyQuickStatus{font-size:13px;color:#854457;font-weight:650;line-height:1.5}
@media(max-width:420px){#tabs button{font-size:11.2px!important;padding:10px 2px!important}#familyQuickFrame iframe{height:76vh!important;max-height:900px!important}}
</style><script src="../config.js"></script>`);
 return s;
}
function patchHub(s){
 if(s.includes('hubFamilyFrame') && s.includes('familyExpenseOpen'))return s;
 const start='<section id="familyExpensePanel"',stop='<div id="diaryGrid"';
 const panel=`<section id="familyExpensePanel" class="panel hidden" style="margin:12px 0;border:1px solid #efccd5;background:#fff8f9"><h2>⌂ Family Expense · MyFamily</h2><p class="muted">Enter expenditure directly in the existing MyFamily register. MyFamily categories and payers are loaded automatically.</p><div id="hubFamilyFrame" role="region" aria-label="MyFamily expense entry">Select Family Expense to open the existing MyFamily form.</div><button type="button" id="hubOpenFamilyExpense" class="alt" style="margin:10px 0;background:#fce9ed;color:#913e5a;font-weight:750">↻ Reload Family Expense</button><p id="hubFamilyStatus" class="status" role="status"></p></section>\n`;
 s=replaceBetween(s,start,stop,panel,'Diary Centre Family panel');
 const handlerStart="$('hubOpenFamilyExpense').onclick=",handlerEnd="$('loginForm').onsubmit=";
 const handler=`async function hubLoadFamilyExpense(){
 const host=$('hubFamilyFrame');if(!host)return;host.textContent='Checking Family Expense access…';
 try{const r=await api('familyExpenseOpen');const u=new URL(r.url);
  if(u.origin!=='https://saradasutar.github.io'||u.pathname!=='/MyFamily/quick-expense.html'||!u.searchParams.get('t'))throw Error('Invalid MyFamily link.');
  if(kind!=='family')return;
  const f=document.createElement('iframe');f.title='MyFamily Quick Expense';f.src=u.href;f.referrerPolicy='no-referrer';f.style.cssText='width:100%;height:850px;max-height:80vh;background:white;border:1px solid #e7c5d0;border-radius:12px;';host.replaceChildren(f);say('hubFamilyStatus','Expense is saved directly to your existing MyFamily register.');
 }catch(e){host.textContent='';say('hubFamilyStatus','Family Expense unavailable: '+e.message,true);}}
$('hubOpenFamilyExpense').onclick=hubLoadFamilyExpense;
`;
 s=replaceBetween(s,handlerStart,handlerEnd,handler,'Diary Centre Family handler');
 const click="kind=k;selected=null;if(k!=='family')newEntry();drawTabs();if(k!=='family')load(true);";
 onlyOnce(s,click,'Diary Centre tabs');
 s=s.replace(click,"kind=k;selected=null;if(k!=='family')newEntry();drawTabs();if(k==='family')void hubLoadFamilyExpense();else load(true);");
 // When the user is initially routed directly to the family tab, load it after session reuse/login.
 const loginFlow="newEntry();drawTabs();await load(true);void hubAdminLoad();";
 if(s.includes(loginFlow))s=s.split(loginFlow).join("newEntry();drawTabs();if(kind==='family')void hubLoadFamilyExpense();else await load(true);void hubAdminLoad();");
 return s;
}
function patchAdmin(s){
 if(s.includes('data-family-expense-perm') && s.includes('familyExpenseSetAccess'))return s;
 const office='<span>Office Diary (HR shared register)</span></label>';
 onlyOnce(s,office,'Quick Link manager create form');
 s=s.replace(office,office+'<label class="qel-check"><input type="checkbox" name="allowFamilyExpense"><span>Family Expense (MyFamily)</span></label>');
 const refresh='const officeById=new Map(officeLinks.map(x=>[String(x.id),x]));';onlyOnce(s,refresh,'Quick Link manager refresh');
 s=s.replace(refresh,`let familyLinks=[];let familyAvailable=false;let familyConfigured=false;
 try{const p=await call('familyExpenseListAccess');familyLinks=p.links||[];familyAvailable=true;familyConfigured=!!p.configured;}catch(_){}
 const familyById=new Map(familyLinks.map(x=>[String(x.id),x]));
 `+refresh);
 const officeLine="const officePermission=document.createElement('label');";onlyOnce(s,officeLine,'Quick Link manager permissions');
 s=s.replace(officeLine,`const familyPermission=document.createElement('label');familyPermission.className='qel-check';familyPermission.innerHTML='<input type="checkbox" data-family-expense-perm><span>Family Expense (MyFamily)</span>';card.querySelector('.qel-checks').append(familyPermission);
 const famRecord=familyById.get(String(link.id)),famCheck=familyPermission.querySelector('input');famCheck.checked=!!(famRecord&&famRecord.allowFamilyExpense);famCheck.disabled=!familyAvailable||!familyConfigured;famCheck.title=famCheck.disabled?'Configure MyFamily link in SarNi backend to enable':'Allow this private link to open MyFamily Family Expense';
 `+officeLine);
 const invAccess="await call('hubSetLinkAccess',{id:link.id,type:'INVESTMENT',enabled:invEnabled});";
 onlyOnce(s,invAccess,'Quick Link manager save');
 const exitSave="}else if(act==='toggle')";onlyOnce(s,exitSave,'Quick Link manager save branch');
 s=s.replace(exitSave,`const familyEnabled=card.querySelector('[data-family-expense-perm]').checked;
 if(familyAvailable&&familyEnabled!==!!(famRecord&&famRecord.allowFamilyExpense)){
  if(familyEnabled&&!confirm('Anyone with this SarNi link will be able to use your MyFamily private Expense link. Enable only for trusted people?'))throw Error('Family Expense permission not enabled.');
  await call('familyExpenseSetAccess',{id:link.id,enabled:familyEnabled});
 }`+exitSave);
 const marker="if(!r.linkToken)throw Error('Link created but the backend did not return its private token.');";onlyOnce(s,marker,'Quick Link manager create');
 s=s.replace(marker,`if(form.elements.allowFamilyExpense.checked){try{await call('familyExpenseSetAccess',{id:r.link.id,enabled:true});}catch(err){officeWarning+=' Family Expense permission not enabled: '+err.message+'.';}}
 `+marker);
 return s;
}
function patchRootIndex(s){
 const old=/\.\/sarni-quick-links-admin-v1\.js\?v=[^"']+/;
 if(!old.test(s))throw new Error('Root index.html: Quick Link manager script reference not found.');
 if(s.includes('./sarni-quick-links-admin-v1.js?v=20261101-family1'))return s;
 return s.replace(old,'./sarni-quick-links-admin-v1.js?v=20261101-family1');
}
