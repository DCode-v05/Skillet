import { readFileSync } from "node:fs";
import { getJsonSkill, JSON_INTENTS } from "@/lib/engine/skills/json-registry";

const [intent, path] = process.argv.slice(2);
if (!intent || !path) {
  console.error("Usage: tsx eval/validate-skill-json.ts <intent> <path-to-json>");
  process.exit(2);
}

const skill = getJsonSkill(intent);
if (!skill) {
  console.error(
    `Unknown JSON intent '${intent}'. Available: ${JSON_INTENTS.join(", ")}`,
  );
  process.exit(2);
}

let raw: string;
try {
  raw = readFileSync(path, "utf8");
} catch (err) {
  console.error(`Error: file not found or unreadable: ${path}`);
  process.exit(1);
}

let parsed: unknown;
try {
  parsed = JSON.parse(raw);
} catch (err) {
  console.error(`FAIL: not valid JSON — ${(err as Error).message}`);
  process.exit(1);
}

const r = skill.validate(parsed);
if (r.valid) {
  console.log(r.summary);
  process.exit(0);
}
console.error(`FAIL: ${r.issues.length} validation error(s):`);
for (const i of r.issues) console.error(`  - ${i}`);
process.exit(1);
