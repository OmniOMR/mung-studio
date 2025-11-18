import { atom, Atom, getDefaultStore } from "jotai";
import { Link } from "../../mung/Link";
import { NotationGraphStore } from "./notation-graph-store/NotationGraphStore";
import { ISimpleEvent, SimpleEventDispatcher } from "strongly-typed-events";
import { Node } from "../../mung/Node";
import { getLinksOfNode } from "../../mung/getLinksOfNode";
import { JotaiStore } from "./JotaiStore";
import { SignalAtomCollection } from "./SignalAtomCollection";
import { getLinkId } from "../../mung/getLinkId";
import { includesLink } from "../../mung/includesLink";
import { pushLinkUnlessPresent } from "../../mung/pushLinkUnlessPresent";
import { SignalAtomWrapper } from "./SignalAtomWrapper";

/**
 * Manages selection of scene objects (nodes and links).
 *
 * The only tracked state is the set of selected nodes, via their IDs.
 * Everything else follows. A link is selected partially, if one of its nodes
 * is selected. A link is selected fully, when both nodes are selected.
 * Most operations on links require their full selection.
 */
export class SelectionStore {
  private jotaiStore: JotaiStore;
  private notationGraphStore: NotationGraphStore;

  /**
   * List of selected node IDs,
   * ground truth, lowest-level data for all selections.
   * Is immutable as it may be provided to React (the array value is immutable).
   */
  private _selectedNodeIds: readonly number[] = [];

  /**
   * Computed list of links where at least one terminal node is selected.
   */
  private _partiallySelectedLinks: readonly Link[] = [];

  /**
   * Computed list of links where both nodes are selected.
   */
  private _fullySelectedLinks: readonly Link[] = [];

  constructor(
    notationGraphStore: NotationGraphStore,
    jotaiStore: JotaiStore | null = null,
  ) {
    this.jotaiStore = jotaiStore || getDefaultStore();
    this.notationGraphStore = notationGraphStore;

    // deselect node when removed
    notationGraphStore.onNodeRemoved.subscribe((node: Node) => {
      this.deselectNode(node.id);
    });

    // update link selection when links change
    notationGraphStore.onLinkInserted.subscribe((meta) => {
      const linksChangeMetadata = this.recalculateLinkSelection();
      this.broadcastLinksChange(linksChangeMetadata);
    });
    notationGraphStore.onLinkRemoved.subscribe((meta) => {
      const linksChangeMetadata = this.recalculateLinkSelection();
      this.broadcastLinksChange(linksChangeMetadata);
    });
  }

  /**
   * This is the only method that changes the selection state. All other
   * selection-changing (convenience) methods call it. It atomically
   * changes the set of selected nodes, recalculates all relevant state,
   * triggers atom updates and emits events.
   */
  public changeSelection(newNodeSet: readonly number[]) {
    const oldNodeSet = this._selectedNodeIds;

    // compute nodes that have been newly selected
    // (in the order they have in the new selection)
    const nodeSetAdditions = newNodeSet.filter(
      (id) => !oldNodeSet.includes(id),
    );

    // compute nodes that have been de-selected
    // (in the order they had in the old selection)
    const nodeSetRemovals = oldNodeSet.filter((id) => !newNodeSet.includes(id));

    // describe the nodes change
    const nodesChangeMetadata: SelectionNodeChangeMetadata = {
      oldNodeSet,
      newNodeSet,
      nodeSetAdditions,
      nodeSetRemovals,
    };

    // update nodes state
    this._selectedNodeIds = newNodeSet;

    // update link state and produce the change metadata
    const linksChangeMetadata = this.recalculateLinkSelection();

    // broadcast changes to listeners
    this.broadcastNodesChange(nodesChangeMetadata);
    this.broadcastLinksChange(linksChangeMetadata);
  }

  private recalculateLinkSelection(): SelectionLinksChangeMetadata {
    const oldPartialLinkSet = this._partiallySelectedLinks;
    const oldFullLinkSet = this._fullySelectedLinks;

    // build up the list of current partially selected links
    const newPartialLinkSet: Link[] = [];
    for (const nodeId of this._selectedNodeIds) {
      const node = this.notationGraphStore.getNode(nodeId);
      for (const link of getLinksOfNode(node)) {
        pushLinkUnlessPresent(newPartialLinkSet, link);
      }
    }

    // build up the list of current fully selected links
    const newFullLinkSet: Link[] = newPartialLinkSet.filter(
      (link) =>
        this._selectedNodeIds.includes(link.fromId) &&
        this._selectedNodeIds.includes(link.toId),
    );

    // partial link set modifications
    const partialLinkSetAdditions = newPartialLinkSet.filter(
      (id) => !oldPartialLinkSet.includes(id),
    );
    const partialLinkSetRemovals = oldPartialLinkSet.filter(
      (id) => !newPartialLinkSet.includes(id),
    );

    // full link set modifications
    const fullLinkSetAdditions = newFullLinkSet.filter(
      (id) => !oldFullLinkSet.includes(id),
    );
    const fullLinkSetRemovals = oldFullLinkSet.filter(
      (id) => !newFullLinkSet.includes(id),
    );

    // update links state
    this._partiallySelectedLinks = newPartialLinkSet;
    this._fullySelectedLinks = newFullLinkSet;

    return {
      oldPartialLinkSet,
      newPartialLinkSet,
      partialLinkSetAdditions,
      partialLinkSetRemovals,
      oldFullLinkSet,
      newFullLinkSet,
      fullLinkSetAdditions,
      fullLinkSetRemovals,
    };
  }

  private broadcastNodesChange(meta: SelectionNodeChangeMetadata) {
    // do nothing if no real change happened
    if (
      meta.nodeSetAdditions.length === 0 &&
      meta.nodeSetRemovals.length === 0
    ) {
      return;
    }

    // trigger node signal atoms
    this.selectedNodeIdsSignalAtom.signal(this.jotaiStore.set);
    for (const nodeId of meta.nodeSetAdditions) {
      this.nodeSignalAtoms.get(nodeId).signal(this.jotaiStore.set);
    }
    for (const nodeId of meta.nodeSetRemovals) {
      this.nodeSignalAtoms.get(nodeId).signal(this.jotaiStore.set);
    }

    // emit change event
    this._onNodesChange.dispatch(meta);
  }

  private broadcastLinksChange(meta: SelectionLinksChangeMetadata) {
    // do nothing if no real change happened
    if (
      meta.partialLinkSetAdditions.length === 0 &&
      meta.partialLinkSetRemovals.length === 0 &&
      meta.fullLinkSetAdditions.length === 0 &&
      meta.fullLinkSetRemovals.length === 0
    ) {
      return;
    }

    // trigger link signal atoms
    for (const link of meta.partialLinkSetAdditions) {
      this.linkSignalAtoms.get(getLinkId(link)).signal(this.jotaiStore.set);
    }
    for (const link of meta.partialLinkSetRemovals) {
      this.linkSignalAtoms.get(getLinkId(link)).signal(this.jotaiStore.set);
    }
    for (const link of meta.fullLinkSetAdditions) {
      this.linkSignalAtoms.get(getLinkId(link)).signal(this.jotaiStore.set);
    }
    for (const link of meta.fullLinkSetRemovals) {
      this.linkSignalAtoms.get(getLinkId(link)).signal(this.jotaiStore.set);
    }

    // emit change event
    this._onLinksChange.dispatch(meta);
  }

  ////////////////////////////////////////
  // Convenience methods and properties //
  ////////////////////////////////////////

  /**
   * List of selected node IDs, in the order that they were selected.
   */
  public get selectedNodeIds(): readonly number[] {
    return this._selectedNodeIds;
  }

  /**
   * List of links for which at least one node is selected
   */
  public get partiallySelectedLinks(): readonly Link[] {
    return this._partiallySelectedLinks;
  }

  /**
   * List of links for which both nodes are selected
   */
  public get fullySelectedLinks(): readonly Link[] {
    return this._fullySelectedLinks;
  }

  /**
   * Sets the selection back to empty
   */
  public clearSelection() {
    this.changeSelection([]);
  }

  /**
   * Removes a node from selection if selected and does nothing if not
   */
  public deselectNode(nodeId: number) {
    if (!this.selectedNodeIds.includes(nodeId)) return;
    this.changeSelection(this.selectedNodeIds.filter((id) => id !== nodeId));
  }

  /**
   * Adds a node to the selection or does nothing if already selected
   */
  public addNodeToSelection(nodeId: number) {
    if (this.selectedNodeIds.includes(nodeId)) return;
    this.changeSelection([...this.selectedNodeIds, nodeId]);
  }

  /**
   * Adds multiple nodes to the selection
   */
  public addNodesToSelection(nodeIds: number[]) {
    this.changeSelection([...this.selectedNodeIds, ...nodeIds]);
  }

  ////////////
  // Events //
  ////////////

  private _onNodesChange =
    new SimpleEventDispatcher<SelectionNodeChangeMetadata>();
  private _onLinksChange =
    new SimpleEventDispatcher<SelectionLinksChangeMetadata>();

  /**
   * Fires whenever the set of selected nodes changes.
   */
  public get onNodesChange(): ISimpleEvent<SelectionNodeChangeMetadata> {
    return this._onNodesChange.asEvent();
  }

  /**
   * Fires whenever the set of selected links changes.
   */
  public get onLinksChange(): ISimpleEvent<SelectionLinksChangeMetadata> {
    return this._onLinksChange.asEvent();
  }

  ////////////////////
  // React bindings //
  ////////////////////

  // === atoms that expose the selection as a whole ===

  private selectedNodeIdsSignalAtom = new SignalAtomWrapper();

  /**
   * Read-only atom that exposes the list of selected node IDs
   */
  public selectedNodeIdsAtom = atom<readonly number[]>((get) => {
    this.selectedNodeIdsSignalAtom.subscribe(get);
    return this.selectedNodeIds;
  });

  /**
   * Read-only atom that exposes the list of selected nodes
   */
  public selectedNodesAtom = atom<readonly Node[]>((get) => {
    const nodeIds = get(this.selectedNodeIdsAtom);
    return nodeIds.map((id) => {
      // read the node through its atom to create a dependency and cascade
      // node updates into this atom
      return get(this.notationGraphStore.getNodeAtom(id));
    });
  });

  // === atoms that expose selection per-node and per-link ===

  private nodeSignalAtoms = new SignalAtomCollection<number>();
  private isNodeSelectedAtoms = new Map<number, Atom<boolean>>();

  private linkSignalAtoms = new SignalAtomCollection<string>();
  private isLinkPartiallySelectedAtoms = new Map<string, Atom<boolean>>();
  private isLinkFullySelectedAtoms = new Map<string, Atom<boolean>>();

  /**
   * Returns a boolean read-only atom specifying whether
   * the given node is selected
   */
  public getIsNodeSelectedAtom(nodeId: number): Atom<boolean> {
    if (!this.isNodeSelectedAtoms.has(nodeId)) {
      this.isNodeSelectedAtoms.set(
        nodeId,
        atom((get) => {
          this.nodeSignalAtoms.get(nodeId).subscribe(get);
          return this._selectedNodeIds.includes(nodeId);
        }),
      );
    }
    return this.isNodeSelectedAtoms.get(nodeId)!;
  }

  /**
   * Returns a boolean read-only atom specifying whether the given
   * link is partially selected (at least one node is selected)
   */
  public getIsLinkPartiallySelectedAtom(link: Link): Atom<boolean> {
    const linkId = getLinkId(link);
    if (!this.isLinkPartiallySelectedAtoms.has(linkId)) {
      this.isLinkPartiallySelectedAtoms.set(
        linkId,
        atom((get) => {
          this.linkSignalAtoms.get(linkId).subscribe(get);
          return includesLink(this._partiallySelectedLinks, link);
        }),
      );
    }
    return this.isLinkPartiallySelectedAtoms.get(linkId)!;
  }

  /**
   * Returns a boolean read-only atom specifying whether the given
   * link is fully selected (both nodes are selected)
   */
  public getIsLinkFullySelectedAtom(link: Link): Atom<boolean> {
    const linkId = getLinkId(link);
    if (!this.isLinkFullySelectedAtoms.has(linkId)) {
      this.isLinkFullySelectedAtoms.set(
        linkId,
        atom((get) => {
          this.linkSignalAtoms.get(linkId).subscribe(get);
          return includesLink(this._fullySelectedLinks, link);
        }),
      );
    }
    return this.isLinkFullySelectedAtoms.get(linkId)!;
  }
}

export interface SelectionNodeChangeMetadata {
  /**
   * Selected node IDs before the change
   */
  oldNodeSet: readonly number[];

  /**
   * Selected node IDs after the change
   */
  newNodeSet: readonly number[];

  /**
   * Node IDs that were added to the selection
   */
  nodeSetAdditions: readonly number[];

  /**
   * Node IDs that were removed from the selection
   */
  nodeSetRemovals: readonly number[];
}

export interface SelectionLinksChangeMetadata {
  /**
   * Partially selected links before the change
   */
  oldPartialLinkSet: readonly Link[];

  /**
   * Partially selected links after the change
   */
  newPartialLinkSet: readonly Link[];

  /**
   * Links that have become partially selected
   */
  partialLinkSetAdditions: readonly Link[];

  /**
   * Links that stopped being partially selected
   */
  partialLinkSetRemovals: readonly Link[];

  /**
   * Fully selected links before the change
   */
  oldFullLinkSet: readonly Link[];

  /**
   * Fully selected links after the change
   */
  newFullLinkSet: readonly Link[];

  /**
   * Links that have become fully selected
   */
  fullLinkSetAdditions: readonly Link[];

  /**
   * Links that stopped being fully selected
   */
  fullLinkSetRemovals: readonly Link[];
}
