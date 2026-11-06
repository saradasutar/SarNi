/* SarNi 10 active workspace regression — source-only, no API or user data. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni10-main-workspace.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni10-main-workspace.css'),'utf8');
const count=t=>html.split(t).length-1;
const checks=[
 ['Exactly one active workspace JS',count('./sarni10-main-workspace.js')===1],
 ['Exactly one active workspace CSS',count('./sarni10-main-workspace.css')===1],
 ['Retired bundles not active',!/(?:src|href)="\.\/[^"]*(?:sarni-main-batch10(?:-v1)?|sarni10-main-(?:polish|upgrades|batch))\.(?:js|css)/.test(html)],
 ['Workspace belongs to dashboard',html.includes('id="sarni10Workspace"')&&html.includes('id="mainDashboard"')],
 ['Search and clear',js.includes("sarni10ModuleSearch")&&js.includes("sarni10ClearSearch")],
 ['Permission-aware module filter',js.includes('valid().filter(allowed)')||js.includes('all().filter(allowed)')],
 ['Accessible results counts',js.includes("sarni10ModuleCount")&&html.includes('id="sarni10ModuleCount"')],
 ['Favorites and recent modules',js.includes('favoriteSet=new Set()')&&js.includes('renderFavorites()')&&js.includes('renderRecent()')],
 ['Breadcrumb updated',js.includes('sarni10Breadcrumb')&&js.includes("Current section: ")],
 ['Compact density toggle',js.includes("sarni10-compact")&&js.includes("aria-pressed")],
 ['Slash keyboard shortcut respects editing',js.includes("event.key==='/'")&&js.includes('isContentEditable')],
 ['Escape resets search',js.includes("event.key==='Escape'")],
 ['Back to top and reduced motion',js.includes('sarni10Top')&&js.includes('prefers-reduced-motion: reduce')],
 ['No personal data or backend operations',!/(?:fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\.password|\.grant)/.test(js)],
 ['JavaScript syntax',(()=>{try{new Function(js);return true}catch(_){return false}})()],
 ['Mobile styling',css.includes('@media')&&css.includes('focus-visible')]
];
const failed=checks.filter(x=>!x[1]);
checks.forEach(([name,ok])=>console.log((ok?'PASS':'FAIL')+' '+name));
console.log((checks.length-failed.length)+'/'+checks.length+' checks passed');
if(failed.length)process.exitCode=1;
