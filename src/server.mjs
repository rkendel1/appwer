import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createFeltDB } from "@feltdb/core";
import { discoverGitHubRepository } from "./github-source.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const publicDir = join(root, "public");
const stateDir = process.env.FELTDB_PATH ?? join(root, ".state");
mkdirSync(stateDir, { recursive: true });
const db = createFeltDB({ mode: "local", namespace: "com.rkendel1.taskboard", path: stateDir });
const tasks = db.collection("tasks");

const github = discoverGitHubRepository({
  owner: process.env.GITHUB_OWNER ?? "rkendel1",
  repository: process.env.GITHUB_REPOSITORY ?? "appwer",
  ...(process.env.GITHUB_REPOSITORY_URL ? { repositoryUrl: process.env.GITHUB_REPOSITORY_URL } : {}),
  ...(process.env.GITHUB_DEFAULT_BRANCH ? { defaultBranch: process.env.GITHUB_DEFAULT_BRANCH } : {}),
  ...(process.env.GITHUB_BRANCH ? { branch: process.env.GITHUB_BRANCH } : {}),
  ...(process.env.GITHUB_COMMIT_SHA ? { commitSha: process.env.GITHUB_COMMIT_SHA } : {}),
  ...(process.env.GITHUB_COMMIT_URL ? { commitUrl: process.env.GITHUB_COMMIT_URL } : {})
});

function json(response, status, value) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}

async function body(request) {
  let text = "";
  for await (const chunk of request) text += chunk;
  return text ? JSON.parse(text) : {};
}

async function api(request, response, path) {
  if (path === "/api/status") return json(response, 200, {
    application: { id: "com.rkendel1.taskboard", name: "Task Board", version: "1.0.0" },
    identity: "AppBoundry identity provider required",
    state: "FeltDB durable local provider",
    github
  });
  if (path === "/api/tasks" && request.method === "GET") return json(response, 200, { tasks: await tasks.list() });
  if (path === "/api/tasks" && request.method === "POST") {
    const input = await body(request);
    if (typeof input.title !== "string" || !input.title.trim()) return json(response, 400, { error: "title is required" });
    const now = new Date().toISOString();
    const value = { id: randomUUID(), title: input.title.trim(), description: String(input.description ?? ""), status: "open", createdAt: now, updatedAt: now };
    await tasks.insert(value, value.id);
    return json(response, 201, value);
  }
  const match = path.match(/^\/api\/tasks\/([^/]+)$/);
  if (match && request.method === "PATCH") {
    const id = decodeURIComponent(match[1]);
    const current = await tasks.get(id);
    if (!current) return json(response, 404, { error: "task not found" });
    const input = await body(request);
    const value = { ...current, title: String(input.title ?? current.title), description: String(input.description ?? current.description), status: String(input.status ?? current.status), updatedAt: new Date().toISOString() };
    await tasks.update(id, value);
    return json(response, 200, value);
  }
  if (match && request.method === "DELETE") {
    await tasks.delete(decodeURIComponent(match[1]));
    return json(response, 200, { deleted: true });
  }
  json(response, 404, { error: "not found" });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    try { await api(request, response, url.pathname); } catch (error) { json(response, 500, { error: "Unable to access durable application state.", detail: error instanceof Error ? error.message : String(error) }); }
    return;
  }
  if (url.pathname === "/" || url.pathname === "/index.html") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end((await import("node:fs/promises")).readFile(join(publicDir, "index.html")));
    return;
  }
  if (url.pathname === "/app.js") {
    response.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
    response.end((await import("node:fs/promises")).readFile(join(publicDir, "app.js")));
    return;
  }
  response.writeHead(404).end("Not found");
});

server.listen(Number(process.env.PORT ?? 4173), process.env.HOST ?? "127.0.0.1", () => {
  console.log(`Task Board listening on http://${process.env.HOST ?? "127.0.0.1"}:${process.env.PORT ?? 4173}`);
});
