const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const PORT = process.env.PORT || 4777;

function gh(args) {
  return new Promise((resolve, reject) => {
    execFile("gh", args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout);
    });
  });
}

function htmlUrl(n) {
  const api = n.subject.url;
  const repo = n.repository.html_url;
  if (!api) return repo;
  const m = api.match(/\/(pulls|issues|commits|releases)\/([^/]+)$/);
  if (!m) return repo;
  const kind = { pulls: "pull", issues: "issues", commits: "commit", releases: "releases" }[m[1]];
  return kind === "releases" ? `${repo}/releases` : `${repo}/${kind}/${m[2]}`;
}

let tokenPromise;
const detailCache = new Map();

async function detail(n) {
  const key = n.subject.url + "@" + n.updated_at;
  if (detailCache.has(key)) return detailCache.get(key);
  let d = {};
  const t = n.subject.type;
  if (n.subject.url && (t === "PullRequest" || t === "Issue")) {
    try {
      tokenPromise ||= gh(["auth", "token"]).then((s) => s.trim());
      const r = await fetch(n.subject.url, {
        headers: { Authorization: `Bearer ${await tokenPromise}`, Accept: "application/vnd.github+json" },
      });
      if (r.ok) {
        const j = await r.json();
        const state = j.merged ? "merged" : j.draft ? "draft" : j.state === "closed" ? (j.state_reason === "not_planned" ? "not_planned" : "closed") : "open";
        d = { state, author: j.user && j.user.login };
      }
    } catch {}
  }
  detailCache.set(key, d);
  return d;
}

async function mapLimit(arr, limit, fn) {
  const out = new Array(arr.length);
  let i = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (i < arr.length) { const k = i++; out[k] = await fn(arr[k]); }
  }));
  return out;
}

async function listNotifications(all) {
  const out = await gh(["api", "--paginate", "--slurp", `notifications?per_page=100&all=${all}`]);
  const raw = JSON.parse(out).flat();
  const details = await mapLimit(raw, 10, (n) => detail({ ...n, updated_at: n.updated_at }));
  return raw.map((n, idx) => ({
    ...details[idx],
    id: n.id,
    unread: n.unread,
    reason: n.reason,
    repo: n.repository.full_name,
    type: n.subject.type,
    title: n.subject.title,
    updated: n.updated_at,
    url: htmlUrl(n),
  }));
}

function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "Content-Type": type });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

const LOG = path.join(__dirname, "done-log.json");
const readLog = () => { try { return JSON.parse(fs.readFileSync(LOG, "utf8")); } catch { return []; } };
const readBody = (req) => new Promise((resolve) => {
  let b = "";
  req.on("data", (c) => (b += c));
  req.on("end", () => { try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); } });
});

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    try {
      if (req.method === "GET" && url.pathname === "/api/history") {
        return send(res, 200, readLog());
      }
      if (req.method === "DELETE" && url.pathname === "/api/history") {
        fs.writeFileSync(LOG, "[]");
        return send(res, 200, { ok: true });
      }
      if (req.method === "GET" && url.pathname === "/api/notifications") {
        return send(res, 200, await listNotifications(url.searchParams.get("all") === "true"));
      }
      let m;
      if (req.method === "POST" && (m = url.pathname.match(/^\/api\/done\/(\d+)$/))) {
        const meta = await readBody(req);
        await gh(["api", "-X", "DELETE", `notifications/threads/${m[1]}`]);
        const log = readLog();
        log.push({ ...meta, id: m[1], doneAt: new Date().toISOString() });
        fs.writeFileSync(LOG, JSON.stringify(log.slice(-5000)));
        return send(res, 200, { ok: true });
      }
      if (req.method === "POST" && (m = url.pathname.match(/^\/api\/read\/(\d+)$/))) {
        await gh(["api", "-X", "PATCH", `notifications/threads/${m[1]}`]);
        return send(res, 200, { ok: true });
      }
      if (req.method === "GET" && url.pathname === "/") {
        return send(res, 200, fs.readFileSync(path.join(__dirname, "public", "index.html")), "text/html");
      }
      send(res, 404, { error: "not found" });
    } catch (e) {
      send(res, 500, { error: e.message });
    }
  })
  .listen(PORT, "127.0.0.1", () => console.log(`http://localhost:${PORT}`));
