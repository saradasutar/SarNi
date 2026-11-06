/* SarNi 10: read-only regression for the ONE active main-dashboard bundle. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni-main-batch10.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni-main-batch10.css'),'utf8');
const refs=[...html.matchAll(/(?:src|href)="([^"]*(?:sarni10|batch10)[^"]*)"/g)].map(x=>x[1]);
const tests=[
 ['Exactly one active main-dashboard stylesheet and script',refs.length===2&&refs.every(r=>r.includes('sarni-main-batch10.'))],
 ['Four core sections have quick navigation',['overview','diary','calendar','expenditure'].every(k=>js.includes("key:'"+k+"'"))],
 ['Navigation delegates to existing sidebar',js.includes('original.click()')&&js.includes("navigation.querySelector('[data-section=")],
 ['Section access honors permission and hidden state',js.includes('!original.disabled&&!original.hidden')&&js.includes("!original.closest('[hidden]')")],
 ['Active section has accessible indicator',js.includes("setAttribute('aria-current','page')")&&js.includes("setAttribute('aria-live','polite')")],
 ['Keyboard shortcuts avoid form fields',js.includes('Digit[1-4]')&&js.includes("input,textarea,select,[role=")],
 ['Scroll progress and Back to Top are read only',js.includes('sarni10ScrollProgress')&&js.includes('sarni10BackTop')&&js.includes('scrollTo({')],
 ['Collapsible keyboard help is available',js.includes('sarni10-keyboard-help')&&js.includes('Keyboard shortcuts')],
 ['Mobile controls and keyboard focus are styled',css.includes('min-height:')&&css.includes('focus-visible')],
 ['Reduced motion and print rules are present',css.includes('prefers-reduced-motion:reduce')&&css.includes('@media print')],
 ['No account storage, fetching or mutation',!/(?:fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\bapi\s*\()/i.test(js)],
 ['All JavaScript parses',(()=>{try{new Function(js);return true;}catch(_){return false;}})()]
];
let failed=0;
for(const [name,passed] of tests){console.log((passed?'PASS':'FAIL')+' '+name);if(!passed)failed++;}
console.log((tests.length-failed)+'/'+tests.length+' main dashboard checks passed');
if(failed)process.exitCode=1;
