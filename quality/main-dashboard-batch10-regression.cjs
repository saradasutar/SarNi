/* SarNi main dashboard integrity check.
 * The separate SarNi 10 duplicate Quick Workspace was retired intentionally.
 * Keep the original main dashboard routes intact and do not reactivate duplicates.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const retired=[
 ['sarni-main-batch10.js','sarni-main-batch10.css'],
 ['sarni10-main-polish.js','sarni10-main-polish.css'],
 ['sarni10-main-upgrades.js','sarni10-main-upgrades.css'],
 ['sarni10-main-batch.js','sarni10-main-batch.css'],
 ['sarni10-main-workspace.js','sarni10-main-workspace.css']
];
const activeScripts=retired.filter(([js])=>html.includes('src="./'+js));
const activeStyles=retired.filter(([,css])=>html.includes('href="./'+css));
const checks=[
 ['Retired duplicate SarNi 10 scripts remain inactive',activeScripts.length===0],
 ['Retired duplicate SarNi 10 styles remain inactive',activeStyles.length===0],
 ['Retirement is documented in the main HTML',html.includes('sarni10-main-workspace.css retired')],
 ['Original main dashboard modules preserved',['mainDashboard','sarniSidebarPrimary','overviewSection','diarySection','calendarSection','expenditureSection','sarniMainHealth'].every(id=>html.includes('id="'+id+'"'))]
];
let fail=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+name);if(!ok)fail++;}
console.log((checks.length-fail)+'/'+checks.length+' main-dashboard checks passed');
if(fail)process.exitCode=1;
