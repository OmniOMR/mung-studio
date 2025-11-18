import { atom, WritableAtom } from "jotai";
import { Node } from "../../../mung/Node";
import { NodeCollection } from "./NodeCollection";
import { SignalAtomWrapper } from "../SignalAtomWrapper";
import { JotaiStore } from "../JotaiStore";

export type NodeAtom = WritableAtom<Node, [newValue: Node], void>;

/**
 * Manages atoms for individual nodes in the graph
 */
export class NodeAtomsView {
  private nodeCollection: NodeCollection;
  private jotaiStore: JotaiStore;

  private nodeAtoms: Map<number, NodeAtom>;

  private signalAtoms: Map<number, SignalAtomWrapper>;

  constructor(nodeCollection: NodeCollection, jotaiStore: JotaiStore) {
    this.nodeCollection = nodeCollection;
    this.jotaiStore = jotaiStore;

    this.nodeAtoms = new Map();
    this.signalAtoms = new Map();

    // definitely update atoms when a node is updated
    nodeCollection.onNodeUpdatedOrLinked.subscribe((meta) => {
      this.signalNode(meta.nodeId);
    });

    // when a node is inserted, update as well, as the atom may have been
    // reqested even before the node was inserted (someone could ask for an
    // atom, then insert the node, and then consume the atom in a component)
    nodeCollection.onNodeInserted.subscribe((node) => {
      this.signalNode(node.id);
    });

    // only when a node is removed, we don't signal. Whoever is still
    // holding onto the atom will see the old value, but it will not cause
    // an error by reading the atom.
  }

  private signalNode(nodeId: number) {
    const signalAtom = this.signalAtoms.get(nodeId);
    if (signalAtom) {
      signalAtom.signal(this.jotaiStore.set);
    }
  }

  /**
   * Returns the one atom responsible for the state of a given node.
   */
  public getNodeAtom(nodeId: number): NodeAtom {
    if (!this.nodeAtoms.has(nodeId)) {
      this.createNodeAtom(nodeId);
    }
    return this.nodeAtoms.get(nodeId)!;
  }

  private createNodeAtom(nodeId: number) {
    // create a signal atom
    const signalAtom = new SignalAtomWrapper();
    this.signalAtoms.set(nodeId, signalAtom);

    // create the node atom
    this.nodeAtoms.set(
      nodeId,
      atom(
        (get) => {
          // refresh this atom when signalled
          signalAtom.subscribe(get);

          // This fails if the node does not exist, which is ok.
          // An atom for a non-existing node should not be read.
          return this.nodeCollection.getNode(nodeId);
        },
        (get, set, newValue) => {
          // This causes the node collection to emit update events, which
          // trigges the signal atom, which causes components to re-render.
          this.nodeCollection.updateNode(newValue);
        },
      ),
    );
  }
}
