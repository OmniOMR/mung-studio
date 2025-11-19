/**
 * Represents a sequence of changes to a notation graph
 */
export interface Delta {
  readonly operations: DeltaOperation[];
}

/**
 * Union type of all operations that can be applied to a notation graph
 */
export type DeltaOperation = DeltaUpdateNodeClass;

export function isUpdateNodeClass(
  op: DeltaOperation,
): op is DeltaUpdateNodeClass {
  return (
    typeof (op as DeltaUpdateNodeClass).updateNodeId === "number" &&
    typeof (op as DeltaUpdateNodeClass).newClassName === "string"
  );
}

export interface DeltaUpdateNodeClass {
  /**
   * ID of the node to be updated
   */
  readonly updateNodeId: number;

  /**
   * New class name that the node should have
   */
  readonly newClassName: string;
}
