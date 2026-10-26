import { type Workflow } from "../features/useBusiness";
import { type Tool } from "../features/catalog";
/** Portable draft contract. No adapter, credentials or execution capability is included. */
export function compileWorkflowPlan(workflow: Workflow, tools: Tool[]) {
  if (
    !workflow.name.trim() ||
    !workflow.steps.length ||
    workflow.steps.some(
      (s) => !s.instruction.trim() || !tools.some((t) => t.id === s.toolId),
    )
  )
    throw Error(
      "กรอกชื่อและขั้นตอนให้ครบ และเลือกเครื่องมือที่ยังมีใน Directory",
    );
  return {
    schemaVersion: 2,
    mode: "draft_only",
    executionEnabled: false,
    workflowId: workflow.id,
    name: workflow.name,
    business: workflow.business,
    steps: workflow.steps.map((s, i) => ({
      stepId: `${workflow.id}-${i + 1}`,
      toolId: s.toolId,
      instruction: s.instruction,
      requiresHumanReview: true,
      inputReference: i === 0 ? "manual_input" : `step:${i}`,
      integrationState: "not_configured",
    })),
  };
}
