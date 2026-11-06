/* SarNi 10: source regression for the single active main-dashboard bundle. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni-main-batch10.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni-main-batch10.css'),'utf8');
const checks=[
 ['Exactly one main script', (html.match(/src="\.\/sarni-main-batch10\.js(?:\?[^"]*)?"/g)||[]).length===1],
 ['Exactly one main stylesheet', (html.match(/href="\.\/sarni-main-batch10\.css(?:\?[^"]*)?"/g)||[]).length===1],
 ['No competing main upgrade assets', !/<(?:script|link)[^>]+(?:src|href)="[^"]*(?:sarni10-main-(?:upgrades|polish|workspace|enhancements|batch)|sarni-main-batch10-v1)/.test(html)],
 ['No duplicate static upgrade widgets', !/id="sarni10(?:Workspace|WorkspaceBar|Tools|Top)"/.test(html)],
 ['Main dashboard authentication shell respected',js.includes("document.getElementById('appView')")],
 ['Existing allowed sidebar controls used',js.includes('allowedNav(original)')&&js.includes('original.click()')],
 ['Four quick section buttons', ['overview','diary','calendar','expenditure'].every(x=>js.includes("key:'"+x+"'"))],
 ['Active page and assistive status',js.includes('aria-live')&&js.includes('aria-current')],
 ['Keyboard shortcuts protect text inputs',js.includes('event.altKey')&&js.includes('input,textarea,select')],
 ['Scroll progress and back to top',js.includes('sarni10ScrollProgress')&&js.includes('sarni10BackTop')],
 ['Accessible focus style',css.includes(':focus-visible')],
 ['Mobile tap targets',css.includes('min-height:44px')],
 ['Text wrapping and reduced motion',css.includes('overflow-wrap:anywhere')&&css.includes('prefers-reduced-motion:reduce')],
 ['Read-only frontend helper',!/(?:fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/.test(js)],
 ['Valid JavaScript syntax',(()=>{try{new Function(js);return true}catch(_){return false}})()]
];
for(const [name,ok] of checks)console.log((ok?'PASS':'FAIL')+' '+name);
const failed=checks.filter(x=>!x[1]);console.log((checks.length-failed.length)+'/'+checks.length+' main-dashboard checks passed');
assert.equal(failed.length,0,'Main dashboard regression failed');
