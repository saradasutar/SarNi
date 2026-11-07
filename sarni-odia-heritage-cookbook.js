/* SarNi Odia Heritage Cookbook: additive book-authoring assistant.
 * Keeps existing Book/Chapter save flows; no new sheets or backend routes.
 * Copyright: photographs require own rights or permission. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const chapters=[
'01 · The Traditional Odia Kitchen','02 · Rice and Pakhala','03 · Dal and Everyday Meals',
'04 · Traditional Vegetable Curries','05 · Besara and Rai','06 · Traditional Saga',
'07 · Bhaja, Poda and Bharta','08 · Khatta, Kanji and Sour Dishes',
'09 · Badi, Achar and Preserved Foods','10 · Traditional Odia Fish',
'11 · Prawns and Crabs','12 · Meat and Village Cooking','13 · Breakfast and Chakuli',
'14 · Steamed Traditional Pithas','15 · Fried and Baked Pithas',
'16 · Traditional Odia Sweets','17 · Village Snacks','18 · Millets and Rural Grains',
'19 · Regional Food Traditions','20 · Festivals and Temple-Inspired Cooking',
'21 · Drinks and Summer Foods','22 · Forgotten Village and Family Recipes'];
const recipes=['Pakhala','Dalma','Santula','Saga Bhaja','Badi Chura','Machha Besara','Chakuli Pitha','Manda Pitha','Enduri Pitha','Poda Pitha'];
const escapeHtml=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stylesheet=document.createElement('style');stylesheet.textContent=`
#odiaHeritageBox{margin:12px 0 18px;padding:17px;border:1px solid #ebd9ba;border-radius:18px;background:linear-gradient(120deg,#fff9ed,#f4fffb);color:#42351e}
#odiaHeritageBox h3{margin:0 0 7px;font-size:20px}
#odiaHeritageBox p{margin:5px 0 10px;color:#665b4b;line-height:1.5}
#odiaHeritageBox .oh-row{display:flex;flex-wrap:wrap;gap:9px;align-items:center}
#odiaHeritageBox button,#odiaRecipeBar button{background:#fff;border:1px solid #c9b68d;border-radius:10px;min-height:40px;padding:8px 12px;color:#55401d;font-weight:750;cursor:pointer}
#odiaHeritageBox select,#odiaRecipeBar input,#odiaRecipeBar select{background:#fff;border:1px solid #c9b68d;border-radius:9px;padding:8px;min-height:39px;font:inherit;max-width:100%}
#odiaRecipeBar{border:1px solid #ead7b3;border-radius:13px;background:#fffaf0;padding:12px;margin:10px 0;display:grid;gap:10px}
#odiaRecipeBar .oh-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#odiaRecipeBar label{display:grid;gap:4px;font-size:12px;font-weight:750}
#odiaRecipeBar .oh-note{color:#795b32;font-size:12px;line-height:1.5}
@media(max-width:560px){#odiaHeritageBox button,#odiaRecipeBar button{flex:1 1 auto}}
`;document.head.append(stylesheet);
function value(id,v){const x=$(id);if(x){x.value=v;x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}));}}
function notify(t){const el=$('odiaHeritageNotice');if(el)el.textContent=t;}
function makeBook(){
$('addBookBtn')?.click();
setTimeout(()=>{
if(!$('bookForm')||$('bookModal')?.classList.contains('hidden')){notify('Open New book and select Create Cookbook again.');return}
value('bookTitle','ଆମ ଓଡ଼ିଆ ରୋଷେଇ — Authentic Odia Recipes');
value('bookGenre','Culinary Heritage / Odia Cookbook');
value('bookDescription','An original, evidence-based collection of Odisha traditional food, village knowledge and carefully tested home recipes. Original photos only or images with documented permission. Each entry records ingredients, method, regional variation, contributor, source and verification. Unverified historical claims will not be presented as fact.');
value('bookStatus','PLANNING');value('bookCoverColor','ORANGE');
notify('Book details filled. Review and click Save book. Existing books remain unchanged.');
},120);
}
function template(name){
const blocks=[
['Dish name (Odia and English)',name||'[Odia dish name]'],
['Village / district / region','[Enter where this version was learned]'],
['Recipe contributor and permission','[Name with consent, or anonymous]'],
['Why this dish matters','[Write an actual family memory; do not invent a story]'],
['Servings / preparation / cooking time','[Test and fill]'],
['Ingredients (exact measurements)','[One ingredient per line; measure carefully]'],
['Method — clear numbered steps','1. [First step]\n2. [Second step]\n3. [How to know it is ready]'],
['Traditional utensils and cooking method','[Record firsthand evidence; otherwise mark unknown]'],
['Modern kitchen alternative','[Clearly labelled modern adaptation]'],
['Family and regional variations','[Separately label each variation]'],
['Photo 1 — finished dish','[Own photo / consented photo; Drive file link or ID]'],
['Photo 2 — ingredients','[Own photo / consented photo; Drive file link or ID]'],
['Photo 3 — preparation','[Own photo / consented photo; Drive file link or ID]'],
['Photo 4 — traditional cooking method','[Own photo / consented photo; Drive file link or ID]'],
['Photo credit and rights','[Photographer, owner, permission date, licence]'],
['Evidence and references','[Interview date / book reference / other checkable source]'],
['Kitchen test','[Tester, date, result, corrections]'],
['Authenticity status','RESEARCH PENDING — never imply this is verified without evidence'],
['Copyright review','PENDING — independently written instructions; third-party material checked']
];
return blocks.map(([h,v])=>'<h3>'+escapeHtml(h)+'</h3><p>'+escapeHtml(v).replace(/\n/g,'<br>')+'</p>').join('');
}
function insertRecipe(){
const editor=$('chapterContent');if(!editor)return;
const title=($('odiaDishName')?.value||'').trim()||'[Dish name]';
if(editor.textContent.trim()&&!confirm('This chapter contains writing. Append the recipe template without replacing it?'))return;
if(!$('chapterTitle').value.trim())value('chapterTitle',title==='[Dish name]'?'Traditional Odia Recipe — Draft':title);
const section='<h2>🍃 '+escapeHtml(title)+'</h2>'+template(title);
editor.insertAdjacentHTML('beforeend',section);
editor.dispatchEvent(new Event('input',{bubbles:true}));
$('odiaRecipeMessage').textContent='Template added to the editor. Add your actual recipe and photo references, then click Save chapter. No automatic publication or verification.';
}
function mount(){
const modal=$('chapterModal'),editor=$('chapterContent');if(modal&&editor&&!$('odiaRecipeBar')){
const bar=document.createElement('div');bar.id='odiaRecipeBar';
bar.innerHTML='<strong>🍲 Odia Heritage Recipe Assistant</strong><div class="oh-row"><label>Dish name<input id="odiaDishName" placeholder="e.g. Dalma / ଡାଲମା" /></label><label>Quick recipe<select id="odiaRecipeSelect"><option value="">Choose or write your own</option>'+recipes.map(x=>'<option>'+escapeHtml(x)+'</option>').join('')+'</select></label><button type="button" id="odiaInsertRecipe">＋ Insert recipe format</button></div><div class="oh-note" id="odiaRecipeMessage">Photos: enter your own private Drive photo references and ownership details. This upgrade does not yet upload or embed book pictures automatically. Never paste unlicensed web photos.</div>';
editor.before(bar);
$('odiaRecipeSelect').addEventListener('change',()=>{if($('odiaRecipeSelect').value)value('odiaDishName',$('odiaRecipeSelect').value);});
$('odiaInsertRecipe').addEventListener('click',insertRecipe);
}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
