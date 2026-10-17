/* SarNi v20.8.10 · Restricted rich text for the authenticated Life Experiences field.
 * No backend/schema migration: only a clearly tagged, strictly sanitised lesson value.
 * This script must be loaded before the main SarNi dashboard JS.
 */
const SAR_LIFE_RICH_PREFIX='[[SARNI_RICH_V1]]';
let sarLifeSelectedRange=null;
function sarLifeHexColour(input){
 const value=String(input||'').trim().toLowerCase();
 if(/^#[0-9a-f]{6}$/.test(value))return value;
 if(/^#[0-9a-f]{3}$/.test(value))return '#'+value.slice(1).split('').map(ch=>ch+ch).join('');
 const match=/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(value);
 if(match){
  const values=match.slice(1).map(Number);
  if(values.every(n=>Number.isInteger(n)&&n>=0&&n<=255))return '#'+values.map(n=>n.toString(16).padStart(2,'0')).join('');
 }
 return '';
}
function sarLifeSanitizeMarkup(input){
 const template=document.createElement('template');
 template.innerHTML=String(input||'');
 function walk(node){
  if(node.nodeType===3)return escapeHtml(node.nodeValue||'');
  if(node.nodeType!==1)return '';
  const tag=node.tagName.toLowerCase();
  if(['script','style','svg','iframe','object','img','video','audio','math','form','input','link','meta'].includes(tag))return '';
  if(tag==='br')return '<br>';
  const content=Array.from(node.childNodes).map(walk).join('');
  if(tag==='strong'||tag==='b')return '<strong>'+content+'</strong>';
  if(tag==='em'||tag==='i')return '<em>'+content+'</em>';
  if(tag==='p'||tag==='div')return '<p>'+content+'</p>';
  if(tag==='span'||tag==='font'||tag==='mark'){
   const color=sarLifeHexColour(tag==='font'?node.getAttribute('color'):node.style.color);
   const background=sarLifeHexColour(tag==='mark'?(node.style.backgroundColor||'#fff176'):node.style.backgroundColor);
   const rules=[];
   if(color)rules.push('color:'+color);
   if(background)rules.push('background-color:'+background);
   return rules.length?'<span style="'+rules.join(';')+'">'+content+'</span>':content;
  }
  return content;
 }
 return Array.from(template.content.childNodes).map(walk).join('');
}
function sarLifePlain(value){
 const input=String(value||'');
 if(!input.startsWith(SAR_LIFE_RICH_PREFIX))return input;
 const markup=sarLifeSanitizeMarkup(input.slice(SAR_LIFE_RICH_PREFIX.length));
 const temp=document.createElement('div');
 temp.innerHTML=markup.replace(/<\/p>|<br\s*\/?\s*>/gi,' ');
 return (temp.textContent||'').replace(/\s+/g,' ').trim();
}
function sarLifeDisplayMarkup(value){
 const input=String(value||'');
 return input.startsWith(SAR_LIFE_RICH_PREFIX)?sarLifeSanitizeMarkup(input.slice(SAR_LIFE_RICH_PREFIX.length)):escapeHtml(input);
}
function sarLifeSetRichEditor(value){
 const editor=document.getElementById('experienceRichEditor');
 const field=document.getElementById('experienceLegacyLesson');
 if(!editor||!field)return;
 const input=String(value||'');
 if(input.startsWith(SAR_LIFE_RICH_PREFIX))editor.innerHTML=sarLifeSanitizeMarkup(input.slice(SAR_LIFE_RICH_PREFIX.length));
 else editor.textContent=input;
 field.value=input;
 sarLifeSelectedRange=null;
}
function sarLifeSerializeEditor(){
 const editor=document.getElementById('experienceRichEditor');
 if(!editor)return '';
 const markup=sarLifeSanitizeMarkup(editor.innerHTML);
 const plain=sarLifePlain(SAR_LIFE_RICH_PREFIX+markup);
 if(!plain)return '';
 if(!/<(?:strong|em|span|p|br)\b/i.test(markup))return plain;
 return SAR_LIFE_RICH_PREFIX+markup;
}
function sarLifeSyncEditor(){
 const field=document.getElementById('experienceLegacyLesson');
 if(field)field.value=sarLifeSerializeEditor();
 return field?.value||'';
}
function sarLifeRememberSelection(){
 const editor=document.getElementById('experienceRichEditor'),selection=window.getSelection();
 if(!editor||!selection||!selection.rangeCount||!editor.contains(selection.anchorNode))return;
 sarLifeSelectedRange=selection.getRangeAt(0).cloneRange();
}
function sarLifeFormat(command,value){
 const editor=document.getElementById('experienceRichEditor');
 if(!editor)return;
 const selection=window.getSelection();
 editor.focus({preventScroll:true});
 if(sarLifeSelectedRange&&selection){
  try{selection.removeAllRanges();selection.addRange(sarLifeSelectedRange);}catch(ignore){}
 }
 if(!['bold','italic','foreColor','hiliteColor','removeFormat'].includes(command))return;
 if(command==='foreColor'||command==='hiliteColor'){
  value=sarLifeHexColour(value);
  if(!value)return;
 }
 try{
  if(!document.execCommand(command,false,value||null))
   throw new Error('Select the words first, then tap formatting.');
  sarLifeRememberSelection();sarLifeSyncEditor();
 }catch(error){toast(error.message||'Formatting unavailable in this browser.','info');}
}
function initSarLifeRichEditor(){
 const editor=document.getElementById('experienceRichEditor');
 const toolbar=document.querySelector('#lifeExperienceForm .sarni-rich-toolbar');
 if(!editor||!toolbar)return;
 editor.addEventListener('input',sarLifeSyncEditor);
 editor.addEventListener('keyup',sarLifeRememberSelection);
 editor.addEventListener('mouseup',sarLifeRememberSelection);
 editor.addEventListener('touchend',sarLifeRememberSelection,{passive:true});
 editor.addEventListener('paste',event=>{
  const plain=event.clipboardData?.getData('text/plain');
  if(plain==null)return;
  event.preventDefault();editor.focus();
  if(!document.execCommand('insertText',false,plain)){
   const selection=window.getSelection();
   if(selection?.rangeCount){
    const range=selection.getRangeAt(0);
    if(editor.contains(range.commonAncestorContainer)){range.deleteContents();range.insertNode(document.createTextNode(plain));range.collapse(false);}
   }
  }
  sarLifeSyncEditor();
 });
 toolbar.addEventListener('pointerdown',event=>{if(event.target.closest('[data-life-format]'))event.preventDefault();});
 toolbar.addEventListener('click',event=>{const btn=event.target.closest('[data-life-format]');if(btn)sarLifeFormat(btn.dataset.lifeFormat);});
 document.getElementById('experienceTextColour')?.addEventListener('change',event=>sarLifeFormat('foreColor',event.target.value));
 document.getElementById('experienceHighlightColour')?.addEventListener('change',event=>sarLifeFormat('hiliteColor',event.target.value));
 document.addEventListener('selectionchange',()=>{
  const selection=window.getSelection();
  if(selection?.rangeCount&&editor.contains(selection.anchorNode))sarLifeRememberSelection();
 });
}
