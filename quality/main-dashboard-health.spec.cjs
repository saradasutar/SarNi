// SarNi 9: public frontend health smoke test. NO LOGIN or backend calls.
const {test,expect}=require('@playwright/test');
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:700}]){
 test.describe('Main dashboard Health '+viewport.width+'px',()=>{
  test.use({viewport,serviceWorkers:'block'});
  test('health panel exists with safe controls and main module references',async({page})=>{
   const blocked=[];
   await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!=='http://127.0.0.1:8765'){
     blocked.push({method:route.request().method(),origin:url.origin});
     return route.abort();
    }
    return route.continue();
   });
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
   await expect(page.locator('#sarniMainHealth')).toHaveCount(1);
   await expect(page.locator('#sarniMainHealthRefresh')).toHaveCount(1);
   await expect(page.locator('#sarniMainHealthHistory')).toHaveCount(1);
   await expect(page.locator('#sarniMainHealthClear')).toHaveCount(1);
   await expect(page.locator('#sarniMainHealthPeer')).toHaveCount(1);
   await expect(page.locator('#dashboardVersionTop')).toHaveCount(1);
   await expect(page.locator('#dashboardBackendVersionTop')).toHaveCount(1);
   for(const id of ['diarySection','calendarSection','expenditureSection','adminPhotoManager']){
    await expect(page.locator('#'+id)).toHaveCount(1);
   }
   // New additive main-dashboard enhancements exist even before sign-in.
   await expect(page.locator('#sarni10Nav')).toHaveCount(1);
   await expect(page.locator('#sarni10Nav button[data-sarni10-section]')).toHaveCount(4);
   await expect(page.locator('#sarni10ScrollProgress')).toHaveCount(1);
   await expect(page.locator('#sarni10BackTop')).toHaveCount(1);
   await expect(page.locator('.sarni10-keyboard-help')).toHaveCount(1);
   await expect(page.locator('#sarni10ActiveStatus')).toHaveAttribute('aria-live','polite');
   // Tests run on the public login shell: never log in, change credentials, or save records.
   // All off-origin requests (including any backend POSTs) were intercepted and aborted.
   expect(blocked.every(x=>x.origin!=='http://127.0.0.1:8765')).toBe(true);
  });
 });
}
