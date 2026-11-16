const { execFile } = require("child_process");

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

function stateOf(j) {
  if (j.merged) return "merged";
  if (j.draft) return "draft";
  if (j.state === "closed") return j.state_reason === "not_planned" ? "not_planned" : "closed";
  return "open";
}

// Fetches PR/issue state and author, cached per notification update.
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
        d = { state: stateOf(j), author: j.user && j.user.login };
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
  const details = await mapLimit(raw, 10, detail);
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

const deleteThread = (id) => gh(["api", "-X", "DELETE", `notifications/threads/${id}`]);
const markThreadRead = (id) => gh(["api", "-X", "PATCH", `notifications/threads/${id}`]);

module.exports = { listNotifications, deleteThread, markThreadRead };
