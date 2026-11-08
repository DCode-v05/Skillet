"use client";

import type {
  ListChecklistWidget,
  ListTableColumn,
  ListTableWidget,
  ListWidget,
} from "@/lib/types/widgets/list";

export function ListWidget({ widget }: { widget: ListWidget }) {
  return widget.variant === "checklist" ? (
    <Checklist widget={widget} />
  ) : (
    <Table widget={widget} />
  );
}

function Checklist({ widget }: { widget: ListChecklistWidget }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {widget.title ? (
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-3">
          {widget.title}
        </h3>
      ) : null}
      <ul className="flex flex-col gap-1.5 m-0 p-0 list-none">
        {widget.items.map((item) => (
          <li
            key={item.id}
            data-bap-prompt={item.clickPrompt}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
          >
            <CheckboxIcon done={item.done} />
            <div className="min-w-0 flex-1">
              <div
                className={
                  "text-sm font-semibold leading-snug " +
                  (item.done ? "line-through text-[var(--secondary)]" : "")
                }
              >
                {item.label}
              </div>
              {item.note ? (
                <div className="text-xs text-[var(--secondary)] mt-1 leading-relaxed">
                  {item.note}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckboxIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <svg
        viewBox="0 0 18 18"
        aria-hidden="true"
        className="shrink-0 mt-0.5"
        width="18"
        height="18"
      >
        <rect x="1" y="1" width="16" height="16" rx="4" fill="#EC3B4A" />
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
  return (
    <svg
      viewBox="0 0 18 18"
      aria-hidden="true"
      className="shrink-0 mt-0.5 text-[var(--secondary)]"
      width="18"
      height="18"
    >
      <rect
        x="1.5"
        y="1.5"
        width="15"
        height="15"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function Table({ widget }: { widget: ListTableWidget }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {widget.title ? (
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] px-4 py-3 border-b border-[var(--border)]">
          {widget.title}
        </h3>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)]">
              {widget.columns.map((c) => (
                <th
                  key={c.id}
                  className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)]"
                  style={{ textAlign: c.align ?? "left" }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {widget.rows.map((r) => (
              <tr
                key={r.id}
                data-bap-prompt={r.clickPrompt}
                className="border-b border-[var(--border)]/60 last:border-b-0 cursor-pointer hover:bg-accent/5 transition-colors"
              >
                {widget.columns.map((c, i) => (
                  <CellTd key={c.id} column={c} value={r.cells[c.id]} first={i === 0} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CellTd({
  column,
  value,
  first,
}: {
  column: ListTableColumn;
  value: string | undefined;
  first: boolean;
}) {
  const display = value === undefined ? "—" : value;
  return (
    <td className="px-3 py-2" style={{ textAlign: column.align ?? "left" }}>
      {first ? <strong>{display}</strong> : display}
    </td>
  );
}
