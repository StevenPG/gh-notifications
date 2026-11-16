const fs = require("fs");
const { DEMO, LOG_FILE, LOG_LIMIT } = require("./config");
const demo = DEMO ? require("./demo") : null;

function readLog() {
  if (DEMO) return demo.history;
  try { return JSON.parse(fs.readFileSync(LOG_FILE, "utf8")); } catch { return []; }
}

function writeLog(log) {
  if (!DEMO) fs.writeFileSync(LOG_FILE, JSON.stringify(log.slice(-LOG_LIMIT)));
}

function appendDone(entry) {
  writeLog([...readLog(), entry]);
}

function clearLog() {
  writeLog([]);
  if (DEMO) demo.history.length = 0;
}

module.exports = { readLog, appendDone, clearLog };
