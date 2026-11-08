"use client";

import type {
  DiagramFlowEdge,
  DiagramFlowNode,
  DiagramFlowWidget,
  DiagramMindWidget,
  DiagramSequenceWidget,
  DiagramTreeNode,
  DiagramTreeWidget,
  DiagramVennRegion,
  DiagramVennWidget,
  DiagramWidget,
} from "@/lib/types/widgets/diagram";

const BAP_RED = "#EC3B4A";
const VENN_BLUE = "#7dd3fc";
const VENN_AMBER = "#fbbf24";
const NODE_FILL = "#1b1f2a";
const NODE_TEXT = "#e6e6e6";
const MUTED_STROKE = "#555";
const ARROW_FILL = "#888";
const LIFELINE = "#333";
const RESPONSE_STROKE = "#888";

export function DiagramWidget({ widget }: { widget: DiagramWidget }) {
  switch (widget.variant) {
    case "flow":
      return <FlowDiagram widget={widget} />;
    case "sequence":
      return <SequenceDiagram widget={widget} />;
    case "tree":
      return <TreeDiagram widget={widget} />;
    case "mind":
      return <MindDiagram widget={widget} />;
    case "venn":
      return <VennDiagram widget={widget} />;
  }
}

function Shell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {title ? (
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--secondary)] mb-3">
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  );
}

const FLOW_BOX_W = 120;
const FLOW_BOX_H = 44;
const FLOW_GAP_X = 40;
const FLOW_GAP_Y = 30;
const FLOW_LEFT_MARGIN = 30;
const FLOW_TOP_MARGIN = 30;

interface FlowBox {
  node: DiagramFlowNode;
  x: number;
  y: number;
  cx: number;
  cy: number;
}

function FlowDiagram({ widget }: { widget: DiagramFlowWidget }) {
  const boxes: Record<string, FlowBox> = {};
  let maxRow = 0;
  let maxCol = 0;
  for (const n of widget.nodes) {
    const x = n.col * (FLOW_BOX_W + FLOW_GAP_X) + FLOW_LEFT_MARGIN;
    const y = n.row * (FLOW_BOX_H + FLOW_GAP_Y) + FLOW_TOP_MARGIN;
    boxes[n.id] = {
      node: n,
      x,
      y,
      cx: x + FLOW_BOX_W / 2,
      cy: y + FLOW_BOX_H / 2,
    };
    if (n.row > maxRow) maxRow = n.row;
    if (n.col > maxCol) maxCol = n.col;
  }

  const width = (maxCol + 1) * (FLOW_BOX_W + FLOW_GAP_X) + 60;
  const height = (maxRow + 1) * (FLOW_BOX_H + FLOW_GAP_Y) + 60;

  return (
    <Shell title={widget.title}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto" }}
        role="img"
      >
        <defs>
          <marker
            id="diag-arr"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill={ARROW_FILL} />
          </marker>
        </defs>

        {widget.edges.map((e, i) => (
          <FlowEdgeRender key={`e-${i}`} edge={e} boxes={boxes} />
        ))}

        {widget.nodes.map((n) => {
          const b = boxes[n.id];
          if (!b) return null;
          const stroke = n.accent ? BAP_RED : MUTED_STROKE;
          return (
            <g
              key={n.id}
              data-bap-prompt={n.clickPrompt}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={b.x}
                y={b.y}
                width={FLOW_BOX_W}
                height={FLOW_BOX_H}
                rx={6}
                fill={NODE_FILL}
                stroke={stroke}
                strokeWidth={n.accent ? 2 : 1}
              />
              <text
                x={b.cx}
                y={b.cy + 4}
                fill={NODE_TEXT}
                fontSize={12}
                textAnchor="middle"
              >
                {truncate(n.label, 18)}
              </text>
            </g>
          );
        })}
      </svg>
    </Shell>
  );
}

function FlowEdgeRender({
  edge,
  boxes,
}: {
  edge: DiagramFlowEdge;
  boxes: Record<string, FlowBox>;
}) {
  const a = boxes[edge.from];
  const b = boxes[edge.to];
  if (!a || !b) return null;

  const sameRow = a.node.row === b.node.row;
  const sameCol = a.node.col === b.node.col;

  let pts: [number, number][];

  if (sameRow) {
    if (b.node.col > a.node.col) {
      pts = [
        [a.x + FLOW_BOX_W, a.cy],
        [b.x, b.cy],
      ];
    } else {
      pts = [
        [a.x, a.cy],
        [b.x + FLOW_BOX_W, b.cy],
      ];
    }
  } else if (sameCol) {
    if (b.node.row > a.node.row) {
      pts = [
        [a.cx, a.y + FLOW_BOX_H],
        [b.cx, b.y],
      ];
    } else {
      pts = [
        [a.cx, a.y],
        [b.cx, b.y + FLOW_BOX_H],
      ];
    }
  } else {
    const exitY =
      b.node.row > a.node.row ? a.y + FLOW_BOX_H : a.y;
    const enterX =
      b.node.col > a.node.col ? b.x : b.x + FLOW_BOX_W;
    pts = [
      [a.cx, exitY],
      [a.cx, b.cy],
      [enterX, b.cy],
    ];
  }

  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]},${p[1]}`)
    .join(" ");

  const labelPos = polylineMidpoint(pts);

  return (
    <g pointerEvents="none">
      <path
        d={d}
        fill="none"
        stroke={ARROW_FILL}
        strokeWidth={1.5}
        markerEnd="url(#diag-arr)"
      />
      {edge.label ? (
        <g>
          <rect
            x={labelPos.x - edge.label.length * 3.2 - 4}
            y={labelPos.y - 8}
            width={edge.label.length * 6.4 + 8}
            height={14}
            rx={3}
            fill="var(--surface)"
            opacity={0.92}
          />
          <text
            x={labelPos.x}
            y={labelPos.y + 3}
            fill={NODE_TEXT}
            fontSize={10}
            textAnchor="middle"
          >
            {edge.label}
          </text>
        </g>
      ) : null}
    </g>
  );
}

function polylineMidpoint(pts: [number, number][]): { x: number; y: number } {
  let total = 0;
  const segs: number[] = [];
  for (let i = 1; i < pts.length; i += 1) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    const len = Math.hypot(dx, dy);
    segs.push(len);
    total += len;
  }
  let target = total / 2;
  for (let i = 1; i < pts.length; i += 1) {
    const len = segs[i - 1];
    if (target <= len) {
      const t = len === 0 ? 0 : target / len;
      return {
        x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
        y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t,
      };
    }
    target -= len;
  }
  const last = pts[pts.length - 1];
  return { x: last[0], y: last[1] };
}

const SEQ_WIDTH = 600;
const SEQ_HEADER_Y = 20;
const SEQ_LIFELINE_TOP = 30;
const SEQ_FIRST_MSG_Y = 60;
const SEQ_MSG_GAP = 40;

function SequenceDiagram({ widget }: { widget: DiagramSequenceWidget }) {
  const n = widget.actors.length;
  const messageCount = widget.messages.length;
  const height = SEQ_FIRST_MSG_Y + messageCount * SEQ_MSG_GAP + 30;
  const lifelineBottom = height - 20;

  const actorXs: number[] = [];
  const slot = SEQ_WIDTH / n;
  for (let i = 0; i < n; i += 1) {
    actorXs.push(Math.round(slot / 2 + i * slot));
  }

  return (
    <Shell title={widget.title}>
      <svg
        viewBox={`0 0 ${SEQ_WIDTH} ${height}`}
        style={{ width: "100%", height: "auto" }}
        role="img"
      >
        <defs>
          <marker
            id="diag-arr-request"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill={BAP_RED} />
          </marker>
          <marker
            id="diag-arr-response"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill={RESPONSE_STROKE} />
          </marker>
        </defs>

        {widget.actors.map((actor, i) => (
          <g key={`actor-${i}`}>
            <text
              x={actorXs[i]}
              y={SEQ_HEADER_Y}
              fill={NODE_TEXT}
              fontSize={12}
              fontWeight={700}
              textAnchor="middle"
            >
              {truncate(actor, 22)}
            </text>
            <line
              x1={actorXs[i]}
              y1={SEQ_LIFELINE_TOP}
              x2={actorXs[i]}
              y2={lifelineBottom}
              stroke={LIFELINE}
              strokeWidth={1}
            />
          </g>
        ))}

        {widget.messages.map((m, i) => {
          const y = SEQ_FIRST_MSG_Y + i * SEQ_MSG_GAP;
          const fromX = actorXs[m.fromIdx];
          const toX = actorXs[m.toIdx];
          if (fromX === undefined || toX === undefined) return null;

          const dir = toX > fromX ? 1 : -1;
          const x1 = fromX + dir * 2;
          const x2 = toX - dir * 2;
          const stroke = m.kind === "request" ? BAP_RED : RESPONSE_STROKE;
          const dash = m.kind === "response" ? "4 3" : undefined;
          const marker =
            m.kind === "request"
              ? "url(#diag-arr-request)"
              : "url(#diag-arr-response)";

          const midX = (fromX + toX) / 2;

          return (
            <g
              key={m.id}
              data-bap-prompt={m.clickPrompt}
              style={{ cursor: "pointer" }}
            >
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={stroke}
                strokeWidth={2}
                strokeDasharray={dash}
                markerEnd={marker}
              />
              <text
                x={midX}
                y={y - 6}
                fill={stroke}
                fontSize={11}
                textAnchor="middle"
              >
                {truncate(m.label, 32)}
              </text>
            </g>
          );
        })}
      </svg>
    </Shell>
  );
}

const TREE_BOX_W = 110;
const TREE_BOX_H = 36;
const TREE_HORIZ_GAP = 30;
const TREE_VERT_GAP = 50;
const TREE_LEFT_MARGIN = 20;
const TREE_TOP_MARGIN = 20;

interface TreeLayoutNode {
  node: DiagramTreeNode;
  depth: number;
  x: number;
  children: TreeLayoutNode[];
}

function layoutTree(node: DiagramTreeNode, depth: number): TreeLayoutNode {
  const children = (node.children ?? []).map((c) => layoutTree(c, depth + 1));
  return { node, depth, x: 0, children };
}

function assignTreeX(root: TreeLayoutNode, counter: { i: number }): void {
  if (root.children.length === 0) {
    root.x = counter.i;
    counter.i += 1;
    return;
  }
  for (const c of root.children) assignTreeX(c, counter);
  const first = root.children[0].x;
  const last = root.children[root.children.length - 1].x;
  root.x = (first + last) / 2;
}

function maxTreeDepth(n: TreeLayoutNode): number {
  if (n.children.length === 0) return n.depth;
  return Math.max(...n.children.map(maxTreeDepth));
}

function maxTreeX(n: TreeLayoutNode): number {
  let m = n.x;
  for (const c of n.children) m = Math.max(m, maxTreeX(c));
  return m;
}

function collectTreeNodes(n: TreeLayoutNode, out: TreeLayoutNode[]): void {
  out.push(n);
  for (const c of n.children) collectTreeNodes(c, out);
}

function TreeDiagram({ widget }: { widget: DiagramTreeWidget }) {
  const root = layoutTree(widget.root, 0);
  assignTreeX(root, { i: 0 });

  const maxDepth = maxTreeDepth(root);
  const maxX = maxTreeX(root);

  const width =
    (maxX + 1) * (TREE_BOX_W + TREE_HORIZ_GAP) + TREE_LEFT_MARGIN * 2;
  const height =
    (maxDepth + 1) * (TREE_BOX_H + TREE_VERT_GAP) + TREE_TOP_MARGIN * 2;

  const all: TreeLayoutNode[] = [];
  collectTreeNodes(root, all);

  function px(n: TreeLayoutNode): { x: number; y: number; cx: number; cy: number } {
    const x = n.x * (TREE_BOX_W + TREE_HORIZ_GAP) + TREE_LEFT_MARGIN;
    const y = n.depth * (TREE_BOX_H + TREE_VERT_GAP) + TREE_TOP_MARGIN;
    return { x, y, cx: x + TREE_BOX_W / 2, cy: y + TREE_BOX_H / 2 };
  }

  const edges: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    key: string;
  }> = [];
  for (const n of all) {
    const p = px(n);
    for (const c of n.children) {
      const cp = px(c);
      edges.push({
        x1: p.cx,
        y1: p.y + TREE_BOX_H,
        x2: cp.cx,
        y2: cp.y,
        key: `${n.node.id}-${c.node.id}`,
      });
    }
  }

  return (
    <Shell title={widget.title}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto" }}
        role="img"
      >
        {edges.map((e) => (
          <line
            key={e.key}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke={ARROW_FILL}
            strokeWidth={1.2}
          />
        ))}

        {all.map((n) => {
          const p = px(n);
          const isRoot = n.depth === 0;
          const accent = n.node.accent || isRoot;
          const fill = accent ? BAP_RED : "var(--surface)";
          const stroke = accent ? BAP_RED : "var(--border)";
          const textColor = accent ? "#ffffff" : "var(--foreground)";
          return (
            <g
              key={n.node.id}
              data-bap-prompt={n.node.clickPrompt}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={p.x}
                y={p.y}
                width={TREE_BOX_W}
                height={TREE_BOX_H}
                rx={8}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.5}
              />
              <text
                x={p.cx}
                y={p.cy + 4}
                fill={textColor}
                fontSize={12}
                fontWeight={accent ? 700 : 500}
                textAnchor="middle"
              >
                {truncate(n.node.label, 16)}
              </text>
            </g>
          );
        })}
      </svg>
    </Shell>
  );
}

const MIND_W = 500;
const MIND_H = 360;
const MIND_CX = MIND_W / 2;
const MIND_CY = MIND_H / 2;
const MIND_CENTER_R = 44;
const MIND_BRANCH_R = 26;
const MIND_RADIUS = 140;

function MindDiagram({ widget }: { widget: DiagramMindWidget }) {
  const n = widget.branches.length;

  function angle(i: number): number {
    return -Math.PI / 2 + (i * 2 * Math.PI) / n;
  }

  return (
    <Shell title={widget.title}>
      <svg
        viewBox={`0 0 ${MIND_W} ${MIND_H}`}
        style={{ width: "100%", height: "auto" }}
        role="img"
      >
        {widget.branches.map((b, i) => {
          const a = angle(i);
          const ex = MIND_CX + Math.cos(a) * MIND_RADIUS;
          const ey = MIND_CY + Math.sin(a) * MIND_RADIUS;
          const sx = MIND_CX + Math.cos(a) * MIND_CENTER_R;
          const sy = MIND_CY + Math.sin(a) * MIND_CENTER_R;
          const tx = MIND_CX + Math.cos(a) * (MIND_RADIUS - MIND_BRANCH_R);
          const ty = MIND_CY + Math.sin(a) * (MIND_RADIUS - MIND_BRANCH_R);
          void ex;
          void ey;
          return (
            <line
              key={`conn-${b.id}`}
              x1={sx}
              y1={sy}
              x2={tx}
              y2={ty}
              stroke={MUTED_STROKE}
              strokeWidth={1.2}
            />
          );
        })}

        <g>
          <circle cx={MIND_CX} cy={MIND_CY} r={MIND_CENTER_R} fill={BAP_RED} />
          <text
            x={MIND_CX}
            y={MIND_CY + 4}
            fill="#ffffff"
            fontSize={13}
            fontWeight={700}
            textAnchor="middle"
          >
            {truncate(widget.central, 12)}
          </text>
        </g>

        {widget.branches.map((b, i) => {
          const a = angle(i);
          const bx = MIND_CX + Math.cos(a) * MIND_RADIUS;
          const by = MIND_CY + Math.sin(a) * MIND_RADIUS;
          return (
            <g
              key={b.id}
              data-bap-prompt={b.clickPrompt}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={bx}
                cy={by}
                r={MIND_BRANCH_R}
                fill={NODE_FILL}
                stroke={BAP_RED}
                strokeWidth={1.5}
              />
              <text
                x={bx}
                y={by + 4}
                fill={NODE_TEXT}
                fontSize={11}
                textAnchor="middle"
              >
                {truncate(b.label, 10)}
              </text>
            </g>
          );
        })}
      </svg>
    </Shell>
  );
}

interface VennCircle {
  cx: number;
  cy: number;
  r: number;
  fill: string;
}

interface VennCentroid {
  x: number;
  y: number;
}

const VENN_2_W = 400;
const VENN_2_H = 260;
const VENN_3_W = 400;
const VENN_3_H = 340;

const VENN_2_CIRCLES: VennCircle[] = [
  { cx: 150, cy: 130, r: 80, fill: BAP_RED },
  { cx: 250, cy: 130, r: 80, fill: VENN_BLUE },
];

const VENN_3_CIRCLES: VennCircle[] = [
  { cx: 150, cy: 130, r: 80, fill: BAP_RED },
  { cx: 250, cy: 130, r: 80, fill: VENN_BLUE },
  { cx: 200, cy: 220, r: 80, fill: VENN_AMBER },
];

function vennCentroid(
  setIdsSorted: string[],
  setIdInOrder: string[],
  setCount: number,
): VennCentroid | null {
  const slotByActual = new Map<string, string>();
  const slotNames = ["a", "b", "c"];
  for (let i = 0; i < setIdInOrder.length; i += 1) {
    slotByActual.set(setIdInOrder[i], slotNames[i]);
  }
  const slots = setIdsSorted
    .map((s) => slotByActual.get(s))
    .filter((s): s is string => Boolean(s))
    .sort()
    .join("|");

  if (setCount === 2) {
    const map: Record<string, VennCentroid> = {
      a: { x: 110, y: 135 },
      b: { x: 290, y: 135 },
      "a|b": { x: 200, y: 135 },
    };
    return map[slots] ?? null;
  }
  if (setCount === 3) {
    const map: Record<string, VennCentroid> = {
      a: { x: 105, y: 110 },
      b: { x: 295, y: 110 },
      c: { x: 200, y: 270 },
      "a|b": { x: 200, y: 105 },
      "a|c": { x: 145, y: 215 },
      "b|c": { x: 255, y: 215 },
      "a|b|c": { x: 200, y: 175 },
    };
    return map[slots] ?? null;
  }
  return null;
}

function VennDiagram({ widget }: { widget: DiagramVennWidget }) {
  const setCount = widget.sets.length;
  const circles = setCount === 2 ? VENN_2_CIRCLES : VENN_3_CIRCLES;
  const W = setCount === 2 ? VENN_2_W : VENN_3_W;
  const H = setCount === 2 ? VENN_2_H : VENN_3_H;

  const setIdInOrder = widget.sets.map((s) => s.id);

  return (
    <Shell title={widget.title}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto" }}
        role="img"
      >
        {circles.map((c, i) => (
          <circle
            key={`c-${i}`}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill={c.fill}
            fillOpacity={0.42}
            stroke={c.fill}
            strokeOpacity={0.7}
            strokeWidth={1.2}
          />
        ))}

        {widget.sets.map((s, i) => {
          const c = circles[i];
          if (!c) return null;
          const labelY = setCount === 3 && i === 2 ? c.cy + c.r + 18 : c.cy - c.r - 8;
          return (
            <text
              key={`s-${s.id}`}
              x={c.cx}
              y={labelY}
              fill="var(--foreground)"
              fontSize={12}
              fontWeight={700}
              textAnchor="middle"
            >
              {s.label}
            </text>
          );
        })}

        {widget.regions.map((r) => (
          <VennRegionLabel
            key={r.id}
            region={r}
            setIdInOrder={setIdInOrder}
            setCount={setCount}
          />
        ))}
      </svg>
    </Shell>
  );
}

function VennRegionLabel({
  region,
  setIdInOrder,
  setCount,
}: {
  region: DiagramVennRegion;
  setIdInOrder: string[];
  setCount: number;
}) {
  const sorted = [...region.setIds].sort();
  const c = vennCentroid(sorted, setIdInOrder, setCount);
  if (!c) return null;
  return (
    <text
      data-bap-prompt={region.clickPrompt}
      x={c.x}
      y={c.y}
      fill="#0f1116"
      fontSize={12}
      fontWeight={600}
      textAnchor="middle"
      style={{ cursor: "pointer" }}
    >
      {truncate(region.label, 14)}
    </text>
  );
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}
