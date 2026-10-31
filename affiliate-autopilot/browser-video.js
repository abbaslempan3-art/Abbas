/* Local browser Video Studio. No API, no uploads, no external services. */
(()=>{
"use strict";
const el=id=>document.getElementById(id);
const canvas=el("videoCanvas");if(!canvas)return;
const ctx=canvas.getContext("2d");let image=null,recording=false;
function wrap(text,max){const words=Array.from(text||"");const lines=[];let s="";for(const ch of words){s+=ch;if(s.length>=max){lines.push(s);s=""}}if(s)lines.push(s);return lines.slice(0,5)}
function draw(sec=0){
 const w=canvas.width,h=canvas.height;
 const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,"#0d1b31");bg.addColorStop(1,"#233f67");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 if(image){const scale=Math.min((w-44)/image.width,(h-350)/image.height);const iw=image.width*scale,ih=image.height*scale;ctx.fillStyle="#f8fafc";ctx.fillRect(18,150,w-36,h-360);ctx.drawImage(image,(w-iw)/2,150+(h-360-ih)/2,iw,ih)}
 ctx.fillStyle="#ffdc45";ctx.fillRect(0,0,w,14);
 ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="bold 27px system-ui";ctx.fillText("AFFILIATE AI",w/2,70);
 ctx.font="bold 29px system-ui";const name=el("videoName").value.trim()||"ชื่อสินค้า";wrap(name,22).slice(0,2).forEach((line,i)=>ctx.fillText(line,w/2,110+i*32));
 ctx.fillStyle="rgba(5,14,30,.88)";ctx.fillRect(0,h-205,w,205);
 const points=el("videoFacts").value.trim()||"ตรวจสอบข้อมูลจากหน้าสินค้าก่อนซื้อ";ctx.fillStyle="#fff";ctx.font="22px system-ui";
 wrap(points,30).slice(0,3).forEach((line,i)=>ctx.fillText(line,w/2,h-154+i*31));
 ctx.fillStyle="#ffe07b";ctx.font="16px system-ui";ctx.fillText("ลิงก์แนะนำสินค้าอาจได้รับค่าคอมมิชชัน",w/2,h-32);
 if(sec>0){ctx.fillStyle="#ffdc45";ctx.fillRect(0,h-7,w*Math.min(sec/12,1),7)}
}
function status(s){el("videoStatus").textContent=s}
el("videoImage").addEventListener("change",e=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith("image/"))return status("กรุณาเลือกไฟล์รูปภาพ");if(file.size>15*1024*1024)return status("ภาพใหญ่เกิน 15 MB");const u=URL.createObjectURL(file);const im=new Image();im.onload=()=>{image=im;draw();URL.revokeObjectURL(u);status("โหลดภาพแล้ว · ภาพยังอยู่ในเครื่องนี้")};im.onerror=()=>{URL.revokeObjectURL(u);status("เปิดภาพไม่สำเร็จ")};im.src=u});
["videoName","videoFacts"].forEach(id=>el(id).addEventListener("input",()=>draw()));
el("videoProduct").addEventListener("change",()=>{const idx=Number(el("videoProduct").value);const p=(window.affiliateProducts||[])[idx];if(p){el("videoName").value=p.name;draw()}});
function download(blob,filename){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000)}
el("pngBtn").onclick=()=>{draw();canvas.toBlob(b=>b?download(b,"affiliate_cover.png"):status("ไม่สามารถส่งออกภาพได้"),"image/png")};
el("recordBtn").onclick=async()=>{
 if(recording)return;
 if(!canvas.captureStream||typeof MediaRecorder==="undefined")return status("เบราว์เซอร์นี้ยังไม่รองรับการบันทึกวิดีโอจาก Canvas กรุณาใช้ส่งออกภาพ PNG หรือทดลองบน Chrome/Edge คอมพิวเตอร์");
 const types=["video/mp4;codecs=avc1.42E01E","video/mp4","video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
 const mime=types.find(t=>MediaRecorder.isTypeSupported(t));if(!mime)return status("เบราว์เซอร์นี้ไม่รองรับตัวเข้ารหัสวิดีโอสำหรับฟังก์ชันนี้");
 let stream,recorder;try{stream=canvas.captureStream(24);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1700000})}catch(e){return status("ไม่สามารถเริ่มบันทึก: "+e.message)}
 const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onerror=()=>status("เกิดข้อผิดพลาดระหว่างบันทึก");
 recorder.onstop=()=>{recording=false;stream.getTracks().forEach(t=>t.stop());if(chunks.length){const type=recorder.mimeType||mime;download(new Blob(chunks,{type}),type.includes("mp4")?"affiliate_video.mp4":"affiliate_video.webm");status("สร้างวิดีโอแล้ว · ตรวจสอบไฟล์ก่อนโพสต์")}else status("ไม่สามารถสร้างไฟล์วิดีโอได้")};
 recording=true;el("recordBtn").disabled=true;status("กำลังบันทึก 12 วินาที · อย่าปิดหน้าเว็บหรือสลับแอป");
 const start=performance.now();draw(0);recorder.start(250);
 const tick=()=>{if(!recording)return;const elapsed=(performance.now()-start)/1000;draw(elapsed);if(elapsed<12){requestAnimationFrame(tick)}else{try{recorder.stop()}finally{el("recordBtn").disabled=false}}};requestAnimationFrame(tick);
};
window.affiliateVideoRefresh=products=>{window.affiliateProducts=products;const sel=el("videoProduct"),prev=sel.value;sel.replaceChildren(...products.map((p,i)=>{const o=document.createElement("option");o.value=String(i);o.textContent=p.name;return o}));if(products[Number(prev)])sel.value=prev;else if(products[0]){el("videoName").value=products[0].name}draw()};
draw();
})();