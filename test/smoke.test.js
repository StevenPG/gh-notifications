const test = require("node:test");
const assert = require("node:assert");
const { spawn } = require("node:child_process");
const path = require("node:path");

const PORT = 4798;
const base = `http://127.0.0.1:${PORT}`;
let server;

test.before(async () => {
  server = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: { ...process.env, DEMO: "1", PORT: String(PORT) },
    stdio: "ignore",
  });
  for (let i = 0; i < 50; i++) {
    try { await fetch(base + "/"); return; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  throw new Error("server did not start");
});
test.after(() => server.kill());

test("serves the UI", async () => {
  const r = await fetch(base + "/");
  assert.equal(r.status, 200);
  assert.match(await r.text(), /GitHub Notifications/);
});

test("lists demo notifications with state", async () => {
  const list = await (await fetch(base + "/api/notifications")).json();
  assert.ok(list.length > 5);
  assert.ok(list.some((n) => n.type === "PullRequest" && n.state === "merged"));
});

test("rejects cross-site requests", async () => {
  const r = await fetch(`${base}/api/history`, { method: "DELETE", headers: { Origin: "https://evil.example" } });
  assert.equal(r.status, 403);
});

test("marking done moves an item into history", async () => {
  const [first] = await (await fetch(base + "/api/notifications")).json();
  await fetch(`${base}/api/done/${first.id}`, { method: "POST", body: JSON.stringify({ title: first.title }) });
  const list = await (await fetch(base + "/api/notifications")).json();
  const hist = await (await fetch(base + "/api/history")).json();
  assert.ok(!list.some((n) => n.id === first.id));
  assert.ok(hist.some((h) => h.id === first.id));
});

test("serves static assets with correct types", async () => {
  const js = await fetch(base + "/js/main.js");
  assert.equal(js.status, 200);
  assert.match(js.headers.get("content-type"), /javascript/);
  assert.equal((await fetch(base + "/css/styles.css")).status, 200);
  assert.equal((await fetch(base + "/..%2fserver.js")).status, 404);
});

test("lists queued jobs", async () => {
  const jobs = await (await fetch(base + "/api/queued-jobs")).json();
  assert.ok(jobs.length > 0 && jobs[0].repo && jobs[0].name);
  const bad = await fetch(base + "/api/queued-jobs?repo=a/..");
  assert.equal(bad.status, 400);
});
