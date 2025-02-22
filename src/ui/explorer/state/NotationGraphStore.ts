import { Atom, atom, PrimitiveAtom } from "jotai";
import { Node } from "../../../mung/Node";

/**
 * Stores the Music Notation Graph state
 */
export class NotationGraphStore {
  constructor(nodes: Node[]) {
    this.nodeAtoms = new Map<number, PrimitiveAtom<Node>>();
    for (const node of nodes) {
      this.nodeAtoms.set(node.id, atom<Node>(node));
    }

    this.nodeListBaseAtom = atom<number[]>(
      nodes.map((node) => node.id).sort((a, b) => a - b),
    );

    this.classNamesBaseAtom = atom<Set<string>>(
      new Set<string>(nodes.map((node) => node.className)),
    );
  }

  //////////////////////
  // Vertices (Nodes) //
  //////////////////////

  /**
   * Holds the state of all MuNG nodes, each in one atom to make them
   * independent (when one changes, only its components are re-rendered)
   */
  private readonly nodeAtoms: Map<number, PrimitiveAtom<Node>>;

  /**
   * Holds the list of node IDs. Used by code that renders all the nodes
   * in some loop, to get handle on the list of nodes. Is a duplicite
   * value, ground truth is the nodeAtoms keys list.
   */
  private readonly nodeListBaseAtom: PrimitiveAtom<number[]>;

  /**
   * Read-only atom that exposes the list of existing node IDs
   */
  public readonly nodeListAtom: Atom<number[]> = atom((get) =>
    get(this.nodeListBaseAtom),
  );

  public getNodeAtom(nodeId: number): PrimitiveAtom<Node> {
    const nodeAtom = this.nodeAtoms.get(nodeId);

    if (nodeAtom === undefined) {
      throw new Error("Requested node ID does not exist");
    }

    return nodeAtom;
  }

  ///////////////////
  // Edges (Links) //
  ///////////////////

  /////////////////
  // Class Names //
  /////////////////

  /**
   * Stores the set of all known class names
   */
  private readonly classNamesBaseAtom: PrimitiveAtom<Set<string>>;

  /**
   * Read-only atom that exposes the list of known class names
   */
  public readonly classNamesAtom: Atom<string[]> = atom((get) =>
    [...get(this.classNamesBaseAtom)].sort(),
  );
}
