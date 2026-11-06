/* SarNi 10 main dashboard: source-only upgrade checks. No live network, login or user data. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const assets=['sarni10-main-workspace','sarni-main-batch10','sarni10-main-upgrades','sarni10-main-polish'];
const scripts=assets.filter(x=>html.includes('./'+x+'.js'));
const styles=assets.filter(x=>html.includes('./'+x+'.css'));
function test(label,ok){assert.ok(ok,label);console.log('PASS '+label)}
test('Exactly one active main enhancement script',scripts.length===1);
test('Exactly one active matching stylesheet',styles.length===1&&styles[0]===scripts[0]);
const name=scripts[0];
test('No duplicate imports',(html.split('./'+name+'.js').length===2)&&(html.split('./'+name+'.css').length===2));
const js=fs.readFileSync(path.join(root,name+'.js'),'utf8'),css=fs.readFileSync(path.join(root,name+'.css'),'utf8');
test('Retains existing authorized navigation',html.includes('id="sarniSidebarPrimary"')&&/\.click\(\)/.test(js));
test('Main dashboard preserved',html.includes('id="mainDashboard"')&&html.includes('id="sarniMainHealth"'));
test('Accessibility and current section',/aria-current|breadcrumb|activeSection/i.test(js));
test('Keyboard-safe navigation',/keydown|keyboard/i.test(js)&&/input|textarea/i.test(js));
test('Useful navigation shortcut',/jump|shortcut|search/i.test(js));
test('Mobile focus and touch styles',/focus-visible/.test(css)&&/min-height/.test(css));
test('Reduced motion',css.includes('prefers-reduced-motion:reduce'));
test('No direct API or persistent data writes',!/(?:fetch\s*\(|XMLHttpRequest|localStorage\.setItem|sessionStorage\.setItem)/.test(js));
test('Script parses',(()=>{try{new Function(js);return true}catch(_){return false}})());
console.log('12/12 main-dashboard checks passed using '+name);
