/* SarNi 12 — Investment instrument search and free latest quote/NAV helper.
   Existing transaction fields/save routes remain authoritative. Manual entry always remains available. */
(() => {
  'use strict';
  const wired = new WeakSet(), priceStates = new WeakMap();
  let requestSeq = 0, searchTimer = null, styleReady = false;

  const el = (tag, attrs, value) => {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k,v]) => k === 'className' ? node.className = v : node.setAttribute(k, String(v)));
    if (value != null) node.textContent = value;
    return node;
  };
  const fmt = n => Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:4});
  const say = (node, message, kind) => {
    node.textContent = message || '';
    node.classList.remove('qe12-success','qe12-error');
    if (kind === 'success') node.classList.add('qe12-success');
    if (kind === 'error') node.classList.add('qe12-error');
  };
  function styles() {
    if (styleReady || document.getElementById('sarni12LookupCss')) return;
    styleReady = true;
    const s = el('style',{id:'sarni12LookupCss'});
    s.textContent =
      '#qeMarketLookup{margin:9px 0 12px;position:relative}' +
      '#qeMarketLookup>label{display:block;margin:0 0 5px;font-size:13px;font-weight:800;color:#31594a}' +
      '#qeMarketSearch{width:100%;min-height:47px;border:1.5px solid #9fc8b6;border-radius:11px;padding:10px 13px;font:inherit;font-size:16px;background:#fff;color:#193f34}' +
      '#qeMarketSearch:focus{outline:3px solid #b6e0ce;outline-offset:1px}' +
      '#qeMarketSearchResults{position:absolute;z-index:30;top:100%;left:0;right:0;margin-top:5px;max-height:290px;overflow:auto;background:#fff;border:1px solid #cbded4;border-radius:12px;box-shadow:0 10px 28px #183b2b20;padding:5px}' +
      '#qeMarketSearchResults[hidden]{display:none}' +
      '.qe12-result{display:block;width:100%;text-align:left;background:#fff!important;color:#193f34!important;border:0!important;border-bottom:1px solid #edf2ee!important;border-radius:8px!important;padding:10px 11px!important;min-height:0!important}' +
      '.qe12-result:last-child{border-bottom:0!important}.qe12-result:hover,.qe12-result:focus{background:#f0f8f3!important}' +
      '.qe12-result strong{display:block;font-size:13px;font-weight:800;line-height:1.35}.qe12-result small{display:block;font-size:11px;color:#657b70;line-height:1.45;margin-top:3px;white-space:normal}' +
      '#qeMarketLookupStatus,#qeMarketPriceStatus{display:block;margin:5px 0 0;font-size:11.5px;line-height:1.45;color:#687e72}' +
      '#qeMarketLookupStatus.qe12-success,#qeMarketPriceStatus.qe12-success{color:#16734e}' +
      '#qeMarketLookupStatus.qe12-error,#qeMarketPriceStatus.qe12-error{color:#a34828}' +
      '.qe12-use-price{display:inline-block;width:auto!important;margin:5px 0 0!important;padding:5px 9px!important;min-height:29px!important;font-size:11px!important;background:#edf6ed!important;color:#245d3d!important;border:1px solid #bfd8c4!important;border-radius:8px!important}' +
      '@media(max-width:420px){#qeMarketSearch{font-size:16px;min-height:48px}.qe12-result{padding:11px!important}}';
    document.head.appendChild(s);
  }
  function putPrice(input, value, note, statusNode) {
    const state = priceStates.get(input);
    if (!state || !Number.isFinite(Number(value)) || Number(value) <= 0) return;
    state.writing = true;
    input.value = String(Number(value));
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    state.writing = false;
    state.pending = null;
    state.useButton.hidden = true;
    say(statusNode,note+' · ₹'+fmt(value),'success');
  }
  function proposePrice(input, data, statusNode) {
    const state = priceStates.get(input);
    if (state.manual && String(input.value || '').trim()) {
      state.pending = data;
      say(statusNode,'Your manually entered Price / NAV is preserved. Automatic data will not overwrite it.','');
      state.useButton.hidden = false;
    } else {
      state.manual = false;
      putPrice(input,data.value,data.note,statusNode);
    }
  }

  function attach() {
    const main = document.querySelector('main');
    if (!main || main.dataset.entryMode !== 'investment') return;
    const fields = document.getElementById('fields');
    if (!fields) return;
    const asset=fields.querySelector('[name="assetType"]'), title=fields.querySelector('[name="title"]'),
      code=fields.querySelector('[name="code"]'), price=fields.querySelector('[name="price"]');
    if (!asset || !title || !code || !price || wired.has(title)) return;
    wired.add(title); styles();

    const wrap=el('section',{id:'qeMarketLookup','aria-label':'Instrument search'});
    wrap.append(
      el('label',{for:'qeMarketSearch'},'Find stock, ETF or mutual fund'),
      el('input',{id:'qeMarketSearch',type:'search',autocomplete:'off',placeholder:'Type company name, ticker or MF scheme name','aria-label':'Search stock, ETF or mutual fund','aria-autocomplete':'list','aria-controls':'qeMarketSearchResults'}),
      el('div',{id:'qeMarketSearchResults',role:'listbox',hidden:'hidden'}),
      el('small',{id:'qeMarketLookupStatus','aria-live':'polite'},'Search is optional. Name, symbol and Price / NAV can also be entered manually.')
    );
    const nameLabel=title.closest('label');
    if (nameLabel && nameLabel.parentElement) nameLabel.parentElement.insertBefore(wrap,nameLabel);
    const searchInput=wrap.querySelector('#qeMarketSearch'), results=wrap.querySelector('#qeMarketSearchResults'),
      lookupStatus=wrap.querySelector('#qeMarketLookupStatus');
    const priceStatus=el('small',{id:'qeMarketPriceStatus','aria-live':'polite'},'Price / NAV can always be entered or corrected manually.');
    const priceLabel=price.closest('label');
    if (priceLabel) priceLabel.appendChild(priceStatus);
    const state={manual:String(price.value||'').trim()!=='',writing:false,pending:null,useButton:null};
    const useButton=el('button',{type:'button',className:'qe12-use-price',hidden:'hidden'},'Use fetched Price / NAV');
    state.useButton=useButton; priceStatus.appendChild(useButton); priceStates.set(price,state);

    price.addEventListener('input',()=>{
      if(state.writing)return;
      if(String(price.value||'').trim()){
        state.manual=true;
        say(priceStatus,'Manual Price / NAV entered. Automatic refresh will not overwrite it.','');
        if(state.pending) useButton.hidden=false;
      } else {
        state.manual=false;
        say(priceStatus,'Price / NAV is blank. It can be fetched again or entered manually.','');
      }
    });
    useButton.addEventListener('click',()=>{
      if(!state.pending)return;
      state.manual=false;putPrice(price,state.pending.value,state.pending.note,priceStatus);
    });

    const api=()=>window.sarniInvestmentLookupApi;
    const closeResults=()=>{results.replaceChildren();results.hidden=true;searchInput.setAttribute('aria-expanded','false');};
    const showUnavailable=(message,error)=>{closeResults();say(lookupStatus,message,error?'error':'');};

    async function select(item) {
      closeResults();
      const displayName=item.displayName||item.name||'';
      title.value=displayName; code.value=item.code||'';
      title.dispatchEvent(new Event('input',{bubbles:true}));
      code.dispatchEvent(new Event('input',{bubbles:true}));
      searchInput.value=displayName+(item.code?' · '+item.code:'');
      say(lookupStatus,'Selected '+displayName+' · '+item.code+'. Name and code are populated and remain editable.','success');
      const type=String(asset.value||'').toUpperCase(),seq=++requestSeq;
      if(type==='MF' && Number(item.nav||item.price)>0){
        proposePrice(price,{value:Number(item.nav||item.price),note:'AMFI NAV dated '+(item.navDate||'latest report')+' · Source: AMFI'},priceStatus);
        return;
      }
      if(!['STOCK','ETF'].includes(type)){say(priceStatus,'Enter Price / NAV manually for this asset type.','');return;}
      say(priceStatus,'Fetching latest available delayed NSE quote for '+item.code+'…','');
      const bridge=api();
      if(!bridge || typeof bridge.quote!=='function'){say(priceStatus,'Quote service is not connected yet. Enter Price / NAV manually.','error');return;}
      try {
        const reply=await bridge.quote(item.code,type);
        if(seq!==requestSeq || !price.isConnected)return;
        if(reply && reply.available && Number(reply.price)>0){
          const time=reply.fetchedAt?new Date(reply.fetchedAt).toLocaleString('en-IN'):'retrieved now';
          proposePrice(price,{value:Number(reply.price),note:'Google Finance delayed quote · Retrieved '+time},priceStatus);
        } else say(priceStatus,(reply&&reply.message)||'Automatic quote unavailable. Enter Price / NAV manually.','error');
      } catch(error) {
        if(seq===requestSeq && price.isConnected)
          say(priceStatus,'Automatic quote unavailable: '+String(error&&error.message||error).slice(0,150)+'. Enter Price / NAV manually.','error');
      }
    }

    async function search(query) {
      const bridge=api();
      if(!bridge || typeof bridge.search!=='function'){
        showUnavailable('Instrument lookup is not connected yet. Enter name, symbol and Price / NAV manually.',true);return;
      }
      const type=String(asset.value||'STOCK').toUpperCase();
      say(lookupStatus,'Searching '+(type==='MF'?'AMFI schemes':'NSE instruments')+'…','');
      try {
        const reply=await bridge.search(query,type);
        if(!searchInputCurrent(query))return;
        const items=Array.isArray(reply&&reply.results)?reply.results:[];
        results.replaceChildren();
        if(!items.length){
          showUnavailable((reply&&reply.message)||'No matching instrument found. Enter name and symbol manually below.',false);return;
        }
        items.forEach(item=>{
          const button=el('button',{type:'button',className:'qe12-result',role:'option'});
          button.append(el('strong',{},item.displayName||item.name||'Instrument'));
          let detail=(item.code?'Code: '+item.code:'')+(item.series?' · Series: '+item.series:'')+(item.exchange?' · '+item.exchange:'');
          if(item.assetType==='MF' && item.nav!=null) detail+=' · NAV ₹'+fmt(item.nav)+(item.navDate?' · '+item.navDate:'');
          button.append(el('small',{},detail));
          button.addEventListener('click',()=>select(item));results.appendChild(button);
        });
        results.hidden=false;searchInput.setAttribute('aria-expanded','true');
        say(lookupStatus,items.length+' matching instrument(s). Select the correct company / scheme.','success');
      } catch(error) {
        showUnavailable('Search unavailable: '+String(error&&error.message||error).slice(0,150)+'. Name, symbol and price fields remain editable.',true);
      }
    }
    function searchInputCurrent(query){return searchInput.isConnected && searchInput.value.trim()===query;}

    searchInput.addEventListener('input',()=>{
      if(searchTimer)clearTimeout(searchTimer);
      const query=searchInput.value.trim();closeResults();
      if(query.length<2){say(lookupStatus,'Enter at least two characters. Manual entry is always available.','');return;}
      searchTimer=setTimeout(()=>search(query),450);
    });
    searchInput.addEventListener('keydown',event=>{if(event.key==='Escape')closeResults();});
    document.addEventListener('click',event=>{if(!wrap.contains(event.target))closeResults();},{passive:true});
    asset.addEventListener('change',()=>{
      if(searchInput.value)searchInput.dispatchEvent(new Event('input',{bubbles:true}));
      else say(lookupStatus,'Search uses the selected '+String(asset.value).toUpperCase()+' directory.','');
    });
  }

  function boot(){
    const main=document.querySelector('main');if(!main)return;
    new MutationObserver(attach).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['data-entry-mode']});
    attach();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();