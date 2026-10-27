import "./chat.css";
import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";

type Task = { name: string; due: string; status: string; priority: string };
type Customer = { id: string; name: string; status: string };
type Deal = { id: string; followUp: string; note: string; value: number };
type Message = { role: "user" | "assistant"; text: string };
const providers = ["ChatGPT (OpenAI)", "Claude (Anthropic)", "Gemini (Google)", "Grok (xAI)", "Manus", "Codex / GitHub", "Metricool"];
const day = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-"); };

export function ChatHub({ tasks, customers, deals }: { tasks: Task[]; customers: Customer[]; deals: Deal[] }) {
  const [messages, setMessages] = useState<Message[]>([{role:"assistant",text:"สวัสดีค่ะเจ้านาย อามีน่าพร้อมช่วยสรุปงานและลูกค้าจากข้อมูลในแอปค่ะ\n\nขณะนี้เป็นแชตต้นแบบแบบไม่ใช้ API จึงยังไม่ใช่ ChatGPT จริง และยังสั่งงาน AI ภายนอกไม่ได้ ลองพิมพ์ “สรุปงาน”, “ติดตามลูกค้า” หรือ “AI ที่รองรับ” ได้เลยค่ะ"}]);
  const [input, setInput] = useState("");
  function reply(q: string) {
    const today = day();
    if (/ลูกค้า|crm|ติดตาม/i.test(q)) {
      const due = deals.filter(d => d.followUp && d.followUp <= today).filter(d => {
        const c = customers.find(c => c.id === d.id);
        return c && !["ปิดการขาย","ไม่สำเร็จ"].includes(c.status);
      });
      return due.length ? "ลูกค้าที่ถึงกำหนดติดตาม ("+due.length+" ราย):\n"+due.map(d => {
        const c = customers.find(c => c.id === d.id)!;
        return "• "+c.name+" — "+d.followUp+(d.note?" — "+d.note:"");
      }).join("\n") : "วันนี้ยังไม่มีลูกค้าที่ถึงกำหนดติดตามตามข้อมูลในเบราว์เซอร์นี้ค่ะ (รายชื่อลูกค้าทั้งหมด "+customers.length+" ราย)";
    }
    if (/งาน|สรุป|วันนี้|ค้าง/i.test(q)) {
      const pending = tasks.filter(t => t.status !== "เสร็จแล้ว");
      const due = pending.filter(t => t.due && t.due <= today);
      return "สรุปงานวันที่ "+today+"\nงานค้าง "+pending.length+" งาน | ถึงกำหนด "+due.length+" งาน\n"+(due.length?due.map(t=>"• "+t.name+" ("+t.due+")").join("\n"):"ยังไม่มีงานที่ถึงกำหนดค่ะ");
    }
    if (/ai|โมเดล|claude|cloude|gemini|grok|manus|codex|metricool|เชื่อม/i.test(q)) {
      return "แผนเชื่อมต่อ AI และเครื่องมือ:\n"+providers.map(p=>"• "+p+" — ยังไม่เชื่อม API ในเว็บแอป").join("\n")+"\n\nการเชื่อมต่อจริงต้องมี backend ที่เก็บคีย์ปลอดภัย และได้รับอนุญาตก่อนเปิดค่าใช้จ่ายค่ะ";
    }
    return "อามีน่ารับข้อความแล้วค่ะ แต่ตอนนี้ยังเป็นแชตต้นแบบ ไม่ได้ส่งข้อความนี้ไปยัง ChatGPT หรือ AI อื่น และยังดำเนินการตามคำสั่งอิสระไม่ได้ค่ะ\n\nลองพิมพ์ “สรุปงาน”, “ติดตามลูกค้า” หรือ “AI ที่รองรับ” ได้เลย";
  }
  function submit(e: FormEvent) {
    e.preventDefault(); const q=input.trim(); if(!q) return;
    setMessages(prev=>[...prev,{role:"user",text:q},{role:"assistant",text:reply(q)}]);setInput("");
  }
  return <main className="abbas-chat abbas-chat-only" aria-label="ABBAS AI Chat">
    <div className="abbas-chat-center">
      {messages.length === 1 && <section className="abbas-chat-hero"><div className="abbas-hero-orb"><Sparkles size={30}/></div><h1>ABBAS <span>AI</span></h1><p>มีอะไรให้อามีน่าช่วยวันนี้คะ?</p></section>}
      <div className="abbas-chat-messages" role="log" aria-live="polite">{messages.map((m,i)=><div key={i} className={"abbas-chat-bubble "+m.role}><span>{m.role==="assistant"?"อามีน่า":"เจ้านาย"}</span><p>{m.text}</p></div>)}</div>
      <form className="abbas-chat-form" onSubmit={submit}><input aria-label="ข้อความถึงอามีน่า" placeholder="ถามอามีน่าได้เลย..." value={input} onChange={e=>setInput(e.target.value)} /><button type="submit" className="abbas-invisible-submit" aria-label="ส่งข้อความ" tabIndex={-1}>ส่ง</button></form>
      <p className="abbas-chat-disclaimer">โหมดทดลอง · ยังไม่เชื่อมต่อ AI จริง · กด Enter เพื่อส่ง</p>
    </div>
  </main>;
}
