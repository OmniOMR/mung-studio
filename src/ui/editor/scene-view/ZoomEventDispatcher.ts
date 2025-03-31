/**
 * Function signature for an event listener
 */
export type ZoomEventListener = (transform: d3.ZoomTransform) => void;

/**
 * Lets users subscribe to zooming events, to trigger necessary actions in
 * various react components, while side-stepping react to preserve performance
 */
export class ZoomEventDispatcher {
  private listeners: ZoomEventListener[] = [];

  /**
   * Registers a new listener
   */
  public addListener(listener: ZoomEventListener) {
    this.listeners.push(listener);
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
  public dispatchEvent(transform: d3.ZoomTransform) {
    for (const listener of this.listeners) {
      listener(transform);
    }
  }
}
