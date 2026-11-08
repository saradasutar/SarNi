(()=>{'use strict';
const $=id=>document.getElementById(id),e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>Math.max(0,Number(x)||0),fmt=x=>num(x).toLocaleString('en-IN');
function boot(){
 const root=$('sarniHomeBookGlance'),source=$('stickyNotesList');
 if(!root||!source||$('sarniHomeBookRows'))return;
 const booksDiv=document.createElement('div');booksDiv.id='sarniHomeBookRows';booksDiv.className='sarni-comparison-list';
 root.querySelector('.sarni-home-writing-head').after(booksDiv);
 const targetDiv=document.createElement('section');targetDiv.id='sarniHomeTargetRowsPanel';targetDiv.className='sarni-targets-home';
 targetDiv.innerHTML='<div class="sch-head"><div><small>YOUR PROGRESS</small><h3>Targets &amp; Reminders</h3></div><div class="sch-header-controls"><button type="button" id="sarniCompareFocus" aria-pressed="false" title="Show only the next unfinished achievement per target">Focus view</button><button type="button" id="sarniCompareManage">Manage →</button></div></div><div class="sch-stats" id="sarniCompareStats"></div><div class="sarni-comparison-list" id="sarniCompareTargets"></div>';
 root.after(targetDiv);
 const css=document.createElement('style');css.textContent='.sarni-comparison-list{display:grid;gap:9px;margin:12px 0}.sch-row{border:1px solid #e0e5f0;background:#fff;border-radius:12px;padding:11px 13px}.sch-rowhead,.sch-foot,.sch-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.sch-rowhead strong{color:#253657}.sch-rowhead button,.sch-head button{border:1px solid #d6ccf1;background:#f7f4ff;color:#6245a0;border-radius:8px;padding:7px 10px;font-weight:800;cursor:pointer}.sch-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:9px 0}.sch-grid div{background:#f1f4fd;border-radius:8px;text-align:center;padding:8px 5px}.sch-grid div:nth-child(2){background:#eef9ff}.sch-grid div:nth-child(3){background:#fff6e7}.sch-grid div:nth-child(4){background:#edf9f2}.sch-grid strong,.sch-grid small{display:block;overflow-wrap:anywhere}.sch-grid small{font-size:10px;color:#687993}.sch-grid strong{font-size:16px;color:#293b55}.sch-track{height:7px;background:#e7e4f0;border-radius:20px;overflow:hidden;margin-top:7px}.sch-track span{display:block;height:100%;background:#6b58cb}.sch-foot{font-size:11px;color:#71809b;margin-top:6px}.sarni-targets-home{padding:14px;border:1px solid #dce5f2;background:#fafbff;border-radius:15px;margin:13px 0}.sch-head h3{font-size:19px;margin:3px 0;color:#293b55}.sch-head small{font-size:10px;color:#7359b1;font-weight:850;letter-spacing:.1em}.sch-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 0}.sch-stats div{background:white;border:1px solid #e6e8f1;border-radius:10px;padding:9px}.sch-stats strong{display:block;font-size:21px;color:#493aa3}.sch-stats small{font-size:10px;color:#78859a}.sch-overdue{border-left:4px solid #c43d57}.sch-empty{color:#77869a;font-size:12px}@media(max-width:620px){.sch-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sch-row{padding:10px}}';
 document.head.append(css);
 const progressCss=document.createElement('style');
 progressCss.textContent='.sch-target-card{border-left:4px solid #7357c7}.sch-target-card.sch-overdue{border-left-color:#c43d57}.sch-stages{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin:10px 0 7px}.sch-stage{min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10px;color:#738097;text-align:center}.sch-stage-dot{width:100%;height:7px;border-radius:9px;background:#e5e5f0}.sch-stage.is-done .sch-stage-dot{background:#16a57c}.sch-stage.is-next .sch-stage-dot{background:#e4a23c}.sch-stage-label{font-size:10px;font-weight:760;color:#5d6685;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.sch-target-card .sch-progress-note{font-size:11px;color:#71809a;margin-top:7px}.sch-target-card .sch-rowhead strong{flex:1;min-width:0}.sch-target-card .sch-rowhead .sch-pct{font-size:13px;font-weight:850;color:#6546ad}';
 document.head.append(progressCss);
 const nextCss=document.createElement('style');
 nextCss.textContent='.sch-home-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:7px;margin-top:9px}.sch-home-actions button{border:1px solid #d8cef0;border-radius:8px;background:#f7f4ff;color:#5f45a0;padding:7px 10px;font-size:11px;font-weight:800;cursor:pointer}.sch-home-actions button:focus-visible,.sch-home-actions summary:focus-visible{outline:2px solid #6b52cc;outline-offset:3px}.sch-home-details{margin-top:8px;border-top:1px solid #ecedf6;padding-top:8px}.sch-home-details summary{cursor:pointer;font-size:12px;color:#5b478f;font-weight:800}.sch-home-stage{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:7px;align-items:start;padding:7px 0;border-bottom:1px solid #f0edf7;font-size:12px}.sch-home-stage:last-child{border-bottom:0}.sch-home-stage .is-complete{color:#13805d}.sch-home-stage .is-pending{color:#ba862b}.sch-home-stage small{color:#687792;font-size:11px}.sch-home-stage .sch-home-remark{grid-column:2/-1;line-height:1.4;color:#65738a}.sch-home-due{white-space:nowrap}.sch-home-actions button[disabled]{opacity:.5;cursor:default}';
 document.head.append(nextCss);

 const tableStyle=document.createElement('style');
 tableStyle.textContent=[
  '#sarniHomeBookGlance{padding:12px 15px!important}',
  '#sarniHomeBookGlance .sarni-home-writing-head{margin-bottom:4px!important}',
  '.sarni-targets-home{padding:11px 13px!important;margin:9px 0!important}',
  '.sarni-comparison-list{display:block!important;margin:6px 0!important}',
  '.sch-table-wrap{max-width:100%;overflow-x:auto;border:1px solid #e2e7f1;border-radius:10px;background:#fff}',
  '.sch-compact-table{width:100%;border-collapse:collapse;border-spacing:0;text-align:left;font-size:12px;color:#33415f}',
  '.sch-compact-table thead{background:#f3f5fb;color:#56647f;font-size:11px}',
  '.sch-compact-table th,.sch-compact-table td{padding:7px 9px;border-bottom:1px solid #e9edf5;vertical-align:middle}',
  '.sch-compact-table tbody tr:last-child td{border-bottom:0}',
  '.sch-compact-table tbody tr:hover{background:#f8f9ff}',
  '.sch-compact-table td{font-variant-numeric:tabular-nums}',
  '.sch-compact-table .sch-name{font-weight:800;max-width:280px;min-width:150px;overflow-wrap:anywhere}',
  '.sch-compact-table .sch-name button{border:0;background:transparent;color:#293963;text-align:left;font:inherit;font-weight:800;padding:3px;cursor:pointer}',
  '.sch-compact-table .sch-name button:hover{text-decoration:underline}',
  '.sch-tone-0 .sch-name{border-left:3px solid #7a64ca;background:#f7f3ff}',
  '.sch-tone-1 .sch-name{border-left:3px solid #3e9dbb;background:#eff9ff}',
  '.sch-tone-2 .sch-name{border-left:3px solid #bc8b40;background:#fff8ed}',
  '.sch-tone-3 .sch-name{border-left:3px solid #30a07f;background:#effaf5}',
  '.sch-tone-4 .sch-name{border-left:3px solid #c478a3;background:#fff3f8}',
  '.sch-mini-progress{min-width:75px;height:6px;border-radius:9px;background:#e7e6f0;overflow:hidden}',
  '.sch-mini-progress span{display:block;height:100%;background:#7960ce}',
  '.sch-compact-table small{font-size:10px;color:#77849c}',
  '.sch-book-status,.sch-tag{font-size:10px;font-weight:800;white-space:nowrap;border-radius:7px;padding:5px 7px;background:#f1edfc;color:#6450a0}',
  '.sch-tag.late,.sch-late-date{color:#b63350;font-weight:850}',
  '.sch-tag.late{background:#ffeef1}',
  '.sch-tag.complete{background:#e8f8ef;color:#157f5e}',
  '.sch-tag.active{background:#f1efff}',
  '.sch-next-cell{min-width:150px;max-width:260px;overflow-wrap:anywhere}',
  '.sch-five-bars{display:flex;gap:3px;min-width:105px}',
  '.sch-five-bars span{height:7px;flex:1;background:#e6e6ef;border-radius:6px}',
  '.sch-five-bars span.done{background:#19a17c}',
  '.sch-five-bars span.next{background:#e0a146}',
  '.sch-reminder-title{margin:9px 2px 6px;color:#3d5075;font-size:12px;font-weight:850}',
  '.sch-reminder-title span{background:#edf1fa;border-radius:20px;padding:2px 7px}',
  '@media(max-width:850px){.sch-compact-table{font-size:11px}.sch-compact-table th,.sch-compact-table td{padding:7px}.sch-table-wrap{overflow-x:auto}}'
 ].join('');
 document.head.append(tableStyle);
 const stageTableStyle=document.createElement('style');
 stageTableStyle.textContent='.sch-target-parent th{background:#f1f2fa;padding:8px 10px!important;text-align:left;border-top:2px solid #dae0ef;border-bottom:1px solid #dfe3ec}.sch-target-parent:first-child th{border-top:0}.sch-target-group{display:flex;align-items:center;flex-wrap:wrap;gap:9px}.sch-target-heading{font-size:12px;font-weight:850;color:#263957;min-width:150px;flex:1}.sch-target-percent{font-weight:850;color:#5d4bad;font-size:11px}.sch-target-group .sch-five-bars{width:100px;min-width:100px}.sch-target-stage td{font-size:11px;padding:6px 9px!important}.sch-stage-number{font-weight:800;white-space:nowrap;color:#65549f}.sch-stage-achievement{font-weight:760;min-width:150px;overflow-wrap:anywhere;color:#2d3e58}.sch-stage-remark{min-width:100px;max-width:225px;overflow-wrap:anywhere;color:#687692}.sch-target-stage.sch-late td{background:#fff5f6}.sch-target-stage .sch-tag{display:inline-block}@media(max-width:850px){.sch-target-table{min-width:650px}.sch-target-group .sch-five-bars{width:75px;min-width:75px}}';
 document.head.append(stageTableStyle);

 const compact=document.createElement('style');
 compact.id='sarniHomeCompactVerified';
 compact.textContent=[
 '#sarniHomeBookGlance{padding:9px 12px!important;margin:6px 0!important;border-radius:12px!important}',
 '#sarniHomeBookGlance .sarni-home-writing-head{margin:0 0 4px!important;padding:0!important;min-height:0!important}',
 '#sarniHomeBookGlance .sarni-home-writing-head h3{font-size:17px!important;margin:0!important;line-height:1.25!important}',
 '#sarniHomeBookGlance .sarni-home-writing-eyebrow{font-size:9px!important}',
 '#sarniHomeBookGlance .sarni-home-writing-grid,#sarniHomeBookGlance .sarni-home-writing-progress,#sarniHomeBookGlance .sarni-home-writing-actions{display:none!important}',
 '#sarniHomeBookGlance .sarni-home-writing-note{font-size:10px!important;line-height:1.2!important;margin:4px 0 0!important}',
 '#sarniHomeBookRows{display:block!important;margin:4px 0!important}',
 '#sarniHomeTargetRowsPanel{padding:9px 12px!important;margin:6px 0 9px!important;border-radius:12px!important}',
 '#sarniHomeTargetRowsPanel .sch-head h3{font-size:16px!important;margin:0!important}',
 '#sarniHomeTargetRowsPanel .sch-head small{font-size:9px!important}',
 '#sarniHomeTargetRowsPanel .sch-stats{margin:6px 0!important;gap:6px!important}',
 '#sarniHomeTargetRowsPanel .sch-stats div{padding:5px 8px!important}',
 '#sarniHomeTargetRowsPanel .sch-stats strong{font-size:16px!important}',
 '#sarniHomeTargetRowsPanel .sch-stats small{font-size:9px!important}',
 '#sarniHomeBookRows .sch-compact-table td,#sarniHomeBookRows .sch-compact-table th,#sarniHomeTargetRowsPanel .sch-compact-table td,#sarniHomeTargetRowsPanel .sch-compact-table th{padding:5px 7px!important;line-height:1.25!important}',
 '.sch-book-table .sch-book-row.sch-tone-0 .sch-name{background:#f2efff!important;border-left:4px solid #7856c5!important}',
 '.sch-book-table .sch-book-row.sch-tone-1 .sch-name{background:#e9f7fc!important;border-left:4px solid #2295af!important}',
 '.sch-book-table .sch-book-row.sch-tone-2 .sch-name{background:#fff5e5!important;border-left:4px solid #b78730!important}',
 '.sch-book-table .sch-book-row.sch-tone-3 .sch-name{background:#ebfaf3!important;border-left:4px solid #169679!important}',
 '.sch-book-table .sch-book-row.sch-tone-4 .sch-name{background:#fff0f7!important;border-left:4px solid #b96a99!important}',
 '.sch-target-parent.sch-tone-0 th{background:#f2efff!important;border-left:4px solid #7856c5}',
 '.sch-target-parent.sch-tone-1 th{background:#e9f7fc!important;border-left:4px solid #2295af}',
 '.sch-target-parent.sch-tone-2 th{background:#fff5e5!important;border-left:4px solid #b78730}',
 '.sch-target-parent.sch-tone-3 th{background:#ebfaf3!important;border-left:4px solid #169679}',
 '.sch-target-parent.sch-tone-4 th{background:#fff0f7!important;border-left:4px solid #b96a99}',
 '.sch-target-stage .sch-stage-number{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#ebe6fa;color:#6649a9;font-size:11px;font-weight:900}',
 '.sch-target-stage.sch-tone-1 .sch-stage-number{background:#e2f4fa;color:#1a8298}',
 '.sch-target-stage.sch-tone-2 .sch-stage-number{background:#fff1d9;color:#926322}',
 '.sch-target-stage.sch-tone-3 .sch-stage-number{background:#dff7ec;color:#16775d}',
 '.sch-target-stage.sch-tone-4 .sch-stage-number{background:#f9e7f2;color:#98557d}',
 '@media(min-width:950px){.sch-target-table{table-layout:fixed}.sch-target-table thead th:nth-child(1){width:22%}.sch-target-table thead th:nth-child(2){width:6%}.sch-target-table thead th:nth-child(3){width:28%}.sch-target-table thead th:nth-child(4){width:15%}.sch-target-table thead th:nth-child(5){width:12%}.sch-target-table thead th:nth-child(6){width:17%}}',
 '@media(max-width:750px){.sch-target-table{min-width:740px}.sch-book-table{min-width:640px}}'
 ].join('');
 document.head.append(compact);

 const focusStyles=document.createElement('style');
 focusStyles.textContent=[
  '#sarniHomeTargetRowsPanel .sch-header-controls{display:flex;gap:6px;align-items:center;flex-wrap:wrap}',
  '#sarniHomeTargetRowsPanel .sch-header-controls button{padding:6px 9px;border-radius:8px;font-size:11px;font-weight:800;white-space:nowrap}',
  '#sarniHomeTargetRowsPanel #sarniCompareFocus[aria-pressed="true"]{background:#ece8ff;color:#4c36a5;border-color:#9e89da}',
  '#sarniHomeTargetRowsPanel .sch-target-name-cell{vertical-align:middle!important;min-width:140px;max-width:240px;width:23%;padding:8px 10px!important;border-right:1px solid #dbe1ec!important;border-bottom:4px solid #fff!important;text-align:left}',
  '#sarniHomeTargetRowsPanel .sch-target-name-wrap{display:flex;flex-direction:column;align-items:flex-start;gap:7px}',
  '#sarniHomeTargetRowsPanel .sch-target-name-wrap .sch-five-bars{width:100%;max-width:130px}',
  '#sarniHomeTargetRowsPanel .sch-target-name-cell.sch-tone-0{background:#f2efff!important;border-left:4px solid #7856c5}',
  '#sarniHomeTargetRowsPanel .sch-target-name-cell.sch-tone-1{background:#e9f7fc!important;border-left:4px solid #2295af}',
  '#sarniHomeTargetRowsPanel .sch-target-name-cell.sch-tone-2{background:#fff5e5!important;border-left:4px solid #b78730}',
  '#sarniHomeTargetRowsPanel .sch-target-name-cell.sch-tone-3{background:#ebfaf3!important;border-left:4px solid #169679}',
  '#sarniHomeTargetRowsPanel .sch-target-name-cell.sch-tone-4{background:#fff0f7!important;border-left:4px solid #b96a99}',
  '#sarniHomeTargetRowsPanel.sch-focus-mode .sch-target-parent th{border-top-width:1px!important}',
  '@media(max-width:600px){#sarniHomeTargetRowsPanel .sch-header-controls button{padding:5px 7px}#sarniHomeTargetRowsPanel .sch-head h3{font-size:15px!important}}'
 ].join('');
 document.head.append(focusStyles);

 const prominent=document.createElement('style');
 prominent.id='sarniHomeProminentCompact';
 prominent.textContent=[
  '#sarniHomeBookGlance,#sarniHomeTargetRowsPanel{background:linear-gradient(145deg,#ffffff,#f9faff)!important;border:1px solid #d7e0f0!important;box-shadow:0 5px 18px rgba(27,43,83,.075)!important}',
  '#sarniHomeBookGlance .sarni-home-writing-head h3,#sarniHomeTargetRowsPanel .sch-head h3{font-weight:850!important;color:#253658!important}',
  '#sarniHomeBookRows .sch-table-wrap,#sarniHomeTargetRowsPanel .sch-table-wrap{border:1px solid #dbe2ef!important;border-radius:10px!important}',
  '.sch-compact-table thead{background:#eff2f9!important}',
  '.sch-compact-table thead th{font-weight:850!important;color:#475777!important;letter-spacing:.005em}',
  '.sch-book-table tbody tr{transition:background-color .15s}',
  '.sch-book-table tbody tr.sch-tone-0{background:#faf8ff!important}',
  '.sch-book-table tbody tr.sch-tone-1{background:#f4fbff!important}',
  '.sch-book-table tbody tr.sch-tone-2{background:#fffbf2!important}',
  '.sch-book-table tbody tr.sch-tone-3{background:#f4fcf8!important}',
  '.sch-book-table tbody tr.sch-tone-4{background:#fff6fa!important}',
  '.sch-book-table tbody tr td{border-bottom:4px solid #fff!important}',
  '.sch-book-table .sch-name button{font-size:12px!important;font-weight:900!important;line-height:1.3!important}',
  '.sch-book-table tbody tr:hover{filter:brightness(.98)}',
  '.sch-target-parent th{padding:7px 9px!important;border-top:5px solid #fff!important;border-bottom:1px solid #e1e5ef!important}',
  '.sch-target-parent .sch-target-heading{font-size:12px!important;font-weight:900!important;color:#223551!important}',
  '.sch-target-parent .sch-target-percent{display:inline-block;border-radius:999px;background:#fff;padding:3px 9px;border:1px solid #ded8ef;font-weight:900!important}',
  '.sch-target-stage.sch-tone-0{background:#fcfaff!important}',
  '.sch-target-stage.sch-tone-1{background:#f5fbff!important}',
  '.sch-target-stage.sch-tone-2{background:#fffbf5!important}',
  '.sch-target-stage.sch-tone-3{background:#f5fcf9!important}',
  '.sch-target-stage.sch-tone-4{background:#fff7fb!important}',
  '.sch-target-stage.sch-late{background:#fff0f3!important}',
  '.sch-target-stage td{border-bottom:1px solid #e8ecf4!important}',
  '.sch-target-stage .sch-stage-achievement{font-weight:790!important;color:#283c55!important}',
  '#sarniHomeTargetRowsPanel .sch-stats div:nth-child(1){background:#f3efff!important;border-color:#e6dcff!important}',
  '#sarniHomeTargetRowsPanel .sch-stats div:nth-child(2){background:#fff2f4!important;border-color:#ffdce3!important}',
  '#sarniHomeTargetRowsPanel .sch-stats div:nth-child(3){background:#eefaf9!important;border-color:#d3f0ec!important}',
  '#sarniHomeTargetRowsPanel .sch-stats strong{font-weight:900!important}',
  '@media(hover:hover){.sch-target-stage:hover{filter:brightness(.985)}}',
  '@media(max-width:750px){.sch-compact-table{font-size:11px!important}.sch-book-table .sch-name button{font-size:11px!important}}'
 ].join('');
 document.head.append(prominent);
 const duplicateStyle=document.createElement('style');
 duplicateStyle.textContent='.sch-duplicate-info{grid-column:1/-1;font-size:11px;color:#6b597d;background:#f7f2ff;border:1px solid #e5def4;padding:5px 8px;border-radius:7px;line-height:1.3}';
 document.head.append(duplicateStyle);
 const noStagesStyle=document.createElement('style');
 noStagesStyle.textContent='.sch-target-stage.sch-no-stages td{padding:5px 7px!important;height:auto!important;min-height:0!important;line-height:1.25!important;font-size:11px!important}.sch-target-stage.sch-no-stages .sch-stage-achievement{font-weight:650!important;color:#738099!important}.sch-target-stage.sch-no-stages .sch-stage-number{width:21px;height:21px}.sch-target-stage.sch-no-stages .sch-tag{font-size:10px}.sch-target-name-cell .sch-target-percent{font-size:10px}';
 document.head.append(noStagesStyle);





 let items=[];
 function paintBooks(){
  const active=items.filter(b=>b&&b.id&&b.active!==false);
  if(!active.length){booksDiv.innerHTML='<p class="sch-empty">Saved book summaries will appear after sign-in.</p>';return;}
  const rows=active.map((b,i)=>{
   const chapters=num(b.chapterCount),done=num(b.doneChapterCount),words=num(b.totalWordCount),target=num(b.targetWordCount);
   const pct=target?Math.min(100,Math.round(words/target*100)):null;
   const d=new Date(b.latestChapterAt||b.updatedAt||b.lastUpdatedAt||'');
   const changed=Number.isFinite(d.getTime())?d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—';
   return '<tr class="sch-book-row sch-tone-'+(i%5)+'"><td class="sch-name"><button type="button" data-sch-open="'+e(b.id)+'" title="Open '+e(b.title)+'">'+e(b.title||'Untitled book')+'</button></td>'+
    '<td><strong>'+fmt(done)+' / '+fmt(chapters)+'</strong></td>'+
    '<td><strong>'+fmt(words)+'</strong> / '+(target?fmt(target):'Not set')+'</td>'+
    '<td><div class="sch-mini-progress"><span style="width:'+(pct||0)+'%"></span></div><small>'+(pct===null?'No target':pct+'%')+'</small></td>'+
    '<td><span class="sch-book-status">'+e(String(b.status||'Planning').toLowerCase().replace(/^\w/,c=>c.toUpperCase()))+'</span></td>'+
    '<td>'+e(changed)+'</td></tr>';
  }).join('');
  booksDiv.innerHTML='<div class="sch-table-wrap"><table class="sch-compact-table sch-book-table"><thead><tr><th>Book</th><th>Chapters done / total</th><th>Words written / target</th><th>Progress</th><th>Status</th><th>Updated</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  root.classList.add('sch-ready');
 }
 const second=document.createElement('style');second.textContent='#sarniHomeBookGlance.sch-ready .sarni-home-writing-grid,#sarniHomeBookGlance.sch-ready .sarni-home-writing-progress,#sarniHomeBookGlance.sch-ready .sarni-home-writing-actions{display:none!important}';document.head.append(second);
 async function load(){try{let api=window.SarniHomeBookApi;if(!api?.load)return;let x=await api.load(false);if(Array.isArray(x)){items=x;paintBooks();}}catch(err){booksDiv.innerHTML='<p class="sch-empty">Book summaries unavailable; please check Book Writing.</p>';}}
 booksDiv.addEventListener('click',ev=>{const btn=ev.target.closest('[data-sch-open]');if(btn)window.SarniHomeBookApi?.open?.(btn.dataset.schOpen);});
 function renderTargets(){
  const cards=[...source.querySelectorAll('.sticky-note-card')];
  const targets=cards.filter(c=>c.classList.contains('target'));
  const reminders=cards.filter(c=>!c.classList.contains('target'));
  const dec=window.SarniTargetStages?.decode;
  const d=new Date(),today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  // The backend may contain distinct IDs for accidentally repeated saves.
  // Hide only records with matching title, due date and complete stage content.
  // Never delete them or merge legitimately different achievements.
  const seen=new Set();
  let hiddenDuplicates=0;
  const uniqueTargets=targets.filter(card=>{
   const title=(card.querySelector('h4')?.textContent||'').trim().toLocaleLowerCase();
   const id=card.querySelector('[data-sticky-edit]')?.getAttribute('data-sticky-edit')||'';
   const stored=window.SarniTargetEditorBridge?.getNote?.(id);
   const original=String(stored?.text??card.querySelector('.sticky-full-text')?.textContent??'').trim();
   const decoded=window.SarniTargetStages?.decode?.(original);
   const normalize=v=>String(v||'').trim().replace(/\s+/g,' ');
   const canonical=decoded?.structured
    ?JSON.stringify([normalize(decoded.detail),decoded.stages.map(x=>[
       normalize(x.name),x.date||'',!!x.done,x.completedOn||'',normalize(x.remark)
      ])])
    :normalize(original);
   const due=String(stored?.dueDate||'');
   const signature=JSON.stringify([title,due,canonical]);
   if(seen.has(signature)){hiddenDuplicates++;return false;}
   seen.add(signature);return true;
  });
  const models=uniqueTargets.map(card=>{
   const parsed=dec?.(card.querySelector('.sticky-full-text')?.textContent||'');
   const stages=parsed?.structured?parsed.stages:null;
   const count=stages?stages.filter(x=>x.done).length:0;
   const next=stages?.find(x=>!x.done);
   const due=next?.date||'';
   return {name:card.querySelector('h4')?.textContent||'Target',count,stages,next,due,late:!!due&&due<today};
  });
  $('sarniCompareStats').innerHTML='<div><strong>'+models.length+'</strong><small>Distinct targets</small></div><div><strong>'+models.filter(x=>x.late).length+'</strong><small>Overdue stages</small></div><div><strong>'+reminders.length+'</strong><small>Reminders</small></div>'+
   (hiddenDuplicates?'<div class="sch-duplicate-info" role="status">'+hiddenDuplicates+' identical saved target '+(hiddenDuplicates===1?'copy':'copies')+' hidden on Home. Originals remain in Target &amp; Reminder.</div>':'');
  // Each target has a dedicated first column, spanning the visible stage rows.
  // Rebuild for Focus View instead of hiding rows so the title always remains visible.
  const rows=models.map((t,i)=>{
   const progress=t.stages?t.count*20:0;
   const all=t.stages||[];
   const focusIndex=all.findIndex(stage=>!stage.done);
   const visible=focusOnly&&all.length?[[focusIndex<0?4:focusIndex,all[focusIndex<0?4:focusIndex]]]:all.map((stage,j)=>[j,stage]);
   const span=Math.max(1,visible.length);
   const progressBars=Array.from({length:5},(_,j)=>'<span class="'+(all[j]?.done?'done':all[j]===t.next?'next':'')+'"></span>').join('');
   const titleCell='<th class="sch-target-name-cell sch-tone-'+(i%5)+'" scope="rowgroup" rowspan="'+span+'"><div class="sch-target-name-wrap"><span class="sch-target-heading">'+e(t.name)+'</span><span class="sch-target-percent">'+(t.stages?progress+'%':'Not set')+'</span><div class="sch-five-bars" aria-label="'+t.count+' of five achievements completed">'+progressBars+'</div></div></th>';
   if(!t.stages)return '<tr class="sch-target-stage sch-tone-'+(i%5)+' sch-no-stages">'+titleCell+'<td><span class="sch-stage-number">—</span></td><td class="sch-stage-achievement">Achievements not set</td><td>—</td><td><span class="sch-tag active">Set up</span></td><td>—</td></tr>';
   return visible.map(([j,stage],index)=>{
    const overdue=!stage.done&&!!stage.date&&stage.date<today;
    return '<tr class="sch-target-stage sch-tone-'+(i%5)+(overdue?' sch-late':'')+'">'+(index===0?titleCell:'')+
     '<td><span class="sch-stage-number">'+(j+1)+'</span></td>'+
     '<td class="sch-stage-achievement">'+e(stage.name||'Not specified')+'</td>'+
     '<td>'+e(stage.date||'—')+'</td>'+
     '<td><span class="sch-tag '+(stage.done?'complete':overdue?'late':'active')+'">'+(stage.done?'✓ Complete':overdue?'Overdue':'Pending')+'</span></td>'+
     '<td class="sch-stage-remark">'+e(stage.remark||'—')+'</td></tr>';
   }).join('');
  }).join('');
  const reminderRows=reminders.map((card,i)=>{
   const name=card.querySelector('h4')?.textContent||'Reminder';
   const due=card.querySelector('.sticky-due')?.textContent||'—';
   return '<tr class="sch-tone-'+(i%5)+'"><td class="sch-name">'+e(name)+'</td><td>'+e(due)+'</td></tr>';
  }).join('');
  const out=$('sarniCompareTargets');
  out.innerHTML='<div class="sch-table-wrap"><table class="sch-compact-table sch-target-table"><thead><tr><th>Target</th><th>No.</th><th>What to Achieve</th><th>Target Date</th><th>Status</th><th>Achievement Remark</th></tr></thead><tbody>'+ (rows||'<tr><td colspan="6" class="sch-empty">No active targets yet.</td></tr>')+'</tbody></table></div>'+
   (reminders.length?'<div class="sch-reminder-title">Reminders <span>'+reminders.length+'</span></div><div class="sch-table-wrap"><table class="sch-compact-table"><thead><tr><th>Reminder</th><th>Due / status</th></tr></thead><tbody>'+reminderRows+'</tbody></table></div>':'');
 }
 let focusOnly=false;
 const focusBtn=$('sarniCompareFocus');
 function updateFocusView(){
  targetDiv.classList.toggle('sch-focus-mode',focusOnly);
  focusBtn.setAttribute('aria-pressed',String(focusOnly));
  focusBtn.textContent=focusOnly?'All 5 stages':'Focus view';
  focusBtn.title=focusOnly?'Show every stage of each target':'Show only the next unfinished achievement of each target';
  renderTargets();
 }
 focusBtn.addEventListener('click',()=>{focusOnly=!focusOnly;updateFocusView();});
 updateFocusView();
 $('sarniCompareManage').addEventListener('click',()=>window.SarNiTargetsOpen?.());
 document.addEventListener('sarni:sticky-rendered',renderTargets);
 document.addEventListener('sarni:home-visible',()=>{load();renderTargets();});
 document.addEventListener('sarni:home-books-updated',()=>{let rows=window.SarniHomeBookApi?.peek?.();if(Array.isArray(rows)){items=rows;paintBooks();}});
 const app=$('appView'),home=$('overviewSection');
 if(app&&!app.classList.contains('hidden')&&home&&!home.classList.contains('hidden')){load();renderTargets();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();