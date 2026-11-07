#!/usr/bin/env node
/**
 * Mocked browser smoke tests for Batch 10–20 UI enhancements.
 * Uses synthetic DOM, no user tokens, live server calls, or real records.
 * Does not establish actual login, backend authorization or synchronization.
 */
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
let browser;
before(async()=>{browser=await chromium.launch({headless:true});});
after(async()=>{await browser?.close();});

function doc(body){
 return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+
 '<style>body{margin:0;font:14px Arial,sans-serif}.hidden,[hidden]{display:none!important}main{width:100%;box-sizing:border-box}</style>'+
 '</head><body>'+body+'</body></html>';
}
async function withPage(body,assets,opts,verify){
 const page=await browser.newPage({viewport:opts?.viewport||{width:1280,height:780},reducedMotion:opts?.reducedMotion||'no-preference'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.setContent(doc(body));
  for(const style of (assets.styles||[]))await page.addStyleTag({path:resolve(root,style)});
  for(const script of (assets.scripts||[]))await page.addScriptTag({path:resolve(root,script)});
  await verify(page);
  assert.deepEqual(errors,[],'No uncaught browser JavaScript errors');
 }finally{await page.close();}
}
function workspaceFixture(){
 const pages=[['overview','Home'],['expenditure','Expense'],['calendar','Calendar'],['diary','Diary'],
 ['creditCards','Cards'],['books','Books'],['experiences','Life']];
 const nav=pages.map(([id,label])=>'<button data-section="'+id+'" class="'+(id==='overview'?'active':id==='calendar'?'hidden':'')+'" type="button">'+label+'</button>').join('');
 return '<div id="appView"><main id="mainDashboard"><section id="sarni10Workspace">'+
 '<input id="sarni10ModuleSearch" type="search" aria-label="Search permitted dashboard sections">'+
 '<span id="sarni10Breadcrumb"></span><div id="sarni10ModuleResults"></div>'+
 '</section><nav id="sarniSidebarPrimary">'+nav+'</nav>'+
 '<section class="page-section" id="overviewSection">Overview sample</section>'+
 '<section class="page-section hidden" id="diarySection">Diary sample</section>'+
 '</main></div>';
}
const workspace={styles:['sarni20-visual.css'],scripts:['sarni20-visual.js']};

test('Desktop dashboard renders existing permitted shortcuts, not hidden modules',async()=>{
 await withPage(workspaceFixture(),workspace,{viewport:{width:1280,height:800}},async p=>{
  assert.equal(await p.locator('#sarni20Tiles button').count(),6);
  assert.equal(await p.getByRole('button',{name:'Open Calendar'}).count(),0);
  assert.equal(await p.locator('#sarni20Header .sarni20-today').count(),1);
  assert.match(await p.locator('.sarni20-network').textContent(),/Browser online|Browser offline/);
  await p.getByRole('button',{name:'Hide shortcuts'}).click();
  assert.equal(await p.locator('#sarni20Tiles').isVisible(),false);
  await p.getByRole('button',{name:'Show shortcuts'}).click();
  assert.equal(await p.locator('#sarni20Tiles').isVisible(),true);
 });
});

test('Quick navigation uses existing section handler and does not submit a form',async()=>{
 await withPage(workspaceFixture(),workspace,{},async p=>{
  await p.evaluate(()=>{
   window.__navCount=0;
   document.querySelectorAll('#sarniSidebarPrimary button').forEach(b=>b.addEventListener('click',()=>{
    window.__navCount++;
    document.querySelectorAll('#sarniSidebarPrimary button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
   }));
  });
  await p.getByRole('button',{name:'Open Diary'}).click();
  assert.equal(await p.evaluate(()=>window.__navCount),1);
  await p.waitForFunction(()=>document.querySelector('#sarni20Active')?.textContent.includes('Diary'));
  assert.equal(await p.locator('#sarni20Tiles button.is-current').count(),1);
  await p.keyboard.press('/');
  assert.equal(await p.locator('#sarni10ModuleSearch').evaluate(e=>document.activeElement===e),true);
 });
});

test('Mobile and reduced-motion layout avoids workspace-wide horizontal overflow',async()=>{
 await withPage(workspaceFixture(),workspace,{viewport:{width:375,height:812},reducedMotion:'reduce'},async p=>{
  const cols=await p.locator('#sarni20Tiles').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);
  assert.equal(cols,3,'375px has a three-column navigation layout');
  const width=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(width.scroll<=width.viewport+1,'Page fits mobile viewport');
 });
});

function adminFixture(){
 return '<main><section id="adminSettingsSection"><div>'+
 '<button type="button" data-section="users" onclick="document.body.dataset.usersOpened=\'yes\'">Open Users</button></div>'+
 '<article id="adminSecurityPanel"><select id="securityIdleTimeout"><option value="30">30 mins</option></select></article>'+
 '<article id="sarniBackupPanel"><button type="button" id="sarniAdminBackupNow">Back up SarNi now</button></article>'+
 '</section><section id="usersSection"></section></main>';
}
test('Admin Centre opens only existing controls and adds no new permission switches',async()=>{
 await withPage(adminFixture(),{scripts:['sarni10-admin-centre.js']},{},async p=>{
  await p.evaluate(()=>document.body.classList.add('sarni-is-admin'));
  assert.equal(await p.locator('#sarni10AdminCentre .sarni10-admin-card').count(),6);
  assert.equal(await p.locator('#sarni10AdminCentre button').count(),3);
  await p.getByRole('button',{name:'Open session policy'}).click();
  assert.equal(await p.locator('#securityIdleTimeout').evaluate(e=>document.activeElement===e),true);
  await p.locator('#sarni10AdminCentre').getByRole('button',{name:'Open users'}).click();
  assert.equal(await p.evaluate(()=>document.body.dataset.usersOpened),'yes');
  assert.equal(await p.getByText('Backend integration required').count(),3);
 });
});

test('Admin overview shortcuts refuse navigation when administrator session is absent',async()=>{
 await withPage(adminFixture(),{scripts:['sarni10-admin-centre.js']},{},async p=>{
  await p.locator('#sarni10AdminCentre').getByRole('button',{name:'Open users'}).click();
  assert.equal(await p.evaluate(()=>document.body.dataset.usersOpened||''),'');
  assert.match(await p.locator('.sarni10-admin-feedback').textContent(),/authorized administrator session/);
 });
});

test('Quick Entry sync guidance is read-only and does not send a retry',async()=>{
 const q='<main><nav id="tabs"><button data-mode="diary" type="button">Diary</button></nav>'+
 '<form id="entry"><div id="fields"><textarea maxlength="600" aria-label="Notes"></textarea></div></form>'+
 '<label>Find <input id="recentSearch"></label><span id="recentSearchInfo"></span>'+
 '<section id="qeGlobalSyncPanel"><strong>Sync Status</strong></section></main>';
 await withPage(q,{styles:['q/sarni9-batch10.css'],scripts:['q/sarni9-batch10.js']},{},async p=>{
  assert.equal(await p.locator('#qe10SyncLegend').count(),1);
  await p.locator('#qe10SyncLegend summary').click();
  assert.match(await p.locator('#qe10SyncLegend').textContent(),/Pending/);
  assert.match(await p.locator('#qe10SyncLegend').textContent(),/does not resend entries/);
  assert.equal(await p.locator('#qeSearchClear').count(),1);
 });
});


test('Focus view reduces mobile clutter but preserves search and reversibility',async()=>{
 const html='<main id="mainDashboard"><section id="sarni10Workspace">'+
 '<div class="sarni10-search-row"><input id="sarni10ModuleSearch" aria-label="Find modules"></div>'+
 '<small id="sarni10ModuleCount">Seven modules</small>'+
 '<div id="sarni10ModuleResults">All module shortcuts</div>'+
 '<div class="sarni10-collections"><div id="sarni10Favorites">Favorites</div><div id="sarni10Recent">Recent</div></div>'+
 '</section></main>';
 await withPage(html,{
  styles:['sarni-focus-view.css'],
  scripts:['sarni-focus-view.js']
 },{viewport:{width:375,height:812}},async p=>{
  assert.equal(await p.locator('#sarni10Workspace').evaluate(e=>e.classList.contains('sarni-focus-view')),true);
  assert.equal(await p.locator('#sarni10Favorites').isVisible(),false);
  assert.equal(await p.locator('#sarni10ModuleResults').isVisible(),false);
  await p.getByRole('textbox',{name:'Find modules'}).fill('Diary');
  assert.equal(await p.locator('#sarni10ModuleResults').isVisible(),true);
  await p.getByRole('button',{name:/Show favorites and all module shortcuts/}).click();
  assert.equal(await p.locator('#sarni10Favorites').isVisible(),true);
  assert.equal(await p.locator('#sarni10ModuleResults').isVisible(),true);
 });
});

test('Desktop Focus view starts expanded and can collapse without changing input',async()=>{
 const html='<section id="sarni10Workspace"><div class="sarni10-search-row">'+
 '<input id="sarni10ModuleSearch"></div><div id="sarni10ModuleResults">Items</div>'+
 '<div class="sarni10-collections"><div id="sarni10Favorites">Favorites</div></div></section>';
 await withPage(html,{styles:['sarni-focus-view.css'],scripts:['sarni-focus-view.js']},
 {viewport:{width:1280,height:800}},async p=>{
  assert.equal(await p.locator('#sarni10Favorites').isVisible(),true);
  await p.locator('#sarni10ModuleSearch').fill('Books');
  await p.getByRole('button',{name:/Hide extra navigation/}).click();
  assert.equal(await p.locator('#sarni10Favorites').isVisible(),false);
  assert.equal(await p.locator('#sarni10ModuleResults').isVisible(),true);
  assert.equal(await p.locator('#sarni10ModuleSearch').inputValue(),'Books');
 });
});


test('Non-blocking cross-dashboard tab refresh preserves typed entry',async()=>{
 const q=readFileSync(resolve(root,'q/index.html'),'utf8');
 const start=q.indexOf('function qeRenderTabsOnly(types){');
 const end=q.indexOf('function render(){',start);
 assert.ok(start>=0&&end>start,'Tab-only helper should be present in Quick Entry');
 const helper=q.slice(start,end);
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.setContent(doc('<nav id="tabs"></nav><form id="entry"><textarea id="noteText" aria-label="Sample note"></textarea></form>'));
  await page.addScriptTag({content:
   "const $=id=>document.getElementById(id);let mode='expense';"+
   "const safe=s=>String(s);const qePremiumIcons={expense:'',office:'',investment:''};"+
   helper+
   "const initial=[['expense','Expense',true]];qeRenderTabsOnly(initial);"
  });
  assert.equal(await page.locator('#tabs button').count(),1);
  await page.locator('#noteText').fill('Unsaved synthetic entry should survive.');
  await page.evaluate(()=>{
   qeRenderTabsOnly([['expense','Expense',true],['office','Office Diary',true],['investment','Investment',true]]);
  });
  assert.equal(await page.locator('#tabs button').count(),3);
  assert.equal(await page.locator('#noteText').inputValue(),'Unsaved synthetic entry should survive.');
  assert.equal(await page.locator('#tabs [aria-pressed="true"]').count(),1);
  assert.equal(await page.locator('#tabs [data-mode="office"]').count(),1);
  assert.deepEqual(errors,[]);
 }finally{await page.close();}
});
