/* SarNi 10: active main-dashboard bundle regression, no backend or user data. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const pattern=/\.\/(sarni10-main-workspace|sarni-main-batch10|sarni10-main-upgrades|sarni10-main-polish)\.(js|css)(?:\?[^"]*)?/g;
const links=[...html.matchAll(pattern)].map(m=>({base:m[1],extension:m[2]}));
const scripts=links.filter(x=>x.extension==='js');
const styles=links.filter(x=>x.extension==='css');
const checks=[];
const check=(name,value)=>checks.push([name,!!value]);
check('Exactly one active main enhancement script',scripts.length===1);
check('Exactly one active main enhancement stylesheet',styles.length===1);
check('Active CSS and JavaScript belong to the same bundle',scripts.length===1&&styles.length===1&&scripts[0].base===styles[0].base);
let js='',css='';
if(scripts.length===1&&styles.length===1&&scripts[0].base===styles[0].base){
 js=fs.readFileSync(path.join(root,scripts[0].base+'.js'),'utf8');
 css=fs.readFileSync(path.join(root,styles[0].base+'.css'),'utf8');
}
check('Enhancement JavaScript loads from a real file',!!js);
check('Enhancement CSS loads from a real file',!!css);
check('Dashboard stays behind existing authenticated shell',html.includes('id="appView"')&&html.includes('id="mainDashboard"'));
check('Existing authorized navigation is preserved',html.includes('id="sarniSidebarPrimary"')&&js.includes('sarniSidebarPrimary'));
check('Enhancement does not call APIs or persist private information',!/(?:fetch\s*\(|XMLHttpRequest|localStorage\.|sessionStorage\.)/.test(js));
check('Existing Diary and Calendar sections remain intact',html.includes('id="diarySection"')&&html.includes('id="calendarSection"'));
check('Existing Expense section remains intact',html.includes('id="expenditureSection"'));
check('Accessible focus styling exists',css.includes('focus-visible'));
check('Mobile responsive styles exist',css.includes('@media'));
check('Reduced motion respected',css.includes('prefers-reduced-motion:reduce'));
check('Enhancement JavaScript parses',(()=>{try{new Function(js);return !!js}catch(_){return false}})());
for(const [name,ok] of checks)console.log((ok?'PASS':'FAIL')+' '+name);
const failed=checks.filter(x=>!x[1]);
console.log((checks.length-failed.length)+'/'+checks.length+' main-dashboard checks passed');
assert.equal(failed.length,0,'SarNi main-dashboard regression failed');
