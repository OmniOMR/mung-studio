import { atom } from "jotai";
import { IController } from "./IController";
import { NotationGraphStore } from "../model/notation-graph-store/NotationGraphStore";
import { SelectionStore } from "../model/SelectionStore";
import { JotaiStore } from "../model/JotaiStore";
import { LinkType } from "../../mung/LinkType";
import { ToolbeltController } from "./ToolbeltController";
import { EditorTool } from "../model/EditorTool";
import { PythonRuntime } from "../../../pyodide/PythonRuntime";
import { Node } from "../../mung/Node";

/**
 * Implements the logic and keyboard shortcuts behind actions from
 * the main menu. This controller is always enabled.
 */
export class MainMenuController implements IController {
  public readonly controllerName = "MainMenuController";

  private readonly jotaiStore: JotaiStore;

  private readonly notationGraphStore: NotationGraphStore;
  private readonly selectionStore: SelectionStore;
  private readonly toolbeltController: ToolbeltController;
  private readonly pythonRuntime: PythonRuntime;

  constructor(
    jotaiStore: JotaiStore,
    notationGraphStore: NotationGraphStore,
    selectionStore: SelectionStore,
    toolbeltController: ToolbeltController,
    pythonRuntime: PythonRuntime,
  ) {
    this.jotaiStore = jotaiStore;
    this.notationGraphStore = notationGraphStore;
    this.selectionStore = selectionStore;
    this.toolbeltController = toolbeltController;
    this.pythonRuntime = pythonRuntime;
  }

  public readonly isEnabledAtom = atom(true);
  public readonly isEnabled = true;

  //////////////////
  // Key bindings //
  //////////////////

  public readonly keyBindings = {
    E: () => {
      this.toggleSyntaxLink();
    },
    Q: () => {
      this.togglePrecedenceLink();
    },
    Delete: () => {
      this.removeSelectedNodes();
    },
    "Shift+Delete": () => {
      this.removePartiallySelectedLinks();
    },
    "Shift+S": () => {
      this.generateGraphFromStafflines();
    },
    Escape: () => {
      this.clearSelection();
    },
  };

  //////////////////////////
  // Action preconditions //
  //////////////////////////

  public canRemoveNodesAtom = atom(
    (get) =>
      get(this.selectionStore.selectedNodeIdsAtom).length > 0 &&
      get(this.toolbeltController.currentToolAtom) !== EditorTool.NodeEditing,
  );

  public canRemoveLinksAtom = atom(
    (get) => get(this.selectionStore.selectedNodeIdsAtom).length > 0,
  );

  public canToggleLinkAtom = atom(
    (get) => get(this.selectionStore.selectedNodeIdsAtom).length == 2,
  );

  public canClearSelectionAtom = atom(
    (get) =>
      get(this.selectionStore.selectedNodeIdsAtom).length > 0 &&
      get(this.toolbeltController.currentToolAtom) !== EditorTool.NodeEditing,
  );

  public canGenerateGraphFromStafflinesAtom = atom((get) => {
    const nodes = get(this.selectionStore.selectedNodesAtom);
    if (nodes.length !== 5) {
      return false;
    }
    for (const node of nodes) {
      if (node.className !== "staffLine") {
        return false;
      }
    }
    return true;
  });

  ////////////////////////////
  // Action implementations //
  ////////////////////////////

  public removeSelectedNodes(): void {
    if (!this.jotaiStore.get(this.canRemoveNodesAtom)) return;
    for (const nodeId of this.selectionStore.selectedNodeIds) {
      this.notationGraphStore.removeNodeWithLinks(nodeId);
    }
  }

  public toggleSyntaxLink(): void {
    if (!this.jotaiStore.get(this.canToggleLinkAtom)) return;
    const fromId = this.selectionStore.selectedNodeIds[0];
    const toId = this.selectionStore.selectedNodeIds[1];
    this.notationGraphStore.toggleLink(fromId, toId, LinkType.Syntax);
  }

  public togglePrecedenceLink(): void {
    if (!this.jotaiStore.get(this.canToggleLinkAtom)) return;
    const fromId = this.selectionStore.selectedNodeIds[0];
    const toId = this.selectionStore.selectedNodeIds[1];
    this.notationGraphStore.toggleLink(fromId, toId, LinkType.Precedence);
  }

  public removePartiallySelectedLinks(): void {
    if (!this.jotaiStore.get(this.canRemoveLinksAtom)) return;
    const links = this.selectionStore.partiallySelectedLinks;
    for (const link of links) {
      this.notationGraphStore.removeLink(link.fromId, link.toId, link.type);
    }
  }

  public clearSelection(): void {
    if (!this.jotaiStore.get(this.canClearSelectionAtom)) return;
    this.selectionStore.clearSelection();
  }

  public async generateGraphFromStafflines(): Promise<void> {
    if (!this.jotaiStore.get(this.canGenerateGraphFromStafflinesAtom)) return;

    const api = this.pythonRuntime.maskManipulation;

    // get the stafflines
    const stafflines = this.jotaiStore.get(
      this.selectionStore.selectedNodesAtom,
    );

    // create the staff object
    console.log("Generating the staff...");
    const proposedStaff = await api.generateStaffFromStafflines(stafflines);
    const staff: Node = {
      id: this.notationGraphStore.getFreeId(),
      className: "staff",
      top: proposedStaff.top,
      left: proposedStaff.left,
      width: proposedStaff.width,
      height: proposedStaff.height,
      syntaxInlinks: [],
      syntaxOutlinks: [],
      precedenceInlinks: [],
      precedenceOutlinks: [],
      decodedMask: proposedStaff.decodedMask,
      textTranscription: null,
      data: {},
      polygon: null,
    };
    this.notationGraphStore.insertNode(staff);

    // add syntax links from the new staff to all stafflines
    for (const line of stafflines) {
      this.notationGraphStore.insertLink(staff.id, line.id, LinkType.Syntax);
    }

    // create the staffspace objects and link them from the staff
    console.log("Generating staff spaces...");
    const proposedStaffspaces = await api.generateStaffspaces(
      [...stafflines.map((s) => s.id), staff.id].map((id) =>
        this.notationGraphStore.getNode(id),
      ),
    );
    for (const proposedStaffspace of proposedStaffspaces) {
      const staffSpace: Node = {
        id: this.notationGraphStore.getFreeId(),
        className: "staffSpace",
        top: proposedStaffspace.top,
        left: proposedStaffspace.left,
        width: proposedStaffspace.width,
        height: proposedStaffspace.height,
        syntaxInlinks: [],
        syntaxOutlinks: [],
        precedenceInlinks: [],
        precedenceOutlinks: [],
        decodedMask: proposedStaffspace.decodedMask,
        textTranscription: null,
        data: {},
        polygon: null,
      };
      this.notationGraphStore.insertNode(staffSpace);
      this.notationGraphStore.insertLink(
        staff.id,
        staffSpace.id,
        LinkType.Syntax,
      );
    }

    console.log("DONE!");
  }
}
