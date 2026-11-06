/* SarNi 10: test the active main Workspace bundle only; no backend or records. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni10-main-workspace.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni10-main-workspace.css'),'utf8');
const matches=(re)=>(html.match(re)||[]).length;
const checks=[
 ['Exactly one Workspace script',matches(/src="\.\/sarni10-main-workspace\.js(?:\?[^"]*)?"/g)===1],
 ['Exactly one Workspace stylesheet',matches(/href="\.\/sarni10-main-workspace\.css(?:\?[^"]*)?"/g)===1],
 ['No competing main upgrade scripts',!/(?:src|href)="\.\/(?:sarni-main-batch10|sarni10-main-polish|sarni10-main-upgrades|sarni10-main-batch)\.(?:js|css)/.test(html)],
 ['Workspace and search controls exist',['sarni10Workspace','sarni10ModuleSearch','sarni10ClearSearch','sarni10ModuleResults','sarni10Favorites','sarni10Recent','sarni10Breadcrumb','sarni10Density','sarni10Top'].every(id=>html.includes('id="'+id+'"'))],
 ['Existing sidebar permissions are authoritative',js.includes('!allowed(button)')&&js.includes('button.click();record(button.dataset.section)')&&js.includes('sarniSidebarPrimary')],
 ['Search and clear functions',js.includes('function renderSearch()')&&js.includes("search.addEventListener('input',renderSearch)")],
 ['Favorites and recents held in memory',js.includes('new Set()')&&js.includes('history=[]')],
 ['Breadcrumb and section status',js.includes('breadcrumb.textContent=')],
 ['Compact spacing toggle',js.includes("main.classList.toggle('sarni10-compact'")],
 ['Slash shortcut excludes form fields',js.includes("event.key==='/'")&&js.includes("target?.closest('input,textarea,select")],
 ['Back to Top',js.includes("top.addEventListener('click'")&&css.includes('#sarni10Top:not([hidden])')],
 ['Focus rings and mobile sizing',css.includes('focus-visible')&&css.includes('min-height:41px')],
 ['Overflow and reduced-motion support',css.includes('overflow-wrap:anywhere')&&css.includes('prefers-reduced-motion:reduce')],
 ['No backend, credential or persistent storage operations',!/(?:fetch\(|XMLHttpRequest|localStorage\.|sessionStorage\.|\.token\b|\.password\b|\.grant\b)/.test(js)],
 ['JavaScript syntax',(()=>{try{new Function(js);return true}catch(_){return false}})()]
];
let failed=0;for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+name);if(!ok)failed++;}
console.log((checks.length-failed)+'/'+checks.length+' main dashboard checks passed.');
assert.equal(failed,0,'Main dashboard regression failed');
