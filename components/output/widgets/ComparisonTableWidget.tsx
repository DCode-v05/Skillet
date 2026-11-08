"use client";

import type {
  CellFormat,
  ComparisonTableAttribute,
  ComparisonTableCell,
  ComparisonTableOption,
  ComparisonTableWidget,
} from "@/lib/types/widgets/comparison-table";

interface Props {
  widget: ComparisonTableWidget;
}

export function ComparisonTableWidget({ widget }: Props) {
  const optionLabels = widget.options.map((o) => o.label).join(", ");

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <header className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-display text-base font-bold tracking-tight">
          {widget.title}
        </h3>
        {widget.subtitle ? (
          <p className="mt-0.5 text-xs text-[var(--secondary)]">{widget.subtitle}</p>
        ) : null}
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)]">
                Attribute
              </th>
              {widget.options.map((opt) => (
                <ColumnHeader key={opt.id} option={opt} />
              ))}
            </tr>
          </thead>
          <tbody>
            {widget.attributes.map((attr) => (
              <tr key={attr.id} className="border-b border-[var(--border)]/60 last:border-b-0">
                <AttributeLabel attribute={attr} optionLabels={optionLabels} />
                {widget.options.map((opt) => (
                  <CellView
                    key={opt.id}
                    attribute={attr}
                    option={opt}
                    cell={attr.cells[opt.id]}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="px-4 py-3 border-t border-[var(--border)] text-sm text-[var(--foreground)] leading-relaxed">
        {widget.summary}
      </p>

      <div className="px-4 py-3 border-t border-[var(--border)] flex flex-wrap gap-2">
        {widget.followUps.map((p) => (
          <button
            key={p}
            type="button"
            data-bap-prompt={p}
            className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-full bg-[var(--background)] hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors text-left"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColumnHeader({ option }: { option: ComparisonTableOption }) {
  const prompt = fillTemplate(option.clickPromptTemplate, { option: option.label });
  return (
    <th
      data-bap-prompt={prompt}
      className="text-left px-3 py-2 align-bottom font-semibold cursor-pointer hover:bg-accent/5"
      title={option.tagline || undefined}
    >
      <div>{option.label}</div>
      {option.tagline ? (
        <div className="font-normal text-[10px] text-[var(--secondary)] mt-0.5">
          {option.tagline}
        </div>
      ) : null}
    </th>
  );
}

function AttributeLabel({
  attribute,
  optionLabels,
}: {
  attribute: ComparisonTableAttribute;
  optionLabels: string;
}) {
  const prompt = fillTemplate(attribute.clickPromptTemplate, {
    attribute: attribute.label,
    options: optionLabels,
  });
  return (
    <th
      data-bap-prompt={prompt}
      className="text-left px-3 py-2 font-medium align-top cursor-pointer hover:bg-accent/5"
    >
      {attribute.label}
    </th>
  );
}

function CellView({
  attribute,
  option,
  cell,
}: {
  attribute: ComparisonTableAttribute;
  option: ComparisonTableOption;
  cell: ComparisonTableCell | undefined;
}) {
  if (!cell) {
    return <td className="px-3 py-2 text-[var(--secondary)]">—</td>;
  }
  const prompt = fillTemplate(cell.clickPromptTemplate, {
    option: option.label,
    attribute: attribute.label,
    value: cell.value,
  });
  return (
    <td
      data-bap-prompt={prompt}
      title={cell.note || undefined}
      className="px-3 py-2 align-top cursor-pointer hover:bg-accent/5"
    >
      <span className="inline-flex items-center gap-1.5">
        {cell.isWinner ? (
          <span aria-label="winner" title="Best in this row">🏆</span>
        ) : null}
        <CellValue value={cell.value} format={attribute.format} />
      </span>
      {cell.note ? (
        <div className="text-[10px] text-[var(--secondary)] mt-0.5">{cell.note}</div>
      ) : null}
    </td>
  );
}

function CellValue({ value, format }: { value: string; format: CellFormat }) {
  switch (format) {
    case "rating": {
      const n = clamp(parseInt(value, 10) || 0, 0, 5);
      return (
        <span title={`${n} / 5`}>
          {"★".repeat(n)}
          <span className="text-[var(--secondary)]">{"☆".repeat(5 - n)}</span>
        </span>
      );
    }
    case "boolean": {
      const truthy = /^(true|yes|y|1|✓)$/i.test(value);
      return <span className={truthy ? "text-accent" : "text-[var(--secondary)]"}>{truthy ? "✓" : "✗"}</span>;
    }
    case "number":
    case "currency":
    case "text":
    default:
      return <span>{value}</span>;
  }
}

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m,
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
