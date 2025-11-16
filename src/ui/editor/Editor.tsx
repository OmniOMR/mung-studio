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
import { EditorContext, useConstructContextServices } from "./EditorContext";
import { SettingsWindow } from "./settings-window/SettingsWindow";

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
  readonly onSave?: (mung: MungFile) => Promise<void> | void;

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
  const editorContext = useConstructContextServices(
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
    setTimeout(() => {
      console.log("Im living 500ms later!");
    }, 500);
  }, [notationGraphStore, autosaveStore]);

  /**
   * The user wants to leave the editor by clicking the exit button
   */
  async function handleCloseFileButtonClick() {
    let savePromise: Promise<void> | null | undefined | void = null;

    // save if dirty
    if (autosaveStore.isDirty) {
      savePromise = props.onSave?.(notationGraphStore.getMungFile());
    }

    // close the editor UI
    props.onClose();

    // wait for the save to complete and reset the autosave store
    // (in case the onClose event did not destroy the editor)
    await savePromise;
    autosaveStore.setClean();
  }

  // The user is leaving the editor by closing or reloading the browser tab
  useUnload((e: BeforeUnloadEvent) => {
    if (props.onSave === undefined) return; // skip if saving not implemented
    if (!autosaveStore.isDirty) return; // skip if not dirty

    // trigger save right after the dialog is closed
    // (if it gets triggered during the dialog, even better)
    setTimeout(async () => {
      await props.onSave?.(notationGraphStore.getMungFile());
      autosaveStore.setClean();
    }, 50);

    // these two lines should cause the browser to halt the user via dialog
    e.returnValue = "trigger-confirmation-dialog";
    return "trigger-confirmation-dialog";
  });

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
      <SettingsWindow />
    </EditorContext.Provider>
  );
}
