import { Atom, atom } from "jotai";
import { JotaiStore } from "../model/JotaiStore";
import { NotationGraphStore } from "../model/notation-graph-store/NotationGraphStore";
import { SelectionStore } from "../model/SelectionStore";
import { IController } from "./IController";
import { ZoomController } from "./ZoomController";
import { Node } from "../../mung/Node";

export class NodeNavigationController implements IController {
  public readonly controllerName = "NodeNavigationController";

  private readonly jotaiStore: JotaiStore;

  private readonly notationGraphStore: NotationGraphStore;
  private readonly selectionStore: SelectionStore;
  private readonly zoomController: ZoomController;

  constructor(
    jotaiStore: JotaiStore,
    notationGraphStore: NotationGraphStore,
    selectionStore: SelectionStore,
    zoomController: ZoomController,
  ) {
    this.jotaiStore = jotaiStore;
    this.notationGraphStore = notationGraphStore;
    this.selectionStore = selectionStore;
    this.zoomController = zoomController;
  }

  public isEnabledAtom: Atom<boolean> = atom((get) => true);

  public get isEnabled(): boolean {
    return this.jotaiStore.get(this.isEnabledAtom);
  }

  ///////////////////////////////
  // Atoms that control the UI //
  ///////////////////////////////

  public readonly isSnackbarOpenAtom = atom<boolean>(false);
  public readonly snackbarMessageAtom = atom<string>("");

  //////////////////
  // Key bindings //
  //////////////////

  public readonly keyBindings = {
    "$mod+ArrowLeft": () => {
      this.navigateToFirstNode();
    },
    ArrowLeft: () => {
      this.navigateToPreviousNode();
    },
    ArrowRight: () => {
      this.navigateToNextNode();
    },
    "$mod+ArrowRight": () => {
      this.navigateToLastNode();
    },
  };

  /////////////
  // Actions //
  /////////////

  private displaySnackbar(message: string): void {
    this.jotaiStore.set(this.isSnackbarOpenAtom, true);
    this.jotaiStore.set(this.snackbarMessageAtom, message);
  }

  private assertCanNavigate(forward: boolean): boolean {
    if (this.selectionStore.selectedNodeIds.length !== 1) {
      this.displaySnackbar(
        "Select exactly one node to be able to navigate with arrow keys.",
      );
      return false;
    }

    return true;
  }

  public navigateToFirstNode() {
    if (!this.assertCanNavigate(false)) return;

    const currentNode = this.notationGraphStore.getNode(
      this.selectionStore.selectedNodeIds[0],
    );
    const firstNode = this.notationGraphStore.nodes.find(
      (n) => n.className == currentNode.className,
    );

    if (firstNode === undefined) return;

    this.selectionStore.changeSelection([firstNode.id]);
    this.zoomController.zoomToNode(firstNode);

    if (currentNode.id == firstNode.id) {
      this.displaySnackbar("This is the first node of its type.");
    }
  }

  public navigateToLastNode() {
    if (!this.assertCanNavigate(false)) return;

    const currentNode = this.notationGraphStore.getNode(
      this.selectionStore.selectedNodeIds[0],
    );
    let firstNode: Node | undefined = undefined;
    for (let i = this.notationGraphStore.nodes.length - 1; i >= 0; i--) {
      const n = this.notationGraphStore.nodes[i];
      if (n.className == currentNode.className) {
        firstNode = n;
        break;
      }
    }

    if (firstNode === undefined) return;

    this.selectionStore.changeSelection([firstNode.id]);
    this.zoomController.zoomToNode(firstNode);

    if (currentNode.id == firstNode.id) {
      this.displaySnackbar("This is the last node of its type.");
    }
  }

  public navigateToPreviousNode() {
    if (!this.assertCanNavigate(false)) return;

    const currentNode = this.notationGraphStore.getNode(
      this.selectionStore.selectedNodeIds[0],
    );
    let i = this.notationGraphStore.nodes.findIndex(
      (n) => n.id === currentNode.id,
    );
    i -= 1;
    for (; i >= 0; i--) {
      if (
        this.notationGraphStore.nodes[i].className === currentNode.className
      ) {
        break;
      }
    }

    if (i < 0) {
      this.displaySnackbar("You've reached the first node of its type.");
      return;
    }

    const previousNode = this.notationGraphStore.nodes[i];
    this.selectionStore.changeSelection([previousNode.id]);
    this.zoomController.zoomToNode(previousNode);
  }

  public navigateToNextNode() {
    if (!this.assertCanNavigate(true)) return;

    const currentNode = this.notationGraphStore.getNode(
      this.selectionStore.selectedNodeIds[0],
    );
    let i = this.notationGraphStore.nodes.findIndex(
      (n) => n.id === currentNode.id,
    );
    i += 1;
    for (; i < this.notationGraphStore.nodes.length; i++) {
      if (
        this.notationGraphStore.nodes[i].className === currentNode.className
      ) {
        break;
      }
    }

    if (i >= this.notationGraphStore.nodes.length) {
      this.displaySnackbar("You've reached the last node of its type.");
      return;
    }

    const nextNode = this.notationGraphStore.nodes[i];
    this.selectionStore.changeSelection([nextNode.id]);
    this.zoomController.zoomToNode(nextNode);
  }
}
