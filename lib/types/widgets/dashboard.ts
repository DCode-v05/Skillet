export interface DashboardKpiTile {
  id: string;
  metric: string;
  value: string;
  deltaText?: string;
  deltaDirection?: "up" | "down" | "flat";
  clickPrompt: string;
}

export interface DashboardKpiWidget {
  widget: "dashboard";
  variant: "kpi";
  version: "1.0";
  title?: string;
  tiles: DashboardKpiTile[];
}

export interface DashboardProfileStat {
  label: string;
  value: string;
}

export interface DashboardProfileAction {
  label: string;
  prompt: string;
}

export interface DashboardProfileWidget {
  widget: "dashboard";
  variant: "profile";
  version: "1.0";
  name: string;
  initials: string;
  role?: string;
  stats?: DashboardProfileStat[];
  action: DashboardProfileAction;
}

export interface DashboardKanbanCard {
  id: string;
  title: string;
  meta?: string;
  clickPrompt: string;
}

export interface DashboardKanbanColumn {
  id: string;
  name: string;
  cards: DashboardKanbanCard[];
}

export interface DashboardKanbanWidget {
  widget: "dashboard";
  variant: "kanban";
  version: "1.0";
  title?: string;
  columns: DashboardKanbanColumn[];
}

export interface DashboardPricingFeature {
  text: string;
  included: boolean;
}

export interface DashboardPricingCta {
  label: string;
  prompt: string;
}

export interface DashboardPricingTier {
  id: string;
  name: string;
  price: string;
  priceSuffix?: string;
  features: DashboardPricingFeature[];
  cta: DashboardPricingCta;
  recommended: boolean;
}

export interface DashboardPricingWidget {
  widget: "dashboard";
  variant: "pricing";
  version: "1.0";
  heading: string;
  tiers: DashboardPricingTier[];
}

export type DashboardWidget =
  | DashboardKpiWidget
  | DashboardProfileWidget
  | DashboardKanbanWidget
  | DashboardPricingWidget;
