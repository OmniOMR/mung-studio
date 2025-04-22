import { atom, getDefaultStore } from "jotai";
import { Node } from "../../../../mung/Node";
import { SignalAtomWrapper } from "../SignalAtomWrapper";
import { NodeCollection } from "./NodeCollection";
import { JotaiStore } from "../JotaiStore";
import { classNameZIndex } from "../../../../mung/classNameZIndex";

/**
 * Sorts from smallest to largest (ascending order).
 * The first nodes are those that are most "behind" other nodes in the scene,
 * last nodes are those that are the most "on top" of other nodes.
 * It aligns with the draw order.
 *
 * Returns negative when a<b, zero when a=b, and positive when a>b.
 */
function nodeComparator(a: Node, b: Node): number {
  const classDelta =
    classNameZIndex(a.className) - classNameZIndex(b.className);
  if (classDelta !== 0) return classDelta;

  // if the same class, then have the smaller nodes be more on-top
  return b.width * b.height - a.width * a.height;
}

/**
 * Keeps a synchronized list of nodes, in which they are ordered by their
 * scene order (defined by class name). Used for rendering and
 * pointer interactions.
 */
export class SceneOrderedNodesIndex {
  private jotaiStore: JotaiStore;
  private nodeCollection: NodeCollection;

  private signalAtom = new SignalAtomWrapper();

  private _nodes: readonly Node[];
  private _nodeIds: readonly number[];

  /**
   * Returns nodes sorted in the scene order
   */
  public get nodesInSceneOrder(): readonly Node[] {
    return this._nodes;
  }

  /**
   * Returns node IDs in the scene order
   */
  public get nodeIdsInSceneOrder(): readonly number[] {
    return this._nodeIds;
  }

  /**
   * Read-only atom that exposes nodes sorted in the scene order
   */
  public readonly nodesInSceneOrderAtom = atom<readonly Node[]>((get) => {
    this.signalAtom.subscribe(get);
    return this.nodesInSceneOrder;
  });

  /**
   * Read-only atom that exposes node IDs sorted in the scene order
   */
  public readonly nodeIdsInSceneOrderAtom = atom<readonly number[]>((get) => {
    this.signalAtom.subscribe(get);
    return this.nodeIdsInSceneOrder;
  });

  constructor(
    nodeCollection: NodeCollection,
    jotaiStore: JotaiStore | null = null,
  ) {
    this.jotaiStore = jotaiStore || getDefaultStore();
    this.nodeCollection = nodeCollection;

    nodeCollection.onNodeInserted.subscribe(this.rebuildIndex.bind(this));
    nodeCollection.onNodeUpdatedOrLinked.subscribe(
      this.rebuildIndex.bind(this),
    );
    nodeCollection.onNodeRemoved.subscribe(this.rebuildIndex.bind(this));
  }

  private rebuildIndex() {
    // compute the new list
    const nodes = [...this.nodeCollection.getAllNodes()];
    nodes.sort(nodeComparator);
    // TODO: this sorting is slow during page load, as many nodes are inserted.
    // This class should be updated to have a mutable array in its core from
    // which snapshot copies are being made. Then insertion sort should be
    // used to modify the underlying array.

    // update state
    this._nodes = nodes;
    this._nodeIds = nodes.map((node) => node.id);

    // notify react stuff
    this.signalAtom.signal(this.jotaiStore.set);
  }
}
