import { atom } from "jotai";
import { JotaiStore } from "../state/JotaiStore";
import { EditorTool } from "./EditorTool";

/**
 * State and logic behind the toolbelt.
 * Encapsulates behaviour of individual tools.
 */
export class ToolbeltController {
  private readonly jotaiStore: JotaiStore;

  constructor(jotaiStore: JotaiStore) {
    this.jotaiStore = jotaiStore;
  }

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
    this.jotaiStore.set(this.currentToolAtom, tool);
  }
}
