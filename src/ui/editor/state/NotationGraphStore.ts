import { Atom, atom, PrimitiveAtom } from "jotai";
import { Node } from "../../../mung/Node";

export interface Edge {
  readonly id: string;
  readonly fromId: number;
  readonly toId: number;
}

export interface EdgeWithNodes extends Edge {
  readonly from: Node;
  readonly to: Node;
}

export function computeEdgeId(fromId: number, toId: number): string {
  return fromId + "_" + toId;
}

/**
 * Stores the Music Notation Graph state
 */
export class NotationGraphStore {
  constructor(nodes: Node[]) {
    // === vertices ===

    this.nodeAtoms = new Map<number, PrimitiveAtom<Node>>();
    for (const node of nodes) {
      this.nodeAtoms.set(node.id, atom<Node>(node));
    }

    this.nodeListBaseAtom = atom<number[]>(
      nodes.map((node) => node.id).sort((a, b) => a - b),
    );

    // === edges ===

    const edges: Edge[] = [];

    for (const node of nodes) {
      // validate outlinks
      for (const id of node.outlinks) {
        if (!this.nodeAtoms.has(id)) {
          throw new Error(
            `Node ${node.id} has outlink to ${id} which does not exist.`,
          );
        }
      }

      // validate inlinks
      for (const id of node.inlinks) {
        if (!this.nodeAtoms.has(id)) {
          throw new Error(
            `Node ${node.id} has inlink to ${id} which does not exist.`,
          );
        }
      }

      // construct edges
      edges.push(
        ...node.outlinks.map((targetId) => ({
          id: computeEdgeId(node.id, targetId),
          fromId: node.id,
          toId: targetId,
        })),
      );
    }

    this.edgesBaseAtom = atom<Edge[]>(edges);

    this.edgeWithNodesAtoms = new Map<string, Atom<EdgeWithNodes>>();
    for (const edge of edges) {
      this.edgeWithNodesAtoms.set(
        edge.id,
        atom<EdgeWithNodes>((get) => {
          const from = get(this.nodeAtoms.get(edge.fromId)!);
          const to = get(this.nodeAtoms.get(edge.toId)!);
          return {
            ...edge,
            from,
            to,
          };
        }),
      );
    }

    // === class names ===

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

  private readonly edgesBaseAtom: PrimitiveAtom<Edge[]>;

  /**
   * Exposes the list of all edges
   */
  public readonly edgesAtom = atom((get) => get(this.edgesBaseAtom));

  private readonly edgeWithNodesAtoms: Map<string, Atom<EdgeWithNodes>>;

  public getEdgeWithNodesAtom(edge: Edge): Atom<EdgeWithNodes> {
    const edgeAtom = this.edgeWithNodesAtoms.get(edge.id);

    if (edgeAtom === undefined) {
      throw new Error("Requested edge does not exist");
    }

    return edgeAtom;
  }

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
