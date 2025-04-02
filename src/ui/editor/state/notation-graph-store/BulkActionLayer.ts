import { Link } from "../../../../mung/Link";
import { LinkType } from "../../../../mung/LinkType";
import { Node } from "../../../../mung/Node";
import { LinksIndex } from "./LinksIndex";
import { NodeCollection } from "./NodeCollection";

/**
 * Provides bulk actions to the NodeCollection store
 */
export class BulkActionLayer {
  private nodeCollection: NodeCollection;
  private allLinksIndex: LinksIndex;

  constructor(nodeCollection: NodeCollection, allLinksIndex: LinksIndex) {
    this.nodeCollection = nodeCollection;
    this.allLinksIndex = allLinksIndex;
  }

  /**
   * Removes everyting from the graph
   */
  clear() {
    // remove all links first
    for (let link of this.allLinksIndex.getAllLinks()) {
      this.nodeCollection.removeLink(link.fromId, link.toId, link.type);
    }

    // then remove all nodes
    for (let nodeId of this.nodeCollection.getAllNodeIds()) {
      this.nodeCollection.removeNode(nodeId);
    }
  }

  /**
   * Inserts many nodes that have links among each other but not with
   * already inserted nodes. Also, they must have new and distinct IDs.
   */
  insertManyNodes(nodes: Node[]) {
    // insert nodes without links
    for (let node of nodes) {
      this.nodeCollection.insertNode({
        ...node,
        syntaxInlinks: [],
        syntaxOutlinks: [],
        precedenceInlinks: [],
        precedenceOutlinks: [],
      });
    }

    // insert links via outlinks
    for (let node of nodes) {
      for (let toId of node.syntaxOutlinks) {
        this.nodeCollection.insertLink(node.id, toId, LinkType.Syntax);
      }
      for (let toId of node.precedenceOutlinks) {
        this.nodeCollection.insertLink(node.id, toId, LinkType.Precedence);
      }
    }
  }
}
