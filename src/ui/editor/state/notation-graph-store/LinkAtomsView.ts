import { atom, Atom } from "jotai";
import { LinkWithNodes } from "../../../../mung/LinkWithNodes";
import { Link } from "../../../../mung/Link";
import { LinksIndex } from "./LinksIndex";
import { JotaiStore } from "../JotaiStore";
import { NodeCollection, NodeUpdateMetadata } from "./NodeCollection";
import { SignalAtomWrapper } from "../SignalAtomWrapper";
import { LinkType } from "../../../../mung/LinkType";
import { getLinkId } from "../../../../mung/getLinkId";

export type LinkAtom = Atom<LinkWithNodes>;

/**
 * Manages atoms for individual links in the graph
 */
export class LinkAtomsView {
  private allLinksIndex: LinksIndex;
  private jotaiStore: JotaiStore;

  private linkAtoms: Map<string, LinkAtom>;

  private signalAtoms: Map<string, SignalAtomWrapper>;

  constructor(
    nodeCollection: NodeCollection,
    allLinksIndex: LinksIndex,
    jotaiStore: JotaiStore,
  ) {
    this.allLinksIndex = allLinksIndex;
    this.jotaiStore = jotaiStore;

    this.linkAtoms = new Map();
    this.signalAtoms = new Map();

    // this will include link insertion and properly ignore link removal
    nodeCollection.onNodeUpdatedOrLinked.subscribe(
      this.handleNodeUpdatedOrLinked.bind(this),
    );
  }

  private handleNodeUpdatedOrLinked(meta: NodeUpdateMetadata) {
    // syntax outlinks
    for (let outlinkId of meta.newValue.syntaxOutlinks) {
      this.signalLink({
        fromId: meta.nodeId,
        toId: outlinkId,
        type: LinkType.Syntax,
      });
    }

    // syntax inlinks
    for (let inlinkId of meta.newValue.syntaxInlinks) {
      this.signalLink({
        fromId: inlinkId,
        toId: meta.nodeId,
        type: LinkType.Syntax,
      });
    }

    // precedence outlinks
    for (let outlinkId of meta.newValue.precedenceOutlinks) {
      this.signalLink({
        fromId: meta.nodeId,
        toId: outlinkId,
        type: LinkType.Precedence,
      });
    }

    // precedence inlinks
    for (let inlinkId of meta.newValue.precedenceInlinks) {
      this.signalLink({
        fromId: inlinkId,
        toId: meta.nodeId,
        type: LinkType.Precedence,
      });
    }
  }

  private signalLink(link: Link) {
    const linkId = getLinkId(link);
    const signalAtom = this.signalAtoms.get(linkId);
    if (signalAtom) {
      signalAtom.signal(this.jotaiStore.set);
    }
  }

  /**
   * Returns a read-only atom that exposes a given link with both of its nodes
   */
  public getLinkWithNodesAtom(link: Link): LinkAtom {
    const linkId = getLinkId(link);
    if (!this.linkAtoms.has(linkId)) {
      this.createLinkAtom(link);
    }
    return this.linkAtoms.get(linkId)!;
  }

  private createLinkAtom(link: Link) {
    const linkId = getLinkId(link);

    // create the signal atom
    const signalAtom = new SignalAtomWrapper();
    this.signalAtoms.set(linkId, signalAtom);

    // create the link atom
    this.linkAtoms.set(
      linkId,
      atom<LinkWithNodes>((get) => {
        // refresh this atom when signalled
        signalAtom.subscribe(get);

        return this.allLinksIndex.getLinkWithNodes(link);
      }),
    );
  }
}
