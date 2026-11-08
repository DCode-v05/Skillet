export interface DiagramFlowNode {
  id: string;
  label: string;
  row: number;
  col: number;
  accent?: boolean;
  clickPrompt: string;
}

export interface DiagramFlowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramFlowWidget {
  widget: "diagram";
  variant: "flow";
  version: "1.0";
  title?: string;
  nodes: DiagramFlowNode[];
  edges: DiagramFlowEdge[];
}

export type DiagramSequenceMessageKind = "request" | "response";

export interface DiagramSequenceMessage {
  id: string;
  fromIdx: number;
  toIdx: number;
  label: string;
  kind: DiagramSequenceMessageKind;
  clickPrompt: string;
}

export interface DiagramSequenceWidget {
  widget: "diagram";
  variant: "sequence";
  version: "1.0";
  title: string;
  actors: string[];
  messages: DiagramSequenceMessage[];
}

export interface DiagramTreeNode {
  id: string;
  label: string;
  accent?: boolean;
  clickPrompt: string;
  children?: DiagramTreeNode[];
}

export interface DiagramTreeWidget {
  widget: "diagram";
  variant: "tree";
  version: "1.0";
  title?: string;
  root: DiagramTreeNode;
}

export interface DiagramMindBranch {
  id: string;
  label: string;
  clickPrompt: string;
}

export interface DiagramMindWidget {
  widget: "diagram";
  variant: "mind";
  version: "1.0";
  title?: string;
  central: string;
  branches: DiagramMindBranch[];
}

export interface DiagramVennSet {
  id: string;
  label: string;
}

export interface DiagramVennRegion {
  id: string;
  label: string;
  setIds: string[];
  clickPrompt: string;
}

export interface DiagramVennWidget {
  widget: "diagram";
  variant: "venn";
  version: "1.0";
  title?: string;
  sets: DiagramVennSet[];
  regions: DiagramVennRegion[];
}

export type DiagramWidget =
  | DiagramFlowWidget
  | DiagramSequenceWidget
  | DiagramTreeWidget
  | DiagramMindWidget
  | DiagramVennWidget;
