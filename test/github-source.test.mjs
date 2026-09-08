import test from "node:test";
import assert from "node:assert/strict";
import { discoverGitHubRepository } from "../src/github-source.ts";

test("GitHub discovery does not invent unavailable metadata", () => {
  const source = discoverGitHubRepository({ owner: "acme", repository: "tasks", defaultBranch: "main" });
  assert.equal(source.defaultBranch, "main");
  assert.equal(source.metadataAvailability.branch, "unavailable");
  assert.equal(source.metadataAvailability.commit, "unavailable");
  assert.equal(source.metadataAvailability.projects, "unavailable");
  assert.equal("commitSha" in source, false);
});
