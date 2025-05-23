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

    // install dependencies
    console.log("Loading packages...");
    await pyodide.loadPackage("numpy");
    await pyodide.loadPackage("lxml");
    // await pyodide.loadPackage("opencv-python");
    // await pyodide.loadPackage("micropip");

    // NOTE: "Can't find a pure python3 wheel for 'mung'"
    // const micropip = pyodide.pyimport("micropip");
    // await micropip.install("mung");

    // This installs a wheel package:
    // const smashcimaWhlUrl = new URL(
    //   "./smashcima-1.1.2-py3-none-any.whl",
    //   import.meta.url
    // );
    // const smashcimaArchive = await (await fetch(smashcimaWhlUrl)).arrayBuffer();
    // await pyodide.unpackArchive(smashcimaArchive, "wheel");

    // console.log("Smashcima loaded:");
    // console.log(pyodide.runPython(`
    //     from smashcima.scene.visual.Glyph import Glyph
    //     print(Glyph)
    // `));

    // NOTE: extend parcel with custom bundler to build a zip that then
    // gets downloaded here and extracted and loaded by pyodide? Could be...
    // (zip containing plain .py files)

    console.log("Pyodide ready!");
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
