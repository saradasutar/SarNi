/* SarNi 11: non-invasive Book Writing polish and an admin share-link layout helper.
   Does not change server permissions, write records, or persist private link tokens. */
(()=>{
'use strict';
const style=document.createElement('style');
style.textContent=`
#booksSection .books-list-view>.panel-head{background:linear-gradient(125deg,#f6f0ff,#eef5ff 60%,#f2faf8);padding:20px;border:1px solid #dfd9f6;border-radius:18px;margin-bottom:16px}
#booksSection .books-list-view>.panel-head h2{font-size:clamp(23px,2.7vw,33px);letter-spacing:-.035em;color:#282a59}
#booksSection .books-grid{gap:16px}
#booksSection .books-grid>*{border-radius:18px!important;transition:transform .15s ease,box-shadow .15s ease}
@media(hover:hover){#booksSection .books-grid>*:hover{transform:translateY(-2px);box-shadow:0 10px 28px #47368b1c}}
#booksSection .book-detail-view>.panel-head{background:linear-gradient(110deg,#f7f2ff,#f4faff);padding:18px;border:1px solid #e6e1f4;border-radius:17px;margin:13px 0}
#booksSection .book-detail-grid{gap:16px}
#booksSection .book-chapters-list>*{border-radius:12px}
#sarni11AdminTabs{border:1px solid #dfd8ee;border-radius:17px;padding:17px;margin:15px 0;background:linear-gradient(120deg,#fcfaff,#f7f9ff)}
#sarni11AdminTabs h3{margin:0 0 7px;color:#3c2e71;font-size:19px}
#sarni11AdminTabs p{color:#64708a;font-size:13px;line-height:1.55}
#sarni11AdminTabs label{display:block;font-weight:750;font-size:13px;margin:12px 0 5px}
#sarni11AdminTabs input,#sarni11AdminTabs select{box-sizing:border-box;width:100%;min-height:42px;background:#fff;border:1px solid #ccc8e2;border-radius:9px;padding:8px 11px;font:inherit}
#sarni11AdminTabs .sarni11-layout-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}
#sarni11AdminTabs button{min-height:40px;border-radius:9px;padding:9px 12px;background:#6548aa;color:#fff;border:0;font-weight:750;cursor:pointer}
#sarni11AdminTabs small{display:block;color:#695987;margin-top:9px;line-height:1.5}
`;
document.head.append(style);
const mount=()=>{const parent=document.getElementById('adminSettingsSection');if(!parent||document.getElementById('sarni11AdminTabs'))return;
const box=document.createElement('article');box.id='sarni11AdminTabs';
box.innerHTML=`<h3>📖 Quick Link · Temporary Book Writing Tab</h3>
<p>Create a shareable-link view that temporarily shows Book Writing in place of one tab. The hidden tab and all its data remain in the backend. This is a link-layout option, not a change to access permissions.</p>
<label for="sarni11BaseLink">Existing private Quick Entry URL</label>
<input id="sarni11BaseLink" type="url" autocomplete="off" spellcheck="false" placeholder="Paste the private /SarNi/q/?k=… URL (never share publicly)">
<label for="sarni11Replace">Temporarily replace tab</label>
<select id="sarni11Replace"><option value="stock">Stock Note</option><option value="expense">Expense</option><option value="diary">Diary</option><option value="office">Office Diary</option><option value="investment">Investment</option><option value="family">Family Expense</option></select>
<div class="sarni11-layout-actions"><button type="button" id="sarni11CopyLink">Copy Book Writing Link</button><button type="button" id="sarni11RestoreLink">Copy Original Six-Tab Link</button></div>
<small id="sarni11LinkStatus">No backend change is required for this temporary presentation. Book Writing drafts on the quick link are saved only in the user's browser until the Book Writing backend route is available.</small>`;
parent.append(box);
const $=id=>document.getElementById(id);
const create=(book)=>{const raw=$('sarni11BaseLink').value.trim();const url=new URL(raw);if(url.origin!==location.origin||!/^\/SarNi\/q\/?(?:index\.html)?$/.test(url.pathname)||!url.searchParams.get('k'))throw Error('Enter a valid SarNi private Quick Entry URL with its key.');url.searchParams.delete('book');url.searchParams.delete('replace');if(book){url.searchParams.set('book','1');url.searchParams.set('replace',$('sarni11Replace').value);}return url.href;};
const copy=async book=>{try{const value=create(book);await navigator.clipboard.writeText(value);$('sarni11LinkStatus').textContent=(book?'Book Writing link':'Original six-tab link')+' copied. Treat it as private: it contains your existing link key.';}catch(e){$('sarni11LinkStatus').textContent=String(e.message||e)+'. Clipboard access may require HTTPS and a browser permission.';}};
$('sarni11CopyLink').onclick=()=>copy(true);$('sarni11RestoreLink').onclick=()=>copy(false);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
