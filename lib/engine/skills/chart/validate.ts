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
import {
  asObject,
  buildResult,
  checkPlaceholders,
  requireKeys,
  uniqueIds,
  type ValidationResult,
} from "../_shared/validate-helpers";

const RADAR_COLORS: ReadonlySet<RadarEntityColor> = new Set([
  "red",
  "blue",
  "gray",
]);

export function validateChart(input: unknown): ValidationResult {
  const issues: string[] = [];
  const data = asObject(input, issues);
  if (!data) return buildResult(issues, "");

  checkPlaceholders(data, issues);
  requireKeys(data, ["widget", "version", "variant"], issues);
  if (issues.length > 0) return buildResult(issues, "");

  if (data.widget !== "chart") {
    issues.push(`widget must be 'chart', got '${String(data.widget)}'`);
  }

  switch (data.variant) {
    case "bar":
      return validateBar(data, issues);
    case "pie":
      return validatePie(data, issues);
    case "scatter":
      return validateScatter(data, issues);
    case "funnel":
      return validateFunnel(data, issues);
    case "radar":
      return validateRadar(data, issues);
    case "heatmap":
      return validateHeatmap(data, issues);
    default:
      issues.push(
        `variant must be one of 'bar' | 'pie' | 'scatter' | 'funnel' | 'radar' | 'heatmap', got '${String(data.variant)}'`,
      );
      return buildResult(issues, "");
  }
}

function validateBar(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  requireKeys(data, ["title", "bars"], issues);
  requireNonEmptyString(data, "title", issues);

  if (!Array.isArray(data.bars)) {
    issues.push(`bars must be an array`);
    return buildResult(issues, "");
  }
  const bars = data.bars as Array<Record<string, unknown>>;
  if (bars.length < 2 || bars.length > 12) {
    issues.push(`bars must have 2-12 entries, got ${bars.length}`);
  }
  uniqueIds(bars, "bar", issues);

  for (const b of bars) {
    const tag = `bar '${String(b.id ?? "?")}'`;
    for (const k of ["id", "label", "clickPrompt"]) {
      if (typeof b[k] !== "string" || (b[k] as string).length === 0) {
        issues.push(`${tag} missing non-empty '${k}'`);
      }
    }
    if (typeof b.value !== "number" || Number.isNaN(b.value)) {
      issues.push(`${tag} value must be a number`);
    } else if (b.value < 0) {
      issues.push(`${tag} value must be ≥ 0, got ${b.value}`);
    }
    if (
      b.tooltipExtra !== undefined &&
      (typeof b.tooltipExtra !== "string" || b.tooltipExtra.length === 0)
    ) {
      issues.push(`${tag} tooltipExtra must be a non-empty string if present`);
    }
  }
  return buildResult(
    issues,
    `OK: chart/bar valid (${bars.length} bar${bars.length === 1 ? "" : "s"})`,
  );
}

function validatePie(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  requireKeys(data, ["title", "slices"], issues);
  requireNonEmptyString(data, "title", issues);

  if (!Array.isArray(data.slices)) {
    issues.push(`slices must be an array`);
    return buildResult(issues, "");
  }
  const slices = data.slices as Array<Record<string, unknown>>;
  if (slices.length < 2 || slices.length > 6) {
    issues.push(`slices must have 2-6 entries, got ${slices.length}`);
  }
  uniqueIds(slices, "slice", issues);

  for (const s of slices) {
    const tag = `slice '${String(s.id ?? "?")}'`;
    for (const k of ["id", "label", "clickPrompt"]) {
      if (typeof s[k] !== "string" || (s[k] as string).length === 0) {
        issues.push(`${tag} missing non-empty '${k}'`);
      }
    }
    if (typeof s.value !== "number" || Number.isNaN(s.value)) {
      issues.push(`${tag} value must be a number`);
    } else if (s.value <= 0) {
      issues.push(`${tag} value must be > 0, got ${s.value}`);
    }
  }
  return buildResult(
    issues,
    `OK: chart/pie valid (${slices.length} slice${slices.length === 1 ? "" : "s"})`,
  );
}

function validateScatter(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  requireKeys(data, ["title", "xLabel", "yLabel", "points"], issues);
  requireNonEmptyString(data, "title", issues);
  requireNonEmptyString(data, "xLabel", issues);
  requireNonEmptyString(data, "yLabel", issues);

  if (!Array.isArray(data.points)) {
    issues.push(`points must be an array`);
    return buildResult(issues, "");
  }
  const points = data.points as Array<Record<string, unknown>>;
  if (points.length < 4 || points.length > 30) {
    issues.push(`points must have 4-30 entries, got ${points.length}`);
  }
  uniqueIds(points, "point", issues);

  for (const p of points) {
    const tag = `point '${String(p.id ?? "?")}'`;
    for (const k of ["id", "label", "clickPrompt"]) {
      if (typeof p[k] !== "string" || (p[k] as string).length === 0) {
        issues.push(`${tag} missing non-empty '${k}'`);
      }
    }
    for (const k of ["x", "y"] as const) {
      if (typeof p[k] !== "number" || Number.isNaN(p[k])) {
        issues.push(`${tag} ${k} must be a number`);
      }
    }
  }
  if (
    data.trendLine !== undefined &&
    typeof data.trendLine !== "boolean"
  ) {
    issues.push(`trendLine must be a boolean if present`);
  }
  return buildResult(
    issues,
    `OK: chart/scatter valid (${points.length} point${points.length === 1 ? "" : "s"})`,
  );
}

function validateFunnel(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  requireKeys(data, ["title", "stages"], issues);
  requireNonEmptyString(data, "title", issues);

  if (!Array.isArray(data.stages)) {
    issues.push(`stages must be an array`);
    return buildResult(issues, "");
  }
  const stages = data.stages as Array<Record<string, unknown>>;
  if (stages.length < 3 || stages.length > 6) {
    issues.push(`stages must have 3-6 entries, got ${stages.length}`);
  }
  uniqueIds(stages, "stage", issues);

  let prevCount = Number.POSITIVE_INFINITY;
  for (const s of stages) {
    const tag = `stage '${String(s.id ?? "?")}'`;
    for (const k of ["id", "name", "clickPrompt"]) {
      if (typeof s[k] !== "string" || (s[k] as string).length === 0) {
        issues.push(`${tag} missing non-empty '${k}'`);
      }
    }
    if (typeof s.count !== "number" || Number.isNaN(s.count)) {
      issues.push(`${tag} count must be a number`);
    } else {
      if (s.count <= 0) {
        issues.push(`${tag} count must be > 0, got ${s.count}`);
      }
      if (s.count > prevCount) {
        issues.push(
          `${tag} count ${s.count} exceeds previous stage's count ${prevCount} — funnel counts must be non-increasing`,
        );
      }
      prevCount = s.count as number;
    }
  }
  return buildResult(
    issues,
    `OK: chart/funnel valid (${stages.length} stage${stages.length === 1 ? "" : "s"})`,
  );
}

function validateRadar(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  requireKeys(data, ["title", "axes", "maxValue", "entities"], issues);
  requireNonEmptyString(data, "title", issues);

  if (!Array.isArray(data.axes)) {
    issues.push(`axes must be an array of strings`);
    return buildResult(issues, "");
  }
  const axes = data.axes as unknown[];
  if (axes.length < 3 || axes.length > 7) {
    issues.push(`axes must have 3-7 entries, got ${axes.length}`);
  }
  for (let i = 0; i < axes.length; i++) {
    if (typeof axes[i] !== "string" || (axes[i] as string).length === 0) {
      issues.push(`axes[${i}] must be a non-empty string`);
    }
  }

  if (typeof data.maxValue !== "number" || Number.isNaN(data.maxValue)) {
    issues.push(`maxValue must be a number`);
  } else if ((data.maxValue as number) <= 0) {
    issues.push(`maxValue must be > 0, got ${data.maxValue}`);
  }

  if (!Array.isArray(data.entities)) {
    issues.push(`entities must be an array`);
    return buildResult(issues, "");
  }
  const entities = data.entities as Array<Record<string, unknown>>;
  if (entities.length < 1 || entities.length > 3) {
    issues.push(`entities must have 1-3 entries, got ${entities.length}`);
  }
  uniqueIds(entities, "entity", issues);

  const maxV = typeof data.maxValue === "number" ? (data.maxValue as number) : 0;
  for (const e of entities) {
    const tag = `entity '${String(e.id ?? "?")}'`;
    for (const k of ["id", "name", "clickPrompt"]) {
      if (typeof e[k] !== "string" || (e[k] as string).length === 0) {
        issues.push(`${tag} missing non-empty '${k}'`);
      }
    }
    if (!RADAR_COLORS.has(e.color as RadarEntityColor)) {
      issues.push(
        `${tag} color must be one of ${[...RADAR_COLORS].join(", ")}, got '${String(e.color)}'`,
      );
    }
    if (!Array.isArray(e.values)) {
      issues.push(`${tag} values must be an array`);
      continue;
    }
    const vals = e.values as unknown[];
    if (vals.length !== axes.length) {
      issues.push(
        `${tag} values length ${vals.length} must match axes length ${axes.length}`,
      );
    }
    for (let i = 0; i < vals.length; i++) {
      const v = vals[i];
      if (typeof v !== "number" || Number.isNaN(v)) {
        issues.push(`${tag} values[${i}] must be a number`);
      } else if (maxV > 0 && (v < 0 || v > maxV)) {
        issues.push(
          `${tag} values[${i}] = ${v} out of range [0..${maxV}]`,
        );
      }
    }
  }
  return buildResult(
    issues,
    `OK: chart/radar valid (${axes.length} axes × ${entities.length} entit${entities.length === 1 ? "y" : "ies"})`,
  );
}

function validateHeatmap(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  requireKeys(
    data,
    ["title", "xLabels", "yLabels", "maxValue", "cells"],
    issues,
  );
  requireNonEmptyString(data, "title", issues);

  if (!Array.isArray(data.xLabels) || !Array.isArray(data.yLabels)) {
    issues.push(`xLabels and yLabels must both be arrays of strings`);
    return buildResult(issues, "");
  }
  const xLabels = data.xLabels as unknown[];
  const yLabels = data.yLabels as unknown[];
  if (xLabels.length < 2) {
    issues.push(`xLabels must have at least 2 entries, got ${xLabels.length}`);
  }
  if (yLabels.length < 2) {
    issues.push(`yLabels must have at least 2 entries, got ${yLabels.length}`);
  }
  for (let i = 0; i < xLabels.length; i++) {
    if (typeof xLabels[i] !== "string") {
      issues.push(`xLabels[${i}] must be a string`);
    }
  }
  for (let i = 0; i < yLabels.length; i++) {
    if (typeof yLabels[i] !== "string") {
      issues.push(`yLabels[${i}] must be a string`);
    }
  }

  if (typeof data.maxValue !== "number" || Number.isNaN(data.maxValue)) {
    issues.push(`maxValue must be a number`);
  } else if ((data.maxValue as number) <= 0) {
    issues.push(`maxValue must be > 0, got ${data.maxValue}`);
  }

  if (!Array.isArray(data.cells)) {
    issues.push(`cells must be an array`);
    return buildResult(issues, "");
  }
  const cells = data.cells as Array<Record<string, unknown>>;
  const maxV = typeof data.maxValue === "number" ? (data.maxValue as number) : 0;
  const seen = new Set<string>();
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const tag = `cell[${i}]`;
    const xIdx = c.xIdx;
    const yIdx = c.yIdx;
    if (typeof xIdx !== "number" || !Number.isInteger(xIdx)) {
      issues.push(`${tag} xIdx must be an integer`);
    } else if (xIdx < 0 || xIdx >= xLabels.length) {
      issues.push(
        `${tag} xIdx ${xIdx} out of range [0..${xLabels.length - 1}]`,
      );
    }
    if (typeof yIdx !== "number" || !Number.isInteger(yIdx)) {
      issues.push(`${tag} yIdx must be an integer`);
    } else if (yIdx < 0 || yIdx >= yLabels.length) {
      issues.push(
        `${tag} yIdx ${yIdx} out of range [0..${yLabels.length - 1}]`,
      );
    }
    if (typeof c.value !== "number" || Number.isNaN(c.value)) {
      issues.push(`${tag} value must be a number`);
    } else if (maxV > 0 && ((c.value as number) < 0 || (c.value as number) > maxV)) {
      issues.push(
        `${tag} value ${c.value} out of range [0..${maxV}]`,
      );
    }
    if (typeof c.clickPrompt !== "string" || (c.clickPrompt as string).length === 0) {
      issues.push(`${tag} clickPrompt must be a non-empty string`);
    }
    if (
      typeof xIdx === "number" &&
      typeof yIdx === "number" &&
      Number.isInteger(xIdx) &&
      Number.isInteger(yIdx)
    ) {
      const key = `${xIdx},${yIdx}`;
      if (seen.has(key)) {
        issues.push(`${tag} duplicate cell at (xIdx=${xIdx}, yIdx=${yIdx})`);
      } else {
        seen.add(key);
      }
    }
  }
  return buildResult(
    issues,
    `OK: chart/heatmap valid (${xLabels.length}×${yLabels.length} grid, ${cells.length} cell${cells.length === 1 ? "" : "s"})`,
  );
}

function requireNonEmptyString(
  data: Record<string, unknown>,
  key: string,
  issues: string[],
): void {
  if (key in data) {
    const v = data[key];
    if (typeof v !== "string" || v.length === 0) {
      issues.push(`${key} must be a non-empty string`);
    }
  }
}

export function isChartWidget(input: unknown): input is ChartWidget {
  return validateChart(input).valid;
}

export type {
  ChartBarWidget,
  ChartFunnelWidget,
  ChartHeatmapWidget,
  ChartPieWidget,
  ChartRadarWidget,
  ChartScatterWidget,
  ChartWidget,
};
