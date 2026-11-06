/* SarNi 10 main dashboard: source regression for the active Workspace bundle.
 * Never connects to Google Apps Script or uses private records. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni10-main-workspace.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni10-main-workspace.css'),'utf8');
const activeAssets=[...html.matchAll(/(?:src|href)="\.\/([^"?]*(?:sarni10|sarni-main-batch10)[^"?]*)/g)].map(m=>m[1]);
const checks=[
 ['Single matching active bundle',activeAssets.length===2 && activeAssets.includes('sarni10-main-workspace.js') && activeAssets.includes('sarni10-main-workspace.css')],
 ['Dashboard host',html.includes('id="mainDashboard"') && html.includes('id="sarniSidebarPrimary"')],
 ['Workspace controls', ['sarni10Workspace','sarni10ModuleSearch','sarni10ClearSearch','sarni10ModuleResults','sarni10ModuleCount'].every(id=>js.includes(id))],
 ['Favorites and recent sections', ['sarni10Favorites','sarni10Recent','favoriteSet','renderFavorites','renderRecent'].every(id=>js.includes(id))],
 ['Active page breadcrumb',js.includes('sarni10Breadcrumb') && js.includes('Current section:')],
 ['Existing authorized nav reused',js.includes("button.click()") && js.includes('button[data-section]') && js.includes('disabled')],
 ['Input-safe keyboard search',js.includes("event.key==='/'") && js.includes('isContentEditable') && js.includes("event.key==='Escape'")],
 ['Density and back-to-top',js.includes('sarni10Density') && js.includes('sarni10Top') && js.includes('sarni10-compact')],
 ['No backend or stored secrets', !/(?:fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\.password|\.grant)/.test(js)],
 ['Responsive focus and reduced-motion CSS', css.includes('focus-visible') && css.includes('prefers-reduced-motion:reduce')],
 ['Syntax',(()=>{try{new Function(js);return true}catch(_){return false}})()]
];
let failed=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+name);if(!ok)failed++;}
console.log((checks.length-failed)+'/'+checks.length+' main-dashboard checks passed.');
if(failed)process.exitCode=1;
