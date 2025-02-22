import { atom, PrimitiveAtom, WritableAtom } from "jotai";
import { NotationGraphStore } from "./NotationGraphStore";

/**
 * Contains atoms that track the selected node
 */
export class SelectedNodeStore {
  /**
   * Reference to the notation graph
   */
  private readonly notationGraphStore: NotationGraphStore;

  constructor(notationGraphStore: NotationGraphStore) {
    this.notationGraphStore = notationGraphStore;
  }

  ////////////////////
  // SelectedNodeId //
  ////////////////////

  /**
   * The base atom storing the selected node ID, the only ground-truth value
   * in this whole system. Everything else is a cached copy.
   */
  private readonly selectedNodeIdBaseAtom = atom<number | null>(null);

  /**
   * The public atom that appears to be the one storing the selected node ID
   */
  public selectedNodeIdAtom = atom(
    (get) => get(this.selectedNodeIdBaseAtom),
    (get, set, newValue: number | null) => {
      const oldValue = get(this.selectedNodeIdBaseAtom);

      // set the old selected node to false, unless it was null
      if (oldValue !== null) {
        set(this.getNodeIsSelectedBaseAtom(oldValue), false);
      }

      // set the base atom
      set(this.selectedNodeIdBaseAtom, newValue);

      // set the new selected node to true, unless it's null
      if (newValue !== null) {
        set(this.getNodeIsSelectedBaseAtom(newValue), true);
      }
    },
  );

  /**
   * Exposes the selected node or null
   */
  public readonly selectedNodeAtom = atom((get) => {
    const nodeId = get(this.selectedNodeIdAtom);
    if (nodeId === null) return null;
    return get(this.notationGraphStore.getNodeAtom(nodeId));
  });

  /////////////////////////////////
  // NodeIsSelected (base atoms) //
  /////////////////////////////////

  /**
   * Simple boolean atoms, one for each node ID, storing the information,
   * whether the given node is selected. The non-base variants of these atoms
   * need to depend on these, rather then the selectedNodeIdBaseAtom to prevent
   * refresh cascade to all of the fields, but only to the two affected.
   */
  private nodeIsSelectedBaseAtoms = new Map<number, PrimitiveAtom<boolean>>();

  private getNodeIsSelectedBaseAtom(nodeId: number): PrimitiveAtom<boolean> {
    if (!this.nodeIsSelectedBaseAtoms.has(nodeId)) {
      this.nodeIsSelectedBaseAtoms.set(nodeId, atom<boolean>(false));
    }

    return this.nodeIsSelectedBaseAtoms.get(nodeId)!;
  }

  ///////////////////////////////////
  // NodeIsSelected (public atoms) //
  //////////////////////////////////

  private nodeIsSelectedAtoms = new Map<
    number,
    WritableAtom<boolean, [newValue: boolean], void>
  >();

  public getNodeIsSelectedAtom(
    nodeId: number,
  ): WritableAtom<boolean, [newValue: boolean], void> {
    if (!this.nodeIsSelectedAtoms.has(nodeId)) {
      this.nodeIsSelectedAtoms.set(
        nodeId,
        atom(
          (get) => get(this.getNodeIsSelectedBaseAtom(nodeId)),
          (get, set, newValue: boolean) => {
            const selectedNodeId = get(this.selectedNodeIdBaseAtom);

            // we want to become selected and we are not currently
            if (newValue === true && selectedNodeId !== nodeId) {
              set(this.selectedNodeIdAtom, nodeId);
            }

            // we want to unselect ourselves and we are selected
            if (newValue === false && selectedNodeId == nodeId) {
              set(this.selectedNodeIdAtom, null);
            }

            // Anything else is selecting ourselves when we already are
            // or deselecting ourselves, when we already are.
            // In either case do nothing.
          },
        ),
      );
    }

    return this.nodeIsSelectedAtoms.get(nodeId)!;
  }
}
