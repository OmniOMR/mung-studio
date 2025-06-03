import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Typography,
} from "@mui/joy";
import { useAtomValue } from "jotai";
import { EditorTool } from "../state/EditorStateStore";
import { useContext } from "react";
import { EditorContext } from "../EditorContext";

export function SyntaxLinksToolPanel() {
  const { editorStateStore, selectionStore } = useContext(EditorContext);

  const tool = useAtomValue(editorStateStore.currentToolAtom);

  const selectedNodeIds = useAtomValue(selectionStore.selectedNodeIdsAtom);

  if (tool !== EditorTool.SyntaxLinks) {
    return null;
  }

  return (
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography level="title-sm">Syntax Links Tool</Typography>
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
