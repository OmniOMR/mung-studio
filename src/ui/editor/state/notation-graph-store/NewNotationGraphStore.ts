import { Atom } from "jotai";
import { NodeCollection } from "./NodeCollection";

/**
 * Stores the Music Notation Graph (MuNG) data and provides convenient
 * access to React and vanilla javascript for both ease of use and performance.
 */
export class NewNotationGraphStore {
  /**
   * The ground-truth data layer.
   * Contains a list of nodes analogous to the mung XML file.
   */
  private nodeCollection: NodeCollection;

  constructor() {
    this.nodeCollection = new NodeCollection();
  }

  //////////////////////////
  // Javascript Nodes API //
  //////////////////////////

  /**
   * Read-only view of all nodes in the graph
   */
  public get nodes(): Node[] {
    throw Error("TODO: Not Implemented");
  }

  /**
   * Sets all nodes (and thus also links) in the store,
   * completely overwriting its current contents.
   */
  public setAllNodes(nodes: Node[]) {
    throw Error("TODO: Not Implemented");
  }

  /////////////////////
  // React Nodes API //
  /////////////////////

  /**
   * Read-only atom that exposes the list of existing node IDs
   */
  public readonly nodeIdsAtom: Atom<number[]> = null;

  /**
   * Returns writable atom that provides access to the state of a single node.
   * The requested nodeId must exist already. Modifications to node ID or
   * edges are not allowed via this atom.
   */
  public getNodeAtom(nodeId: number): PrimitiveAtom<Node> {
    throw Error("TODO: Not Implemented");
  }

  //////////////////////////
  // Javascript Links API //
  //////////////////////////

  /////////////////////
  // React Links API //
  /////////////////////
}
