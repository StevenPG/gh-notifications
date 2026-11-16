const http = require("http");
const { PORT } = require("./config");
const { send, isAllowedRequest } = require("./http-utils");
const { handle } = require("./routes");

function createServer() {
  return http.createServer(async (req, res) => {
    if (!isAllowedRequest(req)) return send(res, 403, { error: "forbidden" });
    try {
      await handle(req, res, new URL(req.url, "http://localhost"));
    } catch (e) {
      send(res, 500, { error: e.message });
    }
  });
}

function start() {
  createServer().listen(PORT, "127.0.0.1", () => console.log(`http://localhost:${PORT}`));
}

module.exports = { createServer, start };
