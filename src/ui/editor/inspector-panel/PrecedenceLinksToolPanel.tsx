import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Typography,
} from "@mui/joy";
import { useAtomValue } from "jotai";
import { EditorTool } from "../toolbelt/EditorTool";
import {
  ClassVisibilityStore,
  PRECEDENCE_LINK_ANNOTATION_CLASSES,
} from "../state/ClassVisibilityStore";
import { useContext, useEffect, useRef } from "react";
import { EditorContext } from "../EditorContext";
import { isMacish } from "../../../utils/isMacish";

const modKeyName = isMacish() ? "Command ⌘" : "Ctrl";

export function PrecedenceLinksToolPanel() {
  const { toolbeltController, selectionStore, classVisibilityStore } =
    useContext(EditorContext);

  const tool = useAtomValue(toolbeltController.currentToolAtom);

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
            Hold {modKeyName} and select target nodes to create links.
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
  // TODO: this whole react hook should be replaced by onEnable/onDisable
  // hooks in a controller service for this tool

  const oldVisibleClassesRef = useRef<ReadonlySet<string>>(
    classVisibilityStore.visibleClasses,
  );
  const previousToolRef = useRef<EditorTool>(currentTool);

  useEffect(() => {
    if (currentTool === EditorTool.PrecedenceLinks) {
      // tool was just equipped, remember the old settings and set the new
      oldVisibleClassesRef.current = classVisibilityStore.visibleClasses;
      classVisibilityStore.showOnlyTheseClasses(
        PRECEDENCE_LINK_ANNOTATION_CLASSES,
      );
    } else if (previousToolRef.current === EditorTool.PrecedenceLinks) {
      // tool was just dropped, restore the old settings
      classVisibilityStore.showOnlyTheseClasses(oldVisibleClassesRef.current);
    }

    // remember the old tool
    previousToolRef.current = currentTool;
  }, [currentTool]);
}
