#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { loadCatalog, byPhase, mcpConfigFor, validateCatalog } from "./catalog.js";
import { doctor, productionChecklist } from "./doctor.js";

const VERSION = "0.4.0";
const args = process.argv.slice(2);
const cmd = args[0] || "help";

function help(): void {
  console.log(`prodforge ${VERSION}
Take any product to production without wiring it all yourself.

Usage:
  prodforge list [--phase build|secure|test|release|operate]
  prodforge connect [--write mcp.json]   One merged MCP config for every tool
  prodforge doctor                       Local production-readiness checks
  prodforge checklist                    Full production checklist by phase
  prodforge ship [--dry-run] [--json]    Run the release gate: executes each installed
                                         fleet tool, reports ABSENT when missing, never
                                         fakes a PASS. Exit 0 only on GO.
  prodforge stacks                       List production stacks (templates)
  prodforge init <stack> <name> [--dir dir]
                                         Generate a real stack scaffold (files + tests)
  prodforge mcp                          Run the ProdForge MCP server (stdio)
  prodforge --version
`);
}

async function main(): Promise<void> {
  if (cmd === "--version" || cmd === "version") { console.log(VERSION); return; }
  if (cmd === "mcp") { const { runMcp } = await import("./mcp.js"); await runMcp(); return; }
  if (cmd === "help" || cmd === "--help" || cmd === "-h") { help(); return; }

  const catalog = loadCatalog();

  if (cmd === "list") {
    const idx = args.indexOf("--phase");
    const phase = idx >= 0 ? args[idx + 1] : undefined;
    const tools = phase ? byPhase(catalog, phase as never) : catalog.tools;
    for (const t of tools) console.log(`${t.name.padEnd(14)} [${t.phase}] ${t.npm || "GHCR only"} - ${t.purpose}`);
    console.log(`\n${tools.length} tools. Catalog problems: ${validateCatalog(catalog).length}`);
    return;
  }
  if (cmd === "connect") {
    const config = mcpConfigFor(catalog.tools);
    const idx = args.indexOf("--write");
    if (idx >= 0 && args[idx + 1]) { writeFileSync(args[idx + 1], JSON.stringify(config, null, 2) + "\n"); console.log(`Wrote merged MCP config with ${Object.keys((config as {mcpServers: object}).mcpServers).length} servers to ${args[idx + 1]}`); }
    else console.log(JSON.stringify(config, null, 2));
    return;
  }
  if (cmd === "doctor") {
    const checks = doctor();
    for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name} - ${c.detail}${c.ok ? "" : ` | fix: ${c.fix}`}`);
    const fails = checks.filter((c) => !c.ok).length;
    console.log(`\n${checks.length - fails}/${checks.length} checks pass.`);
    return;
  }
  if (cmd === "checklist") {
    for (const group of productionChecklist()) { console.log(`\n## ${group.phase}`); for (const item of group.items) console.log(`- [ ] ${item}`); }
    return;
  }
  if (cmd === "stacks") {
    console.log(["mcp-server  - Ship an MCP server: CLI + MCP in one bin, npm + GHCR + Registry","saas-web    - Web SaaS: auth, billing hooks, env, security and release gates pre-wired","api-service - API service: validation, logging, health, CI, deploy checklist","cli-tool    - CLI tool: the fleet factory pattern, tests and publish pipeline included","ai-agent    - AI agent product: MCP client + server, trace watching, injection checks"].join("\n"));
    console.log("\nGenerate one with: prodforge init <stack> <name>\nFull templates in stacks/ in this repo.");
    return;
  }
  if (cmd === "init") {
    const { initStack, isStack, STACKS } = await import("./scaffolds.js");
    const stack = args[1];
    const name = args[2];
    if (!stack || !isStack(stack) || !name) {
      console.error(`Usage: prodforge init <stack> <name> [--dir dir]\nStacks: ${STACKS.join(", ")}`);
      process.exitCode = 1;
      return;
    }
    const dirIdx = args.indexOf("--dir");
    const dir = dirIdx >= 0 && args[dirIdx + 1] ? args[dirIdx + 1] : `./${name}`;
    try {
      const written = initStack(stack, dir, name);
      console.log(`Created ${stack} scaffold "${name}" in ${dir}:`);
      for (const f of written) console.log(`  ${f}`);
      console.log("\nNext: cd into it, npm install, npm test.");
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    }
    return;
  }
  if (cmd === "ship") {
    const { SHIP_GATES, resolveGate, runShip } = await import("./ship.js");
    const asJson = args.includes("--json");
    if (args.includes("--dry-run")) {
      const gates = SHIP_GATES.map((g) => resolveGate(g, process.cwd()));
      if (asJson) { console.log(JSON.stringify({ dryRun: true, gates }, null, 2)); return; }
      console.log("ProdForge ship gate (dry run - nothing executed):");
      for (const g of gates) console.log(`[${g.phase}] ${g.item} -> ${g.args ? `${g.bin} ${g.args.join(" ")}` : `(not wired: ${g.note ?? "no invocation"})`}`);
      return;
    }
    const report = runShip();
    if (asJson) { console.log(JSON.stringify(report, null, 2)); }
    else {
      console.log("ProdForge ship gate:");
      for (const g of report.gates) console.log(`${g.status.padEnd(9)} [${g.phase}] ${g.item}${g.command ? ` (${g.command})` : ""} - ${g.detail}`);
      console.log(`\nPASS ${report.counts.PASS} / FAIL ${report.counts.FAIL} / ABSENT ${report.counts.ABSENT} / NOT-WIRED ${report.counts["NOT-WIRED"]}`);
      console.log(`Verdict: ${report.verdict}${report.verdict === "GO" ? "" : " (any FAIL is a NO-GO; ABSENT tools are missing, not passed)"}`);
    }
    process.exitCode = report.verdict === "GO" ? 0 : 1;
    return;
  }
  console.error(`Unknown command: ${cmd}`);
  help();
  process.exitCode = 1;
}

main().catch((err) => { console.error(err instanceof Error ? err.message : String(err)); process.exit(1); });
