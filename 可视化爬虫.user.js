// ==UserScript==
// @name         可视化爬虫
// @namespace    https://marvis.dev/
// @version      1.0
// @description  点页面元素选取，一键导出CSV
// @author       Marvis
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function(){
'use strict';
if(window.__crawlerLoaded)return;
window.__crawlerLoaded=true;
let itemSelector='',fields=[],hoverEl=null;
const $=id=>document.getElementById(id);

const s=document.createElement('style');
s.textContent='#crawler-panel{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#fff;border-top:2px solid #1a73e8;font:14px system-ui;max-height:55vh;overflow-y:auto;transition:transform .3s;box-shadow:0 -4px 20px rgba(0,0,0,.2)}#crawler-panel.mini{transform:translateY(calc(100% - 48px))}.cr-head{display:flex;align-items:center;padding:8px 12px;background:#1a73e8;color:#fff;cursor:pointer;user-select:none}.cr-head span{flex:1;font-weight:600;font-size:15px}.cr-head button{background:none;border:none;color:#fff;font-size:20px;padding:0 8px;cursor:pointer}.cr-body{padding:10px 12px}.cr-row{display:flex;align-items:center;gap:6px;margin:6px 0}.cr-row label{font-size:13px;color:#666;min-width:50px}.cr-row input,.cr-row select{flex:1;padding:7px;border:1px solid #ddd;border-radius:6px;font-size:14px}.cr-btn{border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;color:#fff}.cr-btn.success{background:#0b8043;padding:8px 16px}.cr-btn.danger{background:#e53935;padding:8px 16px}.cr-btn.small{padding:4px 10px;font-size:12px}.cr-field{border:1px solid #e0e0e0;border-radius:6px;padding:8px;margin:4px 0;background:#fafafa}.cr-log{background:#263238;color:#aed581;padding:8px;border-radius:6px;font-size:12px;max-height:100px;overflow-y:auto;margin-top:8px;display:none}.cr-highlight{outline:3px solid #1a73e8!important;outline-offset:-1px}';
document.head.appendChild(s);

const p=document.createElement('div');
p.id='crawler-panel';
p.className='mini';
p.innerHTML='<div class="cr-head" id="crToggle"><span>可视化爬虫</span><button id="crMinBtn">−</button></div><div class="cr-body"><div><div class="cr-row"><select id="crMode"><option value="item">选列表项（先点重复卡片）</option><option value="field">选字段（再点标题/价格等）</option></select></div><div class="cr-row"><label>列表项</label><input id="crItemSel" readonly placeholder="点击页面选取..." style="background:#f5f5f5"><button class="cr-btn small danger" id="crClearItem">×</button></div><div id="crFieldList"></div><div class="cr-row"><button class="cr-btn small success" id="crAddField">+ 添加字段</button></div></div><div style="margin-top:8px"><div class="cr-row"><select id="crPageType"><option value="none">不分页</option><option value="param">URL参数 ?page=</option><option value="path">路径 /page/2</option></select></div><div id="crPageConf" style="display:none"><div class="cr-row"><input id="crPageParam" placeholder="参数名" value="page" style="flex:1"><input id="crPageStart" placeholder="起始" value="1" type="number" style="width:55px;flex:none"><input id="crPageMax" placeholder="页数" value="3" type="number" style="width:55px;flex:none"></div></div><div class="cr-row" style="margin-top:8px"><button class="cr-btn success" id="crRun" style="flex:1">开始爬取</button><button class="cr-btn danger" id="crReset" style="flex:1">重置</button></div><div class="cr-row"><select id="crExportFmt"><option value="csv">导出CSV</option><option value="json">导出JSON</option></select></div></div><div class="cr-log" id="crLog"></div></div>';
document.body.appendChild(p);

function getSelector(el){
if(!el||el===document.body)return'body';
var parts=[],cur=el;
while(cur&&cur!==document.body){
var tag=cur.tagName.toLowerCase();
if(cur.id){parts.unshift('#'+cur.id);break;}
var cls=cur.classList.length>0?'.'+Array.from(cur.classList).slice(0,2).join('.'):'';
var idx=1,prev=cur.previousElementSibling;
while(prev){if(prev.tagName===cur.tagName)idx++;prev=prev.previousElementSibling;}
var next=cur.nextElementSibling,hasMore=false;
while(next){if(next.tagName===cur.tagName){hasMore=true;break;}next=next.nextElementSibling;}
parts.unshift(tag+cls+(idx>1||hasMore?':nth-child('+idx+')':''));
cur=cur.parentElement;
}
return parts.join(' > ');
}

function log(msg){$('crLog').style.display='block';$('crLog').innerHTML+=msg+'<br>';$('crLog').scrollTop=$('crLog').scrollHeight;}

function renderFields(){
var h='';
fields.forEach(function(f,i){
h+='<div class="cr-field"><div class="cr-row"><input value="'+f.name+'" onchange="window.__uf('+i+',\'name\',this.value)" placeholder="字段名" style="flex:1"><select onchange="window.__uf('+i+',\'attr\',this.value)" style="width:60px;flex:none"><option value="text" '+(f.attr==='text'?'selected':'')+'>文本</option><option value="href" '+(f.attr==='href'?'selected':'')+'>href</option><option value="src" '+(f.attr==='src'?'selected':'')+'>src</option></select></div><div class="cr-row"><input value="'+f.selector+'" readonly style="background:#f5f5f5;font-size:11px;flex:1"><button class="cr-btn small danger" onclick="window.__rf('+i+')">×</button></div></div>';
});
$('crFieldList').innerHTML=h||'<p style="font-size:12px;color:#999;padding:8px">未添加字段，切换"选字段"模式后点页面元素</p>';
}
window.__uf=function(i,k,v){fields[i][k]=v;};
window.__rf=function(i){fields.splice(i,1);renderFields();};

$('crToggle').addEventListener('click',function(e){if(e.target===$('crMinBtn'))return;p.classList.toggle('mini');$('crMinBtn').textContent=p.classList.contains('mini')?'+':'−';});
$('crMinBtn').addEventListener('click',function(e){e.stopPropagation();p.classList.toggle('mini');$('crMinBtn').textContent=p.classList.contains('mini')?'+':'−';});
$('crPageType').addEventListener('change',function(){$('crPageConf').style.display=this.value==='none'?'none':'block';});
$('crClearItem').addEventListener('click',function(){itemSelector='';$('crItemSel').value='';document.querySelectorAll('.cr-highlight,.cr-selected').forEach(function(el){el.classList.remove('cr-highlight','cr-selected');});});
$('crAddField').addEventListener('click',function(){var n=prompt('字段名称（如：标题）');if(!n)return;var a=confirm('提取属性？\n确定=文本 取消=href')?'text':(prompt('属性名','href')||'href');fields.push({name:n,selector:'',attr:a});renderFields();});

document.addEventListener('touchstart',function(e){
if(e.target.closest('#crawler-panel'))return;
if(hoverEl)hoverEl.classList.remove('cr-highlight');
hoverEl=e.target;hoverEl.classList.add('cr-highlight');
var sel=getSelector(hoverEl),txt=(hoverEl.textContent||'').trim().substring(0,50);
if($('crMode').value==='item'){itemSelector=sel;$('crItemSel').value=txt||sel;}
else{if(!itemSelector){alert('请先选列表项');return;}var nm=txt||'字段'+(fields.length+1);if(!fields.some(function(f){return f.selector===sel;})){fields.push({name:nm,selector:sel,attr:'text'});}renderFields();}
},{passive:true});

async function extract(doc){
var items=doc.querySelectorAll(itemSelector),data=[];
items.forEach(function(item){
var row={};
fields.forEach(function(f){
try{var el=item.querySelector(f.selector);if(!el){row[f.name]='';return;}row[f.name]=f.attr==='text'?el.textContent.trim():(el.getAttribute(f.attr)||el[f.attr]||'');}catch(ex){row[f.name]='';}
});
if(Object.values(row).some(function(v){return v;}))data.push(row);
});
return data;
}

async function fetchPage(url){
try{var r=await fetch(url);var h=await r.text();return new DOMParser().parseFromString(h,'text/html');}catch(e){log('失败:'+e.message);return null;}
}

$('crRun').addEventListener('click',async function(){
if(!itemSelector){alert('请先点击选取列表项');return;}if(fields.length===0){alert('请添加至少一个字段');return;}
$('crRun').disabled=true;$('crRun').textContent='爬取中...';
$('crLog').innerHTML='';$('crLog').style.display='block';
var allData=[],ptype=$('crPageType').value;
try{
if(ptype==='none'){allData=await extract(document);log('本页 '+allData.length+' 条');}
else{
var start=parseInt($('crPageStart').value)||1,max=parseInt($('crPageMax').value)||3,param=$('crPageParam').value||'page',base=location.href.split('?')[0].split('#')[0];
for(var pg=start;pg<start+max;pg++){
var url=ptype==='param'?base+(base.includes('?')?'&':'?')+param+'='+pg:base.replace(/\/page\/\d+/,'')+'/page/'+pg;
log('第'+pg+'页: '+url);
var doc=await fetchPage(url);if(!doc)break;
var pd=await extract(doc);if(pd.length===0){log('无数据，停止');break;}
allData=allData.concat(pd);log(' → 累计 '+allData.length+' 条');
await new Promise(function(r){setTimeout(r,600);});
}}
}catch(e){log('错误: '+e.message);}
if(allData.length>0){
var fmt=$('crExportFmt').value,ts=new Date().toISOString().replace(/[:.]/g,'-').substring(0,19),content,mime,ext;
if(fmt==='csv'){var hd=fields.map(function(f){return f.name;});content='\uFEFF'+hd.join(',')+'\n'+allData.map(function(r){return hd.map(function(h){return'"'+(r[h]||'').replace(/"/g,'""')+'"';}).join(',');}).join('\n');mime='text/csv;charset=utf-8';ext='csv';}
else{content=JSON.stringify(allData,null,2);mime='application/json';ext='json';}
var b=new Blob([content],{type:mime}),a=document.createElement('a');
a.href=URL.createObjectURL(b);a.download='crawl_'+ts+'.'+ext;a.click();
log('完成! '+allData.length+' 条，已下载');
}else log('未提取到数据');
$('crRun').disabled=false;$('crRun').textContent='开始爬取';
});

$('crReset').addEventListener('click',function(){itemSelector='';fields=[];$('crItemSel').value='';$('crLog').innerHTML='';$('crLog').style.display='none';document.querySelectorAll('.cr-highlight').forEach(function(el){el.classList.remove('cr-highlight');});renderFields();});
renderFields();
})();
