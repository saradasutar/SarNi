/* Batch 10: Administrator Control Centre overview.
 * Presentation only. Existing backend-authenticated admin actions remain authoritative.
 * Never grant access from a CSS class or this overview; no new write routes exist here.
 */
(()=>{'use strict';
 function boot(){
  const section=document.getElementById('adminSettingsSection');
  const security=document.getElementById('adminSecurityPanel');
  const backup=document.getElementById('sarniBackupPanel');
  if(!section||!security||!backup||document.getElementById('sarni10AdminCentre'))return;
  const create=(tag,cls,text)=>{
   const node=document.createElement(tag);
   if(cls)node.className=cls;
   if(text!==undefined)node.textContent=text;
   return node;
  };
  const centre=create('section','sarni10-admin-centre');
  centre.id='sarni10AdminCentre';
  centre.setAttribute('aria-label','Administrator control overview');
  const heading=create('div','sarni10-admin-heading');
  const title=create('h3','', 'Control Centre');
  const description=create('p','', 'Existing management tools in one place. New permission controls require backend verification.');
  heading.append(title,description);
  const cards=create('div','sarni10-admin-cards');
  const status=create('p','sarni10-admin-feedback','Shortcuts operate existing SarNi controls. No permission or data is changed by opening this overview.');
  status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');
  function card(symbol,titleText,detailText,actionText,onActivate,enabled=true){
   const item=create('article','sarni10-admin-card');
   item.append(create('span','sarni10-admin-icon',symbol),create('h4','',titleText),create('p','',detailText));
   if(enabled){
    const button=create('button','sarni10-admin-action',actionText);
    button.type='button';
    button.addEventListener('click',onActivate);
    item.append(button);
   }else{
    const indicator=create('span','sarni10-admin-planned','Backend integration required');
    item.append(indicator);
   }
   cards.append(item);
  }
  const goTo=node=>{
   if(section.classList.contains('hidden')||!document.body.classList.contains('sarni-is-admin')){
    status.textContent='Open Admin Settings with an authorized administrator session.';
    return;
   }
   if(!node||!node.isConnected)return;
   node.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
   const focus=node.querySelector('select,button,input,[tabindex="-1"]')||node;
   if(!focus.hasAttribute('tabindex')&&!/^(BUTTON|INPUT|SELECT)$/.test(focus.tagName))focus.tabIndex=-1;
   focus.focus({preventScroll:true});
  };
  card('⏱','Session Security','Use the existing server-backed inactivity sign-out setting.','Open session policy',()=>goTo(security));
  card('▤','Private Backup','Open the existing manual Google Drive backup control.','Open backup control',()=>goTo(backup));
  card('♙','Users & Roles','Manage accounts in the existing Users section.','Open users',()=>{
   if(section.classList.contains('hidden')||!document.body.classList.contains('sarni-is-admin')){
    status.textContent='Open Admin Settings with an authorized administrator session.';
    return;
   }
   const link=section.querySelector('[data-section="users"]');
   if(!link)return;
   link.click();
   status.textContent='Opened the existing Users management section.';
  });
  card('↻','Sync Administration','Review and repair destination synchronization only after backend permissions and idempotency are verified.','',null,false);
  card('⚑','Public Feature Permissions','Admin-managed visibility and quick-link access must be enforced by Apps Script, not frontend switches.','',null,false);
  card('🛡','Security & Recovery','Server access validation, audit log and backup restore tests remain a separate backend workstream.','',null,false);
  centre.append(heading,cards,status);
  section.insertBefore(centre,security);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
})();
