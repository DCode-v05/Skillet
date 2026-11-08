"use client";

import type {
  ChartBarWidget,
  ChartFunnelWidget,
  ChartHeatmapWidget,
  ChartPieWidget,
  ChartRadarWidget,
  ChartScatterWidget,
  ChartWidget,
  RadarEntityColor,
} from "@/lib/types/widgets/chart";

const ACCENT = "#EC3B4A";
const BLUE = "#7dd3fc";
const GRAY = "#888888";
const AXIS = "var(--border)";
const GUIDE = "rgba(140,140,140,0.35)";
const MUTED = "var(--secondary)";

export function ChartWidget({ widget }: { widget: ChartWidget }) {
  switch (widget.variant) {
    case "bar":
      return <BarChart widget={widget} />;
    case "pie":
      return <PieChart widget={widget} />;
    case "scatter":
      return <ScatterChart widget={widget} />;
    case "funnel":
      return <FunnelChart widget={widget} />;
    case "radar":
      return <RadarChart widget={widget} />;
    case "heatmap":
      return <HeatmapChart widget={widget} />;
  }
}

function ChartFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-1">
        {title}
      </h3>
      {subtitle ? (
        <div className="text-xs text-[var(--secondary)] mb-3 leading-relaxed">
          {subtitle}
        </div>
      ) : (
        <div className="mb-3" />
      )}
      {children}
    </div>
  );
}

function niceTicks(maxRaw: number, targetCount = 5): number[] {
  if (maxRaw <= 0) return [0, 1];
  const exp = Math.floor(Math.log10(maxRaw));
  const pow = Math.pow(10, exp);
  const norm = maxRaw / pow;
  let niceStep: number;
  if (norm <= 1) niceStep = 0.2;
  else if (norm <= 2) niceStep = 0.5;
  else if (norm <= 5) niceStep = 1;
  else niceStep = 2;
  const step = niceStep * pow;
  const ceil = Math.ceil(maxRaw / step) * step;
  const ticks: number[] = [];
  const n = Math.min(targetCount, Math.round(ceil / step));
  const safeN = Math.max(2, n);
  for (let i = 0; i <= safeN; i++) {
    ticks.push((ceil / safeN) * i);
  }
  return ticks;
}

function formatTick(v: number): string {
  if (v === 0) return "0";
  const abs = Math.abs(v);
  if (abs >= 1000) {
    const k = v / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  if (abs >= 10) return v.toFixed(0);
  if (abs >= 1) return v.toFixed(1).replace(/\.0$/, "");
  return v.toFixed(2).replace(/\.?0+$/, "");
}

function BarChart({ widget }: { widget: ChartBarWidget }) {
  const W = 400;
  const H = 240;
  const M = { top: 16, right: 12, bottom: 48, left: 40 };
  const chartW = W - M.left - M.right;
  const chartH = H - M.top - M.bottom;

  const maxVal = Math.max(...widget.bars.map((b) => b.value), 0);
  const ticks = niceTicks(maxVal || 1);
  const yMax = ticks[ticks.length - 1] || 1;

  const slot = chartW / widget.bars.length;
  const barW = slot * 0.7;
  const avgLabelLen = Math.max(
    ...widget.bars.map((b) => b.label.length),
  );
  const rotate = avgLabelLen * 6 > slot - 4;

  return (
    <ChartFrame
      title={widget.title}
      subtitle={
        widget.subtitle ?? (widget.yUnits ? `units: ${widget.yUnits}` : undefined)
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {ticks.map((t, i) => {
          const y = M.top + chartH - (t / yMax) * chartH;
          return (
            <g key={`ytick-${i}`}>
              <line
                x1={M.left}
                x2={W - M.right}
                y1={y}
                y2={y}
                stroke={GUIDE}
                strokeDasharray={i === 0 ? "0" : "2 3"}
              />
              <text
                x={M.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                fill={MUTED}
              >
                {formatTick(t)}
                {widget.yUnits ? widget.yUnits : ""}
              </text>
            </g>
          );
        })}

        {widget.bars.map((b, i) => {
          const x = M.left + i * slot + (slot - barW) / 2;
          const h = yMax > 0 ? (b.value / yMax) * chartH : 0;
          const y = M.top + chartH - h;
          const labelX = M.left + i * slot + slot / 2;
          return (
            <g key={b.id}>
              <rect
                data-bap-prompt={b.clickPrompt}
                x={x}
                y={y}
                width={barW}
                height={h}
                fill={ACCENT}
                rx={2}
                style={{ cursor: "pointer" }}
              >
                <title>
                  {b.label} · {formatTick(b.value)}
                  {widget.yUnits ? ` ${widget.yUnits}` : ""}
                  {b.tooltipExtra ? ` — ${b.tooltipExtra}` : ""}
                </title>
              </rect>
              <text
                x={labelX}
                y={y - 4}
                textAnchor="middle"
                fontSize={10}
                fill={MUTED}
              >
                {formatTick(b.value)}
              </text>
              <text
                x={labelX}
                y={M.top + chartH + 14}
                textAnchor={rotate ? "end" : "middle"}
                fontSize={10}
                fill={MUTED}
                transform={
                  rotate
                    ? `rotate(-30 ${labelX} ${M.top + chartH + 14})`
                    : undefined
                }
              >
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
}

const PIE_COLORS = [
  "#EC3B4A",
  "#f06b78",
  "#f599a3",
  "#b4b4b4",
  "#9a9a9a",
  "#7f7f7f",
];

function PieChart({ widget }: { widget: ChartPieWidget }) {
  const W = 240;
  const H = 240;
  const cx = 120;
  const cy = 120;
  const r = 90;

  const total = widget.slices.reduce((acc, s) => acc + s.value, 0) || 1;

  let cumulative = 0;
  const paths = widget.slices.map((s, i) => {
    const startFrac = cumulative / total;
    cumulative += s.value;
    const endFrac = cumulative / total;
    const startAngle = -Math.PI / 2 + startFrac * 2 * Math.PI;
    const endAngle = -Math.PI / 2 + endFrac * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const d = `M ${cx},${cy} L ${x1.toFixed(2)},${y1.toFixed(2)} A ${r},${r} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
    const pct = (s.value / total) * 100;
    return { slice: s, d, color: PIE_COLORS[i % PIE_COLORS.length], pct };
  });

  return (
    <ChartFrame title={widget.title}>
      <div className="flex flex-col items-center gap-3">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
          {paths.map(({ slice, d, color, pct }) => (
            <path
              key={slice.id}
              data-bap-prompt={slice.clickPrompt}
              d={d}
              fill={color}
              stroke="var(--surface)"
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
            >
              <title>
                {slice.label} · {pct.toFixed(1)}%
              </title>
            </path>
          ))}
        </svg>
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-xs">
          {paths.map(({ slice, color, pct }) => (
            <div key={slice.id} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: color }}
              />
              <span className="text-[var(--foreground)]">{slice.label}</span>
              <span className="text-[var(--secondary)]">
                {pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}

function ScatterChart({ widget }: { widget: ChartScatterWidget }) {
  const W = 400;
  const H = 280;
  const M = { top: 16, right: 14, bottom: 52, left: 50 };
  const chartW = W - M.left - M.right;
  const chartH = H - M.top - M.bottom;

  const xs = widget.points.map((p) => p.x);
  const ys = widget.points.map((p) => p.y);
  const xMin = Math.min(...xs, 0);
  const xMaxRaw = Math.max(...xs, 1);
  const yMin = Math.min(...ys, 0);
  const yMaxRaw = Math.max(...ys, 1);
  const xTicks = niceTicks(xMaxRaw - xMin || 1, 5).map((t) => t + xMin);
  const yTicks = niceTicks(yMaxRaw - yMin || 1, 5).map((t) => t + yMin);
  const xMax = xTicks[xTicks.length - 1];
  const yMax = yTicks[yTicks.length - 1];

  const sx = (v: number) =>
    M.left + ((v - xMin) / (xMax - xMin || 1)) * chartW;
  const sy = (v: number) =>
    M.top + chartH - ((v - yMin) / (yMax - yMin || 1)) * chartH;

  let trend: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (widget.trendLine && widget.points.length >= 2) {
    const n = widget.points.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = widget.points.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
    const denom = n * sumXX - sumX * sumX;
    if (denom !== 0) {
      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;
      const x1 = xMin;
      const x2 = xMax;
      trend = {
        x1: sx(x1),
        y1: sy(slope * x1 + intercept),
        x2: sx(x2),
        y2: sy(slope * x2 + intercept),
      };
    }
  }

  return (
    <ChartFrame title={widget.title}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {yTicks.map((t, i) => {
          const y = sy(t);
          return (
            <g key={`yt-${i}`}>
              <line
                x1={M.left}
                x2={W - M.right}
                y1={y}
                y2={y}
                stroke={GUIDE}
                strokeDasharray={i === 0 ? "0" : "2 3"}
              />
              <text
                x={M.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                fill={MUTED}
              >
                {formatTick(t)}
                {widget.units ?? ""}
              </text>
            </g>
          );
        })}
        <line
          x1={M.left}
          x2={W - M.right}
          y1={M.top + chartH}
          y2={M.top + chartH}
          stroke={AXIS}
        />
        {xTicks.map((t, i) => {
          const x = sx(t);
          return (
            <g key={`xt-${i}`}>
              <line
                x1={x}
                x2={x}
                y1={M.top + chartH}
                y2={M.top + chartH + 4}
                stroke={AXIS}
              />
              <text
                x={x}
                y={M.top + chartH + 16}
                textAnchor="middle"
                fontSize={10}
                fill={MUTED}
              >
                {formatTick(t)}
                {widget.units ?? ""}
              </text>
            </g>
          );
        })}
        <text
          x={M.left + chartW / 2}
          y={H - 6}
          textAnchor="middle"
          fontSize={11}
          fill={MUTED}
        >
          {widget.xLabel}
        </text>
        <text
          x={12}
          y={M.top + chartH / 2}
          textAnchor="middle"
          fontSize={11}
          fill={MUTED}
          transform={`rotate(-90 12 ${M.top + chartH / 2})`}
        >
          {widget.yLabel}
        </text>

        {trend ? (
          <line
            x1={trend.x1}
            y1={trend.y1}
            x2={trend.x2}
            y2={trend.y2}
            stroke={GRAY}
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
        ) : null}

        {widget.points.map((p) => (
          <circle
            key={p.id}
            data-bap-prompt={p.clickPrompt}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={5}
            fill={ACCENT}
            style={{ cursor: "pointer" }}
          >
            <title>
              {p.label} · ({formatTick(p.x)}
              {widget.units ?? ""}, {formatTick(p.y)}
              {widget.units ?? ""})
            </title>
          </circle>
        ))}
      </svg>
    </ChartFrame>
  );
}

const FUNNEL_COLORS = [
  "#EC3B4A",
  "#e85968",
  "#d97583",
  "#b88791",
  "#8f8f8f",
  "#777777",
];

function FunnelChart({ widget }: { widget: ChartFunnelWidget }) {
  const W = 480;
  const H = 320;
  const M = { top: 16, bottom: 16, left: 40, right: 40 };
  const totalH = H - M.top - M.bottom;
  const totalW = W - M.left - M.right;
  const stageH = totalH / widget.stages.length;
  const insetPerStage = (totalW * 0.08) / Math.max(1, widget.stages.length);

  const top = widget.stages[0]?.count ?? 1;

  return (
    <ChartFrame title={widget.title}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {widget.stages.map((s, i) => {
          const tlX = M.left + i * insetPerStage;
          const trX = W - M.right - i * insetPerStage;
          const blX = M.left + (i + 1) * insetPerStage;
          const brX = W - M.right - (i + 1) * insetPerStage;
          const tY = M.top + i * stageH;
          const bY = M.top + (i + 1) * stageH;
          const points = `${tlX},${tY} ${trX},${tY} ${brX},${bY} ${blX},${bY}`;
          const color = FUNNEL_COLORS[i] ?? GRAY;
          const pct = top > 0 ? (s.count / top) * 100 : 0;
          const labelY = tY + stageH / 2 + 4;
          return (
            <g key={s.id}>
              <polygon
                data-bap-prompt={s.clickPrompt}
                points={points}
                fill={color}
                style={{ cursor: "pointer" }}
              >
                <title>
                  {s.name} · {s.count.toLocaleString()} ({pct.toFixed(1)}%)
                </title>
              </polygon>
              <text
                x={W / 2}
                y={labelY}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill="#ffffff"
              >
                {s.name} · {s.count.toLocaleString()} ({pct.toFixed(1)}%)
              </text>
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
}

const RADAR_COLOR_MAP: Record<RadarEntityColor, string> = {
  red: ACCENT,
  blue: BLUE,
  gray: GRAY,
};

function RadarChart({ widget }: { widget: ChartRadarWidget }) {
  const W = 360;
  const H = 360;
  const cx = 180;
  const cy = 180;
  const r = 130;
  const n = widget.axes.length;

  const tip = (i: number, scale = 1) => {
    const angle = -Math.PI / 2 + (i / n) * 2 * Math.PI;
    return {
      x: cx + r * scale * Math.cos(angle),
      y: cy + r * scale * Math.sin(angle),
    };
  };
  const labelPos = (i: number) => {
    const angle = -Math.PI / 2 + (i / n) * 2 * Math.PI;
    const lr = r + 18;
    return {
      x: cx + lr * Math.cos(angle),
      y: cy + lr * Math.sin(angle),
    };
  };

  const guideRings = [0.25, 0.5, 0.75, 1];

  return (
    <ChartFrame title={widget.title}>
      <div className="flex flex-col items-center gap-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[360px]" role="img">
          {guideRings.map((g, gi) => {
            const pts = Array.from({ length: n }, (_, i) => {
              const t = tip(i, g);
              return `${t.x.toFixed(2)},${t.y.toFixed(2)}`;
            }).join(" ");
            return (
              <polygon
                key={`g-${gi}`}
                points={pts}
                fill="none"
                stroke={GUIDE}
                strokeWidth={1}
              />
            );
          })}
          {widget.axes.map((axis, i) => {
            const t = tip(i, 1);
            const lp = labelPos(i);
            const dx = lp.x - cx;
            const anchor: "start" | "middle" | "end" =
              Math.abs(dx) < 4 ? "middle" : dx > 0 ? "start" : "end";
            return (
              <g key={`a-${i}`}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={t.x}
                  y2={t.y}
                  stroke={GUIDE}
                  strokeWidth={1}
                />
                <text
                  x={lp.x}
                  y={lp.y + 3}
                  textAnchor={anchor}
                  fontSize={11}
                  fill={MUTED}
                >
                  {axis}
                </text>
              </g>
            );
          })}
          {widget.entities.map((e) => {
            const color = RADAR_COLOR_MAP[e.color];
            const pts = e.values
              .map((v, i) => {
                const clamped =
                  widget.maxValue > 0
                    ? Math.max(0, Math.min(widget.maxValue, v))
                    : 0;
                const scale =
                  widget.maxValue > 0 ? clamped / widget.maxValue : 0;
                const t = tip(i, scale);
                return `${t.x.toFixed(2)},${t.y.toFixed(2)}`;
              })
              .join(" ");
            return (
              <polygon
                key={e.id}
                data-bap-prompt={e.clickPrompt}
                points={pts}
                fill={color}
                fillOpacity={0.35}
                stroke={color}
                strokeWidth={2}
                style={{ cursor: "pointer" }}
              >
                <title>{e.name}</title>
              </polygon>
            );
          })}
        </svg>
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-xs">
          {widget.entities.map((e) => (
            <div key={e.id} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: RADAR_COLOR_MAP[e.color] }}
              />
              <span className="text-[var(--foreground)]">{e.name}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}

function HeatmapChart({ widget }: { widget: ChartHeatmapWidget }) {
  const matrix: Array<
    Array<{ value: number; clickPrompt: string } | null>
  > = widget.yLabels.map(() => widget.xLabels.map(() => null));
  for (const c of widget.cells) {
    if (
      c.yIdx >= 0 &&
      c.yIdx < widget.yLabels.length &&
      c.xIdx >= 0 &&
      c.xIdx < widget.xLabels.length
    ) {
      matrix[c.yIdx][c.xIdx] = { value: c.value, clickPrompt: c.clickPrompt };
    }
  }

  return (
    <ChartFrame title={widget.title}>
      <div className="overflow-x-auto">
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ width: 40 }} aria-hidden="true" />
              {widget.xLabels.map((x, xi) => (
                <th
                  key={`x-${xi}`}
                  className="text-[var(--secondary)]"
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 10,
                    fontWeight: 400,
                    padding: "2px 0",
                    textAlign: "center",
                    width: 32,
                  }}
                >
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {widget.yLabels.map((y, yi) => (
              <tr key={`y-${yi}`}>
                <td
                  className="text-[var(--secondary)]"
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 10,
                    padding: "0 8px 0 0",
                    textAlign: "right",
                    width: 40,
                  }}
                >
                  {y}
                </td>
                {widget.xLabels.map((_, xi) => {
                  const cell = matrix[yi][xi];
                  const v = cell?.value ?? 0;
                  const opacity =
                    widget.maxValue > 0
                      ? Math.max(0, Math.min(1, v / widget.maxValue))
                      : 0;
                  const tooltip = cell
                    ? `${y} · ${widget.xLabels[xi]} · ${formatTick(v)}`
                    : `${y} · ${widget.xLabels[xi]} · 0`;
                  return (
                    <td
                      key={`c-${yi}-${xi}`}
                      data-bap-prompt={cell?.clickPrompt}
                      title={tooltip}
                      style={{
                        width: 32,
                        height: 22,
                        background: `rgba(236,59,74,${opacity})`,
                        border: "1px solid var(--background)",
                        cursor: cell ? "pointer" : "default",
                      }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}
