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

export interface VettingEvidence {
  tool: string;
  verdict: string;
  score: number;
  serverVersion: string;
  toolCount: number;
  date: string;
}
export interface McpServerEntry {
  name: string;
  repo: string;
  npm: string | null;
  status: "audited" | "unvetted";
  evidence: VettingEvidence | null;
}
export interface DiscoveryEntry {
  name: string;
  category: string;
  source: string;
  staging_status: string;
  staging_verdict: string | null;
  launch: string;
  status: "unvetted";
}
export interface McpServerLedger {
  version: number;
  updated: string;
  description: string;
  default_profile: string[];
  servers: McpServerEntry[];
  discovery?: DiscoveryEntry[];
}

export function loadMcpServers(): McpServerLedger {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, "..", "catalog", "mcp-servers.json"),
    join(here, "../..", "catalog", "mcp-servers.json"),
    join(process.cwd(), "catalog", "mcp-servers.json"),
  ];
  for (const p of candidates) {
    try { return JSON.parse(readFileSync(p, "utf8")) as McpServerLedger; } catch {}
  }
  throw new Error("catalog/mcp-servers.json not found");
}

// Vetting rule (Rene, 2026-10-25): only servers with a real mcpaudit PASS on
// file may be marked audited or appear in default_profile. Everything else
// stays unvetted, with no verdict claimed, and out of the default profile.
export function validateMcpServers(ledger: McpServerLedger): string[] {
  const problems: string[] = [];
  const byName = new Map(ledger.servers.map((s) => [s.name, s]));
  for (const s of ledger.servers) {
    if (!s.name || !s.repo) problems.push(`server missing fields: ${s.name || "?"}`);
    if (!s.repo.startsWith("https://github.com/CloudCorpRecords/")) problems.push(`repo not in org: ${s.name}`);
    if (s.status === "audited") {
      if (!s.evidence) problems.push(`audited server without evidence: ${s.name}`);
      else if (s.evidence.verdict !== "PASS") problems.push(`audited server without a PASS verdict: ${s.name} (${s.evidence.verdict})`);
    } else if (s.status === "unvetted") {
      if (s.evidence) problems.push(`unvetted server claims evidence: ${s.name}`);
    } else {
      problems.push(`unknown vetting status for ${s.name}: ${s.status}`);
    }
  }
  for (const name of ledger.default_profile) {
    const s = byName.get(name);
    if (!s) problems.push(`default_profile names unknown server: ${name}`);
    else if (s.status !== "audited") problems.push(`default_profile includes unvetted server: ${name}`);
  }
  return problems;
}

// Discovery entries come from the staging 107-server catalog. They are
// discovery-only: every one stays unvetted, whatever the staging draft
// called it, until a fresh structured mcpaudit PASS (tool, verdict, score,
// server version, date) is recorded for it in servers[]. In particular a
// staging "audited" label is NOT a promotion: most of those verdicts say
// UNREACHABLE, ENV-SKIP, WARN, or ground-truth notes, and the two that
// claim PASS (fetch, time) are unstructured second-hand text, not a fresh
// local audit. A staging label must never leak into audited status or
// default_profile through this path.
export function validateDiscovery(ledger: McpServerLedger): string[] {
  const problems: string[] = [];
  const serverNames = new Set(ledger.servers.map((s) => s.name));
  const seen = new Set<string>();
  for (const d of ledger.discovery ?? []) {
    if (!d.name) problems.push("discovery entry missing name");
    if (seen.has(d.name)) problems.push(`duplicate discovery entry: ${d.name}`);
    seen.add(d.name);
    if (serverNames.has(d.name)) problems.push(`discovery entry overlaps vetted ledger: ${d.name}`);
    if (d.status !== "unvetted") problems.push(`discovery entry claims non-unvetted status: ${d.name} (${d.status})`);
    if (!["listed", "audited"].includes(d.staging_status)) problems.push(`unknown staging_status for ${d.name}: ${d.staging_status}`);
    if (ledger.default_profile.includes(d.name)) problems.push(`default_profile includes discovery entry: ${d.name}`);
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
