import * as d3 from "d3";

/**
 * Function signature for an event listener
 */
export type ZoomEventListener = (transform: d3.ZoomTransform) => void;

/**
 * Lets users subscribe to zooming events, to trigger necessary actions in
 * various react components, while side-stepping react to preserve performance
 */
export class ZoomEventBus {
  private listeners: ZoomEventListener[] = [];

  private lastTransform: d3.ZoomTransform = new d3.ZoomTransform(1, 0, 0);

  /**
   * Registers a new listener
   */
  public addListener(listener: ZoomEventListener) {
    this.listeners.push(listener);

    // immediately call the listener to set it up to the current transform
    listener(this.lastTransform);
  }

  /**
   * Removes all instances of a listener
   */
  public removeListener(listener: ZoomEventListener) {
    this.listeners = this.listeners.filter((l) => l != listener);
  }

  /**
   * Calls all listeners
   */
  public emitEvent(transform: d3.ZoomTransform) {
    // store the transform
    this.lastTransform = transform;

    // call listeners
    for (const listener of this.listeners) {
      listener(transform);
    }
  }
}
