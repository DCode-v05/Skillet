"use client";

import { useState } from "react";
import type { CodeBlockWidget } from "@/lib/types/widgets/code-block";

interface Props {
  widget: CodeBlockWidget;
}

export function CodeBlockWidget({ widget }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(widget.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
    }
  };

  return (
    <div
      className="rounded-lg overflow-hidden font-mono"
      style={{ background: "#0d1117", color: "#e6edf3" }}
    >
      <div
        className="flex items-center justify-between px-3.5 py-2 text-[11px]"
        style={{ background: "#161b22", color: "#8b949e" }}
      >
        <span
          data-bap-prompt={widget.explainPrompt}
          className="cursor-pointer hover:text-[#e6edf3] transition-colors"
        >
          {widget.filename}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md px-2.5 py-0.5 text-[11px] font-mono transition-colors"
            style={{
              background: "#21262d",
              color: "#e6edf3",
              border: "1px solid #30363d",
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
            style={{
              background: "#21262d",
              color: "#8b949e",
              border: "1px solid #30363d",
            }}
          >
            {widget.language}
          </span>
        </div>
      </div>
      <pre
        className="m-0 px-3.5 py-3.5 text-[13px] leading-relaxed overflow-x-auto"
        style={{ background: "#0d1117", color: "#e6edf3" }}
      >
        <code style={{ whiteSpace: "pre", fontFamily: "inherit" }}>
          {widget.code}
        </code>
      </pre>
    </div>
  );
}
