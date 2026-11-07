#!/usr/bin/env node
/* SarNi Batch 20 release gates: STATIC ONLY. No backend/network/data access. */
import {readFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const text=p=>readFileSync(resolve(root,p),'utf8');
const files=['index.html','q/index.html','q/sarni9-batch10.js','q/sarni9-batch10.css',
 'sarni10-main-workspace.js','sarni10-main-workspace.css','sarni10-admin-centre.js',
 'sarni10-admin-centre.css','sarni20-visual.js','sarni20-visual.css','sarni-focus-view.js','sarni-focus-view.css','health.html'];
let failures=0;
function assert(label,pass){
 console.log((pass?'PASS':'FAIL')+' '+label);if(!pass)failures++;
}
for(const f of files)assert('file exists: '+f,existsSync(resolve(root,f)));
if(failures)process.exit(1);
const [h,q,admin,visual,css]=['index.html','q/index.html','sarni10-admin-centre.js','sarni20-visual.js','sarni20-visual.css'].map(text);
function exactlyOnce(s,p){return s.split(p).length===2;}
for(const [f,kind] of [
 ['sarni10-main-workspace.css','css'],['sarni10-admin-centre.css','css'],['sarni-focus-view.css','css'],
 ['sarni20-visual.css','css'],['sarni10-main-workspace.js','js'],
 ['sarni10-admin-centre.js','js'],['sarni20-visual.js','js'],['sarni-focus-view.js','js']]){
 const needle=kind==='css'?'href="./'+f+'?v=1"':'src="./'+f+'?v=1"';
 assert('linked once: '+f,exactlyOnce(h,needle));
}
assert('Batch20 stylesheet in actual outer document head',h.indexOf('href="./sarni20-visual.css?v=1"')>=0&&h.indexOf('href="./sarni20-visual.css?v=1"')<h.indexOf('</head>\n<body>'));
assert('Batch20 JS loaded after existing workspace',h.indexOf('src="./sarni20-visual.js?v=1"')>h.indexOf('src="./sarni10-main-workspace.js?v=1"'));
for(const id of ['sarni10Workspace','sarni10ModuleSearch','sarni10ModuleResults','sarni10Favorites','sarni10Recent','sarni10Density','adminSettingsSection','adminSecurityPanel','sarniBackupPanel','usersSection','sarniSidebarPrimary','appView'])
 assert('existing HTML id: '+id,h.includes('id="'+id+'"'));
for(const mode of ['expense','diary','office','stock','investment','family'])
 assert('quick-entry mode: '+mode,new RegExp('(?:data-mode|kind|mode)[^\\n]{0,100}'+mode,'i').test(q));
assert('Quick Entry uses origin-only referrer policy before resource loads', q.includes('<meta name="referrer" content="origin">') && q.indexOf('<meta name="referrer" content="origin">') < q.indexOf('<link'));
assert('Quick Entry referrer policy does not alter link access/expiry logic',q.includes('new URLSearchParams(location.search)')&&q.includes('qePendingUncertain'));
assert('quick-entry authorized retry route present',q.includes('qpinSyncRetry')&&q.includes('pinGrant'));
assert('Quick Entry renders fields before optional PIN info',q.includes("render();if(qeOfflineKey)qeOfflineCaptureBootstrap();")&&q.lastIndexOf("render();if(qeOfflineKey)qeOfflineCaptureBootstrap();")<q.lastIndexOf("void initializePinAccess().then("));
assert('Quick Entry gates Save while optional PIN policy loads',q.includes("quickSave.disabled=true")&&q.includes("if(!busy&&!qePhotoBusy)quickSave.disabled=false"));
assert('Quick Entry initial panel reads wait for PIN initialization',q.includes("void initializePinAccess().then(")&&q.includes("status('');void qeRefreshPanels();})")&&!q.includes("status(permissionNotice);void qeRefreshPanels();"));
const quickInline=q.match(/<script>\\s*([\\s\\S]*?)<\\/script>/i)?.[1];
let quickSyntaxOk=false;
if(quickInline){try{new Script(quickInline,{filename:'q/index.html:inline'});quickSyntaxOk=true;}catch(error){console.error('Quick Entry inline JS syntax:',error.message);}}
assert('Quick Entry inline script parses cleanly',quickSyntaxOk);
assert('Quick Entry opt-in timing panel exists',q.includes("qeTimingDetails.id='qeLoadTimingDetails'")&&q.includes("qeTimingDetails.addEventListener('toggle'"));
assert('Quick Entry stages capture both permissions and visible fields',q.includes("qeTimingMark('linkInfo')")&&q.includes("qeTimingMark('hubInfo')")&&q.includes("qeTimingMark('fields')")&&q.includes("qeTimingMark('pin')"));
assert('Quick Entry timing is memory-only with no identifiers in output',q.includes("No token, user input or response content is recorded.")&&!q.includes("localStorage.setItem('qeLoadTiming"));
assert('quick-entry unknown-save handling present',q.includes('qePendingUncertain'));
assert('quick-entry sync badge already present',q.includes('recent-sync-badge'));
assert('admin overview reuses existing auth-gated UI',admin.includes('sarni-is-admin')&&admin.includes('adminSettingsSection'));
assert('admin overview does not call backend',!/\bfetch\s*\(|XMLHttpRequest|\.call\(\s*['"]admin/i.test(admin));
assert('Batch20 navigation respects existing hidden/disabled controls',visual.includes('permitted(b)')&&visual.includes("classList.contains('hidden')"));
assert('Batch20 has no API/write endpoints',!/\bfetch\s*\(|XMLHttpRequest|\.post\(/.test(visual));
assert('Batch20 stores no secret or form content',!/localStorage|sessionStorage|indexedDB/.test(visual));
assert('Batch20 supports reduced motion',css.includes('@media(prefers-reduced-motion:reduce)'));
assert('Batch20 print excludes navigation only',css.includes('@media print')&&css.includes('#sarni20Quicknav'));
assert('Focus view script loaded after main navigation',h.indexOf('src="./sarni-focus-view.js?v=1"')>h.indexOf('src="./sarni20-visual.js?v=1"'));
assert('Health page checks new assets',text('health.html').includes('data-file="./sarni-focus-view.js"')&&text('health.html').includes('data-file="./q/index.html"'));
assert('No accidental encoded line break in health markup',!text('health.html').includes('\\n<li data-file='));

const quickWorker=text('q/sw.js');
assert('PWA public app shell caches Quick Entry CSS and JS',quickWorker.includes("new URL('./sarni9-batch10.css',SCOPE)")&&quickWorker.includes("new URL('./sarni9-batch10.js',SCOPE)"));
assert('PWA shell cache bumped for new asset inventory',quickWorker.includes("sarni-q-private-shell-v3"));
assert('Service worker ignores requests with query strings',quickWorker.includes("if(!PATHS.has(url.pathname)||url.search)return"));
assert('Service worker limits itself to public GET same-origin',quickWorker.includes("request.method!=='GET'||url.origin!==self.location.origin"));
assert('Service worker never uses token-bearing navigation as cache key',quickWorker.includes("cache.match(SHELL)"));
console.log('\n'+(failures?'FAILED':'PASSED')+' static regression: '+failures+' failure(s).');
console.log('Not tested: authentication, saving, backend permissions, real sync, backup restores, end-to-end mobile interactions.');
process.exitCode=failures?1:0;
