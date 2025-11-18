import { createContext, useMemo } from "react";
import { NotationGraphStore } from "./model/notation-graph-store/NotationGraphStore";
import { Node } from "../mung/Node";
import { MungFileMetadata } from "../mung/MungFileMetadata";
import { SelectionStore } from "./model/SelectionStore";
import { ClassVisibilityStore } from "./model/ClassVisibilityStore";
import { EditorStateStore } from "./model/EditorStateStore";
import { AutosaveStore } from "./model/AutosaveStore";
import { PythonRuntime } from "../../pyodide/PythonRuntime";
import { getDefaultStore } from "jotai";
import { JotaiStore } from "./model/JotaiStore";
import { ToolbeltController } from "./controller/ToolbeltController";
import { ZoomController } from "./controller/ZoomController";
import { HighlightController } from "./controller/HighlightController";
import { SelectionController } from "./controller/SelectionController";
import { RedrawTrigger } from "./controller/RedrawTrigger";
import { PolygonToolsController } from "./controller/tools/PolygonToolsController";
import { NodeEditingController } from "./controller/tools/NodeEditingController";
import { MainMenuController } from "./controller/MainMenuController";
import { MousePointerController } from "./controller/MousePointerController";
import { SettingsStore } from "./model/SettingsStore";

/**
 * All fields present in the editor component's global context
 */
export interface EditorContextState {
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
  readonly classVisibilityStore: ClassVisibilityStore;
  readonly editorStateStore: EditorStateStore;
  readonly autosaveStore: AutosaveStore;
  readonly settingsStore: SettingsStore;

  readonly pythonRuntime: PythonRuntime;

  readonly redrawTrigger: RedrawTrigger;
  readonly toolbeltController: ToolbeltController;
  readonly zoomController: ZoomController;
  readonly mousePointerController: MousePointerController;
  readonly highlightController: HighlightController;
  readonly selectionController: SelectionController;
  readonly nodeEditingController: NodeEditingController;
  readonly polygonToolsController: PolygonToolsController;
  readonly mainMenuController: MainMenuController;
}

/**
 * Creates all services and stores present in the editor context
 */
export function useConstructContextServices(
  initialNodes: readonly Node[],
  initialMungFileMetadata: MungFileMetadata,
): EditorContextState {
  const jotaiStore: JotaiStore = useMemo(() => getDefaultStore(), []);

  const notationGraphStore = useMemo(
    () => new NotationGraphStore(initialNodes, initialMungFileMetadata),
    [],
  );

  const selectionStore = useMemo(
    () => new SelectionStore(notationGraphStore),
    [],
  );

  const classVisibilityStore = useMemo(
    () => new ClassVisibilityStore(notationGraphStore),
    [],
  );

  const editorStateStore = useMemo(() => new EditorStateStore(jotaiStore), []);

  // TODO: historyStore (for undo/redo)

  const autosaveStore = useMemo(
    () => new AutosaveStore(notationGraphStore),
    [],
  );

  const settingsStore = useMemo(() => new SettingsStore(jotaiStore), []);

  const pythonRuntime = useMemo(() => PythonRuntime.resolveInstance(), []);

  const redrawTrigger = useMemo(() => new RedrawTrigger(), []);

  const toolbeltController = useMemo(
    () => new ToolbeltController(jotaiStore),
    [],
  );

  const zoomController = useMemo(
    () => new ZoomController(jotaiStore, toolbeltController),
    [],
  );

  const mousePointerController = useMemo(
    () => new MousePointerController(zoomController),
    [],
  );

  const highlightController = useMemo(
    () =>
      new HighlightController(
        jotaiStore,
        notationGraphStore,
        classVisibilityStore,
        zoomController,
        toolbeltController,
      ),
    [],
  );

  const selectionController = useMemo(
    () =>
      new SelectionController(
        jotaiStore,
        notationGraphStore,
        classVisibilityStore,
        selectionStore,
        editorStateStore,
        highlightController,
        zoomController,
        toolbeltController,
      ),
    [],
  );

  const nodeEditingController = useMemo(
    () =>
      new NodeEditingController(
        jotaiStore,
        notationGraphStore,
        classVisibilityStore,
        selectionStore,
        toolbeltController,
        zoomController,
        redrawTrigger,
      ),
    [],
  );

  const polygonToolsController = useMemo(
    () =>
      new PolygonToolsController(
        jotaiStore,
        zoomController,
        mousePointerController,
        redrawTrigger,
        nodeEditingController,
      ),
    [],
  );

  const mainMenuController = useMemo(
    () =>
      new MainMenuController(
        jotaiStore,
        notationGraphStore,
        selectionStore,
        toolbeltController,
      ),
    [],
  );

  return {
    notationGraphStore,
    selectionStore,
    classVisibilityStore,
    editorStateStore,
    autosaveStore,
    settingsStore,

    pythonRuntime,

    redrawTrigger,
    toolbeltController,
    zoomController,
    mousePointerController,
    highlightController,
    selectionController,
    nodeEditingController,
    polygonToolsController,
    mainMenuController,
  };
}

/**
 * The react context for the editor component
 */
export const EditorContext = createContext<EditorContextState>(null!);
