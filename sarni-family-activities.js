/* SarNi Family Heritage Journal · shared MyFamily backend */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const S = {entries:[],links:[],catalog:{importantDates:[],festivals:[]},member:null,id:'',photos:[],busy:false};
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const owner = e => !!e && !!S.member && String(e.ownerId || e.createdBy) === String(S.member.id);
  const admin = () => String(S.member && S.member.role || '').toUpperCase() === 'ADMIN';
  const manage = e => owner(e) || (!!e && String(e.visibility || 'FAMILY').toUpperCase() === 'FAMILY' && admin());
  const current = () => S.entries.find(e=>String(e.id)===String(S.id)) || null;
  const dateText = v => {if(!v)return 'Date not recorded';const d=new Date(String(v).slice(0,10)+'T00:00:00');return isNaN(d)?v:d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});};
  const typeText = v => ({FESTIVAL:'Festival',ACTIVITY:'Activity',RITUAL:'Ritual',TRADITION:'Tradition',CELEBRATION:'Celebration',CUSTOM:'Custom'})[String(v||'').toUpperCase()]||'Family memory';
  function notify(m,t){if(typeof toast==='function')toast(m,t||'');else window.alert(m);}
  function status(m,error){if($('familyJournalStatus')){$('familyJournalStatus').textContent=m||'';$('familyJournalStatus').classList.toggle('error',!!error);}}
  async function call(action,payload){const r=await api(action,payload||{},{retry:false,timeoutMs:120000});if(!r||r.ok!==true)throw Error(r&&r.message||'Family journal request failed.');return r;}
  function linksFor(id){return S.links.filter(x=>String(x.guideId)===String(id));}
  async function load(){
    if(S.busy)return;S.busy=true;
    $('familyJournalList').innerHTML='<p class="fj-loading">Loading shared family archive…</p>';
    status('Checking your verified SarNi email against MyFamily…');
    try{
      const r=await call('familyJournalBootstrap',{});
      S.entries=Array.isArray(r.entries)?r.entries:[];S.links=Array.isArray(r.links)?r.links:[];S.catalog=r.catalog||{importantDates:[],festivals:[]};S.member=r.currentMember||null;
      render();status('Connected to MyFamily · '+S.entries.length+' accessible memories');
    }catch(e){
      S.entries=[];S.links=[];$('familyJournalList').innerHTML='<div class="fj-error"><strong>Family journal is not connected</strong><p>'+esc(e.message)+'</p><small>Verify your SarNi email and confirm the same email is registered to an active MyFamily member with Calendar access.</small></div>';
      status(e.message,true);
    }finally{S.busy=false;}
  }
  function filtered(){
    const q=String($('familyJournalSearch').value||'').trim().toLowerCase(),type=$('familyJournalTypeFilter').value,vis=$('familyJournalVisibilityFilter').value,year=$('familyJournalYearFilter').value;
    return S.entries.filter(e=>{
      const words=[e.title,e.odiaName,e.entryType,e.meaning,e.instructions,e.rituals,e.food,e.responsibilities,e.memories].join(' ').toLowerCase();
      return (!q||words.includes(q))&&(!type||String(e.entryType).toUpperCase()===type)&&
        (vis==='ALL'||String(e.visibility||'FAMILY').toUpperCase()===vis)&&(!year||String(e.eventDate||'').slice(0,4)===year);
    });
  }
  function render(){
    const years=Array.from(new Set(S.entries.map(e=>String(e.eventDate||'').slice(0,4)).filter(Boolean))).sort((a,b)=>Number(b)-Number(a));
    const old=$('familyJournalYearFilter').value;
    $('familyJournalYearFilter').innerHTML='<option value="">All years</option>'+years.map(y=>'<option value="'+esc(y)+'">'+esc(y)+'</option>').join('');
    if(years.includes(old))$('familyJournalYearFilter').value=old;
    const entries=filtered();$('familyJournalCount').textContent=entries.length+' memories · '+S.entries.length+' accessible to this account';
    $('familyJournalList').innerHTML=entries.map(e=>{
      const privateEntry=String(e.visibility||'FAMILY').toUpperCase()==='PRIVATE',links=linksFor(e.id).map(x=>x.label).filter(Boolean);
      const excerpt=e.meaning||e.memories||e.instructions||e.rituals||e.food||'Open to read this family memory.';
      return '<article class="fj-card '+(privateEntry?'private':'family')+'"><div class="fj-card-top"><span>'+esc(typeText(e.entryType))+'</span><b>'+(privateEntry?'🔒 Private':'♡ Family')+'</b></div>'+
        '<h3>'+esc(e.title)+'</h3>'+(e.odiaName?'<p class="fj-odia">'+esc(e.odiaName)+'</p>':'')+
        '<p class="fj-excerpt">'+esc(excerpt.slice(0,230))+(excerpt.length>230?'…':'')+'</p>'+
        (links.length?'<p class="fj-linked">↗ '+esc(links.slice(0,3).join(' · '))+'</p>':'')+
        '<div class="fj-card-meta"><span>'+esc(dateText(e.eventDate))+'</span><span>'+(owner(e)?'Your entry':'By '+esc(e.ownerName||'Family member'))+'</span></div>'+
        '<button class="fj-open" type="button" data-fj-open="'+esc(e.id)+'">Open memory</button></article>';
    }).join('')||'<div class="fj-empty"><span>✿</span><h3>No memories found</h3><p>Add a family custom, festival or tradition, or adjust the filters.</p></div>';
  }
  function populateLinks(selected){
    selected=selected||[];const festival=new Set(selected.filter(x=>x.targetType==='ODIA_FESTIVAL').map(x=>String(x.targetKey||'')));
    const dates=new Set(selected.filter(x=>x.targetType==='IMPORTANT_DATE').map(x=>String(x.targetId||'')));
    $('familyJournalFestivalLinks').innerHTML=(S.catalog.festivals||[]).map(x=>'<option value="'+esc(x.targetKey)+'" '+(festival.has(String(x.targetKey))?'selected':'')+'>'+esc(x.label)+'</option>').join('')||'<option disabled>No festivals in MyFamily</option>';
    $('familyJournalImportantDateLinks').innerHTML=(S.catalog.importantDates||[]).map(x=>'<option value="'+esc(x.targetId)+'" '+(dates.has(String(x.targetId))?'selected':'')+'>'+esc(x.label)+(x.repeatYearly?' · repeats yearly':'')+'</option>').join('')||'<option disabled>No Important Dates in MyFamily</option>';
  }
  function selectedLinks(){
    const calendar=$('familyJournalShowCalendar').checked,yearbook=$('familyJournalShowYearbook').checked,out=[];
    Array.from($('familyJournalFestivalLinks').selectedOptions).forEach(o=>out.push({targetType:'ODIA_FESTIVAL',targetKey:o.value,showInCalendar:calendar,showInYearbook:yearbook}));
    Array.from($('familyJournalImportantDateLinks').selectedOptions).forEach(o=>out.push({targetType:'IMPORTANT_DATE',targetId:o.value,showInCalendar:calendar,showInYearbook:false}));
    return out;
  }
  function clearEditor(){
    S.id='';S.photos=[];S.pendingPhoto=null;$('familyJournalForm').reset();$('familyJournalEntryId').value='';
    $('familyJournalEventDate').value=new Date().toISOString().slice(0,10);$('familyJournalVisibility').value='FAMILY';
    populateLinks([]);$('familyJournalEditor').classList.remove('hidden');$('familyJournalPhotoPanel').classList.add('hidden');
    $('familyJournalPhotoGallery').innerHTML='';$('familyJournalArchive').classList.add('hidden');$('familyJournalPrintEntry').classList.add('hidden');
    $('familyJournalEditorTitle').textContent='Add a family memory';$('familyJournalSave').classList.remove('hidden');
    $('familyJournalPhotoUploader').classList.add('hidden');$('familyJournalLinksPanel').classList.remove('hidden');
    linkPermissions('FAMILY',true);
  }
  function linkPermissions(visibility,isEntryOwner){
    const priv=visibility==='PRIVATE';$('familyJournalLinksPanel').classList.toggle('hidden',priv);
    $('familyJournalLinksReadonly').classList.toggle('hidden',isEntryOwner||priv);
    $('familyJournalPrivateLinkNote').classList.toggle('hidden',!priv);
    ['familyJournalFestivalLinks','familyJournalImportantDateLinks','familyJournalShowCalendar','familyJournalShowYearbook'].forEach(id=>$(id).disabled=!isEntryOwner);
  }
  async function openEntry(id){
    const e=S.entries.find(x=>String(x.id)===String(id));if(!e)return;
    S.id=e.id;S.photos=[];$('familyJournalEntryId').value=e.id;
    $('familyJournalTitle').value=e.title||'';$('familyJournalOdiaName').value=e.odiaName||'';$('familyJournalEventDate').value=e.eventDate||'';
    $('familyJournalEntryType').value=e.entryType||'TRADITION';$('familyJournalVisibility').value=e.visibility||'FAMILY';
    $('familyJournalMeaning').value=e.meaning||'';$('familyJournalInstructions').value=e.instructions||'';$('familyJournalRituals').value=e.rituals||'';
    $('familyJournalFood').value=e.food||'';$('familyJournalResponsibilities').value=e.responsibilities||'';$('familyJournalMemories').value=e.memories||'';
    const own=owner(e),links=linksFor(e.id);populateLinks(links);
    $('familyJournalShowCalendar').checked=!links.length||links.some(x=>x.showInCalendar);
    $('familyJournalShowYearbook').checked=!links.length||links.some(x=>x.showInYearbook);
    $('familyJournalEditor').classList.remove('hidden');$('familyJournalEditorTitle').textContent=own?'Your family memory':'Family memory';
    ['familyJournalTitle','familyJournalOdiaName','familyJournalEventDate','familyJournalEntryType','familyJournalVisibility','familyJournalMeaning','familyJournalInstructions','familyJournalRituals','familyJournalFood','familyJournalResponsibilities','familyJournalMemories'].forEach(id=>$(id).disabled=!own);
    $('familyJournalSave').classList.toggle('hidden',!own);$('familyJournalArchive').classList.toggle('hidden',!own);
    $('familyJournalPrintEntry').classList.remove('hidden');$('familyJournalPhotoPanel').classList.remove('hidden');
    $('familyJournalPhotoUploader').classList.toggle('hidden',String(e.visibility).toUpperCase()==='PRIVATE'&&!own);
    linkPermissions(String(e.visibility||'FAMILY').toUpperCase(),own);
    await loadPhotos(e.id);$('familyJournalEditor').scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function loadPhotos(id){
    try{const r=await call('familyJournalPhotoList',{guideId:id});S.photos=Array.isArray(r.photos)?r.photos:[];renderPhotos();}
    catch(e){notify(e.message||'Unable to load family photos.','error');}
  }
  function renderPhotos(){
    $('familyJournalPhotoGallery').innerHTML=S.photos.map(p=>{
      const actions=manage(current())?'<div class="fj-photo-actions">'+(!p.featured?'<button type="button" data-fj-cover="'+esc(p.id)+'">Make cover</button>':'<b>★ Cover</b>')+'<button type="button" data-fj-archive-photo="'+esc(p.id)+'">Archive</button></div>':'';
      return '<article class="fj-photo"><button type="button" class="fj-photo-img" data-fj-view-photo="'+esc(p.id)+'"><img src="'+esc(p.thumbData||'')+'" alt="'+esc(p.caption||'Family photo')+'" loading="lazy"></button><div><strong>'+esc(p.caption||p.originalName||'Family photo')+'</strong><small>'+esc(dateText(p.photoDate))+' · '+esc(p.contributorName||'Family member')+(p.sourceNote?' · '+esc(p.sourceNote):'')+'</small>'+actions+'</div></article>';
    }).join('')||'<p class="fj-hint">No photographs have been added yet.</p>';
  }
  function printEntries(items){
    if(!items.length)return notify('No memories to print.','error');
    const pages=items.map(e=>{
      const sections=[['Significance and history',e.meaning],['Preparations and materials',e.instructions],['Rituals and activities',e.rituals],['Food and recipes',e.food],['People and responsibilities',e.responsibilities],['Memories and lessons',e.memories]].filter(x=>String(x[1]||'').trim());
      return '<article><h1>'+esc(e.title)+'</h1><div class="meta">'+esc(dateText(e.eventDate))+' · '+esc(e.visibility)+' · '+esc(e.ownerName||'Family member')+'</div>'+(e.odiaName?'<h2>'+esc(e.odiaName)+'</h2>':'')+sections.map(x=>'<section><h2>'+esc(x[0])+'</h2><p>'+esc(x[1])+'</p></section>').join('')+'</article>';
    }).join('');
    const win=window.open('','familyHeritagePrint','width=900,height=800');if(!win)return notify('Allow pop-ups to print.','error');
    win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Family Heritage Journal</title><style>@page{size:A4;margin:16mm}body{font:14px/1.65 Georgia,serif;color:#29253a;max-width:760px;margin:28px auto}article{break-after:page}article:last-child{break-after:auto}h1{font-size:28px}h2{font:700 14px Arial;color:#5a48a1;margin:22px 0 5px}.meta{color:#6d687d;font:12px Arial}p{white-space:pre-wrap}</style></head><body>'+pages+'</body></html>');
    win.document.close();win.focus();win.print();
  }
  async function saveEntry(event){
    event.preventDefault();const payload={id:$('familyJournalEntryId').value,title:$('familyJournalTitle').value.trim(),odiaName:$('familyJournalOdiaName').value.trim(),eventDate:$('familyJournalEventDate').value,entryType:$('familyJournalEntryType').value,visibility:$('familyJournalVisibility').value,meaning:$('familyJournalMeaning').value.trim(),instructions:$('familyJournalInstructions').value.trim(),rituals:$('familyJournalRituals').value.trim(),food:$('familyJournalFood').value.trim(),responsibilities:$('familyJournalResponsibilities').value.trim(),memories:$('familyJournalMemories').value.trim()};
    $('familyJournalSave').disabled=true;status('Saving to the shared MyFamily archive…');
    try{
      const r=await call('familyJournalSave',payload);
      await call('familyJournalLinksSave',{guideId:r.id,links:payload.visibility==='FAMILY'?selectedLinks():[]});
      await load();await openEntry(r.id);status('Saved to MyFamily. Shared Family records are available in both dashboards.');notify('Family memory saved to the shared archive.','success');
    }catch(e){status(e.message,true);notify(e.message,'error');}
    finally{$('familyJournalSave').disabled=false;}
  }
  async function archiveEntry(){
    if(!S.id||!confirm('Archive this memory? Its story and photographs will be retained.'))return;
    try{await call('familyJournalArchive',{id:S.id});$('familyJournalEditor').classList.add('hidden');await load();notify('Memory archived.','success');}
    catch(e){notify(e.message,'error');}
  }
  async function uploadPhoto(){
    const e=current(),file=$('familyJournalPhotoFile').files[0];if(!e)return notify('Save the memory before adding photos.','error');
    if(!file)return notify('Choose a photo first.','error');
    if(file.size>8*1024*1024)return notify('SarNi bridge currently supports original photos up to 8 MB.','error');
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))return notify('Choose a JPG, PNG or WebP photo.','error');
    $('familyJournalUploadPhoto').disabled=true;
    try{
      const [original,thumb]=await Promise.all([new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>resolve(String(rd.result||''));rd.onerror=()=>reject(Error('Could not read photo'));rd.readAsDataURL(file);}),compressedJpeg(file,180,.58)]);
      await call('familyJournalPhotoAdd',{guideId:e.id,fileName:file.name,mimeType:file.type,originalBase64:original,thumbData:'data:image/jpeg;base64,'+thumb,caption:$('familyJournalPhotoCaption').value.trim(),photoDate:$('familyJournalPhotoDate').value,sourceNote:$('familyJournalPhotoSource').value.trim()});
      $('familyJournalPhotoFile').value='';$('familyJournalPhotoCaption').value='';$('familyJournalPhotoDate').value='';$('familyJournalPhotoSource').value='';
      await loadPhotos(e.id);notify('Photograph added to the shared Family archive.','success');
    }catch(error){notify(error.message||'Photo upload failed.','error');}
    finally{$('familyJournalUploadPhoto').disabled=false;}
  }
  async function viewPhoto(id){
    try{const r=await call('familyJournalPhotoGet',{id:id});$('familyJournalPhotoViewerImage').src=r.dataUrl;$('familyJournalPhotoViewer').showModal();}
    catch(e){notify(e.message||'Unable to open photo.','error');}
  }
  async function archivePhoto(id){
    if(!confirm('Archive this photograph? Its original stays in the private MyFamily Drive folder.'))return;
    try{await call('familyJournalPhotoArchive',{id:id});await loadPhotos(S.id);notify('Photograph archived.','success');}
    catch(e){notify(e.message||'Could not archive photo.','error');}
  }
  async function coverPhoto(id){
    try{await call('familyJournalPhotoCover',{id:id});await loadPhotos(S.id);notify('Cover photograph updated.','success');}
    catch(e){notify(e.message||'Could not change cover.','error');}
  }
  let bound=false;
  function bind(){
    if(bound)return;bound=true;
    $('familyJournalNew').addEventListener('click',clearEditor);
    $('familyJournalCloseEditor').addEventListener('click',()=>$('familyJournalEditor').classList.add('hidden'));
    $('familyJournalForm').addEventListener('submit',saveEntry);
    $('familyJournalArchive').addEventListener('click',archiveEntry);
    $('familyJournalPrintEntry').addEventListener('click',()=>{const e=current();if(e)printEntries([e]);});
    $('familyJournalPrintList').addEventListener('click',()=>printEntries(filtered()));
    ['familyJournalSearch','familyJournalTypeFilter','familyJournalVisibilityFilter','familyJournalYearFilter'].forEach(id=>$(id).addEventListener(id==='familyJournalSearch'?'input':'change',render));
    $('familyJournalList').addEventListener('click',e=>{const b=e.target.closest('[data-fj-open]');if(b)openEntry(b.dataset.fjOpen);});
    $('familyJournalUploadPhoto').addEventListener('click',uploadPhoto);
    $('familyJournalPhotoGallery').addEventListener('click',e=>{const v=e.target.closest('[data-fj-view-photo]'),a=e.target.closest('[data-fj-archive-photo]'),c=e.target.closest('[data-fj-cover]');if(v)viewPhoto(v.dataset.fjViewPhoto);if(a)archivePhoto(a.dataset.fjArchivePhoto);if(c)coverPhoto(c.dataset.fjCover);});
    $('familyJournalPhotoViewerClose').addEventListener('click',()=>$('familyJournalPhotoViewer').close());
    $('familyJournalVisibility').addEventListener('change',()=>linkPermissions($('familyJournalVisibility').value,true));
  }
  window.SarniFamilyActivities={load:async function(){bind();await load();},refresh:load};
})();