import { catalog, type Tool } from "../features/catalog";
export type IntegrationState = "link_only" | "connected" | "unavailable";
export const statusLabels: Record<IntegrationState, string> = {
  link_only: "ลิงก์เท่านั้น",
  connected: "เชื่อมต่อจริง",
  unavailable: "ยังไม่พร้อมใช้งาน",
};
/** No live adapter or verified server session exists in V2. Browser storage cannot assert connected. */
export function integrationState(
  tool: Tool | undefined,
  action: "website" | "execute" = "website",
): IntegrationState {
  return tool && action === "website" ? "link_only" : "unavailable";
}
export const commandProviderIds = [
  "tool-chatgpt",
  "tool-gemini",
  "tool-claude",
  "tool-grok",
  "tool-manus-ai",
  "tool-codex",
  "tool-github-copilot",
  "tool-notebooklm",
  "tool-microsoft-copilot",
];
export const departments = [
  "การตลาด",
  "การขาย",
  "CRM",
  "การเงิน",
  "ร้านอาหาร",
  "โครงการ",
] as const;
export type Department = (typeof departments)[number];
export type BusinessTask = {
  id: string;
  name: string;
  project: string;
  due: string;
  priority: string;
  status: string;
  department?: string;
};
export function providerName(id: string) {
  return catalog.find((t) => t.id === id)?.name || "ไม่พบเครื่องมือ";
}
