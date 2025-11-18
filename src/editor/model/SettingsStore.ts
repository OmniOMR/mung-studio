import { atom } from "jotai";
import { JotaiStore } from "./JotaiStore";

export enum SceneRenderingEngine {
  SVG = "SVG",
  WebGL = "WebGL",
  Canvas2D = "Canvas2D",
}

export class SettingsStore {
  private readonly jotaiStore: JotaiStore;

  constructor(jotaiStore: JotaiStore) {
    this.jotaiStore = jotaiStore;
  }

  public readonly isSettingsWindowOpenAtom = atom<boolean>(false);

  // TODO: settingsAtom -> has persistence and default value (can be un-set)

  ////////////////////////
  // Rendering settings //
  ////////////////////////

  /**
   * Controls the method for scene layer rendering
   */
  public readonly sceneRenderingEngineAtom = atom<SceneRenderingEngine>(
    SceneRenderingEngine.SVG,
  );
}
