/* SarNi Yearly Kohinoor and Important Days viewer. Read-only; backend date rules remain authoritative. */
(function(){
'use strict';
const id=x=>document.getElementById(x), text=x=>String(x==null?'':x);
const esc=x=>text(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
let records=[],busy=false,loadedYear=0,loadedUser='';
const customTag='[SARNI_FESTIVAL_V1] ';
function loggedIn(){try{return !!state.token;}catch{return false;}}
function year(){return Number(id('sarniYearListYear').value);}
function mode(){return id('sarniYearListType').value;}
function user(){try{return String(state.username||'');}catch{return '';}}
function important(){try{return Array.isArray(state.importantDates)?state.importantDates:[];}catch{return [];}}
function status(s){const e=id('sarniYearListStatus');if(e)e.textContent=s;}
function openEditor(){const form=id('calendarEventForm');if(form){form.scrollIntoView({behavior:'smooth',block:'start'});form.querySelector('[name="title"]')?.focus({preventScroll:true});}}
function render(){
 const root=id('sarniYearListResults');if(!root)return;
 const query=id('sarniYearListSearch').value.toLocaleLowerCase().trim(),kind=mode();
 let filtered=records.filter(r=>(kind==='all'||r.kind===kind)&&(!query||[r.title,r.date,r.source,r.basis,r.odia].join(' ').toLocaleLowerCase().includes(query)));
 filtered.sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
 const count=id('sarniYearListCount');if(count)count.textContent=filtered.length+' matching entries';
 if(!filtered.length){root.innerHTML='<p class="sarni-year-empty">No matching records. Choose another filter or year.</p>';return;}
 let out='',month='';
 filtered.forEach(r=>{
   const m=r.date.slice(0,7);
   if(month!==m){month=m;out+='<h4 class="sarni-year-month">'+esc(months[Number(m.slice(5))-1])+' '+esc(year())+'</h4>';}
   const badge=r.kind==='festival'?'Festival':r.kind==='important'?'Important Day':'Personal occasion';
   out+='<div class="sarni-year-entry"><span class="sarni-year-date">'+esc(r.date)+'</span><div class="sarni-year-content"><strong>'+esc(r.title)+'</strong><small>'+esc(r.odia||r.source||'')+'</small></div><span class="sarni-year-kind">'+esc(badge)+'</span></div>';
 });
 root.innerHTML=out;
}
async function load(){
 if(busy)return;
 if(!loggedIn()){status('Sign in to view your yearly occasions.');return;}
 const y=year();if(!Number.isInteger(y)||y<1900||y>2100){status('Choose a year from 1900 to 2100.');return;}
 busy=true;records=[];loadedYear=0;id('sarniYearListLoad').disabled=true;
 const custom=new Set(important().filter(r=>text(r.notes).startsWith(customTag)).map(r=>text(r.id)));
 const seen=new Set();
 try{
 for(let m=1;m<=12;m++){
   status('Loading '+months[m-1]+' ('+m+'/12) …');
   const response=await api('getOdiaCalendar',{year:y,month:m},{retry:false});
   if(!response?.ok)throw Error(response?.message||'Odia calendar service unavailable');
   for(const [entries,origin] of [[response.festivals||[],'festival'],[response.occurrences||[],'occasion']]){
    for(const r of entries){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(text(r.date)))continue;
      const isCustom=custom.has(text(r.id)),kind=(origin==='festival'||isCustom)?'festival':'important';
      const basis=text(r.calendarKind||r.calendarBasis||r.source||'');
      const value={id:text(r.id),title:text(r.title||'Occasion'),date:text(r.date),kind,source:text(r.source),basis,odia:basis.toUpperCase().includes('ODIA')?'Odia recurrence (verify Kohinoor for this year)':text(r.source||'')};
      const key=[value.id,value.title.toLowerCase(),value.date,kind].join('|');
      if(seen.has(key))continue;seen.add(key);records.push(value);
    }
   }
 }
 // One-time dates are not annual recurrence events, so include them only in their original year.
 for(const r of important()){
   const date=text(r.eventDate).slice(0,10),repeat=r.repeatYearly===true||text(r.repeatYearly).toLowerCase()==='true';
   if(repeat||!date.startsWith(y+'-'))continue;
   const kind=text(r.notes).startsWith(customTag)?'festival':'important';
   const key=[text(r.id),text(r.title).toLowerCase(),date,kind].join('|');
   if(seen.has(key))continue;seen.add(key);
   records.push({id:text(r.id),title:text(r.title),date,kind,source:'One-time saved event',basis:text(r.calendarBasis),odia:'One-time saved date'});
 }
 loadedYear=y;loadedUser=user();status('Loaded '+records.length+' entries for '+y+'. Lunar dates are calculations; verify against the Kohinoor Panjika for the selected year.');render();
 }catch(e){status('Could not load full-year data: '+text(e.message));records=[];render();}
 finally{busy=false;id('sarniYearListLoad').disabled=false;}
}
function printList(){
 if(loadedYear!==year()||loadedUser!==user()){status('Load your chosen year before printing.');return;}
 const rows=Array.from(id('sarniYearListResults').querySelectorAll('.sarni-year-entry')).map(x=>x.textContent.trim()).join('\n');
 const w=window.open('','_blank');if(!w){status('Allow popups to print the list.');return;}
 w.document.write('<!doctype html><meta charset="utf-8"><title>SarNi yearly festival and occasions</title><pre style="font:14px/1.7 sans-serif;white-space:pre-wrap">'+esc('SarNi yearly occasions — '+year()+'\n\n'+rows+'\n\nOdia lunar observances are estimates. Verify with the applicable Kohinoor Panjika before relying on dates.')+'</pre>');w.document.close();w.focus();w.print();
}
function init(){
 if(id('sarniYearListPanel'))return;
 const target=id('sarniOdiaFestivalItems')?.closest('.sarni-odia-festival-panel')||id('sarniFestivalManager');
 if(!target)return;
 const box=document.createElement('section');box.className='life-card sarni-year-list-panel';box.id='sarniYearListPanel';
 box.innerHTML='<div class="life-card-top"><div><span class="life-eyebrow">ଓଡ଼ିଆ ପର୍ବପର୍ବାଣୀ · YEARLY VIEW</span><h3>Yearly Festivals &amp; Important Days</h3></div></div><p class="sarni-year-hint">Choose any year to see the festival list and your saved occasions. Important days repeat by English date, Odia lunar tithi, or both, as selected when saving. Lunar dates are calculated estimates, not independently verified Kohinoor dates.</p><div class="sarni-year-controls"><label>Year<input id="sarniYearListYear" type="number" min="1900" max="2100" step="1"></label><label>Show<select id="sarniYearListType"><option value="all">All festivals &amp; important days</option><option value="festival">Festivals only</option><option value="important">Important days only</option></select></label><label class="sarni-year-search">Search<input id="sarniYearListSearch" type="search" placeholder="Find festival, person or date"></label><button type="button" id="sarniYearListLoad" class="life-save">View full year</button><button type="button" id="sarniYearListPrint" class="life-quiet">Print list</button><button type="button" id="sarniYearListAdd" class="life-quiet">+ Important day</button></div><p id="sarniYearListStatus" role="status" aria-live="polite">Select a year and click View full year.</p><div class="sarni-year-summary" id="sarniYearListCount"></div><div id="sarniYearListResults"></div>';
 target.insertAdjacentElement('afterend',box);
 id('sarniYearListYear').value=String(new Date().getFullYear());
 id('sarniYearListLoad').addEventListener('click',load);
 id('sarniYearListType').addEventListener('change',render);
 id('sarniYearListSearch').addEventListener('input',render);
 id('sarniYearListPrint').addEventListener('click',printList);
 id('sarniYearListAdd').addEventListener('click',openEditor);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
