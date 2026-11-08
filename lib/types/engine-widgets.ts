import type { ComparisonTableWidget } from "./widgets/comparison-table";
import type { ChipsWidget } from "./widgets/chips";
import type { NoticeWidget } from "./widgets/notice";
import type { ListWidget } from "./widgets/list";
import type { ChartWidget } from "./widgets/chart";
import type { PlanWidget } from "./widgets/plan";
import type { DashboardWidget } from "./widgets/dashboard";
import type { CodeBlockWidget } from "./widgets/code-block";
import type { MapWidget } from "./widgets/map";
import type { DiagramWidget } from "./widgets/diagram";
import type { InteractiveWidget } from "./widgets/interactive";
import type { DecisionWidget } from "./widgets/decision";

export interface UsageReport {
  providerId: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  cacheHitRate: number;
  totalCost: number;
}

export interface TraceStep {
  iteration: number;
  toolName: string;
  inputSummary: string;
  resultSummary: string;
  isError: boolean;
}

export type JsonWidget =
  | ComparisonTableWidget
  | ChipsWidget
  | NoticeWidget
  | ListWidget
  | ChartWidget
  | PlanWidget
  | DashboardWidget
  | CodeBlockWidget
  | MapWidget
  | DiagramWidget
  | InteractiveWidget
  | DecisionWidget;

export type EngineEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_call"; iteration: number; toolName: string; inputSummary: string }
  | {
      type: "tool_result";
      iteration: number;
      toolName: string;
      resultSummary: string;
      isError: boolean;
    }
  | { type: "widget_json"; widget: JsonWidget }
  | { type: "usage"; usage: UsageReport }
  | { type: "error"; message: string }
  | { type: "done" };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  widgetJson: JsonWidget | null;
  useSkill?: boolean;
  usage?: UsageReport;
  trace?: TraceStep[];
  isStreaming?: boolean;
}
