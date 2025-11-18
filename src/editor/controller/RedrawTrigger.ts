/**
 * Service that controllers can notify when they want to trigger draw
 * at the next animation frame
 */
export class RedrawTrigger {
  /**
   * The callback that will trigger the draw procedure
   */
  private drawCallback: (() => void) | null = null;

  /**
   * Stores the requestAnimationFrame request ID, so that draw call
   * requests can be cancelled if needed. When not null, it also means
   * that there is a request already pending.
   */
  private requestNumber: number | null = null;

  /**
   * Call this from a controller (typically an event handler) to trigger
   * redraw of controllers the next frame
   */
  public requestRedrawNextFrame(): void {
    // if there already is a request pending, do nothing
    if (this.requestNumber !== null) {
      return;
    }

    // if the draw callback is not bound, do nothing
    if (this.drawCallback === null) {
      return;
    }

    // schedule the draw callback to be called
    // at the beginning of the next frame
    this.requestNumber = requestAnimationFrame(this.drawCallback);
  }

  /**
   * Binds a draw callback to the trigger
   */
  public bindDrawCallback(drawCallback: () => void): void {
    // wrap the given draw callback in additional logic
    this.drawCallback = () => {
      // reset the request
      this.requestNumber = null;

      // perform the draw
      drawCallback();
    };
  }

  /**
   * Removes the draw callback binding
   */
  public unbindDrawCallback(): void {
    // cancel requested draw call
    if (this.requestNumber !== null) {
      cancelAnimationFrame(this.requestNumber);
      this.requestNumber = null;
    }

    // forget the callback
    this.drawCallback = null;
  }
}
