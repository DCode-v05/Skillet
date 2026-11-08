import type {
  InteractiveCalculatorInput,
  InteractiveFormField,
  InteractiveOutputFormat,
  InteractiveQuizQuestion,
  InteractiveWidget,
} from "@/lib/types/widgets/interactive";
import {
  asObject,
  buildResult,
  checkPlaceholders,
  requireKeys,
  uniqueIds,
  type ValidationResult,
} from "../_shared/validate-helpers";

const OUTPUT_FORMATS: ReadonlySet<InteractiveOutputFormat> = new Set([
  "currency",
  "number",
  "percent",
]);

const CALC_INPUT_KINDS = new Set(["number", "range"]);
const FORM_FIELD_KINDS = new Set(["text", "email", "textarea", "select"]);

const FORMULA_TOKEN_RE = /\s+|(\+|-|\*|\/|\(|\))|([A-Za-z_][A-Za-z0-9_]*)|([0-9]+(?:\.[0-9]+)?)/g;

export function validateInteractive(input: unknown): ValidationResult {
  const issues: string[] = [];
  const data = asObject(input, issues);
  if (!data) return buildResult(issues, "");

  checkPlaceholders(data, issues);
  requireKeys(data, ["widget", "version", "variant"], issues);
  if (issues.length > 0) return buildResult(issues, "");

  if (data.widget !== "interactive") {
    issues.push(`widget must be 'interactive', got '${String(data.widget)}'`);
  }

  if (data.variant === "calculator") return validateCalculator(data, issues);
  if (data.variant === "quiz") return validateQuiz(data, issues);
  if (data.variant === "form") return validateForm(data, issues);
  issues.push(
    `variant must be 'calculator', 'quiz', or 'form', got '${String(data.variant)}'`,
  );
  return buildResult(issues, "");
}

function validateCalculator(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  requireKeys(
    data,
    ["title", "inputs", "formula", "outputLabel", "outputFormat", "explainPrompt"],
    issues,
  );
  if (typeof data.title !== "string" || data.title.length === 0) {
    issues.push(`title must be a non-empty string`);
  }
  if (typeof data.outputLabel !== "string" || data.outputLabel.length === 0) {
    issues.push(`outputLabel must be a non-empty string`);
  }
  if (typeof data.explainPrompt !== "string" || data.explainPrompt.length === 0) {
    issues.push(`explainPrompt must be a non-empty string`);
  }
  if (!OUTPUT_FORMATS.has(data.outputFormat as InteractiveOutputFormat)) {
    issues.push(
      `outputFormat must be one of ${[...OUTPUT_FORMATS].join(", ")}, got '${String(data.outputFormat)}'`,
    );
  }

  if (!Array.isArray(data.inputs)) {
    issues.push(`inputs must be an array`);
    return buildResult(issues, "");
  }
  const inputs = data.inputs as Array<Record<string, unknown>>;
  if (inputs.length < 2 || inputs.length > 5) {
    issues.push(`inputs must have 2-5 entries, got ${inputs.length}`);
  }
  uniqueIds(inputs, "input", issues);

  for (const i of inputs) {
    for (const k of ["id", "label", "kind", "defaultValue"]) {
      if (!(k in i)) {
        issues.push(`input '${String(i.id ?? "?")}' missing field '${k}'`);
      }
    }
    if (typeof i.id !== "string" || (i.id as string).length === 0) {
      issues.push(`input id must be a non-empty string`);
    }
    if (typeof i.label !== "string" || (i.label as string).length === 0) {
      issues.push(`input '${String(i.id ?? "?")}' label must be non-empty`);
    }
    if (!CALC_INPUT_KINDS.has(String(i.kind))) {
      issues.push(
        `input '${String(i.id ?? "?")}' kind must be 'number' or 'range', got '${String(i.kind)}'`,
      );
    }
    if (typeof i.defaultValue !== "number" || Number.isNaN(i.defaultValue)) {
      issues.push(`input '${String(i.id ?? "?")}' defaultValue must be a finite number`);
    }
    for (const k of ["min", "max", "step"]) {
      if (i[k] !== undefined && typeof i[k] !== "number") {
        issues.push(`input '${String(i.id ?? "?")}' ${k} must be a number if present`);
      }
    }
    if (
      typeof i.min === "number" &&
      typeof i.max === "number" &&
      (i.min as number) > (i.max as number)
    ) {
      issues.push(`input '${String(i.id ?? "?")}' min must be ≤ max`);
    }
    if (i.unit !== undefined && typeof i.unit !== "string") {
      issues.push(`input '${String(i.id ?? "?")}' unit must be a string if present`);
    }
  }

  if (data.outputUnit !== undefined && typeof data.outputUnit !== "string") {
    issues.push(`outputUnit must be a string if present`);
  }

  if (typeof data.formula !== "string" || data.formula.length === 0) {
    issues.push(`formula must be a non-empty string`);
  } else {
    const validIds = new Set(
      inputs
        .map((i) => (typeof i.id === "string" ? (i.id as string) : ""))
        .filter((s) => s.length > 0),
    );
    if (/[;=]/.test(data.formula)) {
      issues.push(`formula must not contain ';' or '=' — arithmetic only`);
    }
    const formulaIssues = scanFormulaTokens(data.formula, validIds);
    for (const fi of formulaIssues) {
      if (fi.kind === "unknown-id") {
        issues.push(
          `formula references unknown identifier '${fi.token}' — must match an input id (${[...validIds].join(", ") || "<none>"})`,
        );
      } else {
        issues.push(
          `formula contains illegal character(s) '${fi.token}' — only + - * / and parens are allowed alongside identifiers and numbers`,
        );
      }
    }
  }

  return buildResult(
    issues,
    `OK: interactive/calculator valid (${(data.inputs as unknown[]).length} inputs)`,
  );
}

interface FormulaIssue {
  kind: "unknown-id" | "illegal-char";
  token: string;
}

function scanFormulaTokens(
  formula: string,
  validIds: ReadonlySet<string>,
): FormulaIssue[] {
  const issues: FormulaIssue[] = [];
  const re = new RegExp(FORMULA_TOKEN_RE.source, "g");
  let pos = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(formula)) !== null) {
    if (m.index !== pos) {
      issues.push({ kind: "illegal-char", token: formula.slice(pos, m.index) });
    }
    const ident = m[2];
    if (ident !== undefined && !validIds.has(ident)) {
      issues.push({ kind: "unknown-id", token: ident });
    }
    pos = m.index + m[0].length;
  }
  if (pos < formula.length) {
    issues.push({ kind: "illegal-char", token: formula.slice(pos) });
  }
  return issues;
}

function validateQuiz(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  requireKeys(data, ["title", "questions", "reviewPrompt"], issues);
  if (typeof data.title !== "string" || data.title.length === 0) {
    issues.push(`title must be a non-empty string`);
  }
  if (typeof data.reviewPrompt !== "string" || data.reviewPrompt.length === 0) {
    issues.push(`reviewPrompt must be a non-empty string`);
  }

  if (!Array.isArray(data.questions)) {
    issues.push(`questions must be an array`);
    return buildResult(issues, "");
  }
  const questions = data.questions as Array<Record<string, unknown>>;
  if (questions.length < 3 || questions.length > 5) {
    issues.push(`questions must have 3-5 entries, got ${questions.length}`);
  }
  uniqueIds(questions, "question", issues);

  for (const q of questions) {
    for (const k of ["id", "prompt", "options"]) {
      if (!(k in q)) {
        issues.push(`question '${String(q.id ?? "?")}' missing field '${k}'`);
      }
    }
    if (typeof q.prompt !== "string" || (q.prompt as string).length === 0) {
      issues.push(`question '${String(q.id ?? "?")}' prompt must be non-empty`);
    }
    if (!Array.isArray(q.options)) {
      issues.push(`question '${String(q.id ?? "?")}' options must be an array`);
      continue;
    }
    const options = q.options as Array<Record<string, unknown>>;
    if (options.length < 2 || options.length > 4) {
      issues.push(
        `question '${String(q.id ?? "?")}' must have 2-4 options, got ${options.length}`,
      );
    }
    uniqueIds(options, `question '${String(q.id ?? "?")}' option`, issues);
    let correctCount = 0;
    for (const o of options) {
      for (const k of ["id", "label", "correct"]) {
        if (!(k in o)) {
          issues.push(
            `option '${String(o.id ?? "?")}' (question '${String(q.id ?? "?")}') missing field '${k}'`,
          );
        }
      }
      if (typeof o.label !== "string" || (o.label as string).length === 0) {
        issues.push(
          `option '${String(o.id ?? "?")}' (question '${String(q.id ?? "?")}') label must be non-empty`,
        );
      }
      if (typeof o.correct !== "boolean") {
        issues.push(
          `option '${String(o.id ?? "?")}' (question '${String(q.id ?? "?")}') correct must be a boolean`,
        );
      } else if (o.correct === true) {
        correctCount += 1;
      }
    }
    if (correctCount !== 1) {
      issues.push(
        `question '${String(q.id ?? "?")}' must have exactly 1 correct option, got ${correctCount}`,
      );
    }
  }

  return buildResult(
    issues,
    `OK: interactive/quiz valid (${questions.length} questions)`,
  );
}

function validateForm(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  requireKeys(data, ["title", "fields", "submitLabel", "submitPrompt"], issues);
  if (typeof data.title !== "string" || data.title.length === 0) {
    issues.push(`title must be a non-empty string`);
  }
  if (typeof data.submitLabel !== "string" || data.submitLabel.length === 0) {
    issues.push(`submitLabel must be a non-empty string`);
  }
  if (typeof data.submitPrompt !== "string" || data.submitPrompt.length === 0) {
    issues.push(`submitPrompt must be a non-empty string`);
  }
  if (data.description !== undefined && typeof data.description !== "string") {
    issues.push(`description must be a string if present`);
  }

  if (!Array.isArray(data.fields)) {
    issues.push(`fields must be an array`);
    return buildResult(issues, "");
  }
  const fields = data.fields as Array<Record<string, unknown>>;
  if (fields.length < 2 || fields.length > 7) {
    issues.push(`fields must have 2-7 entries, got ${fields.length}`);
  }
  uniqueIds(fields, "field", issues);

  for (const f of fields) {
    for (const k of ["id", "label", "kind"]) {
      if (!(k in f)) {
        issues.push(`field '${String(f.id ?? "?")}' missing field '${k}'`);
      }
    }
    if (typeof f.label !== "string" || (f.label as string).length === 0) {
      issues.push(`field '${String(f.id ?? "?")}' label must be non-empty`);
    }
    if (!FORM_FIELD_KINDS.has(String(f.kind))) {
      issues.push(
        `field '${String(f.id ?? "?")}' kind must be one of ${[...FORM_FIELD_KINDS].join(", ")}, got '${String(f.kind)}'`,
      );
    }
    if (f.placeholder !== undefined && typeof f.placeholder !== "string") {
      issues.push(`field '${String(f.id ?? "?")}' placeholder must be a string if present`);
    }
    if (f.kind === "select") {
      if (!Array.isArray(f.options)) {
        issues.push(`field '${String(f.id ?? "?")}' (kind=select) must have an options array`);
      } else {
        const opts = f.options as unknown[];
        if (opts.length < 2) {
          issues.push(
            `field '${String(f.id ?? "?")}' (kind=select) must have ≥ 2 options, got ${opts.length}`,
          );
        }
        for (const o of opts) {
          if (typeof o !== "string" || o.length === 0) {
            issues.push(
              `field '${String(f.id ?? "?")}' options must all be non-empty strings`,
            );
            break;
          }
        }
      }
    }
  }

  return buildResult(issues, `OK: interactive/form valid (${fields.length} fields)`);
}

export function isInteractiveWidget(input: unknown): input is InteractiveWidget {
  return validateInteractive(input).valid;
}

export type {
  InteractiveCalculatorInput,
  InteractiveFormField,
  InteractiveQuizQuestion,
};
