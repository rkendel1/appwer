import test from "node:test";
import assert from "node:assert/strict";
import application from "../src/application.mjs";

test("AppPort application has stable identity and CRUD contract", () => {
  const verification = application.verify();
  assert.equal(verification.ready, true);
  assert.deepEqual(application.manifest().application, {
    id: "com.rkendel1.taskboard",
    name: "Task Board",
    version: "1.0.0"
  });
  assert.deepEqual(verification.provides.map(({ name }) => name).sort(), [
    "tasks.create",
    "tasks.delete",
    "tasks.list",
    "tasks.update"
  ]);
});
