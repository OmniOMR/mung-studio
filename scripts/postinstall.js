const { execSync } = require("child_process");
const fs = require("fs");
const packageJson = require("../package.json");


///////////////////
// Dot env files //
///////////////////

console.log("Checking dotenv files...");

if (fs.existsSync(".env")) {
  console.log(".env", "::", "Exists, leaving alone.");
} else {
  fs.copyFileSync(".env.example", ".env");
  console.log(".env", "::", "Created from the .env.example file!");
}

if (fs.existsSync(".env.production")) {
  console.log(".env.production", "::", "Exists, leaving alone.");
} else {
  fs.copyFileSync(".env.production.example", ".env.production");
  console.log(
    ".env.production",
    "::",
    "Created from the .env.production.example file!",
  );
}

console.log("Dotenv files are set up.");
console.log("");


//////////////////////////
// Pyodide mung package //
//////////////////////////

const MUNG_PATH = packageJson["pyodide"]["mung-path"];
const MUNG_REPO_URL = packageJson["pyodide"]["mung-url"];
const MUNG_COMMIT_HASH = packageJson["pyodide"]["mung-commit"];

console.log("Checking pyodide mung package...");

if (fs.existsSync(MUNG_PATH)) {
  console.log("Mung package already exists. Removing for re-cloning...");
  fs.rmSync(MUNG_PATH, { recursive: true });
}

console.log("Cloning the mung repository...")
execSync(`git clone ${MUNG_REPO_URL} ${MUNG_PATH}`);

console.log(`Checking out to the commit ${MUNG_COMMIT_HASH}...`);
execSync(`git -C ${MUNG_PATH} -c "advice.detachedHead=false" checkout ${MUNG_COMMIT_HASH}`);

console.log("Pyodide mung package is ready.");
console.log("");
