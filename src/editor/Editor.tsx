import { Node } from "../mung/Node";
import { useEffect } from "react";
import { SceneView } from "./view/scene-view/SceneView";
import { OverviewPanel } from "./view/overview-panel/OverviewPanel";
import { InspectorPanel } from "./view/inspector-panel/InspectorPanel";
import Box from "@mui/joy/Box";
import { useUnload } from "../utils/useUnload";
import { MungFileMetadata } from "../mung/MungFileMetadata";
import { MungFile } from "../mung/MungFile";
import { Toolbelt } from "./view/toolbelt/Toolbelt";
import { EditorContext, useConstructContextServices } from "./EditorContext";
import { SettingsWindow } from "./view/settings-window/SettingsWindow";
import { ValidationPanel } from "./view/validation-panel/ValidationPanel";
import { useAtomValue } from "jotai";
import { NodeNavigationTab } from "./view/NodeNavigationTab";

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
    props.backgroundImageUrl,
  );
  const {
    notationGraphStore,
    autosaveStore,
    backgroundImageStore,
    zoomController,
  } = editorContext;

  // bind autosave store to the props.onSave method
  useEffect(() => {
    autosaveStore.saveCallback = async () => {
      await props.onSave?.(notationGraphStore.getMungFile());
    };
    return () => {
      autosaveStore.saveCallback = null;
    };
  }, [notationGraphStore, autosaveStore, props.onSave]);

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

  // the background image dimensions have been downloaded,
  // zoom to the whole page
  const imageWidth = useAtomValue(backgroundImageStore.widthAtom);
  const imageHeight = useAtomValue(backgroundImageStore.heightAtom);
  useEffect(() => {
    if (imageWidth === 0 || imageHeight === 0) return;
    zoomController.zoomToRectangle(new DOMRect(0, 0, imageWidth, imageHeight));
  }, [imageWidth, imageHeight]);

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
              display: "flex",
              flexDirection: "column",
              justifyItems: "stretch",
              overflow: "hidden",
              flexGrow: 1, // grows to take up remaining horizontal space
              width: "50px", // prevents content from stretching it too much
            }}
          >
            <Box sx={{ position: "relative", flexGrow: 1 }}>
              <SceneView />
              <Toolbelt />
            </Box>
            <NodeNavigationTab />
            <ValidationPanel />
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
