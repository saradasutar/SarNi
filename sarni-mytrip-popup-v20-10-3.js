/* SarNi 20.10.3 — MyTrip-style popup for existing Add / Quick Add actions.
   Presentation and navigation only; original SarniQuickEntry.save and server-side authentication are unchanged. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let zoom=1;
function updateZoom(){const dialog=$('sarniQcDialog');if(!dialog)return;dialog.style.setProperty('--qc-zoom',String(zoom));const label=$('sarniQcScaleDisplay');if(label)label.textContent=Math.round(100*zoom)+'%';}
function showQuick(kind){const dialog=$('sarniQcDialog');if(!dialog||typeof window.SarniQuickEntry?.open!=='function')return false;
 window.SarniQuickEntry.open(kind);
 return true;
}
function init(){
 const dialog=$('sarniQcDialog');if(!dialog)return;
 $('sarniQcSmaller')?.addEventListener('click',()=>{zoom=Math.max(.9,Math.round((zoom-.1)*10)/10);updateZoom();});
 $('sarniQcLarger')?.addEventListener('click',()=>{zoom=Math.min(1.3,Math.round((zoom+.1)*10)/10);updateZoom();});
 updateZoom();
 // Capture before legacy page handlers to avoid leaving the current page.
 // Edit operations, recurring expenses, pre-plans and full-entry navigation are untouched.
 const targets=new Map([['sarniQuickOpen','expense'],['addExpenseBtn','expense'],['mobileJumpExpense','expense'],['sarniSpendJumpAdd','expense'],['homeDailyWriteBtn','diary'],['homeDiaryQuickBtn','diary']]);
 document.addEventListener('click',e=>{
   if(!e.isTrusted && e.detail===0 && e.target?.closest?.('form'))return;
   const quick=e.target?.closest?.('[data-sarni-quick],#sarniQuickOpen,#addExpenseBtn,#mobileJumpExpense,#sarniSpendJumpAdd,#homeDailyWriteBtn,#homeDiaryQuickBtn');
   if(!quick || dialog.contains(quick))return;
   const mode=quick.dataset?.sarniQuick || targets.get(quick.id);
   if(mode!=='expense'&&mode!=='diary'&&mode!=='stock')return;
   if(!showQuick(mode))return;
   e.preventDefault();e.stopImmediatePropagation();
   const menu=$('sarniQuickMenu');if(menu)menu.hidden=true;
   $('sarniQuickOpen')?.setAttribute('aria-expanded','false');
 },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
