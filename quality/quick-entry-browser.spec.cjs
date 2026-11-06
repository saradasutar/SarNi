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
  test.use({ viewport: { width:viewport.width, height:viewport.height }, serviceWorkers:'block', screenshot:'only-on-failure', trace:'retain-on-failure' });
  test('six tabs, form layout and safe navigation', async ({ page }) => {
   const errors=[];
   page.on('pageerror',error => errors.push(error.message));
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
    const response={ok:true,...(responses[request.action]||{})};
    // Simulate the deployed Apps Script iframe message protocol.
    const markup='<html><body><script>parent.postMessage('+JSON.stringify({
     __myfinanceDirectResult:true,requestId:request.requestId,payload:response
    })+',"*")</script></body></html>';
    await route.fulfill({status:200,contentType:'text/html',body:markup});
   });

   await page.goto('http://127.0.0.1:8765/q/?k=TEST_FIXTURE_ONLY',{waitUntil:'domcontentloaded'});
   await expect(page.locator('#tabs button[data-mode]')).toHaveCount(6,{timeout:15000});
   for (const mode of modes) {
    await page.locator('#tabs button[data-mode="'+mode+'"]').click();
    await expect(page.locator('#tabs button[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('#tabs button[data-mode="'+mode+'"]')).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('main')).toHaveAttribute('data-entry-mode',mode);
    await expect(page.locator('#entry')).toBeVisible();
    await expect(page.locator('#fields')).not.toBeEmpty();
    const layout=await page.evaluate(() => ({
     viewport:document.documentElement.clientWidth,
     scroll:document.documentElement.scrollWidth,
     tabs:getComputedStyle(document.getElementById('tabs')).gridTemplateColumns.split(' ').length,
     visible:Array.from(document.querySelectorAll('#tabs button[data-mode]')).filter(x=>x.getBoundingClientRect().width>0).length
    }));
    expect(layout.scroll).toBeLessThanOrEqual(layout.viewport+2);
    expect(layout.visible).toBe(6);
    if (viewport.width>=340) expect(layout.tabs).toBe(3);
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
   expect(errors).toEqual([]);
  });
 });
}
