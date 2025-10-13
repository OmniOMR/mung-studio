import { Atom, atom } from "jotai";
import { IController } from "../../controllers/IController";
import { ZoomController } from "../../controllers/ZoomController";
import { RedrawTrigger } from "../../controllers/RedrawTrigger";
import { NodeEditingController } from "./NodeEditingController";
import { NodeTool } from "./NodeTool";
import { JotaiStore } from "../../state/JotaiStore";

/**
 * Controls both the PolygonFill and PolygonErase tools
 */
export class PolygonToolsController implements IController {
  private readonly jotaiStore: JotaiStore;

  private readonly zoomController: ZoomController;
  private readonly redrawTrigger: RedrawTrigger;
  private readonly nodeEditingController: NodeEditingController;

  // position of the mouse pointer over the scene view in screen space
  private pointerOffsetX: number = 0;
  private pointerOffsetY: number = 0;

  constructor(
    jotaiStore: JotaiStore,
    zoomController: ZoomController,
    redrawTrigger: RedrawTrigger,
    nodeEditingController: NodeEditingController,
  ) {
    this.jotaiStore = jotaiStore;
    this.zoomController = zoomController;
    this.redrawTrigger = redrawTrigger;
    this.nodeEditingController = nodeEditingController;

    // redraw when source data changes
    this.zoomController.onTransformChange.subscribe(this.notify.bind(this));
  }

  private notify() {
    if (this.isEnabled) {
      this.redrawTrigger.requestRedrawNextFrame();
    }
  }

  public isEnabledAtom: Atom<boolean> = atom((get) => {
    const currentNodeTool = get(this.nodeEditingController.currentNodeToolAtom);
    if (currentNodeTool === NodeTool.PolygonFill) return true;
    if (currentNodeTool === NodeTool.PolygonErase) return true;
    return false;
  });

  public get isEnabled(): boolean {
    return this.jotaiStore.get(this.isEnabledAtom);
  }

  public onMouseMove(e: MouseEvent): void {
    // store mouse pointer position in scene space
    this.pointerOffsetX = e.offsetX;
    this.pointerOffsetY = e.offsetY;

    // make sure draw is called on the next frame
    this.redrawTrigger.requestRedrawNextFrame();
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // set scene viewport transform
    const t = this.zoomController.currentTransform;
    ctx.resetTransform();
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    // get pointer position in scene
    const pointerSceneX = t.invertX(this.pointerOffsetX);
    const pointerSceneY = t.invertY(this.pointerOffsetY);

    // draw square brush at integer positions
    const sz = 20;
    ctx.fillRect(
      Math.floor(pointerSceneX) - sz / 2,
      Math.floor(pointerSceneY) - sz / 2,
      sz,
      sz,
    );
  }
}
