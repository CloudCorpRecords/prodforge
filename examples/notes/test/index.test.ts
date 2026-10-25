import { test } from "node:test";
import assert from "node:assert/strict";
import { handleTool, toolNames, NotesStore } from "../src/index.js";

test("ping tool returns pong", () => {
  assert.equal(handleTool("ping"), "pong");
  assert.ok(toolNames().includes("ping"));
});

test("notes round-trip: add, list, get", () => {
  const store = new NotesStore();
  const added = JSON.parse(handleTool("add_note", { title: "Wave C", body: "worked examples" }, store)) as {
    id: number;
    title: string;
  };
  assert.equal(added.id, 1);
  assert.equal(added.title, "Wave C");
  const listed = JSON.parse(handleTool("list_notes", {}, store)) as unknown[];
  assert.equal(listed.length, 1);
  const got = JSON.parse(handleTool("get_note", { id: 1 }, store)) as { body: string };
  assert.equal(got.body, "worked examples");
});

test("notes validation: empty title and missing id throw", () => {
  const store = new NotesStore();
  assert.throws(() => handleTool("add_note", { title: "  ", body: "x" }, store), /non-empty/);
  assert.throws(() => handleTool("get_note", { id: 99 }, store), /no note with id 99/);
});

test("unknown tool throws", () => {
  assert.throws(() => handleTool("nope"), /unknown tool/);
});
