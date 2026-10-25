import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TSX = join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");
const TSC = join(ROOT, "node_modules", "typescript", "bin", "tsc");

// Wave C: the worked examples under examples/ are real products, not sketches.
// Each one must ship its files, build clean, and pass its own test suite.
// The suites run through this repo's own tsx/typescript (ancestor node_modules),
// so no per-example install step is needed to verify them here.
const EXAMPLES = ["taskboard", "notes"] as const;
const EXPECTED_FILES = ["package.json", "tsconfig.json", "README.md", "src/index.ts", "test/index.test.ts"];

for (const name of EXAMPLES) {
  const dir = join(ROOT, "examples", name);

  test(`example ${name} ships the expected files`, () => {
    for (const f of EXPECTED_FILES) {
      assert.ok(existsSync(join(dir, f)), `missing examples/${name}/${f}`);
    }
  });

  test(`example ${name} builds clean (tsc --noEmit)`, async () => {
    // A non-zero tsc exit rejects the promise, failing the test.
    await run(process.execPath, [TSC, "-p", dir, "--noEmit"], { cwd: ROOT });
  });

  test(`example ${name} test suite passes`, async () => {
    // A non-zero tsx --test exit rejects the promise, failing the test.
    await run(process.execPath, [TSX, "--test", join(dir, "test", "index.test.ts")], { cwd: ROOT });
  });
}
