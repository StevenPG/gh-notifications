const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const PORT = process.env.PORT || 4777;
const DEMO = process.env.DEMO === "1";
const demo = DEMO ? require("./demo") : null;

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

const REPO_RE = /^[\w.-]+\/[\w.-]+$/;

// Queued jobs live on workflow runs that are queued or in progress. Scan the
// most recently pushed repos unless a specific repo is given.
async function listQueuedJobs(repo) {
  let repos;
  if (repo) repos = [repo];
  else {
    const out = await gh(["api", "user/repos?sort=pushed&per_page=30&affiliation=owner,collaborator,organization_member"]);
    repos = JSON.parse(out).filter((r) => !r.archived).map((r) => r.full_name);
  }
  const perRepo = await mapLimit(repos, 5, async (full) => {
    try {
      const runs = [];
      for (const status of ["queued", "in_progress"]) {
        const out = await gh(["api", `repos/${full}/actions/runs?status=${status}&per_page=50`]);
        runs.push(...JSON.parse(out).workflow_runs);
      }
      const jobs = await mapLimit(runs, 5, async (run) => {
        const out = await gh(["api", "--paginate", "--slurp", `repos/${full}/actions/runs/${run.id}/jobs?per_page=100`]);
        return JSON.parse(out).flatMap((p) => p.jobs)
          .filter((j) => j.status === "queued")
          .map((j) => ({ id: String(j.id), repo: full, workflow: run.name, name: j.name, branch: run.head_branch, createdAt: j.created_at, url: j.html_url }));
      });
      return jobs.flat();
    } catch { return []; } // repos without Actions access are skipped
  });
  return perRepo.flat().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "Content-Type": type });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

const LOG = path.join(__dirname, "done-log.json");
const readLog = () => {
  if (DEMO) return demo.history;
  try { return JSON.parse(fs.readFileSync(LOG, "utf8")); } catch { return []; }
};
const writeLog = (log) => { if (!DEMO) fs.writeFileSync(LOG, JSON.stringify(log.slice(-5000))); };
const readBody = (req) => new Promise((resolve) => {
  let b = "";
  req.on("data", (c) => (b += c));
  req.on("end", () => { try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); } });
});

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    // Guard against DNS rebinding and cross-site requests to the local API
    const hostOk = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || "");
    const origin = req.headers.origin;
    const originOk = !origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (!hostOk || !originOk) return send(res, 403, { error: "forbidden" });
    try {
      if (req.method === "GET" && url.pathname === "/api/history") {
        return send(res, 200, readLog());
      }
      if (req.method === "DELETE" && url.pathname === "/api/history") {
        writeLog([]);
        if (DEMO) demo.history.length = 0;
        return send(res, 200, { ok: true });
      }
      if (req.method === "GET" && url.pathname === "/api/notifications") {
        if (DEMO) return send(res, 200, demo.list);
        return send(res, 200, await listNotifications(url.searchParams.get("all") === "true"));
      }
      if (req.method === "GET" && url.pathname === "/api/queued-jobs") {
        const repo = url.searchParams.get("repo");
        if (repo && !REPO_RE.test(repo)) return send(res, 400, { error: "invalid repo" });
        if (DEMO) return send(res, 200, demo.queuedJobs);
        return send(res, 200, await listQueuedJobs(repo));
      }
      let m;
      if (req.method === "POST" && (m = url.pathname.match(/^\/api\/done\/(\d+)$/))) {
        const meta = await readBody(req);
        const entry = { ...meta, id: m[1], doneAt: new Date().toISOString() };
        if (DEMO) {
          demo.list = demo.list.filter((n) => n.id !== m[1]);
          demo.history.push(entry);
          return send(res, 200, { ok: true });
        }
        await gh(["api", "-X", "DELETE", `notifications/threads/${m[1]}`]);
        writeLog([...readLog(), entry]);
        return send(res, 200, { ok: true });
      }
      if (req.method === "POST" && (m = url.pathname.match(/^\/api\/read\/(\d+)$/))) {
        if (!DEMO) await gh(["api", "-X", "PATCH", `notifications/threads/${m[1]}`]);
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
