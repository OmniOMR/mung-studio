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

  ////////////////////
  // Mask rendering //
  ////////////////////

  private getEditedNode(): Node | null {
    if (this.selectionStore.selectedNodeIds.length === 0) return null;
    return this.notationGraphStore.getNode(
      this.selectionStore.selectedNodeIds[0],
    );
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // get the node to be rendered and return if not available
    const node = this.getEditedNode();
    if (node === null) return;

    // set the scene transform
    const t = this.zoomController.currentTransform;
    ctx.resetTransform();
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    // draw the mask
    // TODO: this should not be async, this is a temporary hack!
    (async () => {
      // const hue = classNameToHue(node.className);
      // const lightness = 50;
      // ctx.fillStyle = `hsla(${hue}, 100%, ${lightness}%, 0.2)`;

      if (node.decodedMask !== null) {
        // TODO: use an OffscreenCanvas so that mask can be edited
        // and put it inside of a store
        const img = await createImageBitmap(node.decodedMask, {
          resizeQuality: "pixelated",
        });
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(img, node.left, node.top);
      }
    })();
  }
}
