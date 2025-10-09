import { atom, getDefaultStore, WritableAtom } from "jotai";
import { NotationGraphStore } from "./notation-graph-store/NotationGraphStore";
import { SignalAtomWrapper } from "./SignalAtomWrapper";
import { SignalAtomCollection } from "./SignalAtomCollection";
import { ISimpleEvent, SimpleEventDispatcher } from "strongly-typed-events";

/**
 * Class names that should be hidden in the default visibility state.
 * Those not listed here are visible by default.
 */
export const DEFAULT_HIDDEN_CLASSES = new Set([
  "staffLine",
  "staffSpace",
  "staff",
]);

/**
 * Classes that should be visible when doing precedence link annotation
 */
export const PRECEDENCE_LINK_ANNOTATION_CLASSES = new Set([
  // https://muscimarker.readthedocs.io/en/latest/instructions.html#precedence-relationships
  // links go between noteheads and rests

  // noteheads
  "noteheadDoubleWhole",
  "noteheadDoubleWholeSquare",
  "noteheadWhole",
  "noteheadHalf",
  "noteheadBlack",
  "noteheadFull",
  "noteheadXBlack",
  "noteheadXOrnate",
  "noteheadSlashVerticalEnds",
  "noteheadSlashHorizontalEnds",
  "noteheadSlashWhiteWhole",
  "noteheadSlashWhiteHalf",

  // rests
  "multiMeasureRest",
  "restMaxima",
  "restLonga",
  "restDoubleWhole",
  "restBreve",
  "restWhole",
  "restSemibreve",
  "restHalf",
  "restMinim",
  "restQuarter",
  "restCrotchet",
  "rest8th",
  "restQuaver",
  "rest16th",
  "restSemiquaver",
  "rest32nd",
  "restDemisemiquaver",
  "rest64th",
  "rest128th",
  "rest256th",
  "rest512th",
  "rest1024th",
  "restHBar",
  "restDoubleWholeLegerLine",
  "restWholeLegerLine",
  "restHalfLegerLine",

  // bar repeats
  "repeat1Bar",
  "repeat2Bar",
  "repeat4Bar",
]);

/**
 * Classes that should be visible when doing staff link annotation
 */
export const STAFF_LINK_ANNOTATION_CLASSES = new Set([
  // see MUSCIMA++ 2.0 "mff-muscima-mlclasses-annot.deprules" file,
  // which classes can be attached to the "staff" class,
  // plus noteheads and rests

  // clefs
  "gClef",
  "cClef",
  "fClef",
  "cClefSquare",
  "unpitchedPercussionClef1",
  "unpitchedPercussionClef2",
  "semipitchedPercussionClef1",
  "semipitchedPercussionClef2",
  "6stringTabClef",
  "4stringTabClef",
  "gClefChange",
  "cClefChange",
  "fClefChange",
  "clef8",
  "clef15",

  // signatures
  "keySignature",
  "timeSignature",

  // bralines & brackets
  "measureSeparator",
  "staffGrouping",

  // noteheads
  "noteheadDoubleWhole",
  "noteheadDoubleWholeSquare",
  "noteheadWhole",
  "noteheadHalf",
  "noteheadBlack",
  "noteheadFull",
  "noteheadXBlack",
  "noteheadXOrnate",
  "noteheadSlashVerticalEnds",
  "noteheadSlashHorizontalEnds",
  "noteheadSlashWhiteWhole",
  "noteheadSlashWhiteHalf",

  // rests
  "multiMeasureRest",
  "restMaxima",
  "restLonga",
  "restDoubleWhole",
  "restWhole",
  "restHalf",
  "restQuarter",
  "rest8th",
  "rest16th",
  "rest32nd",
  "rest64th",
  "rest128th",
  "rest256th",
  "rest512th",
  "rest1024th",
  "restHBar",
  "restDoubleWholeLegerLine",
  "restWholeLegerLine",
  "restHalfLegerLine",
  "repeat1Bar",
]);

export class ClassVisibilityStore {
  /**
   * Jotai store used to access atoms from plain JS
   */
  private readonly jotaiStore = getDefaultStore();

  private readonly notationGraphStore: NotationGraphStore;

  constructor(notationGraphStore: NotationGraphStore) {
    this.notationGraphStore = notationGraphStore;

    this.notationGraphStore.onClassNameCountsChange.subscribe(
      this.onClassNamesCountsChange.bind(this),
    );
  }

  private onClassNamesCountsChange() {
    for (const className of this.notationGraphStore.classNames) {
      this.ensureHasClass(className);
    }
  }

  ///////////
  // State //
  ///////////

  // holds true data, must be completely replaced when mutated
  // because it might be used by react for re-drawing UI
  //
  // Class names that are not present in either of these are assumed to be
  // new, unknown classes which default to the visibility state of the
  // DEFAULT_HIDDEN_CLASSES constant. The union of these two sets should
  // match (or be a super set) of class names in the graph.
  private _visibleClasses: ReadonlySet<string> = new Set<string>();
  private _hiddenClasses: ReadonlySet<string> = new Set<string>();

  /**
   * Returns the set of visible class names
   */
  public get visibleClasses(): ReadonlySet<string> {
    return this._visibleClasses;
  }

  /**
   * Returns the set of hidden class names
   */
  public get hiddenClasses(): ReadonlySet<string> {
    return this._hiddenClasses;
  }

  /**
   * Makes sure that the given class name is present in one of the two sets.
   * If already present, does nothing. Uses the DEFAULT_HIDDEN_CLASSES to set
   * the visibility of the class.
   */
  private ensureHasClass(className: string) {
    if (
      this._visibleClasses.has(className) ||
      this._hiddenClasses.has(className)
    ) {
      return;
    }

    // modify state
    if (DEFAULT_HIDDEN_CLASSES.has(className)) {
      this._hiddenClasses = new Set<string>([
        ...this._hiddenClasses,
        className,
      ]);
    } else {
      this._visibleClasses = new Set<string>([
        ...this._visibleClasses,
        className,
      ]);
    }

    // broadcast change
    this._onChange.dispatch([className]);
    this.globalSignalAtom.signal(this.jotaiStore.set);
    this.classSignalAtoms.get(className).signal(this.jotaiStore.set);
  }

  /**
   * Sets visibility of a class name
   */
  public setClassVisibility(className: string, isVisible: boolean) {
    if (isVisible && this._visibleClasses.has(className)) return;
    if (!isVisible && this._hiddenClasses.has(className)) return;

    // change state
    const newVisibleClasses = new Set<string>(this._visibleClasses);
    const newHiddenClasses = new Set<string>(this._hiddenClasses);
    if (isVisible) {
      newVisibleClasses.add(className);
      newHiddenClasses.delete(className);
    } else {
      newVisibleClasses.delete(className);
      newHiddenClasses.add(className);
    }
    this._visibleClasses = newVisibleClasses;
    this._hiddenClasses = newHiddenClasses;

    // broadcast change
    this._onChange.dispatch([className]);
    this.globalSignalAtom.signal(this.jotaiStore.set);
    this.classSignalAtoms.get(className).signal(this.jotaiStore.set);
  }

  /**
   * Sets all classes to hidden
   */
  public hideAllClasses() {
    // change state
    this._visibleClasses = new Set<string>([]);
    this._hiddenClasses = new Set<string>(this.notationGraphStore.classNames);

    // broadcast change
    this._onChange.dispatch(this.notationGraphStore.classNames);
    this.globalSignalAtom.signal(this.jotaiStore.set);
    for (const className of this.notationGraphStore.classNames) {
      this.classSignalAtoms.get(className).signal(this.jotaiStore.set);
    }
  }

  /**
   * Sets all classes to visible
   */
  public showAllClasses() {
    // change state
    this._visibleClasses = new Set<string>(this.notationGraphStore.classNames);
    this._hiddenClasses = new Set<string>([]);

    // broadcast change
    this._onChange.dispatch(this.notationGraphStore.classNames);
    this.globalSignalAtom.signal(this.jotaiStore.set);
    for (const className of this.notationGraphStore.classNames) {
      this.classSignalAtoms.get(className).signal(this.jotaiStore.set);
    }
  }

  /**
   * Shows only listed classes and sets others to hidden
   */
  public showOnlyTheseClasses(classNames: Iterable<string>) {
    // change state
    this._visibleClasses = new Set<string>(classNames);
    this._hiddenClasses = new Set<string>(
      this.notationGraphStore.classNames.filter(
        (className) => !this._visibleClasses.has(className),
      ),
    );

    // broadcast change
    this._onChange.dispatch(this.notationGraphStore.classNames);
    this.globalSignalAtom.signal(this.jotaiStore.set);
    for (const className of this.notationGraphStore.classNames) {
      this.classSignalAtoms.get(className).signal(this.jotaiStore.set);
    }
  }

  /**
   * Hides only listed classes and sets others to visible
   */
  public hideOnlyTheseClasses(classNames: Iterable<string>) {
    // change state
    this._hiddenClasses = new Set<string>(classNames);
    this._visibleClasses = new Set<string>(
      this.notationGraphStore.classNames.filter(
        (className) => !this._hiddenClasses.has(className),
      ),
    );

    // broadcast change
    this._onChange.dispatch(this.notationGraphStore.classNames);
    this.globalSignalAtom.signal(this.jotaiStore.set);
    for (const className of this.notationGraphStore.classNames) {
      this.classSignalAtoms.get(className).signal(this.jotaiStore.set);
    }
  }

  ///////////////////////
  // React integration //
  ///////////////////////

  private readonly globalSignalAtom = new SignalAtomWrapper();
  private readonly classSignalAtoms = new SignalAtomCollection<string>();

  private isClassVisibleAtoms = new Map<
    string,
    WritableAtom<boolean, [boolean], void>
  >();

  /**
   * Writable atom that exposes and lets you modify the visibility
   * of a single class
   */
  public getIsClassVisibleAtom(
    className: string,
  ): WritableAtom<boolean, [boolean], void> {
    this.ensureHasClass(className);

    if (!this.isClassVisibleAtoms.has(className)) {
      this.isClassVisibleAtoms.set(
        className,
        atom(
          (get) => {
            this.classSignalAtoms.get(className).subscribe(get);
            return this.visibleClasses.has(className);
          },
          (get, set, newValue) => {
            this.setClassVisibility(className, newValue);
          },
        ),
      );
    }

    return this.isClassVisibleAtoms.get(className)!;
  }

  ////////////
  // Events //
  ////////////

  private _onChange = new SimpleEventDispatcher<readonly string[]>();

  /**
   * Fires once when the class visibility store is updated.
   * The list of affected class names is provided as the argument
   * to the event handler. To check the current visibility state
   * of a class, test its presence in one of the two exposed sets.
   */
  public get onChange(): ISimpleEvent<readonly string[]> {
    return this._onChange.asEvent();
  }
}
