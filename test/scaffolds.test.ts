import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { STACKS, scaffoldFiles, initStack, isStack } from "../src/scaffolds.js";

test("every stack scaffolds a complete, valid project", () => {
  for (const stack of STACKS) {
    const files = scaffoldFiles(stack, "demo-app");
    for (const required of ["package.json", "tsconfig.json", "README.md", "src/index.ts", "test/index.test.ts", ".gitignore"]) {
      assert.ok(files[required], `${stack} missing ${required}`);
    }
    const pkg = JSON.parse(files["package.json"]) as { scripts: Record<string, string>; name: string };
    assert.equal(pkg.name, "demo-app");
    assert.ok(pkg.scripts.build, `${stack} package.json missing build script`);
    assert.ok(pkg.scripts.test, `${stack} package.json missing test script`);
    assert.match(files["test/index.test.ts"], /node:test/);
    assert.match(files["README.md"], new RegExp(stack));
  }
});

test("mcp-server scaffold carries a registry server.json", () => {
  const files = scaffoldFiles("mcp-server", "demo-mcp");
  const server = JSON.parse(files["server.json"]) as { name: string };
  assert.match(server.name, /demo-mcp/);
});

test("unknown stack is rejected", () => {
  assert.equal(isStack("not-a-stack"), false);
});

test("init writes real files and refuses to clobber", () => {
  const dir = mkdtempSync(join(tmpdir(), "prodforge-init-"));
  const target = join(dir, "my-cli");
  const written = initStack("cli-tool", target, "my-cli");
  assert.ok(written.includes("src/index.ts"));
  assert.ok(existsSync(join(target, "package.json")));
  const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf8")) as { name: string };
  assert.equal(pkg.name, "my-cli");
  assert.throws(() => initStack("cli-tool", target, "my-cli"), /not empty/);
});

test("generated cli-tool project passes its own test suite", () => {
  const dir = mkdtempSync(join(tmpdir(), "prodforge-gen-"));
  const target = join(dir, "gen-cli");
  initStack("cli-tool", target, "gen-cli");
  // Run the generated suite with this repo's tsx: no install needed, the
  // scaffold has zero runtime dependencies beyond node builtins.
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  const tsxCli = join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
  // A nested node:test run inherits the parent runner's context and swallows
  // its report, so strip test-context env vars and read stdout+stderr together.
  const env: Record<string, string | undefined> = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("NODE_TEST")) delete env[key];
  const result = spawnSync(process.execPath, [tsxCli, "--test", join(target, "test", "index.test.ts")], {
    encoding: "utf8",
    timeout: 60000,
    env: env as Record<string, string>,
  });
  const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  assert.equal(result.status, 0, `generated suite failed: ${out}`);
  assert.match(out, /pass 2/);
});
