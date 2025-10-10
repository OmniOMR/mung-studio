import { atom, Atom } from "jotai";
import { SignalAtomWrapper } from "../state/SignalAtomWrapper";
import { JotaiStore } from "../state/JotaiStore";
import { EditorTool } from "./EditorTool";
import { NodeEditingController } from "./node-editing/NodeEditingController";

/**
 * State and logic behind the toolbelt.
 * Encapsulates behaviour of individual tools.
 */
export class ToolbeltController {
  private readonly jotaiStore: JotaiStore;

  // controllers for individual tools
  public readonly nodeEditingController: NodeEditingController;

  constructor(jotaiStore: JotaiStore) {
    this.jotaiStore = jotaiStore;

    this.nodeEditingController = new NodeEditingController();
  }

  // holds the selected editor tool value
  private _currentTool: EditorTool = EditorTool.Pointer;

  // used to refresh the current tool atom
  private readonly currentToolSignalAtom = new SignalAtomWrapper();

  /**
   * Returns the currently selected editor tool
   */
  public get currentTool(): EditorTool {
    return this._currentTool;
  }

  /**
   * Read-only atom that exposes the currently selected tool
   */
  public currentToolAtom: Atom<EditorTool> = atom<EditorTool>((get) => {
    this.currentToolSignalAtom.subscribe(get);
    return this._currentTool;
  });

  /**
   * Sets the currently used editor tool
   */
  public setCurrentTool(tool: EditorTool) {
    this._currentTool = tool;
    this.currentToolSignalAtom.signal(this.jotaiStore.set);
  }
}
