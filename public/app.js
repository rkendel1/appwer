const $ = (id) => document.getElementById(id);
const unavailable = "Not currently provided by connected provider";
async function request(path, options) { const response = await fetch(path, options); const value = await response.json(); if (!response.ok) throw new Error(value.error); return value; }
function row(label, value) { return `<dt>${label}</dt><dd>${value ?? unavailable}</dd><br>`; }
async function refresh() {
  const [status, data] = await Promise.all([request("/api/status"), request("/api/tasks")]);
  $("version").textContent = `v${status.application.version}`;
  $("status").innerHTML = row("Identity", status.application.id) + row("State", status.state);
  const g = status.github;
  $("github").innerHTML = row("Repository", `${g.owner}/${g.repository}`) + row("Default branch", g.defaultBranch) + row("Branch", g.metadataAvailability.branch === "available" ? g.branch : unavailable) + row("Commit", g.metadataAvailability.commit === "available" ? g.commitSha : unavailable) + row("Projects", unavailable);
  $("tasks").innerHTML = data.tasks.length ? data.tasks.map((task) => `<article class="task"><strong>${escapeHtml(task.title)}</strong><div>${escapeHtml(task.description)}</div><small>${task.status} · ${task.createdAt}</small><button data-id="${task.id}" data-action="edit">Edit</button><button data-id="${task.id}" data-action="toggle">Mark ${task.status === "open" ? "done" : "open"}</button><button data-id="${task.id}" data-action="delete">Delete</button></article>`).join("") : "<p class=muted>No tasks yet.</p>";
}
function escapeHtml(value) { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])); }
$("task-form").addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await request("/api/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) }); event.currentTarget.reset(); await refresh(); } catch (error) { $("message").textContent = error.message; } });
$("tasks").addEventListener("click", async (event) => { const button = event.target.closest("button"); if (!button) return; try { const tasks = await request("/api/tasks"); const task = tasks.tasks.find((item) => item.id === button.dataset.id); if (button.dataset.action === "delete") await request(`/api/tasks/${task.id}`, { method: "DELETE" }); else if (button.dataset.action === "edit") { const title = prompt("Task title", task.title); if (title === null) return; const description = prompt("Description", task.description); if (description === null) return; await request(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, description }) }); } else await request(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: task.status === "open" ? "done" : "open" }) }); await refresh(); } catch (error) { $("message").textContent = error.message; } });
refresh().catch((error) => { $("message").textContent = error.message; });
