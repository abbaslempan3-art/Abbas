import "./chat.css";
import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";

type Message = { role: "user" | "assistant"; text: string };
export function ChatHub(_props: { tasks: unknown[]; customers: unknown[]; deals: unknown[] }) {
  const [messages, setMessages] = useState<Message[]>([{role:"assistant",text:"สวัสดีค่ะเจ้านาย อามีน่าพร้อมสนทนาผ่าน Gemini AI ค่ะ\n\nตอนนี้ยังไม่ได้เชื่อมต่อระบบงานหรือลูกค้าโดยตรง จึงยังไม่สามารถแก้ไขข้อมูลหรือสั่งงานภายนอกแทนเจ้านายได้ค่ะ"}]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    if (!accessToken.trim()) { setMessages(prev => [...prev, { role: "assistant", text: "กรุณากรอกรหัสเข้าใช้งาน Abbas AI ก่อนค่ะ (ไม่ใช่ Gemini API Key)" }]); return; }
    const next = [...messages, { role: "user" as const, text: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-abbas-access-token": accessToken },
        body: JSON.stringify({ messages: next.slice(1).slice(-20) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "ระบบ AI ไม่พร้อมใช้งานค่ะ");
      if (typeof data.text !== "string") throw new Error("ไม่พบคำตอบจาก Gemini ค่ะ");
      setMessages(prev => [...prev, { role: "assistant", text: data.text }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถเชื่อมต่อ AI ได้ค่ะ";
      setMessages(prev => [...prev, { role: "assistant", text: message + "\n\nสามารถลองส่งข้อความใหม่ได้ค่ะ" }]);
    } finally { setBusy(false); }
  }
  return <main className="abbas-chat abbas-chat-only" aria-label="ABBAS AI Chat">
    <div className="abbas-chat-center">
      {messages.length === 1 && <section className="abbas-chat-hero"><div className="abbas-hero-orb"><Sparkles size={30}/></div><h1>ABBAS <span>AI</span></h1><p>มีอะไรให้อามีน่าช่วยวันนี้คะ?</p></section>}
      <div className="abbas-chat-messages" role="log" aria-live="polite">{messages.map((m,i)=><div key={i} className={"abbas-chat-bubble "+m.role}><span>{m.role==="assistant"?"อามีน่า":"เจ้านาย"}</span><p>{m.text}</p></div>)}</div>
      <form className="abbas-chat-form" onSubmit={submit}><input type="password" autoComplete="off" aria-label="รหัสเข้าใช้งาน Abbas AI" placeholder="รหัสเข้าใช้งาน Abbas AI (ไม่ใช่ API Key)" value={accessToken} onChange={e=>setAccessToken(e.target.value)} /><input aria-label="ข้อความถึงอามีน่า" placeholder={busy ? "อามีน่ากำลังตอบ..." : "ถามอามีน่าได้เลย..."} disabled={busy} value={input} onChange={e=>setInput(e.target.value)} /><button type="submit" className="abbas-invisible-submit" aria-label="ส่งข้อความ" tabIndex={-1}>ส่ง</button></form>
      <p className="abbas-chat-disclaimer">Gemini AI · รหัสเข้าใช้งานเก็บเฉพาะระหว่างเปิดหน้านี้ · ไม่ใช่ API Key</p>
    </div>
  </main>;
}
