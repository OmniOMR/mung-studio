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
import { RedrawTrigger } from "./controllers/RedrawTrigger";
import { PolygonToolsController } from "./toolbelt/node-editing/PolygonToolsController";
import { NodeEditingController } from "./toolbelt/node-editing/NodeEditingController";

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

  readonly redrawTrigger: RedrawTrigger;
  readonly toolbeltController: ToolbeltController;
  readonly zoomController: ZoomController;
  readonly highlightController: HighlightController;
  readonly selectionController: SelectionController;
  readonly nodeEditingController: NodeEditingController;
  readonly polygonToolsController: PolygonToolsController;
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

  const redrawTrigger = useMemo(() => new RedrawTrigger(), []);

  const toolbeltController = useMemo(
    () => new ToolbeltController(jotaiStore),
    [],
  );

  const zoomController = useMemo(
    () => new ZoomController(jotaiStore, toolbeltController),
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
        redrawTrigger,
        nodeEditingController,
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

    redrawTrigger,
    toolbeltController,
    zoomController,
    highlightController,
    selectionController,
    nodeEditingController,
    polygonToolsController,
  };
}

/**
 * The react context for the editor component
 */
export const EditorContext = createContext<EditorContextState>(null!);
