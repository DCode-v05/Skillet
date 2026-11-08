import type { JsonWidget } from "@/lib/types/engine-widgets";
import { validateComparisonTable } from "./comparison-table/validate";
import { validateChips } from "./chips/validate";
import { validateNotice } from "./notice/validate";
import { validateList } from "./list/validate";
import { validateChart } from "./chart/validate";
import { validatePlan } from "./plan/validate";
import { validateDashboard } from "./dashboard/validate";
import { validateCodeBlock } from "./code_block/validate";
import { validateMap } from "./map/validate";
import { validateDiagram } from "./diagram/validate";
import { validateInteractive } from "./interactive/validate";
import { validateDecision } from "./decision/validate";

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  summary: string;
}

interface JsonSkillEntry {
  intent: JsonWidget["widget"];
  validate: (input: unknown) => ValidationResult;
}

const ENTRIES: ReadonlyArray<JsonSkillEntry> = [
  { intent: "comparison-table", validate: validateComparisonTable },
  { intent: "chips", validate: validateChips },
  { intent: "notice", validate: validateNotice },
  { intent: "list", validate: validateList },
  { intent: "chart", validate: validateChart },
  { intent: "plan", validate: validatePlan },
  { intent: "dashboard", validate: validateDashboard },
  { intent: "code-block", validate: validateCodeBlock },
  { intent: "map", validate: validateMap },
  { intent: "diagram", validate: validateDiagram },
  { intent: "interactive", validate: validateInteractive },
  { intent: "decision", validate: validateDecision },
];

const BY_INTENT: ReadonlyMap<string, JsonSkillEntry> = new Map(
  ENTRIES.map((e) => [e.intent, e]),
);

export const JSON_INTENTS: ReadonlyArray<JsonWidget["widget"]> = ENTRIES.map(
  (e) => e.intent,
);

export function getJsonSkill(intent: string): JsonSkillEntry | null {
  return BY_INTENT.get(intent) ?? null;
}

export function isJsonIntent(intent: string): intent is JsonWidget["widget"] {
  return BY_INTENT.has(intent);
}
