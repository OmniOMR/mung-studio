import { version as pyodideVersion, PyodideInterface } from "pyodide";
import { PyProxy } from "pyodide/ffi";

type InvocationFinalizer = (isSuccess: boolean, resultOrError: any) => void;

export type OnInitializedCallback = () => void;

/**
 * Starts up the pyodide web worker and provides low-level API
 * for communicating with it. Mainly the executePython(...) method.
 */
export class PyodideWorkerConnection {
  /**
   * The web worker instance
   */
  private worker: Worker;

  /**
   * Finalizer callbacks that should be invoked when the given python
   * invocation returns back from the worker
   */
  private pendingPythonInvocations = new Map<number, InvocationFinalizer>();

  /**
   * ID of the next python invocation
   */
  private nextInvocationId: number = 0;

  /**
   * Python execution messages wanted-to-be-sent to the worker before it
   * initialized. Will be sent to it right after the initialization completes.
   */
  private preInitInvocationMessages: any[] = [];

  /**
   * Is the worker initialized, or still starting up?
   */
  private isInitialized = false;

  /**
   * Callback to our user that should be invoked when the worker initializes
   */
  private onInitializedCallback?: OnInitializedCallback;

  /**
   * Constructing this connection object also starts up the web worker
   * and begins its initialization process
   */
  constructor(onInitializedCallback?: OnInitializedCallback) {
    // store the callback
    this.onInitializedCallback = onInitializedCallback;

    // start the worker and bind event handlers
    this.worker = new Worker(
      new URL("./pyodide-web-worker.ts", import.meta.url),
    );
    this.worker.onmessage = this.onWorkerMessage.bind(this);

    // begin worker initialization
    const pyodidePackagesUrl = new URL(
      "./pyodide-packages",
      import.meta.url,
    ).toString();
    this.worker.postMessage(["initialize", pyodideVersion, pyodidePackagesUrl]);

    // provide python access to the developer console
    window["executePython"] = this.executePython.bind(this);
  }

  /**
   * Executes pyton code asynchronously in the pyodide runtime.
   * @param pythonCode The python code to execute.
   * @param context Global variables to be set for the script.
   * @returns A primitive value or a decoded '.toJs()' PyProxy object.
   * Proxies are decoded because they cannot be sent outside the web worker.
   */
  public executePython(pythonCode: string, context?: object): Promise<any> {
    // get the next execution ID
    const executionId = this.nextInvocationId;
    this.nextInvocationId += 1;

    // build the response promise
    return new Promise<any>((resolve, reject) => {
      // create the finalizer callacbk
      const finalizer: InvocationFinalizer = (
        isSuccess: boolean,
        resultOrError: any,
      ) => {
        if (isSuccess) {
          resolve(resultOrError);
        } else {
          reject(resultOrError);
        }
      };

      // register the finalizer
      this.pendingPythonInvocations.set(executionId, finalizer);

      // build the worker message
      const message = ["executePython", executionId, pythonCode, context || {}];

      // if initialized, send the message immediately, else queue it
      if (this.isInitialized) {
        this.worker.postMessage(message);
      } else {
        this.preInitInvocationMessages.push(message);
      }
    });
  }

  /////////////////////////////
  // Worker message handling //
  /////////////////////////////

  /**
   * Called when worker sends back a message
   */
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

  /**
   * The worker is successfully initialized
   */
  private async onInitialized() {
    // update our state
    this.isInitialized = true;

    // unload queued invocation messages
    this.preInitInvocationMessages.map((m) => this.worker.postMessage(m));
    this.preInitInvocationMessages = [];

    // fire the initialization callback
    this.onInitializedCallback?.();
  }

  /**
   * The worker has finished executing a python script
   */
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
}
