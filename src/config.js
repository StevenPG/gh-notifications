const path = require("path");

const ROOT = path.join(__dirname, "..");

module.exports = {
  PORT: process.env.PORT || 4777,
  DEMO: process.env.DEMO === "1",
  PUBLIC_DIR: path.join(ROOT, "public"),
  LOG_FILE: path.join(ROOT, "done-log.json"),
  LOG_LIMIT: 5000,
};
