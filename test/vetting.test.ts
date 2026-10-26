import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCatalog, loadMcpServers, validateMcpServers, validateDiscovery } from "../src/catalog.js";

test("mcp vetting ledger validates clean", () => {
  const ledger = loadMcpServers();
  assert.deepEqual(validateMcpServers(ledger), []);
  assert.ok(ledger.servers.length >= 27, `expected 27+ servers, got ${ledger.servers.length}`);
});

test("default profile is vetted-only", () => {
  const ledger = loadMcpServers();
  const byName = new Map(ledger.servers.map((s) => [s.name, s]));
  assert.ok(ledger.default_profile.length >= 1);
  for (const name of ledger.default_profile) {
    const s = byName.get(name);
    assert.ok(s, `default profile names unknown server: ${name}`);
    assert.equal(s!.status, "audited", `${name} in default profile without audit`);
    assert.equal(s!.evidence!.verdict, "PASS");
  }
});

test("every npm MCP registry tool appears in the vetting ledger", () => {
  const catalog = loadCatalog();
  const ledger = loadMcpServers();
  const names = new Set(ledger.servers.map((s) => s.name));
  for (const t of catalog.tools.filter((x) => x.mcp && x.npm)) {
    assert.ok(names.has(t.name), `registry MCP tool missing from vetting ledger: ${t.name}`);
  }
});

test("staging discovery reconciles clean: 82 entries, all unvetted, none promoted", () => {
  const ledger = loadMcpServers();
  assert.deepEqual(validateDiscovery(ledger), []);
  const discovery = ledger.discovery ?? [];
  assert.equal(discovery.length, 82, `expected 82 discovery entries, got ${discovery.length}`);
  const serverNames = new Set(ledger.servers.map((s) => s.name));
  for (const d of discovery) {
    assert.equal(d.status, "unvetted", `${d.name} promoted out of discovery`);
    assert.ok(!serverNames.has(d.name), `discovery overlaps vetted ledger: ${d.name}`);
    assert.ok(!ledger.default_profile.includes(d.name), `discovery in default profile: ${d.name}`);
  }
  assert.equal(discovery.filter((d) => d.staging_status === "listed").length, 60);
  assert.equal(discovery.filter((d) => d.staging_status === "audited").length, 22);
});

test("staging PASS-claim text does not promote fetch or time", () => {
  const ledger = loadMcpServers();
  const byName = new Map((ledger.discovery ?? []).map((d) => [d.name, d]));
  for (const name of ["fetch", "time"]) {
    const d = byName.get(name);
    assert.ok(d, `${name} missing from discovery`);
    assert.ok(d!.staging_verdict!.startsWith("PASS"), `${name} staging verdict lost: ${d!.staging_verdict}`);
    assert.equal(d!.status, "unvetted", `${name} promoted on second-hand PASS text`);
    assert.ok(!ledger.default_profile.includes(name), `${name} in default profile`);
    assert.ok(!ledger.servers.some((s) => s.name === name), `${name} in vetted ledger without a fresh audit`);
  }
});

test("unvetted servers claim no verdict", () => {
  const ledger = loadMcpServers();
  for (const s of ledger.servers.filter((x) => x.status === "unvetted")) {
    assert.equal(s.evidence, null, `${s.name} claims evidence while unvetted`);
  }
  const audited = ledger.servers.filter((x) => x.status === "audited");
  assert.ok(audited.length >= 3, `expected 3+ audited servers, got ${audited.length}`);
});
