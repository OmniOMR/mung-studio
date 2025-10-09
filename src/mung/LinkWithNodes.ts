import { Link } from "./Link";
import { Node } from "./Node";

/**
 * Represents a link that has the values of its terminal nodes attached as well
 */
export interface LinkWithNodes extends Link {
  /**
   * The node where this link originates
   */
  readonly fromNode: Node;

  /**
   * The node where this link terminates
   */
  readonly toNode: Node;
}
