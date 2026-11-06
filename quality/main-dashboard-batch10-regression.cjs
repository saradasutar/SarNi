/* SarNi 10 main-dashboard additive UX regression. Pure source tests: no login/API. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'sarni-main-batch10.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sarni-main-batch10.css'),'utf8');
const check=(name,pass)=>({name,pass:Boolean(pass)});
const tests=[
 check('Main script loaded exactly once', (html.match(/<script[^>]+src="\.\/sarni-main-batch10\.js[^"]*"[^>]*>/g)||[]).length===1),
 check('Main CSS loaded exactly once', (html.match(/<link[^>]+href="\.\/sarni-main-batch10\.css[^"]*"[^>]*>/g)||[]).length===1),
 check('Old batch variants are not loaded', !/<(?:script|link)[^>]+(?:src|href)="[^"]*(?:sarni-main-batch10-v1|sarni10-main-polish|sarni10-main-upgrades|sarni10-main-workspace)/.test(html)),
 check('Navigation stays within authenticated dashboard',js.includes("document.getElementById('mainDashboard')")&&js.includes("document.getElementById('appView')")),
 check('Quick navigation delegates to current section handlers',js.includes("navigation.querySelector('[data-section=")&&js.includes("original.click()")),
 check('Accessible current section announced',js.includes("setAttribute('aria-current','page')")&&js.includes("setAttribute('aria-live','polite')")),
 check('Keyboard shortcuts blocked during typing',js.includes("event.altKey")&&js.includes("el?.isContentEditable")&&js.includes("input,textarea,select")),
 check('Scroll progress stays read-only',js.includes("sarni10ScrollProgress")&&js.includes("track.style.width")),
 check('Back to top respects reduced motion',js.includes("sarni10BackTop")&&js.includes("prefers-reduced-motion: reduce")),
 check('Shortcut help included',js.includes("sarni10-keyboard-help")&&js.includes("Ctrl/⌘ + K")),
 check('Visible focus and mobile touch styles',css.includes(':focus-visible')&&css.includes('min-height:44px')),
 check('Text overflow protection',css.includes('overflow-wrap:anywhere')),
 check('Reduced-motion styles',css.includes('prefers-reduced-motion:reduce')),
 check('Print hides extra controls',css.includes('@media print')),
 check('No backend, user data, or browser storage calls',!/(?:fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/.test(js)),
 check('JavaScript parses',(()=>{try{new Function(js);return true}catch(_){return false}})())
];
const failed=tests.filter(x=>!x.pass);
tests.forEach(x=>console.log((x.pass?'PASS':'FAIL')+' '+x.name));
console.log((tests.length-failed.length)+'/'+tests.length+' main-dashboard UX checks passed.');
if(failed.length)process.exitCode=1;
