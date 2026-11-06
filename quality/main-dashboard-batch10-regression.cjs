/* SarNi 10: current single-workspace source smoke checks. No user data or API. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni10-main-workspace.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni10-main-workspace.css'),'utf8');
const cases=[
 ['Single approved main workspace script',html.split('sarni10-main-workspace.js').length===2],
 ['Single approved main workspace CSS',html.split('sarni10-main-workspace.css').length===2],
 ['No overlapping active main bundles',!/(?:src|href)="\.\/(?:sarni-main-batch10|sarni10-main-polish|sarni10-main-upgrades)[.]/.test(html)],
 ['Module finder and clear search',js.includes('sarni10ModuleSearch')&&js.includes('sarni10ClearSearch')],
 ['Permission-filtered available sections',js.includes('const allowed=')&&js.includes('button.disabled')&&js.includes("button.closest('.hidden,[hidden]')")],
 ['Existing sidebar navigation reused',js.includes('button.click();record(')],
 ['Favorites and recents memory-only',js.includes('const favoriteSet=new Set(),history=[]')&&!js.includes('localStorage.')],
 ['Current section and count',js.includes('sarni10Breadcrumb')&&js.includes('sarni10ModuleCount')],
 ['Keyboard search shortcut',js.includes("event.key==='/'")&&js.includes("event.key==='Escape'")],
 ['Compact spacing choice',js.includes("main.classList.toggle('sarni10-compact'")],
 ['Back to Top and reduced motion',js.includes('window.scrollTo(')&&js.includes('prefers-reduced-motion')],
 ['Responsive focus and touch targets',css.includes('focus-visible')&&css.includes('min-height:44px')],
 ['No backend requests or persistent storage',!/(?:fetch\s*\(|XMLHttpRequest|sessionStorage\.|localStorage\.)/.test(js)],
 ['Valid JavaScript',(()=>{try{new Function(js);return true}catch(_){return false}})()]
];
const failures=cases.filter(x=>!x[1]);
cases.forEach(([name,ok])=>console.log((ok?'PASS':'FAIL')+' '+name));
console.log((cases.length-failures.length)+'/'+cases.length+' checks passed');
if(failures.length)process.exitCode=1;
