import { spawnSync } from "node:child_process";
import { accessSync, constants } from "node:fs";
import { join } from "node:path";
import { productionChecklist } from "./doctor.js";

/**
 * Wave B: the ship gate actually executes locally installed fleet tools.
 *
 * Honesty rules, enforced by the status set itself:
 * - PASS means the tool ran and exited 0 (the tool's own verdict).
 * - FAIL means the tool ran and exited non-zero, or did not complete.
 * - ABSENT means the binary is not on PATH. Absent is never reported as PASS.
 * - NOT-WIRED means ProdForge does not yet know a safe, read-only
 *   invocation for that gate (it needs a target, e.g. mcpaudit needs a
 *   stdio server command, wallcheck needs URLs). Not executed, not passed.
 *
 * Verdict: NO-GO if any FAIL; else NOT-READY if any ABSENT; else PARTIAL
 * if any NOT-WIRED; else GO. A GO requires every gate to have passed.
 * Nothing here invents a tool result.
 */

export type GateStatus = "PASS" | "FAIL" | "ABSENT" | "NOT-WIRED";

export interface ShipGate {
  phase: string;
  item: string;
  bin: string;
  /** Null when no safe invocation is wired yet; see note. */
  args: string[] | null;
  note?: string;
}

export interface GateResult {
  phase: string;
  item: string;
  bin: string;
  command: string | null;
  status: GateStatus;
  detail: string;
}

export interface ShipReport {
  cwd: string;
  gates: GateResult[];
  counts: Record<GateStatus, number>;
  verdict: "GO" | "NO-GO" | "NOT-READY" | "PARTIAL";
}

/**
 * One gate per production-checklist item. args are the fleet tool's own
 * documented, read-only, cwd-targeted invocation, verified against each
 * tool's README/CLI usage (agentsfile check ., envdoc check .,
 * depguard check ., actionpin audit ., flowcheck audit ., mcpvet vet .).
 * Gates whose invocation is not documented this way stay null: guessing
 * a command would risk reporting a wrong run as a real check.
 */
export const SHIP_GATES: ShipGate[] = [
  { phase: "build", item: "AGENTS.md is true (agentsfile)", bin: "agentsfile", args: ["check", "."] },
  { phase: "build", item: "env documented (envdoc)", bin: "envdoc", args: ["check", "."] },
  { phase: "build", item: "context budget checked (contextbudget)", bin: "contextbudget", args: null, note: "invocation not yet wired" },
  { phase: "build", item: "local env passes (envdoctor)", bin: "envdoctor", args: null, note: "invocation not yet wired" },
  { phase: "secure", item: "MCP servers vetted (mcpvet, mcpaudit)", bin: "mcpvet", args: ["vet", "."], note: "mcpaudit leg needs a stdio server launch command; wire per-project" },
  { phase: "secure", item: "Actions pinned (actionpin)", bin: "actionpin", args: ["audit", "."] },
  { phase: "secure", item: "Workflows checked (flowcheck)", bin: "flowcheck", args: ["audit", "."] },
  { phase: "secure", item: "Hooks safe (hookcheck)", bin: "hookcheck", args: null, note: "invocation not yet wired" },
  { phase: "secure", item: "Injection surface checked (injectcheck)", bin: "injectcheck", args: null, note: "invocation not yet wired" },
  { phase: "secure", item: "Deps guarded (depguard)", bin: "depguard", args: ["check", "."] },
  { phase: "secure", item: "Public pages probed for exposure (wallcheck)", bin: "wallcheck", args: null, note: "needs target URLs; never run blind" },
  { phase: "test", item: "Repro is red-first (reprocheck)", bin: "reprocheck", args: null, note: "invocation not yet wired" },
  { phase: "test", item: "CI failures are yours, not base (cidiff)", bin: "cidiff", args: null, note: "invocation not yet wired" },
  { phase: "test", item: "CI log failure root-caused (logdigest)", bin: "logdigest", args: null, note: "invocation not yet wired" },
  { phase: "release", item: "npm pack clean (npmpreflight)", bin: "npmpreflight", args: null, note: "invocation not yet wired" },
  { phase: "release", item: "Tag, release, npm, registry, GHCR agree (shipcheck)", bin: "shipcheck", args: ["__SLUG__"] },
  { phase: "release", item: "Rollback plan written before tagging", bin: "", args: null, note: "manual check, not executable" },
  { phase: "operate", item: "PRs triaged (prwatch)", bin: "prwatch", args: null, note: "invocation not yet wired" },
  { phase: "operate", item: "Traces watched (tracewatch)", bin: "tracewatch", args: null, note: "invocation not yet wired" },
  { phase: "operate", item: "Inbox watched for replies that change the plan (inboxwatch)", bin: "inboxwatch", args: null, note: "invocation not yet wired" },
];

/** Every production-checklist item must have exactly one gate. */
export function gatesCoverChecklist(): string[] {
  const checklist = productionChecklist().flatMap((g) => g.items);
  const problems: string[] = [];
  for (const item of checklist) {
    if (SHIP_GATES.filter((g) => g.item === item).length !== 1) problems.push(`no unique gate for: ${item}`);
  }
  for (const g of SHIP_GATES) {
    if (!checklist.includes(g.item)) problems.push(`gate without checklist item: ${g.item}`);
  }
  return problems;
}

export function findOnPath(bin: string, pathValue = process.env.PATH ?? ""): string | null {
  if (!bin) return null;
  for (const dir of pathValue.split(":")) {
    if (!dir) continue;
    const candidate = join(dir, bin);
    try { accessSync(candidate, constants.X_OK); return candidate; } catch {}
  }
  return null;
}

/** Derive owner/repo from the git remote, or null when there is none. */
export function resolveShipcheckSlug(cwd: string): string | null {
  const res = spawnSync("git", ["config", "--get", "remote.origin.url"], { cwd, encoding: "utf8", timeout: 10000 });
  const url = (res.stdout ?? "").trim();
  if (!url) return null;
  const m = url.match(/github\.com[/:]([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/);
  return m ? `${m[1]}/${m[2]}` : null;
}

/** Fill in dynamic gates (shipcheck slug) for a run; others pass through. */
export function resolveGate(gate: ShipGate, cwd: string): ShipGate {
  if (gate.bin !== "shipcheck") return gate;
  const slug = resolveShipcheckSlug(cwd);
  return slug
    ? { ...gate, args: ["check", slug] }
    : { ...gate, args: null, note: "no git remote to derive owner/repo from" };
}

function lastLine(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.length ? lines[lines.length - 1].slice(0, 300) : "";
}

export function runGate(gate: ShipGate, cwd: string, pathValue = process.env.PATH ?? ""): GateResult {
  const base = { phase: gate.phase, item: gate.item, bin: gate.bin };
  if (!gate.args || gate.args.includes("__SLUG__")) {
    return { ...base, command: null, status: "NOT-WIRED", detail: gate.note ?? "invocation not yet wired" };
  }
  const command = `${gate.bin} ${gate.args.join(" ")}`;
  if (!findOnPath(gate.bin, pathValue)) {
    return { ...base, command, status: "ABSENT", detail: "not installed (not on PATH)" };
  }
  const res = spawnSync(gate.bin, gate.args, {
    cwd,
    timeout: 60000,
    encoding: "utf8",
    env: { ...process.env, PATH: pathValue },
  });
  if (res.error) {
    return { ...base, command, status: "FAIL", detail: `did not complete: ${String(res.error.message).slice(0, 200)}` };
  }
  if (res.status === 0) {
    return { ...base, command, status: "PASS", detail: lastLine(res.stdout ?? "") || "exit 0" };
  }
  const detail = lastLine(`${res.stdout ?? ""}\n${res.stderr ?? ""}`) || `exit ${res.status}`;
  return { ...base, command, status: "FAIL", detail };
}

export function runShip(cwd = process.cwd(), pathValue = process.env.PATH ?? ""): ShipReport {
  const gates = SHIP_GATES.map((g) => runGate(resolveGate(g, cwd), cwd, pathValue));
  const counts: Record<GateStatus, number> = { PASS: 0, FAIL: 0, ABSENT: 0, "NOT-WIRED": 0 };
  for (const g of gates) counts[g.status]++;
  const verdict = counts.FAIL > 0 ? "NO-GO"
    : counts.ABSENT > 0 ? "NOT-READY"
    : counts["NOT-WIRED"] > 0 ? "PARTIAL"
    : "GO";
  return { cwd, gates, counts, verdict };
}
