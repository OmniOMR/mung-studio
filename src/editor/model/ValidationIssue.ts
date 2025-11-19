import { Delta } from "../../mung/Delta";

/**
 * One validation issue, returned by the validation logic
 */
export interface ValidationIssue {
  /**
   * Integer code for the issue, e.g. 1037
   */
  readonly code: number;

  /**
   * Human-readable english message describing the issue
   */
  readonly message: string;

  /**
   * ID of the MuNG node to which this issue belongs. Link-related issues
   * are also pegged to some node, usually some sensible "root" or "parent".
   */
  readonly nodeId: number;

  /**
   * If provided, the delta attempts to resolve the issue when applied
   */
  readonly resolution: Delta | null;

  /**
   * If one node can have multiple instances of an issue with the same code,
   * a fingerprint string should be provided here that would differentiate
   * between all the instances. E.g. if a link to a leger line is faulty and the
   * notehead can have multiple such leger lines, a fingerprint could be the
   * ID of the leger line node.
   */
  readonly fingerprint: string | null;
}

/**
 * Returns a string ID that's unique for a given issue
 */
export function computeIssueId(issue: ValidationIssue): string {
  return `${issue.code}-${issue.nodeId}-${issue.fingerprint}`;
}
