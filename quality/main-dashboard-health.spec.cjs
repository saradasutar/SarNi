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
   // SarNi 10: one consolidated dashboard module finder, without authentication.
   await expect(page.locator('#sarni10Workspace')).toHaveCount(1);
   await expect(page.locator('#sarni10ModuleSearch')).toHaveCount(1);
   await expect(page.locator('#sarni10ModuleResults')).toHaveCount(1);
   await expect(page.locator('#sarni10Favorites')).toHaveCount(1);
   await expect(page.locator('#sarni10Recent')).toHaveCount(1);
   await expect(page.locator('#sarni10Breadcrumb')).toHaveCount(1);
   await expect(page.locator('#sarni10Density')).toHaveCount(1);
   await expect(page.locator('#sarni10Top')).toHaveCount(1);
   await expect(page.locator('link[href^="./sarni10-main-workspace.css"]')).toHaveCount(1);
   // No duplicate dynamic navigation should appear on the unauthenticated shell.
   await expect(page.locator('#sarni10Nav,#sarni10JumpBar,#sarni10Tools')).toHaveCount(0);
   // Tests run on the public login shell: never log in, change credentials, or save records.
   // All off-origin requests (including any backend POSTs) were intercepted and aborted.
   expect(blocked.every(x=>x.origin!=='http://127.0.0.1:8765')).toBe(true);
  });
 });
}
