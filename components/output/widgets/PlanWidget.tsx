"use client";

import type {
  PlanDatedWidget,
  PlanScheduleWidget,
  PlanStepsWidget,
  PlanWidget,
} from "@/lib/types/widgets/plan";

const BAP_RED = "#EC3B4A";
const TODAY_COLOR = "#7dd3fc";

export function PlanWidget({ widget }: { widget: PlanWidget }) {
  if (widget.variant === "steps") return <StepsView widget={widget} />;
  if (widget.variant === "dated") return <DatedView widget={widget} />;
  return <ScheduleView widget={widget} />;
}

function StepsView({ widget }: { widget: PlanStepsWidget }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-3">
        {widget.title}
      </h3>
      <ol className="flex flex-col gap-2 m-0 p-0 list-none">
        {widget.items.map((it) => (
          <li
            key={it.id}
            data-bap-prompt={it.clickPrompt}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
          >
            <StepCircle n={it.n} current={it.current} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-snug">{it.title}</div>
              {it.body ? (
                <div className="text-xs text-[var(--secondary)] mt-1 leading-relaxed">
                  {it.body}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepCircle({ n, current }: { n: number; current: boolean }) {
  if (current) {
    return (
      <svg
        viewBox="0 0 26 26"
        aria-hidden="true"
        className="shrink-0 mt-0.5"
        width="26"
        height="26"
      >
        <circle cx="13" cy="13" r="12" fill={BAP_RED} />
        <text
          x="13"
          y="13"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="13"
          fontWeight="700"
          fill="#ffffff"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {n}
        </text>
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 26 26"
      aria-hidden="true"
      className="shrink-0 mt-0.5 text-[var(--secondary)]"
      width="26"
      height="26"
    >
      <circle
        cx="13"
        cy="13"
        r="11.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <text
        x="13"
        y="13"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="700"
        fill="currentColor"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {n}
      </text>
    </svg>
  );
}

function DatedView({ widget }: { widget: PlanDatedWidget }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-3">
        {widget.title}
      </h3>
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 w-px bg-[var(--border)]"
          style={{ left: "calc(6rem + 7px)" }}
        />
        <ol className="flex flex-col gap-2 m-0 p-0 list-none">
          {widget.events.map((ev) => {
            const color = ev.accent ? BAP_RED : "var(--secondary)";
            return (
              <li
                key={ev.id}
                data-bap-prompt={ev.clickPrompt}
                className="grid items-start gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-accent/5 transition-colors"
                style={{ gridTemplateColumns: "6rem 14px 1fr" }}
              >
                <div
                  className="font-mono text-xs text-right leading-5 pt-0.5"
                  style={{ color, fontWeight: ev.accent ? 700 : 400 }}
                >
                  {ev.date}
                </div>
                <div className="flex justify-center pt-1.5">
                  <DatedDot color={color} accent={ev.accent} />
                </div>
                <div className="min-w-0">
                  <div
                    className="text-sm font-semibold leading-snug"
                    style={ev.accent ? { color: BAP_RED } : undefined}
                  >
                    {ev.title}
                  </div>
                  {ev.body ? (
                    <div className="text-xs text-[var(--secondary)] mt-1 leading-relaxed">
                      {ev.body}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function DatedDot({ color, accent }: { color: string; accent: boolean }) {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      width="14"
      height="14"
      className="shrink-0"
    >
      <circle
        cx="7"
        cy="7"
        r={accent ? 6 : 4.5}
        fill={accent ? color : "var(--background)"}
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

interface MonthTick {
  x: number;
  label: string;
}

const SVG_WIDTH = 600;
const LEFT_MARGIN = 160;
const RIGHT_PAD = 10;
const CHART_WIDTH = SVG_WIDTH - LEFT_MARGIN - RIGHT_PAD;
const AXIS_Y = 30;
const ROW_START_Y = 50;
const ROW_HEIGHT = 40;
const BAR_HEIGHT = 18;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseISO(s: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return NaN;
  return Date.parse(s + "T00:00:00Z");
}

function xFor(t: number, t0: number, t1: number): number {
  if (t1 <= t0) return LEFT_MARGIN;
  const frac = (t - t0) / (t1 - t0);
  return LEFT_MARGIN + frac * CHART_WIDTH;
}

function monthTicks(t0: number, t1: number): MonthTick[] {
  const out: MonthTick[] = [];
  if (Number.isNaN(t0) || Number.isNaN(t1) || t1 <= t0) return out;

  const start = new Date(t0);
  out.push({
    x: xFor(t0, t0, t1),
    label: MONTH_NAMES[start.getUTCMonth()],
  });

  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
  );
  while (cursor.getTime() <= t1) {
    out.push({
      x: xFor(cursor.getTime(), t0, t1),
      label: MONTH_NAMES[cursor.getUTCMonth()],
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}

function ScheduleView({ widget }: { widget: PlanScheduleWidget }) {
  const t0 = parseISO(widget.dateRange.startISO);
  const t1 = parseISO(widget.dateRange.endISO);
  const ticks = monthTicks(t0, t1);
  const today =
    widget.today !== undefined ? parseISO(widget.today) : NaN;
  const todayInRange =
    !Number.isNaN(today) && today >= t0 && today <= t1;
  const height = ROW_START_Y + widget.tasks.length * ROW_HEIGHT;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-3">
        {widget.title}
      </h3>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${height}`}
          width="100%"
          role="img"
          aria-label={widget.title}
          style={{ minWidth: 480 }}
        >
          <line
            x1={LEFT_MARGIN}
            y1={AXIS_Y + 6}
            x2={LEFT_MARGIN + CHART_WIDTH}
            y2={AXIS_Y + 6}
            stroke="currentColor"
            opacity="0.15"
          />

          {ticks.map((t, i) => (
            <text
              key={`tick-${i}`}
              x={t.x}
              y={AXIS_Y - 4}
              fontSize="10"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fill="currentColor"
              opacity="0.55"
              textAnchor={i === 0 ? "start" : "middle"}
            >
              {t.label}
            </text>
          ))}

          {widget.tasks.map((_, i) => {
            const y = ROW_START_Y + (i + 1) * ROW_HEIGHT;
            if (i === widget.tasks.length - 1) return null;
            return (
              <line
                key={`sep-${i}`}
                x1={LEFT_MARGIN}
                y1={y}
                x2={LEFT_MARGIN + CHART_WIDTH}
                y2={y}
                stroke="currentColor"
                opacity="0.06"
              />
            );
          })}

          {widget.tasks.map((task, i) => {
            const ts = parseISO(task.startISO);
            const te = parseISO(task.endISO);
            const x = Number.isNaN(ts) ? LEFT_MARGIN : xFor(ts, t0, t1);
            const xEnd = Number.isNaN(te) ? x : xFor(te, t0, t1);
            const w = Math.max(2, xEnd - x);
            const rowY = ROW_START_Y + i * ROW_HEIGHT;
            const barY = rowY + (ROW_HEIGHT - BAR_HEIGHT) / 2;
            const labelY = rowY + ROW_HEIGHT / 2;
            return (
              <g key={task.id}>
                <text
                  x={LEFT_MARGIN - 12}
                  y={labelY}
                  fontSize="12"
                  fill="currentColor"
                  textAnchor="end"
                  dominantBaseline="central"
                >
                  {task.name}
                </text>
                <rect
                  data-bap-prompt={task.clickPrompt}
                  x={x}
                  y={barY}
                  width={w}
                  height={BAR_HEIGHT}
                  rx={4}
                  fill={BAP_RED}
                  style={{ cursor: "pointer" }}
                >
                  <title>{`${task.name} · ${task.startISO} → ${task.endISO}`}</title>
                </rect>
              </g>
            );
          })}

          {todayInRange ? (
            <g>
              <line
                x1={xFor(today, t0, t1)}
                y1={AXIS_Y + 6}
                x2={xFor(today, t0, t1)}
                y2={height - 4}
                stroke={TODAY_COLOR}
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={xFor(today, t0, t1) + 4}
                y={AXIS_Y + 16}
                fontSize="10"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fill={TODAY_COLOR}
              >
                today
              </text>
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  );
}
