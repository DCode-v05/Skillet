export type InteractiveOutputFormat = "currency" | "number" | "percent";

export interface InteractiveCalculatorInput {
  id: string;
  label: string;
  kind: "number" | "range";
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface InteractiveCalculatorWidget {
  widget: "interactive";
  variant: "calculator";
  version: "1.0";
  title: string;
  inputs: InteractiveCalculatorInput[];
  formula: string;
  outputLabel: string;
  outputFormat: InteractiveOutputFormat;
  outputUnit?: string;
  explainPrompt: string;
}

export interface InteractiveQuizOption {
  id: string;
  label: string;
  correct: boolean;
}

export interface InteractiveQuizQuestion {
  id: string;
  prompt: string;
  options: InteractiveQuizOption[];
}

export interface InteractiveQuizWidget {
  widget: "interactive";
  variant: "quiz";
  version: "1.0";
  title: string;
  questions: InteractiveQuizQuestion[];
  reviewPrompt: string;
}

export type InteractiveFormFieldKind = "text" | "email" | "textarea" | "select";

export interface InteractiveFormField {
  id: string;
  label: string;
  kind: InteractiveFormFieldKind;
  placeholder?: string;
  options?: string[];
}

export interface InteractiveFormWidget {
  widget: "interactive";
  variant: "form";
  version: "1.0";
  title: string;
  description?: string;
  fields: InteractiveFormField[];
  submitLabel: string;
  submitPrompt: string;
}

export type InteractiveWidget =
  | InteractiveCalculatorWidget
  | InteractiveQuizWidget
  | InteractiveFormWidget;
