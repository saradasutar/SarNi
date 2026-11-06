/**
 * SarNi 9 Quick Entry — dependency-free, read-only source regression checks.
 * Run at repository root: node quality/quick-entry-regression.mjs
 * No API calls, authentication, photos or user data are accessed.
 * This is NOT a substitute for browser and backend integration testing.
 */
import { readFileSync } from 'node:fs';
import { exit } from 'node:process';

const source = readFileSync(new URL('../q/index.html', import.meta.url), 'utf8');
const mainDashboard = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mainBatchJs = readFileSync(new URL('../sarni10-main-workspace.js', import.meta.url), 'utf8');
const mainBatchCss = readFileSync(new URL('../sarni10-main-workspace.css', import.meta.url), 'utf8');
const bridge = readFileSync(new URL('../sarni-health-bridge-v1.js', import.meta.url), 'utf8');
const history = readFileSync(new URL('../sarni-health-history-v1.js', import.meta.url), 'utf8');
const batch10Js = readFileSync(new URL('../q/sarni9-batch10.js', import.meta.url), 'utf8');
const batch10Css = readFileSync(new URL('../q/sarni9-batch10.css', import.meta.url), 'utf8');
const tests = [];
const check = (name, passed) => tests.push({ name, passed: Boolean(passed) });
const includes = (value) => source.includes(value);
const count = (pattern) => [...source.matchAll(pattern)].length;

check('Document and six Quick Entry modes', ['expense','diary','stock','office','investment','family'].every(mode => includes("['"+mode+"',")));
check('Exactly one Quick Entry tab container', count(/<nav id="tabs"/g) === 1);
check('Tab pressed state tracks current mode', includes("button.setAttribute('aria-pressed',String(active))"));
check('Tab mismatch detection', includes("throw Error('Tab selection mismatch')"));
check('Three-column tab layout', includes('grid-template-columns:repeat(3,minmax(0,1fr))!important'));
check('Active checkmark requires pressed state', includes('.selected[aria-pressed="true"]::after'));
check('Expense form required inputs', ['qeAmount','qeReason','qePaidBy','qePaidTo','qeCategory','qeSub','qeDate','qeProject'].every(id => includes("'"+id+"'")));
check('Family Expense paired rows and required inputs', ['familyAmount','familyReason','familyPaidBy','familyFromAccount','familyCategory','familySubcategory','familySentTo','familyDate'].every(id => includes("'"+id+"'")) && includes('family-paired-row family-payment-row') && includes('family-paired-row family-category-row') && includes('family-paired-row family-date-details-row'));
check('Diary, Office and Stock Note action forms', includes("name=\"needsPlanning\"") && includes("name=\"needsFollowup\"") && includes("name=\"needsReview\""));
check('Completion remark and reopening controls', includes('qeCompletionRemark') && includes('qe-reopen-action') && includes('action-completed'));
check('Recent Entries table and completion filter', includes('recent-table-scroll') && includes('id="qeCompletionFilter"') && includes('applyRecentSearch()'));
check('Sync: independent proof checked before Verified', includes('proof.verified===true') && includes('proof.destinationRecordId') && includes('proof.checkedAt'));
check('Retry remains guarded by idempotency guarantee', includes('verifiedResult.idempotentGuaranteed!==true'));
check('No automatic retry for uncertain save', includes('qePendingUncertain') && includes('Continue using the SAME original submission ID?'));
check('Duplicate click prevented during save', includes("busy=true;$('save').disabled=true"));
check('Read coalescing restricted to read-only calls', includes("new Set(['qeRecent','qpinRecent'])"));
check('Smart Refresh cache is memory-only, brief and bounded', includes("const qeRecentCacheTTL=2500,qeRecentCacheMax=18") && includes("qeRecentMemoryCache=new Map()") && includes("Date.now()-cached.at<qeRecentCacheTTL"));
check('Smart Refresh invalidates on writes and explicit refresh', includes("if(!qeMutationActions.has(action))return qeApiTransport(action,payload)") && includes("finally{qeInvalidateReadSnapshots();}") && includes("qeReadEpoch===epoch") && includes("qeInvalidateReadSnapshots();return qeRefreshPanels({sip:false,sync:false})") && includes("qeInvalidateReadSnapshots();return qeLoadGlobalSync()"));
check('PIN changes invalidate Smart Refresh snapshots', includes("qeInvalidateReadSnapshots();pinGrant=result.grant") && includes("qeInvalidateReadSnapshots();pinManageOpen=false;pinGrant=''"));
check('Photo formats and size remain limited', includes('image/jpeg') && includes('20*1024*1024'));
check('Offline queue uses encryption', includes('AES-GCM') && includes('PBKDF2'));
check('Styles have matching tags', count(/<style\b/g) === count(/<\/style>/g));
check('Scripts have matching tags', count(/<script\b/g) === count(/<\/script>/g));
check('Dashboard Health is read-only and available in Quick Entry', includes('id="qeDashboardHealth"') && includes('id="qeHealthCheck"') && includes("Promise.allSettled([api('qeInfo'),api('hubGuestInfo')])"));
check('Health does not report destination verification without audit', includes('qeVerifyAuditReport?.tally') && includes('Not independently verified here'));
check('Health errors stay session-only and token-redacted', includes('const qeHealthErrors=[]') && includes('qeHealthRecordError') && includes("'[private]'"));
check('Shared in-memory Health bridge exists on both pages', includes('../sarni-health-bridge-v1.js') && mainDashboard.includes('./sarni-health-bridge-v1.js') && bridge.includes("new BroadcastChannel(channelName)"));
check('Health bridge uses an explicit status-only whitelist', bridge.includes("const frontends=new Set(") && bridge.includes("const backends=new Set(") && bridge.includes("const syncs=new Set(") && !/(?:fetch|localStorage|sessionStorage)\s*\(/.test(bridge));
check('Main and Quick Entry Health panels have peer indicators', mainDashboard.includes('id="sarniMainHealthPeer"') && includes('id="qeHealthPeerStatus"') && mainDashboard.includes("healthBridge?.request()") && includes('qeHealthBridge?.request()'));
check('Health History is available in both dashboards', includes('id="qeHealthHistory"') && mainDashboard.includes('id="sarniMainHealthHistory"') && includes('../sarni-health-history-v1.js') && mainDashboard.includes('./sarni-health-history-v1.js'));
check('Health History accepts only status categories, never raw errors', history.includes("const statuses=new Set(") && history.includes("const kinds=new Set(") && history.includes("sessionStorage.setItem(key,JSON.stringify(items))") && !/(?:fetch|localStorage|BroadcastChannel)\s*\(/.test(history));
check('Health History and troubleshooting controls present', includes('id="qeHealthHistoryClear"') && mainDashboard.includes('id="sarniMainHealthClear"') && includes('Troubleshooting guide') && mainDashboard.includes('Troubleshooting guide'));
check('SIP-plan requests ignore stale tab responses', includes('let qeSipListRequestVersion=0') && includes('const requestVersion=++qeSipListRequestVersion') && source.split("mode!=='investment'||requestVersion!==qeSipListRequestVersion").length===3);
check('Closing global Sync invalidates earlier requests', includes("else{++globalSyncRequest;qeVerifyCancel();") && includes("current!==globalSyncRequest||$('qeGlobalSyncPanel').hidden"));
check('Sync permission state is guarded before rendering', includes("if(current===globalSyncRequest&&!$('qeGlobalSyncPanel').hidden)el.textContent='Recent viewing is not enabled for this link.'"));
check('PIN changes refresh currently visible sync summaries', includes("await qeRefreshPanels({global:true})") && includes("void qeRefreshPanels({global:true})"));
check('Unified refresh controller only dispatches readers', includes('function qeRefreshPanels(options={})') && includes("['recent',()=>loadRecent(false)]") && includes("['sip',()=>loadSipPlans()]") && includes("['sync',()=>loadQuickSyncSummary()]") && includes('Promise.allSettled(jobs.map('));
check('Tab changes and startup use coordinated refresh', includes('void qeRefreshPanels();') && !includes('void loadRecent();void loadSipPlans();void loadQuickSyncSummary();'));
check('Expense and group writes invalidate Smart Refresh', includes("new Set(['qeSubmit','qeSubmitGroup'") && includes("qeInvalidateReadSnapshots();\n  try{return await qeApiTransport(action,payload);}"));
check('Uncertain write result cannot preserve old cache', includes("A timed-out save may have committed remotely") && includes("finally{qeInvalidateReadSnapshots();}"));
check('Offline queue confirmations refresh panels without retrying', includes('let confirmedCount=0;') && includes('confirmedCount++;') && includes("if(confirmedCount&&info)void qeRefreshPanels({global:true})"));
check('Ten-upgrade assets loaded by Quick Entry', includes('href="./sarni9-batch10.css"') && includes('src="./sarni9-batch10.js"'));
check('Recent search can be cleared and counts announced', batch10Js.includes("id='qeSearchClear'") && batch10Js.includes("setAttribute('aria-live','polite')"));
check('Keyboard tab navigation and shortcut respect existing buttons', batch10Js.includes("ArrowRight") && batch10Js.includes("Digit[1-6]") && batch10Js.includes("button.click()"));
check('Character counter excludes short fields', batch10Js.includes("qeActiveFieldCount") && batch10Js.includes("input.maxLength<50"));
check('Responsive accessibility finishes and Back to Top present', batch10Css.includes('prefers-reduced-motion:reduce') && batch10Css.includes('focus-visible') && batch10Css.includes('min-height:46px') && batch10Css.includes('overflow-wrap:anywhere') && batch10Js.includes("id='qeBackToTop'"));
check('Ten-upgrade helper contains no network or storage operations', !/(?:fetch|localStorage|sessionStorage|XMLHttpRequest)\s*\(/.test(batch10Js));
check('SarNi main uses exactly one approved enhancement pair', (()=>{const names=['sarni-main-batch10','sarni10-main-polish','sarni10-main-upgrades','sarni10-main-batch','sarni10-main-workspace'];const js=names.filter(name=>mainDashboard.includes('./'+name+'.js'));const css=names.filter(name=>mainDashboard.includes('./'+name+'.css'));return js.length===1&&css.length===1&&js[0]===css[0];})());
check('SarNi 10 main workspace assets activated', mainDashboard.includes('sarni10-main-workspace.js') && mainDashboard.includes('sarni10-main-workspace.css') && !mainDashboard.includes('src="./sarni-main-batch10.js'));
check('Main workspace uses existing navigation and avoids persistence', mainBatchJs.includes('sarniSidebarPrimary') && !['fetch(', 'localStorage.', 'sessionStorage.'].some(x=>mainBatchJs.includes(x)));
check('Main workspace accessibility and responsive layout', mainBatchCss.includes('focus-visible') && mainBatchCss.includes('prefers-reduced-motion:reduce') && mainBatchCss.includes('min-height:44px'));
check('No inline private key hardcoded', !/const\s+(?:pinGrant|key)\s*=\s*['"][A-Za-z0-9]{16,}['"]/.test(source));

for (const t of tests) console.log((t.passed ? 'PASS' : 'FAIL')+'  '+t.name);
const failures = tests.filter(t => !t.passed);
console.log('\n'+(tests.length-failures.length)+'/'+tests.length+' source checks passed.');
if (failures.length) exit(1);
