import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Typography,
} from "@mui/joy";
import { useAtomValue } from "jotai";
import { EditorTool } from "../state/EditorStateStore";
import {
  ClassVisibilityStore,
  PRECEDENCE_LINK_ANNOTATION_CLASSES,
} from "../state/ClassVisibilityStore";
import { useContext, useEffect, useRef } from "react";
import { EditorContext } from "../EditorContext";

export function PrecedenceLinksToolPanel() {
  const { editorStateStore, selectionStore, classVisibilityStore } =
    useContext(EditorContext);

  const tool = useAtomValue(editorStateStore.currentToolAtom);

  const selectedNodeIds = useAtomValue(selectionStore.selectedNodeIdsAtom);

  useOverrideClassVisibility(tool, classVisibilityStore);

  if (tool !== EditorTool.PrecedenceLinks) {
    return null;
  }

  return (
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography level="title-sm">Precedence Links Tool</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {selectedNodeIds.length === 0 && (
          <Alert color="primary">
            Start by selecting starting nodes for the link.
          </Alert>
        )}
        {selectedNodeIds.length > 0 && (
          <Alert color="primary">
            Hold Ctrl and select target nodes to create links.
          </Alert>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

/**
 * Extracted logic that overrides the current class visibility setting
 * to get them optimized for precedence link annotation
 */
function useOverrideClassVisibility(
  currentTool: EditorTool,
  classVisibilityStore: ClassVisibilityStore,
) {
  const oldVisibleClassesRef = useRef<ReadonlySet<string>>(
    classVisibilityStore.visibleClasses,
  );

  useEffect(() => {
    if (currentTool === EditorTool.PrecedenceLinks) {
      // tool was just equipped, remember the old settings and set the new
      oldVisibleClassesRef.current = classVisibilityStore.visibleClasses;
      classVisibilityStore.showOnlyTheseClasses(
        PRECEDENCE_LINK_ANNOTATION_CLASSES,
      );
    } else {
      // tool was just dropped, restore the old settings
      classVisibilityStore.showOnlyTheseClasses(oldVisibleClassesRef.current);
    }
  }, [currentTool]);
}
