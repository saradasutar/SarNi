#!/usr/bin/env node
/* SarNi static regression guard. Node >=20; zero npm dependencies; never reads private data. */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const errors=[],warnings=[];
const check=(condition,description)=>{if(!condition)errors.push(description)};
const warn=(condition,description)=>{if(!condition)warnings.push(description)};
const html=read('index.html'),main=read('app-v20-8-19.js');
const css=read('styles.css');
const bodyRefs=[...html.matchAll(/\b(?:src|href)="(\.\/[^"]+)"/gi)].map(m=>m[1].replace(/^\.\//,'').split('?')[0]);
for(const f of new Set(bodyRefs)){
 if(!f)continue;
 check(fs.existsSync(path.join(root,f)),'Missing referenced asset: '+f);
}
const ids=[...html.matchAll(/\bid="([^"]+)"/gi)].map(m=>m[1]);
const counts=new Map();for(const id of ids)counts.set(id,(counts.get(id)||0)+1);
for(const [id,count] of counts)check(count===1,'Duplicate HTML ID: '+id);
check(html.includes('id="loginForm"'),'Main login form missing');
check(html.includes('autocomplete="current-password"'),'Password manager autocomplete missing');
check(html.includes('id="mainDashboard"'),'Main dashboard landmark missing');
check(html.includes('id="lifeExpenseStudio"'),'Expense register missing');
check(html.includes('id="bookChaptersList"'),'Book writing chapters view missing');
check(html.includes('id="standaloneCalendarGrid"'),'Odia calendar missing');
check(html.includes('id="odiaYearbookPrint"'),'Yearly festival print missing');
check(html.includes('sarni-quality.js'),'On-device quality diagnostics missing');
check(html.includes('sarni-quality.css'),'Accessibility styles missing');
check(html.includes('quick-expense-admin.js'),'Quick Expense admin control missing');
check(read('quick-expense.html').includes('noindex,nofollow'),'Quick Expense must stay out of search indexing');
check(read('quick-expense.html').includes('type="number"')&&read('quick-expense.html').includes('id="paidBy"'),'Quick Expense amount/payer missing');
check(read('quick-expense.js').includes('crypto.getRandomValues'),'Quick Expense request IDs must use secure randomness');
warn(!/mobile\s+otp\s+verification/i.test(html),'Unexpected mobile OTP verification copy detected');
let total=0;
for(const asset of ['index.html','styles.css','app-v20-8-19.js']){
 const bytes=Buffer.byteLength(read(asset));total+=bytes;
 warn(bytes<1024*1024,asset+' exceeded 1 MiB source budget');
}
warn(total<=1536*1024,'Core HTML + CSS + JS exceeds 1.5 MiB source budget');
const files=fs.readdirSync(root).filter(x=>x.endsWith('.js'));
for(const file of files){
 const result=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8',timeout:15000});
 check(result.status===0,'JavaScript syntax error in '+file+': '+(result.stderr||'').slice(0,200));
}
console.log('SarNi static review: '+ids.length+' HTML IDs, '+bodyRefs.length+' local references, '+files.length+' JS files, '+(total/1024).toFixed(0)+' KiB main source.');
for(const w of warnings)console.log('WARNING: '+w);
for(const e of errors)console.error('FAIL: '+e);
console.log(errors.length?'Quality gate failed.':'Quality gate passed. Live performance/security/e2e tests still required.');
process.exitCode=errors.length?1:0;
