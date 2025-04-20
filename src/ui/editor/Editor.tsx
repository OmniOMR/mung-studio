import { Node } from "../../mung/Node";
import { useCallback, useEffect, useState } from "react";
import { SceneView } from "./scene-view/SceneView";
import { OverviewPanel } from "./overview-panel/OverviewPanel";
import { InspectorPanel } from "./InspectorPanel";
import { ClassVisibilityStore } from "./state/ClassVisibilityStore";
import { NotationGraphStore } from "./state/notation-graph-store/NotationGraphStore";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { EditorStateStore } from "./state/EditorStateStore";
import { DisplayModeButtons } from "./DisplayModeButtons";
import { useUnload } from "../../utils/useUnload";
import { AutosaveStore } from "./state/AutosaveStore";
import { AutosaveStatus } from "./AutosaveStatus";
import { MungFileMetadata } from "../../mung/MungFileMetadata";
import { MungFile } from "../../mung/MungFile";
import { Toolbelt } from "./Toolbelt";
import { SelectionStore } from "./state/selection-store/SelectionStore";

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
  const [notationGraphStore, _1] = useState<NotationGraphStore>(
    () =>
      new NotationGraphStore(props.initialNodes, props.initialMungFileMetadata),
  );

  const [selectionStore, _2] = useState<SelectionStore>(
    () => new SelectionStore(notationGraphStore),
  );

  const [classVisibilityStore, _3] = useState<ClassVisibilityStore>(
    () => new ClassVisibilityStore(),
  );

  const [editorStateStore, _4] = useState<EditorStateStore>(
    () => new EditorStateStore(),
  );

  // TODO: historyStore (for undo/redo)

  const [autosaveStore, _5] = useState<AutosaveStore>(
    () => new AutosaveStore(notationGraphStore),
  );

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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyItems: "stretch",
        height: "100%",
      }}
    >
      <Sheet
        variant="soft"
        sx={{
          p: 1,
          borderBottom: "1px solid var(--joy-palette-neutral-300)",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            variant="outlined"
            startDecorator={<ArrowBackIcon />}
            onClick={handleCloseFileButtonClick}
          >
            Close File
          </Button>
          <Typography level="body-lg" sx={{ fontWeight: 700 }}>
            MuNG Studio
          </Typography>
          <AutosaveStatus autosaveStore={autosaveStore} />
          <DisplayModeButtons editorStateStore={editorStateStore} />
        </Stack>
      </Sheet>
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
          onClose={props.onClose}
          notationGraphStore={notationGraphStore}
          selectionStore={selectionStore}
          classVisibilityStore={classVisibilityStore}
          editorStateStore={editorStateStore}
        />
        <Box
          sx={{
            flexGrow: 1,
          }}
        >
          <SceneView
            backgroundImageUrl={props.backgroundImageUrl}
            notationGraphStore={notationGraphStore}
            selectionStore={selectionStore}
            classVisibilityStore={classVisibilityStore}
            editorStateStore={editorStateStore}
          />
          <Toolbelt editorStateStore={editorStateStore} />
        </Box>
        <InspectorPanel
          notationGraphStore={notationGraphStore}
          selectionStore={selectionStore}
        />
      </Box>
    </Box>
  );
}
