# Skillet

**A chat where the AI answers with typed, clickable UI widgets (charts, tables, plans, diagrams) instead of a wall of markdown.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=flat&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React%2019-61DAFB?style=flat&logo=react&logoColor=black) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white) ![Anthropic](https://img.shields.io/badge/Anthropic-191919?style=flat&logo=anthropic&logoColor=white) ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white) ![Google Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=white)

## Overview

Most AI chat gives you prose even when the right answer is a chart, a comparison table or a step-by-step plan. Text is hard to scan, you can't click it, and you end up rebuilding a structure the model already had.

Skillet changes that. The model gets a catalog of 12 typed widget "skills" and a strict JSON contract for each one. An agentic tool-use loop has it pick the right widget for the question, fill in the schema and submit it through a single terminal tool. The engine validates the JSON and streams it to the browser over Server-Sent Events, and a typed renderer registry turns it into a hand-written React component. Every widget has at least one click target with a prompt baked into the JSON, so clicking a chart bar, a decision card or a follow-up chip becomes your next message.

I built this during my AI engineering internship at September AI as one of the agentic-UI prototypes for the company's Business Asset Platform. It's a self-contained Next.js app that runs against Anthropic, Google or OpenAI models, shows token cost and prompt-cache hit rate for each turn, and includes an eval harness that runs every model over a prompt set and ranks them by dollars per successful render.

## Key Features

- **Typed widget output, not text.** The model answers by submitting a JSON object that matches one of 12 widget schemas. The renderer draws everything (axes, arrows, checkbox icons, color scales) and the model only supplies data.
- **Agentic tool-use loop** with a single terminal tool, `submit_widget_json(intent, widget, prose?)`, capped at 8 iterations. Invalid JSON goes back to the model with the validator's issues so it can fix it and retry.
- **12 widget skills:** comparison-table, chart, plan, diagram, dashboard, decision, interactive, list, map, code-block, notice and chips. Many have several variants (chart covers bar, pie, scatter, funnel, radar and heatmap).
- **Per-skill JSON validation.** Each skill has its own `validate.ts` that rejects unfilled `[bracketed placeholders]`, missing required fields, out-of-range array counts and wrong placeholder tokens before anything renders.
- **Seven models across three providers** behind one provider-agnostic interface: Anthropic Claude (Sonnet and Haiku), Google Gemini (two variants) and OpenAI GPT (three variants), all selectable from the UI.
- **SSE streaming** from end to end: text deltas, tool calls, tool results, the final widget and a usage summary all arrive as named events.
- **Live cost and cache tracking.** Each turn reports input, output and cache tokens, the cache-hit rate, and a dollar cost computed from a per-million-token pricing table.
- **Agent-trace view** showing each iteration of the tool loop: which tool was called, a summary of its input, and what the validator said.
- **Self-driving interactivity.** Click prompts are baked into the widget JSON and the host sends them as the next user turn. Destructive actions go through a `window.confirm()` gate, and source cards open in a new tab.
- **Eval harness** (`npm run eval`) that runs every model with the frontend-design skill on and off over a test-prompt set and prints a dollars-per-successful-render ranking.
- **Export** of a whole conversation to a standalone HTML page, or of a single widget.

## How It Works

### Request flow

1. The user types a prompt in the composer, picks a model, and can toggle the frontend-design skill on.
2. The browser POSTs `{ message, history, providerId, useSkill }` to `app/api/engine/execute/route.ts`, which responds with a `text/event-stream`.
3. The route calls `runEngine(...)` and forwards each event it yields to the client as an SSE frame (`event: <type>` + `data: <json>`).
4. `lib/hooks/useChat.ts` reads the stream into a `ChatMessage`. `OutputSystem` walks the message blocks and sends the widget through the renderer registry to the matching React component.

### The engine loop

The core is in `lib/engine/run-engine.ts`. It builds the system prompt (the freeform widget prompt, optionally prefixed with a vendored frontend-design skill), assembles the message history and runs up to `MAX_ITERATIONS = 8` turns against the selected provider:

- Each turn streams text deltas and tool calls. Text goes straight through as `text_delta` events so the UI can show the model working.
- When the model calls `submit_widget_json`, the executor looks up the skill in the JSON registry and runs that skill's validator.
- If the JSON is **valid**, the widget becomes the final render and the loop ends. If it's **invalid**, the validator's issues go back as a tool result and the model tries again.
- Token usage is added up across every iteration (including prompt-cache reads and writes), and a final `usage` event carries the totals, the cache-hit rate and the computed cost.

The tool itself (`lib/engine/tools/schemas.ts`) is marked `terminal: true` and takes `{ intent, widget, prose? }`. The intent enum is generated from the skill registry, so there is one source of truth for which widgets exist.

### Widget skills

Each widget is a skill folder under `lib/engine/skills/<intent>/`:

- `SKILL.md`: when and how to use the widget, with variant guidance.
- `template.md`: the JSON skeleton the model fills in.
- `validate.ts`: the schema check that gates rendering.
- `examples/sample.md`: worked examples.
- `scripts/validate.sh`: a CLI check that reads from the same registry.

`lib/engine/skills/json-registry.ts` is the single source of truth. Adding a widget takes one registry line plus a schema, a validator and a renderer-registry entry. The `code-block` intent lives in the `code_block/` folder. The 12 widgets map to renderers like this:

| Intent | Renderer | What it shows |
|---|---|---|
| `comparison-table` | `ComparisonTableWidget` | Options × attributes matrix with per-attribute winner badges and per-cell tooltips |
| `chart` | `ChartWidget` | Bar, pie, scatter (with trend line), funnel, radar, heatmap |
| `plan` | `PlanWidget` | Numbered steps, dated timeline, or Gantt-style schedule |
| `diagram` | `DiagramWidget` | Flowchart, sequence, tree, mind-map, Venn |
| `dashboard` | `DashboardWidget` | KPI tiles, profile card, kanban board, pricing tiers |
| `decision` | `DecisionWidget` | Trade-off option cards or a destructive-action confirm gate |
| `interactive` | `InteractiveWidget` | Calculators, quizzes, forms |
| `list` | `ListWidget` | Checklists with SVG checkboxes, or multi-column tables |
| `map` | `MapWidget` | Stylized region SVG with clickable pins |
| `code-block` | `CodeBlockWidget` | Syntax-highlighted code with copy and explain |
| `notice` | `NoticeWidget` | Severity banners or citation/source cards |
| `chips` | `ChipsWidget` | Clickable follow-up prompt pills |

### Provider adapters

`lib/engine/providers/` keeps the engine independent of any one model. Each adapter (`anthropic.ts`, `google.ts`, `openai.ts`) implements the same `AgentTurnInvoker` shape: stream text and tool calls, then return a usage and stop-reason summary. The registry maps short IDs to models:

- **Anthropic:** `sonnet` (Claude Sonnet 4.6), `haiku` (Claude Haiku 4.5). Uses the prompt-caching streaming endpoint with `cache_control: ephemeral` on the system prompt, so it is cached across loop iterations.
- **Google:** `gemini-3`, `gemini-3.1`.
- **OpenAI:** `gpt-5.4-mini`, `gpt-5.4`, `gpt-5.5`.

### Cost model

`lib/engine/pricing.ts` holds a per-million-token rate table (standard input, cached input and output) for all seven models and works out the cost of each turn. It keeps standard input tokens separate from cache reads and charges Anthropic cache writes at 1.25x the input rate. The `CostCalculator` shows it live in the UI.

## Results / Highlights

- **12 widget skills** and **7 models** across **3 providers**, all behind one interface.
- **8-iteration** self-correcting tool loop, with per-skill JSON validation that gates rendering.
- **Eval harness** runs **2 trials** over every `model × skill-on/off` combination (14 combos), records cost, tokens, cache-hit rate, latency and widget size per trial, and ranks by **dollars per successful render** with a 0.8 pass threshold.
- Per-model pricing is in the code, from `0.025` $/MTok cached input (Gemini 3.1) up to `30.00` $/MTok output (GPT-5.5), so cost comparisons use real rates.
- **SSE streaming** from end to end, with named events for text, tool calls, tool results, the widget and usage.

## Tech Stack

- **Language:** TypeScript 5
- **Framework:** Next.js 15 (App Router), React 19, Node.js runtime
- **Styling:** Tailwind CSS 3, custom global CSS
- **AI / LLM SDKs:** `@anthropic-ai/sdk`, `@google/generative-ai`, `openai`
- **Streaming / transport:** Server-Sent Events
- **UI / rendering:** `react-markdown`, `remark-gfm`, `react-syntax-highlighter`, `lucide-react`, `class-variance-authority`, `tailwind-merge`
- **Tooling:** `tsx` (eval runner), TypeScript, PostCSS, Autoprefixer

## Getting Started

### Prerequisites

- Node.js 18+ (the eval harness needs Node 20.12+ for `process.loadEnvFile`)
- An API key for at least one of the three providers. You only need keys for the models you plan to run.

### Installation

```bash
git clone https://github.com/DCode-v05/Skillet.git
cd Skillet
npm install
```

### Configure environment

```bash
cp .env.local.example .env.local
```

Then add the key(s) you need:

| Variable | Used for |
|---|---|
| `ANTHROPIC_API_KEY` | Claude Sonnet / Haiku |
| `GOOGLE_API_KEY` | Gemini 3 / 3.1 |
| `OPENAI_API_KEY` | GPT-5.4-mini / 5.4 / 5.5 |

### Running

```bash
npm run dev
```

Open http://localhost:3000.

To run the cost-efficiency sweep across all models and prompts:

```bash
npm run eval
```

## Usage

- Type any prompt, or pick one from the prompt library, and choose a model from the selector.
- Skillet streams its tool-loop trace, then renders a typed widget answer with an optional one-sentence preamble.
- Click any interactive element (a chip, a decision button, a chart bar, a map pin) and its baked-in prompt becomes your next turn. Destructive decisions ask for confirmation first, and source cards open in a new tab.
- Watch the token and cost readout for each turn, including the cache-hit rate.
- Toggle the frontend-design skill to add extra design guidance to the system prompt.
- Export the whole conversation to a standalone HTML file whenever you want.

## Project Structure

```
Skillet/
├── app/
│   ├── api/engine/execute/route.ts     # SSE endpoint: runs the engine, streams events
│   ├── layout.tsx                      # Root layout + metadata
│   ├── page.tsx                        # Chat page
│   └── globals.css                     # Global styles
├── components/
│   ├── chat/                           # Shell, input, message list, mode selector,
│   │                                   #   prompt library, cost calculator
│   └── output/
│       ├── OutputSystem.tsx            # Walks message blocks, dispatches widgets
│       ├── AgentTrace.tsx              # Tool-loop iteration trace
│       └── widgets/                    # One React renderer per widget + registry.tsx
├── lib/
│   ├── engine/
│   │   ├── run-engine.ts               # Agentic tool-use loop (max 8 iterations)
│   │   ├── providers/                  # Anthropic · Google · OpenAI adapters + registry
│   │   ├── tools/                      # submit_widget_json definition + executor
│   │   ├── skills/                     # One folder per widget skill
│   │   │   ├── json-registry.ts        # Single source of truth for intents + validators
│   │   │   └── <skill>/                # SKILL.md, template.md, validate.ts, examples/
│   │   ├── system-prompt-freeform.ts   # Base system prompt (skill catalog + contract)
│   │   ├── frontend-design-skill.ts    # Optional vendored design skill
│   │   └── pricing.ts                  # Per-model cost computation
│   ├── hooks/useChat.ts                # SSE consumer + chat-state reducer
│   ├── types/                          # Widget + engine type definitions
│   ├── download-page.ts                # HTML conversation export
│   └── download-widget.ts              # Single-widget export
├── eval/                               # Cost-per-successful-render sweep harness
├── sample/                             # Reference skill scaffold
├── package.json
└── README.md
```

---

## Contact

<table>
  <tr><td><b>Portfolio:</b> <a href="https://www.denistan.me">Denistan</a></td><td><b>LinkedIn:</b> <a href="https://www.linkedin.com/in/denistanb">denistanb</a></td></tr>
  <tr><td><b>GitHub:</b> <a href="https://github.com/DCode-v05">DCode-v05</a></td><td><b>LeetCode:</b> <a href="https://leetcode.com/u/Denistan_B">Denistan_B</a></td></tr>
  <tr><td colspan="2" align="center"><b>Email:</b> <a href="mailto:denistanb05@gmail.com">denistanb05@gmail.com</a></td></tr>
</table>

Made with ❤️ by **Denistan B**
