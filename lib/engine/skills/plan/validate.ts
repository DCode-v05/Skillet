import type { PlanWidget } from "@/lib/types/widgets/plan";
import {
  asObject,
  buildResult,
  checkPlaceholders,
  requireKeys,
  uniqueIds,
  type ValidationResult,
} from "../_shared/validate-helpers";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseISO(s: string): number {
  if (!ISO_DATE_RE.test(s)) return NaN;
  const t = Date.parse(s + "T00:00:00Z");
  if (Number.isNaN(t)) return NaN;
  const d = new Date(t);
  const round =
    d.getUTCFullYear().toString().padStart(4, "0") +
    "-" +
    (d.getUTCMonth() + 1).toString().padStart(2, "0") +
    "-" +
    d.getUTCDate().toString().padStart(2, "0");
  return round === s ? t : NaN;
}

export function validatePlan(input: unknown): ValidationResult {
  const issues: string[] = [];
  const data = asObject(input, issues);
  if (!data) return buildResult(issues, "");

  checkPlaceholders(data, issues);
  requireKeys(data, ["widget", "version", "variant", "title"], issues);
  if (issues.length > 0) return buildResult(issues, "");

  if (data.widget !== "plan") {
    issues.push(`widget must be 'plan', got '${String(data.widget)}'`);
  }
  if (typeof data.title !== "string" || data.title.length === 0) {
    issues.push(`title must be a non-empty string`);
  }

  if (data.variant === "steps") return validateSteps(data, issues);
  if (data.variant === "dated") return validateDated(data, issues);
  if (data.variant === "schedule") return validateSchedule(data, issues);
  issues.push(
    `variant must be 'steps', 'dated', or 'schedule', got '${String(data.variant)}'`,
  );
  return buildResult(issues, "");
}

function validateSteps(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  if (!Array.isArray(data.items)) {
    issues.push(`items must be an array`);
    return buildResult(issues, "");
  }
  const items = data.items as Array<Record<string, unknown>>;
  if (items.length < 3 || items.length > 6) {
    issues.push(`items must have 3-6 entries, got ${items.length}`);
  }
  uniqueIds(items, "item", issues);

  let currentCount = 0;
  let prevN = -Infinity;
  for (const it of items) {
    for (const k of ["id", "n", "title", "current", "clickPrompt"]) {
      if (!(k in it)) {
        issues.push(`item '${String(it.id ?? "?")}' missing field '${k}'`);
      }
    }
    if (typeof it.n !== "number" || !Number.isFinite(it.n)) {
      issues.push(`item '${String(it.id ?? "?")}' n must be a finite number`);
    } else {
      if (it.n <= prevN) {
        issues.push(
          `item '${String(it.id ?? "?")}' n must increase monotonically (got ${it.n} after ${prevN})`,
        );
      }
      prevN = it.n;
    }
    if (typeof it.title !== "string" || (it.title as string).length === 0) {
      issues.push(`item '${String(it.id ?? "?")}' title must be a non-empty string`);
    }
    if (typeof it.current !== "boolean") {
      issues.push(`item '${String(it.id ?? "?")}' current must be a boolean`);
    } else if (it.current) {
      currentCount += 1;
    }
    if (typeof it.clickPrompt !== "string" || (it.clickPrompt as string).length === 0) {
      issues.push(`item '${String(it.id ?? "?")}' clickPrompt must be non-empty`);
    }
  }
  if (currentCount > 1) {
    issues.push(`at most one item may have current: true, got ${currentCount}`);
  }
  return buildResult(
    issues,
    `OK: plan/steps valid (${items.length} step${items.length === 1 ? "" : "s"})`,
  );
}

function validateDated(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  if (!Array.isArray(data.events)) {
    issues.push(`events must be an array`);
    return buildResult(issues, "");
  }
  const events = data.events as Array<Record<string, unknown>>;
  if (events.length < 3 || events.length > 8) {
    issues.push(`events must have 3-8 entries, got ${events.length}`);
  }
  uniqueIds(events, "event", issues);

  let accentCount = 0;
  for (const e of events) {
    for (const k of ["id", "date", "title", "accent", "clickPrompt"]) {
      if (!(k in e)) {
        issues.push(`event '${String(e.id ?? "?")}' missing field '${k}'`);
      }
    }
    if (typeof e.date !== "string" || (e.date as string).length === 0) {
      issues.push(`event '${String(e.id ?? "?")}' date must be a non-empty string`);
    }
    if (typeof e.title !== "string" || (e.title as string).length === 0) {
      issues.push(`event '${String(e.id ?? "?")}' title must be a non-empty string`);
    }
    if (typeof e.accent !== "boolean") {
      issues.push(`event '${String(e.id ?? "?")}' accent must be a boolean`);
    } else if (e.accent) {
      accentCount += 1;
    }
    if (typeof e.clickPrompt !== "string" || (e.clickPrompt as string).length === 0) {
      issues.push(`event '${String(e.id ?? "?")}' clickPrompt must be non-empty`);
    }
  }
  if (accentCount > 1) {
    issues.push(`at most one event may have accent: true, got ${accentCount}`);
  }
  return buildResult(
    issues,
    `OK: plan/dated valid (${events.length} event${events.length === 1 ? "" : "s"})`,
  );
}

function validateSchedule(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  const range = data.dateRange as Record<string, unknown> | undefined;
  if (!range || typeof range !== "object" || Array.isArray(range)) {
    issues.push(`dateRange must be an object { startISO, endISO }`);
    return buildResult(issues, "");
  }
  const rangeStart = parseISO(String(range.startISO ?? ""));
  const rangeEnd = parseISO(String(range.endISO ?? ""));
  if (Number.isNaN(rangeStart)) {
    issues.push(`dateRange.startISO must be a valid YYYY-MM-DD date, got '${String(range.startISO)}'`);
  }
  if (Number.isNaN(rangeEnd)) {
    issues.push(`dateRange.endISO must be a valid YYYY-MM-DD date, got '${String(range.endISO)}'`);
  }
  if (!Number.isNaN(rangeStart) && !Number.isNaN(rangeEnd) && rangeEnd < rangeStart) {
    issues.push(`dateRange.endISO must be >= startISO`);
  }

  if (!Array.isArray(data.tasks)) {
    issues.push(`tasks must be an array`);
    return buildResult(issues, "");
  }
  const tasks = data.tasks as Array<Record<string, unknown>>;
  if (tasks.length < 2 || tasks.length > 8) {
    issues.push(`tasks must have 2-8 entries, got ${tasks.length}`);
  }
  uniqueIds(tasks, "task", issues);

  for (const t of tasks) {
    for (const k of ["id", "name", "startISO", "endISO", "clickPrompt"]) {
      if (!(k in t)) {
        issues.push(`task '${String(t.id ?? "?")}' missing field '${k}'`);
      }
    }
    if (typeof t.name !== "string" || (t.name as string).length === 0) {
      issues.push(`task '${String(t.id ?? "?")}' name must be a non-empty string`);
    }
    if (typeof t.clickPrompt !== "string" || (t.clickPrompt as string).length === 0) {
      issues.push(`task '${String(t.id ?? "?")}' clickPrompt must be non-empty`);
    }
    const tStart = parseISO(String(t.startISO ?? ""));
    const tEnd = parseISO(String(t.endISO ?? ""));
    if (Number.isNaN(tStart)) {
      issues.push(`task '${String(t.id ?? "?")}' startISO must be a valid YYYY-MM-DD date, got '${String(t.startISO)}'`);
    }
    if (Number.isNaN(tEnd)) {
      issues.push(`task '${String(t.id ?? "?")}' endISO must be a valid YYYY-MM-DD date, got '${String(t.endISO)}'`);
    }
    if (!Number.isNaN(tStart) && !Number.isNaN(tEnd) && tEnd < tStart) {
      issues.push(`task '${String(t.id ?? "?")}' endISO must be >= startISO`);
    }
    if (!Number.isNaN(rangeStart) && !Number.isNaN(rangeEnd)) {
      if (!Number.isNaN(tStart) && (tStart < rangeStart || tStart > rangeEnd)) {
        issues.push(`task '${String(t.id ?? "?")}' startISO '${String(t.startISO)}' falls outside dateRange`);
      }
      if (!Number.isNaN(tEnd) && (tEnd < rangeStart || tEnd > rangeEnd)) {
        issues.push(`task '${String(t.id ?? "?")}' endISO '${String(t.endISO)}' falls outside dateRange`);
      }
    }
  }

  if (data.today !== undefined) {
    const today = parseISO(String(data.today));
    if (Number.isNaN(today)) {
      issues.push(`today must be a valid YYYY-MM-DD date, got '${String(data.today)}'`);
    } else if (!Number.isNaN(rangeStart) && !Number.isNaN(rangeEnd)) {
      if (today < rangeStart || today > rangeEnd) {
        issues.push(`today '${String(data.today)}' falls outside dateRange`);
      }
    }
  }

  return buildResult(
    issues,
    `OK: plan/schedule valid (${tasks.length} task${tasks.length === 1 ? "" : "s"})`,
  );
}

export function isPlanWidget(input: unknown): input is PlanWidget {
  return validatePlan(input).valid;
}
