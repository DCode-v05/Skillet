# Skillet

A chat app where the model answers with a typed UI widget (chart, comparison table, plan, diagram and so on) instead of a block of markdown.

I built it during my internship at September AI as one of the agentic-UI prototypes for their Business Asset Platform. Its sibling, Superwidgets, takes the same idea but has the model write HTML directly.

## Why

Chat answers are usually prose even when the content is a table or a plan. You end up rebuilding the structure in your head, and nothing in the answer is clickable.

Here the model picks one of 12 widget types and fills in a JSON schema for it. It never writes markup. The app validates the JSON and renders it with hand-written React components, so the model only supplies data. Every widget carries click targets with a prompt baked into the JSON, and clicking one sends that prompt as your next message.

## How it works

1. The browser POSTs `{ message, history, providerId, useSkill }` to `app/api/engine/execute/route.ts`, which answers with a `text/event-stream`.
2. The route runs `runEngine` (`lib/engine/run-engine.ts`), an agentic tool-use loop capped at 8 iterations (`MAX_ITERATIONS`).
3. The model has one terminal tool, `submit_widget_json(intent, widget, prose?)`. The executor looks up the intent in `lib/engine/skills/json-registry.ts` and runs that skill's `validate.ts`.
4. If the JSON is valid it becomes the final render and the loop ends. If not, the validator's issues go back to the model as the tool result and it tries again.
5. `lib/hooks/useChat.ts` reads the SSE stream (text deltas, tool calls, tool results, widget, usage). `OutputSystem` hands the widget to a React renderer through `components/output/widgets/registry.tsx`.

Each widget is a folder under `lib/engine/skills/<intent>/` with `SKILL.md` (when and how to use it), `template.md` (the JSON skeleton), `validate.ts`, `examples/sample.md` and `scripts/validate.sh`. Adding a widget means a registry entry, a schema, a validator and a renderer.

| Intent | Renders |
|---|---|
| `comparison-table` | Options by attributes matrix with winner badges |
| `chart` | Bar, pie, scatter, funnel, radar, heatmap |
| `plan` | Numbered steps, dated timeline, Gantt-style schedule |
| `diagram` | Flowchart, sequence, tree, mind map, Venn |
| `dashboard` | KPI tiles, profile card, kanban board, pricing tiers |
| `decision` | Trade-off cards, or a confirm gate for destructive actions |
| `interactive` | Calculators, quizzes, forms |
| `list` | Checklists, multi-column tables |
| `map` | Stylised region with clickable pins |
| `code-block` | Syntax-highlighted code with copy and explain |
| `notice` | Severity banners, source cards |
| `chips` | Follow-up prompt pills |

### Providers and cost

`lib/engine/providers/` has one adapter per vendor behind a shared `AgentTurnInvoker` shape. Seven models are registered: `sonnet` and `haiku` (Anthropic), `gemini-3` and `gemini-3.1` (Google), `gpt-5.4-mini`, `gpt-5.4` and `gpt-5.5` (OpenAI). The Anthropic adapter puts `cache_control: ephemeral` on the system prompt so it is cached across loop iterations.

`lib/engine/pricing.ts` holds per-million-token rates for each model and computes cost per turn, with cache reads priced separately and Anthropic cache writes at 1.25x the input rate. The UI shows tokens, cache-hit rate and dollar cost for every turn.

### Eval harness

`npm run eval` (`eval/run.ts`) runs every model with the frontend-design skill on and off, 2 trials per prompt, scores each render against structural checks (pass threshold 0.8) and ranks the combinations by dollars per successful render.

## Stack

TypeScript, Next.js 15 (App Router), React 19, Tailwind CSS 3, `@anthropic-ai/sdk`, `@google/generative-ai`, `openai`, `react-markdown`, `react-syntax-highlighter`, `tsx` for the eval runner.

## Setup

Node 18+ works for the app. The eval script calls `process.loadEnvFile`, which needs Node 20.12+.

```bash
git clone https://github.com/DCode-v05/Skillet.git
cd Skillet
npm install
cp .env.local.example .env.local
```

Set the keys for the models you want to use in `.env.local`:

| Variable | Models |
|---|---|
| `ANTHROPIC_API_KEY` | Sonnet, Haiku |
| `GOOGLE_API_KEY` | Gemini 3, 3.1 |
| `OPENAI_API_KEY` | GPT-5.4-mini, 5.4, 5.5 |

```bash
npm run dev
```

Then open http://localhost:3000. Pick a model, type a prompt or choose one from the prompt library, and click anything in the answer to continue. The conversation, or a single widget, can be exported as a standalone HTML file.

## Project structure

```
app/                    chat page and the SSE endpoint (api/engine/execute)
components/chat/        shell, input, message list, model selector, prompt library, cost readout
components/output/      OutputSystem, AgentTrace, widgets/ (one renderer per widget + registry)
lib/engine/             run-engine, providers/, tools/, skills/, pricing, system prompt
lib/hooks/useChat.ts    SSE consumer and chat state
lib/types/              widget and engine types
eval/                   cost-per-successful-render sweep
sample/                 reference skill scaffold
```

## Contact

Denistan B: [portfolio](https://www.denistan.me), [LinkedIn](https://www.linkedin.com/in/denistanb), denistanb05@gmail.com
