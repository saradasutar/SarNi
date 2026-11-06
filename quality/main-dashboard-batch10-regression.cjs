/* SarNi 10 main dashboard - source regression. No login, network or records. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni10-main-upgrades.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni10-main-upgrades.css'),'utf8');
const tests=[
 ['Matching JS loaded once',(html.match(/src="\.\/sarni10-main-upgrades\.js(?:\?[^"]*)?"/g)||[]).length===1],
 ['Matching CSS loaded once',(html.match(/href="\.\/sarni10-main-upgrades\.css(?:\?[^"]*)?"/g)||[]).length===1],
 ['No competing main navigation bundle',!/src="\.\/sarni-main-batch10\.js/.test(html)],
 ['Workspace controls available',['sarni10WorkspaceBar','sarni10Jump','sarni10CurrentSection','sarni10NetworkStatus','sarni10HelpToggle','sarni10ShortcutHelp','sarni10Progress','sarni10BackTop'].every(id=>html.includes('id="'+id+'"'))],
 ['Existing navigation used',js.includes('#sarniSidebarPrimary .nav-item[data-section=')&&js.includes('original.click()')],
 ['Permission-aware jump actions',js.includes("original.disabled")&&js.includes("original.classList.contains('hidden')")],
 ['Current section indicator',js.includes("button.setAttribute('aria-current','page')")],
 ['Browser network is not backend verification',js.includes("navigator.onLine")&&js.includes('does not verify Google Apps Script')],
 ['Scroll indicator and Back to Top',js.includes("sarni10Progress")&&js.includes("sarni10BackTop")&&js.includes("scrollTo({top:0")],
 ['Input-safe keyboard shortcuts',js.includes("KeyH:'overview'")&&js.includes("event.target.closest?.('input,textarea,select")],
 ['Accessible shortcut help',js.includes("sarni10HelpToggle")&&js.includes("event.key==='Escape'")],
 ['Offscreen image lazy loading',js.includes("img.loading='lazy'")&&js.includes("#loginView")],
 ['Focus and touch CSS',css.includes(':focus-visible')&&css.includes('min-height:43px')],
 ['Reduced motion',css.includes('prefers-reduced-motion:reduce')],
 ['No backend, secret or storage operations',!/(?:fetch|XMLHttpRequest|localStorage|sessionStorage|\.token|\.password|\.grant)\b/.test(js)],
 ['JavaScript syntax',(()=>{try{new Function(js);return true}catch(_){return false}})()]
];
let failures=0;for(const [name,ok] of tests){console.log((ok?'PASS':'FAIL')+' '+name);if(!ok)failures++;}
console.log((tests.length-failures)+'/'+tests.length+' main dashboard checks passed.');
if(failures)process.exitCode=1;
