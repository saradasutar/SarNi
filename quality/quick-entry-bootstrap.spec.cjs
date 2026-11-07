// Quick Entry optional combined-bootstrap regression. No live backend or private token.
const {test,expect}=require('@playwright/test');

for(const scenario of ['combined','unsupported','incomplete','disabled']){
 test('startup '+scenario+' preserves all six modes and authorization',async({page})=>{
  const requests=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  if(scenario==='disabled')await page.addInitScript(()=>{window.SARNI_QE_BOOTSTRAP_ENABLED=false;});
  await page.route('**/*',route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin!=='http://127.0.0.1:8765'||req.method()!=='GET')return route.abort();
   return route.continue();
  });
  await page.route('**/config.js',route=>route.fulfill({
   status:200,contentType:'application/javascript',
   body:"window.PORTFOLIO_CONFIG={API_URL:'https://script.google.com/macros/s/TEST_ONLY/exec'};"
  }));
  await page.route('https://script.google.com/**',async route=>{
   const body=new URLSearchParams(route.request().postData()||'');
   const req=JSON.parse(body.get('payload')||'{}');
   requests.push(req.action);
   const main={ok:true,quickAccess:{allowExpense:true,allowDiary:true,allowStock:true,allowRecent:true},categories:[{name:'Food',subcategories:['Groceries']}],expenseGroups:[]};
   const hub={ok:true,allowOffice:true,allowInvestment:true};
   const pin={ok:true,config:{enabled:false}};
   const responses={
    qeBootstrap:scenario==='combined'?{ok:true,version:1,main,hub,pin}:scenario==='incomplete'?{ok:true,version:1,main,hub}:{ok:false,message:'Not installed'},
    qeInfo:main,hubGuestInfo:hub,qpinInfo:pin,
    familyExpenseInfo:{ok:true,categories:[]},qeRecent:{ok:true,entries:[],hasMore:false},
    qpinRecent:{ok:true,entries:[],hasMore:false},sipPlanGuestList:{ok:true,plans:[]}
   };
   const response=responses[req.action]||{ok:false,message:'Unmocked action'};
   const markup='<html><body><script>parent.postMessage('+JSON.stringify({
    __myfinanceDirectResult:true,requestId:req.requestId,payload:response
   })+',"*")</script></body></html>';
   await route.fulfill({status:200,contentType:'text/html',body:markup});
  });
  await page.goto('http://127.0.0.1:8765/q/?k=TEST_FIXTURE_ONLY',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#tabs button[data-mode]')).toHaveCount(6,{timeout:12000});
  await expect(page.locator('#save')).toBeEnabled({timeout:12000});
  await page.locator('#tabs button[data-mode="expense"]').click();
  await expect(page.locator('#tabs button[data-mode="expense"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('#tabs button[data-mode="family"]').click();
  await expect(page.locator('#tabs button[data-mode="family"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#fields')).not.toBeEmpty();
  if(scenario==='combined'){
   expect(requests.filter(a=>a==='qeBootstrap')).toHaveLength(1);
   expect(requests).not.toContain('qeInfo');
   expect(requests).not.toContain('hubGuestInfo');
   expect(requests).not.toContain('qpinInfo');
  }else{
   if(scenario==='disabled')expect(requests).not.toContain('qeBootstrap');
   else expect(requests).toContain('qeBootstrap');
   expect(requests).toContain('qeInfo');
   expect(requests).toContain('hubGuestInfo');
   expect(requests).toContain('qpinInfo');
  }
  expect(errors).toEqual([]);
 });
}
