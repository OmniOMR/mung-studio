import { LinkType } from "../../../../mung/LinkType";
import { JotaiStore } from "../JotaiStore";
import { SignalAtomWrapper } from "../SignalAtomWrapper";
import { NodeCollection } from "./NodeCollection";

/**
 * Defines signal jotai atoms that can be subscribed to when the notation graph
 * as a whole changes its structure (node/link is added/removed). It does not
 * care about node modifications.
 */
export class GraphStructureSignalAtoms {
  /**
   * Signal triggered when a node is inserted or removed from the graph
   */
  public readonly whenNodesChange = new SignalAtomWrapper();

  /**
   * Signal triggered when a syntax link is inserted
   * or removed from the graph
   */
  public readonly whenSyntaxLinksChange = new SignalAtomWrapper();

  /**
   * Signal triggered when a precedence link is inserted
   * or removed from the graph
   */
  public readonly whenPrecedenceLinksChange = new SignalAtomWrapper();

  /**
   * Signal triggered when a link is inserted
   * or removed from the graph (any type of link)
   */
  public readonly whenLinksChange = new SignalAtomWrapper();

  private jotaiStore: JotaiStore;

  constructor(nodeCollection: NodeCollection, jotaiStore: JotaiStore) {
    this.jotaiStore = jotaiStore;

    // nodes
    nodeCollection.onNodeInserted.subscribe(() => {
      this.signalNode();
    });
    nodeCollection.onNodeRemoved.subscribe(() => {
      this.signalNode();
    });

    // links
    nodeCollection.onLinkInserted.subscribe((meta) => {
      this.signalLink(meta.linkType);
    });
    nodeCollection.onLinkRemoved.subscribe((meta) => {
      this.signalLink(meta.linkType);
    });
  }

  private signalNode() {
    this.whenNodesChange.signal(this.jotaiStore.set);
  }

  private signalLink(linkType: LinkType) {
    if (linkType === LinkType.Syntax) {
      this.whenSyntaxLinksChange.signal(this.jotaiStore.set);
    }
    if (linkType === LinkType.Precedence) {
      this.whenPrecedenceLinksChange.signal(this.jotaiStore.set);
    }
    this.whenLinksChange.signal(this.jotaiStore.set);
  }
}
