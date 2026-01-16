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
import { ClassVisibilityStore } from "../model/ClassVisibilityStore";
import { EditorStateStore } from "../model/EditorStateStore";

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
  private readonly editorStateStore: EditorStateStore;
  private readonly pythonRuntime: PythonRuntime;
  private readonly classVisibilityStore: ClassVisibilityStore;

  constructor(
    jotaiStore: JotaiStore,
    notationGraphStore: NotationGraphStore,
    selectionStore: SelectionStore,
    toolbeltController: ToolbeltController,
    editorStateStore: EditorStateStore,
    pythonRuntime: PythonRuntime,
    classVisibilityStore: ClassVisibilityStore,
  ) {
    this.jotaiStore = jotaiStore;
    this.notationGraphStore = notationGraphStore;
    this.selectionStore = selectionStore;
    this.toolbeltController = toolbeltController;
    this.editorStateStore = editorStateStore;
    this.pythonRuntime = pythonRuntime;
    this.classVisibilityStore = classVisibilityStore;
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
    "Shift+N": () => {
      this.snapNodesToStaves();
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

    const canRemoveSyntaxLinks =
      this.jotaiStore.get(this.editorStateStore.displaySyntaxLinksAtom) &&
      this.toolbeltController.currentTool !== EditorTool.PrecedenceLinks;
    const canRemovePrecedenceLinks =
      this.jotaiStore.get(this.editorStateStore.displayPrecedenceLinksAtom) &&
      this.toolbeltController.currentTool !== EditorTool.SyntaxLinks;

    const links = this.selectionStore.partiallySelectedLinks;
    for (const link of links) {
      if (link.type === LinkType.Syntax && !canRemoveSyntaxLinks) continue;
      if (link.type === LinkType.Precedence && !canRemovePrecedenceLinks)
        continue;
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
    // (and remove all syntax from stafflines as to not interfere with python)
    const staffLines = this.jotaiStore
      .get(this.selectionStore.selectedNodesAtom)
      .map((s) => ({
        ...s,
        syntaxInlinks: [],
        syntaxOutlinks: [],
      }));

    // create the staff object
    console.log("Generating the staff...");
    const proposedStaff = await api.generateStaffFromStafflines(staffLines);
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
    for (const line of staffLines) {
      this.notationGraphStore.insertLink(staff.id, line.id, LinkType.Syntax);
    }

    // create the staffspace objects and link them from the staff
    console.log("Generating staff spaces...");
    const proposedStaffspaces = await api.generateStaffspaces(
      [...staffLines.map((s) => s.id), staff.id].map((id) =>
        this.notationGraphStore.getNode(id),
      ),
    );
    const staffSpaces: Node[] = [];
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
      staffSpaces.push(staffSpace);
      this.notationGraphStore.insertNode(staffSpace);
      this.notationGraphStore.insertLink(
        staff.id,
        staffSpace.id,
        LinkType.Syntax,
      );
    }

    // make sure the new objects are visible
    this.classVisibilityStore.setClassVisibility("staff", true);
    this.classVisibilityStore.setClassVisibility("staffSpace", true);

    // select the new nodes
    this.selectionStore.changeSelection([
      staff.id,
      ...staffSpaces.map((n) => n.id),
    ]);

    console.log("DONE!");
  }

  public async snapNodesToStaves(): Promise<void> {
    const api = this.pythonRuntime.maskManipulation;

    // process the entire graph and get the processed copy
    console.log("Running object snapping...");
    const snappedGraph = await api.snapNodesToStaves(
      this.notationGraphStore.nodes,
    );

    console.log(snappedGraph);

    // extract all staves, stafflines, and staff spaces
    const interestingInNodeClasses = ["staff", "staffLine", "staffSpace"];
    const interestingInNodes = snappedGraph.filter((n) =>
      interestingInNodeClasses.includes(n.className),
    );

    // reconstruct created links in our document
    for (const inNode of interestingInNodes) {
      for (const inlink of inNode.syntaxInlinks) {
        const hasLink = this.notationGraphStore.hasLink(
          inlink,
          inNode.id,
          LinkType.Syntax,
        );
        if (!hasLink) {
          this.notationGraphStore.insertLink(
            inlink,
            inNode.id,
            LinkType.Syntax,
          );
        }
      }
    }

    console.log("DONE!");
  }
}
