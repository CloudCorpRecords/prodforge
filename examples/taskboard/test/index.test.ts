import { test } from "node:test";
import assert from "node:assert/strict";
import { createServerInstance, healthPayload, TaskStore } from "../src/index.js";

async function withServer<T>(fn: (base: string) => Promise<T>): Promise<T> {
  const server = createServerInstance(new TaskStore());
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test("health payload is ok", () => {
  assert.equal(healthPayload().ok, true);
});

test("server answers /health with 200", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok: boolean };
    assert.equal(body.ok, true);
  });
});

test("tasks start empty, POST creates one, GET lists it", async () => {
  await withServer(async (base) => {
    const empty = (await (await fetch(`${base}/tasks`)).json()) as unknown[];
    assert.deepEqual(empty, []);
    const createdRes = await fetch(`${base}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Ship Wave C" }),
    });
    assert.equal(createdRes.status, 201);
    const created = (await createdRes.json()) as { id: number; title: string; done: boolean };
    assert.equal(created.id, 1);
    assert.equal(created.title, "Ship Wave C");
    assert.equal(created.done, false);
    const listed = (await (await fetch(`${base}/tasks`)).json()) as { id: number }[];
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, 1);
  });
});

test("POST with an empty title is a 400, not a crash", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "   " }),
    });
    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: string };
    assert.match(body.error, /non-empty/);
  });
});

test("unknown routes are 404", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/nope`);
    assert.equal(res.status, 404);
  });
});
