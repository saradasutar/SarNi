/* SarNi 10: test the one active main-dashboard UX bundle, regardless of retired filenames. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const choices=[
 ['sarni-main-batch10.js','sarni-main-batch10.css'],
 ['sarni10-main-polish.js','sarni10-main-polish.css'],
 ['sarni10-main-workspace.js','sarni10-main-workspace.css']
];
const active=choices.filter(([js])=>html.includes('src="./'+js));
const checks=[
 ['Exactly one active SarNi 10 script',active.length===1],
 ['Original main dashboard modules preserved',['mainDashboard','sarniSidebarPrimary','overviewSection','diarySection','calendarSection','expenditureSection','sarniMainHealth'].every(id=>html.includes('id="'+id+'"'))]
];
if(active.length===1){
 const [jsName,cssName]=active[0];
 const js=fs.readFileSync(path.join(root,jsName),'utf8');
 const css=fs.readFileSync(path.join(root,cssName),'utf8');
 const loaders=choices.filter(([name])=>html.includes('src="./'+name));
 const styles=choices.filter(([,name])=>html.includes('href="./'+name));
 checks.push(
  ['No competing SarNi 10 loaders',loaders.length===1],
  ['One matching stylesheet',styles.length===1&&styles[0][1]===cssName],
  ['Reuses main sidebar without replacing app routes',js.includes('sarniSidebarPrimary')&&js.includes('.click()')],
  ['Active section UI',/aria-current|breadcrumb|Breadcrumb|ActiveSection/.test(js)],
  ['Mobile-friendly styling',css.includes('@media(max-width:')||css.includes('@media (max-width:')],
  ['Keyboard navigation',/keydown|KeyH|Digit[1-4]/.test(js)],
  ['Focus visibility',css.includes('focus-visible')],
  ['Readability or overflow safeguards',/overflow-wrap|word-break|min-width:0/.test(css)],
  ['No direct API calls from UX bundle',!/\bfetch\s*\(|XMLHttpRequest/.test(js)],
  ['JavaScript syntax',(()=>{try{new Function(js);return true}catch(_){return false}})()]
 );
}
let fail=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+name);if(!ok)fail++;}
console.log((checks.length-fail)+'/'+checks.length+' main-dashboard checks passed');
if(fail)process.exitCode=1;
