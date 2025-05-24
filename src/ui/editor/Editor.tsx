import { Node } from "../../mung/Node";
import { useCallback, useEffect } from "react";
import { SceneView } from "./scene-view/SceneView";
import { OverviewPanel } from "./overview-panel/OverviewPanel";
import { InspectorPanel } from "./inspector-panel/InspectorPanel";
import Box from "@mui/joy/Box";
import { useUnload } from "../../utils/useUnload";
import { MungFileMetadata } from "../../mung/MungFileMetadata";
import { MungFile } from "../../mung/MungFile";
import { Toolbelt } from "./toolbelt/Toolbelt";
import { EditorContext, useEditorContextState } from "./EditorContext";

export interface EditorProps {
  /**
   * When the <Editor> component is created, it uses this value to
   * initialize its internal state. Then this value is ignored.
   */
  readonly initialMungFileMetadata: MungFileMetadata;

  /**
   * When the <Editor> component is created, it uses this value to
   * initialize its internal state. Then this value is ignored.
   */
  readonly initialNodes: readonly Node[];

  /**
   * The scanned music document image URL,
   * if null, then no image is displayed.
   */
  readonly backgroundImageUrl: string | null;

  /**
   * Called when the file modifications should be persisted
   * (is not called if missing)
   */
  readonly onSave?: (mung: MungFile) => void;

  /**
   * Callback triggered, when the user wants to leave the editor.
   */
  readonly onClose: () => void;

  /**
   * Name of the openned file
   */
  readonly fileName: string;
}

/**
 * The root component for editing/vieweing a single mung document.
 * Contains the scene view, overview panel and the inspector panel
 * plus additional minor sub-components.
 *
 * It is self-contained, meaning you can have two instances of this component,
 * that could edit two different mung documents.
 */
export function Editor(props: EditorProps) {
  const editorContext = useEditorContextState(
    props.initialNodes,
    props.initialMungFileMetadata,
  );
  const { notationGraphStore, autosaveStore } = editorContext;

  // bind autosave store to the props.onSave method
  useEffect(() => {
    const _handler = () => props.onSave?.(notationGraphStore.getMungFile());
    autosaveStore.onAutosave.subscribe(_handler);
    return () => {
      autosaveStore.onAutosave.unsubscribe(_handler);
    };
  }, [notationGraphStore, autosaveStore, props.onSave]);

  /**
   * Must be called before the editor is left by the user.
   * Handles file saving.
   */
  const beforeLeavingEditor = useCallback(() => {
    if (props.onSave === undefined) return; // skip if saving not implemented

    // save if dirty
    if (autosaveStore.isDirty) {
      props.onSave(notationGraphStore.getMungFile());
      autosaveStore.setClean();
    }
  }, [notationGraphStore, autosaveStore]);

  /**
   * The user wants to leave the editor by clicking the exit button
   */
  function handleCloseFileButtonClick() {
    beforeLeavingEditor();
    props.onClose();
  }

  // The user is leaving the editor by closing or reloading the browser tab
  useUnload(beforeLeavingEditor);

  return (
    <EditorContext.Provider value={editorContext}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyItems: "stretch",
          height: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyItems: "stretch",
            overflow: "hidden",
            flexGrow: 1,
          }}
        >
          <OverviewPanel
            onClose={handleCloseFileButtonClick}
            fileName={props.fileName}
          />
          <Box
            sx={{
              position: "relative",
              flexGrow: 1,
            }}
          >
            <SceneView backgroundImageUrl={props.backgroundImageUrl} />
            <Toolbelt />
          </Box>
          <InspectorPanel />
        </Box>
        {/* <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyItems: "stretch",
            overflow: "hidden",
            height: "200px",
            background: "var(--joy-palette-neutral-800)"
          }}
        >
          Keyboard shortcuts / python terminal / whatever
        </Box> */}
      </Box>
    </EditorContext.Provider>
  );
}
