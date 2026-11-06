/* SarNi 10 main dashboard: read-only regression for the single active UX bundle. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni10-main-polish.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni10-main-polish.css'),'utf8');
const checks=[
 ['Single active JavaScript',html.split('sarni10-main-polish.js').length===2],
 ['Single active stylesheet',html.split('sarni10-main-polish.css').length===2],
 ['No competing SarNi 10 loaders',!/(?:src|href)="\.\/[^"]*(?:sarni-main-batch10|sarni10-main-workspace|sarni10-main-upgrades|sarni10-main-batch)/i.test(html)],
 ['Existing sidebar navigation is authoritative',js.includes('sarniSidebarPrimary')&&js.includes('b.click()')&&js.includes('function permitted(section)')],
 ['Four section shortcuts',["['overview','Home'","['diary','Diary'","['calendar','Calendar'","['expenditure','Expense'"].every(x=>js.includes(x))],
 ['Active section announced',js.includes("aria-live','polite")&&js.includes('aria-current')],
 ['Keyboard shortcuts ignore typing', ['KeyH','KeyD','KeyC','KeyE','contenteditable'].every(x=>js.includes(x))],
 ['Scroll progress and top control',js.includes('sarni10ScrollProgress')&&js.includes('sarni10BackTop')],
 ['Collapsible keyboard guide',js.includes('sarni10HelpPanel')&&js.includes('aria-expanded')],
 ['Clear focus indicators',css.includes('focus-visible')],
 ['Mobile touch targets',css.includes('min-height:43px')],
 ['Long-text wrapping',css.includes('overflow-wrap:anywhere')],
 ['Reduced motion',css.includes('prefers-reduced-motion:reduce')],
 ['Print-friendly controls',css.includes('@media print')],
 ['No record or credential access',!/(?:fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\.password|\.grant)/.test(js)],
 ['Script syntax',(()=>{try{new Function(js);return true}catch(_){return false}})()]
];
const failures=checks.filter(x=>!x[1]);
checks.forEach(([name,ok])=>console.log((ok?'PASS':'FAIL')+' '+name));
console.log((checks.length-failures.length)+'/'+checks.length+' checks passed');
if(failures.length)process.exitCode=1;
