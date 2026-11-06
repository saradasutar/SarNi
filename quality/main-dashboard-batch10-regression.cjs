/* SarNi 10: regression for the single active main-dashboard enhancement bundle.
 * Static, read-only checks; no login, API calls, or record mutation. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni-main-batch10.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni-main-batch10.css'),'utf8');
const count=needle=>html.split(needle).length-1;
const checks=[
 ['One active stylesheet',count('sarni-main-batch10.css')===1],
 ['One active JavaScript file',count('sarni-main-batch10.js')===1],
 ['Navigation reuses existing sidebar controls',js.includes('original.click()')&&js.includes('sarniSidebarPrimary')],
 ['Four primary sections',["key:'overview'","key:'diary'","key:'calendar'","key:'expenditure'"].every(x=>js.includes(x))],
 ['Current selection announced accessibly',js.includes("setAttribute('aria-live','polite')")&&js.includes("setAttribute('aria-current','page')")],
 ['Keyboard shortcuts not active while typing',js.includes("Digit[1-4]")&&js.includes('isContentEditable')],
 ['Scroll progress and Back to Top',js.includes('sarni10ScrollProgress')&&js.includes('sarni10BackTop')],
 ['Expandable shortcut instructions',js.includes('sarni10-keyboard-help')],
 ['Visible focus and mobile touch targets',css.includes('focus-visible')&&css.includes('min-height:44px')],
 ['Long text and reduced motion',css.includes('overflow-wrap:anywhere')&&css.includes('prefers-reduced-motion:reduce')],
 ['Clean print layout',css.includes('@media print')],
 ['No data transport, secrets, or browser storage',!/(?:fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\.password|\.grant)/.test(js)],
 ['Valid helper JS',(()=>{try{new Function(js);return true}catch(_){return false}})()]
];
let failures=0;for(const [name,pass] of checks){console.log((pass?'PASS':'FAIL')+' '+name);if(!pass)failures++;}
console.log((checks.length-failures)+'/'+checks.length+' SarNi 10 checks passed');
if(failures)process.exitCode=1;
