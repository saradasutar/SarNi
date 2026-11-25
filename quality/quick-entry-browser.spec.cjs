// Browser regression for SarNi Quick Entry. Uses mocked backend responses only.
// No secret token, real Apps Script endpoint, or real save operations.
const { test, expect } = require('@playwright/test');

const modes = ['expense','diary','stock','office','investment','family'];
const scenarios = [
 { name:'desktop', width:1440, height:900 },
 { name:'mobile', width:390, height:844 },
 { name:'small-mobile', width:320, height:700 }
];

for (const viewport of scenarios) {
 test.describe(viewport.name, () => {
  test.use({ viewport: { width:viewport.width, height:viewport.height }, serviceWorkers:'block' });
  test('six tabs, form layout and safe navigation', async ({ page }) => {
   const errors=[];
   const attemptedWrites=[];
   const blockedRequests=[];
   page.on('pageerror',error => errors.push(error.message));
   // Fail closed for every unmocked network destination. Install this first:
   // later, more specific mock routes take precedence in Playwright.
   await page.route('**/*',route=>{
    const request=route.request();
    const url=new URL(request.url());
    if(url.origin!=='http://127.0.0.1:8765'||request.method()!=='GET'){
     // External fonts/assets may be referenced; blocking GET is expected.
     // Only an unmocked mutating request is an isolation failure.
     if(request.method()!=='GET')blockedRequests.push({origin:url.origin,method:request.method()});
     return route.abort();
    }
    return route.continue();
   });
   await page.route('**/config.js', route => route.fulfill({
    status:200, contentType:'application/javascript',
    body:"window.PORTFOLIO_CONFIG={API_URL:'https://script.google.com/macros/s/TEST_ONLY/exec'};"
   }));
   await page.route('https://script.google.com/**', async route => {
    if (route.request().method() !== 'POST') return route.abort();
    const body = new URLSearchParams(route.request().postData() || '');
    const request = JSON.parse(body.get('payload') || '{}');
    const responses = {
     qeInfo: { quickAccess:{allowExpense:true,allowDiary:true,allowStock:true,allowRecent:true},categories:[{name:'Food',subcategories:['Groceries']}],expenseGroups:[] },
     hubGuestInfo: {allowOffice:true,allowInvestment:true},
     qpinInfo: {config:{enabled:false}},
     familyExpenseInfo: {categories:[{name:'Food',subcategories:['Groceries']}]},
     qeRecent: {entries:[],hasMore:false},
     qpinRecent: {entries:[],hasMore:false},
     sipPlanGuestList: {plans:[]}
    };
    // Combined startup is read-only and retains the same mocked access/PIN policy.
    responses.qeBootstrap={version:1,main:{ok:true,...responses.qeInfo},hub:{ok:true,...responses.hubGuestInfo},pin:{ok:true,...responses.qpinInfo}};
    // Fail closed: unknown actions must never be silently treated as successful.
    const isRead=Object.prototype.hasOwnProperty.call(responses,request.action);
    if(!isRead) attemptedWrites.push(request.action||'(missing action)');
    const response=isRead?{ok:true,...responses[request.action]}:{ok:false,message:'Unmocked or write action blocked by browser regression fixture'};
    // Simulate the deployed Apps Script iframe message protocol.
    const markup='<html><body><script>parent.postMessage('+JSON.stringify({
     __myfinanceDirectResult:true,requestId:request.requestId,payload:response
    })+',"*")</script></body></html>';
    await route.fulfill({status:200,contentType:'text/html',body:markup});
   });

   await page.addInitScript(()=>{
 localStorage.setItem('portfolio_username','quick-entry-regression');
 localStorage.setItem('myfinance_last_good_dashboard_v1_quick-entry-regression',JSON.stringify({
  savedAt:Date.now(),
  data:{
   holdings:[
    {type:'STOCK',assetName:'Reliance Industries',code:'RELIANCE'},
    {type:'STOCK',assetName:'State Bank of India',code:'SBIN'},
    {type:'STOCK',assetName:'Example Alpha Ltd',code:'DUP'},
    {type:'STOCK',assetName:'Example Beta Ltd',code:'DUP'}
   ],
   watchlist:[{type:'ETF',assetName:'Nippon India ETF Nifty 50 BeES',code:'NIFTYBEES'}]
  }
 }));
});
await page.goto('http://127.0.0.1:8765/q/?k=TEST_FIXTURE_ONLY',{waitUntil:'domcontentloaded'});
   await expect(page.locator('#tabs button[data-mode]')).toHaveCount(6,{timeout:15000});
   const amountControlMetrics={};
   for (const mode of modes) {
    await page.locator('#tabs button[data-mode="'+mode+'"]').click();
    await expect(page.locator('#tabs button[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('#tabs button[data-mode="'+mode+'"]')).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('main')).toHaveAttribute('data-entry-mode',mode);
    await expect(page.locator('#entry')).toBeVisible();
   if(mode==='family'){
    await expect(page.locator('#familyAmount')).toHaveAttribute('placeholder','0');
    await expect(page.locator('#familyAmount')).toHaveAttribute('step','.01');
    await expect(page.locator('#familyAmount')).toHaveAttribute('inputmode','decimal');
    amountControlMetrics.family=await page.locator('#familyAmount').evaluate(input=>{
     const box=input.closest('.amountbox'),currency=box.querySelector('span'),r=box.getBoundingClientRect();
     return {boxHeight:r.height,inputHeight:input.getBoundingClientRect().height,inputFont:getComputedStyle(input).fontSize,inputWeight:getComputedStyle(input).fontWeight,currencyFont:getComputedStyle(currency).fontSize};
    });
   }
   if(mode==='expense'){
    await expect(page.locator('#qeAmount')).toHaveAttribute('placeholder','0');
    await expect(page.locator('#qeAmount')).toHaveAttribute('step','.01');
    amountControlMetrics.expense=await page.locator('#qeAmount').evaluate(input=>{
     const box=input.closest('.amountbox'),currency=box.querySelector('span'),r=box.getBoundingClientRect();
     return {boxHeight:r.height,inputHeight:input.getBoundingClientRect().height,inputFont:getComputedStyle(input).fontSize,inputWeight:getComputedStyle(input).fontWeight,currencyFont:getComputedStyle(currency).fontSize};
    });
   }
    await expect(page.locator('#fields')).not.toBeEmpty();
    const layout=await page.evaluate(() => ({
     viewport:document.documentElement.clientWidth,
     scroll:document.documentElement.scrollWidth,
     tabs:getComputedStyle(document.getElementById('tabs')).gridTemplateColumns.split(' ').length,
     visible:Array.from(document.querySelectorAll('#tabs button[data-mode]')).filter(x=>x.getBoundingClientRect().width>0).length
    }));
    expect(layout.scroll).toBeLessThanOrEqual(layout.viewport+2);
    expect(layout.visible).toBe(6);
    expect(layout.tabs).toBe(3);
    if (mode==='family') {
     await expect(page.locator('#fields .family-paired-row')).toHaveCount(3);
     const cols=await page.locator('#fields .family-paired-row').first().evaluate(x=>getComputedStyle(x).gridTemplateColumns.split(' ').length);
     expect(cols).toBe(2);
    }
    if (['diary','office','stock'].includes(mode)){
     await expect(page.locator('#qeMarkCompleted')).toHaveCount(1);
     await expect(page.locator('#qeCompletionRemark')).toHaveCount(1);
    }
   }
   for(const field of ['boxHeight','inputHeight','inputFont','inputWeight','currencyFont']){
    expect(amountControlMetrics.expense[field]).toBe(amountControlMetrics.family[field]);
   }
   // Investment math: two positive values calculate only the missing third.
    await page.locator('#tabs button[data-mode="investment"]').click();
    const invAmount=page.locator('#fields input[name="amount"]');
    const invUnits=page.locator('#fields input[name="units"]');
    const invPrice=page.locator('#fields input[name="price"]');
    const invName=page.locator('#fields input[name="title"]');
    const invCode=page.locator('#fields input[name="code"]');
    const invType=page.locator('#fields select[name="assetType"]');
    await invType.selectOption('STOCK');
    await invAmount.fill('300');
    await invUnits.fill('12');
    await expect(invPrice).toHaveValue('25');
    await invUnits.fill('15');
    await expect(invPrice).toHaveValue('20');
    await invPrice.fill('');
    await expect(invPrice).toHaveValue('20');
    await invAmount.fill('');
    await invPrice.fill('30');
    await expect(invAmount).toHaveValue('450');
    await invUnits.fill('');
    await invAmount.fill('900');
    await expect(invUnits).toHaveValue('30');

    // Instrument autofill uses only exact matches from the current Analysis cache.
    await invAmount.fill('');await invUnits.fill('');await invPrice.fill('');
    await invCode.fill('RELIANCE');
    await expect(invName).toHaveValue('Reliance Industries');
    await invName.fill('State Bank of India');
    await expect(invCode).toHaveValue('SBIN');
    await invName.fill('');
    await invCode.fill('DUP');
    await expect(invName).toHaveValue('');
    await expect(page.locator('#qeInvestmentLookupHint')).toContainText('More than one saved instrument');
    await invCode.fill('UNKNOWN');
    await expect(invName).toHaveValue('');
    await expect(page.locator('#qeInvestmentLookupHint')).toContainText('No exact match');

    // SarNi 9 batch: verify progressive enhancements without submitting records.
   await expect(page.locator('#qeSearchClear')).toHaveCount(1);
   await expect(page.locator('#qeActiveFieldCount')).toHaveCount(1);
   await expect(page.locator('#qeBackToTop')).toHaveCount(1);
   await page.locator('#familyReason').fill('Sample unsaved description');
   await expect(page.locator('#qeActiveFieldCount')).toContainText('characters');
   await page.locator('#tabs button[data-mode="family"]').focus();
   await page.keyboard.press('ArrowLeft');
   await expect(page.locator('#tabs button[data-mode="investment"]')).toBeFocused();
   await expect(page.locator('#tabs button[data-mode="family"]')).toHaveAttribute('aria-pressed','true');
   await page.locator('#toggleRecent').click();
   await page.locator('#recentSearch').fill('sample');
   await expect(page.locator('#qeSearchClear')).toBeVisible();
   await page.locator('#qeSearchClear').click();
   await expect(page.locator('#recentSearch')).toHaveValue('');
   if (viewport.name==='desktop') {
    const tableLayout=await page.evaluate(()=>{
     const host=document.getElementById('recentList');
     const wrap=document.createElement('div');wrap.className='recent-table-scroll';wrap.tabIndex=0;
     wrap.setAttribute('role','region');wrap.style.marginTop='12px';
     const table=document.createElement('table');table.className='recent-table';table.dataset.kind='family';
     const head=document.createElement('thead'),hr=document.createElement('tr');
     const fields=['date','category','subject','amount','party','sync','photos','actions'];
     const labels=['Date','Category','Reason','Amount','Paid by','Sync','Photos','Actions'];
     fields.forEach((field,i)=>{const th=document.createElement('th');th.dataset.field=field;th.textContent=labels[i];hr.append(th);});
     head.append(hr);
     const body=document.createElement('tbody'),row=document.createElement('tr');
     fields.forEach(field=>{
      const td=document.createElement('td');td.dataset.field=field;td.textContent=field;
      if(field==='sync'){const badge=document.createElement('span');badge.className='recent-sync-badge is-linked';badge.textContent='MyFamily matched';td.replaceChildren(badge);}
      if(field==='actions'){const bar=document.createElement('div');bar.className='qe-recent-action-bar';['View','Edit','Trash'].forEach(label=>{const b=document.createElement('button');b.textContent=label;bar.append(b);});td.replaceChildren(bar);}
      row.append(td);
     });
     body.append(row);table.append(head,body);wrap.append(table);host.append(wrap);
     const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width};};
     const fieldsMap=Object.fromEntries(fields.map(field=>[field,rect(row.querySelector('[data-field="'+field+'"]'))]));
     return {viewport:document.documentElement.clientWidth,documentWidth:document.documentElement.scrollWidth,wrapper:rect(wrap),table:rect(table),scrollWidth:wrap.scrollWidth,clientWidth:wrap.clientWidth,fields:fieldsMap,actionsPosition:getComputedStyle(row.querySelector('[data-field="actions"]')).position,syncWhiteSpace:getComputedStyle(row.querySelector('[data-field="sync"]')).whiteSpace};
    });
    expect(tableLayout.documentWidth).toBeLessThanOrEqual(tableLayout.viewport+2);
    expect(tableLayout.table.width).toBeGreaterThanOrEqual(1075);
    expect(tableLayout.scrollWidth).toBeGreaterThan(tableLayout.clientWidth);
    expect(tableLayout.fields.sync.width).toBeGreaterThanOrEqual(160);
    expect(tableLayout.fields.actions.width).toBeGreaterThanOrEqual(145);
    expect(tableLayout.actionsPosition).toBe('sticky');
    expect(tableLayout.syncWhiteSpace).toBe('nowrap');
   }
   if(viewport.name!=='desktop'){
    const cards=await page.evaluate(()=>{
     const host=document.getElementById('recentList'),wrap=document.createElement('div');wrap.className='recent-table-scroll';
     const table=document.createElement('table');table.className='recent-table';table.dataset.kind='family';
     const body=document.createElement('tbody');
     for(let n=0;n<2;n++){
      const row=document.createElement('tr');row.dataset.qeRecordRow='1';row.dataset.qeExpanded='false';
      const fields=[['date','Date','15 Nov 2026'],['party','Paid by','SS'],['amount','Amount','₹1,401'],['subject','Reason','SARNI-MYFAMILY long medicine grocery transportation expense reason that must wrap across lines'],['category','Category','Home'],['sync','Sync','MyFamily matched']];
      for(const [field,label,value] of fields){const td=document.createElement('td');td.dataset.field=field;td.dataset.label=label;if(field==='subject'){const strong=document.createElement('strong');strong.textContent=value;td.append(strong);}else if(field==='sync'){const badge=document.createElement('span');badge.className='recent-sync-badge is-linked';badge.textContent=value;td.append(badge);}else td.textContent=value;row.append(td);}
      const photoCell=document.createElement('td');photoCell.dataset.field='photos';photoCell.className='qe-recent-photo-cell';row.append(photoCell);
      const actionCell=document.createElement('td');actionCell.dataset.field='actions';actionCell.className='qe-recent-action-cell';
      const bar=document.createElement('div');bar.className='qe-recent-action-bar';
      for(const [label,cls] of [['Open','qe-action-view'],['Edit','qe-action-edit'],['Trash','qe-action-trash']]){const button=document.createElement('button');button.type='button';button.className=cls;button.textContent=label;bar.append(button);}
      const camera=document.createElement('div');camera.className='qe-mobile-photo';const cameraButton=document.createElement('summary');cameraButton.textContent='📷';camera.append(cameraButton);bar.append(camera);actionCell.append(bar);row.append(actionCell);
      const details=document.createElement('tr');details.className='qe-recent-detail-row';details.hidden=true;const detailCell=document.createElement('td');detailCell.colSpan=8;detailCell.textContent='Full record details';details.append(detailCell);
      const open=bar.querySelector('.qe-action-view');open.addEventListener('click',()=>{const expanded=details.hidden;details.hidden=!expanded;row.dataset.qeExpanded=String(expanded);open.textContent=expanded?'Close':'Open';open.setAttribute('aria-expanded',String(expanded));});
      body.append(row,details);
     }
     table.append(body);wrap.append(table);host.append(wrap);
     const rows=[...table.querySelectorAll('tr[data-qe-record-row]')],rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
     const rowState=row=>({rowWidth:rect(row).width,display:getComputedStyle(row).display,subjectWhiteSpace:getComputedStyle(row.querySelector('[data-field="subject"] strong')).whiteSpace,category:getComputedStyle(row.querySelector('[data-field="category"]')).display,sync:getComputedStyle(row.querySelector('[data-field="sync"]')).display,edit:getComputedStyle(row.querySelector('.qe-action-edit')).display,trash:getComputedStyle(row.querySelector('.qe-action-trash')).display,open:getComputedStyle(row.querySelector('.qe-action-view')).display});
     const initial=rows.map(rowState);const opens=rows.map(row=>row.querySelector('.qe-action-view'));opens.forEach(button=>button.click());
     const expanded=rows.map(rowState),reason=rows[0].querySelector('[data-field="subject"] strong');
     const actionXs=row=>['qe-action-view','qe-action-edit','qe-action-trash'].map(cls=>rect(row.querySelector('.'+cls)).x);
     return {viewport:document.documentElement.clientWidth,documentWidth:document.documentElement.scrollWidth,wrapperWidth:wrap.clientWidth,scrollWidth:wrap.scrollWidth,initial,expanded,reasonWhiteSpace:getComputedStyle(reason).whiteSpace,reasonHeight:rect(reason).height,actionXs:[actionXs(rows[0]),actionXs(rows[1])],labels:opens.map(b=>b.textContent),detailsVisible:[...table.querySelectorAll('.qe-recent-detail-row')].every(x=>!x.hidden)};
    });
    expect(cards.initial[0].display).toBe('grid');
    expect(cards.initial[0].rowWidth).toBeLessThanOrEqual(cards.viewport+2);
    expect(cards.initial[0].subjectWhiteSpace).toBe('nowrap');
    expect(cards.initial[0].category).toBe('none');
    expect(cards.initial[0].sync).toBe('none');
    expect(cards.initial[0].edit).toBe('none');
    expect(cards.initial[0].trash).toBe('none');
    expect(cards.initial[0].open).not.toBe('none');
    expect(cards.expanded[0].category).not.toBe('none');
    expect(cards.expanded[0].sync).not.toBe('none');
    expect(cards.expanded[0].edit).not.toBe('none');
    expect(cards.expanded[0].trash).not.toBe('none');
    expect(cards.reasonWhiteSpace).toBe('normal');
    expect(cards.reasonHeight).toBeGreaterThan(28);
    expect(cards.labels).toEqual(['Close','Close']);
    expect(cards.detailsVisible).toBe(true);
    expect(cards.scrollWidth).toBeLessThanOrEqual(cards.wrapperWidth+2);
    expect(cards.documentWidth).toBeLessThanOrEqual(cards.viewport+2);
    for(let c=0;c<3;c++)expect(Math.abs(cards.actionXs[0][c]-cards.actionXs[1][c])).toBeLessThanOrEqual(2);
   }

   // Health UI must remain read-only, collapsible and show only status categories.
   await page.locator('#qeDashboardHealth > summary').click();
   await expect(page.locator('#qeDashboardHealth')).toHaveAttribute('open','');
   const historySection=page.locator('.qe-health-history-section').filter({hasText:'Recent health history'});
   await expect(historySection.locator('summary')).toBeVisible();
   await expect(historySection).not.toHaveAttribute('open','');
   await expect(page.locator('.qe-health-history-section').filter({hasText:'Troubleshooting guide'})).toHaveCount(1);
   await page.locator('#qeHealthCheck').click();
   await expect(page.locator('#qeHealthMetrics')).toContainText('SarNi backend',{timeout:15000});
   await historySection.locator('summary').click();
   await expect(page.locator('#qeHealthHistory')).toBeVisible();
   await expect(page.locator('#qeHealthHistory')).toContainText('Frontend');
   await page.locator('#qeHealthHistoryClear').click();
   await expect(page.locator('#qeHealthHistory')).toContainText('No status history');
   expect(attemptedWrites).toEqual([]);
   expect(blockedRequests).toEqual([]);
   expect(errors).toEqual([]);
  });
 });
}
