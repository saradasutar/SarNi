/* SarNi Quick Expense — public submission-only page. No account session is used. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const apiUrl=String(window.PORTFOLIO_CONFIG?.API_URL||'').trim();
const secret=(location.hash||'').replace(/^#(?:token=)?/,'').trim();
let ready=false, categories=[],busy=false,entryId='',recent=[];
const dateToday=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
function newId(){const bytes=new Uint8Array(20);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
function request(action,payload){
 return new Promise((resolve,reject)=>{
  if(!/^https:\/\/script\.google\.com\/macros\/s\//.test(apiUrl)){reject(new Error('The dashboard backend is not configured.'));return;}
  const requestId='mfreq_'+newId()+'_'+newId(), body={action,...payload,transport:'hybrid',clientOrigin:location.origin,requestId};
  const frame=document.createElement('iframe'),form=document.createElement('form'),field=document.createElement('input');
  frame.name=requestId+'_frame';frame.style.cssText='position:absolute;width:0;height:0;opacity:0;left:-9999px';frame.setAttribute('aria-hidden','true');
  form.method='POST';form.action=apiUrl;form.target=frame.name;form.style.display='none';field.type='hidden';field.name='payload';field.value=JSON.stringify(body);form.append(field);
  let done=false,timeout=null,pollTimer=null,pollInFlight=false;
  const cleanup=()=>{
   clearTimeout(timeout);clearInterval(pollTimer);removeEventListener('message',onMessage);
   setTimeout(()=>{try{frame.remove();form.remove();}catch(e){}},0);
  };
  const finish=(result,error)=>{if(done)return;done=true;cleanup();if(error){reject(error);return;}
   if(!result?.ok){reject(new Error(result?.message||'Could not complete the request.'));return;}resolve(result);
  };
  const onMessage=e=>{try{const host=new URL(e.origin).hostname.toLowerCase();if(!(host==='script.google.com'||host==='script.googleusercontent.com'||host.endsWith('.googleusercontent.com')))return;}
   catch{return;}const x=e.data;if(x?.__myfinanceDirectResult===true&&x.requestId===requestId)finish(x.payload);
  };
  addEventListener('message',onMessage);
  document.body.append(frame,form);
  timeout=setTimeout(()=>finish(null,new Error('Connection timed out. Check your connection before trying again.')),42000);
  setTimeout(()=>{
   if(done)return;
   pollTimer=setInterval(()=>{
    if(done||pollInFlight)return;pollInFlight=true;
    const cb='sarniQeCallback_'+newId().slice(0,16);
    const script=document.createElement('script');
    const stop=()=>{pollInFlight=false;script.remove();try{delete window[cb];}catch(e){}};
    window[cb]=r=>{stop();if(r?.ready&&r.requestId===requestId)finish(r.payload);};
    script.onerror=stop;
    script.src=apiUrl+'?action=pollResult&requestId='+encodeURIComponent(requestId)+'&callback='+cb;
    document.head.append(script);
    setTimeout(()=>{if(window[cb])stop();},2500);
   },2100);
  },2200);
  try{form.submit();}catch(e){finish(null,e);}
 });
}
function setNotice(message){$('notice').textContent=message||'';}
function fillCategory(list){
 categories=Array.isArray(list)?list:[];
 $('category').replaceChildren(new Option('Choose category',''));
 for(const c of categories)$('category').add(new Option(c.name,c.name));
}
function fillSubcats(){
 const x=categories.find(c=>c.name===$('category').value);
 $('subcategory').replaceChildren(new Option('None',''));
 for(const v of (x?.subcategories||[]))$('subcategory').add(new Option(v,v));
}
async function initialize(){
 $('dateSpent').value=dateToday();
 if(!/^[a-f0-9]{96}$/i.test(secret)){setNotice('This link is incomplete. Ask the administrator to share a fresh Quick Expense link.');return;}
 if(!apiUrl){setNotice('Backend address unavailable.');return;}
 try{
 const r=await request('qeInfo',{linkToken:secret});
 $('trip').textContent=r.label||'Quick Expense';$('expiry').textContent=r.neverExpires?'Valid until the administrator disables this link.':'Valid until '+new Date(r.expiresAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})+'. Administrator can revoke the link earlier.';
 fillCategory(r.categories);$('payerOptions').replaceChildren();
 for(const p of (r.payers||[]))$('payerOptions').append(new Option(p));
 $('category').addEventListener('change',fillSubcats);
 if(!categories.length){setNotice('Ask the administrator to create an expense category in SarNi first.');return;}
 entryId=newId();ready=true;setNotice('');$('entryArea').hidden=false;
 }catch(e){setNotice(e.message||'Unable to open expense link.');}
}
async function onSubmit(e){
 e.preventDefault();if(!ready||busy)return;
 const form=$('qeForm');if(!form.reportValidity())return;
 const payload={amount:Number($('amount').value),reason:$('reason').value.trim(),category:$('category').value,
  subcategory:$('subcategory').value,dateSpent:$('dateSpent').value,paidBy:$('paidBy').value.trim(),
  enteredBy:$('enteredBy').value.trim(),paidTo:$('paidTo').value.trim(),notes:$('notes').value.trim()};
 if(!payload.paidBy){setNotice('Choose or type who paid.');return;}
 busy=true;$('save').disabled=true;$('save').textContent='Saving expense…';setNotice('');$('success').textContent='';
 try{
  const result=await request('qeSubmit',{linkToken:secret,entryId,expense:payload});
  if(!result.duplicate){recent.unshift({amount:payload.amount,reason:payload.reason,paidBy:payload.paidBy});recent=recent.slice(0,4);}
  $('recent').hidden=!recent.length;$('recentList').replaceChildren();
  for(const x of recent){const p=document.createElement('p');p.textContent='₹'+x.amount.toLocaleString('en-IN')+' · '+x.reason+' · Paid by '+x.paidBy;$('recentList').append(p);}
  $('success').textContent=result.duplicate?'Already saved — no duplicate added.':'✓ Saved to SarNi expense register.';
  entryId=newId();
  const rememberPayer=$('paidBy').value, rememberCategory=$('category').value, rememberEntered=$('enteredBy').value;
  form.reset();$('dateSpent').value=dateToday();$('paidBy').value=rememberPayer;$('category').value=rememberCategory;$('enteredBy').value=rememberEntered;fillSubcats();
  $('amount').focus({preventScroll:true});
 }catch(error){setNotice(error.message||'Save failed.');}
 finally{busy=false;$('save').disabled=false;$('save').textContent='✓ Save another expense';}
}
$('qeForm').addEventListener('submit',onSubmit);
initialize();
})();
