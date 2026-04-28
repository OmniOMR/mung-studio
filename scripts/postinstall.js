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

//////////////////////////
//      OMR models      //
//////////////////////////

const MODELS_CONFIG = packageJson["models"];
const MODELS_PATH = MODELS_CONFIG["models-path"];
const MODELS_REPO_URL = MODELS_CONFIG["models-url"];
const MODELS_TAG = MODELS_CONFIG["models-tag"];
const MODELS_DATE = MODELS_CONFIG["models-date"];
const MODELS_RESOLUTION = MODELS_CONFIG["models-resolution"];

const modelFullName = (filename) => `${MODELS_DATE}-${filename}`;
const remoteModelUrl = (filename) => `${MODELS_REPO_URL}/releases/download/${MODELS_TAG}/${modelFullName(filename)}`;
const localModelPath = (filename) => `${MODELS_PATH}/${modelFullName(filename)}`;

const fetchModelFile = (filename, dest = null) => {
  const url = remoteModelUrl(filename);
  const localFile = dest ?? localModelPath(filename);
  if (fs.existsSync(localFile)) {
    console.log(`${filename} already exists, skipping download.`);
    return;
  }
  console.log(`Fetching ${filename} from ${url}...`);
  execSync(`curl -L -o ${localFile} ${url}`);
}

console.log("Fetching OMR models...");

const onnxFilename = MODELS_RESOLUTION + "-" + MODELS_CONFIG["onnx-filename"];

fetchModelFile(onnxFilename);
fetchModelFile(MODELS_CONFIG["config-filename"], `${MODELS_PATH}/SegmentationModelConfig.yaml`);

console.log("Generating model paths file.")

// create a .ts file that can be included to load the models in the app
const modelsTsContent =
`export const SEGMENTATION_MODEL_URL = new URL('./${modelFullName(onnxFilename)}', import.meta.url).toString();
export const SEGMENTATION_MODEL_RESOLUTION = ${MODELS_RESOLUTION};
export const SEGMENTATION_MODEL_DPI = ${MODELS_CONFIG["models-dpi"]};`;

fs.writeFileSync(`${MODELS_PATH}/SegmentationModelPaths.ts`, modelsTsContent);
