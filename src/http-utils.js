const fs = require("fs");
const path = require("path");
const { PUBLIC_DIR } = require("./config");

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "Content-Type": type });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => { try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); } });
  });
}

// Guards against DNS rebinding and cross-site requests to the local API.
function isAllowedRequest(req) {
  const hostOk = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || "");
  const origin = req.headers.origin;
  const originOk = !origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return hostOk && originOk;
}

// Serves files from public/; returns false when nothing matches.
function serveStatic(res, pathname) {
  const rel = pathname === "/" ? "/index.html" : pathname;
  const file = path.join(PUBLIC_DIR, path.normalize(rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return false;
  let data;
  try { data = fs.readFileSync(file); } catch { return false; }
  send(res, 200, data, MIME[path.extname(file)] || "application/octet-stream");
  return true;
}

module.exports = { send, readBody, isAllowedRequest, serveStatic };
