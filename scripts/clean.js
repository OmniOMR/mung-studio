const fs = require("fs");
const path = require("path");

const pathsToRemove = [
  "dist",
  ".vite",
  path.join("node_modules", ".vite"),
  path.join("public", "pyodide-packages.zip"),
];

for (const relativePath of pathsToRemove) {
  fs.rmSync(relativePath, { recursive: true, force: true });
}