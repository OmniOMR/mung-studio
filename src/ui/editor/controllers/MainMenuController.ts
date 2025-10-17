import { atom } from "jotai";
import { IController } from "./IController";
import { NotationGraphStore } from "../state/notation-graph-store/NotationGraphStore";
import { SelectionStore } from "../state/selection-store/SelectionStore";
import { JotaiStore } from "../state/JotaiStore";
import { LinkType } from "../../../mung/LinkType";
import { ToolbeltController } from "../toolbelt/ToolbeltController";

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

  constructor(
    jotaiStore: JotaiStore,
    notationGraphStore: NotationGraphStore,
    selectionStore: SelectionStore,
    toolbeltController: ToolbeltController,
  ) {
    this.jotaiStore = jotaiStore;
    this.notationGraphStore = notationGraphStore;
    this.selectionStore = selectionStore;
    this.toolbeltController = toolbeltController;
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
    "Shift+Delete": () => {
      this.removePartiallySelectedLinks();
    },
  };

  //////////////////////////
  // Action preconditions //
  //////////////////////////

  public canRemoveLinksAtom = atom(
    (get) => get(this.selectionStore.selectedNodeIdsAtom).length > 0,
  );

  public canToggleLinkAtom = atom(
    (get) => get(this.selectionStore.selectedNodeIdsAtom).length == 2,
  );

  public canClearSelectionAtom = atom(
    (get) => get(this.selectionStore.selectedNodeIdsAtom).length > 0,
  );

  ////////////////////////////
  // Action implementations //
  ////////////////////////////

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
}
