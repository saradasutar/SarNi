/* SarNi optional Father Memoir starter, isolated from core finance / diary features.
 * Does not store manuscript in GitHub; uses existing signed-in book API.
 * Server permissions are enforced by the existing SarNi backend, not here.
 */
(function () {
  'use strict';
  const MEMOIR_MARKER = 'Dhruba Charan Sutar';
  const GROUPS = [
    { name:'Prologue', odia:'ଆରମ୍ଭ କଥା', items:[
      ['Before the Story Begins · କାହାଣୀ ଆରମ୍ଭ ପୂର୍ବରୁ', 'Look for one verified, ordinary but revealing moment. Record whose memory it is and whether a conversation is reconstructed.']
    ]},
    { name:'Part I · The Village Years', odia:'ଗାଁର ଦିନଗୁଡ଼ିକ', items:[
      ['The Village (ଗାଁ)', 'Birthplace, surroundings, social and economic background. Find the place name, period and old photographs.'],
      ['A Childhood Home (ପିଲାଦିନର ଘର)', 'Parents, siblings and everyday household life. Separate eyewitness recollections from family stories.'],
      ['When He Was Nine (ନଅ ବର୍ଷ ବୟସରେ)', 'His mother died when he was nine. Document what is known, how the event was remembered and what remains uncertain.'],
      ["The Days That Followed (ତା' ପରର ଦିନଗୁଡ଼ିକ)", 'Who looked after him? What changed in the household and in his daily routine? Record actual incidents only.']
    ]},
    { name:'Part II · The Years of Learning', odia:'ପଢ଼ା ଓ ସଂଘର୍ଷର ବର୍ଷ', items:[
      ['The Road to School (ସ୍କୁଲକୁ ବାଟ)', 'School names, distances, teachers, costs, dates, and his earliest experiences of education.'],
      ['Between Work and Books (କାମ ଓ ପାଠ ଭିତରେ)', 'He worked while studying. Identify the precise kind of work, schedule, and the people who remember it.'],
      ['The Difficult Years (କଠିନ ବର୍ଷଗୁଡ଼ିକ)', 'Confirmed setbacks, decisions, support and turning points. Do not invent hardships for dramatic effect.'],
      ['The Road to Teaching (ଶିକ୍ଷକତାର ପଥେ)', 'Qualifications, job applications, first teaching post and reasons for becoming a teacher.']
    ]},
    { name:'Part III · A Life in the Town', odia:'ସହରରେ ଏକ ଜୀବନ', items:[
      ['A Different World (ଏକ ଭିନ୍ନ ଦୁନିଆ)', 'Life in the town where he worked as a teacher; what changed from his village upbringing?'],
      ['Inside the Classroom (ଶ୍ରେଣୀକକ୍ଷ ଭିତରେ)', 'Daily teaching, students, colleagues, school routines and specific remembered classroom events.'],
      ['The Life at Home (ଘର ଭିତରର ଜୀବନ)', 'Marriage, your mother, financial decisions, domestic life and differing family perspectives.'],
      ['Growing Up as His Sons (ବାପାଙ୍କ ଛାଇରେ ଆମ ପିଲାଦିନ)', 'Four sons, childhood memories, disagreements and education, without comparisons or boasting.']
    ]},
    { name:'Part IV · The Passing Years', odia:'ବିତିଯାଇଥିବା ବର୍ଷଗୁଡ଼ିକ', items:[
      ['The Headmaster (ପ୍ରଧାନଶିକ୍ଷକ)', 'His appointment and daily responsibilities as a high-school headmaster; seek colleagues’ and students’ accounts.'],
      ['After the Last School Bell (ଶେଷ ସ୍କୁଲ ଘଣ୍ଟି ପରେ)', 'Retirement from a town high school, routines, interests and changes afterward, as applicable.'],
      ['Four Different Roads (ଚାରିଟି ଭିନ୍ନ ବାଟ)', 'How education shaped the four sons’ paths. Keep this about relationships and choices, not professional status.'],
      ['The Man I Came to Know (ଯେଉଁ ମଣିଷକୁ ମୁଁ ଜାଣିଲି)', 'A candid son’s perspective: character, ordinary habits, misunderstandings and insights over time.']
    ]},
    { name:'Epilogue', odia:'ଶେଷ କଥା', items:[
      ['What Remains · ଯାହା ରହିଗଲା', 'What you know, what you cannot know, and why you wanted to tell his life honestly.']
    ]}
  ];
  const CHAPTERS = GROUPS.flatMap(group=>group.items);
  // Match by English chapter title rather than array position. A partially
  // created or manually reordered book must never open an unrelated chapter.
  function chapterKey(title) {
    return String(title||'').split(/[·(]/)[0].trim().replace(/^Chapter\s+\d+:?\s*/i,'').toLowerCase();
  }
  function chapterDisplayStatus(chapter,key) {
    const words=Number(chapter?.wordCount)||0;
    if(key==='the village'&&chapter?.status==='DRAFTING'&&words===0)return 'Collecting memories';
    return typeof CHAPTER_STATUS_LABEL==='object'?(CHAPTER_STATUS_LABEL[chapter?.status]||chapter?.status||'Not started'):String(chapter?.status||'Not started');
  }
  const $ = id => document.getElementById(id);
  const escapeText = text => String(text??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const fileSlug = text => String(text||'manuscript').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)||'manuscript';
  let working=false, lastSignature='';
  function isMemoir(book) {
    return Boolean(book && (
      String(book.id||'').startsWith('dhruba-charan-sutar-memoir-') ||
      (String(book.title||'').trim()==='The Story Before Ours' &&
       String(book.description||'').includes(MEMOIR_MARKER))
    ));
  }
  function status(message, error) {
    const e=$('sarniFatherBookStatus');
    if(e){ e.textContent=message; e.style.color=error?'#b42318':''; }
    if(error && typeof toast==='function')toast(message,'error');
  }
  function existingBook() {
    return Array.isArray(state.books)?state.books.find(isMemoir):null;
  }
  async function createOrContinue() {
    if(working)return;
    if(typeof state==='undefined' || !state.token){status('Please sign in to SarNi first.',true);return;}
    const button=$('sarniFatherBookStart');
    working=true; if(button)button.disabled=true;
    try{
      status('Checking your existing books…');
      const list=await api('listBooks',{});
      state.books=list.data.books||[];
      let book=existingBook();
      if(!book){
        const bookId='dhruba-charan-sutar-memoir-'+Date.now();
        const data={
          id:bookId, title:'The Story Before Ours', genre:'Literary memoir · Biography',
          description:'The life and times of Dhruba Charan Sutar. Raised in a poor rural family, he lost his mother at nine, worked while studying, later taught in a town, retired as a high-school headmaster, and raised four sons whose lives were shaped by education. Write candidly and avoid glorification. Working title; change it anytime.',
          status:'PLANNING',coverColor:'TEAL',targetWordCount:50000,targetDate:''
        };
        status('Creating your private book record…');
        const result=await api('saveBook',{book:data});
        state.books=result.data.books||[];
        book=state.books.find(b=>b.id===bookId)||data;
      }
      const detailResult=await api('bookDetail',{bookId:book.id});
      const detail=detailResult.data;
      if(detail.role!=='OWNER'&&detail.role!=='CO_AUTHOR'&&detail.role!=='EDITOR'){
        status('This account cannot create chapters in that book.',true);
        openBookDetail(book.id);return;
      }
      const existingTitles=new Set((detail.chapters||[]).map(x=>chapterKey(x.title)));
      let completed=0;
      for(const [title, prompt] of CHAPTERS){
        if(existingTitles.has(chapterKey(title))){completed++;continue;}
        status('Preparing chapters '+(completed+1)+' of '+CHAPTERS.length+'…');
        await api('saveChapter',{chapter:{
          bookId:book.id,id:'',title,status:chapterKey(title)==='the village'?'DRAFTING':'NOT_STARTED',content:'',
          assignedTo:'',notes:''
        }});
        existingTitles.add(chapterKey(title));completed++;
      }
      status('Ready: the outline and chapters are saved in your SarNi book.');
      openBookDetail(book.id);
    }catch(error){
      status('Some items could not be saved: '+(error.message||String(error))+
             '. Tap again to resume without repeating completed chapters.',true);
      try{await loadBooks();const book=existingBook();if(book)openBookDetail(book.id);}catch(_){}
    }finally{
      working=false;if(button)button.disabled=false;
      refreshOutline();
    }
  }
  function downloadBackup() {
    const detail=state.activeBookDetail;
    if(!detail || !isMemoir(detail.book))return;
    const payload={
      format:'SarNi Book Writing JSON Backup',exportedAt:new Date().toISOString(),
      book:detail.book,chapters:detail.chapters
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download='dhruba-charan-sutar-book-backup.json';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    status('Backup downloaded to your device. Keep the file private.');
  }
  function exportManuscript() {
    const detail=state.activeBookDetail;
    if(!detail || !isMemoir(detail.book))return;
    // Manuscript is generated LOCALLY from authenticated, already loaded
    // chapters. We do not publish family writing to GitHub or any third party.
    const book=detail.book;
    const chapters=detail.chapters||[];
    const pages=chapters.map((chapter,index)=>{
      const safeContent=typeof sarniChapterSafeHtml==='function'?
        sarniChapterSafeHtml(chapter.content||''):escapeText(chapter.content||'');
      return '<section class="chapter"><h2>'+escapeText(chapter.title)+'</h2>'+
        '<div class="chapter-text">'+safeContent+'</div></section>';
    }).join('\n');
    const html='<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'+
      '<meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<title>'+escapeText(book.title||'My Book')+'</title>'+
      '<style>body{max-width:780px;margin:auto;padding:40px 25px;color:#222;font:17px/1.8 Georgia,serif}'+
      'h1{text-align:center;font-size:34px;margin:2.5em 0 .2em}h2{font-size:24px;margin:1.6em 0 .8em}'+
      '.chapter{break-before:page;page-break-before:always}.chapter-text{white-space:normal;overflow-wrap:anywhere}'+
      'p{margin:0 0 1em}span[style*="background-color"]{print-color-adjust:exact;-webkit-print-color-adjust:exact}'+
      '@media print{body{padding:0;max-width:none;font-size:12pt}.chapter{break-before:page;page-break-before:always}}'+
      '</style></head><body><h1>'+escapeText(book.title||'My Book')+'</h1>'+
      '<p style="text-align:center">'+escapeText(book.genre||'Memoir')+'</p>'+
      pages+'</body></html>';
    const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;link.download=fileSlug(book.title)+'-manuscript.html';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    status('Manuscript exported. Open the HTML file in a browser to print or save as PDF. Keep it private.');
  }
  function refreshOutline() {
    const root=$('sarniFatherBookOutline');if(!root)return;
    const detail=typeof state!=='undefined'&&state.activeBookDetail;
    if(!detail || !isMemoir(detail.book)){
      root.hidden=true;lastSignature='';return;
    }
    const chapters=detail.chapters||[];
    const signature=String(detail.book.id)+'|'+chapters.map(c=>[
      c.id,c.title,c.status,c.wordCount
    ].join(':')).join('|');
    if(signature===lastSignature)return;
    lastSignature=signature;root.hidden=false;root.replaceChildren();
    const header=document.createElement('div');header.className='sfb-outline-head';
    const left=document.createElement('div');
    const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent='YOUR MANUSCRIPT · CLICK TO EDIT';
    const title=document.createElement('h3');title.textContent='Parts and chapters';
    const hint=document.createElement('p');hint.textContent='Tap a chapter to write, edit or improve it. Chapter bodies and Notes are initially blank. Keep memories, documents and family recollections separate from confirmed facts.';
    left.append(eyebrow,title,hint);
    const backup=document.createElement('button');backup.type='button';backup.className='secondary-button';backup.textContent='↓ Download backup';
    backup.addEventListener('click',downloadBackup);
    const actions=document.createElement('div');actions.className='sfb-download-actions';
    const manuscript=document.createElement('button');manuscript.type='button';manuscript.className='secondary-button';
    manuscript.textContent='↓ Export manuscript';manuscript.addEventListener('click',exportManuscript);
    actions.append(backup,manuscript);
    header.append(left,actions);root.appendChild(header);
    const wordCount=chapters.reduce((n,c)=>n+(Number(c.wordCount)||0),0);
    const completed=chapters.filter(c=>c.status==='DONE').length;
    const progress=document.createElement('p');progress.className='sfb-summary';
    progress.textContent=chapters.length+' sections · '+wordCount.toLocaleString('en-IN')+' words · '+completed+' marked done';
    root.appendChild(progress);
    let chapterNumber=0;
    const byTitle=new Map(chapters.map(c=>[chapterKey(c.title),c]));
    GROUPS.forEach((group,index)=>{
      const block=document.createElement('details');block.className='sfb-part';block.open=index<=1;
      const summary=document.createElement('summary');summary.textContent=group.name+'  /  '+group.odia;
      block.appendChild(summary);
      group.items.forEach((item)=>{
        const key=chapterKey(item[0]);
        const isCore=index>0&&index<5;
        if(isCore)chapterNumber++;
        const chapter=byTitle.get(key);
        const row=document.createElement('button');row.type='button';row.className='sfb-chapter';
        if(!chapter){row.disabled=true;row.textContent=(isCore?'Chapter '+chapterNumber+': ':'')+item[0]+' · Not created';}
        else {
          const main=document.createElement('span');main.textContent=(isCore?'Chapter '+chapterNumber+': ':'')+chapter.title;
          const prompt=document.createElement('small');prompt.className='sfb-chapter-prompt';prompt.textContent=item[1];
          const meta=document.createElement('small');meta.textContent=
            chapterDisplayStatus(chapter,key)+' · '+(Number(chapter.wordCount)||0).toLocaleString('en-IN')+' words';
          const body=document.createElement('span');body.className='sfb-chapter-description';body.append(main,prompt);
          row.append(body,meta);
          row.addEventListener('click',()=>openChapterModal(chapter));
        }
        block.appendChild(row);
      });
      root.appendChild(block);
    });
    if(chapters.some(c=>!CHAPTERS.some(item=>chapterKey(item[0])===chapterKey(c.title)))){
      const text=document.createElement('p');text.className='sfb-summary';
      text.textContent='Renamed or additional chapters are available in the standard chapter list below.';
      root.appendChild(text);
    }
    const caution=document.createElement('p');caution.className='sfb-caution';
    caution.textContent='Factual writing tip: keep verified details, family recollections and your own memories distinguishable. Never publish unfinished private family material on the public GitHub repository.';
    root.appendChild(caution);
  }
  function setup() {
    const actions=document.querySelector('#booksSection .books-list-view .book-toolbar-actions');
    if(actions && !$('sarniFatherBookStart')){
      const button=document.createElement('button');
      button.type='button';button.id='sarniFatherBookStart';
      button.className='primary-button sfb-start';
      button.textContent='✎ Start / continue Father’s Book';
      button.addEventListener('click',createOrContinue);
      actions.prepend(button);
      const message=document.createElement('div');message.id='sarniFatherBookStatus';
      message.className='sfb-status';message.setAttribute('role','status');
      actions.parentElement.insertAdjacentElement('afterend',message);
    }
    const detail=$('bookDetailView');
    if(detail && !$('sarniFatherBookOutline')){
      const outline=document.createElement('section');
      outline.id='sarniFatherBookOutline';outline.className='sfb-outline';outline.hidden=true;
      const insertion=detail.querySelector('.book-detail-grid');
      detail.insertBefore(outline,insertion||null);
    }
    const chapters=$('bookChaptersList'),name=$('bookDetailTitle');
    if(chapters)new MutationObserver(refreshOutline).observe(chapters,{childList:true});
    if(name)new MutationObserver(refreshOutline).observe(name,{childList:true});
    refreshOutline();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();
