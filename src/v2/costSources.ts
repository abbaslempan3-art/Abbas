export type CostSource = {
  toolId: string;
  url: string;
  reviewedOn: string | null;
  freePlan: string;
  quota: string;
  monthlyLimit: number | null;
  unit: string;
  limitations: string;
  trial: string;
  risk: string;
};
const unverified = (toolId: string, url: string): CostSource => ({
  toolId,
  url,
  reviewedOn: null,
  freePlan: "ยังไม่ยืนยันจากผู้ให้บริการ",
  quota: "ยังไม่ยืนยัน — อย่าใช้เป็นงบหรือโควตาจริง",
  monthlyLimit: null,
  unit: "หน่วยที่ติดตามเอง",
  limitations:
    "ต้องตรวจแพ็กเกจ บัญชี ประเทศ และสิทธิ์ใช้งานจากผู้ให้บริการก่อน",
  trial: "ยังไม่ยืนยันระยะทดลองหรือวันหมดอายุ",
  risk: "อาจมีค่าสมัคร ค่า API หรือค่าใช้เกินโควตา แพ็กเกจเว็บไซต์ไม่ยืนยันสิทธิ์ API",
});
export const costSources: CostSource[] = [
  unverified("tool-chatgpt", "https://openai.com/chatgpt/pricing/"),
  unverified("tool-gemini", "https://gemini.google/subscriptions/"),
  unverified("tool-claude", "https://claude.com/pricing"),
  unverified("tool-grok", "https://x.ai/grok"),
  unverified("tool-manus-ai", "https://manus.im/pricing"),
  unverified("tool-codex", "https://developers.openai.com/codex/pricing/"),
  {
    toolId: "tool-github-copilot",
    url: "https://github.com/features/copilot/plans",
    reviewedOn: "2026-10-26",
    freePlan: "หน้าแผนระบุ Free $0 ณ วันที่ตรวจ ไม่ใช่การรับรองว่าฟรีตลอดไป",
    quota:
      "Free: 2,000 inline suggestions ต่อเดือน และ limited chat/agent usage (ไม่ระบุตัวเลข chat ในส่วนที่ตรวจ)",
    monthlyLimit: 2000,
    unit: "inline suggestions",
    limitations:
      "Free ไม่รวมทุกฟีเจอร์ของแพ็กเกจจ่ายเงิน สิทธิ์และโมเดลอาจเปลี่ยน ต้องตรวจบัญชีจริงอีกครั้ง",
    trial:
      "ไม่พบวันสิ้นสุดทดลองรายบัญชีในหน้าแผนสาธารณะที่ตรวจ จึงไม่ยืนยันวันหมดอายุ",
    risk: "มีแพ็กเกจและ credits แบบจ่ายเงิน การอัปเกรดหรือเปิด billing ต้องได้รับอนุญาตก่อน",
  },
];
