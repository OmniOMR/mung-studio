import {
  Delta,
  DeltaUpdateNodeClass,
  isUpdateNodeClass,
} from "../../mung/Delta";
import { NotationGraphStore } from "./notation-graph-store/NotationGraphStore";

/**
 * Service that lets you apply mung deltas to the notation graph
 */
export class DeltaInterpreter {
  private readonly notationGraphStore: NotationGraphStore;

  constructor(notationGraphStore: NotationGraphStore) {
    this.notationGraphStore = notationGraphStore;
  }

  /**
   * Applies operations listed in a delta to the notation graph
   */
  public applyDelta(delta: Delta): void {
    for (const op of delta.operations) {
      if (isUpdateNodeClass(op)) {
        this.updateNodeClass(op);
      } else {
        console.warn("Ignoring unknown delta operation.", op);
      }
    }
  }

  private updateNodeClass(op: DeltaUpdateNodeClass): void {
    if (!this.notationGraphStore.hasNode(op.updateNodeId)) {
      console.warn("Ignoring delta operation, taget node missing.", op);
      return;
    }

    const node = this.notationGraphStore.getNode(op.updateNodeId);
    this.notationGraphStore.updateNode({
      ...node,
      className: op.newClassName,
    });
  }
}
