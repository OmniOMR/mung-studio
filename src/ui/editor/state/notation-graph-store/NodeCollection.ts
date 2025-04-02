import { LinkType } from "../../../../mung/LinkType";
import { Node } from "../../../../mung/Node";
import { ISimpleEvent, SimpleEventDispatcher } from "strongly-typed-events";

/**
 * Node collection is the base layer of the notation graph store.
 * It contains a collection of nodes analgous to the MuNG XML file
 * and serves as the ground-truth data representation. It stores its
 * data in plain javascript (no React intergration) and emit events when
 * it changes. Other higher-level modules can subscribe to these events and
 * provide more convenient data access methods (such as indexes or react
 * integrations). This is like the storage layer of a database system,
 * other components are like cached views and indexes.
 */
export class NodeCollection {
  /**
   * The primary list of nodes.
   * It is kept sorted by ID.
   * Is immutable (which hinders update performance, but provides React
   * compatibility and allows for fast returning of all nodes as a snapshot).
   */
  private nodes: Node[] = [];

  /**
   * Cached immutable list of node IDs, sorted just like the primary list.
   * Immutable again because it can be returned.
   * Must be replaced with each node insertion/removal.
   */
  private nodeIds: number[] = [];

  /**
   * Cached lookup map that returns a node by a node ID.
   * Is mutable. Must be kept in sync with the primary list.
   */
  private nodesById: Map<number, Node> = new Map<number, Node>();

  /////////////////////
  // Reading Methods //
  /////////////////////

  /**
   * Returns all nodes in the graph as a read-only snapshot.
   * This method is very fast and should be used to acquire undo/redo snapshots.
   */
  public getAllNodes(): readonly Node[] {
    return this.nodes;
  }

  /**
   * Returns all node ids in the graph as a read-only snapshot.
   * This method is fast and can be used by React to render node lists.
   */
  public getAllNodeIds(): readonly number[] {
    return this.nodeIds;
  }

  /**
   * Returns a node value by its ID. The node must exist.
   */
  public getNode(nodeId: number): Node {
    const node = this.nodesById.get(nodeId);
    if (!node) {
      throw new Error(`The node ${nodeId} is not present in the graph.`);
    }
    return node;
  }

  /**
   * Returns true if a node with the given ID exists in the graph
   */
  public hasNode(nodeId: number): boolean {
    return this.nodesById.has(nodeId);
  }

  /////////////////////
  // Writing Methods //
  /////////////////////

  /**
   * Inserts a new node into the collection. Its ID must be free and it
   * must have NO links.
   */
  public insertNode(node: Node) {
    // check input data constraints
    if (this.hasNode(node.id)) {
      throw new Error(`Node with ID ${node.id} is already present.`);
    }
    if (node.syntaxInlinks.length !== 0 || node.syntaxOutlinks.length !== 0) {
      throw new Error(`Given node has syntax links attached.`);
    }
    if (
      node.precedenceInlinks.length !== 0 ||
      node.precedenceOutlinks.length !== 0
    ) {
      throw new Error(`Given node has precedence links attached.`);
    }

    // perform the modification
    this.nodes = [...this.nodes, node];
    this.sortNodes();

    // update caches
    this.recomputeNodeIds();
    this.nodesById.set(node.id, node);

    // emit events
    this._onNodeInserted.dispatch(node);
  }

  /**
   * Updates the value of a node. It is looked up by the ID.
   * Links cannot be changed via this method, use the dedicated one instead.
   */
  public updateNode(newValue: Node) {
    if (!this.hasNode(newValue.id)) {
      throw new Error(`Cannot update node ${newValue.id}, it is missing.`);
    }

    const nodeId = newValue.id;
    const oldValue = this.getNode(newValue.id);

    // check input data constraints
    if (
      compareArrays(oldValue.syntaxInlinks, newValue.syntaxInlinks) &&
      compareArrays(oldValue.syntaxOutlinks, newValue.syntaxOutlinks) &&
      compareArrays(oldValue.precedenceInlinks, newValue.precedenceInlinks) &&
      compareArrays(oldValue.precedenceOutlinks, newValue.precedenceOutlinks)
    ) {
      throw new Error("Links cannot be modified this way. Use link methods.");
    }

    // perform the modification
    let nodesWithoutOldValue = this.nodes.filter((n) => n.id !== nodeId);
    nodesWithoutOldValue.push(newValue);
    this.nodes = nodesWithoutOldValue;
    this.sortNodes();

    // update caches
    this.nodesById.set(nodeId, newValue);

    // emit events
    this._onNodeUpdatedOrLinked.dispatch({
      nodeId,
      oldValue,
      newValue,
      isLinkUpdate: false,
    });
  }

  /**
   * Removes a node from the graph.
   * The node must already have NO links.
   *
   * @param nodeId ID of the node to remove.
   */
  public removeNode(nodeId: number) {
    if (!this.hasNode(nodeId)) {
      throw new Error(`Cannot remove node ${nodeId}, it is missing.`);
    }
    const node = this.getNode(nodeId);

    // check input data constraints
    if (
      node.syntaxInlinks.length === 0 &&
      node.syntaxOutlinks.length === 0 &&
      node.precedenceInlinks.length === 0 &&
      node.precedenceOutlinks.length === 0
    ) {
      throw new Error("Node must have NO links to be removed.");
    }

    // perform the modification
    this.nodes = this.nodes.filter((n) => n.id !== nodeId);

    // update caches
    this.recomputeNodeIds();
    this.nodesById.delete(nodeId);

    // emit events
    this._onNodeRemoved.dispatch(node);
  }

  /**
   * Inserts a new link into the graph.
   * This method updates the two affected nodes atomically,
   * preserving invariants.
   *
   * @param fromId ID of the source node.
   * @param toId ID of the target node.
   * @param type Type of the link (syntactic or precedence).
   */
  public insertLink(fromId: number, toId: number, type: LinkType) {
    if (!this.hasNode(fromId)) {
      throw new Error(`Cannot add link from node ${fromId}, it is missing.`);
    }
    const oldFromNode = this.getNode(fromId);

    if (!this.hasNode(toId)) {
      throw new Error(`Cannot add link to node ${toId}, it is missing.`);
    }
    const oldToNode = this.getNode(toId);

    // create modified nodes
    const newFromNode = {
      ...oldFromNode,
      [type + "Outlinks"]: [...oldFromNode[type + "Outlinks"], toId].sort(),
    };
    const newToNode = {
      ...oldToNode,
      [type + "Inlinks"]: [...oldToNode[type + "Inlinks"], fromId].sort(),
    };

    // perform the modification
    let nodesWithoutOldValues = this.nodes.filter(
      (n) => n.id !== fromId && n.id !== toId,
    );
    nodesWithoutOldValues.push(newFromNode);
    nodesWithoutOldValues.push(newToNode);
    this.nodes = nodesWithoutOldValues;
    this.sortNodes();

    // update caches
    this.nodesById.set(fromId, newFromNode);
    this.nodesById.set(toId, newToNode);

    // emit events
    this._onNodeUpdatedOrLinked.dispatch({
      nodeId: fromId,
      oldValue: oldFromNode,
      newValue: newFromNode,
      isLinkUpdate: true,
    });
    this._onNodeUpdatedOrLinked.dispatch({
      nodeId: toId,
      oldValue: oldToNode,
      newValue: newToNode,
      isLinkUpdate: true,
    });
    this._onLinkInserted.dispatch({
      fromNode: newFromNode,
      toNode: newToNode,
      linkType: type,
    });
  }

  /**
   * Removes an existing link from the graph.
   * This method updates the two affected nodes atomically,
   * preserving invariants.
   *
   * @param fromId ID of the source node.
   * @param toId ID of the target node.
   * @param type Type of the link that's being removed (syntactic or
   * precedence).
   */
  public removeLink(fromId: number, toId: number, type: LinkType) {
    if (!this.hasNode(fromId)) {
      throw new Error(`Cannot remove link from node ${fromId}, it is missing.`);
    }
    const oldFromNode = this.getNode(fromId);

    if (!this.hasNode(toId)) {
      throw new Error(`Cannot remove link to node ${toId}, it is missing.`);
    }
    const oldToNode = this.getNode(toId);

    // create modified nodes
    const newFromNode = {
      ...oldFromNode,
      [type + "Outlinks"]: oldFromNode[type + "Outlinks"].filter(
        (id) => id !== toId,
      ),
    };
    const newToNode = {
      ...oldToNode,
      [type + "Inlinks"]: oldToNode[type + "Inlinks"].filter(
        (id) => id !== fromId,
      ),
    };

    // perform the modification
    let nodesWithoutOldValues = this.nodes.filter(
      (n) => n.id !== fromId && n.id !== toId,
    );
    nodesWithoutOldValues.push(newFromNode);
    nodesWithoutOldValues.push(newToNode);
    this.nodes = nodesWithoutOldValues;
    this.sortNodes();

    // update caches
    this.nodesById.set(fromId, newFromNode);
    this.nodesById.set(toId, newToNode);

    // emit events
    this._onNodeUpdatedOrLinked.dispatch({
      nodeId: fromId,
      oldValue: oldFromNode,
      newValue: newFromNode,
      isLinkUpdate: true,
    });
    this._onNodeUpdatedOrLinked.dispatch({
      nodeId: toId,
      oldValue: oldToNode,
      newValue: newToNode,
      isLinkUpdate: true,
    });
    this._onLinkRemoved.dispatch({
      fromNode: newFromNode,
      toNode: newToNode,
      linkType: type,
    });
  }

  ////////////
  // Events //
  ////////////

  // see: https://www.npmjs.com/package/strongly-typed-events

  private _onNodeInserted = new SimpleEventDispatcher<Node>();
  private _onNodeUpdatedOrLinked =
    new SimpleEventDispatcher<NodeUpdateMetadata>();
  private _onNodeRemoved = new SimpleEventDispatcher<Node>();
  private _onLinkInserted = new SimpleEventDispatcher<LinkInsertMetadata>();
  private _onLinkRemoved = new SimpleEventDispatcher<LinkRemoveMetadata>();

  /**
   * Fires after a new node is inserted into the graph
   */
  public get onNodeInserted(): ISimpleEvent<Node> {
    return this._onNodeInserted.asEvent();
  }

  /**
   * Fires after a node is modified, INCLUDING link updates.
   * It fires per-node, so during a link update, this event is fired twice.
   */
  public get onNodeUpdatedOrLinked(): ISimpleEvent<NodeUpdateMetadata> {
    return this._onNodeUpdatedOrLinked.asEvent();
  }

  /**
   * Fires after a node is removed from the graph
   */
  public get onNodeRemoved(): ISimpleEvent<Node> {
    return this._onNodeRemoved.asEvent();
  }

  /**
   * Fires after a link is inserted into the graph
   */
  public get onLinkInserted(): ISimpleEvent<LinkInsertMetadata> {
    return this._onLinkInserted.asEvent();
  }

  /**
   * Fires after a link is removed from the graph
   */
  public get onLinkRemoved(): ISimpleEvent<LinkRemoveMetadata> {
    return this._onLinkRemoved.asEvent();
  }

  ///////////////
  // Utilities //
  ///////////////

  /**
   * Returns a free ID for a node. Use this method to get a valid ID
   * for a node that's about to be inserted.
   */
  public getFreeId(): number {
    for (let nodeId = 0; true; nodeId++) {
      if (!this.hasNode(nodeId)) {
        return nodeId;
      }
    }
  }

  /**
   * Recomputes the nodeIds array from the current nodes list.
   */
  private recomputeNodeIds() {
    this.nodeIds = this.nodes.map((node) => node.id);
  }

  /**
   * Sorts the primary node list by node ID. Should be called inside
   * atomic operations when the list is just replaced and needs to be sorted.
   */
  private sortNodes() {
    this.nodes.sort((a, b) => a.id - b.id);
  }
}

/**
 * Compares inlink/outlink arrays if they are the same
 */
function compareArrays(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Sent with a node update event to present both the old and the new
 * value of a node to the event consumer
 */
export interface NodeUpdateMetadata {
  /**
   * ID of the node that was updated
   */
  readonly nodeId: number;

  /**
   * Value of the node before the update took place
   */
  readonly oldValue: Node;

  /**
   * Value of the node after the update took place
   */
  readonly newValue: Node;

  /**
   * Set to true, when only links were updated, not node's intrinsic fields.
   * Set to false, when only fields have been updated, not links.
   */
  readonly isLinkUpdate: boolean;
}

/**
 * Sent with a link insertion event to consumers
 */
export interface LinkInsertMetadata {
  /**
   * The source node value, after the link insertion is completed
   */
  readonly fromNode: Node;

  /**
   * The target node value, after the link insertion is completed
   */
  readonly toNode: Node;

  /**
   * What type of link was inserted
   */
  readonly linkType: LinkType;
}

/**
 * Sent with a link removal event to consumers
 */
export interface LinkRemoveMetadata {
  /**
   * The source node value, after the link removal is completed
   */
  readonly fromNode: Node;

  /**
   * The target node value, after the link removal is completed
   */
  readonly toNode: Node;

  /**
   * What type of link was removed
   */
  readonly linkType: LinkType;
}
