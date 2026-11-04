/* SarNi six-tab Category & Mark Manager — admin UI, backend-controlled.
 * Never store changes only in browser storage. Older entries keep their stable keys.
 */
(function(){
'use strict';
const tabs=[['expense','Expense'],['diary','Personal Diary'],['stock','Stock Note'],['office','Office Diary'],['investment','Investment'],['family','Family Expense']];
const cores={
 expense:[],diary:[['important','Imp.'],['monthlyHighlight','Monthly'],['needsLearning','Learn'],['needsPlanning','Plan']],
 stock:[['important','Imp.'],['monthlyHighlight','Monthly'],['needsLearning','Learn'],['needsReview','Review']],
 office:[['important','Imp.'],['monthlyHighlight','Monthly'],['needsLearning','Learn'],['needsFollowup','Follow-up']],
 investment:[],family:[]
};
const $=id=>document.getElementById(id);
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
const wrap=$('adminSettingsSection');if(!wrap||$('sarniQuickMarkManager'))return;
const panel=node('article',undefined,'panel');panel.id='sarniQuickMarkManager';panel.style.cssText='margin-top:16px;padding:14px;border:1px solid #dbe5f4;border-radius:15px;background:#fff';
const details=node('details');const summary=node('summary','Category & Mark Manager · Six Quick Entry tabs');summary.style.cssText='cursor:pointer;font-size:16px;font-weight:850;color:#1d4663;padding:4px';details.append(summary);
const body=node('div');body.style.cssText='padding:12px 0 2px';const desc=node('p','Add, rename, archive or restore optional categories and markings. Core marks retain fixed IDs so historical records and synchronization remain safe. Expense/Family expense heads are managed in their existing registers.');desc.style.cssText='font-size:13px;color:#516579;line-height:1.5';body.append(desc);
const toolbar=node('div');toolbar.style.cssText='display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:9px 0';
const select=node('select');select.setAttribute('aria-label','Quick Entry tab to configure');select.style.cssText='padding:9px 12px;border:1px solid #a8bfce;border-radius:9px;font-size:14px;max-width:100%';tabs.forEach(([id,label])=>{const o=node('option',label);o.value=id;select.append(o)});
const load=node('button','Load settings'),save=node('button','Save changes');load.type=save.type='button';load.style.cssText=save.style.cssText='padding:9px 12px;border:1px solid #8db5bd;border-radius:9px;background:#edf8f5;color:#115b56;cursor:pointer;font-weight:750';save.disabled=true;toolbar.append(select,load,save);body.append(toolbar);
const status=node('p','Select Load settings. Changes need the Quick Marks backend add-on; existing records are not modified.');status.style.cssText='font-size:12px;color:#617687;margin:5px 0';status.setAttribute('role','status');body.append(status);
const list=node('div');body.append(list);const bottom=node('div');bottom.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';const newName=node('input');newName.maxLength=28;newName.placeholder='New label / category';newName.style.cssText='padding:9px;min-width:135px;flex:1;border:1px solid #bfd1d8;border-radius:9px';const add=node('button','+ Add');add.type='button';add.style.cssText=load.style.cssText;bottom.append(newName,add);body.append(bottom);details.append(body);panel.append(details);wrap.append(panel);
let cfg=null,revision=0,busy=false;
const active=()=>{try{return !!state?.token&&typeof isSarNiAdmin==='function'&&isSarNiAdmin()}catch(_){return false}};
const msg=(text,bad=false)=>{status.textContent=text;status.style.color=bad?'#b42337':'#146656'};
const safeTab=()=>tabs.find(([id])=>id===select.value)?.[0]||'expense';
const safeConfig=()=>{
 const out={};
 tabs.forEach(([id])=>{out[id]={coreLabels:{},custom:[]};(cores[id]||[]).forEach(([key,label])=>{out[id].coreLabels[key]=label})});
 return out;
};
function render(){
 list.replaceChildren();const id=safeTab(),part=cfg?.[id];
 if(!part){list.append(node('p','Load backend configuration to edit this tab.'));return}
 const show=(title,items)=>{list.append(node('strong',title));const group=node('div');group.style.cssText='display:grid;gap:7px;margin:9px 0 13px';
 items.forEach(({id,label,core,enabled})=>{
  const row=node('div');row.style.cssText='display:flex;gap:8px;align-items:center;min-width:0';
  const input=node('input');input.value=label;input.maxLength=28;input.disabled=!enabled&&!core;input.style.cssText='min-width:0;flex:1;padding:8px;border:1px solid #d3e1e4;border-radius:8px';
  input.addEventListener('change',()=>{const next=input.value.trim();if(!next){input.value=label;return}if(core)part.coreLabels[id]=next;else{const x=part.custom.find(o=>o.id===id);if(x)x.label=next}msg('Unsaved changes.');});
  const button=node('button',core?'Fixed':enabled?'Archive':'Restore');button.type='button';button.disabled=core;button.style.cssText='padding:8px;border-radius:8px;border:1px solid #c7d9dd;background:#f3f8fa;cursor:pointer;font-size:12px';
  button.addEventListener('click',()=>{const x=part.custom.find(o=>o.id===id);if(x){x.enabled=!x.enabled;msg('Unsaved changes.');render()}});
  row.append(input,button);group.append(row);
 });list.append(group)};
 show('Core markings (rename display labels; cannot delete)',(cores[id]||[]).map(([key,label])=>({id:key,label:part.coreLabels?.[key]||label,core:true,enabled:true})));
 show('Additional categories / markings (archive instead of delete)',(part.custom||[]).map(x=>({...x,core:false})));
 if(['expense','family'].includes(id)){const note=node('p',id==='expense'?'Actual Expense heads/subheads must be managed with the existing SarNi expense-head manager.':'Actual MyFamily expense heads/subheads must be managed in MyFamily. Custom labels here do not overwrite them.');note.style.cssText='font-size:12px;color:#996016';list.append(note)}
}
load.onclick=async()=>{if(busy)return;if(!active()){msg('Sign in as SarNi Administrator first.',true);return}busy=true;load.disabled=true;try{const result=await api('qmarkGet',{}, {retry:false});if(!result.ok)throw Error(result.message||'Backend configuration unavailable');cfg={...safeConfig(),...(result.config||{})};revision=Number(result.revision||0);save.disabled=false;msg('Configuration loaded. Changes are saved only after pressing Save.');render()}catch(e){cfg=null;save.disabled=true;msg('Category/Mark backend is not installed or unavailable: '+String(e.message||e)+'. Existing Quick Entry remains unchanged.',true);render()}finally{busy=false;load.disabled=false}};
select.onchange=render;
add.onclick=()=>{if(!cfg)return msg('Load backend configuration first.',true);const id=safeTab(),label=newName.value.trim();if(!label)return;if((cfg[id].custom||[]).length>=8)return msg('Maximum 8 additional labels per tab.',true);const duplicate=[...(cores[id]||[]).map(([k])=>cfg[id].coreLabels[k]),...cfg[id].custom.map(x=>x.label)].some(x=>x.toLowerCase()===label.toLowerCase());if(duplicate)return msg('This label already exists.',true);const bytes=crypto.getRandomValues(new Uint8Array(8)),suffix=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');cfg[id].custom.push({id:'custom_'+suffix,label,enabled:true});newName.value='';msg('Unsaved changes.');render()};
save.onclick=async()=>{if(!cfg||busy)return;if(!active())return msg('Admin sign-in required.',true);busy=true;save.disabled=true;try{const result=await api('qmarkSave',{config:cfg,revision},{retry:false});if(!result.ok)throw Error(result.message||'Save rejected');cfg={...safeConfig(),...(result.config||{})};revision=Number(result.revision||0);msg('Saved in SarNi backend. Reload Quick Entry to obtain current labels.');render()}catch(e){msg('Could not save. '+String(e.message||e),true)}finally{busy=false;save.disabled=false}};
})();
