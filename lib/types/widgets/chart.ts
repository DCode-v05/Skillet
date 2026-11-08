export interface ChartBarWidget {
  widget: "chart";
  variant: "bar";
  version: "1.0";
  title: string;
  subtitle?: string;
  yUnits?: string;
  bars: Array<{
    id: string;
    label: string;
    value: number;
    clickPrompt: string;
    tooltipExtra?: string;
  }>;
}

export interface ChartPieWidget {
  widget: "chart";
  variant: "pie";
  version: "1.0";
  title: string;
  slices: Array<{
    id: string;
    label: string;
    value: number;
    clickPrompt: string;
  }>;
}

export interface ChartScatterWidget {
  widget: "chart";
  variant: "scatter";
  version: "1.0";
  title: string;
  xLabel: string;
  yLabel: string;
  units?: string;
  points: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    clickPrompt: string;
  }>;
  trendLine?: boolean;
}

export interface ChartFunnelWidget {
  widget: "chart";
  variant: "funnel";
  version: "1.0";
  title: string;
  stages: Array<{
    id: string;
    name: string;
    count: number;
    clickPrompt: string;
  }>;
}

export type RadarEntityColor = "red" | "blue" | "gray";

export interface ChartRadarWidget {
  widget: "chart";
  variant: "radar";
  version: "1.0";
  title: string;
  axes: string[];
  maxValue: number;
  entities: Array<{
    id: string;
    name: string;
    color: RadarEntityColor;
    values: number[];
    clickPrompt: string;
  }>;
}

export interface ChartHeatmapWidget {
  widget: "chart";
  variant: "heatmap";
  version: "1.0";
  title: string;
  xLabels: string[];
  yLabels: string[];
  maxValue: number;
  cells: Array<{
    xIdx: number;
    yIdx: number;
    value: number;
    clickPrompt: string;
  }>;
}

export type ChartWidget =
  | ChartBarWidget
  | ChartPieWidget
  | ChartScatterWidget
  | ChartFunnelWidget
  | ChartRadarWidget
  | ChartHeatmapWidget;
