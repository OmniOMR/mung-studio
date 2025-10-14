import { Atom, atom } from "jotai";
import { JotaiStore } from "../../state/JotaiStore";
import { NodeTool } from "./NodeTool";
import { IController } from "../../controllers/IController";
import { ToolbeltController } from "../ToolbeltController";
import { EditorTool } from "../EditorTool";
import { ZoomController } from "../../controllers/ZoomController";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { SelectionStore } from "../../state/selection-store/SelectionStore";
import { RedrawTrigger } from "../../controllers/RedrawTrigger";
import { Node } from "../../../../mung/Node";
import { intersectRectangles } from "../../../../utils/intersectRectangles";
import { unionRectangles } from "../../../../utils/unionRectangles";
import { snapGrowRectangle } from "../../../../utils/snapGrowRectangle";
import { MUNG_MAX_MASK_SIZE } from "../../../../mung/mungConstants";

/**
 * Encapsulates the canvas.getContext("2d") method, since there are additional
 * options passed and the context is acquired in multiple places.
 */
function getOffscreenCanvasContext(
  canvas: OffscreenCanvas,
): OffscreenCanvasRenderingContext2D {
  return canvas.getContext("2d", { willReadFrequently: true })!;
}

/**
 * Encapsulates logic for the node editing tool
 */
export class NodeEditingController implements IController {
  private readonly jotaiStore: JotaiStore;

  private readonly notationGraphStore: NotationGraphStore;
  private readonly selectionStore: SelectionStore;
  private readonly toolbeltController: ToolbeltController;
  private readonly zoomController: ZoomController;
  private readonly redrawTrigger: RedrawTrigger;

  constructor(
    jotaiStore: JotaiStore,
    notationGraphStore: NotationGraphStore,
    selectionStore: SelectionStore,
    toolbeltController: ToolbeltController,
    zoomController: ZoomController,
    redrawTrigger: RedrawTrigger,
  ) {
    this.jotaiStore = jotaiStore;
    this.notationGraphStore = notationGraphStore;
    this.selectionStore = selectionStore;
    this.toolbeltController = toolbeltController;
    this.zoomController = zoomController;
    this.redrawTrigger = redrawTrigger;

    // redraw when source data changes
    zoomController.onTransformChange.subscribe(this.notify.bind(this));
    // selectionStore.onNodesChange.subscribe(this.notify.bind(this));
    // notationGraphStore.onChange.subscribe(this.notify.bind(this));
  }

  private notify() {
    if (this.isEnabled) {
      this.redrawTrigger.requestRedrawNextFrame();
    }
  }

  public isEnabledAtom: Atom<boolean> = atom((get) => {
    const currentTool = get(this.toolbeltController.currentToolAtom);
    return currentTool === EditorTool.NodeEditing;
  });

  public get isEnabled(): boolean {
    return this.jotaiStore.get(this.isEnabledAtom);
  }

  public onEnabled() {
    this.clearState();
    this.populateState();
  }

  public onDisabled() {
    this.clearState();
  }

  /////////////////////
  // Node tool state //
  /////////////////////

  /**
   * Read-only atom that exposes the currently selected node tool
   */
  public readonly currentNodeToolAtom: Atom<NodeTool> = atom<NodeTool>(
    (get) => {
      const currentEditorTool = get(this.toolbeltController.currentToolAtom);
      if (currentEditorTool !== EditorTool.NodeEditing) {
        return NodeTool.None; // none if we are not node-editing
      }
      return get(this.currentNodeToolBaseAtom);
    },
  );
  private currentNodeToolBaseAtom = atom<NodeTool>(NodeTool.PolygonFill);

  /**
   * Returns the currently selected node tool
   */
  public get currentNodeTool(): NodeTool {
    return this.jotaiStore.get(this.currentNodeToolAtom);
  }

  /**
   * Sets the currently used node tool
   */
  public setCurrentNodeTool(tool: NodeTool) {
    if (tool === NodeTool.None) {
      throw Error(
        "You cannot set the node tool to none. Set the editor " +
          "tool to some other tool than node editing instead.",
      );
    }
    this.jotaiStore.set(this.currentNodeToolBaseAtom, tool);
  }

  /////////////////////
  // The edited node //
  /////////////////////

  /**
   * The MuNG node instance being edited
   * (its properties are not modified, until the temporary changes
   * in the canvas and other state below are flushed to it)
   *
   * Null when new a node is being created and when this tool is disabled.
   */
  public editedNode: Node | null = null;

  /**
   * Position and size of the edited node (the mask) in the scene space.
   *
   * Null when new a node is being created and when this tool is disabled.
   */
  public maskExtent: DOMRect | null = null;

  /**
   * The canvas that stores the currently edited mask pixels. Its size must
   * align with the maskExtent's size above.
   *
   * Null when a new node is being created, or the edited node has
   * a full-rectangle mask (e.g. staff,measure) or this tool is disabled.
   */
  public maskCanvas: OffscreenCanvas | null = null;

  private clearState() {
    this.editedNode = null;
    this.maskExtent = null;
    this.maskCanvas = null;
  }

  private populateState() {
    if (this.selectionStore.selectedNodeIds.length === 0) {
      return;
    }

    this.editedNode = this.notationGraphStore.getNode(
      this.selectionStore.selectedNodeIds[0],
    );

    this.maskExtent = new DOMRect(
      this.editedNode.left,
      this.editedNode.top,
      this.editedNode.width,
      this.editedNode.height,
    );

    if (this.editedNode.decodedMask !== null) {
      this.maskCanvas = new OffscreenCanvas(
        this.editedNode.width,
        this.editedNode.height,
      );
      const ctx = getOffscreenCanvasContext(this.maskCanvas);
      ctx.putImageData(this.editedNode.decodedMask, 0, 0);
    }
  }

  ///////////////////
  // Mask painting //
  ///////////////////

  /**
   * Called by sub-tools, when the tool wants to modify the mask through
   * the offscreen canvas context. The first argument is the region over which
   * the tool is going to be painting. This region will be used to extend mask
   * extent and binarize the mask. The region is in scene space coordinates.
   */
  public paintOverTheMask(
    paintingRegion: DOMRect,
    paintAction: (ctx: OffscreenCanvasRenderingContext2D) => void,
  ): void {
    // "ceil" the rectangle coordinates
    paintingRegion = snapGrowRectangle(paintingRegion);

    // create the mask canvas if missing and grow it if present
    this.growMaskExtentToIncludeRegion(paintingRegion);

    // prepare context and do the painting
    const ctx = this.preparePaintingContext();
    paintAction(ctx);

    // binarize the mask under the painted region
    this.binarizeMaskUnderRegion(paintingRegion);

    // remove whitespace around the actual mask content
    this.shrinkMaskToContent();

    // make sure draw is called on the next frame
    this.redrawTrigger.requestRedrawNextFrame();
  }

  /**
   * Enlarges the mask offscreen canvas to contain the requested scene region
   */
  private growMaskExtentToIncludeRegion(region: DOMRect): void {
    // calculate the new extent of the node mask
    const newExtent =
      this.maskExtent === null
        ? region
        : unionRectangles(this.maskExtent, region);

    // clip the maximum mask size and log warning
    if (newExtent.width > MUNG_MAX_MASK_SIZE) {
      newExtent.width = MUNG_MAX_MASK_SIZE;
      console.warn("Clipping mask width, it has reached the size limit.");
    }
    if (newExtent.height > MUNG_MAX_MASK_SIZE) {
      newExtent.height = MUNG_MAX_MASK_SIZE;
      console.warn("Clipping mask height, it has reached the size limit.");
    }

    // create the new, resized canvas
    const newCanvas = new OffscreenCanvas(newExtent.width, newExtent.height);

    // if there is an old canvas to copy pixels from, do that
    if (this.maskCanvas !== null) {
      const oldCtx = getOffscreenCanvasContext(this.maskCanvas);
      const newCtx = getOffscreenCanvasContext(newCanvas);

      if (this.maskExtent === null) {
        throw new Error("The maskExtent should not be null here.");
      }
      const intersection = intersectRectangles(this.maskExtent, newExtent);

      const maskPixels = oldCtx.getImageData(
        intersection.x - this.maskExtent.x,
        intersection.y - this.maskExtent.y,
        intersection.width,
        intersection.height,
      );
      newCtx.putImageData(
        maskPixels,
        intersection.x - newExtent.x,
        intersection.y - newExtent.y,
      );
    }

    // update state variables
    this.maskExtent = newExtent;
    this.maskCanvas = newCanvas;
  }

  /**
   * Gets the canvas context for the mask and configures it for painting
   */
  private preparePaintingContext(): OffscreenCanvasRenderingContext2D {
    if (this.maskExtent === null) {
      throw new Error("This methods depends on maskExtent to not be null.");
    }
    if (this.maskCanvas === null) {
      throw new Error("This methods depends on maskCanvas to not be null.");
    }

    const ctx = getOffscreenCanvasContext(this.maskCanvas);

    // set the scene transform
    // so that we paint in scene coordinates
    ctx.resetTransform();
    ctx.translate(-this.maskExtent.left, -this.maskExtent.top);

    // set the default composite opration
    ctx.globalCompositeOperation = "source-over";

    return ctx;
  }

  /**
   * Gets a scene-coordinates rectangle region
   * and performs mask binarization within it.
   */
  private binarizeMaskUnderRegion(region: DOMRect): void {
    if (this.maskExtent === null) {
      throw new Error("This methods depends on maskExtent to not be null.");
    }
    if (this.maskCanvas === null) {
      throw new Error("This methods depends on maskCanvas to not be null.");
    }

    const ctx = getOffscreenCanvasContext(this.maskCanvas);

    // the region that actually overlaps with the mask
    const rect = intersectRectangles(this.maskExtent, region);

    // shift the region back to the mask-space
    rect.x -= this.maskExtent.left;
    rect.y -= this.maskExtent.top;

    // read the image data in that region
    const img = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);

    // binarize
    for (let i = 0; i < img.data.length; i++) {
      if (img.data[i] < 128) {
        img.data[i] = 0;
      } else {
        img.data[i] = 255;
      }
    }

    // write the data back
    ctx.putImageData(img, rect.x, rect.y);
  }

  /**
   * Resizes the canvas to just only include mask pixels
   * and no empty padding around it.
   */
  private shrinkMaskToContent(): void {
    if (this.maskExtent === null) {
      throw new Error("This methods depends on maskExtent to not be null.");
    }
    if (this.maskCanvas === null) {
      throw new Error("This methods depends on maskCanvas to not be null.");
    }

    const oldCtx = getOffscreenCanvasContext(this.maskCanvas);
    const inspectedMask = oldCtx.getImageData(
      0,
      0,
      this.maskExtent.width,
      this.maskExtent.height,
    );

    // one pixel is one uint32 value, zero means black transparent
    const inspectedPixels = new Uint32Array(inspectedMask.data.buffer);
    const width = this.maskExtent.width;
    const height = this.maskExtent.height;

    // helper tester methods
    const rowIsEmpty = (row: number) => {
      for (let col = 0; col < width; col++) {
        if (inspectedPixels[row * width + col] !== 0) {
          return false;
        }
      }
      return true;
    };
    const columnIsEmpty = (col: number) => {
      for (let row = 0; row < height; row++) {
        if (inspectedPixels[row * width + col] !== 0) {
          return false;
        }
      }
      return true;
    };

    // sweep left side (points at column that will be in the new mask)
    let left = 0;
    while (columnIsEmpty(left) && left < width) left++;

    // sweep top side (points at row that will be in the new mask)
    let top = 0;
    while (rowIsEmpty(top) && top < height) top++;

    // sweep right side (points at column that will be in the new mask)
    let right = width - 1;
    while (columnIsEmpty(right) && right >= 0) right--;

    // sweep bottom side (points at row that will be in the new mask)
    let bottom = height - 1;
    while (rowIsEmpty(bottom) && bottom >= 0) bottom--;

    // if the mask is now completely empty, get rid of it
    // (when commited, the node will be deleted)
    if (left >= width || top >= height || right < 0 || bottom < 0) {
      this.maskCanvas = null;
      this.maskExtent = null;
      return;
    }

    // create the new canvas and copy pixels over
    const newCanvas = new OffscreenCanvas(right - left + 1, bottom - top + 1);
    const newCtx = getOffscreenCanvasContext(newCanvas);
    const copiedPixels = oldCtx.getImageData(
      left,
      top,
      newCanvas.width,
      newCanvas.height,
    );
    newCtx.putImageData(copiedPixels, 0, 0);

    // update the state
    this.maskExtent.x += left;
    this.maskExtent.y += top;
    this.maskExtent.width = newCanvas.width;
    this.maskExtent.height = newCanvas.height;
    this.maskCanvas = newCanvas;
  }

  ////////////////////
  // Mask rendering //
  ////////////////////

  public draw(ctx: CanvasRenderingContext2D): void {
    // set the scene transform
    const t = this.zoomController.currentTransform;
    ctx.resetTransform();
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    // draw the mask
    if (this.maskExtent !== null && this.maskCanvas !== null) {
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 0.5;
      ctx.drawImage(this.maskCanvas, this.maskExtent.left, this.maskExtent.top);
      ctx.globalAlpha = 1.0;
      ctx.imageSmoothingEnabled = true;
    }

    // draw the mask extent
    if (this.maskExtent !== null) {
      ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.maskExtent.x,
        this.maskExtent.y,
        this.maskExtent.width,
        this.maskExtent.height,
      );
    }
  }
}
