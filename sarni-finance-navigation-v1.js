/* SarNi v2.0: Credit Card controls accessible within Expenditure, not left panel. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let ready=false;
function init(){
 if(ready)return true;
 const expenses=$('expenditureSection'),card=$('creditCardsSection');
 const nav=$('sarniSidebarPrimary')?.querySelector('button[data-section="creditCards"]');
 const expenseNav=$('sarniSidebarPrimary')?.querySelector('button[data-section="expenditure"]');
 if(!expenses||!card||!nav||!expenseNav)return false;
 const hero=expenses.querySelector('.expense-hero-actions')||expenses.querySelector('.expense-hero');
 if(!hero)return false;
 if(!$('sarniCardInsideExpense')){
  const open=document.createElement('button');open.id='sarniCardInsideExpense';
  open.type='button';open.className='secondary-button sarni-finance-cc-shortcut';
  open.textContent='▣ Credit cards & bills';
  open.setAttribute('aria-label','Open credit card purchases, statements and payments');
  open.addEventListener('click',()=>nav.click());
  hero.appendChild(open);
 }
 if(!$('sarniReturnToExpenses')){
  const back=document.createElement('button');back.type='button';back.id='sarniReturnToExpenses';
  back.className='secondary-button sarni-finance-back';back.textContent='← Back to Expenditure';
  back.addEventListener('click',()=>expenseNav.click());
  card.insertBefore(back,card.firstChild);
 }
 document.documentElement.classList.add('sarni-finance-grouped');
 ready=true;
 window.SarniFinanceNavigation={ready:true,openCards:()=>nav.click(),back:()=>expenseNav.click(),version:'2.0'};
 return true;
}
function start(){if(init())return;let tries=0;const timer=setInterval(()=>{if(init()||++tries>=30)clearInterval(timer);},250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
