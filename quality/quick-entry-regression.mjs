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
const bridge = readFileSync(new URL('../sarni-health-bridge-v1.js', import.meta.url), 'utf8');
const history = readFileSync(new URL('../sarni-health-history-v1.js', import.meta.url), 'utf8');
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
check('No inline private key hardcoded', !/const\s+(?:pinGrant|key)\s*=\s*['"][A-Za-z0-9]{16,}['"]/.test(source));

for (const t of tests) console.log((t.passed ? 'PASS' : 'FAIL')+'  '+t.name);
const failures = tests.filter(t => !t.passed);
console.log('\n'+(tests.length-failures.length)+'/'+tests.length+' source checks passed.');
if (failures.length) exit(1);
