import { ISignal, SignalDispatcher } from "strongly-typed-events";
import { NotationGraphStore } from "./notation-graph-store/NotationGraphStore";
import { Atom, atom, getDefaultStore, PrimitiveAtom } from "jotai";
import { JotaiStore } from "./JotaiStore";

/**
 * State store that contains the state and logic related to autosave
 */
export class AutosaveStore {
  /**
   * The autosave system waits this long for inactivity to trigger the save
   */
  public static readonly AUTOSAVE_DEBOUNCE_DELAY_MS = 5_000;

  /**
   * Jotai store that holds atom values
   */
  private readonly jotaiStore: JotaiStore;

  /**
   * Reference to the notation graph
   */
  private readonly notationGraphStore: NotationGraphStore;

  constructor(
    notationGraphStore: NotationGraphStore,
    jotaiStore: JotaiStore | null = null,
  ) {
    this.notationGraphStore = notationGraphStore;
    this.jotaiStore = jotaiStore ?? getDefaultStore();

    // register to changes in the notation graph
    this.notationGraphStore.onChange.subscribe(() => this.setDirty());
  }

  /**
   * True if there are unsaved changes
   */
  public get isDirty(): boolean {
    return this.jotaiStore.get(this.isDirtyBaseAtom);
  }

  /**
   * Call this method to notify the autosave system to schedule a new save
   */
  public setDirty() {
    this.scheduleAutosave();
    this.jotaiStore.set(this.isDirtyBaseAtom, true);
  }

  /**
   * Resets the state back to clean, unscheduling any planned autosaves.
   * Call this after someone manually saves changes.
   */
  public setClean() {
    this.cancelScheduledAutosave();
    this.jotaiStore.set(this.isDirtyBaseAtom, false);
  }

  /**
   * This method is called when autosaving fires
   */
  private triggerAutosave() {
    this._onAutosave.dispatch();
    this.setClean();
  }

  ////////////
  // Events //
  ////////////

  private _onAutosave = new SignalDispatcher();

  /**
   * This event fires when autosave should be executed.
   * Subscribe to this event to run saving code.
   */
  public get onAutosave(): ISignal {
    return this._onAutosave.asEvent();
  }

  ///////////
  // React //
  ///////////

  private isDirtyBaseAtom: PrimitiveAtom<boolean> = atom<boolean>(false);

  /**
   * You can observe this atom to inform the user about the autosave state.
   * When dirty, there are unsaved changes and autosave is scheduled.
   */
  public isDirtyAtom: Atom<boolean> = atom((get) => get(this.isDirtyBaseAtom));

  /////////////////////////
  // Autosave scheduling //
  /////////////////////////

  private autosaveTimeoutId: NodeJS.Timeout | null = null;

  private scheduleAutosave() {
    this.cancelScheduledAutosave();
    this.autosaveTimeoutId = setTimeout(
      this.triggerAutosave.bind(this),
      AutosaveStore.AUTOSAVE_DEBOUNCE_DELAY_MS,
    );
  }

  private cancelScheduledAutosave() {
    if (this.autosaveTimeoutId === null) return;
    clearTimeout(this.autosaveTimeoutId);
    this.autosaveTimeoutId = null;
  }
}
