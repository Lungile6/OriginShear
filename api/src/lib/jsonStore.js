const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data/directory");

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(fileName, fallback) {
  ensureDir();
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    return structuredClone(fallback);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return structuredClone(fallback);
  }
}

function writeJson(fileName, data) {
  ensureDir();
  const filePath = path.join(DATA_DIR, fileName);
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, filePath);
}

module.exports = { readJson, writeJson, DATA_DIR };
