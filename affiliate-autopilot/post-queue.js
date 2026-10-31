/* Local posting planner: no network, no tokens, no actual publishing. */
(()=>{
"use strict";
const $=id=>document.getElementById(id),key="aa_post_queue_v1";
let queue=[];try{const v=JSON.parse(localStorage.getItem(key));if(Array.isArray(v))queue=v.filter(x=>x&&typeof x==="object")}catch{}
const providers=["facebook","youtube","instagram","shopee"];
const safeText=v=>String(v||"").slice(0,500);
function save(){try{localStorage.setItem(key,JSON.stringify(queue))}catch{alert("บันทึกไม่สำเร็จ โปรดส่งออก CSV สำรอง")}}
function status(t){$("queueMessage").textContent=t}
function draw(){
 $("queueCount").textContent=queue.length;
 const body=$("queueRows");body.replaceChildren();
 queue.slice().sort((a,b)=>a.when.localeCompare(b.when)).forEach(item=>{
  const tr=document.createElement("tr");
  for(const value of [item.name,item.networks.join(", "),item.when.replace("T"," "),item.state]){
   const td=document.createElement("td");td.textContent=value;tr.append(td);
  }
  const actions=document.createElement("td");
  const del=document.createElement("button");del.className="secondary";del.textContent="ลบ";del.onclick=()=>{if(confirm("ลบรายการนี้จากคิว?")){queue=queue.filter(x=>x.id!==item.id);save();draw()}};
  const edit=document.createElement("button");edit.className="secondary";edit.textContent="แก้ไข";edit.onclick=()=>{const when=prompt("กำหนดวันเวลาใหม่ รูปแบบ YYYY-MM-DDTHH:MM",item.when);if(when===null)return;if(!/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$/.test(when)||Number.isNaN(new Date(when).getTime()))return alert("วันเวลาไม่ถูกต้อง");item.when=when;save();draw()};
  actions.append(edit,del);tr.append(actions);body.append(tr);
 });
 if(!queue.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=5;td.textContent="ยังไม่มีรายการในคิว";td.className="muted";tr.append(td);body.append(tr)}
}
$("queueForm").addEventListener("submit",e=>{
 e.preventDefault();
 const name=$("queueTitle").value.trim(),when=$("queueDate").value,networks=providers.filter(n=>$("net_"+n).checked);
 if(!name||!when||!networks.length)return status("กรอกชื่อ วันเวลา และเลือกแพลตฟอร์ม");
 if(new Date(when).getTime()<=Date.now())return status("กรุณาเลือกวันเวลาในอนาคต");
 if(queue.length>=200)return status("คิวเต็ม 200 รายการ กรุณาส่งออกข้อมูลและลบรายการเก่า");
 queue.push({id:String(Date.now())+"-"+Math.random().toString(36).slice(2),name:safeText(name),when,networks,state:"รอเชื่อมระบบเผยแพร่",created:new Date().toISOString()});save();draw();$("queueTitle").value="";status("เพิ่มคิวในเบราว์เซอร์แล้ว · ยังไม่ได้ตั้งเวลาโพสต์จริง");
});
$("queueExport").onclick=()=>{
 const rows=[["title","platforms","scheduled_local_time","status"],...queue.map(x=>[x.name,x.networks.join("|"),x.when,x.state])];
 const csv=rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download="affiliate_post_queue.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
};
$("queueClear").onclick=()=>{if(!queue.length)return;if(confirm("ลบคิวทั้งหมดจากเบราว์เซอร์นี้?")){queue=[];save();draw()}};
draw();
})();