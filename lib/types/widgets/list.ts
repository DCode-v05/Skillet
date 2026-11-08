export interface ListChecklistWidget {
  widget: "list";
  variant: "checklist";
  version: "1.0";
  title?: string;
  items: Array<{
    id: string;
    label: string;
    done: boolean;
    note?: string;
    clickPrompt: string;
  }>;
}

export interface ListTableColumn {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
}

export interface ListTableRow {
  id: string;
  cells: Record<string, string>;
  clickPrompt: string;
}

export interface ListTableWidget {
  widget: "list";
  variant: "table";
  version: "1.0";
  title?: string;
  columns: ListTableColumn[];
  rows: ListTableRow[];
}

export type ListWidget = ListChecklistWidget | ListTableWidget;
