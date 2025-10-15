import { Atom, atom, PrimitiveAtom, useAtomValue } from "jotai";
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
import { JSX, useEffect } from "react";

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
    selectionStore.onNodesChange.subscribe(this.notify.bind(this));
    notationGraphStore.onChange.subscribe(this.notify.bind(this));
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
  public editedNodeAtom: Atom<Node | null> = atom((get) => {
    const isEnabled = get(this.isEnabledAtom);
    if (!isEnabled) return null;

    const selectedNodes = get(this.selectionStore.selectedNodesAtom);
    return selectedNodes[0] || null;
  });

  /**
   * When an node is being edited, this atom controls its class name,
   * otherwise it controls the default class name used, when a new node is
   * to be created. This atom is what the UI interacts with.
   *
   * Setting this atom when no node is being edited results in modifying the
   * default class name for newly created nodes. Setting it when a node is
   * being edited changes that node's class name.
   */
  public classNameAtom = atom(
    (get) => {
      const editedNode = get(this.editedNodeAtom);
      if (editedNode === null) {
        return get(this.newNodeClassNameAtom);
      } else {
        return editedNode.className;
      }
    },
    (get, set, newValue: string) => {
      const editedNode = get(this.editedNodeAtom);
      if (editedNode === null) {
        set(this.newNodeClassNameAtom, newValue);
      } else {
        this.notationGraphStore.updateNode({
          ...editedNode,
          className: newValue,
        });
      }
    },
  );

  /**
   * Holds the default class name used for a newly created node
   */
  private newNodeClassNameAtom: PrimitiveAtom<string> = atom("noteheadBlack");

  /**
   * Position and size of the edited node (the mask) in the scene space.
   *
   * Null when new a node is being created and when this tool is disabled.
   */
  private maskExtent: DOMRect | null = null;

  /**
   * The canvas that stores the currently edited mask pixels. Its size must
   * align with the maskExtent's size above.
   *
   * Null when a new node is being created, or the edited node has
   * a full-rectangle mask (e.g. staff,measure) or this tool is disabled.
   */
  private maskCanvas: OffscreenCanvas | null = null;

  /**
   * This method is called whenever the editedNodeAtom value changes.
   * Its purpose is to pull latest data from the state stores into the
   * temporary state variables inside of this controller (duplicate the state
   * into a more editable-friendly form).
   *
   * This metod is analogous, to reading the "value" prop
   * of an <input> element in React.
   */
  private onEditedNodeChange(): void {
    // clear the state
    this.maskExtent = null;
    this.maskCanvas = null;

    // get the edited node, if none, we are done
    const editedNode = this.jotaiStore.get(this.editedNodeAtom);
    if (editedNode === null) return;

    // get the node extent rectangle
    this.maskExtent = new DOMRect(
      editedNode.left,
      editedNode.top,
      editedNode.width,
      editedNode.height,
    );

    // get the node mask pixels
    if (editedNode.decodedMask !== null) {
      this.maskCanvas = new OffscreenCanvas(
        editedNode.width,
        editedNode.height,
      );
      const ctx = getOffscreenCanvasContext(this.maskCanvas);
      ctx.putImageData(editedNode.decodedMask, 0, 0);
    }
  }

  /**
   * Takes the duplicated state of this controller and pushes it into the
   * external state stores, thereby committing any locally made changes
   * to the notation graph (the edited node).
   *
   * This method is analogous to the "onChange" prop callback
   * of an <input> element in React.
   */
  private pushLocalChanges(): void {
    // get the edited node
    const editedNode = this.jotaiStore.get(this.editedNodeAtom);

    // we have not edited an existing node, therefore we are creating a new one
    if (editedNode === null) {
      // we the newly created node has no extent, then it technically does not
      // exist and so we don't do anything (there isn't anything to create).
      if (this.maskExtent === null) return;

      // create the new node
      const node: Node = {
        id: this.notationGraphStore.getFreeId(),
        className: this.jotaiStore.get(this.newNodeClassNameAtom),
        left: this.maskExtent.left,
        top: this.maskExtent.top,
        width: this.maskExtent.width,
        height: this.maskExtent.height,
        decodedMask: this.exportMaskImageDataFromCanvas(),
        syntaxOutlinks: [],
        syntaxInlinks: [],
        precedenceOutlinks: [],
        precedenceInlinks: [],
        polygon: null,
      };
      this.notationGraphStore.insertNode(node);

      // select the new node
      this.selectionStore.changeSelection([node.id]);
    } // we are editing an existing node
    else {
      // the extent of the node has become non-existant,
      // meaning the node was essentially deleted - so let's delete it for real
      if (this.maskExtent === null) {
        this.notationGraphStore.removeNodeWithLinks(editedNode.id);
        return;
      }

      // update the node
      this.notationGraphStore.updateNode({
        ...editedNode,
        left: this.maskExtent.left,
        top: this.maskExtent.top,
        width: this.maskExtent.width,
        height: this.maskExtent.height,
        decodedMask: this.exportMaskImageDataFromCanvas(),
      });
    }
  }

  /**
   * Takes the maskCanvas and reads and returns its image data.
   * If the canvas is null (meaning the mask is a full-rectangle),
   * then null is returned. The dimensions of the mask are checked against
   * the mask extent, which should have the same dimensions.
   */
  private exportMaskImageDataFromCanvas(): ImageData | null {
    if (this.maskExtent === null) {
      throw new Error("This methods depends on maskExtent to not be null.");
    }

    // check that node has integer coordinates
    if (
      this.maskExtent.left !== Math.floor(this.maskExtent.left) ||
      this.maskExtent.top !== Math.floor(this.maskExtent.top)
    ) {
      throw new Error(
        "Mask extent does not have integer coordinates. This is a mung " +
          "requirement and therefore signals some implementation bug.",
      );
    }

    // no mask
    if (this.maskCanvas === null) {
      return null;
    }

    // check that dimensions match
    if (
      this.maskCanvas.width !== this.maskExtent.width ||
      this.maskCanvas.height !== this.maskExtent.height
    ) {
      throw new Error(
        "Mask canvas dimensions do not match the maskExtent dimensions. " +
          "These two values must be kept in sync and this signals some " +
          "implementation bug.",
      );
    }

    const ctx = getOffscreenCanvasContext(this.maskCanvas);
    return ctx.getImageData(
      0,
      0,
      this.maskCanvas.width,
      this.maskCanvas.height,
    );
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

    // write the modified mask to the notation graph
    this.pushLocalChanges();

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

    // clip the maximum mask size and show warning
    if (newExtent.width > MUNG_MAX_MASK_SIZE) {
      newExtent.width = MUNG_MAX_MASK_SIZE;
      alert("Mask is too tall! Clipping it from below to fit the limit.");
    }
    if (newExtent.height > MUNG_MAX_MASK_SIZE) {
      newExtent.height = MUNG_MAX_MASK_SIZE;
      alert("Mask is too wide! Clipping it from the right to fit the limit");
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
    // (when flushed, the node will be deleted)
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
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 4.0 / t.k;
      ctx.strokeRect(
        this.maskExtent.x,
        this.maskExtent.y,
        this.maskExtent.width,
        this.maskExtent.height,
      );
    }
  }

  public renderSVG(): JSX.Element | null {
    const editedNode = useAtomValue(this.editedNodeAtom);

    // bind the callback that observes the edited node value
    useEffect(() => {
      this.onEditedNodeChange();
    }, [editedNode]);

    return null;
  }
}
