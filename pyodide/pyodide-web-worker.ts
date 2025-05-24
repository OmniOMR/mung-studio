// Classic web workers cannot import other typescript files so this is
// a minimalistic approximation of the true type so that type hints work.
type _PyProxy = any;
declare class _PyodideInterface {
  globals: _PyProxy;
  loadPackagesFromImports(
    code: string,
    options?: {
      messageCallback?: (message: string) => void;
      errorCallback?: (message: string) => void;
      checkIntegrity?: boolean;
    },
  ): Promise<unknown>;
  runPythonAsync(
    code: string,
    options?: {
      globals?: _PyProxy;
      locals?: _PyProxy;
      filename?: string;
    },
  ): Promise<any>;
  loadPackage: (
    names: string | _PyProxy | Array<string>,
    options?: {
      messageCallback?: (message: string) => void;
      errorCallback?: (message: string) => void;
      checkIntegrity?: boolean;
    },
  ) => Promise<any>;
  unpackArchive(
    buffer: ArrayBuffer,
    format: string,
    options?: {
      extractDir?: string;
    },
  ): void;
}

// holds the initialized pyodide instance
let pyodide: _PyodideInterface | null = null;

/**
 * Loads and initializes the pyodide instance
 */
async function onInitialize(
  pyodideVersion: string,
  pyodidePackagesUrl: string,
) {
  // console.log("INITIALIZING WORKER...");

  // import pyodide from a CDN
  importScripts(
    `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/pyodide.js`,
  );

  // load pyodide webassembly
  pyodide = (await self["loadPyodide"]()) as _PyodideInterface;

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
    const result = await pyodide.runPythonAsync(pythonCode, { globals });
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
