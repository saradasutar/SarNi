/* SarNi private account recovery, Drive inventory and photo library UI v3.17.33 · email-only OTP. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const mk=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;if(cls)x.className=cls;return x;};
const auth=()=>{try{return Boolean(state?.token);}catch{return false;}};
const admin=()=>{try{return auth()&&isSarNiAdmin();}catch{return false;}};
const css=`.ssec-modal{position:fixed;inset:0;z-index:99999;background:#09192caa;padding:12px;display:flex;align-items:center;justify-content:center}.ssec-modal[hidden]{display:none}.ssec-window{background:white;color:#142243;width:min(560px,100%);max-height:92vh;overflow:auto;padding:18px;border-radius:18px;box-shadow:0 20px 70px #090f1f55}.ssec-window h2{margin:0 0 6px}.ssec-window label{font-size:13px;font-weight:700;display:block;margin:12px 0 5px}.ssec-window input,.ssec-window select{width:100%;min-height:44px;border:1px solid #acbad5;border-radius:9px;padding:10px;font:inherit}.ssec-window button{padding:10px 14px;border-radius:9px;border:0;cursor:pointer;font-weight:700;background:#e4eafa;color:#1d3d87}.ssec-window button.primary{background:#234bb5;color:#fff}.ssec-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.ssec-msg{font-weight:650;font-size:13px;white-space:pre-wrap;margin:12px 0}.ssec-card{background:#f2f5fd;border:1px solid #e1e6f4;border-radius:10px;padding:12px;margin:8px 0}.ssec-photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));gap:10px}.ssec-photo{border-radius:12px;background:#f1f4fb;padding:8px}.ssec-photo img{width:100%;height:110px;object-fit:cover;border-radius:8px}.ssec-muted{font-size:12px;color:#62708c}`;
const style=mk('style');style.textContent=css;document.head.append(style);
function dialog(title){let o=mk('div',undefined,'ssec-modal');o.hidden=true;o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',title);
 let w=mk('div',undefined,'ssec-window'),head=mk('h2',title),close=mk('button','✕ Close'),body=mk('div');close.type='button';close.onclick=()=>{o.hidden=true;};w.append(head,body,close);o.append(w);document.body.append(o);o.addEventListener('click',e=>{if(e.target===o)o.hidden=true;});return {open(){o.hidden=false;},close(){o.hidden=true;},body};}
function field(parent,label,name,type='text',placeholder=''){const a=mk('label',label),b=mk('input');b.name=name;b.type=type;b.placeholder=placeholder;a.append(b);parent.append(a);return b;}
function sel(parent,label,name,items){const l=mk('label',label),s=mk('select');s.name=name;for(const [v,text] of items)s.add(new Option(text,v));l.append(s);parent.append(l);return s;}
function status(node,text,error){node.textContent=text;node.style.color=error?'#b03349':'#22675f';}
function addBtn(parent,label,click,cls){const b=mk('button',label,cls);b.type='button';b.onclick=click;parent.append(b);return b;}
function resetFeature(){
 const form=$('loginForm');if(!form)return;
 const dia=dialog('Reset SarNi password');
 const p=mk('p','Reset your password using the email address verified earlier in SarNi. The one-time code expires in 10 minutes. Mobile numbers are not used for verification.','ssec-muted');dia.body.append(p);
 const username=field(dia.body,'Username','username');
 const code=field(dia.body,'6-digit email OTP','code','text','Enter email OTP');code.inputMode='numeric';code.maxLength=6;
 const password=field(dia.body,'New password','password','password','10+ characters, letters, number, symbol');
 const message=mk('p',undefined,'ssec-msg');dia.body.append(message);const actions=mk('div',undefined,'ssec-actions');dia.body.append(actions);
 addBtn(actions,'Send email OTP',async()=>{try{username.value=username.value.trim();const r=await api('ssecRequestReset',{username:username.value,channel:'EMAIL'},{retry:false});status(message,r.message||'Request received.');}catch(e){status(message,e.message,true);}},'primary');
 addBtn(actions,'Reset password',async()=>{try{const r=await api('ssecConfirmReset',{username:username.value.trim(),channel:'EMAIL',code:code.value.trim(),newPassword:password.value},{retry:false});status(message,r.message||'Password changed.');password.value='';}catch(e){status(message,e.message,true);}},'primary');
 const b=mk('button','Forgot password? Reset by verified email');b.type='button';b.className='text-button';b.style.cssText='display:block;max-width:100%;white-space:normal;margin:8px 0';b.onclick=()=>{username.value=$('loginUsername')?.value||'';dia.open();};
 form.append(b);
}
function profileFeature(){
 const target=$('changePasswordBtn')?.parentElement;if(!target)return;
 const dia=dialog('Email verification & contact details');
 dia.body.append(mk('p','Only email requires OTP verification and can be used to reset your password. You may save a mobile number for contact purposes without verification. Changing either contact requires your current password.','ssec-muted'));
 const stateText=mk('div',undefined,'ssec-card');dia.body.append(stateText);
 const email=field(dia.body,'Email address to verify','destination','email','name@example.com');
 const current=field(dia.body,'Current password','currentPassword','password');
 const code=field(dia.body,'Email OTP','code','text','6-digit code');code.inputMode='numeric';code.maxLength=6;
 const msg=mk('p',undefined,'ssec-msg');dia.body.append(msg);
 const row=mk('div',undefined,'ssec-actions');dia.body.append(row);
 async function load(){if(!auth())return;try{const r=await api('ssecUserContacts',{}, {retry:false});
  stateText.replaceChildren();
  const ep=mk('p','Email: '+(r.email||'not set')+(r.emailVerified?' ✓ Verified':' · Not verified'));
  const mp=mk('p','Mobile (optional): '+(r.mobile||'not set')+' · No verification required');
  stateText.append(ep,mp);
 }catch(e){status(msg,e.message,true);}}
 addBtn(row,'Send email verification OTP',async()=>{try{const r=await api('ssecBeginContact',{channel:'EMAIL',destination:email.value.trim(),currentPassword:current.value},{retry:false});status(msg,r.message||'Code sent.');}catch(e){status(msg,e.message,true);}},'primary');
 addBtn(row,'Confirm email OTP',async()=>{try{const r=await api('ssecConfirmContact',{channel:'EMAIL',code:code.value.trim()},{retry:false});status(msg,r.message||'Email verified.');current.value='';await load();}catch(e){status(msg,e.message,true);}},'primary');
 const phone=field(dia.body,'Mobile number (optional; no OTP)','mobile','tel','+919876543210');phone.autocomplete='tel';
 const phoneInfo=mk('p','Enter the number with country code, or leave it blank and save to remove your existing number. It is never used for OTP or password reset.','ssec-muted');dia.body.append(phoneInfo);
 const phoneRow=mk('div',undefined,'ssec-actions');dia.body.append(phoneRow);
 addBtn(phoneRow,'Save mobile number without verification',async()=>{try{const r=await api('ssecSaveMobile',{mobile:phone.value.trim(),currentPassword:current.value},{retry:false});status(msg,r.message||'Mobile updated.');current.value='';await load();}catch(e){status(msg,e.message,true);}},'secondary-button');
 const b=mk('button','✉ Email verification / contact details');b.type='button';b.className='nav-item';b.onclick=()=>{dia.open();load();};target.insertBefore(b,$('logoutBtn'));
}
function storageFeature(){const panel=$('adminSecurityPanel');if(!panel)return;
 const wrap=mk('div',undefined,'ssec-card');wrap.style.margin='16px 0';wrap.append(mk('h3','SarNi master storage · one spreadsheet / one Drive root'),mk('p','Review master links or safely move known files and folders under the existing root. No new spreadsheet is created.','ssec-muted'));
 const results=mk('div');wrap.append(results);const buttons=mk('div',undefined,'ssec-actions');wrap.append(buttons);
 const shown=(r)=>{results.replaceChildren();for(const [name,entry] of [['Root folder',r.root],['Master spreadsheet',r.spreadsheet],['Backup folder',r.backup]]){const p=mk('p'),a=mk('a',name+' → '+entry.name);a.href=entry.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a);results.append(p);}};
 addBtn(buttons,'Show master file and folders',async()=>{try{const r=await api('ssecStorageStatus',{}, {retry:false});shown(r);}catch(e){results.textContent=e.message;}},'secondary-button');
 addBtn(buttons,'Organise existing files',async()=>{if(!confirm('Move the existing master spreadsheet and known SarNi folders into the current data root? Take a backup first. No spreadsheet will be created.'))return;try{const r=await api('ssecOrganize',{}, {retry:false,timeoutMs:60000});shown(r);}catch(e){results.textContent=e.message;}},'secondary-button');
 panel.parentElement.append(wrap);
}
function thumbnail(file){return new Promise((resolve,reject)=>{const image=new Image(),url=URL.createObjectURL(file);image.onload=()=>{try{const max=200,ratio=Math.min(max/image.width,max/image.height,1),c=document.createElement('canvas');c.width=Math.max(1,Math.round(image.width*ratio));c.height=Math.max(1,Math.round(image.height*ratio));c.getContext('2d').drawImage(image,0,0,c.width,c.height);let q=.65,data='';for(let n=0;n<5;n++){data=c.toDataURL('image/jpeg',q).split(',')[1];if(data.length<=20000)break;q*=.65;}URL.revokeObjectURL(url);if(data.length>21000)reject(new Error('Thumbnail could not be compressed.'));else resolve(data);}catch(e){URL.revokeObjectURL(url);reject(e);}};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read image.'));};image.src=url;});}
function b64(bytes){let text='';const limit=8192;for(let i=0;i<bytes.length;i+=limit)text+=String.fromCharCode.apply(null,bytes.subarray(i,i+limit));return btoa(text);}
function photoFeature(){const target=$('changePasswordBtn')?.parentElement;if(!target)return;
 const dia=dialog('My private photo library');dia.body.append(mk('p','Original JPG/PNG/WebP up to 20 MB saved privately in Drive. Only small thumbnails are loaded in the dashboard. Upload uses smaller chunks to protect mobile connections.','ssec-muted'));
 const file=field(dia.body,'Choose photo (max 20 MB)','file','file');file.accept='image/jpeg,image/png,image/webp';const title=field(dia.body,'Photo caption','title');
 const kind=sel(dia.body,'Save in folder','kind',[['FAMILY','Family'],['FESTIVAL','Festival'],['BOOK','Book'],['EXPERIENCE','Life experience'],['RECEIPT','Receipt'],['OTHER','Other']]);
 const related=field(dia.body,'Related festival or record ID (optional)','relatedId');
 const msg=mk('p',undefined,'ssec-msg');dia.body.append(msg);const grid=mk('div',undefined,'ssec-photo-grid');dia.body.append(grid);
 const controls=mk('div',undefined,'ssec-actions');dia.body.append(controls);
 async function load(){try{const r=await api('ssecPhotoList',{kind:kind.value,limit:12},{retry:false});grid.replaceChildren();if(!r.photos.length){grid.append(mk('p','No photos yet.'));return;}for(const p of r.photos){const card=mk('div',undefined,'ssec-photo'),im=mk('img');im.loading='lazy';im.alt=p.title||'Private photo';im.src=p.thumbnail;card.append(im,mk('small',p.title||p.kind));grid.append(card);}}catch(e){status(msg,e.message,true);}}
 addBtn(controls,'Save original photo',async()=>{const f=file.files?.[0];if(!f){status(msg,'Choose a photo.',true);return;}if(f.size>20*1024*1024){status(msg,'Maximum original size is 20 MB.',true);return;}if(!['image/jpeg','image/png','image/webp'].includes(f.type)){status(msg,'Use JPG, PNG or WebP.',true);return;}
 try{status(msg,'Preparing thumbnail…');const thumb=await thumbnail(f);const start=await api('ssecPhotoStart',{photo:{size:f.size,mime:f.type,fileName:f.name,title:title.value,kind:kind.value,relatedId:related.value}},{retry:false});
 const total=start.partCount;for(let i=0;i<total;i++){status(msg,'Uploading original: '+(i+1)+' / '+total+' chunks…');const chunk=await f.slice(i*start.chunkBytes,(i+1)*start.chunkBytes).arrayBuffer();await api('ssecPhotoChunk',{uploadId:start.uploadId,index:i,base64:b64(new Uint8Array(chunk))},{retry:false,timeoutMs:60000});}
 status(msg,'Finalising private original…');const finish=await api('ssecPhotoFinish',{uploadId:start.uploadId,thumbnailBase64:thumb},{retry:false,timeoutMs:60000});status(msg,finish.message||'Photo saved.');file.value='';await load();
 }catch(e){status(msg,e.message+' If interrupted, retry with the photo selected; incomplete temporary parts can be cleared by the administrator.',true);}},'primary');
 addBtn(controls,'Refresh thumbnails',load);
 kind.addEventListener('change',load);
 const btn=mk('button','▧ My photos');btn.type='button';btn.className='nav-item';btn.onclick=()=>{dia.open();load();};target.insertBefore(btn,$('logoutBtn'));
}
function install(){resetFeature();profileFeature();photoFeature();storageFeature();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
