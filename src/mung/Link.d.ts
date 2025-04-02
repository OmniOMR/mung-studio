import { LinkType } from "./LinkType";

/**
 * Represents a link between two nodes in the notation graph
 */
export interface Link {
  /**
   * ID of the node this link originates at
   */
  readonly fromId: number;

  /**
   * ID of the node this link terminates at
   */
  readonly toId: number;

  /**
   * Type of this link
   */
  readonly type: LinkType;
}
