import { ISignal, SignalDispatcher } from "strongly-typed-events";
import { NodeCollection } from "./NodeCollection";

export type ClassNameCounts = { readonly [className: string]: number };

/**
 * Keeps track of all node class names in the graph
 */
export class ClassNamesIndex {
  /**
   * How many occurences there are for each known class name
   * (how many nodes have this class name)
   */
  private occurenceCounts: Map<string, number> = new Map();

  /**
   * Immutable object holding counts for various class names
   */
  private classNameCounts: ClassNameCounts = {};

  /**
   * Immutable array of class names, sorted alphabetically
   */
  private classNames: string[] = [];

  constructor(nodeCollection: NodeCollection) {
    nodeCollection.onNodeInserted.subscribe((node) => {
      this.occurenceWasCreated(node.className);
    });

    nodeCollection.onNodeRemoved.subscribe((node) => {
      this.occurenceWasDestroyed(node.className);
    });

    nodeCollection.onNodeUpdatedOrLinked.subscribe((meta) => {
      if (meta.isLinkUpdate) return;
      if (meta.oldValue.className === meta.newValue.className) return;
      this.occurenceWasDestroyed(meta.oldValue.className);
      this.occurenceWasCreated(meta.newValue.className);
    });
  }

  /**
   * Returns all existing class names, sorted.
   * This method is fast.
   */
  public getClassNames(): readonly string[] {
    return this.classNames;
  }

  /**
   * Returns precise class name counts as a POJO.
   * This method is fast. The returned object is immutable.
   */
  public getClassNameCounts(): ClassNameCounts {
    return this.classNameCounts;
  }

  private occurenceWasCreated(className: string) {
    const oldCount = this.occurenceCounts.get(className) ?? 0;
    this.occurenceCounts.set(className, oldCount + 1);

    // update cached state
    if (oldCount === 0) {
      this.recomputeClassNames();
    }
    this.recomputeClassNameCounts();

    // fire events
    this._onChange.dispatch();
  }

  private occurenceWasDestroyed(className: string) {
    const oldCount = this.occurenceCounts.get(className) ?? 0;
    if (oldCount > 1) {
      this.occurenceCounts.set(className, oldCount - 1);
    } else {
      this.occurenceCounts.delete(className);
    }

    // update cached state
    if (oldCount === 1) {
      this.recomputeClassNames();
    }
    this.recomputeClassNameCounts();

    // fire events
    this._onChange.dispatch();
  }

  private recomputeClassNameCounts() {
    let counts = {};
    this.occurenceCounts.forEach((v, k) => {
      counts[k] = v;
    });
    this.classNameCounts = counts;
  }

  private recomputeClassNames() {
    this.classNames = [...this.occurenceCounts.keys()].sort();
  }

  ////////////
  // Events //
  ////////////

  private _onChange = new SignalDispatcher();

  /**
   * Fired when anything with the class names changes (either specific counts
   * or existing values). Aligns with node insertion/removal and class changes.
   */
  public get onChange(): ISignal {
    return this._onChange.asEvent();
  }
}
