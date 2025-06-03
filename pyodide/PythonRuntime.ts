import { atom, getDefaultStore } from "jotai";
import { JotaiStore } from "../src/ui/editor/state/JotaiStore";
import { PyodideWorkerConnection } from "./PyodideWorkerConnection";
import { MaskManipulationApi } from "./MaskManipulationApi";

/**
 * Provides user-level APIs for functionality that runs in the python
 * environment. If this was a backend, you could consider this service
 * as an API connection.
 *
 * It's a singleton service that is also responsible for starting up the
 * python pyodide runtime environment in a web worker, so that the UI
 * thread does not get blocked. For this reason all API calls are async.
 *
 * It also provides jotai atoms for checking its liveness status from the UI.
 */
export class PythonRuntime {
  private jotaiStore: JotaiStore;

  private readonly connection: PyodideWorkerConnection;

  private constructor() {
    this.jotaiStore = getDefaultStore();

    this.connection = new PyodideWorkerConnection(
      this.onInitialized.bind(this),
    );

    // create APIs
    this.maskManipulation = new MaskManipulationApi(this.connection);
  }

  //////////
  // APIs //
  //////////

  /**
   * Python operations for manipulating MuNG node masks
   */
  public readonly maskManipulation: MaskManipulationApi;

  // TODO: notation graph validation API

  // ...

  /////////////////////////////////
  // Worker initialization state //
  /////////////////////////////////

  private readonly isInitializedBaseAtom = atom<boolean>(false);

  /**
   * This read-only atom becomes true when the worker becomes ready.
   * API interactions before that are possible, but they will be queued and
   * wait for the initialization to complete anyways. Once the worker is
   * initialized, its response time is much faster (unless it's blocked by
   * some long-running python operation).
   */
  public readonly isInitializedAtom = atom<boolean>((get) =>
    get(this.isInitializedBaseAtom),
  );

  private _isInitialized = false;

  /**
   * Becomes true when the worker becomes ready.
   */
  public get isInitialized() {
    return this._isInitialized;
  }

  private onInitialized() {
    this._isInitialized = true;
    this.jotaiStore.set(this.isInitializedBaseAtom, true);
  }

  ///////////////////////
  // Singleton pattern //
  ///////////////////////

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
}
