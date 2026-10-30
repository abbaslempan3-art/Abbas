import {PRODUCT_KEY,QUEUE_KEY,sample,products,queue,parseImport,scriptFor,csv} from './model.js';
const $ = id => document.getElementById(id);
const notify = message => $('notice').textContent = message;
let items=[], jobs=[], editing=null, pending=null, blocked=false, baseline={}, draftProduct=null;
try {
  for (const key of [PRODUCT_KEY,QUEUE_KEY]) baseline[key]=localStorage.getItem(key);
  items=baseline[PRODUCT_KEY]===null ? sample : products(JSON.parse(baseline[PRODUCT_KEY]));
  jobs=baseline[QUEUE_KEY]===null ? [] : queue(JSON.parse(baseline[QUEUE_KEY]));
} catch { blocked=true; notify('อ่านข้อมูลไม่ได้: หยุดการเขียนเพื่อรักษาข้อมูลเดิม สำรองข้อมูล browser ก่อนแก้ไข'); }
function persist(key,value) {
  if (blocked) throw Error('การบันทึกถูกปิดเพื่อรักษาข้อมูลเดิม');
  for (const k of [PRODUCT_KEY,QUEUE_KEY]) if(localStorage.getItem(k)!==baseline[k]) throw Error('ข้อมูลเปลี่ยนในแท็บอื่น กรุณา reload');
  const raw=JSON.stringify(value); localStorage.setItem(key,raw); baseline[key]=raw;
}
function action(fn) { return () => {try {fn();} catch(e){notify(e.message);} }; }
function button(label,fn) {const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',action(fn));return b;}
function render() {
  $('count').textContent=String(items.length);
  const selected=$('productSelect').value;
  $('productSelect').replaceChildren(...items.map((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=p.name;return o;}));
  if(items[Number(selected)]) $('productSelect').value=selected;
  $('rows').replaceChildren(...items.map((p,i)=>{
    const tr=document.createElement('tr'), n=document.createElement('td'),l=document.createElement('td'),a=document.createElement('a'),ops=document.createElement('td');
    n.textContent=p.name;a.textContent='เปิดสินค้า';a.href=p.link;a.target='_blank';a.rel='noopener noreferrer';l.append(a);
    ops.append(button('แก้ไข',()=>{editing=i;$('name').value=p.name;$('link').value=p.link;$('save').textContent='บันทึกสินค้า';$('name').focus();}),button('ลบ',()=>{
      if(!confirm('ลบสินค้า? ร่างในคิวยังคงเก็บไว้'))return;
      const next=items.filter((_,j)=>j!==i);persist(PRODUCT_KEY,next);items=next;reset();render();
    }));tr.append(n,l,ops);return tr;
  }));
  $('queue').replaceChildren(...jobs.map((q,i)=>{
    const box=document.createElement('article'),title=document.createElement('h3'),pre=document.createElement('pre');title.textContent=q.name+' — '+({pending:'รอตรวจด้วยคน',approved:'ตรวจแล้วด้วยคน (ยังไม่เผยแพร่)',rejected:'ต้องแก้ไข'}[q.status]);pre.textContent=q.script;
    const status=s=>{const next=jobs.map((j,k)=>k===i?{...j,status:s}:j);persist(QUEUE_KEY,next);jobs=next;render();};
    box.append(title,pre,button('อนุมัติหลังตรวจข้อเท็จจริง/สิทธิ์สื่อ',()=>{if(confirm('ตรวจข้อเท็จจริง สิทธิ์สื่อ และ disclosure แล้ว? ไม่ใช่การเผยแพร่'))status('approved');}),button('ต้องแก้ไข',()=>status('rejected')),button('ลบร่าง',()=>{const next=jobs.filter((_,k)=>k!==i);persist(QUEUE_KEY,next);jobs=next;render();}));return box;
  }));
}
function reset(){editing=null;$('productForm').reset();$('save').textContent='เพิ่มสินค้า';draftProduct=null;$('draft').textContent='';$('aiPrompt').textContent='';}
$('productForm').addEventListener('submit',e=>{e.preventDefault();action(()=>{
  const p=products([{name:$('name').value,link:$('link').value}])[0];
  const next=[...items];if(editing===null)next.push(p);else {
    // Invalidate approvals first; failure cannot leave approved stale content.
    const old=items[editing];const revised=jobs.map(q=>q.link===old.link?{...q,status:'pending'}:q);persist(QUEUE_KEY,revised);jobs=revised;next[editing]=p;
  }
  products(next);persist(PRODUCT_KEY,next);items=next;reset();render();notify('บันทึกแล้ว');
})();});
$('cancel').onclick=reset;
function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('exportJson').onclick=action(()=>{if(blocked)throw Error('ข้อมูลเสียหาย: ใช้ browser tools สำรอง aa_products และ aa_queue_v1 แบบดิบก่อน');download(JSON.stringify({version:1,products:items},null,2),'application/json','affiliate-products.json');});
$('exportCsv').onclick=action(()=>{if(blocked)throw Error('หยุดส่งออกข้อมูลที่อ่านไม่ได้');download(csv(items),'text/csv','affiliate-products.csv');});
$('importFile').onchange=async()=>{pending=null;$('confirmImport').disabled=true;try{const f=$('importFile').files[0];if(!f)return;if(f.size>1000000)throw Error('ไฟล์ใหญ่เกิน 1 MB');pending=parseImport(await f.text());notify(`ตรวจแล้ว ${pending.length} รายการ — ยืนยันเพื่อเพิ่มโดยไม่ทับข้อมูลเดิม`);$('confirmImport').disabled=false;}catch(e){notify(e.message);}};
$('confirmImport').onclick=action(()=>{if(!pending)return;const next=products([...items,...pending.filter(p=>!items.some(x=>x.name===p.name&&x.link===p.link))]);persist(PRODUCT_KEY,next);items=next;pending=null;$('confirmImport').disabled=true;render();notify('นำเข้าแล้ว');});
const chosen=()=>items[Number($('productSelect').value)];
$('script').onclick=action(()=>{draftProduct=chosen();$('draft').textContent=scriptFor(draftProduct,$('template').value,$('facts').value);});
$('makePrompt').onclick=action(()=>{$('aiPrompt').textContent='ช่วยตรวจร่างต่อไปนี้ แยกข้อมูลที่ต้องตรวจสอบ ห้ามแต่งคุณสมบัติ ยอดขาย ราคา หรืออ้างประสบการณ์จริง จัดทำสคริปต์และช็อต 5 ฉาก 9:16 พร้อมคำบรรยายไทย ใช้สื่อที่มีสิทธิ์เท่านั้น ยังไม่โพสต์จริง\n'+scriptFor(chosen(),$('template').value,$('facts').value);});
$('copyPrompt').onclick=async()=>{try{await navigator.clipboard.writeText($('aiPrompt').textContent);notify('คัดลอกแล้ว');}catch{notify('กรุณาคัดลอกข้อความด้วยตนเอง');}};
$('enqueue').onclick=action(()=>{if(!draftProduct || !$('draft').textContent)throw Error('สร้างร่างสคริปต์ก่อน');const next=queue([...jobs,{...draftProduct,script:$('draft').textContent,status:'pending'}]);persist(QUEUE_KEY,next);jobs=next;render();});
for(const id of ['productSelect','template','facts'])$(id).addEventListener('input',()=>{draftProduct=null;$('draft').textContent='';$('aiPrompt').textContent='';});
render();
