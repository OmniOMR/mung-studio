import { atom } from "jotai";
import { JotaiStore } from "../model/JotaiStore";
import { EditorTool } from "../model/EditorTool";
import { IController } from "./IController";

/**
 * State and logic behind the toolbelt.
 * Encapsulates behaviour of individual tools.
 */
export class ToolbeltController implements IController {
  public readonly controllerName = "ToolbeltController";

  private readonly jotaiStore: JotaiStore;

  constructor(jotaiStore: JotaiStore) {
    this.jotaiStore = jotaiStore;
  }

  public readonly isEnabledAtom = atom(true);
  public readonly isEnabled = true;

  ///////////////////////
  // Editor tool state //
  ///////////////////////

  /**
   * Read-only atom that exposes the currently selected tool
   */
  public readonly currentToolAtom = atom<EditorTool>(EditorTool.Pointer);

  /**
   * Returns the currently selected editor tool
   */
  public get currentTool(): EditorTool {
    return this.jotaiStore.get(this.currentToolAtom);
  }

  /**
   * Sets the currently used editor tool
   */
  public setCurrentTool(tool: EditorTool) {
    // do nothing if we're changing to the tool we currently have equipped
    if (this.currentTool === tool) return;

    // change the tool
    this.jotaiStore.set(this.currentToolAtom, tool);
  }

  //////////////////
  // Key bindings //
  //////////////////

  public readonly keyBindings = {
    V: () => {
      this.setCurrentTool(EditorTool.Pointer);
    },
    H: () => {
      this.setCurrentTool(EditorTool.Hand);
    },
    N: () => {
      this.setCurrentTool(EditorTool.NodeEditing);
    },
    L: () => {
      this.setCurrentTool(EditorTool.SyntaxLinks);
    },
    P: () => {
      this.setCurrentTool(EditorTool.PrecedenceLinks);
    },
  };
}
