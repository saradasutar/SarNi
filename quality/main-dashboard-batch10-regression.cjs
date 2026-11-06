/* SarNi 10 main dashboard batch regression, read-only source tests.
 * Run: node quality/main-dashboard-batch10-regression.cjs
 * Does not open a session, fetch backend data, or modify user records. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni10-main-upgrades.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni10-main-upgrades.css'),'utf8');
const tests=[
 ['Stylesheet and script loaded',html.includes('href="./sarni10-main-upgrades.css"')&&html.includes('src="./sarni10-main-upgrades.js"')],
 ['Workspace controls present', ['sarni10WorkspaceBar','sarni10Jump','sarni10CurrentSection','sarni10NetworkStatus','sarni10HelpToggle','sarni10ShortcutHelp','sarni10Progress','sarni10BackTop'].every(id=>html.includes('id="'+id+'"'))],
 ['Existing section navigation reused', js.includes('#sarniSidebarPrimary .nav-item[data-section=')&&js.includes('original.click()')],
 ['Permission-aware jump buttons',js.includes("source.classList.contains('hidden')")&&js.includes('source.disabled')],
 ['Current section indicated',js.includes("button.setAttribute('aria-current','page')")],
 ['Browser network status described accurately',js.includes('navigator.onLine')&&js.includes('does not verify Google Apps Script')],
 ['Scroll progress and Back to Top',js.includes('scrollHeight-innerHeight')&&js.includes('sarni10BackTop')&&js.includes('scrollTo({top:0')],
 ['Input-safe navigation shortcuts',js.includes('event.target.closest?.(\'input,textarea,select')&&js.includes("KeyH:'overview'")],
 ['Collapsible shortcut help',js.includes('sarni10HelpToggle')&&js.includes("event.key==='Escape'")],
 ['Offscreen image optimization avoids login and avatars',js.includes("img.closest('.topbar,.side-brand,.sidebar-account-line,#loginView')")&&js.includes("img.loading='lazy'")],
 ['Keyboard focus and mobile touch CSS',css.includes(':focus-visible')&&css.includes('min-height:43px')],
 ['Reduced motion respected',css.includes('prefers-reduced-motion:reduce')],
 ['No backend or credential access in helper',!/(?:fetch|XMLHttpRequest|localStorage|sessionStorage|\.token|\.password|\.grant)\b/.test(js)],
 ['Helper JavaScript parses',(()=>{try{new Function(js);return true}catch(_){return false}})()]
];
let failed=0;
for(const [name,pass] of tests){console.log((pass?'PASS':'FAIL')+' '+name);if(!pass)failed++;}
console.log((tests.length-failed)+'/'+tests.length+' main-dashboard batch checks passed');
if(failed)process.exitCode=1;
