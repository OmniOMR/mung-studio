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

/**
 * All fields present in the editor component's global context
 */
export interface EditorContextState {
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
  readonly classVisibilityStore: ClassVisibilityStore;
  readonly editorStateStore: EditorStateStore;
  readonly toolbeltController: ToolbeltController;
  readonly autosaveStore: AutosaveStore;
  readonly pythonRuntime: PythonRuntime;
}

/**
 * Creates all services and stores present in the editor context
 */
export function useEditorContextState(
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

  const toolbeltController = useMemo(
    () => new ToolbeltController(jotaiStore),
    [],
  );

  const autosaveStore = useMemo(
    () => new AutosaveStore(notationGraphStore),
    [],
  );

  const pythonRuntime = useMemo(() => PythonRuntime.resolveInstance(), []);

  return {
    notationGraphStore,
    selectionStore,
    classVisibilityStore,
    editorStateStore,
    toolbeltController,
    autosaveStore,
    pythonRuntime,
  };
}

/**
 * The react context for the editor component
 */
export const EditorContext = createContext<EditorContextState>(null!);
