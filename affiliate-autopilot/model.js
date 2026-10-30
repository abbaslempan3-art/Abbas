export const PUBLISH_ENABLED = false;
export const CLOUD_ENABLED = false;
export const PRODUCT_KEY = 'aa_products';
export const QUEUE_KEY = 'aa_queue_v1';
export const disclosure = 'ลิงก์ Affiliate: ผู้แนะนำอาจได้รับค่าคอมมิชชัน กรุณาตรวจสอบรายละเอียดและราคาก่อนซื้อ';
export const sample = [{name:'SAMPLE — สินค้าตัวอย่าง ไม่ใช่คำแนะนำ',link:'https://shopee.co.th/'}];
const text = (s,max) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;
export function safeLink(s) {
  if (!text(s,2000)) throw Error('ลิงก์ไม่ถูกต้อง');
  const u = new URL(s);
  if (u.protocol !== 'https:' || !(u.hostname === 'shopee.co.th' || u.hostname.endsWith('.shopee.co.th')) || u.username || u.password || u.port || u.search || u.hash || /[\s\\]/.test(s)) throw Error('ใช้ HTTPS Shopee ไม่มี credentials, query หรือ fragment');
  return s;
}
export function products(value) {
  if (!Array.isArray(value) || value.length > 500) throw Error('รองรับสินค้าไม่เกิน 500 รายการ');
  return value.map(p => {
    if (!p || Object.keys(p).some(k => !['name','link'].includes(k)) || !text(p.name,300)) throw Error('รูปแบบสินค้าไม่ถูกต้อง');
    return {name:p.name.trim(),link:safeLink(p.link)};
  });
}
export function queue(value) {
  if (!Array.isArray(value) || value.length > 500) throw Error('คิวไม่ถูกต้อง');
  return value.map(q => {
    if (!q || Object.keys(q).some(k => !['name','link','script','status'].includes(k)) || !text(q.script,8000) || !['pending','approved','rejected'].includes(q.status)) throw Error('คิวไม่ถูกต้อง');
    return {...products([{name:q.name,link:q.link}])[0],script:q.script,status:q.status};
  });
}
export function parseImport(raw) {
  if (raw.length > 1000000) throw Error('ไฟล์ใหญ่เกิน 1 MB');
  const d = JSON.parse(raw);
  if (Array.isArray(d)) return products(d); // legacy product backup
  if (!d || d.version !== 1 || Object.keys(d).some(k => !['version','products'].includes(k))) throw Error('เวอร์ชันไฟล์ไม่ถูกต้อง');
  return products(d.products);
}
export function scriptFor(p, template, facts='') {
  if (!p) throw Error('เพิ่มสินค้าก่อน');
  return `${template === 'checklist' ? 'รายการตรวจสอบก่อนซื้อ' : 'มาดูข้อมูลสินค้า'}: ${p.name}\nข้อมูลที่ผู้ใช้ระบุ (ยังไม่ยืนยัน): ${facts || 'ไม่มีข้อมูลยืนยัน'}\nตรวจสเปก ราคา เงื่อนไข และรีวิวจากหน้าสินค้าด้วยตนเอง\nไม่อ้างว่าเคยใช้จริง ไม่สร้างยอดขายหรือคุณสมบัติ\n${p.link}\n${disclosure}`;
}
export function csv(items) {
  const cell = s => '"' + (/^[\s]*[=+@\-\t\r\n]/.test(s) ? "'"+s : s).replaceAll('"','""') + '"';
  return '\ufeffname,affiliate_link\r\n'+items.map(p=>[p.name,p.link].map(cell).join(',')).join('\r\n');
}
