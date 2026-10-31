/* SarNi v20.10.1 — Optional diary/stock notes through existing no-login Quick Expense link.
   Permissions are individually enabled by admin. No private existing records exposed. */
(()=>{'use strict';
const $=id=>document.getElementById(id);const bridge=window.SarNiQeBridge;if(!bridge)return;
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
function updateMonthlyLabel(){const value=$('qeNoteDate')?.value||today();const match=/^(\d{4})-(\d{2})-\d{2}$/.exec(value);const y=match?Number(match[1]):new Date().getFullYear(),m=match?Number(match[2]):new Date().getMonth()+1;const month=(m>=1&&m<=12)?new Intl.DateTimeFormat('en-IN',{month:'long',year:'numeric'}).format(new Date(y,m-1,1)):'selected month';if($('qeMonthlyMonth'))$('qeMonthlyMonth').textContent=month;}
let permissions={allowDiary:false,allowStock:false,allowRecentView:false},mode='expense',busy=false,entryId='';
function uniqueId(){const bytes=new Uint8Array(20);crypto.getRandomValues(bytes);return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');}
function status(message,error=false){const x=$('qeNoteStatus');x.textContent=message||'';x.style.color=error?'#ad253b':'#116c4b';}
function setMode(next){if(next==='diary'&&!permissions.allowDiary)return;if(next==='wisdom'&&!permissions.allowDiary)return;if(next==='stock'&&!permissions.allowStock)return;mode=next;$('entryArea').hidden=next!=='expense';$('qeNoteArea').hidden=next==='expense';
 $('qeStockCompanyWrap').hidden=next!=='stock';$('qeStockSymbolWrap').hidden=next!=='stock';$('qeNoteHeading').textContent=next==='diary'?'Quick Diary':next==='wisdom'?'Investment Wisdom':'Quick Stock Diary';
 document.querySelectorAll('[data-qe-mode]').forEach(b=>b.classList.toggle('active',b.dataset.qeMode===mode));
 if(next!=='expense'){$('qeNoteText').focus();status('');}
}
async function refreshRecent(){if(!permissions.allowRecentView)return;
 try{const r=await bridge.callApi('qeRecent',{linkToken:bridge.token});if(!r?.ok)throw Error(r?.message||'Cannot load recent entries');
 const list=$('qeRecentSharedList');list.replaceChildren();(r.items||[]).forEach(item=>{const row=document.createElement('p');row.textContent=[item.entryDate,item.kind==='expense'?'₹'+Number(item.amount||0).toLocaleString('en-IN'):item.kind.toUpperCase(),item.title||'',item.text||''].filter(Boolean).join(' · ').slice(0,520);list.append(row);});
 if(!(r.items||[]).length){const p=document.createElement('p');p.textContent='No entries from this particular link yet.';list.append(p);}
 }catch(e){const p=document.createElement('p');p.textContent='Recent entries not available: '+e.message;$('qeRecentSharedList').replaceChildren(p);}}
async function init(){if(!bridge.token)return;$('qeNoteDate').value=today();updateMonthlyLabel();$('qeNoteDate').addEventListener('change',updateMonthlyLabel);entryId=uniqueId();
 try{const r=await bridge.callApi('qeInfo',{linkToken:bridge.token});permissions=r.quickAccess||permissions;if(!r?.ok)throw Error(r?.message||'Link unavailable');
 const bar=$('qeModeBar');bar.hidden=false;
 const bDiary=document.querySelector('[data-qe-mode="diary"]'),bStock=document.querySelector('[data-qe-mode="stock"]'),bWisdom=document.querySelector('[data-qe-mode="wisdom"]');
 bDiary.hidden=!permissions.allowDiary;bStock.hidden=!permissions.allowStock;bWisdom.hidden=!(permissions.allowDiary);
 if(!permissions.allowDiary&&!permissions.allowStock){bar.hidden=true;}
 $('qeRecentShared').hidden=!permissions.allowRecentView;
 if(permissions.allowRecentView)await refreshRecent();
 }catch(e){console.warn('SarNi Quick Entry permission discovery unavailable:',e.message);}
}
async function save(event){event.preventDefault();if(busy||mode==='expense')return;if(mode==='wisdom'&&!permissions.allowDiary){status('Investment Wisdom is not enabled for this link.',true);return;}
 if(navigator.onLine===false){status('Connect to the internet to save this note; no entry was sent.',true);return;}
 const text=$('qeNoteText').value.trim();if(!text){status('Please write a note.',true);return;}
 if(mode==='stock'&&!$('qeStockCompany').value.trim()){status('Enter company name.',true);return;}
 busy=true;$('qeNoteSave').disabled=true;status('Saving…');try{
 const note={entryDate:$('qeNoteDate').value||today(),title:$('qeNoteTitle').value.trim(),text,tags:(mode==='wisdom'?[ 'investment-wisdom', $('qeNoteTags').value.trim()].filter(Boolean).join(', '):$('qeNoteTags').value.trim()),important:$('qeNoteImportant').checked,monthlyHighlight:$('qeNoteMonthly').checked,companyName:$('qeStockCompany').value.trim(),symbol:$('qeStockSymbol').value.trim()};
 const result=await bridge.callApi('qeQuickNote',{linkToken:bridge.token,entryId,kind:mode==='wisdom'?'diary':mode,note});if(!result?.ok)throw Error(result?.message||'Unable to confirm save');
 entryId=uniqueId();status('✓ Saved to private SarNi '+(mode==='diary'?'Diary':mode==='wisdom'?'Diary (tagged Investment Wisdom)':'Stock Research')+'.');
 ['qeNoteTitle','qeNoteText','qeNoteTags'].forEach(id=>{$(id).value='';});$('qeNoteMonthly').checked=false;$('qeNoteImportant').checked=false;
 if(permissions.allowRecentView)void refreshRecent();$('qeNoteText').focus();
 }catch(e){status('Save not confirmed: '+e.message+'. Check before retrying. The entry reference is preserved to prevent duplicates.',true);}
 finally{busy=false;$('qeNoteSave').disabled=false;}
}
document.querySelectorAll('[data-qe-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.qeMode)));
$('qeNoteForm')?.addEventListener('submit',save);$('qeRecentReload')?.addEventListener('click',refreshRecent);
init();
})();
