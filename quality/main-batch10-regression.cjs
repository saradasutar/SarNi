/* SarNi 10 main-dashboard UX batch: dependency-free static regression.
 * Read-only checks; no credentials, Apps Script, photos or live entries. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni-main-batch10.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni-main-batch10.css'),'utf8');
const tests=[
 ['One active SarNi 10 CSS file', (html.match(/<link[^>]+sarni-main-batch10\.css/g)||[]).length===1],
 ['One active SarNi 10 script', (html.match(/<script[^>]+sarni-main-batch10\.js/g)||[]).length===1],
 ['No competing SarNi 10 loaders', !/<(?:script|link)\b[^>]*(?:sarni10-(?:main|workspace)|sarni-main10|sarni-main-batch10-v1)/i.test(html)],
 ['Existing main modules remain intact', ['mainDashboard','sarniSidebarPrimary','overviewSection','diarySection','calendarSection','expenditureSection','sarniMainHealth'].every(id=>html.includes('id="'+id+'"'))],
 ['Quick section buttons call existing sidebar only', js.includes("original.click()") && js.includes("allowedNav(original)")],
 ['Hidden and disabled sections are blocked', js.includes("button.disabled") && js.includes("button.hidden") && js.includes("aria-hidden")],
 ['Current section is announced', js.includes("aria-current") && js.includes("aria-live")],
 ['Keyboard shortcuts avoid edits and unauthorized modules', js.includes("Digit[1-4]") && js.includes("isContentEditable") && js.includes("button.hidden||button.disabled")],
 ['Back-to-top works with page or inner scrolling', js.includes("const getScroller=") && js.includes("getScroller().scrollTo")],
 ['Focus, mobile touch, wrapping, motion and print styles', ['focus-visible','min-height:44px','overflow-wrap:anywhere','prefers-reduced-motion','@media print'].every(v=>css.includes(v))],
 ['No backend or browser data storage introduced', !/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/.test(js)],
 ['Core workflow can still run without the UX layer', !js.includes('document.body.innerHTML=') && js.includes("if(!dashboard||!app||!navigation")]
];
let failed=0;
for(const [name,ok] of tests){console.log((ok?'PASS':'FAIL')+' '+name);if(!ok)failed++;}
new Function(js);
console.log((tests.length-failed)+'/'+tests.length+' SarNi 10 source checks passed');
assert.equal(failed,0,'SarNi 10 source regression failure');
