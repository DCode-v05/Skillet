export type CellFormat =
  | "text"
  | "number"
  | "currency"
  | "boolean"
  | "rating";

export interface ComparisonTableOption {
  id: string;
  label: string;
  tagline?: string;
  clickPromptTemplate: string;
}

export interface ComparisonTableCell {
  value: string;
  note?: string;
  isWinner: boolean;
  clickPromptTemplate: string;
}

export interface ComparisonTableAttribute {
  id: string;
  label: string;
  format: CellFormat;
  clickPromptTemplate: string;
  cells: Record<string, ComparisonTableCell>;
}

export interface ComparisonTableWidget {
  widget: "comparison-table";
  version: "1.0";
  title: string;
  subtitle?: string;
  options: ComparisonTableOption[];
  attributes: ComparisonTableAttribute[];
  summary: string;
  followUps: [string, string, string];
}
