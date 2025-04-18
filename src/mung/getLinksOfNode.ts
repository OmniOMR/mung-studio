import { getLinkId } from "./getLinkId";
import { Link } from "./Link";
import { LinkType } from "./LinkType";
import { Node } from "./Node";
import { pushLinkUnlessPresent } from "./pushLinkUnlessPresent";

/**
 * Returns all links that start or terminate in the given node
 * for all link types
 */
export function getLinksOfNode(node: Node): Link[] {
  let links: Link[] = [];

  // syntax links
  for (const toId of node.syntaxOutlinks) {
    pushLinkUnlessPresent(links, {
      fromId: node.id,
      toId: toId,
      type: LinkType.Syntax,
    });
  }
  for (const fromId of node.syntaxInlinks) {
    pushLinkUnlessPresent(links, {
      toId: node.id,
      fromId: fromId,
      type: LinkType.Syntax,
    });
  }

  // precedence links
  for (const toId of node.precedenceOutlinks) {
    pushLinkUnlessPresent(links, {
      fromId: node.id,
      toId: toId,
      type: LinkType.Precedence,
    });
  }
  for (const fromId of node.precedenceInlinks) {
    pushLinkUnlessPresent(links, {
      toId: node.id,
      fromId: fromId,
      type: LinkType.Precedence,
    });
  }

  return links;
}
