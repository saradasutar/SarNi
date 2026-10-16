/* SarNi Smart Paste v20.8.3 — local, review-first parser. No clipboard access or external AI calls. */
(function(root){'use strict';
  const ISO=/^\d{4}-\d{2}-\d{2}$/;
  const MONTHS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12};
  function validDate(y,m,d){const k=new Date(Date.UTC(+y,+m-1,+d));return +y>=1900&&+y<=2105&&k.getUTCFullYear()===+y&&k.getUTCMonth()+1===+m&&k.getUTCDate()===+d;}
  function iso(y,m,d){return validDate(y,m,d)?String(y).padStart(4,'0')+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'):'';}
  function findDate(text, inheritedYear){
    const s=String(text||'').replace(/\u00a0/g,' ');let m;
    // YYYY-MM-DD is unambiguous; Indian slash dates are DD/MM/YYYY.
    if((m=s.match(/\b(20\d{2}|19\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/)))return iso(m[1],m[2],m[3]);
    if((m=s.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](19\d{2}|20\d{2})\b/)))return iso(m[3],m[2],m[1]);
    if((m=s.match(/\b(\d{1,2})(?:st|nd|rd|th)?[ \-]+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[, \-]+(19\d{2}|20\d{2})\b/i)))return iso(m[3],MONTHS[m[2].slice(0,3).toLowerCase()],m[1]);
    if((m=s.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[ \-]+(\d{1,2})(?:st|nd|rd|th)?[,]?[ \-]+(19\d{2}|20\d{2})\b/i)))return iso(m[3],MONTHS[m[1].slice(0,3).toLowerCase()],m[2]);
    if(inheritedYear&&(m=s.match(/\b(\d{1,2})(?:st|nd|rd|th)?[ \-]+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i)))return iso(inheritedYear,MONTHS[m[2].slice(0,3).toLowerCase()],m[1]);
    return '';
  }
  function amount(text){let m=String(text).match(/(?:₹|\bINR\s*|\bRs\.?\s*)([\d,]+(?:\.\d{1,2})?)/i);
    if(!m)m=String(text).match(/\b(?:amount|fare|total|cost|paid|spent|price|charge|expense|budget)\s*[:=]?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)\b/i);
    const value=m?Number(m[1].replace(/,/g,'')):0;return Number.isFinite(value)&&value>0&&value<10000000000?value:0;
  }
  function time(text){const s=String(text||'');let m=s.match(/\b([01]?\d|2[0-3]):([0-5]\d)\s*(AM|PM)?\b/i);
    if(m){let h=+m[1],mins=+m[2];if(m[3]){if(h===12)h=0;if(m[3].toUpperCase()==='PM')h+=12;}return String(h).padStart(2,'0')+':'+String(mins).padStart(2,'0');}
    m=s.match(/\b(1[0-2]|[1-9])\s*(AM|PM)\b/i);if(!m)return '';
    let h=+m[1];if(h===12)h=0;if(m[2].toUpperCase()==='PM')h+=12;return String(h).padStart(2,'0')+':00';
  }
  function extractTravel(text){const match=String(text).match(/\b(?:from\s+)?([\p{L} .]{2,28}?)\s+(?:to|→|->)\s+([\p{L} .]{2,28}?)(?=\s+(?:at|on|dep(?:arture)?|arriv(?:al|e)|₹|Rs\.?|INR|\d{1,2}:\d{2}|flight|train|fare|paid|cost)|\s*$)/iu);
    return match?{departureCity:match[1].replace(/^(?:flight|train|bus|from)\s+/i,'').trim(),arrivalCity:match[2].trim()}:{departureCity:'',arrivalCity:''};}
  function chooseTitle(line){return line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/,'').replace(/\s+/g,' ').trim().slice(0,160);}
  function classify(line){const travel=/\b(flight|airport|boarding|departure|depart|arrival|arrive|train|railway|itinerary|check[ -]?in|check[ -]?out|hotel|stay|visit|tour|travell?ing|journey|bus|meeting)\b/i.test(line);
    const planned=/\b(estimate|estimated|plan(?:ned)?|budget|due|to pay|payable|expected|advance booking|quotation)\b/i.test(line);
    const actuallyPaid=/\b(paid|spent|debited|purchased|bought|payment successful|transaction|receipt|expense)\b/i.test(line);
    const type=/\bflight|airport|boarding\b/i.test(line)?'FLIGHT':/\btrain|railway\b/i.test(line)?'TRAIN':'OTHER';return {travel,planned,actuallyPaid,type};
  }
  function categoryHint(line){if(/\b(flight|train|bus|taxi|cab|uber|ola|petrol|fuel|toll|travel|airport)\b/i.test(line))return 'travel';
    if(/\b(hotel|stay|room|accommodation)\b/i.test(line))return 'travel';
    if(/\b(food|lunch|breakfast|dinner|restaurant|snack|meal|tea)\b/i.test(line))return 'food';
    if(/\b(electricity|water|internet|phone|rent|bill)\b/i.test(line))return 'utilities';return 'other';}
  function parse(text){const all=String(text||'').replace(/\r\n/g,'\n').split('\n').map(s=>s.trim()).filter(Boolean).slice(0,80);
    const result=[];let year=0,currentDate='',skipped=0;
    for(const raw of all){const line=raw.replace(/^[-*•]\s*/,'').trim();if(!line||/^\s*(?:total|grand total|summary|itinerary|expenses?)\s*[:\-]?\s*$/i.test(line))continue;
      const explicitYear=line.match(/\b(19\d{2}|20\d{2})\b/);if(explicitYear)year=+explicitYear[1];
      const found=findDate(line,year),money=amount(line),cl=classify(line),clock=time(line);
      // A bare date establishes the section heading. Never create a record for it alone.
      if(found&&!money&&!cl.travel&&line.length<27){currentDate=found;continue;}
      const day=found||currentDate;
      if(!money&&!cl.travel){skipped++;continue;}
      const title=chooseTitle(line),travel=extractTravel(line);
      const item={date:day,title,notes:raw.slice(0,1000),time:clock,amount:money,categoryHint:categoryHint(line),departureCity:travel.departureCity,arrivalCity:travel.arrivalCity,eventKind:cl.type,needsReview:!day||(!money&&!cl.travel)};
      if(cl.travel)result.push({...item,kind:'CALENDAR',amount:0,needsReview:!day});
      if(money){const kind=cl.actuallyPaid&&!cl.planned?'EXPENSE':'PLAN';result.push({...item,kind,needsReview:!day||(!cl.actuallyPaid&&!cl.planned)});}
    }
    return {items:result.slice(0,30),skipped,overflow:result.length>30,sourceCount:all.length};
  }
  function escapeHTML(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function hashString(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(16);}
  function UI(){const $=id=>document.getElementById(id),dialog=$('sarniSmartPasteDialog');if(!dialog)return;
    const body=$('sarniSmartPasteRows'),raw=$('sarniSmartPasteText'),status=$('sarniSmartPasteStatus'),save=$('sarniSmartPasteSave');let entries=[],busy=false;
    const currentCategories=()=>Array.isArray(root.state?.expenseCategories)?root.state.expenseCategories:(typeof state!=='undefined'?state.expenseCategories:[]);
    const matchingCat=h=>{const cats=currentCategories(),candidate=cats.find(c=>String(c.name).toLowerCase().includes(h));return candidate?.name||cats.find(c=>String(c.name).toLowerCase()==='other')?.name||cats[0]?.name||'Other';};
    function setStatus(s){status.textContent=s;}
    function render(){body.innerHTML=entries.map((e,i)=>`<div class="sarni-sp-row" data-index="${i}"><label class="sarni-sp-check"><input type="checkbox" data-field="selected" ${e.selected?'checked':''}> Include</label><div class="sarni-sp-fields"><label>Destination<select data-field="kind"><option value="EXPENSE" ${e.kind==='EXPENSE'?'selected':''}>Actual expense</option><option value="PLAN" ${e.kind==='PLAN'?'selected':''}>Planned expense</option><option value="CALENDAR" ${e.kind==='CALENDAR'?'selected':''}>Calendar itinerary</option></select></label><label>Date<input type="date" data-field="date" value="${escapeHTML(e.date)}" required></label><label>Description<input data-field="title" maxlength="160" value="${escapeHTML(e.title)}" required></label><label class="sarni-sp-amount" ${e.kind==='CALENDAR'?'hidden':''}>Amount ₹<input type="number" data-field="amount" step="0.01" min="0.01" value="${e.amount||''}"></label><label class="sarni-sp-category" ${e.kind==='CALENDAR'?'hidden':''}>Category<select data-field="category">${currentCategories().map(c=>`<option value="${escapeHTML(c.name)}" ${c.name===e.category?'selected':''}>${escapeHTML(c.name)}</option>`).join('')||'<option>Other</option>'}</select></label></div><p class="sarni-sp-row-info">${e.needsReview?'<strong>Review suggested classification/date</strong> · ':''}${e.time?'Time '+escapeHTML(e.time)+' · ':''}${escapeHTML(e.notes).slice(0,280)}</p></div>`).join('');save.disabled=!entries.some(x=>x.selected)||busy;}
    function readEdits(){body.querySelectorAll('[data-index]').forEach(row=>{const e=entries[+row.dataset.index];for(const f of row.querySelectorAll('[data-field]')){const k=f.dataset.field;e[k]=k==='selected'?f.checked:k==='amount'?Number(f.value):f.value;}if(e.kind==='CALENDAR')e.amount=0;});}
    function onParse(){if(busy)return;const r=parse(raw.value);entries=r.items.map(e=>({...e,category:matchingCat(e.categoryHint),selected:true}));render();setStatus(`${entries.length} entries identified. ${r.skipped?`${r.skipped} other lines ignored. `:''}${r.overflow?'Only the first 30 entries are shown. ':''}Review the dates, category and payment status before saving.`);}
    function open(){if(typeof state==='undefined'||!state.token){setStatus('Sign in to use Smart Paste.');return;}raw.value='';entries=[];render();setStatus('Nothing is saved until you review and confirm.');if(typeof dialog.showModal==='function')dialog.showModal();else dialog.hidden=false;raw.focus();}
    function close(){if(busy)return;if(typeof dialog.close==='function')dialog.close();else dialog.hidden=true;}
    async function onSave(){if(busy)return;readEdits();const accepted=entries.filter(e=>e.selected);if(!accepted.length){setStatus('Choose at least one entry.');return;}
      for(let i=0;i<accepted.length;i++){const e=accepted[i];if(!ISO.test(e.date)||!validDate(...e.date.split('-').map(Number))){setStatus(`Entry ${i+1}: enter a valid date.`);return;}
        if(!e.title.trim()){setStatus(`Entry ${i+1}: a description is required.`);return;}
        if(e.kind!=='CALENDAR'&&(!Number.isFinite(e.amount)||e.amount<=0||!e.category)){setStatus(`Entry ${i+1}: amount and expense category are required.`);return;}}
      busy=true;save.disabled=true;setStatus('Saving reviewed records securely…');
      try{const owner=state.username,request={entries:accepted.map(x=>({kind:x.kind,title:x.title,date:x.date,notes:x.notes,time:x.time,amount:x.amount,category:x.category,eventKind:x.eventKind,departureCity:x.departureCity,arrivalCity:x.arrivalCity})),sourceHash:hashString(raw.value)};
        const res=await api('importSmartPaste',request,{retry:false});if(!res?.ok)throw Error(res?.message||'Could not save.');
        if(owner!==state.username){setStatus('Account changed; refresh your dashboard before continuing.');return;}
        const failures=Array.isArray(res.errors)?res.errors:[];
        setStatus(`Saved ${res.created||0} records · ${res.duplicate||0} already imported. ${failures.length?'Some entries failed and can be retried. ':''}Refreshing dashboard…`);
        try{const fresh=await api('bootstrap',{}, {retry:false});if(fresh?.ok&&fresh?.data){applyBootstrap(fresh.data);saveCache(fresh.data);}}catch(refreshErr){setStatus('Records saved. Refresh the dashboard to display them: '+refreshErr.message);return;}
        if(failures.length){setStatus(`Saved ${res.created||0}; skipped ${res.duplicate||0} duplicate(s). Entry ${Number(failures[0].index)+1} could not be saved: ${failures[0].message}. You may review and retry; already saved entries will be skipped.`);}
        else {entries=[];raw.value='';render();setStatus(`Done: ${res.created||0} new record(s), ${res.duplicate||0} duplicates skipped.`);}
      }catch(e){setStatus('Nothing more was submitted automatically. '+(e.message||'Save failed')+' — review before retrying.');}
      finally{busy=false;save.disabled=!entries.some(x=>x.selected);}
    }
    document.addEventListener('click',e=>{if(e.target.closest('[data-sarni-smartpaste-open]')){e.preventDefault();open();}});
    $('sarniSmartPasteParse')?.addEventListener('click',onParse);save?.addEventListener('click',onSave);$('sarniSmartPasteClose')?.addEventListener('click',close);
    body.addEventListener('change',e=>{if(e.target.matches('[data-field]')){readEdits();render();}});
    body.addEventListener('input',e=>{if(e.target.matches('[data-field]')){const el=e.target;const row=el.closest('[data-index]');const x=entries[Number(row?.dataset.index)];if(!x)return;x[el.dataset.field]=el.dataset.field==='amount'?Number(el.value):el.value;}});
    dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
    raw.addEventListener('paste',()=>{setTimeout(()=>{if(raw.value.length>0)onParse();},80);});
  }
  const apiObj={parse,findDate,amount,time,extractTravel,categoryHint,escapeHTML};root.SarNiSmartPaste=apiObj;
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',UI,{once:true});else UI();}
})(typeof window!=='undefined'?window:globalThis);
