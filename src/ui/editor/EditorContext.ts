import { createContext, useMemo } from "react";
import { NotationGraphStore } from "./state/notation-graph-store/NotationGraphStore";
import { Node } from "../../mung/Node";
import { MungFileMetadata } from "../../mung/MungFileMetadata";
import { SelectionStore } from "./state/selection-store/SelectionStore";
import { ClassVisibilityStore } from "./state/ClassVisibilityStore";
import { EditorStateStore } from "./state/EditorStateStore";
import { AutosaveStore } from "./state/AutosaveStore";
import { PythonRuntime } from "../../../pyodide/PythonRuntime";

/**
 * All fields present in the editor component's global context
 */
export interface EditorContextState {
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
  readonly classVisibilityStore: ClassVisibilityStore;
  readonly editorStateStore: EditorStateStore;
  readonly autosaveStore: AutosaveStore;
}

/**
 * Creates all services and stores present in the editor context
 */
export function useEditorContextState(
  initialNodes: readonly Node[],
  initialMungFileMetadata: MungFileMetadata,
): EditorContextState {
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

  const editorStateStore = useMemo(() => new EditorStateStore(), []);

  // TODO: historyStore (for undo/redo)

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
    autosaveStore,
  };
}

/**
 * The react context for the editor component
 */
export const EditorContext = createContext<EditorContextState>(null!);
