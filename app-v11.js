'use strict';

const APP_BUILD = '9.0.0';
const CACHE_VERSION = 'v9';
const CONFIG = window.PORTFOLIO_CONFIG || {};
const state = {
  token: localStorage.getItem('portfolio_token') || '',
  username: localStorage.getItem('portfolio_username') || '',
  user: null,
  holdings: [],
  watchlist: [],
  users: [],
  owners: [],
  selectedOwner: 'ALL',
  selectedAssetView: 'ALL',
  activeSection: 'overview',
  syncing: false,
  importMode: 'MF_STATEMENT',
  pendingImport: [],
  autoPriceRetryDone: false,
  lastLiveSyncAt: 0
};

const $ = (id) => document.getElementById(id);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const els = {};
[
  'loginView','appView','loginForm','loginUsername','loginPassword','loginButton','loginMessage','sideAppName','todayLabel','pageTitle','syncStatus','refreshBtn','addInvestmentBtn','addInvestmentTableBtn','bulkImportBtn','logoutBtn','profileButton','avatarInitial','welcomeTitle','lastUpdatedText','viewChip','ownerSwitcher','assetViewSwitcher','typeSummaryGrid','holdingsHeading','sumInvestedLabel','sumCurrentLabel','importBtn','exportBtn','sumInvested','sumCurrent','sumGain','sumReturn','sumAssetCount','sumPricedCount','sumSplit','sumWatchCount','allocationChart','investorSummary','topHoldings','holdingSearch','holdingTypeFilter','holdingsBody','holdingsEmpty','viewAllNotesBtn','watchAllNotesBtn','notesModal','notesSearch','notesSource','notesScope','notesFilter','notesSummary','notesList','notesEmpty','watchSearch','watchBody','watchEmpty','usersBody','modalBackdrop','investmentModal','investmentForm','holdingId','holdingOwner','holdingType','holdingName','holdingCode','holdingExchange','holdingUnits','holdingInvested','holdingManualPrice','holdingBuyDate','holdingNotes','holdingCodeLabel','exchangeLabel','mfHelp','bulkImportModal','bulkImportForm','bulkCsvFile','bulkImportStatus','runBulkImportBtn','downloadImportTemplateBtn','mfImportHelp','stockImportHelp','stockOwnerLabel','importOwner','importFileHint','watchModal','watchForm','watchId','watchType','watchName','watchCode','watchExchange','watchTarget','watchManualPrice','watchPriority','watchNotes','watchCodeLabel','watchExchangeLabel','watchMfHelp','passwordModal','passwordForm','currentPassword','newPassword','confirmPassword','userModal','userForm','newUsername','newDisplayName','newUserRole','newUserPassword','holdingDrawerBackdrop','holdingDrawer','drawerAssetBadge','drawerTitle','drawerSubtitle','drawerContent','drawerCloseBtn','drawerEditBtn','drawerDoneBtn','toastRegion'
].forEach((id) => { els[id] = $(id); });

function isConfigured() {
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(String(CONFIG.API_URL || '').trim());
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function formatCurrency(value, compact = false) {
  if (value === null || value === '' || value === undefined) return '—';
  const n = Number(value); if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-IN',{style:'currency',currency:CONFIG.CURRENCY||'INR',maximumFractionDigits:compact?0:2,notation:compact&&Math.abs(n)>=100000?'compact':'standard'}).format(n);
}
function formatNumber(value, digits = 4) { const n=Number(value); return value===null||value===''||value===undefined||!Number.isFinite(n)?'—':new Intl.NumberFormat('en-IN',{maximumFractionDigits:digits}).format(n); }
function formatPercent(value) { const n=Number(value); return value===null||value===''||value===undefined||!Number.isFinite(n)?'—':`${n>=0?'+':''}${n.toFixed(2)}%`; }
function pnlClass(value) { const n=Number(value); return n>0?'positive':n<0?'negative':'neutral'; }
function dateLabel(value) { const d=value?new Date(value):null; return !d||Number.isNaN(d.getTime())?'Not available':new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(d); }
function setBusy(button,busy,text){ if(!button)return; if(busy){button.dataset.originalText=button.textContent;button.disabled=true;button.textContent=text||'Please wait…';}else{button.disabled=false;button.textContent=button.dataset.originalText||button.textContent;} }
function setSyncStatus(mode,message){ if(!els.syncStatus)return; els.syncStatus.className=`sync-status ${mode||''}`.trim(); const label=els.syncStatus.querySelector('span:last-child'); if(label)label.textContent=message; }
function toast(message,type=''){ const node=document.createElement('div');node.className=`toast ${type}`.trim();node.textContent=message;els.toastRegion.appendChild(node);setTimeout(()=>node.remove(),4500); }

async function api(action,payload={},options={}){
  if(!isConfigured()) throw new Error('Backend is not configured. Check config.js.');
  const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),CONFIG.REQUEST_TIMEOUT_MS||30000);
  const body={action,...payload}; if(state.token&&!body.token) body.token=state.token;
  try{
    const response=await fetch(CONFIG.API_URL,{method:'POST',body:JSON.stringify(body),redirect:'follow',signal:controller.signal,cache:'no-store',credentials:'omit'});
    const text=await response.text(); let data; try{data=JSON.parse(text);}catch{throw new Error('The backend returned an unreadable response. Redeploy the Apps Script web app and check access permissions.');}
    if(!data.ok){const e=new Error(data.message||'Request failed.');e.code=data.code||'REQUEST_FAILED';throw e;} return data;
  }catch(error){ if(error.name==='AbortError')throw new Error('The request timed out. Please try again.'); if(options.retry&&!options._retried){await new Promise(r=>setTimeout(r,700));return api(action,payload,{...options,_retried:true});} throw error; }
  finally{clearTimeout(timeout);}
}

function cacheKey(){return `portfolio_cache_${CACHE_VERSION}_${state.username||'unknown'}`;}
function purgeLegacyCaches(){
  try{
    const keep=cacheKey();
    Object.keys(localStorage).forEach(k=>{
      if(k.startsWith('portfolio_cache_')&&k!==keep)localStorage.removeItem(k);
    });
  }catch{}
}
function saveCache(data){try{localStorage.setItem(cacheKey(),JSON.stringify({savedAt:Date.now(),build:APP_BUILD,data}));}catch{} }
function loadCache(){
  try{
    const p=JSON.parse(localStorage.getItem(cacheKey())||'null');
    if(!p?.data)return;
    const age=Date.now()-(Number(p.savedAt)||0);
    // Avoid showing old zero-price data on mobile after app upgrades.
    if(age>30*60*1000)return;
    applyBootstrap(p.data,true);
  }catch{}
}
function clearSession(){state.token='';state.username='';state.user=null;localStorage.removeItem('portfolio_token');localStorage.removeItem('portfolio_username');}

function titleCase(value){return String(value||'').trim().toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());}
function canonicalOwner(value){
  const raw=String(value||'').trim(); if(!raw)return 'Portfolio';
  const low=raw.toLowerCase(); const configured=Array.isArray(CONFIG.OWNERS)?CONFIG.OWNERS:[];
  for(const owner of configured){const first=String(owner).trim().toLowerCase().split(/\s+/)[0]; if(first&&low.includes(first))return String(owner).trim();}
  return titleCase(raw);
}
function configuredOwners(){
  const defaults=Array.isArray(CONFIG.OWNERS)?CONFIG.OWNERS.map(canonicalOwner):[];
  return [...new Set([...defaults,...state.owners.map(canonicalOwner),...state.holdings.map(h=>canonicalOwner(h.owner))].filter(Boolean))];
}
function shortOwner(owner){ const c=canonicalOwner(owner); const configured=Array.isArray(CONFIG.OWNERS)?CONFIG.OWNERS:[]; const match=configured.find(x=>c.toLowerCase().includes(String(x).toLowerCase().split(/\s+/)[0])); return match||c.split(/\s+/)[0]||c; }

async function login(event){
  event.preventDefault(); els.loginMessage.textContent='';
  if(!isConfigured()){els.loginMessage.textContent='Setup required: paste the Apps Script /exec URL into config.js.';return;}
  setBusy(els.loginButton,true,'Signing in…');
  try{const result=await api('login',{username:els.loginUsername.value.trim(),password:els.loginPassword.value});state.token=result.token;state.username=result.user.username;state.autoPriceRetryDone=false;localStorage.setItem('portfolio_token',state.token);localStorage.setItem('portfolio_username',state.username);purgeLegacyCaches();showApp();applyBootstrap(result.data);saveCache(result.data);toast('Signed in successfully.','success');}
  catch(error){els.loginMessage.textContent=error.message;}
  finally{setBusy(els.loginButton,false);}
}
async function logout(){try{if(state.token)await api('logout');}catch{}clearSession();els.appView.classList.add('hidden');els.loginView.classList.remove('hidden');els.loginPassword.value='';}
function showApp(){els.loginView.classList.add('hidden');els.appView.classList.remove('hidden');els.sideAppName.textContent=CONFIG.APP_NAME||'My Finance';els.todayLabel.textContent=new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toUpperCase();}
async function loadDashboard(force=false){
  if(state.syncing)return;
  state.syncing=true;
  setSyncStatus('syncing',force?'Updating prices & performance…':'Syncing…');
  try{
    let result=await api(force?'refreshPrices':'bootstrap',{}, {retry:!force});
    applyBootstrap(result.data);
    saveCache(result.data);

    // Some mobile browsers can briefly restore an older local snapshot.
    // If a server bootstrap still has missing prices, make one live price refresh.
    if(!force && hasMissingLivePrices() && !state.autoPriceRetryDone){
      state.autoPriceRetryDone=true;
      setSyncStatus('syncing','Refreshing live prices…');
      try{
        const refreshed=await api('refreshPrices',{}, {retry:false});
        if(refreshed?.data){
          result=refreshed;
          applyBootstrap(refreshed.data);
          saveCache(refreshed.data);
        }
      }catch(refreshError){
        console.warn('Automatic price refresh failed:',refreshError);
      }
    }

    setSyncStatus('','Up to date');
    if(force)toast('Prices, NAVs and performance refreshed.','success');
  }
  catch(error){
    if(error.code==='AUTH_REQUIRED'||error.code==='SESSION_EXPIRED'){toast('Your session expired. Please sign in again.','error');logout();return;}
    setSyncStatus('error','Sync failed');toast(error.message,'error');
  }
  finally{state.syncing=false;}
}

function finiteNumber(value){
  if(value===null||value===undefined||value==='')return null;
  if(typeof value==='number')return Number.isFinite(value)?value:null;
  const cleaned=String(value).replace(/[₹,\s]/g,'').replace(/%$/,'').trim();
  if(!cleaned)return null;
  const n=Number(cleaned);
  return Number.isFinite(n)?n:null;
}
function normalizeHoldingPrice(h){
  const out={...h};
  const units=finiteNumber(out.units);
  const invested=finiteNumber(out.investedAmount);
  const manual=finiteNumber(out.manualPrice);
  let price=finiteNumber(out.currentPrice);
  let value=finiteNumber(out.currentValue);

  // Mobile-safe recovery: derive whichever price field is missing/zero from
  // the other live field. This does not invent market prices.
  if((price===null||price<=0) && value!==null && value>0 && units!==null && units>0){
    price=value/units;
  }
  if((price===null||price<=0) && manual!==null && manual>0){
    price=manual;
  }
  if((value===null||value<=0) && price!==null && price>0 && units!==null && units>0){
    value=price*units;
  }

  out.currentPrice=(price!==null&&price>0)?price:null;
  out.currentValue=(value!==null&&value>0)?value:null;

  if(out.currentValue!==null && invested!==null){
    out.gainLoss=out.currentValue-invested;
    out.returnPct=invested>0?((out.currentValue-invested)/invested*100):finiteNumber(out.returnPct);
  }
  return out;
}
function normalizeWatchPrice(w){
  const out={...w};
  const manual=finiteNumber(out.manualPrice);
  let price=finiteNumber(out.currentPrice);
  if((price===null||price<=0)&&manual!==null&&manual>0)price=manual;
  out.currentPrice=(price!==null&&price>0)?price:null;
  return out;
}
function hasMissingLivePrices(){
  return state.holdings.some(h=>
    ['MF','STOCK','ETF'].includes(String(h.type||'').toUpperCase()) &&
    (finiteNumber(h.units)||0)>0 &&
    !(finiteNumber(h.currentPrice)>0)
  );
}
function applyBootstrap(data,fromCache=false){
  if(!data)return; state.user=data.user||state.user;state.holdings=(Array.isArray(data.holdings)?data.holdings:[]).map(normalizeHoldingPrice);state.watchlist=(Array.isArray(data.watchlist)?data.watchlist:[]).map(normalizeWatchPrice);state.owners=Array.isArray(data.owners)?data.owners:[];if(Array.isArray(data.users))state.users=data.users;if(!fromCache)state.lastLiveSyncAt=Date.now();
  refreshOwnerControls();renderAll();
  if(state.user){els.avatarInitial.textContent=(state.user.displayName||state.user.username||'I').charAt(0).toUpperCase();$$('.admin-only').forEach(el=>el.classList.toggle('hidden',state.user.role!=='ADMIN'));}
  els.lastUpdatedText.textContent=`${fromCache?'Showing saved data':'Updated'} ${dateLabel(data.updatedAt)}${data.priceNote?` · ${data.priceNote}`:''}`;
}

function refreshOwnerControls(){
  const owners=configuredOwners();
  if(state.selectedOwner!=='ALL'&&!owners.some(o=>o===state.selectedOwner))state.selectedOwner='ALL';
  els.ownerSwitcher.innerHTML=[{value:'ALL',label:'Combined'},...owners.map(o=>({value:o,label:shortOwner(o)}))].map(x=>`<button type="button" class="owner-pill ${state.selectedOwner===x.value?'active':''}" data-owner-view="${escapeHtml(x.value)}">${escapeHtml(x.label)}</button>`).join('');
  const opts=owners.length?owners:['Sarada','Niharika'];
  [els.holdingOwner,els.importOwner].forEach(select=>{if(!select)return;const old=select.value;select.innerHTML=opts.map(o=>`<option value="${escapeHtml(o)}">${escapeHtml(shortOwner(o))}</option>`).join('');if(opts.includes(old))select.value=old;});
}
function ownerHoldings(){
  return state.holdings.filter(h=>state.selectedOwner==='ALL'||canonicalOwner(h.owner)===state.selectedOwner);
}
function assetViewMatches(h){
  if(state.selectedAssetView==='ALL')return true;
  if(state.selectedAssetView==='MF')return h.type==='MF';
  if(state.selectedAssetView==='STOCKS')return h.type==='STOCK'||h.type==='ETF';
  return true;
}
function visibleHoldings(){return ownerHoldings().filter(assetViewMatches);}
function assetViewLabel(){
  return state.selectedAssetView==='MF'?'Mutual Funds':state.selectedAssetView==='STOCKS'?'Stocks & ETFs':'All Investments';
}
function visibleWatchlist(){return state.watchlist;}
function summarizeHoldings(items){
  let invested=0,current=0,pricedInvested=0,priced=0;const allocation={};
  items.forEach(h=>{invested+=Number(h.investedAmount)||0;const basis=h.currentValue==null?(Number(h.investedAmount)||0):Number(h.currentValue)||0;allocation[h.type]=(allocation[h.type]||0)+basis;if(h.currentValue!=null){current+=Number(h.currentValue)||0;pricedInvested+=Number(h.investedAmount)||0;priced++;}});
  const gain=current-pricedInvested;return{invested,current,gain,returnPct:pricedInvested>0?gain/pricedInvested*100:0,priced,allocation};
}
function refreshAssetViewControls(){
  if(!['ALL','MF','STOCKS'].includes(state.selectedAssetView))state.selectedAssetView='ALL';
  if(els.assetViewSwitcher){
    $$('[data-asset-view]').forEach(b=>b.classList.toggle('active',b.dataset.assetView===state.selectedAssetView));
  }
  if(els.holdingsHeading){
    els.holdingsHeading.textContent=state.selectedAssetView==='MF'?'Mutual fund holdings':state.selectedAssetView==='STOCKS'?'Stock & ETF holdings':'Mutual funds, stocks and ETFs';
  }
}
function renderAll(){refreshAssetViewControls();renderSummary();renderTypeSummary();renderAllocation();renderInvestorSummary();renderTopHoldings();renderHoldings();renderWatchlist();if(state.user?.role==='ADMIN')renderUsers();}
function renderSummary(){
  const items=visibleHoldings(),s=summarizeHoldings(items);
  els.sumInvested.textContent=formatCurrency(s.invested,true);
  els.sumCurrent.textContent=formatCurrency(s.current,true);
  els.sumGain.textContent=formatCurrency(s.gain,true);
  els.sumGain.className=pnlClass(s.gain);
  els.sumReturn.textContent=formatPercent(s.returnPct);
  els.sumReturn.className=pnlClass(s.returnPct);
  els.sumAssetCount.textContent=`${items.length} holding${items.length===1?'':'s'}`;
  els.sumPricedCount.textContent=`${s.priced} priced`;
  const viewLabel=assetViewLabel();
  els.sumSplit.textContent=viewLabel;
  els.sumWatchCount.textContent=`${state.watchlist.length} watchlist`;
  const ownerLabel=state.selectedOwner==='ALL'?'Combined':shortOwner(state.selectedOwner);
  els.welcomeTitle.textContent=state.selectedAssetView==='ALL'?`${ownerLabel} portfolio`:`${ownerLabel} · ${viewLabel}`;
  els.viewChip.textContent=state.selectedAssetView==='ALL'?ownerLabel:`${ownerLabel} · ${viewLabel}`;
  if(els.sumInvestedLabel)els.sumInvestedLabel.textContent=state.selectedAssetView==='ALL'?'Invested / cost value':`${viewLabel} invested`;
  if(els.sumCurrentLabel)els.sumCurrentLabel.textContent=state.selectedAssetView==='ALL'?'Current value':`${viewLabel} current value`;
}
function renderTypeSummary(){
  if(!els.typeSummaryGrid)return;
  const base=ownerHoldings();
  const defs=[
    {key:'ALL',label:'All investments',items:base,icon:'▦'},
    {key:'MF',label:'Mutual funds',items:base.filter(h=>h.type==='MF'),icon:'MF'},
    {key:'STOCKS',label:'Stocks & ETFs',items:base.filter(h=>h.type==='STOCK'||h.type==='ETF'),icon:'ST'}
  ];
  els.typeSummaryGrid.innerHTML=defs.map(d=>{
    const s=summarizeHoldings(d.items);
    const active=state.selectedAssetView===d.key?'active':'';
    return `<button type="button" class="type-summary-card ${active}" data-asset-view="${d.key}">
      <div class="type-summary-head"><span class="type-summary-icon">${d.icon}</span><div><strong>${d.label}</strong><span>${d.items.length} holding${d.items.length===1?'':'s'}</span></div></div>
      <div class="type-summary-values">
        <div><span>Invested</span><b>${formatCurrency(s.invested,true)}</b></div>
        <div><span>Current</span><b>${formatCurrency(s.current,true)}</b></div>
        <div><span>Gain / loss</span><b class="${pnlClass(s.gain)}">${formatCurrency(s.gain,true)}</b></div>
        <div><span>Return</span><b class="${pnlClass(s.returnPct)}">${formatPercent(s.returnPct)}</b></div>
      </div>
    </button>`;
  }).join('');
}
function renderAllocation(){
  const s=summarizeHoldings(visibleHoldings()),entries=Object.entries(s.allocation).sort((a,b)=>b[1]-a[1]);const total=entries.reduce((a,[,v])=>a+v,0);
  if(!entries.length){els.allocationChart.innerHTML='<div class="empty-state">Allocation appears after holdings are imported.</div>';return;}
  els.allocationChart.innerHTML=entries.map(([type,value])=>{const pct=total?value/total*100:0;return `<div class="allocation-row"><div class="allocation-name"><span class="allocation-dot ${type.toLowerCase()}"></span>${escapeHtml(type)}</div><div class="allocation-track"><div class="allocation-fill" style="width:${Math.min(100,Math.max(0,pct))}%"></div></div><div class="allocation-value">${pct.toFixed(1)}%</div></div>`;}).join('');
}
function renderInvestorSummary(){
  const owners=configuredOwners();
  if(!owners.length){els.investorSummary.innerHTML='<div class="empty-state">Investor summary appears after import.</div>';return;}
  els.investorSummary.innerHTML=owners.map(owner=>{
    const ownerItems=state.holdings.filter(h=>canonicalOwner(h.owner)===owner).filter(assetViewMatches);
    const s=summarizeHoldings(ownerItems);
    return `<button class="investor-card" data-owner-view="${escapeHtml(owner)}"><div><strong>${escapeHtml(shortOwner(owner))}</strong><span>${ownerItems.length} ${assetViewLabel().toLowerCase()}</span></div><div class="investor-metrics"><b>${formatCurrency(s.current,true)}</b><span class="${pnlClass(s.gain)}">${formatPercent(s.returnPct)}</span></div></button>`;
  }).join('');
}
function renderTopHoldings(){const items=[...visibleHoldings()].sort((a,b)=>(Number(b.currentValue)||Number(b.investedAmount)||0)-(Number(a.currentValue)||Number(a.investedAmount)||0)).slice(0,8);if(!items.length){els.topHoldings.className='mini-holdings empty-state';els.topHoldings.textContent='Import your MF statement or stocks to begin.';return;}els.topHoldings.className='mini-holdings';els.topHoldings.innerHTML=items.map(h=>`<div class="mini-holding" data-view-holding="${escapeHtml(h.id)}" role="button" tabindex="0" aria-label="View details for ${escapeHtml(h.assetName)}"><div><strong>${escapeHtml(h.assetName)}</strong><span>${escapeHtml(shortOwner(h.owner))} · ${escapeHtml(h.type)} · ${escapeHtml(h.exchange?`${h.exchange}:`:'')}${escapeHtml(h.code)}</span></div><div class="mini-value">${formatCurrency(h.currentValue??h.investedAmount,true)}<span class="${pnlClass(h.returnPct)}">${h.currentPrice==null?'Price pending':formatPercent(h.returnPct)}</span></div></div>`).join('');}

function holdingMatches(h){
  const q=els.holdingSearch.value.trim().toLowerCase(),type=els.holdingTypeFilter.value;
  const ownerOk=state.selectedOwner==='ALL'||canonicalOwner(h.owner)===state.selectedOwner;
  const assetOk=assetViewMatches(h);
  const text=`${h.owner} ${h.assetName} ${h.code} ${h.sourceCode||''} ${h.notes||''}`.toLowerCase();
  return ownerOk&&assetOk&&(!q||text.includes(q))&&(type==='ALL'||h.type===type);
}
function notePreview(value, max=82){
  const clean=String(value||'').replace(/\s+/g,' ').trim();
  if(!clean)return '<span class="note-empty">Add note</span>';
  const short=clean.length>max?`${clean.slice(0,max-1)}…`:clean;
  return `<span class="note-preview">${escapeHtml(short)}</span>`;
}
function perfCell(v){return `<td class="perf ${pnlClass(v)}">${formatPercent(v)}</td>`;}
function renderHoldings(){
  const items=state.holdings.filter(holdingMatches);els.holdingsBody.innerHTML=items.map(h=>{const avg=(Number(h.units)>0?Number(h.investedAmount)/Number(h.units):null),p=h.performance||{};return `<tr class="holding-row" data-view-holding="${escapeHtml(h.id)}" tabindex="0" aria-label="View details for ${escapeHtml(h.assetName)}"><td class="sticky-col owner-col"><span class="owner-tag">${escapeHtml(shortOwner(h.owner))}</span></td><td class="sticky-col asset-col"><div class="asset-cell"><div class="asset-badge ${String(h.type).toLowerCase()}">${escapeHtml(h.type==='MF'?'MF':h.type==='ETF'?'ET':'ST')}</div><div><strong>${escapeHtml(h.assetName)}</strong><span>${escapeHtml(h.exchange?`${h.exchange}:`:'')}${escapeHtml(h.code)}${h.sourceCode?` · stmt ${escapeHtml(h.sourceCode)}`:''}</span></div></div></td><td>${formatNumber(h.units)}</td><td>${formatCurrency(avg)}</td><td>${formatCurrency(h.investedAmount)}</td><td>${formatCurrency(h.currentPrice)}<span class="price-note">${escapeHtml(h.priceSource||'Pending')}</span></td><td><strong>${formatCurrency(h.currentValue)}</strong></td><td class="${pnlClass(h.gainLoss)}">${formatCurrency(h.gainLoss)}</td><td class="${pnlClass(h.returnPct)}"><strong>${formatPercent(h.returnPct)}</strong></td><td class="${pnlClass(h.xirr)}">${formatPercent(h.xirr)}</td>${perfCell(p.d1)}${perfCell(p.w1)}${perfCell(p.m1)}${perfCell(p.m6)}${perfCell(p.y1)}${perfCell(p.y3)}${perfCell(p.y5)}${perfCell(p.y10)}<td class="personal-note-cell" data-note-cell="${escapeHtml(h.id)}">${notePreview(h.notes)}</td><td class="row-actions"><button class="small-button" data-edit-holding="${escapeHtml(h.id)}">Edit</button><button class="small-button danger" data-delete-holding="${escapeHtml(h.id)}">Delete</button></td></tr>`;}).join('');
  els.holdingsEmpty.classList.toggle('hidden',items.length>0);
}
function renderWatchlist(){
  const q=els.watchSearch.value.trim().toLowerCase();
  const items=visibleWatchlist().filter(x=>!q||`${x.assetName} ${x.code} ${x.notes||''}`.toLowerCase().includes(q));
  els.watchBody.innerHTML=items.map(x=>`<tr>
    <td><div class="asset-cell"><div class="asset-badge ${String(x.type).toLowerCase()}">${escapeHtml(x.type.slice(0,2))}</div><div><strong>${escapeHtml(x.assetName)}</strong><span>${escapeHtml(x.exchange?`${x.exchange}:`:'')}${escapeHtml(x.code)}</span></div></div></td>
    <td>${formatCurrency(x.currentPrice)}</td>
    <td>${formatCurrency(x.targetPrice)}</td>
    <td class="${Number(x.distancePct)<=0?'positive':'neutral'}">${formatPercent(x.distancePct)}</td>
    <td><span class="priority ${String(x.priority).toLowerCase()}">${escapeHtml(x.priority)}</span></td>
    <td class="personal-note-cell" data-watch-note-cell="${escapeHtml(x.id)}">${notePreview(x.notes)}</td>
    <td class="row-actions"><button class="small-button" data-edit-watch="${escapeHtml(x.id)}">Edit</button><button class="small-button danger" data-delete-watch="${escapeHtml(x.id)}">Delete</button></td>
  </tr>`).join('');
  els.watchEmpty.classList.toggle('hidden',items.length>0);
}
function drawerMetric(label,value,valueClass=''){
  return `<div class="drawer-metric"><span>${escapeHtml(label)}</span><strong class="${valueClass}">${value}</strong></div>`;
}
function openHoldingDrawer(item){
  if(!item)return;
  state.drawerHoldingId=item.id;
  const p=item.performance||{};
  const avg=Number(item.units)>0?Number(item.investedAmount)/Number(item.units):null;
  const isMf=item.type==='MF';
  const priceLabel=isMf?'Current NAV':'Current price';
  const avgLabel=isMf?'Average cost / unit':'Avg buy price';
  const badge=isMf?'MF':item.type==='ETF'?'ETF':item.type==='STOCK'?'ST':'₹';
  els.drawerAssetBadge.textContent=badge;
  els.drawerTitle.textContent=item.assetName||'Investment';
  els.drawerSubtitle.textContent=[shortOwner(item.owner),item.type,item.exchange?`${item.exchange}:${item.code}`:item.code].filter(Boolean).join(' · ');
  const perf=[['1D',p.d1],['1W',p.w1],['1M',p.m1],['6M',p.m6],['1Y',p.y1],['3Y',p.y3],['5Y',p.y5],['10Y',p.y10]];
  els.drawerContent.innerHTML=`
    <section class="drawer-value-card">
      <span class="drawer-value-label">Current value</span>
      <strong class="drawer-current-value">${formatCurrency(item.currentValue??item.investedAmount,true)}</strong>
      <div class="drawer-gain-line">
        <span>${item.gainLoss==null?'Gain/loss pending':`${formatCurrency(item.gainLoss,true)} gain / loss`}</span>
        <span class="drawer-gain-chip ${pnlClass(item.returnPct)}">${formatPercent(item.returnPct)}</span>
      </div>
    </section>
    <section class="drawer-section">
      <h3 class="drawer-section-title">Holding summary</h3>
      <div class="drawer-metric-grid">
        ${drawerMetric('Invested / cost value',formatCurrency(item.investedAmount,true))}
        ${drawerMetric('Units / quantity',formatNumber(item.units,6))}
        ${drawerMetric(avgLabel,formatCurrency(avg))}
        ${drawerMetric(priceLabel,formatCurrency(item.currentPrice))}
        ${drawerMetric('Gain / loss',formatCurrency(item.gainLoss,true),pnlClass(item.gainLoss))}
        ${drawerMetric('Total return',formatPercent(item.returnPct),pnlClass(item.returnPct))}
        ${isMf?drawerMetric('XIRR',formatPercent(item.xirr),pnlClass(item.xirr)):''}
        ${drawerMetric('Price source',escapeHtml(item.priceSource||'Pending'))}
      </div>
    </section>
    <section class="drawer-section">
      <h3 class="drawer-section-title">Performance</h3>
      <div class="drawer-performance">${perf.map(([label,value])=>`<div class="drawer-perf-item"><span>${label}</span><strong class="${pnlClass(value)}">${formatPercent(value)}</strong></div>`).join('')}</div>
    </section>
    <section class="drawer-section">
      <h3 class="drawer-section-title">Investment information</h3>
      <div class="drawer-info-list">
        <div class="drawer-info-row"><span>Investor</span><strong>${escapeHtml(shortOwner(item.owner))}</strong></div>
        <div class="drawer-info-row"><span>Asset type</span><strong>${escapeHtml(item.type||'—')}</strong></div>
        <div class="drawer-info-row"><span>${isMf?'AMFI code':'Symbol'}</span><strong>${escapeHtml(item.code||'—')}</strong></div>
        ${item.sourceCode?`<div class="drawer-info-row"><span>Statement code</span><strong>${escapeHtml(item.sourceCode)}</strong></div>`:''}
        ${item.exchange?`<div class="drawer-info-row"><span>Exchange</span><strong>${escapeHtml(item.exchange)}</strong></div>`:''}
        <div class="drawer-info-row"><span>Price date</span><strong>${detailDate(item.priceDate)}</strong></div>
        ${item.buyDate?`<div class="drawer-info-row"><span>Purchase date</span><strong>${detailDate(item.buyDate)}</strong></div>`:''}
      </div>
    </section>
    <section class="drawer-section"><h3 class="drawer-section-title">Personal Note</h3><div class="drawer-notes ${item.notes?'':'drawer-notes-empty'}">${item.notes?escapeHtml(item.notes):'No personal note added yet. Use Edit investment to add one.'}</div></section>
  `;
  els.holdingDrawer.classList.add('open');
  els.holdingDrawerBackdrop.classList.add('open');
  els.holdingDrawer.setAttribute('aria-hidden','false');
  els.holdingDrawerBackdrop.setAttribute('aria-hidden','false');
  document.body.classList.add('drawer-open');
  setTimeout(()=>els.drawerCloseBtn?.focus(),50);
}
function closeHoldingDrawer(){
  els.holdingDrawer?.classList.remove('open');
  els.holdingDrawerBackdrop?.classList.remove('open');
  els.holdingDrawer?.setAttribute('aria-hidden','true');
  els.holdingDrawerBackdrop?.setAttribute('aria-hidden','true');
  document.body.classList.remove('drawer-open');
  state.drawerHoldingId='';
}
function editDrawerHolding(){
  const item=state.holdings.find(x=>x.id===state.drawerHoldingId);
  closeHoldingDrawer();
  if(item)openInvestment(item);
}


function notesHoldingItems(){
  return els.notesScope?.value==='CURRENT' ? visibleHoldings() : state.holdings;
}
function notesWatchItems(){
  return state.watchlist;
}
function noteRecordHolding(h){
  return {
    source:'HOLDINGS', id:h.id, owner:h.owner||'', type:h.type||'', assetName:h.assetName||'',
    code:h.code||'', exchange:h.exchange||'', notes:h.notes||'', currentValue:Number(h.currentValue)||0,
    currentPrice:Number(h.currentPrice)||0, targetPrice:null, priority:''
  };
}
function noteRecordWatch(w){
  return {
    source:'WATCHLIST', id:w.id, owner:'', type:w.type||'', assetName:w.assetName||'',
    code:w.code||'', exchange:w.exchange||'', notes:w.notes||'', currentValue:null,
    currentPrice:Number(w.currentPrice)||0, targetPrice:Number(w.targetPrice)||0, priority:w.priority||''
  };
}
function notesBaseItems(){
  const source=els.notesSource?.value||'BOTH';
  const items=[];
  if(source==='BOTH'||source==='HOLDINGS')items.push(...notesHoldingItems().map(noteRecordHolding));
  if(source==='BOTH'||source==='WATCHLIST')items.push(...notesWatchItems().map(noteRecordWatch));
  return items;
}
function renderNotesModal(){
  if(!els.notesList)return;
  const q=String(els.notesSearch?.value||'').trim().toLowerCase();
  const filter=els.notesFilter?.value||'ALL';
  let items=notesBaseItems().filter(x=>{
    const has=Boolean(String(x.notes||'').trim());
    if(filter==='WITH_NOTES'&&!has)return false;
    if(filter==='WITHOUT_NOTES'&&has)return false;
    const hay=`${x.source} ${x.owner} ${x.type} ${x.assetName} ${x.code} ${x.priority} ${x.notes||''}`.toLowerCase();
    return !q||hay.includes(q);
  });
  items=[...items].sort((a,b)=>{
    const an=Boolean(String(a.notes||'').trim()),bn=Boolean(String(b.notes||'').trim());
    if(an!==bn)return an?-1:1;
    if(a.source!==b.source)return a.source.localeCompare(b.source);
    return String(a.assetName||'').localeCompare(String(b.assetName||''));
  });

  const withNotes=items.filter(x=>String(x.notes||'').trim()).length;
  const holdingCount=items.filter(x=>x.source==='HOLDINGS').length;
  const watchCount=items.filter(x=>x.source==='WATCHLIST').length;
  if(els.notesSummary){
    let scope='Entire portfolio';
    if(els.notesScope?.value==='CURRENT'){
      scope=`${state.selectedOwner==='ALL'?'Combined':shortOwner(state.selectedOwner)} · ${assetViewLabel()}`;
    }
    els.notesSummary.textContent=`${scope} · ${items.length} item${items.length===1?'':'s'} · ${holdingCount} investments · ${watchCount} watchlist · ${withNotes} with notes`;
  }

  els.notesList.innerHTML=items.map(x=>{
    const note=String(x.notes||'').trim();
    const isWatch=x.source==='WATCHLIST';
    const sourceLabel=isWatch?'Watchlist':'Investment';
    const meta=isWatch
      ? `${escapeHtml(x.type)} · ${escapeHtml(x.exchange?`${x.exchange}:`:'')}${escapeHtml(x.code)} · ${escapeHtml(x.priority||'')} priority`
      : `${escapeHtml(shortOwner(x.owner))} · ${escapeHtml(x.type)} · ${escapeHtml(x.exchange?`${x.exchange}:`:'')}${escapeHtml(x.code)}`;
    const valueLabel=isWatch
      ? `Target ${formatCurrency(x.targetPrice)}`
      : formatCurrency(x.currentValue,true);
    const actionAttr=isWatch?`data-watch-note-edit="${escapeHtml(x.id)}"`:`data-note-edit="${escapeHtml(x.id)}"`;
    const viewButton=isWatch
      ? `<button type="button" class="small-button" data-watch-note-edit="${escapeHtml(x.id)}">Open watch item</button>`
      : `<button type="button" class="small-button" data-note-view="${escapeHtml(x.id)}">View investment</button>`;
    return `<article class="investment-note-card ${note?'has-note':'no-note'} ${isWatch?'watch-note-card':''}">
      <div class="note-card-top">
        <div class="asset-cell">
          <div class="asset-badge ${String(x.type).toLowerCase()}">${escapeHtml(x.type==='MF'?'MF':x.type==='ETF'?'ET':x.type==='STOCK'?'ST':'OT')}</div>
          <div><strong>${escapeHtml(x.assetName)}</strong><span><b class="note-source-badge ${isWatch?'watch':'holding'}">${sourceLabel}</b> · ${meta}</span></div>
        </div>
        <strong class="note-card-value">${valueLabel}</strong>
      </div>
      <div class="note-card-body ${note?'':'empty'}">${note?escapeHtml(note):'No personal note added yet.'}</div>
      <div class="note-card-actions">
        ${viewButton}
        <button type="button" class="small-button" ${actionAttr}>${note?'Edit note':'Add note'}</button>
      </div>
    </article>`;
  }).join('');
  els.notesEmpty.classList.toggle('hidden',items.length>0);
}
function openAllNotes(source='HOLDINGS'){
  if(els.notesSearch)els.notesSearch.value='';
  if(els.notesSource)els.notesSource.value=source;
  if(els.notesScope)els.notesScope.value='ALL';
  if(els.notesFilter)els.notesFilter.value='ALL';
  if(els.notesModalTitle){
    els.notesModalTitle.textContent=source==='WATCHLIST'?'All watchlist notes':source==='HOLDINGS'?'All investment notes':'All personal notes';
  }
  renderNotesModal();
  openModal('notesModal');
}

function switchSection(section){state.activeSection=section;const titles={overview:'Portfolio overview',holdings:'Holdings & performance',watchlist:'Watchlist',users:'User administration'};els.pageTitle.textContent=titles[section]||'My Finance';['overview','holdings','watchlist','users'].forEach(name=>$(`${name}Section`)?.classList.toggle('hidden',name!==section));$$('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===section));if(section==='users'&&state.user?.role==='ADMIN')loadUsers();}
function openModal(id){els.modalBackdrop.classList.remove('hidden');els.modalBackdrop.setAttribute('aria-hidden','false');$$('.modal').forEach(m=>m.classList.add('hidden'));$(id).classList.remove('hidden');}
function closeModals(){els.modalBackdrop.classList.add('hidden');els.modalBackdrop.setAttribute('aria-hidden','true');$$('.modal').forEach(m=>m.classList.add('hidden'));}
function updateAssetForm(type,prefix){const isMf=type==='MF',isOther=type==='OTHER';const codeLabel=$(prefix==='holding'?'holdingCodeLabel':'watchCodeLabel'),exchangeLabel=$(prefix==='holding'?'exchangeLabel':'watchExchangeLabel'),help=$(prefix==='holding'?'mfHelp':'watchMfHelp');if(codeLabel)codeLabel.textContent=isMf?'AMFI scheme code':isOther?'Code / label':'Ticker symbol';exchangeLabel?.classList.toggle('hidden',isMf||isOther);help?.classList.toggle('hidden',!isMf);}
function openInvestment(item=null){refreshOwnerControls();els.investmentForm.reset();els.holdingId.value=item?.id||'';$('investmentModalTitle').textContent=item?'Edit investment':'Add investment';if(item){els.holdingOwner.value=canonicalOwner(item.owner);els.holdingType.value=item.type;els.holdingName.value=item.assetName;els.holdingCode.value=item.code;els.holdingExchange.value=item.exchange||'NSE';els.holdingUnits.value=item.units;els.holdingInvested.value=item.investedAmount;els.holdingManualPrice.value=item.manualPrice??'';els.holdingBuyDate.value=item.buyDate||'';els.holdingNotes.value=item.notes||'';}else{els.holdingOwner.value=state.selectedOwner!=='ALL'?state.selectedOwner:(configuredOwners()[0]||'Sarada');els.holdingType.value='STOCK';}updateAssetForm(els.holdingType.value,'holding');openModal('investmentModal');}
function openWatch(item=null){els.watchForm.reset();els.watchId.value=item?.id||'';if(item){els.watchType.value=item.type;els.watchName.value=item.assetName;els.watchCode.value=item.code;els.watchExchange.value=item.exchange||'NSE';els.watchTarget.value=item.targetPrice??'';els.watchManualPrice.value=item.manualPrice??'';els.watchPriority.value=item.priority||'MEDIUM';els.watchNotes.value=item.notes||'';}updateAssetForm(els.watchType.value,'watch');openModal('watchModal');}

async function saveInvestment(event){event.preventDefault();const button=$('saveInvestmentBtn');setBusy(button,true,'Saving…');try{const result=await api('saveHolding',{holding:{id:els.holdingId.value,owner:els.holdingOwner.value,type:els.holdingType.value,assetName:els.holdingName.value.trim(),code:els.holdingCode.value.trim().toUpperCase(),exchange:['MF','OTHER'].includes(els.holdingType.value)?'':els.holdingExchange.value,units:Number(els.holdingUnits.value),investedAmount:Number(els.holdingInvested.value),manualPrice:els.holdingManualPrice.value===''?null:Number(els.holdingManualPrice.value),buyDate:els.holdingBuyDate.value,notes:els.holdingNotes.value.trim()}});closeModals();applyBootstrap(result.data);saveCache(result.data);toast('Investment saved.','success');}catch(e){toast(e.message,'error');}finally{setBusy(button,false);}}
async function saveWatch(event){event.preventDefault();const button=$('saveWatchBtn');setBusy(button,true,'Saving…');try{const result=await api('saveWatchItem',{item:{id:els.watchId.value,type:els.watchType.value,assetName:els.watchName.value.trim(),code:els.watchCode.value.trim().toUpperCase(),exchange:['MF','OTHER'].includes(els.watchType.value)?'':els.watchExchange.value,targetPrice:els.watchTarget.value===''?null:Number(els.watchTarget.value),manualPrice:els.watchManualPrice.value===''?null:Number(els.watchManualPrice.value),priority:els.watchPriority.value,notes:els.watchNotes.value.trim()}});closeModals();applyBootstrap(result.data);saveCache(result.data);toast('Watchlist item saved.','success');}catch(e){toast(e.message,'error');}finally{setBusy(button,false);}}
async function deleteItem(action,id,label){if(!confirm(`Delete this ${label}?`))return;try{const result=await api(action,{id});applyBootstrap(result.data);saveCache(result.data);toast(`${label} deleted.`,'success');}catch(e){toast(e.message,'error');}}

function csvCell(value){return `"${String(value??'').replace(/"/g,'""')}"`;}
function parseCsv(text){
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'){if(quoted&&n==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(field);if(row.some(v=>String(v).trim()!==''))rows.push(row);row=[];field='';}else field+=c;}
  row.push(field);if(row.some(v=>String(v).trim()!==''))rows.push(row);return rows;
}

async function loadSheetJs(){
  if(window.XLSX)return window.XLSX;
  await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';script.onload=resolve;script.onerror=()=>reject(new Error('Could not load the Excel reader. Save the file as CSV and try again.'));document.head.appendChild(script);});
  if(!window.XLSX)throw new Error('Excel reader did not load. Save the file as CSV and try again.');
  return window.XLSX;
}
async function fileToRows(file){
  const name=String(file?.name||'').toLowerCase();
  if(name.endsWith('.xlsx')||name.endsWith('.xls')){
    const XLSX=await loadSheetJs();const workbook=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});const sheet=workbook.Sheets[workbook.SheetNames[0]];return XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false});
  }
  return parseCsv(await file.text());
}
function trimToDetectedHeader(rows,mode){
  const max=Math.min(rows.length,30);
  for(let i=0;i<max;i++){
    const h=(rows[i]||[]).map(normalizeHeader);
    if(mode==='MF_STATEMENT'){
      if(h.includes('investorname')&&h.includes('productcode')&&h.includes('schemename')&&h.includes('tradedate'))return rows.slice(i);
    }else{
      const hasSymbol=['stocksymbol','symbol','tradingsymbol','instrument','scrip'].some(x=>h.includes(x));
      const hasQty=['quantity','qty'].some(x=>h.includes(x));
      if(hasSymbol&&hasQty)return rows.slice(i);
    }
  }
  return rows;
}

function normalizeHeader(v){return String(v||'').replace(/^\ufeff/,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function parseNum(v){const s=String(v??'').replace(/[₹,%\s]/g,'').replace(/,/g,'').trim();if(!s)return null;const n=Number(s);return Number.isFinite(n)?n:NaN;}
function normalizeDate(v){
  const raw=String(v||'').trim();if(!raw)return '';
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;
  let m=raw.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  m=raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);if(m){const months={jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};const mm=months[m[2].toLowerCase()];if(mm)return `${m[3]}-${mm}-${String(m[1]).padStart(2,'0')}`;}
  return null;
}
function detectIndex(headers,aliases){for(const a of aliases){const i=headers.indexOf(normalizeHeader(a));if(i>=0)return i;}return -1;}
function cell(cells,i){return i>=0?String(cells[i]??'').trim():'';}
function isFinancialMfTransaction(type,amount,units){const t=String(type||'').toLowerCase();if(/address|nominee|contact|mandate|registered|registration|updation|correction|cancelled|invalid|kyc|bank/.test(t))return false;return (Number.isFinite(amount)&&Math.abs(amount)>0.000001)||(Number.isFinite(units)&&Math.abs(units)>0.000001);}
function rowsToMfTransactions(rows){
  if(rows.length<2)throw new Error('The CSV has no transaction rows.');const h=rows[0].map(normalizeHeader);
  const idx={amc:detectIndex(h,['MF_NAME','AMC','Fund House']),owner:detectIndex(h,['INVESTOR_NAME','Investor Name','Owner']),product:detectIndex(h,['PRODUCT_CODE','Product Code']),scheme:detectIndex(h,['SCHEME_NAME','Scheme Name']),date:detectIndex(h,['TRADE_DATE','Trade Date','Date']),tx:detectIndex(h,['TRANSACTION_TYPE','Transaction Type']),amount:detectIndex(h,['AMOUNT','Amount']),units:detectIndex(h,['UNITS','Units']),price:detectIndex(h,['PRICE','NAV','Price']),broker:detectIndex(h,['BROKER','Broker'])};
  const required=['owner','product','scheme','date','tx'];const missing=required.filter(k=>idx[k]<0);if(missing.length)throw new Error(`MF statement columns not recognised: ${missing.join(', ')}.`);
  const out=[],errors=[];rows.slice(1).forEach((r,n)=>{const owner=canonicalOwner(cell(r,idx.owner)),productCode=cell(r,idx.product).toUpperCase(),schemeName=cell(r,idx.scheme),tradeDate=normalizeDate(cell(r,idx.date)),transactionType=cell(r,idx.tx),amount=parseNum(cell(r,idx.amount)),units=parseNum(cell(r,idx.units)),price=parseNum(cell(r,idx.price));if(!isFinancialMfTransaction(transactionType,amount,units))return;if(!owner||!productCode||!schemeName||!tradeDate||!transactionType){errors.push(`Row ${n+2}: missing investor/product/scheme/date/type.`);return;}if([amount,units,price].some(v=>Number.isNaN(v))){errors.push(`Row ${n+2}: invalid amount/units/price.`);return;}out.push({owner,amc:cell(r,idx.amc),productCode,schemeName,tradeDate,transactionType,amount:amount??0,units,price,broker:cell(r,idx.broker)});});
  if(errors.length)throw new Error(errors.slice(0,6).join(' ')+(errors.length>6?` Plus ${errors.length-6} more.`:''));if(!out.length)throw new Error('No purchase/SIP/redemption rows were found.');if(out.length>5000)throw new Error('More than 5,000 MF transactions detected. Split the file.');return out;
}
function classifyAsset(symbol,explicit=''){const e=String(explicit||'').toUpperCase().replace(/[^A-Z]/g,'');if(e.includes('ETF'))return'ETF';if(e.includes('STOCK')||e.includes('EQUITY'))return'STOCK';const s=String(symbol||'').toUpperCase();return /(BEES$|ETF$|MAFANG|MON100|HNGSNGBEES|ITBEES|CPSEETF|MOM100)/.test(s)?'ETF':'STOCK';}
function rowsToStockHoldings(rows){
  if(rows.length<2)throw new Error('The CSV has no stock rows.');const h=rows[0].map(normalizeHeader);
  const idx={owner:detectIndex(h,['INVESTOR_NAME','Investor Name','Owner']),type:detectIndex(h,['Asset Type','Type','Instrument Type']),symbol:detectIndex(h,['Stock Symbol','Symbol','Tradingsymbol','Trading Symbol','Instrument','Scrip']),exchange:detectIndex(h,['Exchange']),qty:detectIndex(h,['Quantity','Qty','Qty.','QTY']),avg:detectIndex(h,['Avg Buy Price','Average Buy Price','Avg. cost','Avg Cost','Average price','Buy Average']),invested:detectIndex(h,['Invested Amount','Invested Value','Cost Value','Investment Value']),name:detectIndex(h,['Company Name','Asset Name','Name'])};
  if(idx.symbol<0||idx.qty<0||(idx.avg<0&&idx.invested<0))throw new Error('Stock file needs Symbol/Instrument, Quantity and Avg Buy Price or Invested Amount.');
  const out=[],errors=[];const selected=canonicalOwner(els.importOwner.value||configuredOwners()[0]||'Niharika');rows.slice(1).forEach((r,n)=>{const symbol=cell(r,idx.symbol).toUpperCase().replace(/\s+/g,'');if(!symbol)return;const qty=parseNum(cell(r,idx.qty)),avg=parseNum(cell(r,idx.avg)),invRaw=parseNum(cell(r,idx.invested));const invested=Number.isFinite(invRaw)?invRaw:(Number.isFinite(qty)&&Number.isFinite(avg)?qty*avg:null);if(!Number.isFinite(qty)||qty<=0||!Number.isFinite(invested)||invested<0){errors.push(`Row ${n+2}: invalid quantity/invested amount.`);return;}const owner=idx.owner>=0&&cell(r,idx.owner)?canonicalOwner(cell(r,idx.owner)):selected;const exchange=(cell(r,idx.exchange)||'NSE').toUpperCase()==='BSE'?'BOM':(cell(r,idx.exchange)||'NSE').toUpperCase();const type=classifyAsset(symbol,cell(r,idx.type));out.push({owner,type,assetName:cell(r,idx.name)||symbol,code:symbol,exchange,units:qty,investedAmount:invested,manualPrice:null,buyDate:'',notes:'Imported stock holding'});});if(errors.length)throw new Error(errors.slice(0,6).join(' '));if(!out.length)throw new Error('No stock holdings found.');return out;
}
function setImportMode(mode){state.importMode=mode;$$('.import-mode').forEach(b=>b.classList.toggle('active',b.dataset.importMode===mode));els.mfImportHelp.classList.toggle('hidden',mode!=='MF_STATEMENT');els.stockImportHelp.classList.toggle('hidden',mode!=='STOCK_HOLDINGS');els.stockOwnerLabel.classList.toggle('hidden',mode!=='STOCK_HOLDINGS');els.importFileHint.textContent=mode==='MF_STATEMENT'?'Up to 5,000 MF transaction rows. PAN and folio are ignored. CSV/XLSX supported.':'Current stock/ETF holdings. Zerodha XLSX/CSV supported.';els.bulkCsvFile.value='';state.pendingImport=[];els.bulkImportStatus.textContent='No file selected.';els.bulkImportStatus.className='import-status muted';els.runBulkImportBtn.disabled=true;}
function openBulkImport(){refreshOwnerControls();setImportMode('MF_STATEMENT');openModal('bulkImportModal');}
function downloadImportTemplate(){let headers,examples,name;if(state.importMode==='MF_STATEMENT'){headers=['MF_NAME','INVESTOR_NAME','PRODUCT_CODE','SCHEME_NAME','Type','TRADE_DATE','TRANSACTION_TYPE','DIVIDEND_RATE','AMOUNT','UNITS','PRICE','BROKER'];examples=[['PPFAS Mutual Fund','Sarada','PP001ZG','Parag Parikh Flexi Cap - Dir Plan Growth','Equity','2026-07-05','Purchase Systematic','','12999.35','140.000','92.8525','Direct'],['SBI Mutual Fund','Niharika','LD246G','SBI Gold Fund- Dir Plan Growth','Gold FOF','2026-08-05','Purchase- Systematic','','4999.75','113.211','44.163','Direct']];name='mf-statement-import-template.csv';}else{headers=['Investor Name','Asset Type','Stock Symbol','Exchange','Quantity','Avg Buy Price','Invested Amount'];examples=[['Niharika','STOCK','DMART','NSE','20','3923.85','78477'],['Niharika','ETF','GOLDBEES','NSE','1123','91.37','102614']];name='stock-holdings-import-template.csv';}const csv=[headers,...examples].map(r=>r.map(csvCell).join(',')).join('\n');const blob=new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function handleBulkFile(){state.pendingImport=[];els.runBulkImportBtn.disabled=true;const file=els.bulkCsvFile.files?.[0];if(!file){els.bulkImportStatus.textContent='No file selected.';return;}try{const rows=trimToDetectedHeader(await fileToRows(file),state.importMode);const data=state.importMode==='MF_STATEMENT'?rowsToMfTransactions(rows):rowsToStockHoldings(rows);state.pendingImport=data;const owners=[...new Set(data.map(x=>x.owner).filter(Boolean))];els.bulkImportStatus.textContent=`${data.length} ${state.importMode==='MF_STATEMENT'?'financial transaction':'holding'} row${data.length===1?'':'s'} ready · ${owners.map(shortOwner).join(', ')}`;els.bulkImportStatus.className='import-status success';els.runBulkImportBtn.disabled=false;}catch(e){els.bulkImportStatus.textContent=e.message;els.bulkImportStatus.className='import-status error';}}
async function runBulkImport(event){event.preventDefault();if(!state.pendingImport.length)return;const b=els.runBulkImportBtn;setBusy(b,true,'Importing…');try{const action=state.importMode==='MF_STATEMENT'?'bulkImportMfTransactions':'bulkImportHoldings';const payload=state.importMode==='MF_STATEMENT'?{transactions:state.pendingImport}:{holdings:state.pendingImport};const result=await api(action,payload);closeModals();state.pendingImport=[];applyBootstrap(result.data);saveCache(result.data);switchSection('holdings');toast(state.importMode==='MF_STATEMENT'?`${result.imported} new MF transactions imported; ${result.skipped||0} duplicates skipped. Click Refresh for 1D–10Y performance.`:`${result.imported} stock/ETF holdings imported. Click Refresh for performance.`, 'success');}catch(e){toast(e.message,'error');els.bulkImportStatus.textContent=e.message;els.bulkImportStatus.className='import-status error';}finally{setBusy(b,false);}}

function exportCsv(){const headers=['Investor','Type','Asset','Code','Exchange','Units','Avg Buy','Invested','Current Price','Current Value','Gain Loss','Gain %','XIRR','1D','1W','1M','6M','1Y','3Y','5Y','10Y','Personal Note'];const rows=visibleHoldings().map(h=>{const p=h.performance||{};return[shortOwner(h.owner),h.type,h.assetName,h.code,h.exchange,h.units,Number(h.units)>0?Number(h.investedAmount)/Number(h.units):'',h.investedAmount,h.currentPrice,h.currentValue,h.gainLoss,h.returnPct,h.xirr,p.d1,p.w1,p.m1,p.m6,p.y1,p.y3,p.y5,p.y10,h.notes||''];});const csv=[headers,...rows].map(r=>r.map(csvCell).join(',')).join('\n');const blob=new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`my-finance-${state.selectedOwner==='ALL'?'combined':shortOwner(state.selectedOwner)}-${state.selectedAssetView.toLowerCase()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

async function changePassword(event){event.preventDefault();if(els.newPassword.value!==els.confirmPassword.value){toast('New passwords do not match.','error');return;}const b=event.submitter;setBusy(b,true,'Updating…');try{await api('changePassword',{currentPassword:els.currentPassword.value,newPassword:els.newPassword.value});closeModals();els.passwordForm.reset();toast('Password changed.','success');}catch(e){toast(e.message,'error');}finally{setBusy(b,false);}}
async function loadUsers(){try{const r=await api('adminListUsers');state.users=r.users||[];renderUsers();}catch(e){toast(e.message,'error');}}
async function createUser(event){event.preventDefault();const b=event.submitter;setBusy(b,true,'Creating…');try{await api('adminCreateUser',{username:els.newUsername.value.trim(),displayName:els.newDisplayName.value.trim(),role:els.newUserRole.value,password:els.newUserPassword.value});closeModals();els.userForm.reset();await loadUsers();toast('User created.','success');}catch(e){toast(e.message,'error');}finally{setBusy(b,false);}}
async function resetUserPassword(username){const password=prompt(`Enter a new temporary password for ${username}:`);if(!password)return;try{await api('adminResetPassword',{username,password});toast('Password reset.','success');}catch(e){toast(e.message,'error');}}
async function toggleUser(username,active){try{await api('adminToggleUser',{username,active});await loadUsers();toast(`User ${active?'enabled':'disabled'}.`,'success');}catch(e){toast(e.message,'error');}}

function bindEvents(){
  els.loginForm.addEventListener('submit',login);els.logoutBtn.addEventListener('click',logout);els.viewAllNotesBtn.addEventListener('click',()=>openAllNotes('HOLDINGS'));els.watchAllNotesBtn.addEventListener('click',()=>openAllNotes('WATCHLIST'));els.notesSearch.addEventListener('input',renderNotesModal);els.notesSource.addEventListener('change',renderNotesModal);els.notesScope.addEventListener('change',renderNotesModal);els.notesFilter.addEventListener('change',renderNotesModal);els.drawerCloseBtn.addEventListener('click',closeHoldingDrawer);els.drawerDoneBtn.addEventListener('click',closeHoldingDrawer);els.drawerEditBtn.addEventListener('click',editDrawerHolding);els.holdingDrawerBackdrop.addEventListener('click',closeHoldingDrawer);els.refreshBtn.addEventListener('click',()=>loadDashboard(true));els.addInvestmentBtn.addEventListener('click',()=>openInvestment());els.addInvestmentTableBtn.addEventListener('click',()=>openInvestment());els.importBtn.addEventListener('click',openBulkImport);els.bulkImportBtn.addEventListener('click',openBulkImport);els.downloadImportTemplateBtn.addEventListener('click',downloadImportTemplate);els.bulkCsvFile.addEventListener('change',handleBulkFile);els.bulkImportForm.addEventListener('submit',runBulkImport);els.exportBtn.addEventListener('click',exportCsv);els.investmentForm.addEventListener('submit',saveInvestment);els.watchForm.addEventListener('submit',saveWatch);els.passwordForm.addEventListener('submit',changePassword);els.userForm.addEventListener('submit',createUser);els.holdingType.addEventListener('change',()=>updateAssetForm(els.holdingType.value,'holding'));els.watchType.addEventListener('change',()=>updateAssetForm(els.watchType.value,'watch'));els.holdingSearch.addEventListener('input',renderHoldings);els.holdingTypeFilter.addEventListener('change',renderHoldings);els.watchSearch.addEventListener('input',renderWatchlist);$('addWatchBtn').addEventListener('click',()=>openWatch());$('changePasswordBtn').addEventListener('click',()=>openModal('passwordModal'));$('addUserBtn').addEventListener('click',()=>openModal('userModal'));els.modalBackdrop.addEventListener('click',e=>{if(e.target===els.modalBackdrop)closeModals();});$$('[data-close-modal]').forEach(b=>b.addEventListener('click',closeModals));$$('[data-section]').forEach(b=>b.addEventListener('click',()=>switchSection(b.dataset.section)));$$('[data-section-link]').forEach(b=>b.addEventListener('click',()=>switchSection(b.dataset.sectionLink)));$$('[data-toggle-password]').forEach(b=>b.addEventListener('click',()=>{const input=$(b.dataset.togglePassword),show=input.type==='password';input.type=show?'text':'password';b.textContent=show?'Hide':'Show';}));$$('.import-mode').forEach(b=>b.addEventListener('click',()=>setImportMode(b.dataset.importMode)));
  document.addEventListener('click',e=>{const owner=e.target.closest('[data-owner-view]');if(owner){state.selectedOwner=owner.dataset.ownerView;refreshOwnerControls();renderAll();return;}const assetView=e.target.closest('[data-asset-view]');if(assetView){state.selectedAssetView=assetView.dataset.assetView;els.holdingTypeFilter.value='ALL';renderAll();return;}const noteView=e.target.closest('[data-note-view]'),noteEdit=e.target.closest('[data-note-edit]'),watchNoteEdit=e.target.closest('[data-watch-note-edit]'),edit=e.target.closest('[data-edit-holding]'),del=e.target.closest('[data-delete-holding]'),ew=e.target.closest('[data-edit-watch]'),dw=e.target.closest('[data-delete-watch]'),ru=e.target.closest('[data-reset-user]'),tu=e.target.closest('[data-toggle-user]');if(noteView){const item=state.holdings.find(x=>x.id===noteView.dataset.noteView);closeModals();if(item)openHoldingDrawer(item);return;}if(noteEdit){const item=state.holdings.find(x=>x.id===noteEdit.dataset.noteEdit);closeModals();if(item)openInvestment(item);return;}if(watchNoteEdit){const item=state.watchlist.find(x=>x.id===watchNoteEdit.dataset.watchNoteEdit);closeModals();if(item)openWatch(item);return;}if(edit){openInvestment(state.holdings.find(x=>x.id===edit.dataset.editHolding));return;}if(del){deleteItem('deleteHolding',del.dataset.deleteHolding,'investment');return;}if(ew){openWatch(state.watchlist.find(x=>x.id===ew.dataset.editWatch));return;}if(dw){deleteItem('deleteWatchItem',dw.dataset.deleteWatch,'watchlist item');return;}if(ru){resetUserPassword(ru.dataset.resetUser);return;}if(tu){toggleUser(tu.dataset.toggleUser,tu.dataset.active==='true');return;}const watchNoteCell=e.target.closest('[data-watch-note-cell]');if(watchNoteCell){const item=state.watchlist.find(x=>x.id===watchNoteCell.dataset.watchNoteCell);if(item)openWatch(item);return;}const noteCell=e.target.closest('[data-note-cell]');if(noteCell){const item=state.holdings.find(x=>x.id===noteCell.dataset.noteCell);if(item)openInvestment(item);return;}const view=e.target.closest('[data-view-holding]');if(view){openHoldingDrawer(state.holdings.find(x=>x.id===view.dataset.viewHolding));}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(els.holdingDrawer?.classList.contains('open'))closeHoldingDrawer();else closeModals();return;}if((e.key==='Enter'||e.key===' ')&&e.target?.matches?.('[data-view-holding]')){e.preventDefault();openHoldingDrawer(state.holdings.find(x=>x.id===e.target.dataset.viewHolding));}});
}

async function init(){
  bindEvents();
  refreshOwnerControls();
  purgeLegacyCaches();
  if(!isConfigured()){els.loginMessage.textContent='Setup required: paste the Apps Script /exec URL into config.js.';return;}
  if(state.token){
    showApp();
    loadCache();
    await loadDashboard(false);
  }
  window.addEventListener('pageshow',e=>{
    if(e.persisted && state.token && !state.syncing)loadDashboard(false);
  });
  window.addEventListener('online',()=>{
    if(state.token && !state.syncing)loadDashboard(false);
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible' && state.token && !state.syncing && Date.now()-state.lastLiveSyncAt>5*60*1000){
      loadDashboard(false);
    }
  });
}
init();
