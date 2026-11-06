/* SarNi 10 main-dashboard regression: source-only, no login/backend access. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni10-main-polish.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni10-main-polish.css'),'utf8');
const tests=[
 ['Bundle loaded once',html.includes('href="./sarni10-main-polish.css"')&&html.includes('src="./sarni10-main-polish.js"')],
 ['Existing navigation reused',js.includes('b.click();sync();')&&js.includes('.side-nav button[data-section=')],
 ['Quick jump links',js.includes('sarni10JumpBar')&&js.includes("['diary','Diary'")&&js.includes("['calendar','Calendar'")],
 ['Current section indicator',js.includes('sarni10ActiveSection')&&js.includes('aria-current')],
 ['Keyboard shortcuts and help',js.includes('sarni10ShortcutHelp')&&js.includes("KeyH:'overview'")&&js.includes("KeyE:'expenditure'")],
 ['Scroll progress',js.includes('sarni10ScrollProgress')&&js.includes('scaleX(')],
 ['Back to top',js.includes('sarni10BackTop')&&js.includes('scrollTo(')],
 ['Focus and small touch targets',css.includes('focus-visible')&&css.includes('min-height:43px')],
 ['Long-text safety',css.includes('overflow-wrap:anywhere')],
 ['Reduced motion and print',css.includes('prefers-reduced-motion:reduce')&&css.includes('@media print')],
 ['Permission controls preserved',js.includes('b.disabled||b.hidden||b.classList.contains(\'hidden\')')],
 ['No storage, backend calls or user records',!/(?:fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB)\\s*\\(/.test(js)]
];
for(const [name,passed] of tests)console.log((passed?'PASS':'FAIL')+'  '+name);
const failed=tests.filter(([,passed])=>!passed);
console.log((tests.length-failed.length)+'/'+tests.length+' SarNi 10 checks passed');
assert.equal(failed.length,0,'One or more main-dashboard checks failed');
