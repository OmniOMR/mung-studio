import { includesLink } from "./includesLink";
import { Link } from "./Link";

/**
 * Pushes a link into a list of links only if that link is not already present
 */
export function pushLinkUnlessPresent(list: Link[], item: Link) {
  if (!includesLink(list, item)) {
    list.push(item);
  }
}
