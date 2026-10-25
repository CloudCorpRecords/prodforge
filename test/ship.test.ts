import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  SHIP_GATES, gatesCoverChecklist, findOnPath, resolveShipcheckSlug,
  runGate, runShip,
} from "../src/ship.js";
import { productionChecklist } from "../src/doctor.js";

function fakeBinDir(entries: Record<string, number>): string {
  const dir = mkdtempSync(join(tmpdir(), "prodforge-ship-"));
  for (const [name, code] of Object.entries(entries)) {
    const p = join(dir, name);
    writeFileSync(p, `#!/bin/sh\necho "fake ${name} ran"\nexit ${code}\n`);
    chmodSync(p, 0o755);
  }
  return dir;
}

const WIRED_BINS = ["agentsfile", "envdoc", "mcpvet", "actionpin", "flowcheck", "depguard"];

test("every checklist item has exactly one gate, and vice versa", () => {
  assert.deepEqual(gatesCoverChecklist(), []);
  assert.equal(SHIP_GATES.length, productionChecklist().flatMap((g) => g.items).length);
});

test("findOnPath finds an executable bin and misses an absent one", () => {
  const dir = fakeBinDir({ agentsfile: 0 });
  assert.ok(findOnPath("agentsfile", dir));
  assert.equal(findOnPath("nosuchbin", dir), null);
});

test("runGate reports ABSENT for a missing binary, never PASS", () => {
  const dir = fakeBinDir({});
  const gate = SHIP_GATES.find((g) => g.bin === "agentsfile")!;
  const res = runGate(gate, dir, dir);
  assert.equal(res.status, "ABSENT");
});

test("runGate reports NOT-WIRED when no invocation is known", () => {
  const gate = SHIP_GATES.find((g) => g.bin === "contextbudget")!;
  const res = runGate(gate, tmpdir(), tmpdir());
  assert.equal(res.status, "NOT-WIRED");
});

test("runGate executes a present tool and reports its own exit code", () => {
  const dir = fakeBinDir({ agentsfile: 0, envdoc: 1 });
  const ok = runGate(SHIP_GATES.find((g) => g.bin === "agentsfile")!, dir, dir);
  const bad = runGate(SHIP_GATES.find((g) => g.bin === "envdoc")!, dir, dir);
  assert.equal(ok.status, "PASS");
  assert.equal(bad.status, "FAIL");
});

test("resolveShipcheckSlug is null without a git remote", () => {
  const dir = mkdtempSync(join(tmpdir(), "prodforge-nogit-"));
  assert.equal(resolveShipcheckSlug(dir), null);
});

test("all wired tools present and passing still cannot fake a GO", () => {
  const entries: Record<string, number> = {};
  for (const b of WIRED_BINS) entries[b] = 0;
  const dir = fakeBinDir(entries);
  const report = runShip(dir, dir);
  assert.ok(report.counts.PASS >= WIRED_BINS.length);
  assert.equal(report.counts.FAIL, 0);
  // NOT-WIRED gates remain, so the verdict is PARTIAL, never GO.
  assert.equal(report.verdict, "PARTIAL");
});

test("one failing tool makes the verdict NO-GO", () => {
  const entries: Record<string, number> = {};
  for (const b of WIRED_BINS) entries[b] = 0;
  entries["envdoc"] = 1;
  const dir = fakeBinDir(entries);
  const report = runShip(dir, dir);
  assert.equal(report.verdict, "NO-GO");
  assert.ok(report.gates.find((g) => g.bin === "envdoc")!.status === "FAIL");
});

test("no tools installed gives NOT-READY, not a pass", () => {
  const dir = fakeBinDir({});
  const report = runShip(dir, dir);
  assert.ok(report.counts.ABSENT > 0);
  assert.equal(report.counts.FAIL, 0);
  assert.equal(report.verdict, "NOT-READY");
});
