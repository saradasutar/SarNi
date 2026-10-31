/* SarNi Expense Head Manager — archival only: never deletes history. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
function init(){
 const section=$('expenditureSection');if(!section||$('sarniHeadManager'))return;
 const el=document.createElement('article');el.className='panel';el.id='sarniHeadManager';
 el.innerHTML='<details id="sarniHeadDetails"><summary>Manage expense heads & subheads <small> · Enable / Archive / Restore</small></summary><p class="eh-note">Archived heads disappear from new expense entries, but all previous expenses and reports are retained. You can restore them anytime.</p><div class="eh-controls"><button type="button" id="ehReload">Refresh heads</button><label><input type="checkbox" id="ehShowArchived" checked> Show archived</label></div><div id="ehStatus" role="status"></div><div id="ehList"></div></details>';
 section.insertBefore(el,section.firstElementChild);
 const css=document.createElement('style');css.textContent=`
 #sarniHeadManager{margin:12px 0;padding:15px!important}#sarniHeadManager summary{cursor:pointer;font-size:16px;font-weight:750}
 #sarniHeadManager summary small{font-weight:500;color:#60756b}#sarniHeadManager .eh-note{font-size:13px;line-height:1.5;color:#63746c}
 #sarniHeadManager .eh-controls,#sarniHeadManager .eh-row{display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap}
 #sarniHeadManager .eh-controls{margin:12px 0}#sarniHeadManager label{display:inline-flex!important;align-items:center;gap:7px;font-size:13px}
 #sarniHeadManager input[type=checkbox]{appearance:checkbox!important;-webkit-appearance:checkbox!important;width:16px!important;height:16px!important;min-height:16px!important;min-width:16px!important;max-width:16px!important;max-height:16px!important;margin:0!important;padding:0!important;position:static!important}
 #sarniHeadManager button{width:auto!important;min-height:32px;padding:6px 12px!important;border-radius:9px;font-size:12px}
 #sarniHeadManager .eh-item{padding:12px;border:1px solid #dbe7e0;border-radius:11px;margin:7px 0;background:#fafdfb}
 #sarniHeadManager .eh-sub{padding:7px 10px;margin:6px 0 0 20px;border-left:2px solid #d7e7df}
 #sarniHeadManager .eh-badge{font-size:11px;border-radius:20px;background:#e6f4eb;padding:4px 8px}
 #sarniHeadManager .eh-badge.off{background:#f1eeeb;color:#876d5a}
 #sarniHeadManager .eh-archive-date{width:auto!important;max-width:170px!important;min-height:30px!important;padding:3px 7px!important}
 #ehStatus{font-size:13px;color:#a03036}
 `;document.head.append(css);
 let items=[];
 const msg=(x)=>{$('ehStatus').textContent=x||''};
 const node=(tag,cls,txt)=>{const d=document.createElement(tag);if(cls)d.className=cls;if(txt!==undefined)d.textContent=txt;return d;};
 async function act(category,sub,enabled,temporary,archiveOn){try{msg('Saving…');const r=await api('ehSet',{category,subcategory:sub||'',enabled,temporary,archiveOn:archiveOn||''},{retry:false});if(!r?.ok)throw Error(r?.message||'Save failed');await load();msg('Saved. Existing expense history is unchanged.');}catch(e){msg(e.message||String(e));}}
 function row(cat,sub,item,subRow=false){
  const wrap=node('div',subRow?'eh-sub':'eh-item'),head=node('div','eh-row'),name=node('strong','',sub||cat),badge=node('span','eh-badge'+(item.enabled?'':' off'),item.enabled?'Enabled':'Archived'),bt=node('button','',item.enabled?'Archive / Remove from entry':'Restore');
  bt.type='button';bt.onclick=()=>{if(item.enabled&&!confirm('Hide this head from future entries? Historical expenses will remain saved.'))return;act(cat,sub,!item.enabled,!!item.temporary,item.archiveOn);};
  const left=node('div');left.append(name,document.createTextNode(' '),badge);head.append(left,bt);wrap.append(head);
  const details=node('details');const summary=node('summary','','Options: temporary head / automatic archive');details.append(summary);
  const controls=node('div','eh-controls');
  const temp=node('label');const check=document.createElement('input');check.type='checkbox';check.checked=!!item.temporary;temp.append(check,document.createTextNode(' Temporary'));
  const dlabel=node('label','','Automatically archive after');const date=document.createElement('input');date.type='date';date.className='eh-archive-date';date.value=item.archiveOn||'';dlabel.append(date);
  const save=node('button','','Save options');save.type='button';save.onclick=()=>act(cat,sub,item.enabled,check.checked,date.value);
  controls.append(temp,dlabel,save);details.append(controls);wrap.append(details);return wrap;
 }
 function draw(){const root=$('ehList');root.replaceChildren();let visible=0;items.forEach(c=>{if(!$('ehShowArchived').checked&&!c.enabled)return;const card=row(c.name,'',c);(c.subheads||[]).forEach(s=>{if($('ehShowArchived').checked||s.enabled)card.append(row(c.name,s.name,s,true));});root.append(card);visible++;});if(!visible)root.textContent='No heads match the current filter.';}
 async function load(){try{msg('');const r=await api('ehList',{}, {retry:false});if(!r?.ok)throw Error(r?.message||'Unable to load heads');items=r.items||[];draw();}catch(e){msg('Expense Head Manager needs the SarNi 5 backend update (ehList, ehSet): '+e.message);}}
 $('ehShowArchived').onchange=draw;$('ehReload').onclick=load;
 $('sarniHeadDetails').addEventListener('toggle',()=>{if($('sarniHeadDetails').open)load();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();