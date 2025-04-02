import { getLinkId } from "../../../../mung/getLinkId";
import { Link } from "../../../../mung/Link";
import { LinkType } from "../../../../mung/LinkType";
import { LinkWithNodes } from "../../../../mung/LinkWithNodes";
import {
  LinkInsertMetadata,
  LinkRemoveMetadata,
  NodeCollection,
} from "./NodeCollection";

/**
 * Keeps track of links in the graph by observing node collection events.
 * Can be narrowed down to a specific type of links.
 */
export class LinksIndex {
  /**
   * What type of link this index focuses on.
   * When null, it collects all links.
   */
  public readonly linkType: LinkType | null;

  /**
   * The underlying node collection with ground truth data
   */
  private readonly nodeCollection: NodeCollection;

  /**
   * The index itself - a list of all the known links.
   * Is immutable because it must be compatible with React.
   * Not sorted in any particular order.
   */
  private links: Link[] = [];

  /**
   * Contains list of existing link IDs used to test link existence,
   * must be kept in sync with the links list
   */
  private linkIds: Set<string> = new Set();

  constructor(linkType: LinkType | null, nodeCollection: NodeCollection) {
    this.linkType = linkType;
    this.nodeCollection = nodeCollection;

    nodeCollection.onLinkInserted.subscribe(this.onLinkInserted.bind(this));
    nodeCollection.onLinkRemoved.subscribe(this.onLinkRemoved.bind(this));
  }

  /**
   * Returns a snapshot of all links in the graph.
   * This method is fast.
   */
  public getAllLinks(): readonly Link[] {
    return this.links;
  }

  /**
   * Returns true if the given link exists in the graph
   */
  public hasLink(link: Link): boolean {
    return this.linkIds.has(getLinkId(link));
  }

  /**
   * Fetches terminal nodes for a given link
   */
  public getLinkWithNodes(link: Link): LinkWithNodes {
    return {
      ...link,
      fromNode: this.nodeCollection.getNode(link.fromId),
      toNode: this.nodeCollection.getNode(link.toId),
    };
  }

  /**
   * Returns true if the given link type is accepted
   */
  private acceptsLink(type: LinkType): boolean {
    if (this.linkType === null) return true;
    return this.linkType === type;
  }

  private onLinkInserted(meta: LinkInsertMetadata) {
    if (!this.acceptsLink(meta.linkType)) return;

    const link: Link = {
      fromId: meta.fromNode.id,
      toId: meta.toNode.id,
      type: meta.linkType,
    };

    // update state
    this.links = [...this.links, link];
    this.linkIds.add(getLinkId(link));
  }

  private onLinkRemoved(meta: LinkRemoveMetadata) {
    if (!this.acceptsLink(meta.linkType)) return;

    // update state
    this.links = this.links.filter(
      (link) =>
        link.fromId !== meta.fromNode.id || link.toId !== meta.toNode.id,
    );
    this.linkIds.delete(
      getLinkId({
        fromId: meta.fromNode.id,
        toId: meta.toNode.id,
        type: meta.linkType,
      }),
    );
  }
}
