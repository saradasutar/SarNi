/* Installable standalone SarNi Quick Expense PWA (separate from main SarNi PWA). */
(function(){'use strict';
let promptEvent=null;const button=document.getElementById('installAppButton');const note=document.getElementById('installInstruction');
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
if(standalone){button.hidden=true;note.textContent='Installed shortcut ready. Open it directly from your phone home screen.';}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;if(!standalone())button.hidden=false;});
window.addEventListener('appinstalled',()=>{promptEvent=null;button.hidden=true;note.textContent='Quick Expense was installed. Open the separate SarNi Expense icon from your home screen.';});
button.addEventListener('click',async()=>{
 if(promptEvent){const p=promptEvent;promptEvent=null;try{await p.prompt();const choice=await p.userChoice;if(choice?.outcome!=='accepted')note.textContent='Install was dismissed. Use your browser menu to add this app later.';}catch(e){note.textContent='Use your browser menu → Install app / Add to Home screen.';}return;}
 const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
 note.textContent=ios?'On iPhone: open this link in Safari, tap Share, then Add to Home Screen. If the installed app asks, paste your private link once.':'In your browser menu, choose Install app or Add to Home screen. You can also bookmark your private link.';
});
if('serviceWorker' in navigator&&location.protocol==='https:'){
 navigator.serviceWorker.register('./quick-expense-sw.js',{scope:'./quick-expense.html'}).catch(()=>{});
}
})();
