export const categories = [
  "AI Assistants & Research",
  "AI Agents & Development",
  "Marketing & Sales",
  "Creative, Image & Video",
  "Automation",
  "Business & Analytics",
] as const;
export const businesses = [
  "AI Marketing Studio",
  "AI Kids Content Studio",
  "ซื้อขายสินค้าและมอเตอร์ไซค์มือสอง",
  "บริหารร้านอาหาร",
  "เลขานุการส่วนตัวและติดตามโครงการ",
] as const;
export const jobs = [
  "วิจัยและวางแผน",
  "พัฒนาโปรแกรม",
  "การตลาดและขาย",
  "สร้างภาพและวิดีโอ",
  "ทำงานอัตโนมัติ",
  "วิเคราะห์ธุรกิจ",
] as const;
export type Tool = {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  jobs: string[];
  custom?: boolean;
};
// Keep explicit IDs stable when renaming or reordering tools: saved plans and budgets reference them.
const groups: {
  category: (typeof categories)[number];
  job: (typeof jobs)[number];
  entries: [string, string, string, string][];
}[] = [
  {
    category: categories[0],
    job: jobs[0],
    entries: [
      [
        "tool-chatgpt",
        "ChatGPT",
        "https://chatgpt.com",
        "ผู้ช่วยเขียน วิเคราะห์ และวางแผน",
      ],
      [
        "tool-gemini",
        "Gemini",
        "https://gemini.google.com",
        "ผู้ช่วย AI ของ Google",
      ],
      [
        "tool-claude",
        "Claude",
        "https://claude.ai",
        "เขียน วิเคราะห์ และทำงานกับเอกสาร",
      ],
      ["tool-grok", "Grok", "https://grok.com", "ผู้ช่วยค้นคว้าและสร้างไอเดีย"],
      [
        "tool-perplexity",
        "Perplexity",
        "https://www.perplexity.ai",
        "ค้นคว้าข้อมูลพร้อมแหล่งอ้างอิง",
      ],
      [
        "tool-deepseek",
        "DeepSeek",
        "https://www.deepseek.com",
        "ผู้ช่วยสนทนาและให้เหตุผล",
      ],
      [
        "tool-microsoft-copilot",
        "Microsoft Copilot",
        "https://copilot.microsoft.com",
        "ผู้ช่วย AI ของ Microsoft",
      ],
      [
        "tool-notebooklm",
        "NotebookLM",
        "https://notebooklm.google.com",
        "ค้นคว้าและสรุปจากเอกสารต้นทาง",
      ],
      [
        "tool-le-chat",
        "Le Chat",
        "https://chat.mistral.ai",
        "ผู้ช่วย AI ของ Mistral",
      ],
    ],
  },
  {
    category: categories[1],
    job: jobs[1],
    entries: [
      ["tool-manus-ai", "Manus AI", "https://manus.im", "แพลตฟอร์ม AI agent"],
      [
        "tool-codex",
        "Codex",
        "https://chatgpt.com/codex",
        "ผู้ช่วยพัฒนาซอฟต์แวร์ของ OpenAI",
      ],
      [
        "tool-replit-agent",
        "Replit Agent",
        "https://replit.com/ai",
        "สร้างแอปด้วย AI บน Replit",
      ],
      [
        "tool-cursor",
        "Cursor",
        "https://cursor.com",
        "โปรแกรมแก้ไขโค้ดพร้อม AI",
      ],
      [
        "tool-github-copilot",
        "GitHub Copilot",
        "https://github.com/features/copilot",
        "ผู้ช่วยเขียนโค้ดของ GitHub",
      ],
    ],
  },
  {
    category: categories[2],
    job: jobs[2],
    entries: [
      [
        "tool-metricool",
        "Metricool",
        "https://metricool.com",
        "วางแผนและวิเคราะห์โซเชียลมีเดีย",
      ],
      [
        "tool-hubspot",
        "HubSpot",
        "https://www.hubspot.com",
        "CRM การตลาดและการขาย",
      ],
      [
        "tool-canva",
        "Canva",
        "https://www.canva.com",
        "ออกแบบสื่อและงานนำเสนอ",
      ],
      [
        "tool-buffer",
        "Buffer",
        "https://buffer.com",
        "วางแผนเผยแพร่โซเชียลมีเดีย",
      ],
      [
        "tool-mailchimp",
        "Mailchimp",
        "https://mailchimp.com",
        "อีเมลมาร์เก็ตติ้ง",
      ],
      [
        "tool-apollo",
        "Apollo",
        "https://www.apollo.io",
        "แพลตฟอร์มค้นหาลูกค้าและการขาย",
      ],
      [
        "tool-semrush",
        "Semrush",
        "https://www.semrush.com",
        "SEO และการตลาดดิจิทัล",
      ],
      [
        "tool-vidiq",
        "vidIQ",
        "https://vidiq.com",
        "วิเคราะห์และพัฒนาช่อง YouTube",
      ],
    ],
  },
  {
    category: categories[3],
    job: jobs[3],
    entries: [
      [
        "tool-sora",
        "Sora",
        "https://openai.com/sora/",
        "สร้างวิดีโอด้วย AI ของ OpenAI",
      ],
      [
        "tool-runway",
        "Runway",
        "https://runwayml.com",
        "สร้างและตัดต่อวิดีโอด้วย AI",
      ],
      [
        "tool-kling-ai",
        "Kling AI",
        "https://klingai.com",
        "สร้างภาพและวิดีโอด้วย AI",
      ],
      ["tool-pika", "Pika", "https://pika.art", "สร้างวิดีโอด้วย AI"],
      [
        "tool-leonardo-ai",
        "Leonardo AI",
        "https://leonardo.ai",
        "สร้างภาพและสื่อสร้างสรรค์",
      ],
      [
        "tool-midjourney",
        "Midjourney",
        "https://www.midjourney.com",
        "สร้างภาพด้วย AI",
      ],
      [
        "tool-ideogram",
        "Ideogram",
        "https://ideogram.ai",
        "สร้างภาพและงานออกแบบด้วย AI",
      ],
      [
        "tool-capcut",
        "CapCut",
        "https://www.capcut.com",
        "ตัดต่อวิดีโอและสร้างสื่อ",
      ],
      [
        "tool-elevenlabs",
        "ElevenLabs",
        "https://elevenlabs.io",
        "สร้างเสียงและเสียงพูดด้วย AI",
      ],
      [
        "tool-heygen",
        "HeyGen",
        "https://www.heygen.com",
        "สร้างวิดีโออวตาร AI",
      ],
    ],
  },
  {
    category: categories[4],
    job: jobs[4],
    entries: [
      ["tool-n8n", "n8n", "https://n8n.io", "แพลตฟอร์ม workflow automation"],
      [
        "tool-make",
        "Make",
        "https://www.make.com",
        "ออกแบบระบบอัตโนมัติแบบภาพ",
      ],
      [
        "tool-zapier",
        "Zapier",
        "https://zapier.com",
        "เชื่อมขั้นตอนการทำงานระหว่างแอป",
      ],
      [
        "tool-pipedream",
        "Pipedream",
        "https://pipedream.com",
        "พัฒนา workflow และ API integration",
      ],
      [
        "tool-ifttt",
        "IFTTT",
        "https://ifttt.com",
        "สร้าง automation แบบเงื่อนไข",
      ],
    ],
  },
  {
    category: categories[5],
    job: jobs[5],
    entries: [
      [
        "tool-google-ai-studio",
        "Google AI Studio",
        "https://aistudio.google.com",
        "พื้นที่ทดลองและพัฒนากับโมเดล Google",
      ],
      [
        "tool-power-bi",
        "Power BI",
        "https://www.microsoft.com/power-platform/products/power-bi",
        "วิเคราะห์และแสดงผลข้อมูลธุรกิจ",
      ],
      [
        "tool-looker-studio",
        "Looker Studio",
        "https://lookerstudio.google.com",
        "สร้างรายงานและ dashboard",
      ],
      [
        "tool-airtable",
        "Airtable",
        "https://www.airtable.com",
        "จัดการข้อมูลและกระบวนการธุรกิจ",
      ],
      [
        "tool-notion-ai",
        "Notion AI",
        "https://www.notion.com/product/ai",
        "ผู้ช่วย AI ในพื้นที่ทำงาน Notion",
      ],
      ["tool-gamma", "Gamma", "https://gamma.app", "สร้างงานนำเสนอและเอกสาร"],
      [
        "tool-fathom",
        "Fathom",
        "https://fathom.video",
        "ผู้ช่วยบันทึกและสรุปการประชุม",
      ],
    ],
  },
];
export const catalog: Tool[] = groups.flatMap((group) =>
  group.entries.map(([id, name, url, description]) => ({
    id,
    name,
    url,
    description,
    category: group.category,
    jobs: [group.job],
  })),
);
export function safeUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.search &&
      !u.hash &&
      u.hostname.includes(".") &&
      !/^(localhost|127\.|0\.|192\.168\.|10\.|169\.254\.)/.test(u.hostname)
    );
  } catch {
    return false;
  }
}
