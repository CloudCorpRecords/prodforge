import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCatalog, validateCatalog, byPhase, mcpConfigFor } from "../src/catalog.js";
import { productionChecklist, doctor } from "../src/doctor.js";

test("catalog loads and validates clean", () => {
  const catalog = loadCatalog();
  assert.ok(catalog.tools.length >= 20, `expected 20+ tools, got ${catalog.tools.length}`);
  assert.deepEqual(validateCatalog(catalog), []);
});

test("every phase has at least 2 tools", () => {
  const catalog = loadCatalog();
  for (const phase of ["build", "secure", "test", "release", "operate"] as const) {
    assert.ok(byPhase(catalog, phase).length >= 2, `${phase} too thin`);
  }
});

test("merged MCP config includes every npm MCP tool", () => {
  const catalog = loadCatalog();
  const config = mcpConfigFor(catalog.tools) as { mcpServers: Record<string, unknown> };
  const expected = catalog.tools.filter((t) => t.mcp && t.npm).length;
  assert.equal(Object.keys(config.mcpServers).length, expected);
  assert.ok(config.mcpServers["greenlight"]);
  assert.ok(config.mcpServers["shipcheck"]);
});

test("production checklist covers all 5 phases and names its tools", () => {
  const groups = productionChecklist();
  assert.equal(groups.length, 5);
  const flat = groups.flatMap((g) => g.items).join(" ");
  for (const tool of ["shipcheck", "mcpvet", "cidiff", "envdoc"]) assert.ok(flat.includes(tool), `checklist missing ${tool}`);
});

test("doctor returns structured checks", () => {
  const checks = doctor();
  assert.ok(checks.length >= 6);
  for (const c of checks) { assert.equal(typeof c.ok, "boolean"); assert.ok(c.name); assert.ok(c.fix); }
});
