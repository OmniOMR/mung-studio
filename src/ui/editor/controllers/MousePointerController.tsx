import { atom } from "jotai";
import { IController } from "./IController";
import { ZoomController } from "./ZoomController";
import { ISimpleEvent, SimpleEventDispatcher } from "strongly-typed-events";

/**
 * This controller provides an abstraction called "mouse pointer", which
 * is a 2D point in the scene. It exposes event that should be hooked into
 * whenever rendering depending on the mouse pointer is needed. This controller
 * then makes sure to call the event in all the edge-case situations (e.g.
 * zooming), when the mouse is not really moving, but the pointer is.
 *
 * The mouse pointer is provided both in screen space and scene space coords.
 */
export class MousePointerController implements IController {
  public readonly controllerName = "MousePointerController";

  private readonly zoomController: ZoomController;

  constructor(zoomController: ZoomController) {
    this.zoomController = zoomController;

    this.zoomController.onTransformChange.subscribe(() => {
      if (this.zoomController.grabDraggedDelta) {
        this.onMouseDragged();
      } else {
        this.recomputeSceneSpacePointerAndFireEvent();
      }
    });
  }

  public isEnabledAtom = atom(true);
  public readonly isEnabled = true;

  //////////////////////////
  // Screen space pointer //
  //////////////////////////

  private _rawScreenPointer: DOMPoint = new DOMPoint(0, 0);
  private _correctedScreenPointer: DOMPoint = new DOMPoint(0, 0);

  /**
   * The current position of the mouse pointer in screen coordinates
   * (screen = the scene view element)
   */
  public get screenPointer(): DOMPointReadOnly {
    return this._correctedScreenPointer;
  }

  private _onScreenPointerChange =
    new SimpleEventDispatcher<DOMPointReadOnly>();

  /**
   * Event that gets fired whenever the screen space pointer moves
   */
  public get onScreenPointerChange(): ISimpleEvent<DOMPointReadOnly> {
    return this._onScreenPointerChange.asEvent();
  }

  public onMouseMove(e: MouseEvent): void {
    // NOTE: this event handler does not get called
    // when dragging with mouse wheel, because d3.js kills the event,
    // instead the zoom event is called and it needs to handle that
    // (via the corrected pointer)

    // store mouse pointer position in screen space
    this._rawScreenPointer = new DOMPoint(e.offsetX, e.offsetY);
    this._correctedScreenPointer = this._rawScreenPointer;

    // update the scene space pointer
    this.recomputeSceneSpacePointer();

    // trigger both events
    this._onScreenPointerChange.dispatch(this.screenPointer);
    this.fireSceneSpaceEvent();
  }

  // called only when the mouse is dragging the view
  private onMouseDragged(): void {
    if (this.zoomController.grabDraggedDelta === null) {
      throw new Error("This hook should only be called when dragging.");
    }

    // correct the screen pointer
    this._correctedScreenPointer = new DOMPoint(
      this._rawScreenPointer.x - this.zoomController.grabDraggedDelta.x,
      this._rawScreenPointer.y - this.zoomController.grabDraggedDelta.y,
    );

    // update the scene space pointer
    this.recomputeSceneSpacePointer();

    // trigger both events
    this._onScreenPointerChange.dispatch(this.screenPointer);
    this.fireSceneSpaceEvent();
  }

  /////////////////////////
  // Scene space pointer //
  /////////////////////////

  private _scenePointer: DOMPoint = new DOMPoint(0, 0);

  /**
   * The current position of the mouse pointer in scene coordinates
   * (scene = the pixels of the MuNG document)
   */
  public get scenePointer(): DOMPointReadOnly {
    return this._scenePointer;
  }

  private _onScenePointerChange = new SimpleEventDispatcher<DOMPointReadOnly>();

  /**
   * Event that gets fired whenever the scene space pointer moves
   */
  public get onScenePointerChange(): ISimpleEvent<DOMPointReadOnly> {
    return this._onScenePointerChange.asEvent();
  }

  private recomputeSceneSpacePointerAndFireEvent(): void {
    this.recomputeSceneSpacePointer();
    this.fireSceneSpaceEvent();
  }

  private fireSceneSpaceEvent(): void {
    this._onScenePointerChange.dispatch(this.scenePointer);
  }

  private recomputeSceneSpacePointer(): void {
    const t = this.zoomController.currentTransform;
    this._scenePointer = new DOMPoint(
      t.invertX(this.screenPointer.x),
      t.invertY(this.screenPointer.y),
    );
  }
}
