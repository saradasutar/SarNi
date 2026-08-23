'use strict';

const CONFIG = window.PORTFOLIO_CONFIG || {};
const APP_VERSION = '19.2.9';
const EXPECTED_BACKEND_VERSION = '3.15.4';
const MOBILE_BREAKPOINT = 860;
const MOBILE_DATA_CACHE_VERSION = '19.2.9-mobile-parity-1';
const state = {
  token: localStorage.getItem('portfolio_token') || '',
  username: localStorage.getItem('portfolio_username') || '',
  user: null,
  holdings: [],
  transactions: [],
  watchlist: [],
  stickyNotes: [],
  lifeQuotes: [],
  customColumns: [],
  customValues: [],
  lifeQuoteIndex: 0,
  lifeQuoteTimer: null,
  lifeQuotePaused: false,
  utilityDrawerOpen: false,
  utilityDrawerTab: 'STICKY',
  dataFullscreenSection: '',
  overviewMode: 'PERSONAL',
  diary: [],
  monthlyDiary: [],
  monthStatus: [],
  diaryView: 'DAILY',
  diaryWorkspace: 'DAILY',
  users: [],
  owners: [],
  selectedOwner: 'ALL',
  selectedAssetView: 'ALL',
  activeSection: 'overview',
  syncing: false,
  importMode: 'MF_STATEMENT',
  pendingImport: [],
  growthRange: '30D',
  autoRefreshMinutes: Number(localStorage.getItem('portfolio_auto_refresh_min') || 15),
  autoRefreshNextAt: 0,
  autoRefreshTimer: null,
  backendVersion: EXPECTED_BACKEND_VERSION,
  lastServerSyncAt: 0,
  inlineEditHoldingId: '',
  masterDataVersion: '',
  masterDataAppliedAt: '',
  hScrollTarget: null,
  diaryDraftTimer: null,
  monthlyDraftTimer: null,
  quickDiaryMode: 'DAILY'
};

const $ = (id) => document.getElementById(id);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const els = {};
[
  'loginView','appView','runtimeWarning','loginForm','loginUsername','loginPassword','rememberUsername','loginVersion','loginBackendVersion','loginButton','loginMessage','sideAppName','dashboardUsername','dashboardVersion','dashboardBackendVersion','dashboardVersionTop','dashboardBackendVersionTop','mobileSessionBar','mobileFrontendVersion','mobileBackendVersion','mobileChangePasswordBtn','mobileLogoutBtn','todayLabel','pageTitle','autoRefreshSelect','autoRefreshCountdown','syncStatus','refreshBtn','addInvestmentBtn','addInvestmentTableBtn','bulkImportBtn','logoutBtn','profileButton','avatarInitial','personalHomeModeBtn','investmentHomeModeBtn','overviewSetDefaultBtn','personalHomeContent','investmentOverviewContent','personalHomeGreeting','homeDailyWriteBtn','homeMonthlyWriteBtn','homeAddTargetBtn','homeDiaryCount','homeDiaryPreview','homeDiaryQuickBtn','homeFullDiaryBtn','homeStickyCount','homeStickyDueToday','homeStickyOverdue','homeStickyUpcoming','homeStickyPreview','homeTargetAddBtn','homeTargetsOpenBtn','homeQuoteCard','homeQuoteText','homeQuoteAuthor','homeQuoteAutoStatus','homeQuoteNextBtn','homeQuotesOpenBtn','homeShowInvestmentsBtn','welcomeTitle','lastUpdatedText','viewChip','overviewStickyShortcut','overviewStickyShortcutCount','overviewQuoteShortcut','utilityDrawerOpenBtn','utilityDrawerCloseBtn','utilityDrawerScrim','utilityDrawer','utilityStickyBadge','utilityStickyTabCount','utilityStickySection','utilityQuoteSection','lifeQuoteText','lifeQuoteAuthor','lifeQuoteShuffleStatus','lifeQuoteNextBtn','lifeQuotePauseBtn','lifeQuoteLibraryBtn','lifeQuoteModal','lifeQuoteForm','lifeQuoteId','lifeQuoteInput','lifeQuoteAuthorInput','lifeQuoteSearch','lifeQuoteCount','lifeQuoteList','lifeQuoteEmpty','clearLifeQuoteBtn','saveLifeQuoteBtn','stickyNotesCount','stickyNotesList','stickyNotesEmpty','addStickyNoteBtn','pinnedStickyLayer','ownerSwitcher','assetViewSwitcher','typeSummaryGrid','holdingsHeading','sumInvestedLabel','sumCurrentLabel','importBtn','exportBtn','sumInvested','sumCurrent','sumGain','sumReturn','sumAssetCount','sumPricedCount','sumSplit','sumWatchCount','sumInvestedTrend','sumCurrentTrend','sumGainTrend','sumWatchTrend','growthRangeButtons','growthInvestedDelta','growthInvestedPct','growthValueDelta','growthValuePct','growthGainNow','growthReturnNow','portfolioGrowthChart','growthHistoryNote','watchPulseBadge','watchAtTarget','watchNearTarget','watchAverageGap','watchPulseCount','watchlistTrendChart','watchTrendNote','watchlistLastAutoUpdate','watchStripAtTarget','watchStripNear','watchStripGap','allocationChart','investorSummary','topHoldings','replaceMasterDataBtn','masterDataStatus','masterLoadBanner','masterLoadNowBtn','showAllInvestmentsBtn','holdingSearch','holdingTypeFilter','holdingResultFilter','holdingNotesFilter','holdingTradeFilter','holdingsFilterCount','holdingsSummaryPanel','toggleHoldingsSummaryBtn','holdingsViewPreset','saveHoldingsDefaultViewBtn','restoreHoldingsDefaultViewBtn','resetHoldingsViewBtn','holdingsDefaultViewStatus','printHoldingsBtn','holdingsFullscreenBtn','holdRowMinusBtn','holdRowPlusBtn','holdRowSizeLabel','holdRowSlider','holdWidthMinusBtn','holdWidthPlusBtn','holdWidthSizeLabel','holdWidthSlider','holdLayoutSavedStatus','holdSizeResetBtn','holdSumCombinedTotalInvested','holdSumCombinedTotalCurrent','holdSumCombinedTotalGrowth','holdSumCombinedMfInvested','holdSumCombinedMfCurrent','holdSumCombinedMfGrowth','holdSumCombinedStockInvested','holdSumCombinedStockCurrent','holdSumCombinedStockGrowth','holdSumNiharikaTotalInvested','holdSumNiharikaTotalCurrent','holdSumNiharikaTotalGrowth','holdSumNiharikaMfInvested','holdSumNiharikaMfCurrent','holdSumNiharikaMfGrowth','holdSumNiharikaStockInvested','holdSumNiharikaStockCurrent','holdSumNiharikaStockGrowth','holdSumSaradaTotalInvested','holdSumSaradaTotalCurrent','holdSumSaradaTotalGrowth','holdSumSaradaMfInvested','holdSumSaradaMfCurrent','holdSumSaradaMfGrowth','holdSumSaradaStockInvested','holdSumSaradaStockCurrent','holdSumSaradaStockGrowth','holdingsBody','holdingsEmpty','holdCurrentPnlToday','holdRealizedPnl','holdTotalPnlToDate','holdTradeDateCoverage','holdPnlAsOf','mfNavHealthBadge','manageHoldingsColumnsBtn','viewAllNotesBtn','watchAllNotesBtn','columnManagerModal','columnManagerTitle','customColumnForm','customColumnId','customColumnSection','customColumnLabel','customColumnKey','customColumnType','customColumnOrder','clearCustomColumnBtn','saveCustomColumnBtn','standardColumnsList','resetStandardColumnsBtn','customColumnsList','customColumnsEmpty','customColumnCount','customValueModal','customValueTitle','customValueRecord','customValueForm','customValueSection','customValueRecordId','customValueColumnKey','customValueFieldLabel','customValueInput','saveCustomValueBtn','notesModal','notesSearch','notesSource','notesScope','notesFilter','notesSummary','notesList','notesEmpty','transactionSearch','transactionOwnerFilter','transactionAssetFilter','transactionSideFilter','transactionFromDate','transactionToDate','transactionFilterCount','transactionBuyTotal','transactionSaleTotal','transactionRealizedPnl','transactionCount','transactionBody','transactionEmpty','transactionImportBtn','printTransactionsBtn','watchSearch','watchTypeFilter','watchPriorityFilter','watchTargetFilter','watchNotesFilter','watchFilterCount','saveWatchDefaultViewBtn','restoreWatchDefaultViewBtn','watchDefaultViewStatus','printWatchlistBtn','watchlistFullscreenBtn','watchRowMinusBtn','watchRowPlusBtn','watchRowSizeLabel','watchRowSlider','watchWidthMinusBtn','watchWidthPlusBtn','watchWidthSizeLabel','watchWidthSlider','watchLayoutSavedStatus','watchSizeResetBtn','manageWatchlistColumnsBtn','watchBody','watchEmpty','diaryForm','diaryId','diaryDate','diaryPrevDayBtn','diaryTodayBtn','diaryNextDayBtn','diaryTitle','diaryText','diaryDraftStatus','diaryCharCount','saveDiaryBtn','clearDiaryBtn','newDiaryEntryBtn','diarySaveStatus','diaryViewSwitcher','diarySearch','diarySearchClearBtn','diaryDayControl','diaryMonthControl','diaryRangeControl','diaryBrowseDate','diaryBrowseMonth','diaryFromDate','diaryToDate','printDiaryBtn','diarySummary','diaryList','diaryEmpty','diaryHeroStatus','diaryWorkspaceSwitcher','dailyDiaryWorkspace','monthlyDiaryWorkspace','monthlyYearFilter','monthlyMonthFilter','monthlyTypeFilter','monthlyStatusFilter','monthlySearch','printMonthlyBtn','monthCompletionPanel','monthCompletionTitle','monthCompletionText','monthProgressBar','monthProgressLabel','completeMonthBtn','monthlyForm','monthlyId','monthlyEntryMonth','monthlyPrevMonthBtn','monthlyThisMonthBtn','monthlyNextMonthBtn','monthlyEntryType','monthlyTitle','monthlyText','monthlyDraftStatus','monthlyCharCount','monthlyTargetHelp','monthlySaveStatus','clearMonthlyBtn','saveMonthlyBtn','monthlyListTitle','monthlyResultCount','completedMonthArchive','monthlyList','monthlyEmpty','usersBody','modalBackdrop','investmentModal','investmentForm','holdingId','holdingOwner','holdingType','holdingName','holdingCode','holdingExchange','holdingUnits','holdingInvested','holdingManualPrice','holdingBuyDate','holdingNotes','holdingCodeLabel','exchangeLabel','mfHelp','bulkImportModal','bulkImportForm','bulkCsvFile','bulkImportStatus','runBulkImportBtn','downloadImportTemplateBtn','mfImportHelp','mfSnapshotImportHelp','stockImportHelp','stockTradeImportHelp','stockOwnerLabel','importOwner','importFileHint','watchModal','watchForm','watchId','watchType','watchName','watchCode','watchExchange','watchTarget','watchManualPrice','watchPriority','watchNotes','watchCodeLabel','watchExchangeLabel','watchMfHelp','stickyNoteModal','stickyNoteForm','stickyNoteId','stickyNoteType','stickyNoteTitle','stickyNoteDueDate','stickyNoteText','stickyNoteModalTitle','saveStickyNoteBtn','passwordModal','passwordForm','currentPassword','newPassword','confirmPassword','userModal','userForm','userModalTitle','userFormMode','editOriginalUsername','newUsername','usernameEditHelp','newDisplayName','newUserRole','newUserActiveLabel','newUserActive','userPasswordGroup','newUserPassword','generateUserPasswordBtn','copyUserPasswordBtn','userFormStatus','saveUserBtn','quickDiaryBtn','quickDiaryMobileBtn','quickDiaryPanel','quickDiaryCloseBtn','quickDailyForm','quickDailyDate','quickDailyTitle','quickDailyText','quickDailyStatus','quickDailyCount','quickDailySaveBtn','quickMonthlyForm','quickMonthlyMonth','quickMonthlyType','quickMonthlyTitle','quickMonthlyText','quickMonthlyStatus','quickMonthlyCount','quickMonthlySaveBtn','openFullDiaryBtn','dashboardHScroll','dashboardHScrollRange','dashboardHScrollLabel','dashboardHScrollPct','dashboardHScrollLeft','dashboardHScrollRight','holdingDrawerBackdrop','holdingDrawer','drawerEyebrow','drawerAssetBadge','drawerTitle','drawerSubtitle','drawerContent','drawerCloseBtn','drawerEditBtn','drawerDoneBtn','toastRegion'
].forEach((id) => { els[id] = $(id); });

function isMobileViewport(){
  return window.matchMedia ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches : window.innerWidth <= MOBILE_BREAKPOINT;
}

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
function pnlClass(value) {
  const raw=String(value??'').replace(/[,₹%\s]/g,'').replace(/\(([^)]+)\)/,'-$1');
  const n=Number(raw);
  return Number.isFinite(n)?(n>0?'positive':n<0?'negative':'neutral'):'neutral';
}
function dateLabel(value) { const d=value?new Date(value):null; return !d||Number.isNaN(d.getTime())?'Not available':new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(d); }
function setBusy(button,busy,text){ if(!button)return; if(busy){button.dataset.originalText=button.textContent;button.disabled=true;button.textContent=text||'Please wait…';}else{button.disabled=false;button.textContent=button.dataset.originalText||button.textContent;} }
function setSyncStatus(mode,message){ if(!els.syncStatus)return; els.syncStatus.className=`sync-status ${mode||''}`.trim(); const label=els.syncStatus.querySelector('span:last-child'); if(label)label.textContent=message; }
function toast(message,type=''){ const node=document.createElement('div');node.className=`toast ${type}`.trim();node.textContent=message;els.toastRegion.appendChild(node);setTimeout(()=>node.remove(),4500); }

function asyncRequestId(){
  return `mfreq_${Date.now()}_${Math.random().toString(36).slice(2,12)}_${Math.random().toString(36).slice(2,10)}`;
}
function jsonpCallbackName(){
  return `__mfPoll_${Date.now()}_${Math.random().toString(36).slice(2,9)}`.replace(/[^A-Za-z0-9_$]/g,'_');
}
function pollOnce(requestId,timeoutMs=12000){
  return new Promise((resolve,reject)=>{
    const cb=jsonpCallbackName();
    const script=document.createElement('script');
    let settled=false;

    const cleanup=()=>{
      clearTimeout(timer);
      try{delete window[cb];}catch{window[cb]=undefined;}
      try{script.remove();}catch{}
    };
    const fail=message=>{
      if(settled)return;
      settled=true;
      cleanup();
      reject(new Error(message));
    };

    window[cb]=envelope=>{
      if(settled)return;
      settled=true;
      cleanup();
      if(!envelope||envelope.__myfinanceAsyncResult!==true){
        reject(new Error('Invalid response from backend polling endpoint.'));
        return;
      }
      resolve(envelope);
    };

    const u=new URL(String(CONFIG.API_URL).trim());
    u.searchParams.set('action','pollResult');
    u.searchParams.set('requestId',requestId);
    u.searchParams.set('callback',cb);
    u.searchParams.set('_',String(Date.now()));
    script.src=u.toString();
    script.async=true;
    script.onerror=()=>fail('Could not reach the backend polling endpoint.');
    const timer=setTimeout(()=>fail('Backend polling request timed out.'),timeoutMs);
    document.head.appendChild(script);
  });
}
async function waitForAsyncResult(requestId,timeoutMs){
  const started=Date.now();
  let lastError=null;

  while(Date.now()-started<timeoutMs){
    try{
      const envelope=await pollOnce(requestId,Math.min(12000,Math.max(3000,timeoutMs-(Date.now()-started))));
      if(envelope.ready){
        const result=envelope.payload||{};
        if(!result.ok){
          const err=new Error(result.message||'Request failed.');
          err.code=result.code||'REQUEST_FAILED';
          throw err;
        }
        return result;
      }
      lastError=null;
    }catch(err){
      lastError=err;
    }
    await new Promise(r=>setTimeout(r,450));
  }

  if(lastError)throw lastError;
  throw new Error('The backend did not return a result. Confirm Backend v3.14.0 is deployed and config.js uses the same /exec URL.');
}
function apiViaAsyncPost(action,payload={},options={}){
  if(!isConfigured())return Promise.reject(new Error('Backend is not configured. Check config.js.'));
  const timeoutMs=Number(options.timeoutMs)||CONFIG.REQUEST_TIMEOUT_MS||60000;
  const requestId=asyncRequestId();
  const body={action,...payload,transport:'asyncpoll',requestId};
  if(state.token&&!body.token)body.token=state.token;

  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe');
    const frameName=`${requestId}_frame`;
    frame.name=frameName;
    frame.id=frameName;
    frame.title='MyFinance backend request';
    frame.setAttribute('aria-hidden','true');
    frame.tabIndex=-1;
    frame.style.position='fixed';
    frame.style.left='-9999px';
    frame.style.top='-9999px';
    frame.style.width='2px';
    frame.style.height='2px';
    frame.style.opacity='0';
    frame.style.pointerEvents='none';

    const form=document.createElement('form');
    form.method='POST';
    form.action=String(CONFIG.API_URL).trim();
    form.target=frameName;
    form.enctype='application/x-www-form-urlencoded';
    form.acceptCharset='UTF-8';
    form.style.display='none';

    const input=document.createElement('input');
    input.type='hidden';
    input.name='payload';
    input.value=JSON.stringify(body);
    form.appendChild(input);

    document.body.appendChild(frame);
    document.body.appendChild(form);

    try{
      form.submit();
    }catch(e){
      try{form.remove();frame.remove();}catch{}
      reject(new Error(`Could not submit request to backend: ${e.message}`));
      return;
    }

    waitForAsyncResult(requestId,timeoutMs)
      .then(resolve)
      .catch(reject)
      .finally(()=>{
        setTimeout(()=>{try{form.remove();frame.remove();}catch{}},0);
      });
  });
}
async function api(action,payload={},options={}){
  try{
    return await apiViaAsyncPost(action,payload,options);
  }catch(error){
    if(options.retry&&!options._retried){
      await new Promise(r=>setTimeout(r,700));
      return api(action,payload,{...options,_retried:true});
    }
    throw error;
  }
}

function cacheKey(){return `portfolio_cache_${MOBILE_DATA_CACHE_VERSION}_${state.username||'unknown'}`;}
function saveCache(data){try{localStorage.setItem(cacheKey(),JSON.stringify({savedAt:Date.now(),data}));}catch{} }
function loadCache(){
  // Desktop can still show a recent saved snapshot while syncing.
  // Mobile deliberately waits for the backend so it reflects the same source data as desktop.
  if(isMobileViewport())return;
  try{
    const p=JSON.parse(localStorage.getItem(cacheKey())||'null');
    if(p?.data)applyBootstrap(p.data,true);
  }catch{}
}
function clearSession(){
  state.token='';
  state.username='';
  state.user=null;
  state.holdings=[];
  state.transactions=[];
  state.watchlist=[];
  state.stickyNotes=[];
  state.lifeQuotes=[];
  state.customColumns=[];
  state.customValues=[];
  state.diary=[];
  state.monthlyDiary=[];
  state.monthStatus=[];
  state.users=[];
  state.owners=[];
  localStorage.removeItem('portfolio_token');
  localStorage.removeItem('portfolio_username');
}


function growthHistoryKey(){return `portfolio_growth_history_${state.username||'unknown'}`;}
function loadGrowthHistory(){try{const p=JSON.parse(localStorage.getItem(growthHistoryKey())||'[]');return Array.isArray(p)?p:[];}catch{return [];}}
function saveGrowthHistory(h){try{localStorage.setItem(growthHistoryKey(),JSON.stringify(h.slice(-2200)));}catch{}}
function scopeKey(owner,asset){return `${owner||'ALL'}::${asset||'ALL'}`;}
function scopedItems(owner,asset){let items=state.holdings;if(owner&&owner!=='ALL')items=items.filter(h=>canonicalOwner(h.owner)===owner);if(asset==='MF')items=items.filter(h=>h.type==='MF');if(asset==='STOCKS')items=items.filter(h=>h.type==='STOCK'||h.type==='ETF');return items;}
function watchPulseSummary(){const valid=state.watchlist.filter(x=>Number(x.currentPrice)>0&&Number(x.targetPrice)>0);const d=valid.map(x=>Number.isFinite(Number(x.distancePct))?Number(x.distancePct):(Number(x.currentPrice)-Number(x.targetPrice))/Number(x.targetPrice)*100);return{count:state.watchlist.length,priced:valid.length,atTarget:d.filter(x=>x<=0).length,nearTarget:d.filter(x=>x>0&&x<=5).length,avgDistance:d.length?d.reduce((a,b)=>a+b,0)/d.length:null};}
function buildGrowthSnapshot(ts=Date.now()){const owners=['ALL',...configuredOwners()],assets=['ALL','MF','STOCKS'],scopes={};owners.forEach(o=>assets.forEach(a=>{const items=scopedItems(o,a),s=summarizeHoldings(items);scopes[scopeKey(o,a)]={invested:s.invested,current:s.current,gain:s.gain,returnPct:s.returnPct,count:items.length};}));return{ts,scopes,watch:watchPulseSummary()};}
function recordGrowthSnapshot(){if(!state.username)return;const now=Date.now(),h=loadGrowthHistory(),prev=h[h.length-1],cur=buildGrowthSnapshot(now),k=scopeKey('ALL','ALL'),a=cur.scopes[k]||{},b=prev?.scopes?.[k]||{};const changed=Math.abs(Number(a.invested||0)-Number(b.invested||0))>.01||Math.abs(Number(a.current||0)-Number(b.current||0))>.01||Math.abs(Number(cur.watch?.avgDistance||0)-Number(prev?.watch?.avgDistance||0))>.01;if(prev&&now-Number(prev.ts||0)<10*60*1000&&!changed)return;h.push(cur);saveGrowthHistory(h);}
function filteredGrowthHistory(){const h=loadGrowthHistory(),now=Date.now();if(state.growthRange==='7D')return h.filter(x=>now-Number(x.ts||0)<=7*86400000);if(state.growthRange==='30D')return h.filter(x=>now-Number(x.ts||0)<=30*86400000);return h;}
function pctChange(c,s){c=Number(c);s=Number(s);return Number.isFinite(c)&&Number.isFinite(s)&&s!==0?(c-s)/Math.abs(s)*100:null;}
function trendText(delta,pct,label=''){if(!Number.isFinite(Number(delta)))return'Tracking growth…';const d=Number(delta),p=Number(pct),sign=d>0?'▲':d<0?'▼':'•';return`${sign} ${formatCurrency(Math.abs(d),true)}${Number.isFinite(p)?` · ${p>=0?'+':''}${p.toFixed(2)}%`:''}${label?` ${label}`:''}`;}
function svgTrendChart(series,{height=220,emptyText='More history will appear after automatic updates.'}={}){const vals=series.flatMap(s=>s.points.map(p=>Number(p.value)).filter(Number.isFinite));if(!vals.length)return`<div class="chart-empty">${escapeHtml(emptyText)}</div>`;const W=720,H=height,l=20,r=18,t=18,b=28;let mn=Math.min(...vals),mx=Math.max(...vals);if(mn===mx){mn-=1;mx+=1;}const sp=mx-mn||1,n=Math.max(...series.map(s=>s.points.length),1),x=i=>l+(n<=1?0:i/(n-1))*(W-l-r),y=v=>t+(mx-Number(v))/sp*(H-t-b),grid=[0,.25,.5,.75,1].map(f=>{const yy=t+f*(H-t-b);return`<line x1="${l}" y1="${yy}" x2="${W-r}" y2="${yy}" class="chart-grid-line"/>`;}).join(''),paths=series.map(s=>{const pts=s.points.map((p,i)=>`${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' '),last=s.points[s.points.length-1],lx=x(Math.max(0,s.points.length-1)),ly=last?y(last.value):0;return`<polyline points="${pts}" fill="none" class="chart-series ${s.className}" vector-effect="non-scaling-stroke"/>${last?`<circle cx="${lx}" cy="${ly}" r="4" class="chart-point ${s.className}"/>`:''}`;}).join('');return`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grid}${paths}</svg>`;}
function renderGrowthDashboard(){const hist=filteredGrowthHistory(),key=scopeKey(state.selectedOwner,state.selectedAssetView),pts=hist.map(h=>({ts:h.ts,scope:h.scopes?.[key]})).filter(x=>x.scope),cur=summarizeHoldings(visibleHoldings()),first=pts[0]?.scope||null,last=pts[pts.length-1]?.scope||{invested:cur.invested,current:cur.current,gain:cur.gain,returnPct:cur.returnPct},id=first?Number(last.invested||0)-Number(first.invested||0):0,vd=first?Number(last.current||0)-Number(first.current||0):0,ip=first?pctChange(last.invested,first.invested):0,vp=first?pctChange(last.current,first.current):0;
 if(els.growthInvestedDelta){els.growthInvestedDelta.textContent=formatCurrency(id,true);els.growthInvestedDelta.className=pnlClass(id);els.growthInvestedPct.textContent=first?formatPercent(ip):'Starting now';els.growthValueDelta.textContent=formatCurrency(vd,true);els.growthValueDelta.className=pnlClass(vd);els.growthValuePct.textContent=first?formatPercent(vp):'Starting now';els.growthGainNow.textContent=formatCurrency(cur.gain,true);els.growthGainNow.className=pnlClass(cur.gain);els.growthReturnNow.textContent=formatPercent(cur.returnPct);els.growthReturnNow.className=pnlClass(cur.returnPct);}
 if(els.portfolioGrowthChart)els.portfolioGrowthChart.innerHTML=svgTrendChart([{className:'invested',points:pts.map(x=>({value:Number(x.scope.invested)||0}))},{className:'current',points:pts.map(x=>({value:Number(x.scope.current)||0}))}]);
 if(els.growthHistoryNote)els.growthHistoryNote.textContent=pts.length>1?`${pts.length} snapshots · ${state.growthRange==='ALL'?'all recorded history':state.growthRange}`:'Growth history starts now and builds automatically.';
 if(els.sumInvestedTrend){els.sumInvestedTrend.textContent=pts.length>1?trendText(id,ip,state.growthRange):'Tracking from now';els.sumInvestedTrend.className=`summary-trend ${pnlClass(id)}`;els.sumCurrentTrend.textContent=pts.length>1?trendText(vd,vp,state.growthRange):'Tracking from now';els.sumCurrentTrend.className=`summary-trend ${pnlClass(vd)}`;els.sumGainTrend.textContent=`${formatPercent(cur.returnPct)} total return`;els.sumGainTrend.className=`summary-trend ${pnlClass(cur.returnPct)}`;}renderWatchPulse(hist);}
function renderWatchPulse(hist=filteredGrowthHistory()){const p=watchPulseSummary();if(els.watchAtTarget)els.watchAtTarget.textContent=String(p.atTarget);if(els.watchNearTarget)els.watchNearTarget.textContent=String(p.nearTarget);if(els.watchAverageGap)els.watchAverageGap.textContent=p.avgDistance===null?'—':formatPercent(p.avgDistance);if(els.watchPulseCount)els.watchPulseCount.textContent=String(p.count);if(els.watchStripAtTarget)els.watchStripAtTarget.textContent=String(p.atTarget);if(els.watchStripNear)els.watchStripNear.textContent=String(p.nearTarget);if(els.watchStripGap)els.watchStripGap.textContent=p.avgDistance===null?'—':formatPercent(p.avgDistance);const wp=hist.map(h=>({value:Number(h.watch?.avgDistance)})).filter(x=>Number.isFinite(x.value));if(els.watchlistTrendChart)els.watchlistTrendChart.innerHTML=svgTrendChart([{className:'watch',points:wp}],{height:160,emptyText:'Watchlist target-distance history will build after updates.'});const first=hist.find(h=>Number.isFinite(Number(h.watch?.avgDistance)))?.watch?.avgDistance,gd=Number.isFinite(Number(first))&&Number.isFinite(Number(p.avgDistance))?Number(p.avgDistance)-Number(first):null;if(els.watchTrendNote)els.watchTrendNote.textContent=gd===null?'Lower average gap means ideas are moving closer to your targets.':`${gd<=0?'Closer':'Farther'} by ${Math.abs(gd).toFixed(2)} percentage points over ${state.growthRange}.`;if(els.sumWatchTrend){els.sumWatchTrend.textContent=p.atTarget?`${p.atTarget} at/below target · ${p.nearTarget} near`:`${p.nearTarget} near target · avg gap ${p.avgDistance===null?'—':formatPercent(p.avgDistance)}`;els.sumWatchTrend.className=`summary-trend ${p.atTarget?'positive':'neutral'}`;}}
function updateAutoRefreshUI(){if(!els.autoRefreshCountdown)return;const m=Number(state.autoRefreshMinutes)||0;if(!m){els.autoRefreshCountdown.textContent='Off';return;}const left=Math.max(0,state.autoRefreshNextAt-Date.now()),sec=Math.ceil(left/1000);els.autoRefreshCountdown.textContent=left>0?`Next ${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`:'Updating…';}
function resetAutoRefreshClock(){const m=Number(state.autoRefreshMinutes)||0;state.autoRefreshNextAt=m?Date.now()+m*60000:0;updateAutoRefreshUI();}
function startAutoRefresh(){if(state.autoRefreshTimer)clearInterval(state.autoRefreshTimer);if(els.autoRefreshSelect)els.autoRefreshSelect.value=String(state.autoRefreshMinutes);resetAutoRefreshClock();state.autoRefreshTimer=setInterval(async()=>{updateAutoRefreshUI();if(!state.token||document.hidden||!state.autoRefreshMinutes||state.syncing)return;if(Date.now()>=state.autoRefreshNextAt){resetAutoRefreshClock();await loadDashboard(true);}},1000);}
function changeAutoRefresh(){state.autoRefreshMinutes=Number(els.autoRefreshSelect?.value||0);localStorage.setItem('portfolio_auto_refresh_min',String(state.autoRefreshMinutes));resetAutoRefreshClock();toast(state.autoRefreshMinutes?`Auto update set to every ${state.autoRefreshMinutes} minutes.`:'Auto update turned off.','success');}

function overviewDefaultMode(){
  return 'PERSONAL';
}
function setOverviewMode(mode,{saveDefault=false}={}){
  state.overviewMode='PERSONAL';
  if(saveDefault)localStorage.setItem('portfolio_overview_default','PERSONAL');
  const investment=false;
  els.personalHomeContent?.classList.toggle('hidden',investment);
  els.investmentOverviewContent?.classList.toggle('hidden',!investment);
  els.personalHomeModeBtn?.classList.toggle('active',!investment);
  els.investmentHomeModeBtn?.classList.toggle('active',investment);
  const isDefault=overviewDefaultMode()===state.overviewMode;
  if(els.overviewSetDefaultBtn){
    els.overviewSetDefaultBtn.textContent=isDefault?'✓ Default view':'☆ Make default';
    els.overviewSetDefaultBtn.classList.toggle('is-default',isDefault);
  }
  if(state.activeSection==='overview'&&els.pageTitle)els.pageTitle.textContent=investment?'Investment overview':'My dashboard';
  if(!investment){
    renderPersonalHome();
    startLifeQuoteShuffle();
  }
  scheduleDashboardHScrollRefresh();
}
function setCurrentOverviewAsDefault(){
  setOverviewMode(state.overviewMode,{saveDefault:true});
  toast(state.overviewMode==='PERSONAL'?'My Home is now your default dashboard.':'Investments is now your default Overview.','success');
}
function diaryPreviewText(text,max=145){
  const clean=String(text||'').replace(/\s+/g,' ').trim();
  return clean.length>max?clean.slice(0,max-1)+'…':clean;
}
function quoteToneClass(){
  return `quote-tone-${normalizeLifeQuoteIndex(state.lifeQuoteIndex)%6}`;
}
function applyQuoteTone(){
  const cls=quoteToneClass();
  if(els.homeQuoteCard){
    [...els.homeQuoteCard.classList].filter(x=>x.startsWith('quote-tone-')).forEach(x=>els.homeQuoteCard.classList.remove(x));
    els.homeQuoteCard.classList.add(cls);
  }
  const panel=els.lifeQuoteText?.closest('.life-quote-panel');
  if(panel){
    [...panel.classList].filter(x=>x.startsWith('quote-tone-')).forEach(x=>panel.classList.remove(x));
    panel.classList.add(cls);
  }
}
function renderPersonalHome(){
  if(!els.personalHomeContent)return;
  const today=localIsoDate();
  const todayItems=state.diary
    .filter(x=>String(x.entryDate||'').slice(0,10)===today)
    .sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  if(els.homeDiaryCount)els.homeDiaryCount.textContent=`${todayItems.length} today`;
  if(els.homeDiaryPreview){
    els.homeDiaryPreview.innerHTML=todayItems.length
      ? todayItems.slice(0,2).map((item,i)=>`<article class="home-diary-item tone-row-${i%2}"><strong>${escapeHtml(item.title?.trim()||'Daily note')}</strong><p>${escapeHtml(diaryPreviewText(item.text))}</p></article>`).join('')
      : '<p class="personal-empty-copy">Nothing written today yet. Add a quick note whenever you want to remember something.</p>';
  }

  const active=[...state.stickyNotes];
  const dueToday=active.filter(x=>String(x.dueDate||'')===today).length;
  const overdue=active.filter(x=>x.dueDate&&String(x.dueDate)<today).length;
  const upcoming=active.filter(x=>x.dueDate&&String(x.dueDate)>today).length;
  if(els.homeStickyCount)els.homeStickyCount.textContent=`${active.length} active`;
  if(els.homeStickyDueToday)els.homeStickyDueToday.textContent=String(dueToday);
  if(els.homeStickyOverdue)els.homeStickyOverdue.textContent=String(overdue);
  if(els.homeStickyUpcoming)els.homeStickyUpcoming.textContent=String(upcoming);

  if(els.homeStickyPreview){
    const sorted=active.sort((a,b)=>(a.dueDate||'9999-12-31').localeCompare(b.dueDate||'9999-12-31')).slice(0,3);
    els.homeStickyPreview.innerHTML=sorted.length
      ? sorted.map((note,i)=>{
          const due=stickyDueState(note);
          return `<button type="button" class="home-sticky-item ${due.cls} tone-row-${i%2}" data-home-open-sticky="1"><span class="home-sticky-dot"></span><span><strong>${escapeHtml(note.title||'Untitled')}</strong><small>${escapeHtml(due.label)}</small></span></button>`;
        }).join('')
      : '<p class="personal-empty-copy">No active target or reminder. Keep this area for only what matters now.</p>';
  }

  const displayName=state.user?.displayName||state.user?.username||'';
  if(els.personalHomeGreeting)els.personalHomeGreeting.textContent=displayName?`Good to see you, ${displayName}`:'Your day at a glance';
  syncHomeQuote();
}
function syncHomeQuote(){
  if(!els.homeQuoteText)return;
  const q=currentLifeQuote();
  if(q){
    els.homeQuoteText.textContent=q.text||'';
    els.homeQuoteAuthor.textContent=q.author?`— ${q.author}`:'— Life note';
  }else{
    els.homeQuoteText.textContent='Add your favorite life quotes in the Quote Library.';
    els.homeQuoteAuthor.textContent='— Quote Library';
  }
  applyQuoteTone();
}

function renderUtilityDrawerTab(){
  const sticky=state.utilityDrawerTab!=='QUOTE';
  if(els.utilityStickySection)els.utilityStickySection.classList.toggle('hidden',!sticky);
  if(els.utilityQuoteSection)els.utilityQuoteSection.classList.toggle('hidden',sticky);
  $$('[data-utility-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.utilityTab===state.utilityDrawerTab));
  if(state.utilityDrawerOpen&&state.utilityDrawerTab==='QUOTE'){
    renderLifeQuote(false);
    if(!state.lifeQuotePaused)startLifeQuoteShuffle();
  }else{
    stopLifeQuoteShuffle();
  }
}
function openUtilityDrawer(tab='STICKY'){
  state.utilityDrawerOpen=true;
  state.utilityDrawerTab=tab==='QUOTE'?'QUOTE':'STICKY';
  els.utilityDrawer?.classList.add('open');
  els.utilityDrawer?.setAttribute('aria-hidden','false');
  els.utilityDrawerOpenBtn?.setAttribute('aria-expanded','true');
  els.utilityDrawerScrim?.classList.add('show');
  els.utilityDrawerScrim?.setAttribute('aria-hidden','false');
  document.body.classList.add('utility-drawer-open');
  renderUtilityDrawerTab();
  if(state.utilityDrawerTab==='QUOTE')startLifeQuoteShuffle();
  setTimeout(()=>els.utilityDrawerCloseBtn?.focus(),50);
}
function closeUtilityDrawer(){
  state.utilityDrawerOpen=false;
  els.utilityDrawer?.classList.remove('open');
  els.utilityDrawer?.setAttribute('aria-hidden','true');
  els.utilityDrawerOpenBtn?.setAttribute('aria-expanded','false');
  els.utilityDrawerScrim?.classList.remove('show');
  els.utilityDrawerScrim?.setAttribute('aria-hidden','true');
  document.body.classList.remove('utility-drawer-open');
  if(lifeQuoteAutoContextVisible())startLifeQuoteShuffle();else stopLifeQuoteShuffle();
}
function toggleUtilityDrawer(){
  if(state.utilityDrawerOpen)closeUtilityDrawer();
  else openUtilityDrawer('STICKY');
}

function lifeQuoteDaySeed(){
  const key=`${localIsoDate()}|${state.username||state.user?.username||'user'}`;
  let hash=0;
  for(let i=0;i<key.length;i++)hash=((hash<<5)-hash+key.charCodeAt(i))|0;
  return Math.abs(hash);
}
function normalizeLifeQuoteIndex(index){
  const n=state.lifeQuotes.length;
  if(!n)return 0;
  return ((Number(index)||0)%n+n)%n;
}
function currentLifeQuote(){
  if(!state.lifeQuotes.length)return null;
  state.lifeQuoteIndex=normalizeLifeQuoteIndex(state.lifeQuoteIndex);
  return state.lifeQuotes[state.lifeQuoteIndex];
}
const LIFE_QUOTE_AUTO_MS=12000;
function lifeQuoteAutoContextVisible(){
  const homeVisible=state.activeSection==='overview'&&!els.personalHomeContent?.classList.contains('hidden');
  const drawerVisible=state.utilityDrawerOpen&&state.utilityDrawerTab==='QUOTE';
  return homeVisible||drawerVisible;
}
function updateLifeQuoteAutoStatus(){
  const items=state.lifeQuotes;
  const status=items.length<2?'1 saved quote':state.lifeQuotePaused?'Auto move paused':'Auto move · 12s';
  if(els.homeQuoteAutoStatus)els.homeQuoteAutoStatus.textContent=status;
  if(els.lifeQuoteShuffleStatus){
    els.lifeQuoteShuffleStatus.textContent=items.length<2?'1 saved quote':state.lifeQuotePaused?'Auto move paused':`Auto move · 12s · ${items.length} saved`;
  }
}
function animateLifeQuoteMovement(){
  const targets=[
    els.homeQuoteCard,
    els.lifeQuoteText?.closest('.life-quote-panel')
  ].filter(Boolean);
  targets.forEach(el=>{
    el.classList.remove('quote-auto-transition');
    void el.offsetWidth;
    el.classList.add('quote-auto-transition');
    setTimeout(()=>el.classList.remove('quote-auto-transition'),850);
  });
}
function renderLifeQuote(resetForDay=false,{animate=false}={}){
  if(!els.lifeQuoteText)return;
  const items=state.lifeQuotes;
  if(!items.length){
    els.lifeQuoteText.textContent='Add your favorite life quotes to start the daily rotation.';
    syncHomeQuote();
    els.lifeQuoteAuthor.textContent='— Quote Library';
    if(els.homeQuoteAutoStatus)els.homeQuoteAutoStatus.textContent='Add quotes to start';
    els.lifeQuoteShuffleStatus.textContent='No saved quotes';
    els.lifeQuoteNextBtn.disabled=true;
    els.lifeQuotePauseBtn.disabled=true;
    stopLifeQuoteShuffle();
    return;
  }
  if(resetForDay)state.lifeQuoteIndex=lifeQuoteDaySeed()%items.length;
  else state.lifeQuoteIndex=normalizeLifeQuoteIndex(state.lifeQuoteIndex);
  const q=currentLifeQuote();
  syncHomeQuote();
  els.lifeQuoteText.textContent=q.text||'';
  applyQuoteTone();
  els.lifeQuoteAuthor.textContent=q.author?`— ${q.author}`:'— Life note';
  els.lifeQuoteNextBtn.disabled=items.length<2;
  els.lifeQuotePauseBtn.disabled=items.length<2;
  els.lifeQuotePauseBtn.textContent=state.lifeQuotePaused?'▶ Resume':'Ⅱ Pause';
  updateLifeQuoteAutoStatus();
  if(animate)animateLifeQuoteMovement();
  if(!state.lifeQuotePaused&&items.length>1&&lifeQuoteAutoContextVisible())startLifeQuoteShuffle();
}
function nextLifeQuote(){
  if(state.lifeQuotes.length<2)return;
  state.lifeQuoteIndex=normalizeLifeQuoteIndex(state.lifeQuoteIndex+1);
  renderLifeQuote(false,{animate:true});
}
function stopLifeQuoteShuffle(){
  if(state.lifeQuoteTimer){clearInterval(state.lifeQuoteTimer);state.lifeQuoteTimer=null;}
}
function startLifeQuoteShuffle(){
  stopLifeQuoteShuffle();
  if(state.lifeQuotePaused||state.lifeQuotes.length<2||!lifeQuoteAutoContextVisible())return;
  state.lifeQuoteTimer=setInterval(()=>{
    if(document.hidden||!lifeQuoteAutoContextVisible())return;
    state.lifeQuoteIndex=normalizeLifeQuoteIndex(state.lifeQuoteIndex+1);
    renderLifeQuote(false,{animate:true});
  },LIFE_QUOTE_AUTO_MS);
}
function toggleLifeQuoteShuffle(){
  state.lifeQuotePaused=!state.lifeQuotePaused;
  if(state.lifeQuotePaused)stopLifeQuoteShuffle();else startLifeQuoteShuffle();
  renderLifeQuote(false);
}

function resetLifeQuoteForm(){
  if(!els.lifeQuoteForm)return;
  els.lifeQuoteForm.reset();
  els.lifeQuoteId.value='';
  els.saveLifeQuoteBtn.textContent='Save quote';
}
function openLifeQuoteLibrary(){
  resetLifeQuoteForm();
  if(els.lifeQuoteSearch)els.lifeQuoteSearch.value='';
  renderLifeQuoteLibrary();
  openModal('lifeQuoteModal');
  setTimeout(()=>els.lifeQuoteInput?.focus(),60);
}
function renderLifeQuoteLibrary(){
  if(!els.lifeQuoteList)return;
  const q=String(els.lifeQuoteSearch?.value||'').trim().toLowerCase();
  const items=state.lifeQuotes.filter(item=>`${item.text||''} ${item.author||''}`.toLowerCase().includes(q));
  els.lifeQuoteCount.textContent=`${items.length} quote${items.length===1?'':'s'}`;
  els.lifeQuoteEmpty.classList.toggle('hidden',items.length>0);
  els.lifeQuoteList.innerHTML=items.map(item=>`<article class="quote-library-item">
    <div class="quote-library-item-copy"><p>“${escapeHtml(item.text||'')}”</p><span>${escapeHtml(item.author||'Life note')}</span></div>
    <div class="quote-library-item-actions"><button type="button" class="small-button" data-life-quote-edit="${escapeHtml(item.id)}">Edit</button><button type="button" class="small-button danger" data-life-quote-delete="${escapeHtml(item.id)}">Delete</button></div>
  </article>`).join('');
}
function editLifeQuote(id){
  const item=state.lifeQuotes.find(x=>x.id===id);
  if(!item)return;
  els.lifeQuoteId.value=item.id;
  els.lifeQuoteInput.value=item.text||'';
  els.lifeQuoteAuthorInput.value=item.author||'';
  els.saveLifeQuoteBtn.textContent='Update quote';
  els.lifeQuoteInput.focus();
}
async function saveLifeQuote(event){
  event.preventDefault();
  const text=els.lifeQuoteInput.value.trim();
  if(!text){toast('Enter the quote text.','error');return;}
  setBusy(els.saveLifeQuoteBtn,true,'Saving…');
  try{
    const result=await api('saveLifeQuote',{quote:{id:els.lifeQuoteId.value,text,author:els.lifeQuoteAuthorInput.value.trim()}});
    applyBootstrap(result.data);saveCache(result.data);resetLifeQuoteForm();renderLifeQuoteLibrary();renderLifeQuote(true);
    toast('Quote saved to DailyQuotes.','success');
  }catch(e){toast(e.message,'error');}
  finally{setBusy(els.saveLifeQuoteBtn,false);}
}
async function deleteLifeQuote(id){
  const item=state.lifeQuotes.find(x=>x.id===id);
  if(!item||!confirm('Delete this saved quote?'))return;
  try{
    const result=await api('deleteLifeQuote',{id});
    applyBootstrap(result.data);saveCache(result.data);renderLifeQuoteLibrary();renderLifeQuote(true);
    toast('Quote deleted.','success');
  }catch(e){toast(e.message,'error');}
}

function stickyDueState(note){
  const due=String(note.dueDate||'');
  if(!due)return {label:'No due date',cls:'normal'};
  const today=localIsoDate();
  if(due<today)return {label:`Overdue · ${diaryDateLabel(due)}`,cls:'overdue'};
  if(due===today)return {label:'Due today',cls:'today'};
  return {label:`Due ${diaryDateLabel(due)}`,cls:'upcoming'};
}

const STICKY_PIN_STORAGE_KEY='portfolio_pinned_sticky_ids_v1';

function loadPinnedStickyIds(){
  try{
    const raw=JSON.parse(localStorage.getItem(STICKY_PIN_STORAGE_KEY)||'[]');
    return Array.isArray(raw)?raw.map(String).filter(Boolean):[];
  }catch{return [];}
}
function savePinnedStickyIds(ids){
  try{localStorage.setItem(STICKY_PIN_STORAGE_KEY,JSON.stringify([...new Set(ids.map(String).filter(Boolean))]));}catch{}
}
function isStickyPinned(id){
  return loadPinnedStickyIds().includes(String(id));
}
function prunePinnedStickyIds(){
  const active=new Set((state.stickyNotes||[]).map(x=>String(x.id)));
  const clean=loadPinnedStickyIds().filter(id=>active.has(String(id)));
  savePinnedStickyIds(clean);
  return clean;
}
function toggleStickyPin(id){
  const key=String(id||'');
  if(!key)return;
  const ids=loadPinnedStickyIds();
  const pos=ids.indexOf(key);
  if(pos>=0){
    ids.splice(pos,1);
    toast('Sticky note unpinned.','success');
  }else{
    ids.push(key);
    toast('Sticky note pinned above the dashboard.','success');
  }
  savePinnedStickyIds(ids);
  renderStickyNotes();
}
function pinnedStickyCardHtml(note){
  const due=stickyDueState(note);
  const type=String(note.noteType||'REMINDER').toUpperCase();
  return `<article class="sticky-note-card pinned-floating ${type.toLowerCase()} ${due.cls}">
    <div class="sticky-note-top">
      <span class="sticky-note-type">${type==='TARGET'?'Target':'Reminder'}</span>
      <span class="sticky-pinned-badge">📌 Pinned</span>
    </div>
    <div class="pinned-sticky-due sticky-due ${due.cls}">${escapeHtml(due.label)}</div>
    <h4>${escapeHtml(note.title||'Untitled')}</h4>
    ${note.text?`<p>${escapeHtml(compactText(note.text,180))}</p>`:''}
    <div class="sticky-note-actions pinned-actions">
      <button type="button" class="sticky-pin-button active" data-sticky-pin="${escapeHtml(note.id)}" title="Unpin">↘ Unpin</button>
      <button type="button" class="sticky-done-button" data-sticky-done="${escapeHtml(note.id)}">✓ Completed</button>
      <button type="button" class="small-button" data-sticky-edit="${escapeHtml(note.id)}">Edit</button>
      <button type="button" class="small-button danger" data-sticky-delete="${escapeHtml(note.id)}">Delete</button>
    </div>
  </article>`;
}
function renderPinnedStickyNotes(){
  if(!els.pinnedStickyLayer)return;
  const ids=prunePinnedStickyIds();
  const map=new Map((state.stickyNotes||[]).map(x=>[String(x.id),x]));
  const notes=ids.map(id=>map.get(String(id))).filter(Boolean);
  els.pinnedStickyLayer.innerHTML=notes.map(pinnedStickyCardHtml).join('');
  els.pinnedStickyLayer.classList.toggle('hidden',notes.length===0);
}

function renderStickyNotes(){
  if(!els.stickyNotesList)return;
  const items=[...state.stickyNotes].sort((a,b)=>{
    const ap=isStickyPinned(a.id)?0:1,bp=isStickyPinned(b.id)?0:1;
    if(ap!==bp)return ap-bp;
    const ad=a.dueDate||'9999-12-31',bd=b.dueDate||'9999-12-31';
    const d=ad.localeCompare(bd);
    return d!==0?d:String(b.updatedAt||'').localeCompare(String(a.updatedAt||''));
  });
  els.stickyNotesCount.textContent=`${items.length} active`;
  if(els.utilityStickyBadge)els.utilityStickyBadge.textContent=String(items.length);
  if(els.utilityStickyTabCount)els.utilityStickyTabCount.textContent=String(items.length);
  if(els.overviewStickyShortcutCount)els.overviewStickyShortcutCount.textContent=`${items.length} active`;
  els.stickyNotesEmpty.classList.toggle('hidden',items.length>0);
  els.stickyNotesList.innerHTML=items.map(note=>{
    const due=stickyDueState(note);
    const type=String(note.noteType||'REMINDER').toUpperCase();
    const pinned=isStickyPinned(note.id);
    return `<article class="sticky-note-card ${pinned?'is-pinned':''} ${type.toLowerCase()} ${due.cls}">
      <div class="sticky-note-top"><span class="sticky-note-type">${type==='TARGET'?'Target':'Reminder'}</span><span class="sticky-due ${due.cls}">${escapeHtml(due.label)}</span></div>
      <h4>${escapeHtml(note.title||'Untitled')}</h4>
      ${note.text?`<p>${escapeHtml(compactText(note.text,130))}</p>`:''}
      <div class="sticky-note-actions">
        <button type="button" class="sticky-pin-button ${pinned?'active':''}" data-sticky-pin="${escapeHtml(note.id)}">${pinned?'📌 Pinned':'📍 Pin'}</button>
        <button type="button" class="sticky-done-button" data-sticky-done="${escapeHtml(note.id)}">✓ Completed</button>
        <button type="button" class="small-button" data-sticky-edit="${escapeHtml(note.id)}">Edit</button>
        <button type="button" class="small-button danger" data-sticky-delete="${escapeHtml(note.id)}">Delete</button>
      </div>
    </article>`;
  }).join('');
  renderPinnedStickyNotes();
  renderPersonalHome();
}
function openStickyNote(note=null){
  els.stickyNoteForm.reset();
  els.stickyNoteId.value=note?.id||'';
  els.stickyNoteType.value=note?.noteType||'TARGET';
  els.stickyNoteTitle.value=note?.title||'';
  els.stickyNoteDueDate.value=note?.dueDate||'';
  els.stickyNoteText.value=note?.text||'';
  els.stickyNoteModalTitle.textContent=note?'Edit sticky note':'Add target or reminder';
  openModal('stickyNoteModal');
  setTimeout(()=>els.stickyNoteTitle?.focus(),60);
}
async function saveStickyNote(event){
  event.preventDefault();
  const title=els.stickyNoteTitle.value.trim();
  if(!title){toast('Enter a title for the sticky note.','error');return;}
  setBusy(els.saveStickyNoteBtn,true,'Saving…');
  try{
    const result=await api('saveStickyNote',{note:{
      id:els.stickyNoteId.value,
      noteType:els.stickyNoteType.value,
      title,
      dueDate:els.stickyNoteDueDate.value,
      text:els.stickyNoteText.value.trim()
    }});

    // Backend save succeeded. Close the editor before doing a full dashboard rerender.
    closeModals();

    try{
      applyBootstrap(result.data);
      saveCache(result.data);
      renderStickyNotes();
      toast('Sticky note saved and shown on Overview.','success');
    }catch(renderError){
      console.error('Sticky saved; dashboard rerender failed',renderError);
      toast('Sticky note was saved. Refresh once to display the latest dashboard.','info');
    }
  }catch(e){
    toast(e.message,'error');
  }finally{
    setBusy(els.saveStickyNoteBtn,false);
  }
}
async function completeStickyNote(id){
  const item=state.stickyNotes.find(x=>x.id===id);
  if(!item)return;
  if(!confirm(`Mark "${item.title}" done and save it to your Daily Diary?`))return;
  try{
    const result=await api('completeStickyNote',{id});
    applyBootstrap(result.data);saveCache(result.data);renderStickyNotes();renderDiary();
    toast('Done — saved to Daily Diary.','success');
  }catch(e){toast(e.message,'error');}
}
async function deleteStickyNote(id){
  const item=state.stickyNotes.find(x=>x.id===id);
  if(!item||!confirm(`Delete sticky note "${item.title}"?`))return;
  try{
    const result=await api('deleteStickyNote',{id});
    applyBootstrap(result.data);saveCache(result.data);renderStickyNotes();
    toast('Sticky note deleted.','success');
  }catch(e){toast(e.message,'error');}
}

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

function updateVersionLabels(){
  const backendVersion=state.backendVersion||EXPECTED_BACKEND_VERSION;
  if(els.loginVersion)els.loginVersion.textContent=`Frontend · v${APP_VERSION}`;
  if(els.dashboardVersion)els.dashboardVersion.textContent=`Frontend · v${APP_VERSION}`;
  if(els.dashboardVersionTop)els.dashboardVersionTop.textContent=`FE v${APP_VERSION}`;
  if(els.mobileFrontendVersion)els.mobileFrontendVersion.textContent=`FE v${APP_VERSION}`;
  if(els.loginBackendVersion)els.loginBackendVersion.textContent=`Backend · v${backendVersion}`;
  if(els.dashboardBackendVersion)els.dashboardBackendVersion.textContent=`Backend · v${backendVersion}`;
  if(els.dashboardBackendVersionTop)els.dashboardBackendVersionTop.textContent=`BE v${backendVersion}`;
  if(els.mobileBackendVersion)els.mobileBackendVersion.textContent=`BE v${backendVersion}`;
}
async function loadBackendVersion(){
  updateVersionLabels();
  if(!isConfigured())return;
  // Mobile login is more reliable when it does not compete with a background iframe POST.
  // The actual backend version is confirmed by login/bootstrap and then displayed everywhere.
  if(isMobileViewport())return;
  try{
    const data=await api('status',{}, {timeoutMs:15000});
    if(data&&data.version){
      state.backendVersion=String(data.version);
      const parts=state.backendVersion.split('.').map(Number);
      if(parts[0]<3||(parts[0]===3&&parts[1]<15)){
        showRuntimeWarning(`Backend v${state.backendVersion} is older than required v3.15.0. Update the Apps Script backend before using V19.2.`);
      }
    }
  }catch(e){
    if(!state.backendVersion)state.backendVersion='unavailable';
    console.warn('Backend status check failed:',e);
  }
  updateVersionLabels();
}
function loadSavedUsername(){
  const saved=localStorage.getItem('portfolio_saved_username')||'';
  if(els.loginUsername&&saved){els.loginUsername.value=saved;if(els.rememberUsername)els.rememberUsername.checked=true;}
  updateVersionLabels();
}
function updateSavedUsernamePreference(){
  const username=els.loginUsername?.value.trim()||'';
  if(els.rememberUsername?.checked&&username)localStorage.setItem('portfolio_saved_username',username);
  else localStorage.removeItem('portfolio_saved_username');
}
function localIsoDate(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function localIsoMonth(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
}

async function login(event){
  event.preventDefault();
  if(els.loginMessage)els.loginMessage.textContent='';
  if(!isConfigured()){if(els.loginMessage)els.loginMessage.textContent='Setup required: paste the Apps Script /exec URL into config.js.';return;}
  setBusy(els.loginButton,true,'Signing in…');
  try{
    const result=await api('login',{username:els.loginUsername.value.trim(),password:els.loginPassword.value},{timeoutMs:90000});
    state.token=result.token;
    state.username=result.user.username;
    localStorage.setItem('portfolio_token',state.token);
    localStorage.setItem('portfolio_username',state.username);
    updateSavedUsernamePreference();
    showApp();
    applyBootstrap(result.data);
    saveCache(result.data);
    state.lastServerSyncAt=Date.now();
    restoreHoldingsSummaryState();
    switchSection('overview');
    resetAutoRefreshClock();
    toast('Signed in successfully.','success');
  }
  catch(error){if(els.loginMessage)els.loginMessage.textContent=error.message;}
  finally{setBusy(els.loginButton,false);}
}
function showLoggedOutUi(){
  els.appView?.classList.add('hidden');
  els.loginView?.classList.remove('hidden');
  if(els.loginPassword)els.loginPassword.value='';
  loadSavedUsername();
  updateVersionLabels();
}
function logout(){
  // Mobile must feel immediate: never wait for a slow network request before leaving the dashboard.
  const token=state.token;
  clearSession();
  stopLifeQuoteShuffle();
  showLoggedOutUi();
  if(token){
    api('logout',{token},{timeoutMs:12000}).catch(()=>{});
  }
}
function showApp(){
  els.loginView.classList.add('hidden');
  els.appView.classList.remove('hidden');
  els.sideAppName.textContent=CONFIG.APP_NAME||'My Finance';
  updateVersionLabels();
  els.todayLabel.textContent=new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toUpperCase();
}
async function loadDashboard(force=false){
  if(state.syncing)return; state.syncing=true;setSyncStatus('syncing',force?'Updating prices & performance…':'Syncing…');
  try{
    const result=await api(force?'refreshPrices':'bootstrap',{}, {retry:!force});
    applyBootstrap(result.data);saveCache(result.data);state.lastServerSyncAt=Date.now();setSyncStatus('','Up to date');
    if(force){
      const nav=result.refreshReport?.mfNav,perf=result.refreshReport?.mfPerformance;
      if(nav){
        const issues=(nav.missing?.length||0)+(perf?.failed?.length||0);
        const msg=`MF NAV ${nav.updated}/${nav.tracked}${nav.fallbackRepaired?` · ${nav.fallbackRepaired} fallback repaired`:''}${nav.remapped?` · ${nav.remapped} code remapped`:''} · MF performance ${perf?.updated??0}/${perf?.tracked??0}${nav.remainingMissing?` · ${nav.remainingMissing} NAV still missing`:issues?` · ${issues} need attention`:''}`;
        toast(msg,issues?'info':'success');
      }else toast('Prices, NAVs and performance refreshed.','success');
    }
  }
  catch(error){if(error.code==='AUTH_REQUIRED'||error.code==='SESSION_EXPIRED'){toast('Your session expired. Please sign in again.','error');logout();return;}setSyncStatus('error','Sync failed');toast(error.message,'error');}
  finally{state.syncing=false;}
}

function applyBootstrap(data,fromCache=false){
  if(!data)return;
  if(data.backendVersion)state.backendVersion=String(data.backendVersion);
  state.masterDataVersion=String(data.masterDataVersion||'');
  state.masterDataAppliedAt=String(data.masterDataAppliedAt||'');
  if(!state.masterDataAppliedAt && data.holdings && data.holdings.length){
    setTimeout(()=>toast('Master spreadsheet has not been applied yet. Click “Load Master Sheet Data” on Overview.','info'),500);
  }
  updateVersionLabels();
  state.user=data.user||state.user;state.holdings=Array.isArray(data.holdings)?data.holdings:[];state.transactions=Array.isArray(data.transactions)?data.transactions:[];state.watchlist=Array.isArray(data.watchlist)?data.watchlist:[];state.customColumns=Array.isArray(data.customColumns)?data.customColumns:[];state.customValues=Array.isArray(data.customValues)?data.customValues:[];state.stickyNotes=Array.isArray(data.stickyNotes)?data.stickyNotes:[];state.lifeQuotes=Array.isArray(data.lifeQuotes)?data.lifeQuotes:[];state.diary=Array.isArray(data.diary)?data.diary:[];state.monthlyDiary=Array.isArray(data.monthlyDiary)?data.monthlyDiary:[];state.monthStatus=Array.isArray(data.monthStatus)?data.monthStatus:[];state.owners=Array.isArray(data.owners)?data.owners:[];if(Array.isArray(data.users))state.users=data.users;
  if(!fromCache)recordGrowthSnapshot();
  refreshOwnerControls();renderAll();
  if(state.user){els.avatarInitial.textContent=(state.user.displayName||state.user.username||'I').charAt(0).toUpperCase();if(els.dashboardUsername)els.dashboardUsername.textContent=state.user.username||state.user.displayName||'—';if(els.diaryHeroStatus)els.diaryHeroStatus.textContent=`Private diary · ${state.user.username||'signed in'}`;$$('.admin-only').forEach(el=>el.classList.toggle('hidden',state.user.role!=='ADMIN'));}
  if(els.masterLoadBanner){
    const loaded=Boolean(state.masterDataAppliedAt);
    els.masterLoadBanner.classList.toggle('hidden',loaded);
  }
  if(els.masterDataStatus){
    els.masterDataStatus.textContent=state.masterDataAppliedAt?`Master sheet loaded · 35 holdings · 17 watchlist · ${detailDate(state.masterDataAppliedAt)}`:'Master spreadsheet not loaded yet · use “Replace from Master Sheet”.';
    els.masterDataStatus.classList.toggle('loaded',Boolean(state.masterDataAppliedAt));
  }
  els.lastUpdatedText.textContent=`${fromCache?'Showing saved data':'Updated'} ${dateLabel(data.updatedAt)}${data.priceNote?` · ${data.priceNote}`:''}`;if(els.watchlistLastAutoUpdate)els.watchlistLastAutoUpdate.textContent=`Updated ${dateLabel(data.updatedAt)}`;
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
function watchlistMatches(x){
  const q=String(els.watchSearch?.value||'').trim().toLowerCase();
  const type=els.watchTypeFilter?.value||'ALL';
  const priority=els.watchPriorityFilter?.value||'ALL';
  const target=els.watchTargetFilter?.value||'ALL';
  const notesFilter=els.watchNotesFilter?.value||'ALL';
  const s=x.sourceDetails||{};
  const hay=`${x.assetName||''} ${x.code||''} ${x.notes||''} ${s.companyName||''} ${s.salesGrowth||''} ${s.profitGrowth||''} ${s.valuation||''} ${s.moatRemark||''} ${s.finalRemark||''}`.toLowerCase();
  if(q&&!hay.includes(q))return false;
  if(type!=='ALL'&&x.type!==type)return false;
  if(priority!=='ALL'&&String(x.priority||'MEDIUM').toUpperCase()!==priority)return false;
  const hasTarget=Number.isFinite(Number(x.targetPrice))&&Number(x.targetPrice)>0;
  const distance=Number(x.distancePct);
  if(target==='NO_TARGET'&&hasTarget)return false;
  if(target==='AT'&&(!hasTarget||!Number.isFinite(distance)||distance>0))return false;
  if(target==='NEAR'&&(!hasTarget||!Number.isFinite(distance)||distance<=0||distance>5))return false;
  if(target==='FAR'&&(!hasTarget||!Number.isFinite(distance)||distance<=5))return false;
  const hasNotes=Boolean(String(x.notes||'').trim());
  if(notesFilter==='WITH_NOTES'&&!hasNotes)return false;
  if(notesFilter==='WITHOUT_NOTES'&&hasNotes)return false;
  return true;
}
function visibleWatchlist(){return state.watchlist.filter(watchlistMatches);}
function summarizeHoldings(items){
  let invested=0,current=0,pricedInvested=0,priced=0;const allocation={};
  items.forEach(h=>{invested+=Number(h.investedAmount)||0;const basis=h.currentValue==null?(Number(h.investedAmount)||0):Number(h.currentValue)||0;allocation[h.type]=(allocation[h.type]||0)+basis;if(h.currentValue!=null){current+=Number(h.currentValue)||0;pricedInvested+=Number(h.investedAmount)||0;priced++;}});
  const gain=current-pricedInvested;return{invested,current,gain,returnPct:pricedInvested>0?gain/pricedInvested*100:0,priced,allocation};
}
function showAllInvestments(){
  state.selectedOwner='ALL';
  state.selectedAssetView='ALL';

  if(els.holdingSearch)els.holdingSearch.value='';
  if(els.holdingTypeFilter)els.holdingTypeFilter.value='ALL';
  if(els.holdingResultFilter)els.holdingResultFilter.value='ALL';
  if(els.holdingNotesFilter)els.holdingNotesFilter.value='ALL';
  if(els.holdingTradeFilter)els.holdingTradeFilter.value='ALL';

  refreshOwnerControls();
  refreshAssetViewControls();
  renderAll();
  switchSection('holdings');

  const total=state.holdings.length;
  toast(
    total
      ? `Showing all ${total} investment${total===1?'':'s'}.`
      : 'All filters cleared. No investments are currently loaded.',
    total ? 'success' : 'info'
  );
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
function renderAll(){refreshAssetViewControls();renderSummary();renderGrowthDashboard();renderTypeSummary();renderAllocation();renderInvestorSummary();renderTopHoldings();renderHoldings();renderTransactions();renderWatchlist();renderLifeQuote(true);renderStickyNotes();renderPersonalHome();refreshMonthlyYearFilter();renderDiary();renderMonthlyDiary();setOverviewMode(state.overviewMode);if(state.user?.role==='ADMIN')renderUsers();}
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
  const q=String(els.holdingSearch?.value||'').trim().toLowerCase(),type=els.holdingTypeFilter?.value||'ALL';
  const result=els.holdingResultFilter?.value||'ALL',notesFilter=els.holdingNotesFilter?.value||'ALL',tradeFilter=els.holdingTradeFilter?.value||'ALL';
  const ownerOk=state.selectedOwner==='ALL'||canonicalOwner(h.owner)===state.selectedOwner,assetOk=assetViewMatches(h);
  const text=`${h.owner} ${h.assetName} ${h.code} ${h.sourceCode||''} ${h.notes||''}`.toLowerCase();
  if(!ownerOk||!assetOk||(q&&!text.includes(q))||(type!=='ALL'&&h.type!==type))return false;
  const current=Number(h.gainLoss),total=Number(h.totalPnlToDate),realised=Number(h.realizedPnl);
  if(result==='CURRENT_PROFIT'&&!(Number.isFinite(current)&&current>0))return false;
  if(result==='CURRENT_LOSS'&&!(Number.isFinite(current)&&current<0))return false;
  if(result==='TOTAL_PROFIT'&&!(Number.isFinite(total)&&total>0))return false;
  if(result==='TOTAL_LOSS'&&!(Number.isFinite(total)&&total<0))return false;
  if(result==='REALISED_PROFIT'&&!(Number.isFinite(realised)&&realised>0))return false;
  if(result==='REALISED_LOSS'&&!(Number.isFinite(realised)&&realised<0))return false;
  if(result==='PNL_PENDING'&&h.gainLoss!==null&&h.gainLoss!==undefined&&Number.isFinite(Number(h.gainLoss)))return false;
  const hasNotes=Boolean(String(h.notes||'').trim());
  if(notesFilter==='WITH_NOTES'&&!hasNotes)return false;
  if(notesFilter==='WITHOUT_NOTES'&&hasNotes)return false;
  const s=h.transactionStats||{},hasPurchase=(Array.isArray(s.purchaseDates)&&s.purchaseDates.length>0)||Boolean(h.buyDate),hasSale=Array.isArray(s.saleDates)&&s.saleDates.length>0;
  if(tradeFilter==='HAS_PURCHASE'&&!hasPurchase)return false;
  if(tradeFilter==='HAS_SALE'&&!hasSale)return false;
  if(tradeFilter==='MISSING_DATES'&&hasPurchase)return false;
  return true;
}
function notePreview(value, max=82){
  const clean=String(value||'').replace(/\s+/g,' ').trim();
  if(!clean)return '<span class="note-empty">Add note</span>';
  const short=clean.length>max?`${clean.slice(0,max-1)}…`:clean;
  return `<span class="note-preview">${escapeHtml(short)}</span>`;
}
function perfCell(v){return `<td class="perf ${pnlClass(v)}">${formatPercent(v)}</td>`;}
const TABLE_SIZE_STEPS=[70,80,90,100,110,120,130,140,150,160];
function clampTableScale(v){return Math.max(70,Math.min(160,Math.round(Number(v||100)/5)*5));}
function tableSizeKey(section){return `myfinance_table_size_${section}`;}
function tableColumnWidthKey(section){return `myfinance_column_widths_${section}`;}
function tableScrollKey(section){return `myfinance_table_scroll_${section}`;}
function tableLayoutStatusElement(section){
  return section==='holdings'?els.holdLayoutSavedStatus:els.watchLayoutSavedStatus;
}
let tableLayoutStatusTimers={holdings:null,watchlist:null};
function showTableLayoutSaved(section,message='✓ Saved'){
  const el=tableLayoutStatusElement(section);
  if(!el)return;
  el.textContent=message;
  el.classList.toggle('saving',message.includes('Saving'));
  el.classList.toggle('saved',message.includes('Saved'));
  if(tableLayoutStatusTimers[section])clearTimeout(tableLayoutStatusTimers[section]);
  if(message.includes('Saving')){
    tableLayoutStatusTimers[section]=setTimeout(()=>showTableLayoutSaved(section,'✓ Saved'),350);
  }
}
function markTableLayoutSaving(section){showTableLayoutSaved(section,'Saving…');}
function loadTableScroll(section){
  const value=Number(localStorage.getItem(tableScrollKey(section))||0);
  return Number.isFinite(value)&&value>=0?value:0;
}
function saveTableScroll(section,value){
  try{localStorage.setItem(tableScrollKey(section),String(Math.max(0,Math.round(Number(value)||0))));}catch{}
}
function tableScrollWrap(section){
  return document.querySelector(`[data-layout-scroll="${section}"]`);
}
function restoreTableScroll(section){
  const wrap=tableScrollWrap(section);
  if(!wrap)return;
  const saved=loadTableScroll(section);
  requestAnimationFrame(()=>{wrap.scrollLeft=Math.min(saved,Math.max(0,wrap.scrollWidth-wrap.clientWidth));});
}
const tableScrollSaveTimers={holdings:null,watchlist:null};
function bindTableScrollPersistence(section){
  const wrap=tableScrollWrap(section);
  if(!wrap||wrap.dataset.scrollPersistenceBound==='1')return;
  wrap.dataset.scrollPersistenceBound='1';
  wrap.addEventListener('scroll',()=>{
    if(tableScrollSaveTimers[section])clearTimeout(tableScrollSaveTimers[section]);
    tableScrollSaveTimers[section]=setTimeout(()=>{
      saveTableScroll(section,wrap.scrollLeft);
      showTableLayoutSaved(section,'✓ Saved');
    },180);
  },{passive:true});
}

function loadTableSize(section){
  try{
    const raw=JSON.parse(localStorage.getItem(tableSizeKey(section))||'null');
    return{row:clampTableScale(raw?.row),width:clampTableScale(raw?.width)};
  }catch{return{row:100,width:100};}
}
function saveTableSize(section,size){
  try{localStorage.setItem(tableSizeKey(section),JSON.stringify({row:clampTableScale(size.row),width:clampTableScale(size.width)}));markTableLayoutSaving(section);}catch{}
}
function loadColumnWidths(section){
  try{
    const raw=JSON.parse(localStorage.getItem(tableColumnWidthKey(section))||'{}');
    return raw&&typeof raw==='object'?raw:{};
  }catch{return{};}
}
function saveColumnWidths(section,widths){
  try{localStorage.setItem(tableColumnWidthKey(section),JSON.stringify(widths||{}));markTableLayoutSaving(section);}catch{}
}
function tableSectionElement(section){
  return section==='holdings'?$('holdingsSection'):$('watchlistSection');
}
function tableElementFor(section){
  return tableSectionElement(section)?.querySelector(section==='holdings'?'.holdings-table':'.watchlist-details-table')||null;
}
function tableSliderElements(section){
  return section==='holdings'
    ?{row:els.holdRowSlider,width:els.holdWidthSlider,rowLabel:els.holdRowSizeLabel,widthLabel:els.holdWidthSizeLabel}
    :{row:els.watchRowSlider,width:els.watchWidthSlider,rowLabel:els.watchRowSizeLabel,widthLabel:els.watchWidthSizeLabel};
}
function applyTableSize(section){
  const size=loadTableSize(section);
  const sectionEl=tableSectionElement(section);
  if(!sectionEl)return;
  const baseWidth=section==='holdings'?2050:1850;
  const baseVertical=10;
  const baseHorizontal=11;
  const rowPad=Math.max(5,Math.round(baseVertical*size.row/100));
  const colPad=Math.max(6,Math.round(baseHorizontal*size.width/100));
  const tableWidth=Math.round(baseWidth*size.width/100);
  sectionEl.style.setProperty('--user-row-pad',`${rowPad}px`);
  sectionEl.style.setProperty('--user-col-pad',`${colPad}px`);
  sectionEl.style.setProperty('--user-table-width',`${tableWidth}px`);
  const controls=tableSliderElements(section);
  if(controls.rowLabel)controls.rowLabel.textContent=`${size.row}%`;
  if(controls.widthLabel)controls.widthLabel.textContent=`${size.width}%`;
  if(controls.row)controls.row.value=String(size.row);
  if(controls.width)controls.width.value=String(size.width);
  applyStoredColumnWidths(section);
  bindTableScrollPersistence(section);
  restoreTableScroll(section);
  showTableLayoutSaved(section,'✓ Saved');
  scheduleDashboardHScrollRefresh();
}
function changeTableSize(section,dimension,direction){
  const size=loadTableSize(section);
  size[dimension]=clampTableScale(Number(size[dimension]||100)+(direction>0?10:-10));
  saveTableSize(section,size);
  applyTableSize(section);
}
function setTableSizeFromSlider(section,dimension,value){
  const size=loadTableSize(section);
  size[dimension]=clampTableScale(value);
  saveTableSize(section,size);
  applyTableSize(section);
}
function setColumnWidth(section,index,width){
  const table=tableElementFor(section);
  if(!table)return;
  const safe=Math.max(58,Math.min(620,Math.round(width)));
  table.querySelectorAll('tr').forEach(row=>{
    const cell=row.children[index];
    if(!cell)return;
    cell.style.width=`${safe}px`;
    cell.style.minWidth=`${safe}px`;
    cell.style.maxWidth=`${safe}px`;
  });
  if(section==='holdings'&&index===0){
    const assetLeft=safe;
    table.querySelectorAll('.asset-col').forEach(cell=>cell.style.left=`${assetLeft}px`);
  }
}
function applyStoredColumnWidths(section){
  const widths=loadColumnWidths(section);
  Object.keys(widths).forEach(k=>setColumnWidth(section,Number(k),Number(widths[k])));
  if(section==='holdings'&&!Object.prototype.hasOwnProperty.call(widths,'0')){
    const table=tableElementFor(section);
    table?.querySelectorAll('.asset-col').forEach(cell=>cell.style.left='100px');
  }
}
function resetSingleColumnWidth(section,index){
  const widths=loadColumnWidths(section);
  delete widths[String(index)];
  saveColumnWidths(section,widths);
  const table=tableElementFor(section);
  if(!table)return;
  table.querySelectorAll('tr').forEach(row=>{
    const cell=row.children[index];
    if(!cell)return;
    cell.style.removeProperty('width');
    cell.style.removeProperty('min-width');
    cell.style.removeProperty('max-width');
  });
  if(section==='holdings'&&index===0){
    table.querySelectorAll('.asset-col').forEach(cell=>cell.style.left='100px');
  }
  applyStoredColumnWidths(section);
  scheduleDashboardHScrollRefresh();
}
function installColumnResizers(section){
  const table=tableElementFor(section);
  if(!table)return;
  const headers=[...table.querySelectorAll('thead th')];
  headers.forEach((th,index)=>{
    if(th.querySelector('.column-resize-handle'))return;
    const handle=document.createElement('span');
    handle.className='column-resize-handle';
    handle.title='Drag left/right to resize this column · Double-click to reset';
    handle.setAttribute('aria-hidden','true');
    th.appendChild(handle);

    handle.addEventListener('pointerdown',event=>{
      event.preventDefault();
      event.stopPropagation();
      handle.setPointerCapture?.(event.pointerId);
      const startX=event.clientX;
      const startWidth=th.getBoundingClientRect().width;
      document.body.classList.add('column-resize-active');
      markTableLayoutSaving(section);

      const onMove=e=>{
        const width=Math.max(58,Math.min(620,startWidth+(e.clientX-startX)));
        setColumnWidth(section,index,width);
      };
      const onUp=e=>{
        handle.releasePointerCapture?.(event.pointerId);
        handle.removeEventListener('pointermove',onMove);
        handle.removeEventListener('pointerup',onUp);
        handle.removeEventListener('pointercancel',onUp);
        document.body.classList.remove('column-resize-active');
        const widths=loadColumnWidths(section);
        widths[String(index)]=Math.round(th.getBoundingClientRect().width);
        saveColumnWidths(section,widths);
        showTableLayoutSaved(section,'✓ Saved');
        scheduleDashboardHScrollRefresh();
      };
      handle.addEventListener('pointermove',onMove);
      handle.addEventListener('pointerup',onUp);
      handle.addEventListener('pointercancel',onUp);
    });

    handle.addEventListener('dblclick',event=>{
      event.preventDefault();
      event.stopPropagation();
      resetSingleColumnWidth(section,index);
      toast('Column width reset.','success');
    });
  });
  applyStoredColumnWidths(section);
}
function resetTableSize(section){
  saveTableSize(section,{row:100,width:100});
  saveColumnWidths(section,{});
  saveTableScroll(section,0);
  const table=tableElementFor(section);
  if(table){
    table.querySelectorAll('th,td').forEach(cell=>{
      cell.style.removeProperty('width');
      cell.style.removeProperty('min-width');
      cell.style.removeProperty('max-width');
    });
    if(section==='holdings')table.querySelectorAll('.asset-col').forEach(cell=>cell.style.left='100px');
  }
  applyTableSize(section);
  const wrap=tableScrollWrap(section);if(wrap)wrap.scrollLeft=0;
  showTableLayoutSaved(section,'✓ Saved');
  toast(`${section==='holdings'?'Holdings':'Watchlist'} saved table layout reset.`,'success');
}


function holdingSummarySubset(items,kind='ALL'){
  if(kind==='MF')return items.filter(h=>h.type==='MF');
  if(kind==='STOCKS')return items.filter(h=>h.type==='STOCK'||h.type==='ETF');
  return items;
}
function holdingsSummaryValues(items){
  const s=summarizeHoldings(items);
  return {
    invested:Number(s.invested||0),
    current:Number(s.current||0),
    gain:Number(s.gain||0),
    returnPct:Number(s.returnPct||0),
    count:items.length
  };
}
function setHoldingValueGrowth(prefix,items){
  const v=holdingsSummaryValues(items);
  const investedEl=els[`${prefix}Invested`];
  const currentEl=els[`${prefix}Current`];
  const growthEl=els[`${prefix}Growth`];
  if(investedEl)investedEl.textContent=formatCurrency(v.invested,true);
  if(currentEl)currentEl.textContent=formatCurrency(v.current,true);
  if(growthEl){
    const gain=`${v.gain>=0?'+':'-'}${formatCurrency(Math.abs(v.gain),true)}`;
    const pct=`${v.returnPct>=0?'+':''}${v.returnPct.toFixed(2)}%`;
    growthEl.textContent=`${gain} · ${pct}`;
    growthEl.classList.remove('positive','negative','neutral');
    const growthState=v.gain>0?'positive':v.gain<0?'negative':'neutral';
    growthEl.classList.add(growthState);
    const growthRow=growthEl.closest('.summary-metric');
    if(growthRow){
      growthRow.classList.remove('gain-positive','gain-negative','gain-neutral');
      growthRow.classList.add(`gain-${growthState}`);
    }
  }
}
function renderHoldingsSummary(){
  const all=[...state.holdings];
  const niharika=all.filter(h=>canonicalOwner(h.owner).toLowerCase().includes('niharika'));
  const sarada=all.filter(h=>canonicalOwner(h.owner).toLowerCase().includes('sarada'));

  setHoldingValueGrowth('holdSumCombinedTotal',all);
  setHoldingValueGrowth('holdSumCombinedMf',holdingSummarySubset(all,'MF'));
  setHoldingValueGrowth('holdSumCombinedStock',holdingSummarySubset(all,'STOCKS'));

  setHoldingValueGrowth('holdSumNiharikaTotal',niharika);
  setHoldingValueGrowth('holdSumNiharikaMf',holdingSummarySubset(niharika,'MF'));
  setHoldingValueGrowth('holdSumNiharikaStock',holdingSummarySubset(niharika,'STOCKS'));

  setHoldingValueGrowth('holdSumSaradaTotal',sarada);
  setHoldingValueGrowth('holdSumSaradaMf',holdingSummarySubset(sarada,'MF'));
  setHoldingValueGrowth('holdSumSaradaStock',holdingSummarySubset(sarada,'STOCKS'));
}

const STANDARD_COLUMN_DEFS={
  HOLDINGS:[
    {key:'investor',label:'Investor',index:0,locked:true},{key:'asset',label:'Asset',index:1,locked:true},
    {key:'purchaseDates',label:'Purchase Date(s)',index:2},{key:'saleDates',label:'Sale Date(s)',index:3},
    {key:'units',label:'Qty / Units',index:4},{key:'avgBuy',label:'Avg Buy',index:5},{key:'invested',label:'Invested',index:6},
    {key:'currentPrice',label:'Current Price / NAV',index:7},{key:'currentValue',label:'Current Value',index:8},
    {key:'gainLoss',label:'P/L Till Today',index:9},{key:'realizedPnl',label:'Realised P/L',index:10},{key:'totalPnl',label:'Total P/L to Date',index:11},
    {key:'gainPct',label:'Gain %',index:12},{key:'xirr',label:'XIRR',index:13},
    {key:'d1',label:'1D',index:14},{key:'w1',label:'1W',index:15},{key:'m1',label:'1M',index:16},{key:'m6',label:'6M',index:17},
    {key:'y1',label:'1Y',index:18},{key:'y3',label:'3Y',index:19},{key:'y5',label:'5Y',index:20},{key:'y10',label:'10Y',index:21},
    {key:'note',label:'Personal Note',index:22},{key:'actions',label:'Actions',index:23,locked:true}
  ],
  WATCHLIST:[
    {key:'asset',label:'Asset',index:0,locked:true},{key:'livePrice',label:'Live Price/NAV',index:1},{key:'dayPct',label:'Sheet Day %',index:2},
    {key:'target',label:'Target',index:3},{key:'distance',label:'Distance',index:4},{key:'highLow',label:'52W H/L',index:5},
    {key:'valuation',label:'P/E or P/B',index:6},{key:'m1',label:'1M',index:7},{key:'y1',label:'1Y',index:8},{key:'y3',label:'3Y',index:9},
    {key:'y5',label:'5Y',index:10},{key:'y10',label:'10Y',index:11},{key:'remark',label:'Remark / Moat',index:12},
    {key:'note',label:'Personal Note',index:13},{key:'actions',label:'Actions',index:14,locked:true}
  ]
};

const HOLDINGS_VIEW_PRESETS={
  RESULT:['investor','asset','purchaseDates','saleDates','units','avgBuy','invested','currentPrice','currentValue','gainLoss','realizedPnl','totalPnl','gainPct','xirr','note','actions'],
  PERFORMANCE:['investor','asset','currentPrice','gainPct','xirr','d1','w1','m1','m6','y1','y3','y5','y10','note','actions'],
  COMPACT:['investor','asset','currentValue','gainLoss','totalPnl','gainPct','note','actions'],
  FULL:(STANDARD_COLUMN_DEFS.HOLDINGS||[]).map(x=>x.key)
};
const HOLDINGS_TRANSACTION_KEYS=new Set(['purchaseDates','saleDates']);
const HOLDINGS_RESULT_KEYS=new Set(['units','avgBuy','invested','currentPrice','currentValue','gainLoss','realizedPnl','totalPnl','gainPct','xirr']);
const HOLDINGS_PERFORMANCE_KEYS=new Set(['d1','w1','m1','m6','y1','y3','y5','y10']);

function holdingsDefaultViewKey(){return `myfinance_holdings_default_view_${state.username||'local'}`;}
function watchDefaultViewKey(){return `myfinance_watch_default_view_${state.username||'local'}`;}
function currentStandardSettingsSnapshot(section){return JSON.parse(JSON.stringify(loadStandardColumnSettings(section)||{}));}
function applyPresetSettings(section,visibleKeys){
  const defs=STANDARD_COLUMN_DEFS[section]||[],current=loadStandardColumnSettings(section),set=new Set(visibleKeys||[]);
  defs.forEach(def=>current[def.key]={...(current[def.key]||{}),visible:def.locked?true:set.has(def.key)});
  saveStandardColumnSettings(section,current);
}
function holdingsPresetFromCurrent(){
  const settings=loadStandardColumnSettings('HOLDINGS'),defs=STANDARD_COLUMN_DEFS.HOLDINGS||[];
  const visible=defs.filter(d=>d.locked||settings[d.key]?.visible!==false).map(d=>d.key).sort().join('|');
  for(const [name,keys] of Object.entries(HOLDINGS_VIEW_PRESETS)){
    if([...keys].sort().join('|')===visible)return name;
  }
  return 'CUSTOM';
}
function setHoldingsViewPreset(name,{render=true}={}){
  const preset=HOLDINGS_VIEW_PRESETS[name];if(!preset)return;
  applyPresetSettings('HOLDINGS',preset);
  if(els.holdingsViewPreset)els.holdingsViewPreset.value=name;
  if(render)renderHoldings();
}
function holdingsViewSnapshot(){
  return {settings:currentStandardSettingsSnapshot('HOLDINGS'),filters:{
    type:els.holdingTypeFilter?.value||'ALL',result:els.holdingResultFilter?.value||'ALL',
    notes:els.holdingNotesFilter?.value||'ALL',trade:els.holdingTradeFilter?.value||'ALL'
  },preset:holdingsPresetFromCurrent(),savedAt:Date.now()};
}
function saveHoldingsDefaultView(){
  try{
    localStorage.setItem(holdingsDefaultViewKey(),JSON.stringify(holdingsViewSnapshot()));
    if(els.holdingsDefaultViewStatus)els.holdingsDefaultViewStatus.textContent='★ Default view saved';
    toast('Current Holdings columns and filters saved as your default view.','success');
  }catch{toast('Could not save the default Holdings view.','error');}
}
function applyHoldingsSnapshot(saved,{toastUser=false}={}){
  if(!saved||typeof saved!=='object')return false;
  if(saved.settings)saveStandardColumnSettings('HOLDINGS',saved.settings);
  const f=saved.filters||{};
  if(els.holdingTypeFilter)els.holdingTypeFilter.value=f.type||'ALL';
  if(els.holdingResultFilter)els.holdingResultFilter.value=f.result||'ALL';
  if(els.holdingNotesFilter)els.holdingNotesFilter.value=f.notes||'ALL';
  if(els.holdingTradeFilter)els.holdingTradeFilter.value=f.trade||'ALL';
  if(els.holdingsViewPreset)els.holdingsViewPreset.value=saved.preset||holdingsPresetFromCurrent();
  renderHoldings();
  if(els.holdingsDefaultViewStatus)els.holdingsDefaultViewStatus.textContent='✓ Saved default applied';
  if(toastUser)toast('Saved Holdings default view restored.','success');
  return true;
}
function restoreHoldingsDefaultView(toastUser=true){
  try{
    const saved=JSON.parse(localStorage.getItem(holdingsDefaultViewKey())||'null');
    if(saved)return applyHoldingsSnapshot(saved,{toastUser});
  }catch{}
  if(!localStorage.getItem(standardColumnSettingsKey('HOLDINGS')))setHoldingsViewPreset('RESULT',{render:false});
  if(els.holdingsViewPreset)els.holdingsViewPreset.value=holdingsPresetFromCurrent();
  if(toastUser){renderHoldings();toast('No saved default yet. Recommended view is My Investment Result.','info');}
  return false;
}
function resetHoldingsView(){
  if(els.holdingSearch)els.holdingSearch.value='';
  if(els.holdingTypeFilter)els.holdingTypeFilter.value='ALL';
  if(els.holdingResultFilter)els.holdingResultFilter.value='ALL';
  if(els.holdingNotesFilter)els.holdingNotesFilter.value='ALL';
  if(els.holdingTradeFilter)els.holdingTradeFilter.value='ALL';
  setHoldingsViewPreset('RESULT',{render:false});renderHoldings();
  if(els.holdingsDefaultViewStatus)els.holdingsDefaultViewStatus.textContent='Recommended view active';
  toast('Holdings reset to My Investment Result view.','success');
}
function saveWatchDefaultView(){
  const payload={settings:currentStandardSettingsSnapshot('WATCHLIST'),filters:{
    type:els.watchTypeFilter?.value||'ALL',priority:els.watchPriorityFilter?.value||'ALL',
    target:els.watchTargetFilter?.value||'ALL',notes:els.watchNotesFilter?.value||'ALL'
  },savedAt:Date.now()};
  try{
    localStorage.setItem(watchDefaultViewKey(),JSON.stringify(payload));
    if(els.watchDefaultViewStatus)els.watchDefaultViewStatus.textContent='★ Default view saved';
    toast('Current Watchlist columns and filters saved as your default view.','success');
  }catch{toast('Could not save Watchlist default view.','error');}
}
function restoreWatchDefaultView(toastUser=true){
  try{
    const saved=JSON.parse(localStorage.getItem(watchDefaultViewKey())||'null');
    if(saved){
      if(saved.settings)saveStandardColumnSettings('WATCHLIST',saved.settings);
      const f=saved.filters||{};
      if(els.watchTypeFilter)els.watchTypeFilter.value=f.type||'ALL';
      if(els.watchPriorityFilter)els.watchPriorityFilter.value=f.priority||'ALL';
      if(els.watchTargetFilter)els.watchTargetFilter.value=f.target||'ALL';
      if(els.watchNotesFilter)els.watchNotesFilter.value=f.notes||'ALL';
      renderWatchlist();
      if(els.watchDefaultViewStatus)els.watchDefaultViewStatus.textContent='✓ Saved default applied';
      if(toastUser)toast('Saved Watchlist default view restored.','success');
      return true;
    }
  }catch{}
  return false;
}
function standardColumnSettingsKey(section){return `myfinance_standard_columns_${section}`;}
function loadStandardColumnSettings(section){
  try{
    const stored=localStorage.getItem(standardColumnSettingsKey(section));
    const raw=stored?JSON.parse(stored):{};
    if(raw&&typeof raw==='object'&&Object.keys(raw).length)return raw;
    if(section==='HOLDINGS'){
      const visible=new Set(HOLDINGS_VIEW_PRESETS.RESULT),settings={};
      (STANDARD_COLUMN_DEFS.HOLDINGS||[]).forEach(def=>settings[def.key]={visible:def.locked?true:visible.has(def.key)});
      return settings;
    }
    return {};
  }catch{return{};}
}
function saveStandardColumnSettings(section,settings){
  try{localStorage.setItem(standardColumnSettingsKey(section),JSON.stringify(settings||{}));}catch{}
}
function sectionCustomColumns(section){
  return state.customColumns.filter(c=>String(c.section).toUpperCase()===section).sort((a,b)=>Number(a.sortOrder||100)-Number(b.sortOrder||100)||String(a.label).localeCompare(String(b.label)));
}
function customValueFor(section,recordId,columnKey){
  return state.customValues.find(v=>String(v.section).toUpperCase()===section&&String(v.recordId)===String(recordId)&&String(v.columnKey)===String(columnKey))?.value||'';
}
function customColumnByKey(section,key){
  return sectionCustomColumns(section).find(c=>String(c.columnKey)===String(key))||null;
}
function formatCustomValuePlain(column,value){
  if(value==null||String(value)==='')return '—';
  const type=String(column?.dataType||'TEXT').toUpperCase();
  if(type==='CURRENCY')return formatCurrency(Number(value));
  if(type==='PERCENT')return `${Number(value)>=0?'+':''}${Number(value).toFixed(2)}%`;
  if(type==='NUMBER')return Number(value).toLocaleString('en-IN',{maximumFractionDigits:4});
  if(type==='DATE')return detailDate(value);
  return String(value);
}
function formatCustomValue(column,value){
  const plain=formatCustomValuePlain(column,value);
  return String(column?.dataType||'TEXT').toUpperCase()==='TEXT'?escapeHtml(plain):plain;
}
function customCellsHtml(section,recordId){
  return sectionCustomColumns(section).map(c=>{
    const raw=customValueFor(section,recordId,c.columnKey);
    const shown=formatCustomValue(c,raw);
    return `<td class="custom-value-cell" data-custom-cell="1" data-custom-section="${section}" data-custom-record="${escapeHtml(recordId)}" data-custom-key="${escapeHtml(c.columnKey)}" title="Click to edit ${escapeHtml(c.label)}"><span>${shown}</span><i>✎</i></td>`;
  }).join('');
}
function resetCustomHeaders(section){
  const row=$(section==='HOLDINGS'?'holdingsHeadRow':'watchHeadRow');
  row?.querySelectorAll('.custom-column-head').forEach(x=>x.remove());
}
function appendCustomHeaders(section){
  const row=$(section==='HOLDINGS'?'holdingsHeadRow':'watchHeadRow');
  if(!row)return;
  resetCustomHeaders(section);
  const actionHead=row.lastElementChild;
  sectionCustomColumns(section).forEach(c=>{
    const th=document.createElement('th');
    th.className='custom-column-head';
    th.dataset.customKey=c.columnKey;
    th.textContent=c.label;
    th.title=`Custom parameter · ${c.dataType}`;
    row.insertBefore(th,actionHead);
  });
}
function applyStandardColumnSettings(section){
  const table=tableElementFor(section.toLowerCase());
  if(!table)return;
  const defs=STANDARD_COLUMN_DEFS[section]||[];
  const settings=loadStandardColumnSettings(section);
  const headerRow=table.querySelector('thead tr');
  const customCount=sectionCustomColumns(section).length;
  defs.forEach(def=>{
    let index=def.index;
    if(def.key==='actions'&&customCount)index=def.index+customCount;
    const cfg=settings[def.key]||{};
    const cells=[...table.querySelectorAll('tr')].map(r=>r.children[index]).filter(Boolean);
    cells.forEach((cell,rowIndex)=>{
      cell.classList.toggle('column-user-hidden',cfg.visible===false&&!def.locked);
      if(rowIndex===0&&!cell.classList.contains('custom-column-head')){
        const label=String(cfg.label||def.label);
        if(def.key!=='actions')cell.childNodes[0] && (cell.childNodes[0].nodeValue=label);
      }
    });
  });
}

function applyHoldingsSemanticGroups(){
  const table=tableElementFor('holdings');if(!table)return;
  const defs=STANDARD_COLUMN_DEFS.HOLDINGS||[],customCount=sectionCustomColumns('HOLDINGS').length;
  defs.forEach(def=>{
    let index=def.index;if(def.key==='actions'&&customCount)index+=customCount;
    [...table.querySelectorAll('tr')].forEach(row=>{
      const cell=row.children[index];if(!cell)return;
      cell.classList.remove('trade-history-column','my-result-column','asset-performance-column','group-start');
      if(HOLDINGS_TRANSACTION_KEYS.has(def.key))cell.classList.add('trade-history-column');
      if(HOLDINGS_RESULT_KEYS.has(def.key))cell.classList.add('my-result-column');
      if(HOLDINGS_PERFORMANCE_KEYS.has(def.key))cell.classList.add('asset-performance-column');
      if(['purchaseDates','units','d1'].includes(def.key))cell.classList.add('group-start');
    });
  });
}
function renderStandardColumnsManager(section){
  if(!els.standardColumnsList)return;
  const settings=loadStandardColumnSettings(section);
  els.standardColumnsList.innerHTML=(STANDARD_COLUMN_DEFS[section]||[]).filter(d=>d.key!=='actions').map(def=>{
    const cfg=settings[def.key]||{};
    const visible=def.locked?true:cfg.visible!==false;
    return `<div class="column-config-row ${def.locked?'locked':''}" data-standard-column="${escapeHtml(def.key)}">
      <label class="column-visible-toggle"><input type="checkbox" data-standard-visible="${escapeHtml(def.key)}" ${visible?'checked':''} ${def.locked?'disabled':''}><span>${def.locked?'Required':'Show'}</span></label>
      <input class="column-label-input" data-standard-label="${escapeHtml(def.key)}" value="${escapeHtml(String(cfg.label||def.label))}" maxlength="80" ${def.locked&&def.key==='asset'?'':''}>
    </div>`;
  }).join('');
}
function resetCustomColumnForm(section=els.customColumnSection?.value||'HOLDINGS'){
  if(!els.customColumnForm)return;
  els.customColumnForm.reset();
  els.customColumnId.value='';
  els.customColumnSection.value=section;
  els.customColumnType.value='TEXT';
  els.customColumnOrder.value=String((sectionCustomColumns(section).length+1)*10);
  els.customColumnKey.disabled=false;
  els.saveCustomColumnBtn.textContent='Add column';
}
function renderCustomColumnsManager(section){
  const items=sectionCustomColumns(section);
  if(els.customColumnCount)els.customColumnCount.textContent=`${items.length} custom`;
  els.customColumnsEmpty?.classList.toggle('hidden',items.length>0);
  if(els.customColumnsList)els.customColumnsList.innerHTML=items.map(c=>`<div class="column-config-row custom" data-custom-column-id="${escapeHtml(c.id)}">
    <div class="custom-column-info"><strong>${escapeHtml(c.label)}</strong><span>${escapeHtml(c.columnKey)} · ${escapeHtml(c.dataType)} · order ${Number(c.sortOrder||100)}</span></div>
    <div class="column-config-actions"><button type="button" class="small-button" data-edit-custom-column="${escapeHtml(c.id)}">Edit</button><button type="button" class="small-button danger" data-delete-custom-column="${escapeHtml(c.id)}">Delete</button></div>
  </div>`).join('');
}
function renderColumnManager(section=els.customColumnSection?.value||'HOLDINGS'){
  if(els.customColumnSection)els.customColumnSection.value=section;
  if(els.columnManagerTitle)els.columnManagerTitle.textContent=`Manage ${section==='HOLDINGS'?'Holdings':'Watchlist'} columns`;
  renderStandardColumnsManager(section);
  renderCustomColumnsManager(section);
}
function openColumnManager(section){
  resetCustomColumnForm(section);
  renderColumnManager(section);
  openModal('columnManagerModal');
}
function editCustomColumn(id){
  const c=state.customColumns.find(x=>x.id===id);
  if(!c)return;
  els.customColumnId.value=c.id;
  els.customColumnSection.value=c.section;
  els.customColumnLabel.value=c.label;
  els.customColumnKey.value=c.columnKey;
  els.customColumnKey.disabled=true;
  els.customColumnType.value=c.dataType||'TEXT';
  els.customColumnOrder.value=String(c.sortOrder||100);
  els.saveCustomColumnBtn.textContent='Update column';
  renderColumnManager(c.section);
  setTimeout(()=>els.customColumnLabel?.focus(),30);
}
async function saveCustomColumn(event){
  event.preventDefault();
  const button=els.saveCustomColumnBtn;
  setBusy(button,true,'Saving…');
  try{
    const result=await api('saveCustomColumn',{column:{
      id:els.customColumnId.value,
      section:els.customColumnSection.value,
      label:els.customColumnLabel.value.trim(),
      columnKey:els.customColumnKey.value.trim(),
      dataType:els.customColumnType.value,
      sortOrder:Number(els.customColumnOrder.value)||100
    }});
    const section=els.customColumnSection.value;
    saveColumnWidths(section.toLowerCase(),{});
    clearPrintLayout(section.toLowerCase());
    applyBootstrap(result.data);saveCache(result.data);
    resetCustomColumnForm(section);renderColumnManager(section);
    toast('Custom column saved. Column widths reset once so the new structure fits correctly.','success');
  }catch(e){toast(e.message,'error');}
  finally{setBusy(button,false);}
}
async function deleteCustomColumn(id){
  const c=state.customColumns.find(x=>x.id===id);
  if(!c||!confirm(`Delete custom column “${c.label}” and its saved values?`))return;
  try{
    const result=await api('deleteCustomColumn',{id});
    saveColumnWidths(c.section.toLowerCase(),{});
    clearPrintLayout(c.section.toLowerCase());
    applyBootstrap(result.data);saveCache(result.data);renderColumnManager(c.section);
    toast('Custom column deleted. Column widths reset once so the remaining columns align correctly.','success');
  }catch(e){toast(e.message,'error');}
}
function openCustomValueEditor(section,recordId,columnKey){
  const c=customColumnByKey(section,columnKey);
  if(!c)return;
  const record=section==='HOLDINGS'?state.holdings.find(x=>x.id===recordId):state.watchlist.find(x=>x.id===recordId);
  if(!record)return;
  els.customValueSection.value=section;
  els.customValueRecordId.value=recordId;
  els.customValueColumnKey.value=columnKey;
  els.customValueTitle.textContent=c.label;
  els.customValueRecord.textContent=record.assetName||record.code||'Selected row';
  els.customValueFieldLabel.firstChild.nodeValue=`${c.label} `;
  els.customValueInput.type=c.dataType==='DATE'?'date':(['NUMBER','CURRENCY','PERCENT'].includes(c.dataType)?'number':'text');
  els.customValueInput.step=['NUMBER','CURRENCY','PERCENT'].includes(c.dataType)?'any':'';
  els.customValueInput.value=customValueFor(section,recordId,columnKey);
  openModal('customValueModal');
  setTimeout(()=>els.customValueInput?.focus(),50);
}
async function saveCustomValue(event){
  event.preventDefault();
  const button=els.saveCustomValueBtn;
  setBusy(button,true,'Saving…');
  try{
    const result=await api('saveCustomValue',{
      section:els.customValueSection.value,
      recordId:els.customValueRecordId.value,
      columnKey:els.customValueColumnKey.value,
      value:els.customValueInput.value
    });
    closeModals();applyBootstrap(result.data);saveCache(result.data);
    toast('Custom value saved.','success');
  }catch(e){toast(e.message,'error');}
  finally{setBusy(button,false);}
}
function saveStandardColumnChange(section,key,patch){
  const defs=STANDARD_COLUMN_DEFS[section]||[];
  const def=defs.find(d=>d.key===key);
  if(!def)return;
  const settings=loadStandardColumnSettings(section);
  settings[key]={...(settings[key]||{}),...patch};
  if(def.locked)settings[key].visible=true;
  saveStandardColumnSettings(section,settings);
  if(section==='HOLDINGS')renderHoldings();else renderWatchlist();
  renderStandardColumnsManager(section);
}
function resetStandardColumns(section){
  try{localStorage.removeItem(standardColumnSettingsKey(section));}catch{}
  if(section==='HOLDINGS')renderHoldings();else renderWatchlist();
  renderStandardColumnsManager(section);
  toast('Standard column names and visibility reset.','success');
}


function exactDateList(values){
  return [...new Set((Array.isArray(values)?values:[]).map(x=>String(x||'').trim()).filter(Boolean))].sort();
}

function parseNavDate(value){
  if(!value)return null;
  if(value instanceof Date)return Number.isNaN(value.getTime())?null:value;
  const raw=String(value).trim();
  let d=null;
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw))d=new Date(raw+'T00:00:00');
  else if(/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(raw)){
    const [dd,mon,yyyy]=raw.split('-');
    const months={JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
    d=new Date(Number(yyyy),months[String(mon).toUpperCase()]??0,Number(dd),0,0,0);
  }else d=new Date(raw);
  return d&&Number.isFinite(d.getTime())?d:null;
}
function businessDayLag(value){
  const d=parseNavDate(value);
  if(!d)return null;
  const end=new Date();end.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  if(d>=end)return 0;
  let count=0,cursor=new Date(d);
  while(cursor<end&&count<40){
    cursor.setDate(cursor.getDate()+1);
    const day=cursor.getDay();
    if(day!==0&&day!==6)count++;
  }
  return count;
}
function mfNavStatus(item){
  if(String(item?.type||'').toUpperCase()!=='MF')return {cls:'',label:'',title:''};
  if(item.manualOverride||String(item.priceSource||'').toLowerCase().includes('manual')){
    return {cls:'manual',label:'MANUAL OVERRIDE',title:'A manual NAV is overriding the automatic AMFI NAV for this row.'};
  }
  if(item.currentPrice==null||!Number.isFinite(Number(item.currentPrice))){
    return {cls:'stale',label:'NAV PENDING',title:'No usable MF NAV is available yet. The backend automatically tries AMFI and then MFAPI fallback.'};
  }
  const lag=businessDayLag(item.priceDate);
  if(lag===null){
    return {cls:'stale',label:'DATE UNKNOWN',title:'NAV is present but the AMFI NAV date is missing.'};
  }
  if(lag>2){
    return {cls:'stale',label:`STALE NAV · ${lag} business days`,title:`Latest NAV date: ${detailDate(item.priceDate)}`};
  }
  return {cls:'fresh',label:`AMFI · ${detailDate(item.priceDate)}`,title:`Automatic AMFI NAV is current (${lag} business-day lag).`};
}
function priceCellHtml(item){
  const status=mfNavStatus(item);
  const source=escapeHtml(item.priceSource||'Pending');
  const date=item.priceDate?` · ${escapeHtml(detailDate(item.priceDate))}`:'';
  if(String(item.type||'').toUpperCase()!=='MF'){
    return `${formatCurrency(item.currentPrice)}<span class="price-note">${source}${date}</span>`;
  }
  return `${formatCurrency(item.currentPrice)}<span class="price-note">${source}${date}</span><span class="mf-nav-status ${status.cls}" title="${escapeHtml(status.title)}">${escapeHtml(status.label)}</span>`;
}
function renderMfNavHealth(){
  if(!els.mfNavHealthBadge)return;
  const all=[...(state.holdings||[]),...(state.watchlist||[])].filter(x=>String(x.type||'').toUpperCase()==='MF');
  if(!all.length){
    els.mfNavHealthBadge.textContent='No MF tracked';
    els.mfNavHealthBadge.className='mf-nav-health neutral';
    return;
  }
  let fresh=0,stale=0,manual=0,pending=0;
  all.forEach(x=>{
    const s=mfNavStatus(x);
    if(s.cls==='fresh')fresh++;
    else if(s.cls==='manual')manual++;
    else if(String(s.label).includes('PENDING'))pending++;
    else stale++;
  });
  const parts=[`${fresh} fresh`];
  if(stale)parts.push(`${stale} stale`);
  if(pending)parts.push(`${pending} pending`);
  if(manual)parts.push(`${manual} manual`);
  els.mfNavHealthBadge.textContent=`MF NAV · ${parts.join(' · ')}`;
  els.mfNavHealthBadge.className=`mf-nav-health ${(stale||pending)?'stale':manual?'manual':'fresh'}`;
}
function holdingPurchaseDatesHtml(h){
  const s=h?.transactionStats||{};
  const dates=exactDateList(s.purchaseDates);
  if(!dates.length&&h.buyDate)dates.push(String(h.buyDate));
  if(!dates.length){
    return `<div class="trade-date-missing"><strong>No transaction date</strong><span>${h.type==='MF'?'Import MF transaction statement':'Import broker tradebook'}</span></div>`;
  }
  const first=dates[0],latest=dates[dates.length-1];
  if(dates.length===1){
    return `<div class="trade-date-stack purchase"><strong>${escapeHtml(detailDate(first))}</strong><span>Exact BUY date</span></div>`;
  }
  return `<div class="trade-date-stack purchase" title="${escapeHtml(dates.map(detailDate).join(' · '))}">
    <strong>${escapeHtml(detailDate(first))}</strong><span>First BUY</span>
    <strong>${escapeHtml(detailDate(latest))}</strong><span>Latest BUY · ${dates.length} dates</span>
  </div>`;
}
function holdingSaleDatesHtml(h){
  const s=h?.transactionStats||{};
  const dates=exactDateList(s.saleDates);
  if(!dates.length)return `<div class="trade-date-stack no-sale"><strong>—</strong><span>No sale/redemption recorded</span></div>`;
  const latest=dates[dates.length-1];
  return `<div class="trade-date-stack sale" title="${escapeHtml(dates.map(detailDate).join(' · '))}">
    <strong>${escapeHtml(detailDate(latest))}</strong>
    <span>${dates.length===1?'Exact SALE date':`Latest SALE · ${dates.length} sale dates`}</span>
  </div>`;
}
function pnlMoneyHtml(value,options={}){
  const complete=options.complete!==false;
  if(value===null||value===undefined||!Number.isFinite(Number(value))){
    return `<span class="holding-pnl-pill neutral" title="${escapeHtml(options.title||'Value unavailable')}">—</span>`;
  }
  const n=Number(value),cls=n>0?'profit':n<0?'loss':'neutral';
  return `<span class="holding-pnl-pill ${cls}" ${complete?'':`title="Partial/incomplete transaction history"`}>${escapeHtml(formatCurrency(n,true))}${complete?'':' *'}</span>`;
}
function setPnlSummaryValue(el,value,complete=true){
  if(!el)return;
  el.classList.remove('profit','loss','neutral','partial');
  if(value===null||value===undefined||!Number.isFinite(Number(value))){
    el.textContent='—';el.classList.add('neutral');return;
  }
  const n=Number(value);
  el.textContent=formatCurrency(n,true)+(complete?'':' *');
  el.classList.add(n>0?'profit':n<0?'loss':'neutral');
  if(!complete)el.classList.add('partial');
}
function renderHoldingsPnlStrip(items){
  if(!els.holdCurrentPnlToday)return;
  const rows=Array.isArray(items)?items:[];
  const currentKnown=rows.filter(h=>h.gainLoss!==null&&h.gainLoss!==undefined&&Number.isFinite(Number(h.gainLoss)));
  const current=currentKnown.reduce((sum,h)=>sum+Number(h.gainLoss||0),0);
  let realised=0,realisedComplete=true;
  rows.forEach(h=>{
    const s=h.transactionStats||{};
    if(Number(s.saleCount||0)>0&&s.realizedPnlComplete===false)realisedComplete=false;
    if(h.realizedPnl!==null&&h.realizedPnl!==undefined&&Number.isFinite(Number(h.realizedPnl)))realised+=Number(h.realizedPnl);
  });
  const totalComplete=realisedComplete&&currentKnown.length===rows.length;
  const total=totalComplete?current+realised:null;
  const covered=rows.filter(h=>Number(h.transactionStats?.transactionCount||0)>0||h.buyDate).length;
  setPnlSummaryValue(els.holdCurrentPnlToday,currentKnown.length?current:null,currentKnown.length===rows.length);
  setPnlSummaryValue(els.holdRealizedPnl,realised,realisedComplete);
  setPnlSummaryValue(els.holdTotalPnlToDate,total,totalComplete);
  els.holdTradeDateCoverage.textContent=`${covered} / ${rows.length}`;
  const priceDates=rows.map(h=>String(h.priceDate||'')).filter(Boolean).sort();
  const latestPriceDate=priceDates.length?priceDates[priceDates.length-1]:'';
  els.holdPnlAsOf.textContent=latestPriceDate?`*Latest available price/NAV date: ${detailDate(latestPriceDate)}`:'*Using latest available price/NAV; some prices may be pending';
}
function drawerExactDatesBlock(label,dates,kind){
  const list=exactDateList(dates);
  if(!list.length)return `<div class="drawer-date-list ${kind}"><span>${escapeHtml(label)}</span><em>None recorded</em></div>`;
  return `<div class="drawer-date-list ${kind}"><span>${escapeHtml(label)}</span><div>${list.map(d=>`<b>${escapeHtml(detailDate(d))}</b>`).join('')}</div></div>`;
}

const HOLDINGS_SUMMARY_PREF_KEY='myfinance_holdings_summary_open_v1';

function holdingsSummaryOpenPreference(){
  // Default is hidden. Once the user chooses, remember the preference.
  try{return localStorage.getItem(HOLDINGS_SUMMARY_PREF_KEY)==='1';}catch{return false;}
}
function saveHoldingsSummaryPreference(open){
  try{localStorage.setItem(HOLDINGS_SUMMARY_PREF_KEY,open?'1':'0');}catch{}
}
function applyHoldingsSummaryState(open,{save=false,scroll=false}={}){
  const panel=els.holdingsSummaryPanel;
  const btn=els.toggleHoldingsSummaryBtn;
  if(!panel||!btn)return;

  panel.classList.toggle('is-collapsed',!open);
  panel.setAttribute('aria-hidden',open?'false':'true');

  btn.setAttribute('aria-expanded',open?'true':'false');
  btn.textContent=open?'▴ Hide Holding Summary':'▾ Show Holding Summary';
  btn.classList.toggle('active',open);

  if(save)saveHoldingsSummaryPreference(open);

  if(open&&scroll){
    requestAnimationFrame(()=>{
      const top=panel.getBoundingClientRect().top+window.scrollY-84;
      window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
    });
  }

  setTimeout(scheduleDashboardHScrollRefresh,180);
}
function toggleHoldingsSummary(){
  const open=els.holdingsSummaryPanel?.classList.contains('is-collapsed');
  applyHoldingsSummaryState(Boolean(open),{save:true,scroll:Boolean(open)});
}
function hideHoldingsSummary(){
  applyHoldingsSummaryState(false,{save:true});
}
function restoreHoldingsSummaryState(){
  // Requested default on both desktop and mobile: start collapsed every fresh page/login.
  // The existing Show/Hide button still works normally during the session.
  applyHoldingsSummaryState(false,{save:false});
}


function inlineHoldingEditorHtml(h){
  const owners=configuredOwners();
  const currentOwner=canonicalOwner(h.owner);
  const ownerList=owners.includes(currentOwner)?owners:[currentOwner,...owners].filter(Boolean);
  const ownerOptions=ownerList.map(o=>`<option value="${escapeHtml(o)}"${currentOwner===o?' selected':''}>${escapeHtml(shortOwner(o))}</option>`).join('');
  const typeOptions=['MF','STOCK','ETF','OTHER'].map(t=>`<option value="${t}"${h.type===t?' selected':''}>${t==='MF'?'Mutual Fund':t==='STOCK'?'Stock':t==='ETF'?'ETF':'Other'}</option>`).join('');

  return `<tr class="inline-holding-edit-row" data-inline-editor-row="${escapeHtml(h.id)}">
    <td colspan="99">
      <div class="inline-holding-editor">
        <div class="inline-editor-head">
          <div>
            <strong>Direct row edit</strong>
            <span>Edit the main investment fields here. The normal Edit button remains available for the full popup.</span>
          </div>
          <div class="inline-editor-head-actions">
            <button type="button" class="small-button" data-inline-cancel-holding="${escapeHtml(h.id)}">Cancel</button>
            <button type="button" class="primary-button inline-save-button" data-inline-save-holding="${escapeHtml(h.id)}">Save row</button>
          </div>
        </div>

        <div class="inline-editor-grid">
          <label>Investor
            <select data-inline-field="owner">${ownerOptions}</select>
          </label>

          <label>Type
            <select data-inline-field="type">${typeOptions}</select>
          </label>

          <label class="inline-wide">Asset / Scheme Name
            <input data-inline-field="assetName" type="text" maxlength="160" value="${escapeHtml(h.assetName||'')}">
          </label>

          <label>Code / AMFI
            <input data-inline-field="code" type="text" maxlength="80" value="${escapeHtml(h.code||'')}">
          </label>

          <label>Exchange
            <select data-inline-field="exchange">
              <option value=""${!h.exchange?' selected':''}>—</option>
              <option value="NSE"${h.exchange==='NSE'?' selected':''}>NSE</option>
              <option value="BSE"${h.exchange==='BSE'?' selected':''}>BSE</option>
            </select>
          </label>

          <label>Units / Qty
            <input data-inline-field="units" type="number" min="0.00000001" step="any" value="${escapeHtml(h.units??'')}">
          </label>

          <label>Invested Amount
            <input data-inline-field="investedAmount" type="number" min="0" step="0.01" value="${escapeHtml(h.investedAmount??'')}">
          </label>

          <label>Manual Price / NAV
            <input data-inline-field="manualPrice" type="number" min="0" step="any" value="${escapeHtml(h.manualPrice??'')}">
          </label>

          <label>Buy Date
            <input data-inline-field="buyDate" type="date" value="${escapeHtml(h.buyDate||'')}">
          </label>

          <label class="inline-note">Personal Note
            <textarea data-inline-field="notes" rows="2" maxlength="500">${escapeHtml(h.notes||'')}</textarea>
          </label>
        </div>
      </div>
    </td>
  </tr>`;
}

function inlineEditorRow(id){
  return Array.from(document.querySelectorAll('[data-inline-editor-row]'))
    .find(row=>String(row.dataset.inlineEditorRow)===String(id))||null;
}

function openInlineHoldingEdit(id){
  const wrap=tableScrollWrap('holdings');
  const left=wrap?.scrollLeft||0;
  state.inlineEditHoldingId=String(id||'');
  renderHoldings();
  requestAnimationFrame(()=>{
    const nextWrap=tableScrollWrap('holdings');
    if(nextWrap)nextWrap.scrollLeft=left;
    const row=inlineEditorRow(state.inlineEditHoldingId);
    row?.scrollIntoView({block:'nearest',behavior:'smooth'});
    row?.querySelector('[data-inline-field="assetName"]')?.focus();
  });
}

function closeInlineHoldingEdit(){
  const wrap=tableScrollWrap('holdings');
  const left=wrap?.scrollLeft||0;
  state.inlineEditHoldingId='';
  renderHoldings();
  requestAnimationFrame(()=>{
    const nextWrap=tableScrollWrap('holdings');
    if(nextWrap)nextWrap.scrollLeft=left;
  });
}

async function saveInlineHolding(id,button){
  const h=state.holdings.find(x=>String(x.id)===String(id));
  const row=inlineEditorRow(id);
  if(!h||!row)return;

  const value=name=>row.querySelector(`[data-inline-field="${name}"]`)?.value ?? '';
  const assetName=String(value('assetName')).trim();
  const code=String(value('code')).trim().toUpperCase();
  const units=Number(value('units'));
  const investedAmount=Number(value('investedAmount'));
  const manualRaw=value('manualPrice');
  const manualPrice=manualRaw===''?null:Number(manualRaw);

  if(!assetName){toast('Asset / Scheme Name is required.','error');return;}
  if(!code){toast('Code / AMFI is required.','error');return;}
  if(!Number.isFinite(units)||units<=0){toast('Units / Qty must be greater than zero.','error');return;}
  if(!Number.isFinite(investedAmount)||investedAmount<0){toast('Enter a valid Invested Amount.','error');return;}
  if(manualPrice!==null&&(!Number.isFinite(manualPrice)||manualPrice<0)){toast('Manual Price / NAV cannot be negative.','error');return;}

  setBusy(button,true,'Saving…');
  try{
    const type=String(value('type')||'').toUpperCase();
    const result=await api('saveHolding',{holding:{
      id:h.id,
      owner:value('owner'),
      type,
      assetName,
      code,
      exchange:['MF','OTHER'].includes(type)?'':value('exchange'),
      units,
      investedAmount,
      manualPrice,
      buyDate:value('buyDate'),
      notes:String(value('notes')).trim(),
      sourceCode:h.sourceCode||''
    }});

    state.inlineEditHoldingId='';
    applyBootstrap(result.data);
    saveCache(result.data);
    toast('Investment row saved.','success');
  }catch(error){
    toast(error.message,'error');
  }finally{
    setBusy(button,false);
  }
}

function renderHoldings(){
  renderHoldingsSummary();
  resetCustomHeaders('HOLDINGS');
  applyTableSize('holdings');
  const items=state.holdings.filter(holdingMatches);
  if(els.holdingsFilterCount)els.holdingsFilterCount.textContent=`${items.length} visible`;
  renderHoldingsPnlStrip(items);
  renderMfNavHealth();
  els.holdingsBody.innerHTML=items.map(h=>{
    const avg=(Number(h.units)>0?Number(h.investedAmount)/Number(h.units):null),p=h.performance||{},s=h.transactionStats||{};
    const realisedComplete=s.realizedPnlComplete!==false;
    const totalComplete=realisedComplete&&h.totalPnlToDate!==null&&h.totalPnlToDate!==undefined;
    const mainRow=`<tr class="holding-row" data-view-holding="${escapeHtml(h.id)}" tabindex="0" aria-label="View details for ${escapeHtml(h.assetName)}">
      <td class="sticky-col owner-col"><span class="owner-tag">${escapeHtml(shortOwner(h.owner))}</span></td>
      <td class="sticky-col asset-col"><div class="asset-cell"><div class="asset-badge ${String(h.type).toLowerCase()}">${escapeHtml(h.type==='MF'?'MF':h.type==='ETF'?'ET':'ST')}</div><div><strong>${escapeHtml(h.assetName)}</strong><span>${escapeHtml(h.exchange?`${h.exchange}:`:'')}${escapeHtml(h.code)}${h.sourceCode?` · stmt ${escapeHtml(h.sourceCode)}`:''}</span></div></div></td>
      <td class="holding-trade-date-cell purchase-date-cell">${holdingPurchaseDatesHtml(h)}</td>
      <td class="holding-trade-date-cell sale-date-cell">${holdingSaleDatesHtml(h)}</td>
      <td>${formatNumber(h.units)}</td><td>${formatCurrency(avg)}</td><td>${formatCurrency(h.investedAmount)}</td>
      <td class="price-cell">${priceCellHtml(h)}</td>
      <td><strong>${formatCurrency(h.currentValue)}</strong></td>
      <td class="current-pnl-cell">${pnlMoneyHtml(h.gainLoss,{title:'Current market value minus current cost basis'})}</td>
      <td class="realised-pnl-cell">${pnlMoneyHtml(h.realizedPnl,{complete:realisedComplete,title:realisedComplete?'FIFO realised P/L from recorded sales':'Import complete buy history to calculate realised P/L'})}</td>
      <td class="total-pnl-cell">${pnlMoneyHtml(h.totalPnlToDate,{complete:totalComplete,title:totalComplete?'Current P/L + realised P/L':'Complete transaction history required'})}</td>
      <td class="${pnlClass(h.returnPct)}"><strong>${formatPercent(h.returnPct)}</strong></td><td class="${pnlClass(h.xirr)}">${formatPercent(h.xirr)}</td>
      ${perfCell(p.d1)}${perfCell(p.w1)}${perfCell(p.m1)}${perfCell(p.m6)}${perfCell(p.y1)}${perfCell(p.y3)}${perfCell(p.y5)}${perfCell(p.y10)}
      <td class="personal-note-cell" data-note-cell="${escapeHtml(h.id)}">${notePreview(h.notes)}</td>${customCellsHtml('HOLDINGS',h.id)}
      <td class="row-actions"><button class="small-button view-button" data-view-holding-button="${escapeHtml(h.id)}">View</button><button class="small-button quick-edit-button" data-inline-edit-holding="${escapeHtml(h.id)}">Row edit</button><button class="small-button" data-edit-holding="${escapeHtml(h.id)}">Edit</button><button class="small-button danger" data-delete-holding="${escapeHtml(h.id)}">Delete</button></td>
    </tr>`;
    return mainRow+(state.inlineEditHoldingId===String(h.id)?inlineHoldingEditorHtml(h):'');
  }).join('');
  els.holdingsEmpty.classList.toggle('hidden',items.length>0);
  appendCustomHeaders('HOLDINGS');applyStandardColumnSettings('HOLDINGS');applyHoldingsSemanticGroups();if(els.holdingsViewPreset)els.holdingsViewPreset.value=holdingsPresetFromCurrent();installColumnResizers('holdings');applyStoredColumnWidths('holdings');bindTableScrollPersistence('holdings');restoreTableScroll('holdings');scheduleDashboardHScrollRefresh();
}
function transactionHoldingPeriod(days){
  const n=Number(days);
  if(!Number.isFinite(n)||n<0)return '—';
  if(n<31)return `${Math.round(n)} day${Math.round(n)===1?'':'s'}`;
  if(n<365)return `${Math.floor(n/30)}m ${Math.round(n%30)}d`;
  const y=Math.floor(n/365),m=Math.floor((n%365)/30);
  return `${y}y ${m}m`;
}
function visibleTransactions(){
  const q=String(els.transactionSearch?.value||'').trim().toLowerCase();
  const owner=els.transactionOwnerFilter?.value||'ALL';
  const asset=els.transactionAssetFilter?.value||'ALL';
  const side=els.transactionSideFilter?.value||'ALL';
  const from=els.transactionFromDate?.value||'';
  const to=els.transactionToDate?.value||'';

  return (state.transactions||[]).filter(t=>{
    if(owner!=='ALL'&&canonicalOwner(t.owner)!==canonicalOwner(owner))return false;
    if(asset!=='ALL'&&String(t.assetType||'').toUpperCase()!==asset)return false;
    if(side!=='ALL'&&String(t.side||'').toUpperCase()!==side)return false;
    const d=String(t.tradeDate||'');
    if(from&&d<from)return false;
    if(to&&d>to)return false;
    const hay=`${t.owner||''} ${t.assetType||''} ${t.assetName||''} ${t.code||''} ${t.side||''} ${t.transactionType||''} ${t.broker||''}`.toLowerCase();
    return !q||hay.includes(q);
  });
}
function refreshTransactionOwnerFilter(){
  if(!els.transactionOwnerFilter)return;
  const current=els.transactionOwnerFilter.value||'ALL';
  const owners=[...new Set((state.transactions||[]).map(t=>canonicalOwner(t.owner)).filter(Boolean))];
  els.transactionOwnerFilter.innerHTML='<option value="ALL">All investors</option>'+owners.map(o=>`<option value="${escapeHtml(o)}">${escapeHtml(shortOwner(o))}</option>`).join('');
  if(current==='ALL'||owners.includes(current))els.transactionOwnerFilter.value=current;
}
function renderTransactions(){
  if(!els.transactionBody)return;
  refreshTransactionOwnerFilter();
  const items=visibleTransactions();

  const buys=items.filter(t=>t.side==='BUY');
  const sells=items.filter(t=>t.side==='SELL');
  const buyTotal=buys.reduce((s,t)=>s+(Number(t.amount)||0),0);
  const saleTotal=sells.reduce((s,t)=>s+(Number(t.amount)||0),0);
  const realized=items.reduce((s,t)=>s+(Number.isFinite(Number(t.realizedPnl))?Number(t.realizedPnl):0),0);
  const realizedCount=items.filter(t=>t.realizedPnl!==null&&t.realizedPnl!==undefined&&Number.isFinite(Number(t.realizedPnl))).length;

  if(els.transactionBuyTotal)els.transactionBuyTotal.textContent=formatCurrency(buyTotal,true);
  if(els.transactionSaleTotal)els.transactionSaleTotal.textContent=formatCurrency(saleTotal,true);
  if(els.transactionRealizedPnl){
    els.transactionRealizedPnl.textContent=realizedCount?formatCurrency(realized,true):'—';
    els.transactionRealizedPnl.className=pnlClass(realized);
  }
  if(els.transactionCount)els.transactionCount.textContent=String(items.length);
  if(els.transactionFilterCount)els.transactionFilterCount.textContent=`${items.length} visible`;

  els.transactionBody.innerHTML=items.map(t=>{
    const sale=t.side==='SELL',buy=t.side==='BUY';
    const sideClass=sale?'sale':buy?'buy':'other';
    const realizedClass=pnlClass(t.realizedPnl);
    return `<tr class="transaction-row ${sideClass}">
      <td>${detailDate(t.tradeDate)}</td>
      <td><span class="owner-tag">${escapeHtml(shortOwner(t.owner))}</span></td>
      <td><span class="transaction-asset-badge ${String(t.assetType||'').toLowerCase()}">${escapeHtml(t.assetType||'—')}</span></td>
      <td><div class="transaction-asset"><strong>${escapeHtml(t.assetName||t.code||'—')}</strong><span>${escapeHtml(t.code||'')}</span></div></td>
      <td><strong class="transaction-side ${sideClass}">${sale?'SALE':buy?'BUY':escapeHtml(t.side||'OTHER')}</strong><span class="transaction-type-detail">${escapeHtml(t.transactionType||'')}</span></td>
      <td>${formatNumber(t.units,6)}</td>
      <td>${formatCurrency(t.price)}</td>
      <td><strong>${formatCurrency(t.amount)}</strong></td>
      <td class="${realizedClass}"><strong>${t.realizedPnl==null?'—':formatCurrency(t.realizedPnl)}</strong></td>
      <td>${transactionHoldingPeriod(t.holdingDays)}</td>
      <td>${escapeHtml(t.broker||t.source||'—')}</td>
    </tr>`;
  }).join('');
  els.transactionEmpty.classList.toggle('hidden',items.length>0);
  scheduleDashboardHScrollRefresh();
}
function printTransactionsView(){
  const items=visibleTransactions();
  if(!items.length){toast('No transactions to print.','error');return;}
  const rows=items.map(t=>`<tr>
    <td>${escapeHtml(detailDate(t.tradeDate))}</td><td>${escapeHtml(shortOwner(t.owner))}</td><td>${escapeHtml(t.assetType||'')}</td>
    <td>${escapeHtml(t.assetName||t.code||'')}</td><td class="${t.side==='SELL'?'negative':t.side==='BUY'?'positive':''}">${escapeHtml(t.side==='SELL'?'SALE':t.side||'')}</td>
    <td>${escapeHtml(formatNumber(t.units,6))}</td><td>${escapeHtml(formatCurrency(t.price))}</td><td>${escapeHtml(formatCurrency(t.amount))}</td>
    <td class="${pnlClass(t.realizedPnl)}">${escapeHtml(t.realizedPnl==null?'—':formatCurrency(t.realizedPnl))}</td><td>${escapeHtml(transactionHoldingPeriod(t.holdingDays))}</td>
  </tr>`).join('');
  openPrintPreview(
    'Transactions',
    `${items.length} filtered transactions · sale rows shown in red`,
    `<table><thead><tr><th>Date</th><th>Investor</th><th>Type</th><th>Asset</th><th>Buy/Sale</th><th>Qty/Units</th><th>Price</th><th>Amount</th><th>Realised P/L</th><th>Holding period</th></tr></thead><tbody>${rows}</tbody></table>`,
    'landscape'
  );
}

function sourcePerfCell(v){return `<td class="perf ${pnlClass(v)}">${formatPercent(v)}</td>`;}
function compactText(value,max=74){const c=String(value||'').replace(/\s+/g,' ').trim();if(!c)return '—';return c.length>max?`${c.slice(0,max-1)}…`:c;}
function renderWatchlist(){
  resetCustomHeaders('WATCHLIST');
  applyTableSize('watchlist');
  const items=visibleWatchlist();
  if(els.watchFilterCount)els.watchFilterCount.textContent=`${items.length} visible`;
  els.watchBody.innerHTML=items.map(x=>{
    const s=x.sourceDetails||{};
    const hl=(s.high52!=null||s.low52!=null)?`${formatCurrency(s.high52)} / ${formatCurrency(s.low52)}`:'—';
    return `<tr class="watch-row" data-view-watch="${escapeHtml(x.id)}" tabindex="0" aria-label="View watchlist details for ${escapeHtml(x.assetName)}">
      <td class="sticky-col asset-col"><div class="asset-cell"><div class="asset-badge ${String(x.type).toLowerCase()}">${escapeHtml(x.type==='MF'?'MF':x.type==='ETF'?'ET':x.type==='STOCK'?'ST':'OT')}</div><div><strong>${escapeHtml(x.assetName)}</strong><span>${escapeHtml(x.exchange?`${x.exchange}:`:'')}${escapeHtml(x.code)}</span></div></div></td>
      <td class="price-cell">${priceCellHtml(x)}</td>
      <td class="${pnlClass(s.snapshotChangePct)}">${formatPercent(s.snapshotChangePct)}</td>
      <td>${formatCurrency(x.targetPrice)}</td>
      <td class="${Number(x.distancePct)<=0?'positive':'neutral'}">${formatPercent(x.distancePct)}</td>
      <td>${hl}</td>
      <td>${escapeHtml(s.valuation||'—')}</td>
      ${sourcePerfCell(s.perf1M)}${sourcePerfCell(s.perf1Y)}${sourcePerfCell(s.perf3Y)}${sourcePerfCell(s.perf5Y)}${sourcePerfCell(s.perf10Y)}
      <td class="watch-source-remark" title="${escapeHtml(s.moatRemark||'')}">${escapeHtml(compactText(s.moatRemark,72))}</td>
      <td class="personal-note-cell" data-watch-note-cell="${escapeHtml(x.id)}">${notePreview(x.notes)}</td>
      ${customCellsHtml('WATCHLIST',x.id)}<td class="row-actions"><button class="small-button" data-view-watch-button="${escapeHtml(x.id)}">View</button><button class="small-button note-button" data-watch-note-button="${escapeHtml(x.id)}">📝 Note</button><button class="small-button" data-edit-watch="${escapeHtml(x.id)}">Edit</button><button class="small-button danger" data-delete-watch="${escapeHtml(x.id)}">Delete</button></td>
    </tr>`;
  }).join('');
  els.watchEmpty.classList.toggle('hidden',items.length>0);
  appendCustomHeaders('WATCHLIST');
  applyStandardColumnSettings('WATCHLIST');
  installColumnResizers('watchlist');
  applyStoredColumnWidths('watchlist');
  bindTableScrollPersistence('watchlist');
  restoreTableScroll('watchlist');
  scheduleDashboardHScrollRefresh();
}

/* V16.5 restored functions accidentally removed in V16.3 */
function renderUsers(){
  if(!els.usersBody)return;
  const current=String(state.user?.username||state.username||'').toLowerCase();

  els.usersBody.innerHTML=(state.users||[]).map(u=>{
    const username=String(u.username||'');
    const isSelf=username.toLowerCase()===current;
    const role=String(u.role||'USER').toUpperCase();
    const statusClass=u.active?'active':'disabled';

    return `<tr class="user-row ${isSelf?'is-current-user':''}">
      <td><strong>${escapeHtml(username)}</strong>${isSelf?'<span class="self-user-badge">You</span>':''}</td>
      <td>${escapeHtml(u.displayName||'—')}</td>
      <td><span class="user-role-badge ${role.toLowerCase()}">${escapeHtml(role)}</span></td>
      <td><span class="user-status-badge ${statusClass}">${u.active?'Active':'Disabled'}</span></td>
      <td>${escapeHtml(u.lastLogin||'—')}</td>
      <td class="row-actions user-row-actions">
        <button class="small-button user-edit-button" data-edit-user="${escapeHtml(username)}">Edit</button>
        <button class="small-button" data-reset-user="${escapeHtml(username)}">Reset password</button>
        <button class="small-button" data-toggle-user="${escapeHtml(username)}" data-active="${u.active?'false':'true'}" ${isSelf&&u.active?'title="Your own account cannot be disabled"':''}>${u.active?'Disable':'Enable'}</button>
        <button class="small-button danger user-delete-button" data-delete-user="${escapeHtml(username)}" ${isSelf?'disabled title="You cannot delete the account you are using"':''}>Delete</button>
      </td>
    </tr>`;
  }).join('');
}
function detailDate(value){
  if(!value)return '—';
  const raw=String(value);
  const d=/^\d{4}-\d{2}-\d{2}$/.test(raw)?new Date(raw+'T00:00:00'):new Date(raw);
  return Number.isNaN(d.getTime())
    ? escapeHtml(raw)
    : new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(d);
}

function drawerMetric(label,value,valueClass=''){
  return `<div class="drawer-metric"><span>${escapeHtml(label)}</span><strong class="${valueClass}">${value}</strong></div>`;
}

function openHoldingDrawer(item){
  if(!item)return;
  state.drawerHoldingId=item.id;
  state.drawerWatchId='';
  state.drawerMode='HOLDING';
  if(els.drawerEyebrow)els.drawerEyebrow.textContent='INVESTMENT DETAILS';
  els.drawerEditBtn.textContent='Edit investment';
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
        <span class="${pnlClass(item.gainLoss)}">${item.gainLoss==null?'Current P/L pending':`${formatCurrency(item.gainLoss,true)} current P/L`}</span>
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
        ${drawerMetric('Current P/L till today',formatCurrency(item.gainLoss,true),pnlClass(item.gainLoss))}
        ${drawerMetric('Realised P/L',item.realizedPnl==null?'—':formatCurrency(item.realizedPnl,true),pnlClass(item.realizedPnl))}
        ${drawerMetric('Total P/L to date',item.totalPnlToDate==null?'—':formatCurrency(item.totalPnlToDate,true),pnlClass(item.totalPnlToDate))}
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
        ${item.buyDate?`<div class="drawer-info-row"><span>Manual purchase date</span><strong>${detailDate(item.buyDate)}</strong></div>`:''}
        ${item.transactionStats?.firstPurchaseDate?`<div class="drawer-info-row"><span>First transaction purchase</span><strong>${detailDate(item.transactionStats.firstPurchaseDate)}</strong></div>`:''}
        ${item.transactionStats?.latestPurchaseDate?`<div class="drawer-info-row"><span>Latest purchase</span><strong>${detailDate(item.transactionStats.latestPurchaseDate)}</strong></div>`:''}
        ${item.transactionStats?.latestSaleDate?`<div class="drawer-info-row"><span>Latest sale</span><strong class="negative">${detailDate(item.transactionStats.latestSaleDate)}</strong></div>`:''}
        ${item.transactionStats?.transactionCount?`<div class="drawer-info-row"><span>Transactions recorded</span><strong>${item.transactionStats.transactionCount}</strong></div>`:''}
      </div>
    </section>
    <section class="drawer-section exact-trade-dates-section">
      <h3 class="drawer-section-title">Exact purchase &amp; sale dates</h3>
      <p class="tiny muted">For MF SIPs and multiple stock buys, all recorded dates are listed below.</p>
      ${drawerExactDatesBlock('Purchase / BUY dates',item.transactionStats?.purchaseDates?.length?item.transactionStats.purchaseDates:(item.buyDate?[item.buyDate]:[]),'purchase')}
      ${drawerExactDatesBlock('Sale / redemption dates',item.transactionStats?.saleDates||[],'sale')}
      ${item.transactionStats?.saleCount&&item.transactionStats?.realizedPnlComplete===false?`<div class="drawer-history-warning">Realised P/L is incomplete because the recorded sale does not have enough earlier BUY history. Import the complete broker/MF transaction history.</div>`:''}
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

function watchTargetStatus(item){
  const d=item.distancePct;
  if(d===null||d===undefined||!Number.isFinite(Number(d)))return {text:'Target status pending',cls:'neutral'};
  const n=Number(d);
  if(n<=0)return {text:'At / below target price',cls:'positive'};
  if(n<=5)return {text:`${formatPercent(n)} above target · near target`,cls:'neutral'};
  return {text:`${formatPercent(n)} above target`,cls:'neutral'};
}

function openWatchDrawer(item){
  if(!item)return;
  state.drawerWatchId=item.id;state.drawerHoldingId='';state.drawerMode='WATCH';
  const isMf=item.type==='MF',currentLabel=isMf?'Current NAV':'Current price',targetLabel=isMf?'Target NAV':'Target buy price';
  const badge=isMf?'MF':item.type==='ETF'?'ETF':item.type==='STOCK'?'ST':'☆',status=watchTargetStatus(item),s=item.sourceDetails||{};
  if(els.drawerEyebrow)els.drawerEyebrow.textContent='WATCHLIST DETAILS · MASTER SHEET';
  els.drawerEditBtn.textContent='Edit watch item';els.drawerAssetBadge.textContent=badge;els.drawerTitle.textContent=item.assetName||'Watchlist item';
  els.drawerSubtitle.textContent=[item.type,item.exchange?`${item.exchange}:${item.code}`:item.code,`${item.priority||'MEDIUM'} priority`].filter(Boolean).join(' · ');
  els.drawerContent.innerHTML=`<section class="drawer-value-card watch-drawer-value"><span class="drawer-value-label">${currentLabel}</span><strong class="drawer-current-value">${formatCurrency(item.currentPrice)}</strong><div class="drawer-gain-line"><span>${targetLabel}: ${formatCurrency(item.targetPrice)}</span><span class="drawer-gain-chip ${status.cls}">${escapeHtml(status.text)}</span></div></section>
  <section class="drawer-section"><h3 class="drawer-section-title">Live watch summary</h3><div class="drawer-metric-grid">${drawerMetric(currentLabel,formatCurrency(item.currentPrice))}${drawerMetric(targetLabel,formatCurrency(item.targetPrice))}${drawerMetric('Distance from target',formatPercent(item.distancePct),Number(item.distancePct)<=0?'positive':'neutral')}${drawerMetric('Priority',escapeHtml(item.priority||'MEDIUM'))}${drawerMetric('Price source',escapeHtml(item.priceSource||'Pending'))}${drawerMetric('Price date',detailDate(item.priceDate))}</div></section>
  <section class="drawer-section master-sheet-detail-section"><div class="drawer-section-head"><h3 class="drawer-section-title">Uploaded master-sheet details</h3><span class="tiny muted">${escapeHtml(s.sourceSheet||'Workbook')}</span></div><div class="drawer-metric-grid">${drawerMetric('Sheet price / NAV',formatCurrency(s.snapshotPrice))}${drawerMetric('Sheet day change',formatCurrency(s.snapshotChange),pnlClass(s.snapshotChange))}${drawerMetric('Sheet day %',formatPercent(s.snapshotChangePct),pnlClass(s.snapshotChangePct))}${drawerMetric('Day high',formatCurrency(s.dayHigh))}${drawerMetric('Day low',formatCurrency(s.dayLow))}${drawerMetric('Volume',s.volume==null?'—':formatNumber(s.volume,0))}${drawerMetric('52W high',formatCurrency(s.high52))}${drawerMetric('52W low',formatCurrency(s.low52))}${drawerMetric('P/E or P/B',escapeHtml(s.valuation||'—'))}${drawerMetric('Market cap / assets / debt',escapeHtml(s.marketCap||'—'))}</div>
  <div class="drawer-performance source-performance-grid">${[['1M',s.perf1M],['1Y',s.perf1Y],['3Y',s.perf3Y],['5Y',s.perf5Y],['10Y',s.perf10Y]].map(([label,value])=>`<div class="drawer-perf-item"><span>${label}</span><strong class="${pnlClass(value)}">${formatPercent(value)}</strong></div>`).join('')}</div>
  <div class="drawer-info-list source-info-list"><div class="drawer-info-row"><span>Company / scheme</span><strong>${escapeHtml(s.companyName||item.assetName||'—')}</strong></div><div class="drawer-info-row"><span>Sales growth</span><strong>${escapeHtml(s.salesGrowth||'—')}</strong></div><div class="drawer-info-row"><span>Profit growth</span><strong>${escapeHtml(s.profitGrowth||'—')}</strong></div><div class="drawer-info-row"><span>Remark / moat / management</span><strong>${escapeHtml(s.moatRemark||'—')}</strong></div><div class="drawer-info-row"><span>Final remark</span><strong>${escapeHtml(s.finalRemark||'—')}</strong></div></div></section>
  <section class="drawer-section"><h3 class="drawer-section-title">Watchlist information</h3><div class="drawer-info-list"><div class="drawer-info-row"><span>Asset type</span><strong>${escapeHtml(item.type||'—')}</strong></div><div class="drawer-info-row"><span>${isMf?'AMFI code':'Symbol / code'}</span><strong>${escapeHtml(item.code||'—')}</strong></div>${item.exchange?`<div class="drawer-info-row"><span>Exchange</span><strong>${escapeHtml(item.exchange)}</strong></div>`:''}<div class="drawer-info-row"><span>Priority</span><strong><span class="priority ${String(item.priority||'MEDIUM').toLowerCase()}">${escapeHtml(item.priority||'MEDIUM')}</span></strong></div><div class="drawer-info-row"><span>Target status</span><strong class="${status.cls}">${escapeHtml(status.text)}</strong></div></div></section>
  <section class="drawer-section watch-note-editor-section"><div class="drawer-section-head"><h3 class="drawer-section-title">Personal Note</h3><span class="tiny muted">Your editable note</span></div><textarea id="drawerWatchNote" class="drawer-note-textarea" rows="6" maxlength="500" placeholder="Add your personal note for this watchlist item…">${escapeHtml(item.notes||'')}</textarea><div class="drawer-note-actions"><span id="drawerWatchNoteStatus" class="tiny muted">${item.notes?'Existing note shown above.':'No note yet.'}</span><button id="drawerSaveWatchNoteBtn" class="primary-button compact-button" type="button">Save Note</button></div></section>`;
  els.holdingDrawer.classList.add('open');els.holdingDrawerBackdrop.classList.add('open');els.holdingDrawer.setAttribute('aria-hidden','false');els.holdingDrawerBackdrop.setAttribute('aria-hidden','false');document.body.classList.add('drawer-open');
  const noteBtn=$('drawerSaveWatchNoteBtn');if(noteBtn)noteBtn.addEventListener('click',saveWatchDrawerNote);setTimeout(()=>els.drawerCloseBtn?.focus(),50);
}

async function saveWatchDrawerNote(){
  const item=state.watchlist.find(x=>x.id===state.drawerWatchId);
  const textarea=$('drawerWatchNote');
  const button=$('drawerSaveWatchNoteBtn');
  const status=$('drawerWatchNoteStatus');
  if(!item||!textarea||!button)return;
  const note=textarea.value.trim();
  setBusy(button,true,'Saving…');
  if(status)status.textContent='Saving note…';
  try{
    const result=await api('saveWatchItem',{item:{
      id:item.id,
      type:item.type,
      assetName:item.assetName,
      code:item.code,
      exchange:['MF','OTHER'].includes(item.type)?'':(item.exchange||'NSE'),
      targetPrice:item.targetPrice===null||item.targetPrice===undefined?null:Number(item.targetPrice),
      manualPrice:item.manualPrice===null||item.manualPrice===undefined?null:Number(item.manualPrice),
      priority:item.priority||'MEDIUM',
      notes:note
    }});
    applyBootstrap(result.data);
    saveCache(result.data);
    const fresh=state.watchlist.find(x=>x.id===item.id);
    if(status)status.textContent=note?'Note saved.':'Note cleared.';
    toast('Watchlist note saved.','success');
    if(fresh){
      state.drawerWatchId=fresh.id;
      setTimeout(()=>{
        const t=$('drawerWatchNote');
        if(t)t.value=fresh.notes||'';
      },0);
    }
  }catch(e){
    if(status)status.textContent='Could not save note.';
    toast(e.message,'error');
  }finally{
    setBusy(button,false);
  }
}

function closeHoldingDrawer(){
  els.holdingDrawer?.classList.remove('open');
  els.holdingDrawerBackdrop?.classList.remove('open');
  els.holdingDrawer?.setAttribute('aria-hidden','true');
  els.holdingDrawerBackdrop?.setAttribute('aria-hidden','true');
  document.body.classList.remove('drawer-open');
  state.drawerHoldingId='';
  state.drawerWatchId='';
  state.drawerMode='';
}

function editDrawerHolding(){
  const mode=state.drawerMode;
  const holding=mode==='HOLDING'?state.holdings.find(x=>x.id===state.drawerHoldingId):null;
  const watch=mode==='WATCH'?state.watchlist.find(x=>x.id===state.drawerWatchId):null;
  closeHoldingDrawer();
  if(holding)openInvestment(holding);
  else if(watch)openWatch(watch);
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
      ? `<button type="button" class="small-button" data-watch-note-view="${escapeHtml(x.id)}">View watch item</button>`
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

/* V15.4 FREEZE FIX — restored core dashboard/import/modal functions. */
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
    }else if(mode==='MF_SNAPSHOT'){
      const hasName=['schemename','assetname','name'].some(x=>h.includes(x));
      const hasIsin=h.includes('isin');
      const hasUnits=['unitsheld','units','quantity','qty'].some(x=>h.includes(x));
      if(hasName&&hasIsin&&hasUnits)return rows.slice(i);
    }else if(mode==='STOCK_TRADES'){
      const hasSymbol=['stocksymbol','symbol','tradingsymbol','instrument','scrip'].some(x=>h.includes(x));
      const hasQty=['quantity','qty','tradedquantity'].some(x=>h.includes(x));
      const hasDate=['tradedate','date','orderexecutiontime','orderexecutiondate'].some(x=>h.includes(x));
      const hasSide=['tradetype','transactiontype','buysell','side','type'].some(x=>h.includes(x));
      if(hasSymbol&&hasQty&&hasDate&&hasSide)return rows.slice(i);
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
function rowsToMfSnapshotHoldings(rows){
  if(rows.length<2)throw new Error('The file has no mutual-fund holding rows.');
  const h=rows[0].map(normalizeHeader);
  const idx={
    owner:detectIndex(h,['Investor Name','INVESTOR_NAME','Owner']),
    name:detectIndex(h,['Scheme Name','SCHEME_NAME','Asset Name','Name']),
    isin:detectIndex(h,['ISIN']),
    units:detectIndex(h,['Units Held','Units','Quantity','Qty']),
    avg:detectIndex(h,['Avg NAV','Average NAV','Average Price']),
    invested:detectIndex(h,['Invested Amount','Investment Amount','Invested Value','Cost Value']),
    currentNav:detectIndex(h,['Current NAV','NAV','Current Price']),
    notes:detectIndex(h,['Personal Note','Notes','Note'])
  };
  if(idx.name<0||idx.isin<0||idx.units<0||(idx.invested<0&&idx.avg<0)){
    throw new Error('MF holdings file needs Scheme Name, ISIN, Units Held and Invested Amount or Avg NAV.');
  }
  const selected=canonicalOwner(els.importOwner.value||configuredOwners()[0]||'Niharika');
  const out=[],errors=[];
  rows.slice(1).forEach((r,n)=>{
    const schemeName=cell(r,idx.name);
    const isin=cell(r,idx.isin).toUpperCase().replace(/\s+/g,'');
    if(!schemeName&&!isin)return;
    const units=parseNum(cell(r,idx.units));
    const avg=parseNum(cell(r,idx.avg));
    const investedRaw=parseNum(cell(r,idx.invested));
    const invested=Number.isFinite(investedRaw)?investedRaw:(Number.isFinite(units)&&Number.isFinite(avg)?units*avg:null);
    const currentNav=parseNum(cell(r,idx.currentNav));
    const owner=idx.owner>=0&&cell(r,idx.owner)?canonicalOwner(cell(r,idx.owner)):selected;
    if(!schemeName||!/^[A-Z0-9]{12}$/.test(isin)||!Number.isFinite(units)||units<=0||!Number.isFinite(invested)||invested<0){
      errors.push(`Row ${n+2}: check Scheme Name, 12-character ISIN, Units Held and Invested Amount.`);
      return;
    }
    out.push({
      owner,
      schemeName,
      isin,
      units,
      investedAmount:invested,
      avgNav:Number.isFinite(avg)?avg:null,
      currentNav:Number.isFinite(currentNav)?currentNav:null,
      notes:idx.notes>=0?cell(r,idx.notes):''
    });
  });
  if(errors.length)throw new Error(errors.slice(0,6).join(' '));
  if(!out.length)throw new Error('No MF current holdings found.');
  return out;
}


function rowsToStockTransactions(rows){
  if(rows.length<2)throw new Error('The tradebook has no trade rows.');
  const h=rows[0].map(normalizeHeader);
  const idx={
    owner:detectIndex(h,['Investor Name','INVESTOR_NAME','Owner']),
    type:detectIndex(h,['Asset Type','Instrument Type','Type']),
    symbol:detectIndex(h,['Stock Symbol','Symbol','Tradingsymbol','Trading Symbol','Instrument','Scrip']),
    name:detectIndex(h,['Company Name','Asset Name','Name','Instrument']),
    exchange:detectIndex(h,['Exchange']),
    date:detectIndex(h,['Trade Date','trade_date','Date','Order Execution Time','Order Execution Date']),
    side:detectIndex(h,['Trade Type','trade_type','Transaction Type','Buy/Sell','Side','Type']),
    qty:detectIndex(h,['Quantity','Qty','Traded Quantity']),
    price:detectIndex(h,['Price','Trade Price','Average Price']),
    amount:detectIndex(h,['Amount','Trade Value','Value']),
    broker:detectIndex(h,['Broker'])
  };
  if(idx.symbol<0||idx.date<0||idx.side<0||idx.qty<0||idx.price<0){
    throw new Error('Tradebook needs Symbol/Instrument, Trade Date, Trade Type (buy/sell), Quantity and Price.');
  }

  const selected=canonicalOwner(els.importOwner.value||configuredOwners()[0]||'Niharika');
  const out=[],errors=[];
  rows.slice(1).forEach((r,n)=>{
    const symbol=cell(r,idx.symbol).toUpperCase().replace(/\s+/g,'');
    if(!symbol)return;
    const rawSide=cell(r,idx.side).toUpperCase();
    const side=/SELL|SALE/.test(rawSide)?'SELL':/BUY|PURCHASE/.test(rawSide)?'BUY':'';
    const tradeDate=normalizeDate(cell(r,idx.date).split(' ')[0]);
    const units=parseNum(cell(r,idx.qty));
    const price=parseNum(cell(r,idx.price));
    const amountRaw=parseNum(cell(r,idx.amount));
    const owner=idx.owner>=0&&cell(r,idx.owner)?canonicalOwner(cell(r,idx.owner)):selected;
    const assetType=classifyAsset(symbol,cell(r,idx.type));
    const assetName=cell(r,idx.name)||symbol;
    const broker=cell(r,idx.broker)||'Zerodha / Tradebook';

    if(!tradeDate||!side||!Number.isFinite(units)||Math.abs(units)<=0||!Number.isFinite(price)||price<0){
      errors.push(`Row ${n+2}: check date, BUY/SELL, quantity and price.`);
      return;
    }
    const amount=Number.isFinite(amountRaw)?Math.abs(amountRaw):Math.abs(units*price);
    out.push({owner,assetType,assetName,code:symbol,tradeDate,side,units:Math.abs(units),price:Math.abs(price),amount,broker});
  });
  if(errors.length)throw new Error(errors.slice(0,6).join(' ')+(errors.length>6?` Plus ${errors.length-6} more.`:''));
  if(!out.length)throw new Error('No BUY/SELL trades found.');
  if(out.length>10000)throw new Error('More than 10,000 trades detected. Split the file.');
  return out;
}

function rowsToStockHoldings(rows){
  if(rows.length<2)throw new Error('The CSV has no stock rows.');const h=rows[0].map(normalizeHeader);
  const idx={owner:detectIndex(h,['INVESTOR_NAME','Investor Name','Owner']),type:detectIndex(h,['Asset Type','Type','Instrument Type']),symbol:detectIndex(h,['Stock Symbol','Symbol','Tradingsymbol','Trading Symbol','Instrument','Scrip']),exchange:detectIndex(h,['Exchange']),qty:detectIndex(h,['Quantity','Qty','Qty.','QTY']),avg:detectIndex(h,['Avg Buy Price','Average Buy Price','Avg. cost','Avg Cost','Average price','Buy Average']),invested:detectIndex(h,['Invested Amount','Invested Value','Cost Value','Investment Value']),name:detectIndex(h,['Company Name','Asset Name','Name'])};
  if(idx.symbol<0||idx.qty<0||(idx.avg<0&&idx.invested<0))throw new Error('Stock file needs Symbol/Instrument, Quantity and Avg Buy Price or Invested Amount.');
  const out=[],errors=[];const selected=canonicalOwner(els.importOwner.value||configuredOwners()[0]||'Niharika');rows.slice(1).forEach((r,n)=>{const symbol=cell(r,idx.symbol).toUpperCase().replace(/\s+/g,'');if(!symbol)return;const qty=parseNum(cell(r,idx.qty)),avg=parseNum(cell(r,idx.avg)),invRaw=parseNum(cell(r,idx.invested));const invested=Number.isFinite(invRaw)?invRaw:(Number.isFinite(qty)&&Number.isFinite(avg)?qty*avg:null);if(!Number.isFinite(qty)||qty<=0||!Number.isFinite(invested)||invested<0){errors.push(`Row ${n+2}: invalid quantity/invested amount.`);return;}const owner=idx.owner>=0&&cell(r,idx.owner)?canonicalOwner(cell(r,idx.owner)):selected;const exchange=(cell(r,idx.exchange)||'NSE').toUpperCase()==='BSE'?'BOM':(cell(r,idx.exchange)||'NSE').toUpperCase();const type=classifyAsset(symbol,cell(r,idx.type));out.push({owner,type,assetName:cell(r,idx.name)||symbol,code:symbol,exchange,units:qty,investedAmount:invested,manualPrice:null,buyDate:'',notes:'Imported stock holding'});});if(errors.length)throw new Error(errors.slice(0,6).join(' '));if(!out.length)throw new Error('No stock holdings found.');return out;
}
function setImportMode(mode){
  state.importMode=mode;
  $$('.import-mode').forEach(b=>b.classList.toggle('active',b.dataset.importMode===mode));
  els.mfImportHelp.classList.toggle('hidden',mode!=='MF_STATEMENT');
  els.mfSnapshotImportHelp.classList.toggle('hidden',mode!=='MF_SNAPSHOT');
  els.stockImportHelp.classList.toggle('hidden',mode!=='STOCK_HOLDINGS');
  els.stockTradeImportHelp?.classList.toggle('hidden',mode!=='STOCK_TRADES');
  els.stockOwnerLabel.classList.toggle('hidden',!['MF_SNAPSHOT','STOCK_HOLDINGS','STOCK_TRADES'].includes(mode));
  if(mode==='MF_STATEMENT')els.importFileHint.textContent='Up to 5,000 MF transaction rows. PAN and folio are ignored. CSV/XLSX supported.';
  else if(mode==='MF_SNAPSHOT')els.importFileHint.textContent='Current MF holdings snapshot. CSV/XLSX supported.';
  else if(mode==='STOCK_TRADES')els.importFileHint.textContent='Stock/ETF tradebook with BUY/SELL dates. Zerodha CSV/XLSX and similar formats supported.';
  else els.importFileHint.textContent='Current stock/ETF holdings. Zerodha XLSX/CSV supported.';
  els.bulkCsvFile.value='';
  state.pendingImport=[];
  els.bulkImportStatus.textContent='No file selected.';
  els.bulkImportStatus.className='import-status muted';
  els.runBulkImportBtn.disabled=true;
}
function openBulkImport(){refreshOwnerControls();setImportMode('MF_STATEMENT');openModal('bulkImportModal');}
function downloadImportTemplate(){
  let headers,examples,name;
  if(state.importMode==='MF_STATEMENT'){
    headers=['MF_NAME','INVESTOR_NAME','PRODUCT_CODE','SCHEME_NAME','Type','TRADE_DATE','TRANSACTION_TYPE','DIVIDEND_RATE','AMOUNT','UNITS','PRICE','BROKER'];
    examples=[['PPFAS Mutual Fund','Sarada','PP001ZG','Parag Parikh Flexi Cap - Dir Plan Growth','Equity','2026-07-05','Purchase Systematic','','12999.35','140.000','92.8525','Direct']];
    name='mf-statement-import-template.csv';
  }else if(state.importMode==='MF_SNAPSHOT'){
    headers=['Investor Name','Scheme Name','ISIN','Units Held','Avg NAV','Invested Amount','Current NAV','Personal Note'];
    examples=[['Niharika','Parag Parikh Flexi Cap Fund - Direct Plan Growth','INF879O01027','1865.091','42.89','80000','91.75','']];
    name='mf-current-holdings-template.csv';
  }else if(state.importMode==='STOCK_TRADES'){
    headers=['Investor Name','Asset Type','Stock Symbol','Exchange','Trade Date','Trade Type','Quantity','Price','Amount','Broker'];
    examples=[['Niharika','STOCK','HDFCBANK','NSE','2026-07-05','BUY','10','1680','16800','Zerodha'],['Niharika','STOCK','HDFCBANK','NSE','2026-08-10','SELL','5','1750','8750','Zerodha']];
    name='stock-tradebook-import-template.csv';
  }else{
    headers=['Investor Name','Asset Type','Stock Symbol','Exchange','Quantity','Avg Buy Price','Invested Amount'];
    examples=[['Niharika','STOCK','DMART','NSE','20','3923.85','78477'],['Niharika','ETF','GOLDBEES','NSE','1123','91.37','102614']];
    name='stock-holdings-import-template.csv';
  }
  const csv=[headers,...examples].map(r=>r.map(csvCell).join(',')).join('\n');
  const blob=new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function handleBulkFile(){
  state.pendingImport=[];
  els.runBulkImportBtn.disabled=true;
  const file=els.bulkCsvFile.files?.[0];
  if(!file){els.bulkImportStatus.textContent='No file selected.';return;}
  try{
    const rows=trimToDetectedHeader(await fileToRows(file),state.importMode);
    let data;
    if(state.importMode==='MF_STATEMENT')data=rowsToMfTransactions(rows);
    else if(state.importMode==='MF_SNAPSHOT')data=rowsToMfSnapshotHoldings(rows);
    else if(state.importMode==='STOCK_TRADES')data=rowsToStockTransactions(rows);
    else data=rowsToStockHoldings(rows);
    state.pendingImport=data;
    const owners=[...new Set(data.map(x=>x.owner).filter(Boolean))];
    const label=state.importMode==='MF_STATEMENT'?'MF transaction':state.importMode==='MF_SNAPSHOT'?'MF holding':state.importMode==='STOCK_TRADES'?'stock/ETF trade':'stock/ETF holding';
    els.bulkImportStatus.textContent=`${data.length} ${label} row${data.length===1?'':'s'} ready · ${owners.map(shortOwner).join(', ')}`;
    els.bulkImportStatus.className='import-status success';
    els.runBulkImportBtn.disabled=false;
  }catch(e){
    els.bulkImportStatus.textContent=e.message;
    els.bulkImportStatus.className='import-status error';
  }
}
async function runBulkImport(event){
  event.preventDefault();
  if(!state.pendingImport.length)return;
  const b=els.runBulkImportBtn;
  setBusy(b,true,'Importing…');
  try{
    let action,payload;
    if(state.importMode==='MF_STATEMENT'){
      action='bulkImportMfTransactions';payload={transactions:state.pendingImport};
    }else if(state.importMode==='MF_SNAPSHOT'){
      action='bulkImportMfSnapshot';payload={mfHoldings:state.pendingImport};
    }else if(state.importMode==='STOCK_TRADES'){
      action='bulkImportStockTransactions';payload={transactions:state.pendingImport};
    }else{
      action='bulkImportHoldings';payload={holdings:state.pendingImport};
    }
    const result=await api(action,payload);
    closeModals();
    state.pendingImport=[];
    applyBootstrap(result.data);
    saveCache(result.data);
    switchSection(['MF_STATEMENT','STOCK_TRADES'].includes(state.importMode)?'transactions':'holdings');
    if(state.importMode==='MF_STATEMENT')toast(`${result.imported} new MF transactions imported; ${result.skipped||0} duplicates skipped. Purchase/redemption dates are now in Transactions.`,'success');
    else if(state.importMode==='STOCK_TRADES')toast(`${result.imported} stock/ETF BUY/SELL trades imported; ${result.skipped||0} duplicates skipped.`,'success');
    else if(state.importMode==='MF_SNAPSHOT')toast(`${result.imported} MF holdings imported and mapped to AMFI. NAV will update automatically; XIRR needs transaction history.`,'success');
    else toast(`${result.imported} stock/ETF holdings imported. Click Refresh for performance.`,'success');
  }catch(e){
    toast(e.message,'error');
    els.bulkImportStatus.textContent=e.message;
    els.bulkImportStatus.className='import-status error';
  }finally{
    setBusy(b,false);
  }
}

async function replaceMasterPortfolioData(){
  const msg=['This will REPLACE the current investment and watchlist data for this login.','','It deletes earlier Holdings, Watchlist and MF transaction rows, then loads:','• 35 consolidated holdings','• 17 cleaned watchlist items','','Daily Diary, Monthly Diary, users and passwords are NOT deleted.','A backend backup is attempted first.','','Continue?'].join('\n');
  if(!confirm(msg))return;
  setBusy(els.replaceMasterDataBtn,true,'Replacing…');setSyncStatus('syncing','Loading master spreadsheet data…');
  try{
    const result=await api('replaceMasterPortfolioData',{}, {timeoutMs:180000});
    if(!result.data||result.data.holdings?.length!==35||result.data.watchlist?.length!==17){
      throw new Error(`Master replacement verification failed. Found ${result.data?.holdings?.length??0} holdings and ${result.data?.watchlist?.length??0} watchlist items.`);
    }
    applyBootstrap(result.data);saveCache(result.data);state.selectedOwner='ALL';state.selectedAssetView='ALL';
    if(els.holdingSearch)els.holdingSearch.value='';if(els.holdingTypeFilter)els.holdingTypeFilter.value='ALL';
    refreshOwnerControls();
    applyTableSize('holdings');
    applyTableSize('watchlist');renderAll();switchSection('holdings');setSyncStatus('','Master data loaded');
    if(els.masterLoadBanner)els.masterLoadBanner.classList.add('hidden');
    toast(`Master sheet loaded: ${result.importedHoldings} holdings and ${result.importedWatchlist} watchlist items.`,'success');
  }catch(e){setSyncStatus('error','Master load failed');toast(e.message,'error');}
  finally{setBusy(els.replaceMasterDataBtn,false);}
}

function printEscape(value){return escapeHtml(value==null?'':String(value));}
function printLayoutKey(section){return `myfinance_print_layout_${section||'generic'}`;}
function loadPrintLayout(section){
  try{
    const raw=JSON.parse(localStorage.getItem(printLayoutKey(section))||'null');
    if(!raw||typeof raw!=='object')return null;
    return {
      row:Math.max(70,Math.min(160,Number(raw.row)||100)),
      widths:Array.isArray(raw.widths)?raw.widths.map(Number).filter(Number.isFinite):null
    };
  }catch{return null;}
}
function savePrintLayout(section,layout){
  if(!section)return;
  try{
    localStorage.setItem(printLayoutKey(section),JSON.stringify({
      row:Math.max(70,Math.min(160,Number(layout?.row)||100)),
      widths:Array.isArray(layout?.widths)?layout.widths.map(v=>Number(v)||0):null
    }));
  }catch{}
}
function clearPrintLayout(section){
  if(!section)return;
  try{localStorage.removeItem(printLayoutKey(section));}catch{}
}
function normalizePrintWidths(widths,count){
  const list=Array.from({length:count},(_,i)=>Math.max(3,Number(widths?.[i])||1));
  const total=list.reduce((a,b)=>a+b,0)||count;
  return list.map(v=>v/total*100);
}
function dashboardWidthsForPrint(section,map){
  const table=tableElementFor(section);
  if(!table||!Array.isArray(map)||!map.length)return null;
  const heads=[...table.querySelectorAll('thead th')];
  const values=map.map(sourceIndex=>{
    if(sourceIndex==null)return 90;
    const th=heads[sourceIndex];
    return th?Math.max(58,th.getBoundingClientRect().width):90;
  });
  return normalizePrintWidths(values,map.length);
}
function dashboardPrintLayout(section,map){
  const size=section?loadTableSize(section):{row:100,width:100};
  return {
    row:Math.max(70,Math.min(160,Number(size?.row)||100)),
    widths:dashboardWidthsForPrint(section,map)
  };
}
function printColgroup(widths){
  if(!Array.isArray(widths)||!widths.length)return '';
  return `<colgroup>${widths.map(v=>`<col style="width:${Math.max(2,Number(v)||0).toFixed(3)}%">`).join('')}</colgroup>`;
}
function applyPrintFrameLayout(frame,layout){
  const doc=frame?.contentDocument;
  if(!doc)return;
  const row=Math.max(70,Math.min(160,Number(layout?.row)||100));
  doc.documentElement.style.setProperty('--print-row-scale',String(row/100));
  const table=doc.querySelector('table');
  if(table&&Array.isArray(layout?.widths)&&layout.widths.length){
    const widths=normalizePrintWidths(layout.widths,table.querySelectorAll('thead th').length);
    let colgroup=table.querySelector('colgroup');
    if(!colgroup){
      colgroup=doc.createElement('colgroup');
      table.insertBefore(colgroup,table.firstChild);
    }
    colgroup.innerHTML=widths.map(v=>`<col style="width:${v.toFixed(3)}%">`).join('');
    table.style.tableLayout='fixed';
    table.style.whiteSpace='normal';
    table.querySelectorAll('th,td').forEach(cell=>{
      cell.style.whiteSpace=cell.classList.contains('num')?'nowrap':'normal';
      if(!cell.classList.contains('num')){
        cell.style.overflowWrap='anywhere';
        cell.style.wordBreak='break-word';
      }
    });
  }
}
function installPrintColumnResizers(frame,section,layout,onChange){
  const doc=frame?.contentDocument;
  if(!doc)return;
  const table=doc.querySelector('table');
  if(!table)return;
  const headers=[...table.querySelectorAll('thead th')];
  if(!headers.length)return;
  layout.widths=normalizePrintWidths(layout.widths,headers.length);
  applyPrintFrameLayout(frame,layout);

  headers.forEach((th,index)=>{
    if(th.querySelector('.print-col-resizer'))return;
    const handle=doc.createElement('span');
    handle.className='print-col-resizer';
    handle.title='Drag left/right to resize this print column';
    th.appendChild(handle);

    handle.addEventListener('pointerdown',event=>{
      event.preventDefault();
      event.stopPropagation();
      handle.setPointerCapture?.(event.pointerId);
      const tableRect=table.getBoundingClientRect();
      const startX=event.clientX;
      const startPct=layout.widths[index];
      const next=index<headers.length-1?index+1:index-1;
      const nextStart=layout.widths[next];
      doc.body.classList.add('print-column-resizing');

      const move=e=>{
        const deltaPct=(e.clientX-startX)/Math.max(1,tableRect.width)*100;
        const minPct=3;
        let newCurrent=Math.max(minPct,startPct+deltaPct);
        let newNext=Math.max(minPct,nextStart-deltaPct);
        const pairTotal=startPct+nextStart;
        if(newCurrent+newNext!==pairTotal){
          if(newCurrent<=minPct)newNext=pairTotal-minPct;
          if(newNext<=minPct)newCurrent=pairTotal-minPct;
        }
        layout.widths[index]=newCurrent;
        layout.widths[next]=newNext;
        applyPrintFrameLayout(frame,layout);
        onChange?.(true);
      };
      const up=()=>{
        handle.removeEventListener('pointermove',move);
        handle.removeEventListener('pointerup',up);
        handle.removeEventListener('pointercancel',up);
        doc.body.classList.remove('print-column-resizing');
        layout.widths=normalizePrintWidths(layout.widths,headers.length);
        applyPrintFrameLayout(frame,layout);
        if(section)savePrintLayout(section,layout);
        onChange?.(false);
      };
      handle.addEventListener('pointermove',move);
      handle.addEventListener('pointerup',up);
      handle.addEventListener('pointercancel',up);
    });
  });
}
function closePrintPreview(){
  const overlay=$('printPreviewOverlay');
  if(overlay)overlay.remove();
  document.body.classList.remove('print-preview-open');
}
function buildPrintableDocument(title,subtitle,bodyHtml,orientation='portrait'){
  const generated=new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date());
  return `<!doctype html><html><head><meta charset="utf-8"><title>${printEscape(title)}</title><style>
    @page{size:${orientation};margin:10mm}
    :root{--print-row-scale:1}
    *{box-sizing:border-box}
    html,body{background:#fff}
    body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;margin:0;font-size:10px}
    .print-head{display:flex;justify-content:space-between;gap:18px;border-bottom:2px solid #303f8f;padding-bottom:8px;margin-bottom:10px}
    h1{margin:0;font-size:18px;color:#24326c} h2{font-size:13px;margin:14px 0 7px}
    .sub{margin-top:4px;color:#606b80;font-size:9px}.meta{text-align:right;color:#7b8495;font-size:8px;white-space:nowrap}
    table{width:100%;border-collapse:collapse;table-layout:fixed}
    th,td{position:relative;border:1px solid #d9dee8;padding:calc(5px * var(--print-row-scale)) 6px;text-align:left;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:normal;hyphens:auto}
    th{background:#eef1fb;color:#26336e;font-size:8px;text-transform:uppercase;line-height:1.25}
    tr:nth-child(even) td{background:#fafbfe}
    .num{text-align:right;white-space:nowrap}.pos{color:#087b5d}.neg{color:#be4051}
    td:not(.num),td:not(.num) *{max-width:100%;overflow-wrap:anywhere;word-break:break-word}
    small{font-size:7px;color:#748096;white-space:normal;overflow-wrap:anywhere}
    .print-col-resizer{position:absolute;top:0;right:-4px;bottom:0;width:9px;z-index:5;cursor:col-resize;touch-action:none}
    .print-col-resizer::after{content:"";position:absolute;top:18%;bottom:18%;left:4px;width:2px;background:transparent;border-radius:2px}
    th:hover .print-col-resizer::after,.print-col-resizer:hover::after{background:#5e68d6}
    .print-column-resizing,.print-column-resizing *{cursor:col-resize!important;user-select:none!important}
    .entry{border:1px solid #dfe4ed;border-radius:6px;padding:calc(9px * var(--print-row-scale));margin:0 0 calc(8px * var(--print-row-scale));break-inside:avoid}
    .entry h3{font-size:11px;margin:4px 0}.entry-date{font-size:8px;color:#5e60b7;font-weight:bold}.entry-text{white-space:pre-wrap;line-height:1.45;color:#404b5e}
    .monthly-type{font-size:7px;font-weight:bold;text-transform:uppercase;color:#5d59bc}
    .status{font-size:8px;font-weight:bold}
    .print-footer{margin-top:10px;color:#8a93a3;font-size:7.5px}
    @media print{
      html,body{width:auto!important;height:auto!important;overflow:visible!important}
      .print-col-resizer{display:none!important}
      thead{display:table-header-group}
      tr{break-inside:avoid}
    }
  </style></head><body><div class="print-head"><div><h1>${printEscape(title)}</h1><div class="sub">${printEscape(subtitle||'')}</div></div><div class="meta">My Finance · Frontend v${APP_VERSION}<br>Prepared ${printEscape(generated)}</div></div>${bodyHtml}<div class="print-footer">Prepared from the current filtered dashboard view.</div></body></html>`;
}
function openPrintPreview(title,subtitle,bodyHtml,orientation='portrait',options={}){
  closePrintPreview();
  const section=options.section||'';
  const dashboardLayout=options.dashboardLayout||{row:100,widths:null};
  let layout=section?(loadPrintLayout(section)||dashboardLayout):dashboardLayout;
  layout={
    row:Math.max(70,Math.min(160,Number(layout?.row)||100)),
    widths:Array.isArray(layout?.widths)?layout.widths.slice():null
  };

  const overlay=document.createElement('div');
  overlay.id='printPreviewOverlay';
  overlay.className='print-preview-overlay';
  overlay.innerHTML=`<section class="print-preview-shell" role="dialog" aria-modal="true" aria-label="Print preview">
    <header class="print-preview-toolbar">
      <div class="print-preview-copy">
        <strong>Print Preview</strong>
        <span>${printEscape(title)}</span>
      </div>
      <div class="print-layout-controls">
        <span class="print-control-label">Row height</span>
        <button type="button" id="printRowMinusBtn" class="print-size-step">−</button>
        <span id="printRowLabel" class="print-size-value">${Math.round(layout.row)}%</span>
        <button type="button" id="printRowPlusBtn" class="print-size-step">+</button>
        <input id="printRowSlider" class="print-size-slider" type="range" min="70" max="160" step="5" value="${Math.round(layout.row)}" aria-label="Adjust print row height">
        ${section?`<span class="print-drag-help">↔ Drag column heading edges</span><button type="button" id="printUseDashboardBtn" class="print-layout-button">Use dashboard widths</button>`:''}
        <span id="printLayoutSaved" class="print-layout-saved">${section?'✓ Print layout saved':'Preview'}</span>
      </div>
      <div class="print-preview-actions">
        <button type="button" id="printPreviewPrintBtn" class="print-preview-primary">⎙ Print now</button>
        <button type="button" id="printPreviewCloseBtn" class="print-preview-close">✕ Close</button>
      </div>
    </header>
    <div class="print-preview-frame-wrap">
      <iframe id="printPreviewFrame" class="print-preview-frame" title="Printable preview"></iframe>
    </div>
  </section>`;

  document.body.appendChild(overlay);
  document.body.classList.add('print-preview-open');
  const frame=$('printPreviewFrame');
  frame.srcdoc=buildPrintableDocument(title,subtitle,bodyHtml,orientation);

  const status=$('printLayoutSaved');
  let statusTimer=null;
  const showStatus=(saving=false)=>{
    if(!status)return;
    status.textContent=saving?'Saving…':section?'✓ Print layout saved':'Preview';
    status.classList.toggle('saving',saving);
    if(statusTimer)clearTimeout(statusTimer);
    if(saving)statusTimer=setTimeout(()=>showStatus(false),350);
  };
  const saveCurrent=()=>{
    if(section)savePrintLayout(section,layout);
    showStatus(true);
  };
  const applyRow=value=>{
    layout.row=Math.max(70,Math.min(160,Math.round(Number(value)||100)));
    $('printRowLabel').textContent=`${layout.row}%`;
    $('printRowSlider').value=String(layout.row);
    applyPrintFrameLayout(frame,layout);
    saveCurrent();
  };

  $('printRowMinusBtn')?.addEventListener('click',()=>applyRow(layout.row-10));
  $('printRowPlusBtn')?.addEventListener('click',()=>applyRow(layout.row+10));
  $('printRowSlider')?.addEventListener('input',e=>applyRow(e.target.value));

  $('printPreviewCloseBtn')?.addEventListener('click',closePrintPreview);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closePrintPreview();});

  $('printUseDashboardBtn')?.addEventListener('click',()=>{
    layout={
      row:Math.max(70,Math.min(160,Number(dashboardLayout?.row)||100)),
      widths:Array.isArray(dashboardLayout?.widths)?dashboardLayout.widths.slice():null
    };
    if(section)clearPrintLayout(section);
    applyPrintFrameLayout(frame,layout);
    installPrintColumnResizers(frame,section,layout,showStatus);
    $('printRowLabel').textContent=`${Math.round(layout.row)}%`;
    $('printRowSlider').value=String(Math.round(layout.row));
    if(section)savePrintLayout(section,layout);
    showStatus(false);
  });

  $('printPreviewPrintBtn')?.addEventListener('click',()=>{
    try{
      if(section)savePrintLayout(section,layout);
      applyPrintFrameLayout(frame,layout);
      const target=frame?.contentWindow;
      if(!target)throw new Error('Print preview is not ready.');
      target.focus();
      target.print();
    }catch(e){
      toast(`Could not start printing: ${e.message}`,'error');
    }
  });

  frame.addEventListener('load',()=>{
    applyPrintFrameLayout(frame,layout);
    if(section)installPrintColumnResizers(frame,section,layout,showStatus);
  },{once:true});
  setTimeout(()=>frame?.focus(),80);
}
function printDocument(title,subtitle,bodyHtml,orientation='portrait',options={}){
  openPrintPreview(title,subtitle,bodyHtml,orientation,options);
}

function holdingsFilterDescription(items){
  const owner=state.selectedOwner==='ALL'?'Combined':shortOwner(state.selectedOwner);
  const asset=assetViewLabel();
  const type=els.holdingTypeFilter?.value||'ALL';
  const q=els.holdingSearch?.value.trim()||'';
  return `${items.length} visible · Investor: ${owner} · View: ${asset} · Type: ${type==='ALL'?'All assets':type}${q?` · Search: ${q}`:''}`;
}
function printHoldingsView(){
  const items=state.holdings.filter(holdingMatches),custom=sectionCustomColumns('HOLDINGS');
  const rows=items.map(h=>{
    const p=h.performance||{},s=h.transactionStats||{};
    const purchaseDates=exactDateList(s.purchaseDates?.length?s.purchaseDates:(h.buyDate?[h.buyDate]:[]));
    const saleDates=exactDateList(s.saleDates||[]);
    const customCells=custom.map(c=>`<td>${printEscape(formatCustomValuePlain(c,customValueFor('HOLDINGS',h.id,c.columnKey)))}</td>`).join('');
    return `<tr><td>${printEscape(shortOwner(h.owner))}</td><td>${printEscape(h.assetName)}<br><small>${printEscape(h.type)} ${printEscape(h.code||'')}</small></td>
      <td>${purchaseDates.length?purchaseDates.map(d=>printEscape(detailDate(d))).join('<br>'):'—'}</td>
      <td class="${saleDates.length?'neg':''}">${saleDates.length?saleDates.map(d=>printEscape(detailDate(d))).join('<br>'):'—'}</td>
      <td class="num">${printEscape(formatNumber(h.units))}</td><td class="num">${printEscape(formatCurrency(h.investedAmount))}</td><td class="num">${printEscape(formatCurrency(h.currentValue))}</td>
      <td class="num ${Number(h.gainLoss)>=0?'pos':'neg'}">${printEscape(formatCurrency(h.gainLoss))}</td>
      <td class="num ${h.realizedPnl!=null&&Number(h.realizedPnl)>=0?'pos':'neg'}">${h.realizedPnl==null?'—':printEscape(formatCurrency(h.realizedPnl))}</td>
      <td class="num ${h.totalPnlToDate!=null&&Number(h.totalPnlToDate)>=0?'pos':'neg'}">${h.totalPnlToDate==null?'—':printEscape(formatCurrency(h.totalPnlToDate))}</td>
      <td class="num ${Number(h.returnPct)>=0?'pos':'neg'}">${printEscape(formatPercent(h.returnPct))}</td><td class="num">${printEscape(formatPercent(h.xirr))}</td>
      <td class="num">${printEscape(formatPercent(p.m1))}</td><td class="num">${printEscape(formatPercent(p.y1))}</td><td class="num">${printEscape(formatPercent(p.y3))}</td><td>${printEscape(h.notes||'')}</td>${customCells}</tr>`;
  }).join('');
  const map=[0,1,2,3,4,6,8,9,10,11,12,13,16,18,19,22,...custom.map((c,i)=>23+i)];
  const dashboardLayout=dashboardPrintLayout('holdings',map),activeLayout=loadPrintLayout('holdings')||dashboardLayout;
  const customHeads=custom.map(c=>`<th>${printEscape(c.label)}</th>`).join(''),colCount=16+custom.length;
  const body=`<table>${printColgroup(activeLayout.widths)}<thead><tr><th>Investor</th><th>Investment</th><th>Purchase Date(s)</th><th>Sale Date(s)</th><th>Qty/Units</th><th>Invested</th><th>Current</th><th>Current P/L</th><th>Realised P/L</th><th>Total P/L</th><th>Return</th><th>XIRR</th><th>1M</th><th>1Y</th><th>3Y</th><th>Note</th>${customHeads}</tr></thead><tbody>${rows||`<tr><td colspan="${colCount}">No matching investments.</td></tr>`}</tbody></table>`;
  printDocument('Investment Portfolio — Exact Dates & P/L',holdingsFilterDescription(items),body,'landscape',{section:'holdings',dashboardLayout});
}
function watchFilterDescription(items){
  const parts=[`${items.length} visible`];
  if(els.watchTypeFilter?.value!=='ALL')parts.push(`Type: ${els.watchTypeFilter.value}`);
  if(els.watchPriorityFilter?.value!=='ALL')parts.push(`Priority: ${els.watchPriorityFilter.value}`);
  if(els.watchTargetFilter?.value!=='ALL')parts.push(`Target: ${els.watchTargetFilter.options[els.watchTargetFilter.selectedIndex]?.text||els.watchTargetFilter.value}`);
  if(els.watchSearch?.value.trim())parts.push(`Search: ${els.watchSearch.value.trim()}`);
  return parts.join(' · ');
}
function printWatchlistView(){
  const items=visibleWatchlist();
  const custom=sectionCustomColumns('WATCHLIST');
  const rows=items.map(x=>{const s=x.sourceDetails||{};const customCells=custom.map(c=>`<td>${printEscape(formatCustomValuePlain(c,customValueFor('WATCHLIST',x.id,c.columnKey)))}</td>`).join('');return `<tr><td>${printEscape(x.assetName)}<br><small>${printEscape(x.type)} ${printEscape(x.code||'')}</small></td><td class="num">${printEscape(formatCurrency(x.currentPrice))}</td><td class="num">${printEscape(formatCurrency(x.targetPrice))}</td><td class="num">${printEscape(formatPercent(x.distancePct))}</td><td>${printEscape(x.priority||'')}</td><td class="num">${printEscape(formatPercent(s.perf1M))}</td><td class="num">${printEscape(formatPercent(s.perf1Y))}</td><td class="num">${printEscape(formatPercent(s.perf3Y))}</td><td>${printEscape(s.valuation||'')}</td><td>${printEscape(s.moatRemark||'')}</td><td>${printEscape(x.notes||'')}</td>${customCells}</tr>`;}).join('');
  const map=[0,1,3,4,null,7,8,9,6,12,13,...custom.map((c,i)=>14+i)];
  const dashboardLayout=dashboardPrintLayout('watchlist',map);
  const activeLayout=loadPrintLayout('watchlist')||dashboardLayout;
  const customHeads=custom.map(c=>`<th>${printEscape(c.label)}</th>`).join('');
  const colCount=11+custom.length;
  const body=`<table>${printColgroup(activeLayout.widths)}<thead><tr><th>Asset</th><th>Live Price/NAV</th><th>Target</th><th>Distance</th><th>Priority</th><th>1M</th><th>1Y</th><th>3Y</th><th>P/E or P/B</th><th>Remark/Moat</th><th>Personal Note</th>${customHeads}</tr></thead><tbody>${rows||`<tr><td colspan="${colCount}">No matching watchlist items.</td></tr>`}</tbody></table>`;
  printDocument('Investment Watchlist — Filtered View',watchFilterDescription(items),body,'landscape',{section:'watchlist',dashboardLayout});
}
function printDiaryView(){
  const items=diaryVisibleItems();
  const subtitle=els.diarySummary?.textContent||`${items.length} entries`;
  const body=items.map(item=>`<article class="entry"><div class="entry-date">${printEscape(diaryDateLabel(item.entryDate))}</div><h3>${printEscape(item.title?.trim()||'Untitled entry')}</h3><div class="entry-text">${printEscape(item.text||'')}</div></article>`).join('')||'<p>No diary entries match this filter.</p>';
  printDocument('Daily Diary — Filtered View',subtitle,body,'portrait');
}
function printMonthlyView(){
  const items=monthlyVisibleItems();
  const y=els.monthlyYearFilter?.value||'ALL',m=els.monthlyMonthFilter?.value||'ALL';
  const filters=[y==='ALL'?'All years':y,m==='ALL'?'All months':els.monthlyMonthFilter.options[els.monthlyMonthFilter.selectedIndex]?.text];
  if(els.monthlyTypeFilter?.value!=='ALL')filters.push(els.monthlyTypeFilter.value);
  if(els.monthlyStatusFilter?.value!=='ALL')filters.push(els.monthlyStatusFilter.value);
  if(els.monthlySearch?.value.trim())filters.push(`Search: ${els.monthlySearch.value.trim()}`);
  const body=items.map(item=>`<article class="entry"><div class="entry-date">${printEscape(monthKeyLabel(item.monthKey))} · <span class="monthly-type">${printEscape(item.entryType)}</span>${item.entryType==='TARGET'?` · <span class="status">${printEscape(item.status==='COMPLETED'?'Achieved':'Open target')}</span>`:''}</div><h3>${printEscape(item.title?.trim()||item.entryType)}</h3><div class="entry-text">${printEscape(item.text||'')}</div></article>`).join('')||'<p>No monthly records match this filter.</p>';
  printDocument('Monthly Diary / Plan / Experience — Filtered View',`${items.length} items · ${filters.join(' · ')}`,body,'portrait');
}

function exportCsv(){
  const headers=['Investor','Type','Asset','Code','Exchange','All Purchase Dates','All Sale Dates','Units','Avg Buy','Invested','Current Price','Current Value','Current P/L Till Today','Realised P/L','Total P/L To Date','Gain %','XIRR','1D','1W','1M','6M','1Y','3Y','5Y','10Y','Personal Note'];
  const rows=visibleHoldings().map(h=>{
    const p=h.performance||{},s=h.transactionStats||{};
    const purchaseDates=exactDateList(s.purchaseDates?.length?s.purchaseDates:(h.buyDate?[h.buyDate]:[])).join(' | ');
    const saleDates=exactDateList(s.saleDates||[]).join(' | ');
    return[shortOwner(h.owner),h.type,h.assetName,h.code,h.exchange,purchaseDates,saleDates,h.units,Number(h.units)>0?Number(h.investedAmount)/Number(h.units):'',h.investedAmount,h.currentPrice,h.currentValue,h.gainLoss,h.realizedPnl,h.totalPnlToDate,h.returnPct,h.xirr,p.d1,p.w1,p.m1,p.m6,p.y1,p.y3,p.y5,p.y10,h.notes||''];
  });
  const csv=[headers,...rows].map(r=>r.map(csvCell).join(',')).join('\n'),blob=new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`my-finance-${state.selectedOwner==='ALL'?'combined':shortOwner(state.selectedOwner)}-${state.selectedAssetView.toLowerCase()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function changePassword(event){event.preventDefault();if(els.newPassword.value!==els.confirmPassword.value){toast('New passwords do not match.','error');return;}const b=event.submitter;setBusy(b,true,'Updating…');try{await api('changePassword',{currentPassword:els.currentPassword.value,newPassword:els.newPassword.value});closeModals();els.passwordForm.reset();toast('Password changed.','success');}catch(e){toast(e.message,'error');}finally{setBusy(b,false);}}

function dateShiftIso(value,days){
  const base=/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?new Date(`${value}T12:00:00`):new Date();
  base.setDate(base.getDate()+days);
  return localIsoDate(base);
}
function monthShiftIso(value,months){
  const valid=/^\d{4}-\d{2}$/.test(String(value||''))?String(value):localIsoMonth();
  const [y,m]=valid.split('-').map(Number);
  const d=new Date(y,m-1+months,1,12,0,0);
  return localIsoMonth(d);
}
function autosizeDiaryTextarea(el){
  if(!el)return;
  el.style.height='auto';
  el.style.height=`${Math.min(Math.max(el.scrollHeight,150),520)}px`;
}
function diaryDraftKey(){return `myfinance_daily_draft_${state.username||'guest'}_${els.diaryDate?.value||localIsoDate()}`;}
function monthlyDraftKey(){return `myfinance_monthly_draft_${state.username||'guest'}_${els.monthlyEntryMonth?.value||localIsoMonth()}_${els.monthlyEntryType?.value||'DIARY'}`;}
function updateDiaryWritingMeta(){
  if(els.diaryCharCount)els.diaryCharCount.textContent=`${els.diaryText?.value.length||0} / 5000`;
  if(els.monthlyCharCount)els.monthlyCharCount.textContent=`${els.monthlyText?.value.length||0} / 5000`;
  autosizeDiaryTextarea(els.diaryText);autosizeDiaryTextarea(els.monthlyText);
}
function saveDailyDraft(){
  if(!els.diaryText)return;
  const payload={title:els.diaryTitle.value||'',text:els.diaryText.value||'',savedAt:Date.now()};
  if(payload.title||payload.text)localStorage.setItem(diaryDraftKey(),JSON.stringify(payload));else localStorage.removeItem(diaryDraftKey());
  if(els.diaryDraftStatus)els.diaryDraftStatus.textContent=payload.title||payload.text?'Draft saved locally':'Draft ready';
}
function restoreDailyDraft(){
  if(els.diaryId?.value)return;
  const raw=localStorage.getItem(diaryDraftKey());
  if(!raw){if(els.diaryDraftStatus)els.diaryDraftStatus.textContent='Draft ready';updateDiaryWritingMeta();return;}
  try{const d=JSON.parse(raw);if(!els.diaryTitle.value)els.diaryTitle.value=d.title||'';if(!els.diaryText.value)els.diaryText.value=d.text||'';if(els.diaryDraftStatus)els.diaryDraftStatus.textContent='Local draft restored';}catch{}
  updateDiaryWritingMeta();
}
function clearDailyDraft(){localStorage.removeItem(diaryDraftKey());if(els.diaryDraftStatus)els.diaryDraftStatus.textContent='Saved';}
function scheduleDailyDraft(){clearTimeout(state.diaryDraftTimer);if(els.diaryDraftStatus)els.diaryDraftStatus.textContent='Saving draft…';state.diaryDraftTimer=setTimeout(saveDailyDraft,450);updateDiaryWritingMeta();}
function saveMonthlyDraft(){
  if(!els.monthlyText)return;
  const payload={title:els.monthlyTitle.value||'',text:els.monthlyText.value||'',savedAt:Date.now()};
  if(payload.title||payload.text)localStorage.setItem(monthlyDraftKey(),JSON.stringify(payload));else localStorage.removeItem(monthlyDraftKey());
  if(els.monthlyDraftStatus)els.monthlyDraftStatus.textContent=payload.title||payload.text?'Draft saved locally':'Draft ready';
}
function restoreMonthlyDraft(){
  if(els.monthlyId?.value)return;
  const raw=localStorage.getItem(monthlyDraftKey());
  if(!raw){if(els.monthlyDraftStatus)els.monthlyDraftStatus.textContent='Draft ready';updateDiaryWritingMeta();return;}
  try{const d=JSON.parse(raw);if(!els.monthlyTitle.value)els.monthlyTitle.value=d.title||'';if(!els.monthlyText.value)els.monthlyText.value=d.text||'';if(els.monthlyDraftStatus)els.monthlyDraftStatus.textContent='Local draft restored';}catch{}
  updateDiaryWritingMeta();
}
function clearMonthlyDraft(){localStorage.removeItem(monthlyDraftKey());if(els.monthlyDraftStatus)els.monthlyDraftStatus.textContent='Saved';}
function scheduleMonthlyDraft(){clearTimeout(state.monthlyDraftTimer);if(els.monthlyDraftStatus)els.monthlyDraftStatus.textContent='Saving draft…';state.monthlyDraftTimer=setTimeout(saveMonthlyDraft,450);updateDiaryWritingMeta();}
function setDailyDiaryDate(value,{syncBrowse=true,restore=true}={}){
  if(!value)return;els.diaryDate.value=value;if(syncBrowse){els.diaryBrowseDate.value=value;state.diaryView='DAILY';}
  if(!els.diaryId.value){els.diaryTitle.value='';els.diaryText.value='';}renderDiary();if(restore)restoreDailyDraft();updateDiaryWritingMeta();
}
function setMonthlyEntryMonth(value,{syncFilter=true,restore=true}={}){
  if(!value)return;els.monthlyEntryMonth.value=value;
  if(syncFilter){refreshMonthlyYearFilter();els.monthlyYearFilter.value=value.slice(0,4);els.monthlyMonthFilter.value=value.slice(5,7);}
  if(!els.monthlyId.value){els.monthlyTitle.value='';els.monthlyText.value='';}renderMonthlyDiary();if(restore)restoreMonthlyDraft();updateDiaryWritingMeta();
}
function activeHorizontalScrollTarget(){
  if(state.activeSection==='holdings')return document.querySelector('#holdingsSection .table-wrap');
  if(state.activeSection==='transactions')return document.querySelector('#transactionsSection .table-wrap');
  if(state.activeSection==='watchlist')return document.querySelector('#watchlistSection .table-wrap');
  return null;
}
function horizontalSectionLabel(){
  if(state.activeSection==='holdings')return 'Holdings · smooth left / right';
  if(state.activeSection==='transactions')return 'Transactions · smooth left / right';
  if(state.activeSection==='watchlist')return 'Watchlist · smooth left / right';
  return 'Horizontal scroll';
}
function refreshDashboardHScroll(){
  if(!els.dashboardHScroll||!els.dashboardHScrollRange)return;
  const target=activeHorizontalScrollTarget();
  state.hScrollTarget=target;

  // V15.9: show the fixed controller whenever Holdings or Watchlist is active.
  // Do not hide it based on early scrollWidth measurements; some browsers calculate
  // table dimensions a moment after a hidden section becomes visible.
  const shouldShow=Boolean(target&&['holdings','transactions','watchlist'].includes(state.activeSection));
  els.dashboardHScroll.classList.toggle('hidden',!shouldShow);
  if(!shouldShow)return;

  const maxScroll=Math.max(0,target.scrollWidth-target.clientWidth);
  const pct=maxScroll>0?Math.round((target.scrollLeft/maxScroll)*100):0;
  els.dashboardHScrollRange.disabled=maxScroll<=0;
  els.dashboardHScrollRange.value=maxScroll>0?String(Math.round((target.scrollLeft/maxScroll)*1000)):'0';
  if(els.dashboardHScrollPct)els.dashboardHScrollPct.textContent=`${pct}%`;
  if(els.dashboardHScrollLabel)els.dashboardHScrollLabel.textContent=horizontalSectionLabel();

  els.dashboardHScrollLeft.disabled=maxScroll<=0||target.scrollLeft<=1;
  els.dashboardHScrollRight.disabled=maxScroll<=0||target.scrollLeft>=maxScroll-1;
}
let hScrollRangeRaf=0;
let hScrollUiRaf=0;

function queueHScrollUiRefresh(){
  if(hScrollUiRaf)return;
  hScrollUiRaf=requestAnimationFrame(()=>{
    hScrollUiRaf=0;
    refreshDashboardHScroll();
  });
}
function syncHScrollFromRange(){
  const target=state.hScrollTarget||activeHorizontalScrollTarget();
  if(!target||!els.dashboardHScrollRange)return;
  const value=Number(els.dashboardHScrollRange.value||0);
  if(hScrollRangeRaf)cancelAnimationFrame(hScrollRangeRaf);
  hScrollRangeRaf=requestAnimationFrame(()=>{
    hScrollRangeRaf=0;
    const maxScroll=Math.max(0,target.scrollWidth-target.clientWidth);
    animateHorizontalScroll(target,maxScroll*(value/1000),150);
    queueHScrollUiRefresh();
  });
}
let hScrollAnimRaf=0;
function animateHorizontalScroll(target,to,duration=360){
  if(!target)return;
  if(hScrollAnimRaf)cancelAnimationFrame(hScrollAnimRaf);
  const start=target.scrollLeft;
  const max=Math.max(0,target.scrollWidth-target.clientWidth);
  const end=Math.max(0,Math.min(max,to));
  const delta=end-start;
  if(Math.abs(delta)<1)return;
  const began=performance.now();
  const ease=t=>1-Math.pow(1-t,3);
  const frame=now=>{
    const t=Math.min(1,(now-began)/duration);
    target.scrollLeft=start+delta*ease(t);
    queueHScrollUiRefresh();
    if(t<1)hScrollAnimRaf=requestAnimationFrame(frame);
    else hScrollAnimRaf=0;
  };
  hScrollAnimRaf=requestAnimationFrame(frame);
}
function scrollDashboardHorizontal(direction,ratio=.52){
  const target=state.hScrollTarget||activeHorizontalScrollTarget();
  if(!target)return;
  const step=Math.max(160,Math.min(520,target.clientWidth*ratio));
  animateHorizontalScroll(target,target.scrollLeft+(direction*step),360);
}
function shouldIgnoreHorizontalKeys(target){
  if(!target)return false;
  const tag=String(target.tagName||'').toUpperCase();
  return ['INPUT','TEXTAREA','SELECT'].includes(tag)||target.isContentEditable;
}
function handleDashboardHorizontalKeydown(e){
  if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.altKey)return;
  if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
  if(shouldIgnoreHorizontalKeys(e.target))return;
  if(!['holdings','transactions','watchlist'].includes(state.activeSection))return;
  const target=state.hScrollTarget||activeHorizontalScrollTarget();
  if(!target||target.scrollWidth<=target.clientWidth+2)return;

  e.preventDefault();
  const dir=e.key==='ArrowRight'?1:-1;
  // Normal press = smaller smooth movement; Shift = larger movement.
  scrollDashboardHorizontal(dir,e.shiftKey?.58:.24);
}
function bindSmoothHorizontalTable(wrap){
  if(!wrap||wrap.dataset.smoothHorizontalBound==='1')return;
  wrap.dataset.smoothHorizontalBound='1';
  wrap.classList.add('keyboard-smooth-ready');

  // Shift + mouse-wheel becomes smooth horizontal movement.
  wrap.addEventListener('wheel',e=>{
    const max=Math.max(0,wrap.scrollWidth-wrap.clientWidth);
    if(max<=0)return;
    if(e.shiftKey&&Math.abs(e.deltaY)>0){
      e.preventDefault();
      animateHorizontalScroll(wrap,wrap.scrollLeft+(e.deltaY*.62),190);
      queueHScrollUiRefresh();
    }
  },{passive:false});

  // Coalesce the UI-controller refresh to one animation frame.
  wrap.addEventListener('scroll',()=>{
    if(wrap===state.hScrollTarget)queueHScrollUiRefresh();
  },{passive:true});
}
function scheduleDashboardHScrollRefresh(){
  requestAnimationFrame(()=>{
    refreshDashboardHScroll();
    setTimeout(refreshDashboardHScroll,80);
    setTimeout(refreshDashboardHScroll,300);
    setTimeout(refreshDashboardHScroll,700);
  });
}

function openQuickDiary(mode='DAILY'){
  state.quickDiaryMode=mode==='MONTHLY'?'MONTHLY':'DAILY';
  renderQuickDiaryMode();
  if(!els.quickDailyDate.value)els.quickDailyDate.value=localIsoDate();
  if(!els.quickMonthlyMonth.value)els.quickMonthlyMonth.value=localIsoMonth();
  els.quickDiaryPanel.classList.add('open');
  els.quickDiaryPanel.setAttribute('aria-hidden','false');
  setTimeout(()=>state.quickDiaryMode==='DAILY'?els.quickDailyText?.focus():els.quickMonthlyText?.focus(),80);
}
function closeQuickDiary(){
  els.quickDiaryPanel.classList.remove('open');
  els.quickDiaryPanel.setAttribute('aria-hidden','true');
}
function renderQuickDiaryMode(){
  const monthly=state.quickDiaryMode==='MONTHLY';
  els.quickDailyForm.classList.toggle('hidden',monthly);
  els.quickMonthlyForm.classList.toggle('hidden',!monthly);
  $$('[data-quick-diary-mode]').forEach(b=>b.classList.toggle('active',b.dataset.quickDiaryMode===state.quickDiaryMode));
}
function updateQuickDiaryCounts(){
  els.quickDailyCount.textContent=`${els.quickDailyText.value.length} / 5000`;
  els.quickMonthlyCount.textContent=`${els.quickMonthlyText.value.length} / 5000`;
  autosizeDiaryTextarea(els.quickDailyText);
  autosizeDiaryTextarea(els.quickMonthlyText);
}
async function saveQuickDaily(event){
  event.preventDefault();
  if(!els.quickDailyDate.value||!els.quickDailyText.value.trim()){toast('Choose a date and write the daily entry.','error');return;}
  setBusy(els.quickDailySaveBtn,true,'Saving…');els.quickDailyStatus.textContent='Saving…';
  try{
    const result=await api('saveDiaryEntry',{entry:{id:'',entryDate:els.quickDailyDate.value,title:els.quickDailyTitle.value.trim(),text:els.quickDailyText.value.trim()}});
    applyBootstrap(result.data);saveCache(result.data);els.quickDailyTitle.value='';els.quickDailyText.value='';updateQuickDiaryCounts();els.quickDailyStatus.textContent='Saved';toast('Daily diary saved.','success');
  }catch(e){els.quickDailyStatus.textContent='Save failed';toast(e.message,'error');}
  finally{setBusy(els.quickDailySaveBtn,false);}
}
async function saveQuickMonthly(event){
  event.preventDefault();
  if(!els.quickMonthlyMonth.value||!els.quickMonthlyText.value.trim()){toast('Choose a month and write the monthly item.','error');return;}
  setBusy(els.quickMonthlySaveBtn,true,'Saving…');els.quickMonthlyStatus.textContent='Saving…';
  try{
    const result=await api('saveMonthlyItem',{item:{id:'',monthKey:els.quickMonthlyMonth.value,entryType:els.quickMonthlyType.value,title:els.quickMonthlyTitle.value.trim(),text:els.quickMonthlyText.value.trim()}});
    applyBootstrap(result.data);saveCache(result.data);els.quickMonthlyTitle.value='';els.quickMonthlyText.value='';updateQuickDiaryCounts();els.quickMonthlyStatus.textContent='Saved';toast('Monthly diary item saved.','success');
  }catch(e){els.quickMonthlyStatus.textContent='Save failed';toast(e.message,'error');}
  finally{setBusy(els.quickMonthlySaveBtn,false);}
}

function diaryDateLabel(value){
  if(!value)return 'No date';
  const d=new Date(`${String(value).slice(0,10)}T00:00:00`);
  return Number.isNaN(d.getTime())?String(value):new Intl.DateTimeFormat('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(d);
}
function resetDiaryForm(dateValue=''){
  els.diaryForm?.reset();
  els.diaryId.value='';
  els.diaryDate.value=dateValue||els.diaryBrowseDate?.value||localIsoDate();
  els.diarySaveStatus.textContent='New entry';
  restoreDailyDraft();
  updateDiaryWritingMeta();
}
function openDiaryEntry(item){
  if(!item)return;
  switchSection('diary');
  els.diaryId.value=item.id||'';
  els.diaryDate.value=item.entryDate||localIsoDate();
  els.diaryTitle.value=item.title||'';
  els.diaryText.value=item.text||'';
  els.diarySaveStatus.textContent=`Editing ${diaryDateLabel(item.entryDate)}`;
  if(els.diaryDraftStatus)els.diaryDraftStatus.textContent='Editing saved entry';
  updateDiaryWritingMeta();
  setTimeout(()=>els.diaryText?.focus(),50);
}
function diaryVisibleItems(){
  const q=String(els.diarySearch?.value||'').trim().toLowerCase();
  let items=[...state.diary];
  if(q){
    items=items.filter(x=>`${x.entryDate||''} ${x.title||''} ${x.text||''}`.toLowerCase().includes(q));
  }else if(state.diaryView==='DAILY'){
    const day=els.diaryBrowseDate?.value||localIsoDate();
    items=items.filter(x=>String(x.entryDate||'').slice(0,10)===day);
  }else if(state.diaryView==='MONTHLY'){
    const month=els.diaryBrowseMonth?.value||localIsoMonth();
    items=items.filter(x=>String(x.entryDate||'').slice(0,7)===month);
  }else if(state.diaryView==='RANGE'){
    const from=els.diaryFromDate?.value||'0000-01-01';
    const to=els.diaryToDate?.value||'9999-12-31';
    items=items.filter(x=>{
      const d=String(x.entryDate||'').slice(0,10);
      return d>=from&&d<=to;
    });
  }
  return items.sort((a,b)=>{
    const byDate=String(b.entryDate||'').localeCompare(String(a.entryDate||''));
    return byDate!==0?byDate:String(b.updatedAt||'').localeCompare(String(a.updatedAt||''));
  });
}
function renderDiary(){
  if(!els.diaryList)return;
  const q=String(els.diarySearch?.value||'').trim();
  const items=diaryVisibleItems();
  els.diaryDayControl.classList.toggle('hidden',state.diaryView!=='DAILY'||Boolean(q));
  els.diaryMonthControl.classList.toggle('hidden',state.diaryView!=='MONTHLY'||Boolean(q));
  if(els.diaryRangeControl)els.diaryRangeControl.classList.toggle('hidden',state.diaryView!=='RANGE'||Boolean(q));
  $$('[data-diary-view]').forEach(b=>b.classList.toggle('active',b.dataset.diaryView===state.diaryView));

  if(q)els.diarySummary.textContent=`Search results · ${items.length} entr${items.length===1?'y':'ies'}`;
  else if(state.diaryView==='DAILY')els.diarySummary.textContent=`${diaryDateLabel(els.diaryBrowseDate.value||localIsoDate())} · ${items.length} entr${items.length===1?'y':'ies'}`;
  else if(state.diaryView==='MONTHLY'){
    const month=els.diaryBrowseMonth.value||localIsoMonth(),d=new Date(`${month}-01T00:00:00`);
    const label=Number.isNaN(d.getTime())?month:new Intl.DateTimeFormat('en-IN',{month:'long',year:'numeric'}).format(d);
    els.diarySummary.textContent=`${label} · ${items.length} entr${items.length===1?'y':'ies'}`;
  }else{
    const from=els.diaryFromDate.value||'Start',to=els.diaryToDate.value||'Today';
    els.diarySummary.textContent=`${from} → ${to} · ${items.length} entr${items.length===1?'y':'ies'}`;
  }

  let lastDate='';
  els.diaryList.innerHTML=items.map(item=>{
    const date=String(item.entryDate||'').slice(0,10);
    const dateHeader=state.diaryView==='MONTHLY'&&!q&&date!==lastDate?`<div class="diary-date-divider"><span>${escapeHtml(diaryDateLabel(date))}</span></div>`:'';
    lastDate=date;
    return `${dateHeader}<article class="diary-card" data-diary-view-entry="${escapeHtml(item.id)}">
      <div class="diary-card-head">
        <div><span class="diary-date-pill">${escapeHtml(diaryDateLabel(date))}</span><h4>${escapeHtml(item.title?.trim()||'Untitled entry')}</h4></div>
        <div class="diary-card-actions">
          <button type="button" class="small-button" data-edit-diary="${escapeHtml(item.id)}">Edit</button>
          <button type="button" class="small-button danger" data-delete-diary="${escapeHtml(item.id)}">Delete</button>
        </div>
      </div>
      <div class="diary-card-text">${escapeHtml(item.text||'')}</div>
      <div class="diary-card-foot"><span>Updated ${escapeHtml(dateLabel(item.updatedAt))}</span></div>
    </article>`;
  }).join('');
  els.diaryEmpty.classList.toggle('hidden',items.length>0);
}
async function saveDiaryEntry(event){
  event.preventDefault();
  if(!els.diaryDate.value||!els.diaryText.value.trim()){toast('Choose a date and write a diary entry.','error');return;}
  setBusy(els.saveDiaryBtn,true,'Saving…');
  els.diarySaveStatus.textContent='Saving…';
  try{
    const result=await api('saveDiaryEntry',{entry:{
      id:els.diaryId.value,
      entryDate:els.diaryDate.value,
      title:els.diaryTitle.value.trim(),
      text:els.diaryText.value.trim()
    }});
    applyBootstrap(result.data);
    saveCache(result.data);
    els.diaryBrowseDate.value=els.diaryDate.value;
    els.diaryBrowseMonth.value=els.diaryDate.value.slice(0,7);
    state.diaryView='DAILY';
    clearDailyDraft();
    resetDiaryForm(els.diaryBrowseDate.value);
    renderDiary();
    toast('Diary entry saved.','success');
  }catch(e){els.diarySaveStatus.textContent='Save failed';toast(e.message,'error');}
  finally{setBusy(els.saveDiaryBtn,false);}
}
async function deleteDiaryEntry(id){
  if(!id||!confirm('Delete this diary entry?'))return;
  try{
    const result=await api('deleteDiaryEntry',{id});
    applyBootstrap(result.data);saveCache(result.data);renderDiary();toast('Diary entry deleted.','success');
  }catch(e){toast(e.message,'error');}
}


function monthKeyLabel(monthKey){
  if(!/^\d{4}-\d{2}$/.test(String(monthKey||'')))return String(monthKey||'');
  const d=new Date(`${monthKey}-01T00:00:00`);
  return new Intl.DateTimeFormat('en-IN',{month:'long',year:'numeric'}).format(d);
}
function currentMonthlyFilterKey(){
  const year=els.monthlyYearFilter?.value||String(new Date().getFullYear());
  const month=els.monthlyMonthFilter?.value||String(new Date().getMonth()+1).padStart(2,'0');
  return year!=='ALL'&&month!=='ALL'?`${year}-${month}`:'';
}
function refreshMonthlyYearFilter(){
  if(!els.monthlyYearFilter)return;
  const current=String(new Date().getFullYear());
  const years=new Set([current]);
  state.monthlyDiary.forEach(x=>{const y=String(x.monthKey||'').slice(0,4);if(/^\d{4}$/.test(y))years.add(y);});
  state.monthStatus.forEach(x=>{const y=String(x.monthKey||'').slice(0,4);if(/^\d{4}$/.test(y))years.add(y);});
  const previous=els.monthlyYearFilter.value||current;
  const sorted=[...years].sort((a,b)=>Number(b)-Number(a));
  els.monthlyYearFilter.innerHTML='<option value="ALL">All years</option>'+sorted.map(y=>`<option value="${y}">${y}</option>`).join('');
  els.monthlyYearFilter.value=[...sorted,'ALL'].includes(previous)?previous:current;
}
function resetMonthlyForm(monthValue=''){
  els.monthlyForm?.reset();
  els.monthlyId.value='';
  els.monthlyEntryMonth.value=monthValue||currentMonthlyFilterKey()||localIsoMonth();
  els.monthlyEntryType.value='DIARY';
  els.monthlySaveStatus.textContent='New monthly item';
  updateMonthlyTargetHelp();
  restoreMonthlyDraft();
  updateDiaryWritingMeta();
}
function updateMonthlyTargetHelp(){
  if(!els.monthlyTargetHelp)return;
  const isTarget=els.monthlyEntryType.value==='TARGET';
  els.monthlyTargetHelp.innerHTML=isTarget
    ? 'Save the target first. When achieved, use <strong>Mark completed</strong>. The month can be completed after all its targets are achieved.'
    : 'Use this space for a monthly diary, plan or experience. It remains saved with the selected month.';
}
function openMonthlyItem(item){
  if(!item)return;
  state.diaryWorkspace='MONTHLY';
  renderDiaryWorkspace();
  els.monthlyId.value=item.id||'';
  els.monthlyEntryMonth.value=item.monthKey||localIsoMonth();
  els.monthlyEntryType.value=item.entryType||'DIARY';
  els.monthlyTitle.value=item.title||'';
  els.monthlyText.value=item.text||'';
  els.monthlySaveStatus.textContent=`Editing ${monthKeyLabel(item.monthKey)}`;
  if(els.monthlyDraftStatus)els.monthlyDraftStatus.textContent='Editing saved item';
  updateDiaryWritingMeta();
  updateMonthlyTargetHelp();
  setTimeout(()=>els.monthlyText?.focus(),50);
}
function monthlyVisibleItems(){
  const y=els.monthlyYearFilter?.value||'ALL';
  const m=els.monthlyMonthFilter?.value||'ALL';
  const type=els.monthlyTypeFilter?.value||'ALL';
  const status=els.monthlyStatusFilter?.value||'ALL';
  const q=String(els.monthlySearch?.value||'').trim().toLowerCase();
  return [...state.monthlyDiary].filter(item=>{
    const key=String(item.monthKey||'');
    if(y!=='ALL'&&key.slice(0,4)!==y)return false;
    if(m!=='ALL'&&key.slice(5,7)!==m)return false;
    if(type!=='ALL'&&item.entryType!==type)return false;
    if(status!=='ALL'){
      if(item.entryType!=='TARGET')return false;
      if(status==='OPEN'&&item.status==='COMPLETED')return false;
      if(status==='COMPLETED'&&item.status!=='COMPLETED')return false;
    }
    if(q&&!`${item.monthKey||''} ${item.entryType||''} ${item.title||''} ${item.text||''}`.toLowerCase().includes(q))return false;
    return true;
  }).sort((a,b)=>{
    const byMonth=String(b.monthKey||'').localeCompare(String(a.monthKey||''));
    if(byMonth!==0)return byMonth;
    const targetOrder=(a.entryType==='TARGET'?0:1)-(b.entryType==='TARGET'?0:1);
    if(targetOrder!==0)return targetOrder;
    return String(b.updatedAt||'').localeCompare(String(a.updatedAt||''));
  });
}
function monthStatusFor(monthKey){
  return state.monthStatus.find(x=>x.monthKey===monthKey)||null;
}
function monthTargets(monthKey){
  return state.monthlyDiary.filter(x=>x.monthKey===monthKey&&x.entryType==='TARGET');
}
function renderMonthCompletion(){
  if(!els.monthCompletionPanel)return;
  const key=currentMonthlyFilterKey();
  if(!key){
    els.monthCompletionPanel.classList.add('year-mode');
    els.monthCompletionTitle.textContent='Year / multi-month view';
    els.monthCompletionText.textContent='Choose one specific year and month to manage target completion and close the month.';
    els.monthProgressBar.style.width='0%';
    els.monthProgressLabel.textContent='Select a month';
    els.completeMonthBtn.disabled=true;
    els.completeMonthBtn.textContent='✓ Complete month';
    return;
  }
  els.monthCompletionPanel.classList.remove('year-mode');
  const targets=monthTargets(key);
  const completed=targets.filter(x=>x.status==='COMPLETED').length;
  const pct=targets.length?Math.round(completed/targets.length*100):0;
  const status=monthStatusFor(key);
  const monthDone=status?.status==='COMPLETED';
  els.monthCompletionTitle.textContent=monthKeyLabel(key);
  els.monthCompletionText.textContent=monthDone
    ? `Month completed and saved${status.completedAt?` · ${dateLabel(status.completedAt)}`:''}.`
    : targets.length
      ? `${targets.length-completed} target${targets.length-completed===1?'':'s'} still open.`
      : 'No targets yet. You can still save diary, plan and experiences, or add a target.';
  els.monthProgressBar.style.width=`${monthDone?100:pct}%`;
  els.monthProgressLabel.textContent=monthDone?'Month completed':`${completed} / ${targets.length} targets completed`;
  els.completeMonthBtn.disabled=!monthDone&&targets.length>0&&completed<targets.length;
  els.completeMonthBtn.textContent=monthDone?'↺ Reopen month':'✓ Complete month';
}
function renderCompletedMonthArchive(){
  if(!els.completedMonthArchive)return;
  const y=els.monthlyYearFilter?.value||'ALL';
  const m=els.monthlyMonthFilter?.value||'ALL';
  const completed=state.monthStatus
    .filter(x=>x.status==='COMPLETED')
    .filter(x=>y==='ALL'||String(x.monthKey).slice(0,4)===y)
    .filter(x=>m==='ALL'||String(x.monthKey).slice(5,7)===m)
    .sort((a,b)=>String(b.monthKey).localeCompare(String(a.monthKey)));
  els.completedMonthArchive.innerHTML=completed.length
    ? `<div class="completed-archive-head"><strong>Completed months</strong><span>${completed.length} saved</span></div><div class="completed-month-chips">${completed.map(x=>`<button type="button" data-open-completed-month="${escapeHtml(x.monthKey)}">✓ ${escapeHtml(monthKeyLabel(x.monthKey))}</button>`).join('')}</div>`
    : '';
}
function renderMonthlyDiary(){
  if(!els.monthlyList)return;
  const items=monthlyVisibleItems();
  const y=els.monthlyYearFilter.value||'ALL',m=els.monthlyMonthFilter.value||'ALL';
  const key=y!=='ALL'&&m!=='ALL'?`${y}-${m}`:'';
  els.monthlyListTitle.textContent=key?monthKeyLabel(key):y!=='ALL'?`${y} monthly records`:'All monthly records';
  els.monthlyResultCount.textContent=`${items.length} item${items.length===1?'':'s'}`;
  renderMonthCompletion();
  renderCompletedMonthArchive();

  let lastMonth='';
  els.monthlyList.innerHTML=items.map(item=>{
    const monthHeader=item.monthKey!==lastMonth?`<div class="monthly-month-divider"><span>${escapeHtml(monthKeyLabel(item.monthKey))}</span>${monthStatusFor(item.monthKey)?.status==='COMPLETED'?'<b>✓ Completed month</b>':''}</div>`:'';
    lastMonth=item.monthKey;
    const typeLabel={DIARY:'Diary',PLAN:'Plan',EXPERIENCE:'Experience',TARGET:'Target'}[item.entryType]||item.entryType;
    const isTarget=item.entryType==='TARGET';
    const isDone=item.status==='COMPLETED';
    return `${monthHeader}<article class="monthly-item-card type-${escapeHtml(String(item.entryType||'').toLowerCase())} ${isTarget&&isDone?'completed-target':''}">
      <div class="monthly-item-head">
        <div><span class="monthly-type-badge">${escapeHtml(typeLabel)}</span><h4>${escapeHtml(item.title?.trim()||typeLabel)}</h4></div>
        <div class="monthly-item-actions">
          ${isTarget?`<button type="button" class="small-button ${isDone?'completed-button':''}" data-toggle-monthly-target="${escapeHtml(item.id)}">${isDone?'✓ Completed':'Mark completed'}</button>`:''}
          <button type="button" class="small-button" data-edit-monthly="${escapeHtml(item.id)}">Edit</button>
          <button type="button" class="small-button danger" data-delete-monthly="${escapeHtml(item.id)}">Delete</button>
        </div>
      </div>
      <div class="monthly-item-text">${escapeHtml(item.text||'')}</div>
      <div class="monthly-item-foot"><span>${escapeHtml(monthKeyLabel(item.monthKey))}</span>${isTarget?`<span class="${isDone?'target-done':'target-open'}">${isDone?'Achieved':'Open target'}</span>`:''}</div>
    </article>`;
  }).join('');
  els.monthlyEmpty.classList.toggle('hidden',items.length>0);
}
function renderDiaryWorkspace(){
  const monthly=state.diaryWorkspace==='MONTHLY';
  els.dailyDiaryWorkspace.classList.toggle('hidden',monthly);
  els.monthlyDiaryWorkspace.classList.toggle('hidden',!monthly);
  $$('[data-diary-workspace]').forEach(b=>b.classList.toggle('active',b.dataset.diaryWorkspace===state.diaryWorkspace));
  els.newDiaryEntryBtn.textContent=monthly?'+ New monthly item':'+ New daily entry';
  if(monthly){refreshMonthlyYearFilter();renderMonthlyDiary();}
  else renderDiary();
}
async function saveMonthlyItem(event){
  event.preventDefault();
  const monthKey=els.monthlyEntryMonth.value;
  const text=els.monthlyText.value.trim();
  if(!monthKey||!text){toast('Choose a month and enter details.','error');return;}
  setBusy(els.saveMonthlyBtn,true,'Saving…');
  els.monthlySaveStatus.textContent='Saving…';
  try{
    const result=await api('saveMonthlyItem',{item:{
      id:els.monthlyId.value,
      monthKey,
      entryType:els.monthlyEntryType.value,
      title:els.monthlyTitle.value.trim(),
      text
    }});
    applyBootstrap(result.data);saveCache(result.data);
    els.monthlyYearFilter.value=monthKey.slice(0,4);
    els.monthlyMonthFilter.value=monthKey.slice(5,7);
    clearMonthlyDraft();
    resetMonthlyForm(monthKey);
    renderMonthlyDiary();
    toast('Monthly item saved.','success');
  }catch(e){els.monthlySaveStatus.textContent='Save failed';toast(e.message,'error');}
  finally{setBusy(els.saveMonthlyBtn,false);}
}
async function deleteMonthlyItem(id){
  if(!id||!confirm('Delete this monthly item?'))return;
  try{
    const result=await api('deleteMonthlyItem',{id});
    applyBootstrap(result.data);saveCache(result.data);renderMonthlyDiary();toast('Monthly item deleted.','success');
  }catch(e){toast(e.message,'error');}
}
async function toggleMonthlyTarget(id){
  const item=state.monthlyDiary.find(x=>x.id===id);
  if(!item)return;
  const completed=item.status!=='COMPLETED';
  try{
    const result=await api('toggleMonthlyTarget',{id,completed});
    applyBootstrap(result.data);saveCache(result.data);renderMonthlyDiary();
    toast(completed?'Target marked completed.':'Target reopened.','success');
  }catch(e){toast(e.message,'error');}
}
async function toggleMonthCompletion(){
  const key=currentMonthlyFilterKey();
  if(!key){toast('Select one specific month first.','error');return;}
  const current=monthStatusFor(key);
  const completed=current?.status!=='COMPLETED';
  try{
    const result=await api('setMonthStatus',{monthKey:key,completed});
    applyBootstrap(result.data);saveCache(result.data);renderMonthlyDiary();
    toast(completed?`${monthKeyLabel(key)} completed and saved.`:`${monthKeyLabel(key)} reopened.`,'success');
  }catch(e){toast(e.message,'error');}
}

function updateDataFullscreenButtons(){
  const mode=state.dataFullscreenSection;
  if(els.holdingsFullscreenBtn){
    const active=mode==='holdings';
    els.holdingsFullscreenBtn.setAttribute('aria-pressed',active?'true':'false');
    els.holdingsFullscreenBtn.textContent=active?'✕ Exit full screen':'⛶ Full screen';
    els.holdingsFullscreenBtn.title=active?'Return Holdings to normal dashboard view':'Expand Holdings to full browser area';
  }
  if(els.watchlistFullscreenBtn){
    const active=mode==='watchlist';
    els.watchlistFullscreenBtn.setAttribute('aria-pressed',active?'true':'false');
    els.watchlistFullscreenBtn.textContent=active?'✕ Exit full screen':'⛶ Full screen';
    els.watchlistFullscreenBtn.title=active?'Return Watchlist to normal dashboard view':'Expand Watchlist to full browser area';
  }
}
function enterDataFullscreen(section){
  if(!['holdings','watchlist'].includes(section))return;
  if(state.activeSection!==section)switchSection(section);
  closeUtilityDrawer();
  state.dataFullscreenSection=section;
  document.body.classList.add('data-fullscreen-open');
  const target=$(section==='holdings'?'holdingsSection':'watchlistSection');
  const other=$(section==='holdings'?'watchlistSection':'holdingsSection');
  target?.classList.add('data-fullscreen-active');
  other?.classList.remove('data-fullscreen-active');
  updateDataFullscreenButtons();
  if(els.dashboardHScroll)els.dashboardHScroll.classList.add('hidden');
  setTimeout(()=>{
    const wrap=target?.querySelector('.table-wrap');
    if(wrap)wrap.focus?.({preventScroll:true});
  },50);
}
function exitDataFullscreen(){
  if(!state.dataFullscreenSection)return;
  $('holdingsSection')?.classList.remove('data-fullscreen-active');
  $('watchlistSection')?.classList.remove('data-fullscreen-active');
  document.body.classList.remove('data-fullscreen-open');
  state.dataFullscreenSection='';
  updateDataFullscreenButtons();
  scheduleDashboardHScrollRefresh();
}
function toggleDataFullscreen(section){
  if(state.dataFullscreenSection===section)exitDataFullscreen();
  else enterDataFullscreen(section);
}

function switchSection(section){
  if(state.dataFullscreenSection&&state.dataFullscreenSection!==section)exitDataFullscreen();
  state.activeSection=section;
  document.body.classList.remove('section-overview','section-holdings','section-transactions','section-watchlist','section-diary','section-users');
  document.body.classList.add(`section-${section}`);
  const titles={overview:state.overviewMode==='INVESTMENT'?'Investment overview':'My dashboard',holdings:'Holdings & performance',transactions:'Transactions',watchlist:'Watchlist',diary:'Diary',users:'User administration'};
  if(els.pageTitle)els.pageTitle.textContent=titles[section]||'My Finance';
  ['overview','holdings','transactions','watchlist','diary','users'].forEach(name=>{
    const sec=$(`${name}Section`);
    if(sec)sec.classList.toggle('hidden',name!==section);
  });
  $$('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===section));
  if(section==='diary'){
    if(els.diaryBrowseDate&&!els.diaryBrowseDate.value)els.diaryBrowseDate.value=localIsoDate();
    if(els.diaryBrowseMonth&&!els.diaryBrowseMonth.value)els.diaryBrowseMonth.value=localIsoMonth();
    if(els.diaryDate&&!els.diaryDate.value)els.diaryDate.value=els.diaryBrowseDate?.value||localIsoDate();
    if(els.dailyDiaryWorkspace&&els.monthlyDiaryWorkspace)renderDiaryWorkspace();
  }
  if(section==='users'&&state.user?.role==='ADMIN'&&els.usersBody)loadUsers();
  if(section==='overview')setOverviewMode('PERSONAL');
  if(lifeQuoteAutoContextVisible())startLifeQuoteShuffle();else if(!(state.utilityDrawerOpen&&state.utilityDrawerTab==='QUOTE'))stopLifeQuoteShuffle();
  scheduleDashboardHScrollRefresh();
}
async function loadUsers(){
  try{
    const r=await api('adminListUsers');
    state.users=r.users||[];
    renderUsers();
  }catch(e){
    toast(e.message,'error');
  }
}

function generateStrongUserPassword(){
  const upper='ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower='abcdefghijkmnopqrstuvwxyz';
  const nums='23456789';
  const symbols='!@#$%&*?';
  const all=upper+lower+nums+symbols;
  const pick=s=>s[Math.floor(Math.random()*s.length)];
  let chars=[pick(upper),pick(lower),pick(nums),pick(symbols)];
  for(let i=chars.length;i<14;i++)chars.push(pick(all));
  for(let i=chars.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [chars[i],chars[j]]=[chars[j],chars[i]];
  }
  return chars.join('');
}

function userPasswordIsStrong(password){
  const p=String(password||'');
  return p.length>=10&&/[A-Z]/.test(p)&&/[a-z]/.test(p)&&/[0-9]/.test(p)&&/[^A-Za-z0-9]/.test(p);
}

function setUserFormStatus(message,type=''){
  if(!els.userFormStatus)return;
  els.userFormStatus.textContent=message||'';
  els.userFormStatus.className=`user-form-status ${type}`.trim();
}

function openCreateUserModal(){
  els.userForm?.reset();
  if(els.userFormMode)els.userFormMode.value='CREATE';
  if(els.editOriginalUsername)els.editOriginalUsername.value='';
  if(els.userModalTitle)els.userModalTitle.textContent='Create user';
  if(els.newUsername){els.newUsername.disabled=false;els.newUsername.readOnly=false;}
  if(els.usernameEditHelp)els.usernameEditHelp.textContent='3–60 characters: letters, numbers, dot, underscore or hyphen.';
  if(els.newUserActiveLabel)els.newUserActiveLabel.classList.add('hidden');
  if(els.userPasswordGroup)els.userPasswordGroup.classList.remove('hidden');
  if(els.newUserPassword)els.newUserPassword.value=generateStrongUserPassword();
  if(els.saveUserBtn)els.saveUserBtn.textContent='Create user';
  setUserFormStatus('A strong temporary password has been generated. Copy it before giving it to the user.','info');
  openModal('userModal');
  setTimeout(()=>els.newUsername?.focus(),50);
}

function openEditUserModal(username){
  const item=(state.users||[]).find(u=>String(u.username).toLowerCase()===String(username).toLowerCase());
  if(!item){toast('User not found.','error');return;}

  els.userForm?.reset();
  if(els.userFormMode)els.userFormMode.value='EDIT';
  if(els.editOriginalUsername)els.editOriginalUsername.value=item.username;
  if(els.userModalTitle)els.userModalTitle.textContent='Edit user';
  if(els.newUsername){
    els.newUsername.value=item.username;
    els.newUsername.disabled=false;
    els.newUsername.readOnly=true;
  }
  if(els.usernameEditHelp)els.usernameEditHelp.textContent='Username is fixed after creation so existing account data remains linked correctly.';
  if(els.newDisplayName)els.newDisplayName.value=item.displayName||'';
  if(els.newUserRole)els.newUserRole.value=String(item.role||'USER').toUpperCase();
  if(els.newUserActive)els.newUserActive.value=item.active?'true':'false';
  if(els.newUserActiveLabel)els.newUserActiveLabel.classList.remove('hidden');
  if(els.userPasswordGroup)els.userPasswordGroup.classList.add('hidden');
  if(els.newUserPassword)els.newUserPassword.value='';
  if(els.saveUserBtn)els.saveUserBtn.textContent='Save changes';
  setUserFormStatus('Edit display name, role or account status. Use Reset password separately to change the password.','info');
  openModal('userModal');
  setTimeout(()=>els.newDisplayName?.focus(),50);
}

async function copyUserPassword(){
  const value=String(els.newUserPassword?.value||'');
  if(!value){toast('No temporary password to copy.','error');return;}
  try{
    await navigator.clipboard.writeText(value);
    toast('Temporary password copied.','success');
  }catch{
    els.newUserPassword?.select();
    toast('Select and copy the temporary password.','info');
  }
}

async function saveUserForm(event){
  event.preventDefault();

  const mode=String(els.userFormMode?.value||'CREATE').toUpperCase();
  const button=event.submitter||els.saveUserBtn;
  setUserFormStatus('');

  if(mode==='CREATE'){
    const username=String(els.newUsername?.value||'').trim().toLowerCase();
    const displayName=String(els.newDisplayName?.value||'').trim();
    const role=String(els.newUserRole?.value||'USER').toUpperCase();
    const password=String(els.newUserPassword?.value||'');

    if(!/^[a-z0-9._-]{3,60}$/.test(username)){
      setUserFormStatus('Username must be 3–60 characters using letters, numbers, dot, underscore or hyphen.','error');
      els.newUsername?.focus();
      return;
    }
    if(!displayName){
      setUserFormStatus('Display name is required.','error');
      els.newDisplayName?.focus();
      return;
    }
    if(password&&!userPasswordIsStrong(password)){
      setUserFormStatus('Password needs at least 10 characters with uppercase, lowercase, number and symbol. Click Generate for a valid password.','error');
      els.newUserPassword?.focus();
      return;
    }

    setBusy(button,true,'Creating…');
    try{
      const r=await api('adminCreateUser',{username,displayName,role,password});
      state.users=r.users||state.users;
      renderUsers();

      const temp=r.temporaryPassword||password;
      closeModals();
      els.userForm?.reset();

      if(temp){
        try{await navigator.clipboard.writeText(temp);}catch{}
        toast(`User ${username} created. Temporary password copied.`, 'success');
      }else{
        toast(`User ${username} created.`, 'success');
      }
    }catch(e){
      setUserFormStatus(e.message||'Could not create user.','error');
      toast(e.message||'Could not create user.','error');
    }finally{
      setBusy(button,false);
    }
    return;
  }

  const username=String(els.editOriginalUsername?.value||'').trim().toLowerCase();
  const displayName=String(els.newDisplayName?.value||'').trim();
  const role=String(els.newUserRole?.value||'USER').toUpperCase();
  const active=String(els.newUserActive?.value||'true')==='true';

  if(!displayName){
    setUserFormStatus('Display name is required.','error');
    els.newDisplayName?.focus();
    return;
  }

  setBusy(button,true,'Saving…');
  try{
    const r=await api('adminUpdateUser',{username,displayName,role,active});
    state.users=r.users||state.users;
    renderUsers();
    closeModals();
    toast(`User ${username} updated.`, 'success');
  }catch(e){
    setUserFormStatus(e.message||'Could not update user.','error');
    toast(e.message||'Could not update user.','error');
  }finally{
    setBusy(button,false);
  }
}

async function resetUserPassword(username){
  const generated=generateStrongUserPassword();
  const password=prompt(
    `Enter a new temporary password for ${username}.\n\nRequirements: 10+ characters, uppercase, lowercase, number and symbol.\n\nSuggested password:\n${generated}`,
    generated
  );
  if(!password)return;
  if(!userPasswordIsStrong(password)){
    toast('Password is not strong enough. Use 10+ characters with uppercase, lowercase, number and symbol.','error');
    return;
  }

  try{
    await api('adminResetPassword',{username,password});
    try{await navigator.clipboard.writeText(password);}catch{}
    toast(`Password reset for ${username}. New temporary password copied.`, 'success');
  }catch(e){
    toast(e.message,'error');
  }
}

async function toggleUser(username,active){
  try{
    const item=(state.users||[]).find(u=>String(u.username).toLowerCase()===String(username).toLowerCase());
    if(!item)throw new Error('User not found.');

    const r=await api('adminUpdateUser',{
      username,
      displayName:item.displayName||username,
      role:item.role||'USER',
      active
    });
    state.users=r.users||state.users;
    renderUsers();
    toast(`User ${active?'enabled':'disabled'}.`,'success');
  }catch(e){
    toast(e.message,'error');
  }
}

async function deleteUserAccount(username){
  const item=(state.users||[]).find(u=>String(u.username).toLowerCase()===String(username).toLowerCase());
  if(!item){toast('User not found.','error');return;}

  const ok=confirm(
    `Delete login account "${username}"?\n\n`+
    `This removes the user account and active sessions only.\n`+
    `Portfolio/transaction/diary data is retained to prevent accidental data loss.`
  );
  if(!ok)return;

  try{
    const r=await api('adminDeleteUser',{username});
    state.users=r.users||state.users.filter(u=>String(u.username).toLowerCase()!==String(username).toLowerCase());
    renderUsers();
    toast(`User account ${username} deleted.`, 'success');
  }catch(e){
    toast(e.message,'error');
  }
}

function safeOn(el,event,handler,options){
  if(!el||typeof handler!=='function')return false;
  try{el.addEventListener(event,handler,options);return true;}catch(e){console.warn('Event bind skipped:',event,e);return false;}
}
function showRuntimeWarning(message){
  if(!els.runtimeWarning)return;
  els.runtimeWarning.textContent=message;
  els.runtimeWarning.classList.remove('hidden');
}
function clearRuntimeWarning(){
  if(!els.runtimeWarning)return;
  els.runtimeWarning.textContent='';
  els.runtimeWarning.classList.add('hidden');
}

function bindEvents(){safeOn(els.manageHoldingsColumnsBtn,'click',()=>openColumnManager('HOLDINGS'));safeOn(els.manageWatchlistColumnsBtn,'click',()=>openColumnManager('WATCHLIST'));safeOn(els.customColumnForm,'submit',saveCustomColumn);safeOn(els.clearCustomColumnBtn,'click',()=>resetCustomColumnForm(els.customColumnSection.value));safeOn(els.customColumnSection,'change',()=>{resetCustomColumnForm(els.customColumnSection.value);renderColumnManager(els.customColumnSection.value);});safeOn(els.customValueForm,'submit',saveCustomValue);safeOn(els.resetStandardColumnsBtn,'click',()=>resetStandardColumns(els.customColumnSection.value));safeOn(els.standardColumnsList,'change',e=>{const key=e.target.dataset.standardVisible;if(key)saveStandardColumnChange(els.customColumnSection.value,key,{visible:e.target.checked});});safeOn(els.standardColumnsList,'input',e=>{const key=e.target.dataset.standardLabel;if(key){const section=els.customColumnSection.value;const settings=loadStandardColumnSettings(section);settings[key]={...(settings[key]||{}),label:e.target.value};saveStandardColumnSettings(section,settings);if(section==='HOLDINGS')renderHoldings();else renderWatchlist();}});safeOn(els.customColumnsList,'click',e=>{const edit=e.target.closest('[data-edit-custom-column]');const del=e.target.closest('[data-delete-custom-column]');if(edit){editCustomColumn(edit.dataset.editCustomColumn);return;}if(del){deleteCustomColumn(del.dataset.deleteCustomColumn);}});
  safeOn(els.holdRowSlider,'input',e=>setTableSizeFromSlider('holdings','row',e.target.value));safeOn(els.holdWidthSlider,'input',e=>setTableSizeFromSlider('holdings','width',e.target.value));safeOn(els.watchRowSlider,'input',e=>setTableSizeFromSlider('watchlist','row',e.target.value));safeOn(els.watchWidthSlider,'input',e=>setTableSizeFromSlider('watchlist','width',e.target.value));
  safeOn(els.holdRowMinusBtn,'click',()=>changeTableSize('holdings','row',-1));safeOn(els.holdRowPlusBtn,'click',()=>changeTableSize('holdings','row',1));safeOn(els.holdWidthMinusBtn,'click',()=>changeTableSize('holdings','width',-1));safeOn(els.holdWidthPlusBtn,'click',()=>changeTableSize('holdings','width',1));safeOn(els.holdSizeResetBtn,'click',()=>resetTableSize('holdings'));safeOn(els.watchRowMinusBtn,'click',()=>changeTableSize('watchlist','row',-1));safeOn(els.watchRowPlusBtn,'click',()=>changeTableSize('watchlist','row',1));safeOn(els.watchWidthMinusBtn,'click',()=>changeTableSize('watchlist','width',-1));safeOn(els.watchWidthPlusBtn,'click',()=>changeTableSize('watchlist','width',1));safeOn(els.watchSizeResetBtn,'click',()=>resetTableSize('watchlist'));
  safeOn(els.personalHomeModeBtn,'click',()=>setOverviewMode('PERSONAL'));safeOn(els.investmentHomeModeBtn,'click',()=>switchSection('holdings'));safeOn(els.overviewSetDefaultBtn,'click',setCurrentOverviewAsDefault);safeOn(els.homeDailyWriteBtn,'click',()=>openQuickDiary('DAILY'));safeOn(els.homeMonthlyWriteBtn,'click',()=>openQuickDiary('MONTHLY'));safeOn(els.homeAddTargetBtn,'click',()=>openStickyNote());safeOn(els.homeDiaryQuickBtn,'click',()=>openQuickDiary('DAILY'));safeOn(els.homeFullDiaryBtn,'click',()=>switchSection('diary'));safeOn(els.homeTargetAddBtn,'click',()=>openStickyNote());safeOn(els.homeTargetsOpenBtn,'click',()=>openUtilityDrawer('STICKY'));safeOn(els.homeQuoteNextBtn,'click',nextLifeQuote);safeOn(els.homeQuotesOpenBtn,'click',()=>openUtilityDrawer('QUOTE'));safeOn(els.homeShowInvestmentsBtn,'click',()=>switchSection('holdings'));
  safeOn(els.utilityDrawerOpenBtn,'click',toggleUtilityDrawer);safeOn(els.utilityDrawerCloseBtn,'click',closeUtilityDrawer);safeOn(els.utilityDrawerScrim,'click',closeUtilityDrawer);safeOn(els.overviewStickyShortcut,'click',()=>openUtilityDrawer('STICKY'));safeOn(els.overviewQuoteShortcut,'click',()=>openUtilityDrawer('QUOTE'));
  safeOn(els.lifeQuoteNextBtn,'click',nextLifeQuote);safeOn(els.lifeQuotePauseBtn,'click',toggleLifeQuoteShuffle);safeOn(els.lifeQuoteLibraryBtn,'click',openLifeQuoteLibrary);safeOn(els.lifeQuoteForm,'submit',saveLifeQuote);safeOn(els.lifeQuoteSearch,'input',renderLifeQuoteLibrary);safeOn(els.clearLifeQuoteBtn,'click',resetLifeQuoteForm);
  
  safeOn(els.autoRefreshSelect,'change',changeAutoRefresh);safeOn(els.rememberUsername,'change',()=>{if(!els.rememberUsername.checked)localStorage.removeItem('portfolio_saved_username');});safeOn(els.diaryForm,'submit',saveDiaryEntry);safeOn(els.clearDiaryBtn,'click',()=>{clearDailyDraft();resetDiaryForm();updateDiaryWritingMeta();});safeOn(els.newDiaryEntryBtn,'click',()=>{switchSection('diary');if(state.diaryWorkspace==='MONTHLY'){resetMonthlyForm(currentMonthlyFilterKey()||localIsoMonth());setTimeout(()=>els.monthlyTitle?.focus(),30);}else{resetDiaryForm(els.diaryBrowseDate.value||localIsoDate());setTimeout(()=>els.diaryTitle?.focus(),30);}});safeOn(els.diarySearch,'input',renderDiary);safeOn(els.diaryBrowseDate,'change',()=>{if(!els.diaryId.value)els.diaryDate.value=els.diaryBrowseDate.value;renderDiary();});safeOn(els.diaryBrowseMonth,'change',renderDiary);safeOn(els.diaryFromDate,'change',renderDiary);safeOn(els.diaryToDate,'change',renderDiary);safeOn(els.printDiaryBtn,'click',printDiaryView);
  safeOn(els.monthlyForm,'submit',saveMonthlyItem);
  safeOn(els.clearMonthlyBtn,'click',()=>{clearMonthlyDraft();resetMonthlyForm();updateDiaryWritingMeta();});
  safeOn(els.monthlyEntryType,'change',updateMonthlyTargetHelp);
  safeOn(els.monthlyYearFilter,'change',renderMonthlyDiary);
  safeOn(els.monthlyMonthFilter,'change',renderMonthlyDiary);
  safeOn(els.monthlyTypeFilter,'change',renderMonthlyDiary);
  safeOn(els.monthlyStatusFilter,'change',renderMonthlyDiary);
  safeOn(els.monthlySearch,'input',renderMonthlyDiary);safeOn(els.printMonthlyBtn,'click',printMonthlyView);
  safeOn(els.completeMonthBtn,'click',toggleMonthCompletion);
  safeOn(els.diaryPrevDayBtn,'click',()=>setDailyDiaryDate(dateShiftIso(els.diaryDate.value,-1)));
  safeOn(els.diaryTodayBtn,'click',()=>setDailyDiaryDate(localIsoDate()));
  safeOn(els.diaryNextDayBtn,'click',()=>setDailyDiaryDate(dateShiftIso(els.diaryDate.value,1)));
  safeOn(els.monthlyPrevMonthBtn,'click',()=>setMonthlyEntryMonth(monthShiftIso(els.monthlyEntryMonth.value,-1)));
  safeOn(els.monthlyThisMonthBtn,'click',()=>setMonthlyEntryMonth(localIsoMonth()));
  safeOn(els.monthlyNextMonthBtn,'click',()=>setMonthlyEntryMonth(monthShiftIso(els.monthlyEntryMonth.value,1)));
  safeOn(els.diarySearchClearBtn,'click',()=>{els.diarySearch.value='';renderDiary();els.diarySearch.focus();});
  safeOn(els.diaryDate,'change',()=>{if(!els.diaryId.value){els.diaryBrowseDate.value=els.diaryDate.value;restoreDailyDraft();}updateDiaryWritingMeta();});
  safeOn(els.monthlyEntryMonth,'change',()=>{if(!els.monthlyId.value)restoreMonthlyDraft();updateDiaryWritingMeta();});
  safeOn(els.diaryTitle,'input',scheduleDailyDraft);safeOn(els.diaryText,'input',scheduleDailyDraft);
  safeOn(els.monthlyTitle,'input',scheduleMonthlyDraft);safeOn(els.monthlyText,'input',scheduleMonthlyDraft);
  safeOn(els.monthlyEntryType,'change',()=>{updateMonthlyTargetHelp();if(!els.monthlyId.value)restoreMonthlyDraft();});
  [els.diaryTitle,els.diaryText].forEach(el=>safeOn(el,'keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();els.diaryForm.requestSubmit();}}));
  [els.monthlyTitle,els.monthlyText].forEach(el=>safeOn(el,'keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();els.monthlyForm.requestSubmit();}}));
  safeOn(els.dashboardHScrollRange,'input',syncHScrollFromRange);
  safeOn(els.dashboardHScrollLeft,'click',()=>scrollDashboardHorizontal(-1));safeOn(els.dashboardHScrollRight,'click',()=>scrollDashboardHorizontal(1));
  safeOn(els.quickDiaryBtn,'click',()=>openQuickDiary('DAILY'));
  safeOn(els.quickDiaryMobileBtn,'click',()=>openQuickDiary('DAILY'));
  safeOn(els.quickDiaryCloseBtn,'click',closeQuickDiary);
  safeOn(els.quickDailyForm,'submit',saveQuickDaily);
  safeOn(els.quickMonthlyForm,'submit',saveQuickMonthly);
  safeOn(els.quickDailyText,'input',updateQuickDiaryCounts);
  safeOn(els.quickMonthlyText,'input',updateQuickDiaryCounts);
  safeOn(els.openFullDiaryBtn,'click',()=>{closeQuickDiary();switchSection('diary');});
  window.addEventListener('keydown',handleDashboardHorizontalKeydown,{passive:false});
  window.addEventListener('resize',scheduleDashboardHScrollRefresh);
  document.querySelectorAll('.table-wrap').forEach(bindSmoothHorizontalTable);safeOn(els.loginForm,'submit',login);safeOn(els.logoutBtn,'click',logout);safeOn(els.mobileLogoutBtn,'click',logout);safeOn(els.mobileChangePasswordBtn,'click',()=>openModal('passwordModal'));safeOn(els.replaceMasterDataBtn,'click',replaceMasterPortfolioData);safeOn(els.masterLoadNowBtn,'click',replaceMasterPortfolioData);safeOn(els.showAllInvestmentsBtn,'click',showAllInvestments);safeOn(els.viewAllNotesBtn,'click',()=>openAllNotes('HOLDINGS'));safeOn(els.watchAllNotesBtn,'click',()=>openAllNotes('WATCHLIST'));safeOn(els.notesSearch,'input',renderNotesModal);safeOn(els.notesSource,'change',renderNotesModal);safeOn(els.notesScope,'change',renderNotesModal);safeOn(els.notesFilter,'change',renderNotesModal);safeOn(els.drawerCloseBtn,'click',closeHoldingDrawer);safeOn(els.drawerDoneBtn,'click',closeHoldingDrawer);safeOn(els.drawerEditBtn,'click',editDrawerHolding);safeOn(els.holdingDrawerBackdrop,'click',closeHoldingDrawer);safeOn(els.refreshBtn,'click',async()=>{await loadDashboard(true);resetAutoRefreshClock();});safeOn(els.addInvestmentBtn,'click',()=>openInvestment());safeOn(els.addInvestmentTableBtn,'click',()=>openInvestment());safeOn(els.importBtn,'click',openBulkImport);safeOn(els.bulkImportBtn,'click',openBulkImport);safeOn(els.downloadImportTemplateBtn,'click',downloadImportTemplate);safeOn(els.bulkCsvFile,'change',handleBulkFile);safeOn(els.bulkImportForm,'submit',runBulkImport);safeOn(els.exportBtn,'click',exportCsv);safeOn(els.investmentForm,'submit',saveInvestment);safeOn(els.watchForm,'submit',saveWatch);safeOn(els.passwordForm,'submit',changePassword);safeOn(els.userForm,'submit',saveUserForm);safeOn(els.addStickyNoteBtn,'click',()=>openStickyNote());safeOn(els.stickyNoteForm,'submit',saveStickyNote);safeOn(els.holdingType,'change',()=>updateAssetForm(els.holdingType.value,'holding'));safeOn(els.watchType,'change',()=>updateAssetForm(els.watchType.value,'watch'));safeOn(els.transactionSearch,'input',renderTransactions);safeOn(els.transactionOwnerFilter,'change',renderTransactions);safeOn(els.transactionAssetFilter,'change',renderTransactions);safeOn(els.transactionSideFilter,'change',renderTransactions);safeOn(els.transactionFromDate,'change',renderTransactions);safeOn(els.transactionToDate,'change',renderTransactions);safeOn(els.transactionImportBtn,'click',()=>{refreshOwnerControls();setImportMode('STOCK_TRADES');openModal('bulkImportModal');});safeOn(els.printTransactionsBtn,'click',printTransactionsView);safeOn(els.toggleHoldingsSummaryBtn,'click',toggleHoldingsSummary);document.addEventListener('click',e=>{if(e.target.closest('[data-hide-holdings-summary]'))hideHoldingsSummary();});safeOn(els.holdingSearch,'input',renderHoldings);safeOn(els.holdingTypeFilter,'change',renderHoldings);safeOn(els.holdingResultFilter,'change',renderHoldings);safeOn(els.holdingNotesFilter,'change',renderHoldings);safeOn(els.holdingTradeFilter,'change',renderHoldings);safeOn(els.holdingsViewPreset,'change',e=>{if(e.target.value!=='CUSTOM')setHoldingsViewPreset(e.target.value);});safeOn(els.saveHoldingsDefaultViewBtn,'click',saveHoldingsDefaultView);safeOn(els.restoreHoldingsDefaultViewBtn,'click',()=>restoreHoldingsDefaultView(true));safeOn(els.resetHoldingsViewBtn,'click',resetHoldingsView);safeOn(els.printHoldingsBtn,'click',printHoldingsView);safeOn(els.holdingsFullscreenBtn,'click',()=>toggleDataFullscreen('holdings'));safeOn(els.watchSearch,'input',renderWatchlist);safeOn(els.watchTypeFilter,'change',renderWatchlist);safeOn(els.watchPriorityFilter,'change',renderWatchlist);safeOn(els.watchTargetFilter,'change',renderWatchlist);safeOn(els.watchNotesFilter,'change',renderWatchlist);safeOn(els.saveWatchDefaultViewBtn,'click',saveWatchDefaultView);safeOn(els.restoreWatchDefaultViewBtn,'click',()=>restoreWatchDefaultView(true));safeOn(els.printWatchlistBtn,'click',printWatchlistView);safeOn(els.watchlistFullscreenBtn,'click',()=>toggleDataFullscreen('watchlist'));safeOn($('addWatchBtn'),'click',()=>openWatch());safeOn($('changePasswordBtn'),'click',()=>openModal('passwordModal'));safeOn($('addUserBtn'),'click',openCreateUserModal);safeOn(els.generateUserPasswordBtn,'click',()=>{els.newUserPassword.value=generateStrongUserPassword();setUserFormStatus('New strong temporary password generated.','success');});safeOn(els.copyUserPasswordBtn,'click',copyUserPassword);safeOn(els.modalBackdrop,'click',e=>{if(e.target===els.modalBackdrop)closeModals();});$$('[data-close-modal]').forEach(b=>b.addEventListener('click',closeModals));$$('[data-section]').forEach(b=>b.addEventListener('click',()=>switchSection(b.dataset.section)));$$('[data-section-link]').forEach(b=>b.addEventListener('click',()=>switchSection(b.dataset.sectionLink)));$$('[data-toggle-password]').forEach(b=>b.addEventListener('click',()=>{const input=$(b.dataset.togglePassword),show=input.type==='password';input.type=show?'text':'password';b.textContent=show?'Hide':'Show';}));$$('.import-mode').forEach(b=>b.addEventListener('click',()=>setImportMode(b.dataset.importMode)));
  document.addEventListener('click',e=>{const customCell=e.target.closest('[data-custom-cell]');if(customCell){e.preventDefault();e.stopPropagation();openCustomValueEditor(customCell.dataset.customSection,customCell.dataset.customRecord,customCell.dataset.customKey);return;}const homeSticky=e.target.closest('[data-home-open-sticky]');if(homeSticky){openUtilityDrawer('STICKY');return;}const utilityTab=e.target.closest('[data-utility-tab]');if(utilityTab){state.utilityDrawerTab=utilityTab.dataset.utilityTab==='QUOTE'?'QUOTE':'STICKY';renderUtilityDrawerTab();if(lifeQuoteAutoContextVisible())startLifeQuoteShuffle();else stopLifeQuoteShuffle();return;}const quoteEdit=e.target.closest('[data-life-quote-edit]');if(quoteEdit){editLifeQuote(quoteEdit.dataset.lifeQuoteEdit);return;}const quoteDelete=e.target.closest('[data-life-quote-delete]');if(quoteDelete){deleteLifeQuote(quoteDelete.dataset.lifeQuoteDelete);return;}const stickyPin=e.target.closest('[data-sticky-pin]');if(stickyPin){toggleStickyPin(stickyPin.dataset.stickyPin);return;}const stickyDone=e.target.closest('[data-sticky-done]');if(stickyDone){completeStickyNote(stickyDone.dataset.stickyDone);return;}const stickyEdit=e.target.closest('[data-sticky-edit]');if(stickyEdit){const item=state.stickyNotes.find(x=>x.id===stickyEdit.dataset.stickyEdit);if(item)openStickyNote(item);return;}const stickyDelete=e.target.closest('[data-sticky-delete]');if(stickyDelete){deleteStickyNote(stickyDelete.dataset.stickyDelete);return;}const qmode=e.target.closest('[data-quick-diary-mode]');if(qmode){state.quickDiaryMode=qmode.dataset.quickDiaryMode;renderQuickDiaryMode();setTimeout(()=>state.quickDiaryMode==='DAILY'?els.quickDailyText?.focus():els.quickMonthlyText?.focus(),30);return;}const workspace=e.target.closest('[data-diary-workspace]');if(workspace){state.diaryWorkspace=workspace.dataset.diaryWorkspace;renderDiaryWorkspace();return;}const openCompleted=e.target.closest('[data-open-completed-month]');if(openCompleted){const key=openCompleted.dataset.openCompletedMonth;state.diaryWorkspace='MONTHLY';renderDiaryWorkspace();els.monthlyYearFilter.value=key.slice(0,4);els.monthlyMonthFilter.value=key.slice(5,7);renderMonthlyDiary();return;}const monthlyEdit=e.target.closest('[data-edit-monthly]');if(monthlyEdit){const item=state.monthlyDiary.find(x=>x.id===monthlyEdit.dataset.editMonthly);if(item)openMonthlyItem(item);return;}const monthlyDelete=e.target.closest('[data-delete-monthly]');if(monthlyDelete){deleteMonthlyItem(monthlyDelete.dataset.deleteMonthly);return;}const monthlyTarget=e.target.closest('[data-toggle-monthly-target]');if(monthlyTarget){toggleMonthlyTarget(monthlyTarget.dataset.toggleMonthlyTarget);return;}const diaryView=e.target.closest('[data-diary-view]');if(diaryView){state.diaryView=diaryView.dataset.diaryView;renderDiary();return;}const diaryEdit=e.target.closest('[data-edit-diary]');if(diaryEdit){const item=state.diary.find(x=>x.id===diaryEdit.dataset.editDiary);if(item)openDiaryEntry(item);return;}const diaryDelete=e.target.closest('[data-delete-diary]');if(diaryDelete){deleteDiaryEntry(diaryDelete.dataset.deleteDiary);return;}const diaryCard=e.target.closest('[data-diary-view-entry]');if(diaryCard&&!e.target.closest('button')){const item=state.diary.find(x=>x.id===diaryCard.dataset.diaryViewEntry);if(item)openDiaryEntry(item);return;}const gr=e.target.closest('[data-growth-range]');if(gr){state.growthRange=gr.dataset.growthRange;$$('[data-growth-range]').forEach(b=>b.classList.toggle('active',b.dataset.growthRange===state.growthRange));renderGrowthDashboard();return;}const owner=e.target.closest('[data-owner-view]');if(owner){state.selectedOwner=owner.dataset.ownerView;refreshOwnerControls();renderAll();return;}const assetView=e.target.closest('[data-asset-view]');if(assetView){state.selectedAssetView=assetView.dataset.assetView;els.holdingTypeFilter.value='ALL';renderAll();return;}const inlineEdit=e.target.closest('[data-inline-edit-holding]'),inlineSave=e.target.closest('[data-inline-save-holding]'),inlineCancel=e.target.closest('[data-inline-cancel-holding]'),noteView=e.target.closest('[data-note-view]'),noteEdit=e.target.closest('[data-note-edit]'),watchNoteView=e.target.closest('[data-watch-note-view]'),watchNoteEdit=e.target.closest('[data-watch-note-edit]'),holdingViewButton=e.target.closest('[data-view-holding-button]'),watchViewButton=e.target.closest('[data-view-watch-button]'),watchNoteButton=e.target.closest('[data-watch-note-button]'),edit=e.target.closest('[data-edit-holding]'),del=e.target.closest('[data-delete-holding]'),ew=e.target.closest('[data-edit-watch]'),dw=e.target.closest('[data-delete-watch]'),eu=e.target.closest('[data-edit-user]'),du=e.target.closest('[data-delete-user]'),ru=e.target.closest('[data-reset-user]'),tu=e.target.closest('[data-toggle-user]');if(inlineEdit){openInlineHoldingEdit(inlineEdit.dataset.inlineEditHolding);return;}if(inlineSave){saveInlineHolding(inlineSave.dataset.inlineSaveHolding,inlineSave);return;}if(inlineCancel){closeInlineHoldingEdit();return;}if(noteView){const item=state.holdings.find(x=>x.id===noteView.dataset.noteView);closeModals();if(item)openHoldingDrawer(item);return;}if(noteEdit){const item=state.holdings.find(x=>x.id===noteEdit.dataset.noteEdit);closeModals();if(item)openInvestment(item);return;}if(watchNoteView){const item=state.watchlist.find(x=>x.id===watchNoteView.dataset.watchNoteView);closeModals();if(item)openWatchDrawer(item);return;}if(holdingViewButton){const item=state.holdings.find(x=>x.id===holdingViewButton.dataset.viewHoldingButton);if(item)openHoldingDrawer(item);return;}if(watchViewButton){const item=state.watchlist.find(x=>x.id===watchViewButton.dataset.viewWatchButton);if(item)openWatchDrawer(item);return;}if(watchNoteButton){const item=state.watchlist.find(x=>x.id===watchNoteButton.dataset.watchNoteButton);if(item){openWatchDrawer(item);setTimeout(()=>{const t=$('drawerWatchNote');if(t){t.focus();t.setSelectionRange(t.value.length,t.value.length);}},80);}return;}if(watchNoteEdit){const item=state.watchlist.find(x=>x.id===watchNoteEdit.dataset.watchNoteEdit);closeModals();if(item){openWatchDrawer(item);setTimeout(()=>{const t=$('drawerWatchNote');if(t){t.focus();t.setSelectionRange(t.value.length,t.value.length);}},80);}return;}if(edit){openInvestment(state.holdings.find(x=>x.id===edit.dataset.editHolding));return;}if(del){deleteItem('deleteHolding',del.dataset.deleteHolding,'investment');return;}if(ew){openWatch(state.watchlist.find(x=>x.id===ew.dataset.editWatch));return;}if(dw){deleteItem('deleteWatchItem',dw.dataset.deleteWatch,'watchlist item');return;}if(eu){openEditUserModal(eu.dataset.editUser);return;}if(du){deleteUserAccount(du.dataset.deleteUser);return;}if(ru){resetUserPassword(ru.dataset.resetUser);return;}if(tu){toggleUser(tu.dataset.toggleUser,tu.dataset.active==='true');return;}const watchNoteCell=e.target.closest('[data-watch-note-cell]');if(watchNoteCell){const item=state.watchlist.find(x=>x.id===watchNoteCell.dataset.watchNoteCell);if(item){openWatchDrawer(item);setTimeout(()=>{const t=$('drawerWatchNote');if(t)t.focus();},80);}return;}const noteCell=e.target.closest('[data-note-cell]');if(noteCell){const item=state.holdings.find(x=>x.id===noteCell.dataset.noteCell);if(item)openHoldingDrawer(item);return;}const watchView=e.target.closest('[data-view-watch]');if(watchView){const item=state.watchlist.find(x=>x.id===watchView.dataset.viewWatch);if(item)openWatchDrawer(item);return;}const view=e.target.closest('[data-view-holding]');if(view){openHoldingDrawer(state.holdings.find(x=>x.id===view.dataset.viewHolding));}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.autoRefreshMinutes&&Date.now()>=state.autoRefreshNextAt&&!state.syncing){resetAutoRefreshClock();loadDashboard(true);}});
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target?.matches?.('[data-custom-cell]')){e.preventDefault();openCustomValueEditor(e.target.dataset.customSection,e.target.dataset.customRecord,e.target.dataset.customKey);return;}if(e.key==='Escape'){if($('printPreviewOverlay')){closePrintPreview();return;}if(state.dataFullscreenSection){exitDataFullscreen();return;}if(els.holdingDrawer?.classList.contains('open'))closeHoldingDrawer();else closeModals();return;}if((e.key==='Enter'||e.key===' ')&&e.target?.matches?.('[data-view-holding]')){e.preventDefault();openHoldingDrawer(state.holdings.find(x=>x.id===e.target.dataset.viewHolding));return;}if((e.key==='Enter'||e.key===' ')&&e.target?.matches?.('[data-view-watch]')){e.preventDefault();openWatchDrawer(state.watchlist.find(x=>x.id===e.target.dataset.viewWatch));}});
}

async function refreshMobileFromBackend(reason='resume'){
  if(!isMobileViewport()||!state.token||state.syncing||!isConfigured())return;
  const age=Date.now()-Number(state.lastServerSyncAt||0);
  if(reason!=='pageshow'&&age<30000)return;
  try{await loadDashboard(false);}catch(e){console.warn('Mobile resync failed:',e);}
}

async function init(){
  try{
    bindEvents();
    loadBackendVersion();

    if(els.diaryBrowseDate)els.diaryBrowseDate.value=localIsoDate();
    if(els.diaryBrowseMonth)els.diaryBrowseMonth.value=localIsoMonth();
    if(els.diaryDate)els.diaryDate.value=localIsoDate();
    if(els.diaryFromDate)els.diaryFromDate.value=`${localIsoMonth()}-01`;
    if(els.diaryToDate)els.diaryToDate.value=localIsoDate();
    if(els.monthlyEntryMonth)els.monthlyEntryMonth.value=localIsoMonth();
    if(els.quickDailyDate)els.quickDailyDate.value=localIsoDate();
    if(els.quickMonthlyMonth)els.quickMonthlyMonth.value=localIsoMonth();

    if(els.quickDailyText&&els.quickMonthlyText)updateQuickDiaryCounts();
    if(els.monthlyYearFilter&&els.monthlyMonthFilter){
      refreshMonthlyYearFilter();
      els.monthlyYearFilter.value=String(new Date().getFullYear());
      els.monthlyMonthFilter.value=String(new Date().getMonth()+1).padStart(2,'0');
    }

    loadSavedUsername();
    restoreHoldingsDefaultView(false);
    restoreWatchDefaultView(false);
    restoreHoldingsSummaryState();
    state.overviewMode='PERSONAL';
    localStorage.setItem('portfolio_overview_default','PERSONAL');
    document.body.classList.add('section-overview');
    refreshOwnerControls();
    if(els.diaryText&&els.monthlyText)updateDiaryWritingMeta();

    setTimeout(()=>{
      try{
        if(els.diaryText)restoreDailyDraft();
        if(els.monthlyText)restoreMonthlyDraft();
        installColumnResizers('holdings');
        installColumnResizers('watchlist');
        scheduleDashboardHScrollRefresh();
      }catch(e){console.warn('Deferred UI init:',e);}
    },80);

    startAutoRefresh();

    if(!isConfigured()){
      if(els.loginMessage)els.loginMessage.textContent='Setup required: paste the Apps Script /exec URL into config.js.';
      return;
    }

    if(state.token){
      showApp();
      loadCache();
      await loadDashboard(false);
      restoreHoldingsSummaryState();
      resetAutoRefreshClock();
    }

    if(!window.__myFinanceMobileParityBound){
      window.__myFinanceMobileParityBound=true;
      window.addEventListener('pageshow',event=>{
        if(event.persisted)refreshMobileFromBackend('pageshow');
      });
      window.addEventListener('online',()=>refreshMobileFromBackend('online'));
      window.addEventListener('focus',()=>refreshMobileFromBackend('focus'));
      document.addEventListener('visibilitychange',()=>{
        if(!document.hidden)refreshMobileFromBackend('visible');
      });
    }

    clearRuntimeWarning();
  }catch(e){
    console.error('MyFinance init error',e);
    showRuntimeWarning(`A dashboard component could not start: ${e.message}. Core navigation has been protected.`);
    try{loadSavedUsername();}catch{}
  }
}
console.info('MyFinance v19.2.9 loaded — mobile parity/session fix applied');
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&state.utilityDrawerOpen)closeUtilityDrawer();});
window.addEventListener('error',event=>{
  console.error('MyFinance runtime error',event.error||event.message);
  showRuntimeWarning(`Dashboard script error: ${event.message||'Unknown error'}.`);
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.utilityDrawerOpen&&state.utilityDrawerTab==='QUOTE'&&!state.lifeQuotePaused)startLifeQuoteShuffle();});
window.addEventListener('unhandledrejection',event=>{
  console.error('MyFinance promise error',event.reason);
  const msg=event.reason?.message||String(event.reason||'Unknown error');
  showRuntimeWarning(`Dashboard request error: ${msg}`);
});
init();
