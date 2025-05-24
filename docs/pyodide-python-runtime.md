# Pyodide Python Runtime

MuNG Studio is intended for the MuNG format. This format is primarily meant to be consumed from Python via the `mung` PyPI package. The package should be the central point that accumulates all format-related logic, such as validation rules, format convertors, and format transformations. Also, MuNG Studio operates on visual data and computer-vision related operations are quite painful to perform in Javascript, but are relatively easy in Python with the help of the OpenCV library.

For these reasons, MuNG Studio incorporates Python runtime inside of itself and can communicate with it (as if it was a fast backend server) to offload some of the logic onto it.

> **Note:** If you just want to know, how to develop python scripts in this repository, see the [Development Setup](development-setup.md) documentation page. This pages talks only about how and why it is set up the way it is.

The interaction has these components:

<img src="assets/python-runtime-components.svg" alt="Component digram of the python runtime in MuNG Studio">

There's a lot to unpack. Blue are components of MuNG Studio. Green are web browser APIs. Purple are Pyodide components.

These are the main components:

1. [Pyodide](https://pyodide.org/) is the CPython interpreter, compiled to [WebAssembly](https://webassembly.org/) so that it can run inside the browser. Web assembly runs on the same VM as javascript, so it competes with it for thread time. You can imagine Pyodide as a huge javascript program that "pretends" Python really well. There is no "python", there is only lots of javascript, pretending to act like python very well.
2. [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers): Since Pyodide shares the VM with javascript, when loaded from the UI thread, it causes lags and freezes when initializing and when running heavy python computations. So we run it in a Web Worker, which is a web browser mechanism to get a background thread. But since javascript is NOT multi-threaded, to avoid these two threads colliding on shared memory, there is NO SHARED MEMORY! You must communicate with the web worker as if it was a separate process, by sending messages, no shared variables are allowed. Moreover, there's a limit on what can pass this barrier and the `PyProxy` classes that pydantic has CANNOT! So pydantic is completely isolated inside the web worker.
3. `PyodideWorkerConnection`: This class is what encapsulates the whole machinery behind something user-friendly. It exposes an `.executePython(...)` async method, which accepts a python code snippet and global variables; runs the python code; and returns back whatever value the python left in its last statement (a weird "return" kind-of statement, REPL-like).
4. `PythonRuntime`: This is a nicer API class, which exposes specific actions to the user, such as *validate MuNG*, *auto-extract mask*, etc. It calls python code and contains all the [marshalling](https://en.wikipedia.org/wiki/Marshalling_(computer_science)) boilerplate code.
5. `pyodide-packages.zip`: This is a ZIP file with all the important python scripts from the `/pyodide/{mung,mstudio}` folders. It's created by Parcel during bundling. The web worker code downloads it when initializing pyodide and loads it into the pyodide's internal file system into the working directory. This makes it `import`-able inside of python snippets run via the mentioned `executePython` method.

> **Node:** The rest of this documentation page contains obscure details about this specific usage of pyodide. It's best if you read from the pyodide docs about how to do the usual stuff. Especially have a look at how [data is translated](https://pyodide.org/en/stable/usage/type-conversions.html#explicit-conversion-of-proxies) between Python and Javascript, since you need to know that if you plan on extending the API surface of the `PythonRuntime` service.


## Pyodide Runtime and Parcel

It was painful getting Parcel to work with Pyodide well. Pyodide docs mention how to work with bundlers like Vite and Webpack, but not Parcel. Parcel kept trying to interpret Pyodide's calls for fetching the webassembly 300MB bundle as imports that it should bundle somehow and the only way to force it to give up was to just fetch the whole pyodide at runtime via the [`importScripts`](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts) function (this function is the equivalent of creating a `<script>` DOM element and adding it to the document to load a custom script, except, there is no DOM in a Web Worker so we have this instead). The `npm` package `pyodide` is only used for typescript definition files because its `loadPyodide` function did not work with Parcel. Moreover, these type definitions cannot be used inside the web worker, because they can only be imported in Web Worker `module` mode, but then Parcel steps in and breaks everything. So instead, the Web Worker is in the `classic` mode where Parcel ignores it, but we have no types and have to use the old-school `importScripts` method. But since all the pyodide magic is forever locked up inside the web worker, that code cannot grow much anyways, so we can do without types. So in the end the `npm` package `pyodide` is really only used to get the pyodide version, so that it's synced with the version in the `package.json` file. I tell you this whole story to repel you from trying to fix this. I've lost 2 days on this. If it ain't broke, don't fix it! (-- Jirka Mayer)


## Custom python code in pyodide, via Parcel

Pyodide comes with almost the entire python standard library, as well as some [additional well-known packages](https://pyodide.org/en/stable/usage/packages-in-pyodide.html), such as `numpy` and `opencv-python`. These just must be manually loaded after startup so that they are available (this takes a few seconds).

Pyodide provides a number of ways for importing your own scripts, ranging from `micropip` to installing custom `.whl` files. I decided to keep it simple:

Pyodide includes its own virtual in-memory file system. The python running in pyodide is in some working directly. We can place python files and packages directly into this working directory and this will make them `import`-able from python scripts (this is the same way python works as REPL in a terminal). The web worker is set up to download a zip file with these files and folders and extract them directly into the pyodide's working directory.

Thie ZIP file is called `pyodide-packages.zip` (well, without the extension to be pedantic) and is present in the `/dist` folder to be served by the http server. It is created by parcel.

I've created two parcel plugins, which are located in the `/packages` folder. They are `parcel-transformer-ms` and `parcel-packager-ms`. The `ms` stands for MuNG Studio. Each of these packages may contain many plugins, but the `pyodide.js` plugins is what interests us here. The `.parcelrc` file instructs parcel to pass the `pyodide-packages` dummy file (which is at `/pyodide/pyodide-packages`) through the custom transformer and packager. The transformer plugin does nothing to the file, it just registers all `.py` files in the `/pyodide` folder as dependencies, so that Parcel re-bundles the ZIP file whenever these files change. The packager plugin then picks out specific files and folders and creates the ZIP archive itself (it ignores some files that are listed as dependencies by the transformer, but that's ok; it's not a perfect plugin, but it does the job).

> **Node:** In the `.parcelrc` file, there's also this line: `"*.{zip,py}": ["@parcel/transformer-raw"],`. It must be present for some reason. I guess because the `.py` files are listed as dependencies and the `.zip` file is bundled and Paracel does not know what to do with these file extensions by default. So telling it to use the RAW transformer (i.e. copy as-is) calms it. But this RAW transformer is not used anyways (I think), since our packager completely skips the default Parcel pipeline and just directly builds the ZIP archive (skips those optimizers and bundlers and stuff).

To trigger all of this beaviour, Parcel needs a "source file" that will be compiled to become this ZIP archive. The file is the `/pyodide/pyodide-packages` file and we've registered our custom transformer and packager to apply to it. We just need to reference *it* from the rest of our application. We do this in the `PyodideWorkerConnection` by creating a URL reference:

```js
const url = new URL("./pyodide-packages", import.meta.url);
```

The `import.meta.url` bit tells Parcel that this is not just a plain URL consturctor, this is in-fact an asset reference that needs to be further bundled with the app. This line triggers the Parcel machinery and the URL will be replaced with a URL pointing to the compiled zip archive (e.g. `https://localhost:1234/pyodide-packages.50fc956a.pyodide-packages`).
