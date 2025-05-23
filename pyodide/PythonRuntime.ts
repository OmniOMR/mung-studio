import { version as pyodideVersion, PyodideInterface } from "pyodide";

/**
 * Wrapper for the python runtime, where the mung package (and others)
 * can be executed by javascript. It wraps and configures pyodide.
 * https://pyodide.org/. It is a singleton service, because pyodide
 * can only be loaded once.
 */
export class PythonRuntime {
  private static singletonInstance: PythonRuntime | null = null;

  /**
   * Constructs or returns the python runtime instance.
   * Is not asynchronous, however the instance takes a while to start up
   * when freshly created.
   */
  public static resolveInstance(): PythonRuntime {
    if (PythonRuntime.singletonInstance === null) {
      PythonRuntime.singletonInstance = new PythonRuntime();
    }
    return PythonRuntime.singletonInstance;
  }

  constructor() {
    this.initialize();
  }

  private async initialize() {
    console.log("Loading pyodide...");

    // I'm fusing together plain javascript CDN import with the NPM module
    // import (for types), because there is no Parcel plugin to get pyodide
    // through its bundling process safely. So the NPM package is used for
    // types and the code itself is downloaded during runtime by addding
    // a <script> tag to the document head.
    await loadExternalScriptAsync(
      `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/pyodide.js`,
    );
    if (window["loadPyodide"] === undefined) {
      throw new Error("Pyodide is not available on the window object.");
    }

    const pyodide = (await window["loadPyodide"]()) as PyodideInterface;

    // expose so that we can play with it in the browser
    window["pyodide"] = pyodide;

    console.log("Pyodide loaded:", pyodide);
    console.log(
      pyodide.runPython(`
        import sys
        sys.version
    `),
    );

    // load built-in pyodide dependencies
    console.log("Loading packages...");
    await pyodide.loadPackage("numpy");
    await pyodide.loadPackage("lxml");
    await pyodide.loadPackage("scikit-image");
    // await pyodide.loadPackage("opencv-python");

    // load custom python-only packages bundled via parcel
    const pyodidePackagesUrl = new URL("./pyodide-packages", import.meta.url);
    const packagesArchive = await (
      await fetch(pyodidePackagesUrl)
    ).arrayBuffer();
    await pyodide.unpackArchive(packagesArchive, "zip");

    console.log("Pyodide ready!");

    await pyodide.runPythonAsync(`
      from mstudio.hello import hello
      hello()
    `);
  }
}

/**
 * Loads some javascript file by appending a <script> tag to the document head
 */
function loadExternalScriptAsync(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const element = document.createElement("script");
    element.onload = () => {
      resolve();
    };
    element.onerror = (e) => {
      reject(e);
    };
    element.src = src;
    document.head.appendChild(element);
  });
}
