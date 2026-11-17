// SarNi main dashboard public frontend health smoke test. NO LOGIN or backend calls.
const {test,expect}=require('@playwright/test');
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:700}]){
 test.describe('Main dashboard Health '+viewport.width+'px',()=>{
  test.use({viewport,serviceWorkers:'block'});
  test('health panel exists, original modules remain, retired duplicate workspace stays absent',async({page})=>{
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
   // The duplicate SarNi 10 Quick Workspace was deliberately retired.
   const retired=await page.locator('script[src*="sarni10-main-"],script[src*="sarni-main-batch10"]').evaluateAll(nodes=>nodes.map(x=>x.getAttribute('src')));
   expect(retired).toHaveLength(0);
   await expect(page.locator('#sarniMainHealthRefresh')).toHaveCount(1);
   await expect(page.locator('#sarniMainHealthHistory')).toHaveCount(1);
   await expect(page.locator('#sarniMainHealthClear')).toHaveCount(1);
   await expect(page.locator('#sarniMainHealthPeer')).toHaveCount(1);
   await expect(page.locator('#dashboardVersionTop')).toHaveCount(1);
   await expect(page.locator('#dashboardBackendVersionTop')).toHaveCount(1);
   for(const id of ['mainDashboard','sarniSidebarPrimary','overviewSection','diarySection','calendarSection','expenditureSection','adminPhotoManager']){
    await expect(page.locator('#'+id)).toHaveCount(1);
   }
   // Tests run on the public login shell: never log in, change credentials, or save records.
   // All off-origin requests (including any backend POSTs) were intercepted and aborted.
   expect(blocked.every(x=>x.origin!=='http://127.0.0.1:8765')).toBe(true);
  });
 });
}
