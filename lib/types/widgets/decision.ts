export interface DecisionTradeoffOption {
  id: string;
  label: string;
  blurb: string;
  recommended: boolean;
  chooseLabel: string;
  choosePrompt: string;
}

export interface DecisionTradeoffWidget {
  widget: "decision";
  variant: "tradeoff";
  version: "1.0";
  heading: string;
  options: DecisionTradeoffOption[];
}

export interface DecisionDestructiveWidget {
  widget: "decision";
  variant: "destructive";
  version: "1.0";
  question: string;
  irreversibleNote?: string;
  actionLabel: string;
  confirmedPrompt: string;
}

export type DecisionWidget =
  | DecisionTradeoffWidget
  | DecisionDestructiveWidget;
