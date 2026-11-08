export interface PlanStepsWidget {
  widget: "plan";
  variant: "steps";
  version: "1.0";
  title: string;
  items: Array<{
    id: string;
    n: number;
    title: string;
    body?: string;
    current: boolean;
    clickPrompt: string;
  }>;
}

export interface PlanDatedWidget {
  widget: "plan";
  variant: "dated";
  version: "1.0";
  title: string;
  events: Array<{
    id: string;
    date: string;
    title: string;
    body?: string;
    accent: boolean;
    clickPrompt: string;
  }>;
}

export interface PlanScheduleTask {
  id: string;
  name: string;
  startISO: string;
  endISO: string;
  clickPrompt: string;
}

export interface PlanScheduleWidget {
  widget: "plan";
  variant: "schedule";
  version: "1.0";
  title: string;
  dateRange: {
    startISO: string;
    endISO: string;
  };
  tasks: PlanScheduleTask[];
  today?: string;
}

export type PlanWidget = PlanStepsWidget | PlanDatedWidget | PlanScheduleWidget;
