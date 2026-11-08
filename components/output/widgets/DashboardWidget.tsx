"use client";

import type {
  DashboardKanbanWidget,
  DashboardKpiWidget,
  DashboardPricingTier,
  DashboardPricingWidget,
  DashboardProfileWidget,
  DashboardWidget,
} from "@/lib/types/widgets/dashboard";

export function DashboardWidget({ widget }: { widget: DashboardWidget }) {
  switch (widget.variant) {
    case "kpi":
      return <Kpi widget={widget} />;
    case "profile":
      return <Profile widget={widget} />;
    case "kanban":
      return <Kanban widget={widget} />;
    case "pricing":
      return <Pricing widget={widget} />;
  }
}

function Kpi({ widget }: { widget: DashboardKpiWidget }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {widget.title ? (
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-3">
          {widget.title}
        </h3>
      ) : null}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      >
        {widget.tiles.map((t) => (
          <div
            key={t.id}
            data-bap-prompt={t.clickPrompt}
            className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 hover:border-accent hover:bg-accent/5 transition-colors"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)]">
              {t.metric}
            </div>
            <div className="text-2xl font-bold leading-tight mt-1 text-[var(--foreground)]">
              {t.value}
            </div>
            {t.deltaText ? (
              <div className="flex items-center gap-1.5 mt-1.5">
                <DeltaArrow direction={t.deltaDirection ?? "flat"} />
                <span
                  className="text-xs font-medium"
                  style={{ color: deltaColor(t.deltaDirection ?? "flat") }}
                >
                  {t.deltaText}
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function deltaColor(direction: "up" | "down" | "flat"): string {
  if (direction === "up") return "#16a34a";
  if (direction === "down") return "#EC3B4A";
  return "#9ca3af";
}

function DeltaArrow({ direction }: { direction: "up" | "down" | "flat" }) {
  const color = deltaColor(direction);
  if (direction === "flat") {
    return (
      <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
        <line
          x1="2"
          y1="7"
          x2="12"
          y2="7"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (direction === "up") {
    return (
      <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
        <path
          d="M7 2 L7 12 M3 6 L7 2 L11 6"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
      <path
        d="M7 12 L7 2 M3 8 L7 12 L11 8"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Profile({ widget }: { widget: DashboardProfileWidget }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-4">
      <div
        className="shrink-0 flex items-center justify-center rounded-full text-white font-bold"
        style={{ background: "#EC3B4A", width: 56, height: 56, fontSize: 18 }}
        aria-hidden="true"
      >
        {widget.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold leading-tight text-[var(--foreground)]">
          {widget.name}
        </div>
        {widget.role ? (
          <div className="text-xs text-[var(--secondary)] mt-0.5">
            {widget.role}
          </div>
        ) : null}
        {widget.stats && widget.stats.length > 0 ? (
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
            {widget.stats.map((s, i) => (
              <div key={`${s.label}-${i}`} className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)]">
                  {s.label}
                </span>
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        data-bap-prompt={widget.action.prompt}
        className="shrink-0 cursor-pointer rounded-md px-3.5 py-2 text-sm font-semibold text-white border-0 hover:opacity-90 transition-opacity"
        style={{ background: "#EC3B4A" }}
      >
        {widget.action.label}
      </button>
    </div>
  );
}

function Kanban({ widget }: { widget: DashboardKanbanWidget }) {
  const cols = widget.columns.length;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {widget.title ? (
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-3">
          {widget.title}
        </h3>
      ) : null}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {widget.columns.map((col) => (
          <div key={col.id} className="flex flex-col gap-2 min-w-0">
            <div className="flex items-baseline justify-between gap-2 px-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)]">
                {col.name}
              </span>
              <span className="font-mono text-[10px] text-[var(--secondary)]">
                {col.cards.length}
              </span>
            </div>
            {col.cards.map((c) => (
              <div
                key={c.id}
                data-bap-prompt={c.clickPrompt}
                className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 hover:border-accent hover:bg-accent/5 transition-colors"
              >
                <div className="text-sm font-semibold leading-snug text-[var(--foreground)]">
                  {c.title}
                </div>
                {c.meta ? (
                  <div className="font-mono text-[10px] text-[var(--secondary)] mt-1">
                    {c.meta}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Pricing({ widget }: { widget: DashboardPricingWidget }) {
  const cols = widget.tiers.length;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-4">
        {widget.heading}
      </h3>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {widget.tiers.map((t) => (
          <PricingTier key={t.id} tier={t} />
        ))}
      </div>
    </div>
  );
}

function PricingTier({ tier }: { tier: DashboardPricingTier }) {
  const isRec = tier.recommended === true;
  return (
    <div
      className="relative rounded-lg bg-[var(--background)] p-4 flex flex-col gap-3"
      style={{
        border: isRec ? "2px solid #EC3B4A" : "1px solid var(--border)",
      }}
    >
      {isRec ? (
        <span
          className="absolute left-1/2 -top-3 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] text-white"
          style={{ background: "#EC3B4A" }}
        >
          Recommended
        </span>
      ) : null}
      <div
        className="font-mono text-[11px] uppercase tracking-[0.18em]"
        style={{ color: isRec ? "#EC3B4A" : "var(--secondary)" }}
      >
        {tier.name}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold leading-none text-[var(--foreground)]">
          {tier.price}
        </span>
        {tier.priceSuffix ? (
          <span className="text-xs text-[var(--secondary)]">
            {tier.priceSuffix}
          </span>
        ) : null}
      </div>
      <ul className="flex flex-col gap-1.5 m-0 p-0 list-none">
        {tier.features.map((f, i) => (
          <li
            key={`${i}-${f.text}`}
            className="flex items-start gap-2 text-xs leading-snug"
          >
            <FeatureIcon included={f.included} />
            <span
              className={
                f.included
                  ? "text-[var(--foreground)]"
                  : "text-[var(--secondary)] line-through"
              }
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        data-bap-prompt={tier.cta.prompt}
        className="cursor-pointer mt-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors"
        style={
          isRec
            ? { background: "#EC3B4A", color: "#fff", border: "0" }
            : {
                background: "transparent",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }
        }
      >
        {tier.cta.label}
      </button>
    </div>
  );
}

function FeatureIcon({ included }: { included: boolean }) {
  if (included) {
    return (
      <svg
        viewBox="0 0 14 14"
        width="14"
        height="14"
        aria-hidden="true"
        className="shrink-0 mt-0.5"
      >
        <path
          d="M3 7.5 L6 10.5 L11 4"
          fill="none"
          stroke="#EC3B4A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 14 14"
      width="14"
      height="14"
      aria-hidden="true"
      className="shrink-0 mt-0.5"
    >
      <path
        d="M3.5 3.5 L10.5 10.5 M10.5 3.5 L3.5 10.5"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
