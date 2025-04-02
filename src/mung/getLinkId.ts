import { Link } from "./Link";

/**
 * Constructs ID for a link to be used as key in dictionaries or react
 */
export function getLinkId(link: Link): string {
  return `${link.fromId}_${link.toId}_${link.type}`;
}
