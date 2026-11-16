const { DEMO } = require("./config");
const demo = DEMO ? require("./demo") : null;
const github = require("./github");
const history = require("./history");
const { listQueuedJobs, isValidRepo } = require("./queued-jobs");
const { send, readBody, serveStatic } = require("./http-utils");

// Each route: [method, pattern, handler(req, res, match, url)]
const routes = [
  ["GET", /^\/api\/history$/, (req, res) => send(res, 200, history.readLog())],

  ["DELETE", /^\/api\/history$/, (req, res) => {
    history.clearLog();
    send(res, 200, { ok: true });
  }],

  ["GET", /^\/api\/notifications$/, async (req, res, m, url) => {
    if (DEMO) return send(res, 200, demo.list);
    send(res, 200, await github.listNotifications(url.searchParams.get("all") === "true"));
  }],

  ["GET", /^\/api\/queued-jobs$/, async (req, res, m, url) => {
    const repo = url.searchParams.get("repo");
    if (repo && !isValidRepo(repo)) return send(res, 400, { error: "invalid repo" });
    if (DEMO) return send(res, 200, demo.queuedJobs);
    send(res, 200, await listQueuedJobs(repo));
  }],

  ["POST", /^\/api\/done\/(\d+)$/, async (req, res, m) => {
    const entry = { ...(await readBody(req)), id: m[1], doneAt: new Date().toISOString() };
    if (DEMO) {
      demo.list = demo.list.filter((n) => n.id !== m[1]);
      demo.history.push(entry);
    } else {
      await github.deleteThread(m[1]);
      history.appendDone(entry);
    }
    send(res, 200, { ok: true });
  }],

  ["POST", /^\/api\/read\/(\d+)$/, async (req, res, m) => {
    if (!DEMO) await github.markThreadRead(m[1]);
    send(res, 200, { ok: true });
  }],
];

async function handle(req, res, url) {
  for (const [method, pattern, handler] of routes) {
    const m = req.method === method && url.pathname.match(pattern);
    if (m) return handler(req, res, m, url);
  }
  if (req.method === "GET" && serveStatic(res, url.pathname)) return;
  send(res, 404, { error: "not found" });
}

module.exports = { handle };
