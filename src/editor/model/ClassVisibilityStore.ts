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
  // https://github.com/OmniOMR/mung/blob/main/docs/annotation-instructions/annotation-instructions.md#precedence-graph

  // noteheads
  "noteheadWhole",
  "noteheadHalf",
  "noteheadBlack",
  "noteheadFull",

  // gracenote noteheads (have their own disjoint precedence graph)
  "noteheadWholeSmall",
  "noteheadHalfSmall",
  "noteheadBlackSmall",
  "noteheadFullSmall",

  // rests
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

  // bar repeats
  "repeatOneBar",
  "repeat1Bar",
  "repeat2Bar",
  "repeat4Bar",

  // custos
  "custos",

  // time signatures
  "timeSig0",
  "timeSig1",
  "timeSig2",
  "timeSig3",
  "timeSig4",
  "timeSig5",
  "timeSig6",
  "timeSig7",
  "timeSig8",
  "timeSig9",
  "timeSigSlash",
  "timeSigFractionalSlash",
  "timeSigPlus",
  "timeSigEquals",

  // lyrics
  "lyricsText",
  "lyricsUnisono",

  // dynamic marks
  "dynamicPiano",
  "dynamicMezzo",
  "dynamicForte",
  "dynamicRinforzando",
  "dynamicSforzando",
  "dynamicZ",
  "dynamicNiente",

  // tuplets
  "tuplet0",
  "tuplet1",
  "tuplet2",
  "tuplet3",
  "tuplet4",
  "tuplet5",
  "tuplet6",
  "tuplet7",
  "tuplet8",
  "tuplet9",
  "tupletColon",
]);

/**
 * Classes that should be visible when reviewing links for staves
 */
export const STAVES_REVIEW_ANNOTATION_CLASSES = new Set([
  // https://github.com/OmniOMR/mung/blob/main/docs/annotation-instructions/annotation-instructions.md#1-assignment-to-staves

  "staff",

  // noteheads
  "noteheadWhole",
  "noteheadHalf",
  "noteheadBlack",
  "noteheadFull",

  // gracenote noteheads
  "noteheadWholeSmall",
  "noteheadHalfSmall",
  "noteheadBlackSmall",
  "noteheadFullSmall",

  // rests
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

  // clefs
  "gClef",
  "cClef",
  "fClef",
  "gClefChange",
  "cClefChange",
  "fClefChange",

  // signatures
  "keySignature",
  "timeSignature",

  // bralines & brackets
  "measureSeparator",
  "staffGrouping",

  // repeats
  "repeat1Bar",

  // unisono text
  "unisonoText",
  "unisonoContinuation",

  // system divider
  "systemDivider",

  // custos
  "custos",
]);

/**
 * Classes that should be visible when reviewing links
 * for staff lines and spaces
 */
export const STAFF_LINES_SPACES_ANNOTATION_CLASSES = new Set([
  // https://github.com/OmniOMR/mung/blob/main/docs/annotation-instructions/annotation-instructions.md#2-assignment-to-stafflines-and-staffspaces

  "staffLine",
  "staffSpace",

  // noteheads
  "noteheadWhole",
  "noteheadHalf",
  "noteheadBlack",
  "noteheadFull",

  // grace noteheads
  "noteheadWholeSmall",
  "noteheadHalfSmall",
  "noteheadBlackSmall",

  // clefs
  "gClef",
  "cClef",
  "fClef",
  "gClefChange",
  "cClefChange",
  "fClefChange",

  // custos
  "custos",
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
