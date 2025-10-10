import { createContext, useMemo } from "react";
import { NotationGraphStore } from "./state/notation-graph-store/NotationGraphStore";
import { Node } from "../../mung/Node";
import { MungFileMetadata } from "../../mung/MungFileMetadata";
import { SelectionStore } from "./state/selection-store/SelectionStore";
import { ClassVisibilityStore } from "./state/ClassVisibilityStore";
import { EditorStateStore } from "./state/EditorStateStore";
import { AutosaveStore } from "./state/AutosaveStore";
import { PythonRuntime } from "../../../pyodide/PythonRuntime";
import { getDefaultStore } from "jotai";
import { JotaiStore } from "./state/JotaiStore";
import { ToolbeltController } from "./toolbelt/ToolbeltController";
import { ZoomController } from "./controllers/ZoomController";
import { HighlightController } from "./controllers/HighlightController";
import { SelectionController } from "./controllers/SelectionController";

/**
 * All fields present in the editor component's global context
 */
export interface EditorContextState {
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
  readonly classVisibilityStore: ClassVisibilityStore;
  readonly editorStateStore: EditorStateStore;
  readonly autosaveStore: AutosaveStore;

  readonly pythonRuntime: PythonRuntime;

  readonly zoomController: ZoomController;
  readonly toolbeltController: ToolbeltController;
  readonly highlightController: HighlightController;
  readonly selectionController: SelectionController;
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

  const pythonRuntime = useMemo(() => PythonRuntime.resolveInstance(), []);

  const zoomController = useMemo(() => new ZoomController(jotaiStore), []);

  const toolbeltController = useMemo(
    () => new ToolbeltController(jotaiStore),
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

  return {
    notationGraphStore,
    selectionStore,
    classVisibilityStore,
    editorStateStore,
    autosaveStore,

    pythonRuntime,

    zoomController,
    toolbeltController,
    highlightController,
    selectionController,
  };
}

/**
 * The react context for the editor component
 */
export const EditorContext = createContext<EditorContextState>(null!);
