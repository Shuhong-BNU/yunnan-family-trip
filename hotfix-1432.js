(function(){
function directCells(row){return Array.prototype.filter.call(row.children,function(x){return x.tagName==='TH'||x.tagName==='TD';});}
function prepareTable(table){
if(table.dataset.mobilePrepared==='1')return;
var wrap=table.closest('.archive-table-scroll,.tbl-scroll');if(!wrap)return;
var rows=Array.prototype.slice.call(table.rows||[]);if(rows.length<2)return;
var headerRow=rows[0],headerCells=directCells(headerRow);
var complex=headerCells.length<2||Array.prototype.some.call(table.querySelectorAll('[colspan],[rowspan]'),function(c){return Number(c.getAttribute('colspan')||1)>1||Number(c.getAttribute('rowspan')||1)>1;});
if(complex){wrap.classList.add('table-scroll-mode');table.dataset.mobilePrepared='1';return;}
var labels=headerCells.map(function(c){return(c.textContent||'').replace(/\s+/g,' ').trim();}),valid=true;
rows.slice(1).forEach(function(row){var cells=directCells(row);if(cells.length!==labels.length){valid=false;return;}cells.forEach(function(cell,i){cell.setAttribute('data-label',labels[i]||('第'+(i+1)+'列'));});});
if(!valid){wrap.classList.add('table-scroll-mode');table.dataset.mobilePrepared='1';return;}
headerRow.classList.add('table-header-row');
var bar=document.createElement('div');bar.className='table-view-toggle';
var card=document.createElement('button');card.type='button';card.textContent='卡片查看';
var scroll=document.createElement('button');scroll.type='button';scroll.textContent='横向表格';
var tip=document.createElement('span');tip.className='table-tip';tip.textContent='手机推荐卡片';
function setMode(mode){var cardMode=mode==='card';wrap.classList.toggle('table-card-mode',cardMode);wrap.classList.toggle('table-scroll-mode',!cardMode);card.classList.toggle('active',cardMode);scroll.classList.toggle('active',!cardMode);try{sessionStorage.setItem('trip-table-mode',mode);}catch(e){}}
card.onclick=function(){setMode('card');};scroll.onclick=function(){setMode('scroll');};
bar.appendChild(card);bar.appendChild(scroll);bar.appendChild(tip);wrap.insertBefore(bar,wrap.firstChild);
var saved='';try{saved=sessionStorage.getItem('trip-table-mode')||'';}catch(e){}setMode(saved==='scroll'?'scroll':'card');table.dataset.mobilePrepared='1';
}
function addVersionRecord(){
var rows=document.querySelectorAll('.archive table tr');var found=false;
rows.forEach(function(row){if((row.textContent||'').indexOf('v14.3.2')>=0)found=true;});
if(found)return;
rows.forEach(function(row){if((row.textContent||'').indexOf('v14.3.1')>=0){var n=document.createElement('tr');n.innerHTML='<td>v14.3.2</td><td>移动表格修复</td><td>研究表格在手机端默认转为逐行卡片，完整显示每列；同时保留“横向表格”切换。</td>';row.parentNode.insertBefore(n,row.nextSibling);}});
var footer=document.querySelector('.archive footer');if(footer)footer.textContent=footer.textContent.replace('v14.3.1','v14.3.2');
}
function enhance(){document.querySelectorAll('.archive table').forEach(prepareTable);addVersionRecord();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else setTimeout(enhance,0);
window.addEventListener('pageshow',enhance);
document.addEventListener('toggle',function(e){if(e.target&&e.target.matches&&e.target.matches('details.archive-section')&&e.target.open)setTimeout(enhance,0);},true);
})();