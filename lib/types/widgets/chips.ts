export interface ChipsWidget {
  widget: "chips";
  version: "1.0";
  title?: string;
  chips: Array<{
    id: string;
    label: string;
    prompt: string;
  }>;
}
