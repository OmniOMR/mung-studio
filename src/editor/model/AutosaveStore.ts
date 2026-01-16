import { NotationGraphStore } from "./notation-graph-store/NotationGraphStore";
import { Atom, atom, getDefaultStore, PrimitiveAtom } from "jotai";
import { JotaiStore } from "./JotaiStore";

/**
 * Type signature for the "save" method that is called back
 * by the autosave store during saving
 */
export type SaveCallback = () => Promise<void>;

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
    this.jotaiStore.set(this.hasProblemsBaseAtom, false);
  }

  /**
   * This method is called when autosaving fires
   */
  private async triggerAutosave() {
    try {
      // run the saving procedure
      await this.saveCallback?.();
    } catch (e) {
      // if there's an error, retry in some time
      // and return since we have not succeeded in saving
      this.scheduleAutosave();
      console.error("Autosave failed, retrying:", e);
      this.jotaiStore.set(this.hasProblemsBaseAtom, true);
      return;
    }

    // the saving succeeded, we are saved now
    this.setClean();
  }

  //////////////
  // Callback //
  //////////////

  /**
   * The callback that must be set from the outside and it performs
   * the saving action asynchronously.
   */
  public saveCallback: SaveCallback | null = null;

  ///////////
  // React //
  ///////////

  private isDirtyBaseAtom: PrimitiveAtom<boolean> = atom<boolean>(false);

  /**
   * You can observe this atom to inform the user about the autosave state.
   * When dirty, there are unsaved changes and autosave is scheduled.
   */
  public isDirtyAtom: Atom<boolean> = atom((get) => get(this.isDirtyBaseAtom));

  private hasProblemsBaseAtom: PrimitiveAtom<boolean> = atom<boolean>(false);

  /**
   * If the last save failed with exception and now we're retrying,
   * this atom becomes true. Happens during loss of internet connection.
   */
  public hasProblemsAtom: Atom<boolean> = atom((get) =>
    get(this.hasProblemsBaseAtom),
  );

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
