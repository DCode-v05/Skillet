import type { JsonWidget } from "@/lib/types/engine-widgets";

function triggerDownload(content: string, ext: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.href = url;
  a.download = `bap-widget-${ts}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadWidget(widget: JsonWidget): void {
  const content = JSON.stringify(widget, null, 2);
  triggerDownload(content, "json", "application/json");
}

export async function copyWidget(widget: JsonWidget): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(widget, null, 2));
}
