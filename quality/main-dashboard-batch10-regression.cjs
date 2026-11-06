/* SarNi main dashboard progressive enhancement checks. Offline and read-only. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni10-main-workspace.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni10-main-workspace.css'),'utf8');
const tests=[
 ['Exactly one JS asset',(html.match(/src="\.\/sarni10-main-workspace\.js(?:\?[^"]*)?"/g)||[]).length===1],
 ['Exactly one CSS asset',(html.match(/href="\.\/sarni10-main-workspace\.css(?:\?[^"]*)?"/g)||[]).length===1],
 ['No competing toolbars',!/(?:src|href)="\.\/(?:sarni-main-batch10|sarni10-main-polish|sarni10-main-upgrades|sarni10-main-batch)\./.test(html)],
 ['Workspace interface present',['sarni10Workspace','sarni10ModuleSearch','sarni10ClearSearch','sarni10ModuleResults','sarni10Favorites','sarni10Recent','sarni10Breadcrumb','sarni10Density','sarni10Top'].every(id=>html.includes('id="'+id+'"'))],
 ['Search and clear controls',js.includes('renderSearch()')&&js.includes("search.addEventListener('input',renderSearch)")],
 ['Authorized original nav only',js.includes('!allowed(button)')&&js.includes('button.click();record(button.dataset.section)')],
 ['Favorites and recent sections in memory',js.includes('new Set()')&&js.includes('history=[]')],
 ['Breadcrumb tracks active section',js.includes('breadcrumb.textContent=')],
 ['Compact spacing toggle',js.includes("main.classList.toggle('sarni10-compact'")],
 ['Slash search keyboard shortcut ignores inputs',js.includes("event.key==='/'")&&js.includes("target?.closest('input,textarea,select")],
 ['Back to Top',js.includes("top.addEventListener('click'")&&css.includes('#sarni10Top:not([hidden])')],
 ['Mobile keyboard focus and reduced motion',css.includes('focus-visible')&&css.includes('min-height:41px')&&css.includes('prefers-reduced-motion:reduce')],
 ['No API, secret or storage calls',!/(?:fetch\(|XMLHttpRequest|localStorage\.|sessionStorage\.|\.token|\.password|\.grant)\b/.test(js)],
 ['JavaScript syntax',(()=>{try{new Function(js);return true}catch(_){return false}})()]
];
let failed=0;for(const [name,ok] of tests){console.log((ok?'PASS':'FAIL')+' '+name);if(!ok)failed++;}
console.log((tests.length-failed)+'/'+tests.length+' main dashboard checks passed.');
if(failed)process.exitCode=1;
