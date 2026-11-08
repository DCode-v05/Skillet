"use client";

import type { ReactElement } from "react";
import type { JsonWidget } from "@/lib/types/engine-widgets";
import { ComparisonTableWidget } from "./ComparisonTableWidget";
import { ChipsWidget } from "./ChipsWidget";
import { NoticeWidget } from "./NoticeWidget";
import { ListWidget } from "./ListWidget";
import { ChartWidget } from "./ChartWidget";
import { PlanWidget } from "./PlanWidget";
import { DashboardWidget } from "./DashboardWidget";
import { CodeBlockWidget } from "./CodeBlockWidget";
import { MapWidget } from "./MapWidget";
import { DiagramWidget } from "./DiagramWidget";
import { InteractiveWidget } from "./InteractiveWidget";
import { DecisionWidget } from "./DecisionWidget";

type Kind = JsonWidget["widget"];
type ByKind<K extends Kind> = Extract<JsonWidget, { widget: K }>;

const RENDERERS: { [K in Kind]: (w: ByKind<K>) => ReactElement } = {
  "comparison-table": (w) => <ComparisonTableWidget widget={w} />,
  chips: (w) => <ChipsWidget widget={w} />,
  notice: (w) => <NoticeWidget widget={w} />,
  list: (w) => <ListWidget widget={w} />,
  chart: (w) => <ChartWidget widget={w} />,
  plan: (w) => <PlanWidget widget={w} />,
  dashboard: (w) => <DashboardWidget widget={w} />,
  "code-block": (w) => <CodeBlockWidget widget={w} />,
  map: (w) => <MapWidget widget={w} />,
  diagram: (w) => <DiagramWidget widget={w} />,
  interactive: (w) => <InteractiveWidget widget={w} />,
  decision: (w) => <DecisionWidget widget={w} />,
};

export function renderJsonWidget(widget: JsonWidget): ReactElement {
  const renderer = RENDERERS[widget.widget] as (w: JsonWidget) => ReactElement;
  if (!renderer) {
    return (
      <div className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
        Unknown widget kind: <code>{(widget as { widget: string }).widget}</code>
      </div>
    );
  }
  return renderer(widget);
}
