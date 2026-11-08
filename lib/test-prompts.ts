export interface PromptGroup {
  kind: string;
  label: string;
  prompts: string[];
}

export const TEST_PROMPTS: PromptGroup[] = [
  {
    kind: "chips",
    label: "Conversational",
    prompts: [
      "Hello — what can you do?",
      "What should I ask you about?",
    ],
  },
  {
    kind: "decision",
    label: "Decision",
    prompts: [
      "Should I use REST or GraphQL for my new API?",
      "Help me choose between TypeScript and Python for a new microservice",
      "Send a cold email to 200 prospects from my list",
      "Delete all branches older than 6 months from the repo",
    ],
  },
  {
    kind: "plan",
    label: "Plan / timeline / schedule",
    prompts: [
      "Plan a product launch in 5 steps",
      "Walk me through onboarding a new backend engineer",
      "Show the history of OpenAI as a timeline",
      "Timeline of major web framework releases since 2010",
      "Plan a 12-week product launch as a Gantt chart",
      "Gantt of a database migration — schema, backfill, cutover, validation",
    ],
  },
  {
    kind: "list",
    label: "Checklist & table",
    prompts: [
      "Give me a code review checklist for a Next.js PR",
      "What should I check before going live with a new feature?",
      "Compare AWS Lambda, Vercel Functions, and Cloudflare Workers in a table",
      "Show me a feature matrix for popular React state libraries",
    ],
  },
  {
    kind: "chart",
    label: "Charts",
    prompts: [
      "Show me revenue trend over the last 6 months",
      "Visualize quarterly user growth as a bar chart",
      "Show a pie chart of typical SaaS startup expenses by category",
      "Pie chart of browser market share in 2026",
      "Scatter plot of revenue vs ad spend for the top 20 marketing campaigns",
      "Plot hours studied vs exam score for a class of 25",
      "Funnel chart: signups → activated → paying → renewed",
      "Show the e-commerce conversion funnel for last month",
      "Radar chart comparing Slack vs Teams vs Discord on 5 traits",
      "Compare myself to a senior engineer across 5 skill dimensions",
      "Heatmap of website traffic by day of week and hour of day",
      "Show GitHub-style commit activity heatmap for a contributor",
    ],
  },
  {
    kind: "diagram",
    label: "Diagrams",
    prompts: [
      "Draw a flowchart for handling a customer refund request",
      "Show the CI/CD pipeline flow for a typical PR merge",
      "Sequence diagram: browser, app server, and auth server during OAuth login",
      "Trace the API call flow for placing an e-commerce order",
      "Show an engineering org as a tree — CTO at the top, 3 directors, then teams",
      "Tree diagram of file types in a typical Next.js project",
      "Mind map of skills needed to become a senior backend engineer",
      "Map out the components of a modern observability stack",
      "Venn diagram: data engineer vs data scientist vs analytics engineer",
      "Show overlap between React, Vue, and Svelte feature sets",
    ],
  },
  {
    kind: "dashboard",
    label: "Dashboards",
    prompts: [
      "Build a SaaS KPI dashboard: MRR, churn, ARPU, NPS",
      "Show a marketing dashboard with traffic, signups, CAC, and LTV",
      "Profile card for a fictional staff engineer at a fintech",
      "Make a contact card for a freelance designer",
      "Show a kanban board for a 3-person team shipping a new feature",
      "Kanban for a Q3 product roadmap with backlog/in-progress/shipped columns",
      "Design a 3-tier pricing page for a SaaS analytics product",
      "Show Free / Pro / Enterprise pricing for a project management tool",
    ],
  },
  {
    kind: "notice",
    label: "Banner & sources",
    prompts: [
      "Confirm that my deploy went through successfully",
      "Warn me about the deprecation of an old API version",
      "Tell me about Y Combinator with sources",
      "Find me 3 reputable articles about prompt caching",
    ],
  },
  {
    kind: "code_block",
    label: "Code",
    prompts: [
      "Write a Python function that fetches a URL with retries",
      "Show me a SQL query to find duplicate email addresses",
    ],
  },
  {
    kind: "interactive",
    label: "Interactive (live)",
    prompts: [
      "Build me a tip calculator with bill, people, and tip slider",
      "Make a unit converter for kilometers and miles",
      "Make a 3-question quiz about HTTP status codes",
      "Quick quiz on basic React hooks — 4 questions, multiple choice",
      "Show me a user signup form with name, email, password, and role",
      "Build a 3-field contact form for a SaaS landing page",
    ],
  },
  {
    kind: "map",
    label: "Map",
    prompts: [
      "Show me a map of 6 fictional office locations across Europe",
      "Itinerary map: NYC → London → Paris → Berlin",
    ],
  },
  {
    kind: "comparison-table",
    label: "Comparison (JSON)",
    prompts: [
      "Compare PostgreSQL, MongoDB, and SQLite for a small hobby blog",
      "Which is better for a new microservice — TypeScript, Go, or Rust?",
    ],
  },
];
