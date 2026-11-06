/* SarNi 10 main dashboard regressions; source-only, no network or user data. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni-main-batch10.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni-main-batch10.css'),'utf8');
const checks=[
 ['Single active JavaScript',html.split('sarni-main-batch10.js').length===2],
 ['Single active stylesheet',html.split('sarni-main-batch10.css').length===2],
 ['No duplicate main add-ons',!/(?:src|href)="\.\/[^"]*(?:sarni10-main-|sarni-main-batch10-v1)/.test(html)],
 ['Reuse existing navigation',js.includes('original.click()')&&js.includes('sarniSidebarPrimary')],
 ['Four quick section buttons',["key:'overview'","key:'diary'","key:'calendar'","key:'expenditure'"].every(x=>js.includes(x))],
 ['Active section announced',js.includes("aria-live','polite")&&js.includes('aria-current')],
 ['Keyboard shortcuts ignore typing',js.includes('Digit[1-4]')&&js.includes('isContentEditable')],
 ['Scroll progress and top control',js.includes('sarni10ScrollProgress')&&js.includes('sarni10BackTop')],
 ['Collapsible keyboard guide',js.includes('sarni10-keyboard-help')],
 ['Clear focus indicators',css.includes('focus-visible')],
 ['Mobile touch targets',css.includes('min-height:44px')],
 ['Long-text wrapping',css.includes('overflow-wrap:anywhere')],
 ['Reduced motion',css.includes('prefers-reduced-motion:reduce')],
 ['Print-friendly controls',css.includes('@media print')],
 ['No network or credential handling',!/(?:fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\.password|\.grant)/.test(js)],
 ['Script syntax',(()=>{try{new Function(js);return true}catch(_){return false}})()]
];
const failures=checks.filter(x=>!x[1]);checks.forEach(([name,ok])=>console.log((ok?'PASS':'FAIL')+' '+name));
console.log((checks.length-failures.length)+'/'+checks.length+' checks passed');
if(failures.length)process.exitCode=1;
