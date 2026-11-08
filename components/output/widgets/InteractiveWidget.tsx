"use client";

import { useMemo, useState } from "react";
import type {
  InteractiveCalculatorInput,
  InteractiveCalculatorWidget,
  InteractiveFormField,
  InteractiveFormWidget,
  InteractiveOutputFormat,
  InteractiveQuizQuestion,
  InteractiveQuizWidget,
  InteractiveWidget,
} from "@/lib/types/widgets/interactive";

export function InteractiveWidget({ widget }: { widget: InteractiveWidget }) {
  if (widget.variant === "calculator") return <Calculator widget={widget} />;
  if (widget.variant === "quiz") return <Quiz widget={widget} />;
  return <Form widget={widget} />;
}

function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-3">
        {title}
      </h3>
      {description ? (
        <p className="text-sm text-[var(--secondary)] mb-3 leading-relaxed">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function Calculator({ widget }: { widget: InteractiveCalculatorWidget }) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(widget.inputs.map((i) => [i.id, i.defaultValue])),
  );

  const evaluator = useMemo(() => buildEvaluator(widget.formula), [widget.formula]);
  const output = useMemo<{ text: string; error: boolean }>(() => {
    try {
      const n = evaluator(values);
      if (!Number.isFinite(n)) return { text: "(formula error)", error: true };
      return { text: formatOutput(n, widget.outputFormat, widget.outputUnit), error: false };
    } catch {
      return { text: "(formula error)", error: true };
    }
  }, [evaluator, values, widget.outputFormat, widget.outputUnit]);

  function updateValue(id: string, next: number) {
    setValues((prev) => ({ ...prev, [id]: next }));
  }

  return (
    <Shell title={widget.title}>
      <div className="flex flex-col gap-3 mb-4">
        {widget.inputs.map((inp) => (
          <CalcInputRow
            key={inp.id}
            input={inp}
            value={values[inp.id]}
            onChange={(v) => updateValue(inp.id, v)}
          />
        ))}
      </div>

      <div
        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 mb-3"
        role="status"
        aria-live="polite"
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-1">
          {widget.outputLabel}
        </div>
        <div
          className="font-bold leading-none"
          style={{
            color: output.error ? "var(--secondary)" : "#EC3B4A",
            fontSize: "28px",
          }}
        >
          {output.text}
        </div>
      </div>

      <button
        type="button"
        data-bap-prompt={widget.explainPrompt}
        className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-full bg-[var(--background)] hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors"
      >
        Explain this calculation
      </button>
    </Shell>
  );
}

function CalcInputRow({
  input,
  value,
  onChange,
}: {
  input: InteractiveCalculatorInput;
  value: number;
  onChange: (next: number) => void;
}) {
  const display = formatInputDisplay(value, input.unit);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor={`calc-input-${input.id}`}
          className="text-xs font-semibold text-[var(--foreground)]"
        >
          {input.label}
        </label>
        <span className="font-mono text-xs text-[var(--secondary)]">{display}</span>
      </div>
      {input.kind === "range" ? (
        <input
          id={`calc-input-${input.id}`}
          type="range"
          min={input.min}
          max={input.max}
          step={input.step ?? 1}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "#EC3B4A" }}
        />
      ) : (
        <input
          id={`calc-input-${input.id}`}
          type="number"
          min={input.min}
          max={input.max}
          step={input.step ?? 1}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const raw = e.target.value;
            const n = raw === "" ? 0 : Number(raw);
            if (!Number.isNaN(n)) onChange(n);
          }}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-accent"
        />
      )}
    </div>
  );
}

function formatInputDisplay(value: number, unit?: string): string {
  if (!Number.isFinite(value)) return "—";
  const num = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return unit ? `${num}${unit}` : num;
}

function formatOutput(
  n: number,
  format: InteractiveOutputFormat,
  unit?: string,
): string {
  let core: string;
  if (format === "currency") core = `$${n.toFixed(2)}`;
  else if (format === "percent") core = `${n.toFixed(1)}%`;
  else core = n.toFixed(2);
  return unit ? `${core}${unit}` : core;
}

type Token =
  | { kind: "num"; value: number }
  | { kind: "ident"; name: string }
  | { kind: "op"; value: "+" | "-" | "*" | "/" }
  | { kind: "lparen" }
  | { kind: "rparen" };

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  const re = /\s+|(\+|-|\*|\/|\(|\))|([A-Za-z_][A-Za-z0-9_]*)|([0-9]+(?:\.[0-9]+)?)/g;
  let pos = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (m.index !== pos) {
      throw new Error(`unexpected character at ${pos}: ${src.slice(pos, m.index)}`);
    }
    const matched = m[0];
    const op = m[1];
    const ident = m[2];
    const num = m[3];
    if (op === "+" || op === "-" || op === "*" || op === "/") {
      tokens.push({ kind: "op", value: op });
    } else if (op === "(") tokens.push({ kind: "lparen" });
    else if (op === ")") tokens.push({ kind: "rparen" });
    else if (ident !== undefined) tokens.push({ kind: "ident", name: ident });
    else if (num !== undefined) tokens.push({ kind: "num", value: Number(num) });
    pos = m.index + matched.length;
  }
  if (pos < src.length) {
    throw new Error(`unexpected trailing characters: ${src.slice(pos)}`);
  }
  return tokens;
}

type Node =
  | { kind: "num"; value: number }
  | { kind: "ident"; name: string }
  | { kind: "neg"; arg: Node }
  | { kind: "bin"; op: "+" | "-" | "*" | "/"; left: Node; right: Node };

function buildEvaluator(
  formula: string,
): (values: Record<string, number>) => number {
  const tokens = tokenize(formula);
  let i = 0;

  function peek(): Token | undefined {
    return tokens[i];
  }
  function consume(): Token {
    const t = tokens[i++];
    if (!t) throw new Error("unexpected end of formula");
    return t;
  }

  function parseExpression(): Node {
    let left = parseTerm();
    while (true) {
      const t = peek();
      if (t && t.kind === "op" && (t.value === "+" || t.value === "-")) {
        consume();
        const right = parseTerm();
        left = { kind: "bin", op: t.value, left, right };
      } else break;
    }
    return left;
  }
  function parseTerm(): Node {
    let left = parseFactor();
    while (true) {
      const t = peek();
      if (t && t.kind === "op" && (t.value === "*" || t.value === "/")) {
        consume();
        const right = parseFactor();
        left = { kind: "bin", op: t.value, left, right };
      } else break;
    }
    return left;
  }
  function parseFactor(): Node {
    const t = peek();
    if (t && t.kind === "op" && t.value === "-") {
      consume();
      return { kind: "neg", arg: parseFactor() };
    }
    if (t && t.kind === "op" && t.value === "+") {
      consume();
      return parseFactor();
    }
    return parsePrimary();
  }
  function parsePrimary(): Node {
    const t = consume();
    if (t.kind === "num") return { kind: "num", value: t.value };
    if (t.kind === "ident") return { kind: "ident", name: t.name };
    if (t.kind === "lparen") {
      const inner = parseExpression();
      const close = consume();
      if (close.kind !== "rparen") throw new Error("expected ')'");
      return inner;
    }
    throw new Error("unexpected token");
  }

  const ast = parseExpression();
  if (i !== tokens.length) throw new Error("trailing tokens after expression");

  function evalNode(node: Node, values: Record<string, number>): number {
    switch (node.kind) {
      case "num":
        return node.value;
      case "ident": {
        const v = values[node.name];
        if (typeof v !== "number" || !Number.isFinite(v)) {
          throw new Error(`unknown or non-numeric variable: ${node.name}`);
        }
        return v;
      }
      case "neg":
        return -evalNode(node.arg, values);
      case "bin": {
        const l = evalNode(node.left, values);
        const r = evalNode(node.right, values);
        if (node.op === "+") return l + r;
        if (node.op === "-") return l - r;
        if (node.op === "*") return l * r;
        if (r === 0) return Number.NaN;
        return l / r;
      }
    }
  }

  return (values) => evalNode(ast, values);
}

function Quiz({ widget }: { widget: InteractiveQuizWidget }) {
  const [selected, setSelected] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(widget.questions.map((q) => [q.id, null])),
  );
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    if (!submitted) return null;
    let n = 0;
    for (const q of widget.questions) {
      const pick = selected[q.id];
      const opt = q.options.find((o) => o.id === pick);
      if (opt && opt.correct) n += 1;
    }
    return n;
  }, [submitted, selected, widget.questions]);

  function pick(qid: string, oid: string) {
    if (submitted) return;
    setSelected((prev) => ({ ...prev, [qid]: oid }));
  }

  function onSubmit() {
    setSubmitted(true);
  }

  const total = widget.questions.length;

  return (
    <Shell title={widget.title}>
      <div className="flex flex-col gap-4 mb-4">
        {widget.questions.map((q, idx) => (
          <QuizQuestion
            key={q.id}
            index={idx}
            question={q}
            selected={selected[q.id] ?? null}
            submitted={submitted}
            onPick={(oid) => pick(q.id, oid)}
          />
        ))}
      </div>

      {!submitted ? (
        <button
          type="button"
          onClick={onSubmit}
          className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
          style={{ background: "#EC3B4A" }}
        >
          Submit answers
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3"
            role="status"
            aria-live="polite"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-1">
              Score
            </div>
            <div className="font-bold leading-none" style={{ color: "#EC3B4A", fontSize: "28px" }}>
              {score} / {total}
            </div>
          </div>
          <button
            type="button"
            data-bap-prompt={widget.reviewPrompt}
            className="self-start text-xs px-3 py-1.5 border border-[var(--border)] rounded-full bg-[var(--background)] hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors"
          >
            Walk me through each answer
          </button>
        </div>
      )}
    </Shell>
  );
}

function QuizQuestion({
  index,
  question,
  selected,
  submitted,
  onPick,
}: {
  index: number;
  question: InteractiveQuizQuestion;
  selected: string | null;
  submitted: boolean;
  onPick: (optionId: string) => void;
}) {
  const correctOption = question.options.find((o) => o.correct);
  const correctId = correctOption?.id;
  return (
    <fieldset className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3">
      <legend className="px-2 text-xs font-semibold text-[var(--foreground)]">
        Q{index + 1}. {question.prompt}
      </legend>
      <div className="flex flex-col gap-1.5 mt-2">
        {question.options.map((opt) => {
          const isChecked = selected === opt.id;
          const showCorrect = submitted && opt.id === correctId;
          const showWrong = submitted && isChecked && opt.id !== correctId;
          return (
            <label
              key={opt.id}
              className={
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm leading-snug " +
                (submitted ? "cursor-default " : "cursor-pointer hover:bg-accent/5 ") +
                (showCorrect ? "text-[#16a34a]" : "") +
                (showWrong ? " text-[#EC3B4A]" : "")
              }
            >
              <input
                type="radio"
                name={`quiz-${question.id}`}
                value={opt.id}
                checked={isChecked}
                disabled={submitted}
                onChange={() => onPick(opt.id)}
                style={{ accentColor: "#EC3B4A" }}
              />
              <span className="flex-1">{opt.label}</span>
              {showCorrect ? <CheckIcon /> : null}
              {showWrong ? <XIcon /> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 18 18"
      width="16"
      height="16"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="9" cy="9" r="8" fill="#16a34a" />
      <path
        d="M4.5 9.5 L8 13 L13.5 5.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 18 18"
      width="16"
      height="16"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="9" cy="9" r="8" fill="#EC3B4A" />
      <path
        d="M5.5 5.5 L12.5 12.5 M12.5 5.5 L5.5 12.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Form({ widget }: { widget: InteractiveFormWidget }) {
  return (
    <Shell title={widget.title} description={widget.description}>
      <div className="flex flex-col gap-3 mb-4">
        {widget.fields.map((f) => (
          <FormField key={f.id} field={f} />
        ))}
      </div>
      <button
        type="button"
        data-bap-prompt={widget.submitPrompt}
        className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
        style={{ background: "#EC3B4A" }}
      >
        {widget.submitLabel}
      </button>
    </Shell>
  );
}

function FormField({ field }: { field: InteractiveFormField }) {
  const id = `form-field-${field.id}`;
  const inputClass =
    "w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-accent";
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-[var(--foreground)] mb-1"
      >
        {field.label}
      </label>
      {field.kind === "textarea" ? (
        <textarea
          id={id}
          placeholder={field.placeholder}
          rows={3}
          className={inputClass}
        />
      ) : field.kind === "select" ? (
        <select id={id} className={inputClass} defaultValue="">
          <option value="" disabled>
            {field.placeholder ?? "Select…"}
          </option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={field.kind === "email" ? "email" : "text"}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}
