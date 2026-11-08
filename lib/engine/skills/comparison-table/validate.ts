import type {
  ComparisonTableWidget,
  CellFormat,
} from "@/lib/types/widgets/comparison-table";

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  summary: string;
}

const VALID_FORMATS: ReadonlySet<CellFormat> = new Set([
  "text",
  "number",
  "currency",
  "boolean",
  "rating",
]);

const PLACEHOLDER_RE = /\[[A-Za-z][^\]\n"{}]*\]/g;

export function validateComparisonTable(input: unknown): ValidationResult {
  const issues: string[] = [];

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return fail([`Top-level value must be a JSON object.`]);
  }
  const data = input as Record<string, unknown>;

  walkStrings(data, (s) => {
    for (const m of s.matchAll(PLACEHOLDER_RE)) {
      issues.push(`unfilled placeholder still present in a string value: ${m[0]}`);
    }
  });

  for (const k of [
    "widget",
    "version",
    "title",
    "options",
    "attributes",
    "summary",
    "followUps",
  ]) {
    if (!(k in data)) issues.push(`missing required field: ${k}`);
  }
  if (issues.length > 0) return fail(issues);

  if (data.widget !== "comparison-table") {
    issues.push(
      `widget must be 'comparison-table', got '${String(data.widget)}'`,
    );
  }

  if (!Array.isArray(data.options)) {
    issues.push(`options must be an array`);
    return fail(issues);
  }
  const options = data.options as Array<Record<string, unknown>>;
  if (options.length < 2 || options.length > 6) {
    issues.push(`options must have 2-6 entries, got ${options.length}`);
  }
  const optIds: string[] = options.map((o) => String(o.id ?? ""));
  if (new Set(optIds).size !== optIds.length) {
    issues.push(`option IDs must be unique, got: ${JSON.stringify(optIds)}`);
  }
  for (const o of options) {
    for (const k of ["id", "label", "clickPromptTemplate"]) {
      if (!(k in o)) issues.push(`option missing field '${k}': ${JSON.stringify(o)}`);
    }
  }

  if (!Array.isArray(data.attributes)) {
    issues.push(`attributes must be an array`);
    return fail(issues);
  }
  const attributes = data.attributes as Array<Record<string, unknown>>;
  if (attributes.length < 4 || attributes.length > 10) {
    issues.push(`attributes must have 4-10 entries, got ${attributes.length}`);
  }
  const attrIds = attributes.map((a) => String(a.id ?? ""));
  if (new Set(attrIds).size !== attrIds.length) {
    issues.push(`attribute IDs must be unique, got: ${JSON.stringify(attrIds)}`);
  }

  for (const a of attributes) {
    for (const k of ["id", "label", "format", "clickPromptTemplate", "cells"]) {
      if (!(k in a)) {
        issues.push(`attribute missing field '${k}': ${a.id ?? JSON.stringify(a)}`);
      }
    }
    const fmt = String(a.format ?? "");
    if (!VALID_FORMATS.has(fmt as CellFormat)) {
      issues.push(
        `attribute '${a.id}' has invalid format '${fmt}' (must be one of ${[...VALID_FORMATS].join(", ")})`,
      );
    }

    const cells = (a.cells ?? {}) as Record<string, Record<string, unknown>>;
    for (const oid of optIds) {
      const cell = cells[oid];
      if (!cell) {
        issues.push(`attribute '${a.id}' missing cell for option '${oid}'`);
        continue;
      }
      for (const k of ["value", "isWinner", "clickPromptTemplate"]) {
        if (!(k in cell)) issues.push(`cell ${a.id}/${oid} missing field '${k}'`);
      }
      if (typeof cell.isWinner !== "boolean") {
        issues.push(`cell ${a.id}/${oid} isWinner must be boolean`);
      }
    }

    const winners = Object.entries(cells).filter(
      ([, c]) => c.isWinner === true,
    );
    if (winners.length > 1) {
      issues.push(
        `attribute '${a.id}' has ${winners.length} winners (at most one allowed): ${winners.map(([k]) => k).join(", ")}`,
      );
    }
  }

  const fu = data.followUps;
  if (
    !Array.isArray(fu) ||
    fu.length !== 3 ||
    !fu.every((x) => typeof x === "string" && x.length > 0)
  ) {
    issues.push(`followUps must be exactly 3 non-empty strings`);
  }

  const title = String(data.title ?? "");
  if (title.length > 80) {
    issues.push(`title exceeds 80 chars (${title.length})`);
  }

  if (issues.length > 0) return fail(issues);

  const summary = `OK: comparison-table widget is valid (${options.length} options × ${attributes.length} attributes)`;
  return { valid: true, issues: [], summary };
}

function fail(issues: string[]): ValidationResult {
  return {
    valid: false,
    issues,
    summary: `${issues.length} validation error${issues.length === 1 ? "" : "s"}`,
  };
}

function walkStrings(node: unknown, visit: (s: string) => void): void {
  if (typeof node === "string") visit(node);
  else if (Array.isArray(node)) for (const x of node) walkStrings(x, visit);
  else if (node !== null && typeof node === "object") {
    for (const v of Object.values(node as Record<string, unknown>))
      walkStrings(v, visit);
  }
}

export function isComparisonTableWidget(
  input: unknown,
): input is ComparisonTableWidget {
  return validateComparisonTable(input).valid;
}
