import { atom, getDefaultStore } from "jotai";
import { Node } from "../../../mung/Node";
import { SignalAtomWrapper } from "../SignalAtomWrapper";
import { NodeCollection, NodeUpdateMetadata } from "./NodeCollection";
import { JotaiStore } from "../JotaiStore";
import { classNameZIndex } from "../../../mung/classNameZIndex";

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

  private idsSignalAtom = new SignalAtomWrapper();
  private nodesSignalAtom = new SignalAtomWrapper();

  // the primary datastructure behind the index,
  // mutable and never exposed. Insert-sort into this structure.
  private _orderedMutableNodes: Node[] = [];

  private _nodes: readonly Node[] = [];
  private _nodeIds: readonly number[] = [];

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
    this.nodesSignalAtom.subscribe(get);
    return this.nodesInSceneOrder;
  });

  /**
   * Read-only atom that exposes node IDs sorted in the scene order
   */
  public readonly nodeIdsInSceneOrderAtom = atom<readonly number[]>((get) => {
    this.idsSignalAtom.subscribe(get);
    return this.nodeIdsInSceneOrder;
  });

  constructor(
    nodeCollection: NodeCollection,
    jotaiStore: JotaiStore | null = null,
  ) {
    this.jotaiStore = jotaiStore || getDefaultStore();
    this.nodeCollection = nodeCollection;

    nodeCollection.onNodeInserted.subscribe(this.onNodeInserted.bind(this));
    nodeCollection.onNodeUpdatedOrLinked.subscribe(
      this.onNodeUpdatedOrLinked.bind(this),
    );
    nodeCollection.onNodeRemoved.subscribe(this.onNodeRemoved.bind(this));
  }

  private onNodeInserted(node: Node) {
    this._orderedMutableNodes.push(node);
    this._orderedMutableNodes.sort(nodeComparator);
    this.rebuildSecondaryStructures(true);
  }

  private onNodeUpdatedOrLinked(e: NodeUpdateMetadata) {
    // determine whether the update causes a re-ordering or not
    // (if the properties by which we sort have been changed)
    let mayAffectOrdering = (
      e.newValue.className !== e.oldValue.className ||
      e.newValue.width !== e.oldValue.width ||
      e.newValue.height !== e.oldValue.height
    );

    // find the node that was updated
    for (let i = 0; i < this._orderedMutableNodes.length; i++) {
      if (this._orderedMutableNodes[i].id !== e.nodeId) continue;

      // update the node in the ordered index
      this._orderedMutableNodes[i] = e.newValue;

      // sort nodes
      if (mayAffectOrdering) {
        this._orderedMutableNodes.sort(nodeComparator);
      }

      this.rebuildSecondaryStructures(mayAffectOrdering);
      return;
    }
    throw new Error("Node was updated that is not present in the index.");
  }

  private onNodeRemoved(node: Node) {
    let index = -1;
    for (let i = 0; i < this._orderedMutableNodes.length; i++) {
      if (this._orderedMutableNodes[i].id !== node.id) continue;
      index = i;
      break;
    }

    if (index === -1) {
      throw new Error("Node was removed that is not present in the index.");
    }

    this._orderedMutableNodes.splice(index, 1);
    // (no need to sort)
    this.rebuildSecondaryStructures(true);
  }

  private rebuildSecondaryStructures(orderHasChanged: boolean) {
    // update structures
    this._nodes = [...this._orderedMutableNodes];
    if (orderHasChanged) {
      this._nodeIds = this._orderedMutableNodes.map((node) => node.id);
    }

    // notify react stuff
    this.nodesSignalAtom.signal(this.jotaiStore.set);
    if (orderHasChanged) {
      this.idsSignalAtom.signal(this.jotaiStore.set);
    }
  }
}
