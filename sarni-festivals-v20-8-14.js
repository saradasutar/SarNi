/* SarNi 20.8.14 · English/Odia festival manager. Reuses existing private important-date
 * API (backend accepts kind OTHER). Custom festival classification is encoded only in
 * the saved Notes field; no sheet schema changes or extra backend deployment.
 * Festival management is shown only to the current account's administrator.
 * Other SarNi accounts DO NOT inherit custom festivals without a future backend change.
 */
(function(){
'use strict';
const TAG='[SARNI_FESTIVAL_V1] ';
const $=id=>document.getElementById(id);
const f=()=>$('sarniFestivalForm');
const monthNames=['Chaitra','Baisakha','Jyestha','Asadha','Srabana','Bhadraba','Aswina','Kartika','Margasira','Pausa','Magha','Phalguna'];
let installed=false,lookupEpoch=0,odiaLookupDate='';
function loggedIn(){try{return Boolean(state?.token);}catch{return false;}}
function admin(){try{return loggedIn()&&typeof isSarNiAdmin==='function'&&isSarNiAdmin();}catch{return false;}}
function current(){try{return Array.isArray(state.importantDates)?state.importantDates:[];}catch{return [];}}
function saved(){return current().filter(x=>String(x.kind||'').toUpperCase()==='OTHER'&&String(x.notes||'').startsWith(TAG));}
const PHOTO_TAG='[FESTIVAL_PHOTO_URL] ',VISIBLE_TAG='[FESTIVAL_GUIDE_VISIBLE] ';
function guide(value){
 const raw=String(value||'').startsWith(TAG)?String(value).slice(TAG.length):String(value||'');
 const lines=raw.split('\n'),text=[],info={text:'',photoUrl:'',visible:true};
 for(const line of lines){
  if(line.startsWith(PHOTO_TAG))info.photoUrl=line.slice(PHOTO_TAG.length).trim();
  else if(line.startsWith(VISIBLE_TAG))info.visible=line.slice(VISIBLE_TAG.length).trim()!=='NO';
  else text.push(line);
 }
 info.text=text.join('\n').trim();return info;
}
function notes(value){return guide(value).text;}
function validPhoto(url){if(!url)return true;try{const parsed=new URL(url);return parsed.protocol==='https:'&&Boolean(parsed.hostname);}catch{return false;}}

function status(message,error){const el=$('sarniFestivalSaveStatus');if(el){el.textContent=message;el.classList.toggle('error',Boolean(error));}}
function dateLabel(d){
 if(!d)return 'Odia date unavailable';
 return String(d.monthName||monthNames[Number(d.month)]||'')+' · '+(d.paksha==='SHUKLA'?'ଶୁକ୍ଳ':'କୃଷ୍ଣ')+' '+String(d.tithi||'')+(d.adhika?' · ଅଧିକ ମାସ':'');
}
function showFields(){
 const form=f(), lunar=$('sarniFestivalLunarFields');
 if(!form||!lunar)return;
 lunar.hidden=form.elements.calendarBasis.value!=='ODIA';
}
function reset(){
 const form=f();if(!form)return;
 odiaLookupDate='';form.reset();form.elements.id.value='';
 form.elements.eventDate.value=typeof localIsoDate==='function'?localIsoDate():new Date().toISOString().slice(0,10);
 form.elements.calendarBasis.value='GREGORIAN';
 const preview=$('sarniFestivalOdiaPreview');if(preview)preview.textContent='English '+form.elements.eventDate.value+' · Odia calculation available below';
 showFields();status('Ready to save');
}
function printGuide(id){
 const row=selectedRecord(id);if(!row)return;
 const g=guide(row.notes);if(!admin()&&!g.visible){status('This guide is private.',true);return;}
 const win=window.open('','_blank');if(!win){status('Allow pop-ups to print the festival guide.',true);return;}
 const doc=win.document;doc.open();doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Family Festival Guide</title><style>body{font-family:Arial,sans-serif;color:#20253b;margin:16mm;line-height:1.55}h1{margin-bottom:6px}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}a{overflow-wrap:anywhere}@page{size:A4;margin:16mm}@media print{button{display:none}}</style></head><body></body></html>');doc.close();
 const h=doc.createElement('h1');h.textContent=String(row.title||'Family Festival Guide');doc.body.append(h);
 const date=doc.createElement('p');date.textContent='Original English date: '+String(row.eventDate||'')+' · Repeats annually by '+(String(row.calendarBasis||'').toUpperCase()==='ODIA'?'Odia lunar tithi':'English date')+'. Verify the observance with this year’s Kohinoor Panjika.';doc.body.append(date);
 const heading=doc.createElement('h2');heading.textContent='Family traditions and instructions';doc.body.append(heading);
 const description=doc.createElement('pre');description.textContent=g.text||'No instructions added yet.';doc.body.append(description);
 if(g.photoUrl&&validPhoto(g.photoUrl)){const p=doc.createElement('p'),a=doc.createElement('a');a.href=g.photoUrl;a.textContent='Open family photo / album';a.target='_blank';a.rel='noopener noreferrer';p.append(a);doc.body.append(p);}
 const foot=doc.createElement('p');foot.textContent='Family reference copy · Printed '+new Date().toLocaleDateString('en-IN');doc.body.append(foot);
 const btn=doc.createElement('button');btn.textContent='Print / Save as PDF';btn.addEventListener('click',()=>win.print());doc.body.append(btn);win.focus();
}
function addPhotoPreview(container,url){
 if(!validPhoto(url)||!/^https:\/\/[^\s?#]+\.(?:png|jpe?g|webp|gif)(?:[?#]|$)/i.test(url))return;
 const img=document.createElement('img');img.src=url;img.loading='lazy';img.alt='Festival photograph thumbnail';img.referrerPolicy='no-referrer';img.style.cssText='display:block;max-width:180px;max-height:135px;object-fit:cover;border-radius:9px;margin:10px 0';img.addEventListener('error',()=>img.remove(),{once:true});container.append(img);
}
function render(){
 const list=$('sarniFestivalSavedList'),form=f();if(!list)return;
 if(form)form.classList.toggle('hidden',!admin());
 list.replaceChildren();
 if(!loggedIn()){const p=document.createElement('p');p.textContent='Sign in to see saved festivals.';list.append(p);return;}
 const items=saved().slice().sort((a,b)=>String(a.title).localeCompare(String(b.title)));
 if(!items.length){const p=document.createElement('p');p.textContent='No custom festivals yet. Standard Odia festivals are already displayed automatically above.';list.append(p);return;}
 for(const row of items){
  const card=document.createElement('article');card.className='sarni-festival-saved-row';
  const left=document.createElement('div');left.className='sarni-festival-saved-text';
  const head=document.createElement('strong');head.textContent='❀ '+String(row.title||'Festival');
  const detail=document.createElement('small');
  const original=String(row.eventDate||'');
  const basis=String(row.calendarBasis||'GREGORIAN').toUpperCase();
  const lunar=basis==='ODIA'?'Odia · '+String(monthNames[Number(row.odiaMonth)]||'')+' · '+String(row.odiaPaksha||'')+' '+String(row.odiaTithi||''):'English date';
  detail.textContent=original+' · Every year by '+lunar;
  const g=guide(row.notes);
  left.append(head,detail);
  if((admin()||g.visible)&&(g.text||g.photoUrl)){
   const disclosure=document.createElement('details');disclosure.className='sarni-festival-family-guide';
   const summary=document.createElement('summary');summary.textContent='📖 Family guide · instructions & photos';disclosure.append(summary);
   if(g.text){const content=document.createElement('p');content.style.whiteSpace='pre-wrap';content.textContent=g.text;disclosure.append(content);}
   if(g.photoUrl&&validPhoto(g.photoUrl)){
    const a=document.createElement('a');a.href=g.photoUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent='↗ Open festival photo / family album';disclosure.append(a);addPhotoPreview(disclosure,g.photoUrl);
   }
   left.append(disclosure);
  }
  card.append(left);
  if((admin()||g.visible)&&(g.text||g.photoUrl)){const controls=document.createElement('div');controls.className='sarni-festival-actions';const print=document.createElement('button');print.type='button';print.className='life-quiet';print.dataset.festivalAction='print';print.dataset.festivalId=String(row.id);print.textContent='⎙ Print guide';controls.append(print);card.append(controls);}
  if(admin()){
   const actions=document.createElement('div');actions.className='sarni-festival-actions';
   for(const [action,label] of [['edit','Edit'],['delete','Remove']]){
    const button=document.createElement('button');button.type='button';button.className='life-quiet';
    button.dataset.festivalAction=action;button.dataset.festivalId=String(row.id);button.textContent=label;actions.append(button);
   }
   card.append(actions);
  }
  list.append(card);
 }
}
async function lookup(apply=true){
 const form=f();if(!form)return;
 const date=String(form.elements.eventDate.value||'');
 const preview=$('sarniFestivalOdiaPreview'),serial=++lookupEpoch;
 if(!date){odiaLookupDate='';if(preview)preview.textContent='Select an English date first.';return;}
 if(!loggedIn()){if(preview)preview.textContent='Save an English date; sign in to calculate Odia tithi.';return;}
 if(preview)preview.textContent='Calculating Odia tithi for '+date+'…';
 try{
  const r=await api('lookupOdiaDate',{date},{retry:false,timeoutMs:25000});
  if(serial!==lookupEpoch||form.elements.eventDate.value!==date)return;
  if(!r?.ok||!r.odia)throw new Error(r?.message||'Odia lookup failed');
  odiaLookupDate=date;
  if(preview)preview.textContent='English '+date+' → ଓଡ଼ିଆ '+dateLabel(r.odia)+' (sunrise estimate)';
  if(apply){
   form.elements.odiaMonth.value=String(r.odia.month);
   form.elements.odiaPaksha.value=String(r.odia.paksha);
   form.elements.odiaTithi.value=String(r.odia.tithi);
   form.elements.odiaVerified.checked=false;
  }
 }catch(err){
  if(serial!==lookupEpoch)return;
  odiaLookupDate='';if(preview)preview.textContent='Odia lookup unavailable: '+String(err.message||'Try again');
 }
}
function selectedRecord(id){return saved().find(x=>String(x.id)===String(id));}
function edit(id){
 if(!admin())return;
 const row=selectedRecord(id),form=f();if(!row||!form)return;
 reset();form.elements.id.value=String(row.id);
 form.elements.title.value=String(row.title||'');
 form.elements.eventDate.value=String(row.eventDate||'');
 form.elements.calendarBasis.value=String(row.calendarBasis||'GREGORIAN');
 form.elements.notes.value=notes(row.notes);
 const existingGuide=guide(row.notes);form.elements.festivalPhotoUrl.value=existingGuide.photoUrl;form.elements.festivalGuideVisible.checked=existingGuide.visible;
 form.elements.odiaMonth.value=String(row.odiaMonth??0);
 form.elements.odiaPaksha.value=String(row.odiaPaksha||'SHUKLA');
 form.elements.odiaTithi.value=String(row.odiaTithi||1);
 form.elements.odiaVerified.checked=Boolean(row.odiaVerified);
 showFields();void lookup(false);
 form.scrollIntoView({behavior:'smooth',block:'start'});
 form.elements.title.focus({preventScroll:true});
}
async function saveEvent(event){
 event.preventDefault();
 if(!admin()){status('Only the signed-in administrator can use this festival editor.',true);return;}
 const form=f();if(!form)return;
 const title=form.elements.title.value.trim(),eventDate=form.elements.eventDate.value,
       basis=form.elements.calendarBasis.value,originalNotes=form.elements.notes.value.trim(),photoUrl=form.elements.festivalPhotoUrl.value.trim(),guideVisible=form.elements.festivalGuideVisible.checked;
 if(!validPhoto(photoUrl)){status('Use a valid HTTPS link for the festival photo.',true);return;}
 const encodedGuide=TAG+originalNotes+(photoUrl?'\n'+PHOTO_TAG+photoUrl:'')+'\n'+VISIBLE_TAG+(guideVisible?'YES':'NO');
 if(encodedGuide.length>1050){status('Instructions and photo link exceed 1,050 characters. Shorten the guide or link.',true);return;}
 if(!title||!eventDate){status('Enter a festival name and English reference date.',true);return;}
 const odia=basis==='ODIA';
 const lunar={month:Number(form.elements.odiaMonth.value),tithi:Number(form.elements.odiaTithi.value),paksha:form.elements.odiaPaksha.value};
 if(odia&&(!Number.isInteger(lunar.month)||lunar.month<0||lunar.month>11||
   !Number.isInteger(lunar.tithi)||lunar.tithi<1||lunar.tithi>15||
   !['SHUKLA','KRISHNA'].includes(lunar.paksha))){
   status('Select a valid Odia month, paksha and tithi.',true);return;
 }
 const id=String(form.elements.id.value||'');
 if(odia&&!form.elements.odiaVerified.checked&&odiaLookupDate!==eventDate&&!id){status('Wait for the Odia calculation, or select verified month/paksha/tithi and confirm the original in a trusted Panjika.',true);return;}
 const btn=$('sarniFestivalSaveBtn');
 if(btn)btn.disabled=true;status('Saving yearly festival securely…');
 const data={
  id,title,eventDate,kind:'OTHER',notes:TAG+originalNotes+(photoUrl?'\\n'+PHOTO_TAG+photoUrl:'')+'\n'+VISIBLE_TAG+(guideVisible?'YES':'NO'),
  calendarBasis:basis,repeatYearly:true,odiaMonth:odia?lunar.month:'',
  odiaPaksha:odia?lunar.paksha:'',odiaTithi:odia?lunar.tithi:0,
  odiaAdhika:'REGULAR',odiaVerified:odia&&Boolean(form.elements.odiaVerified.checked),
  reminderDays:'7,1,0',reminderEmail:''
 };
 try{
  const result=await api('saveImportantDate',{event:data},{retry:false,timeoutMs:60000});
  if(!result?.ok)throw new Error(result?.message||'Festival was not saved');
  applyBootstrap(result.data);saveCache(result.data);
  reset();render();
  if(typeof renderStandaloneCalendar==='function')renderStandaloneCalendar();
  $('odiaFestivalRefresh')?.click();
  status('✓ Festival saved. It will recur yearly by your selected calendar.');
  if(typeof toast==='function')toast('Yearly festival saved.','success');
 }catch(err){
  status(String(err.message||'Unable to save festival'),true);
  if(typeof toast==='function')toast(String(err.message||'Unable to save'), 'error');
 }finally{if(btn)btn.disabled=false;}
}
async function remove(id){
 if(!admin())return;
 const row=selectedRecord(id);if(!row||!window.confirm('Remove festival "'+row.title+'"?'))return;
 try{
  const result=await api('deleteImportantDate',{id},{retry:false});
  if(!result?.ok)throw new Error(result?.message||'Could not remove festival');
  applyBootstrap(result.data);saveCache(result.data);render();
  if(typeof renderStandaloneCalendar==='function')renderStandaloneCalendar();
  $('odiaFestivalRefresh')?.click();
  if(typeof toast==='function')toast('Festival removed.','success');
 }catch(err){status(String(err.message||'Unable to remove festival'),true);}
}
function calendarNav(action){
 if(!loggedIn())return;
 if(typeof closeSarNiMobileMore==='function')closeSarNiMobileMore();
 if(action==='target'){
  if(typeof openStickyNote==='function'){openStickyNote();return;}
  $('homeAddTargetBtn')?.click();return;
 }
 if(typeof switchSection==='function')switchSection('calendar');
 const target=action==='festivals'?'sarniFestivalManager':action==='reminder'?'calendarEventForm':'standaloneCalendarGrid';
 if(action==='reminder'){
  const form=$('calendarEventForm');
  if(form)form.elements.kind.value='REMINDER';
 }
 if(action==='festivals')render();
 requestAnimationFrame(()=>{
  $(target)?.scrollIntoView({behavior:'smooth',block:'start'});
  if(action==='reminder')$('calendarEventForm')?.elements?.title?.focus({preventScroll:true});
 });
}
function install(){
 if(installed)return;
 const form=f();if(!form)return;installed=true;
 reset();render();
 form.elements.eventDate.addEventListener('change',()=>void lookup(true));
 form.elements.calendarBasis.addEventListener('change',()=>{showFields();void lookup(true);});
 form.addEventListener('submit',saveEvent);
 $('sarniFestivalNew')?.addEventListener('click',()=>{reset();form.elements.title.focus({preventScroll:true});});
 $('sarniFestivalSavedList')?.addEventListener('click',event=>{
  const button=event.target.closest('[data-festival-action]');
  if(!button)return;
  if(button.dataset.festivalAction==='print')printGuide(button.dataset.festivalId);
  else if(button.dataset.festivalAction==='edit')edit(button.dataset.festivalId);
  else if(button.dataset.festivalAction==='delete')void remove(button.dataset.festivalId);
 });
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-sarni-calendar-shortcut]');
  if(button){event.preventDefault();calendarNav(button.dataset.sarniCalendarShortcut);}
 });
 const previous=renderStandaloneCalendar;
 renderStandaloneCalendar=function(){const result=previous.apply(this,arguments);render();return result;};
 // Dates, reminders and custom festivals already use authenticated SarNi services.
 // Rendering only happens when the calendar is opened and after authenticated saves.
 const panel=$('calendarSection');
 if(panel)new MutationObserver(()=>{if(!panel.classList.contains('hidden'))render();})
  .observe(panel,{attributes:true,attributeFilter:['class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();