export interface CodeBlockWidget {
  widget: "code-block";
  version: "1.0";
  filename: string;
  language: string;
  code: string;
  explainPrompt: string;
}
