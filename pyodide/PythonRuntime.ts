import { version as pyodideVersion, PyodideInterface } from "pyodide";
import { PyProxy } from "pyodide/ffi";

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
    this.worker = new Worker(
      new URL("./pyodide-web-worker.ts", import.meta.url),
    );
    const pyodidePackagesUrl = new URL(
      "./pyodide-packages",
      import.meta.url,
    ).toString();

    this.worker.onmessage = this.onWorkerMessage.bind(this);

    this.worker.postMessage(["initialize", pyodideVersion, pyodidePackagesUrl]);
  }

  private worker: Worker;

  private pendingPythonInvocations = new Map<
    number,
    (isSuccess: boolean, resultOrError: any) => void
  >();

  private nextInvocationId: number = 0;

  private async onWorkerMessage(e: MessageEvent) {
    const messageName = String(e.data[0]);
    const messageArgs = (e.data as any[]).slice(1) as any[];

    if (messageName === "initialized") {
      this.onInitialized.call(this, ...messageArgs);
    } else if (messageName === "executedPython") {
      this.onExecutedPython.call(this, ...messageArgs);
    } else {
      console.error("Pyodide worker sent an unknown message", event);
    }
  }

  private async onInitialized() {
    // TODO: fire some event that we're ready to be used or something...

    // TODO: call some python
    // const response = await this.executePython(`5`, {});

    // provide python access to the developer
    window["executePython"] = this.executePython.bind(this);
  }

  private onExecutedPython(
    executionId: number,
    isSuccess: boolean,
    resultOrError: any,
  ) {
    const finalizer = this.pendingPythonInvocations.get(executionId);

    if (finalizer === undefined) {
      console.error(
        `Received pyodide execution response ${executionId} which is ` +
          `not in pending invocations dictionary`,
      );
      return;
    }

    this.pendingPythonInvocations.delete(executionId);

    finalizer(isSuccess, resultOrError);
  }

  /**
   * Executes pyton code asynchronously in the pyodide runtime.
   * @param pythonCode The python code to execute.
   * @param context Global variables to be set for the script.
   * @returns A PyProxy object. You MUST manually dispose of this object!
   */
  public executePython(pythonCode: string, context?: object) {
    const executionId = this.nextInvocationId;
    this.nextInvocationId += 1;

    return new Promise<PyProxy>((resolve, reject) => {
      // register a finalizer
      this.pendingPythonInvocations.set(
        executionId,
        (isSuccess: boolean, resultOrError: any) => {
          if (isSuccess) {
            resolve(resultOrError);
          } else {
            reject(resultOrError);
          }
        },
      );

      // send the request to the worker
      this.worker.postMessage([
        "executePython",
        executionId,
        pythonCode,
        context || {},
      ]);
    });
  }
}
