/* SarNi Daily Quick Expense. Uses existing v3.17.34 submit-only API and category manager.
   Secret link is stored locally only for one-tap installed PWA; pending expense records are stored temporarily on this device for offline sync. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const apiUrl=String(window.PORTFOLIO_CONFIG?.API_URL||'').trim();
const savedTokenKey='sarni_qe_device_token_v1';
function extractToken(){
 const fromHash=(location.hash||'').replace(/^#(?:token=)?/,'').split('&')[0];
 let raw='';try{raw=decodeURIComponent(fromHash).trim()}catch{raw=''}
 if(/^[a-f\d]{96}$/i.test(raw))return raw;
 try{raw=localStorage.getItem(savedTokenKey)||''}catch{raw=''}
 return /^[a-f\d]{96}$/i.test(raw)?raw:'';
}
const token=extractToken();
const prefKey='sarni_qe_daily_preferences_v1';
let categories=[],entryId='',pending=false,active=false,history=[],settings={};
const today=()=>{let d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const uuid=()=>{const b=new Uint8Array(20);crypto.getRandomValues(b);return [...b].map(v=>v.toString(16).padStart(2,'0')).join('')};
const visibleError=text=>$('notice').textContent=text||'';
const norm=t=>String(t||'').trim();
function loadPreferences(){try{const value=JSON.parse(localStorage.getItem(prefKey)||'{}');return value&&typeof value==='object'?value:{}}catch{return {}}}
function storePreferences(){try{localStorage.setItem(prefKey,JSON.stringify({payer:norm($('paidBy').value).slice(0,100),enteredBy:norm($('enteredBy').value).slice(0,100),category:$('category').value,subcategory:$('subcategory').value,recent:settings.recent||[]}))}catch{}}
function callApi(action,payload){return new Promise((resolve,reject)=>{
 if(!/^https:\/\/script\.google\.com\/macros\/s\//.test(apiUrl)){reject(new Error('SarNi backend URL is not configured.'));return;}
 const requestId='mfreq_'+uuid()+'_'+uuid();
 const body={action,...payload,transport:'hybrid',requestId,clientOrigin:location.origin};
 const frame=document.createElement('iframe'),form=document.createElement('form'),field=document.createElement('input');
 frame.name=requestId+'_frame';frame.style.cssText='position:absolute;width:0;height:0;opacity:0;left:-9999px';frame.setAttribute('aria-hidden','true');
 form.method='POST';form.action=apiUrl;form.target=frame.name;form.style.display='none';field.type='hidden';field.name='payload';field.value=JSON.stringify(body);form.append(field);
 let done=false,timeout=null,pollTimer=null,pollBusy=false;
 const cleanup=()=>{clearTimeout(timeout);clearInterval(pollTimer);window.removeEventListener('message',onMessage);setTimeout(()=>{frame.remove();form.remove()},0)};
 const finish=(result,error)=>{if(done)return;done=true;cleanup();if(error){reject(error);return}if(!result?.ok){reject(new Error(result?.message||'Request failed'));return}resolve(result)};
 const onMessage=e=>{try{const host=new URL(e.origin).hostname.toLowerCase();if(!(host==='script.google.com'||host==='script.googleusercontent.com'||host.endsWith('.googleusercontent.com')))return}catch{return}
 const m=e.data;if(m?.__myfinanceDirectResult===true&&m.requestId===requestId)finish(m.payload)};
 window.addEventListener('message',onMessage);
 document.body.append(frame,form);
 timeout=setTimeout(()=>finish(null,new Error('Request timed out. Check the expense register before submitting again.')),45000);
 setTimeout(()=>{if(done)return;pollTimer=setInterval(()=>{
  if(done||pollBusy)return;pollBusy=true;const cb='sarniQeCallback_'+uuid().slice(0,16),script=document.createElement('script');let cancelled=false;
  const stop=()=>{if(cancelled)return;cancelled=true;pollBusy=false;script.remove();try{delete window[cb]}catch{}};
  window[cb]=r=>{stop();if(r?.ready&&r.requestId===requestId)finish(r.payload)};
  script.onerror=stop;script.src=apiUrl+'?action=pollResult&requestId='+encodeURIComponent(requestId)+'&callback='+cb;
  document.head.append(script);setTimeout(()=>{if(!cancelled)stop()},2600);
 },2200)},2300);
 try{form.submit()}catch(err){finish(null,err)};
})}
function fillCategories(){
 $('category').replaceChildren(new Option('Choose category',''));
 categories.forEach(c=>$('category').add(new Option(c.name,c.name)));
 const chosen=categories.find(c=>c.name===settings.category);if(chosen)$('category').value=chosen.name;
 fillSubcategories();renderFavorites();
}
function fillSubcategories(preferred){
 const cat=categories.find(c=>c.name===$('category').value),sel=$('subcategory');
 sel.replaceChildren(new Option('None',''));
 for(const c of (cat?.subcategories||[]))sel.add(new Option(c,c));
 const val=preferred===undefined?settings.subcategory:preferred;
 if([...sel.options].some(o=>o.value===val))sel.value=val;
}
function renderFavorites(){
 const wrap=$('favorites');wrap.replaceChildren();
 const names=(settings.recent||[]).filter(n=>categories.some(c=>c.name===n)).slice(0,4);
 if(!names.length)return;
 for(const name of names){const chip=document.createElement('button');chip.type='button';chip.className='pill'+($('category').value===name?' selected':'');chip.textContent=name;chip.onclick=()=>{$('category').value=name;fillSubcategories('');renderFavorites()};wrap.append(chip)}
}
function chooseCategory(){settings.category=$('category').value;settings.subcategory='';fillSubcategories('');renderFavorites()}
function renderRecent(){
 const wrap=$('recent'),list=$('recentList');list.replaceChildren();wrap.hidden=!history.length;
 for(const x of history){const row=document.createElement('p');row.textContent='₹'+x.amount.toLocaleString('en-IN',{maximumFractionDigits:2})+' · '+x.category+(x.subcategory?' / '+x.subcategory:'')+' · '+x.reason+' · Paid by '+x.paidBy;list.append(row)}
}
/* Local-first offline queue. Queue IDs are retained across uncertain network outcomes,
 * and the backend rejects duplicates by link ID + entry ID.
 * Pending records are private to this browser profile and may be lost if site data is cleared.
 */
const dbName='sarni_qe_pending_20261029_v1';
let syncing=false, syncedThisVisit=0, nextSync=0;
function openPendingDB(){return new Promise((resolve,reject)=>{
 if(!('indexedDB' in window)){reject(new Error('This browser cannot store offline expenses.'));return;}
 const req=indexedDB.open(dbName,1);
 req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('entries'))db.createObjectStore('entries',{keyPath:'entryId'})};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Offline storage error'));
});}
async function queueTransaction(mode,entry){const db=await openPendingDB();return new Promise((resolve,reject)=>{
 const tx=db.transaction('entries',mode==='get'?'readonly':'readwrite'),store=tx.objectStore('entries');
 const req=mode==='get'?store.getAll():mode==='delete'?store.delete(entry):store.put(entry);
 let result;req.onsuccess=()=>{result=req.result;};
 tx.oncomplete=()=>{db.close();resolve(result);};
 tx.onabort=()=>{db.close();reject(tx.error||new Error('Offline transaction was cancelled'));};
 tx.onerror=()=>reject(tx.error||new Error('Could not access offline entries'));
});}
function isFinalApiError(error){const m=String(error?.message||'');return /(?:invalid|disabled|expired|revoked|not found|valid (?:category|subcategory)|not active|amount must|Choose a valid expense date)/i.test(m)}
async function renderQueue(){let items=[];try{items=await queueTransaction('get');}catch(e){$('syncStatus').textContent='Offline storage unavailable: '+e.message;return;}
 const pending=items.filter(x=>x.status!=='failed').length,failed=items.length-pending;
 $('syncStatus').textContent=(navigator.onLine?'Online':'Offline')+' · '+pending+' pending · '+failed+' need attention · '+syncedThisVisit+' synced this visit';
 $('retryPending').hidden=!items.length;
 $('syncHelp').textContent=failed?'Some entries could not be sent. Check the administrator link and tap Retry pending entries.':'Pending expenses remain on this device and will sync when the app is online and open. Avoid clearing browser/app data.';
}
async function syncQueue(force){if(syncing||!navigator.onLine||(!force&&Date.now()<nextSync))return;
 syncing=true;nextSync=Date.now()+20000;
 try{const items=await queueTransaction('get');
  for(const item of items.sort((a,b)=>a.createdAt-b.createdAt)){
   if(item.status==='failed'&&!force)continue;
   try{
    const result=await callApi('qeSubmit',{linkToken:item.linkToken,entryId:item.entryId,expense:item.expense});
    await queueTransaction('delete',item.entryId);syncedThisVisit++;
    history.unshift(item.expense);history=history.slice(0,5);renderRecent();
    $('success').textContent=result.duplicate?'✓ Confirmed already saved (no duplicate).':'✓ Pending expense synced to SarNi Expense Register.';
   }catch(error){
    item.tries=(item.tries||0)+1;item.lastError=String(error.message||'Send failed').slice(0,180);
    item.status=isFinalApiError(error)?'failed':'pending';
    await queueTransaction('put',item);
    if(item.status==='pending')break; // Connection or server uncertainty: retry later with SAME entryId.
   }
  }
 }catch(error){visibleError('Pending sync paused: '+(error.message||'Offline storage not available'))}
 finally{syncing=false;await renderQueue()}
}
async function holdForSync(data){
 const item={entryId:entryId||uuid(),linkToken:token,expense:data,createdAt:Date.now(),tries:0,status:'pending'};
 await queueTransaction('put',item);
 entryId=uuid();
 return item;
}
function showAfterLocalSave(data){
 settings.category=data.category;settings.subcategory=data.subcategory;
 settings.recent=[data.category,...(settings.recent||[]).filter(n=>n!==data.category)].slice(0,4);
 storePreferences();
 $('amount').value='';$('reason').value='';$('notes').value='';$('paidTo').value='';$('dateSpent').value=today();
 fillCategories();$('amount').focus({preventScroll:true});
}
async function initializePendingSync(){
 await renderQueue();
 if(navigator.onLine)syncQueue(true);
}
window.addEventListener('online',()=>{renderQueue();syncQueue(true)},{passive:true});
window.addEventListener('offline',renderQueue,{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&navigator.onLine)syncQueue(true)});
setInterval(()=>{if(!document.hidden&&navigator.onLine)syncQueue(false)},60000);
$('retryPending').addEventListener('click',async()=>{if(!navigator.onLine){visibleError('Offline: saved entries will sync when you reconnect.');return}await syncQueue(true)});

async function initialize(){
 $('dateSpent').value=today();settings=loadPreferences();
 if(!/^[a-f\d]{96}$/i.test(token)){visibleError('No saved expense link on this device. Paste your private link below to activate this shortcut.');$('linkRecovery').hidden=false;return}
 try{
  let r=null;
  if(navigator.onLine){try{r=await callApi('qeInfo',{linkToken:token});localStorage.setItem('sarni_qe_cached_link_meta_v1',JSON.stringify({tokenTag:token.slice(-16),savedAt:Date.now(),data:r}));}catch(err){
    // When connectivity is uncertain, permit local QUEUING only with previously loaded categories.
    if(isFinalApiError(err))throw err;
  }}
  if(!r){try{const old=JSON.parse(localStorage.getItem('sarni_qe_cached_link_meta_v1')||'null');if(old?.tokenTag===token.slice(-16))r=old.data;}catch{}}
  if(!r)throw new Error('Open this link once while online to load your expense categories. Offline entry will then be available.');
  categories=Array.isArray(r.categories)?r.categories.filter(c=>c&&typeof c.name==='string'&&c.name):[];
  $('linkLabel').textContent=(r.label?String(r.label)+' · ':'')+'No login · Any daily expense';
  $('validity').textContent=r.neverExpires?'Link remains valid until administrator disables it.':'Link expires '+new Date(r.expiresAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})+'. Administrator may disable it earlier.';
  $('payerOptions').replaceChildren();for(const p of (r.payers||[]))$('payerOptions').append(new Option(p));
  fillCategories();$('paidBy').value=settings.payer||'';$('enteredBy').value=settings.enteredBy||'';
  $('category').addEventListener('change',chooseCategory);$('subcategory').addEventListener('change',()=>{settings.subcategory=$('subcategory').value});
  if(!categories.length){visibleError('No active expense categories found. The administrator must add categories in SarNi → Expense Category Manager.');return}
  active=true;$('entryArea').hidden=false;entryId=uuid();visibleError('');
  // Save the link secret locally for the separate home-screen app. No expenditure history
  // is persisted. Revocation and expiry are always validated by Apps Script on every save.
  try{localStorage.setItem(savedTokenKey,token)}catch{}
  $('installPanel').hidden=false;
  $('linkRecovery').hidden=true;
  await initializePendingSync();
 }catch(err){visibleError(err.message||'Could not open the expense link.');$('linkRecovery').hidden=false;await renderQueue();}}
async function save(e){
 e.preventDefault();if(!active||pending)return;if(!$('qeForm').reportValidity())return;
 const data={amount:Number($('amount').value),category:$('category').value,subcategory:$('subcategory').value,paidBy:norm($('paidBy').value),reason:norm($('reason').value),
  dateSpent:$('dateSpent').value,enteredBy:norm($('enteredBy').value),paidTo:norm($('paidTo').value),notes:norm($('notes').value)};
 if(!data.category||!categories.some(c=>c.name===data.category)){visibleError('Please choose an existing category.');return;}
 const allowed=categories.find(c=>c.name===data.category)?.subcategories||[];
 if(data.subcategory&&!allowed.includes(data.subcategory)){visibleError('Choose a valid subcategory for the selected category.');return;}
 if(!data.paidBy){visibleError('Enter who paid the amount.');return;}
 pending=true;$('save').disabled=true;$('save').textContent='Saving locally…';visibleError('');$('success').textContent='';
 try{
  await holdForSync(data); // Durable local save BEFORE any unreliable network submission.
  showAfterLocalSave(data);
  $('success').textContent=navigator.onLine?'✓ Saved on this device; syncing with SarNi…':'✓ Saved offline on this device. Will sync when online.';
  await renderQueue();
  if(navigator.onLine)void syncQueue(true);
 }catch(err){visibleError('Expense NOT saved: '+(err.message||'Could not access offline storage')+'. Please keep this form open and retry.');}
 finally{pending=false;$('save').disabled=false;$('save').textContent='✓ Save & Add Another';}
}

function restoreSavedLink(event){
 event.preventDefault();let supplied=String($('restoreLinkInput').value||'').trim();
 try{if(supplied.includes('/')){const u=new URL(supplied);if(u.origin!==location.origin||!u.pathname.endsWith('/quick-expense.html'))throw new Error('Only this SarNi expense link can be used.');supplied=decodeURIComponent(u.hash.replace(/^#(?:token=)?/,'').split('&')[0]);}}catch(err){visibleError(err.message||'Paste the private Quick Expense link.');return}
 if(!/^[a-f\d]{96}$/i.test(supplied)){visibleError('The pasted link is incomplete or invalid.');return}
 try{localStorage.setItem(savedTokenKey,supplied)}catch{}
 location.hash='token='+supplied;location.reload();
}
$('restoreLinkForm').addEventListener('submit',restoreSavedLink);
$('forgetLink').addEventListener('click',()=>{if(!confirm('Forget this device’s saved Quick Expense link? You can re-open the private shared link later.'))return;
  try{localStorage.removeItem(savedTokenKey)}catch{}
  location.replace(location.pathname+location.search);
});
window.SarNiQeBridge={callApi,token};
$('qeForm').addEventListener('submit',save);initialize();
})();
