(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='sarni_noticeboard_local_v1';
const base={enabled:true,speed:5,size:14,bold:true,text:'#ad2332',bg:'#fff8dc',items:[]};
function read(){try{let x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&Array.isArray(x.items))return {...base,...x,items:x.items.slice(0,30)};}catch(e){}return {...base};}
let cfg=read(),last='';
const localNow=()=>{let d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes());};
const admin=()=>document.body.classList.contains('sarni-is-admin');
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(cfg));return true;}catch(e){return false;}};
function boot(){
 let home=$('sarniFocusShell'),settings=$('adminSettingsSection');if(!home||!settings||$('sarniNoticeBar'))return;
 let bar=document.createElement('section');bar.id='sarniNoticeBar';bar.setAttribute('aria-label','Moving Notice Board');
 bar.innerHTML='<b class="snb-label">NOTICE</b><div class="snb-viewport"><div id="snbTrack"></div></div><button id="snbPause" type="button" aria-label="Pause notice" aria-pressed="false">Ⅱ</button>';
 home.prepend(bar);
 let panel=document.createElement('article');panel.className='panel admin-only hidden';panel.id='snbAdmin';
 panel.innerHTML='<h3>Moving Notice Board — Administrator</h3><p class="snb-hint">Schedule quotes, reminders and other text. These settings are saved in this browser only until the SarNi Apps Script backend supports shared notice publishing.</p>'+
 '<form id="snbForm"><label>Notice text<textarea id="snbText" maxlength="500" rows="2" required></textarea></label><div class="snb-grid"><label>Start (optional)<input id="snbStart" type="datetime-local"></label><label>End (optional)<input id="snbEnd" type="datetime-local"></label></div>'+
 '<div class="snb-grid"><label>Speed <input id="snbSpeed" type="range" min="1" max="10"></label><label>Font size <input id="snbSize" type="range" min="12" max="24"></label><label>Text colour <input id="snbTextColour" type="color"></label><label>Background colour <input id="snbBg" type="color"></label></div>'+
 '<div class="snb-grid"><label><input id="snbEnabled" type="checkbox"> Board enabled</label><label><input id="snbBold" type="checkbox"> Extra bold</label><label><input id="snbClearBg" type="checkbox"> No background</label></div>'+
 '<button type="submit">Save notice on this browser</button> <span id="snbStatus" role="status"></span></form><div id="snbItems"></div>';
 settings.append(panel);
 let style=document.createElement('style');style.id='snbStyles';
 style.textContent=[
 '#sarniNoticeBar{display:flex;gap:8px;align-items:center;min-height:32px;margin:0 0 7px;padding:4px 9px;background:var(--snb-bg,#fff8dc);color:var(--snb-text,#ad2332);border:1px solid #edddba;border-radius:10px;overflow:hidden}',
 '#sarniNoticeBar[hidden]{display:none!important}',
 '#sarniNoticeBar .snb-label{font-size:10px;letter-spacing:.09em;flex:none}',
 '.snb-viewport{overflow:hidden;flex:1;min-width:0}',
 '#snbTrack{display:inline-block;white-space:nowrap;padding-left:100%;font-size:var(--snb-size,14px);font-weight:var(--snb-weight,800);animation:snbMove var(--snb-time,25s) linear infinite}',
 '#sarniNoticeBar.is-paused #snbTrack,#sarniNoticeBar:hover #snbTrack{animation-play-state:paused}',
 '#snbPause{background:transparent;border:1px solid currentColor;border-radius:6px;padding:3px 7px;cursor:pointer;color:inherit}',
 '@keyframes snbMove{from{transform:translateX(0)}to{transform:translateX(-100%)}}',
 '#snbAdmin{padding:15px;margin:12px 0}#snbAdmin.hidden{display:none!important}',
 '#snbAdmin h3{margin:0 0 6px}#snbAdmin .snb-hint{font-size:12px;color:#68758c}',
 '#snbAdmin form>label{display:grid;gap:6px;font-size:12px;font-weight:750;margin:10px 0}',
 '#snbAdmin textarea,#snbAdmin input[type=datetime-local]{min-width:0;width:100%;box-sizing:border-box;padding:7px;border:1px solid #cbd5e3;border-radius:8px;font:inherit}',
 '.snb-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0}',
 '.snb-grid label{display:grid;gap:5px;font-size:12px;font-weight:700}',
 '#snbForm button,#snbItems button{padding:8px 11px;border:1px solid #c3c9db;border-radius:8px;background:#eeeaff;color:#583f9e;font-weight:800;cursor:pointer}',
 '.snb-item{display:flex;justify-content:space-between;gap:12px;padding:8px;border:1px solid #e3e6ee;border-radius:8px;margin:8px 0;overflow-wrap:anywhere}',
 '.snb-item small{display:block;color:#738095}',
 '@media(max-width:600px){.snb-grid{grid-template-columns:1fr}}',
 '@media(prefers-reduced-motion:reduce){#snbTrack{animation:none;padding-left:0;white-space:normal}}'
 ].join('');
 document.head.append(style);
 function draw(){
  let time=localNow();
  let messages=cfg.items.filter(x=>x&&x.text&&(!x.start||x.start<=time)&&(!x.end||x.end>=time)).map(x=>String(x.text).trim()).filter(Boolean);
  let message=messages.length?messages.join('　 ✦　 '):'Welcome to SarNi · Plan, write and follow your goals';
  let sig=JSON.stringify([cfg.enabled,cfg.speed,cfg.size,cfg.bold,cfg.text,cfg.bg,message]);
  if(sig===last)return;last=sig;
  bar.hidden=!cfg.enabled;
  bar.style.setProperty('--snb-bg',cfg.bg);
  bar.style.setProperty('--snb-text',cfg.text);
  bar.style.setProperty('--snb-size',cfg.size+'px');
  bar.style.setProperty('--snb-weight',cfg.bold?'900':'650');
  bar.style.setProperty('--snb-time',Math.max(9,44-3.4*cfg.speed)+'s');
  $('snbTrack').textContent=message;
 }
 function sync(){
  $('snbSpeed').value=cfg.speed;$('snbSize').value=cfg.size;$('snbTextColour').value=cfg.text;
  $('snbBg').value=cfg.bg==='transparent'?base.bg:cfg.bg;
  $('snbEnabled').checked=cfg.enabled;$('snbBold').checked=cfg.bold;$('snbClearBg').checked=cfg.bg==='transparent';
 }
 function list(){
  let el=$('snbItems');el.replaceChildren();
  cfg.items.forEach((x,i)=>{
   let row=document.createElement('div');row.className='snb-item';
   let body=document.createElement('div'),title=document.createElement('strong'),when=document.createElement('small');
   title.textContent=x.text;when.textContent=(x.start||'Now')+' → '+(x.end||'No end date');body.append(title,when);
   let del=document.createElement('button');del.type='button';del.textContent='Delete';
   del.addEventListener('click',()=>{if(!admin())return;cfg.items.splice(i,1);save();last='';draw();list();});
   row.append(body,del);el.append(row);
  });
  if(!cfg.items.length)el.textContent='No notices scheduled on this browser.';
 }
 $('snbPause').addEventListener('click',()=>{
  let paused=bar.classList.toggle('is-paused');$('snbPause').textContent=paused?'▶':'Ⅱ';$('snbPause').setAttribute('aria-pressed',String(paused));
 });
 $('snbForm').addEventListener('submit',e=>{
  e.preventDefault();if(!admin())return;
  let text=$('snbText').value.trim(),start=$('snbStart').value,end=$('snbEnd').value;
  if(!text||start&&end&&end<start){$('snbStatus').textContent='Check notice text and date order.';return;}
  cfg.items.push({text,start,end});cfg.items=cfg.items.slice(-30);
  let ok=save();$('snbForm').reset();sync();last='';draw();list();
  $('snbStatus').textContent=ok?'Saved for this browser only.':'Could not store notice.';
 });
 [['snbSpeed','speed',false],['snbSize','size',false],['snbTextColour','text',false],['snbEnabled','enabled',true],['snbBold','bold',true]].forEach(([id,key,check])=>{
  $(id).addEventListener('change',e=>{if(!admin())return;cfg[key]=check?e.target.checked:(key==='speed'||key==='size'?Number(e.target.value):e.target.value);save();last='';draw();});
 });
 function changeBg(){if(!admin())return;cfg.bg=$('snbClearBg').checked?'transparent':$('snbBg').value;save();last='';draw();}
 $('snbBg').addEventListener('change',changeBg);$('snbClearBg').addEventListener('change',changeBg);
 new MutationObserver(()=>{let allowed=admin();panel.classList.toggle('hidden',!allowed);if(allowed)sync();}).observe(document.body,{attributes:true,attributeFilter:['class']});
 panel.classList.toggle('hidden',!admin());sync();list();draw();
 document.addEventListener('sarni:home-visible',draw);
 setInterval(()=>{if(!document.hidden)draw();},60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();