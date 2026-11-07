#!/usr/bin/env node
/**
 * SarNi Batch 10 read-only release gate.
 * Run: node quality/batch10-audit.mjs
 * Inspects only local frontend files, does not contact Apps Script,
 * create data, modify configuration or read private records.
 */
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const checks=[];
function check(name,condition,detail){checks.push({name,pass:Boolean(condition),detail});}
for(const path of ['index.html','q/index.html','config.js','health.html','README.md']){
 check('Required file: '+path,existsSync(resolve(root,path)),'File must exist before publishing');
}
if(checks.some(x=>!x.pass)){report();process.exit(1);}
const html=read('index.html'),quick=read('q/index.html'),cfg=read('config.js'),health=read('health.html');
check('Backend is separate from public frontend',/script\.google\.com\/macros\/s\//.test(cfg),'Configured Apps Script route; this does NOT prove it is safe');
check('Quick entry has backend-action handlers',/qeSubmit|hubGuestSave/.test(quick),'Inspect each action on backend before release');
check('Six quick entry modes referenced', ['expense','diary','office','stock','investment','family'].every(x=>new RegExp('(?:data-mode|kind|mode)[^\\n]{0,100}'+x,'i').test(quick)),'Regression-test each tab manually');
check('Quick link has a read-only sync display',/recent-sync-badge/.test(quick),'Frontend display only; backend evidence required');
check('Quick link has authorized sync retry route',/qpinSyncRetry/.test(quick)&&/pinGrant/.test(quick),'Backend MUST verify grant, scope and idempotency');
check('Quick entry has connection feedback',/qeConnectivity|qeDashboardHealth/.test(quick),'Failure must not masquerade as successful save');
check('Quick entry has uncertainty handling',/qePendingUncertain/.test(quick),'Do not automatically re-submit ambiguous saves');
check('Root has configured asset health feedback',/sarniAssetFailed/.test(html),'Asset errors visible to user');
check('Site health distinguishes frontend from backend',/does not access personal data|does not prove login/i.test(health),'A HEAD success does not prove saving');
check('GitHub does not contain raw Apps Script backend',!existsSync(resolve(root,'Code.gs')),'Do not publicly publish Code.gs or keys');
const warnings=[];
if(/innerHTML\s*=/.test(quick))warnings.push('Quick entry uses innerHTML: manually inspect EVERY assignment for untrusted data or replace with textContent/DOM nodes');
if(/localStorage/.test(quick))warnings.push('Quick entry uses localStorage: audit stored values and forbid passwords, PIN grants, bearer tokens and private records');
if(/api\('qpinSyncRetry'/.test(quick))warnings.push('Retry route is wired in FE; backend authorization and idempotency cannot be verified by this audit');
function report(){
 for(const x of checks)console.log((x.pass?'PASS':'FAIL')+' '+x.name+' — '+x.detail);
 for(const w of warnings)console.warn('REVIEW '+w);
 console.log('\n'+checks.filter(x=>x.pass).length+'/'+checks.length+' static checks passed.');
 console.log('STATIC ONLY: never treat this as backend security, sync delivery, backup or login verification.');
}
report();
if(checks.some(x=>!x.pass))process.exitCode=1;
