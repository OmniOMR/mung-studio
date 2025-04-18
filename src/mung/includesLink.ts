import { getLinkId } from "./getLinkId";
import { Link } from "./Link";

/**
 * Returns true if the given link is present in the given link list
 */
export function includesLink(list: readonly Link[], item: Link) {
  const id = getLinkId(item);
  for (const l of list) {
    if (getLinkId(l) === id) {
      return true;
    }
  }
  return false;
}
