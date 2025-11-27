import { atom, Atom, useAtomValue } from "jotai";
import { PythonRuntime } from "../../../../pyodide/PythonRuntime";
import { JotaiStore } from "../../model/JotaiStore";
import { IController } from "../IController";
import { NodeEditingController } from "./NodeEditingController";
import { NodeTool } from "../../model/NodeTool";
import { JSX, useEffect, useMemo } from "react";
import { Node } from "../../../mung/Node";
import { NotationGraphStore } from "../../model/notation-graph-store/NotationGraphStore";
import { SelectionStore } from "../../model/SelectionStore";
import { ToolbeltController } from "../ToolbeltController";
import { EditorTool } from "../../model/EditorTool";

/**
 * Controls both the PolygonFill and PolygonErase tools
 */
export class StafflinesToolController implements IController {
  public readonly controllerName = "StafflinesToolController";

  private readonly jotaiStore: JotaiStore;

  private readonly nodeEditingController: NodeEditingController;
  private readonly pythonRuntime: PythonRuntime;
  private readonly notationGraphStore: NotationGraphStore;
  private readonly selectionStore: SelectionStore;
  private readonly toolbeltController: ToolbeltController;

  constructor(
    jotaiStore: JotaiStore,
    nodeEditingController: NodeEditingController,
    pythonRuntime: PythonRuntime,
    notationGraphStore: NotationGraphStore,
    selectionStore: SelectionStore,
    toolbeltController: ToolbeltController,
  ) {
    this.jotaiStore = jotaiStore;
    this.nodeEditingController = nodeEditingController;
    this.pythonRuntime = pythonRuntime;
    this.notationGraphStore = notationGraphStore;
    this.selectionStore = selectionStore;
    this.toolbeltController = toolbeltController;
  }

  public isEnabledAtom: Atom<boolean> = atom((get) => {
    const currentNodeTool = get(this.nodeEditingController.currentNodeToolAtom);
    if (currentNodeTool === NodeTool.StafflinesTool) return true;
    return false;
  });

  public get isEnabled(): boolean {
    return this.jotaiStore.get(this.isEnabledAtom);
  }

  //////////////////////
  // Separating lines //
  //////////////////////

  public canSeparateLinesAtom = atom(
    (get) => get(this.cutLinesAtom).length > 0,
  );

  public cutLinesAtom = atom<DOMPoint[][]>([]);

  public displayCutLinesAtom = atom<boolean>(true);

  public async separateLines() {
    if (!this.jotaiStore.get(this.canSeparateLinesAtom)) {
      return;
    }

    const node = this.jotaiStore.get(this.nodeEditingController.editedNodeAtom);
    const cutLines = this.jotaiStore.get(this.cutLinesAtom);

    if (node === null || node.decodedMask == null) {
      return;
    }

    // separate masks in python
    const subMasks = await this.pythonRuntime.maskManipulation.separateLines(
      node.left,
      node.top,
      node.decodedMask,
      cutLines,
    );

    // create the new nodes (one for each staffline)
    const newNodes: Node[] = [];
    for (const [left, top, width, height, mask] of subMasks) {
      const newStafflineNode: Node = {
        id: this.notationGraphStore.getFreeId(),
        className: node.className,
        left: left,
        top: top,
        width: width,
        height: height,
        syntaxOutlinks: [],
        syntaxInlinks: [],
        precedenceOutlinks: [],
        precedenceInlinks: [],
        decodedMask: mask,
        textTranscription: null,
        data: {},
        polygon: null,
      };
      this.notationGraphStore.insertNode(newStafflineNode);
      newNodes.push(newStafflineNode);
    }

    // exit the node editing tool
    this.toolbeltController.setCurrentTool(EditorTool.Pointer);

    // delete the stafflines node
    this.notationGraphStore.removeNodeWithLinks(node.id);

    // select the new nodes
    this.selectionStore.changeSelection(newNodes.map((n) => n.id));
  }

  private async recalculateCutLines(mask: ImageData | null) {
    if (mask === null) {
      this.jotaiStore.set(this.cutLinesAtom, []);
      return;
    }

    const cutLines =
      await this.pythonRuntime.maskManipulation.computeCutLines(mask);

    this.jotaiStore.set(this.cutLinesAtom, cutLines);
  }

  ///////////////
  // Rendering //
  ///////////////

  private buildPathData(node: Node, cutLines: DOMPoint[][]): string {
    let d = "";

    for (const line of cutLines) {
      for (let i = 0; i < line.length; i++) {
        d += i === 0 ? "M " : "L ";
        d += node.left + line[i].x + "," + (node.top + line[i].y);
        d += " ";
      }
    }

    return d;
  }

  public renderSVG(): JSX.Element | null {
    const node = useAtomValue(this.nodeEditingController.editedNodeAtom);

    const cutLines = useAtomValue(this.cutLinesAtom);
    const displayCutLines = useAtomValue(this.displayCutLinesAtom);

    useEffect(() => {
      if (node?.decodedMask) {
        this.recalculateCutLines(node.decodedMask);
      }
    }, [node?.decodedMask]);

    const pathData = useMemo(
      () => (node ? this.buildPathData(node, cutLines) : null),
      [node, cutLines],
    );

    if (!pathData || !displayCutLines) {
      return null;
    }

    return (
      <>
        <path
          d={pathData}
          stroke="rgba(255, 0, 255, 0.9)"
          fill="none"
          style={{
            strokeWidth: "calc(var(--scene-screen-pixel) * 2)",
            strokeDasharray: "calc(var(--scene-screen-pixel) * 8)",
          }}
        />
      </>
    );
  }
}
