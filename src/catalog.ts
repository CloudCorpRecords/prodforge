import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export type Phase = "build" | "secure" | "test" | "release" | "operate";
export interface ToolEntry {
  name: string;
  npm: string | null;
  repo: string;
  purpose: string;
  phase: Phase;
  mcp: boolean;
  status: string;
}
export interface Catalog { version: number; updated: string; description: string; tools: ToolEntry[]; }

export function loadCatalog(): Catalog {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, "..", "catalog", "registry.json"),
    join(here, "../..", "catalog", "registry.json"),
    join(process.cwd(), "catalog", "registry.json"),
  ];
  for (const p of candidates) {
    try { return JSON.parse(readFileSync(p, "utf8")) as Catalog; } catch {}
  }
  throw new Error("catalog/registry.json not found");
}

export function byPhase(catalog: Catalog, phase: Phase): ToolEntry[] {
  return catalog.tools.filter((t) => t.phase === phase);
}

export function validateCatalog(catalog: Catalog): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const t of catalog.tools) {
    if (!t.name || !t.repo || !t.purpose) problems.push(`tool missing fields: ${t.name || "?"}`);
    if (seen.has(t.name)) problems.push(`duplicate tool: ${t.name}`);
    seen.add(t.name);
    if (!["build","secure","test","release","operate"].includes(t.phase)) problems.push(`bad phase ${t.phase} for ${t.name}`);
    if (!t.repo.startsWith("https://github.com/CloudCorpRecords/")) problems.push(`repo not in org: ${t.name}`);
  }
  return problems;
}

export function mcpConfigFor(tools: ToolEntry[]): Record<string, unknown> {
  const servers: Record<string, unknown> = {};
  for (const t of tools.filter((x) => x.mcp && x.npm)) {
    servers[t.name] = { command: "npx", args: ["-y", t.npm as string, "mcp"] };
  }
  return { mcpServers: servers };
}
