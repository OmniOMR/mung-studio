import { loadPyodide, PyodideInterface } from "pyodide";
import { PyProxy } from "pyodide/ffi";

// holds the initialized pyodide instance
let pyodide: PyodideInterface | null = null;

/**
 * Loads and initializes the pyodide instance
 */
async function onInitialize(
  pyodideVersion: string,
  pyodidePackagesUrl: string,
) {
  // console.log("INITIALIZING WORKER...");

  // load pyodide webassembly from the CDN using the version shipped with
  // the npm package in the main thread.
  pyodide = await loadPyodide({
    indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
  });

  // print python version
  // console.log("Pyodide loaded:", pyodide);
  // console.log(
  //   await pyodide.runPythonAsync(`
  //     import sys
  //     sys.version
  //   `),
  // );

  // load built-in pyodide dependencies
  console.log("Loading packages...");
  await pyodide.loadPackage("numpy");
  await pyodide.loadPackage("lxml");
  await pyodide.loadPackage("scikit-image");
  await pyodide.loadPackage("opencv-python");

  // load custom python-only packages bundled via parcel
  const packagesArchive = await (await fetch(pyodidePackagesUrl)).arrayBuffer();
  await pyodide.unpackArchive(packagesArchive, "zip");

  console.log("Pyodide ready!");

  // await pyodide.runPythonAsync(`
  //   from mstudio.hello import hello
  //   hello()
  // `);

  // console.log("WORKER INITIALIZED!");

  self.postMessage(["initialized"]);
}

/**
 * Executes python code in the pyodide instance
 */
async function onExecutePython(
  executionId: number,
  pythonCode: string,
  context: object,
) {
  if (pyodide === null) {
    console.error("Using pyodide worker while still not initialized.");
    return;
  }

  // if the python code makes any imports, make sure we load them first
  // NOTE: not necessary, since I pre-load packages manually on init
  // await pyodide.loadPackagesFromImports(pythonCode);

  // convert the javascript context object into a python dictionary
  // and get a handle on it through a proxy object
  const dict = pyodide.globals.get("dict");
  const globals = dict(Object.entries(context));

  // execute the python code and send back the response
  try {
    let result = await pyodide.runPythonAsync(pythonCode, { globals });

    // convert proxy objects, they cannot be sent outside the web worker
    if (typeof result === "object") {
      const proxy = result as PyProxy;
      result = proxy.toJs({ dict_converter: Object.fromEntries }); // convert
      proxy.destroy(); // release
    }

    self.postMessage(["executedPython", executionId, true, result]);
  } catch (error) {
    self.postMessage(["executedPython", executionId, false, error]);
  }

  dict.destroy();
  globals.destroy();
}

/**
 * Receives web worker messages
 */
self.onmessage = async (event) => {
  const messageName = String(event.data[0]);
  const messageArgs = (event.data as any[]).slice(1) as any[];

  if (messageName === "initialize") {
    onInitialize.call(undefined, ...messageArgs);
  } else if (messageName === "executePython") {
    onExecutePython.call(undefined, ...messageArgs);
  } else {
    console.error("Pyodide worker received an unknown message", event);
  }
};
