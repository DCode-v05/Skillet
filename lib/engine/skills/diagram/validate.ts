import type { DiagramWidget } from "@/lib/types/widgets/diagram";
import {
  asObject,
  buildResult,
  checkPlaceholders,
  requireKeys,
  uniqueIds,
  type ValidationResult,
} from "../_shared/validate-helpers";

const KINDS = new Set(["request", "response"]);

export function validateDiagram(input: unknown): ValidationResult {
  const issues: string[] = [];
  const data = asObject(input, issues);
  if (!data) return buildResult(issues, "");

  checkPlaceholders(data, issues);
  requireKeys(data, ["widget", "version", "variant"], issues);
  if (issues.length > 0) return buildResult(issues, "");

  if (data.widget !== "diagram") {
    issues.push(`widget must be 'diagram', got '${String(data.widget)}'`);
  }

  switch (data.variant) {
    case "flow":
      return validateFlow(data, issues);
    case "sequence":
      return validateSequence(data, issues);
    case "tree":
      return validateTree(data, issues);
    case "mind":
      return validateMind(data, issues);
    case "venn":
      return validateVenn(data, issues);
  }

  issues.push(
    `variant must be 'flow' | 'sequence' | 'tree' | 'mind' | 'venn', got '${String(data.variant)}'`,
  );
  return buildResult(issues, "");
}

function validateFlow(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    issues.push(`nodes and edges must both be arrays`);
    return buildResult(issues, "");
  }
  const nodes = data.nodes as Array<Record<string, unknown>>;
  const edges = data.edges as Array<Record<string, unknown>>;

  if (nodes.length < 2 || nodes.length > 8) {
    issues.push(`nodes must have 2-8 entries, got ${nodes.length}`);
  }
  if (edges.length < 1 || edges.length > 10) {
    issues.push(`edges must have 1-10 entries, got ${edges.length}`);
  }
  uniqueIds(nodes, "node", issues);

  let accentCount = 0;
  for (const n of nodes) {
    for (const k of ["id", "label", "clickPrompt"]) {
      if (typeof n[k] !== "string" || (n[k] as string).length === 0) {
        issues.push(`node '${String(n.id ?? "?")}' missing non-empty '${k}'`);
      }
    }
    if (!Number.isInteger(n.row) || (n.row as number) < 0) {
      issues.push(`node '${String(n.id ?? "?")}' row must be an integer ≥ 0`);
    }
    if (!Number.isInteger(n.col) || (n.col as number) < 0) {
      issues.push(`node '${String(n.id ?? "?")}' col must be an integer ≥ 0`);
    }
    if (n.accent !== undefined) {
      if (typeof n.accent !== "boolean") {
        issues.push(`node '${String(n.id ?? "?")}' accent must be a boolean`);
      } else if (n.accent) {
        accentCount += 1;
      }
    }
  }
  if (accentCount > 1) {
    issues.push(`at most 1 node may have accent=true, got ${accentCount}`);
  }

  const nodeIds = new Set(nodes.map((n) => String(n.id ?? "")));
  for (let i = 0; i < edges.length; i += 1) {
    const e = edges[i];
    for (const k of ["from", "to"]) {
      if (typeof e[k] !== "string" || (e[k] as string).length === 0) {
        issues.push(`edge[${i}] missing non-empty '${k}'`);
      }
    }
    if (typeof e.from === "string" && !nodeIds.has(e.from)) {
      issues.push(`edge[${i}] from='${e.from}' does not match any node id`);
    }
    if (typeof e.to === "string" && !nodeIds.has(e.to)) {
      issues.push(`edge[${i}] to='${e.to}' does not match any node id`);
    }
    if (e.label !== undefined && typeof e.label !== "string") {
      issues.push(`edge[${i}] label must be a string when present`);
    }
  }

  return buildResult(
    issues,
    `OK: diagram/flow valid (${nodes.length} nodes, ${edges.length} edges)`,
  );
}

function validateSequence(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  if (typeof data.title !== "string" || (data.title as string).length === 0) {
    issues.push(`title must be a non-empty string`);
  }
  if (!Array.isArray(data.actors) || !Array.isArray(data.messages)) {
    issues.push(`actors and messages must both be arrays`);
    return buildResult(issues, "");
  }
  const actors = data.actors as unknown[];
  const messages = data.messages as Array<Record<string, unknown>>;

  if (actors.length < 2 || actors.length > 5) {
    issues.push(`actors must have 2-5 entries, got ${actors.length}`);
  }
  for (let i = 0; i < actors.length; i += 1) {
    if (typeof actors[i] !== "string" || (actors[i] as string).length === 0) {
      issues.push(`actors[${i}] must be a non-empty string`);
    }
  }

  if (messages.length < 3 || messages.length > 10) {
    issues.push(`messages must have 3-10 entries, got ${messages.length}`);
  }
  uniqueIds(messages, "message", issues);

  for (let i = 0; i < messages.length; i += 1) {
    const m = messages[i];
    for (const k of ["id", "label", "clickPrompt"]) {
      if (typeof m[k] !== "string" || (m[k] as string).length === 0) {
        issues.push(`message '${String(m.id ?? i)}' missing non-empty '${k}'`);
      }
    }
    if (!KINDS.has(String(m.kind))) {
      issues.push(
        `message '${String(m.id ?? i)}' kind must be 'request' or 'response', got '${String(m.kind)}'`,
      );
    }
    const fromIdx = m.fromIdx;
    const toIdx = m.toIdx;
    if (
      !Number.isInteger(fromIdx) ||
      (fromIdx as number) < 0 ||
      (fromIdx as number) >= actors.length
    ) {
      issues.push(
        `message '${String(m.id ?? i)}' fromIdx must be in [0..${actors.length - 1}], got ${String(fromIdx)}`,
      );
    }
    if (
      !Number.isInteger(toIdx) ||
      (toIdx as number) < 0 ||
      (toIdx as number) >= actors.length
    ) {
      issues.push(
        `message '${String(m.id ?? i)}' toIdx must be in [0..${actors.length - 1}], got ${String(toIdx)}`,
      );
    }
    if (
      Number.isInteger(fromIdx) &&
      Number.isInteger(toIdx) &&
      fromIdx === toIdx
    ) {
      issues.push(`message '${String(m.id ?? i)}' fromIdx and toIdx must differ`);
    }
  }

  return buildResult(
    issues,
    `OK: diagram/sequence valid (${actors.length} actors, ${messages.length} messages)`,
  );
}

function validateTree(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  if (!data.root || typeof data.root !== "object" || Array.isArray(data.root)) {
    issues.push(`root must be a TreeNode object`);
    return buildResult(issues, "");
  }
  const allIds: string[] = [];
  walkTree(data.root as Record<string, unknown>, 0, issues, allIds);

  if (allIds.length > 12) {
    issues.push(`tree must have ≤ 12 nodes total, got ${allIds.length}`);
  }
  if (new Set(allIds).size !== allIds.length) {
    issues.push(`tree node ids must be globally unique, got: ${JSON.stringify(allIds)}`);
  }
  return buildResult(
    issues,
    `OK: diagram/tree valid (${allIds.length} nodes)`,
  );
}

function walkTree(
  node: Record<string, unknown>,
  depth: number,
  issues: string[],
  allIds: string[],
): void {
  if (depth > 2) {
    issues.push(`tree depth must be ≤ 3 levels (root = level 0); found a node at depth ${depth}`);
  }
  for (const k of ["id", "label", "clickPrompt"]) {
    if (typeof node[k] !== "string" || (node[k] as string).length === 0) {
      issues.push(`tree node '${String(node.id ?? "?")}' missing non-empty '${k}'`);
    }
  }
  if (node.accent !== undefined && typeof node.accent !== "boolean") {
    issues.push(`tree node '${String(node.id ?? "?")}' accent must be a boolean`);
  }
  if (typeof node.id === "string") allIds.push(node.id);

  if (node.children !== undefined) {
    if (!Array.isArray(node.children)) {
      issues.push(`tree node '${String(node.id ?? "?")}' children must be an array`);
      return;
    }
    for (const child of node.children) {
      if (child && typeof child === "object" && !Array.isArray(child)) {
        walkTree(child as Record<string, unknown>, depth + 1, issues, allIds);
      } else {
        issues.push(`tree node '${String(node.id ?? "?")}' has a non-object child`);
      }
    }
  }
}

function validateMind(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  if (typeof data.central !== "string" || (data.central as string).length === 0) {
    issues.push(`central must be a non-empty string`);
  }
  if (!Array.isArray(data.branches)) {
    issues.push(`branches must be an array`);
    return buildResult(issues, "");
  }
  const branches = data.branches as Array<Record<string, unknown>>;
  if (branches.length < 3 || branches.length > 6) {
    issues.push(`branches must have 3-6 entries, got ${branches.length}`);
  }
  uniqueIds(branches, "branch", issues);

  for (const b of branches) {
    for (const k of ["id", "label", "clickPrompt"]) {
      if (typeof b[k] !== "string" || (b[k] as string).length === 0) {
        issues.push(`branch '${String(b.id ?? "?")}' missing non-empty '${k}'`);
      }
    }
  }
  return buildResult(
    issues,
    `OK: diagram/mind valid (${branches.length} branches)`,
  );
}

function validateVenn(
  data: Record<string, unknown>,
  issues: string[],
): ValidationResult {
  if (!Array.isArray(data.sets) || !Array.isArray(data.regions)) {
    issues.push(`sets and regions must both be arrays`);
    return buildResult(issues, "");
  }
  const sets = data.sets as Array<Record<string, unknown>>;
  const regions = data.regions as Array<Record<string, unknown>>;

  if (sets.length !== 2 && sets.length !== 3) {
    issues.push(`sets must have exactly 2 or 3 entries, got ${sets.length}`);
  }
  uniqueIds(sets, "set", issues);
  for (const s of sets) {
    for (const k of ["id", "label"]) {
      if (typeof s[k] !== "string" || (s[k] as string).length === 0) {
        issues.push(`set '${String(s.id ?? "?")}' missing non-empty '${k}'`);
      }
    }
  }

  const expectedRegions = sets.length === 2 ? 3 : sets.length === 3 ? 7 : -1;
  if (expectedRegions > 0 && regions.length !== expectedRegions) {
    issues.push(
      `for ${sets.length} sets, regions must have exactly ${expectedRegions} entries, got ${regions.length}`,
    );
  }
  uniqueIds(regions, "region", issues);

  const setIdSet = new Set(sets.map((s) => String(s.id ?? "")));
  for (const r of regions) {
    for (const k of ["id", "label", "clickPrompt"]) {
      if (typeof r[k] !== "string" || (r[k] as string).length === 0) {
        issues.push(`region '${String(r.id ?? "?")}' missing non-empty '${k}'`);
      }
    }
    if (!Array.isArray(r.setIds)) {
      issues.push(`region '${String(r.id ?? "?")}' setIds must be an array`);
      continue;
    }
    const ids = r.setIds as unknown[];
    if (ids.length === 0) {
      issues.push(`region '${String(r.id ?? "?")}' setIds must be non-empty`);
    }
    if (ids.length > sets.length) {
      issues.push(
        `region '${String(r.id ?? "?")}' setIds (${ids.length}) cannot exceed sets count (${sets.length})`,
      );
    }
    const seen = new Set<string>();
    for (const id of ids) {
      if (typeof id !== "string") {
        issues.push(`region '${String(r.id ?? "?")}' setIds must contain strings`);
        continue;
      }
      if (!setIdSet.has(id)) {
        issues.push(
          `region '${String(r.id ?? "?")}' setIds contains '${id}' which is not a defined set id`,
        );
      }
      if (seen.has(id)) {
        issues.push(`region '${String(r.id ?? "?")}' setIds contains duplicate '${id}'`);
      }
      seen.add(id);
    }
  }

  return buildResult(
    issues,
    `OK: diagram/venn valid (${sets.length} sets, ${regions.length} regions)`,
  );
}

export function isDiagramWidget(input: unknown): input is DiagramWidget {
  return validateDiagram(input).valid;
}
