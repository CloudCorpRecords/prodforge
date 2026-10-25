import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

export interface Check { name: string; ok: boolean; detail: string; fix: string; }

function run(cmd: string): string {
  try { return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }).toString().trim(); }
  catch { return ""; }
}

export function doctor(cwd = process.cwd()): Check[] {
  const checks: Check[] = [];
  const node = run("node --version");
  const major = node ? parseInt(node.replace("v", ""), 10) : 0;
  checks.push({ name: "node >= 20", ok: major >= 20, detail: node || "not found", fix: "Install Node 20+ from nodejs.org" });
  checks.push({ name: "npm present", ok: !!run("npm --version"), detail: run("npm --version") || "not found", fix: "npm ships with Node" });
  checks.push({ name: "git present", ok: !!run("git --version"), detail: run("git --version") || "not found", fix: "Install git" });
  checks.push({ name: "docker present (optional)", ok: !!run("docker --version"), detail: run("docker --version") || "not found, GHCR path unavailable locally", fix: "Install Docker Desktop if you need container builds" });
  checks.push({ name: "package.json present", ok: existsSync(`${cwd}/package.json`), detail: existsSync(`${cwd}/package.json`) ? "found" : "not in a Node project root", fix: "Run prodforge from your project root or run: prodforge init" });
  checks.push({ name: ".env.example present", ok: existsSync(`${cwd}/.env.example`) || existsSync(`${cwd}/.env.sample`), detail: "checked .env.example / .env.sample", fix: "Run: npx @reneturcios/envdoc to generate it from real env usage" });
  checks.push({ name: "README present", ok: existsSync(`${cwd}/README.md`), detail: existsSync(`${cwd}/README.md`) ? "found" : "missing", fix: "Add a README with install, run, and MCP config" });
  checks.push({ name: "git repo", ok: !!run("git rev-parse --is-inside-work-tree"), detail: "checked git work tree", fix: "git init" });
  return checks;
}

export function productionChecklist(): { phase: string; items: string[] }[] {
  return [
    { phase: "build", items: ["AGENTS.md is true (agentsfile)", "env documented (envdoc)", "context budget checked (contextbudget)", "local env passes (envdoctor)"] },
    { phase: "secure", items: ["MCP servers vetted (mcpvet, mcpaudit)", "Actions pinned (actionpin)", "Workflows checked (flowcheck)", "Hooks safe (hookcheck)", "Injection surface checked (injectcheck)", "Deps guarded (depguard)", "Public pages probed for exposure (wallcheck)"] },
    { phase: "test", items: ["Repro is red-first (reprocheck)", "CI failures are yours, not base (cidiff)", "CI log failure root-caused (logdigest)"] },
    { phase: "release", items: ["npm pack clean (npmpreflight)", "Tag, release, npm, registry, GHCR agree (shipcheck)", "Rollback plan written before tagging"] },
    { phase: "operate", items: ["PRs triaged (prwatch)", "Traces watched (tracewatch)", "Inbox watched for replies that change the plan (inboxwatch)"] },
  ];
}
